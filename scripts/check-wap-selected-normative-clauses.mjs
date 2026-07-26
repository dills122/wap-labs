#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestDirectory = path.join(root, 'spec-processing/source-manifests');
const ledgerPath = path.join(manifestDirectory, 'wap-1.2.1-selected-normative-clauses.json');
const ledger = readJson(ledgerPath);
const release = readJson(path.join(manifestDirectory, 'wap-1.2.1-release.json'));
const ingestion = readJson(path.join(manifestDirectory, 'wap-1.2.1-ingestion-status.json'));
const externalIngestion = readJson(
  path.join(manifestDirectory, 'wap-1.2.1-external-ingestion-status.json')
);
const effectiveSpec = readJson(path.join(manifestDirectory, 'wap-1.2.1-effective-spec.json'));
const classConformance = readJson(path.join(manifestDirectory, 'wap-1.2.1-class-conformance.json'));

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
  'wdp',
  'wmlscript',
  'wmlscript-libraries'
];
const remainingFamilies = [];
const familyDefinitions = new Map([
  [
    'wml',
    {
      ledgerFile: 'wap-1.2.1-wml-scr.json',
      selectedDisposition: 'required-by-class-c-client-mcf',
      expectedParents: 39,
      expectedClauses: 175
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
      expectedClauses: 47
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
      expectedParents: 2,
      expectedClauses: 9
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
  ],
  [
    'wmlscript',
    {
      ledgerFile: 'wap-1.2.1-wmlscript-scr.json',
      selectedDisposition: 'required-by-class-c-client-mcf',
      expectedParents: 41,
      expectedClauses: 107
    }
  ],
  [
    'wmlscript-libraries',
    {
      ledgerFile: 'wap-1.2.1-wmlscript-libraries-scr.json',
      selectedDisposition: 'required-by-class-c-client-mcf',
      expectedParents: 80,
      expectedClauses: 211
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
const trn702ClauseIds = new Set([
  'WDP-CL-UNITDATA-CONTENT-TRANSPARENCY',
  'WDP-CL-IP-MAPPING-FRAGMENTATION',
  'WDP-CL-UDP-LENGTH-BOUNDS',
  'WDP-CL-IPV4-TOTAL-LENGTH',
  'WDP-CL-IPV4-BASELINE-RECEIVE-SIZE',
  'WDP-CL-IPV4-LARGE-SEND-GUARD',
  'WDP-CL-IPV4-FRAGMENTATION-LOCATION',
  'WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY',
  'WDP-CL-IPV4-DONT-FRAGMENT'
]);
const wml303ClauseIds = new Set([
  'WML-CL-DO-ACTIVATION',
  'WML-CL-DO-EFFECTIVE-NAME',
  'WML-CL-DO-INACTIVE-HIDDEN',
  'WML-CL-DO-OPTIONAL-PERMISSION',
  'WML-CL-DO-STRUCTURE',
  'WML-CL-DO-TYPE-ACCEPTANCE',
  'WML-CL-GO-ENTRY-EVENT-PRECEDENCE',
  'WML-CL-GO-STRUCTURE',
  'WML-CL-HISTORY-PREV-POP',
  'WML-CL-INTRINSIC-ATTRIBUTE-EQUIVALENCE',
  'WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE',
  'WML-CL-INTRINSIC-CONFLICT-ERROR',
  'WML-CL-INTRINSIC-EVENT-TYPES',
  'WML-CL-INTRINSIC-ILLEGAL-PARENT',
  'WML-CL-INTRINSIC-SCOPE',
  'WML-CL-NOOP-NO-PROCESSING',
  'WML-CL-ONEVENT-SINGLE-TASK',
  'WML-CL-PREV-EMPTY-HISTORY',
  'WML-CL-PREV-ENTRY-EVENT-PRECEDENCE',
  'WML-CL-REFRESH-REDISPLAY',
  'WML-CL-SHADOW-ACTIVE-SET',
  'WML-CL-SHADOW-CARD-PRECEDENCE',
  'WML-CL-SHADOW-MATCHING',
  'WML-CL-SHADOW-NOOP-MASK',
  'WML-CL-TASK-FAILURE-ATOMICITY',
  'WML-CL-TEMPLATE-APPLIES-ALL-CARDS',
  'WML-CL-TEMPLATE-STRUCTURE'
]);
const trn706ClauseIds = new Set([
  'WDP-CL-CDPD-UDP-IP-PROFILE',
  'WDP-CL-UNITDATA-CONTENT-TRANSPARENCY',
  'WDP-CL-IP-MAPPING-FRAGMENTATION',
  'WDP-CL-UDP-HEADER-LAYOUT',
  'WDP-CL-UDP-LENGTH-BOUNDS',
  'WDP-CL-IPV4-HEADER-LAYOUT',
  'WDP-CL-IPV4-BASELINE-RECEIVE-SIZE',
  'WDP-CL-IPV4-FRAGMENTATION-LOCATION',
  'WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY',
  'WDP-CL-IPV4-HEADER-CHECKSUM',
  'WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS'
]);
const trn707ClauseIds = new Set([
  'WDP-CL-CONSISTENT-TRANSPORT-SERVICE',
  'WDP-CL-IP-BEARER-REQUIRES-UDP',
  'WDP-CL-CDPD-UDP-IP-PROFILE',
  'WDP-CL-UNITDATA-REQUEST-ANYTIME',
  'WDP-CL-UNITDATA-CONTENT-TRANSPARENCY',
  'WDP-CL-SELECTED-WSP-PORT',
  'WDP-CL-SELECTED-BEARER-ASSIGNMENT',
  'WCMP-CL-IP-NETWORKS-USE-ICMP',
  'WCMP-CL-CDPD-USES-ICMP'
]);
const trn708ClauseIds = new Set([
  'WCMP-CL-IP-NETWORKS-USE-ICMP',
  'WCMP-CL-CDPD-USES-ICMP',
  'WCMP-CL-ICMPV4-PROTOCOL',
  'WCMP-CL-ICMPV4-CHECKSUM',
  'WCMP-CL-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT',
  'WCMP-CL-ICMPV4-PORT-UNREACHABLE',
  'WCMP-CL-ICMPV4-FRAGMENTATION-NEEDED',
  'WCMP-CL-ICMPV4-ERROR-QUOTE',
  'WCMP-CL-ICMPV4-ECHO-ROUNDTRIP',
  'WDP-CL-CONSISTENT-TRANSPORT-SERVICE',
  'WDP-CL-IP-BEARER-REQUIRES-UDP',
  'WDP-CL-CDPD-UDP-IP-PROFILE',
  'WDP-CL-IPV4-DONT-FRAGMENT'
]);
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
const wml202ClauseIds = new Set([
  'WML-CL-ACCESS-ABSENT-ALLOWS',
  'WML-CL-ACCESS-COMPONENT-MATCH',
  'WML-CL-ACCESS-DEFAULTS',
  'WML-CL-ACCESS-REFERRER-MATCH',
  'WML-CL-ACCESS-RELATIVE-PATH',
  'WML-CL-ACCESS-SINGLE-ELEMENT',
  'WML-CL-ACCESS-URL-CASE-RULES',
  'WML-CL-CARD-COLLECTION',
  'WML-CL-CARD-CONTENT-ORDER',
  'WML-CL-CARD-CONTEXT-ATTRIBUTE',
  'WML-CL-CARD-STRUCTURE',
  'WML-CL-DO-EFFECTIVE-NAME',
  'WML-CL-DO-INACTIVE-HIDDEN',
  'WML-CL-GO-ACCESS-BEFORE-TRANSITION',
  'WML-CL-HEAD-DECK-SCOPE',
  'WML-CL-HEAD-STRUCTURE',
  'WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE',
  'WML-CL-NEWCONTEXT-CLEAR-HISTORY',
  'WML-CL-NEWCONTEXT-GO-ONLY',
  'WML-CL-NEWCONTEXT-RESET-PRIVATE-STATE',
  'WML-CL-NEWCONTEXT-UNSET-VARIABLES',
  'WML-CL-SHADOW-ACTIVE-SET',
  'WML-CL-SHADOW-CARD-PRECEDENCE',
  'WML-CL-SHADOW-MATCHING',
  'WML-CL-SHADOW-NOOP-MASK',
  'WML-CL-TEMPLATE-APPLIES-ALL-CARDS',
  'WML-CL-TEMPLATE-STRUCTURE',
  'WML-CL-WML-ROOT-DECK-SCOPE',
  'WML-CL-WML-ROOT-LANGUAGE',
  'WML-CL-WML-ROOT-STRUCTURE'
]);
const implementedWml202ClauseIds = new Set(wml202ClauseIds);
const wml204ClauseIds = new Set([
  'WML-CL-VARIABLE-COMMIT-BEFORE-TASK',
  'WML-CL-SELECT-STRUCTURE',
  'WML-CL-SELECT-SINGLE-MULTI-MODE',
  'WML-CL-SELECT-INIT-ORDER',
  'WML-CL-SELECT-INDEX-VALIDATION',
  'WML-CL-SELECT-DEFAULT-PRECEDENCE',
  'WML-CL-SELECT-VARIABLE-INITIALIZATION',
  'WML-CL-SELECT-PRESELECTION',
  'WML-CL-SELECT-USER-UPDATE',
  'WML-CL-SELECT-NO-IMPLICIT-REFRESH',
  'WML-CL-SELECT-MULTI-SERIALIZATION',
  'WML-CL-OPTION-VALUE-EVALUATION',
  'WML-CL-OPTION-ONPICK-MULTI',
  'WML-CL-OPTION-ONPICK-SINGLE',
  'WML-CL-INPUT-STRUCTURE',
  'WML-CL-INPUT-MASK-COMMIT',
  'WML-CL-INPUT-REJECTION-ATOMICITY',
  'WML-CL-INPUT-INITIALIZATION',
  'WML-CL-INPUT-INVALID-INITIAL-VALUE',
  'WML-CL-INPUT-EMPTY-COMMIT',
  'WML-CL-INPUT-PASSWORD-DISPLAY',
  'WML-CL-INPUT-FORMAT-LITERALS',
  'WML-CL-INPUT-MAXLENGTH'
]);
const wml205ClauseIds = new Set([
  'WML-CL-ERROR-ENFORCEMENT',
  'WML-CL-ERROR-NO-INTENT-INFERENCE',
  'WML-CL-TASK-FAILURE-ATOMICITY'
]);
const wml203ClauseIds = new Set([
  'WML-CL-PROLOGUE-REQUIRED',
  'WML-CL-WML-ROOT-STRUCTURE',
  'WML-CL-HEAD-STRUCTURE',
  'WML-CL-TEMPLATE-STRUCTURE',
  'WML-CL-CARD-STRUCTURE',
  'WML-CL-CARD-CONTENT-ORDER',
  'WML-CL-DO-STRUCTURE',
  'WML-CL-ONEVENT-SINGLE-TASK',
  'WML-CL-GO-STRUCTURE',
  'WML-CL-POSTFIELD-STRUCTURE',
  'WML-CL-SETVAR-STRUCTURE',
  'WML-CL-SELECT-STRUCTURE',
  'WML-CL-INPUT-STRUCTURE',
  'WML-CL-IMAGE-STRUCTURE',
  'WML-CL-ANCHOR-STRUCTURE',
  'WML-CL-A-REQUIRED-TARGET',
  'WML-CL-TABLE-STRUCTURE',
  'WML-CL-TR-STRUCTURE',
  'WML-CL-TD-STRUCTURE'
]);
const implementedWmlClauseIds = new Set([
  'WML-CL-UNKNOWN-MARKUP-IGNORED',
  'WML-CL-UNKNOWN-CONTENT-PRESERVED',
  ...wml203ClauseIds,
  ...wml204ClauseIds,
  ...wml205ClauseIds,
  ...wml303ClauseIds,
  'WML-CL-BR-LINE-BREAK',
  ...implementedWml202ClauseIds
]);
const deferredWbxmlClauseIds = new Set();
const hashPattern = /^[a-f0-9]{64}$/;
const releaseById = new Map(release.members.map((member) => [member.documentId, member]));
const ingestionById = new Map(ingestion.members.map((member) => [member.documentId, member]));
const externalIngestionById = new Map(
  externalIngestion.dependencies.map((dependency) => [dependency.dependencyId, dependency])
);

if (ledger.schemaVersion !== 1) {
  failures.push(`schemaVersion=${ledger.schemaVersion}; expected 1`);
}
if (ledger.releaseId !== release.release.id) {
  failures.push('selected-clause ledger release lock drift');
}
if (
  ledger.target?.classProfile !== 'WAP-215 Class C client (CCR-CLASSC-C-001)' ||
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
  !ledger.generatedFrom?.redistributionPolicy?.includes('full text extractions remain outside Git')
) {
  failures.push('redistribution boundary is not explicit');
}
if (
  ledger.scope?.status !== 'complete' ||
  ledger.scope?.selectedProfileParentCount !== 198 ||
  JSON.stringify(ledger.scope?.coveredFamilies) !== JSON.stringify(coveredFamilies) ||
  JSON.stringify(ledger.scope?.remainingFamilies) !== JSON.stringify(remainingFamilies) ||
  ledger.scope?.coveredSelectedParentCount !== 198 ||
  ledger.scope?.remainingSelectedParentCount !== 0 ||
  !ledger.scope?.completionRule?.includes('CONF-003 is complete')
) {
  failures.push('partial nine-family scope accounting drift');
}
if (
  !ledger.interpretation?.normativeForce?.includes('implicit-MUST') ||
  !ledger.interpretation?.deduplication?.includes('multiple selected SCR') ||
  !ledger.interpretation?.implementationAssessment?.includes('not-assessed')
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
  const parentLedgerPath = path.join(manifestDirectory, definition.ledgerFile);
  const expectedParentLedgerPath = `spec-processing/source-manifests/${definition.ledgerFile}`;
  const parentLedgerText = fs.readFileSync(parentLedgerPath, 'utf8');
  const parentLedger = JSON.parse(parentLedgerText);
  const selectedParents = parentLedger.obligations.filter(
    (obligation) => obligation.disposition?.classCProfile === definition.selectedDisposition
  );
  const selectedById = new Map(selectedParents.map((parent) => [parent.id, parent]));
  const effectiveFamily = effectiveSpec.families.find(
    (candidate) => candidate.family === family.family
  );
  const expectedFamilyStatus =
    family.family === 'wcmp'
      ? family.clauses?.every((candidate) => candidate.fixturePlan?.status === 'implemented')
        ? 'nested-clauses-fixture-backed'
        : 'nested-clauses-partially-fixture-backed'
    : family.family === 'wdp'
      ? 'nested-clauses-fixture-backed'
      : family.family === 'wml' || family.family === 'wbxml'
        ? 'nested-clauses-partially-fixture-backed'
        : 'nested-clauses-anchored-fixtures-planned';

  if (
    family.status !== expectedFamilyStatus ||
    family.parentLedger !== expectedParentLedgerPath ||
    family.parentLedgerSha256 !== sha256(parentLedgerText) ||
    family.selectedDisposition !== definition.selectedDisposition ||
    JSON.stringify(family.effectiveSequence) !== JSON.stringify(effectiveFamily?.effectiveSequence)
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
      source.authorityRecordUrl === externalDependency.authorityRecordUrl &&
      source.artifactSha256 === externalArtifact.sha256 &&
      source.artifactBytes === externalArtifact.bytes;
    if (!releaseSourceValid && !externalSourceValid) {
      failures.push(`${family.family}/${source.documentId}: clause source lock drift`);
    }
  }
  const clauseSourceIds = new Set((family.clauseSources ?? []).map((source) => source.documentId));

  const actualParentIds = (family.parents ?? []).map((parent) => parent.id);
  const expectedParentIds = selectedParents.map((parent) => parent.id);
  if (JSON.stringify(actualParentIds) !== JSON.stringify(expectedParentIds)) {
    failures.push(`${family.family}: selected parent set/order drift`);
  }

  const clauseById = new Map((family.clauses ?? []).map((candidate) => [candidate.id, candidate]));
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
      JSON.stringify(parent.sourceAnchor) !== JSON.stringify(sourceParent.sourceAnchor) ||
      parent.implementationStatus !== sourceParent.mapping.implementationStatus ||
      JSON.stringify(parent.ownerLayers) !== JSON.stringify(sourceParent.mapping.ownerLayers) ||
      JSON.stringify(parent.workItems) !== JSON.stringify(sourceParent.mapping.workItems) ||
      !Array.isArray(parent.clauseIds) ||
      parent.clauseIds.length === 0
    ) {
      failures.push(`${family.family}/${parent.id}: parent traceability drift`);
    }
    const expectedClauseIds = (family.clauses ?? [])
      .filter((candidate) => candidate.parentRows.includes(parent.id))
      .map((candidate) => candidate.id)
      .sort();
    if (JSON.stringify(parent.clauseIds) !== JSON.stringify(expectedClauseIds)) {
      failures.push(`${family.family}/${parent.id}: inverse clause mapping drift`);
    }
    for (const clauseId of parent.clauseIds ?? []) {
      if (!clauseById.has(clauseId)) {
        failures.push(`${family.family}/${parent.id}: unknown clause ${clauseId}`);
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
      !hashPattern.test(candidate.sourceAnchor?.normalizedTextSha256 ?? '') ||
      !clauseSourceIds.has(candidate.sourceAnchor?.documentId)
    ) {
      failures.push(`${candidate.id}: incomplete or unlocked source anchor`);
    }
    if (
      !allowedForces.has(candidate.normativeForce) ||
      candidate.obligationLevel !== expectedLevelByForce[candidate.normativeForce]
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
      failures.push(`${candidate.id}: synopsis violates the redistribution-safe shape`);
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
      ...new Set([
        ...parents.flatMap((parent) => parent.mapping.workItems),
        ...(candidate.family === 'wml' ? ['WML-201'] : []),
        ...(wml202ClauseIds.has(candidate.id) ? ['WML-202'] : []),
        ...(wml203ClauseIds.has(candidate.id) ? ['WML-203'] : []),
        ...(wml204ClauseIds.has(candidate.id) ? ['WML-204'] : []),
        ...(wml205ClauseIds.has(candidate.id) ? ['WML-205'] : []),
        ...(wml303ClauseIds.has(candidate.id) ? ['WML-303'] : []),
        ...(trn702ClauseIds.has(candidate.id) ? ['TRN-702'] : []),
        ...(trn706ClauseIds.has(candidate.id) ? ['TRN-706'] : []),
        ...(trn707ClauseIds.has(candidate.id) ? ['TRN-707'] : []),
        ...(trn708ClauseIds.has(candidate.id) ? ['TRN-708'] : [])
      ])
    ].sort();
    const expectedDirectWorkItems = [
      ...(candidate.family === 'wml' ? ['WML-201'] : []),
      ...(wml202ClauseIds.has(candidate.id) ? ['WML-202'] : []),
      ...(wml203ClauseIds.has(candidate.id) ? ['WML-203'] : []),
      ...(wml204ClauseIds.has(candidate.id) ? ['WML-204'] : []),
      ...(wml205ClauseIds.has(candidate.id) ? ['WML-205'] : []),
      ...(wml303ClauseIds.has(candidate.id) ? ['WML-303'] : []),
      ...(trn702ClauseIds.has(candidate.id) ? ['TRN-702'] : []),
      ...(trn706ClauseIds.has(candidate.id) ? ['TRN-706'] : []),
      ...(trn707ClauseIds.has(candidate.id) ? ['TRN-707'] : []),
      ...(trn708ClauseIds.has(candidate.id) ? ['TRN-708'] : [])
    ].sort();
    const expectedRequirements = [
      ...new Set(parents.flatMap((parent) => parent.mapping.requirementIds))
    ].sort();
    const expectedSnapshot = Object.fromEntries(
      parents.map((parent) => [parent.id, parent.mapping.implementationStatus])
    );
    const directFixtureImplemented =
      candidate.fixturePlan?.status === 'implemented' &&
      (candidate.family === 'wcmp' ||
      candidate.family === 'wdp' ||
      (candidate.family === 'wbxml' &&
        !deferredWbxmlClauseIds.has(candidate.id)) ||
      implementedWmlClauseIds.has(candidate.id));
    const expectedClauseStatus = directFixtureImplemented ? 'implemented' : 'not-assessed';
    const expectedFixtureStatus = directFixtureImplemented ? 'implemented' : 'planned';
    if (
      JSON.stringify(candidate.mapping?.ownerLayers) !== JSON.stringify(expectedOwners) ||
      JSON.stringify(candidate.directWorkItems ?? []) !==
        JSON.stringify(expectedDirectWorkItems) ||
      JSON.stringify(candidate.mapping?.workItems) !== JSON.stringify(expectedWorkItems) ||
      JSON.stringify(candidate.mapping?.requirementIds) !== JSON.stringify(expectedRequirements) ||
      JSON.stringify(candidate.mapping?.parentImplementationSnapshot) !==
        JSON.stringify(expectedSnapshot) ||
      candidate.mapping?.clauseImplementationStatus !== expectedClauseStatus ||
      !candidate.mapping?.evidenceGate?.includes('source-derived direct fixture')
    ) {
      failures.push(`${candidate.id}: owner/work/evidence mapping drift`);
    }

    if (
      !candidate.fixturePlan?.id ||
      globalFixtureIds.has(candidate.fixturePlan.id) ||
      candidate.fixturePlan.status !== expectedFixtureStatus ||
      !allowedFixtureKinds.has(candidate.fixturePlan.kind) ||
      candidate.fixturePlan.assertion !== candidate.obligationSynopsis ||
      (directFixtureImplemented &&
        (candidate.family === 'wcmp' || candidate.family === 'wdp') &&
        (candidate.fixturePlan.evidence?.path !==
          (trn702ClauseIds.has(candidate.id)
            ? 'transport-rust/tests/fixtures/transport/wdp_constrained_payload_mapped/reassembly_fixture.json'
            : candidate.family === 'wdp'
              ? 'transport-rust/tests/fixtures/transport/wdp_cdpd_ipv4_mapped/wdp_fixture.json'
              : 'transport-rust/tests/fixtures/transport/wcmp_cdpd_icmp_profile/icmp_fixture.json') ||
          candidate.fixturePlan.evidence?.testPath !==
            (trn702ClauseIds.has(candidate.id)
              ? 'transport-rust/tests/wdp_constrained_replay.rs'
              : candidate.family === 'wdp'
                ? 'transport-rust/src/network/wdp/tests.rs'
                : 'transport-rust/tests/wcmp_cdpd_icmp_profile.rs') ||
          !candidate.fixturePlan.evidence?.command?.includes(
            trn702ClauseIds.has(candidate.id)
              ? 'wdp_constrained_replay'
              : candidate.family === 'wdp'
                ? 'network::wdp'
                : 'wcmp_cdpd_icmp_profile'
          ))) ||
      (implementedWmlClauseIds.has(candidate.id) &&
        (candidate.fixturePlan.evidence?.path !== candidate.fixturePlan.evidence?.testPath ||
          !fs.existsSync(path.join(root, candidate.fixturePlan.evidence?.testPath ?? '')) ||
          !candidate.fixturePlan.evidence?.command?.includes(
            candidate.id === 'WML-CL-TASK-FAILURE-ATOMICITY'
              ? 'pnpm test:story WML-205'
              : 'cargo test --manifest-path engine-wasm/engine/Cargo.toml'
          )))
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

  if (family.family === 'wbxml') {
    const directEvidence = family.directEvidence;
    const corpusPath = path.join(root, directEvidence?.corpusPath ?? '');
    const testPath = path.join(root, directEvidence?.testPath ?? '');
    const evidencePathsExist =
      fs.existsSync(corpusPath) && fs.existsSync(testPath);
    const corpus = evidencePathsExist ? readJson(corpusPath) : {};
    const expectedImplementedIds = (family.clauses ?? [])
      .filter((candidate) => !deferredWbxmlClauseIds.has(candidate.id))
      .map((candidate) => candidate.id)
      .sort();
    const recordedImplementedIds = [
      ...(directEvidence?.implementedClauseIds ?? [])
    ].sort();
    const corpusImplementedIds = [...(corpus.implementedClauses ?? [])].sort();
    const tests = evidencePathsExist ? fs.readFileSync(testPath, 'utf8') : '';
    if (
      !evidencePathsExist ||
      JSON.stringify(recordedImplementedIds) !==
        JSON.stringify(expectedImplementedIds) ||
      JSON.stringify(corpusImplementedIds) !==
        JSON.stringify(expectedImplementedIds) ||
      directEvidence?.commands?.length !== 4 ||
      !directEvidence.commands.every((command) => {
        const test = command.split(' ').at(-1);
        return test && tests.includes(`fn ${test}`);
      })
    ) {
      failures.push('wbxml: direct clause evidence registry is incomplete');
    }
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
  assessedClauseCount: (ledger.families ?? [])
    .flatMap((family) => family.clauses ?? [])
    .filter((candidate) => candidate.mapping?.clauseImplementationStatus === 'implemented')
    .length
};
if (
  selectedParentCount !== 198 ||
  clauseCount !== 762 ||
  JSON.stringify(ledger.summary) !== JSON.stringify(expectedSummary)
) {
  failures.push(`summary drift: ${selectedParentCount} parents / ${clauseCount} clauses`);
}

const forbiddenKeys = new Set(['sourceText', 'sourceExcerpt', 'normativeText', 'verbatimQuote']);
function rejectProtectedPayload(value, location = 'ledger') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectProtectedPayload(item, `${location}[${index}]`));
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
  `PASS CONF-003 complete: ${selectedParentCount}/198 selected parents across all nine mandatory Class C families`
);
console.log(
  `PASS ${clauseCount} deduplicated clauses (${requiredClauseCount} required / ${recommendedClauseCount} recommended / ${permittedClauseCount} permitted)`
);
console.log(
  `PASS ${clauseCount} source-anchored fixture plans; protected source text remains outside Git`
);
