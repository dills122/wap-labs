import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

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
    const { status, acknowledgementMs } = await context.waves.stopNavigationMeasured();
    assert.match(status, /Navigation stopped\./);
    assert.ok(acknowledgementMs < 500, `Stop acknowledgement took ${acknowledgementMs}ms`);
    context.recordAssertion('Stop acknowledgement', 'Stop was acknowledged within 500ms');

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

const backDuringNavigation = Object.freeze({
  id: 'RACE-NATIVE-003',
  suite: 'smoke',
  name: 'Back interrupts a slow request and restores the previous deck',
  secretBearing: false,
  async run(context) {
    const actionID = 'race-native-003-a1';
    await prepare(context);
    await loadHome(context);
    await context.waves.openWapUrl('wap://localhost/examples/interop-check.wml');
    await context.waves.waitForDeckText('W13-A');
    await startObservedSlowNavigation(context, actionID);
    const startedAt = performance.now();
    await context.waves.goBack();
    await context.waves.waitForDeckText('Local WAP training environment.');
    assert.ok(performance.now() - startedAt < 2000, 'Back must recover before the slow response');
    await context.waves.waitForAddress('wap://localhost/');
    await context.origin.waitForActionSettledExactlyOnce(actionID, {
      kind: 'navigation', phases: ['success', 'cancelled'], signal: context.signal
    });
    await context.waves.waitForDeckText('Local WAP training environment.');
    await context.waves.waitForAddress('wap://localhost/');
    context.observe({ phase: 'recovered', address: 'wap://localhost/' });
    context.recordAssertion('Back interrupts slow navigation', 'Back restored the prior deck and the late response did not replace it');
  }
});

const replaceSlowNavigations = Object.freeze({
  id: 'RACE-NATIVE-004',
  suite: 'smoke',
  name: 'New addresses supersede slow requests and recover',
  secretBearing: false,
  async run(context) {
    const first = 'race-native-004-a1';
    const second = 'race-native-004-a2';
    await prepare(context);
    await loadHome(context);
    await startObservedSlowNavigation(context, first);
    let startedAt = performance.now();
    await context.waves.replaceWapUrl(`wap://localhost/e2e/navigation/${second}/slow.wml`);
    await context.origin.waitForActionPhase(second, { kind: 'navigation', phase: 'received', signal: context.signal });
    assert.ok(performance.now() - startedAt < 2000, 'replacement request must start before the slow response');
    const address = 'wap://localhost/examples/interop-check.wml';
    startedAt = performance.now();
    await context.waves.replaceWapUrl(address);
    await context.waves.waitForDeckText('W13-A');
    assert.ok(performance.now() - startedAt < 2000, 'the newest address must load before the slow response');
    await context.waves.waitForAddress(address);
    for (const actionID of [first, second]) {
      await context.origin.waitForActionSettledExactlyOnce(actionID, {
        kind: 'navigation', phases: ['success', 'cancelled'], signal: context.signal
      });
    }
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(address);
    context.observe({ phase: 'recovered', address });
    context.recordAssertion('new address supersedes slow navigations', 'the newest deck remained visible after both slow requests settled');
  }
});

async function startObservedSlowHttp(context, actionID, replace = false) {
  const address = context.origin.controlledNavigationUrl(actionID);
  if (replace) await context.waves.replaceControlledHttpUrl(address);
  else await context.waves.startControlledHttpUrl(address);
  context.observe({ phase: 'ui-dispatched' });
  await context.origin.waitForActionPhase(actionID, {
    kind: 'navigation',
    phase: 'received',
    signal: context.signal
  });
  context.observe({ phase: 'origin-confirmed' });
}

async function settleSlowHttp(context, actionID) {
  return context.origin.waitForActionSettledExactlyOnce(actionID, {
    kind: 'navigation',
    phases: ['success', 'cancelled'],
    signal: context.signal
  });
}

