import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const defaultFormatObservation = (value) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value === undefined) {
    return 'undefined';
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const requireDuration = (value, name, { allowZero = false } = {}) => {
  assert.ok(Number.isSafeInteger(value), `${name} must be an integer`);
  assert.ok(allowZero ? value >= 0 : value > 0, `${name} must be ${allowZero ? 'non-negative' : 'positive'}`);
};

export async function waitForCondition({
  description,
  observe,
  accept = Boolean,
  timeoutMs,
  pollIntervalMs = 100,
  now = Date.now,
  sleep = delay,
  formatObservation = defaultFormatObservation
}) {
  assert.equal(typeof description, 'string', 'wait description must be a string');
  assert.notEqual(description, '', 'wait description must not be empty');
  assert.equal(typeof observe, 'function', 'wait observation must be a function');
  assert.equal(typeof accept, 'function', 'wait acceptance check must be a function');
  assert.equal(typeof now, 'function', 'wait clock must be a function');
  assert.equal(typeof sleep, 'function', 'wait sleep must be a function');
  assert.equal(typeof formatObservation, 'function', 'wait observation formatter must be a function');
  requireDuration(timeoutMs, 'timeoutMs');
  requireDuration(pollIntervalMs, 'pollIntervalMs');

  const startedAt = now();
  const deadline = startedAt + timeoutMs;
  let lastObservation = 'not observed';

  while (true) {
    try {
      const observation = await observe({ remainingMs: Math.max(0, deadline - now()) });
      lastObservation = formatObservation(observation);
      if (await accept(observation)) {
        return observation;
      }
    } catch (error) {
      const errorName = error instanceof Error ? error.name : typeof error;
      lastObservation = `observation failed (${errorName})`;
    }

    const remainingMs = deadline - now();
    if (remainingMs <= 0) {
      throw new Error(
        `timed out after ${timeoutMs}ms waiting for ${description}; last observation: ${lastObservation}`
      );
    }
    await sleep(Math.min(pollIntervalMs, remainingMs));
  }
}

const parseLoopbackDriverUrl = (value) => {
  const url = value instanceof URL ? new URL(value.href) : new URL(value);
  assert.equal(url.protocol, 'http:', 'WebDriver URL must use http');
  assert.equal(url.hostname, '127.0.0.1', 'WebDriver URL must use explicit IPv4 loopback');
  assert.notEqual(url.port, '', 'WebDriver URL must contain an assigned port');
  assert.equal(url.username, '', 'WebDriver URL must not contain credentials');
  assert.equal(url.password, '', 'WebDriver URL must not contain credentials');
  return url;
};

const readWebDriverStatus = async ({
  statusUrl,
  fetchImpl,
  requestTimeoutMs,
  AbortControllerImpl,
  setTimer,
  clearTimer
}) => {
  const controller = new AbortControllerImpl();
  const timer = setTimer(() => controller.abort(), requestTimeoutMs);
  timer?.unref?.();
  try {
    const response = await fetchImpl(statusUrl, {
      method: 'GET',
      headers: { accept: 'application/json' },
      redirect: 'error',
      signal: controller.signal
    });
    if (!response.ok) {
      return { ready: false, observation: `HTTP ${response.status}` };
    }
    const body = await response.json();
    if (body?.value?.ready === true) {
      return { ready: true, observation: 'ready=true' };
    }
    if (body?.value?.ready === false) {
      return { ready: false, observation: 'ready=false' };
    }
    return { ready: false, observation: 'malformed status response' };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : typeof error;
    return { ready: false, observation: `request failed (${errorName})` };
  } finally {
    clearTimer(timer);
  }
};

export async function waitForWebDriverReady({
  driverUrl,
  timeoutMs = 20_000,
  pollIntervalMs = 100,
  requestTimeoutMs = 1_000,
  fetchImpl = globalThis.fetch,
  AbortControllerImpl = globalThis.AbortController,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
  now = Date.now,
  sleep = delay
}) {
  const parsedDriverUrl = parseLoopbackDriverUrl(driverUrl);
  const statusUrl = new URL('/status', parsedDriverUrl);
  requireDuration(requestTimeoutMs, 'requestTimeoutMs');
  assert.equal(typeof fetchImpl, 'function', 'fetchImpl must be a function');

  await waitForCondition({
    description: 'WebDriver GET /status to report ready=true',
    observe: ({ remainingMs }) =>
      readWebDriverStatus({
        statusUrl,
        fetchImpl,
        requestTimeoutMs: Math.max(1, Math.min(requestTimeoutMs, remainingMs || requestTimeoutMs)),
        AbortControllerImpl,
        setTimer,
        clearTimer
      }),
    accept: ({ ready }) => ready,
    timeoutMs,
    pollIntervalMs,
    now,
    sleep,
    formatObservation: ({ observation }) => observation
  });

  return { ready: true, statusUrl: statusUrl.href };
}
