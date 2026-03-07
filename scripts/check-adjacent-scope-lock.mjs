#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function requireMatch(file, pattern, description) {
  const content = read(file);
  if (!pattern.test(content)) {
    console.error(`Scope-lock check failed: ${file} missing "${description}"`);
    process.exit(1);
  }
}

const docs = {
  checklist: 'docs/waves/networking-implementation-checklist.md',
  outOfScope: 'docs/waves/OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md',
  adjacentTrace: 'docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md',
  specTrace: 'docs/waves/TRANSPORT_SPEC_TRACEABILITY.md',
  decisionRecord: 'docs/waves/NETWORK_PROFILE_DECISION_RECORD.md',
  workItems: 'docs/waves/WORK_ITEMS.md',
};

// Adjacent families are explicitly deferred and trace linked to scope lock.
requireMatch(
  docs.checklist,
  /WAP-204.*deferred/i,
  'WAP-204 deferred rationale in checklist'
);
requireMatch(
  docs.checklist,
  /WAP-120.*deferred/i,
  'WAP-120 deferred rationale in checklist'
);
requireMatch(
  docs.checklist,
  /WAP-213.*deferred/i,
  'WAP-213 deferred rationale in checklist'
);
requireMatch(
  docs.checklist,
  /WAP-175|WAP-227|WAP-231|Bearer/i,
  'messaging/cache-adjacent and bearer-adjacent deferrals in checklist'
);

// Out-of-scope family review has explicit scope rationale block by family.
requireMatch(
  docs.outOfScope,
  /Scope rationale:/,
  'out-of-scope rationale block'
);
requireMatch(
  docs.outOfScope,
  /WAP-120.*deferred/i,
  'WAP-120 out-of-scope rationale'
);
requireMatch(
  docs.outOfScope,
  /WAP-204.*deferred/i,
  'WAP-204 out-of-scope rationale'
);
requireMatch(
  docs.outOfScope,
  /WAP-213.*deferred/i,
  'WAP-213 out-of-scope rationale'
);
requireMatch(
  docs.outOfScope,
  /WAP-227.*deferred/i,
  'WAP-227/231 out-of-scope rationale'
);

// Traceability docs keep revival behind a ticketized scope lock.
requireMatch(
  docs.adjacentTrace,
  /T0-17/,
  'T0-17 scope lock mention in adjacent traceability'
);
requireMatch(
  docs.adjacentTrace,
  /explicitly deferred|deferred/gm,
  'explicit deferred posture in adjacent traceability'
);
requireMatch(
  docs.specTrace,
  /Any future revival must.*T0-14\+T0-17|T0-14.*T0-17/,
  'explicit future-revival gate in transport traceability'
);

// Profile decision and work list require T0-17.
requireMatch(
  docs.decisionRecord,
  /1\.\s+`T0-17` scope lock is `done`/i,
  'T0-17 scope-lock bullet in decision record'
);
requireMatch(
  docs.workItems,
  /### T0-17/,
  'T0-17 ticket block in work list'
);

console.log('Scope-lock check OK: adjacent transport scope deferrals are documented in canonical artifacts.');
