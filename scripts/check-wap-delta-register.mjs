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

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

const register = readJson(
  'spec-processing/source-manifests/wap-1.2.1-successor-delta.json'
);
const selectedClauses = readJson(
  'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json'
);
const effectiveSpec = readJson(
  'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'
);
const program = readJson(
  'docs/waves/wap-1.2.1-compliance-program.json'
);
const deltaDocument = read(
  'docs/waves/WAP_1_2_1_SUCCESSOR_DELTA_REGISTER.md'
);
const failures = [];

const familyDefinitions = [
  {
    family: 'wml',
    ledgerFile: 'wap-1.2.1-wml-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedSelected: 39,
    expectedDerived: 1
  },
  {
    family: 'wae',
    ledgerFile: 'wap-1.2.1-wae-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedSelected: 11,
    expectedDerived: 8
  },
  {
    family: 'wbxml',
    ledgerFile: 'wap-1.2.1-wbxml-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedSelected: 3,
    expectedDerived: 0
  },
  {
    family: 'wmlscript',
    ledgerFile: 'wap-1.2.1-wmlscript-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedSelected: 41,
    expectedDerived: 0
  },
  {
    family: 'wmlscript-libraries',
    ledgerFile: 'wap-1.2.1-wmlscript-libraries-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedSelected: 80,
    expectedDerived: 0
  },
  {
    family: 'caching',
    ledgerFile: 'wap-1.2.1-caching-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedSelected: 5,
    expectedDerived: 0
  },
  {
    family: 'wdp',
    ledgerFile: 'wap-1.2.1-wdp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    expectedSelected: 9,
    expectedDerived: 0
  },
  {
    family: 'wcmp',
    ledgerFile: 'wap-1.2.1-wcmp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    expectedSelected: 5,
    expectedDerived: 0
  },
  {
    family: 'wsp',
    ledgerFile: 'wap-1.2.1-wsp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    expectedSelected: 8,
    expectedDerived: 8
  }
];

const authorityById = new Map();
for (const authority of register.successorAuthorities ?? []) {
  const sourcePath = path.join(
    root,
    'spec-processing/source-material',
    authority.filename
  );
  const source = fs.readFileSync(sourcePath);
  if (
    authorityById.has(authority.documentId) ||
    authority.sha256 !== sha256(source) ||
    authority.bytes !== source.length ||
    authority.role !== 'delta-evidence-only' ||
    authority.targetNormative !== false
  ) {
    failures.push(`${authority.documentId}: successor authority lock drift`);
  }
  authorityById.set(authority.documentId, authority);
}
if (authorityById.size !== 4) {
  failures.push('expected four hash-locked successor authorities');
}

if (
  register.schemaVersion !== 1 ||
  register.releaseId !== selectedClauses.releaseId ||
  register.generatedFrom?.programWorkItem !== 'CONF-007' ||
  register.generatedFrom?.generator !==
    'spec-processing/scripts/generate-wap-delta-register.mjs' ||
  register.target?.classProfile !==
    'WAP-215 Class C client (CCR-CLASSC-C-001)' ||
  register.status !== 'selected-profile-successor-delta-complete' ||
  !register.policy?.includes('cannot replace strict target-era behavior')
) {
  failures.push('delta register target, provenance, status, or policy drift');
}

const allowedDispositions = new Set([
  'compatible',
  'strict-correction-required',
  'successor-only',
  'not-successor-derived'
]);
const entryByKey = new Map();
const actualDispositionCounts = {
  compatible: 0,
  'strict-correction-required': 0,
  'successor-only': 0,
  'not-successor-derived': 0
};
const actualBasisCounts = {};
let actualDerivedCount = 0;

