#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

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
const externalDependencies = readJson(
  'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json'
);
const externalIngestion = readJson(
  'spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json'
);
const program = readJson('docs/waves/wap-1.2.1-compliance-program.json');
const requirementIndex = fs.readFileSync(
  path.join(root, 'docs/waves/REQUIREMENT_INDEX.md'),
  'utf8'
);
const workItems = fs.readFileSync(
  path.join(root, 'docs/waves/WORK_ITEMS.md'),
  'utf8'
);

const configs = [
  {
    family: 'wdp',
    expression: 'WDP:MCF',
    sequence: [
      'WAP-200-WDP',
      'WAP-200_001-WDP',
      'WAP-200_002-WDP',
      'WAP-200_003-WDP',
      'WAP-200_004-WDP',
      'WAP-200_005-WDP'
    ],
    counts: {
      itemCount: 146,
      mandatoryCount: 14,
      optionalCount: 132,
      clientCount: 71,
      serverCount: 75,
      mandatoryClientCount: 7,
      selectedClassCTransportPathCount: 9,
      selectedDirectNormativeTestEvidenceCount: 0,
      selectedProvisionalTestEvidenceCount: 9,
      orderedIdsSha256:
        'd090dead796a8ba086e350455ceccb557f34e75ada6d25492c8ee603d3b7b4bc'
    },
    selectedIds: [
      'WDP-C-001',
      'WDP-CORE-C-001',
      'WDP-PF-C-001',
      'WDP-PF-C-002',
      'WDP-CT-C-002',
      'WDP-NA-C-000',
      'WDP-NA-C-003',
      'WDP-NA-C-006',
      'WDP-NA-C-007'
    ],
    selectedStatus: { partial: 9 }
  },
  {
    family: 'wcmp',
    expression: 'WCMP:MCF',
    sequence: ['WAP-202-WCMP'],
    counts: {
      itemCount: 62,
      mandatoryCount: 2,
      optionalCount: 60,
      clientCount: 31,
      serverCount: 31,
      mandatoryClientCount: 1,
      selectedClassCTransportPathCount: 5,
      selectedDirectNormativeTestEvidenceCount: 0,
      selectedProvisionalTestEvidenceCount: 0,
      orderedIdsSha256:
        'b1a481f22af82ba4bd69c433d692f714ba236a680c4ae318629c0d87ceb0e285'
    },
    selectedIds: [
      'WCMP-C-001',
      'WCMP-SP-C-002',
      'WCMP-GEN-C-001',
      'WCMP-GEN-C-003',
      'WCMP-GEN-C-006'
    ],
    selectedStatus: { missing: 5 }
  },
  {
    family: 'wsp',
    expression: 'WSP:MCF',
    sequence: [
      'WAP-203-WSP',
      'WAP-203_001-WSP',
      'WAP-203_003-WSP',
      'WAP-203_005-WSP'
    ],
    counts: {
      itemCount: 109,
      mandatoryCount: 39,
      optionalCount: 70,
      clientCount: 56,
      serverCount: 53,
      mandatoryClientCount: 20,
      selectedClassCTransportPathCount: 8,
      selectedDirectNormativeTestEvidenceCount: 0,
      selectedProvisionalTestEvidenceCount: 8,
      orderedIdsSha256:
        '5efb3b964986398370e16e9ae556a9fab455af7e8c1846880b868792d1d55584'
    },
    selectedIds: [
      'WSP-C-001',
      'WSP-CL-C-001',
      'WSP-CL-C-003',
      'WSP-CL-C-004',
      'WSP-CL-C-005',
      'WSP-CL-C-006',
      'WSP-CL-C-007',
      'WSP-CL-C-020'
    ],
    selectedStatus: { partial: 8 }
  }
];

const failures = [];
const programIds = new Set(
  program.sprints.flatMap((sprint) =>
    sprint.workItems.map((workItem) => workItem.id)
  )
);
const expectedClassExpressions = new Set(
  classConformance.selectedTarget?.requirementExpressions ?? []
);

if (classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001') {
  failures.push('selected class profile is not CCR-CLASSC-C-001');
}

