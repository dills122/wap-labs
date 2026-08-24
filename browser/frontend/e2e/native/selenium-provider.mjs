import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

import { waitForWebDriverReady } from './waits.mjs';

const listenOnLoopback = (server, host) =>
  new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen({ host, port: 0, exclusive: true });
  });

const closeServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

export async function reserveLoopbackPorts({
  count = 2,
  host = '127.0.0.1',
  createServer = () => net.createServer()
} = {}) {
  assert.equal(host, '127.0.0.1', 'port leases must use explicit IPv4 loopback');
  assert.ok(Number.isSafeInteger(count) && count > 0, 'port lease count must be positive');
  assert.equal(typeof createServer, 'function', 'createServer must be a function');

  const servers = [];
  try {
    for (let index = 0; index < count; index += 1) {
      const server = createServer();
      await listenOnLoopback(server, host);
      servers.push(server);
    }
  } catch (error) {
    await Promise.allSettled(servers.map(closeServer));
    throw error;
  }

  let ports;
  try {
    ports = servers.map((server) => {
      const address = server.address();
      assert.ok(address && typeof address === 'object', 'port lease server omitted its address');
      assert.equal(address.address, host, 'port lease server bound an unexpected address');
      assert.ok(
        address.port > 0 && address.port <= 65_535,
        'port lease server omitted its assigned port'
      );
      return address.port;
    });
  } catch (error) {
    await Promise.allSettled(servers.map(closeServer));
    throw error;
  }
  let releasePromise;

  return {
    host,
    ports,
    release() {
      releasePromise ??= Promise.all(servers.map(closeServer)).then(() => undefined);
      return releasePromise;
    }
  };
}

const processTarget = (child, platform) => (platform === 'win32' ? child.pid : -child.pid);

const defaultSignalProcess = (child, signal, platform) => {
  process.kill(processTarget(child, platform), signal);
};

const defaultIsProcessAlive = (child, platform) => {
  if (platform === 'win32' && (child.exitCode !== null || child.signalCode !== null)) {
    return false;
  }
  try {
    process.kill(processTarget(child, platform), 0);
    return true;
  } catch {
    return false;
  }
};

const waitUntilProcessStops = async ({
  child,
  timeoutMs,
  pollIntervalMs,
  isProcessAlive,
  platform,
  now,
  sleep
}) => {
  const deadline = now() + timeoutMs;
  while (isProcessAlive(child, platform) && now() < deadline) {
    await sleep(Math.min(pollIntervalMs, deadline - now()));
  }
  return !isProcessAlive(child, platform);
};

export async function terminateSpawnedProcess(
  child,
  {
    platform = process.platform,
    signalProcess = defaultSignalProcess,
    isProcessAlive = defaultIsProcessAlive,
    now = Date.now,
    sleep = delay,
    terminateTimeoutMs = 5_000,
    killTimeoutMs = 2_000,
    pollIntervalMs = 100
  } = {}
) {
  if (!child?.pid) {
    return 'not-started';
  }
  if (!isProcessAlive(child, platform)) {
    return 'already-exited';
  }

  try {
    signalProcess(child, 'SIGTERM', platform);
  } catch {
    return isProcessAlive(child, platform) ? 'cleanup-failed' : 'already-exited';
  }
  if (
    await waitUntilProcessStops({
      child,
      timeoutMs: terminateTimeoutMs,
      pollIntervalMs,
      isProcessAlive,
      platform,
      now,
      sleep
    })
  ) {
    return 'terminated';
  }

  try {
    signalProcess(child, 'SIGKILL', platform);
  } catch {
    return isProcessAlive(child, platform) ? 'cleanup-failed' : 'killed';
  }
  if (
    await waitUntilProcessStops({
      child,
      timeoutMs: killTimeoutMs,
      pollIntervalMs,
      isProcessAlive,
      platform,
      now,
      sleep
    })
  ) {
    return 'killed';
  }
  return 'cleanup-failed';
}

const buildSeleniumDriver = async ({ application, driverUrl }) => {
  const { Builder, Capabilities } = await import('selenium-webdriver');
  const capabilities = new Capabilities();
  capabilities.set('tauri:options', { application });
  capabilities.setBrowserName('wry');
  return new Builder().withCapabilities(capabilities).usingServer(driverUrl).build();
};

