import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scriptPath = 'scripts/native-tauri-kannel-e2e.sh';
const runnerPath = 'browser/frontend/scripts/native-tauri-kannel-e2e.mjs';
const source = fs.readFileSync(scriptPath, 'utf8');
const composeOverlaySource = fs.readFileSync('docker-compose.native-e2e.yml', 'utf8');
const workflowSource = fs.readFileSync('.github/workflows/native-tauri-kannel-e2e.yml', 'utf8');

test('native E2E rejects an invalid prebuilt-image mode before platform setup', () => {
  const result = spawnSync('sh', [scriptPath], {
    encoding: 'utf8',
    env: { ...process.env, NATIVE_E2E_PREBUILT_IMAGES: 'invalid' }
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /NATIVE_E2E_PREBUILT_IMAGES must be 0 or 1/);
});

test('native E2E keeps local builds as the default and CI prebuilt startup explicit', () => {
  assert.match(source, /NATIVE_E2E_PREBUILT_IMAGES="\$\{NATIVE_E2E_PREBUILT_IMAGES:-0\}"/);
  assert.match(
    source,
    /if \[ "\$\{NATIVE_E2E_PREBUILT_IMAGES\}" = 1 \]; then\s+compose_e2e up -d --no-build kannel wml-server\s+else\s+compose_e2e up -d --build kannel wml-server/s
  );
});

test('native E2E scopes every Compose operation to one project and overlay', () => {
  assert.match(source, /compose_e2e\(\) \{/);
  assert.ok(
    source.includes(`docker compose \\
    --project-name "\${COMPOSE_PROJECT}" \\
    --file "\${ROOT_DIR}/docker-compose.yml" \\
    --file "\${ROOT_DIR}/docker-compose.native-e2e.yml" \\
    "$@"`)
  );
  assert.doesNotMatch(source, /docker compose down/);
  assert.match(source, /compose_e2e down/);
  assert.match(source, /compose_e2e ps --all/);
  assert.match(source, /compose_e2e logs --no-color kannel wml-server/);
});

test('native E2E Compose resolution removes fixed names and uses dynamic loopback ports', () => {
  assert.match(composeOverlaySource, /container_name: !reset null/g);
  assert.match(composeOverlaySource, /ports: !override/g);
  assert.match(composeOverlaySource, /host_ip: 127\.0\.0\.1/g);
  assert.doesNotMatch(composeOverlaySource, /published:/);
  for (const target of ['3000', '3001', '13000', '9200']) {
    assert.match(composeOverlaySource, new RegExp(`target: ${target}`));
  }
  assert.match(composeOverlaySource, /WML_E2E_FIXTURE_MODE: "true"/);
});

test('native E2E discovers runtime ports and writes the immutable host routing manifest', () => {
  assert.match(source, /compose_e2e port kannel 9200 --protocol udp/);
  assert.match(source, /compose_e2e port kannel 13000 --protocol tcp/);
  assert.match(source, /compose_e2e port wml-server 3001 --protocol tcp/);
  assert.match(source, /compose_e2e port wml-server 3000 --protocol tcp/);
  assert.match(source, /node "\$\{ENVIRONMENT_CLI\}" write-manifest/);
  assert.match(source, /export WAVES_FETCH_ROUTING_MANIFEST/);
  assert.match(source, /export WML_ORIGIN_INSTANCE_ID/);
  assert.match(source, /export WML_PUBLIC_BASE/);
  assert.doesNotMatch(source, /export GATEWAY_HTTP_BASE/);
});

test('native E2E always creates a unique run child and isolated XDG roots', () => {
  assert.match(source, /mktemp -d "\$\{ARTIFACT_ROOT\}\/run\./);
  for (const variable of [
    'XDG_DATA_HOME',
    'XDG_CONFIG_HOME',
    'XDG_CACHE_HOME',
    'XDG_STATE_HOME',
    'XDG_RUNTIME_DIR'
  ]) {
    assert.match(source, new RegExp(`export ${variable}=`));
  }
});

test('native E2E cache records exact Tauri crate provenance without unsupported driver flags', () => {
  assert.match(workflowSource, /tauri-tools-root-v1-/);
  assert.match(workflowSource, /cargo install --list --root .*tauri-cli v\$\{TAURI_CLI_VERSION\}:/);
  assert.match(
    workflowSource,
    /cargo install --list --root .*tauri-driver v\$\{TAURI_DRIVER_VERSION\}:/
  );
  assert.match(workflowSource, /test -x "\$\(command -v tauri-driver\)"/);
  assert.doesNotMatch(workflowSource, /^\s*tauri-driver --version/m);
});

test('native E2E publishes an always-present advisory gate', () => {
  assert.doesNotMatch(workflowSource, /^ {4}paths:/m);
  assert.match(workflowSource, /^  classify-native-e2e:$/m);
  assert.match(workflowSource, /^  native-waves-e2e-gate:$/m);
  assert.match(workflowSource, /if: \$\{\{ always\(\) \}\}/);
  assert.match(workflowSource, /run: node scripts\/ci\/native-e2e-gate\.mjs/);
});

test('native E2E forces scheduled and manually dispatched runs through the classifier', () => {
  assert.match(workflowSource, /EVENT_NAME: \$\{\{ github\.event_name \}\}/);
  assert.match(workflowSource, /if \[ "\$\{EVENT_NAME\}" != "pull_request" \]/);
  assert.match(workflowSource, /selected=true/);
});

test('native E2E entrypoint lists scenarios without starting the platform provider', () => {
  const result = spawnSync('node', [runnerPath, '--list'], { encoding: 'utf8' });

  assert.equal(result.status, 0);
  assert.equal(result.stdout, [
    'BOOT-NATIVE-001\tsmoke\tCold native launch reaches network-ready state',
    'TRN-NATIVE-001\tsmoke\tGateway home deck renders through the native transport',
    'AUTH-NATIVE-001A\tsmoke\tRegistration preserves same-task final character before Enter',
    'AUTH-NATIVE-001B\tsmoke\tRegistration submits through ordinary WebDriver Enter',
    'AUTH-NATIVE-002A\tsmoke\tLogin preserves same-task final character before Select',
    'AUTH-NATIVE-002B\tsmoke\tLogin submits through the physical Select control',
    'NAV-NATIVE-001\tsmoke\tCard and external-deck navigation use production softkeys',
    'ERR-NATIVE-001\tsmoke\tInvalid address failure is visible and recoverable',
    'REQ-NATIVE-001\tsmoke\tOne navigation action produces one origin request',
    ''
  ].join('\n'));
  assert.equal(result.stderr, '');
});

test('native E2E entrypoint reports unknown scenarios as configuration errors', () => {
  const result = spawnSync('node', [runnerPath, '--scenario', 'MISSING'], { encoding: 'utf8' });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'native-tauri-kannel-e2e: CONFIG ERROR: unknown native E2E scenario: MISSING\n');
});
