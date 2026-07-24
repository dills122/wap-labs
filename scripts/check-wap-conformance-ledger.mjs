#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const ledgerPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-wml-scr.json'
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
const allowedActors = new Set([
  'wml-user-agent',
  'wml-encoder',
  'wml-document-server',
  'wml-document-client'
]);
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
const releaseMembers = new Map(
  release.members.map((member) => [member.documentId, member])
);
const wmlFamily = effectiveSpec.families.find(
  (family) => family.family === 'wml'
);
const effectiveDocuments = new Map(
  (wmlFamily?.documents ?? []).map((document) => [
    document.documentId,
    document
  ])
);

if (ledger.schemaVersion !== 1) {
  failures.push(`schemaVersion=${ledger.schemaVersion}; expected 1`);
}
if (ledger.releaseId !== release.release.id || ledger.family !== 'wml') {
  failures.push('ledger must target the locked WAP 1.2.1 WML family');
}
if (
  ledger.target?.classProfile !==
  'WAP-215 Class C client (CCR-CLASSC-C-001)'
) {
  failures.push('ledger must target the selected WAP-215 Class C client');
}
if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001' ||
  !classConformance.selectedTarget?.requirementExpressions?.includes('WML:MCF')
) {
  failures.push('class-conformance ledger must select Class C client WML:MCF');
}
if (
  ledger.authority?.classProfileSource?.documentId !==
    classConformance.authority?.documentId ||
  ledger.authority?.classProfileSource?.sha256 !==
    classConformance.authority?.sha256
) {
  failures.push('WML ledger class-profile source lock drift');
}

for (const source of ledger.authority?.extractionSources ?? []) {
  const releaseMember = releaseMembers.get(source.documentId);
  const effectiveDocument = effectiveDocuments.get(source.documentId);
  if (!releaseMember || !effectiveDocument) {
    failures.push(`${source.documentId}: source is absent from release/effective locks`);
    continue;
  }
  if (
    source.sha256 !== releaseMember.sha256 ||
    source.sha256 !== effectiveDocument.sha256
  ) {
    failures.push(`${source.documentId}: source SHA-256 drift`);
  }
}

const obligations = ledger.obligations ?? [];
const expectedIds = Array.from({ length: 76 }, (_, index) => {
  const number = index + 1;
  const prefix = number >= 60 && number <= 69 ? 'S' : 'C';
  return `WML-${prefix}-${String(number).padStart(2, '0')}`;
});
const actualIds = obligations.map((obligation) => obligation.id);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  failures.push('SCR IDs must be the exact actor-prefixed 01..76 sequence');
}

