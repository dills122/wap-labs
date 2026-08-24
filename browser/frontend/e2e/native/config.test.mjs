import assert from 'node:assert/strict';
import test from 'node:test';

import {
  listNativeE2EScenarios,
  parseNativeE2EArguments,
  selectNativeE2EScenarios
} from './config.mjs';

test('native E2E defaults to the smoke suite for compatibility', () => {
  const options = parseNativeE2EArguments([]);
  assert.deepEqual(options, { mode: 'run', suite: 'smoke', scenarioId: null });
  assert.deepEqual(
    selectNativeE2EScenarios(options).map(({ id }) => id),
    [
      'BOOT-NATIVE-001',
      'TRN-NATIVE-001',
      'AUTH-NATIVE-001A',
      'AUTH-NATIVE-001B',
      'AUTH-NATIVE-002A',
      'AUTH-NATIVE-002B',
      'NAV-NATIVE-001',
      'NAV-NATIVE-002',
      'NAV-NATIVE-003',
      'ERR-NATIVE-001',
      'REQ-NATIVE-001',
      'RACE-NATIVE-001',
      'RACE-NATIVE-002'
    ]
  );
});

test('native E2E lists stable scenario metadata without running a provider', () => {
  assert.deepEqual(parseNativeE2EArguments(['--', '--list']), {
    mode: 'list',
    suite: null,
    scenarioId: null
  });
  assert.deepEqual(
    listNativeE2EScenarios().map(({ id }) => id),
    [
      'BOOT-NATIVE-001',
      'TRN-NATIVE-001',
      'AUTH-NATIVE-001A',
      'AUTH-NATIVE-001B',
      'AUTH-NATIVE-002A',
      'AUTH-NATIVE-002B',
      'NAV-NATIVE-001',
      'NAV-NATIVE-002',
      'NAV-NATIVE-003',
      'ERR-NATIVE-001',
      'REQ-NATIVE-001',
      'RACE-NATIVE-001',
      'RACE-NATIVE-002'
    ]
  );
});

test('native E2E selects a named suite', () => {
  const options = parseNativeE2EArguments(['--suite', 'smoke']);
  assert.deepEqual(
    selectNativeE2EScenarios(options).map(({ id }) => id),
    [
      'BOOT-NATIVE-001',
      'TRN-NATIVE-001',
      'AUTH-NATIVE-001A',
      'AUTH-NATIVE-001B',
      'AUTH-NATIVE-002A',
      'AUTH-NATIVE-002B',
      'NAV-NATIVE-001',
      'NAV-NATIVE-002',
      'NAV-NATIVE-003',
      'ERR-NATIVE-001',
      'REQ-NATIVE-001',
      'RACE-NATIVE-001',
      'RACE-NATIVE-002'
    ]
  );
});

test('native E2E selects one exact scenario', () => {
  const options = parseNativeE2EArguments(['--scenario', 'TRN-NATIVE-001']);
  assert.deepEqual(
    selectNativeE2EScenarios(options).map(({ id }) => id),
    ['TRN-NATIVE-001']
  );
});

for (const { name, arguments: cliArguments, message } of [
  {
    name: 'unknown option',
    arguments: ['--wat'],
    message: 'unknown native E2E option: --wat'
  },
  {
    name: 'missing suite value',
    arguments: ['--suite'],
    message: '--suite requires a value'
  },
  {
    name: 'mixed selectors',
    arguments: ['--suite', 'smoke', '--scenario', 'TRN-NATIVE-001'],
    message: '--suite and --scenario are mutually exclusive'
  },
  {
    name: 'list mixed with a selector',
    arguments: ['--list', '--suite', 'smoke'],
    message: '--list cannot be combined with --suite or --scenario'
  }
]) {
  test(`native E2E rejects ${name}`, () => {
    assert.throws(() => parseNativeE2EArguments(cliArguments), new Error(message));
  });
}

test('native E2E rejects unknown suite and scenario selectors', () => {
  assert.throws(
    () => selectNativeE2EScenarios({ mode: 'run', suite: 'missing', scenarioId: null }),
    new Error('unknown native E2E suite: missing')
  );
  assert.throws(
    () => selectNativeE2EScenarios({ mode: 'run', suite: null, scenarioId: 'MISSING' }),
    new Error('unknown native E2E scenario: MISSING')
  );
});
