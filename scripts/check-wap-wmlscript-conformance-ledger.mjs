#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

const ledgers = [
  {
    family: 'wmlscript',
    path:
      'spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json',
    expression: 'WMLScript:MCF',
    expectedSequence: [
      'WAP-193-WMLScript',
      'WAP-193_101-WMLScript'
    ],
    expectedCounts: {
      total: 112,
      mandatory: 108,
      optional: 4,
      selected: 41,
      selectedOptional: 3,
      notApplicable: 68,
      partial: 23,
      missing: 18
    },
    expectedActors: new Set([
      'wmlscript-encoder',
      'wmlscript-interpreter'
    ]),
    expectedIds: Array.from({ length: 112 }, (_, index) => {
      const ordinal = index + 1;
      return `WMLS-${ordinal >= 69 ? 'C' : 'S'}-${String(ordinal).padStart(3, '0')}`;
    }),
    isClient: (obligation) => obligation.ordinal >= 69,
    expectedDocumentFor: () => 'WAP-193_101-WMLScript'
  },
  {
    family: 'wmlscript-libraries',
    path:
      'spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json',
    expression: 'WMLScriptLibs:MCF',
    expectedSequence: [
      'WAP-194-WMLScriptLibraries',
      'WAP-194_103-WMLScriptLibraries'
    ],
    expectedCounts: {
      total: 95,
      mandatory: 93,
      optional: 2,
      selected: 80,
      selectedOptional: 2,
      notApplicable: 13,
      partial: 14,
      missing: 66
    },
    expectedActors: new Set([
      'wmlscript-library-encoder',
      'wmlscript-library-interpreter'
    ]),
    expectedIds: Array.from({ length: 95 }, (_, index) => {
      const ordinal = index + 1;
      if (ordinal === 48) return 'WMLSSL048';
      if (ordinal === 95) return 'WMLSSL-C-095';
      return `WMLSSL-${String(ordinal).padStart(3, '0')}`;
    }),
    isClient: (obligation) => obligation.ordinal >= 14,
    expectedDocumentFor: (obligation) =>
      obligation.ordinal === 95
        ? 'WAP-194_103-WMLScriptLibraries'
        : 'WAP-194-WMLScriptLibraries'
  }
];

const release = readJson(
  'spec-processing/source-manifests/wap-1.2.1-release.json'
);
const ingestion = readJson(
  'spec-processing/source-manifests/wap-1.2.1-ingestion-status.json'
);
const effectiveSpec = readJson(
  'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'
);
const classConformance = readJson(
  'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
);
const program = readJson('docs/waves/wap-1.2.1-compliance-program.json');
const traceability = fs.readFileSync(
  path.join(root, 'docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md'),
  'utf8'
);
const workItemsText = fs.readFileSync(
  path.join(root, 'docs/waves/WORK_ITEMS.md'),
  'utf8'
);

const failures = [];
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
const programIds = new Set(
  program.sprints.flatMap((sprint) =>
    sprint.workItems.map((workItem) => workItem.id)
  )
);
const allowedStatuses = new Set(['mandatory', 'optional']);
const allowedImplementationStatuses = new Set([
  'implemented',
  'partial',
  'missing',
  'not-assessed'
]);

if (classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001') {
  failures.push('class-conformance ledger must retain CCR-CLASSC-C-001');
}