const mandatory = obligations.filter(
  (obligation) => obligation.specificationStatus === 'mandatory'
);
const optional = obligations.filter(
  (obligation) => obligation.specificationStatus === 'optional'
);
if (obligations.length !== 76 || mandatory.length !== 47 || optional.length !== 29) {
  failures.push(
    `expected 76 obligations (47 M / 29 O); found ${obligations.length} (${mandatory.length} M / ${optional.length} O)`
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
    obligation.actor === 'wml-user-agent'
      ? obligation.specificationStatus === 'mandatory'
        ? 'required-by-class-c-client-mcf'
        : 'optional-not-required-by-class-c-client'
      : obligation.actor === 'wml-document-client'
        ? 'optional-not-required-by-class-c-client'
        : 'not-applicable-to-class-c-client';
  if (
    obligation.disposition?.classCProfile !== expectedClassCDisposition
  ) {
    failures.push(
      `${obligation.id}: Class C disposition=${obligation.disposition?.classCProfile}; expected ${expectedClassCDisposition}`
    );
  }
  if (obligation.disposition?.enhancementMayReplaceStrictBehavior !== false) {
    failures.push(`${obligation.id}: enhancements must not replace strict behavior`);
  }
  if (
    obligation.specificationStatus === 'mandatory' &&
    obligation.disposition?.strict !== 'required-for-claimed-actor'
  ) {
    failures.push(`${obligation.id}: mandatory item lost strict disposition`);
  }
  if (
    obligation.specificationStatus === 'optional' &&
    obligation.disposition?.strict !== 'declare-implemented-or-deferred'
  ) {
    failures.push(`${obligation.id}: optional item lacks an explicit decision gate`);
  }
  if (
    !obligation.sourceAnchor?.documentId ||
    !obligation.sourceAnchor?.staticConformanceSection ||
    !obligation.referencedSection
  ) {
    failures.push(`${obligation.id}: source anchor is incomplete`);
  }
  if (
    !obligation.mapping?.implementationDomain ||
    !Array.isArray(obligation.mapping?.ownerLayers) ||
    obligation.mapping.ownerLayers.length === 0 ||
    !Array.isArray(obligation.mapping?.workItems) ||
    obligation.mapping.workItems.length === 0 ||
    !Array.isArray(obligation.mapping?.requirementIds) ||
    !Array.isArray(obligation.mapping?.implementationEvidence) ||
    !Array.isArray(obligation.mapping?.testEvidence) ||
    !allowedImplementationStatuses.has(
      obligation.mapping?.implementationStatus
    ) ||
    !obligation.mapping?.assessmentNote
  ) {
    failures.push(`${obligation.id}: traceability mapping is incomplete`);
  }
  if (
    obligation.specificationStatus === 'mandatory' &&
    obligation.mapping?.workItems?.every((id) => id === 'R0-01') &&
    obligation.mapping?.testEvidence?.length === 0
  ) {
    failures.push(
      `${obligation.id}: mandatory item needs evidence or an implementation work item beyond R0-01`
    );
  }
  if (
    obligation.specificationStatus === 'mandatory' &&
    obligation.mapping?.implementationStatus === 'not-assessed'
  ) {
    failures.push(`${obligation.id}: mandatory implementation status is not assessed`);
  }
  if (
    obligation.specificationStatus === 'optional' &&
    obligation.mapping?.implementationStatus !== 'not-assessed'
  ) {
    failures.push(
      `${obligation.id}: optional implementation status must wait for the capability pass`
    );
  }
  if (
    ['implemented', 'partial'].includes(
      obligation.mapping?.implementationStatus
    ) &&
    (obligation.mapping?.implementationEvidence?.length === 0 ||
      obligation.mapping?.testEvidence?.length === 0 ||
      obligation.mapping?.evidenceState !== 'direct-test-linked')
  ) {
    failures.push(
      `${obligation.id}: implemented/partial status requires direct code and test evidence`
    );
  }
  if (
    obligation.mapping?.implementationStatus === 'missing' &&
    obligation.mapping?.evidenceState !== 'gap-work-item-mapped'
  ) {
    failures.push(`${obligation.id}: missing status must retain an open gap lane`);
  }

  for (const evidence of obligation.mapping?.implementationEvidence ?? []) {
    const evidencePath = path.join(root, evidence.path ?? '');
    if (!evidence.path || !fs.existsSync(evidencePath)) {
      failures.push(`${obligation.id}: implementation path is missing: ${evidence.path}`);
      continue;
    }
    const sourceText = fs.readFileSync(evidencePath, 'utf8');
    if (!evidence.symbol || !sourceText.includes(evidence.symbol)) {
      failures.push(
        `${obligation.id}: implementation symbol is missing from ${evidence.path}: ${evidence.symbol}`
      );
    }
  }
  for (const evidence of obligation.mapping?.testEvidence ?? []) {
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
      failures.push(`${obligation.id}: test command is not exact for ${evidence.test}`);
    }
  }
}

const dependentImage = obligations.find(
  (obligation) => obligation.id === 'WML-C-32'
);
if (
  JSON.stringify(dependentImage?.dependencyExpression) !==
  JSON.stringify({ type: 'all-of', scrIds: ['WML-C-54'] })
) {
  failures.push('WML-C-32 must preserve its explicit WML-C-54 dependency');
}
const tabindex = obligations.find(
  (obligation) => obligation.id === 'WML-C-76'
);
if (
  tabindex?.sourceAnchor?.documentId !== 'WAP-191_105-WML' ||
  tabindex?.sourceAnchor?.changeSection !== '3.3' ||
  tabindex?.actor !== 'wml-user-agent' ||
  tabindex?.specificationStatus !== 'optional'
) {
  failures.push('WML-C-76 must remain the optional user-agent SIN 105 addition');
}

