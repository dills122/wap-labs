import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';

const SAFE_ID = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function runOwnedCommand(command, arguments_, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      stdio: 'ignore',
      signal
    });
    child.once('error', reject);
    child.once('exit', (code, exitSignal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `owned infrastructure command failed with ${exitSignal ? 'a signal' : `code ${code}`}`
        )
      );
    });
  });
}

function delay(milliseconds, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('infrastructure wait aborted'));
      return;
    }
    const finish = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error('infrastructure wait aborted'));
    };
    const timer = setTimeout(finish, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

function requireAdminBase(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'http:', 'Kannel admin base must use http');
  assert.ok(
    url.hostname === '127.0.0.1' || url.hostname === '::1',
    'Kannel admin base must use loopback'
  );
  assert.notEqual(url.port, '', 'Kannel admin base must contain an assigned port');
  assert.ok(url.pathname === '/' && url.search === '' && url.hash === '', 'Kannel admin base must not contain a path, query, or fragment');
  assert.equal(url.username, '', 'Kannel admin base must not contain credentials');
  assert.equal(url.password, '', 'Kannel admin base must not contain credentials');
  return url;
}

export function createGatewayInfrastructureController({
  rootDir,
  runId,
  composeProject,
  adminBase,
  adminPassword,
  timeoutMs = 30_000,
  pollIntervalMs = 250,
  now = Date.now,
  sleep = delay,
  runCommand = runOwnedCommand,
  fetchImpl = globalThis.fetch
}) {
  assert.equal(typeof rootDir, 'string', 'owned infrastructure requires a repository root');
  assert.ok(path.isAbsolute(rootDir), 'owned infrastructure requires an absolute repository root');
  assert.equal(path.resolve(rootDir), rootDir, 'owned infrastructure repository root must be normalized');
  assert.match(runId, SAFE_ID, 'run identity must be a bounded lowercase ASCII identifier');
  assert.match(composeProject, SAFE_ID, 'Compose project must be a bounded lowercase ASCII identifier');
  assert.equal(composeProject, runId, 'Compose project must match run identity');
  assert.ok(
    typeof adminPassword === 'string' && adminPassword.length >= 4 && adminPassword.length <= 256,
    'Kannel admin password must be bounded'
  );
  assert.ok(Number.isSafeInteger(timeoutMs) && timeoutMs > 0, 'infrastructure timeout must be positive');
  assert.ok(Number.isSafeInteger(pollIntervalMs) && pollIntervalMs > 0, 'infrastructure poll interval must be positive');
  assert.equal(typeof runCommand, 'function', 'infrastructure command runner is required');
  assert.equal(typeof fetchImpl, 'function', 'infrastructure fetch implementation is required');
  const admin = requireAdminBase(adminBase);
  admin.pathname = '/status';
  admin.searchParams.set('password', adminPassword);
  const composePrefix = Object.freeze([
    'compose',
    '--project-name', composeProject,
    '--file', path.join(rootDir, 'docker-compose.yml'),
    '--file', path.join(rootDir, 'docker-compose.native-e2e.yml')
  ]);
  let active = false;

  const runCompose = (arguments_, { signal } = {}) =>
    runCommand('docker', [...composePrefix, ...arguments_], { signal });

  const readRunning = async (signal) => {
    const requestTimeout = AbortSignal.timeout(Math.min(timeoutMs, 2_000));
    const requestSignal = signal
      ? AbortSignal.any([signal, requestTimeout])
      : requestTimeout;
    try {
      const response = await fetchImpl(admin, {
        redirect: 'error',
        signal: requestSignal
      });
      const status = await response.text();
      return response.ok &&
        /Status:\s*running\b/i.test(status) &&
        /\bwapbox\b[^\n]*\bon-line\b/i.test(status);
    } catch (error) {
      if (signal?.aborted) throw signal.reason ?? error;
      return false;
    }
  };

  const waitForRunning = async (expected, signal) => {
    const startedAt = now();
    while (true) {
      if ((await readRunning(signal)) === expected) return;
      if (now() - startedAt >= timeoutMs) {
        throw new Error(
          expected
            ? 'owned Kannel service did not recover before the deadline'
            : 'owned Kannel service did not stop before the deadline'
        );
      }
      await sleep(pollIntervalMs, { signal });
    }
  };

  return Object.freeze({
    async withGatewayStopped(callback, { signal } = {}) {
      assert.equal(typeof callback, 'function', 'gateway outage requires a callback');
      if (active) throw new Error('owned gateway outage is already active');
      active = true;
      let operationError;
      let result;
      try {
        await runCompose(['stop', '--timeout', '10', 'kannel'], { signal });
        await waitForRunning(false, signal);
        result = await callback();
      } catch (error) {
        operationError = error;
      }

      let recoveryError;
      try {
        await runCompose(['start', 'kannel']);
        await waitForRunning(true);
      } catch (error) {
        recoveryError = error;
      } finally {
        active = false;
      }

      if (operationError && recoveryError) {
        throw new AggregateError(
          [operationError, recoveryError],
          'gateway outage failed and owned Kannel recovery also failed'
        );
      }
      if (recoveryError) throw recoveryError;
      if (operationError) throw operationError;
      return result;
    }
  });
}
