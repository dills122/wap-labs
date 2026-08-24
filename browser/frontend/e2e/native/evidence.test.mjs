import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  EVIDENCE_CLASSIFICATION,
  buildEvidenceManifest,
  captureBoundedText,
  cleanupRestrictedEvidence,
  createSecretRedactor,
  initializeScenarioEvidence,
  resolveEvidenceArtifact,
  sanitizeEvidenceIdentifier,
  writePrivateJsonManifest
} from './evidence.mjs';

const withTemporaryDirectory = async (run) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waves-evidence-test-'));
  try {
    await run(directory);
  } finally {
    await import('node:fs/promises').then(({ rm }) => rm(directory, { recursive: true, force: true }));
  }
};

test('evidence identifiers are deterministic, bounded, and safe as path segments', () => {
  assert.equal(sanitizeEvidenceIdentifier('  PILOT_Native/001  '), 'pilot-native-001');
  assert.equal(sanitizeEvidenceIdentifier('repeat value'), sanitizeEvidenceIdentifier('repeat value'));
  assert.ok(sanitizeEvidenceIdentifier('x'.repeat(300)).length <= 63);
  assert.throws(() => sanitizeEvidenceIdentifier('../'), /ASCII letter or digit/);
});

test('scenario evidence initializes separate private raw and safe-upload trees', async () => {
  await withTemporaryDirectory(async (artifactRoot) => {
    const layout = await initializeScenarioEvidence({
      artifactRoot,
      runId: 'Waves Run 42',
      scenarioId: 'PILOT-NATIVE-001'
    });

    assert.equal(layout.runId, 'waves-run-42');
    assert.equal(layout.scenarioId, 'pilot-native-001');
    assert.equal(layout.scenarioRoot, path.join(artifactRoot, 'waves-run-42', 'pilot-native-001'));
    assert.equal(layout.restrictedDir, path.join(layout.scenarioRoot, 'raw'));
    assert.equal(layout.safeUploadDir, path.join(layout.scenarioRoot, 'safe-upload'));
    assert.equal((await stat(layout.restrictedDir)).mode & 0o777, 0o700);
    assert.equal((await stat(layout.safeUploadDir)).mode & 0o777, 0o700);

    const manifest = JSON.parse(await readFile(layout.layoutManifestPath, 'utf8'));
    assert.deepEqual(manifest, {
      schemaVersion: 1,
      runId: 'waves-run-42',
      scenarioId: 'pilot-native-001',
      locations: {
        restricted: { relativePath: 'raw', safeToUpload: false },
        safeUpload: { relativePath: 'safe-upload', safeToUpload: true }
      }
    });
    assert.equal((await stat(layout.layoutManifestPath)).mode & 0o777, 0o600);
  });
});

test('scenario evidence requires an absolute owned artifact root', async () => {
  await assert.rejects(
    initializeScenarioEvidence({
      artifactRoot: 'relative-artifacts',
      runId: 'run-1',
      scenarioId: 'scenario-1'
    }),
    /artifactRoot must be absolute/
  );
});

test('scenario evidence rejects a preexisting symbolic-link evidence directory', async () => {
  await withTemporaryDirectory(async (artifactRoot) => {
    const scenarioRoot = path.join(artifactRoot, 'run-1', 'scenario-1');
    const outsideDirectory = path.join(artifactRoot, 'outside');
    await mkdir(path.join(scenarioRoot, 'raw'), { recursive: true });
    await mkdir(outsideDirectory);
    await symlink(outsideDirectory, path.join(scenarioRoot, 'safe-upload'));

    await assert.rejects(
      initializeScenarioEvidence({ artifactRoot, runId: 'run-1', scenarioId: 'scenario-1' }),
      /evidence directories must not be symbolic links/
    );
  });
});

test('scenario evidence rejects a symbolic-link run directory that escapes its owned subtree', async () => {
  await withTemporaryDirectory(async (artifactRoot) => {
    const outsideDirectory = path.join(artifactRoot, 'outside');
    await mkdir(outsideDirectory);
    await symlink(outsideDirectory, path.join(artifactRoot, 'run-1'));

    await assert.rejects(
      initializeScenarioEvidence({ artifactRoot, runId: 'run-1', scenarioId: 'scenario-1' }),
      /evidence directories must not be symbolic links/
    );
    await assert.rejects(stat(path.join(outsideDirectory, 'scenario-1')), { code: 'ENOENT' });
  });
});

