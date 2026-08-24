import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateNativeE2EGate } from '../ci/native-e2e-gate.mjs';

test('native E2E gate passes a successful selected run', () => {
  assert.deepEqual(
    evaluateNativeE2EGate({
      selected: 'true',
      classifierResult: 'success',
      nativeResult: 'success'
    }),
    { ok: true, message: 'Native E2E completed successfully.' }
  );
});

test('native E2E gate passes an irrelevant pull request only when the native job is skipped', () => {
  assert.deepEqual(
    evaluateNativeE2EGate({
      selected: 'false',
      classifierResult: 'success',
      nativeResult: 'skipped'
    }),
    { ok: true, message: 'Native E2E not selected for this change.' }
  );
});

for (const nativeResult of ['failure', 'cancelled', 'skipped', '']) {
  test(`native E2E gate fails a selected run whose native result is ${nativeResult || 'missing'}`, () => {
    assert.deepEqual(
      evaluateNativeE2EGate({
        selected: 'true',
        classifierResult: 'success',
        nativeResult
      }),
      {
        ok: false,
        message: `Native E2E selected but job result was ${nativeResult || 'missing'}.`
      }
    );
  });
}

test('native E2E gate fails closed when classification fails', () => {
  assert.deepEqual(
    evaluateNativeE2EGate({
      selected: '',
      classifierResult: 'failure',
      nativeResult: 'skipped'
    }),
    { ok: false, message: 'Native E2E classification failed (failure).' }
  );
});

test('native E2E gate rejects malformed selection output', () => {
  assert.deepEqual(
    evaluateNativeE2EGate({
      selected: 'yes',
      classifierResult: 'success',
      nativeResult: 'skipped'
    }),
    { ok: false, message: 'Native E2E classifier returned an invalid selection.' }
  );
});
