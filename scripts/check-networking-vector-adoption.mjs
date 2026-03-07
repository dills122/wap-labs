#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'docs/waves/networking-vector-adoption.json');
const workItemsPath = path.join(root, 'docs/waves/WORK_ITEMS.md');
const transportTraceabilityPath = path.join(root, 'docs/waves/TRANSPORT_SPEC_TRACEABILITY.md');
const adjacentTraceabilityPath = path.join(root, 'docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md');
const securityTraceabilityPath = path.join(root, 'docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md');

function fail(message) {
  console.error(`networking vector adoption check failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  fail('missing docs/waves/networking-vector-adoption.json');
}

const register = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (!Array.isArray(register.items) || register.items.length === 0) {
  fail('items must be a non-empty array');
}

const validStatuses = new Set(['adopt-now', 'defer']);
const validSourceClasses = new Set(['interop-reference', 'heuristic']);
const validProfiles = new Set(['gateway-bridged', 'wap-net-core']);
const workItemsText = fs.readFileSync(workItemsPath, 'utf8');
const requirementUniverse = new Set();

for (const sourcePath of [
  transportTraceabilityPath,
  adjacentTraceabilityPath,
  securityTraceabilityPath
]) {
  for (const match of fs
    .readFileSync(sourcePath, 'utf8')
    .matchAll(/\bRQ-[A-Z]+-\d{3}\b/g)) {
    requirementUniverse.add(match[0]);
  }
}

for (const item of register.items) {
  if (typeof item.id !== 'string' || item.id.length === 0) {
    fail('each item requires a non-empty id');
  }
  if (!validStatuses.has(item.status)) {
    fail(`item ${item.id} uses invalid status ${item.status}`);
  }
  if (!validSourceClasses.has(item.sourceClass)) {
    fail(`item ${item.id} uses invalid sourceClass ${item.sourceClass}`);
  }
  if (!Array.isArray(item.profileCompatibility) || item.profileCompatibility.length === 0) {
    fail(`item ${item.id} must declare profileCompatibility`);
  }
  for (const profile of item.profileCompatibility) {
    if (!validProfiles.has(profile)) {
      fail(`item ${item.id} references unsupported profile ${profile}`);
    }
  }
  if (!Array.isArray(item.mappedTickets) || item.mappedTickets.length === 0) {
    fail(`item ${item.id} must map to at least one ticket`);
  }
  for (const ticket of item.mappedTickets) {
    if (!workItemsText.includes(`### ${ticket} `)) {
      fail(`item ${item.id} references unknown ticket ${ticket}`);
    }
  }
  if (!Array.isArray(item.mappedRequirementIds) || item.mappedRequirementIds.length === 0) {
    fail(`item ${item.id} must map to at least one requirement`);
  }
  for (const rq of item.mappedRequirementIds) {
    if (!requirementUniverse.has(rq)) {
      fail(`item ${item.id} references unknown requirement ${rq}`);
    }
  }
  if (!Array.isArray(item.fixtureTargets) || item.fixtureTargets.length === 0) {
    fail(`item ${item.id} must include at least one fixture target`);
  }
  for (const target of item.fixtureTargets) {
    if (!fs.existsSync(path.join(root, target))) {
      fail(`item ${item.id} points to missing fixture target ${target}`);
    }
  }
  if (!Array.isArray(item.sourceUrls) || item.sourceUrls.length === 0) {
    fail(`item ${item.id} must include at least one source URL`);
  }
  if (typeof item.rationale !== 'string' || item.rationale.length === 0) {
    fail(`item ${item.id} requires a rationale`);
  }
}

console.log(
  `networking vector adoption OK (${register.items.length} items; statuses: ${[
    ...new Set(register.items.map((item) => item.status))
  ]
    .sort()
    .join(', ')})`
);
