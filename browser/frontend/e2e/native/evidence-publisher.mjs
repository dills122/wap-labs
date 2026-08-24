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
const MAX_MANIFEST_BYTES = 256 * 1024;
const MANIFEST_NAME = 'bundle-manifest.json';
const FAILURE_NAME = 'sanitizer-failure.json';
const RUN_FAILURE_NAME = 'run-failure.json';
const SAFE_SCENARIO_ID = /^[A-Z0-9][A-Z0-9-]{0,63}$/;
const SAFE_LAYOUT_ID = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const SHELL_ARTIFACT_DIRECTORY = /^run\.[A-Za-z0-9]{6}$/;
const SAFE_PHASES = new Set([
  'engine-ready',
  'deck-ready',
  'recovery-ready',
  'recovery-dispatched',
  'recovered',
  'form-ready',
  'ui-dispatched',
  'response-rendered',
  'origin-confirmed',
  'session-invalidated'
]);
const SAFE_FAILURE_CLASSES = new Set([
  'infrastructure-startup',
  'deck-load',
  'scenario-assertion',
  'ui-dispatch',
  'response-rendering',
  'origin-confirmation',
  'session-lifecycle',
  'scenario-finalization',
  'scenario-cleanup'
]);
const SAFE_ASSERTION_NAMES = new Set([
  'native startup',
  'gateway deck render',
  'visible navigation',
  'deterministic failure',
  'failure recovery',
  'successful navigation request bound',
  'masked PIN entry',
  'registration response',
  'correlated registration receipt',
  'registration aggregate metric',
  'login response',
  'correlated login receipt',
  'login aggregate metrics',
  'session invalidation'
]);

export const isSafeAssertionName = (value) => SAFE_ASSERTION_NAMES.has(value);

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function privateRegularFile(filePath, fsOps) {
  const metadata = await fsOps.lstat(filePath);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new Error('evidence bundle contains a non-regular file');
  }
  return metadata;
}

async function readCanonicalJson(filePath, maxBytes, fsOps) {
  const metadata = await privateRegularFile(filePath, fsOps);
  if (metadata.size > maxBytes) throw new Error('safe JSON file exceeds the size bound');
  const body = await fsOps.readFile(filePath, 'utf8');
  const value = JSON.parse(body);
  if (body !== `${JSON.stringify(value, null, 2)}\n`) {
    throw new Error('safe JSON file is not in canonical form');
  }
  return value;
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
      found.push(...(await listRegularFiles(root, fsOps, childRelative)));
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
  if (
    !Array.isArray(payloads) ||
    payloads.length !== 1 ||
    payloads[0]?.fileName !== 'result.json'
  ) {
    throw new Error('normal evidence bundle requires the exact result payload');
  }
  const names = new Set();
  return payloads.map(({ fileName, value }) => {
    if (
      !SAFE_NAME.test(fileName) ||
      [MANIFEST_NAME, FAILURE_NAME, RUN_FAILURE_NAME].includes(fileName)
    ) {
      throw new Error('safe evidence payload has an invalid file name');
    }
    if (names.has(fileName)) throw new Error('safe evidence payload names must be unique');
    names.add(fileName);
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    if (redactor.containsSecret(serialized)) throw new Error('secret canary matched safe payload');
    validateSafeResultPayload(value);
    return { fileName, value, serialized };
  });
}

function exactKeys(value, expected) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === [...expected].sort().join(',')
  );
}

function validateSafeObservation(value) {
  if (!exactKeys(value, value?.address === undefined ? ['phase'] : ['phase', 'address'])) {
    throw new Error('safe result observation schema is invalid');
  }
  if (!SAFE_PHASES.has(value.phase)) throw new Error('safe result observation phase is invalid');
  if (value.address !== undefined) {
    if (typeof value.address !== 'string' || value.address.length > 2_048) {
      throw new Error('safe result observation address is invalid');
    }
    const address = new URL(value.address);
    if (
      !['wap:', 'waps:'].includes(address.protocol) ||
      address.username !== '' ||
      address.password !== '' ||
      address.search !== '' ||
      address.hash !== '' ||
      address.href !== value.address
    ) {
      throw new Error('safe result observation address is not sanitized');
    }
  }
}

