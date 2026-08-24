import assert from 'node:assert/strict';

const SAFE_ID = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const MANIFEST_FIELDS = new Set([
  'schemaVersion',
  'runId',
  'composeProject',
  'gatewayEndpoint',
  'expectedOriginInstanceId'
]);

const requireSafeId = (value, field) => {
  assert.equal(typeof value, 'string', `${field} must be a string`);
  assert.match(value, SAFE_ID, `${field} must be a bounded lowercase ASCII identifier`);
  return value;
};

const isLoopbackHost = (host) => host === '127.0.0.1' || host === '::1';

export function createNativeE2ERunIdentity({ nonce, processId }) {
  assert.equal(typeof nonce, 'string', 'nonce must be a string');
  assert.ok(Number.isSafeInteger(processId) && processId > 0, 'processId must be positive');
  const normalizedNonce = nonce
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/g, '');
  assert.notEqual(normalizedNonce, '', 'nonce must contain an ASCII letter or digit');
  const runId = `waves-e2e-${normalizedNonce}-${processId}`;
  requireSafeId(runId, 'runId');
  return { runId, composeProject: runId };
}

export function parseComposePublishedPort(value, protocol) {
  assert.ok(protocol === 'tcp' || protocol === 'udp', 'protocol must be tcp or udp');
  assert.equal(typeof value, 'string', 'published binding must be a string');
  const match = /^(?:\[([^\]]+)\]|([^:]+)):(\d+)$/.exec(value.trim());
  assert.ok(match, 'published binding must contain a host and assigned port');
  const host = match[1] ?? match[2];
  assert.ok(isLoopbackHost(host), 'published binding must use an explicit loopback address');
  const port = Number.parseInt(match[3], 10);
  assert.ok(port > 0 && port <= 65_535, 'published binding must contain an assigned port');
  return { host, port, protocol };
}

export function buildNativeE2EManifest({
  runId,
  composeProject,
  gatewayBinding,
  originInstanceId
}) {
  requireSafeId(runId, 'runId');
  requireSafeId(composeProject, 'composeProject');
  assert.equal(composeProject, runId, 'composeProject must match runId');
  assert.equal(gatewayBinding?.protocol, 'udp', 'gateway binding must use udp');
  assert.ok(isLoopbackHost(gatewayBinding.host), 'gateway binding must use loopback');
  assert.ok(
    Number.isSafeInteger(gatewayBinding.port) && gatewayBinding.port > 0 && gatewayBinding.port <= 65_535,
    'gateway binding must contain an assigned port'
  );
  requireSafeId(originInstanceId, 'originInstanceId');
  const host = gatewayBinding.host === '::1' ? '[::1]' : gatewayBinding.host;
  return validateNativeE2EManifest({
    schemaVersion: 1,
    runId,
    composeProject,
    gatewayEndpoint: `wap://${host}:${gatewayBinding.port}`,
    expectedOriginInstanceId: originInstanceId
  });
}

export function validateNativeE2EManifest(manifest) {
  assert.ok(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'manifest must be an object');
  for (const field of Object.keys(manifest)) {
    assert.ok(MANIFEST_FIELDS.has(field), `manifest contains unexpected field: ${field}`);
  }
  for (const field of MANIFEST_FIELDS) {
    assert.ok(Object.hasOwn(manifest, field), `manifest is missing ${field}`);
  }
  assert.equal(manifest.schemaVersion, 1, 'manifest schemaVersion must be 1');
  requireSafeId(manifest.runId, 'runId');
  requireSafeId(manifest.composeProject, 'composeProject');
  assert.equal(manifest.composeProject, manifest.runId, 'composeProject must match runId');
  requireSafeId(manifest.expectedOriginInstanceId, 'expectedOriginInstanceId');

  const endpoint = new URL(manifest.gatewayEndpoint);
  assert.equal(endpoint.protocol, 'wap:', 'gatewayEndpoint must use wap://');
  assert.ok(isLoopbackHost(endpoint.hostname), 'gatewayEndpoint must use loopback');
  assert.notEqual(endpoint.port, '', 'gatewayEndpoint must contain an assigned port');
  assert.ok(Number(endpoint.port) > 0, 'gatewayEndpoint must contain an assigned port');
  assert.equal(endpoint.username, '', 'gatewayEndpoint must not contain credentials');
  assert.equal(endpoint.password, '', 'gatewayEndpoint must not contain credentials');
  assert.ok(endpoint.pathname === '' || endpoint.pathname === '/', 'gatewayEndpoint must not contain a path');
  assert.equal(endpoint.search, '', 'gatewayEndpoint must not contain a query');
  assert.equal(endpoint.hash, '', 'gatewayEndpoint must not contain a fragment');

  return {
    schemaVersion: 1,
    runId: manifest.runId,
    composeProject: manifest.composeProject,
    gatewayEndpoint: endpoint.href.replace(/\/$/, ''),
    expectedOriginInstanceId: manifest.expectedOriginInstanceId
  };
}
