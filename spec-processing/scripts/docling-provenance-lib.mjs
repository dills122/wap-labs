import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const PATHS = Object.freeze({
  policy: 'spec-processing/docling-provenance-policy.json',
  requirements: 'spec-processing/requirements-docling.txt',
  profile: 'spec-processing/scripts/docling-profile.fish',
  sourceRoot: 'spec-processing/source-material',
  cleanedRoot: 'spec-processing/source-material/parsed-markdown/docling-cleaned',
  snapshot: 'docs/waves/provenance/docling-provenance-current.json',
  manifest: 'docs/waves/SOURCE_CLEAN_PROVENANCE_MANIFEST.md'
});

const SNAPSHOT_SCHEMA_VERSION = 2;
const GENERATOR_PATH = 'spec-processing/scripts/generate-docling-provenance.mjs';
const REQUIRED_RECORD_KEYS = [
  'sourcePdfPath',
  'sourcePdfSha256',
  'sourcePdfBytes',
  'cleanedMarkdownPath',
  'cleanedMarkdownSha256',
  'cleanedMarkdownBytes',
  'cleanedMarkdownLines'
];

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function relativePosix(...parts) {
  return path.posix.join(...parts.map((part) => part.split(path.sep).join(path.posix.sep)));
}

function parseDoclingVersion(requirementsText) {
  const matches = requirementsText.match(/^docling==([^\s#]+)$/gm) ?? [];
  if (matches.length !== 1) {
    throw new Error(
      `${PATHS.requirements} must contain exactly one exact docling==<version> requirement`
    );
  }
  return matches[0].slice('docling=='.length);
}

function parseProfileFlags(profileText) {
  const activeText = profileText
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join(' ');
  const marker = 'DOCLING_PROFILE_FLAGS';
  const markerIndex = activeText.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`${PATHS.profile} does not define ${marker}`);
  }
  const flags = activeText
    .slice(markerIndex + marker.length)
    .replaceAll('\\', ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!flags[0]?.startsWith('--')) {
    throw new Error(`${PATHS.profile} has an invalid Docling profile`);
  }
  return flags;
}

function listFiles(directory, predicate) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function indexSourcePdfs(root) {
  const sourceDirectory = path.join(root, PATHS.sourceRoot);
  const pdfNames = listFiles(sourceDirectory, (name) => /\.pdf$/i.test(name));
  const byStem = new Map();
  for (const name of pdfNames) {
    const stem = name.replace(/\.pdf$/i, '').toLowerCase();
    if (byStem.has(stem)) {
      throw new Error(`duplicate authoritative source PDF stem: ${byStem.get(stem)} and ${name}`);
    }
    byStem.set(stem, name);
  }
  return byStem;
}

function lineCount(buffer) {
  if (buffer.length === 0) return 0;
  let lines = 0;
  for (const byte of buffer) {
    if (byte === 10) lines += 1;
  }
  return lines + (buffer.at(-1) === 10 ? 0 : 1);
}

export function loadPolicy(root) {
  const policy = readJson(root, PATHS.policy);
  if (
    policy.schemaVersion !== 1 ||
    !/^[a-z0-9][a-z0-9-]+$/.test(policy.snapshotId ?? '') ||
    !/^\d{4}-\d{2}-\d{2}$/.test(policy.recordedOn ?? '') ||
    typeof policy.profileId !== 'string' ||
    policy.profileId.length === 0 ||
    !Array.isArray(policy.qualityDispositions)
  ) {
    throw new Error(`${PATHS.policy} is missing required snapshot policy metadata`);
  }
  return policy;
}

export function buildSnapshot(root) {
  const policyBuffer = fs.readFileSync(path.join(root, PATHS.policy));
  const policy = loadPolicy(root);
  const requirements = fs.readFileSync(path.join(root, PATHS.requirements));
  const profile = fs.readFileSync(path.join(root, PATHS.profile));
  const cleanedDirectory = path.join(root, PATHS.cleanedRoot);
  const cleanedNames = listFiles(cleanedDirectory, (name) => name.endsWith('.cleaned.md'));
  if (cleanedNames.length === 0) {
    throw new Error(`no canonical cleaned Markdown files found under ${PATHS.cleanedRoot}`);
  }

  const sourcePdfs = indexSourcePdfs(root);
  const usedPdfPaths = new Set();
  const usedCleanedStems = new Set();
  const records = cleanedNames.map((cleanedName) => {
    const cleanedStem = cleanedName.slice(0, -'.cleaned.md'.length).toLowerCase();
    if (usedCleanedStems.has(cleanedStem)) {
      throw new Error(`duplicate canonical cleaned source stem: ${cleanedName}`);
    }
    usedCleanedStems.add(cleanedStem);

    const sourceName = sourcePdfs.get(cleanedStem);
    if (!sourceName) {
      throw new Error(`missing authoritative source PDF for ${cleanedName}`);
    }
    const sourcePdfPath = relativePosix(PATHS.sourceRoot, sourceName);
    if (usedPdfPaths.has(sourcePdfPath)) {
      throw new Error(`authoritative source PDF maps to multiple cleaned files: ${sourcePdfPath}`);
    }
    usedPdfPaths.add(sourcePdfPath);

    const cleanedMarkdownPath = relativePosix(PATHS.cleanedRoot, cleanedName);
    const sourceBuffer = fs.readFileSync(path.join(root, sourcePdfPath));
    const cleanedBuffer = fs.readFileSync(path.join(root, cleanedMarkdownPath));
    return {
      sourcePdfPath,
      sourcePdfSha256: sha256(sourceBuffer),
      sourcePdfBytes: sourceBuffer.length,
      cleanedMarkdownPath,
      cleanedMarkdownSha256: sha256(cleanedBuffer),
      cleanedMarkdownBytes: cleanedBuffer.length,
      cleanedMarkdownLines: lineCount(cleanedBuffer)
    };
  });

  const profileFlags = parseProfileFlags(profile.toString('utf8'));
  const doclingVersion = parseDoclingVersion(requirements.toString('utf8'));
  const inventorySha256 = sha256(`${JSON.stringify(records)}\n`);
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    generatedBy: GENERATOR_PATH,
    generatedNotice: 'DO NOT EDIT: regenerate with the generatedBy command.',
    snapshot: {
      id: policy.snapshotId,
      status: 'current',
      recordedOn: policy.recordedOn,
      sourceRoot: PATHS.sourceRoot,
      cleanedRoot: PATHS.cleanedRoot,
      policyPath: PATHS.policy,
      policySha256: sha256(policyBuffer),
      recordCount: records.length,
      inventorySha256,
      docling: {
        requiredVersion: doclingVersion,
        requirementsPath: PATHS.requirements,
        requirementsSha256: sha256(requirements),
        profileId: policy.profileId,
        profilePath: PATHS.profile,
        profileSha256: sha256(profile),
        flags: profileFlags
      }
    },
    records
  };
}

