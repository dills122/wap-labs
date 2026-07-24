#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const ledger = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json'
    ),
    'utf8'
  )
);
const release = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-release.json'
    ),
    'utf8'
  )
);
const ingestion = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-ingestion-status.json'
    ),
    'utf8'
  )
);
const effectiveSpec = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'
    ),
    'utf8'
  )
);
const classConformance = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
    ),
    'utf8'
  )
);

const failures = [];
const allowedActors = new Set([
  'wbxml-client-decoder',
  'wbxml-server-encoder'
]);
const allowedStatuses = new Set(['mandatory', 'optional']);
const allowedImplementationStatuses = new Set([
  'implemented',
  'partial',
  'missing',
  'not-assessed'
]);
const expectedIds = [
  'WBXML-S-001',
  'WBXML-C-001',
  'WBXML-S-002',
  'WBXML-S-003',
  'WBXML-S-004',
  'WBXML-S-005',
  'WBXML-S-006',
  'WBXML-S-007',
  'WBXML-S-008',
  'WBXML-S-009',
  'WBXML-S-010',
  'WBXML-C-010',
  'WBXML-S-012',
  'WBXML-S-013',
  'WBXML-C-011'
];
const expectedSelectedIds = [
  'WBXML-C-001',
  'WBXML-C-010',
  'WBXML-C-011'
];

const releaseMembers = new Map(
  release.members.map((member) => [member.documentId, member])
);
const ingestionMembers = new Map(
  ingestion.members.map((member) => [member.documentId, member])
);
const governingSources = new Map(
  release.governingDependencies.map((source) => [
    source.documentId,
    source
  ])
);
const wbxmlFamily = effectiveSpec.families.find(
  (family) => family.family === 'wbxml'
);
const effectiveDocuments = new Map(
  (wbxmlFamily?.documents ?? []).map((document) => [
    document.documentId,
    document
  ])
);

if (ledger.schemaVersion !== 1) {
  failures.push(`schemaVersion=${ledger.schemaVersion}; expected 1`);
}
if (ledger.releaseId !== release.release.id || ledger.family !== 'wbxml') {
  failures.push('ledger must target the locked WAP 1.2.1 WBXML family');
}
if (
  ledger.target?.classProfile !==
  'WAP-215 Class C client (CCR-CLASSC-C-001)'
) {
  failures.push('ledger must target the selected WAP-215 Class C client');
}
if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001' ||
  !classConformance.selectedTarget?.requirementExpressions?.includes(
    'WBXML:MCF'
  )
) {
  failures.push(
    'class-conformance ledger must select Class C client WBXML:MCF'
  );
}
if (
  JSON.stringify(ledger.authority?.effectiveSequence) !==
  JSON.stringify(wbxmlFamily?.effectiveSequence)
) {
  failures.push('WBXML effective sequence drift');
}

for (const source of ledger.authority?.extractionSources ?? []) {
  const releaseMember = releaseMembers.get(source.documentId);
  const effectiveDocument = effectiveDocuments.get(source.documentId);
  if (!releaseMember || !effectiveDocument) {
    failures.push(`${source.documentId}: absent from release/effective locks`);
    continue;
  }
  if (
    source.sha256 !== releaseMember.sha256 ||
    source.sha256 !== effectiveDocument.sha256
  ) {
    failures.push(`${source.documentId}: source SHA-256 drift`);
  }
  if (source.documentId === 'WAP-192_105-WBXML') {
    const ingestionMember = ingestionMembers.get(source.documentId);
    if (
      source.textExtractionSha256 !== ingestionMember?.parsedText?.sha256
    ) {
      failures.push(`${source.documentId}: text extraction hash drift`);
    }
  }
}

for (const sourceName of ['governingSource', 'classProfileSource']) {
  const source = ledger.authority?.[sourceName];
  const governing = governingSources.get(source?.documentId);
  if (!governing || source?.sha256 !== governing.sha256) {
    failures.push(`${sourceName}: governing source hash drift`);
  }
}
if (
  ledger.authority?.classProfileSource?.selectedRequirement !==
  'WBXML:MCF'
) {
  failures.push('WBXML ledger lost its exact WAP-215 feature-group selection');
}
if (
  !ledger.authority?.governingSource?.selectedDefinition?.includes(
    'all mandatory client features'
  )
) {
  failures.push('WAP-221 MCF definition is missing');
}

const obligations = ledger.obligations ?? [];
const actualIds = obligations.map((obligation) => obligation.id);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  failures.push('WBXML SCR IDs/order differ from the effective SIN table');
}
if (new Set(actualIds).size !== actualIds.length) {
  failures.push('duplicate WBXML SCR IDs');
}

const mandatory = obligations.filter(
  (obligation) => obligation.specificationStatus === 'mandatory'
);
const optional = obligations.filter(
  (obligation) => obligation.specificationStatus === 'optional'
);
if (
  obligations.length !== 15 ||
  mandatory.length !== 11 ||
  optional.length !== 4
) {
  failures.push(
    `expected 15 obligations (11 M / 4 O); found ${obligations.length} (${mandatory.length} M / ${optional.length} O)`
  );
}