for (const entry of register.entries ?? []) {
  const key = `${entry.family}/${entry.targetId}`;
  if (
    entryByKey.has(key) ||
    !allowedDispositions.has(entry.disposition) ||
    entry.assessmentState !==
      'planning-classification-not-conformance-evidence'
  ) {
    failures.push(`${key}: identity, disposition, or assessment-state drift`);
  }
  entryByKey.set(key, entry);
  actualDispositionCounts[entry.disposition] += 1;
  actualBasisCounts[entry.implementationBasis] =
    (actualBasisCounts[entry.implementationBasis] ?? 0) + 1;

  if (entry.successorDerivedImplementation) {
    actualDerivedCount += 1;
    if (
      entry.disposition === 'not-successor-derived' ||
      !Array.isArray(entry.successorReferences) ||
      entry.successorReferences.length === 0 ||
      entry.successorReferences.some(
        (reference) => !authorityById.has(reference.documentId)
      )
    ) {
      failures.push(`${key}: successor-derived classification is incomplete`);
    }
  } else if (entry.disposition !== 'not-successor-derived') {
    failures.push(`${key}: non-successor-derived row has successor disposition`);
  }
  if (
    entry.disposition === 'strict-correction-required' &&
    (!Array.isArray(entry.strictCorrectionWorkItems) ||
      entry.strictCorrectionWorkItems.length === 0)
  ) {
    failures.push(`${key}: strict correction lacks additive work`);
  }
}

const clauseFamilyById = new Map(
  selectedClauses.families.map((family) => [family.family, family])
);
const familySummaryById = new Map(
  register.familySummaries.map((family) => [family.family, family])
);
let expectedEntryCount = 0;

for (const definition of familyDefinitions) {
  const ledger = readJson(
    `spec-processing/source-manifests/${definition.ledgerFile}`
  );
  const selected = ledger.obligations.filter(
    (obligation) =>
      obligation.disposition.classCProfile ===
      definition.selectedDisposition
  );
  const clauseParents = new Map(
    clauseFamilyById
      .get(definition.family)
      .parents.map((parent) => [parent.id, parent])
  );
  const familySummary = familySummaryById.get(definition.family);
  const derived = selected.filter(
    (obligation) =>
      entryByKey.get(`${definition.family}/${obligation.id}`)
        ?.successorDerivedImplementation
  );
  expectedEntryCount += selected.length;

  if (
    selected.length !== definition.expectedSelected ||
    derived.length !== definition.expectedDerived ||
    familySummary?.selectedRowCount !== definition.expectedSelected ||
    familySummary?.successorDerivedImplementationCount !==
      definition.expectedDerived
  ) {
    failures.push(`${definition.family}: family delta summary drift`);
  }

  for (const obligation of selected) {
    const key = `${definition.family}/${obligation.id}`;
    const entry = entryByKey.get(key);
    const clauseParent = clauseParents.get(obligation.id);
    if (
      !entry ||
      entry.targetFeature !== obligation.feature ||
      entry.selectedImplementationStatus !==
        obligation.mapping.implementationStatus ||
      JSON.stringify(entry.ownerLayers) !==
        JSON.stringify(obligation.mapping.ownerLayers) ||
      JSON.stringify(entry.requirementIds) !==
        JSON.stringify(obligation.mapping.requirementIds) ||
      JSON.stringify(entry.workItems) !==
        JSON.stringify(obligation.mapping.workItems) ||
      JSON.stringify(entry.clauseIds) !==
        JSON.stringify(clauseParent?.clauseIds)
    ) {
      failures.push(`${key}: selected-row implementation crosswalk drift`);
    }
  }
}

const waeLedger = readJson(
  'spec-processing/source-manifests/wap-1.2.1-wae-scr.json'
);
for (const mapping of waeLedger.successorDelta.selectedMandatoryMappings) {
  const entry = entryByKey.get(`wae/${mapping.targetId}`);
  const reference = entry?.successorReferences?.[0];
  if (
    entry?.relationshipClassification !== mapping.classification ||
    reference?.documentId !== 'WAP-236-WAESpec-20020207-a' ||
    JSON.stringify(reference?.successorIds) !==
      JSON.stringify(mapping.successorIds)
  ) {
    failures.push(`wae/${mapping.targetId}: imported WAP-236 delta drift`);
  }
}

const wmlDerived = (register.entries ?? []).filter(
  (entry) =>
    entry.family === 'wml' && entry.successorDerivedImplementation
);
const wspDerived = (register.entries ?? []).filter(
  (entry) =>
    entry.family === 'wsp' && entry.successorDerivedImplementation
);
if (
  wmlDerived.length !== 1 ||
  wmlDerived[0]?.targetId !== 'WML-C-17' ||
  wmlDerived[0]?.disposition !== 'strict-correction-required' ||
  wspDerived.length !== 8 ||
  wspDerived.some(
    (entry) => entry.disposition !== 'strict-correction-required'
  )
) {
  failures.push('WML/WSP conservative successor-correction boundary drift');
}

