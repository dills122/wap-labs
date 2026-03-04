#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const canonicalPath = path.join(root, 'engine-wasm/contracts/wml-engine.ts');
const browserContractPath = path.join(root, 'browser/contracts/engine.ts');
const generatedPath = path.join(root, 'browser/contracts/generated/engine-host.ts');

const canonical = fs.readFileSync(canonicalPath, 'utf8');
const browserContract = fs.readFileSync(browserContractPath, 'utf8');
const generated = fs.readFileSync(generatedPath, 'utf8');

function parseLiteralUnion(source, typeName) {
  const unionMatch = source.match(
    new RegExp(`export type ${typeName} =([^;]+);`, 'm')
  );
  if (!unionMatch) {
    return null;
  }

  return new Set(
    [...unionMatch[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1])
  );
}

function parseObjectTypeFields(source, typeName) {
  const match = source.match(
    new RegExp(`export (?:interface|type) ${typeName}\\s*=\\s*\\{([\\s\\S]*?)\\};`, 'm')
  );
  if (!match) {
    return null;
  }

  const fields = new Set(
    [...match[1].matchAll(/([a-zA-Z0-9_]+)\??\s*:/g)].map((m) => m[1])
  );
  return fields;
}

function parseInterfaceFields(source, interfaceName) {
  const match = source.match(
    new RegExp(`export interface ${interfaceName}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
  );
  if (!match) {
    return null;
  }

  const fields = new Set(
    [...match[1].matchAll(/^\s*([a-zA-Z0-9_]+)\??\s*:/gm)].map((m) => m[1])
  );
  return fields;
}

function diffSets(left, right) {
  return [...left].filter((value) => !right.has(value));
}

const canonicalEngineKeys = parseLiteralUnion(canonical, 'EngineKey');
const generatedEngineKeys = parseLiteralUnion(generated, 'EngineKey');
if (!canonicalEngineKeys || !generatedEngineKeys) {
  console.error('Unable to parse EngineKey union from canonical or generated contract.');
  process.exit(1);
}

const canonicalDeckFields = parseInterfaceFields(canonical, 'WmlDeckInput');
const generatedDeckFields = parseObjectTypeFields(generated, 'LoadDeckContextRequest');
if (!canonicalDeckFields || !generatedDeckFields) {
  console.error('Unable to parse WmlDeckInput/LoadDeckContextRequest shape.');
  process.exit(1);
}

const keyOnlyCanonical = diffSets(canonicalEngineKeys, generatedEngineKeys);
const keyOnlyGenerated = diffSets(generatedEngineKeys, canonicalEngineKeys);

const deckOnlyCanonical = diffSets(canonicalDeckFields, generatedDeckFields);
const deckOnlyGenerated = diffSets(generatedDeckFields, canonicalDeckFields);

if (keyOnlyCanonical.length || keyOnlyGenerated.length) {
  console.error('Engine contract parity check failed for EngineKey.');
  if (keyOnlyCanonical.length) {
    console.error(`Only in engine-wasm/contracts/wml-engine.ts: ${keyOnlyCanonical.sort().join(', ')}`);
  }
  if (keyOnlyGenerated.length) {
    console.error(`Only in browser/contracts/generated/engine-host.ts: ${keyOnlyGenerated.sort().join(', ')}`);
  }
  process.exit(1);
}

if (deckOnlyCanonical.length || deckOnlyGenerated.length) {
  console.error('Engine contract parity check failed for loadDeckContext fields.');
  if (deckOnlyCanonical.length) {
    console.error(`Only in WmlDeckInput: ${deckOnlyCanonical.sort().join(', ')}`);
  }
  if (deckOnlyGenerated.length) {
    console.error(`Only in LoadDeckContextRequest: ${deckOnlyGenerated.sort().join(', ')}`);
  }
  process.exit(1);
}

if (!/export type WmlDeckInput = LoadDeckContextRequest;/.test(browserContract)) {
  console.error('browser/contracts/engine.ts must alias WmlDeckInput to LoadDeckContextRequest');
  process.exit(1);
}

const requiredClientMethods = [
  'loadDeckContext',
  'render',
  'handleKey',
  'navigateBack'
];
const missingMethods = requiredClientMethods.filter(
  (method) => !new RegExp(`\\b${method}\\(`).test(generated)
);

if (missingMethods.length) {
  console.error(
    `browser/contracts/generated/engine-host.ts is missing EngineHostClient methods: ${missingMethods.join(', ')}`
  );
  process.exit(1);
}

console.log(
  `Engine contract parity OK (keys=${[...canonicalEngineKeys].sort().join(', ')}; loadDeckContext fields=${[...canonicalDeckFields].sort().join(', ')})`
);
