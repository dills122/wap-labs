import assert from 'node:assert/strict';

async function prepare(context) {
  await context.waves.launchWaves();
  await context.waves.dismissWelcome();
  context.observe({ phase: 'engine-ready' });
}

async function loadHome(context) {
  await context.waves.openWapUrl('wap://localhost/');
  await context.waves.waitForDeckText('Local WAP training environment.');
  const address = await context.waves.waitForAddress('wap://localhost/');
  context.observe({ phase: 'deck-ready', address });
}

async function startObservedSlowNavigation(context, actionID) {
  await context.waves.startWapUrl(
    `wap://localhost/e2e/navigation/${actionID}/slow.wml`
  );
  context.observe({ phase: 'ui-dispatched' });
  await context.origin.waitForActionPhase(actionID, {
    kind: 'navigation',
    phase: 'received',
    signal: context.signal
  });
}

const staleNavigation = Object.freeze({
  id: 'RACE-NATIVE-001',
  suite: 'smoke',
  name: 'Cancelled slow navigation cannot overwrite a newer deck',
  secretBearing: false,
  async run(context) {
    const actionID = 'race-native-001-a1';
    await prepare(context);
    await loadHome(context);
    await startObservedSlowNavigation(context, actionID);
    await context.waves.stopNavigation();

    const fastAddress = 'wap://localhost/examples/interop-check.wml';
    await context.waves.openWapUrl(fastAddress);
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(fastAddress);
    context.observe({ phase: 'response-rendered', address: fastAddress });

    const settled = await context.origin.waitForActionSettledExactlyOnce(actionID, {
      kind: 'navigation',
      phases: ['success', 'cancelled'],
      signal: context.signal
    });
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(fastAddress);
    context.observe({ phase: 'origin-confirmed', address: fastAddress });
    context.recordAssertion(
      'stale navigation exclusion',
      `the newer deck remained visible after the slow request reached ${settled.phase} and ${settled.quiescenceMs}ms quiescence`
    );
  }
});

const explicitStop = Object.freeze({
  id: 'RACE-NATIVE-002',
  suite: 'smoke',
  name: 'Stop preserves the current deck and permits recovery',
  secretBearing: false,
  async run(context) {
    const actionID = 'race-native-002-a1';
    await prepare(context);
    await loadHome(context);
    await startObservedSlowNavigation(context, actionID);
    const status = await context.waves.stopNavigation();
    assert.match(status, /Navigation stopped\./);

    const settled = await context.origin.waitForActionSettledExactlyOnce(actionID, {
      kind: 'navigation',
      phases: ['success', 'cancelled'],
      signal: context.signal
    });
    await context.waves.waitForDeckText('Local WAP training environment.');
    await context.waves.waitForAddress('wap://localhost/');
    context.observe({ phase: 'response-rendered', address: 'wap://localhost/' });
    context.recordAssertion(
      'Stop preserves deck',
      `Stop retained the prior deck after the request reached ${settled.phase}`
    );

    const recoveryAddress = 'wap://localhost/examples/interop-check.wml';
    context.observe({ phase: 'recovery-ready', address: 'wap://localhost/' });
    await context.waves.openWapUrl(recoveryAddress);
    context.observe({ phase: 'recovery-dispatched', address: recoveryAddress });
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(recoveryAddress);
    context.observe({ phase: 'recovered', address: recoveryAddress });
    context.recordAssertion(
      'Stop recovery',
      'a later native navigation completed after explicit cancellation'
    );
  }
});

const gatewayOutage = Object.freeze({
  id: 'ERR-NATIVE-002',
  suite: 'smoke',
  name: 'Real gateway outage is visible and restart recovers',
  secretBearing: false,
  async run(context) {
    await prepare(context);
    await loadHome(context);

    await context.infrastructure.withGatewayStopped(async () => {
      await context.waves.openWapUrl(
        'wap://localhost/examples/index.wml?gateway-outage=err-native-002'
      );
      context.observe({ phase: 'ui-dispatched' });
      const status = await context.waves.waitForStatus('Fetch failed:');
      assert.equal(status.displayed, true, 'gateway outage status must be visible');
      assert.equal(status.tone, 'error', 'gateway outage status must use the visible error tone');
      await context.waves.waitForDeckText('Local WAP training environment.');
      context.observe({ phase: 'response-rendered' });
      context.recordAssertion(
        'visible gateway outage',
        'the production transport surfaced the stopped owned gateway as a visible error'
      );
    }, { signal: context.signal });

    const recoveryAddress = 'wap://localhost/examples/interop-check.wml';
    context.observe({ phase: 'recovery-ready' });
    await context.waves.openWapUrl(recoveryAddress);
    context.observe({ phase: 'recovery-dispatched', address: recoveryAddress });
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(recoveryAddress);
    context.observe({ phase: 'recovered', address: recoveryAddress });
    context.recordAssertion(
      'gateway restart recovery',
      'the same native browser session loaded a real deck after owned Kannel restarted'
    );
  }
});

export const RESILIENCE_SCENARIOS = Object.freeze([
  staleNavigation,
  explicitStop,
  gatewayOutage
]);
