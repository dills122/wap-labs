import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { waitForCondition } from './waits.mjs';

const METRIC_NAME = /^[a-z][a-z0-9_]{0,63}$/;
const ACTION_ID = /^[a-z0-9][a-z0-9-]{0,55}-a(?:[1-9][0-9]{0,3})$/;
const ORIGIN_INSTANCE_METRIC =
  /^origin_instance_info\{id="([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)"\} 1$/;
const ORIGIN_INSTANCE_ID = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const MAX_METRICS_BYTES = 16 * 1024;

export function parseOriginMetrics(body, { expectedOriginInstanceId } = {}) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > MAX_METRICS_BYTES) {
    throw new Error('invalid origin metrics: body is missing or oversized');
  }
  const metrics = Object.create(null);
  let sawOriginInstance = false;
  for (const line of body.split('\n')) {
    if (line === '') continue;
    if (ORIGIN_INSTANCE_METRIC.test(line)) {
      if (sawOriginInstance) {
        throw new Error('invalid origin metrics: duplicate origin instance');
      }
      sawOriginInstance = true;
      continue;
    }
    const match = /^([a-z][a-z0-9_]{0,63}) ([0-9]+)$/.exec(line);
    if (!match || !METRIC_NAME.test(match[1]) || Object.hasOwn(metrics, match[1])) {
      throw new Error('invalid origin metrics: unexpected line');
    }
    const value = Number(match[2]);
    if (!Number.isSafeInteger(value)) {
      throw new Error('invalid origin metrics: counter is outside the safe integer range');
    }
    metrics[match[1]] = value;
  }
  if (Object.keys(metrics).length === 0) {
    throw new Error('invalid origin metrics: no counters');
  }
  if (expectedOriginInstanceId !== undefined) {
    const identity = body
      .split('\n')
      .map((line) => ORIGIN_INSTANCE_METRIC.exec(line)?.[1])
      .find(Boolean);
    if (identity !== expectedOriginInstanceId) {
      throw new Error('invalid origin metrics: origin instance mismatch');
    }
  }
  return { ...metrics };
}

function combineSignals(...signals) {
  const present = signals.filter(Boolean);
  if (present.length === 0) return undefined;
  return present.length === 1 ? present[0] : AbortSignal.any(present);
}

function validateMetricsUrl(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    url.port === '' ||
    url.pathname !== '/metrics' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw new Error('origin metrics URL must be an uncredentialed IPv4 loopback /metrics endpoint');
  }
  return url;
}

function validatePublicBase(value) {
  if (value === undefined) return null;
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    url.port === '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw new Error('origin public base must be an uncredentialed IPv4 loopback HTTP origin');
  }
  return url;
}

function requireActionID(value) {
  if (!ACTION_ID.test(value)) throw new Error('invalid native E2E action identifier');
  return value;
}

export function deriveQuiescenceWindow({
  transportTimeoutMs,
  transportRetries,
  schedulingMarginMs = 500
}) {
  assert.ok(
    Number.isSafeInteger(transportTimeoutMs) && transportTimeoutMs > 0,
    'transport timeout must be a positive integer'
  );
  assert.ok(
    Number.isSafeInteger(transportRetries) && transportRetries >= 0 && transportRetries <= 2,
    'transport retries must be an integer from 0 through 2'
  );
  assert.ok(
    Number.isSafeInteger(schedulingMarginMs) &&
      schedulingMarginMs >= 0 &&
      schedulingMarginMs <= 5_000,
    'scheduling margin must be an integer from 0 through 5000'
  );
  const attempts = transportRetries + 1;
  const quiescenceMs = transportTimeoutMs * attempts + schedulingMarginMs;
  assert.ok(
    Number.isSafeInteger(quiescenceMs) && quiescenceMs <= 120_000,
    'retry horizon is too large'
  );
  return Object.freeze({
    transportTimeoutMs,
    transportRetries,
    attempts,
    schedulingMarginMs,
    quiescenceMs
  });
}