const httpStop = Object.freeze({
  id: 'HTTP-NATIVE-001',
  suite: 'smoke',
  name: 'Direct HTTP Stop preserves the deck and recovers',
  secretBearing: false,
  async run(context) {
    const actionID = 'http-native-001-a1';
    await prepare(context);
    await loadHome(context);
    await startObservedSlowHttp(context, actionID);
    const start = performance.now();
    assert.match(await context.waves.stopNavigation(), /Navigation stopped\./);
    context.observe({ phase: 'recovery-ready' });
    assert.ok(performance.now() - start < 2000, 'HTTP Stop must finish before the slow response');
    await context.origin.waitForActionPhase(actionID, {
      kind: 'navigation', phase: 'cancelled', signal: context.signal
    });
    assert.ok(performance.now() - start < 2500, 'origin must observe HTTP cancellation before the slow response');
    context.observe({ phase: 'origin-confirmed' });
    await context.waves.waitForDeckText('Local WAP training environment.');
    const address = context.origin.controlledRecoveryUrl();
    await context.waves.openControlledHttpUrl(address);
    context.observe({ phase: 'recovery-dispatched' });
    await context.waves.waitForDeckText('W13-A');
    context.observe({ phase: 'response-rendered' });
    await context.waves.waitForAddress(address);
    assert.ok(performance.now() - start < 2500, 'Stop and recovery must finish before the slow response');
    await settleSlowHttp(context, actionID);
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(address);
    context.observe({ phase: 'recovered' });
    context.recordAssertion(
      'direct HTTP Stop recovery',
      'the newer deck survived the cancelled HTTP request'
    );
  }
});

const httpBodyStop = Object.freeze({
  id: 'HTTP-NATIVE-004',
  suite: 'smoke',
  name: 'Direct HTTP Stop recovers from a stalled response body',
  secretBearing: false,
  async run(context) {
    const actionID = 'http-native-004-a1';
    await prepare(context);
    await loadHome(context);
    const address = context.origin.controlledNavigationUrl(actionID, 'body');
    await context.waves.startControlledHttpUrl(address);
    context.observe({ phase: 'ui-dispatched' });
    await context.origin.waitForActionPhase(actionID, {
      kind: 'navigation', phase: 'body_started', signal: context.signal
    });
    context.observe({ phase: 'origin-confirmed' });
    const start = performance.now();
    // Allow the production HTTP client to consume the flushed prefix before Stop.
    await delay(150, undefined, { signal: context.signal });
    assert.match(await context.waves.stopNavigation(), /Navigation stopped\./);
    context.observe({ phase: 'recovery-ready' });
    await context.origin.waitForActionPhase(actionID, {
      kind: 'navigation', phase: 'cancelled', signal: context.signal
    });
    assert.ok(performance.now() - start < 2500, 'origin must observe body cancellation before the slow response');
    context.observe({ phase: 'origin-confirmed' });
    await context.waves.waitForDeckText('Local WAP training environment.');
    const recovery = context.origin.controlledRecoveryUrl();
    await context.waves.openControlledHttpUrl(recovery);
    context.observe({ phase: 'recovery-dispatched' });
    await context.waves.waitForDeckText('W13-A');
    context.observe({ phase: 'response-rendered' });
    await context.waves.waitForAddress(recovery);
    assert.ok(performance.now() - start < 2500, 'body Stop and recovery must finish before the slow response');
    await settleSlowHttp(context, actionID);
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(recovery);
    context.observe({ phase: 'recovered' });
    context.recordAssertion('direct HTTP body Stop recovery', 'the newer deck survived the cancelled partial response');
  }
});

const httpBack = Object.freeze({
  id: 'HTTP-NATIVE-002',
  suite: 'smoke',
  name: 'Direct HTTP Back interrupts a slow request',
  secretBearing: false,
  async run(context) {
    const actionID = 'http-native-002-a1';
    await prepare(context);
    await loadHome(context);
    await context.waves.openWapUrl('wap://localhost/examples/interop-check.wml');
    await context.waves.waitForDeckText('W13-A');
    await startObservedSlowHttp(context, actionID);
    const start = performance.now();
    await context.waves.goBack();
    context.observe({ phase: 'recovery-dispatched' });
    await context.waves.waitForDeckText('Local WAP training environment.');
    assert.ok(performance.now() - start < 2000, 'HTTP Back must recover before the slow response');
    await settleSlowHttp(context, actionID);
    await context.waves.waitForDeckText('Local WAP training environment.');
    await context.waves.waitForAddress('wap://localhost/');
    context.observe({ phase: 'recovered' });
    context.recordAssertion(
      'direct HTTP Back recovery',
      'Back restored the previous deck after HTTP cancellation'
    );
  }
});

