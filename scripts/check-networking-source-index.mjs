#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'spec-processing/external-source-index.json');
const traceabilityPath = path.join(root, 'docs/waves/TRANSPORT_SPEC_TRACEABILITY.md');
const securityPath = path.join(root, 'docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md');

function fail(message) {
  console.error(`networking source index check failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  fail('missing spec-processing/external-source-index.json');
}

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (!Array.isArray(index.entries) || index.entries.length === 0) {
  fail('index entries must be a non-empty array');
}

const validSourceClasses = new Set(['normative', 'interop-reference', 'heuristic']);
const requiredFamilies = new Set(['supplemental-context', 'kannel', 'wireshark']);
const seenFamilies = new Set();
const requirementUniverse = new Set(
  [...fs.readFileSync(traceabilityPath, 'utf8').matchAll(/\bRQ-[A-Z]+-\d{3}\b/g)].map((m) => m[0])
);
for (const match of fs.readFileSync(securityPath, 'utf8').matchAll(/\bRQ-[A-Z]+-\d{3}\b/g)) {
  requirementUniverse.add(match[0]);
}

for (const entry of index.entries) {
  if (typeof entry.id !== 'string' || entry.id.length === 0) {
    fail('each entry requires a non-empty id');
  }
  if (typeof entry.family !== 'string' || entry.family.length === 0) {
    fail(`entry ${entry.id} requires a family`);
  }
  seenFamilies.add(entry.family);
  if (!validSourceClasses.has(entry.sourceClass)) {
    fail(`entry ${entry.id} uses invalid sourceClass ${entry.sourceClass}`);
  }
  if (!Array.isArray(entry.mappedRequirementIds) || entry.mappedRequirementIds.length === 0) {
    fail(`entry ${entry.id} must map to at least one requirement`);
  }
  for (const rq of entry.mappedRequirementIds) {
    if (!requirementUniverse.has(rq)) {
      fail(`entry ${entry.id} references unknown requirement ${rq}`);
    }
  }
  if (entry.status === 'present') {
    if (typeof entry.path !== 'string' || entry.path.length === 0) {
      fail(`present entry ${entry.id} must include a path`);
    }
    if (!fs.existsSync(path.join(root, entry.path))) {
      fail(`present entry ${entry.id} points to missing path ${entry.path}`);
    }
  }
  if (entry.status === 'planned' && entry.path !== null) {
    fail(`planned entry ${entry.id} must use null path until ingested`);
  }
}

for (const family of requiredFamilies) {
  if (!seenFamilies.has(family)) {
    fail(`missing required family ${family}`);
  }
}

console.log(
  `networking source index OK (${index.entries.length} entries; families: ${[...seenFamilies].sort().join(', ')})`
);
