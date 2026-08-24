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
  assert.deepEqual(observations, ['one', 'cleanup-ONE', 'cleanup-TWO', 'three', 'cleanup-THREE']);
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

test('native E2E exposes provider-owned scenario context without global state', async () => {
  const [result] = await executeNativeE2EScenarios({
    scenarios: [scenario('CONTEXT', async ({ waves }) => assert.equal(waves, 'owned-page'))],
    createSession: async () => ({
      waves: 'owned-page',
      cleanup: async () => ({ result: 'closed' })
    })
  });
  assert.equal(result.result, 'pass');
});

test('native E2E records startup failures and still runs later scenarios', async () => {
  const results = await executeNativeE2EScenarios({
    scenarios: [
      scenario('START-FAIL', async () => assert.fail()),
      scenario('PASS', async () => {})
    ],
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
        observe({ phase: 'form-ready', address: 'wap://localhost/register' });
        observe({
          phase: 'response-rendered',
          address: 'wap://user:password@localhost/login?secret=value#fragment'
        });
      })
    ],
    createSession: async () => ({ cleanup: async () => ({ result: 'closed' }) })
  });

  assert.deepEqual(result.lastObservation, {
    phase: 'response-rendered',
    address: 'wap://localhost/login'
  });
  assert.deepEqual(result.checkpoints, [
    { phase: 'form-ready', address: 'wap://localhost/register' },
    { phase: 'response-rendered', address: 'wap://localhost/login' }
  ]);
  assert.equal(result.failureClass, null);
});

test('native E2E maps boundary failure injection to fixed safe failure classes', async () => {
  const cases = [
    { phases: [], expected: 'infrastructure-startup' },
    { phases: ['form-ready'], expected: 'ui-dispatch' },
    { phases: ['deck-ready', 'response-rendered', 'recovery-ready'], expected: 'ui-dispatch' },
    {
      phases: ['deck-ready', 'ui-dispatched', 'response-rendered', 'recovery-dispatched'],
      expected: 'response-rendering'
    },
    { phases: ['form-ready', 'ui-dispatched'], expected: 'response-rendering' },
    {
      phases: ['form-ready', 'ui-dispatched', 'response-rendered'],
      expected: 'origin-confirmation'
    },
    {
      phases: ['form-ready', 'ui-dispatched', 'response-rendered', 'origin-confirmed'],
      expected: 'session-lifecycle'
    },
    {
      phases: [
        'form-ready',
        'ui-dispatched',
        'response-rendered',
        'origin-confirmed',
        'session-invalidated'
      ],
      expected: 'scenario-finalization'
    }
  ];

  for (const [index, candidate] of cases.entries()) {
    const [result] = await executeNativeE2EScenarios({
      scenarios: [
        scenario(`BOUNDARY-${index}`, async ({ observe }) => {
          for (const phase of candidate.phases) observe({ phase });
          throw new Error(`untrusted-boundary-value-${index}`);
        })
      ],
      createSession: async () => ({ cleanup: async () => ({ result: 'closed' }) })
    });

    assert.equal(result.failureClass, candidate.expected);
    assert.deepEqual(
      result.checkpoints.map(({ phase }) => phase),
      candidate.phases
    );
  }
});