const httpReplacement = Object.freeze({
  id: 'HTTP-NATIVE-003',
  suite: 'smoke',
  name: 'Direct HTTP replacement survives two slow requests',
  secretBearing: false,
  async run(context) {
    const first = 'http-native-003-a1';
    const second = 'http-native-003-a2';
    await prepare(context);
    await loadHome(context);
    await startObservedSlowHttp(context, first);
    let start = performance.now();
    await startObservedSlowHttp(context, second, true);
    assert.ok(
      performance.now() - start < 2000,
      'second HTTP request must start before the first response'
    );
    const address = context.origin.controlledRecoveryUrl();
    start = performance.now();
    await context.waves.replaceControlledHttpUrl(address);
    context.observe({ phase: 'recovery-dispatched' });
    await context.waves.waitForDeckText('W13-A');
    context.observe({ phase: 'response-rendered' });
    assert.ok(
      performance.now() - start < 2000,
      'newest HTTP address must load before the slow response'
    );
    await context.waves.waitForAddress(address);
    await settleSlowHttp(context, first);
    await settleSlowHttp(context, second);
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(address);
    context.observe({ phase: 'recovered' });
    context.recordAssertion(
      'direct HTTP replacement recovery',
      'the newest HTTP deck survived both cancelled requests'
    );
  }
});

function responseFailure({ id, mode, direct, title }) {
  const actionID = `${id.toLowerCase()}-a1`;
  return Object.freeze({
    id,
    suite: 'smoke',
    name: `${direct ? 'Direct HTTP' : 'Kannel'} ${mode} response preserves the deck and recovers`,
    secretBearing: false,
    async run(context) {
      await prepare(context);
      await loadHome(context);
      const prior = await context.waves.waitForDeckText('Local WAP training environment.');
      const address = direct
        ? context.origin.controlledFailureUrl(actionID, mode)
        : `wap://localhost/e2e/navigation/${actionID}/${mode}.wmlc`;
      if (direct) await context.waves.openControlledHttpUrl(address);
      else await context.waves.openWapUrl(address);
      context.observe({ phase: 'ui-dispatched' });
      const status = await context.waves.waitForStatus('Fetch failed:');
      assert.equal(status.displayed, true, 'failure status must be visible');
      assert.equal(status.tone, 'error', 'failure status must use the error tone');
      context.observe({ phase: 'response-rendered' });
      const failure = await context.waves.readNavigationFailure();
      assert.equal(failure.displayed, true, 'failure category must be visible');
      context.observe({ phase: 'recovery-ready' });
      const categoryPhase = {
        'gateway · PROTOCOL_ERROR': 'failure-protocol',
        'connection · TRANSPORT_UNAVAILABLE': 'failure-connection',
        'gateway · GATEWAY_TIMEOUT': 'failure-timeout'
      }[failure.title] ?? 'failure-other';
      context.observe({ phase: categoryPhase });
      assert.ok([title].flat().includes(failure.title), `unexpected failure category: ${failure.title}`);
      assert.match(failure.correlation, /^Request \S+$/);
      context.observe({ phase: 'engine-ready' });
      assert.equal(await context.waves.waitForDeckText('Local WAP training environment.'), prior,
        'failure must preserve the committed viewport');
      context.observe({ phase: 'deck-ready' });
      await context.origin.waitForActionSettledWithinBound(actionID, {
        kind: 'navigation', phases: ['success'], maxCount: 2, signal: context.signal
      });
      context.observe({ phase: 'origin-confirmed' });
      const recovery = direct ? context.origin.controlledRecoveryUrl() : 'wap://localhost/examples/interop-check.wml';
      if (direct) await context.waves.openControlledHttpUrl(recovery);
      else await context.waves.openWapUrl(recovery);
      context.observe({ phase: 'recovery-dispatched' });
      await context.waves.waitForDeckText('W13-A');
      await context.waves.waitForAddress(recovery);
      await context.waves.goBack();
      assert.equal(await context.waves.waitForDeckText('Local WAP training environment.'), prior,
        'Back must skip the failed navigation');
      await context.waves.waitForAddress('wap://localhost/');
      context.observe({ phase: 'recovered' });
      context.recordAssertion('response failure recovery', 'the correlated failure retained the previous deck and a later navigation succeeded');
    }
  });
}

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

