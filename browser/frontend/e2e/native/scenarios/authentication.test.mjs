import assert from 'node:assert/strict';
import test from 'node:test';

import { AUTHENTICATION_SCENARIOS } from './authentication.mjs';

function fixture() {
  const calls = [];
  const username = 'e2e_auth_case';
  const pin = '4927';
  const waves = {
    async launchWaves() { calls.push(['launch']); },
    async dismissWelcome() { calls.push(['dismiss']); },
    async openWapUrl(value) { calls.push(['open', value]); },
    async waitForDeckText(value) {
      calls.push(['deck', value]);
      if (value === 'Registration OK') return `Registration OK User ${username} created.`;
      if (value === 'Login OK') return `Login OK Authenticated as ${username}. Open Portal`;
      if (value.startsWith('Welcome')) return `${value} Session: ephemeral`;
      if (/^\*+$/.test(value)) return `PIN: ${value}`;
      return value;
    },
    async focusViewport() { calls.push(['focus']); },
    async typeText(value) { calls.push(['type', value]); },
    async pressKeyboardKey(value) { calls.push(['key', value]); },
    async pressSoftkey(value) { calls.push(['softkey', value]); },
    async typeFinalCharacterAndSubmitInOneTask(value, mode) {
      calls.push(['burst', value, mode]);
    },
    async readSanitizedAddress() { return 'wap://localhost/register'; },
    async waitForAddress(value) { return value; },
    async withEphemeralAddress(callback) {
      return callback('wap://localhost/portal?sid=ephemeral-secret');
    }
  };
  const assertions = [];
  return {
    calls,
    assertions,
    context: {
      waves,
      testData: {
        username,
        pin,
        actionID: 'auth-case-a1',
        seedActionID: 'seed-case-a1'
      },
      origin: {
        async seedAccount(value) { calls.push(['seed', value.actionID]); },
        async waitForActionExactlyOnce(id, value) {
          calls.push(['receipt', id, value.kind]);
          return { quiescenceMs: 500 };
        },
        async verifySessionInvalidated(value) { calls.push(['invalidated', value]); }
      },
      recordAssertion(name, details) { assertions.push({ name, details }); },
      observe(value) { calls.push(['observe', value]); }
    }
  };
}

test('authentication registry contains the four independent P0 regressions', () => {
  assert.deepEqual(AUTHENTICATION_SCENARIOS.map(({ id }) => id), [
    'AUTH-NATIVE-001A',
    'AUTH-NATIVE-001B',
    'AUTH-NATIVE-002A',
    'AUTH-NATIVE-002B'
  ]);
  assert.ok(AUTHENTICATION_SCENARIOS.every(({ secretBearing }) => secretBearing));
});

test('deterministic registration submits the final PIN digit and Enter in one task', async () => {
  const { calls, context } = fixture();
  await AUTHENTICATION_SCENARIOS[0].run(context);
  assert.ok(calls.some((entry) => entry[0] === 'burst' && entry[1] === '7' && entry[2] === 'enter'));
  assert.ok(calls.some((entry) => entry[0] === 'receipt' && entry[2] === 'register'));
});

test('ordinary registration uses WebDriver Enter after the full masked PIN', async () => {
  const { calls, context } = fixture();
  await AUTHENTICATION_SCENARIOS[1].run(context);
  assert.ok(calls.some((entry) => entry[0] === 'type' && entry[1] === '4927'));
  assert.ok(calls.some((entry) => entry[0] === 'key' && entry[1] === 'Enter'));
  assert.ok(!calls.some((entry) => entry[0] === 'burst'));
});

test('deterministic login seeds independently and submits final PIN digit with Select', async () => {
  const { calls, context } = fixture();
  await AUTHENTICATION_SCENARIOS[2].run(context);
  assert.ok(calls.some((entry) => entry[0] === 'seed' && entry[1] === 'seed-case-a1'));
  assert.ok(calls.some((entry) => entry[0] === 'burst' && entry[2] === 'select'));
  assert.ok(calls.some((entry) => entry[0] === 'invalidated'));
});

test('ordinary login submits with physical Select and invalidates its live session', async () => {
  const { calls, context, assertions } = fixture();
  await AUTHENTICATION_SCENARIOS[3].run(context);
  assert.ok(calls.some((entry) => entry[0] === 'softkey' && entry[1] === 'select'));
  assert.ok(assertions.some(({ name }) => name === 'session invalidation'));
});