for (const obligation of obligations) {
  if (!allowedActors.has(obligation.actor)) {
    failures.push(`${obligation.id}: invalid actor=${obligation.actor}`);
  }
  if (!allowedStatuses.has(obligation.specificationStatus)) {
    failures.push(
      `${obligation.id}: invalid status=${obligation.specificationStatus}`
    );
  }
  const expectedStrict =
    obligation.specificationStatus === 'mandatory'
      ? 'required-for-claimed-actor'
      : 'declare-implemented-or-deferred';
  if (obligation.disposition?.strict !== expectedStrict) {
    failures.push(`${obligation.id}: strict disposition drift`);
  }
  const expectedClassC =
    obligation.actor === 'wbxml-client-decoder' &&
    obligation.specificationStatus === 'mandatory'
      ? 'required-by-class-c-client-mcf'
      : obligation.actor === 'wbxml-client-decoder'
        ? 'optional-not-required-by-class-c-client'
        : 'not-applicable-to-class-c-client';
  if (obligation.disposition?.classCProfile !== expectedClassC) {
    failures.push(`${obligation.id}: Class C disposition drift`);
  }
  if (obligation.disposition?.enhancementMayReplaceStrictBehavior !== false) {
    failures.push(
      `${obligation.id}: enhancements must not replace strict behavior`
    );
  }
  if (
    obligation.sourceAnchor?.documentId !== 'WAP-192_105-WBXML' ||
    !obligation.sourceAnchor?.staticConformanceSection ||
    obligation.sourceAnchor?.changeSection !== '3.3' ||
    !obligation.referencedSection
  ) {
    failures.push(`${obligation.id}: source anchor is incomplete`);
  }
  if (
    obligation.dependencyExpression?.type !== 'none' ||
    obligation.dependencyExpression?.scrIds?.length !== 0
  ) {
    failures.push(`${obligation.id}: unexpected dependency expression`);
  }

  const mapping = obligation.mapping;
  if (!allowedImplementationStatuses.has(mapping?.implementationStatus)) {
    failures.push(`${obligation.id}: invalid implementation status`);
  }
  if (
    !Array.isArray(mapping?.ownerLayers) ||
    !mapping.ownerLayers.includes('transport-rust') ||
    !Array.isArray(mapping?.requirementIds) ||
    mapping.requirementIds.length === 0 ||
    !Array.isArray(mapping?.workItems) ||
    mapping.workItems.length === 0 ||
    !mapping?.assessmentNote ||
    !mapping?.evidenceState
  ) {
    failures.push(`${obligation.id}: mapping fields are incomplete`);
  }
  if (
    obligation.disposition?.classCProfile ===
      'required-by-class-c-client-mcf' &&
    mapping?.implementationStatus === 'not-assessed'
  ) {
    failures.push(`${obligation.id}: selected row remains unassessed`);
  }
  if (
    mapping?.implementationStatus === 'missing' &&
    !mapping?.workItems?.includes('R0-08')
  ) {
    failures.push(`${obligation.id}: missing row lacks open R0-08 gap lane`);
  }

  for (const evidence of mapping?.implementationEvidence ?? []) {
    const evidencePath = path.join(root, evidence.path);
    if (!fs.existsSync(evidencePath)) {
      failures.push(`${obligation.id}: missing code path ${evidence.path}`);
      continue;
    }
    const content = fs.readFileSync(evidencePath, 'utf8');
    if (!content.includes(evidence.symbol)) {
      failures.push(
        `${obligation.id}: symbol ${evidence.symbol} absent from ${evidence.path}`
      );
    }
  }
  for (const evidence of mapping?.testEvidence ?? []) {
    const evidencePath = path.join(root, evidence.path);
    if (!fs.existsSync(evidencePath)) {
      failures.push(`${obligation.id}: missing test path ${evidence.path}`);
      continue;
    }
    const content = fs.readFileSync(evidencePath, 'utf8');
    if (!content.includes(`fn ${evidence.test}`)) {
      failures.push(
        `${obligation.id}: test ${evidence.test} absent from ${evidence.path}`
      );
    }
    if (!evidence.command?.endsWith(evidence.test)) {
      failures.push(`${obligation.id}: test command is not exact`);
    }
  }
}

const selected = obligations.filter(
  (obligation) =>
    obligation.disposition.classCProfile ===
    'required-by-class-c-client-mcf'
);
if (
  JSON.stringify(selected.map((obligation) => obligation.id)) !==
  JSON.stringify(expectedSelectedIds)
) {
  failures.push('WBXML:MCF must select the exact three client rows');
}
const statusById = new Map(
  selected.map((obligation) => [
    obligation.id,
    obligation.mapping.implementationStatus
  ])
);
if (
  statusById.get('WBXML-C-001') !== 'partial' ||
  statusById.get('WBXML-C-010') !== 'missing' ||
  statusById.get('WBXML-C-011') !== 'missing'
) {
  failures.push('selected WBXML implementation audit drift');
}
if (
  ledger.summary?.itemCount !== 15 ||
  ledger.summary?.mandatoryCount !== 11 ||
  ledger.summary?.optionalCount !== 4 ||
  ledger.summary?.selectedClassCRequiredCount !== 3 ||
  ledger.summary?.selectedClassCOptionalCount !== 0 ||
  ledger.summary?.selectedClassCNotApplicableCount !== 12 ||
  ledger.summary?.selectedDirectNormativeTestEvidenceCount !== 0 ||
  ledger.summary?.selectedBoundaryTestEvidenceCount !== 1
) {
  failures.push('WBXML summary counts drift');
}

if (failures.length > 0) {
  console.error('WAP 1.2.1 WBXML conformance-ledger check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 WBXML SCR ledger');
console.log('PASS 15 effective rows (11 mandatory / 4 optional)');
console.log('PASS WBXML:MCF selects 3 mandatory client rows');
console.log('PASS selected implementation audit: 0 implemented / 1 partial / 2 missing');
console.log('PASS source locks, mappings, and conservative evidence links');
