import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sensitiveKannelPorts = [13000, 13002];

function renderComposeConfig() {
  const result = spawnSync('docker', ['compose', 'config', '--format', 'json'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    shell: false
  });

  assert.equal(
    result.status,
    0,
    `docker compose config failed: ${(result.stderr ?? result.error?.message ?? '').trim()}`
  );
  return JSON.parse(result.stdout);
}

test('local Kannel admin and wapbox publications are IPv4 loopback-only', () => {
  const config = renderComposeConfig();
  const kannelPorts = config.services?.kannel?.ports;

  assert.ok(Array.isArray(kannelPorts), 'rendered Compose config must publish Kannel ports');

  for (const target of sensitiveKannelPorts) {
    const publications = kannelPorts.filter((port) => Number(port.target) === target);
    assert.equal(publications.length, 1, `Kannel port ${target} must have one publication`);
    assert.equal(
      publications[0].host_ip,
      '127.0.0.1',
      `Kannel port ${target} must publish explicitly on 127.0.0.1`
    );
    assert.equal(
      String(publications[0].published),
      String(target),
      `Kannel port ${target} must remain available on the matching loopback port`
    );
    assert.equal(publications[0].protocol, 'tcp');
  }

  for (const [serviceName, service] of Object.entries(config.services ?? {})) {
    for (const publication of service.ports ?? []) {
      if (sensitiveKannelPorts.includes(Number(publication.target))) {
        assert.equal(
          publication.host_ip,
          '127.0.0.1',
          `${serviceName} target port ${publication.target} must not publish beyond loopback`
        );
      }
    }
  }
});
