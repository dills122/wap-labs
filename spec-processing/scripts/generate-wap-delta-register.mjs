#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-successor-delta.json';

if (!recordedOn || !/^\d{4}-\d{2}-\d{2}$/.test(recordedOn)) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-delta-register.mjs ' +
      '--recorded-on YYYY-MM-DD [--output path]'
  );
  process.exit(2);
}

const root = process.cwd();
const manifestDirectory = path.join(
  root,
  'spec-processing/source-manifests'
);
const sourceDirectory = path.join(
  root,
  'spec-processing/source-material'
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

const target = {
  stack: 'WAP 1.2.1',
  markup: 'WML 1.3',
  classProfile: 'WAP-215 Class C client (CCR-CLASSC-C-001)'
};
const policy =
  'Successor material may explain, cross-check, or extend implementation, but cannot replace strict target-era behavior. Compatible findings remain planning classifications until direct target fixtures prove conformance; correction-required findings stay open work; successor-only behavior requires an explicit capability.';

const authorityDefinitions = [
  {
    documentId: 'WAP-236-WAESpec-20020207-a',
    family: 'wae',
    filename: 'WAP-236-WAESpec-20020207-a.pdf',
    expectedSha256:
      '4e87f8028613ea3cfa19cea0c2244fd502e50b896e6440c297b14e016ae04adf'
  },
  {
    documentId: 'WAP-238-WML-20010911-a',
    family: 'wml',
    filename: 'WAP-238-WML-20010911-a.pdf',
    expectedSha256:
      '395ffca45177f50e9b37d2810a4dfc71d35916c75d89efb4d564927cddab7104'
  },
  {
    documentId: 'WAP-259-WDP-20010614-a',
    family: 'wdp-wcmp',
    filename: 'WAP-259-WDP-20010614-a.pdf',
    expectedSha256:
      '73dab5af5a1afb4ec320788e19ef04bfd4f1897dfcc8aa8c74eed7e304b58f3e'
  },
  {
    documentId: 'WAP-230-WSP-20010705-a',
    family: 'wsp',
    filename: 'WAP-230-WSP-20010705-a.pdf',
    expectedSha256:
      'd01fe22e48a17f156e15d45551a2b622012651f10b08ebee572a66a0ea45c355'
  }
];

const successorAuthorities = authorityDefinitions.map((definition) => {
  const sourcePath = path.join(sourceDirectory, definition.filename);
  const source = fs.readFileSync(sourcePath);
  const actualSha256 = sha256(source);
  if (actualSha256 !== definition.expectedSha256) {
    throw new Error(
      `${definition.documentId}: expected ${definition.expectedSha256}; found ${actualSha256}`
    );
  }
  return {
    documentId: definition.documentId,
    family: definition.family,
    filename: definition.filename,
    sha256: actualSha256,
    bytes: source.length,
    role: 'delta-evidence-only',
    targetNormative: false
  };
});

const familyDefinitions = [
  {
    family: 'wml',
    ledgerFile: 'wap-1.2.1-wml-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    successorContext: ['WAP-238-WML-20010911-a']
  },
  {
    family: 'wae',
    ledgerFile: 'wap-1.2.1-wae-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    successorContext: ['WAP-236-WAESpec-20020207-a']
  },
  {
    family: 'wbxml',
    ledgerFile: 'wap-1.2.1-wbxml-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    successorContext: []
  },
  {
    family: 'wmlscript',
    ledgerFile: 'wap-1.2.1-wmlscript-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    successorContext: []
  },
  {
    family: 'wmlscript-libraries',
    ledgerFile: 'wap-1.2.1-wmlscript-libraries-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    successorContext: []
  },
  {
    family: 'caching',
    ledgerFile: 'wap-1.2.1-caching-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    successorContext: ['WAP-236-WAESpec-20020207-a']
  },
  {
    family: 'wdp',
    ledgerFile: 'wap-1.2.1-wdp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    successorContext: ['WAP-259-WDP-20010614-a']
  },
  {
    family: 'wcmp',
    ledgerFile: 'wap-1.2.1-wcmp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    successorContext: ['WAP-259-WDP-20010614-a']
  },
  {
    family: 'wsp',
    ledgerFile: 'wap-1.2.1-wsp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    successorContext: ['WAP-230-WSP-20010705-a']
  }
];

const selectedClauses = readJson(
  path.join(
    manifestDirectory,
    'wap-1.2.1-selected-normative-clauses.json'
  )
);
if (
  selectedClauses.scope?.status !== 'complete' ||
  selectedClauses.summary?.selectedParentCount !== 201
) {
  throw new Error('Complete 201-parent selected-clause ledger is required');
}
const clauseFamilyById = new Map(
  selectedClauses.families.map((family) => [family.family, family])
);

const familyLedgers = new Map();
for (const definition of familyDefinitions) {
  familyLedgers.set(
    definition.family,
    readJson(path.join(manifestDirectory, definition.ledgerFile))
  );
}

const waeDelta = familyLedgers.get('wae').successorDelta;
if (
  waeDelta?.status !== 'selected-mcf-concept-delta-complete' ||
  waeDelta.selectedMandatoryMappings?.length !== 11
) {
  throw new Error('Complete WAE/WAP-236 selected-row delta is required');
}
const waeMappingByTarget = new Map(
  waeDelta.selectedMandatoryMappings.map((mapping) => [
    mapping.targetId,
    mapping
  ])
);
const waeCompatibleClassifications = new Set([
  'preserved-renamed',
  'subsumed-by-profile'
]);

function classify(definition, obligation) {
  const implementationStatus =
    obligation.mapping.implementationStatus;
  const notImplemented = implementationStatus === 'missing';
  const base = {
    successorDerivedImplementation: false,
    implementationBasis: notImplemented
      ? 'not-implemented'
      : 'target-era-or-version-neutral',
    disposition: 'not-successor-derived',
    successorReferences: definition.successorContext.map((documentId) => ({
      documentId,
      relationship: 'family-delta-context-only'
    })),
    relationshipClassification: null,
    rationale: notImplemented
      ? 'No selected-row implementation exists to classify against successor behavior.'
      : 'No successor-derived selected-row implementation basis is identified; strict conformance remains governed by target-era clauses.'
  };

  if (definition.family === 'wae') {
    const mapping = waeMappingByTarget.get(obligation.id);
    if (!mapping) {
      throw new Error(`${obligation.id}: missing imported WAE delta mapping`);
    }
    base.successorReferences = [
      {
        documentId: 'WAP-236-WAESpec-20020207-a',
        relationship: 'selected-concept-mapping',
        successorIds: mapping.successorIds
      }
    ];
    base.relationshipClassification = mapping.classification;
    base.rationale = mapping.note;
    if (!notImplemented) {
      base.successorDerivedImplementation = true;
      base.implementationBasis = 'successor-era-or-cross-checked';
      base.disposition = waeCompatibleClassifications.has(
        mapping.classification
      )
        ? 'compatible'
        : 'strict-correction-required';
    }
    return base;
  }

  if (
    definition.family === 'wml' &&
    obligation.mapping.requirementIds.includes('RQ-RMK-009') &&
    !notImplemented
  ) {
    return {
      successorDerivedImplementation: true,
      implementationBasis: 'successor-era-compatibility-behavior',
      disposition: 'strict-correction-required',
      successorReferences: [
        {
          documentId: 'WAP-238-WML-20010911-a',
          relationship: 'wml2-compatibility-guardrail'
        }
      ],
      relationshipClassification: 'successor-compatibility-fallback',
      rationale:
        'Unknown-DTD fallback is informed by WML2 compatibility behavior and needs target-era WML 1.3 fixtures before it can satisfy the selected row.'
    };
  }

  if (definition.family === 'wsp' && !notImplemented) {
    return {
      successorDerivedImplementation: true,
      implementationBasis: 'successor-era-tables-and-synthetic-cases',
      disposition: 'strict-correction-required',
      successorReferences: [
        {
          documentId: 'WAP-230-WSP-20010705-a',
          relationship: 'implementation-table-and-behavior-basis'
        }
      ],
      relationshipClassification: 'successor-oriented-foundation',
      rationale:
        'Current connectionless WSP foundations use successor-oriented tables or synthetic cases and require WAP-203/SIN fixtures and assigned-number correction.'
    };
  }

  return base;
}

const entries = [];
const familySummaries = [];
for (const definition of familyDefinitions) {
  const ledger = familyLedgers.get(definition.family);
  const selected = ledger.obligations.filter(
    (obligation) =>
      obligation.disposition.classCProfile ===
      definition.selectedDisposition
  );
  const clauseFamily = clauseFamilyById.get(definition.family);
  const clauseParentById = new Map(
    clauseFamily.parents.map((parent) => [parent.id, parent])
  );
  const familyEntries = selected.map((obligation) => {
    const clauseParent = clauseParentById.get(obligation.id);
    if (!clauseParent) {
      throw new Error(
        `${definition.family}/${obligation.id}: missing clause parent`
      );
    }
    const classification = classify(definition, obligation);
    return {
      family: definition.family,
      targetId: obligation.id,
      targetFeature: obligation.feature,
      targetSourceAnchor: obligation.sourceAnchor,
      selectedImplementationStatus:
        obligation.mapping.implementationStatus,
      assessmentState: 'planning-classification-not-conformance-evidence',
      ...classification,
      strictCorrectionWorkItems:
        classification.disposition === 'strict-correction-required'
          ? obligation.mapping.workItems
          : [],
      ownerLayers: obligation.mapping.ownerLayers,
      requirementIds: obligation.mapping.requirementIds,
      workItems: obligation.mapping.workItems,
      clauseIds: clauseParent.clauseIds
    };
  });
  entries.push(...familyEntries);

  const dispositionCounts = Object.fromEntries(
    [
      'compatible',
      'strict-correction-required',
      'successor-only',
      'not-successor-derived'
    ].map((disposition) => [
      disposition,
      familyEntries.filter((entry) => entry.disposition === disposition)
        .length
    ])
  );
  familySummaries.push({
    family: definition.family,
    selectedRowCount: familyEntries.length,
    successorDerivedImplementationCount: familyEntries.filter(
      (entry) => entry.successorDerivedImplementation
    ).length,
    dispositionCounts,
    successorContext: definition.successorContext
  });
}

const successorOnlyCapabilities = [
  ...waeDelta.successorOnlyMandatoryExamples.map((example) => ({
    sourceDocumentId: 'WAP-236-WAESpec-20020207-a',
    successorId: example.successorId,
    feature: example.feature,
    disposition: 'successor-only',
    strictTargetPolicy: example.targetDisposition
  })),
  {
    sourceDocumentId: 'WAP-230-WSP-20010705-a',
    successorId: null,
    feature: 'Successor WSP assigned numbers or defaults absent from WAP-203',
    disposition: 'successor-only',
    strictTargetPolicy:
      'Do not expose through strict mode; require an explicit successor capability and separate fixtures.'
  },
  {
    sourceDocumentId: 'WAP-238-WML-20010911-a',
    successorId: null,
    feature: 'WML2-only markup or processing behavior',
    disposition: 'successor-only',
    strictTargetPolicy:
      'Keep outside strict WML 1.3 parsing/runtime outcomes unless a named compatibility capability is enabled.'
  }
];

const dispositionCounts = Object.fromEntries(
  [
    'compatible',
    'strict-correction-required',
    'successor-only',
    'not-successor-derived'
  ].map((disposition) => [
    disposition,
    entries.filter((entry) => entry.disposition === disposition).length
  ])
);
const implementationBasisCounts = Object.fromEntries(
  [
    ...new Set(entries.map((entry) => entry.implementationBasis))
  ]
    .sort()
    .map((basis) => [
      basis,
      entries.filter((entry) => entry.implementationBasis === basis).length
    ])
);

const register = {
  schemaVersion: 1,
  releaseId: selectedClauses.releaseId,
  generatedFrom: {
    programWorkItem: 'CONF-007',
    recordedOn,
    generator:
      'spec-processing/scripts/generate-wap-delta-register.mjs'
  },
  target,
  status: 'selected-profile-successor-delta-complete',
  policy,
  successorAuthorities,
  summary: {
    selectedRowCount: entries.length,
    successorDerivedImplementationCount: entries.filter(
      (entry) => entry.successorDerivedImplementation
    ).length,
    dispositionCounts,
    implementationBasisCounts,
    successorOnlyCapabilityCount: successorOnlyCapabilities.length
  },
  familySummaries,
  entries,
  successorOnlyCapabilities
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(register, null, 2)}\n`);
console.log(
  `Wrote ${outputPath}: ${entries.length} selected rows / ` +
    `${register.summary.successorDerivedImplementationCount} successor-derived foundations`
);
