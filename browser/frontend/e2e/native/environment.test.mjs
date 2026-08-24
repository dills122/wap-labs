import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildNativeE2EManifest,
  createNativeE2ERunIdentity,
  parseComposePublishedPort,
  validateNativeE2EManifest
} from './environment.mjs';

test('native E2E run identities are bounded and safe for Compose and paths', () => {
  const identity = createNativeE2ERunIdentity({
    nonce: 'ABC_123',
    processId: 42
  });

  assert.deepEqual(identity, {
    runId: 'waves-e2e-abc-123-42',
    composeProject: 'waves-e2e-abc-123-42'
  });
});

test('native E2E run identities reject a nonce with no safe characters', () => {
  assert.throws(
    () => createNativeE2ERunIdentity({ nonce: '___', processId: 42 }),
    /nonce must contain an ASCII letter or digit/
  );
});

test('Compose port parsing accepts only an assigned IPv4 loopback binding', () => {
  assert.deepEqual(parseComposePublishedPort('127.0.0.1:49152', 'udp'), {
    host: '127.0.0.1',
    port: 49152,
    protocol: 'udp'
  });
});

test('Compose port parsing accepts a bracketed IPv6 loopback binding', () => {
  assert.deepEqual(parseComposePublishedPort('[::1]:49153', 'tcp'), {
    host: '::1',
    port: 49153,
    protocol: 'tcp'
  });
});

for (const published of ['0.0.0.0:49152', '[::]:49152', '127.0.0.1:0', 'localhost:49152']) {
  test(`Compose port parsing rejects unsafe binding ${published}`, () => {
    assert.throws(() => parseComposePublishedPort(published, 'tcp'), /loopback|assigned port/);
  });
}

test('runtime manifest binds the owned project, physical endpoint, and origin instance', () => {
  const manifest = buildNativeE2EManifest({
    runId: 'waves-e2e-run-7',
    composeProject: 'waves-e2e-run-7',
    gatewayBinding: { host: '127.0.0.1', port: 49152, protocol: 'udp' },
    originInstanceId: 'origin-run-7'
  });

  assert.deepEqual(manifest, {
    schemaVersion: 1,
    runId: 'waves-e2e-run-7',
    composeProject: 'waves-e2e-run-7',
    gatewayEndpoint: 'wap://127.0.0.1:49152',
    expectedOriginInstanceId: 'origin-run-7'
  });
  assert.deepEqual(validateNativeE2EManifest(manifest), manifest);
});

test('runtime manifest validation rejects missing, extra, non-loopback, and mismatched values', () => {
  const valid = {
    schemaVersion: 1,
    runId: 'waves-e2e-run-7',
    composeProject: 'waves-e2e-run-7',
    gatewayEndpoint: 'wap://127.0.0.1:49152',
    expectedOriginInstanceId: 'origin-run-7'
  };

  assert.throws(
    () => validateNativeE2EManifest({ ...valid, gatewayEndpoint: 'wap://0.0.0.0:49152' }),
    /loopback/
  );
  assert.throws(
    () => validateNativeE2EManifest({ ...valid, composeProject: 'another-project' }),
    /must match runId/
  );
  assert.throws(
    () => validateNativeE2EManifest({ ...valid, unexpected: true }),
    /unexpected field/
  );
  const { expectedOriginInstanceId: _omitted, ...missingOrigin } = valid;
  assert.throws(() => validateNativeE2EManifest(missingOrigin), /expectedOriginInstanceId/);
});
