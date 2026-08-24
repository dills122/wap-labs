import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  cleanupRestrictedEvidence,
  createSecretRedactor,
  writePrivateJsonManifest
} from './evidence.mjs';

const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const MAX_FILES = 128;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const MANIFEST_NAME = 'bundle-manifest.json';
const FAILURE_NAME = 'sanitizer-failure.json';

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function privateRegularFile(filePath, fsOps) {
  const metadata = await fsOps.lstat(filePath);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new Error('evidence bundle contains a non-regular file');
  }
  return metadata;
}

async function listRegularFiles(root, fsOps, relative = '') {
  const current = path.join(root, relative);
  const metadata = await fsOps.lstat(current);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error('evidence tree contains a symlink or non-directory root');
  }
  const found = [];
  for (const entry of await fsOps.readdir(current, { withFileTypes: true })) {
    const childRelative = relative ? path.posix.join(relative, entry.name) : entry.name;
    if (entry.isSymbolicLink()) throw new Error('evidence tree contains a symbolic link');
    if (entry.isDirectory()) {
      found.push(...await listRegularFiles(root, fsOps, childRelative));
    } else if (entry.isFile()) {
      found.push(childRelative);
    } else {
      throw new Error('evidence tree contains an unsupported file type');
    }
    if (found.length > MAX_FILES) throw new Error('evidence tree exceeds the file-count bound');
  }
  return found;
}

async function scanRestricted(layout, redactor, fsOps) {
  const files = await listRegularFiles(layout.restrictedDir, fsOps);
  let totalBytes = 0;
  for (const relativePath of files) {
    if (redactor.containsSecret(relativePath)) throw new Error('secret canary matched evidence');
    const filePath = path.join(layout.restrictedDir, relativePath);
    const metadata = await privateRegularFile(filePath, fsOps);
    if (metadata.size > MAX_FILE_BYTES) throw new Error('evidence file exceeds the size bound');
    totalBytes += metadata.size;
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('evidence tree exceeds the total-size bound');
    const body = await fsOps.readFile(filePath);
    if (redactor.containsSecret(body.toString('utf8'))) {
      throw new Error('secret canary matched evidence');
    }
  }
}

async function clearSafeDirectory(layout, fsOps) {
  await fsOps.rm(layout.safeUploadDir, { recursive: true, force: true });
  await fsOps.mkdir(layout.safeUploadDir, { recursive: true, mode: 0o700 });
}

function validatePayloads(payloads, redactor) {
  if (!Array.isArray(payloads) || payloads.length === 0) {
    throw new Error('normal evidence bundle requires at least one payload');
  }
  const names = new Set();
  return payloads.map(({ fileName, value }) => {
    if (!SAFE_NAME.test(fileName) || [MANIFEST_NAME, FAILURE_NAME].includes(fileName)) {
      throw new Error('safe evidence payload has an invalid file name');
    }
    if (names.has(fileName)) throw new Error('safe evidence payload names must be unique');
    names.add(fileName);
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    if (redactor.containsSecret(serialized)) throw new Error('secret canary matched safe payload');
    return { fileName, value, serialized };
  });
}

export async function constructSafeEvidenceBundle({ layout, payloads, secrets, fsOps = fs }) {
  const redactor = createSecretRedactor(secrets);
  try {
    await scanRestricted(layout, redactor, fsOps);
    const validated = validatePayloads(payloads, redactor);
    await clearSafeDirectory(layout, fsOps);
    const entries = [];
    for (const payload of validated) {
      const filePath = path.join(layout.safeUploadDir, payload.fileName);
      await writePrivateJsonManifest({ filePath, value: payload.value, fsOps });
      entries.push({
        fileName: payload.fileName,
        bytes: Buffer.byteLength(payload.serialized),
        sha256: digest(payload.serialized)
      });
    }
    await writePrivateJsonManifest({
      filePath: path.join(layout.safeUploadDir, MANIFEST_NAME),
      value: { schemaVersion: 1, mode: 'normal', files: entries },
      fsOps
    });
    await validateSafeEvidenceBundle({ safeUploadDir: layout.safeUploadDir, fsOps });
    return { ok: true, mode: 'normal' };
  } catch {
    await cleanupRestrictedEvidence(layout, { fsOps });
    await clearSafeDirectory(layout, fsOps);
    await writePrivateJsonManifest({
      filePath: path.join(layout.safeUploadDir, FAILURE_NAME),
      value: { schemaVersion: 1, mode: 'sanitizer-failure', result: 'fail' },
      fsOps
    });
    return { ok: false, mode: 'sanitizer-failure' };
  }
}

export async function validateSafeEvidenceBundle({ safeUploadDir, fsOps = fs }) {
  const files = (await listRegularFiles(safeUploadDir, fsOps)).sort();
  if (files.length === 1 && files[0] === FAILURE_NAME) {
    const value = JSON.parse(await fsOps.readFile(path.join(safeUploadDir, FAILURE_NAME), 'utf8'));
    if (
      Object.keys(value).sort().join(',') !== 'mode,result,schemaVersion' ||
      value.schemaVersion !== 1 ||
      value.mode !== 'sanitizer-failure' ||
      value.result !== 'fail'
    ) {
      throw new Error('invalid static sanitizer-failure bundle');
    }
    return { mode: 'sanitizer-failure', files };
  }
  if (!files.includes(MANIFEST_NAME)) throw new Error('safe evidence manifest is missing');
  const manifest = JSON.parse(await fsOps.readFile(path.join(safeUploadDir, MANIFEST_NAME), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.mode !== 'normal' || !Array.isArray(manifest.files)) {
    throw new Error('safe evidence manifest schema is invalid');
  }
  const expected = [...manifest.files.map(({ fileName }) => fileName), MANIFEST_NAME].sort();
  if (expected.join('\0') !== files.join('\0')) throw new Error('safe evidence file set is not exact');
  for (const entry of manifest.files) {
    if (!SAFE_NAME.test(entry.fileName) || entry.fileName === MANIFEST_NAME) {
      throw new Error('safe evidence manifest contains an invalid file name');
    }
    const filePath = path.join(safeUploadDir, entry.fileName);
    await privateRegularFile(filePath, fsOps);
    const body = await fsOps.readFile(filePath);
    if (body.length !== entry.bytes || digest(body) !== entry.sha256) {
      throw new Error('safe evidence digest validation failed');
    }
  }
  return { mode: 'normal', files };
}

export async function validateSafeEvidenceRoot({ artifactRoot, fsOps = fs }) {
  if (!path.isAbsolute(artifactRoot) || path.resolve(artifactRoot) === path.parse(artifactRoot).root) {
    throw new Error('safe evidence root must be an owned absolute directory');
  }
  const safeDirectories = [];
  const visit = async (directory) => {
    const metadata = await fsOps.lstat(directory);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error('safe evidence root contains an invalid directory');
    }
    for (const entry of await fsOps.readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('safe evidence root contains a symbolic link');
      if (!entry.isDirectory() || entry.name === 'raw') continue;
      const child = path.join(directory, entry.name);
      if (entry.name === 'safe-upload') safeDirectories.push(child);
      else await visit(child);
    }
  };
  await visit(artifactRoot);
  if (safeDirectories.length === 0) throw new Error('safe evidence root contains no bundles');
  for (const safeUploadDir of safeDirectories) {
    await validateSafeEvidenceBundle({ safeUploadDir, fsOps });
  }
  return { bundles: safeDirectories.length };
}
