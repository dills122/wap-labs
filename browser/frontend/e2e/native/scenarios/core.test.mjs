import assert from 'node:assert/strict';
import test from 'node:test';

import { isSafeAssertionName } from '../evidence-publisher.mjs';
import { CORE_SCENARIOS } from './core.mjs';

function fixture(overrides = {}) {
  const calls = [];
  const waves = {
    async launchWaves() {
      calls.push(['launch']);
    },
    async dismissWelcome() {
      calls.push(['dismiss']);
    },
    async openWapUrl(address) {
      calls.push(['open', address]);
    },
    async submitAddress(address) {
      calls.push(['submit-address', address]);
    },
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
    async waitForAddress(address) {
      calls.push(['address', address]);
      return address;
    },
    async readSanitizedAddress() {
      return 'wap://localhost/';
    },
    async pressSoftkey(key) {
      calls.push(['softkey', key]);
    },
    async goBack() {
      calls.push(['back']);
    },
    async reload() {
      calls.push(['reload']);
    },
    ...overrides
  };
  const assertions = [];
  return {
    calls,
    context: {
      waves,
      signal: new AbortController().signal,
      observe(value) {
        calls.push(['observe', value]);
      },
      recordAssertion(name, details) {
        assert.equal(
          isSafeAssertionName(name),
          true,
          `core scenario assertion is missing from the safe evidence catalog: ${name}`
        );
        assertions.push({ name, details });
      },
      origin: {
        async readCounter(name) {
          calls.push(['counter', name]);
          return 10;
        },
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
  assert.deepEqual(
    CORE_SCENARIOS.map(({ id }) => id),
    [
      'BOOT-NATIVE-001',
      'TRN-NATIVE-001',
      'NAV-NATIVE-001',
      'NAV-NATIVE-002',
      'NAV-NATIVE-003',
      'ERR-NATIVE-001',
      'REQ-NATIVE-001'
    ]
  );
  assert.ok(
    CORE_SCENARIOS.every(({ suite, secretBearing }) => suite === 'smoke' && !secretBearing)
  );
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
  assert.deepEqual(
    calls.filter(([kind]) => ['open', 'deck', 'address'].includes(kind)),
    [
      ['open', 'wap://localhost/'],
      ['deck', 'Local WAP training environment.'],
      ['address', 'wap://localhost/']
    ]
  );
  assert.equal(assertions.at(-1).name, 'gateway deck render');
});

test('navigation scenario crosses card and external deck boundaries with real softkeys', async () => {
  const { calls, context } = fixture();
  await CORE_SCENARIOS[2].run(context);
  assert.deepEqual(
    calls.filter(([kind]) => kind === 'softkey'),
    [
      ['softkey', 'select'],
      ['softkey', 'down'],
      ['softkey', 'down'],
      ['softkey', 'down'],
      ['softkey', 'select']
    ]
  );
  assert.ok(calls.some((entry) => entry[0] === 'deck' && entry[1] === 'This is a static WML'));
});

test('hybrid Back restores the prior deck before consuming same-deck card history', async () => {
  const { calls, context, assertions } = fixture();
  const scenario = CORE_SCENARIOS.find(({ id }) => id === 'NAV-NATIVE-002');

  await scenario.run(context);

  assert.deepEqual(
    calls.filter(([kind]) => kind === 'back'),
    [['back'], ['back']]
  );
  assert.ok(calls.some((entry) => entry[0] === 'deck' && entry[1] === '1. Login'));
  assert.ok(
    calls.some(
      (entry) => entry[0] === 'deck' && entry[1] === 'Local WAP training environment.'
    )
  );
  assert.ok(calls.some((entry) => entry[0] === 'exactly-one' && entry[1] === 'requests_total'));
  assert.equal(assertions.at(-1).name, 'hybrid Back request bound');
});

test('Reload fetches exactly once and does not add a duplicate history entry', async () => {
  const { calls, context, assertions } = fixture();
  const scenario = CORE_SCENARIOS.find(({ id }) => id === 'NAV-NATIVE-003');

  await scenario.run(context);

  assert.deepEqual(calls.filter(([kind]) => kind === 'reload'), [['reload']]);
  assert.deepEqual(calls.filter(([kind]) => kind === 'back'), [['back']]);
  assert.ok(calls.some((entry) => entry[0] === 'exactly-one' && entry[1] === 'requests_total'));
  assert.equal(assertions.at(-1).name, 'Reload history integrity');
});

test('error scenario proves invalid input is visible and a later gateway load recovers', async () => {
  const { calls, context, assertions } = fixture();
  const scenario = CORE_SCENARIOS.find(({ id }) => id === 'ERR-NATIVE-001');
  await scenario.run(context);
  assert.ok(calls.some((entry) => entry[0] === 'submit-address' && entry[1] === 'not a url'));
  assert.deepEqual(
    assertions.map(({ name }) => name),
    ['deterministic failure', 'failure recovery']
  );
});

test('request-bound scenario delegates exactly-once quiescence to the correlated observer', async () => {
  const { calls, context, assertions } = fixture();
  const scenario = CORE_SCENARIOS.find(({ id }) => id === 'REQ-NATIVE-001');
  await scenario.run(context);
  assert.ok(calls.some((entry) => entry[0] === 'exactly-one' && entry[1] === 'requests_total'));
  assert.match(assertions.at(-1).details, /500ms derived retry-horizon quiescence/);
});

test('request-bound failure retains every completed core boundary checkpoint', async () => {
  const { calls, context } = fixture();
  context.origin.waitForExactlyOne = async () => {
    throw new Error('injected origin failure');
  };
  const scenario = CORE_SCENARIOS.find(({ id }) => id === 'REQ-NATIVE-001');
  await assert.rejects(scenario.run(context), /injected origin failure/);
  assert.deepEqual(
    calls.filter(([kind]) => kind === 'observe').map(([, value]) => value.phase),
    ['engine-ready', 'deck-ready', 'ui-dispatched', 'response-rendered']
  );
});

test('error scenario fails if visible status is not an error', async () => {
  const { context } = fixture({
    async waitForStatus() {
      return { text: 'Loaded', tone: 'success', displayed: true };
    }
  });
  const scenario = CORE_SCENARIOS.find(({ id }) => id === 'ERR-NATIVE-001');
  await assert.rejects(scenario.run(context), /visible error tone/);
});

test('error scenario distinguishes failed recovery dispatch from a failed recovery deck load', async () => {
  let opens = 0;
  const { calls, context } = fixture({
    async openWapUrl() {
      opens += 1;
      if (opens === 2) throw new Error('injected recovery deck failure');
    }
  });
  const scenario = CORE_SCENARIOS.find(({ id }) => id === 'ERR-NATIVE-001');
  await assert.rejects(scenario.run(context), /injected recovery deck failure/);
  const checkpoints = calls
    .filter(([kind]) => kind === 'observe')
    .map(([, observation]) => observation.phase);
  assert.equal(checkpoints.at(-1), 'recovery-ready');

  let localDeckWaits = 0;
  const deckFailure = fixture({
    async waitForDeckText(text) {
      if (text.includes('Local WAP')) localDeckWaits += 1;
      if (localDeckWaits === 2) {
        throw new Error('injected recovery response failure');
      }
    }
  });
  await assert.rejects(scenario.run(deckFailure.context), /injected recovery response failure/);
  const deckFailureCheckpoints = deckFailure.calls
    .filter(([kind]) => kind === 'observe')
    .map(([, observation]) => observation.phase);
  assert.equal(deckFailureCheckpoints.at(-1), 'recovery-dispatched');
});
