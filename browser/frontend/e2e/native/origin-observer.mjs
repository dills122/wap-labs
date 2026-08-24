import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { waitForCondition } from './waits.mjs';

const METRIC_NAME = /^[a-z][a-z0-9_]{0,63}$/;
const ACTION_ID = /^[a-z0-9][a-z0-9-]{0,55}-a(?:[1-9][0-9]{0,3})$/;
const MAX_METRICS_BYTES = 16 * 1024;

export function parseOriginMetrics(body) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > MAX_METRICS_BYTES) {
    throw new Error('invalid origin metrics: body is missing or oversized');
  }
  const metrics = Object.create(null);
  for (const line of body.split('\n')) {
    if (line === '') continue;
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
  return { ...metrics };
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

export function deriveQuiescenceWindow(samples) {
  assert.ok(Array.isArray(samples) && samples.length >= 3, 'at least three timing samples are required');
  assert.ok(
    samples.every((value) => Number.isFinite(value) && value >= 0),
    'timing samples must be finite non-negative numbers'
  );
  const sorted = [...samples].sort((left, right) => left - right);
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  const p95Ms = Math.ceil(sorted[p95Index]);
  return Object.freeze({
    sampleCount: samples.length,
    p95Ms,
    quiescenceMs: Math.max(500, Math.min(2_000, p95Ms * 10))
  });
}

export async function measureOriginTiming({ metricsUrl, samples = 7, fetchImpl = globalThis.fetch, now = performance.now.bind(performance) }) {
  validateMetricsUrl(metricsUrl);
  assert.ok(Number.isSafeInteger(samples) && samples >= 3 && samples <= 20, 'timing sample count must be 3 through 20');
  const timings = [];
  for (let index = 0; index < samples; index += 1) {
    const started = now();
    const response = await fetchImpl(metricsUrl, { redirect: 'error', headers: { accept: 'text/plain' } });
    if (!response.ok) throw new Error('origin timing probe failed');
    parseOriginMetrics(await response.text());
    timings.push(Math.max(0, now() - started));
  }
  return deriveQuiescenceWindow(timings);
}

export function createOriginObserver({
  metricsUrl,
  publicBase,
  quiescenceMs,
  timeoutMs = 20_000,
  pollIntervalMs = 100,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  sleep = delay
}) {
  const url = validateMetricsUrl(metricsUrl);
  const publicOrigin = validatePublicBase(publicBase);
  const internalOrigin = new URL(url.origin);
  assert.ok(Number.isSafeInteger(quiescenceMs) && quiescenceMs > 0, 'quiescenceMs must be positive');
  assert.ok(Number.isSafeInteger(timeoutMs) && timeoutMs > 0, 'timeoutMs must be positive');

  const readMetrics = async () => {
    const response = await fetchImpl(url, { redirect: 'error', headers: { accept: 'text/plain' } });
    if (!response.ok) throw new Error(`origin metrics request failed with status ${response.status}`);
    return parseOriginMetrics(await response.text());
  };
  const readCounter = async (name) => {
    if (!METRIC_NAME.test(name)) throw new Error('invalid origin metric name');
    const value = (await readMetrics())[name];
    if (!Number.isSafeInteger(value)) throw new Error(`origin metric is unavailable: ${name}`);
    return value;
  };
  const readAction = async (actionID) => {
    requireActionID(actionID);
    const response = await fetchImpl(new URL(`/e2e/actions/${actionID}`, internalOrigin), {
      redirect: 'error', headers: { accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`origin action oracle failed with status ${response.status}`);
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

  return Object.freeze({
    readMetrics,
    readCounter,
    readAction,
    async seedAccount({ username, pin, actionID }) {
      if (!publicOrigin) throw new Error('origin account setup requires the controlled public base');
      requireActionID(actionID);
      if (typeof username !== 'string' || typeof pin !== 'string') {
        throw new Error('origin account setup requires in-memory credentials');
      }
      const target = new URL('/register', publicOrigin);
      target.searchParams.set('e2e_action', actionID);
      const response = await fetchImpl(target, {
        method: 'POST',
        redirect: 'error',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, pin })
      });
      if (!response.ok) throw new Error('controlled origin account setup failed');
      await response.arrayBuffer();
    },
    async verifySessionInvalidated(logicalAddress) {
      if (!publicOrigin) throw new Error('session invalidation proof requires the controlled public base');
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
      const response = await fetchImpl(target, { redirect: 'error' });
      const body = await response.text();
      if (!response.ok || !body.includes('invalid or expired')) {
        throw new Error('controlled origin did not reject the invalidated session');
      }
    },
    async waitForActionExactlyOnce(actionID, { kind, phase = 'success' }) {
      requireActionID(actionID);
      const reached = await waitForCondition({
        description: 'correlated origin action to reach one receipt',
        observe: () => readAction(actionID),
        accept: (action) => action.count >= 1 && action.phase === phase,
        timeoutMs,
        pollIntervalMs,
        now,
        sleep,
        formatObservation: (action) => `${action.kind}:${action.count}:${action.phase}`
      });
      if (reached.kind !== kind || reached.count !== 1) {
        throw new Error('correlated origin action did not have exactly one matching receipt');
      }
      const stableStarted = now();
      while (now() - stableStarted < quiescenceMs) {
        const current = await readAction(actionID);
        if (current.kind !== kind || current.count !== 1 || current.phase !== phase) {
          throw new Error('correlated origin action changed during measured quiescence');
        }
        await sleep(Math.min(pollIntervalMs, quiescenceMs - (now() - stableStarted)));
      }
      return { actionID, kind, count: 1, phase, quiescenceMs };
    },
    async waitForExactlyOne(name, before) {
      assert.ok(Number.isSafeInteger(before) && before >= 0, 'counter baseline must be non-negative');
      const expected = before + 1;
      await waitForCondition({
        description: `${name} to reach exactly one correlated increment`,
        observe: () => readCounter(name),
        accept: (current) => current >= expected,
        timeoutMs,
        pollIntervalMs,
        now,
        sleep
      }).then((current) => {
        if (current > expected) throw new Error(`${name} exceeded expected value ${expected}`);
      });

      const stableStarted = now();
      while (now() - stableStarted < quiescenceMs) {
        const current = await readCounter(name);
        if (current !== expected) {
          throw new Error(`${name} changed during measured quiescence`);
        }
        await sleep(Math.min(pollIntervalMs, quiescenceMs - (now() - stableStarted)));
      }
      return { before, after: expected, quiescenceMs };
    }
  });
}
