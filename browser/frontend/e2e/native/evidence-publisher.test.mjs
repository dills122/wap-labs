import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { initializeScenarioEvidence } from './evidence.mjs';
import {
  constructSafeEvidenceBundle,
  constructStaticOwnershipFailureBundle,
  constructStaticRunFailureBundle,
  validateSafeEvidenceBundle,
  validateSafeEvidenceRoot
} from './evidence-publisher.mjs';

async function withLayout(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'waves-publisher-'));
  try {
    const layout = await initializeScenarioEvidence({
      artifactRoot: root,
      runId: 'run-1',
      scenarioId: 'AUTH-NATIVE-001A'
    });
    await callback(layout, root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function safeResultFixture() {
  return {
    schemaVersion: 1,
    scenarioId: 'BOOT-NATIVE-001',
    suite: 'smoke',
    result: 'pass',
    durationMs: 25,
    lastObservation: null,
    checkpoints: [],
    failureClass: null,
    cleanup: { result: 'closed' },
    assertions: [{ name: 'native startup', result: 'pass' }]
  };
}

test('safe publisher constructs and validates an exact digest manifest', async () => {
  await withLayout(async (layout) => {
    await writeFile(path.join(layout.restrictedDir, 'driver.log'), 'bounded output');
    assert.deepEqual(
      await constructSafeEvidenceBundle({
        layout,
        secrets: ['4927'],
        payloads: [{ fileName: 'result.json', value: safeResultFixture() }]
      }),
      { ok: true, mode: 'normal' }
    );
    const validated = await validateSafeEvidenceBundle({ safeUploadDir: layout.safeUploadDir });
    assert.deepEqual(validated.files, ['bundle-manifest.json', 'result.json']);
  });
});

test('root validator finds only exact safe-upload bundles and requires at least one', async () => {
  await withLayout(async (layout, root) => {
    await constructSafeEvidenceBundle({
      layout,
      secrets: ['4927'],
      payloads: [{ fileName: 'result.json', value: safeResultFixture() }]
    });
    assert.deepEqual(await validateSafeEvidenceRoot({ artifactRoot: root }), { bundles: 1 });
  });
  const empty = await mkdtemp(path.join(os.tmpdir(), 'waves-publisher-empty-'));
  try {
    await assert.rejects(validateSafeEvidenceRoot({ artifactRoot: empty }), /no bundles/);
  } finally {
    await rm(empty, { recursive: true, force: true });
  }
});

test('root validator accepts the workflow outer root around one shell artifact directory', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'waves-publisher-workflow-'));
  try {
    const layout = await initializeScenarioEvidence({
      artifactRoot: path.join(root, 'run.ABC123'),
      runId: 'waves-e2e-run-1',
      scenarioId: 'AUTH-NATIVE-001A'
    });
    await constructSafeEvidenceBundle({
      layout,
      secrets: ['4927'],
      payloads: [{ fileName: 'result.json', value: safeResultFixture() }]
    });

    assert.deepEqual(await validateSafeEvidenceRoot({ artifactRoot: root }), { bundles: 1 });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('root validator rejects a safe-upload tree nested under raw evidence', async () => {
  await withLayout(async (layout, root) => {
    await constructSafeEvidenceBundle({
      layout,
      secrets: ['4927'],
      payloads: [{ fileName: 'result.json', value: safeResultFixture() }]
    });
    const bypass = path.join(root, 'run-1', 'raw', 'safe-upload');
    await mkdir(bypass, { recursive: true });
    await writeFile(path.join(bypass, 'secret.log'), 'credential=TOPSECRET');
    await assert.rejects(
      validateSafeEvidenceRoot({ artifactRoot: root }),
      /exact run\/scenario layout/
    );
  });
});

test('pre-scenario infrastructure failure emits one static secret-free bundle', async () => {
  await withLayout(async (layout, root) => {
    await writeFile(path.join(layout.restrictedDir, 'untrusted.log'), 'must-not-survive');
    assert.deepEqual(await constructStaticRunFailureBundle({ layout }), {
      ok: false,
      mode: 'run-failure'
    });
    assert.deepEqual(await validateSafeEvidenceRoot({ artifactRoot: root }), { bundles: 1 });
    assert.deepEqual(
      JSON.parse(await readFile(path.join(layout.safeUploadDir, 'run-failure.json'), 'utf8')),
      { schemaVersion: 1, mode: 'run-failure', result: 'fail', phase: 'infrastructure' }
    );
    await assert.rejects(readFile(layout.restrictedDir), /ENOENT|EISDIR/);
  });
});

test('unresolved ownership emits a static safe failure without deleting active restricted files', async () => {
  await withLayout(async (layout, root) => {
    const restrictedFile = path.join(layout.restrictedDir, 'active-driver.log');
    await writeFile(restrictedFile, 'still owned by the active process');

    assert.deepEqual(await constructStaticOwnershipFailureBundle({ layout }), {
      ok: false,
      mode: 'run-failure'
    });
    assert.equal(await readFile(restrictedFile, 'utf8'), 'still owned by the active process');
    assert.deepEqual(
      JSON.parse(await readFile(path.join(layout.safeUploadDir, 'run-failure.json'), 'utf8')),
      { schemaVersion: 1, mode: 'run-failure', result: 'fail', phase: 'ownership' }
    );
    assert.deepEqual(await validateSafeEvidenceRoot({ artifactRoot: root }), { bundles: 1 });
  });
});

for (const [name, writeCanary] of [
  [
    'plaintext',
    async (layout) => writeFile(path.join(layout.restrictedDir, 'driver.log'), 'PIN=4927')
  ],
  [
    'encoded',
    async (layout) => writeFile(path.join(layout.restrictedDir, 'driver.log'), 'PIN=NDkyNw==')
  ],
  ['filename', async (layout) => writeFile(path.join(layout.restrictedDir, '4927.log'), 'x')],
  [
    'symlink',
    async (layout, root) => {
      const outside = path.join(root, 'outside.txt');
      await writeFile(outside, 'x');
      await symlink(outside, path.join(layout.restrictedDir, 'linked.log'));
    }
  ]
]) {
  test(`safe publisher fails closed for a ${name} canary`, async () => {
    await withLayout(async (layout, root) => {
      await writeCanary(layout, root);
      const result = await constructSafeEvidenceBundle({
        layout,
        secrets: ['4927'],
        payloads: [{ fileName: 'result.json', value: safeResultFixture() }]
      });
      assert.deepEqual(result, { ok: false, mode: 'sanitizer-failure' });
      assert.deepEqual(
        JSON.parse(
          await readFile(path.join(layout.safeUploadDir, 'sanitizer-failure.json'), 'utf8')
        ),
        { schemaVersion: 1, mode: 'sanitizer-failure', result: 'fail' }
      );
      await assert.rejects(readFile(layout.restrictedDir), /ENOENT|EISDIR/);
    });
  });
}

test('safe publisher rejects a secret in a supposedly safe structured payload', async () => {
  await withLayout(async (layout) => {
    const result = await constructSafeEvidenceBundle({
      layout,
      secrets: ['4927'],
      payloads: [{ fileName: 'result.json', value: { pin: '4927' } }]
    });
    assert.equal(result.ok, false);
  });
});

test('normal publisher rejects every reserved static or manifest file name', async () => {
  for (const fileName of ['bundle-manifest.json', 'sanitizer-failure.json', 'run-failure.json']) {
    await withLayout(async (layout) => {
      assert.deepEqual(
        await constructSafeEvidenceBundle({
          layout,
          secrets: ['4927'],
          payloads: [{ fileName, value: safeResultFixture() }]
        }),
        { ok: false, mode: 'sanitizer-failure' }
      );
    });
  }
});

test('validator rejects malformed manifests and mutated bundle entries', async () => {
  for (const mutation of [
    'missing',
    'extra',
    'digest',
    'symlink',
    'manifest-extra',
    'entry-extra',
    'reserved-entry',
    'result-extra',
    'alternate-entry',
    'duplicate-result',
    'duplicate-manifest'
  ]) {
    await withLayout(async (layout, root) => {
      await constructSafeEvidenceBundle({
        layout,
        secrets: ['4927'],
        payloads: [{ fileName: 'result.json', value: safeResultFixture() }]
      });
      if (mutation === 'missing') await rm(path.join(layout.safeUploadDir, 'result.json'));
      if (mutation === 'extra')
        await writeFile(path.join(layout.safeUploadDir, 'extra.json'), '{}');
      if (mutation === 'digest')
        await writeFile(path.join(layout.safeUploadDir, 'result.json'), '{}');
      if (
        mutation.startsWith('manifest') ||
        mutation === 'entry-extra' ||
        mutation === 'reserved-entry' ||
        mutation === 'result-extra' ||
        mutation === 'alternate-entry' ||
        mutation === 'duplicate-result' ||
        mutation === 'duplicate-manifest'
      ) {
        const manifestPath = path.join(layout.safeUploadDir, 'bundle-manifest.json');
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
        if (mutation === 'manifest-extra') manifest.debug = { exception: 'must-not-upload' };
        if (mutation === 'entry-extra') manifest.files[0].exception = 'must-not-upload';
        if (mutation === 'reserved-entry') manifest.files[0].fileName = 'run-failure.json';
        if (mutation === 'alternate-entry') {
          await rename(
            path.join(layout.safeUploadDir, 'result.json'),
            path.join(layout.safeUploadDir, 'debug.log')
          );
          manifest.files[0].fileName = 'debug.log';
        }
        if (mutation === 'result-extra' || mutation === 'duplicate-result') {
          const resultPath = path.join(layout.safeUploadDir, 'result.json');
          const result = JSON.parse(await readFile(resultPath, 'utf8'));
          let body;
          if (mutation === 'result-extra') {
            result.exception = 'must-not-upload';
            body = `${JSON.stringify(result, null, 2)}\n`;
          } else {
            body = `${JSON.stringify(result, null, 2)}\n`.replace(
              '  "scenarioId": "BOOT-NATIVE-001",',
              '  "scenarioId": "TOPSECRET",\n  "scenarioId": "BOOT-NATIVE-001",'
            );
          }
          await writeFile(resultPath, body);
          manifest.files[0].bytes = Buffer.byteLength(body);
          manifest.files[0].sha256 = crypto.createHash('sha256').update(body).digest('hex');
        }
        let manifestBody = `${JSON.stringify(manifest, null, 2)}\n`;
        if (mutation === 'duplicate-manifest') {
          manifestBody = manifestBody.replace(
            '  "mode": "normal",',
            '  "mode": "TOPSECRET",\n  "mode": "normal",'
          );
        }
        await writeFile(manifestPath, manifestBody);
      }
      if (mutation === 'symlink') {
        await rm(path.join(layout.safeUploadDir, 'result.json'));
        await mkdir(path.join(root, 'outside'));
        const outside = path.join(root, 'outside', 'result.json');
        await writeFile(outside, '{}');
        await symlink(outside, path.join(layout.safeUploadDir, 'result.json'));
      }
      await assert.rejects(
        validateSafeEvidenceBundle({ safeUploadDir: layout.safeUploadDir }),
        /evidence|digest|exact|symbolic|regular|schema|canonical/i
      );
    });
  }
});

test('static failure validator rejects non-canonical duplicate-key JSON bytes', async () => {
  await withLayout(async (layout) => {
    await constructStaticRunFailureBundle({ layout });
    const failurePath = path.join(layout.safeUploadDir, 'run-failure.json');
    const body = await readFile(failurePath, 'utf8');
    await writeFile(
      failurePath,
      body.replace(
        '  "phase": "infrastructure"',
        '  "phase": "TOPSECRET",\n  "phase": "infrastructure"'
      )
    );
    await assert.rejects(
      validateSafeEvidenceBundle({ safeUploadDir: layout.safeUploadDir }),
      /canonical/
    );
  });
});