const invalidDeck = Object.freeze({
  id: 'ERR-NATIVE-003',
  suite: 'smoke',
  name: 'Invalid WML deck preserves the current card and permits recovery',
  secretBearing: false,
  async run(context) {
    const actionID = 'invalid-deck-a1';
    await prepare(context);
    await loadHome(context);
    const priorText = await context.waves.waitForDeckText('Local WAP training environment.');
    const invalidAddress = `wap://localhost/e2e/navigation/${actionID}/invalid.wmlc`;
    await context.waves.openWapUrl(invalidAddress);
    context.observe({ phase: 'ui-dispatched', address: invalidAddress });
    const status = await context.waves.waitForStatus('Deck parse failed:');
    assert.equal(status.displayed, true, 'invalid deck status must be visible');
    assert.equal(status.tone, 'error', 'invalid deck status must use the visible error tone');
    const retainedText = await context.waves.waitForDeckText('Local WAP training environment.');
    assert.equal(retainedText, priorText, 'invalid deck must preserve the committed viewport');
    const settled = await context.origin.waitForActionSettledExactlyOnce(actionID, {
      kind: 'navigation',
      phases: ['success'],
      signal: context.signal
    });
    assert.equal(await context.waves.waitForDeckText('Local WAP training environment.'), priorText);
    context.observe({ phase: 'origin-confirmed', address: invalidAddress });
    context.recordAssertion(
      'invalid deck rejection',
      `the invalid deck was rejected and the prior viewport remained unchanged after ${settled.quiescenceMs}ms quiescence`
    );

    const recoveryAddress = 'wap://localhost/examples/interop-check.wml';
    context.observe({ phase: 'recovery-ready' });
    await context.waves.openWapUrl(recoveryAddress);
    context.observe({ phase: 'recovery-dispatched', address: recoveryAddress });
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(recoveryAddress);
    context.observe({ phase: 'recovered', address: recoveryAddress });
    context.recordAssertion(
      'invalid deck recovery',
      'a later native navigation loaded a valid deck'
    );
  }
});

const timeoutRecovery = Object.freeze({
  id: 'ERR-NATIVE-004',
  suite: 'smoke',
  name: 'Gateway timeout preserves the current deck and permits recovery',
  secretBearing: false,
  async run(context) {
    const actionID = 'timeout-native-004-a1';
    const address = `wap://localhost/e2e/navigation/${actionID}/timeout.wml`;
    await prepare(context);
    await loadHome(context);
    const priorText = await context.waves.waitForDeckText('Local WAP training environment.');
    await context.waves.startWapUrl(address);
    context.observe({ phase: 'ui-dispatched', address });
    await context.origin.waitForActionPhase(actionID, { kind: 'navigation', phase: 'received', signal: context.signal });
    const status = await context.waves.waitForStatus('Fetch failed:');
    assert.equal(status.displayed, true, 'timeout status must be visible');
    assert.equal(status.tone, 'error', 'timeout status must use the visible error tone');
    context.recordAssertion('native timeout status', 'the timeout produced a visible error status');
    const failure = await context.waves.readNavigationFailure();
    assert.equal(failure.displayed, true, 'timeout category and correlation must be visible');
    assert.equal(failure.title, 'gateway · GATEWAY_TIMEOUT');
    assert.match(failure.correlation, /^Request \S+$/, 'timeout must retain a request correlation ID');
    context.recordAssertion('native timeout category', 'the visible error identifies a correlated gateway timeout');
    assert.equal(await context.waves.waitForDeckText('Local WAP training environment.'), priorText, 'timeout must preserve the committed viewport');
    context.recordAssertion('native timeout frame', 'the previous viewport was retained');
    const action = await context.origin.readAction(actionID, { signal: context.signal });
    assert.equal(action.kind, 'navigation');
    assert.ok(action.count >= 1 && action.count <= 2, 'origin requests must stay within the production attempt bound');
    context.observe({ phase: 'origin-confirmed', address });
    context.recordAssertion('native timeout rejection', 'the correlated gateway timeout preserved the prior viewport');
    const recoveryAddress = 'wap://localhost/examples/interop-check.wml';
    context.observe({ phase: 'recovery-ready' });
    await context.waves.openWapUrl(recoveryAddress);
    context.observe({ phase: 'recovery-dispatched', address: recoveryAddress });
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(recoveryAddress);
    await context.origin.waitForActionSettledWithinBound(actionID, {
      kind: 'navigation', phases: ['success', 'cancelled'], maxCount: 2, signal: context.signal
    });
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(recoveryAddress);
    context.observe({ phase: 'recovered', address: recoveryAddress });
    context.recordAssertion('native timeout recovery', 'a later native navigation loaded a valid deck');
  }
});

