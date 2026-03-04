#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const docs = {
  maintenance: 'docs/waves/MAINTENANCE_WORK_ITEMS.md',
  workItems: 'docs/waves/WORK_ITEMS.md',
  engineReadme: 'engine-wasm/README.md',
  browserReadme: 'browser/README.md',
  transportReadme: 'transport-rust/README.md'
};

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function sectionBody(source, headingRegex) {
  const match = source.match(headingRegex);
  return match ? match[1] : '';
}

function parseMaintenanceStatuses(source) {
  const statuses = new Map();
  const regex = /###\s+(M1-\d{2})[\s\S]*?1\.\s+`Status`:\s+`([^`]+)`/g;
  for (const match of source.matchAll(regex)) {
    statuses.set(match[1], match[2]);
  }
  return statuses;
}

function parseM1Ids(source) {
  return new Set([...source.matchAll(/\bM1-\d{2}\b/g)].map((m) => m[0]));
}

function checkPointerSection(label, ids, statuses, failures) {
  for (const id of ids) {
    if (!statuses.has(id)) {
      failures.push(`${label}: references unknown maintenance item ${id}`);
      continue;
    }
    const status = statuses.get(id);
    if (status === 'done') {
      failures.push(`${label}: references completed item ${id} in next-slice pointers`);
    }
  }
}

const maintenance = read(docs.maintenance);
const workItems = read(docs.workItems);
const engineReadme = read(docs.engineReadme);
const browserReadme = read(docs.browserReadme);
const transportReadme = read(docs.transportReadme);

const statuses = parseMaintenanceStatuses(maintenance);
if (statuses.size === 0) {
  console.error('Unable to parse M1 status entries from docs/waves/MAINTENANCE_WORK_ITEMS.md');
  process.exit(1);
}

const sections = [
  {
    label: docs.workItems,
    ids: parseM1Ids(
      sectionBody(
        workItems,
        /## Next In Line \(Architecture Maintenance Sprint\)\n\n([\s\S]*?)(?:\n## |\n### |$)/
      )
    )
  },
  {
    label: docs.engineReadme,
    ids: parseM1Ids(
      sectionBody(engineReadme, /## Next implementation slice\n\n([\s\S]*?)(?:\n## |$)/)
    )
  },
  {
    label: docs.browserReadme,
    ids: parseM1Ids(
      sectionBody(browserReadme, /## Next implementation slice\n\n([\s\S]*?)(?:\n## |$)/)
    )
  },
  {
    label: docs.transportReadme,
    ids: parseM1Ids(
      sectionBody(transportReadme, /## Next implementation slice\n\n([\s\S]*?)(?:\n## |$)/)
    )
  }
];

const failures = [];

for (const section of sections) {
  if (section.ids.size === 0) {
    failures.push(`${section.label}: missing M1-* references in next-slice pointer section`);
    continue;
  }
  checkPointerSection(section.label, section.ids, statuses, failures);
}

if (failures.length) {
  console.error('Worklist drift check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Worklist drift check OK (${sections.map((section) => `${section.label}: ${[...section.ids].sort().join(', ')}`).join(' | ')})`
);
