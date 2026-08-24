import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const IDENTIFIER_LIMIT = 63;
const FILE_NAME_LIMIT = 128;
const MAX_CAPTURE_BYTES = 256 * 1024;
const SAFE_FILE_NAME = /^[a-z0-9][a-z0-9._-]*$/;
const TRUNCATION_MARKER = '\n...[truncated]\n';

export const EVIDENCE_CLASSIFICATION = Object.freeze({
  RESTRICTED: 'restricted',
  SAFE_UPLOAD: 'safe-upload'
});

const classificationMetadata = Object.freeze({
  [EVIDENCE_CLASSIFICATION.RESTRICTED]: Object.freeze({
    directoryProperty: 'restrictedDir',
    relativeDirectory: 'raw',
    safeToUpload: false
  }),
  [EVIDENCE_CLASSIFICATION.SAFE_UPLOAD]: Object.freeze({
    directoryProperty: 'safeUploadDir',
    relativeDirectory: 'safe-upload',
    safeToUpload: true
  })
});

const requireClassification = (classification) => {
  const metadata = classificationMetadata[classification];
  assert.ok(metadata, `unknown evidence classification: ${String(classification)}`);
  return metadata;
};

const requireAbsoluteOwnedRoot = (artifactRoot, pathOps) => {
  assert.equal(typeof artifactRoot, 'string', 'artifactRoot must be a string');
  assert.ok(pathOps.isAbsolute(artifactRoot), 'artifactRoot must be absolute');
  const resolved = pathOps.resolve(artifactRoot);
  assert.notEqual(resolved, pathOps.parse(resolved).root, 'artifactRoot must not be a filesystem root');
  return resolved;
};

const requireSafeFileName = (fileName) => {
  assert.equal(typeof fileName, 'string', 'artifact fileName must be a string');
  assert.ok(
    fileName.length <= FILE_NAME_LIMIT &&
      SAFE_FILE_NAME.test(fileName) &&
      fileName !== '..' &&
      !fileName.includes('\0'),
    'artifact fileName must be a safe bounded file name'
  );
  return fileName;
};

export function sanitizeEvidenceIdentifier(value) {
  assert.equal(typeof value, 'string', 'evidence identifier must be a string');
  const sanitized = value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, IDENTIFIER_LIMIT)
    .replace(/-+$/g, '');
  assert.notEqual(sanitized, '', 'evidence identifier must contain an ASCII letter or digit');
  return sanitized;
}

const createLayout = ({ artifactRoot, runId, scenarioId, pathOps }) => {
  const ownedRoot = requireAbsoluteOwnedRoot(artifactRoot, pathOps);
  const safeRunId = sanitizeEvidenceIdentifier(runId);
  const safeScenarioId = sanitizeEvidenceIdentifier(scenarioId);
  const runRoot = pathOps.join(ownedRoot, safeRunId);
  const scenarioRoot = pathOps.join(runRoot, safeScenarioId);
  return Object.freeze({
    schemaVersion: 1,
    artifactRoot: ownedRoot,
    runId: safeRunId,
    scenarioId: safeScenarioId,
    runRoot,
    scenarioRoot,
    restrictedDir: pathOps.join(scenarioRoot, 'raw'),
    safeUploadDir: pathOps.join(scenarioRoot, 'safe-upload'),
    layoutManifestPath: pathOps.join(scenarioRoot, '.evidence-layout.json')
  });
};

const layoutManifest = (layout) => ({
  schemaVersion: 1,
  runId: layout.runId,
  scenarioId: layout.scenarioId,
  locations: {
    restricted: { relativePath: 'raw', safeToUpload: false },
    safeUpload: { relativePath: 'safe-upload', safeToUpload: true }
  }
});

export async function initializeScenarioEvidence({
  artifactRoot,
  runId,
  scenarioId,
  fsOps = fs,
  pathOps = path,
  nonceFactory = crypto.randomUUID
}) {
  const layout = createLayout({ artifactRoot, runId, scenarioId, pathOps });
  const ensureOwnedDirectory = async (directory, { enforcePrivateMode = true } = {}) => {
    await fsOps.mkdir(directory, { recursive: true, mode: 0o700 });
    const directoryStat = await fsOps.lstat(directory);
    assert.ok(
      directoryStat.isDirectory() && !directoryStat.isSymbolicLink(),
      'evidence directories must not be symbolic links'
    );
    if (enforcePrivateMode) {
      await fsOps.chmod(directory, 0o700);
    }
  };
  await ensureOwnedDirectory(layout.artifactRoot, { enforcePrivateMode: false });
  for (const directory of [
    layout.runRoot,
    layout.scenarioRoot,
    layout.restrictedDir,
    layout.safeUploadDir
  ]) {
    await ensureOwnedDirectory(directory);
  }
  await writePrivateJsonManifest({
    filePath: layout.layoutManifestPath,
    value: layoutManifest(layout),
    fsOps,
    pathOps,
    nonce: nonceFactory()
  });
  return layout;
}

