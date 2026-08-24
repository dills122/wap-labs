import assert from 'node:assert/strict';

async function prepareForm(context, kind) {
  const { actionID, username, pin } = context.testData;
  await context.waves.launchWaves();
  await context.waves.dismissWelcome();
  await context.waves.openWapUrl(`wap://localhost/${kind}?e2e_action=${actionID}`);
  await context.waves.waitForDeckText(kind === 'register' ? 'Create account' : 'Enter username');
  await context.waves.focusViewport();
  await context.waves.typeText(username);
  await context.waves.waitForDeckText(username);
  await context.waves.pressKeyboardKey('ArrowDown');
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
}

function registration({ id, name, deterministic }) {
  return Object.freeze({
    id,
    suite: 'smoke',
    name,
    secretBearing: true,
    async run(context) {
      const { actionID, username, pin } = await prepareForm(context, 'register');
      await typePIN(context, pin, { deterministic, submitWith: 'enter' });
      const response = await context.waves.waitForDeckText('Registration OK');
      assert.match(response, new RegExp(`User ${username} created\\.`));
      assert.doesNotMatch(response, /Username and PIN are required/);
      const receipt = await context.origin.waitForActionExactlyOnce(actionID, { kind: 'register' });
      context.recordAssertion(
        'registration response',
        'Registration OK rendered for the scenario-owned username'
      );
      context.recordAssertion(
        'correlated registration receipt',
        `one register POST remained stable through ${receipt.quiescenceMs}ms measured quiescence`
      );
      context.observe({ phase: 'authenticated-response', address: await context.waves.readSanitizedAddress() });
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
      await context.origin.seedAccount({ username, pin, actionID: seedActionID });
      await context.origin.waitForActionExactlyOnce(seedActionID, { kind: 'register' });
      const { actionID } = await prepareForm(context, 'login');
      await typePIN(context, pin, { deterministic, submitWith: 'select' });
      const response = await context.waves.waitForDeckText('Login OK');
      assert.match(response, new RegExp(`Authenticated as ${username}\\.`));
      assert.doesNotMatch(response, /Username and PIN are required/);
      const receipt = await context.origin.waitForActionExactlyOnce(actionID, { kind: 'login' });
      context.recordAssertion('login response', 'Login OK rendered for the scenario-owned username');
      context.recordAssertion(
        'correlated login receipt',
        `one login POST remained stable through ${receipt.quiescenceMs}ms measured quiescence`
      );

      await context.waves.pressSoftkey('select');
      await context.waves.waitForDeckText(`Welcome, ${username}`);
      await context.waves.withEphemeralAddress(async (portalAddress) => {
        await context.waves.pressSoftkey('down');
        await context.waves.pressSoftkey('down');
        await context.waves.pressSoftkey('select');
        await context.waves.waitForDeckText('Your session has ended.');
        await context.origin.verifySessionInvalidated(portalAddress);
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