const abortError = (signal) => {
  const error = new Error('native E2E provider startup aborted', { cause: signal?.reason });
  error.name = 'AbortError';
  return error;
};

const throwIfAborted = (signal) => {
  if (signal?.aborted) throw abortError(signal);
};

const settleWithin = async (operation, timeoutMs, description, { signal } = {}) => {
  throwIfAborted(signal);
  let timer;
  let onAbort;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${description} timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  const aborted = signal
    ? new Promise((_, reject) => {
        onAbort = () => reject(abortError(signal));
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) onAbort();
      })
    : new Promise(() => undefined);
  try {
    return await Promise.race([Promise.resolve(operation), timeout, aborted]);
  } finally {
    clearTimeout(timer);
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
};

const processExitError = (child) => {
  const outcome =
    child.exitCode === null ? `signal ${child.signalCode ?? 'unknown'}` : `code ${child.exitCode}`;
  return new Error(`tauri-driver exited before WebDriver readiness (${outcome})`);
};

const waitForReadyOrExit = async (child, readiness, signal) => {
  const readinessPromise = Promise.resolve(readiness);
  if (child.exitCode !== null || child.signalCode !== null) {
    readinessPromise.catch(() => undefined);
    throw processExitError(child);
  }

  let onError;
  let onExit;
  let onAbort;
  const earlyExit = new Promise((_, reject) => {
    onError = (error) => {
      const name = error instanceof Error ? error.name : typeof error;
      reject(new Error(`tauri-driver failed before WebDriver readiness (${name})`));
    };
    onExit = (code, signal) => {
      const outcome = code === null ? `signal ${signal ?? 'unknown'}` : `code ${code}`;
      reject(new Error(`tauri-driver exited before WebDriver readiness (${outcome})`));
    };
    child.once('error', onError);
    child.once('exit', onExit);
  });
  const aborted = signal
    ? new Promise((_, reject) => {
        onAbort = () => reject(abortError(signal));
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) onAbort();
      })
    : new Promise(() => undefined);

  try {
    await Promise.race([readinessPromise, earlyExit, aborted]);
  } finally {
    child.off('error', onError);
    child.off('exit', onExit);
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
};

const validateLease = (lease) => {
  assert.equal(lease?.host, '127.0.0.1', 'port lease must use explicit IPv4 loopback');
  assert.equal(lease?.ports?.length, 2, 'provider requires intermediary and native driver ports');
  for (const port of lease.ports) {
    assert.ok(
      Number.isSafeInteger(port) && port > 0 && port <= 65_535,
      'port lease contains an invalid port'
    );
  }
  assert.notEqual(lease.ports[0], lease.ports[1], 'provider ports must be distinct');
  assert.equal(typeof lease.release, 'function', 'port lease must expose release()');
};

