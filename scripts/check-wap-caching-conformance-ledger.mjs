#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

const ledger = readJson(
  'spec-processing/source-manifests/wap-1.2.1-caching-scr.json'
);
const release = readJson(
  'spec-processing/source-manifests/wap-1.2.1-release.json'
);
const ingestion = readJson(
  'spec-processing/source-manifests/wap-1.2.1-ingestion-status.json'
);
const externalDependencies = readJson(
  'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json'
);
const externalIngestion = readJson(
  'spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json'
);
const effectiveSpec = readJson(
  'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'
);
const classConformance = readJson(
  'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
);
const program = readJson('docs/waves/wap-1.2.1-compliance-program.json');
const requirementIndex = fs.readFileSync(
  path.join(root, 'docs/waves/REQUIREMENT_INDEX.md'),
  'utf8'
);
const workItemsText = fs.readFileSync(
  path.join(root, 'docs/waves/WORK_ITEMS.md'),
  'utf8'
);

const failures = [];
const expectedIds = [
  'UACache-C-001',
  'UACache-C-002',
  'UACache-C-003',
  'UACache-C-004',
  'UACache-C-005',
  'UACache-C-006',
  'UACache-S-007',
  'UACache-S-008',
  'UACache-S-009',
  'UACache-S-010',
  'UACache-S-011'
];
const expectedSelectedIds = [
  'UACache-C-001',
  'UACache-C-002',
  'UACache-C-003',
  'UACache-C-004',
  'UACache-C-006'
];
const allowedActors = new Set([
  'wml-user-agent-cache',
  'wap-gateway-cache'
]);
const allowedStatuses = new Set(['mandatory', 'optional']);
const allowedImplementationStatuses = new Set([
  'partial',
  'missing',
  'not-assessed'
]);
const family = effectiveSpec.families.find(
  (entry) => entry.family === 'caching'
);
const releaseMember = release.members.find(
  (member) => member.documentId === 'WAP-120-WAPCachingMod'
);
const ingestionMember = ingestion.members.find(
  (member) => member.documentId === 'WAP-120-WAPCachingMod'
);
const programIds = new Set(
  program.sprints.flatMap((sprint) =>
    sprint.workItems.map((workItem) => workItem.id)
  )
);

if (
  ledger.schemaVersion !== 1 ||
  ledger.releaseId !== release.release.id ||
  ledger.family !== 'caching'
) {
  failures.push('ledger must target the locked WAP 1.2.1 caching family');
}
if (
  ledger.target?.classProfile !==
    'WAP-215 Class C client (CCR-CLASSC-C-001)' ||
  !ledger.target?.cacheProfile?.includes('zero-byte cache')
) {
  failures.push('ledger must retain Class C and zero-byte cache posture');
}
if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001' ||
  !classConformance.selectedTarget?.requirementExpressions?.includes(
    'WAPCachingMod:MCF'
  ) ||
  ledger.authority?.classProfileSource?.selectedRequirement !==
    'WAPCachingMod:MCF'
) {
  failures.push('Class C caching selection drift');
}
if (
  JSON.stringify(family?.effectiveSequence) !==
    JSON.stringify(['WAP-120-WAPCachingMod']) ||
  JSON.stringify(ledger.authority?.effectiveSequence) !==
    JSON.stringify(['WAP-120-WAPCachingMod'])
) {
  failures.push('effective caching source sequence drift');
}

const extractionSource = ledger.authority?.extractionSources?.[0];
if (
  extractionSource?.sha256 !== releaseMember?.sha256 ||
  extractionSource?.sha256 !== family?.documents?.[0]?.sha256 ||
  extractionSource?.textExtractionSha256 !==
    ingestionMember?.parsedText?.sha256 ||
  extractionSource?.repositoryState !== 'canonical-content-differs'
) {
  failures.push('WAP-120 source/text/repository-state lock drift');
}
for (const sourceName of ['governingSource', 'classProfileSource']) {
  const source = ledger.authority?.[sourceName];
  const governing = release.governingDependencies.find(
    (entry) => entry.documentId === source?.documentId
  );
  if (!governing || governing.sha256 !== source.sha256) {
    failures.push(`${sourceName}: governing source lock drift`);
  }
}
if (
  !ledger.authority?.governingSource?.selectedDefinition?.includes(
    'all mandatory client features'
  )
) {
  failures.push('WAP-221 MCF definition is missing');
}

for (const dependencyId of ['rfc-2616', 'rfc-1305']) {
  const ledgerDependency = ledger.authority?.externalDependencies?.find(
    (entry) => entry.id === dependencyId
  );
  const metadata = externalDependencies.dependencies.find(
    (entry) => entry.id === dependencyId
  );
  const acquisition = externalIngestion.dependencies.find(
    (entry) => entry.dependencyId === dependencyId
  );
  if (
    !ledgerDependency ||
    ledgerDependency.sourceUrl !== metadata?.sourceUrl ||
    ledgerDependency.referenceDisposition !==
      metadata?.referenceDisposition ||
    ledgerDependency.acquisitionState !== acquisition?.acquisitionState ||
    JSON.stringify(ledgerDependency.artifacts) !==
      JSON.stringify(
        acquisition?.artifacts.map((artifact) => ({
          id: artifact.id,
          sourceUrl: artifact.sourceUrl,
          bytes: artifact.bytes,
          sha256: artifact.sha256
        }))
      )
  ) {
    failures.push(`${dependencyId}: external source lock drift`);
  }
}

