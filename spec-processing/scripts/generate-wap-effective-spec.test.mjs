import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../..');
const generatorPath = path.join(
  repositoryRoot,
  'spec-processing/scripts/generate-wap-effective-spec.mjs'
);
const manifestDirectory = 'spec-processing/source-manifests';
const inputFiles = [
  'wap-1.2.1-release.json',
  'wap-1.2.1-class-conformance.json',
  'wap-1.2.1-ingestion-status.json',
  'wap-1.2.1-external-dependencies.json',
  'wap-1.2.1-external-ingestion-status.json'
];
const outputFile = 'wap-1.2.1-effective-spec.json';

function runGenerator(cwd, ...args) {
  return spawnSync(process.execPath, [generatorPath, ...args], {
    cwd,
    encoding: 'utf8'
  });
}

test('effective-spec generation is deterministic and rejects stale output', (t) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wap-effective-spec-'));
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));

  const temporaryManifestDirectory = path.join(temporaryRoot, manifestDirectory);
  fs.mkdirSync(temporaryManifestDirectory, { recursive: true });
  for (const filename of inputFiles) {
    fs.copyFileSync(
      path.join(repositoryRoot, manifestDirectory, filename),
      path.join(temporaryManifestDirectory, filename)
    );
  }

  const firstRun = runGenerator(temporaryRoot);
  assert.equal(firstRun.status, 0, firstRun.stderr);
  const generatedPath = path.join(temporaryManifestDirectory, outputFile);
  const firstBytes = fs.readFileSync(generatedPath);

  const secondRun = runGenerator(temporaryRoot);
  assert.equal(secondRun.status, 0, secondRun.stderr);
  assert.deepEqual(fs.readFileSync(generatedPath), firstBytes);

  const cleanCheck = runGenerator(temporaryRoot, '--check');
  assert.equal(cleanCheck.status, 0, cleanCheck.stderr);

  const stale = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
  stale.strictTransportProfile.families.wcmp.selectedPath = 'general-wcmp';
  fs.writeFileSync(generatedPath, `${JSON.stringify(stale, null, 2)}\n`);
  const staleCheck = runGenerator(temporaryRoot, '--check');
  assert.equal(staleCheck.status, 1);
  assert.match(staleCheck.stderr, /generated output drift/);

  const repair = runGenerator(temporaryRoot);
  assert.equal(repair.status, 0, repair.stderr);
  assert.deepEqual(fs.readFileSync(generatedPath), firstBytes);

  const generated = JSON.parse(firstBytes);
  assert.equal(generated.strictTransportProfile.families.wcmp.selectedPath, 'rfc-792-icmpv4');
  assert.equal(
    generated.strictTransportProfile.families.wcmp.generalWcmpDisposition,
    'capability-gated-non-ip-bearer'
  );
});