const validateLayout = (layout, pathOps) => {
  assert.equal(layout?.schemaVersion, 1, 'evidence layout schemaVersion must be 1');
  const expected = createLayout({
    artifactRoot: layout.artifactRoot,
    runId: layout.runId,
    scenarioId: layout.scenarioId,
    pathOps
  });
  for (const property of [
    'runRoot',
    'scenarioRoot',
    'restrictedDir',
    'safeUploadDir',
    'layoutManifestPath'
  ]) {
    assert.equal(layout[property], expected[property], 'evidence layout paths do not match owned root');
  }
  return expected;
};

export function resolveEvidenceArtifact(
  layout,
  { classification, fileName, sanitized = false },
  { pathOps = path } = {}
) {
  const validatedLayout = validateLayout(layout, pathOps);
  const metadata = requireClassification(classification);
  requireSafeFileName(fileName);
  if (metadata.safeToUpload) {
    assert.equal(
      sanitized,
      true,
      'safe-upload evidence requires explicit sanitization confirmation'
    );
  } else {
    assert.equal(sanitized, false, 'restricted evidence cannot claim sanitization');
  }
  const directory = validatedLayout[metadata.directoryProperty];
  return Object.freeze({
    classification,
    fileName,
    path: pathOps.join(directory, fileName),
    relativePath: path.posix.join(metadata.relativeDirectory, fileName),
    safeToUpload: metadata.safeToUpload,
    sanitized
  });
}

export function buildEvidenceManifest(layout, artifacts, { pathOps = path } = {}) {
  const validatedLayout = validateLayout(layout, pathOps);
  assert.ok(Array.isArray(artifacts), 'evidence artifacts must be an array');
  const observedPaths = new Set();
  const entries = artifacts.map((artifact) => {
    const expected = resolveEvidenceArtifact(
      validatedLayout,
      {
        classification: artifact?.classification,
        fileName: artifact?.fileName,
        sanitized: artifact?.sanitized
      },
      { pathOps }
    );
    for (const property of ['path', 'relativePath', 'safeToUpload']) {
      assert.equal(
        artifact[property],
        expected[property],
        'artifact descriptor does not match its classification'
      );
    }
    assert.ok(
      !observedPaths.has(expected.relativePath),
      'evidence manifest contains a duplicate artifact path'
    );
    observedPaths.add(expected.relativePath);
    return {
      classification: expected.classification,
      relativePath: expected.relativePath,
      safeToUpload: expected.safeToUpload,
      sanitized: expected.sanitized
    };
  });
  return {
    schemaVersion: 1,
    runId: validatedLayout.runId,
    scenarioId: validatedLayout.scenarioId,
    artifacts: entries
  };
}

const htmlEscape = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const htmlNumericEscape = (value, radix) =>
  [...value]
    .map((character) => {
      const codePoint = character.codePointAt(0);
      return radix === 16 ? `&#x${codePoint.toString(16)};` : `&#${codePoint};`;
    })
    .join('');

const encodedSecretForms = (secret) => {
  const percentEncoded = encodeURIComponent(secret);
  const lowercasePercentDigits = percentEncoded.replace(/%[0-9A-F]{2}/g, (escape) =>
    escape.toLowerCase()
  );
  const formEncoded = new URLSearchParams({ value: secret }).toString().slice('value='.length);
  const jsonEncoded = JSON.stringify(secret).slice(1, -1);
  const base64 = Buffer.from(secret, 'utf8').toString('base64');
  const base64url = Buffer.from(secret, 'utf8').toString('base64url');
  return new Set([
    secret,
    percentEncoded,
    lowercasePercentDigits,
    formEncoded,
    jsonEncoded,
    htmlEscape(secret),
    htmlNumericEscape(secret, 10),
    htmlNumericEscape(secret, 16),
    base64,
    base64url
  ]);
};