export function createOriginObserver({
  metricsUrl,
  publicBase,
  expectedOriginInstanceId,
  quiescenceMs,
  timeoutMs = 20_000,
  pollIntervalMs = 100,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  sleep = delay,
  signal: runSignal
}) {
  const url = validateMetricsUrl(metricsUrl);
  const publicOrigin = validatePublicBase(publicBase);
  const internalOrigin = new URL(url.origin);
  if (
    expectedOriginInstanceId !== undefined &&
    !ORIGIN_INSTANCE_ID.test(expectedOriginInstanceId)
  ) {
    throw new Error('expected origin instance identifier is invalid');
  }
  assert.ok(
    Number.isSafeInteger(quiescenceMs) && quiescenceMs > 0,
    'quiescenceMs must be positive'
  );
  assert.ok(Number.isSafeInteger(timeoutMs) && timeoutMs > 0, 'timeoutMs must be positive');

  const fetchOrigin = async (target, options, observationSignal) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signals = [runSignal, observationSignal, timeoutSignal].filter(Boolean);
    return fetchImpl(target, {
      ...options,
      signal: signals.length === 1 ? signals[0] : AbortSignal.any(signals)
    });
  };

  const requireExpectedOrigin = (response) => {
    if (
      expectedOriginInstanceId !== undefined &&
      response.headers?.get?.('x-waves-origin-instance') !== expectedOriginInstanceId
    ) {
      throw new Error('controlled origin instance mismatch');
    }
  };

  const readMetrics = async ({ signal } = {}) => {
    const response = await fetchOrigin(
      url,
      { redirect: 'error', headers: { accept: 'text/plain' } },
      signal
    );
    if (!response.ok)
      throw new Error(`origin metrics request failed with status ${response.status}`);
    return parseOriginMetrics(await response.text(), { expectedOriginInstanceId });
  };
  const readCounter = async (name, options) => {
    if (!METRIC_NAME.test(name)) throw new Error('invalid origin metric name');
    const value = (await readMetrics(options))[name];
    if (!Number.isSafeInteger(value)) throw new Error(`origin metric is unavailable: ${name}`);
    return value;
  };
  const readAction = async (actionID, { signal } = {}) => {
    requireActionID(actionID);
    const response = await fetchOrigin(
      new URL(`/e2e/actions/${actionID}`, internalOrigin),
      { redirect: 'error', headers: { accept: 'application/json' } },
      signal
    );
    if (!response.ok) throw new Error(`origin action oracle failed with status ${response.status}`);
    requireExpectedOrigin(response);
    const value = await response.json();
    const keys = Object.keys(value ?? {}).sort();
    if (
      keys.join(',') !== 'actionId,count,kind,phase' ||
      value.actionId !== actionID ||
      !['register', 'login'].includes(value.kind) ||
      !Number.isSafeInteger(value.count) ||
      value.count < 0 ||
      typeof value.phase !== 'string' ||
      value.phase.length > 32
    ) {
      throw new Error('origin action oracle returned an invalid schema');
    }
    return value;
  };

  const proveStable = async ({ description, observe, accept, formatObservation, signal }) => {
    const operationSignal = combineSignals(runSignal, signal);
    await waitForCondition({
      description: `${description} initial sample`,
      observe: ({ signal }) => observe(signal),
      accept: (value) => {
        accept(value);
        return true;
      },
      timeoutMs,
      pollIntervalMs,
      now,
      sleep,
      signal: operationSignal,
      formatObservation
    });
    const startedAt = now();
    return waitForCondition({
      description,
      observe: async ({ signal }) => ({
        value: await observe(signal),
        elapsedMs: Math.max(0, now() - startedAt)
      }),
      accept: ({ value, elapsedMs }) => {
        accept(value);
        return elapsedMs >= quiescenceMs;
      },
      timeoutMs: quiescenceMs + pollIntervalMs * 2,
      pollIntervalMs,
      now,
      sleep,
      signal: operationSignal,
      formatObservation: ({ value, elapsedMs }) =>
        `${formatObservation(value)} stable-for=${elapsedMs}ms`
    });
  };

  return Object.freeze({
    readMetrics,
    readCounter,
    readAction,
    async seedAccount({ username, pin, actionID }, { signal } = {}) {
      if (!publicOrigin)
        throw new Error('origin account setup requires the controlled public base');
      requireActionID(actionID);
      if (typeof username !== 'string' || typeof pin !== 'string') {
        throw new Error('origin account setup requires in-memory credentials');
      }
      const target = new URL('/register', publicOrigin);
      target.searchParams.set('e2e_action', actionID);
      const response = await fetchOrigin(
        target,
        {
          method: 'POST',
          redirect: 'error',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ username, pin })
        },
        signal
      );
      if (!response.ok) throw new Error('controlled origin account setup failed');
      requireExpectedOrigin(response);
      await response.arrayBuffer();
    },
    async verifySessionInvalidated(logicalAddress, { signal } = {}) {
      if (!publicOrigin)
        throw new Error('session invalidation proof requires the controlled public base');
      const logical = new URL(logicalAddress);
      if (
        !['wap:', 'waps:'].includes(logical.protocol) ||
        logical.hostname !== 'localhost' ||
        logical.pathname !== '/portal' ||
        !logical.searchParams.has('sid')
      ) {
        throw new Error('session invalidation proof requires an ephemeral logical portal address');
      }
      const target = new URL(logical.pathname + logical.search, publicOrigin);
      const response = await fetchOrigin(target, { redirect: 'error' }, signal);
      const body = await response.text();
      const observedOrigin = response.headers?.get?.('x-waves-origin-instance');
      if (
        response.status !== 401 ||
        !body.toLowerCase().includes('invalid or expired') ||
        (expectedOriginInstanceId !== undefined && observedOrigin !== expectedOriginInstanceId)
      ) {
        throw new Error('controlled origin did not reject the invalidated session');
      }
    },
    async waitForActionExactlyOnce(actionID, { kind, phase = 'success', signal }) {
      requireActionID(actionID);
      const operationSignal = combineSignals(runSignal, signal);
      const reached = await waitForCondition({
        description: 'correlated origin action to reach one receipt',
        observe: ({ signal }) => readAction(actionID, { signal }),
        accept: (action) => action.count >= 1 && action.phase === phase,
        timeoutMs,
        pollIntervalMs,
        now,
        sleep,
        signal: operationSignal,
        formatObservation: (action) => `${action.kind}:${action.count}:${action.phase}`
      });
      if (reached.kind !== kind || reached.count !== 1) {
        throw new Error('correlated origin action did not have exactly one matching receipt');
      }
      await proveStable({
        description: 'correlated origin action to remain exactly once',
        observe: (signal) => readAction(actionID, { signal }),
        accept: (current) => {
          if (current.kind !== kind || current.count !== 1 || current.phase !== phase) {
            throw new Error('correlated origin action changed during retry-horizon quiescence');
          }
        },
        formatObservation: (current) => `${current.kind}:${current.count}:${current.phase}`,
        signal: operationSignal
      });
      return { actionID, kind, count: 1, phase, quiescenceMs };
    },
    async waitForExactlyOne(name, before, { signal } = {}) {
      const operationSignal = combineSignals(runSignal, signal);
      assert.ok(
        Number.isSafeInteger(before) && before >= 0,
        'counter baseline must be non-negative'
      );
      const expected = before + 1;
      await waitForCondition({
        description: `${name} to reach exactly one correlated increment`,
        observe: ({ signal }) => readCounter(name, { signal }),
        accept: (current) => current >= expected,
        timeoutMs,
        pollIntervalMs,
        now,
        sleep,
        signal: operationSignal
      }).then((current) => {
        if (current > expected) throw new Error(`${name} exceeded expected value ${expected}`);
      });

      await proveStable({
        description: `${name} to remain at exactly one increment`,
        observe: (signal) => readCounter(name, { signal }),
        accept: (current) => {
          if (current !== expected)
            throw new Error(`${name} changed during retry-horizon quiescence`);
        },
        formatObservation: String,
        signal: operationSignal
      });
      return { before, after: expected, quiescenceMs };
    },
    async waitForUnchanged(name, before, { signal } = {}) {
      const operationSignal = combineSignals(runSignal, signal);
      assert.ok(
        Number.isSafeInteger(before) && before >= 0,
        'counter baseline must be non-negative'
      );
      await proveStable({
        description: `${name} to remain unchanged`,
        observe: (signal) => readCounter(name, { signal }),
        accept: (current) => {
          if (current !== before) throw new Error(`${name} changed from expected value ${before}`);
        },
        formatObservation: String,
        signal: operationSignal
      });
      return { before, after: before, quiescenceMs };
    }
  });
}
