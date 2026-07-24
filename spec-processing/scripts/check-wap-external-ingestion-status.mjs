#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function usage() {
  console.error(
    'Usage: node spec-processing/scripts/check-wap-external-ingestion-status.mjs ' +
      '[--cache-dir <directory>]'
  );
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i];
    if (!argument.startsWith('--') || i + 1 >= argv.length) {
      usage();
      process.exit(2);
    }
    parsed[argument.slice(2)] = argv[i + 1];
    i += 1;
  }
  return parsed;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function increment(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function stableObject(value) {
  return Object.fromEntries(Object.entries(value).sort());
}

const expectedStateCounts = {
  'metadata-only-licensed-payload': 5,
  'verified-private-full-artifact': 36,
  'verified-private-partial-artifact': 2
};
const allowedStates = new Set(Object.keys(expectedStateCounts));
const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const dependencyManifestPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json'
);
const ingestionManifestPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json'
);
const failures = [];

for (const requiredPath of [dependencyManifestPath, ingestionManifestPath]) {
  if (!fs.existsSync(requiredPath)) {
    failures.push(`missing ${path.relative(root, requiredPath)}`);
  }
}
if (failures.length > 0) {
  console.error('WAP external ingestion status check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const dependencyManifest = JSON.parse(
  fs.readFileSync(dependencyManifestPath, 'utf8')
);
const ingestion = JSON.parse(fs.readFileSync(ingestionManifestPath, 'utf8'));
const sourceById = new Map(
  (dependencyManifest.dependencies ?? []).map((dependency) => [
    dependency.id,
    dependency
  ])
);
const seenIds = new Set();
const seenArtifactIds = new Set();
const stateCounts = {};
let artifactCount = 0;
let artifactBytesTotal = 0;

if (
  ingestion.schemaVersion !== 1 ||
  ingestion.releaseId !== 'wap-1.2.1'
) {
  failures.push('manifest schema/release identity must remain wap-1.2.1 schema 1');
}
if (
  ingestion.status !== 'external-source-acquisition-in-progress' ||
  ingestion.policy?.repositoryMode !== 'metadata-only' ||
  ingestion.policy?.researchCacheCommitted !== false
) {
  failures.push('status/policy must preserve in-progress metadata-only acquisition');
}
if (
  ingestion.summary?.dependencyCount !== sourceById.size ||
  (ingestion.dependencies ?? []).length !== sourceById.size
) {
  failures.push(
    `dependency coverage=${ingestion.summary?.dependencyCount}/` +
      `${ingestion.dependencies?.length}/${sourceById.size}`
  );
}

const serialized = JSON.stringify(ingestion);
for (const forbiddenPath of ['/private/', '/tmp/', '/Users/']) {
  if (serialized.includes(forbiddenPath)) {
    failures.push(`external ingestion manifest leaks local path: ${forbiddenPath}`);
  }
}

for (const record of ingestion.dependencies ?? []) {
  if (seenIds.has(record.dependencyId)) {
    failures.push(`duplicate dependencyId: ${record.dependencyId}`);
  }
  seenIds.add(record.dependencyId);
  const source = sourceById.get(record.dependencyId);
  if (!source) {
    failures.push(`unknown dependencyId: ${record.dependencyId}`);
    continue;
  }
  if (
    record.title !== source.title ||
    record.version !== source.version ||
    record.authority !== source.authority ||
    record.authorityRecordUrl !== source.sourceUrl
  ) {
    failures.push(`${record.dependencyId}: dependency metadata drift`);
  }
  if (!allowedStates.has(record.acquisitionState)) {
    failures.push(
      `${record.dependencyId}: unexpected state=${record.acquisitionState}`
    );
  }
  if (
    record.acquisitionState === 'metadata-only-licensed-payload' &&
    record.artifacts?.length !== 0
  ) {
    failures.push(`${record.dependencyId}: metadata-only source has artifacts`);
  }
  if (
    record.acquisitionState !== 'metadata-only-licensed-payload' &&
    !record.artifacts?.length
  ) {
    failures.push(`${record.dependencyId}: acquired source has no artifacts`);
  }
  increment(stateCounts, record.acquisitionState);

  for (const artifact of record.artifacts ?? []) {
    if (seenArtifactIds.has(artifact.id)) {
      failures.push(`duplicate artifact ID: ${artifact.id}`);
    }
    seenArtifactIds.add(artifact.id);
    if (
      artifact.state !== 'verified-temporary' ||
      !artifact.sourceUrl?.startsWith('https://') ||
      !artifact.cacheRef?.startsWith(
        'private-research-cache/wap-1.2.1/external/'
      ) ||
      !Number.isInteger(artifact.bytes) ||
      artifact.bytes <= 0 ||
      !/^[a-f0-9]{64}$/.test(artifact.sha256 ?? '') ||
      artifact.checksumAlgorithm !== 'sha256'
    ) {
      failures.push(`${record.dependencyId}/${artifact.id}: invalid artifact evidence`);
    }

    if (args['cache-dir']) {
      const relativePath = artifact.cacheRef.replace(
        'private-research-cache/wap-1.2.1/external/',
        ''
      );
      const artifactPath = path.join(path.resolve(args['cache-dir']), relativePath);
      if (!fs.existsSync(artifactPath)) {
        failures.push(`${record.dependencyId}/${artifact.id}: cache file missing`);
      } else {
        const buffer = fs.readFileSync(artifactPath);
        if (
          buffer.length !== artifact.bytes ||
          sha256(buffer) !== artifact.sha256
        ) {
          failures.push(`${record.dependencyId}/${artifact.id}: cache hash drift`);
        }
      }
    }

    artifactCount += 1;
    artifactBytesTotal += artifact.bytes ?? 0;
  }
}

if (seenIds.size !== sourceById.size) {
  failures.push(`dependency ID coverage=${seenIds.size}/${sourceById.size}`);
}
if (
  JSON.stringify(stableObject(stateCounts)) !==
  JSON.stringify(stableObject(expectedStateCounts))
) {
  failures.push(
    `acquisition state counts=${JSON.stringify(stableObject(stateCounts))}; ` +
      `expected ${JSON.stringify(stableObject(expectedStateCounts))}`
  );
}
if (
  ingestion.summary?.artifactCount !== artifactCount ||
  ingestion.summary?.artifactBytesTotal !== artifactBytesTotal
) {
  failures.push('artifact count/byte summary does not match records');
}
if (
  JSON.stringify(stableObject(ingestion.summary?.byAcquisitionState ?? {})) !==
  JSON.stringify(stableObject(stateCounts))
) {
  failures.push('summary.byAcquisitionState does not match records');
}
if (artifactCount !== 48) {
  failures.push(`artifactCount=${artifactCount}; expected 48`);
}

if (failures.length > 0) {
  console.error('WAP external ingestion status check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 external ingestion status');
console.log('PASS 43/43 authority-locked dependencies have acquisition records');
console.log('PASS 48 cached artifacts have non-empty hash/size evidence');
console.log('PASS 36 full; 2 partial; 5 licensed-payload metadata-only');
if (args['cache-dir']) {
  console.log('PASS optional research-cache hashes match the committed ledger');
}
