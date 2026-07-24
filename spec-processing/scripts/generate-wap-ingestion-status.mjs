#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync, spawnSync } from 'node:child_process';

function usage() {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-ingestion-status.mjs ' +
      '--pdf-dir <directory> --text-dir <directory> ' +
      '--processed-on <YYYY-MM-DD> --recorded-on <YYYY-MM-DD> [--output <json>]'
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

function readPageCount(pdfPath) {
  const output = execFileSync('pdfinfo', [pdfPath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const pageMatch = output.match(/^Pages:\s+(\d+)\s*$/m);
  if (!pageMatch) {
    throw new Error(`Unable to read page count: ${pdfPath}`);
  }
  return Number.parseInt(pageMatch[1], 10);
}

function pdftotextVersion() {
  const result = spawnSync('pdftotext', ['-v'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) {
    throw new Error(`pdftotext -v failed: ${result.stderr || result.stdout}`);
  }
  const versionMatch = `${result.stdout}\n${result.stderr}`.match(
    /pdftotext version ([^\s]+)/
  );
  if (!versionMatch) {
    throw new Error('Unable to determine pdftotext version');
  }
  return versionMatch[1];
}

const args = parseArgs(process.argv.slice(2));
if (
  !args['pdf-dir'] ||
  !args['text-dir'] ||
  !args['processed-on'] ||
  !args['recorded-on']
) {
  usage();
  process.exit(2);
}
for (const dateArgument of ['processed-on', 'recorded-on']) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args[dateArgument])) {
    throw new Error(`--${dateArgument} must use YYYY-MM-DD`);
  }
}

const root = process.cwd();
const releaseManifestPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-release.json'
);
const pdfDir = path.resolve(args['pdf-dir']);
const textDir = path.resolve(args['text-dir']);
const outputPath = path.resolve(
  args.output ?? 'spec-processing/source-manifests/wap-1.2.1-ingestion-status.json'
);

for (const [label, requiredPath] of [
  ['release manifest', releaseManifestPath],
  ['PDF directory', pdfDir],
  ['text directory', textDir]
]) {
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`${label} not found: ${requiredPath}`);
  }
}

const releaseManifest = JSON.parse(fs.readFileSync(releaseManifestPath, 'utf8'));
const members = [];
const stateCounts = {};
const sourceClassCounts = {};
let pdfBytesTotal = 0;
let textBytesTotal = 0;
let pageCountTotal = 0;
let textLineCountTotal = 0;

for (const releaseMember of releaseManifest.members ?? []) {
  const pdfPath = path.join(pdfDir, releaseMember.filename);
  const textFilename = releaseMember.filename.replace(/\.pdf$/i, '.txt');
  const textPath = path.join(textDir, textFilename);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Recovered PDF missing: ${releaseMember.filename}`);
  }
  if (!fs.existsSync(textPath)) {
    throw new Error(`Parsed text missing: ${textFilename}`);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const textBuffer = fs.readFileSync(textPath);
  const recoveredPdfSha256 = sha256(pdfBuffer);
  if (
    pdfBuffer.length !== releaseMember.bytes ||
    recoveredPdfSha256 !== releaseMember.sha256
  ) {
    throw new Error(
      `${releaseMember.filename}: recovered PDF does not match the release lock`
    );
  }
  if (textBuffer.length === 0) {
    throw new Error(`${textFilename}: parsed text is empty`);
  }

  const pageCount = readPageCount(pdfPath);
  const lineCount = textBuffer.toString('utf8').split(/\r?\n/).length;
  const promotionState =
    releaseMember.local?.state === 'canonical-exact'
      ? 'already-canonical-exact'
      : 'blocked-redistribution-review';

  pdfBytesTotal += pdfBuffer.length;
  textBytesTotal += textBuffer.length;
  pageCountTotal += pageCount;
  textLineCountTotal += lineCount;
  increment(stateCounts, promotionState);
  increment(sourceClassCounts, releaseMember.sourceClass);

  members.push({
    documentId: releaseMember.documentId,
    filename: releaseMember.filename,
    family: releaseMember.family,
    sourceClass: releaseMember.sourceClass,
    ingestionPriority: releaseMember.ingestionPriority,
    releaseMember: {
      bytes: releaseMember.bytes,
      sha256: releaseMember.sha256
    },
    recoveredPdf: {
      state: 'verified-temporary',
      cacheRef: `private-research-cache/wap-1.2.1/pdf/${releaseMember.filename}`,
      bytes: pdfBuffer.length,
      sha256: recoveredPdfSha256,
      pageCount
    },
    parsedText: {
      state: 'extracted-temporary',
      cacheRef: `private-research-cache/wap-1.2.1/text/${textFilename}`,
      filename: textFilename,
      bytes: textBuffer.length,
      sha256: sha256(textBuffer),
      lineCount
    },
    repositoryPromotion: {
      state: promotionState,
      canonicalSourceState: releaseMember.local?.state,
      redistributionStatus: releaseMember.redistributionStatus,
      sourceBinaryCommitted: releaseMember.local?.state === 'canonical-exact',
      recoveredBinaryCommitted: false,
      parsedDerivativeCommitted: false
    }
  });
}

const manifest = {
  schemaVersion: 1,
  releaseId: 'wap-1.2.1',
  sourceManifest:
    'spec-processing/source-manifests/wap-1.2.1-release.json',
  processedOn: args['processed-on'],
  recordedOn: args['recorded-on'],
  status: 'research-ingestion-complete-promotion-pending',
  processing: {
    pdfVerification: 'sha256-and-byte-size-against-release-manifest',
    pageInspectionTool: 'pdfinfo',
    textExtractionTool: 'pdftotext',
    textExtractionToolVersion: pdftotextVersion(),
    extractionCommandShape: 'pdftotext <release-member.pdf> <release-member.txt>',
    researchCacheCommitted: false,
    researchCacheLocationRecorded: false
  },
  policy: {
    repositoryMode: 'metadata-only',
    recoveredBinaryPromotion: 'requires-explicit-redistribution-approval',
    parsedDerivativePromotion: 'requires-explicit-redistribution-approval',
    cacheRefsAreLogicalIdentifiers: true,
    note:
      'This ledger proves private research ingestion. It does not authorize or claim ' +
      'public redistribution of recovered PDFs or parsed text.'
  },
  summary: {
    memberCount: members.length,
    verifiedPdfCount: members.length,
    extractedTextCount: members.length,
    nonEmptyTextCount: members.length,
    pdfBytesTotal,
    textBytesTotal,
    pageCountTotal,
    textLineCountTotal,
    bySourceClass: Object.fromEntries(Object.entries(sourceClassCounts).sort()),
    byPromotionState: Object.fromEntries(Object.entries(stateCounts).sort())
  },
  members
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log('==> WAP 1.2.1 research ingestion');
console.log(`PASS verified ${members.length} release PDFs`);
console.log(
  `PASS recorded ${members.length} non-empty text extractions across ` +
    `${pageCountTotal} PDF pages`
);
console.log(`PASS wrote ${path.relative(root, outputPath)}`);
