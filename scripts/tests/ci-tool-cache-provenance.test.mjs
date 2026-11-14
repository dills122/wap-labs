import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflowSource = fs.readFileSync('.github/workflows/security.yml', 'utf8');

test('dependency review excepts only the accepted Zod advisory', () => {
  const job = workflowSource.match(/\n  dependency-review:\n([\s\S]*?)\n  rust-audit:/)?.[1];
  assert.ok(job, 'dependency review job must exist');
  assert.deepEqual(
    [...job.matchAll(/allow-ghsas:\s*([^\n#]+)/g)].map((match) => match[1].trim()),
    ['GHSA-mrhx-c7xc-m3w5']
  );
  assert.doesNotMatch(job, /(?:warn-only:\s*true|vulnerability-check:\s*false)/);
});

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
