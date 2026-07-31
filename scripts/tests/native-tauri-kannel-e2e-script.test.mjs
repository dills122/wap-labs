import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scriptPath = 'scripts/native-tauri-kannel-e2e.sh';
const source = fs.readFileSync(scriptPath, 'utf8');

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
    /if \[ "\$\{NATIVE_E2E_PREBUILT_IMAGES\}" = 1 \]; then\s+docker compose up -d --no-build kannel wml-server\s+else\s+docker compose up -d --build kannel wml-server/s
  );
});
