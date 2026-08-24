const SAFE_ID = /^[A-Z0-9][A-Z0-9-]{0,63}$/;
const MAX_CHECKPOINTS = 16;
const SAFE_PHASES = new Set([
  'engine-ready',
  'deck-ready',
  'recovery-ready',
  'recovery-dispatched',
  'recovered',
  'form-ready',
  'ui-dispatched',
  'response-rendered',
  'origin-confirmed',
  'session-invalidated'
]);

const FAILURE_CLASS_AFTER_PHASE = Object.freeze({
  'engine-ready': 'deck-load',
  'deck-ready': 'scenario-assertion',
  'recovery-ready': 'ui-dispatch',
  'recovery-dispatched': 'response-rendering',
  recovered: 'scenario-assertion',
  'form-ready': 'ui-dispatch',
  'ui-dispatched': 'response-rendering',
  'response-rendered': 'origin-confirmation',
  'origin-confirmed': 'session-lifecycle',
  'session-invalidated': 'scenario-finalization'
});

function errorRecord(error) {
  const value = error instanceof Error ? error : new Error(String(error));
  return { name: value.name, message: value.message };
}

function abortError(signal) {
  const error = new Error('native E2E scenario aborted', { cause: signal?.reason });
  error.name = 'AbortError';
  return error;
}

async function raceWithAbort(operation, signal) {
  if (signal.aborted) throw abortError(signal);
  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(abortError(signal));
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
  try {
    const value = await Promise.race([Promise.resolve().then(operation), aborted]);
    if (signal.aborted) throw abortError(signal);
    return value;
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}

async function waitForSettlement(promise, timeoutMs, setTimer, clearTimer) {
  let timer;
  try {
    return await Promise.race([
      promise.then(
        () => true,
        () => true
      ),
      new Promise((resolve) => {
        timer = setTimer(() => resolve(false), timeoutMs);
      })
    ]);
  } finally {
    clearTimer(timer);
  }
}

function sanitizeAddress(rawAddress) {
  const address = new URL(rawAddress);
  address.username = '';
  address.password = '';
  address.search = '';
  address.hash = '';
  return address.href;
}

function normalizeObservation(observation) {
  if (
    observation === null ||
    typeof observation !== 'object' ||
    !SAFE_PHASES.has(observation.phase)
  ) {
    throw new Error('native E2E observations require a bounded phase');
  }
  const normalized = { phase: observation.phase };
  if (observation.address !== undefined) {
    normalized.address = sanitizeAddress(observation.address);
  }
  return Object.freeze(normalized);
}

function classifyFailure(checkpoints) {
  const phase = checkpoints.at(-1)?.phase;
  return phase ? FAILURE_CLASS_AFTER_PHASE[phase] : 'infrastructure-startup';
}

function validateScenarios(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    throw new Error('native E2E requires at least one scenario');
  }
  const ids = new Set();
  for (const candidate of scenarios) {
    if (!SAFE_ID.test(candidate?.id ?? '')) {
      throw new Error(`invalid native E2E scenario id: ${candidate?.id ?? '<missing>'}`);
    }
    if (ids.has(candidate.id)) {
      throw new Error(`duplicate native E2E scenario id: ${candidate.id}`);
    }
    if (typeof candidate.run !== 'function') {
      throw new Error(`native E2E scenario ${candidate.id} has no run function`);
    }
    ids.add(candidate.id);
  }
}

function cleanupSucceeded(cleanup) {
  if (!cleanup || typeof cleanup !== 'object') {
    return false;
  }
  return !Object.values(cleanup).some((value) =>
    ['close-failed', 'cleanup-failed', 'failed'].includes(value)
  );
}

