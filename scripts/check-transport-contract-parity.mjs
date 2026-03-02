#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const tsPath = path.join(root, 'browser/contracts/transport.ts');
const rustPath = path.join(root, 'transport-rust/src/lib.rs');

const ts = fs.readFileSync(tsPath, 'utf8');
const rust = fs.readFileSync(rustPath, 'utf8');

const unionMatch = ts.match(/export interface TransportErrorInfo[\s\S]*?code:\s*([\s\S]*?);/);
if (!unionMatch) {
  console.error('TransportErrorInfo.code union not found in browser/contracts/transport.ts');
  process.exit(1);
}

const tsCodes = new Set(
  [...unionMatch[1].matchAll(/'([A-Z_]+)'/g)].map((m) => m[1])
);
if (tsCodes.size === 0) {
  console.error('No error codes parsed from TransportErrorInfo.code union');
  process.exit(1);
}

// Runtime-emitted error taxonomy from transport-rust mapping paths.
const rustCodes = new Set(
  [...rust.matchAll(/"([A-Z_]+)"\.to_string\(\)/g)]
    .map((m) => m[1])
    .filter((code) => code.includes('_'))
);
if (rustCodes.size === 0) {
  console.error('No transport error codes parsed from transport-rust/src/lib.rs');
  process.exit(1);
}

const tsOnly = [...tsCodes].filter((code) => !rustCodes.has(code));
const rustOnly = [...rustCodes].filter((code) => !tsCodes.has(code));

if (tsOnly.length || rustOnly.length) {
  console.error('Transport contract parity check failed.');
  if (tsOnly.length) {
    console.error(`Only in TS contract: ${tsOnly.sort().join(', ')}`);
  }
  if (rustOnly.length) {
    console.error(`Only in Rust runtime: ${rustOnly.sort().join(', ')}`);
  }
  process.exit(1);
}

if (!/requestId\?: string;/.test(ts)) {
  console.error('FetchRequest.requestId is missing from browser/contracts/transport.ts');
  process.exit(1);
}

console.log(
  `Transport contract parity OK (${[...tsCodes].sort().join(', ')})`
);
