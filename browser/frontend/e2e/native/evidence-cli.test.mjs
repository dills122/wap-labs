import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { initializeScenarioEvidence } from './evidence.mjs';
import { constructSafeEvidenceBundle } from './evidence-publisher.mjs';

const cli = fileURLToPath(new URL('./evidence-cli.mjs', import.meta.url));

const safeResult = {
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

test('ensure-run-failure returns failure when it must synthesize infrastructure evidence', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'waves-evidence-cli-'));
  try {
    const result = spawnSync('node', [cli, 'ensure-run-failure', root, 'run-1'], {
      encoding: 'utf8'
    });
    assert.equal(result.status, 1);
    assert.equal(result.stderr, '');
    assert.match(result.stdout, /safe failure bundle available/);

    const validated = spawnSync('node', [cli, 'validate-root', root], { encoding: 'utf8' });
    assert.equal(validated.status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ensure-run-failure preserves success when a valid normal bundle already exists', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'waves-evidence-cli-'));
  try {
    const layout = await initializeScenarioEvidence({
      artifactRoot: root,
      runId: 'run-1',
      scenarioId: 'BOOT-NATIVE-001'
    });
    await constructSafeEvidenceBundle({
      layout,
      secrets: ['changeme'],
      payloads: [{ fileName: 'result.json', value: safeResult }]
    });

    const result = spawnSync('node', [cli, 'ensure-run-failure', root, 'run-1'], {
      encoding: 'utf8'
    });
    assert.equal(result.status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
