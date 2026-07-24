#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function usage() {
  console.error(
    'Usage: node spec-processing/scripts/check-wap-ingestion-status.mjs ' +
      '[--pdf-dir <directory> --text-dir <directory>]'
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
  if (Boolean(parsed['pdf-dir']) !== Boolean(parsed['text-dir'])) {
    throw new Error('--pdf-dir and --text-dir must be supplied together');
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

function sameCounts(left, right) {
  return JSON.stringify(stableObject(left)) === JSON.stringify(stableObject(right));
}

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const releaseManifestPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-release.json'
);
const ingestionManifestPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-ingestion-status.json'
);
const failures = [];

for (const requiredPath of [releaseManifestPath, ingestionManifestPath]) {
  if (!fs.existsSync(requiredPath)) {
    failures.push(`missing ${path.relative(root, requiredPath)}`);
  }
}
if (failures.length > 0) {
  console.error('WAP ingestion status check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const releaseManifest = JSON.parse(fs.readFileSync(releaseManifestPath, 'utf8'));
const ingestion = JSON.parse(fs.readFileSync(ingestionManifestPath, 'utf8'));
const releaseByFilename = new Map(
  (releaseManifest.members ?? []).map((member) => [member.filename, member])
);
const seenFilenames = new Set();
const sourceClassCounts = {};
const promotionStateCounts = {};
let pdfBytesTotal = 0;
let textBytesTotal = 0;
let pageCountTotal = 0;
let textLineCountTotal = 0;

if (ingestion.schemaVersion !== 1) {
  failures.push(`schemaVersion=${ingestion.schemaVersion}; expected 1`);
}
if (ingestion.releaseId !== 'wap-1.2.1') {
  failures.push(`releaseId=${ingestion.releaseId}; expected wap-1.2.1`);
}
if (
  ingestion.status !== 'research-ingestion-complete-promotion-pending' ||
  ingestion.policy?.repositoryMode !== 'metadata-only'
) {
  failures.push('ingestion status/policy must preserve metadata-only promotion');
}
if (ingestion.processing?.researchCacheCommitted !== false) {
  failures.push('processing.researchCacheCommitted must be false');
}
if (
  ingestion.summary?.memberCount !== 97 ||
  (ingestion.members ?? []).length !== 97
) {
  failures.push(
    `ingestion membership=${ingestion.summary?.memberCount}/` +
      `${ingestion.members?.length}; expected 97/97`
  );
}

const serialized = JSON.stringify(ingestion);
for (const forbiddenPath of ['/private/', '/tmp/', '/Users/']) {
  if (serialized.includes(forbiddenPath)) {
    failures.push(`ingestion manifest leaks a machine-local path: ${forbiddenPath}`);
  }
}

for (const member of ingestion.members ?? []) {
  if (seenFilenames.has(member.filename)) {
    failures.push(`duplicate filename: ${member.filename}`);
  }
  seenFilenames.add(member.filename);

  const releaseMember = releaseByFilename.get(member.filename);
  if (!releaseMember) {
    failures.push(`${member.filename}: not present in release manifest`);
    continue;
  }
  if (
    member.documentId !== releaseMember.documentId ||
    member.family !== releaseMember.family ||
    member.sourceClass !== releaseMember.sourceClass ||
    member.releaseMember?.bytes !== releaseMember.bytes ||
    member.releaseMember?.sha256 !== releaseMember.sha256
  ) {
    failures.push(`${member.filename}: release metadata drift`);
  }
  if (
    member.recoveredPdf?.state !== 'verified-temporary' ||
    member.recoveredPdf?.bytes !== releaseMember.bytes ||
    member.recoveredPdf?.sha256 !== releaseMember.sha256 ||
    !Number.isInteger(member.recoveredPdf?.pageCount) ||
    member.recoveredPdf.pageCount <= 0
  ) {
    failures.push(`${member.filename}: invalid recovered-PDF evidence`);
  }
  if (
    !member.recoveredPdf?.cacheRef?.startsWith(
      'private-research-cache/wap-1.2.1/pdf/'
    )
  ) {
    failures.push(`${member.filename}: invalid logical PDF cache reference`);
  }

  const expectedTextFilename = member.filename.replace(/\.pdf$/i, '.txt');
  if (
    member.parsedText?.state !== 'extracted-temporary' ||
    member.parsedText?.filename !== expectedTextFilename ||
    !Number.isInteger(member.parsedText?.bytes) ||
    member.parsedText.bytes <= 0 ||
    !/^[a-f0-9]{64}$/.test(member.parsedText?.sha256 ?? '') ||
    !Number.isInteger(member.parsedText?.lineCount) ||
    member.parsedText.lineCount <= 1
  ) {
    failures.push(`${member.filename}: invalid parsed-text evidence`);
  }
  if (
    !member.parsedText?.cacheRef?.startsWith(
      'private-research-cache/wap-1.2.1/text/'
    )
  ) {
    failures.push(`${member.filename}: invalid logical text cache reference`);
  }

  const expectedPromotionState =
    releaseMember.local?.state === 'canonical-exact'
      ? 'already-canonical-exact'
      : 'blocked-redistribution-review';
  if (
    member.repositoryPromotion?.state !== expectedPromotionState ||
    member.repositoryPromotion?.canonicalSourceState !==
      releaseMember.local?.state ||
    member.repositoryPromotion?.recoveredBinaryCommitted !== false ||
    member.repositoryPromotion?.parsedDerivativeCommitted !== false
  ) {
    failures.push(`${member.filename}: invalid repository-promotion state`);
  }

  if (args['pdf-dir']) {
    const pdfPath = path.join(path.resolve(args['pdf-dir']), member.filename);
    const textPath = path.join(
      path.resolve(args['text-dir']),
      member.parsedText.filename
    );
    if (!fs.existsSync(pdfPath) || !fs.existsSync(textPath)) {
      failures.push(`${member.filename}: research-cache file missing`);
    } else {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const textBuffer = fs.readFileSync(textPath);
      if (
        pdfBuffer.length !== member.recoveredPdf.bytes ||
        sha256(pdfBuffer) !== member.recoveredPdf.sha256
      ) {
        failures.push(`${member.filename}: research PDF hash/size drift`);
      }
      if (
        textBuffer.length !== member.parsedText.bytes ||
        sha256(textBuffer) !== member.parsedText.sha256
      ) {
        failures.push(`${member.filename}: research text hash/size drift`);
      }
    }
  }

  pdfBytesTotal += member.recoveredPdf?.bytes ?? 0;
  textBytesTotal += member.parsedText?.bytes ?? 0;
  pageCountTotal += member.recoveredPdf?.pageCount ?? 0;
  textLineCountTotal += member.parsedText?.lineCount ?? 0;
  increment(sourceClassCounts, member.sourceClass);
  increment(promotionStateCounts, member.repositoryPromotion?.state);
}

if (seenFilenames.size !== releaseByFilename.size) {
  failures.push(
    `filename coverage=${seenFilenames.size}/${releaseByFilename.size}; expected full release`
  );
}
if (!sameCounts(ingestion.summary?.bySourceClass ?? {}, sourceClassCounts)) {
  failures.push('summary.bySourceClass does not match members');
}
if (
  !sameCounts(
    ingestion.summary?.byPromotionState ?? {},
    promotionStateCounts
  )
) {
  failures.push('summary.byPromotionState does not match members');
}
for (const [field, actual] of [
  ['pdfBytesTotal', pdfBytesTotal],
  ['textBytesTotal', textBytesTotal],
  ['pageCountTotal', pageCountTotal],
  ['textLineCountTotal', textLineCountTotal]
]) {
  if (ingestion.summary?.[field] !== actual) {
    failures.push(`summary.${field}=${ingestion.summary?.[field]}; expected ${actual}`);
  }
}
for (const field of [
  'verifiedPdfCount',
  'extractedTextCount',
  'nonEmptyTextCount'
]) {
  if (ingestion.summary?.[field] !== 97) {
    failures.push(`summary.${field}=${ingestion.summary?.[field]}; expected 97`);
  }
}

if (failures.length > 0) {
  console.error('WAP ingestion status check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 research ingestion status');
console.log('PASS 97/97 release PDFs are hash-verified in the ingestion ledger');
console.log('PASS 97/97 parsed-text outputs have non-empty hash/size evidence');
console.log(
  `PASS promotion state (${promotionStateCounts['already-canonical-exact'] ?? 0} ` +
    `already canonical; ` +
    `${promotionStateCounts['blocked-redistribution-review'] ?? 0} pending review)`
);
if (args['pdf-dir']) {
  console.log('PASS optional research-cache hashes match the committed ledger');
}
