#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const ledgerPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-wae-scr.json'
);
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const release = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-release.json'
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
const allowedActors = new Set(['wae-user-agent', 'wae-server']);
const allowedStatuses = new Set(['mandatory', 'optional']);
const allowedStrictDispositions = new Set([
  'required-for-claimed-actor',
  'declare-implemented-or-deferred'
]);
const allowedClassCDispositions = new Set([
  'required-by-class-c-client-mcf',
  'optional-not-required-by-class-c-client',
  'not-applicable-to-class-c-client'
]);
const allowedImplementationStatuses = new Set([
  'implemented',
  'partial',
  'missing',
  'not-assessed'
]);
const allowedDeltaClassifications = new Set([
  'preserved-renamed',
  'expanded-and-split',
  'status-relaxed-and-reframed',
  'expanded-profile-choice',
  'decomposed-into-behaviors',
  'removed-from-wae-scr-and-delegated',
  'subsumed-by-profile'
]);

const releaseMembers = new Map(
  release.members.map((member) => [member.documentId, member])
);
const governingSources = new Map(
  release.governingDependencies.map((source) => [
    source.documentId,
    source
  ])
);
const waeFamily = effectiveSpec.families.find(
  (family) => family.family === 'wae'
);
const effectiveDocuments = new Map(
  (waeFamily?.documents ?? []).map((document) => [
    document.documentId,
    document
  ])
);

if (ledger.schemaVersion !== 1) {
  failures.push(`schemaVersion=${ledger.schemaVersion}; expected 1`);
}
if (ledger.releaseId !== release.release.id || ledger.family !== 'wae') {
  failures.push('ledger must target the locked WAP 1.2.1 WAE family');
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
    'WAESpec:MCF'
  )
) {
  failures.push('class-conformance ledger must select Class C client WAESpec:MCF');
}
if (
  JSON.stringify(ledger.authority?.effectiveSequence) !==
  JSON.stringify(waeFamily?.effectiveSequence)
) {
  failures.push('WAE effective sequence drift');
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
  'WAESpec:MCF'
) {
  failures.push('WAE ledger lost its exact WAP-215 feature-group selection');
}
if (
  !ledger.authority?.governingSource?.selectedDefinition?.includes(
    'all mandatory client features'
  )
) {
  failures.push('WAP-221 MCF definition is missing');
}

const obligations = ledger.obligations ?? [];
const obligationIds = obligations.map((obligation) => obligation.id);
if (new Set(obligationIds).size !== obligationIds.length) {
  failures.push('duplicate active WAE SCR IDs');
}