const actorCounts = {};
for (const obligation of obligations) {
  actorCounts[obligation.actor] = (actorCounts[obligation.actor] ?? 0) + 1;
}
const sortedActorCounts = Object.fromEntries(Object.entries(actorCounts).sort());
if (
  JSON.stringify(ledger.summary?.byActor) !==
  JSON.stringify(sortedActorCounts)
) {
  failures.push('summary.byActor does not match obligations');
}
if (
  ledger.summary?.itemCount !== obligations.length ||
  ledger.summary?.mandatoryCount !== mandatory.length ||
  ledger.summary?.optionalCount !== optional.length
) {
  failures.push('summary totals do not match obligations');
}
const selectedClassCRequired = obligations.filter(
  (obligation) =>
    obligation.disposition?.classCProfile ===
    'required-by-class-c-client-mcf'
);
const selectedClassCOptional = obligations.filter(
  (obligation) =>
    obligation.disposition?.classCProfile ===
    'optional-not-required-by-class-c-client'
);
const selectedClassCNotApplicable = obligations.filter(
  (obligation) =>
    obligation.disposition?.classCProfile ===
    'not-applicable-to-class-c-client'
);
if (
  ledger.summary?.selectedClassCRequiredCount !== 39 ||
  ledger.summary?.selectedClassCOptionalCount !== 27 ||
  ledger.summary?.selectedClassCNotApplicableCount !== 10 ||
  selectedClassCRequired.length !== 39 ||
  selectedClassCOptional.length !== 27 ||
  selectedClassCNotApplicable.length !== 10
) {
  failures.push(
    'selected Class C WML scope must be 39 required / 27 optional / 10 not applicable'
  );
}

const mandatoryStatusCounts = {};
for (const obligation of mandatory) {
  const status = obligation.mapping?.implementationStatus;
  mandatoryStatusCounts[status] = (mandatoryStatusCounts[status] ?? 0) + 1;
}
const sortedMandatoryStatusCounts = Object.fromEntries(
  Object.entries(mandatoryStatusCounts).sort()
);
if (
  JSON.stringify(ledger.summary?.mandatoryImplementationStatus) !==
  JSON.stringify(sortedMandatoryStatusCounts)
) {
  failures.push(
    'summary.mandatoryImplementationStatus does not match mandatory obligations'
  );
}
if (
  JSON.stringify(sortedMandatoryStatusCounts) !==
  JSON.stringify({ implemented: 2, missing: 22, partial: 23 })
) {
  failures.push(
    `mandatory implementation audit drift: ${JSON.stringify(sortedMandatoryStatusCounts)}`
  );
}
const linkedEvidenceCount = obligations.filter(
  (obligation) => obligation.mapping?.testEvidence?.length > 0
).length;
if (ledger.summary?.testEvidenceLinkedCount !== linkedEvidenceCount) {
  failures.push('summary.testEvidenceLinkedCount does not match obligations');
}

if (failures.length > 0) {
  console.error('WAP conformance ledger check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 conformance ledger');
console.log(
  `PASS WML 1.3: ${obligations.length} effective SCR obligations (${mandatory.length} M / ${optional.length} O)`
);
console.log(
  'PASS actors, source hashes, dependency expressions, dispositions, and work-item mappings'
);
console.log(
  `PASS WAP-215 Class C scope: ${selectedClassCRequired.length} required / ${selectedClassCOptional.length} optional / ${selectedClassCNotApplicable.length} not applicable`
);
console.log(
  `PASS mandatory implementation audit: ${mandatoryStatusCounts.implemented} implemented / ${mandatoryStatusCounts.partial} partial / ${mandatoryStatusCounts.missing} missing`
);
console.log(
  `PASS direct test evidence linked: ${ledger.summary.testEvidenceLinkedCount}/${obligations.length} obligations`
);

const waeCheck = spawnSync(
  process.execPath,
  ['scripts/check-wap-wae-conformance-ledger.mjs'],
  {
    cwd: root,
    stdio: 'inherit'
  }
);
if (waeCheck.status !== 0) {
  process.exit(waeCheck.status ?? 1);
}

const wbxmlCheck = spawnSync(
  process.execPath,
  ['scripts/check-wap-wbxml-conformance-ledger.mjs'],
  {
    cwd: root,
    stdio: 'inherit'
  }
);
if (wbxmlCheck.status !== 0) {
  process.exit(wbxmlCheck.status ?? 1);
}
