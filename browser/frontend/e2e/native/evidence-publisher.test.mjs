import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { initializeScenarioEvidence } from './evidence.mjs';
import {
  constructSafeEvidenceBundle,
  validateSafeEvidenceBundle,
  validateSafeEvidenceRoot
} from './evidence-publisher.mjs';

async function withLayout(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'waves-publisher-'));
  try {
    const layout = await initializeScenarioEvidence({
      artifactRoot: root, runId: 'run-1', scenarioId: 'AUTH-NATIVE-001A'
    });
    await callback(layout, root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('safe publisher constructs and validates an exact digest manifest', async () => {
  await withLayout(async (layout) => {
    await writeFile(path.join(layout.restrictedDir, 'driver.log'), 'bounded output');
    assert.deepEqual(await constructSafeEvidenceBundle({
      layout,
      secrets: ['4927'],
      payloads: [{ fileName: 'result.json', value: { result: 'pass' } }]
    }), { ok: true, mode: 'normal' });
    const validated = await validateSafeEvidenceBundle({ safeUploadDir: layout.safeUploadDir });
    assert.deepEqual(validated.files, ['bundle-manifest.json', 'result.json']);
  });
});

test('root validator finds only exact safe-upload bundles and requires at least one', async () => {
  await withLayout(async (layout, root) => {
    await constructSafeEvidenceBundle({
      layout, secrets: ['4927'], payloads: [{ fileName: 'result.json', value: { result: 'pass' } }]
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

for (const [name, writeCanary] of [
  ['plaintext', async (layout) => writeFile(path.join(layout.restrictedDir, 'driver.log'), 'PIN=4927')],
  ['encoded', async (layout) => writeFile(path.join(layout.restrictedDir, 'driver.log'), 'PIN=NDkyNw==')],
  ['filename', async (layout) => writeFile(path.join(layout.restrictedDir, '4927.log'), 'x')],
  ['symlink', async (layout, root) => {
    const outside = path.join(root, 'outside.txt');
    await writeFile(outside, 'x');
    await symlink(outside, path.join(layout.restrictedDir, 'linked.log'));
  }]
]) {
  test(`safe publisher fails closed for a ${name} canary`, async () => {
    await withLayout(async (layout, root) => {
      await writeCanary(layout, root);
      const result = await constructSafeEvidenceBundle({
        layout, secrets: ['4927'], payloads: [{ fileName: 'result.json', value: { result: 'pass' } }]
      });
      assert.deepEqual(result, { ok: false, mode: 'sanitizer-failure' });
      assert.deepEqual(
        JSON.parse(await readFile(path.join(layout.safeUploadDir, 'sanitizer-failure.json'), 'utf8')),
        { schemaVersion: 1, mode: 'sanitizer-failure', result: 'fail' }
      );
      await assert.rejects(readFile(layout.restrictedDir), /ENOENT|EISDIR/);
    });
  });
}

test('safe publisher rejects a secret in a supposedly safe structured payload', async () => {
  await withLayout(async (layout) => {
    const result = await constructSafeEvidenceBundle({
      layout, secrets: ['4927'], payloads: [{ fileName: 'result.json', value: { pin: '4927' } }]
    });
    assert.equal(result.ok, false);
  });
});

test('validator rejects missing, extra, digest-mismatched, and symlinked bundle entries', async () => {
  for (const mutation of ['missing', 'extra', 'digest', 'symlink']) {
    await withLayout(async (layout, root) => {
      await constructSafeEvidenceBundle({
        layout, secrets: ['4927'], payloads: [{ fileName: 'result.json', value: { result: 'pass' } }]
      });
      if (mutation === 'missing') await rm(path.join(layout.safeUploadDir, 'result.json'));
      if (mutation === 'extra') await writeFile(path.join(layout.safeUploadDir, 'extra.json'), '{}');
      if (mutation === 'digest') await writeFile(path.join(layout.safeUploadDir, 'result.json'), '{}');
      if (mutation === 'symlink') {
        await rm(path.join(layout.safeUploadDir, 'result.json'));
        await mkdir(path.join(root, 'outside'));
        const outside = path.join(root, 'outside', 'result.json');
        await writeFile(outside, '{}');
        await symlink(outside, path.join(layout.safeUploadDir, 'result.json'));
      }
      await assert.rejects(
        validateSafeEvidenceBundle({ safeUploadDir: layout.safeUploadDir }),
        /evidence|digest|exact|symbolic|regular/i
      );
    });
  }
});
