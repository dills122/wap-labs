#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const program = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/waves/wap-1.2.1-compliance-program.json'),
    'utf8'
  )
);
const graph = JSON.parse(
  fs.readFileSync(
    path.join(root, 'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'),
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

const allowedStatuses = new Set(['todo', 'in-progress', 'blocked', 'done']);
const allowedOwners = new Set([
  'documentation',
  'spec-processing',
  'engine-wasm',
  'transport-rust',
  'browser',
  'gateway-kannel',
  'cross-layer',
  'qa'
]);
const specialSources = new Set([
  'conformance-governance',
  'external-dependencies',
  'associated-assets'
]);
const graphFamilies = new Set(graph.families.map((family) => family.family));
const requiredFamilies = new Set(
  graph.families
    .filter((family) =>
      ['strict-baseline', 'strict-supporting', 'strict-conditional'].includes(
        family.targetDisposition
      )
    )
    .map((family) => family.family)
);

const failures = [];
const sprintIds = new Set();
const workItemIds = new Set();
const coveredFamilies = new Set();

if (program.schemaVersion !== 1) {
  failures.push(`schemaVersion=${program.schemaVersion}; expected 1`);
}
if (program.target?.release !== 'WAP 1.2.1' || program.target?.markup !== 'WML 1.3') {
  failures.push('target must remain WAP 1.2.1 with WML 1.3');
}
if (!program.executionPolicy?.strictBeforeEnhancement) {
  failures.push('strictBeforeEnhancement must remain enabled');
}
if (
  !program.executionPolicy?.binarySourcePromotionRequiresRedistributionApproval ||
  !program.executionPolicy?.redistributionBlockDoesNotBlockInternalEvidence
) {
  failures.push(
    'redistribution must gate public source promotion without blocking internal evidence work'
  );
}
const selectedProfile = program.profiles?.find(
  (profile) => profile.id === 'class-c-data-client'
);
if (
  selectedProfile?.status !== 'selected-from-wap-215' ||
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001'
) {
  failures.push('primary profile must be the exact WAP-215 Class C client');
}
const expectedClassCFamilies = [
  ...(classConformance.selectedTarget?.effectiveFamilies ?? [])
].sort();

for (const sprint of program.sprints ?? []) {
  if (sprintIds.has(sprint.id)) {
    failures.push(`duplicate sprint ID: ${sprint.id}`);
  }
  for (const dependency of sprint.dependsOn ?? []) {
    if (!sprintIds.has(dependency)) {
      failures.push(`${sprint.id}: dependency ${dependency} is missing or not earlier`);
    }
  }
  sprintIds.add(sprint.id);

  if (!allowedStatuses.has(sprint.status)) {
    failures.push(`${sprint.id}: invalid status=${sprint.status}`);
  }
  if (!sprint.goal || !Array.isArray(sprint.exitGates) || sprint.exitGates.length === 0) {
    failures.push(`${sprint.id}: goal and exit gates are required`);
  }
  if (!Array.isArray(sprint.workItems) || sprint.workItems.length === 0) {
    failures.push(`${sprint.id}: at least one work item is required`);
    continue;
  }

  const workStatuses = sprint.workItems.map((item) => item.status);
  const expectedSprintStatus = workStatuses.every((status) => status === 'done')
    ? 'done'
    : workStatuses.some((status) => status === 'in-progress')
      ? 'in-progress'
      : workStatuses.some((status) => status === 'blocked') &&
          workStatuses.every((status) => ['done', 'blocked'].includes(status))
        ? 'blocked'
        : 'todo';
  if (sprint.status !== expectedSprintStatus) {
    failures.push(
      `${sprint.id}: status=${sprint.status}; expected ${expectedSprintStatus} from work items`
    );
  }

  for (const item of sprint.workItems) {
    if (workItemIds.has(item.id)) {
      failures.push(`duplicate work item ID: ${item.id}`);
    }
    workItemIds.add(item.id);

    if (!allowedStatuses.has(item.status)) {
      failures.push(`${item.id}: invalid status=${item.status}`);
    }
    for (const owner of item.ownerLayers ?? []) {
      if (!allowedOwners.has(owner)) {
        failures.push(`${item.id}: invalid owner layer=${owner}`);
      }
    }
    if (!Array.isArray(item.ownerLayers) || item.ownerLayers.length === 0) {
      failures.push(`${item.id}: at least one owner layer is required`);
    }
    for (const family of item.sourceFamilies ?? []) {
      if (!graphFamilies.has(family) && !specialSources.has(family)) {
        failures.push(`${item.id}: unknown source family=${family}`);
      }
      if (graphFamilies.has(family)) {
        coveredFamilies.add(family);
      }
    }
    if (!Array.isArray(item.sourceFamilies) || item.sourceFamilies.length === 0) {
      failures.push(`${item.id}: at least one source family is required`);
    }
    for (const field of ['outputs', 'acceptance', 'evidence']) {
      if (!Array.isArray(item[field]) || item[field].length === 0) {
        failures.push(`${item.id}: ${field} must be a non-empty array`);
      }
    }
  }
}

for (const family of requiredFamilies) {
  if (!coveredFamilies.has(family)) {
    failures.push(`required source family has no work item: ${family}`);
  }
}

const enhancementSprint = program.sprints.find((sprint) => sprint.id === 'ENH-12');
if (!enhancementSprint?.strictDifferentialGate) {
  failures.push('ENH-12 must keep the strict differential gate enabled');
}
if (!enhancementSprint?.dependsOn?.includes('REL-10')) {
  failures.push('ENH-12 must depend on the strict release gate REL-10');
}
if (!program.sprints.some((sprint) =>
  sprint.workItems.some(
    (item) =>
      item.id === 'SRC-004' &&
      item.status === 'done' &&
      item.outputs.some((output) =>
        output.includes('wap-1.2.1-class-conformance.json')
      ) &&
      item.evidence.includes(
        'node spec-processing/scripts/check-wap-class-conformance.mjs'
      )
  )
)) {
  failures.push('WAP-215 recovery and class extraction must remain verified');
}
if (!program.sprints.some((sprint) =>
  sprint.workItems.some(
    (item) =>
      item.id === 'CONF-001' &&
      item.status === 'done' &&
      item.evidence.includes(
        'node spec-processing/scripts/check-wap-class-conformance.mjs'
      )
  )
)) {
  failures.push('CONF-001 must retain exact class-profile evidence');
}
const conformanceSprint = program.sprints.find(
  (sprint) => sprint.id === 'CONF-1'
);
const sourceSprint = program.sprints.find((sprint) => sprint.id === 'SRC-0');
const src005 = sourceSprint?.workItems.find(
  (workItem) => workItem.id === 'SRC-005'
);
if (
  src005?.status !== 'done' ||
  !src005?.acceptance?.some(
    (line) =>
      line.includes('TIAEIA-732') &&
      line.includes('licensed-access disposition')
  )
) {
  failures.push(
    'SRC-005 must retain the selected TIAEIA-732 normalization and license boundary'
  );
}
for (const itemId of ['CONF-002', 'CONF-003', 'CONF-007']) {
  const item = conformanceSprint?.workItems.find(
    (workItem) => workItem.id === itemId
  );
  if (
    JSON.stringify([...(item?.sourceFamilies ?? [])].sort()) !==
    JSON.stringify(expectedClassCFamilies)
  ) {
    failures.push(`${itemId} must cover the exact selected Class C families`);
  }
}
const conf007 = conformanceSprint?.workItems.find(
  (workItem) => workItem.id === 'CONF-007'
);
if (
  conf007?.status !== 'done' ||
  !conf007?.outputs?.includes(
    'Unified WAP 1.2.1-to-successor implementation delta register'
  ) ||
  !conf007?.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-successor-delta.json'
  ) ||
  !conf007?.acceptance?.some((line) =>
    line.includes('successor-era material')
  ) ||
  !conf007?.evidence?.includes('node scripts/check-wap-delta-register.mjs')
) {
  failures.push(
    'CONF-007 must retain the completed cross-family successor delta register'
  );
}
const conf003 = conformanceSprint?.workItems.find(
  (workItem) => workItem.id === 'CONF-003'
);
if (
  conf003?.status !== 'done' ||
  !conf003?.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json'
  ) ||
  !conf003?.acceptance?.some((line) =>
    line.includes('All 198 selected rows')
  ) ||
  !conf003?.acceptance?.some((line) =>
    line.includes('closed 198-row gate')
  ) ||
  !conf003?.evidence?.includes(
    'node scripts/check-wap-selected-normative-clauses.mjs'
  ) ||
  !conf003?.evidence?.includes(
    'node scripts/check-wap-conformance-ledger.mjs'
  )
) {
  failures.push(
    'CONF-003 must retain its complete clause ledger and closed all-201 gate'
  );
}
for (const workItemId of ['CONF-004', 'CONF-005', 'CONF-006']) {
  const governanceItem = conformanceSprint?.workItems.find(
    (workItem) => workItem.id === workItemId
  );
  if (
    governanceItem?.status !== 'done' ||
    !governanceItem.evidence?.includes(
      'node scripts/check-requirement-status-drift.mjs'
    )
  ) {
    failures.push(
      `${workItemId} must retain completed requirement/status drift evidence`
    );
  }
}
const conf002 = conformanceSprint?.workItems.find(
  (workItem) => workItem.id === 'CONF-002'
);
if (
  !conf002?.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json'
  ) ||
  !conf002?.evidence?.includes(
    'node scripts/check-wap-wbxml-conformance-ledger.mjs'
  )
) {
  failures.push('CONF-002 must retain the WBXML SCR ledger and validator');
}
for (const ledgerPath of [
  'spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json',
  'spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json',
  'spec-processing/source-manifests/wap-1.2.1-caching-scr.json',
  'spec-processing/source-manifests/wap-1.2.1-wdp-scr.json',
  'spec-processing/source-manifests/wap-1.2.1-wcmp-scr.json',
  'spec-processing/source-manifests/wap-1.2.1-wsp-scr.json'
]) {
  if (!conf002?.outputs?.includes(ledgerPath)) {
    failures.push(`CONF-002 must retain ${ledgerPath}`);
  }
}
if (
  conf002?.status !== 'done' ||
  !conf002?.evidence?.includes(
    'node scripts/check-wap-transport-conformance-ledgers.mjs'
  )
) {
  failures.push(
    'CONF-002 must close all selected-family SCR ledgers with transport validation'
  );
}
if (
  !conf002?.evidence?.includes(
    'node scripts/check-wap-wmlscript-conformance-ledger.mjs'
  )
) {
  failures.push(
    'CONF-002 must retain the paired WMLScript SCR validator'
  );
}
if (
  !conf002?.evidence?.includes(
    'node scripts/check-wap-caching-conformance-ledger.mjs'
  )
) {
  failures.push('CONF-002 must retain the WAP-120 caching SCR validator');
}
const wmlscriptSprint = program.sprints.find(
  (sprint) => sprint.id === 'WMLS-5'
);
const wmlscriptLibraries = wmlscriptSprint?.workItems.find(
  (workItem) => workItem.id === 'WMLS-504'
);
if (
  wmlscriptSprint?.status !== 'in-progress' ||
  wmlscriptLibraries?.status !== 'in-progress' ||
  !wmlscriptLibraries?.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json'
  ) ||
  !wmlscriptLibraries?.acceptance?.some((line) =>
    line.includes('80 mandatory WMLScriptLibs:MCF rows')
  ) ||
  !wmlscriptLibraries?.evidence?.includes(
    'node scripts/check-wap-wmlscript-conformance-ledger.mjs'
  )
) {
  failures.push(
    'WMLS-504 must retain exact 80-row WMLScriptLibs:MCF ledger closure'
  );
}
const wmlscriptBytecode = wmlscriptSprint?.workItems.find(
  (workItem) => workItem.id === 'WMLS-501'
);
if (
  !wmlscriptBytecode?.acceptance?.some((line) =>
    line.includes('41 mandatory WMLScript:MCF rows')
  )
) {
  failures.push(
    'WMLS-501 must retain exact 41-row WMLScript:MCF bytecode closure'
  );
}
const waeCaching = program.sprints
  .find((sprint) => sprint.id === 'WAE-6')
  ?.workItems.find((workItem) => workItem.id === 'WAE-603');