test('native E2E rejects unknown checkpoints and bounds retained checkpoint count', async () => {
  const [unknown] = await executeNativeE2EScenarios({
    scenarios: [scenario('UNKNOWN-PHASE', async ({ observe }) => observe({ phase: 'arbitrary' }))],
    createSession: async () => ({ cleanup: async () => ({ result: 'closed' }) })
  });
  assert.equal(unknown.result, 'fail');
  assert.equal(unknown.failureClass, 'infrastructure-startup');
  assert.deepEqual(unknown.checkpoints, []);

  const [overflow] = await executeNativeE2EScenarios({
    scenarios: [
      scenario('TOO-MANY', async ({ observe }) => {
        for (let index = 0; index < 17; index += 1) observe({ phase: 'engine-ready' });
      })
    ],
    createSession: async () => ({ cleanup: async () => ({ result: 'closed' }) })
  });
  assert.equal(overflow.result, 'fail');
  assert.equal(overflow.checkpoints.length, 16);
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

test('native E2E cleans up and fails without running when abort wins session creation', async () => {
  const controller = new AbortController();
  let runs = 0;
  let cleanups = 0;

  const [result] = await executeNativeE2EScenarios({
    scenarios: [
      scenario('ABORTED-START', async () => {
        runs += 1;
      })
    ],
    signal: controller.signal,
    createSession: async () => {
      controller.abort(new Error('stop requested'));
      return {
        async cleanup() {
          cleanups += 1;
          return { webdriverSession: 'closed', processGroup: 'terminated' };
        }
      };
    }
  });

  assert.equal(runs, 0);
  assert.equal(cleanups, 1);
  assert.equal(result.result, 'fail');
  assert.equal(result.error.name, 'AbortError');
});

test('native E2E cannot pass when cancellation wins a running scenario', async () => {
  const controller = new AbortController();
  let cleanupCount = 0;
  setTimeout(() => controller.abort(new Error('stop requested')), 5);
  const [result] = await executeNativeE2EScenarios({
    scenarios: [
      scenario('ABORTED-RUN', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      })
    ],
    signal: controller.signal,
    createSession: async () => ({
      async cleanup() {
        cleanupCount += 1;
        return { webdriverSession: 'closed', processGroup: 'terminated' };
      }
    })
  });

  assert.equal(result.result, 'fail');
  assert.equal(result.error.name, 'AbortError');
  assert.equal(cleanupCount, 1);
});

test('native E2E hard-bounds a scenario that ignores cancellation', async () => {
  let cleanupCount = 0;
  const [result] = await executeNativeE2EScenarios({
    scenarios: [scenario('TIMED-OUT-RUN', async () => new Promise(() => undefined))],
    scenarioTimeoutMs: 10,
    scenarioDrainTimeoutMs: 10,
    createSession: async () => ({
      async cleanup() {
        cleanupCount += 1;
        return { webdriverSession: 'closed', processGroup: 'terminated' };
      }
    })
  });

  assert.equal(result.result, 'fail');
  assert.equal(result.error.name, 'AbortError');
  assert.equal(cleanupCount, 1);
});

test('native E2E never starts another scenario or publishes while prior cleanup is unresolved', async () => {
  let secondRuns = 0;
  let publications = 0;
  let terminalPublication;
  let releaseCleanup;
  const cleanupSettled = new Promise((resolve) => {
    releaseCleanup = resolve;
  });
  const results = await executeNativeE2EScenarios({
    scenarios: [
      scenario('CLEANUP-HANG', async () => {}),
      scenario('MUST-NOT-START', async () => {
        secondRuns += 1;
      })
    ],
    cleanupTimeoutMs: 10,
    createSession: async () => ({
      async cleanup() {
        await cleanupSettled;
        return { webdriverSession: 'closed', processGroup: 'terminated' };
      }
    }),
    async onResult() {
      publications += 1;
    },
    async onTerminalResult(result, { ownershipSettlement }) {
      terminalPublication = { result, ownershipSettlement };
    }
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].failureClass, 'scenario-cleanup');
  assert.equal(secondRuns, 0);
  assert.equal(publications, 0);
  assert.equal(terminalPublication.result.scenarioId, 'CLEANUP-HANG');
  assert.equal(terminalPublication.result.result, 'fail');
  releaseCleanup();
  assert.equal(await terminalPublication.ownershipSettlement, true);
});

test('native E2E cannot pass when the scenario deadline expires during cleanup', async () => {
  const [result] = await executeNativeE2EScenarios({
    scenarios: [scenario('TIMED-OUT-CLEANUP', async () => {})],
    scenarioTimeoutMs: 10,
    cleanupTimeoutMs: 100,
    createSession: async () => ({
      async cleanup() {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { webdriverSession: 'closed', processGroup: 'terminated' };
      }
    })
  });

  assert.equal(result.result, 'fail');
  assert.equal(result.failureClass, 'scenario-cleanup');
  assert.equal(result.error.name, 'AbortError');
});
