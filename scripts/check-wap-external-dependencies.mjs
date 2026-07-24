#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json'
    ),
    'utf8'
  )
);
const graph = JSON.parse(
  fs.readFileSync(
    path.join(root, 'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'),
    'utf8'
  )
);

const failures = [];
const ids = new Set();
const familyIds = new Set(graph.families.map((family) => family.family));
const requiredFamilyIds = new Set(
  graph.families
    .filter((family) =>
      ['strict-baseline', 'strict-supporting', 'strict-conditional'].includes(
        family.targetDisposition
      )
    )
    .map((family) => family.family)
);
const primaryHosts = new Set([
  'www.rfc-editor.org',
  'www.w3.org',
  'ecma-international.org',
  'standards.ieee.org',
  'www.iso.org',
  'www.iana.org',
  'www.unicode.org'
]);

if (manifest.schemaVersion !== 1 || manifest.releaseId !== 'wap-1.2.1') {
  failures.push('manifest schema/release identity must remain wap-1.2.1 schema 1');
}
if (manifest.status !== 'in-progress-reference-classification') {
  failures.push('status must remain in-progress until all open citation groups close');
}
const scopedFamilies = new Set(manifest.scope?.sourceFamilies ?? []);
for (const family of requiredFamilyIds) {
  if (!scopedFamilies.has(family)) {
    failures.push(`strict/supporting/conditional family missing from scope: ${family}`);
  }
}
for (const family of scopedFamilies) {
  if (!familyIds.has(family)) {
    failures.push(`unknown scope family: ${family}`);
  }
}

for (const dependency of manifest.dependencies ?? []) {
  if (ids.has(dependency.id)) {
    failures.push(`duplicate dependency ID: ${dependency.id}`);
  }
  ids.add(dependency.id);

  for (const field of [
    'title',
    'version',
    'authority',
    'sourceUrl',
    'referenceDisposition',
    'applicability',
    'reviewState'
  ]) {
    if (!dependency[field]) {
      failures.push(`${dependency.id}: missing ${field}`);
    }
  }

  let sourceUrl;
  try {
    sourceUrl = new URL(dependency.sourceUrl);
  } catch {
    failures.push(`${dependency.id}: invalid source URL`);
    continue;
  }
  if (
    sourceUrl.protocol !== 'https:' ||
    !primaryHosts.has(sourceUrl.hostname)
  ) {
    failures.push(`${dependency.id}: source URL is not on an approved primary host`);
  }

  if (
    !Array.isArray(dependency.citedByFamilies) ||
    dependency.citedByFamilies.length === 0
  ) {
    failures.push(`${dependency.id}: citedByFamilies must be non-empty`);
  }
  for (const family of dependency.citedByFamilies ?? []) {
    if (!familyIds.has(family)) {
      failures.push(`${dependency.id}: unknown source family=${family}`);
    }
  }
  if (
    !Array.isArray(dependency.citationLabels) ||
    dependency.citationLabels.length === 0
  ) {
    failures.push(`${dependency.id}: citationLabels must be non-empty`);
  }
}

const expectedRfcIds = [
  768, 791, 792, 822, 1305, 1321, 1630, 1738, 1766, 1808, 1864, 2040,
  2045, 2046, 2047, 2048, 2068, 2104, 2119, 2145, 2234, 2246, 2253,
  2279, 2387, 2388, 2396, 2460, 2463, 2616, 2617
].map((number) => `rfc-${number}`);
for (const id of expectedRfcIds) {
  if (!ids.has(id)) {
    failures.push(`missing reviewed RFC dependency: ${id}`);
  }
}
for (const invalidId of ['rfc-2068616', 'rfc-2616068', 'iso-07498']) {
  if (ids.has(invalidId)) {
    failures.push(`OCR artifact became a dependency: ${invalidId}`);
  }
}

const groups = manifest.openCitationGroups ?? [];
const openLabels = groups.flatMap((group) => group.labels ?? []);
if (groups.length === 0 || openLabels.length === 0) {
  failures.push('open citation groups cannot disappear before reviewed entries replace them');
}
if (new Set(openLabels).size !== openLabels.length) {
  failures.push('open citation labels must be unique across groups');
}

if (manifest.summary?.authorityLockedDependencies !== ids.size) {
  failures.push('summary.authorityLockedDependencies does not match dependencies');
}
if (manifest.summary?.openCitationGroups !== groups.length) {
  failures.push('summary.openCitationGroups does not match groups');
}
if (manifest.summary?.openCitationLabels !== openLabels.length) {
  failures.push('summary.openCitationLabels does not match group labels');
}

if (failures.length > 0) {
  console.error('WAP external dependency check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 external dependency lock');
console.log(`PASS ${ids.size} authority-locked dependencies`);
console.log(
  `PASS ${groups.length} explicit open groups containing ${openLabels.length} unique citation labels`
);
console.log(
  `PASS all ${requiredFamilyIds.size} required families plus primary-host, historical-version, and OCR guardrails`
);