test('artifact resolution makes upload eligibility explicit and fail closed', async () => {
  await withTemporaryDirectory(async (artifactRoot) => {
    const layout = await initializeScenarioEvidence({
      artifactRoot,
      runId: 'run-1',
      scenarioId: 'scenario-1'
    });

    assert.deepEqual(
      resolveEvidenceArtifact(layout, {
        classification: EVIDENCE_CLASSIFICATION.RESTRICTED,
        fileName: 'driver-output.txt'
      }),
      {
        classification: 'restricted',
        fileName: 'driver-output.txt',
        path: path.join(layout.restrictedDir, 'driver-output.txt'),
        relativePath: 'raw/driver-output.txt',
        safeToUpload: false,
        sanitized: false
      }
    );
    assert.deepEqual(
      resolveEvidenceArtifact(layout, {
        classification: EVIDENCE_CLASSIFICATION.SAFE_UPLOAD,
        fileName: 'assertions.json',
        sanitized: true
      }),
      {
        classification: 'safe-upload',
        fileName: 'assertions.json',
        path: path.join(layout.safeUploadDir, 'assertions.json'),
        relativePath: 'safe-upload/assertions.json',
        safeToUpload: true,
        sanitized: true
      }
    );

    assert.throws(
      () => resolveEvidenceArtifact(layout, { classification: 'maybe-safe', fileName: 'result.txt' }),
      /unknown evidence classification/
    );
    assert.throws(
      () =>
        resolveEvidenceArtifact(layout, {
          classification: EVIDENCE_CLASSIFICATION.SAFE_UPLOAD,
          fileName: 'result.txt'
        }),
      /explicit sanitization confirmation/
    );
    for (const fileName of ['../escape.txt', 'nested/file.txt', '..', '.hidden', 'name\0.txt']) {
      assert.throws(
        () =>
          resolveEvidenceArtifact(layout, {
            classification: EVIDENCE_CLASSIFICATION.RESTRICTED,
            fileName
          }),
        /safe bounded file name/
      );
    }
  });
});

test('evidence manifest retains explicit classification without machine-local absolute paths', async () => {
  await withTemporaryDirectory(async (artifactRoot) => {
    const layout = await initializeScenarioEvidence({
      artifactRoot,
      runId: 'run-1',
      scenarioId: 'scenario-1'
    });
    const restricted = resolveEvidenceArtifact(layout, {
      classification: EVIDENCE_CLASSIFICATION.RESTRICTED,
      fileName: 'tauri-output.txt'
    });
    const safe = resolveEvidenceArtifact(layout, {
      classification: EVIDENCE_CLASSIFICATION.SAFE_UPLOAD,
      fileName: 'assertions.json',
      sanitized: true
    });

    assert.deepEqual(buildEvidenceManifest(layout, [restricted, safe]), {
      schemaVersion: 1,
      runId: 'run-1',
      scenarioId: 'scenario-1',
      artifacts: [
        {
          classification: 'restricted',
          relativePath: 'raw/tauri-output.txt',
          safeToUpload: false,
          sanitized: false
        },
        {
          classification: 'safe-upload',
          relativePath: 'safe-upload/assertions.json',
          safeToUpload: true,
          sanitized: true
        }
      ]
    });
    assert.throws(
      () => buildEvidenceManifest(layout, [{ ...safe, classification: 'unknown' }]),
      /unknown evidence classification/
    );
    assert.throws(
      () => buildEvidenceManifest(layout, [{ ...safe, relativePath: 'raw/assertions.json' }]),
      /artifact descriptor does not match its classification/
    );
    assert.throws(
      () => buildEvidenceManifest(layout, [safe, safe]),
      /evidence manifest contains a duplicate artifact path/
    );
  });
});

test('secret redaction covers plaintext and defensible common encodings', () => {
  const secret = 'p&n 42/=';
  const redactor = createSecretRedactor([secret, '1234']);
  const encodedForms = [
    secret,
    encodeURIComponent(secret),
    new URLSearchParams({ value: secret }).get('value'),
    new URLSearchParams({ value: secret }).toString().slice('value='.length),
    JSON.stringify(secret).slice(1, -1),
    'p&amp;n 42/=',
    Buffer.from(secret, 'utf8').toString('base64'),
    Buffer.from(secret, 'utf8').toString('base64url'),
    [...secret].map((character) => `&#${character.codePointAt(0)};`).join(''),
    [...secret].map((character) => `&#x${character.codePointAt(0).toString(16)};`).join('')
  ];

  for (const encoded of encodedForms) {
    assert.equal(redactor.redact(`prefix ${encoded} suffix`), 'prefix [REDACTED] suffix');
    assert.equal(redactor.containsSecret(encoded), true);
  }
  assert.equal(redactor.redact('PIN=1234 and again 1234'), 'PIN=[REDACTED] and again [REDACTED]');
  assert.equal(redactor.containsSecret('ordinary bounded output'), false);
});

