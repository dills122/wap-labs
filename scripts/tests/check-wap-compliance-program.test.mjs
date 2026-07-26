import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const programPath = 'docs/waves/wap-1.2.1-compliance-program.json';

function copyFixtureFile(fixtureRoot, relativePath) {
  const destination = join(fixtureRoot, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(repositoryRoot, relativePath), destination);
}

function runCheck(fixtureRoot) {
  return spawnSync(process.execPath, ['scripts/check-wap-compliance-program.mjs'], {
    cwd: fixtureRoot,
    encoding: 'utf8'
  });
}

test('program validator accepts and protects the evidence-backed WML-3 status', (context) => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'wap-compliance-program-'));
  context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));
  for (const relativePath of [
    'scripts/check-wap-compliance-program.mjs',
    programPath,
    'spec-processing/source-manifests/wap-1.2.1-effective-spec.json',
    'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
  ]) {
    copyFixtureFile(fixtureRoot, relativePath);
  }

  const baseline = runCheck(fixtureRoot);
  assert.equal(baseline.status, 0, baseline.stderr);

  const fixtureProgramPath = join(fixtureRoot, programPath);
  const program = JSON.parse(readFileSync(fixtureProgramPath, 'utf8'));
  program.sprints.find((sprint) => sprint.id === 'WML-3').status = 'todo';
  writeFileSync(fixtureProgramPath, `${JSON.stringify(program, null, 2)}\n`);

  const stale = runCheck(fixtureRoot);
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /WML-3 must remain in progress/);
});
