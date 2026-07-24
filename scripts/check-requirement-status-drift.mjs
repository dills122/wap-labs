#!/usr/bin/env node

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

const familyDefinitions = [
  {
    family: 'wml',
    ledgerFile: 'wap-1.2.1-wml-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedRows: 76,
    expectedSelected: 39,
    expectedClauses: 174,
    expectedStatus: { implemented: 3, partial: 24, missing: 12 },
    activeDoc: 'docs/waves/WAP_1_2_1_WML_SCR_LEDGER.md'
  },
  {
    family: 'wae',
    ledgerFile: 'wap-1.2.1-wae-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedRows: 86,
    expectedSelected: 11,
    expectedClauses: 39,
    expectedStatus: { implemented: 5, partial: 3, missing: 3 },
    activeDoc: 'docs/waves/WAP_1_2_1_WAE_SCR_LEDGER.md'
  },
  {
    family: 'wbxml',
    ledgerFile: 'wap-1.2.1-wbxml-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedRows: 15,
    expectedSelected: 3,
    expectedClauses: 48,
    expectedStatus: { implemented: 0, partial: 1, missing: 2 },
    activeDoc: 'docs/waves/WAP_1_2_1_WBXML_SCR_LEDGER.md'
  },
  {
    family: 'wmlscript',
    ledgerFile: 'wap-1.2.1-wmlscript-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedRows: 112,
    expectedSelected: 41,
    expectedClauses: 107,
    expectedStatus: { implemented: 0, partial: 23, missing: 18 },
    activeDoc: 'docs/waves/WAP_1_2_1_WMLSCRIPT_SCR_LEDGER.md'
  },
  {
    family: 'wmlscript-libraries',
    ledgerFile: 'wap-1.2.1-wmlscript-libraries-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedRows: 95,
    expectedSelected: 80,
    expectedClauses: 211,
    expectedStatus: { implemented: 0, partial: 14, missing: 66 },
    activeDoc:
      'docs/waves/WAP_1_2_1_WMLSCRIPT_LIBRARIES_SCR_LEDGER.md'
  },
  {
    family: 'caching',
    ledgerFile: 'wap-1.2.1-caching-scr.json',
    selectedDisposition: 'required-by-class-c-client-mcf',
    expectedRows: 11,
    expectedSelected: 5,
    expectedClauses: 68,
    expectedStatus: { implemented: 0, partial: 3, missing: 2 },
    activeDoc: 'docs/waves/WAP_1_2_1_CACHING_SCR_LEDGER.md'
  },
  {
    family: 'wdp',
    ledgerFile: 'wap-1.2.1-wdp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    expectedRows: 146,
    expectedSelected: 9,
    expectedClauses: 49,
    expectedStatus: { implemented: 0, partial: 9, missing: 0 },
    activeDoc: 'docs/waves/WAP_1_2_1_TRANSPORT_SCR_LEDGERS.md'
  },
  {
    family: 'wcmp',
    ledgerFile: 'wap-1.2.1-wcmp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    expectedRows: 62,
    expectedSelected: 5,
    expectedClauses: 28,
    expectedStatus: { implemented: 0, partial: 0, missing: 5 },
    activeDoc: 'docs/waves/WAP_1_2_1_TRANSPORT_SCR_LEDGERS.md'
  },
  {
    family: 'wsp',
    ledgerFile: 'wap-1.2.1-wsp-scr.json',
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    expectedRows: 109,
    expectedSelected: 8,
    expectedClauses: 57,
    expectedStatus: { implemented: 0, partial: 8, missing: 0 },
    activeDoc: 'docs/waves/WAP_1_2_1_TRANSPORT_SCR_LEDGERS.md'
  }
];

const failures = [];
const requirementIndex = read('docs/waves/REQUIREMENT_INDEX.md');
const workItemsDocument = read('docs/waves/WORK_ITEMS.md');
const testCoverage = read('docs/waves/SPEC_TEST_COVERAGE.md');
const coverageDashboard = read('docs/waves/SPEC_COVERAGE_DASHBOARD.md');
const masterAudit = read('docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md');
const normativeLedgerDocument = read(
  'docs/waves/WAP_1_2_1_NORMATIVE_CLAUSE_LEDGER.md'
);
const complianceProgramDocument = read(
  'docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md'
);
const planningBaseline = read(
  'docs/waves/WAP_1_2_1_PLANNING_BASELINE.md'
);
const program = readJson(
  'docs/waves/wap-1.2.1-compliance-program.json'
);
const selectedClauses = readJson(
  'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json'
);

