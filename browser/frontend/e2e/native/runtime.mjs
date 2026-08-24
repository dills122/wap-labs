import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import {
  EVIDENCE_CLASSIFICATION,
  buildEvidenceManifest,
  initializeScenarioEvidence,
  resolveEvidenceArtifact,
  writePrivateJsonManifest
} from './evidence.mjs';
import { executeNativeE2EScenarios } from './orchestrator.mjs';
import { waitForCondition } from './waits.mjs';
import { createWavesDriver } from './waves-driver.mjs';
import { createAuthenticationTestData } from './test-data.mjs';

function closeStream(stream) {
  if (!stream) return Promise.resolve();
  return new Promise((resolve) => stream.end(resolve));
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
      const state = { layout, assertions, stdout, stderr };
      scenarioState.set(definition.id, state);

      let providerSession;
      let abortCleanup;
      try {
        providerSession = await provider.startSession({
          application,
          environment: { ...environment, ...runtimeEnvironment },
          startupTimeoutMs: timeoutMs,
          onProcessStarted(child) {
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
          await Promise.all([closeStream(stdout), closeStream(stderr)]);
          return cleanup;
        }
      };
    },
    async onResult(result) {
      const state = scenarioState.get(result.scenarioId);
      if (!state) return;
      const artifact = resolveEvidenceArtifact(state.layout, {
        classification: EVIDENCE_CLASSIFICATION.SAFE_UPLOAD,
        fileName: 'result.json',
        sanitized: true
      });
      await writePrivateJsonManifest({
        filePath: artifact.path,
        value: safeResult(result, state.assertions)
      });
      const manifest = buildEvidenceManifest(state.layout, [artifact]);
      const manifestArtifact = resolveEvidenceArtifact(state.layout, {
        classification: EVIDENCE_CLASSIFICATION.SAFE_UPLOAD,
        fileName: 'manifest.json',
        sanitized: true
      });
      await writePrivateJsonManifest({ filePath: manifestArtifact.path, value: manifest });
    }
  });
}
