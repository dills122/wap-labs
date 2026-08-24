import path from 'node:path';
import process from 'node:process';

import { By, Key } from 'selenium-webdriver';

import {
  formatNativeE2EScenarioList,
  parseNativeE2EArguments,
  selectNativeE2EScenarios
} from '../e2e/native/config.mjs';
import {
  createOriginObserver,
  measureOriginTiming
} from '../e2e/native/origin-observer.mjs';
import { runNativeE2E } from '../e2e/native/runtime.mjs';
import { createSeleniumProvider } from '../e2e/native/selenium-provider.mjs';

function positiveInteger(value, name, fallback) {
  const parsed = Number.parseInt(value ?? String(fallback), 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

let cliOptions;
let scenarios;
try {
  cliOptions = parseNativeE2EArguments(process.argv.slice(2));
  if (cliOptions.mode === 'run') {
    scenarios = selectNativeE2EScenarios(cliOptions);
  }
} catch (error) {
  process.stderr.write(`native-tauri-kannel-e2e: CONFIG ERROR: ${error.message}\n`);
  process.exitCode = 2;
}

if (cliOptions?.mode === 'list') {
  process.stdout.write(formatNativeE2EScenarioList());
} else if (scenarios) {
  try {
    const timeoutMs = positiveInteger(
      process.env.NATIVE_E2E_TIMEOUT_MS,
      'NATIVE_E2E_TIMEOUT_MS',
      20_000
    );
    const metricsUrl = requiredEnvironment('WML_METRICS_URL');
    const timing = await measureOriginTiming({ metricsUrl });
    const origin = createOriginObserver({
      metricsUrl,
      publicBase: requiredEnvironment('WML_PUBLIC_BASE'),
      quiescenceMs: timing.quiescenceMs,
      timeoutMs
    });
    const abortController = new AbortController();
    const interrupt = () => abortController.abort();
    process.once('SIGINT', interrupt);
    process.once('SIGTERM', interrupt);

    let results;
    try {
      results = await runNativeE2E({
        scenarios,
        application: path.resolve(requiredEnvironment('NATIVE_E2E_APP_BINARY')),
        artifactRoot: path.resolve(requiredEnvironment('NATIVE_E2E_ARTIFACT_DIR')),
        runId: requiredEnvironment('NATIVE_E2E_RUN_ID'),
        origin,
        provider: createSeleniumProvider(),
        selector: By.css,
        keys: { Enter: Key.ENTER },
        timeoutMs,
        signal: abortController.signal
      });
    } finally {
      process.off('SIGINT', interrupt);
      process.off('SIGTERM', interrupt);
    }

    const failed = results.filter(({ result }) => result !== 'pass');
    if (abortController.signal.aborted || failed.length > 0 || results.length !== scenarios.length) {
      process.stderr.write('native-tauri-kannel-e2e: FAIL (see safe structured evidence)\n');
      process.exitCode = 1;
    } else {
      process.stdout.write(
        `native-tauri-kannel-e2e: PASS (${results.length} independent scenarios)\n`
      );
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : typeof error;
    process.stderr.write(`native-tauri-kannel-e2e: HARNESS ERROR (${name})\n`);
    process.exitCode = 1;
  }
}
