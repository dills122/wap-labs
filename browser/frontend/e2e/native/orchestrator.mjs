const SAFE_ID = /^[A-Z0-9][A-Z0-9-]{0,63}$/;
const SAFE_PHASE = /^[a-z][a-z0-9-]{0,31}$/;

function errorRecord(error) {
  const value = error instanceof Error ? error : new Error(String(error));
  return { name: value.name, message: value.message };
}

function sanitizeAddress(rawAddress) {
  const address = new URL(rawAddress);
  address.search = '';
  address.hash = '';
  return address.href;
}

function normalizeObservation(observation) {
  if (
    observation === null ||
    typeof observation !== 'object' ||
    !SAFE_PHASE.test(observation.phase ?? '')
  ) {
    throw new Error('native E2E observations require a bounded phase');
  }
  const normalized = { phase: observation.phase };
  if (observation.address !== undefined) {
    normalized.address = sanitizeAddress(observation.address);
  }
  return Object.freeze(normalized);
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
  signal
}) {
  validateScenarios(scenarios);
  if (typeof createSession !== 'function') {
    throw new Error('native E2E requires a session provider');
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
    try {
      session = await createSession(definition, { signal });
      await definition.run({
        ...session,
        session,
        signal,
        observe(observation) {
          lastObservation = normalizeObservation(observation);
        }
      });
    } catch (error) {
      failure = errorRecord(error);
    } finally {
      if (session) {
        try {
          cleanup = await session.cleanup();
          if (!cleanupSucceeded(cleanup) && !failure) {
            failure = errorRecord(new Error('native E2E scenario cleanup failed'));
          }
        } catch (error) {
          cleanup = { result: 'cleanup-failed' };
          failure ??= errorRecord(error);
        }
      }
    }

    const result = Object.freeze({
      scenarioId: definition.id,
      suite: definition.suite,
      result: failure ? 'fail' : 'pass',
      durationMs: Math.max(0, now() - startedAt),
      lastObservation,
      cleanup,
      ...(failure ? { error: failure } : {})
    });
    results.push(result);
    await onResult(result);
  }
  return results;
}
