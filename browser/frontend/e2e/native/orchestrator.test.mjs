import assert from 'node:assert/strict';
import test from 'node:test';

import { executeNativeE2EScenarios } from './orchestrator.mjs';

const scenario = (id, run) => ({ id, suite: 'p0', name: id, run });

test('native E2E gives every scenario a fresh session and continues after failure', async () => {
  const sessions = [];
  const observations = [];
  let clock = 100;
  const results = await executeNativeE2EScenarios({
    scenarios: [
      scenario('ONE', async ({ session }) => {
        assert.equal(session.id, 'session-ONE');
        observations.push('one');
      }),
      scenario('TWO', async () => {
        throw new Error('expected failure');
      }),
      scenario('THREE', async ({ session }) => {
        assert.equal(session.id, 'session-THREE');
        observations.push('three');
      })
    ],
    createSession: async ({ id }) => {
      const owned = {
        id: `session-${id}`,
        async cleanup() {
          observations.push(`cleanup-${id}`);
          return { webdriverSession: 'closed', processGroup: 'terminated' };
        }
      };
      sessions.push(owned);
      return owned;
    },
    now: () => (clock += 25)
  });

  assert.equal(new Set(sessions).size, 3);
  assert.deepEqual(observations, [
    'one',
    'cleanup-ONE',
    'cleanup-TWO',
    'three',
    'cleanup-THREE'
  ]);
  assert.deepEqual(
    results.map(({ scenarioId, result, durationMs }) => ({ scenarioId, result, durationMs })),
    [
      { scenarioId: 'ONE', result: 'pass', durationMs: 25 },
      { scenarioId: 'TWO', result: 'fail', durationMs: 25 },
      { scenarioId: 'THREE', result: 'pass', durationMs: 25 }
    ]
  );
  assert.match(results[1].error.message, /expected failure/);
});

test('native E2E records startup failures and still runs later scenarios', async () => {
  const results = await executeNativeE2EScenarios({
    scenarios: [scenario('START-FAIL', async () => assert.fail()), scenario('PASS', async () => {})],
    createSession: async ({ id }) => {
      if (id === 'START-FAIL') {
        throw new Error('driver unavailable');
      }
      return { cleanup: async () => ({ webdriverSession: 'closed', processGroup: 'terminated' }) };
    }
  });

  assert.deepEqual(
    results.map(({ scenarioId, result }) => ({ scenarioId, result })),
    [
      { scenarioId: 'START-FAIL', result: 'fail' },
      { scenarioId: 'PASS', result: 'pass' }
    ]
  );
  assert.match(results[0].error.message, /driver unavailable/);
});

test('native E2E makes cleanup failure fail an otherwise passing scenario', async () => {
  const [result] = await executeNativeE2EScenarios({
    scenarios: [scenario('DIRTY', async () => {})],
    createSession: async () => ({
      cleanup: async () => ({ webdriverSession: 'close-failed', processGroup: 'cleanup-failed' })
    })
  });

  assert.equal(result.result, 'fail');
  assert.deepEqual(result.cleanup, {
    webdriverSession: 'close-failed',
    processGroup: 'cleanup-failed'
  });
  assert.match(result.error.message, /cleanup failed/i);
});

test('native E2E reports its last observation without retaining arbitrary values', async () => {
  const [result] = await executeNativeE2EScenarios({
    scenarios: [
      scenario('OBSERVE', async ({ observe }) => {
        observe({ phase: 'render', address: 'wap://localhost/register' });
        observe({ phase: 'done', address: 'wap://localhost/login?secret=value#fragment' });
      })
    ],
    createSession: async () => ({ cleanup: async () => ({ result: 'closed' }) })
  });

  assert.deepEqual(result.lastObservation, {
    phase: 'done',
    address: 'wap://localhost/login'
  });
});

test('native E2E rejects malformed scenario definitions before starting providers', async () => {
  let starts = 0;
  await assert.rejects(
    executeNativeE2EScenarios({
      scenarios: [{ id: '../bad', suite: 'p0', name: 'bad', run: async () => {} }],
      createSession: async () => {
        starts += 1;
      }
    }),
    /invalid native E2E scenario id/
  );
  assert.equal(starts, 0);
});