const programItems = new Map();
const programTokens = new Map();
const programStatusCounts = {
  done: 0,
  blocked: 0,
  'in-progress': 0,
  todo: 0
};
for (const sprint of program.sprints ?? []) {
  for (const workItem of sprint.workItems ?? []) {
    programItems.set(workItem.id, workItem);
    programTokens.set(workItem.id, workItem.status);
    programStatusCounts[workItem.status] += 1;
    for (const ticket of workItem.existingTickets ?? []) {
      programTokens.set(ticket, workItem.status);
    }
  }
}
if (
  JSON.stringify(programStatusCounts) !==
  JSON.stringify({ done: 12, blocked: 1, 'in-progress': 11, todo: 54 })
) {
  failures.push('compliance-program work-item status rollup drift');
}

const historicalWorkItemExceptions = new Map([
  [
    'W0-07',
    'Historical specialist lane retained for provisional newContext/getCurrentCard evidence.'
  ]
]);
for (const [workItem, explanation] of historicalWorkItemExceptions) {
  if (
    programTokens.has(workItem) ||
    !workItemsDocument.includes(`### ${workItem} `) ||
    explanation.length < 20
  ) {
    failures.push(`${workItem}: historical work-item exception drift`);
  }
}

const clauseFamilies = new Map(
  (selectedClauses.families ?? []).map((family) => [
    family.family,
    family
  ])
);
const aggregateStatus = { implemented: 0, partial: 0, missing: 0 };
let aggregateRows = 0;
let aggregateSelected = 0;
let aggregateClauses = 0;
const seenSelectedParents = new Set();
const seenRequirementIds = new Set();

for (const definition of familyDefinitions) {
  const ledgerPath = path.join(
    manifestDirectory,
    definition.ledgerFile
  );
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const obligations = ledger.obligations ?? [];
  const selected = obligations.filter(
    (obligation) =>
      obligation.disposition?.classCProfile ===
      definition.selectedDisposition
  );
  const familyClauses = clauseFamilies.get(definition.family);
  const clauseParents = new Map(
    (familyClauses?.parents ?? []).map((parent) => [parent.id, parent])
  );
  const familyStatus = { implemented: 0, partial: 0, missing: 0 };
  const activeFamilyDoc = read(definition.activeDoc);

  aggregateRows += obligations.length;
  aggregateSelected += selected.length;
  aggregateClauses += familyClauses?.clauseCount ?? 0;

  if (
    ledger.family !== definition.family ||
    obligations.length !== definition.expectedRows ||
    selected.length !== definition.expectedSelected ||
    familyClauses?.selectedParentCount !== definition.expectedSelected ||
    familyClauses?.clauseCount !== definition.expectedClauses
  ) {
    failures.push(
      `${definition.family}: row, selected-parent, or clause total drift`
    );
  }
  if (
    !activeFamilyDoc.includes(definition.ledgerFile) ||
    !activeFamilyDoc.includes(String(definition.expectedClauses)) ||
    !testCoverage.includes(definition.ledgerFile)
  ) {
    failures.push(
      `${definition.family}: active ledger or test-coverage cross-reference drift`
    );
  }

  for (const obligation of selected) {
    const rowLocation = `${definition.family}/${obligation.id}`;
    const status = obligation.mapping?.implementationStatus;
    const parent = clauseParents.get(obligation.id);
    if (seenSelectedParents.has(rowLocation)) {
      failures.push(`${rowLocation}: duplicate selected parent`);
    }
    seenSelectedParents.add(rowLocation);

    if (!(status in familyStatus)) {
      failures.push(`${rowLocation}: invalid implementation status=${status}`);
      continue;
    }
    familyStatus[status] += 1;
    aggregateStatus[status] += 1;

    if (
      !Array.isArray(obligation.mapping?.ownerLayers) ||
      obligation.mapping.ownerLayers.length === 0 ||
      !Array.isArray(obligation.mapping?.requirementIds) ||
      obligation.mapping.requirementIds.length === 0 ||
      !Array.isArray(obligation.mapping?.workItems) ||
      obligation.mapping.workItems.length === 0 ||
      !obligation.mapping?.evidenceState
    ) {
      failures.push(`${rowLocation}: incomplete selected-row crosswalk`);
    }
    if (
      obligation.disposition?.enhancementMayReplaceStrictBehavior !== false
    ) {
      failures.push(`${rowLocation}: strict behavior replacement guard drift`);
    }

    for (const requirementId of obligation.mapping?.requirementIds ?? []) {
      seenRequirementIds.add(requirementId);
      if (!requirementIndex.includes(`| \`${requirementId}\` |`)) {
        failures.push(
          `${rowLocation}: ${requirementId} missing from requirement index`
        );
      }
    }
    for (const workItem of obligation.mapping?.workItems ?? []) {
      if (
        !programTokens.has(workItem) &&
        !historicalWorkItemExceptions.has(workItem)
      ) {
        failures.push(
          `${rowLocation}: ${workItem} missing from program and exception policy`
        );
      }
    }
    if (
      status !== 'implemented' &&
      !(obligation.mapping?.workItems ?? []).some((workItem) =>
        ['todo', 'in-progress'].includes(programTokens.get(workItem))
      )
    ) {
      failures.push(
        `${rowLocation}: partial/missing row lacks an active additive work item`
      );
    }
    if (
      !parent ||
      parent.implementationStatus !== status ||
      !Array.isArray(parent.clauseIds) ||
      parent.clauseIds.length === 0
    ) {
      failures.push(`${rowLocation}: nested-clause/status snapshot drift`);
    }
  }

  if (
    JSON.stringify(familyStatus) !==
    JSON.stringify(definition.expectedStatus)
  ) {
    failures.push(
      `${definition.family}: selected implementation summary drift`
    );
  }
}