if (
  waeCaching?.status !== 'in-progress' ||
  !waeCaching?.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-caching-scr.json'
  ) ||
  !waeCaching?.acceptance?.some((line) =>
    line.includes('five mandatory WAPCachingMod:MCF rows')
  ) ||
  !waeCaching?.evidence?.includes(
    'node scripts/check-wap-caching-conformance-ledger.mjs'
  )
) {
  failures.push(
    'WAE-603 must retain exact five-row WAPCachingMod:MCF closure'
  );
}
const transportSprint = program.sprints.find(
  (sprint) => sprint.id === 'TRN-7'
);
const wdpCore = transportSprint?.workItems.find(
  (workItem) => workItem.id === 'TRN-701'
);
const wdpConstrained = transportSprint?.workItems.find(
  (workItem) => workItem.id === 'TRN-702'
);
const wcmpCore = transportSprint?.workItems.find(
  (workItem) => workItem.id === 'TRN-703'
);
const replayCorpus = transportSprint?.workItems.find(
  (workItem) => workItem.id === 'TRN-706'
);
const successorDeltaAudit = transportSprint?.workItems.find(
  (workItem) => workItem.id === 'TRN-707'
);
const wcmpIpProfileCorrection = transportSprint?.workItems.find(
  (workItem) => workItem.id === 'TRN-708'
);
if (
  transportSprint?.status !== 'in-progress' ||
  wdpCore?.status !== 'done' ||
  wdpConstrained?.status !== 'done' ||
  wcmpCore?.status !== 'done' ||
  !wdpCore?.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-wdp-scr.json'
  ) ||
  !wcmpCore?.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-wcmp-scr.json'
  ) ||
  !wdpCore?.acceptance?.some((line) => line.includes('nine selected')) ||
  !wdpConstrained?.acceptance?.some(
    (line) =>
      line.includes('nine adopted') &&
      line.includes('destination-IP reassembly below WDP')
  ) ||
  !wdpConstrained?.evidence?.includes(
    'cargo test --manifest-path transport-rust/Cargo.toml --test wdp_constrained_replay'
  ) ||
  !wdpConstrained?.evidence?.includes(
    'node scripts/wap-context-pack.mjs TRN-702'
  ) ||
  !wcmpCore?.acceptance?.some(
    (line) => line.includes('five general-WCMP') && line.includes('non-IP capability')
  ) ||
  replayCorpus?.status !== 'in-progress' ||
  JSON.stringify(replayCorpus?.explicitUnmappedFamilies) !==
    JSON.stringify(['wtp']) ||
  JSON.stringify(replayCorpus?.followUpWorkItems) !==
    JSON.stringify(['TRN-704', 'TRN-705']) ||
  !replayCorpus?.outputs?.includes(
    'schema-v2 exact WDP delivery evidence in transport-rust/tests/network/interop/wdp_cdpd_ipv4_seed.json'
  ) ||
  !replayCorpus?.acceptance?.some(
    (line) =>
      line.includes('selected WDP-only tranche') &&
      line.includes('576-octet') &&
      line.includes('schema-v2') &&
      line.includes('service-data-unit bytes')
  ) ||
  !replayCorpus?.acceptance?.some(
    (line) =>
      line.includes('WTP') &&
      line.includes('conditional') &&
      line.includes('do not close TRN-706')
  ) ||
  !replayCorpus?.evidence?.includes(
    'node scripts/wap-context-pack.mjs TRN-706'
  ) ||
  successorDeltaAudit?.status !== 'in-progress' ||
  JSON.stringify(successorDeltaAudit?.explicitUnmappedFamilies) !==
    JSON.stringify(['wtp']) ||
  JSON.stringify(successorDeltaAudit?.followUpWorkItems) !==
    JSON.stringify(['TRN-708']) ||
  !successorDeltaAudit?.contextDocuments?.includes(
    'WAP-259-WDP-20010614-a'
  ) ||
  !successorDeltaAudit?.evidence?.includes(
    'node scripts/wap-context-pack.mjs TRN-707'
  ) ||
  wcmpIpProfileCorrection?.status !== 'done' ||
  JSON.stringify(wcmpIpProfileCorrection?.dependsOn) !==
    JSON.stringify(['TRN-703', 'T0-17']) ||
  !wcmpIpProfileCorrection?.specReferences?.some((line) =>
    line.includes('WAP-202-WCMP section 5.3')
  ) ||
  !wcmpIpProfileCorrection?.acceptance?.some(
    (line) => line.includes('strict CDPD/IPv4 profile') && line.includes('ICMPv4')
  ) ||
  !wcmpIpProfileCorrection?.outputs?.includes(
    'transport-rust/tests/fixtures/transport/wcmp_cdpd_icmp_profile/icmp_fixture.json'
  ) ||
  !wcmpIpProfileCorrection?.evidence?.includes(
    'node scripts/wap-context-pack.mjs TRN-708'
  ) ||
  !transportSprint?.exitGates?.some((line) =>
    line.includes('only when connection-oriented WSP is claimed')
  )
) {
  failures.push(
    'TRN-7 must retain the exact WDP/WCMP selected path and conditional WTP boundary'
  );
}
const wspSprint = program.sprints.find((sprint) => sprint.id === 'WSP-8');
const wspMatrix = wspSprint?.workItems.find(
  (workItem) => workItem.id === 'WSP-801'
);
const wspPost = wspSprint?.workItems.find(
  (workItem) => workItem.id === 'WSP-805'
);
if (
  wspSprint?.status !== 'in-progress' ||
  wspMatrix?.status !== 'in-progress' ||
  !wspMatrix?.outputs?.includes(
    'spec-processing/source-manifests/wap-1.2.1-wsp-scr.json'
  ) ||
  !wspMatrix?.acceptance?.some((line) =>
    line.includes('eight-row selected connectionless path')
  ) ||
  !wspMatrix?.evidence?.includes(
    'node scripts/check-wap-transport-conformance-ledgers.mjs'
  ) ||
  !wspPost?.acceptance?.some(
    (line) =>
      line.includes('connectionless WSP') &&
      line.includes('WTP is activated only')
  )
) {
  failures.push(
    'WSP-8 must retain the exact connectionless Class C path and WTP capability gate'
  );
}
const wmlSprint = program.sprints.find((sprint) => sprint.id === 'WML-2');
const wml201 = wmlSprint?.workItems.find((workItem) => workItem.id === 'WML-201');
if (
  wml201?.status !== 'done' ||
  JSON.stringify(wml201?.scrMatrix) !==
    JSON.stringify({ family: 'wml', scope: 'all-effective-rows' }) ||
  !wml201?.acceptance?.some(
    (line) =>
      line.includes('30 retain validated code/test links') &&
      line.includes('17 retain additive gap work items') &&
      line.includes('29 optional rows')
  ) ||
  !wml201?.acceptance?.some(
    (line) => line.includes('All 174 selected WML clauses')
  ) ||
  !wml201?.evidence?.includes('node scripts/wap-context-pack.mjs WML-201') ||
  !wml201?.evidence?.includes('pnpm wap-graph:check')
) {
  failures.push(
    'WML-201 must retain the completed 76-row evidence matrix and direct WML-family graph closure'
  );
}
const wml203 = wmlSprint?.workItems.find((workItem) => workItem.id === 'WML-203');
if (
  !wml203?.acceptance?.some((line) =>
    line.includes('WBXML-C-001, WBXML-C-010, and WBXML-C-011')
  ) ||
  !wml203?.evidence?.includes(
    'node scripts/check-wap-wbxml-conformance-ledger.mjs'
  )
) {
  failures.push('WML-203 must retain exact WBXML:MCF closure evidence');
}

if (failures.length > 0) {
  console.error('WAP compliance program check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 compliance program');
console.log(
  `PASS ${sprintIds.size} dependency-ordered sprints and ${workItemIds.size} unique work items`
);
console.log(
  `PASS all ${requiredFamilies.size} strict/supporting/conditional source families have work coverage`
);
console.log('PASS strict-before-enhancement and WAP-215 profile guardrails');