for (const config of ledgers) {
  const ledger = readJson(config.path);
  const family = effectiveSpec.families.find(
    (entry) => entry.family === config.family
  );
  const effectiveDocuments = new Map(
    (family?.documents ?? []).map((document) => [
      document.documentId,
      document
    ])
  );

  if (ledger.schemaVersion !== 1) {
    failures.push(`${config.family}: schemaVersion must be 1`);
  }
  if (
    ledger.releaseId !== release.release.id ||
    ledger.family !== config.family
  ) {
    failures.push(`${config.family}: ledger release/family target drift`);
  }
  if (
    ledger.target?.classProfile !==
    'WAP-215 Class C client (CCR-CLASSC-C-001)'
  ) {
    failures.push(`${config.family}: selected Class C profile drift`);
  }
  if (
    !classConformance.selectedTarget?.requirementExpressions?.includes(
      config.expression
    )
  ) {
    failures.push(
      `${config.family}: WAP-215 selection lost ${config.expression}`
    );
  }
  if (
    ledger.authority?.classProfileSource?.selectedRequirement !==
    config.expression
  ) {
    failures.push(
      `${config.family}: ledger does not retain exact feature-group expression`
    );
  }
  if (
    JSON.stringify(family?.effectiveSequence) !==
      JSON.stringify(config.expectedSequence) ||
    JSON.stringify(ledger.authority?.effectiveSequence) !==
      JSON.stringify(config.expectedSequence)
  ) {
    failures.push(`${config.family}: effective source sequence drift`);
  }

  for (const source of ledger.authority?.extractionSources ?? []) {
    const releaseMember = releaseMembers.get(source.documentId);
    const effectiveDocument = effectiveDocuments.get(source.documentId);
    const ingestionMember = ingestionMembers.get(source.documentId);
    if (!releaseMember || !effectiveDocument || !ingestionMember) {
      failures.push(
        `${config.family}/${source.documentId}: absent from source locks`
      );
      continue;
    }
    if (
      source.sha256 !== releaseMember.sha256 ||
      source.sha256 !== effectiveDocument.sha256
    ) {
      failures.push(
        `${config.family}/${source.documentId}: PDF SHA-256 drift`
      );
    }
    if (
      source.textExtractionSha256 &&
      source.textExtractionSha256 !== ingestionMember.parsedText?.sha256
    ) {
      failures.push(
        `${config.family}/${source.documentId}: text SHA-256 drift`
      );
    }
  }

  for (const sourceName of ['governingSource', 'classProfileSource']) {
    const source = ledger.authority?.[sourceName];
    const governing = governingSources.get(source?.documentId);
    if (!governing || source?.sha256 !== governing.sha256) {
      failures.push(`${config.family}/${sourceName}: source lock drift`);
    }
  }
  if (
    !ledger.authority?.governingSource?.selectedDefinition?.includes(
      'all mandatory client features'
    )
  ) {
    failures.push(`${config.family}: WAP-221 MCF definition is missing`);
  }

  const obligations = ledger.obligations ?? [];
  const actualIds = obligations.map((obligation) => obligation.id);
  if (JSON.stringify(actualIds) !== JSON.stringify(config.expectedIds)) {
    failures.push(`${config.family}: SCR IDs/order differ from source`);
  }
  if (new Set(actualIds).size !== actualIds.length) {
    failures.push(`${config.family}: duplicate SCR IDs`);
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
  const selectedOptional = obligations.filter(
    (obligation) =>
      obligation.disposition?.classCProfile ===
      'optional-not-required-by-class-c-client'
  );
  const notApplicable = obligations.filter(
    (obligation) =>
      obligation.disposition?.classCProfile ===
      'not-applicable-to-class-c-client'
  );
  const selectedPartial = selected.filter(
    (obligation) => obligation.mapping?.implementationStatus === 'partial'
  );
  const selectedMissing = selected.filter(
    (obligation) => obligation.mapping?.implementationStatus === 'missing'
  );
  const actualCounts = {
    total: obligations.length,
    mandatory: mandatory.length,
    optional: optional.length,
    selected: selected.length,
    selectedOptional: selectedOptional.length,
    notApplicable: notApplicable.length,
    partial: selectedPartial.length,
    missing: selectedMissing.length
  };
  if (
    JSON.stringify(actualCounts) !==
    JSON.stringify(config.expectedCounts)
  ) {
    failures.push(
      `${config.family}: expected ${JSON.stringify(config.expectedCounts)}, found ${JSON.stringify(actualCounts)}`
    );
  }

  for (const obligation of obligations) {
    if (!config.expectedActors.has(obligation.actor)) {
      failures.push(`${obligation.id}: invalid actor=${obligation.actor}`);
    }
    if (!allowedStatuses.has(obligation.specificationStatus)) {
      failures.push(
        `${obligation.id}: invalid status=${obligation.specificationStatus}`
      );
    }
    const expectedSelected =
      config.isClient(obligation) &&
      obligation.specificationStatus === 'mandatory';
    const expectedDisposition = expectedSelected
      ? 'required-by-class-c-client-mcf'
      : config.isClient(obligation)
        ? 'optional-not-required-by-class-c-client'
        : 'not-applicable-to-class-c-client';
    if (obligation.disposition?.classCProfile !== expectedDisposition) {
      failures.push(`${obligation.id}: Class C disposition drift`);
    }
    const expectedStrict =
      obligation.specificationStatus === 'mandatory'
        ? 'required-for-claimed-actor'
        : 'declare-implemented-or-deferred';
    if (obligation.disposition?.strict !== expectedStrict) {
      failures.push(`${obligation.id}: strict disposition drift`);
    }
    if (obligation.disposition?.enhancementMayReplaceStrictBehavior !== false) {
      failures.push(
        `${obligation.id}: enhancements must not replace strict behavior`
      );
    }
    if (
      obligation.sourceAnchor?.documentId !==
        config.expectedDocumentFor(obligation) ||
      !obligation.sourceAnchor?.staticConformanceSection ||
      !obligation.referencedSection
    ) {
      failures.push(`${obligation.id}: source anchor is incomplete or wrong`);
    }
    const mapping = obligation.mapping;
    if (
      !mapping?.implementationDomain ||
      !Array.isArray(mapping.ownerLayers) ||
      !mapping.ownerLayers.includes('engine-wasm') ||
      !Array.isArray(mapping.requirementIds) ||
      mapping.requirementIds.length === 0 ||
      !Array.isArray(mapping.workItems) ||
      mapping.workItems.length === 0 ||
      !Array.isArray(mapping.implementationEvidence) ||
      !Array.isArray(mapping.testEvidence) ||
      !allowedImplementationStatuses.has(mapping.implementationStatus) ||
      !mapping.assessmentNote
    ) {
      failures.push(`${obligation.id}: traceability mapping is incomplete`);
      continue;
    }
    if (
      expectedSelected &&
      !new Set(['partial', 'missing']).has(mapping.implementationStatus)
    ) {
      failures.push(
        `${obligation.id}: selected row must be conservatively audited`
      );
    }
    if (!expectedSelected && mapping.implementationStatus !== 'not-assessed') {
      failures.push(
        `${obligation.id}: out-of-profile row must remain not-assessed`
      );
    }
    if (
      mapping.implementationStatus === 'missing' &&
      (mapping.implementationEvidence.length > 0 ||
        mapping.testEvidence.length > 0)
    ) {
      failures.push(`${obligation.id}: missing row contains positive evidence`);
    }
    for (const requirementId of mapping.requirementIds) {
      if (!traceability.includes(`### ${requirementId}:`)) {
        failures.push(
          `${obligation.id}: unknown thematic requirement ${requirementId}`
        );
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

  if (
    ledger.summary?.selectedDirectNormativeTestEvidenceCount !== 0 ||
    ledger.summary?.selectedImplementationStatus?.partial !==
      config.expectedCounts.partial ||
    ledger.summary?.selectedImplementationStatus?.missing !==
      config.expectedCounts.missing
  ) {
    failures.push(`${config.family}: conservative audit summary drift`);
  }
}

const librariesLedger = readJson(
  'spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json'
);
const sourceTypo = librariesLedger.obligations.find(
  (obligation) => obligation.ordinal === 48
);
if (
  sourceTypo?.id !== 'WMLSSL048' ||
  sourceTypo?.normalizedAlias !== 'WMLSSL-048' ||
  librariesLedger.authority?.sourceAnomalies?.[0]?.sourceId !== 'WMLSSL048'
) {
  failures.push(
    'WMLScript Libraries ledger must preserve and explain source ID WMLSSL048'
  );
}

if (failures.length > 0) {
  console.error('WMLScript conformance ledger check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  'WMLScript conformance ledgers valid: 112 language rows / 41 selected; 95 library rows / 80 selected.'
);
