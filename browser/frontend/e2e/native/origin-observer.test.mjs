import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createOriginObserver,
  deriveQuiescenceWindow,
  parseOriginMetrics
} from './origin-observer.mjs';

test('origin metrics parser accepts bounded integer counters and rejects malformed text', () => {
  assert.deepEqual(parseOriginMetrics('requests_total 12\nregister_success_total 3\n'), {
    requests_total: 12,
    register_success_total: 3
  });
  assert.deepEqual(
    parseOriginMetrics(
      'requests_total 12\nusers_total 1\norigin_instance_info{id="waves-run-7"} 1\n'
    ),
    { requests_total: 12, users_total: 1 }
  );
  for (const body of [
    'requests_total -1\n',
    'requests_total 1\nrequests_total 2\n',
    'bad-name 1\n',
    'requests_total 9007199254740992\n',
    'secret value\n',
    'requests_total 1\norigin_instance_info{id="waves-run-7"} 1\norigin_instance_info{id="waves-run-8"} 1\n',
    'requests_total 1\norigin_instance_info{id="unsafe-"} 1\n',
    'requests_total 1\norigin_instance_info{id="waves-run-7",secret="value"} 1\n'
  ]) {
    assert.throws(() => parseOriginMetrics(body), /invalid origin metrics/);
  }
  assert.deepEqual(
    parseOriginMetrics('requests_total 1\norigin_instance_info{id="waves-run-7"} 1\n', {
      expectedOriginInstanceId: 'waves-run-7'
    }),
    { requests_total: 1 }
  );
  assert.throws(
    () =>
      parseOriginMetrics('requests_total 1\norigin_instance_info{id="waves-run-8"} 1\n', {
        expectedOriginInstanceId: 'waves-run-7'
      }),
    /instance mismatch/
  );
});

test('quiescence covers the complete production transport retry horizon plus margin', () => {
  assert.deepEqual(
    deriveQuiescenceWindow({
      transportTimeoutMs: 5_000,
      transportRetries: 1,
      schedulingMarginMs: 500
    }),
    {
      transportTimeoutMs: 5_000,
      transportRetries: 1,
      attempts: 2,
      schedulingMarginMs: 500,
      quiescenceMs: 10_500
    }
  );
  assert.throws(
    () => deriveQuiescenceWindow({ transportTimeoutMs: 0, transportRetries: 1 }),
    /transport timeout/
  );
});

test('quiescence inputs stay locked to the production transport retry configuration', async () => {
  const [productionConfig, runnerConfig] = await Promise.all([
    readFile(new URL('../../src/app/waves-config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../scripts/native-tauri-kannel-e2e.mjs', import.meta.url), 'utf8')
  ]);

  assert.match(productionConfig, /transportFetchTimeoutMs:\s*5000\b/);
  assert.match(productionConfig, /transportFetchRetries:\s*1\b/);
  assert.match(runnerConfig, /transportTimeoutMs:\s*5_000\b/);
  assert.match(runnerConfig, /transportRetries:\s*1\b/);
});

test('origin observer waits for exactly one delta then proves retry-horizon quiescence', async () => {
  const counts = [11, 11, 11, 11];
  let clock = 0;
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 200,
    timeoutMs: 1_000,
    pollIntervalMs: 100,
    fetchImpl: async () => ({
      ok: true,
      text: async () => `requests_total ${counts.shift() ?? 11}\n`
    }),
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    }
  });

  const result = await observer.waitForExactlyOne('requests_total', 10);
  assert.deepEqual(result, { before: 10, after: 11, quiescenceMs: 200 });
});

test('quiescence starts after the first accepted sample and requires a later sample', async () => {
  let clock = 0;
  let reads = 0;
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 200,
    timeoutMs: 1_000,
    pollIntervalMs: 100,
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
    fetchImpl: async () => {
      reads += 1;
      if (reads === 1) clock += 200;
      return { ok: true, text: async () => 'requests_total 11\n' };
    }
  });

  await observer.waitForExactlyOne('requests_total', 10);
  assert.ok(reads >= 3, 'reach, baseline, and post-window samples must all be observed');
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
  await assert.rejects(
    observer.waitForExactlyOne('requests_total', 10),
    /exceeded expected value 11/
  );
});

test('origin observer proves a counter remains unchanged through retry-horizon quiescence', async () => {
  let clock = 0;
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 200,
    pollIntervalMs: 100,
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
    fetchImpl: async () => ({ ok: true, text: async () => 'login_failure_total 4\n' })
  });

  assert.deepEqual(await observer.waitForUnchanged('login_failure_total', 4), {
    before: 4,
    after: 4,
    quiescenceMs: 200
  });
});

test('origin observer rejects a counter that changed instead of remaining stable', async () => {
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 100,
    fetchImpl: async () => ({ ok: true, text: async () => 'login_failure_total 5\n' })
  });

  await assert.rejects(
    observer.waitForUnchanged('login_failure_total', 4),
    /changed from expected value 4/
  );
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

