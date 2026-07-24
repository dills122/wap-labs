#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';

const classLedger = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
    'utf8'
  )
);
const release = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-release.json',
    'utf8'
  )
);
const effectiveSpec = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-effective-spec.json',
    'utf8'
  )
);

const failures = [];
const expectedClassC = [
  'WAESpec:MCF',
  'WML:MCF',
  'WBXML:MCF',
  'WMLScript:MCF',
  'WMLScriptLibs:MCF',
  'WAPCachingMod:MCF',
  'WSP:MCF',
  'WDP:MCF',
  'WCMP:MCF'
];
const expectedClassCFamilies = [
  'wae',
  'wml',
  'wbxml',
  'wmlscript',
  'wmlscript-libraries',
  'caching',
  'wsp',
  'wdp',
  'wcmp'
];
const expectedProfileGraphSha256 =
  '16a4c4c392848545bbcd89fe170ba54c959c28536d36d9f02547a43d0bf2df18';
const expectedProfileCounts = new Map([
  ['CCR-CLASSA-C-001', 50],
  ['CCR-CLASSB-C-001', 15],
  ['CCR-CLASSC-C-001', 9],
  ['CCR-CLASSA-S-001', 54],
  ['CCR-CLASSB-S-001', 18],
  ['CCR-CLASSC-S-001', 10]
]);
const effectiveFamilies = new Set(
  effectiveSpec.families.map((family) => family.family)
);

if (
  classLedger.schemaVersion !== 1 ||
  classLedger.releaseId !== 'wap-1.2.1'
) {
  failures.push('class ledger must target schema 1 / WAP 1.2.1');
}
if (
  classLedger.authority?.documentId !== 'WAP-215-ClassConform-20001213-a' ||
  classLedger.authority?.publicationStatus !== 'approved' ||
  classLedger.authority?.bytes !== 47936 ||
  classLedger.authority?.sha256 !==
    'af578cd57a7e043b693e0b0dd5ef59b27f8e778e481831ec8737337ee8e44f9d' ||
  classLedger.authority?.pageCount !== 16 ||
  classLedger.authority?.sourceUrl !==
    'https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf' ||
  classLedger.authority?.approvedOn !== '2000-12-13' ||
  classLedger.authority?.textExtraction?.bytes !== 35121 ||
  classLedger.authority?.textExtraction?.sha256 !==
    'd0b4cb2e7e1cb1340320845655176233f53b817bf29f93b102db6f49c030d00f'
) {
  failures.push('WAP-215 authority lock is missing or invalid');
}

const releaseWap215 = release.governingDependencies.find(
  (dependency) => dependency.documentId === classLedger.authority.documentId
);
if (
  releaseWap215?.bytes !== classLedger.authority.bytes ||
  releaseWap215?.sha256 !== classLedger.authority.sha256 ||
  releaseWap215?.sourceUrl !== classLedger.authority.sourceUrl
) {
  failures.push('WAP-215 release and class-ledger authority locks disagree');
}

const profiles = classLedger.actors.flatMap((actor) => actor.profiles);
if (classLedger.actors.length !== 2 || profiles.length !== 6) {
  failures.push('expected two actors and six Class A/B/C profiles');
}
const profileGraphSha256 = crypto
  .createHash('sha256')
  .update(JSON.stringify(classLedger.actors))
  .digest('hex');
if (
  profileGraphSha256 !== expectedProfileGraphSha256 ||
  classLedger.summary?.profileGraphSha256 !== expectedProfileGraphSha256
) {
  failures.push('six-profile expression graph drift');
}
for (const profile of profiles) {
  if (profile.requirements.length !== expectedProfileCounts.get(profile.identifier)) {
    failures.push(`${profile.identifier}: requirement count drift`);
  }
  for (const requirement of profile.requirements) {
    if (!effectiveFamilies.has(requirement.effectiveFamily)) {
      failures.push(
        `${profile.identifier}: unknown family ${requirement.effectiveFamily}`
      );
    }
  }
}

if (
  classLedger.selectedTarget?.identifier !== 'CCR-CLASSC-C-001' ||
  classLedger.selectedTarget?.deviceRole !== 'client' ||
  classLedger.selectedTarget?.deviceClass !== 'C' ||
  JSON.stringify(classLedger.selectedTarget?.requirementExpressions) !==
    JSON.stringify(expectedClassC) ||
  JSON.stringify(classLedger.selectedTarget?.effectiveFamilies) !==
    JSON.stringify(expectedClassCFamilies)
) {
  failures.push('selected target must be the exact WAP-215 Class C client graph');
}

if (
  classLedger.authority?.repositoryState !==
  'metadata-only-pending-redistribution-review'
) {
  failures.push('WAP-215 repository state must remain metadata-only');
}

if (failures.length > 0) {
  console.error('WAP class-conformance check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 class conformance');
console.log('PASS official WAP-215 source lock');
console.log('PASS six exact Class A/B/C client/server dependency graphs');
console.log('PASS selected CCR-CLASSC-C-001 with 9 resolved effective families');
console.log('PASS metadata-only redistribution boundary');