const scriptFailure = Object.freeze({
  id: 'ERR-NATIVE-005',
  suite: 'smoke',
  name: 'Missing WMLScript reports a visible error and recovers',
  secretBearing: false,
  async run(context) {
    const actionID = 'script-native-001-a1';
    const address = `wap://localhost/e2e/navigation/${actionID}/script-failure.wml`;
    await prepare(context);
    await loadHome(context);
    await context.waves.openWapUrl(address);
    const prior = await context.waves.waitForDeckText('Script failure fixture');
    await context.waves.waitForAddress(address);
    context.observe({ phase: 'deck-ready' });
    await context.waves.pressSoftkey('select');
    context.observe({ phase: 'ui-dispatched' });
    assert.match(await context.waves.waitForScriptFailure(), /script unit not registered/);
    assert.equal(await context.waves.waitForDeckText('Script failure fixture'), prior,
      'script failure must preserve the committed deck');
    await context.waves.waitForAddress(address);
    context.observe({ phase: 'response-rendered' });
    await context.origin.waitForActionSettledExactlyOnce(actionID, {
      kind: 'navigation', phases: ['success'], signal: context.signal
    });
    await context.waves.waitForScriptFailureDismissed();
    await context.waves.waitForDeckText('Script failure fixture');
    context.observe({ phase: 'origin-confirmed' });
    const recovery = 'wap://localhost/examples/interop-check.wml';
    await context.waves.openWapUrl(recovery);
    context.observe({ phase: 'recovery-dispatched' });
    await context.waves.waitForDeckText('W13-A');
    await context.waves.waitForAddress(recovery);
    context.observe({ phase: 'recovered' });
    context.recordAssertion('native script failure recovery',
      'the visible missing-unit error retained the deck and a later gateway navigation succeeded');
  }
});

export const RESILIENCE_SCENARIOS = Object.freeze([
  staleNavigation,
  explicitStop,
  backDuringNavigation,
  replaceSlowNavigations,
  httpStop,
  httpBack,
  httpReplacement,
  httpBodyStop,
  responseFailure({ id: 'FAIL-NATIVE-001', mode: 'interrupted', direct: true, title: 'connection · TRANSPORT_UNAVAILABLE' }),
  responseFailure({ id: 'FAIL-NATIVE-002', mode: 'oversized', direct: true, title: 'response · PAYLOAD_TOO_LARGE' }),
  responseFailure({ id: 'FAIL-NATIVE-003', mode: 'interrupted', direct: false, title: ['gateway · PROTOCOL_ERROR', 'connection · TRANSPORT_UNAVAILABLE'] }),
  responseFailure({ id: 'FAIL-NATIVE-004', mode: 'oversized', direct: false, title: 'gateway · GATEWAY_TIMEOUT' }),
  gatewayOutage,
  invalidDeck,
  timeoutRecovery,
  scriptFailure
]);