test('origin observer seeds accounts without exposing bodies and reads exact action schema', async () => {
  const requests = [];
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    publicBase: 'http://127.0.0.1:49153/',
    expectedOriginInstanceId: 'waves-run-7',
    quiescenceMs: 100,
    fetchImpl: async (url, options = {}) => {
      requests.push({ url: String(url), options });
      if (String(url).includes('/e2e/actions/')) {
        return {
          ok: true,
          headers: new Headers({ 'x-waves-origin-instance': 'waves-run-7' }),
          json: async () => ({
            actionId: 'register-case-a1',
            kind: 'register',
            count: 1,
            phase: 'success'
          })
        };
      }
      return {
        ok: true,
        headers: new Headers({ 'x-waves-origin-instance': 'waves-run-7' }),
        arrayBuffer: async () => new ArrayBuffer(0)
      };
    }
  });
  await observer.seedAccount({
    username: 'user-a',
    pin: '4927',
    actionID: 'seed-case-a1'
  });
  assert.equal(requests[0].url, 'http://127.0.0.1:49153/register?e2e_action=seed-case-a1');
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(await observer.readAction('register-case-a1'), {
    actionId: 'register-case-a1',
    kind: 'register',
    count: 1,
    phase: 'success'
  });
});

test('direct origin setup and action surfaces reject a mismatched origin instance', async () => {
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    publicBase: 'http://127.0.0.1:49153/',
    expectedOriginInstanceId: 'right-run',
    quiescenceMs: 100,
    fetchImpl: async (url) => {
      if (String(url).includes('/e2e/actions/')) {
        return {
          ok: true,
          headers: new Headers({ 'x-waves-origin-instance': 'wrong-run' }),
          json: async () => ({
            actionId: 'register-case-a1',
            kind: 'register',
            count: 1,
            phase: 'success'
          })
        };
      }
      return {
        ok: true,
        headers: new Headers({ 'x-waves-origin-instance': 'wrong-run' }),
        arrayBuffer: async () => new ArrayBuffer(0)
      };
    }
  });

  await assert.rejects(
    observer.seedAccount({ username: 'user-a', pin: '4927', actionID: 'seed-case-a1' }),
    /instance mismatch/
  );
  await assert.rejects(observer.readAction('register-case-a1'), /instance mismatch/);
});

test('scenario cancellation aborts an in-flight origin stability observation', async () => {
  const controller = new AbortController();
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 100,
    timeoutMs: 1_000,
    fetchImpl: async (_url, { signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      })
  });
  const waiting = observer.waitForExactlyOne('requests_total', 0, {
    signal: controller.signal
  });
  controller.abort(new Error('scenario deadline'));
  await assert.rejects(waiting, /aborted/i);
});

test('session invalidation requires the controlled origin exact 401 response', async () => {
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    publicBase: 'http://127.0.0.1:49153/',
    expectedOriginInstanceId: 'waves-e2e-run-7',
    quiescenceMs: 100,
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      headers: new Headers({ 'x-waves-origin-instance': 'waves-e2e-run-7' }),
      text: async () => 'Session invalid or expired'
    })
  });

  await observer.verifySessionInvalidated('wap://localhost/portal?sid=ephemeral');
});

test('correlated action oracle proves exactly one stable receipt', async () => {
  let clock = 0;
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 200,
    timeoutMs: 1_000,
    pollIntervalMs: 100,
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        actionId: 'login-case-a1',
        kind: 'login',
        count: 1,
        phase: 'success'
      })
    })
  });
  assert.deepEqual(await observer.waitForActionExactlyOnce('login-case-a1', { kind: 'login' }), {
    actionID: 'login-case-a1',
    kind: 'login',
    count: 1,
    phase: 'success',
    quiescenceMs: 200
  });
});

test('navigation actions can be observed at receipt before cancellation', async () => {
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 100,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        actionId: 'navigation-case-a1',
        kind: 'navigation',
        count: 1,
        phase: 'received'
      })
    })
  });

  assert.deepEqual(
    await observer.waitForActionPhase('navigation-case-a1', {
      kind: 'navigation',
      phase: 'received'
    }),
    { actionID: 'navigation-case-a1', kind: 'navigation', count: 1, phase: 'received' }
  );
});

test('navigation action terminal proof accepts the reached cancellation phase and stays exact', async () => {
  let clock = 0;
  const phases = ['received', 'cancelled', 'cancelled', 'cancelled', 'cancelled'];
  const observer = createOriginObserver({
    metricsUrl: 'http://127.0.0.1:49152/metrics',
    quiescenceMs: 200,
    timeoutMs: 1_000,
    pollIntervalMs: 100,
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        actionId: 'navigation-case-a1',
        kind: 'navigation',
        count: 1,
        phase: phases.shift() ?? 'cancelled'
      })
    })
  });

  assert.deepEqual(
    await observer.waitForActionSettledExactlyOnce('navigation-case-a1', {
      kind: 'navigation',
      phases: ['success', 'cancelled']
    }),
    {
      actionID: 'navigation-case-a1',
      kind: 'navigation',
      count: 1,
      phase: 'cancelled',
      quiescenceMs: 200
    }
  );
});
