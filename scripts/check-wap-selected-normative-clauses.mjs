#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestDirectory = path.join(
  root,
  'spec-processing/source-manifests'
);
const ledgerPath = path.join(
  manifestDirectory,
  'wap-1.2.1-selected-normative-clauses.json'
);
const ledger = readJson(ledgerPath);
const release = readJson(
  path.join(manifestDirectory, 'wap-1.2.1-release.json')
);
const ingestion = readJson(
  path.join(manifestDirectory, 'wap-1.2.1-ingestion-status.json')
);
const externalIngestion = readJson(
  path.join(
    manifestDirectory,
    'wap-1.2.1-external-ingestion-status.json'
  )
);
const effectiveSpec = readJson(
  path.join(manifestDirectory, 'wap-1.2.1-effective-spec.json')
);
const classConformance = readJson(
  path.join(manifestDirectory, 'wap-1.2.1-class-conformance.json')
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

const failures = [];
const coveredFamilies = [
  'wml',
  'wae',
  'wbxml',
  'caching',
  'wcmp',
  'wsp',
  'wdp'
];
const remainingFamilies = ['wmlscript', 'wmlscript-libraries'];
const familyDefinitions = new Map([
  [
    'wml',
    {
      ledgerFile: 'wap-1.2.1-wml-scr.json',
      selectedDisposition: 'required-by-class-c-client-mcf',
      expectedParents: 39,
      expectedClauses: 174
    }
  ],
  [
    'wae',
    {
      ledgerFile: 'wap-1.2.1-wae-scr.json',
      selectedDisposition: 'required-by-class-c-client-mcf',
      expectedParents: 11,
      expectedClauses: 39
    }
  ],
  [
    'wbxml',
    {
      ledgerFile: 'wap-1.2.1-wbxml-scr.json',
      selectedDisposition: 'required-by-class-c-client-mcf',
      expectedParents: 3,
      expectedClauses: 48
    }
  ],
  [
    'caching',
    {
      ledgerFile: 'wap-1.2.1-caching-scr.json',
      selectedDisposition: 'required-by-class-c-client-mcf',
      expectedParents: 5,
      expectedClauses: 68
    }
  ],
  [
    'wcmp',
    {
      ledgerFile: 'wap-1.2.1-wcmp-scr.json',
      selectedDisposition: 'required-by-selected-class-c-transport-path',
      expectedParents: 5,
      expectedClauses: 28
    }
  ],
  [
    'wsp',
    {
      ledgerFile: 'wap-1.2.1-wsp-scr.json',
      selectedDisposition: 'required-by-selected-class-c-transport-path',
      expectedParents: 8,
      expectedClauses: 57
    }
  ],
  [
    'wdp',
    {
      ledgerFile: 'wap-1.2.1-wdp-scr.json',
      selectedDisposition: 'required-by-selected-class-c-transport-path',
      expectedParents: 9,
      expectedClauses: 49
    }
  ]
]);
const allowedForces = new Set([
  'implicit-must',
  'explicit-must',
  'explicit-should',
  'explicit-may',
  'grammar',
  'table',
  'error-condition'
]);
const expectedLevelByForce = {
  'implicit-must': 'required',
  'explicit-must': 'required',
  'explicit-should': 'recommended',
  'explicit-may': 'permitted',
  grammar: 'required',
  table: 'required',
  'error-condition': 'required'
};
const allowedFixtureKinds = new Set([
  'parser',
  'transport-boundary',
  'state-machine',
  'runtime',
  'error-policy',
  'security-policy',
  'rendering',
  'binary-decoder'
]);
const hashPattern = /^[a-f0-9]{64}$/;
const releaseById = new Map(
  release.members.map((member) => [member.documentId, member])
);
const ingestionById = new Map(
  ingestion.members.map((member) => [member.documentId, member])
);
const externalIngestionById = new Map(
  externalIngestion.dependencies.map((dependency) => [
    dependency.dependencyId,
    dependency
  ])
);

if (ledger.schemaVersion !== 1) {
  failures.push(`schemaVersion=${ledger.schemaVersion}; expected 1`);
}
if (ledger.releaseId !== release.release.id) {
  failures.push('selected-clause ledger release lock drift');
}
if (
  ledger.target?.classProfile !==
    'WAP-215 Class C client (CCR-CLASSC-C-001)' ||
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001'
) {
  failures.push('selected-clause ledger must target the WAP-215 Class C client');
}
if (
  ledger.generatedFrom?.programWorkItem !== 'CONF-003' ||
  ledger.generatedFrom?.generator !==
    'spec-processing/scripts/generate-wap-selected-normative-clauses.mjs' ||
  !/^\d{4}-\d{2}-\d{2}$/.test(ledger.generatedFrom?.recordedOn ?? '')
) {
  failures.push('generator provenance or CONF-003 ownership is incomplete');
}
if (
  !ledger.generatedFrom?.redistributionPolicy?.includes(
    'full text extractions remain outside Git'
  )
) {
  failures.push('redistribution boundary is not explicit');
}
if (
  ledger.scope?.status !== 'in-progress' ||
  ledger.scope?.selectedProfileParentCount !== 201 ||
  JSON.stringify(ledger.scope?.coveredFamilies) !==
    JSON.stringify(coveredFamilies) ||
  JSON.stringify(ledger.scope?.remainingFamilies) !==
    JSON.stringify(remainingFamilies) ||
  ledger.scope?.coveredSelectedParentCount !== 80 ||
  ledger.scope?.remainingSelectedParentCount !== 121 ||
  !ledger.scope?.completionRule?.includes('CONF-003 remains open')
) {
  failures.push('partial nine-family scope accounting drift');
}
if (
  !ledger.interpretation?.normativeForce?.includes('implicit-MUST') ||
  !ledger.interpretation?.deduplication?.includes('multiple selected SCR') ||
  !ledger.interpretation?.implementationAssessment?.includes(
    'not-assessed'
  )
) {
  failures.push('clause interpretation and evidence policy drift');
}

const actualFamilies = (ledger.families ?? []).map((family) => family.family);
if (JSON.stringify(actualFamilies) !== JSON.stringify(coveredFamilies)) {
  failures.push('covered family order differs from the current CONF-003 slice');
}

const globalClauseIds = new Set();
const globalFixtureIds = new Set();
const globalClauseKeys = new Set();
let selectedParentCount = 0;
let clauseCount = 0;
let requiredClauseCount = 0;
let recommendedClauseCount = 0;
let permittedClauseCount = 0;
let multiParentClauseCount = 0;

for (const family of ledger.families ?? []) {
  const definition = familyDefinitions.get(family.family);
  if (!definition) {
    failures.push(`${family.family}: unexpected covered family`);
    continue;
  }
  const parentLedgerPath = path.join(
    manifestDirectory,
    definition.ledgerFile
  );
  const expectedParentLedgerPath =
    `spec-processing/source-manifests/${definition.ledgerFile}`;
  const parentLedgerText = fs.readFileSync(parentLedgerPath, 'utf8');
  const parentLedger = JSON.parse(parentLedgerText);
  const selectedParents = parentLedger.obligations.filter(
    (obligation) =>
      obligation.disposition?.classCProfile ===
      definition.selectedDisposition
  );
  const selectedById = new Map(
    selectedParents.map((parent) => [parent.id, parent])
  );
  const effectiveFamily = effectiveSpec.families.find(
    (candidate) => candidate.family === family.family
  );

  if (
    family.status !== 'nested-clauses-anchored-fixtures-planned' ||
    family.parentLedger !== expectedParentLedgerPath ||
    family.parentLedgerSha256 !== sha256(parentLedgerText) ||
    family.selectedDisposition !== definition.selectedDisposition ||
    JSON.stringify(family.effectiveSequence) !==
      JSON.stringify(effectiveFamily?.effectiveSequence)
  ) {
    failures.push(`${family.family}: family authority or status drift`);
  }
  if (
    family.selectedParentCount !== definition.expectedParents ||
    family.clauseCount !== definition.expectedClauses ||
    family.parents?.length !== definition.expectedParents ||
    family.clauses?.length !== definition.expectedClauses
  ) {
    failures.push(
      `${family.family}: expected ${definition.expectedParents} parents / ${definition.expectedClauses} clauses`
    );
  }

  for (const source of family.clauseSources ?? []) {
    const releaseMember = releaseById.get(source.documentId);
    const ingestionMember = ingestionById.get(source.documentId);
    const externalDependency = externalIngestionById.get(source.documentId);
    const externalArtifact = externalDependency?.artifacts.find(
      (artifact) => artifact.id === source.artifactId
    );
    const releaseSourceValid =
      source.sourceKind === 'release-member' &&
      releaseMember &&
      ingestionMember &&
      source.filename === releaseMember.filename &&
      source.pdfSha256 === releaseMember.sha256 &&
      source.textExtractionSha256 === ingestionMember.parsedText?.sha256;
    const externalSourceValid =
      source.sourceKind === 'external-dependency' &&
      externalDependency &&
      externalArtifact &&
      source.authority === externalDependency.authority &&
      source.authorityRecordUrl ===
        externalDependency.authorityRecordUrl &&
      source.artifactSha256 === externalArtifact.sha256 &&
      source.artifactBytes === externalArtifact.bytes;
    if (!releaseSourceValid && !externalSourceValid) {
      failures.push(
        `${family.family}/${source.documentId}: clause source lock drift`
      );
    }
  }
  const clauseSourceIds = new Set(
    (family.clauseSources ?? []).map((source) => source.documentId)
  );

  const actualParentIds = (family.parents ?? []).map((parent) => parent.id);
  const expectedParentIds = selectedParents.map((parent) => parent.id);
  if (JSON.stringify(actualParentIds) !== JSON.stringify(expectedParentIds)) {
    failures.push(`${family.family}: selected parent set/order drift`);
  }

  const clauseById = new Map(
    (family.clauses ?? []).map((candidate) => [candidate.id, candidate])
  );
  if (clauseById.size !== family.clauses?.length) {
    failures.push(`${family.family}: duplicate family clause IDs`);
  }

  for (const parent of family.parents ?? []) {
    const sourceParent = selectedById.get(parent.id);
    if (!sourceParent) {
      failures.push(`${family.family}/${parent.id}: parent is not selected`);
      continue;
    }
    if (
      parent.feature !== sourceParent.feature ||
      parent.referencedSection !== sourceParent.referencedSection ||
      JSON.stringify(parent.sourceAnchor) !==
        JSON.stringify(sourceParent.sourceAnchor) ||
      parent.implementationStatus !==
        sourceParent.mapping.implementationStatus ||
      JSON.stringify(parent.ownerLayers) !==
        JSON.stringify(sourceParent.mapping.ownerLayers) ||
      JSON.stringify(parent.workItems) !==
        JSON.stringify(sourceParent.mapping.workItems) ||
      !Array.isArray(parent.clauseIds) ||
      parent.clauseIds.length === 0
    ) {
      failures.push(
        `${family.family}/${parent.id}: parent traceability drift`
      );
    }
    const expectedClauseIds = (family.clauses ?? [])
      .filter((candidate) => candidate.parentRows.includes(parent.id))
      .map((candidate) => candidate.id)
      .sort();
    if (
      JSON.stringify(parent.clauseIds) !== JSON.stringify(expectedClauseIds)
    ) {
      failures.push(
        `${family.family}/${parent.id}: inverse clause mapping drift`
      );
    }
    for (const clauseId of parent.clauseIds ?? []) {
      if (!clauseById.has(clauseId)) {
        failures.push(
          `${family.family}/${parent.id}: unknown clause ${clauseId}`
        );
      }
    }
  }

  for (const candidate of family.clauses ?? []) {
    clauseCount += 1;
    if (
      globalClauseIds.has(candidate.id) ||
      !candidate.id.startsWith(`${family.family.toUpperCase()}-CL-`)
    ) {
      failures.push(`${candidate.id}: duplicate or invalid clause ID`);
    }
    globalClauseIds.add(candidate.id);
    if (
      !Array.isArray(candidate.parentRows) ||
      candidate.parentRows.length === 0 ||
      new Set(candidate.parentRows).size !== candidate.parentRows.length
    ) {
      failures.push(`${candidate.id}: invalid parent row mapping`);
    }
    if (candidate.parentRows?.length > 1) {
      multiParentClauseCount += 1;
    }
    const parents = (candidate.parentRows ?? [])
      .map((parentId) => selectedById.get(parentId))
      .filter(Boolean);
    if (parents.length !== candidate.parentRows?.length) {
      failures.push(`${candidate.id}: references a non-selected parent`);
    }

    if (
      !candidate.sourceAnchor?.section ||
      !candidate.sourceAnchor?.heading ||
      !hashPattern.test(
        candidate.sourceAnchor?.normalizedTextSha256 ?? ''
      ) ||
      !clauseSourceIds.has(candidate.sourceAnchor?.documentId)
    ) {
      failures.push(`${candidate.id}: incomplete or unlocked source anchor`);
    }
    if (
      !allowedForces.has(candidate.normativeForce) ||
      candidate.obligationLevel !==
        expectedLevelByForce[candidate.normativeForce]
    ) {
      failures.push(`${candidate.id}: normative force/level drift`);
    }
    if (
      typeof candidate.obligationSynopsis !== 'string' ||
      candidate.obligationSynopsis.length < 20 ||
      candidate.obligationSynopsis.length > 280 ||
      candidate.obligationSynopsis.includes('\n') ||
      candidate.obligationSynopsis.trim().split(/\s+/).length > 45
    ) {
      failures.push(
        `${candidate.id}: synopsis violates the redistribution-safe shape`
      );
    }
    const clauseKey = [
      candidate.family,
      candidate.sourceAnchor?.section,
      candidate.obligationSynopsis
    ].join('\u0000');
    if (globalClauseKeys.has(clauseKey)) {
      failures.push(`${candidate.id}: duplicate anchored clause synopsis`);
    }
    globalClauseKeys.add(clauseKey);

    const expectedOwners = [
      ...new Set(parents.flatMap((parent) => parent.mapping.ownerLayers))
    ].sort();
    const expectedWorkItems = [
      ...new Set(parents.flatMap((parent) => parent.mapping.workItems))
    ].sort();
    const expectedRequirements = [
      ...new Set(parents.flatMap((parent) => parent.mapping.requirementIds))
    ].sort();
    const expectedSnapshot = Object.fromEntries(
      parents.map((parent) => [
        parent.id,
        parent.mapping.implementationStatus
      ])
    );
    if (
      JSON.stringify(candidate.mapping?.ownerLayers) !==
        JSON.stringify(expectedOwners) ||
      JSON.stringify(candidate.mapping?.workItems) !==
        JSON.stringify(expectedWorkItems) ||
      JSON.stringify(candidate.mapping?.requirementIds) !==
        JSON.stringify(expectedRequirements) ||
      JSON.stringify(candidate.mapping?.parentImplementationSnapshot) !==
        JSON.stringify(expectedSnapshot) ||
      candidate.mapping?.clauseImplementationStatus !== 'not-assessed' ||
      !candidate.mapping?.evidenceGate?.includes(
        'source-derived direct fixture'
      )
    ) {
      failures.push(`${candidate.id}: owner/work/evidence mapping drift`);
    }

    if (
      !candidate.fixturePlan?.id ||
      globalFixtureIds.has(candidate.fixturePlan.id) ||
      candidate.fixturePlan.status !== 'planned' ||
      !allowedFixtureKinds.has(candidate.fixturePlan.kind) ||
      candidate.fixturePlan.assertion !== candidate.obligationSynopsis
    ) {
      failures.push(`${candidate.id}: direct fixture plan is incomplete`);
    }
    globalFixtureIds.add(candidate.fixturePlan?.id);

    if (candidate.obligationLevel === 'required') requiredClauseCount += 1;
    if (candidate.obligationLevel === 'recommended') {
      recommendedClauseCount += 1;
    }
    if (candidate.obligationLevel === 'permitted') permittedClauseCount += 1;
  }

  selectedParentCount += family.parents?.length ?? 0;
}

if (multiParentClauseCount === 0) {
  failures.push('clause deduplication is not demonstrated across SCR parents');
}
const expectedSummary = {
  selectedParentCount,
  clauseCount,
  requiredClauseCount,
  recommendedClauseCount,
  permittedClauseCount,
  plannedFixtureCount: clauseCount,
  assessedClauseCount: 0
};
if (
  selectedParentCount !== 80 ||
  clauseCount !== 463 ||
  JSON.stringify(ledger.summary) !== JSON.stringify(expectedSummary)
) {
  failures.push(
    `summary drift: ${selectedParentCount} parents / ${clauseCount} clauses`
  );
}

const forbiddenKeys = new Set([
  'sourceText',
  'sourceExcerpt',
  'normativeText',
  'verbatimQuote'
]);
function rejectProtectedPayload(value, location = 'ledger') {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      rejectProtectedPayload(item, `${location}[${index}]`)
    );
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) {
      failures.push(`${location}.${key}: protected source payload is forbidden`);
    }
    rejectProtectedPayload(child, `${location}.${key}`);
  }
}
rejectProtectedPayload(ledger);

if (failures.length > 0) {
  console.error('WAP selected normative-clause ledger check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 selected normative clauses');
console.log(
  `PASS current CONF-003 slice: ${selectedParentCount}/201 selected parents across WML, WAE, WBXML, caching, WCMP, WSP, and WDP`
);
console.log(
  `PASS ${clauseCount} deduplicated clauses (${requiredClauseCount} required / ${recommendedClauseCount} recommended / ${permittedClauseCount} permitted)`
);
console.log(
  `PASS ${clauseCount} source-anchored fixture plans; protected source text remains outside Git`
);
