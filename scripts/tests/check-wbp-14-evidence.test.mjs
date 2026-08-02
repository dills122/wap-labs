import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { validateEvidenceManifest } from '../check-wbp-14-evidence.mjs';

const manifest = JSON.parse(fs.readFileSync('docs/waves/wbp-14-desktop-evidence.json', 'utf8'));

test('WBP-14 evidence inventory is internally consistent', () => {
  assert.deepEqual(validateEvidenceManifest(manifest), []);
});

test('WBP-14 cannot claim release completion while required evidence is open', () => {
  const optimisticManifest = structuredClone(manifest);
  optimisticManifest.releaseComplete = true;

  assert.match(
    validateEvidenceManifest(optimisticManifest).join('\n'),
    /releaseComplete cannot be true/
  );
});

test('WBP-14 incomplete scenarios retain a named blocker', () => {
  const incompleteManifest = structuredClone(manifest);
  delete incompleteManifest.scenarios.find(({ id }) => id === 'timeout').blocker;

  assert.match(validateEvidenceManifest(incompleteManifest).join('\n'), /timeout: incomplete/);
});
