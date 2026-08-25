import assert from 'node:assert/strict';
import test from 'node:test';

import { isSafeAssertionName } from '../evidence-publisher.mjs';
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
        async startWapUrl(address) { calls.push(['start', address]); },
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
      infrastructure: {
        async withGatewayStopped(callback) {
          calls.push(['gateway', 'stopped']);
          try {
            return await callback();
          } finally {
            calls.push(['gateway', 'restored']);
          }
        }
      },
      observe(value) { calls.push(['observe', value]); },
      recordAssertion(name, details) {
        assert.equal(
          isSafeAssertionName(name),
          true,
          `resilience scenario assertion is missing from the safe evidence catalog: ${name}`
        );
        assertions.push({ name, details });
      }
    }
  };
}

test('navigation resilience scenarios have stable unique P0 identities', () => {
  assert.deepEqual(
    RESILIENCE_SCENARIOS.map(({ id }) => id),
    ['RACE-NATIVE-001', 'RACE-NATIVE-002', 'ERR-NATIVE-002']
  );
  assert.ok(
    RESILIENCE_SCENARIOS.every(({ suite, secretBearing }) => suite === 'smoke' && !secretBearing)
  );
});

test('real gateway outage is visible and the restarted gateway recovers', async () => {
  const { calls, assertions, context } = fixture();
  context.waves.waitForStatus = async (text) => {
    calls.push(['status', text]);
    return { text: 'Fetch failed: gateway unavailable', tone: 'error', displayed: true };
  };

  await RESILIENCE_SCENARIOS.find(({ id }) => id === 'ERR-NATIVE-002').run(context);

  assert.deepEqual(calls.filter(([kind]) => kind === 'gateway'), [
    ['gateway', 'stopped'],
    ['gateway', 'restored']
  ]);
  assert.ok(calls.some((entry) => entry[0] === 'status' && entry[1] === 'Fetch failed:'));
  assert.equal(
    calls.filter(
      ([kind, text]) => kind === 'deck' && text === 'Local WAP training environment.'
    ).length,
    2,
    'the prior deck must be checked again after the outage error'
  );
  assert.equal(assertions.at(-1).name, 'gateway restart recovery');
});

test('superseded slow navigation cannot overwrite a newer successful deck', async () => {
  const { calls, assertions, context } = fixture();
  await RESILIENCE_SCENARIOS.find(({ id }) => id === 'RACE-NATIVE-001').run(context);

  assert.deepEqual(
    calls.filter(([kind]) => kind === 'open' || kind === 'start'),
    [
      ['open', 'wap://localhost/'],
      ['start', 'wap://localhost/e2e/navigation/race-native-001-a1/slow.wml'],
      ['open', 'wap://localhost/examples/interop-check.wml']
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
