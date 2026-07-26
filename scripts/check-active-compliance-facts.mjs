#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestDirectory = 'spec-processing/source-manifests';

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function sameValues(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function normalizedDocument(relativePath) {
  return read(relativePath).replace(/\s+/g, ' ').trim();
}

const failures = [];
const clauses = readJson(`${manifestDirectory}/wap-1.2.1-selected-normative-clauses.json`);
const effectiveSpec = readJson(`${manifestDirectory}/wap-1.2.1-effective-spec.json`);
const wmlGraph = readJson(`${manifestDirectory}/wap-1.2.1-wml-2-knowledge-graph.json`);

let sourceRowCount = 0;
let selectedParentCount = 0;
let selectedClauseCount = 0;
for (const family of clauses.families ?? []) {
  const ledger = readJson(family.parentLedger);
  const selectedObligations = (ledger.obligations ?? []).filter(
    (obligation) => obligation.disposition?.classCProfile === family.selectedDisposition
  );
  const parentIds = (family.parents ?? []).map((parent) => parent.id);
  const selectedIds = selectedObligations.map((obligation) => obligation.id);

  sourceRowCount += ledger.obligations?.length ?? 0;
  selectedParentCount += parentIds.length;
  selectedClauseCount += family.clauses?.length ?? 0;

  if (!sameValues(parentIds, selectedIds)) {
    failures.push(`${family.family}: selected parent IDs drift from the canonical SCR disposition`);
  }
  if (family.selectedParentCount !== parentIds.length) {
    failures.push(`${family.family}: selectedParentCount summary drift`);
  }
  if (family.clauseCount !== family.clauses?.length) {
    failures.push(`${family.family}: clauseCount summary drift`);
  }
}

if (clauses.summary?.selectedParentCount !== selectedParentCount) {
  failures.push('selected-clause aggregate parent total drift');
}
if (clauses.summary?.clauseCount !== selectedClauseCount) {
  failures.push('selected-clause aggregate clause total drift');
}

const wmlFamily = clauses.families?.find((family) => family.family === 'wml');
const wml201Clauses = wmlGraph.nodes.filter(
  (node) => node.type === 'clause' && node.properties.workItems?.includes('WML-201')
);
const wml201FamilyCounts = Object.fromEntries(
  [...new Set(wml201Clauses.map((node) => node.properties.family))]
    .sort((left, right) => left.localeCompare(right))
    .map((family) => [
      family,
      wml201Clauses.filter((node) => node.properties.family === family).length
    ])
);
const wml201DirectCount = wml201Clauses.length;
const wml201WmlCount = wml201FamilyCounts.wml ?? 0;
const wml201WaeCount = wml201FamilyCounts.wae ?? 0;

if (wmlGraph.summary?.directClauseCountsByWorkItem?.['WML-201'] !== wml201DirectCount) {
  failures.push('WML-201 graph summary direct-clause total drift');
}
if (
  JSON.stringify(wmlGraph.summary?.directClauseFamiliesByWorkItem?.['WML-201']) !==
  JSON.stringify(Object.keys(wml201FamilyCounts))
) {
  failures.push('WML-201 graph summary direct-clause family drift');
}
if (wml201WmlCount !== wmlFamily?.clauseCount) {
  failures.push('WML-201 direct WML clauses must match the selected WML family clause total');
}
if (wml201DirectCount !== wml201WmlCount + wml201WaeCount) {
  failures.push('WML-201 direct total must be the WML plus WAE clause totals');
}

const derivedFact =
  `Machine-derived fact: WML-201 has ${wml201DirectCount} direct clauses: ` +
  `${wml201WmlCount} selected WML clauses plus ${wml201WaeCount} WAE composition clauses.`;
for (const relativePath of [
  'docs/knowledge-graph/README.md',
  'docs/wml-engine/work-items.md',
  'spec-processing/source-manifests/README.md'
]) {
  if (!normalizedDocument(relativePath).includes(derivedFact)) {
    failures.push(`${relativePath}: missing or stale WML-201 derived fact`);
  }
}

const sourceManifestReadme = normalizedDocument('spec-processing/source-manifests/README.md');
for (const obsoleteClaim of ['general WCMP rather than host ICMP', '9 WDP, 5 WCMP, and 8 WSP']) {
  if (sourceManifestReadme.includes(obsoleteClaim)) {
    failures.push(`spec-processing/source-manifests/README.md: obsolete claim: ${obsoleteClaim}`);
  }
}
if (
  !sourceManifestReadme.includes('RFC 792 ICMP as required by WAP-202 section 5.3') ||
  !sourceManifestReadme.includes('General WCMP is capability-gated for non-IP bearers')
) {
  failures.push(
    'spec-processing/source-manifests/README.md: strict WCMP applicability is missing or stale'
  );
}

const testCoverage = normalizedDocument('docs/waves/SPEC_TEST_COVERAGE.md');
if (
  !testCoverage.includes('node scripts/check-active-compliance-facts.mjs') ||
  testCoverage.includes('all 39 selected rows expand into 174 anchored clauses')
) {
  failures.push(
    'docs/waves/SPEC_TEST_COVERAGE.md must defer volatile WML totals to machine checks'
  );
}

const strictWcmp = effectiveSpec.strictTransportProfile?.families?.wcmp;
const wcmpFamily = clauses.families?.find((family) => family.family === 'wcmp');
if (
  strictWcmp?.selectedPath !== 'rfc-792-icmpv4' ||
  strictWcmp?.generalWcmpDisposition !== 'capability-gated-non-ip-bearer' ||
  !wcmpFamily ||
  wcmpFamily.selectedParentCount !== wcmpFamily.parents?.length
) {
  failures.push('strict WCMP applicability and selected-clause facts are inconsistent');
}

if (failures.length > 0) {
  console.error('Active compliance fact check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> Active WAP compliance facts');
console.log(
  `PASS ${sourceRowCount} SCR rows / ${selectedParentCount} selected parents / ${selectedClauseCount} clauses are derived and synchronized`
);
console.log(
  `PASS WML-201 direct clauses = ${wml201DirectCount} (${wml201WmlCount} WML + ${wml201WaeCount} WAE)`
);
console.log('PASS active docs preserve RFC 792 ICMP applicability without copied volatile totals');
