import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import {
  cleanupRestrictedEvidence,
  initializeScenarioEvidence,
} from './evidence.mjs';
import { constructSafeEvidenceBundle } from './evidence-publisher.mjs';
import { executeNativeE2EScenarios } from './orchestrator.mjs';
import { waitForCondition } from './waits.mjs';
import { createWavesDriver } from './waves-driver.mjs';
import { createAuthenticationTestData } from './test-data.mjs';

function closeStream(stream) {
  if (!stream) return Promise.resolve();
  return new Promise((resolve) => stream.end(resolve));
}

function waitForReadableCompletion(source, destination, timeoutMs = 1_000) {
  if (!source || source.readableEnded || source.destroyed) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      source.unpipe(destination);
      source.off('end', done);
      source.off('close', done);
      source.off('error', done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    source.once('end', done);
    source.once('close', done);
    source.once('error', done);
  });
}

async function createPrivateRuntime(layout) {
  const root = path.join(layout.restrictedDir, 'runtime');
  const locations = {
    XDG_DATA_HOME: path.join(root, 'xdg-data'),
    XDG_CONFIG_HOME: path.join(root, 'xdg-config'),
    XDG_CACHE_HOME: path.join(root, 'xdg-cache'),
    XDG_STATE_HOME: path.join(root, 'xdg-state'),
    XDG_RUNTIME_DIR: path.join(root, 'xdg-runtime')
  };
  for (const directory of Object.values(locations)) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
  }
  return locations;
}

function safeResult(result, assertions) {
  return {
    schemaVersion: 1,
    scenarioId: result.scenarioId,
    suite: result.suite,
    result: result.result,
    durationMs: result.durationMs,
    lastObservation: result.lastObservation,
    cleanup: result.cleanup,
    assertions
  };
}

export async function runNativeE2E({
  scenarios,
  application,
  artifactRoot,
  runId,
  origin,
  provider,
  selector,
  keys,
  environment = process.env,
  timeoutMs = 20_000,
  createWaves = createWavesDriver,
  testDataFactory = createAuthenticationTestData,
  infrastructureSecrets = ['changeme'],
  signal
}) {
  const scenarioState = new Map();
  return executeNativeE2EScenarios({
    scenarios,
    signal,
    async createSession(definition) {
      const layout = await initializeScenarioEvidence({
        artifactRoot,
        runId,
        scenarioId: definition.id
      });
      const runtimeEnvironment = await createPrivateRuntime(layout);
      const assertions = [];
      const testData = definition.secretBearing ? testDataFactory(definition.id) : undefined;
      const stdout = createWriteStream(path.join(layout.restrictedDir, 'tauri-driver.stdout.log'), {
        flags: 'wx', mode: 0o600
      });
      const stderr = createWriteStream(path.join(layout.restrictedDir, 'tauri-driver.stderr.log'), {
        flags: 'wx', mode: 0o600
      });
      const secrets = [...infrastructureSecrets, ...(testData ? [testData.pin] : [])];
      const state = { layout, assertions, stdout, stderr, secrets, secretBearing: definition.secretBearing };
      scenarioState.set(definition.id, state);

      let providerSession;
      let abortCleanup;
      let stdoutSource;
      let stderrSource;
      try {
        providerSession = await provider.startSession({
          application,
          environment: { ...environment, ...runtimeEnvironment },
          startupTimeoutMs: timeoutMs,
          onProcessStarted(child) {
            stdoutSource = child.stdout;
            stderrSource = child.stderr;
            child.stdout?.pipe(stdout);
            child.stderr?.pipe(stderr);
          }
        });
        abortCleanup = () => {
          void providerSession.stop();
        };
        signal?.addEventListener('abort', abortCleanup, { once: true });
      } catch (error) {
        await Promise.all([closeStream(stdout), closeStream(stderr)]);
        throw error;
      }

      const waves = createWaves({
        driver: providerSession.driver,
        selector,
        keys,
        waitUntil: (condition, { description }) =>
          waitForCondition({
            description,
            observe: condition,
            timeoutMs,
            pollIntervalMs: 100
          })
      });
      return {
        waves,
        origin,
        testData,
        recordAssertion(name, details) {
          assertions.push({ name, result: 'pass', details });
        },
        async cleanup() {
          if (abortCleanup) signal?.removeEventListener('abort', abortCleanup);
          const cleanup = await providerSession.stop();
          await Promise.all([
            waitForReadableCompletion(stdoutSource, stdout),
            waitForReadableCompletion(stderrSource, stderr)
          ]);
          await Promise.all([closeStream(stdout), closeStream(stderr)]);
          return cleanup;
        }
      };
    },
    async onResult(result) {
      const state = scenarioState.get(result.scenarioId);
      if (!state) return;
      const publication = await constructSafeEvidenceBundle({
        layout: state.layout,
        secrets: state.secrets,
        payloads: [{ fileName: 'result.json', value: safeResult(result, state.assertions) }]
      });
      state.publication = publication;
      if (publication.ok && state.secretBearing) {
        await cleanupRestrictedEvidence(state.layout);
      }
    }
  }).then((results) => results.map((result) => {
    if (scenarioState.get(result.scenarioId)?.publication?.ok !== false) return result;
    return Object.freeze({ ...result, result: 'fail', error: {
      name: 'EvidenceSanitizerError', message: 'safe evidence construction failed'
    } });
  }));
}
