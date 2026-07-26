#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  PATHS,
  assertNoSnapshotIdCollision,
  buildSnapshot,
  renderManifest,
  serializeSnapshot,
  validateSnapshot
} from './docling-provenance-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = new Set(process.argv.slice(2));
const allowed = new Set(['--check', '--write']);
for (const argument of args) {
  if (!allowed.has(argument)) {
    console.error(`FAIL: unsupported argument: ${argument}`);
    process.exit(2);
  }
}
if (args.has('--check') && args.has('--write')) {
  console.error('FAIL: choose either --check or --write');
  process.exit(2);
}
const checkOnly = args.has('--check');

try {
  const expected = buildSnapshot(root);
  const expectedText = serializeSnapshot(expected);
  const expectedManifest = renderManifest(expected);
  const snapshotPath = path.join(root, PATHS.snapshot);
  const manifestPath = path.join(root, PATHS.manifest);

  if (checkOnly) {
    if (!fs.existsSync(snapshotPath))
      throw new Error(`missing current snapshot: ${PATHS.snapshot}`);
    if (!fs.existsSync(manifestPath))
      throw new Error(`missing generated manifest: ${PATHS.manifest}`);
    const actualText = fs.readFileSync(snapshotPath, 'utf8');
    const actual = JSON.parse(actualText);
    const errors = validateSnapshot(actual, expected);
    if (actualText !== expectedText) errors.push(`generated snapshot is stale: ${PATHS.snapshot}`);
    if (fs.readFileSync(manifestPath, 'utf8') !== expectedManifest) {
      errors.push(`generated manifest is stale: ${PATHS.manifest}`);
    }
    if (errors.length > 0) throw new Error([...new Set(errors)].join('\n'));
    console.log(`PASS: ${expected.snapshot.recordCount} complete, unique provenance records`);
    console.log(`PASS: current snapshot ${expected.snapshot.id} is deterministic and fresh`);
    process.exit(0);
  }

  let snapshotIsExact = false;
  if (fs.existsSync(snapshotPath)) {
    const actualText = fs.readFileSync(snapshotPath, 'utf8');
    assertNoSnapshotIdCollision(actualText, expected);
    snapshotIsExact = actualText === expectedText;
  }
  const manifestIsExact =
    fs.existsSync(manifestPath) && fs.readFileSync(manifestPath, 'utf8') === expectedManifest;
  if (snapshotIsExact && manifestIsExact) {
    console.log(`PASS: snapshot ${expected.snapshot.id} is already exact; no files changed`);
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, expectedText);
  fs.writeFileSync(manifestPath, expectedManifest);
  console.log(`PASS: wrote ${PATHS.snapshot} (${expected.snapshot.recordCount} records)`);
  console.log(`PASS: wrote ${PATHS.manifest}`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
