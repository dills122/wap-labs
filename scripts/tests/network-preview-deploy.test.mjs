import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

const compose = read('deploy/network-preview/compose.yaml');
const firewall = read('deploy/network-preview/bin/waves-docker-firewall');
const installer = read('deploy/network-preview/bin/install-release');
const kannel = read('docker/kannel/production/kannel.conf.tmpl');
const kannelDockerfile = read('docker/kannel/Dockerfile');
const wmlDockerfile = read('wml-server/Dockerfile');
const buildRelease = read('scripts/build-network-preview-release.sh');
const dns = read('infra/network-preview/environments/preview/dns.tf');

test('production Compose exposes only connectionless WAP and isolates the origin network', () => {
  assert.match(compose, /published: ['"]9200['"][\s\S]*?protocol: udp/);
  for (const forbiddenPort of ['13000', '13002', '9201', '3000:3000', '3001:3001']) {
    assert.doesNotMatch(compose, new RegExp(`published: "${forbiddenPort}"|-${forbiddenPort}:`));
  }
  assert.match(compose, /networks:[\s\S]*?edge:[\s\S]*?origin:[\s\S]*?internal: true/);
  assert.doesNotMatch(compose, /^\s*build:/m);
  assert.match(compose, /pull_policy: never/g);
});

test('both production containers have the expected confinement and resource controls', () => {
  assert.equal((compose.match(/read_only: true/g) ?? []).length, 2);
  assert.equal((compose.match(/no-new-privileges:true/g) ?? []).length, 2);
  assert.equal((compose.match(/cap_drop:\n\s+- ALL/g) ?? []).length, 2);
  assert.equal((compose.match(/pids_limit:/g) ?? []).length, 2);
  assert.equal((compose.match(/mem_limit:/g) ?? []).length, 2);
  assert.equal((compose.match(/healthcheck:/g) ?? []).length, 2);
});

test('production image inputs and runtime identities are immutable and non-root', () => {
  assert.equal(
    (
      kannelDockerfile.match(
        /FROM ubuntu:22\.04@sha256:0e0a0fc6d18feda9db1590da249ac93e8d5abfea8f4c3c0c849ce512b5ef8982/g
      ) ?? []
    ).length,
    2
  );
  assert.match(kannelDockerfile, /FROM runtime-base AS production[\s\S]*USER 10001:10001/);
  assert.match(wmlDockerfile, /FROM golang:1\.25-alpine@sha256:[0-9a-f]{64} AS build/);
  assert.match(wmlDockerfile, /FROM scratch[\s\S]*USER 65532:65532/);
});

test('production Kannel maps only approved public hosts and explicit private smoke aliases', () => {
  for (const hostname of [
    'home.wap.shrimpworks.dev',
    'forms.wap.shrimpworks.dev',
    'interop.wap.shrimpworks.dev'
  ]) {
    assert.match(kannel, new RegExp(`http://${hostname.replaceAll('.', '\\.')}/\\*`));
  }
  assert.match(kannel, /http:\/\/localhost:13002\/\*/);
  assert.match(kannel, /http:\/\/127\.0\.0\.1:13002\/\*/);
  assert.match(kannel, /http:\/\/waves-network-preview\/\*/);
  const publicInteropIndex = kannel.indexOf('name = lab_interop');
  const denyHTTPIndex = kannel.indexOf('name = deny_unmapped_http');
  const denyHTTPSIndex = kannel.indexOf('name = deny_unmapped_https');
  assert.ok(publicInteropIndex >= 0 && denyHTTPIndex > publicInteropIndex);
  assert.ok(denyHTTPSIndex > denyHTTPIndex);
  assert.match(
    kannel,
    /url = "http:\/\/\*"[\s\S]*map-url = "http:\/\/wml-origin:3000\/__lab\/denied"/
  );
  assert.match(
    kannel,
    /url = "https:\/\/\*"[\s\S]*map-url = "http:\/\/wml-origin:3000\/__lab\/denied"/
  );
  assert.doesNotMatch(kannel, /changeme|http:\/\/wap\/\*|http:\/\/10\.0\.2\.2/);
  assert.match(kannel, /admin-deny-ip = "\*\.\*\.\*\.\*"/);
  assert.match(kannel, /admin-allow-ip = "127\.0\.0\.1"/);
  const entrypoint = read('docker/kannel/production/entrypoint.sh');
  const healthcheck = read('docker/kannel/production/healthcheck.sh');
  assert.match(entrypoint, /bearerbox -v 1/);
  assert.match(entrypoint, /wapbox -v 1/);
  assert.doesNotMatch(healthcheck, /password|secret/);
});

test('Docker forwarding remains sealed by default and public mode is rate limited to UDP 9200', () => {
  assert.match(firewall, /mode=sealed/);
  assert.match(firewall, /sealed \| public/);
  assert.equal((firewall.match(/sed -n '\/\^\-A \/ \{ p; q; \}'/g) ?? []).length, 2);
  assert.match(
    firewall,
    /if \[ "\$mode" = public \]; then[\s\S]*--dport 9200[\s\S]*--hashlimit-upto/
  );
  assert.match(firewall, /-m limit --limit/);
  assert.match(firewall, /tailnet_interface=\$\{WAVES_TAILNET_INTERFACE:-tailscale0\}/);
  assert.match(firewall, /-i %s -p udp --dport 9200 -j RETURN/);
  assert.ok((firewall.match(/-i %s -j DROP/g) ?? []).length >= 2);
  assert.match(firewall, /-o br\+ -j DROP/);
  assert.match(firewall, /-i br\+ -j DROP/);
  assert.doesNotMatch(firewall, /curl|wget|github\.com/);
});

test('release installation verifies provenance and reseals before restarting services', () => {
  assert.match(installer, /release archive SHA-256 mismatch/);
  assert.match(installer, /docker image save --output "\$verification_archive" "\$image"/);
  assert.match(installer, /saved \$label image does not reference the release config digest/);
  assert.match(installer, /loaded \$label image is not Linux AMD64/);
  const sealIndex = installer.indexOf('waves-docker-firewall set sealed');
  const restartIndex = installer.indexOf('systemctl restart waves-network-preview.service');
  assert.ok(sealIndex >= 0 && restartIndex > sealIndex);
});

test('release builds require scanning, SBOMs, exact images, and a clean commit', () => {
  assert.match(buildRelease, /status --porcelain/);
  assert.equal((buildRelease.match(/grype "\$/g) ?? []).length, 2);
  assert.equal((buildRelease.match(/syft "\$/g) ?? []).length, 2);
  assert.match(buildRelease, /docker image inspect --format '\{\{\.Id\}\}'/);
  assert.doesNotMatch(buildRelease, /--push|docker login/);
});

test('staged DNS contains only the approved exact DNS-only WAP hostnames', () => {
  for (const hostname of [
    'home.wap.shrimpworks.dev',
    'forms.wap.shrimpworks.dev',
    'interop.wap.shrimpworks.dev'
  ]) {
    assert.match(dns, new RegExp(`"${hostname.replaceAll('.', '\\.')}"`));
  }
  assert.doesNotMatch(dns, /"(?:home|forms|interop)\.shrimpworks\.dev"/);
  assert.match(dns, /proxied\s+=\s+false/);
});
