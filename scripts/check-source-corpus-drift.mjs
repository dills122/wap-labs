#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

const sourceDir = path.join(root, 'spec-processing/source-material');
const pdfCount = fs
  .readdirSync(sourceDir, { withFileTypes: true })
  .filter((d) => d.isFile() && /\.pdf$/i.test(d.name)).length;

const checks = [
  {
    file: 'docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md',
    label: 'ledger corpus count',
    regex: /source-material` \((\d+) files\)/
  },
  {
    file: 'docs/waves/SPEC_COVERAGE_DASHBOARD.md',
    label: 'dashboard scope count',
    regex: /source-material` \((\d+) files\)/
  },
  {
    file: 'docs/waves/SPEC_COVERAGE_DASHBOARD.md',
    label: 'dashboard status count',
    regex: /Status: all (\d+) canonical PDFs are `deep-extracted`/
  },
  {
    file: 'docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md',
    label: 'master audit corpus count',
    regex: /- `([0-9]+)` PDF files total/
  }
];

const failures = [];

for (const check of checks) {
  const source = read(check.file);
  const match = source.match(check.regex);
  if (!match) {
    failures.push(`${check.file}: unable to parse ${check.label}`);
    continue;
  }
  const docCount = Number.parseInt(match[1], 10);
  if (docCount !== pdfCount) {
    failures.push(
      `${check.file}: ${check.label}=${docCount}, source-material pdf count=${pdfCount}`
    );
  }
}

if (failures.length > 0) {
  console.error('Source corpus drift check failed.');
  for (const f of failures) {
    console.error(`- ${f}`);
  }
  process.exit(1);
}

console.log(
  `Source corpus drift check OK (source-material pdf count=${pdfCount}; ledger/dashboard/master-audit aligned)`
);
