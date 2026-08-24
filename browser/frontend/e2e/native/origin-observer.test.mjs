import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createOriginObserver,
  deriveQuiescenceWindow,
  parseOriginMetrics
} from './origin-observer.mjs';

test('origin metrics parser accepts bounded integer counters and rejects malformed text', () => {
  assert.deepEqual(
    parseOriginMetrics('requests_total 12\nregister_success_total 3\n'),
    { requests_total: 12, register_success_total: 3 }
  );
  for (const body of [
    'requests_total -1\n',
    'requests_total 1\nrequests_total 2\n',
    'bad-name 1\n',
    'requests_total 9007199254740992\n',
    'secret value\n'
  ]) {
    assert.throws(() => parseOriginMetrics(body), /invalid origin metrics/);
  }
});

test('quiescence is derived from observed request timing within explicit bounds', () => {
  assert.deepEqual(deriveQuiescenceWindow([10, 20, 30, 40, 50]), {
    sampleCount: 5,
    p95Ms: 50,
    quiescenceMs: 500
  });
  assert.equal(deriveQuiescenceWindow([300, 350, 400]).quiescenceMs, 2_000);
  assert.throws(() => deriveQuiescenceWindow([]), /timing samples/);
});

test('origin observer waits for exactly one delta then proves measured quiescence', async () => {
  const counts = [11, 11, 11, 11];
  let clock = 0;
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 200,
    timeoutMs: 1_000,
    pollIntervalMs: 100,
    fetchImpl: async () => ({ ok: true, text: async () => `requests_total ${counts.shift() ?? 11}\n` }),
    now: () => clock,
    sleep: async (milliseconds) => { clock += milliseconds; }
  });

  const result = await observer.waitForExactlyOne('requests_total', 10);
  assert.deepEqual(result, { before: 10, after: 11, quiescenceMs: 200 });
});

test('origin observer fails immediately when a counter exceeds exactly one', async () => {
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 100,
    timeoutMs: 500,
    pollIntervalMs: 50,
    fetchImpl: async () => ({ ok: true, text: async () => 'requests_total 12\n' }),
    sleep: async () => {}
  });
  await assert.rejects(observer.waitForExactlyOne('requests_total', 10), /exceeded expected value 11/);
});

test('origin observer accepts only explicit loopback internal endpoints', () => {
  for (const metricsUrl of [
    'http://0.0.0.0:3001/metrics',
    'https://127.0.0.1:3001/metrics',
    'http://user:pass@127.0.0.1:3001/metrics',
    'http://127.0.0.1:3001/other'
  ]) {
    assert.throws(
      () => createOriginObserver({ metricsUrl, quiescenceMs: 100 }),
      /origin metrics URL/
    );
  }
});