for (const config of configs) {
  const ledger = readJson(
    `spec-processing/source-manifests/wap-1.2.1-${config.family}-scr.json`
  );
  const family = effectiveSpec.families.find(
    (entry) => entry.family === config.family
  );

  if (
    ledger.schemaVersion !== 1 ||
    ledger.releaseId !== release.release.id ||
    ledger.family !== config.family
  ) {
    failures.push(`${config.family}: ledger identity drift`);
  }
  if (
    !expectedClassExpressions.has(config.expression) ||
    ledger.target?.selectedRequirement !== config.expression ||
    ledger.authority?.classProfileSource?.selectedRequirement !==
      config.expression
  ) {
    failures.push(`${config.family}: Class C expression drift`);
  }
  if (
    JSON.stringify(family?.effectiveSequence) !==
      JSON.stringify(config.sequence) ||
    JSON.stringify(ledger.authority?.effectiveSequence) !==
      JSON.stringify(config.sequence)
  ) {
    failures.push(`${config.family}: effective source sequence drift`);
  }

  for (const source of ledger.authority?.extractionSources ?? []) {
    const releaseMember = release.members.find(
      (entry) => entry.documentId === source.documentId
    );
    const ingestionMember = ingestion.members.find(
      (entry) => entry.documentId === source.documentId
    );
    const familyDocument = family.documents.find(
      (entry) => entry.documentId === source.documentId
    );
    if (
      source.sha256 !== releaseMember?.sha256 ||
      source.sha256 !== familyDocument?.sha256 ||
      source.repositoryState !== familyDocument?.localState ||
      source.textExtractionSha256 !==
        ingestionMember?.parsedText?.sha256 ||
      source.textExtractionBytes !== ingestionMember?.parsedText?.bytes
    ) {
      failures.push(`${config.family}: ${source.documentId} source lock drift`);
    }
  }
  if (
    ledger.authority?.extractionSources?.length !== config.sequence.length
  ) {
    failures.push(`${config.family}: extraction source count drift`);
  }

  const summarySubset = Object.fromEntries(
    Object.keys(config.counts).map((key) => [key, ledger.summary?.[key]])
  );
  if (JSON.stringify(summarySubset) !== JSON.stringify(config.counts)) {
    failures.push(`${config.family}: source/profile summary drift`);
  }
  if (
    JSON.stringify(ledger.summary?.selectedImplementationStatus) !==
    JSON.stringify(config.selectedStatus)
  ) {
    failures.push(`${config.family}: selected implementation audit drift`);
  }

  const obligations = ledger.obligations ?? [];
  if (
    new Set(obligations.map((row) => row.id)).size !== obligations.length ||
    obligations.some((row, index) => row.ordinal !== index + 1)
  ) {
    failures.push(`${config.family}: duplicate IDs or ordinal drift`);
  }
  const selectedRows = obligations.filter(
    (row) =>
      row.disposition?.classCProfile ===
      'required-by-selected-class-c-transport-path'
  );
  if (
    JSON.stringify(selectedRows.map((row) => row.id)) !==
    JSON.stringify(config.selectedIds)
  ) {
    failures.push(`${config.family}: selected dependency closure drift`);
  }

  for (const row of obligations) {
    if (
      !['client', 'server'].includes(row.actor) ||
      !['mandatory', 'optional'].includes(row.specificationStatus)
    ) {
      failures.push(`${config.family}: ${row.id} actor/status drift`);
    }
    if (!row.sourceAnchor?.staticConformanceSection) {
      failures.push(`${config.family}: ${row.id} has no source anchor`);
    }
    const isSelected = config.selectedIds.includes(row.id);
    if (
      isSelected &&
      !['partial', 'missing'].includes(row.mapping?.implementationStatus)
    ) {
      failures.push(`${config.family}: ${row.id} optimistic selected status`);
    }
    if (
      !isSelected &&
      row.mapping?.implementationStatus !== 'not-assessed'
    ) {
      failures.push(`${config.family}: ${row.id} unselected audit drift`);
    }
    if (
      row.mapping?.implementationStatus === 'missing' &&
      (row.mapping.implementationEvidence.length > 0 ||
        row.mapping.testEvidence.length > 0)
    ) {
      failures.push(`${config.family}: ${row.id} missing row has evidence`);
    }
    if (isSelected) {
      if (
        !row.mapping.requirementIds.every((id) =>
          requirementIndex.includes(`\`${id}\``)
        )
      ) {
        failures.push(
          `${config.family}: ${row.id} requirement mapping is unresolved`
        );
      }
      for (const id of row.mapping.workItems) {
        if (!programIds.has(id) && !workItems.includes(`### ${id} `)) {
          failures.push(
            `${config.family}: ${row.id} work item ${id} is unresolved`
          );
        }
      }
      for (const evidence of row.mapping.implementationEvidence) {
        const evidencePath = path.join(root, evidence.path);
        if (
          !fs.existsSync(evidencePath) ||
          !fs.readFileSync(evidencePath, 'utf8').includes(evidence.symbol)
        ) {
          failures.push(
            `${config.family}: ${row.id} implementation evidence drift`
          );
        }
      }
      for (const evidence of row.mapping.testEvidence) {
        const evidencePath = path.join(root, evidence.path);
        if (
          !fs.existsSync(evidencePath) ||
          !fs.readFileSync(evidencePath, 'utf8').includes(evidence.test) ||
          !evidence.limitation
        ) {
          failures.push(`${config.family}: ${row.id} test evidence drift`);
        }
      }
    }
  }
}