test('secret redaction rejects unsafe configurations', () => {
  assert.throws(() => createSecretRedactor([]), /at least one secret/);
  assert.throws(() => createSecretRedactor(['']), /at least 4 characters/);
  assert.throws(() => createSecretRedactor(['abc']), /at least 4 characters/);
  assert.throws(() => createSecretRedactor(['valid-secret'], { replacement: 'valid-secret' }), /must not contain a configured secret/);
  assert.throws(
    () =>
      createSecretRedactor(['valid-secret'], {
        replacement: Buffer.from('valid-secret', 'utf8').toString('base64')
      }),
    /must not contain a configured secret/
  );
});

test('secret redaction preserves case sensitivity outside percent escape digits', () => {
  const redactor = createSecretRedactor(['Case-Sensitive-Secret']);
  assert.equal(redactor.containsSecret('case-sensitive-secret'), false);
  assert.equal(redactor.redact('case-sensitive-secret'), 'case-sensitive-secret');
});

test('bounded text is redacted before UTF-8-safe truncation', () => {
  const redactor = createSecretRedactor(['high-risk-secret']);
  const capture = captureBoundedText(`start high-risk-secret ${'🙂'.repeat(30)}`, {
    redactor,
    maxBytes: 48
  });

  assert.equal(capture.originalBytes, 143);
  assert.ok(capture.retainedBytes <= 48);
  assert.equal(capture.truncated, true);
  assert.match(capture.text, /\[REDACTED\]/);
  assert.doesNotMatch(capture.text, /high-risk-secret/);
  assert.equal(Buffer.from(capture.text, 'utf8').toString('utf8'), capture.text);
});

test('bounded text rejects unbounded or invalid capture limits', () => {
  const redactor = createSecretRedactor(['high-risk-secret']);
  for (const maxBytes of [0, -1, 262_145, Number.POSITIVE_INFINITY]) {
    assert.throws(() => captureBoundedText('text', { redactor, maxBytes }), /between 1 and 262144/);
  }
});

test('bounded text does not introduce a replacement character at a UTF-8 truncation boundary', () => {
  const redactor = createSecretRedactor(['high-risk-secret']);
  const capture = captureBoundedText('🙂'.repeat(10), { redactor, maxBytes: 21 });

  assert.equal(capture.truncated, true);
  assert.doesNotMatch(capture.text, /�/);
  assert.ok(capture.retainedBytes <= 21);
});

test('private JSON manifests are exclusive, complete, and mode 0600', async () => {
  await withTemporaryDirectory(async (directory) => {
    const manifestPath = path.join(directory, 'nested', 'manifest.json');
    await writePrivateJsonManifest({
      filePath: manifestPath,
      value: { schemaVersion: 1, result: 'pass' },
      nonce: 'first-write'
    });

    assert.equal(
      await readFile(manifestPath, 'utf8'),
      '{\n  "schemaVersion": 1,\n  "result": "pass"\n}\n'
    );
    assert.equal((await stat(manifestPath)).mode & 0o777, 0o600);
    await assert.rejects(
      writePrivateJsonManifest({
        filePath: manifestPath,
        value: { schemaVersion: 1, result: 'overwrite' },
        nonce: 'second-write'
      }),
      { code: 'EEXIST' }
    );
    assert.equal(JSON.parse(await readFile(manifestPath, 'utf8')).result, 'pass');
  });
});

test('private JSON manifests reject non-serializable root values', async () => {
  await withTemporaryDirectory(async (directory) => {
    await assert.rejects(
      writePrivateJsonManifest({
        filePath: path.join(directory, 'manifest.json'),
        value: undefined,
        nonce: 'undefined-value'
      }),
      /manifest value must be JSON serializable/
    );
  });
});

test('restricted cleanup removes only the validated raw tree', async () => {
  await withTemporaryDirectory(async (artifactRoot) => {
    const layout = await initializeScenarioEvidence({
      artifactRoot,
      runId: 'run-1',
      scenarioId: 'scenario-1'
    });
    await writeFile(path.join(layout.restrictedDir, 'secret.txt'), 'do not retain');
    await writeFile(path.join(layout.safeUploadDir, 'result.json'), '{}');

    await cleanupRestrictedEvidence(layout);

    await assert.rejects(stat(layout.restrictedDir), { code: 'ENOENT' });
    assert.equal(await readFile(path.join(layout.safeUploadDir, 'result.json'), 'utf8'), '{}');
    await assert.rejects(
      cleanupRestrictedEvidence({ ...layout, restrictedDir: layout.safeUploadDir }),
      /restricted evidence path does not match the initialized layout/
    );
  });
});
