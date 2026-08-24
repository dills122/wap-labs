import assert from 'node:assert/strict';
import test from 'node:test';

import { RESILIENCE_SCENARIOS } from './resilience.mjs';

function fixture() {
  const calls = [];
  const assertions = [];
  return {
    calls,
    assertions,
    context: {
      signal: new AbortController().signal,
      waves: {
        async launchWaves() { calls.push(['launch']); },
        async dismissWelcome() { calls.push(['dismiss']); },
        async openWapUrl(address) { calls.push(['open', address]); },
        async waitForDeckText(text) { calls.push(['deck', text]); return `deck: ${text}`; },
        async waitForAddress(address) { calls.push(['address', address]); return address; },
        async readSanitizedAddress() { return 'wap://localhost/'; },
        async stopNavigation() { calls.push(['stop']); return 'Navigation stopped.'; }
      },
      origin: {
        async waitForActionPhase(actionID, options) {
          calls.push(['action-phase', actionID, options.kind, options.phase]);
          return { actionID, kind: options.kind, count: 1, phase: options.phase };
        },
        async waitForActionSettledExactlyOnce(actionID, options) {
          calls.push(['action-settled', actionID, options.kind, options.phases]);
          return {
            actionID,
            kind: options.kind,
            count: 1,
            phase: 'cancelled',
            quiescenceMs: 10_500
          };
        }
      },
      observe(value) { calls.push(['observe', value]); },
      recordAssertion(name, details) { assertions.push({ name, details }); }
    }
  };
}

test('navigation resilience scenarios have stable unique P0 identities', () => {
  assert.deepEqual(
    RESILIENCE_SCENARIOS.map(({ id }) => id),
    ['RACE-NATIVE-001', 'RACE-NATIVE-002']
  );
  assert.ok(
    RESILIENCE_SCENARIOS.every(({ suite, secretBearing }) => suite === 'smoke' && !secretBearing)
  );
});

test('superseded slow navigation cannot overwrite a newer successful deck', async () => {
  const { calls, assertions, context } = fixture();
  await RESILIENCE_SCENARIOS.find(({ id }) => id === 'RACE-NATIVE-001').run(context);

  assert.deepEqual(
    calls.filter(([kind]) => kind === 'open').map(([, address]) => address),
    [
      'wap://localhost/',
      'wap://localhost/e2e/navigation/race-native-001-a1/slow.wml',
      'wap://localhost/examples/interop-check.wml'
    ]
  );
  assert.deepEqual(calls.filter(([kind]) => kind === 'stop'), [['stop']]);
  assert.equal(calls.filter(([kind, , text]) => kind === 'action-phase' && text === 'navigation').length, 1);
  assert.equal(assertions.at(-1).name, 'stale navigation exclusion');
});

test('explicit Stop preserves the prior deck and permits a later recovery navigation', async () => {
  const { calls, assertions, context } = fixture();
  await RESILIENCE_SCENARIOS.find(({ id }) => id === 'RACE-NATIVE-002').run(context);

  assert.deepEqual(calls.filter(([kind]) => kind === 'stop'), [['stop']]);
  assert.ok(calls.some((entry) => entry[0] === 'deck' && entry[1] === 'Local WAP training environment.'));
  assert.ok(calls.some((entry) => entry[0] === 'deck' && entry[1] === 'W13-A'));
  assert.deepEqual(
    assertions.map(({ name }) => name),
    ['Stop preserves deck', 'Stop recovery']
  );
});
