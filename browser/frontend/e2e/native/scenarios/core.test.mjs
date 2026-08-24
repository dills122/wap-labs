import assert from 'node:assert/strict';
import test from 'node:test';

import { CORE_SCENARIOS } from './core.mjs';

function fixture(overrides = {}) {
  const calls = [];
  const waves = {
    async launchWaves() { calls.push(['launch']); },
    async dismissWelcome() { calls.push(['dismiss']); },
    async openWapUrl(address) { calls.push(['open', address]); },
    async submitAddress(address) { calls.push(['submit-address', address]); },
    async waitForDeckText(text) {
      calls.push(['deck', text]);
      if (text.includes('Local WAP')) return `viewport: ${text} Open Menu`;
      if (text === '1. Login') return '1. Login 2. Register';
      if (text.includes('static WML')) return 'This is a static WML sample deck.';
      return `viewport: ${text}`;
    },
    async waitForStatus(text) {
      calls.push(['status', text]);
      return { text: 'Fetch failed: INVALID_REQUEST', tone: 'error', displayed: true };
    },
    async waitForAddress(address) { calls.push(['address', address]); return address; },
    async pressSoftkey(key) { calls.push(['softkey', key]); },
    ...overrides
  };
  const assertions = [];
  return {
    calls,
    context: {
      waves,
      observe(value) { calls.push(['observe', value]); },
      recordAssertion(name, details) { assertions.push({ name, details }); },
      origin: {
        async readCounter(name) { calls.push(['counter', name]); return 10; },
        async waitForExactlyOne(name, baseline) {
          calls.push(['exactly-one', name, baseline]);
          return { before: baseline, after: baseline + 1, quiescenceMs: 500 };
        }
      }
    },
    assertions
  };
}

test('core native scenarios have stable unique P0 identities', () => {
  assert.deepEqual(CORE_SCENARIOS.map(({ id }) => id), [
    'BOOT-NATIVE-001',
    'TRN-NATIVE-001',
    'NAV-NATIVE-001',
    'ERR-NATIVE-001',
    'REQ-NATIVE-001'
  ]);
  assert.ok(CORE_SCENARIOS.every(({ suite, secretBearing }) => suite === 'smoke' && !secretBearing));
});

test('boot scenario proves the production native shell reaches network mode', async () => {
  const { calls, context, assertions } = fixture();
  await CORE_SCENARIOS[0].run(context);
  assert.deepEqual(calls.slice(0, 2), [['launch'], ['dismiss']]);
  assert.equal(assertions[0].name, 'native startup');
});

test('transport scenario loads the canonical logical WAP address and visible deck', async () => {
  const { calls, context, assertions } = fixture();
  await CORE_SCENARIOS[1].run(context);
  assert.deepEqual(calls.filter(([kind]) => ['open', 'deck', 'address'].includes(kind)), [
    ['open', 'wap://localhost/'],
    ['deck', 'Local WAP training environment.'],
    ['address', 'wap://localhost/']
  ]);
  assert.equal(assertions.at(-1).name, 'gateway deck render');
});

test('navigation scenario crosses card and external deck boundaries with real softkeys', async () => {
  const { calls, context } = fixture();
  await CORE_SCENARIOS[2].run(context);
  assert.deepEqual(calls.filter(([kind]) => kind === 'softkey'), [
    ['softkey', 'select'],
    ['softkey', 'down'],
    ['softkey', 'down'],
    ['softkey', 'down'],
    ['softkey', 'select']
  ]);
  assert.ok(calls.some((entry) => entry[0] === 'deck' && entry[1] === 'This is a static WML'));
});

test('error scenario proves invalid input is visible and a later gateway load recovers', async () => {
  const { calls, context, assertions } = fixture();
  await CORE_SCENARIOS[3].run(context);
  assert.ok(calls.some((entry) => entry[0] === 'submit-address' && entry[1] === 'not a url'));
  assert.deepEqual(assertions.map(({ name }) => name), [
    'deterministic failure',
    'failure recovery'
  ]);
});

test('request-bound scenario delegates exactly-once quiescence to the correlated observer', async () => {
  const { calls, context, assertions } = fixture();
  await CORE_SCENARIOS[4].run(context);
  assert.ok(calls.some((entry) => entry[0] === 'exactly-one' && entry[1] === 'requests_total'));
  assert.match(assertions.at(-1).details, /500ms measured quiescence/);
});

test('error scenario fails if visible status is not an error', async () => {
  const { context } = fixture({
    async waitForStatus() { return { text: 'Loaded', tone: 'success', displayed: true }; }
  });
  await assert.rejects(CORE_SCENARIOS[3].run(context), /visible error tone/);
});