const obligations = ledger.obligations ?? [];
const actualIds = obligations.map((obligation) => obligation.id);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  failures.push('caching SCR IDs/order differ from Appendix A');
}
const mandatory = obligations.filter(
  (obligation) => obligation.specificationStatus === 'mandatory'
);
const optional = obligations.filter(
  (obligation) => obligation.specificationStatus === 'optional'
);
const selected = obligations.filter(
  (obligation) =>
    obligation.disposition?.classCProfile ===
    'required-by-class-c-client-mcf'
);
if (
  obligations.length !== 11 ||
  mandatory.length !== 9 ||
  optional.length !== 2 ||
  JSON.stringify(selected.map((obligation) => obligation.id)) !==
    JSON.stringify(expectedSelectedIds)
) {
  failures.push(
    'expected 11 rows (9 M / 2 O) and five selected mandatory client rows'
  );
}

for (const obligation of obligations) {
  const isClient = obligation.actor === 'wml-user-agent-cache';
  const isSelected =
    isClient && obligation.specificationStatus === 'mandatory';
  const expectedDisposition = isSelected
    ? 'required-by-class-c-client-mcf'
    : isClient
      ? 'optional-not-required-by-class-c-client'
      : 'not-applicable-to-class-c-client';
  if (!allowedActors.has(obligation.actor)) {
    failures.push(`${obligation.id}: invalid actor`);
  }
  if (!allowedStatuses.has(obligation.specificationStatus)) {
    failures.push(`${obligation.id}: invalid specification status`);
  }
  if (obligation.disposition?.classCProfile !== expectedDisposition) {
    failures.push(`${obligation.id}: Class C disposition drift`);
  }
  if (
    obligation.disposition?.strict !==
      (obligation.specificationStatus === 'mandatory'
        ? 'required-for-claimed-actor'
        : 'declare-implemented-or-deferred') ||
    obligation.disposition?.enhancementMayReplaceStrictBehavior !== false
  ) {
    failures.push(`${obligation.id}: strict/enhancement disposition drift`);
  }
  if (
    obligation.sourceAnchor?.documentId !== 'WAP-120-WAPCachingMod' ||
    obligation.sourceAnchor?.staticConformanceSection !== 'Appendix A' ||
    !obligation.referencedSection
  ) {
    failures.push(`${obligation.id}: source anchor drift`);
  }
  const mapping = obligation.mapping;
  if (
    !mapping?.implementationDomain ||
    !Array.isArray(mapping.ownerLayers) ||
    mapping.ownerLayers.length === 0 ||
    !Array.isArray(mapping.requirementIds) ||
    !mapping.requirementIds.includes('RQ-WAE-008') ||
    !Array.isArray(mapping.workItems) ||
    mapping.workItems.length === 0 ||
    !allowedImplementationStatuses.has(mapping.implementationStatus) ||
    !Array.isArray(mapping.implementationEvidence) ||
    !Array.isArray(mapping.testEvidence) ||
    !mapping.assessmentNote
  ) {
    failures.push(`${obligation.id}: mapping is incomplete`);
    continue;
  }
  if (
    isSelected &&
    !new Set(['partial', 'missing']).has(mapping.implementationStatus)
  ) {
    failures.push(`${obligation.id}: selected row is not audited`);
  }
  if (!isSelected && mapping.implementationStatus !== 'not-assessed') {
    failures.push(`${obligation.id}: out-of-profile row must be not-assessed`);
  }
  if (
    mapping.implementationStatus === 'missing' &&
    (mapping.implementationEvidence.length > 0 ||
      mapping.testEvidence.length > 0)
  ) {
    failures.push(`${obligation.id}: missing row contains positive evidence`);
  }
  for (const requirementId of mapping.requirementIds) {
    if (!requirementIndex.includes(`\`${requirementId}\``)) {
      failures.push(`${obligation.id}: unknown requirement ${requirementId}`);
    }
  }
  for (const workItem of mapping.workItems) {
    if (
      !programIds.has(workItem) &&
      !workItemsText.includes(`### ${workItem} `)
    ) {
      failures.push(`${obligation.id}: unknown work item ${workItem}`);
    }
  }
}

const partial = selected.filter(
  (obligation) => obligation.mapping.implementationStatus === 'partial'
);
const missing = selected.filter(
  (obligation) => obligation.mapping.implementationStatus === 'missing'
);
if (
  partial.length !== 3 ||
  missing.length !== 2 ||
  ledger.summary?.selectedImplementationStatus?.partial !== 3 ||
  ledger.summary?.selectedImplementationStatus?.missing !== 2 ||
  ledger.summary?.selectedDirectNormativeTestEvidenceCount !== 0
) {
  failures.push('selected caching implementation audit drift');
}

if (failures.length > 0) {
  console.error('WAP caching conformance ledger check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 caching SCR ledger');
console.log('PASS 11 effective rows (9 mandatory / 2 optional)');
console.log('PASS WAPCachingMod:MCF selects 5 mandatory client rows');
console.log('PASS selected audit: 0 implemented / 3 partial / 2 missing');
console.log('PASS WAP-120, WAP-221, RFC 2616, and RFC 1305 source locks');