const expectedTrn707ClauseIds = [
  'WCMP-CL-CLIENT-GENERAL-PROFILE',
  'WCMP-CL-SELECTED-TYPE-CODE-VALUES',
  'WDP-CL-CDPD-UDP-IP-PROFILE',
  'WDP-CL-CONSISTENT-TRANSPORT-SERVICE',
  'WDP-CL-IP-BEARER-REQUIRES-UDP',
  'WDP-CL-SELECTED-BEARER-ASSIGNMENT',
  'WDP-CL-SELECTED-WSP-PORT',
  'WDP-CL-UNITDATA-CONTENT-TRANSPARENCY',
  'WDP-CL-UNITDATA-REQUEST-ANYTIME'
];
const transportAudit = register.transportSuccessorAudit;
const auditClassifications = transportAudit?.classifications ?? [];
const auditedClauseIds = [
  ...new Set(
    auditClassifications.flatMap((classification) => classification.targetClauseIds ?? [])
  )
].sort((left, right) => left.localeCompare(right));
const mappedTrn707ClauseIds = selectedClauses.families
  .flatMap((family) => family.clauses)
  .filter((clause) => clause.mapping.workItems.includes('TRN-707'))
  .map((clause) => clause.id)
  .sort((left, right) => left.localeCompare(right));
if (
  transportAudit?.workItemId !== 'TRN-707' ||
  transportAudit?.status !==
    'strict-connectionless-audit-complete-wcmp-correction-open-conditional-wtp-open' ||
  transportAudit?.scope?.connectionOrientedWspActivated !== false ||
  transportAudit?.scope?.wtpActivated !== false ||
  !transportAudit?.scope?.scopeLimitation?.includes('no whole-document equivalence') ||
  transportAudit?.successorContext?.documentId !== 'WAP-259-WDP-20010614-a' ||
  transportAudit?.successorContext?.role !== 'delta-evidence-only' ||
  auditClassifications.length !== 3 ||
  auditClassifications.some(
    (classification) =>
      !['compatible', 'strict-correction-required'].includes(
        classification.disposition
      ) ||
      !classification.finding ||
      !classification.fixture ||
      !classification.implementationEvidence?.length ||
      !classification.tests?.length
  ) ||
  auditClassifications.filter(
    (classification) => classification.disposition === 'compatible'
  ).length !== 2 ||
  auditClassifications.find(
    (classification) => classification.id === 'TRN-707-WCMP-TARGET-DELEGATION'
  )?.disposition !== 'strict-correction-required' ||
  JSON.stringify(auditedClauseIds) !== JSON.stringify(expectedTrn707ClauseIds) ||
  JSON.stringify(mappedTrn707ClauseIds) !== JSON.stringify(expectedTrn707ClauseIds) ||
  JSON.stringify(transportAudit?.strictCorrectionWorkItems) !==
    JSON.stringify(['TRN-708'])
) {
  failures.push('TRN-707 WDP/WCMP successor-compatibility audit drift');
}
const wtpGap = transportAudit?.explicitGaps?.find((gap) => gap.family === 'wtp');
if (
  transportAudit?.explicitGaps?.length !== 1 ||
  wtpGap?.status !== 'conditional-not-activated-unmapped' ||
  !wtpGap?.activationCondition?.includes('connection-oriented WSP') ||
  !wtpGap?.policy?.includes('do not activate WTP')
) {
  failures.push('TRN-707 conditional WTP boundary drift');
}
const transportSelectedEntries = (register.entries ?? []).filter((entry) =>
  ['wdp', 'wcmp'].includes(entry.family)
);
if (
  transportSelectedEntries.length !== 14 ||
  transportSelectedEntries.some(
    (entry) =>
      entry.successorDerivedImplementation ||
      entry.disposition !== 'not-successor-derived'
  )
) {
  failures.push('TRN-707 must not rewrite WDP/WCMP foundations as successor-derived');
}

const successorOnlyCapabilities =
  register.successorOnlyCapabilities ?? [];
if (
  successorOnlyCapabilities.length !== 5 ||
  successorOnlyCapabilities.some(
    (capability) =>
      capability.disposition !== 'successor-only' ||
      !authorityById.has(capability.sourceDocumentId) ||
      !capability.strictTargetPolicy
  )
) {
  failures.push('successor-only capability registry drift');
}

