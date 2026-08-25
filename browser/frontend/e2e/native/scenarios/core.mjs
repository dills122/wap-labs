import assert from 'node:assert/strict';

async function prepare(context) {
  await context.waves.launchWaves();
  await context.waves.dismissWelcome();
  context.observe({ phase: 'engine-ready' });
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
    pass(
      context,
      'native startup',
      'production frontend reached a ready boot phase in Network mode'
    );
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
    context.observe({ phase: 'deck-ready', address: await context.waves.readSanitizedAddress() });
    assert.match(text, /Open Menu/);
    await context.waves.waitForAddress('wap://localhost/');
    pass(
      context,
      'gateway deck render',
      'canonical gateway home rendered through native WSP/WBXML'
    );
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
    context.observe({ phase: 'deck-ready', address: await context.waves.readSanitizedAddress() });
    await context.waves.pressSoftkey('select');
    context.observe({ phase: 'ui-dispatched' });
    const menu = await context.waves.waitForDeckText('1. Login');
    assert.match(menu, /2\. Register/);
    for (let index = 0; index < 3; index += 1) {
      await context.waves.pressSoftkey('down');
    }
    await context.waves.pressSoftkey('select');
    const example = await context.waves.waitForDeckText('This is a static WML');
    assert.match(example, /sample deck\./);
    const address = await context.waves.waitForAddress('wap://localhost/examples/index.wml');
    context.observe({ phase: 'response-rendered', address });
    pass(
      context,
      'visible navigation',
      'card navigation and external deck load completed through softkeys'
    );
  }
});

const hybridBack = Object.freeze({
  id: 'NAV-NATIVE-002',
  suite: 'smoke',
  name: 'Back restores host deck history before same-deck card history',
  secretBearing: false,
  async run(context) {
    await prepare(context);
    await context.waves.openWapUrl('wap://localhost/');
    await context.waves.waitForDeckText('Open Menu');
    await context.waves.pressSoftkey('select');
    await context.waves.waitForDeckText('1. Login');
    for (let index = 0; index < 3; index += 1) {
      await context.waves.pressSoftkey('down');
    }
    await context.waves.pressSoftkey('select');
    await context.waves.waitForDeckText('This is a static WML');
    await context.waves.waitForAddress('wap://localhost/examples/index.wml');
    const before = await context.origin.readCounter('requests_total', {
      signal: context.signal
    });

    await context.waves.goBack();
    await context.waves.waitForDeckText('1. Login');
    await context.waves.waitForAddress('wap://localhost/');
    pass(context, 'host Back restore', 'Back restored the prior gateway deck and menu card');

    await context.waves.goBack();
    await context.waves.waitForDeckText('Local WAP training environment.');
    await context.waves.waitForAddress('wap://localhost/');
    const result = await context.origin.waitForExactlyOne('requests_total', before, {
      signal: context.signal
    });
    pass(
      context,
      'hybrid Back request bound',
      `host Back fetched once while same-deck Back stayed local through ${result.quiescenceMs}ms quiescence`
    );
  }
});

const reload = Object.freeze({
  id: 'NAV-NATIVE-003',
  suite: 'smoke',
  name: 'Reload fetches once without duplicating host history',
  secretBearing: false,
  async run(context) {
    await prepare(context);
    await context.waves.openWapUrl('wap://localhost/');
    await context.waves.waitForDeckText('Local WAP training environment.');
    await context.waves.openWapUrl('wap://localhost/examples/interop-check.wml');
    await context.waves.waitForDeckText('W13-A');
    const before = await context.origin.readCounter('requests_total', {
      signal: context.signal
    });

    await context.waves.reload();
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress('wap://localhost/examples/interop-check.wml');
    const result = await context.origin.waitForExactlyOne('requests_total', before, {
      signal: context.signal
    });
    pass(
      context,
      'Reload request bound',
      `Reload produced one origin request through ${result.quiescenceMs}ms quiescence`
    );

    await context.waves.goBack();
    await context.waves.waitForDeckText('Local WAP training environment.');
    await context.waves.waitForAddress('wap://localhost/');
    pass(
      context,
      'Reload history integrity',
      'one Back returned to the prior deck instead of a duplicate reloaded entry'
    );
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
    context.observe({ phase: 'deck-ready', address: await context.waves.readSanitizedAddress() });
    await context.waves.submitAddress('not a url');
    context.observe({ phase: 'ui-dispatched' });
    const status = await context.waves.waitForStatus('Fetch failed:');
    assert.equal(status.displayed, true, 'invalid request status must be visible');
    assert.equal(status.tone, 'error', 'invalid request status must use the visible error tone');
    assert.match(status.text, /INVALID_REQUEST|invalid|URL/i);
    context.observe({ phase: 'response-rendered' });
    pass(context, 'deterministic failure', 'invalid address surfaced a bounded visible error');
    context.observe({ phase: 'recovery-ready' });
    await context.waves.openWapUrl('wap://localhost/');
    context.observe({ phase: 'recovery-dispatched' });
    await context.waves.waitForDeckText('Local WAP training environment.');
    const address = await context.waves.waitForAddress('wap://localhost/');
    context.observe({ phase: 'recovered', address });
    pass(
      context,
      'failure recovery',
      'a later native gateway load restored the canonical home deck'
    );
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
    context.observe({ phase: 'deck-ready', address: await context.waves.readSanitizedAddress() });
    const before = await context.origin.readCounter('requests_total', { signal: context.signal });
    await context.waves.pressSoftkey('select');
    context.observe({ phase: 'ui-dispatched' });
    await context.waves.waitForAddress('wap://localhost/examples/interop-check.wml');
    await context.waves.waitForDeckText('W13-A');
    context.observe({
      phase: 'response-rendered',
      address: await context.waves.readSanitizedAddress()
    });
    const result = await context.origin.waitForExactlyOne('requests_total', before, {
      signal: context.signal
    });
    context.observe({
      phase: 'origin-confirmed',
      address: await context.waves.readSanitizedAddress()
    });
    pass(
      context,
      'successful navigation request bound',
      `one navigation produced one origin request through ${result.quiescenceMs}ms derived retry-horizon quiescence`
    );
  }
});

export const CORE_SCENARIOS = Object.freeze([
  boot,
  transport,
  navigation,
  hybridBack,
  reload,
  errorRecovery,
  requestBound
]);