if (
  selectedClauses.scope?.status !== 'complete' ||
  selectedClauses.scope?.remainingSelectedParentCount !== 0 ||
  aggregateRows !== 712 ||
  aggregateSelected !== 201 ||
  aggregateClauses !== 781 ||
  JSON.stringify(aggregateStatus) !==
    JSON.stringify({ implemented: 8, partial: 85, missing: 108 })
) {
  failures.push('selected-profile aggregate planning/status drift');
}

const governanceItems = ['CONF-004', 'CONF-005', 'CONF-006'];
for (const workItemId of governanceItems) {
  const workItem = programItems.get(workItemId);
  if (
    workItem?.status !== 'done' ||
    !workItem.evidence?.includes(
      'node scripts/check-requirement-status-drift.mjs'
    )
  ) {
    failures.push(`${workItemId}: governance completion/evidence drift`);
  }
}

const requiredDocumentFragments = new Map([
  [
    'docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md',
    [
      'all 201 selected rows now expand into 781',
      'direct conformance fixture implementation and execution remain'
    ]
  ],
  [
    'docs/waves/WAP_1_2_1_NORMATIVE_CLAUSE_LEDGER.md',
    [
      'covers all 201 selected Class C parent rows',
      'The 781 clauses are classified as 738 required'
    ]
  ],
  [
    'docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md',
    [
      '`CONF-003` is complete',
      'all nine families and all 201 selected parent rows'
    ]
  ],
  [
    'docs/waves/SPEC_COVERAGE_DASHBOARD.md',
    [
      'WMLScript Libraries: 80 selected parents / 211 clauses',
      'all 781 direct fixtures planned'
    ]
  ],
  [
    'docs/waves/WAP_1_2_1_PLANNING_BASELINE.md',
    [
      'Planning status: complete for the selected strict profile',
      '| **Total** | **201** | **781** | **7** | **84** | **110** |',
      '60 residual external citations',
      '`SRC-006` is the only blocked source item'
    ]
  ]
]);
const loadedRollups = new Map([
  ['docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md', masterAudit],
  [
    'docs/waves/WAP_1_2_1_NORMATIVE_CLAUSE_LEDGER.md',
    normativeLedgerDocument
  ],
  [
    'docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md',
    complianceProgramDocument
  ],
  ['docs/waves/SPEC_COVERAGE_DASHBOARD.md', coverageDashboard],
  ['docs/waves/WAP_1_2_1_PLANNING_BASELINE.md', planningBaseline]
]);
for (const [documentPath, fragments] of requiredDocumentFragments) {
  const document = loadedRollups.get(documentPath);
  for (const fragment of fragments) {
    if (!document.includes(fragment)) {
      failures.push(`${documentPath}: missing rollup fragment "${fragment}"`);
    }
  }
}

const forbiddenActiveFragments = [
  'seven selected families remain',
  'CONF-003 stays open',
  'WMLScript Libraries remains',
  'nested-clause audit pending',
  'remaining 80 WMLScript Libraries rows',
  'all 570 direct fixtures planned'
];
for (const [documentPath, document] of loadedRollups) {
  for (const fragment of forbiddenActiveFragments) {
    if (document.includes(fragment)) {
      failures.push(`${documentPath}: stale fragment "${fragment}"`);
    }
  }
}

if (failures.length > 0) {
  console.error('WAP requirement/status drift check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 requirement/status drift');
console.log(
  'PASS 712 source rows / 201 selected rows / 781 clauses remain synchronized'
);
console.log(
  `PASS ${seenRequirementIds.size} requirement IDs, active additive work, evidence states, and strict guards`
);
console.log(
  'PASS active rollups, family ledgers, test coverage, and CONF-004..006 evidence'
);