const expectedSummary = {
  selectedRowCount: expectedEntryCount,
  successorDerivedImplementationCount: actualDerivedCount,
  dispositionCounts: actualDispositionCounts,
  implementationBasisCounts: Object.fromEntries(
    Object.entries(actualBasisCounts).sort(([left], [right]) =>
      left.localeCompare(right)
    )
  ),
  successorOnlyCapabilityCount: successorOnlyCapabilities.length
};
if (
  expectedEntryCount !== 201 ||
  actualDerivedCount !== 17 ||
  JSON.stringify(actualDispositionCounts) !==
    JSON.stringify({
      compatible: 2,
      'strict-correction-required': 15,
      'successor-only': 0,
      'not-successor-derived': 184
    }) ||
  JSON.stringify(register.summary) !== JSON.stringify(expectedSummary)
) {
  failures.push('successor delta aggregate summary drift');
}

for (const family of ['wml', 'wae', 'wdp', 'wsp']) {
  const effectiveFamily = effectiveSpec.families.find(
    (candidate) => candidate.family === family
  );
  const statuses = effectiveFamily?.successorEvidence?.map(
    (evidence) => evidence.deltaStatus
  );
  if (!statuses?.includes('selected-profile-delta-complete')) {
    failures.push(`${family}: effective-spec successor delta status drift`);
  }
}

const conf007 = program.sprints
  .flatMap((sprint) => sprint.workItems)
  .find((workItem) => workItem.id === 'CONF-007');
if (
  conf007?.status !== 'done' ||
  !conf007.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-successor-delta.json'
  ) ||
  !conf007.evidence?.includes('node scripts/check-wap-delta-register.mjs')
) {
  failures.push('CONF-007 program completion/evidence drift');
}
const trn707 = program.sprints
  .flatMap((sprint) => sprint.workItems)
  .find((workItem) => workItem.id === 'TRN-707');
if (
  trn707?.status !== 'in-progress' ||
  JSON.stringify(trn707?.contextDocuments) !==
    JSON.stringify(['WAP-259-WDP-20010614-a']) ||
  JSON.stringify(trn707?.explicitUnmappedFamilies) !== JSON.stringify(['wtp']) ||
  JSON.stringify(trn707?.followUpWorkItems) !== JSON.stringify(['TRN-708']) ||
  !trn707?.outputs?.includes(
    'TRN-707 transport-specific audit in spec-processing/source-manifests/wap-1.2.1-successor-delta.json'
  ) ||
  !trn707?.evidence?.includes('node scripts/wap-context-pack.mjs TRN-707') ||
  !trn707?.acceptance?.some((item) => item.includes('WTP and connection-oriented WSP remain inactive'))
) {
  failures.push('TRN-707 compliance-program posture drift');
}
const trn708 = program.sprints
  .flatMap((sprint) => sprint.workItems)
  .find((workItem) => workItem.id === 'TRN-708');
if (
  trn708?.status !== 'todo' ||
  JSON.stringify(trn708?.dependsOn) !== JSON.stringify(['TRN-703', 'T0-17']) ||
  !trn708?.notes?.some((item) => item.includes('Preserve completed TRN-703/T0-17')) ||
  !trn708?.specReferences?.some((item) => item.includes('section 5.3')) ||
  !trn708?.acceptance?.some(
    (item) =>
      item.includes('strict CDPD/IPv4 profile') &&
      item.includes('ICMPv4 path')
  ) ||
  !trn708?.acceptance?.some((item) => item.includes('No WTP'))
) {
  failures.push('TRN-708 additive WCMP correction ticket drift');
}

if (
  !deltaDocument.includes('201/201 selected rows') ||
  !deltaDocument.includes('17 successor-derived implementation foundations') ||
  !deltaDocument.includes('15 require strict correction') ||
  !deltaDocument.includes('planning classification, not conformance evidence') ||
  !deltaDocument.includes('TRN-707 transport audit') ||
  !deltaDocument.includes('TRN-708') ||
  !deltaDocument.includes('WTP remains conditional and unmapped')
) {
  failures.push('successor delta human rollup drift');
}

if (failures.length > 0) {
  console.error('WAP successor delta register check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 successor delta register');
console.log(
  'PASS 201/201 selected rows classified; 17 successor-derived foundations'
);
console.log(
  'PASS 2 compatible / 15 strict-correction-required / 184 not successor-derived'
);
console.log(
  'PASS four hash-locked authorities and five successor-only capability boundaries'
);
