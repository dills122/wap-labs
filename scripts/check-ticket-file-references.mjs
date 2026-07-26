#!/usr/bin/env node
// Checks that every path cited in a MAINTENANCE_WORK_ITEMS.md ticket's
// `Files:` list still resolves in the repo tree. Scoped deliberately to that
// one structured field (not free-form prose elsewhere in the doc) to keep
// false positives near zero -- see docs/agents/AGENT_STANDARDS.md's Backlog
// Lifecycle Policy and this repo's own M1-15/M1-24 stale-path incident.

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docRelPath = 'docs/waves/MAINTENANCE_WORK_ITEMS.md';
const docPath = path.join(root, docRelPath);

const source = fs.readFileSync(docPath, 'utf8');

const ticketRegex = /^### (M1-\d+)\s+.*$/gm;
const tickets = [...source.matchAll(ticketRegex)].map((match, index, all) => {
  const start = match.index;
  const end = index + 1 < all.length ? all[index + 1].index : source.length;
  return { id: match[1], body: source.slice(start, end) };
});

if (tickets.length === 0) {
  console.error(`Unable to parse any M1-* tickets from ${docRelPath}`);
  process.exit(1);
}

const filesFieldRegex = /\d+\.\s+`Files`:\n((?:- .+\n?)+)/;

function extractPathCandidate(bulletLine) {
  const firstBacktick = bulletLine.match(/`([^`]+)`/);
  if (!firstBacktick) {
    return null;
  }
  const candidate = firstBacktick[1].trim();
  // Only treat it as a path if it looks like one -- avoids false positives on
  // non-path backtick spans that could otherwise leak into this field.
  if (!candidate.includes('/') && !candidate.includes('.')) {
    return null;
  }
  return candidate;
}

function pathExists(candidate) {
  // A trailing `/*` denotes "this directory generally", not a literal
  // filename -- resolve it as a directory-existence check instead of trying
  // to glob-match, which would always miss.
  const target = candidate.endsWith('/*') ? candidate.slice(0, -2) : candidate;
  return fs.existsSync(path.join(root, target));
}

// A ticket whose stale Files reference is already tracked by an additive
// corrective follow-up (Backlog Lifecycle Policy: `done` tickets are never
// edited in place) shouldn't fail this check forever -- that would make the
// check permanently red for a known, already-resolved-elsewhere gap. Treat
// any ticket named in another ticket's `Depends On` field as acknowledged.
const dependsOnRegex = /`Depends On`:\s*`(M1-\d+)`/g;
const acknowledgedStaleTickets = new Set(
  [...source.matchAll(dependsOnRegex)].map((match) => match[1])
);

const failures = [];
let checkedCount = 0;

for (const ticket of tickets) {
  const match = ticket.body.match(filesFieldRegex);
  if (!match) {
    continue;
  }
  const bulletLines = match[1].split('\n').filter((line) => line.trim().startsWith('- '));
  for (const bulletLine of bulletLines) {
    const candidate = extractPathCandidate(bulletLine);
    if (!candidate) {
      continue;
    }
    checkedCount += 1;
    if (pathExists(candidate)) {
      continue;
    }
    if (acknowledgedStaleTickets.has(ticket.id)) {
      continue;
    }
    failures.push(`${ticket.id}: Files entry does not resolve: \`${candidate}\``);
  }
}

if (failures.length) {
  console.error(`Stale ticket file reference check failed (${docRelPath}).`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error(
    'Per the Backlog Lifecycle Policy, do not edit a `done` ticket\'s Files list directly --' +
      ' add an additive corrective follow-up ticket (see M1-24 for the precedent).'
  );
  process.exit(1);
}

console.log(
  `Ticket file reference check OK (${tickets.length} tickets, ${checkedCount} paths checked)`
);
