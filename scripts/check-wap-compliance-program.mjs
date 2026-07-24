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
for (const itemId of ['CONF-002', 'CONF-003']) {
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
const wml203 = program.sprints
  .find((sprint) => sprint.id === 'WML-2')
  ?.workItems.find((workItem) => workItem.id === 'WML-203');
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
