import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflowSource = fs.readFileSync('.github/workflows/security.yml', 'utf8');

test('image audit cache verifies exact Go module provenance before tool smoke checks', () => {
  assert.match(
    workflowSource,
    /go version -m .*[\s\S]*\$2 == "github\.com\/anchore\/syft" && \$3 == expected/
  );
  assert.match(
    workflowSource,
    /go version -m .*[\s\S]*\$2 == "github\.com\/anchore\/grype" && \$3 == expected/
  );
  assert.match(workflowSource, /syft version >\/dev\/null/);
  assert.match(workflowSource, /grype version >\/dev\/null/);
  assert.doesNotMatch(workflowSource, /syft version \| grep/);
  assert.doesNotMatch(workflowSource, /grype version \| grep/);
});