const mandatory = obligations.filter(
  (obligation) => obligation.specificationStatus === 'mandatory'
);
const optional = obligations.filter(
  (obligation) => obligation.specificationStatus === 'optional'
);
if (
  obligations.length !== 86 ||
  mandatory.length !== 25 ||
  optional.length !== 61
) {
  failures.push(
    `expected 86 active obligations (25 M / 61 O); found ${obligations.length} (${mandatory.length} M / ${optional.length} O)`
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
  if (!allowedStrictDispositions.has(obligation.disposition?.strict)) {
    failures.push(`${obligation.id}: invalid strict disposition`);
  }
  if (
    !allowedClassCDispositions.has(
      obligation.disposition?.classCProfile
    )
  ) {
    failures.push(`${obligation.id}: invalid Class C disposition`);
  }

  const expectedClassCDisposition =
    obligation.actor === 'wae-server'
      ? 'not-applicable-to-class-c-client'
      : obligation.specificationStatus === 'mandatory'
        ? 'required-by-class-c-client-mcf'
        : 'optional-not-required-by-class-c-client';
  if (
    obligation.disposition?.classCProfile !== expectedClassCDisposition
  ) {
    failures.push(
      `${obligation.id}: Class C disposition=${obligation.disposition?.classCProfile}; expected ${expectedClassCDisposition}`
    );
  }
  if (obligation.disposition?.enhancementMayReplaceStrictBehavior !== false) {
    failures.push(
      `${obligation.id}: enhancements must not replace strict behavior`
    );
  }
  if (
    obligation.specificationStatus === 'mandatory' &&
    obligation.disposition?.strict !== 'required-for-claimed-actor'
  ) {
    failures.push(`${obligation.id}: mandatory item lost strict disposition`);
  }
  if (
    obligation.specificationStatus === 'optional' &&
    obligation.disposition?.strict !==
      'declare-implemented-or-deferred'
  ) {
    failures.push(`${obligation.id}: optional item lacks a decision gate`);
  }
  if (
    obligation.sourceAnchor?.documentId !== 'WAP-190_104-WAE-Spec' ||
    !obligation.sourceAnchor?.staticConformanceSection ||
    obligation.sourceAnchor?.changeSection !== '4.3' ||
    !obligation.referencedSection
  ) {
    failures.push(`${obligation.id}: source anchor is incomplete`);
  }
  if (
    !obligation.dependencyExpression?.type ||
    !Array.isArray(obligation.dependencyExpression?.references)
  ) {
    failures.push(`${obligation.id}: dependency expression is incomplete`);
  }

  const mapping = obligation.mapping;
  if (
    !mapping?.implementationDomain ||
    !Array.isArray(mapping?.ownerLayers) ||
    mapping.ownerLayers.length === 0 ||
    !Array.isArray(mapping?.requirementIds) ||
    !Array.isArray(mapping?.workItems) ||
    mapping.workItems.length === 0 ||
    !allowedImplementationStatuses.has(mapping?.implementationStatus) ||
    !mapping?.assessmentNote ||
    !Array.isArray(mapping?.implementationEvidence) ||
    !Array.isArray(mapping?.testEvidence)
  ) {
    failures.push(`${obligation.id}: traceability mapping is incomplete`);
  }

  const selected =
    obligation.disposition?.classCProfile ===
    'required-by-class-c-client-mcf';
  if (selected && mapping?.implementationStatus === 'not-assessed') {
    failures.push(`${obligation.id}: selected mandatory status is not assessed`);
  }
  if (!selected && mapping?.implementationStatus !== 'not-assessed') {
    failures.push(
      `${obligation.id}: non-selected WAE row must remain not-assessed in this pass`
    );
  }
  if (
    selected &&
    ['implemented', 'partial'].includes(mapping?.implementationStatus) &&
    (mapping.implementationEvidence.length === 0 ||
      mapping.testEvidence.length === 0 ||
      mapping.evidenceState !== 'direct-test-linked')
  ) {
    failures.push(
      `${obligation.id}: implemented/partial status requires direct code and test evidence`
    );
  }
  if (
    selected &&
    mapping?.implementationStatus === 'missing' &&
    mapping.evidenceState !== 'gap-work-item-mapped'
  ) {
    failures.push(`${obligation.id}: missing status must retain a gap lane`);
  }

  for (const evidence of mapping?.implementationEvidence ?? []) {
    const evidencePath = path.join(root, evidence.path ?? '');
    if (!evidence.path || !fs.existsSync(evidencePath)) {
      failures.push(
        `${obligation.id}: implementation path is missing: ${evidence.path}`
      );
      continue;
    }
    const sourceText = fs.readFileSync(evidencePath, 'utf8');
    if (!evidence.symbol || !sourceText.includes(evidence.symbol)) {
      failures.push(
        `${obligation.id}: implementation symbol is missing from ${evidence.path}: ${evidence.symbol}`
      );
    }
  }
  for (const evidence of mapping?.testEvidence ?? []) {
    const evidencePath = path.join(root, evidence.path ?? '');
    if (!evidence.path || !fs.existsSync(evidencePath)) {
      failures.push(`${obligation.id}: test path is missing: ${evidence.path}`);
      continue;
    }
    const testText = fs.readFileSync(evidencePath, 'utf8');
    if (!evidence.test || !testText.includes(`fn ${evidence.test}(`)) {
      failures.push(
        `${obligation.id}: test is missing from ${evidence.path}: ${evidence.test}`
      );
    }
    if (
      !evidence.command ||
      !evidence.command.includes('cargo test') ||
      !evidence.command.includes(evidence.test)
    ) {
      failures.push(`${obligation.id}: test command is not exact`);
    }
  }
}

const selectedIds = obligations
  .filter(
    (obligation) =>
      obligation.disposition?.classCProfile ===
      'required-by-class-c-client-mcf'
  )
  .map((obligation) => obligation.id);
const expectedSelectedIds = [
  'WAESpec-C-002',
  'WAESpec-C-003',
  'WAESpec-C-005',
  'WAESpec-C-006',
  'WAESpec-C-007',
  'WAESpec-C-015',
  'WAESpec-C-016',
  'WAESpec-C-017',
  'WAESpec-C-019',
  'WAESpec-C-020',
  'WAESpec-C-021'
];
if (JSON.stringify(selectedIds) !== JSON.stringify(expectedSelectedIds)) {
  failures.push('WAESpec:MCF must select the exact eleven effective client rows');
}

const genericWbxml = obligations.find(
  (obligation) => obligation.id === 'WAESpec-C-019'
);
const wmlc = obligations.find(
  (obligation) => obligation.id === 'WAESpec-C-020'
);
const wmlscriptc = obligations.find(
  (obligation) => obligation.id === 'WAESpec-C-021'
);
if (
  genericWbxml?.mapping?.implementationStatus !== 'missing' ||
  wmlc?.mapping?.implementationStatus !== 'implemented' ||
  wmlscriptc?.mapping?.implementationStatus !== 'missing'
) {
  failures.push('WAE media-type gap classification drift');
}

const removedRows = ledger.removedRows ?? [];
const removedIds = removedRows.map((row) => row.id);
if (removedRows.length !== 22 || new Set(removedIds).size !== 22) {
  failures.push('expected 22 unique SIN-removed WAE rows');
}
for (const requiredRemovedId of [
  'WAESpec-C-001',
  'WAESpec-C-024',
  'WAESpec-S-001',
  'WAESpec-S-024',
  'WAESpec-WVDT-S-012',
  'WAESpec-WVDT-S-013'
]) {
  if (!removedIds.includes(requiredRemovedId)) {
    failures.push(`removed-row history is missing ${requiredRemovedId}`);
  }
}
for (const removedId of removedIds) {
  if (obligationIds.includes(removedId)) {
    failures.push(`${removedId}: removed row leaked into active obligations`);
  }
}

const selectedRequired = obligations.filter(
  (obligation) =>
    obligation.disposition?.classCProfile ===
    'required-by-class-c-client-mcf'
);
const selectedOptional = obligations.filter(
  (obligation) =>
    obligation.disposition?.classCProfile ===
    'optional-not-required-by-class-c-client'
);
const selectedNotApplicable = obligations.filter(
  (obligation) =>
    obligation.disposition?.classCProfile ===
    'not-applicable-to-class-c-client'
);
if (
  selectedRequired.length !== 11 ||
  selectedOptional.length !== 40 ||
  selectedNotApplicable.length !== 35 ||
  ledger.summary?.selectedClassCRequiredCount !== 11 ||
  ledger.summary?.selectedClassCOptionalCount !== 40 ||
  ledger.summary?.selectedClassCNotApplicableCount !== 35
) {
  failures.push(
    'selected Class C WAE scope must be 11 required / 40 optional / 35 not applicable'
  );
}

function countBy(values, readKey) {
  const counts = {};
  for (const value of values) {
    const key = readKey(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort());
}

const expectedActorCounts = countBy(obligations, (obligation) => obligation.actor);
if (
  JSON.stringify(ledger.summary?.byActor) !==
  JSON.stringify(expectedActorCounts)
) {
  failures.push('summary.byActor does not match obligations');
}
const selectedStatusCounts = countBy(
  selectedRequired,
  (obligation) => obligation.mapping?.implementationStatus
);
if (
  JSON.stringify(selectedStatusCounts) !==
  JSON.stringify({ implemented: 5, missing: 3, partial: 3 }) ||
  JSON.stringify(ledger.summary?.selectedImplementationStatus) !==
  JSON.stringify(selectedStatusCounts)
) {
  failures.push(
    `selected WAE implementation audit drift: ${JSON.stringify(selectedStatusCounts)}`
  );
}
const selectedTestCount = selectedRequired.filter(
  (obligation) => obligation.mapping?.testEvidence?.length > 0
).length;
if (
  selectedTestCount !== 8 ||
  ledger.summary?.selectedDirectTestEvidenceCount !== selectedTestCount
) {
  failures.push('selected direct-test evidence count must remain 8/11');
}
if (
  ledger.summary?.itemCount !== obligations.length ||
  ledger.summary?.mandatoryCount !== mandatory.length ||
  ledger.summary?.optionalCount !== optional.length ||
  ledger.summary?.removedBySinCount !== removedRows.length
) {
  failures.push('summary totals do not match the WAE ledger');
}

const successorPdfPath = path.join(
  root,
  'spec-processing/source-material/WAP-236-WAESpec-20020207-a.pdf'
);
const successorPdfSha256 = crypto
  .createHash('sha256')
  .update(fs.readFileSync(successorPdfPath))
  .digest('hex');
if (
  ledger.successorDelta?.authority?.documentId !==
    'WAP-236-WAESpec-20020207-a' ||
  ledger.successorDelta?.authority?.sha256 !== successorPdfSha256 ||
  ledger.successorDelta?.authority?.targetNormative !== false ||
  ledger.successorDelta?.status !== 'selected-mcf-concept-delta-complete'
) {
  failures.push('WAP-236 successor authority or non-normative role drift');
}
const deltaMappings =
  ledger.successorDelta?.selectedMandatoryMappings ?? [];
if (
  deltaMappings.length !== 11 ||
  JSON.stringify(deltaMappings.map((entry) => entry.targetId)) !==
    JSON.stringify(expectedSelectedIds)
) {
  failures.push('successor delta must map each selected target row exactly once');
}
for (const entry of deltaMappings) {
  if (!allowedDeltaClassifications.has(entry.classification)) {
    failures.push(
      `${entry.targetId}: invalid delta classification=${entry.classification}`
    );
  }
  if (!Array.isArray(entry.successorIds) || !entry.note) {
    failures.push(`${entry.targetId}: successor delta entry is incomplete`);
  }
}

if (failures.length > 0) {
  console.error('WAP WAE conformance ledger check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 WAE conformance ledger');
console.log(
  `PASS ${obligations.length} active SCR rows (${mandatory.length} M / ${optional.length} O) and ${removedRows.length} SIN-removed rows`
);
console.log(
  `PASS WAP-215 Class C scope: ${selectedRequired.length} required / ${selectedOptional.length} optional / ${selectedNotApplicable.length} server-only`
);
console.log(
  `PASS selected implementation audit: ${selectedStatusCounts.implemented} implemented / ${selectedStatusCounts.partial} partial / ${selectedStatusCounts.missing} missing`
);
console.log(
  `PASS WAP-236 delta: ${deltaMappings.length}/${selectedRequired.length} selected WAE concepts classified as successor evidence only`
);
