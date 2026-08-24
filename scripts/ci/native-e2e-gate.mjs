const VALID_EVENTS = new Set(['pull_request', 'schedule', 'workflow_dispatch']);
const VALID_SELECTIONS = new Set(['true', 'false']);

export function evaluateNativeE2EGate({ eventName, selected, classifierResult, nativeResult }) {
  if (!VALID_EVENTS.has(eventName)) {
    return {
      ok: false,
      message: `Native E2E gate received an invalid event (${eventName || 'missing'}).`
    };
  }

  if (classifierResult !== 'success') {
    return {
      ok: false,
      message: `Native E2E classification failed (${classifierResult || 'missing'}).`
    };
  }

  if (!VALID_SELECTIONS.has(selected)) {
    return { ok: false, message: 'Native E2E classifier returned an invalid selection.' };
  }

  if (selected === 'false') {
    if (eventName !== 'pull_request') {
      return { ok: false, message: `Native E2E must be selected for ${eventName}.` };
    }
    if (nativeResult === 'skipped') {
      return { ok: true, message: 'Native E2E not selected for this change.' };
    }
    return {
      ok: false,
      message: `Native E2E was not selected but job result was ${nativeResult || 'missing'}.`
    };
  }

  if (nativeResult === 'success') {
    return { ok: true, message: 'Native E2E completed successfully.' };
  }

  return {
    ok: false,
    message: `Native E2E selected but job result was ${nativeResult || 'missing'}.`
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const result = evaluateNativeE2EGate({
    eventName: process.env.NATIVE_E2E_EVENT_NAME ?? '',
    selected: process.env.NATIVE_E2E_SELECTED ?? '',
    classifierResult: process.env.NATIVE_E2E_CLASSIFIER_RESULT ?? '',
    nativeResult: process.env.NATIVE_E2E_JOB_RESULT ?? ''
  });
  const output = result.ok ? process.stdout : process.stderr;
  output.write(`${result.message}\n`);
  if (!result.ok) {
    process.exitCode = 1;
  }
}