function validateSafeCleanup(value) {
  if (exactKeys(value, ['result'])) {
    if (!['not-started', 'cleanup-failed', 'closed'].includes(value.result)) {
      throw new Error('safe result cleanup state is invalid');
    }
    return;
  }
  if (!exactKeys(value, ['webdriverSession', 'processGroup'])) {
    throw new Error('safe result cleanup schema is invalid');
  }
  if (!['closed', 'close-failed'].includes(value.webdriverSession)) {
    throw new Error('safe result WebDriver cleanup state is invalid');
  }
  if (!['terminated', 'already-exited', 'killed', 'cleanup-failed'].includes(value.processGroup)) {
    throw new Error('safe result process cleanup state is invalid');
  }
}

export function validateSafeResultPayload(value) {
  if (
    !exactKeys(value, [
      'schemaVersion',
      'scenarioId',
      'suite',
      'result',
      'durationMs',
      'lastObservation',
      'checkpoints',
      'failureClass',
      'cleanup',
      'assertions'
    ]) ||
    value.schemaVersion !== 1 ||
    !SAFE_SCENARIO_ID.test(value.scenarioId) ||
    value.suite !== 'smoke' ||
    !['pass', 'fail'].includes(value.result) ||
    !Number.isSafeInteger(value.durationMs) ||
    value.durationMs < 0 ||
    value.durationMs > 3_600_000 ||
    !Array.isArray(value.checkpoints) ||
    value.checkpoints.length > 16 ||
    !Array.isArray(value.assertions) ||
    value.assertions.length > 32
  ) {
    throw new Error('safe result schema is invalid');
  }
  for (const checkpoint of value.checkpoints) validateSafeObservation(checkpoint);
  const expectedLast = value.checkpoints.at(-1) ?? null;
  if (JSON.stringify(value.lastObservation) !== JSON.stringify(expectedLast)) {
    throw new Error('safe result last observation does not match its checkpoint trail');
  }
  if (
    value.result === 'pass'
      ? value.failureClass !== null
      : !SAFE_FAILURE_CLASSES.has(value.failureClass)
  ) {
    throw new Error('safe result failure classification is invalid');
  }
  const assertionNames = new Set();
  for (const assertion of value.assertions) {
    if (
      !exactKeys(assertion, ['name', 'result']) ||
      !isSafeAssertionName(assertion.name) ||
      assertion.result !== 'pass' ||
      assertionNames.has(assertion.name)
    ) {
      throw new Error('safe result assertion schema is invalid');
    }
    assertionNames.add(assertion.name);
  }
  validateSafeCleanup(value.cleanup);
  return value;
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

export async function constructStaticRunFailureBundle({ layout, fsOps = fs }) {
  await cleanupRestrictedEvidence(layout, { fsOps });
  await clearSafeDirectory(layout, fsOps);
  await writePrivateJsonManifest({
    filePath: path.join(layout.safeUploadDir, RUN_FAILURE_NAME),
    value: { schemaVersion: 1, mode: 'run-failure', result: 'fail', phase: 'infrastructure' },
    fsOps
  });
  await validateSafeEvidenceBundle({ safeUploadDir: layout.safeUploadDir, fsOps });
  return { ok: false, mode: 'run-failure' };
}

export async function validateSafeEvidenceBundle({ safeUploadDir, fsOps = fs }) {
  const files = (await listRegularFiles(safeUploadDir, fsOps)).sort();
  if (files.length === 1 && files[0] === FAILURE_NAME) {
    const value = await readCanonicalJson(
      path.join(safeUploadDir, FAILURE_NAME),
      MAX_MANIFEST_BYTES,
      fsOps
    );
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
  if (files.length === 1 && files[0] === RUN_FAILURE_NAME) {
    const value = await readCanonicalJson(
      path.join(safeUploadDir, RUN_FAILURE_NAME),
      MAX_MANIFEST_BYTES,
      fsOps
    );
    if (
      Object.keys(value).sort().join(',') !== 'mode,phase,result,schemaVersion' ||
      value.schemaVersion !== 1 ||
      value.mode !== 'run-failure' ||
      value.result !== 'fail' ||
      value.phase !== 'infrastructure'
    ) {
      throw new Error('invalid static run-failure bundle');
    }
    return { mode: 'run-failure', files };
  }
  if (!files.includes(MANIFEST_NAME)) throw new Error('safe evidence manifest is missing');
  const manifestPath = path.join(safeUploadDir, MANIFEST_NAME);
  const manifest = await readCanonicalJson(manifestPath, MAX_MANIFEST_BYTES, fsOps);
  if (
    Object.keys(manifest ?? {})
      .sort()
      .join(',') !== 'files,mode,schemaVersion' ||
    manifest.schemaVersion !== 1 ||
    manifest.mode !== 'normal' ||
    !Array.isArray(manifest.files) ||
    manifest.files.length !== 1
  ) {
    throw new Error('safe evidence manifest schema is invalid');
  }
  const entryNames = new Set();
  for (const entry of manifest.files) {
    if (
      Object.keys(entry ?? {})
        .sort()
        .join(',') !== 'bytes,fileName,sha256' ||
      !SAFE_NAME.test(entry.fileName) ||
      [MANIFEST_NAME, FAILURE_NAME, RUN_FAILURE_NAME].includes(entry.fileName) ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes < 0 ||
      entry.bytes > MAX_FILE_BYTES ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      entryNames.has(entry.fileName)
    ) {
      throw new Error('safe evidence manifest entry schema is invalid');
    }
    entryNames.add(entry.fileName);
  }
  if (manifest.files[0].fileName !== 'result.json') {
    throw new Error('safe evidence manifest must contain only result.json');
  }
  const expected = [...manifest.files.map(({ fileName }) => fileName), MANIFEST_NAME].sort();
  if (expected.join('\0') !== files.join('\0'))
    throw new Error('safe evidence file set is not exact');
  for (const entry of manifest.files) {
    const filePath = path.join(safeUploadDir, entry.fileName);
    const metadata = await privateRegularFile(filePath, fsOps);
    if (metadata.size > MAX_FILE_BYTES)
      throw new Error('safe evidence file exceeds the size bound');
    const body = await fsOps.readFile(filePath);
    if (body.length !== entry.bytes || digest(body) !== entry.sha256) {
      throw new Error('safe evidence digest validation failed');
    }
    if (entry.fileName === 'result.json') {
      const value = JSON.parse(body.toString('utf8'));
      if (body.toString('utf8') !== `${JSON.stringify(value, null, 2)}\n`) {
        throw new Error('safe result JSON is not in canonical form');
      }
      validateSafeResultPayload(value);
    }
  }
  return { mode: 'normal', files };
}

export async function validateSafeEvidenceRoot({ artifactRoot, fsOps = fs }) {
  if (
    !path.isAbsolute(artifactRoot) ||
    path.resolve(artifactRoot) === path.parse(artifactRoot).root
  ) {
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
      if (!entry.isDirectory()) continue;
      const child = path.join(directory, entry.name);
      if (entry.name === 'safe-upload') {
        const segments = path.relative(artifactRoot, child).split(path.sep);
        const bundleSegments = segments.length === 4 ? segments.slice(1) : segments;
        const hasExpectedShellDirectory =
          segments.length !== 4 || SHELL_ARTIFACT_DIRECTORY.test(segments[0]);
        const hasExpectedBundleLayout =
          bundleSegments.length === 3 &&
          SAFE_LAYOUT_ID.test(bundleSegments[0]) &&
          SAFE_LAYOUT_ID.test(bundleSegments[1]) &&
          bundleSegments[2] === 'safe-upload';
        if (!hasExpectedShellDirectory || !hasExpectedBundleLayout || segments.includes('raw')) {
          throw new Error('safe evidence bundle is outside the exact run/scenario layout');
        }
        safeDirectories.push(child);
      } else await visit(child);
    }
  };
  await visit(artifactRoot);
  if (safeDirectories.length === 0) throw new Error('safe evidence root contains no bundles');
  for (const safeUploadDir of safeDirectories) {
    await validateSafeEvidenceBundle({ safeUploadDir, fsOps });
  }
  return { bundles: safeDirectories.length };
}
