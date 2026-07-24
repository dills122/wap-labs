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

if (
  !deltaDocument.includes('201/201 selected rows') ||
  !deltaDocument.includes('17 successor-derived implementation foundations') ||
  !deltaDocument.includes('15 require strict correction') ||
  !deltaDocument.includes('planning classification, not conformance evidence')
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