const wdp = readJson(
  'spec-processing/source-manifests/wap-1.2.1-wdp-scr.json'
);
const wcmp = readJson(
  'spec-processing/source-manifests/wap-1.2.1-wcmp-scr.json'
);
const wsp = readJson(
  'spec-processing/source-manifests/wap-1.2.1-wsp-scr.json'
);

const requiredDependencyExpressions = new Map([
  [
    'WDP-C-001',
    'WDP-CORE-C-001 AND WDP-NA-C-000 AND (WDP-ANSI-C-000 OR WDP-CDMA-C-000 OR WDP-CT-C-002 OR WDP-CT-C-006 OR WDP-CT-C-008 OR WDP-DECT-C-000 OR WDP-FLEX-C-001 OR WDP-FLEX-C-002 OR WDP-GSM-C-000 OR WDP-PDC-C-000 OR WDP-MOBITEX-C-000 OR WDP-TETRA-C-000)'
  ],
  [
    'WDP-NA-C-000',
    'WDP-NA-C-001 OR WDP-NA-C-002 OR WDP-NA-C-003 OR WDP-NA-C-004 OR WDP-NA-C-005 OR WDP-NA-C-008 OR WDP-NA-C-009'
  ],
  ['WCMP-C-001', 'WCMP-SP-C-001 OR WCMP-SP-C-002'],
  [
    'WCMP-SP-C-002',
    'WCMP-GEN-C-001 AND WCMP-GEN-C-003 AND WCMP-GEN-C-006'
  ],
  ['WSP-C-001', 'WSP-CL-C-001 OR WSP-CO-C-001'],
  [
    'WSP-CL-C-001',
    'WDP:MCF AND WSP-CL-C-003 AND WSP-CL-C-004 AND WSP-CL-C-005 AND WSP-CL-C-006 AND WSP-CL-C-007 AND WSP-CL-C-020'
  ],
  ['WSP-CO-C-012', 'WTP:MCF AND WTP-C-013']
]);
const allRows = [...wdp.obligations, ...wcmp.obligations, ...wsp.obligations];
for (const [id, expression] of requiredDependencyExpressions) {
  if (
    allRows.find((row) => row.id === id)?.dependencyExpression !== expression
  ) {
    failures.push(`${id}: dependency expression drift`);
  }
}

if (
  wsp.obligations
    .filter((row) => row.id.startsWith('WSP-CO-C-'))
    .some(
      (row) =>
        row.disposition.classCProfile !==
        'conditional-on-connection-oriented-wsp-and-wtp'
    ) ||
  wsp.obligations
    .filter(
      (row) =>
        row.disposition.classCProfile ===
        'required-by-selected-class-c-transport-path'
    )
    .some((row) => row.id.startsWith('WSP-CO-'))
) {
  failures.push('WSP connection-oriented/WTP conditional boundary drift');
}

for (const dependencyId of ['rfc-768', 'rfc-791']) {
  const snapshot = wdp.authority?.selectedExternalDependencies?.find(
    (entry) => entry.id === dependencyId
  );
  const metadata = externalDependencies.dependencies.find(
    (entry) => entry.id === dependencyId
  );
  const acquisition = externalIngestion.dependencies.find(
    (entry) => entry.dependencyId === dependencyId
  );
  if (
    snapshot?.sourceUrl !== metadata?.sourceUrl ||
    snapshot?.referenceDisposition !== metadata?.referenceDisposition ||
    snapshot?.acquisitionState !== acquisition?.acquisitionState ||
    JSON.stringify(snapshot?.artifacts) !==
      JSON.stringify(
        acquisition?.artifacts.map((artifact) => ({
          id: artifact.id,
          sourceUrl: artifact.sourceUrl,
          bytes: artifact.bytes,
          sha256: artifact.sha256
        }))
      )
  ) {
    failures.push(`${dependencyId}: WDP external source lock drift`);
  }
}
const openLabels = new Set(
  externalDependencies.openCitationGroups.flatMap((group) => group.labels)
);
if (
  !openLabels.has('TIAEIA-732') ||
  !wdp.authority?.selectedExternalDependencies?.some(
    (entry) =>
      entry.citationLabel === 'TIAEIA-732' &&
      entry.acquisitionState === 'open-label-not-yet-normalized'
  )
) {
  failures.push('selected CDPD TIAEIA-732 source gap is not explicit');
}

if (failures.length > 0) {
  console.error('WAP transport conformance ledger validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 transport SCR ledgers');
for (const config of configs) {
  const ledger = readJson(
    `spec-processing/source-manifests/wap-1.2.1-${config.family}-scr.json`
  );
  console.log(
    `PASS ${config.family.toUpperCase()}: ${ledger.summary.itemCount} rows, ` +
      `${ledger.summary.selectedClassCTransportPathCount} selected path rows, ` +
      `${JSON.stringify(ledger.summary.selectedImplementationStatus)}`
  );
}
console.log('PASS source locks, dependency closures, mappings, and WTP boundary');
