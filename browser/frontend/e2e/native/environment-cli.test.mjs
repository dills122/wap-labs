import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const cli = 'browser/frontend/e2e/native/environment-cli.mjs';

test('environment CLI emits one validated run identity', () => {
  const result = spawnSync('node', [cli, 'run-id', 'ABC_123', '42'], { encoding: 'utf8' });

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'waves-e2e-abc-123-42\n');
  assert.equal(result.stderr, '');
});

test('environment CLI rejects unsafe published endpoints', () => {
  const result = spawnSync('node', [cli, 'url', 'http', 'tcp', '0.0.0.0:49152'], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'native-e2e-environment: CONFIG ERROR\n');
});

test('environment CLI writes an exclusive mode-0600 validated manifest', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'waves-environment-cli-'));
  const output = path.join(directory, 'routing.json');
  try {
    const result = spawnSync(
      'node',
      [
        cli,
        'write-manifest',
        output,
        'waves-e2e-run-7',
        'waves-e2e-run-7',
        '127.0.0.1:49152',
        'origin-run-7'
      ],
      { encoding: 'utf8' }
    );

    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
    assert.deepEqual(JSON.parse(readFileSync(output, 'utf8')), {
      schemaVersion: 1,
      runId: 'waves-e2e-run-7',
      composeProject: 'waves-e2e-run-7',
      gatewayEndpoint: 'wap://127.0.0.1:49152',
      expectedOriginInstanceId: 'origin-run-7'
    });
    assert.equal(statSync(output).mode & 0o777, 0o600);

    const duplicate = spawnSync(
      'node',
      [
        cli,
        'write-manifest',
        output,
        'waves-e2e-run-7',
        'waves-e2e-run-7',
        '127.0.0.1:49152',
        'origin-run-7'
      ],
      { encoding: 'utf8' }
    );
    assert.equal(duplicate.status, 2);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
