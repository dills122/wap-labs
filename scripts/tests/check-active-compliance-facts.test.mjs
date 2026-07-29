import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const clauseManifestPath =
  'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json';

function copyFixtureFile(fixtureRoot, relativePath) {
  const destination = join(fixtureRoot, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(repositoryRoot, relativePath), destination);
}

function createFixture() {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'wap-active-compliance-facts-'));
  const clauses = JSON.parse(readFileSync(join(repositoryRoot, clauseManifestPath), 'utf8'));
  const fixturePaths = new Set([
    'scripts/check-active-compliance-facts.mjs',
    clauseManifestPath,
    'spec-processing/source-manifests/wap-1.2.1-effective-spec.json',
    'spec-processing/source-manifests/wap-1.2.1-release.json',
    'spec-processing/source-manifests/wap-1.2.1-wml-2-knowledge-graph.json',
    'spec-processing/source-manifests/README.md',
    'docs/waves/wap-1.2.1-compliance-program.json',
    'docs/knowledge-graph/README.md',
    'docs/wml-engine/work-items.md',
    'docs/waves/SPEC_TEST_COVERAGE.md',
    'docs/waves/SPEC_COVERAGE_DASHBOARD.md',
    'docs/waves/WAP_1_2_1_PLANNING_BASELINE.md',
    'docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md',
    'docs/waves/WAP_1_2_1_NORMATIVE_CLAUSE_LEDGER.md',
    'docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md',
    'docs/waves/WAP_1_2_1_WML_SCR_LEDGER.md',
    ...(clauses.families ?? []).map((family) => family.parentLedger)
  ]);

  for (const relativePath of fixturePaths) {
    copyFixtureFile(fixtureRoot, relativePath);
  }

  return { clauses, fixtureRoot };
}

function runCheck(fixtureRoot) {
  return spawnSync(process.execPath, ['scripts/check-active-compliance-facts.mjs'], {
    cwd: fixtureRoot,
    encoding: 'utf8'
  });
}

test('active rollup guard derives prose assertions from canonical manifests', (context) => {
  const { clauses, fixtureRoot } = createFixture();
  context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  const baseline = runCheck(fixtureRoot);
  assert.equal(baseline.status, 0, baseline.stderr);

  const planningPath = join(fixtureRoot, 'docs/waves/WAP_1_2_1_PLANNING_BASELINE.md');
  const assessed = clauses.summary.assessedClauseCount;
  const unassessed = clauses.summary.clauseCount - assessed;
  const currentFragment =
    `${assessed} clauses now have direct conformance assessment and ` +
    `${unassessed} remain unassessed`;
  const staleFragment =
    `${assessed - 1} clauses now have direct conformance assessment and ` +
    `${unassessed + 1} remain unassessed`;
  const planning = readFileSync(planningPath, 'utf8');
  assert.ok(planning.includes(currentFragment));
  writeFileSync(planningPath, planning.replace(currentFragment, staleFragment));

  const stale = runCheck(fixtureRoot);
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /WAP_1_2_1_PLANNING_BASELINE\.md: missing or stale derived rollup/);
});

test('active rollup guard rejects a stale parent-status table', (context) => {
  const { fixtureRoot } = createFixture();
  context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  const planningPath = join(fixtureRoot, 'docs/waves/WAP_1_2_1_PLANNING_BASELINE.md');
  const planning = readFileSync(planningPath, 'utf8');
  const currentFragment = '| **Total** | **198** | **762** | **41** | **71** | **86** |';
  const staleFragment = '| **Total** | **198** | **762** | **41** | **70** | **87** |';
  assert.ok(planning.includes(currentFragment));
  writeFileSync(planningPath, planning.replace(currentFragment, staleFragment));

  const stale = runCheck(fixtureRoot);
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /WAP_1_2_1_PLANNING_BASELINE\.md: missing or stale derived rollup/);
});

test('active rollup guard rejects stale WML evidence-state counts', (context) => {
  const { fixtureRoot } = createFixture();
  context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  const ledgerPath = join(fixtureRoot, 'docs/waves/WAP_1_2_1_WML_SCR_LEDGER.md');
  const ledger = readFileSync(ledgerPath, 'utf8');
  assert.ok(ledger.includes('33 `direct-test-linked`, 14 `gap-work-item-mapped`'));
  writeFileSync(
    ledgerPath,
    ledger.replace(
      '33 `direct-test-linked`, 14 `gap-work-item-mapped`',
      '32 `direct-test-linked`, 15 `gap-work-item-mapped`'
    )
  );

  const stale = runCheck(fixtureRoot);
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /WAP_1_2_1_WML_SCR_LEDGER\.md: missing or stale derived rollup/);
});
