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
    'docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md',
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
  const { clauses, fixtureRoot } = createFixture();
  context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  const planningPath = join(fixtureRoot, 'docs/waves/WAP_1_2_1_PLANNING_BASELINE.md');
  const planning = readFileSync(planningPath, 'utf8');
  const parentStatuses = clauses.families
    .flatMap((family) => family.parents)
    .reduce(
      (counts, parent) => {
        counts[parent.implementationStatus] += 1;
        return counts;
      },
      { implemented: 0, partial: 0, missing: 0 }
    );
  const currentFragment =
    `| **${clauses.summary.selectedParentCount}** | **${clauses.summary.clauseCount}** | ` +
    `**${parentStatuses.implemented}** | **${parentStatuses.partial}** | ` +
    `**${parentStatuses.missing}** |`;
  const staleFragment = currentFragment.replace(
    `**${parentStatuses.partial}** | **${parentStatuses.missing}**`,
    `**${parentStatuses.partial - 1}** | **${parentStatuses.missing + 1}**`
  );
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
  assert.ok(ledger.includes('34 `direct-test-linked`, 14 `gap-work-item-mapped`'));
  writeFileSync(
    ledgerPath,
    ledger.replace(
      '34 `direct-test-linked`, 14 `gap-work-item-mapped`',
      '33 `direct-test-linked`, 15 `gap-work-item-mapped`'
    )
  );

  const stale = runCheck(fixtureRoot);
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /WAP_1_2_1_WML_SCR_LEDGER\.md: missing or stale derived rollup/);
});

test('active rollup guard rejects stale library and WML claims in published documents', (context) => {
  const { fixtureRoot } = createFixture();
  context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));
  for (const [relativePath, current, stale] of [
    [
      'docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md',
      '21 partial, and 59 missing',
      '14 partial, and 66 missing'
    ],
    [
      'docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md',
      'tests linked to 7 rows',
      'tests linked to 0 rows'
    ],
    [
      'docs/waves/SPEC_COVERAGE_DASHBOARD.md',
      '0 implemented, 21 partial, 59 missing',
      '0 implemented, 14 partial, 66 missing'
    ],
    [
      'docs/waves/SPEC_COVERAGE_DASHBOARD.md',
      '29/121 selected rows, including 7 library',
      '21/121 selected rows, including 0 library'
    ],
    [
      'docs/waves/SPEC_COVERAGE_DASHBOARD.md',
      '34 code/test-linked, 14 mapped gaps',
      '32 code/test-linked, 15 mapped gaps'
    ],
    [
      'docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md',
      '25 implemented / 8 partial / 6 missing',
      '19 implemented / 14 partial / 6 missing'
    ]
  ]) {
    const file = join(fixtureRoot, relativePath);
    const original = readFileSync(file, 'utf8');
    assert.ok(original.includes(current), `${relativePath} contains current claim`);
    writeFileSync(file, original.replace(current, stale));
    const result = runCheck(fixtureRoot);
    assert.notEqual(result.status, 0, `${relativePath} rejects stale claim`);
    writeFileSync(file, original);
  }
});