export function createSecretRedactor(secrets, { replacement = '[REDACTED]' } = {}) {
  assert.ok(Array.isArray(secrets) && secrets.length > 0, 'redactor requires at least one secret');
  assert.equal(typeof replacement, 'string', 'redaction replacement must be a string');
  const uniqueSecrets = [...new Set(secrets)];
  for (const secret of uniqueSecrets) {
    assert.equal(typeof secret, 'string', 'configured secrets must be strings');
    assert.ok(secret.length >= 4, 'configured secrets must contain at least 4 characters');
  }
  const forms = [...new Set(uniqueSecrets.flatMap((secret) => [...encodedSecretForms(secret)]))]
    .filter((form) => form.length > 0)
    .sort((left, right) => right.length - left.length);
  assert.ok(
    !forms.some((form) => replacement.includes(form)),
    'redaction replacement must not contain a configured secret'
  );

  const containsSecret = (value) => {
    assert.equal(typeof value, 'string', 'redaction input must be a string');
    return forms.some((form) => value.includes(form));
  };
  const redact = (value) => {
    assert.equal(typeof value, 'string', 'redaction input must be a string');
    let redacted = value;
    for (const form of forms) {
      redacted = redacted.replaceAll(form, replacement);
    }
    return redacted;
  };

  return Object.freeze({ containsSecret, redact, replacement });
}

const utf8Bytes = (value) => new TextEncoder().encode(value);

const truncateUtf8 = (value, byteLimit) => {
  const bytes = utf8Bytes(value);
  if (bytes.length <= byteLimit) {
    return value;
  }
  for (let end = byteLimit; end >= Math.max(0, byteLimit - 3); end -= 1) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(0, end));
    } catch {
      // A valid source string can fail only when this slice ends inside a multibyte code point.
    }
  }
  return '';
};

export function captureBoundedText(value, { redactor, maxBytes = 64 * 1024 } = {}) {
  assert.equal(typeof value, 'string', 'captured text must be a string');
  assert.ok(
    Number.isSafeInteger(maxBytes) && maxBytes >= 1 && maxBytes <= MAX_CAPTURE_BYTES,
    `maxBytes must be between 1 and ${MAX_CAPTURE_BYTES}`
  );
  assert.equal(typeof redactor?.redact, 'function', 'bounded capture requires a redactor');
  const originalBytes = utf8Bytes(value).length;
  const redacted = redactor.redact(value);
  const redactedBytes = utf8Bytes(redacted);
  if (redactedBytes.length <= maxBytes) {
    return { text: redacted, originalBytes, retainedBytes: redactedBytes.length, truncated: false };
  }

  const markerBytes = utf8Bytes(TRUNCATION_MARKER).length;
  const prefixLimit = Math.max(0, maxBytes - Math.min(maxBytes, markerBytes));
  const prefix = truncateUtf8(redacted, prefixLimit);
  const marker = truncateUtf8(TRUNCATION_MARKER, maxBytes - utf8Bytes(prefix).length);
  const text = `${prefix}${marker}`;
  return { text, originalBytes, retainedBytes: utf8Bytes(text).length, truncated: true };
}

export async function writePrivateJsonManifest({
  filePath,
  value,
  fsOps = fs,
  pathOps = path,
  nonce = crypto.randomUUID()
}) {
  assert.equal(typeof filePath, 'string', 'manifest filePath must be a string');
  assert.ok(pathOps.isAbsolute(filePath), 'manifest filePath must be absolute');
  const safeNonce = sanitizeEvidenceIdentifier(nonce);
  const directory = pathOps.dirname(filePath);
  const temporaryPath = pathOps.join(directory, `.${pathOps.basename(filePath)}.${safeNonce}.tmp`);
  const serialized = JSON.stringify(value, null, 2);
  assert.equal(typeof serialized, 'string', 'manifest value must be JSON serializable');
  const content = `${serialized}\n`;
  await fsOps.mkdir(directory, { recursive: true, mode: 0o700 });

  let handle;
  try {
    handle = await fsOps.open(temporaryPath, 'wx', 0o600);
    await handle.writeFile(content, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    await fsOps.link(temporaryPath, filePath);
    await fsOps.chmod(filePath, 0o600);
  } finally {
    await handle?.close().catch(() => {});
    await fsOps.unlink(temporaryPath).catch((error) => {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    });
  }
}

export async function cleanupRestrictedEvidence(layout, { fsOps = fs, pathOps = path } = {}) {
  assert.equal(
    layout?.restrictedDir,
    pathOps.join(layout?.scenarioRoot ?? '', 'raw'),
    'restricted evidence path does not match the initialized layout'
  );
  const validatedLayout = validateLayout(layout, pathOps);
  assert.equal(
    layout.restrictedDir,
    validatedLayout.restrictedDir,
    'restricted evidence path does not match the initialized layout'
  );
  await fsOps.rm(validatedLayout.restrictedDir, { recursive: true, force: true });
}
