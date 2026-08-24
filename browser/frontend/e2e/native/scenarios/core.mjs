import assert from 'node:assert/strict';

async function prepare(context) {
  await context.waves.launchWaves();
  await context.waves.dismissWelcome();
}

function pass(context, name, details) {
  context.recordAssertion(name, details);
}

const boot = Object.freeze({
  id: 'BOOT-NATIVE-001',
  suite: 'smoke',
  name: 'Cold native launch reaches network-ready state',
  secretBearing: false,
  async run(context) {
    await prepare(context);
    context.observe({ phase: 'engine-ready' });
    pass(context, 'native startup', 'production frontend reached a ready boot phase in Network mode');
  }
});

const transport = Object.freeze({
  id: 'TRN-NATIVE-001',
  suite: 'smoke',
  name: 'Gateway home deck renders through the native transport',
  secretBearing: false,
  async run(context) {
    await prepare(context);
    await context.waves.openWapUrl('wap://localhost/');
    const text = await context.waves.waitForDeckText('Local WAP training environment.');
    assert.match(text, /Open Menu/);
    const address = await context.waves.waitForAddress('wap://localhost/');
    context.observe({ phase: 'deck-ready', address });
    pass(context, 'gateway deck render', 'canonical gateway home rendered through native WSP/WBXML');
  }
});

const navigation = Object.freeze({
  id: 'NAV-NATIVE-001',
  suite: 'smoke',
  name: 'Card and external-deck navigation use production softkeys',
  secretBearing: false,
  async run(context) {
    await prepare(context);
    await context.waves.openWapUrl('wap://localhost/');
    await context.waves.waitForDeckText('Open Menu');
    await context.waves.pressSoftkey('select');
    const menu = await context.waves.waitForDeckText('1. Login');
    assert.match(menu, /2\. Register/);
    for (let index = 0; index < 3; index += 1) {
      await context.waves.pressSoftkey('down');
    }
    await context.waves.pressSoftkey('select');
    const example = await context.waves.waitForDeckText('This is a static WML');
    assert.match(example, /sample deck\./);
    const address = await context.waves.waitForAddress('wap://localhost/examples/index.wml');
    context.observe({ phase: 'deck-ready', address });
    pass(context, 'visible navigation', 'card navigation and external deck load completed through softkeys');
  }
});

const errorRecovery = Object.freeze({
  id: 'ERR-NATIVE-001',
  suite: 'smoke',
  name: 'Invalid address failure is visible and recoverable',
  secretBearing: false,
  async run(context) {
    await prepare(context);
    await context.waves.openWapUrl('wap://localhost/');
    await context.waves.waitForDeckText('Local WAP training environment.');
    await context.waves.submitAddress('not a url');
    const status = await context.waves.waitForStatus('Fetch failed:');
    assert.equal(status.displayed, true, 'invalid request status must be visible');
    assert.equal(status.tone, 'error', 'invalid request status must use the visible error tone');
    assert.match(status.text, /INVALID_REQUEST|invalid|URL/i);
    pass(context, 'deterministic failure', 'invalid address surfaced a bounded visible error');
    await context.waves.openWapUrl('wap://localhost/');
    await context.waves.waitForDeckText('Local WAP training environment.');
    const address = await context.waves.waitForAddress('wap://localhost/');
    context.observe({ phase: 'recovered', address });
    pass(context, 'failure recovery', 'a later native gateway load restored the canonical home deck');
  }
});

const requestBound = Object.freeze({
  id: 'REQ-NATIVE-001',
  suite: 'smoke',
  name: 'One navigation action produces one origin request',
  secretBearing: false,
  async run(context) {
    await prepare(context);
    await context.waves.openWapUrl('wap://localhost/examples/interop-check.wml');
    await context.waves.waitForDeckText('W13-A');
    const before = await context.origin.readCounter('requests_total');
    await context.waves.pressSoftkey('select');
    await context.waves.waitForAddress('wap://localhost/examples/interop-check.wml');
    await context.waves.waitForDeckText('W13-A');
    const result = await context.origin.waitForExactlyOne('requests_total', before);
    pass(
      context,
      'successful navigation request bound',
      `one navigation produced one origin request through ${result.quiescenceMs}ms measured quiescence`
    );
  }
});

export const CORE_SCENARIOS = Object.freeze([
  boot,
  transport,
  navigation,
  errorRecovery,
  requestBound
]);