export function serializeSnapshot(snapshot) {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export function assertNoSnapshotIdCollision(actualText, expected) {
  const actual = JSON.parse(actualText);
  const expectedText = serializeSnapshot(expected);
  if (actual?.snapshot?.id === expected.snapshot.id && actualText !== expectedText) {
    throw new Error(
      `snapshot ID collision for ${expected.snapshot.id}; update snapshotId and recordedOn in ${PATHS.policy} before regenerating`
    );
  }
}

function duplicateValues(records, key) {
  const seen = new Set();
  const duplicates = new Set();
  for (const record of records) {
    if (seen.has(record[key])) duplicates.add(record[key]);
    seen.add(record[key]);
  }
  return [...duplicates].sort();
}

export function validateSnapshot(actual, expected) {
  const errors = [];
  if (actual?.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
    errors.push(`snapshot schemaVersion must be ${SNAPSHOT_SCHEMA_VERSION}`);
  }
  if (!Array.isArray(actual?.records)) {
    return [...errors, 'snapshot records must be an array'];
  }

  for (const key of ['sourcePdfPath', 'cleanedMarkdownPath']) {
    for (const duplicate of duplicateValues(actual.records, key)) {
      errors.push(`duplicate provenance ${key}: ${duplicate}`);
    }
  }

  for (const [index, record] of actual.records.entries()) {
    for (const key of REQUIRED_RECORD_KEYS) {
      if (!(key in record)) errors.push(`record ${index} is missing ${key}`);
    }
  }

  const actualByCleaned = new Map(
    actual.records.map((record) => [record.cleanedMarkdownPath, record])
  );
  const expectedByCleaned = new Map(
    expected.records.map((record) => [record.cleanedMarkdownPath, record])
  );
  for (const [cleanedPath, expectedRecord] of expectedByCleaned) {
    const actualRecord = actualByCleaned.get(cleanedPath);
    if (!actualRecord) {
      errors.push(`missing provenance record: ${cleanedPath}`);
      continue;
    }
    if (JSON.stringify(actualRecord) !== JSON.stringify(expectedRecord)) {
      errors.push(`stale or mismatched provenance record: ${cleanedPath}`);
    }
  }
  for (const cleanedPath of actualByCleaned.keys()) {
    if (!expectedByCleaned.has(cleanedPath)) {
      errors.push(`untracked provenance record: ${cleanedPath}`);
    }
  }

  const actualMetadata = { ...actual, records: expected.records };
  if (JSON.stringify(actualMetadata) !== JSON.stringify(expected)) {
    errors.push('stale or mismatched snapshot metadata');
  }
  return [...new Set(errors)];
}

export function renderManifest(snapshot) {
  const { docling } = snapshot.snapshot;
  return `# Source-Clean Provenance Manifest

This file is generated by
\`${GENERATOR_PATH}\`. It identifies the single current provenance snapshot for the canonical
Docling-cleaned corpus; historical versions remain available through Git history and are not
active inputs.

## Current Snapshot

- Snapshot ID: \`${snapshot.snapshot.id}\`
- Recorded on: \`${snapshot.snapshot.recordedOn}\`
- Status: \`${snapshot.snapshot.status}\`
- Records: \`${snapshot.snapshot.recordCount}\`
- Inventory SHA-256: \`${snapshot.snapshot.inventorySha256}\`
- Current snapshot: \`${PATHS.snapshot}\`
- Source root: \`${snapshot.snapshot.sourceRoot}\`
- Cleaned root: \`${snapshot.snapshot.cleanedRoot}\`
- Policy: \`${snapshot.snapshot.policyPath}\`
- Policy SHA-256: \`${snapshot.snapshot.policySha256}\`
- Required Docling version: \`${docling.requiredVersion}\` (pinned by \`${docling.requirementsPath}\`)
- Requirements SHA-256: \`${docling.requirementsSha256}\`
- Profile: \`${docling.profileId}\`
- Profile source: \`${docling.profilePath}\`
- Profile SHA-256: \`${docling.profileSha256}\`

Each record contains one authoritative root-level source PDF path and SHA-256 plus its unique
canonical cleaned Markdown path and SHA-256. Run
\`./spec-processing/scripts/generate-docling-provenance.sh --check\` to verify completeness,
uniqueness, hashes, metadata, and generated-file freshness.
`;
}

function countMatches(text, expression) {
  return [...text.matchAll(expression)].length;
}

function countMatchingLines(text, expression) {
  return text.split('\n').filter((line) => expression.test(line)).length;
}

export function checkCleanedQuality(root) {
  const policy = loadPolicy(root);
  const cleanedDirectory = path.join(root, PATHS.cleanedRoot);
  const cleanedNames = listFiles(cleanedDirectory, (name) => name.endsWith('.cleaned.md'));
  const findings = [];
  for (const name of cleanedNames) {
    const relativePath = relativePosix(PATHS.cleanedRoot, name);
    const buffer = fs.readFileSync(path.join(root, relativePath));
    const text = buffer.toString('utf8');
    const formFeedCount = countMatches(text, /\f/g);
    const dtdTokenCount = countMatchingLines(text, /(^|[^\\])#(?:REQUIRED|IMPLIED)\b/);
    if (formFeedCount > 0) {
      findings.push({
        rule: 'form-feed',
        path: relativePath,
        count: formFeedCount,
        sha256: sha256(buffer)
      });
    }
    if (dtdTokenCount > 0) {
      findings.push({
        rule: 'unescaped-dtd-token',
        path: relativePath,
        count: dtdTokenCount,
        sha256: sha256(buffer)
      });
    }
  }

  const dispositions = policy.qualityDispositions;
  const errors = [];
  for (const finding of findings) {
    const disposition = dispositions.find(
      (candidate) => candidate.rule === finding.rule && candidate.path === finding.path
    );
    if (!disposition) {
      errors.push(`undisposed ${finding.rule} finding: ${finding.path} (${finding.count})`);
      continue;
    }
    if (
      disposition.sha256 !== finding.sha256 ||
      disposition.expectedCount !== finding.count ||
      typeof disposition.rationale !== 'string' ||
      disposition.rationale.length === 0
    ) {
      errors.push(`stale quality disposition: ${finding.path} (${finding.rule})`);
    }
  }
  for (const disposition of dispositions) {
    if (
      !findings.some(
        (finding) => finding.rule === disposition.rule && finding.path === disposition.path
      )
    ) {
      errors.push(
        `quality disposition no longer matches a finding: ${disposition.path} (${disposition.rule})`
      );
    }
  }
  return { fileCount: cleanedNames.length, findings, dispositions, errors };
}
