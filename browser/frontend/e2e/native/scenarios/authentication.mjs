import assert from 'node:assert/strict';

const compactVisibleText = (value) => value.replace(/\s+/g, '');

function assertVisibleResponse(response, expected, rejected) {
  assert.ok(
    compactVisibleText(response).includes(compactVisibleText(expected)),
    'the expected authentication response must be visible across layout wraps'
  );
  assert.ok(
    !compactVisibleText(response).includes(compactVisibleText(rejected)),
    'the required-fields error must not be visible on a successful response'
  );
}

async function prepareForm(context, kind) {
  const { actionID, username, pin } = context.testData;
  await context.waves.launchWaves();
  await context.waves.dismissWelcome();
  context.observe({ phase: 'engine-ready' });
  await context.waves.openWapUrl(`wap://localhost/${kind}?e2e_action=${actionID}`);
  await context.waves.waitForDeckText(kind === 'register' ? 'Create account' : 'Enter username');
  context.observe({ phase: 'deck-ready', address: await context.waves.readSanitizedAddress() });
  await context.waves.focusViewport();
  await context.waves.typeText(username);
  await context.waves.waitForDeckText(username);
  await context.waves.pressKeyboardKey('ArrowDown');
  await context.waves.waitForStatus('Keyboard: down');
  context.observe({ phase: 'form-ready', address: await context.waves.readSanitizedAddress() });
  return { actionID, username, pin };
}

async function typePIN(context, pin, { deterministic, submitWith }) {
  const prefix = deterministic ? pin.slice(0, -1) : pin;
  await context.waves.typeText(prefix);
  const masked = await context.waves.waitForDeckText('*'.repeat(prefix.length));
  assert.ok(!masked.includes(pin), 'PIN plaintext must not appear in the visible deck');
  if (deterministic) {
    await context.waves.typeFinalCharacterAndSubmitInOneTask(pin.at(-1), submitWith);
  } else if (submitWith === 'enter') {
    await context.waves.pressKeyboardKey('Enter');
  } else {
    await context.waves.pressSoftkey('select');
  }
  context.recordAssertion('masked PIN entry', 'password input remained masked before submission');
  context.observe({ phase: 'ui-dispatched' });
}

function registration({ id, name, deterministic }) {
  return Object.freeze({
    id,
    suite: 'smoke',
    name,
    secretBearing: true,
    async run(context) {
      const { actionID, username, pin } = await prepareForm(context, 'register');
      const registeredBefore = await context.origin.readCounter('register_success_total', {
        signal: context.signal
      });
      await typePIN(context, pin, { deterministic, submitWith: 'enter' });
      const response = await context.waves.waitForDeckText(`User ${username} created.`);
      assertVisibleResponse(
        response,
        `User ${username} created.`,
        'Username and PIN are required'
      );
      context.observe({
        phase: 'response-rendered',
        address: await context.waves.readSanitizedAddress()
      });
      const [receipt] = await Promise.all([
        context.origin.waitForActionExactlyOnce(actionID, {
          kind: 'register',
          signal: context.signal
        }),
        context.origin.waitForExactlyOne('register_success_total', registeredBefore, {
          signal: context.signal
        })
      ]);
      context.recordAssertion(
        'registration response',
        'Registration OK rendered for the scenario-owned username'
      );
      context.recordAssertion(
        'correlated registration receipt',
        `one register POST remained stable through ${receipt.quiescenceMs}ms derived retry-horizon quiescence`
      );
      context.recordAssertion(
        'registration aggregate metric',
        'register_success_total increased by exactly one and remained stable'
      );
      context.observe({
        phase: 'origin-confirmed',
        address: await context.waves.readSanitizedAddress()
      });
    }
  });
}

function login({ id, name, deterministic }) {
  return Object.freeze({
    id,
    suite: 'smoke',
    name,
    secretBearing: true,
    async run(context) {
      const { seedActionID, username, pin } = context.testData;
      await context.origin.seedAccount(
        { username, pin, actionID: seedActionID },
        { signal: context.signal }
      );
      await context.origin.waitForActionExactlyOnce(seedActionID, {
        kind: 'register',
        signal: context.signal
      });
      const { actionID } = await prepareForm(context, 'login');
      const loginSuccessBefore = await context.origin.readCounter('login_success_total', {
        signal: context.signal
      });
      const loginFailureBefore = await context.origin.readCounter('login_failure_total', {
        signal: context.signal
      });
      await typePIN(context, pin, { deterministic, submitWith: 'select' });
      const response = await context.waves.waitForDeckText(`Authenticated as ${username}.`);
      assertVisibleResponse(
        response,
        `Authenticated as ${username}.`,
        'Username and PIN are required'
      );
      context.observe({
        phase: 'response-rendered',
        address: await context.waves.readSanitizedAddress()
      });
      const [receipt] = await Promise.all([
        context.origin.waitForActionExactlyOnce(actionID, {
          kind: 'login',
          signal: context.signal
        }),
        context.origin.waitForExactlyOne('login_success_total', loginSuccessBefore, {
          signal: context.signal
        }),
        context.origin.waitForUnchanged('login_failure_total', loginFailureBefore, {
          signal: context.signal
        })
      ]);
      context.recordAssertion(
        'login response',
        'Login OK rendered for the scenario-owned username'
      );
      context.recordAssertion(
        'correlated login receipt',
        `one login POST remained stable through ${receipt.quiescenceMs}ms derived retry-horizon quiescence`
      );
      context.recordAssertion(
        'login aggregate metrics',
        'login_success_total increased by exactly one while login_failure_total remained unchanged'
      );
      context.observe({
        phase: 'origin-confirmed',
        address: await context.waves.readSanitizedAddress()
      });

      await context.waves.pressSoftkey('select');
      await context.waves.waitForDeckText(`Welcome, ${username}`);
      await context.waves.withEphemeralAddress(async (portalAddress) => {
        await context.waves.pressSoftkey('down');
        await context.waves.pressSoftkey('down');
        await context.waves.pressSoftkey('select');
        await context.waves.waitForDeckText('Your session has ended.');
        await context.origin.verifySessionInvalidated(portalAddress, { signal: context.signal });
      });
      await context.waves.openWapUrl('wap://localhost/');
      await context.waves.waitForDeckText('Local WAP training environment.');
      const safeAddress = await context.waves.waitForAddress('wap://localhost/');
      context.recordAssertion(
        'session invalidation',
        'the protected portal was usable and its session was rejected after logout'
      );
      context.observe({ phase: 'session-invalidated', address: safeAddress });
    }
  });
}

export const AUTHENTICATION_SCENARIOS = Object.freeze([
  registration({
    id: 'AUTH-NATIVE-001A',
    name: 'Registration preserves same-task final character before Enter',
    deterministic: true
  }),
  registration({
    id: 'AUTH-NATIVE-001B',
    name: 'Registration submits through ordinary WebDriver Enter',
    deterministic: false
  }),
  login({
    id: 'AUTH-NATIVE-002A',
    name: 'Login preserves same-task final character before Select',
    deterministic: true
  }),
  login({
    id: 'AUTH-NATIVE-002B',
    name: 'Login submits through the physical Select control',
    deterministic: false
  })
]);