export async function executeNativeE2EScenarios({
  scenarios,
  createSession,
  onResult = async () => {},
  now = Date.now,
  signal,
  scenarioTimeoutMs = 90_000,
  scenarioDrainTimeoutMs = 5_000,
  cleanupTimeoutMs = 20_000,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout
}) {
  validateScenarios(scenarios);
  if (typeof createSession !== 'function') {
    throw new Error('native E2E requires a session provider');
  }
  if (!Number.isSafeInteger(scenarioTimeoutMs) || scenarioTimeoutMs <= 0) {
    throw new Error('native E2E scenario timeout must be a positive integer');
  }
  if (!Number.isSafeInteger(cleanupTimeoutMs) || cleanupTimeoutMs <= 0) {
    throw new Error('native E2E cleanup timeout must be a positive integer');
  }
  if (!Number.isSafeInteger(scenarioDrainTimeoutMs) || scenarioDrainTimeoutMs <= 0) {
    throw new Error('native E2E scenario drain timeout must be a positive integer');
  }

  const results = [];
  for (const definition of scenarios) {
    if (signal?.aborted) {
      break;
    }
    const startedAt = now();
    let session;
    let failure;
    let cleanup = { result: 'not-started' };
    let lastObservation = null;
    let checkpoints = [];
    let failureClass = null;
    let scenarioOperation;
    let scenarioSettled = true;
    let ownershipReleased = true;
    const scenarioController = new AbortController();
    const relayAbort = () => scenarioController.abort(signal?.reason);
    signal?.addEventListener('abort', relayAbort, { once: true });
    if (signal?.aborted) relayAbort();
    const scenarioTimer = setTimer(
      () => scenarioController.abort(new Error('native E2E scenario deadline exceeded')),
      scenarioTimeoutMs
    );
    const scenarioSignal = scenarioController.signal;
    try {
      session = await createSession(definition, { signal: scenarioSignal });
      if (scenarioSignal.aborted) throw abortError(scenarioSignal);
      scenarioOperation = Promise.resolve().then(() =>
        definition.run({
          ...session,
          session,
          signal: scenarioSignal,
          observe(observation) {
            if (checkpoints.length >= MAX_CHECKPOINTS) {
              throw new Error(`native E2E checkpoints exceed limit ${MAX_CHECKPOINTS}`);
            }
            lastObservation = normalizeObservation(observation);
            checkpoints = [...checkpoints, lastObservation];
          }
        })
      );
      await raceWithAbort(() => scenarioOperation, scenarioSignal);
    } catch (error) {
      if (error?.ownershipReleased === false) ownershipReleased = false;
      failure = errorRecord(error);
      failureClass = classifyFailure(checkpoints);
    } finally {
      if (scenarioSignal.aborted && scenarioOperation) {
        scenarioSettled = await waitForSettlement(
          scenarioOperation,
          scenarioDrainTimeoutMs,
          setTimer,
          clearTimer
        );
        if (!scenarioSettled) ownershipReleased = false;
      }
      if (session) {
        const cleanupController = new AbortController();
        const cleanupTimer = setTimer(
          () => cleanupController.abort(new Error('native E2E cleanup deadline exceeded')),
          cleanupTimeoutMs
        );
        try {
          cleanup = await raceWithAbort(() => session.cleanup(), cleanupController.signal);
          if (!cleanupSucceeded(cleanup) && !failure) {
            failure = errorRecord(new Error('native E2E scenario cleanup failed'));
            failureClass = 'scenario-cleanup';
          }
          if (!cleanupSucceeded(cleanup)) ownershipReleased = false;
        } catch (error) {
          cleanup = { result: 'cleanup-failed' };
          ownershipReleased = false;
          failure ??= errorRecord(error);
          failureClass ??= 'scenario-cleanup';
        } finally {
          clearTimer(cleanupTimer);
        }
      }
      if (scenarioSignal.aborted && !failure) {
        failure = errorRecord(abortError(scenarioSignal));
        failureClass = 'scenario-cleanup';
      }
      clearTimer(scenarioTimer);
      signal?.removeEventListener('abort', relayAbort);
    }

    const result = Object.freeze({
      scenarioId: definition.id,
      suite: definition.suite,
      result: failure ? 'fail' : 'pass',
      durationMs: Math.max(0, now() - startedAt),
      lastObservation,
      checkpoints: Object.freeze([...checkpoints]),
      failureClass,
      cleanup,
      ...(failure ? { error: failure } : {})
    });
    results.push(result);
    if (scenarioSettled && ownershipReleased) await onResult(result);
    if (scenarioSignal.aborted || !scenarioSettled || !ownershipReleased) break;
  }
  return results;
}
