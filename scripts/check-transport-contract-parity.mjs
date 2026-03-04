#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const tsPath = path.join(root, 'browser/contracts/transport.ts');
const generatedTsPath = path.join(root, 'browser/contracts/generated/transport-host.ts');
const transportSrcDir = path.join(root, 'transport-rust/src');

const ts = fs.readFileSync(tsPath, 'utf8');
const generatedTs = fs.readFileSync(generatedTsPath, 'utf8');

function collectRustSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRustSourceFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.rs')) {
      files.push(fullPath);
    }
  }
  return files;
}

const rustSources = collectRustSourceFiles(transportSrcDir)
  .map((filePath) => fs.readFileSync(filePath, 'utf8'))
  .join('\n');

const unionMatch = generatedTs.match(/export type FetchErrorInfo = \{[\s\S]*?code:\s*([^,\n]+)\s*,/);
if (!unionMatch) {
  console.error('FetchErrorInfo.code union not found in browser/contracts/generated/transport-host.ts');
  process.exit(1);
}

const tsCodes = new Set(
  [...unionMatch[1].matchAll(/["']([A-Z_]+)["']/g)].map((m) => m[1])
);
if (tsCodes.size === 0) {
  console.error('No error codes parsed from TransportErrorInfo.code union');
  process.exit(1);
}

// Runtime-emitted error taxonomy from transport-rust mapping paths.
// We scan uppercase string literals and keep only values present in TS codes.
const rustLiteralCandidates = new Set(
  [...rustSources.matchAll(/"([A-Z_]{3,})"/g)]
    .map((m) => m[1])
    .filter((code) => code.includes('_'))
);
const rustCodes = new Set([...rustLiteralCandidates].filter((code) => tsCodes.has(code)));
if (rustCodes.size === 0) {
  console.error('No transport error codes parsed from transport-rust/src/*.rs');
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

if (!/requestId\?: string/.test(generatedTs)) {
  console.error('FetchDeckRequest.requestId is missing from browser/contracts/generated/transport-host.ts');
  process.exit(1);
}

if (!/export type FetchRequest = FetchDeckRequest;/.test(ts)) {
  console.error('browser/contracts/transport.ts must alias FetchRequest to generated FetchDeckRequest');
  process.exit(1);
}

console.log(
  `Transport contract parity OK (${[...tsCodes].sort().join(', ')})`
);
