import { CORE_SCENARIOS } from './scenarios/core.mjs';
import { AUTHENTICATION_SCENARIOS } from './scenarios/authentication.mjs';

const SCENARIOS = Object.freeze([
  ...CORE_SCENARIOS.slice(0, 2),
  ...AUTHENTICATION_SCENARIOS,
  ...CORE_SCENARIOS.slice(2)
]);

const requireOptionValue = (arguments_, index, option) => {
  const value = arguments_[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${option} requires a value`);
  }
  return value;
};

export function parseNativeE2EArguments(arguments_) {
  let list = false;
  let suite = null;
  let scenarioId = null;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--' && index === 0) {
      continue;
    }
    if (argument === '--list') {
      if (list) {
        throw new Error('--list may be specified only once');
      }
      list = true;
      continue;
    }
    if (argument === '--suite') {
      if (suite !== null) {
        throw new Error('--suite may be specified only once');
      }
      suite = requireOptionValue(arguments_, index, '--suite');
      index += 1;
      continue;
    }
    if (argument === '--scenario') {
      if (scenarioId !== null) {
        throw new Error('--scenario may be specified only once');
      }
      scenarioId = requireOptionValue(arguments_, index, '--scenario');
      index += 1;
      continue;
    }
    throw new Error(`unknown native E2E option: ${argument}`);
  }

  if (suite !== null && scenarioId !== null) {
    throw new Error('--suite and --scenario are mutually exclusive');
  }
  if (list && (suite !== null || scenarioId !== null)) {
    throw new Error('--list cannot be combined with --suite or --scenario');
  }
  if (list) {
    return { mode: 'list', suite: null, scenarioId: null };
  }
  return { mode: 'run', suite: suite ?? (scenarioId === null ? 'smoke' : null), scenarioId };
}

export function listNativeE2EScenarios() {
  return SCENARIOS.map(({ id, suite, name }) => ({ id, suite, name }));
}

export function selectNativeE2EScenarios({ mode, suite, scenarioId }) {
  if (mode !== 'run') {
    throw new Error('native E2E scenario selection requires run mode');
  }
  if (scenarioId !== null) {
    const scenario = SCENARIOS.find(({ id }) => id === scenarioId);
    if (!scenario) {
      throw new Error(`unknown native E2E scenario: ${scenarioId}`);
    }
    return [scenario];
  }

  const scenarios = SCENARIOS.filter((scenario) => scenario.suite === suite);
  if (scenarios.length === 0) {
    throw new Error(`unknown native E2E suite: ${suite}`);
  }
  return scenarios;
}

export function formatNativeE2EScenarioList() {
  return `${listNativeE2EScenarios()
    .map(({ id, suite, name }) => `${id}\t${suite}\t${name}`)
    .join('\n')}\n`;
}
