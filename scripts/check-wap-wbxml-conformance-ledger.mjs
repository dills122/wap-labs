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
const selectedNormativeClauses = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json'
    ),
    'utf8'
  )
);
const conformanceCorpusPath = path.join(
  root,
  'transport-rust/tests/fixtures/transport/wbxml_wml13/conformance.json'
);
const conformanceCorpus = JSON.parse(
  fs.readFileSync(conformanceCorpusPath, 'utf8')
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
    if (
      evidence.fixture &&
      !fs.existsSync(path.join(root, evidence.fixture))
    ) {
      failures.push(
        `${obligation.id}: missing fixture path ${evidence.fixture}`
      );
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
  statusById.get('WBXML-C-010') !== 'partial' ||
  statusById.get('WBXML-C-011') !== 'partial'
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
  ledger.summary?.selectedDirectNormativeTestEvidenceCount !== 3 ||
  ledger.summary?.selectedBoundaryTestEvidenceCount !== 0 ||
  ledger.summary?.selectedImplementedClauseCount !== 47 ||
  ledger.summary?.selectedNotAssessedClauseCount !== 0 ||
  ledger.summary?.fixedOutcomeFixtureCount !== 42 ||
  ledger.summary?.unselectedEncoderClauseCount !== 1
) {
  failures.push('WBXML summary counts drift');
}

const wbxmlClauseFamily = selectedNormativeClauses.families?.find(
  (family) => family.family === 'wbxml'
);
const unselectedEncoderClauses = ledger.unselectedEncoderClauses ?? [];
const unrepresentableName = unselectedEncoderClauses.find(
  (clause) => clause.id === 'WBXML-CL-CHARSET-UNREPRESENTABLE-NAME'
);
if (
  unselectedEncoderClauses.length !== 1 ||
  unrepresentableName?.actor !== 'wbxml-server-encoder' ||
  JSON.stringify(unrepresentableName?.parentRows) !==
    JSON.stringify(['WBXML-S-001']) ||
  unrepresentableName?.sourceAnchor?.documentId !== 'WAP-192-WBXML' ||
  unrepresentableName?.sourceAnchor?.section !== '5.2' ||
  unrepresentableName?.disposition?.classCProfile !==
    'not-applicable-to-class-c-client' ||
  unrepresentableName?.implementationStatus !== 'not-assessed' ||
  (wbxmlClauseFamily?.clauses ?? []).some(
    (clause) => clause.id === 'WBXML-CL-CHARSET-UNREPRESENTABLE-NAME'
  )
) {
  failures.push(
    'encoder-only unrepresentable-name clause profile disposition drift'
  );
}
const canonicalClauseIds = new Set(
  (wbxmlClauseFamily?.clauses ?? []).map((clause) => clause.id)
);
const parentClauseIds = new Map(
  (wbxmlClauseFamily?.parents ?? []).map((parent) => [
    parent.id,
    new Set(parent.clauseIds)
  ])
);
const corpusFixtures = conformanceCorpus.fixtures ?? [];
const corpusFixtureIds = new Set();
const corpusScrIds = new Set();
const citedClauseIds = new Set();
const equivalenceGroups = new Map();
const implementedClauseIds = new Set(
  conformanceCorpus.implementedClauses ?? []
);

if (
  conformanceCorpus.schemaVersion !== 2 ||
  conformanceCorpus.decoder !== 'lowband-wml13-wbxml/0.3.0' ||
  JSON.stringify(conformanceCorpus.sourceDocuments) !==
    JSON.stringify(['WAP-192-WBXML', 'WAP-191_104-WML'])
) {
  failures.push('WBXML conformance corpus identity/source locks drift');
}

for (const fixture of corpusFixtures) {
  if (!fixture.id || corpusFixtureIds.has(fixture.id)) {
    failures.push(`invalid or duplicate WBXML fixture id=${fixture.id}`);
  }
  corpusFixtureIds.add(fixture.id);
  if (
    typeof fixture.bytesHex !== 'string' ||
    !/^(?:[0-9a-fA-F]{2}\s*)+$/.test(fixture.bytesHex)
  ) {
    failures.push(`${fixture.id}: bytesHex is not a complete octet stream`);
  }
  const hasExpectedXml =
    typeof fixture.expectedXml === 'string' && fixture.expectedXml.length > 0;
  const hasExpectedError =
    typeof fixture.expectedErrorContains === 'string' &&
    fixture.expectedErrorContains.length > 0;
  if (hasExpectedXml === hasExpectedError) {
    failures.push(
      `${fixture.id}: exactly one fixed success or failure outcome is required`
    );
  }
  if (
    !Array.isArray(fixture.scr) ||
    fixture.scr.length === 0 ||
    !Array.isArray(fixture.clauses) ||
    fixture.clauses.length === 0 ||
    !Array.isArray(fixture.sourceSections) ||
    fixture.sourceSections.length === 0
  ) {
    failures.push(`${fixture.id}: source-derived fixture metadata is incomplete`);
    continue;
  }

  const fixtureParentClauses = new Set();
  for (const scrId of fixture.scr) {
    corpusScrIds.add(scrId);
    if (!expectedSelectedIds.includes(scrId)) {
      failures.push(`${fixture.id}: non-selected SCR id=${scrId}`);
      continue;
    }
    for (const clauseId of parentClauseIds.get(scrId) ?? []) {
      fixtureParentClauses.add(clauseId);
    }
  }
  for (const clauseId of fixture.clauses) {
    citedClauseIds.add(clauseId);
    if (
      !canonicalClauseIds.has(clauseId) ||
      !fixtureParentClauses.has(clauseId)
    ) {
      failures.push(
        `${fixture.id}: clause ${clauseId} is not canonical for its listed SCR rows`
      );
    }
  }
  if (fixture.equivalentGroup) {
    if (!hasExpectedXml) {
      failures.push(
        `${fixture.id}: equivalence groups require a successful XML outcome`
      );
    }
    const outputs = equivalenceGroups.get(fixture.equivalentGroup) ?? [];
    outputs.push(fixture.expectedXml);
    equivalenceGroups.set(fixture.equivalentGroup, outputs);
  }
}

if (
  corpusFixtures.length !== 42 ||
  citedClauseIds.size !== 47 ||
  implementedClauseIds.size !== 47 ||
  JSON.stringify([...corpusScrIds].sort()) !==
    JSON.stringify([...expectedSelectedIds].sort())
) {
  failures.push('WBXML direct corpus coverage/count drift');
}
for (const clauseId of implementedClauseIds) {
  const clause = (wbxmlClauseFamily?.clauses ?? []).find(
    (candidate) => candidate.id === clauseId
  );
  if (
    !citedClauseIds.has(clauseId) ||
    clause?.fixturePlan?.status !== 'implemented' ||
    clause?.mapping?.clauseImplementationStatus !== 'implemented'
  ) {
    failures.push(
      `${clauseId}: implemented corpus evidence and clause status differ`
    );
  }
}
const deferredClauseIds = new Set(
  (wbxmlClauseFamily?.clauses ?? [])
    .filter((clause) => !implementedClauseIds.has(clause.id))
    .map((clause) => clause.id)
);
if (deferredClauseIds.size !== 0) {
  failures.push('WBXML deferred clause set drift');
}
const basicDeckOutputs = equivalenceGroups.get('basic-deck') ?? [];
const attributeFragmentOutputs =
  equivalenceGroups.get('attribute-fragments') ?? [];
if (
  basicDeckOutputs.length !== 2 ||
  new Set(basicDeckOutputs).size !== 1 ||
  attributeFragmentOutputs.length !== 2 ||
  new Set(attributeFragmentOutputs).size !== 1
) {
  failures.push('WBXML binary/literal equivalence groups drift');
}

const pageZeroMatrix = conformanceCorpus.pageZeroTokenEquivalence ?? {};
const pageZeroCategories = [
  ['tags', 36, ['name']],
  ['attributeStarts', 85, ['name', 'prefix']],
  ['attributeValues', 27, ['value']]
];
for (const [category, expectedCount, stringFields] of pageZeroCategories) {
  const entries = pageZeroMatrix[category] ?? [];
  const tokens = new Set();
  if (entries.length !== expectedCount) {
    failures.push(
      `WBXML page-zero ${category} count=${entries.length}; expected ${expectedCount}`
    );
  }
  for (const entry of entries) {
    if (
      !Number.isInteger(entry.token) ||
      entry.token < 0 ||
      entry.token > 255 ||
      tokens.has(entry.token) ||
      !stringFields.every((field) => typeof entry[field] === 'string')
    ) {
      failures.push(`WBXML page-zero ${category} inventory is invalid`);
      break;
    }
    tokens.add(entry.token);
  }
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
console.log('PASS selected implementation audit: 0 implemented / 3 partial / 0 missing');
console.log('PASS 42 fixed-outcome fixtures cite 47 canonical nested clauses');
console.log('PASS all 47 selected client clauses have direct evidence');
console.log('PASS encoder-only unrepresentable-name clause remains outside the selected client profile');
console.log('PASS exhaustive WML page-zero inventory: 36 tags / 85 attribute starts / 27 values');
console.log('PASS source locks, mappings, and direct evidence links');