export function createSeleniumProvider({
  reservePorts = reserveLoopbackPorts,
  spawnProcess = spawn,
  waitUntilReady = waitForWebDriverReady,
  buildDriver = buildSeleniumDriver,
  terminateProcess = terminateSpawnedProcess,
  platform = process.platform
} = {}) {
  const sessions = new WeakMap();

  const stopSession = async (session) => {
    const state = sessions.get(session);
    assert.ok(state, 'session was not created by this Selenium provider');
    state.stopPromise ??= (async () => {
      const webdriverSession = await settleWithin(
        state.driver.quit(),
        state.sessionCloseTimeoutMs,
        'WebDriver session close'
      ).then(
        () => 'closed',
        () => 'close-failed'
      );
      const processGroup = await terminateProcess(state.child);
      return { webdriverSession, processGroup };
    })();
    return state.stopPromise;
  };

  const startSession = async ({
    application,
    environment = process.env,
    tauriDriverBin = 'tauri-driver',
    startupTimeoutMs = 20_000,
    sessionBuildTimeoutMs = startupTimeoutMs,
    sessionCloseTimeoutMs = 5_000,
    pollIntervalMs = 100,
    maxStartupAttempts = 3,
    stdio = ['ignore', 'pipe', 'pipe'],
    onProcessStarted,
    signal
  }) => {
    assert.equal(typeof application, 'string', 'application must be a string');
    assert.notEqual(application, '', 'application must not be empty');
    assert.ok(
      Number.isSafeInteger(startupTimeoutMs) && startupTimeoutMs > 0,
      'startupTimeoutMs must be positive'
    );
    assert.ok(
      Number.isSafeInteger(sessionBuildTimeoutMs) && sessionBuildTimeoutMs > 0,
      'sessionBuildTimeoutMs must be positive'
    );
    assert.ok(
      Number.isSafeInteger(sessionCloseTimeoutMs) && sessionCloseTimeoutMs > 0,
      'sessionCloseTimeoutMs must be positive'
    );
    assert.ok(
      Number.isSafeInteger(pollIntervalMs) && pollIntervalMs > 0,
      'pollIntervalMs must be positive'
    );
    assert.ok(
      Number.isSafeInteger(maxStartupAttempts) && maxStartupAttempts > 0,
      'maxStartupAttempts must be positive'
    );
    throwIfAborted(signal);

    let lastStartupError;
    for (let attempt = 1; attempt <= maxStartupAttempts; attempt += 1) {
      throwIfAborted(signal);
      const lease = await reservePorts({ count: 2, host: '127.0.0.1' });
      try {
        validateLease(lease);
      } catch (error) {
        await lease?.release?.();
        throw error;
      }
      const [intermediary, native] = lease.ports;
      const driverUrl = `http://127.0.0.1:${intermediary}/`;
      await lease.release();
      throwIfAborted(signal);

      let child;
      try {
        child = spawnProcess(
          tauriDriverBin,
          [
            '--port',
            String(intermediary),
            '--native-port',
            String(native),
            '--native-host',
            '127.0.0.1'
          ],
          {
            detached: platform !== 'win32',
            env: environment,
            stdio
          }
        );
        if (onProcessStarted) {
          await onProcessStarted(child, { attempt, driverUrl, ports: { intermediary, native } });
        } else {
          child.stdout?.resume?.();
          child.stderr?.resume?.();
        }
        throwIfAborted(signal);
        if (child.exitCode !== null || child.signalCode !== null) {
          throw processExitError(child);
        }
        await waitForReadyOrExit(
          child,
          waitUntilReady({
            driverUrl,
            timeoutMs: startupTimeoutMs,
            pollIntervalMs,
            signal
          }),
          signal
        );
        throwIfAborted(signal);
      } catch (error) {
        lastStartupError = error;
        const cleanup = await terminateProcess(child);
        if (cleanup === 'cleanup-failed') {
          throw new Error(`tauri-driver cleanup failed after startup attempt ${attempt}`, {
            cause: error
          });
        }
        if (signal?.aborted || error?.name === 'AbortError') {
          throw abortError(signal);
        }
        if (attempt < maxStartupAttempts) {
          continue;
        }
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(
          `tauri-driver failed to become ready after ${maxStartupAttempts} attempt${maxStartupAttempts === 1 ? '' : 's'}: ${detail}`,
          { cause: error }
        );
      }

      let driver;
      try {
        driver = await settleWithin(
          buildDriver({ application, driverUrl }),
          sessionBuildTimeoutMs,
          'WebDriver session construction',
          { signal }
        );
        throwIfAborted(signal);
      } catch (error) {
        if (driver) {
          await settleWithin(
            driver.quit(),
            sessionCloseTimeoutMs,
            'WebDriver session close after startup failure'
          ).catch(() => undefined);
        }
        const cleanup = await terminateProcess(child);
        if (cleanup === 'cleanup-failed') {
          throw new Error(
            'failed to construct the WebDriver session; process cleanup also failed',
            {
              cause: error
            }
          );
        }
        if (signal?.aborted || error?.name === 'AbortError') {
          throw abortError(signal);
        }
        if (attempt < maxStartupAttempts) {
          continue;
        }
        throw new Error('failed to construct the WebDriver session', { cause: error });
      }

      const session = {
        driver,
        driverUrl,
        ports: { intermediary, native },
        stop() {
          return stopSession(session);
        }
      };
      sessions.set(session, { child, driver, sessionCloseTimeoutMs, stopPromise: null });
      return session;
    }

    throw lastStartupError;
  };

  return { startSession, stopSession };
}
