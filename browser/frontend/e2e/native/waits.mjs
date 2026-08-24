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
  assert.ok(
    allowZero ? value >= 0 : value > 0,
    `${name} must be ${allowZero ? 'non-negative' : 'positive'}`
  );
};

const timeoutError = (timeoutMs, description, lastObservation) =>
  new Error(
    `timed out after ${timeoutMs}ms waiting for ${description}; last observation: ${lastObservation}`
  );

const abortError = (signal) => {
  const error = new Error('native E2E wait aborted', { cause: signal?.reason });
  error.name = 'AbortError';
  return error;
};

const throwIfAborted = (signal) => {
  if (signal?.aborted) throw abortError(signal);
};

const runBeforeDeadline = async ({
  operation,
  remainingMs,
  timeoutMs,
  description,
  lastObservation,
  signal,
  AbortControllerImpl,
  setTimer,
  clearTimer
}) => {
  throwIfAborted(signal);
  const controller = new AbortControllerImpl();
  let timer;
  let onAbort;
  const deadline = new Promise((_, reject) => {
    timer = setTimer(() => {
      const deadlineError = timeoutError(timeoutMs, description, lastObservation());
      controller.abort(deadlineError);
      reject(deadlineError);
    }, remainingMs);
  });
  const aborted = signal
    ? new Promise((_, reject) => {
        onAbort = () => {
          const error = abortError(signal);
          controller.abort(error);
          reject(error);
        };
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) onAbort();
      })
    : new Promise(() => undefined);

  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      deadline,
      aborted
    ]);
  } finally {
    clearTimer(timer);
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
};

export async function waitForCondition({
  description,
  observe,
  accept = Boolean,
  timeoutMs,
  pollIntervalMs = 100,
  now = Date.now,
  sleep = delay,
  formatObservation = defaultFormatObservation,
  signal,
  AbortControllerImpl = globalThis.AbortController,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout
}) {
  assert.equal(typeof description, 'string', 'wait description must be a string');
  assert.notEqual(description, '', 'wait description must not be empty');
  assert.equal(typeof observe, 'function', 'wait observation must be a function');
  assert.equal(typeof accept, 'function', 'wait acceptance check must be a function');
  assert.equal(typeof now, 'function', 'wait clock must be a function');
  assert.equal(typeof sleep, 'function', 'wait sleep must be a function');
  assert.equal(
    typeof formatObservation,
    'function',
    'wait observation formatter must be a function'
  );
  assert.equal(typeof AbortControllerImpl, 'function', 'AbortController must be available');
  assert.equal(typeof setTimer, 'function', 'wait timer must be a function');
  assert.equal(typeof clearTimer, 'function', 'wait timer cleanup must be a function');
  requireDuration(timeoutMs, 'timeoutMs');
  requireDuration(pollIntervalMs, 'pollIntervalMs');
  throwIfAborted(signal);

  const startedAt = now();
  const deadline = startedAt + timeoutMs;
  let lastObservation = 'not observed';
  let hasObserved = false;

  while (true) {
    if (hasObserved && now() >= deadline) {
      throw timeoutError(timeoutMs, description, lastObservation);
    }
    hasObserved = true;
    let observation;
    let observationSucceeded = false;
    const remainingForObservation = deadline - now();
    if (remainingForObservation <= 0) {
      throw timeoutError(timeoutMs, description, lastObservation);
    }
    const outcome = await runBeforeDeadline({
      remainingMs: remainingForObservation,
      timeoutMs,
      description,
      lastObservation: () => lastObservation,
      signal,
      AbortControllerImpl,
      setTimer,
      clearTimer,
      async operation(observationSignal) {
        try {
          observation = await observe({
            remainingMs: Math.max(0, deadline - now()),
            signal: observationSignal
          });
          observationSucceeded = true;
        } catch (error) {
          if (signal?.aborted) throw abortError(signal);
          if (now() >= deadline) {
            throw timeoutError(timeoutMs, description, lastObservation);
          }
          const errorName = error instanceof Error ? error.name : typeof error;
          lastObservation = `observation failed (${errorName})`;
          return { accepted: false };
        }
        if (now() >= deadline) {
          throw timeoutError(timeoutMs, description, lastObservation);
        }
        lastObservation = formatObservation(observation);
        const accepted = await accept(observation);
        if (now() >= deadline) {
          throw timeoutError(timeoutMs, description, lastObservation);
        }
        return { accepted };
      }
    });
    if (observationSucceeded && outcome.accepted) {
      return observation;
    }

    const remainingMs = deadline - now();
    if (remainingMs <= 0) {
      throw timeoutError(timeoutMs, description, lastObservation);
    }
    await runBeforeDeadline({
      remainingMs,
      timeoutMs,
      description,
      lastObservation: () => lastObservation,
      signal,
      AbortControllerImpl,
      setTimer,
      clearTimer,
      operation: (sleepSignal) =>
        sleep(Math.min(pollIntervalMs, remainingMs), undefined, { signal: sleepSignal })
    });
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
  clearTimer,
  signal
}) => {
  const controller = new AbortControllerImpl();
  const abortFromWait = () => controller.abort(signal.reason);
  if (signal.aborted) controller.abort(signal.reason);
  else signal.addEventListener('abort', abortFromWait, { once: true });
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
    signal.removeEventListener('abort', abortFromWait);
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
  sleep = delay,
  signal
}) {
  const parsedDriverUrl = parseLoopbackDriverUrl(driverUrl);
  const statusUrl = new URL('/status', parsedDriverUrl);
  requireDuration(requestTimeoutMs, 'requestTimeoutMs');
  assert.equal(typeof fetchImpl, 'function', 'fetchImpl must be a function');

  await waitForCondition({
    description: 'WebDriver GET /status to report ready=true',
    observe: ({ remainingMs, signal: observationSignal }) =>
      readWebDriverStatus({
        statusUrl,
        fetchImpl,
        requestTimeoutMs: Math.max(1, Math.min(requestTimeoutMs, remainingMs)),
        AbortControllerImpl,
        setTimer,
        clearTimer,
        signal: observationSignal
      }),
    accept: ({ ready }) => ready,
    timeoutMs,
    pollIntervalMs,
    now,
    sleep,
    signal,
    formatObservation: ({ observation }) => observation
  });

  return { ready: true, statusUrl: statusUrl.href };
}
