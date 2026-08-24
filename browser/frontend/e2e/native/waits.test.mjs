import assert from 'node:assert/strict';
import test from 'node:test';

import { waitForCondition, waitForWebDriverReady } from './waits.mjs';

const createFakeTime = () => {
  let current = 0;
  return {
    now: () => current,
    sleep: async (milliseconds) => {
      current += milliseconds;
    }
  };
};

test('condition waits return the accepted observation', async () => {
  const time = createFakeTime();
  const observations = ['starting', 'ready'];

  const result = await waitForCondition({
    description: 'engine ready',
    observe: async () => observations.shift(),
    accept: (value) => value === 'ready',
    timeoutMs: 100,
    pollIntervalMs: 10,
    ...time
  });

  assert.equal(result, 'ready');
  assert.equal(time.now(), 10);
});

test('condition waits surface acceptance predicate defects immediately', async () => {
  const time = createFakeTime();

  await assert.rejects(
    waitForCondition({
      description: 'valid state',
      observe: async () => ({ state: 'unexpected' }),
      accept: () => {
        throw new TypeError('invalid predicate state');
      },
      timeoutMs: 100,
      pollIntervalMs: 10,
      ...time
    }),
    new TypeError('invalid predicate state')
  );
  assert.equal(time.now(), 0);
});

test('condition wait timeouts identify the expectation and last observation', async () => {
  const time = createFakeTime();
  let observationCount = 0;

  await assert.rejects(
    waitForCondition({
      description: 'deck text "Welcome"',
      observe: async () => {
        observationCount += 1;
        return 'Loading';
      },
      accept: () => false,
      timeoutMs: 25,
      pollIntervalMs: 10,
      ...time
    }),
    /timed out after 25ms waiting for deck text "Welcome"; last observation: Loading/
  );
  assert.equal(time.now(), 25);
  assert.equal(observationCount, 3, 'the condition is not observed again after its deadline');
});

test('condition waits reject an otherwise accepted observation that completes after the deadline', async () => {
  let current = 0;
  let acceptanceChecks = 0;

  await assert.rejects(
    waitForCondition({
      description: 'an on-time observation',
      observe: async ({ remainingMs, signal }) => {
        assert.equal(remainingMs, 10);
        assert.equal(signal.aborted, false);
        current = 11;
        return 'ready-too-late';
      },
      accept: () => {
        acceptanceChecks += 1;
        return true;
      },
      timeoutMs: 10,
      pollIntervalMs: 5,
      now: () => current,
      sleep: async (milliseconds) => {
        current += milliseconds;
      }
    }),
    /timed out after 10ms waiting for an on-time observation/
  );

  assert.equal(acceptanceChecks, 0, 'late observations are never evaluated for acceptance');
});

test('condition waits hard-bound a never-settling observation and cancel its signal', async () => {
  let observationSignal;
  const startedAt = Date.now();

  await assert.rejects(
    waitForCondition({
      description: 'a settling observation',
      observe: ({ signal }) => {
        observationSignal = signal;
        return new Promise(() => undefined);
      },
      timeoutMs: 20,
      pollIntervalMs: 5
    }),
    /timed out after 20ms waiting for a settling observation/
  );

  assert.equal(observationSignal.aborted, true);
  assert.ok(Date.now() - startedAt < 1_000, 'the wait remains wall-clock bounded');
});

test('WebDriver readiness polls GET /status until the endpoint reports ready', async () => {
  const time = createFakeTime();
  const requests = [];
  const responses = [
    { ok: true, status: 200, json: async () => ({ value: { ready: false } }) },
    { ok: true, status: 200, json: async () => ({ value: { ready: true } }) }
  ];

  const result = await waitForWebDriverReady({
    driverUrl: 'http://127.0.0.1:41234/wd/hub',
    timeoutMs: 100,
    pollIntervalMs: 10,
    requestTimeoutMs: 25,
    fetchImpl: async (url, options) => {
      requests.push({ url: url.href, method: options.method, accept: options.headers.accept });
      return responses.shift();
    },
    ...time
  });

  assert.deepEqual(result, {
    ready: true,
    statusUrl: 'http://127.0.0.1:41234/status'
  });
  assert.deepEqual(requests, [
    {
      url: 'http://127.0.0.1:41234/status',
      method: 'GET',
      accept: 'application/json'
    },
    {
      url: 'http://127.0.0.1:41234/status',
      method: 'GET',
      accept: 'application/json'
    }
  ]);
});

test('WebDriver readiness does not mistake an open HTTP endpoint for a ready driver', async () => {
  const time = createFakeTime();

  await assert.rejects(
    waitForWebDriverReady({
      driverUrl: 'http://127.0.0.1:41234/',
      timeoutMs: 20,
      pollIntervalMs: 10,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ value: { ready: false, message: 'still starting' } })
      }),
      ...time
    }),
    /waiting for WebDriver GET \/status to report ready=true; last observation: ready=false/
  );
});

test('WebDriver readiness records protocol-safe observations for HTTP and malformed responses', async () => {
  const time = createFakeTime();
  const responses = [
    { ok: false, status: 503, json: async () => ({ secret: 'must-not-appear' }) },
    { ok: true, status: 200, json: async () => ({ value: {} }) }
  ];

  await assert.rejects(
    waitForWebDriverReady({
      driverUrl: 'http://127.0.0.1:41234/',
      timeoutMs: 20,
      pollIntervalMs: 10,
      fetchImpl: async () => responses.shift(),
      ...time
    }),
    (error) => {
      assert.match(error.message, /last observation: malformed status response/);
      assert.doesNotMatch(error.message, /must-not-appear/);
      return true;
    }
  );
});

test('WebDriver readiness bounds each status request by the remaining startup time', async () => {
  const time = createFakeTime();
  const requestTimeouts = [];

  await assert.rejects(
    waitForWebDriverReady({
      driverUrl: 'http://127.0.0.1:41234/',
      timeoutMs: 10,
      pollIntervalMs: 10,
      requestTimeoutMs: 1_000,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ value: { ready: false } })
      }),
      setTimer: (_callback, milliseconds) => {
        requestTimeouts.push(milliseconds);
        return 1;
      },
      clearTimer: () => undefined,
      ...time
    }),
    /timed out after 10ms/
  );

  assert.deepEqual(requestTimeouts, [10]);
});

test('WebDriver readiness rejects non-loopback and credential-bearing endpoints', async () => {
  await assert.rejects(
    waitForWebDriverReady({ driverUrl: 'http://example.com:4444/' }),
    /explicit IPv4 loopback/
  );
  await assert.rejects(
    waitForWebDriverReady({ driverUrl: 'http://user:pass@127.0.0.1:4444/' }),
    /must not contain credentials/
  );
});
