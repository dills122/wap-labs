#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { checkCleanedQuality } from './docling-provenance-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = new Set(process.argv.slice(2));
for (const argument of args) {
  if (argument !== '--strict') {
    console.error(`FAIL: unsupported argument: ${argument}`);
    process.exit(2);
  }
}

try {
  const result = checkCleanedQuality(root);
  console.log(`Docling cleaned files: ${result.fileCount}`);
  console.log(`Quality findings: ${result.findings.length}`);
  console.log(`Reviewed dispositions: ${result.dispositions.length}`);
  if (result.errors.length === 0) {
    console.log('PASS: every quality finding has an exact hash- and count-bound disposition');
  } else {
    for (const error of result.errors) console.error(`WARN: ${error}`);
    if (args.has('--strict')) process.exit(2);
  }
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
