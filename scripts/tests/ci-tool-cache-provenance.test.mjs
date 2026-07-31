import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflowSource = fs.readFileSync('.github/workflows/security.yml', 'utf8');

test('image audit cache verifies exact Go module provenance before tool smoke checks', () => {
  assert.match(workflowSource, /go version -m .*github\.com\/anchore\/syft v\$\{SYFT_VERSION\}/);
  assert.match(workflowSource, /go version -m .*github\.com\/anchore\/grype v\$\{GRYPE_VERSION\}/);
  assert.match(workflowSource, /syft version >\/dev\/null/);
  assert.match(workflowSource, /grype version >\/dev\/null/);
  assert.doesNotMatch(workflowSource, /syft version \| grep/);
  assert.doesNotMatch(workflowSource, /grype version \| grep/);
});
