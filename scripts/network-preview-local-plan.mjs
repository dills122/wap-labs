#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function parseArguments(argv) {
  let envFile = path.join(repositoryRoot, '.env');

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== '--env-file' || !argv[index + 1]) {
      fail('usage: node scripts/network-preview-local-plan.mjs [--env-file PATH]');
    }
    envFile = path.resolve(argv[index + 1]);
    index += 1;
  }

  return { envFile };
}

function parseEnvFile(filePath) {
  let mode;
  let contents;
  try {
    mode = statSync(filePath).mode & 0o777;
    contents = readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`cannot read environment file: ${error.message}`);
  }

  if ((mode & 0o077) !== 0) {
    fail('environment file must not be readable or writable by group/other');
  }

  const values = {};
  for (const [lineIndex, originalLine] of contents.split(/\r?\n/).entries()) {
    const line = originalLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      fail(`invalid environment assignment on line ${lineIndex + 1}`);
    }

    let value = match[2].trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function requireValues(values, names) {
  for (const name of names) {
    if (!values[name]) {
      fail(`required environment variable is missing: ${name}`);
    }
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: options.env,
    encoding: 'utf8',
    stdio: options.stdio ?? 'inherit'
  });
  if (result.error) {
    fail(`${command} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${command} exited with status ${result.status}`);
  }
  return result.stdout ?? '';
}

const { envFile } = parseArguments(process.argv.slice(2));
const configured = parseEnvFile(envFile);
requireValues(configured, [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'CLOUDFLARE_API_TOKEN',
  'DIGITALOCEAN_TOKEN',
  'NETWORK_PREVIEW_ADMIN_CIDRS_JSON',
  'NETWORK_PREVIEW_ALERT_EMAIL',
  'NETWORK_PREVIEW_CLOUDFLARE_ZONE_ID',
  'NETWORK_PREVIEW_DO_PROJECT',
  'NETWORK_PREVIEW_DO_REGION',
  'NETWORK_PREVIEW_DO_SSH_KEY_NAME',
  'NETWORK_PREVIEW_R2_ACCOUNT_ID',
  'NETWORK_PREVIEW_R2_BUCKET',
  'NETWORK_PREVIEW_R2_RECOVERY_PREFIX',
  'NETWORK_PREVIEW_R2_STATE_KEY',
  'NETWORK_PREVIEW_WAP_TEST_CIDRS_JSON',
  'TOFU_ENCRYPTION_PASSPHRASE'
]);

const tofu = process.env.OPEN_TOFU_BIN || 'tofu';
const tofuVersion = run(tofu, ['version'], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'inherit']
});
if (!tofuVersion.startsWith('OpenTofu v1.12.5\n')) {
  fail('OpenTofu 1.12.5 is required');
}

const dirty = run('git', ['status', '--porcelain'], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'inherit']
});
if (dirty.trim()) {
  fail('refusing to create a review plan from a dirty worktree');
}
const sourceCommit = run('git', ['rev-parse', 'HEAD'], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'inherit']
}).trim();

const childEnv = {
  ...process.env,
  ...configured,
  AWS_DEFAULT_REGION: 'auto',
  AWS_REGION: 'auto',
  TF_IN_AUTOMATION: '1',
  TF_INPUT: '0',
  TF_VAR_admin_cidrs: configured.NETWORK_PREVIEW_ADMIN_CIDRS_JSON,
  TF_VAR_cloudflare_zone_id: configured.NETWORK_PREVIEW_CLOUDFLARE_ZONE_ID,
  TF_VAR_droplet_size: configured.NETWORK_PREVIEW_DO_DROPLET_SIZE || 's-1vcpu-512mb-10gb',
  TF_VAR_monitoring_alert_email: configured.NETWORK_PREVIEW_ALERT_EMAIL,
  TF_VAR_project_name: configured.NETWORK_PREVIEW_DO_PROJECT,
  TF_VAR_publish_preview: configured.NETWORK_PREVIEW_PUBLISH_PREVIEW || 'false',
  TF_VAR_region: configured.NETWORK_PREVIEW_DO_REGION,
  TF_VAR_ssh_key_name: configured.NETWORK_PREVIEW_DO_SSH_KEY_NAME,
  TF_VAR_state_encryption_passphrase: configured.TOFU_ENCRYPTION_PASSPHRASE,
  TF_VAR_wap_test_cidrs: configured.NETWORK_PREVIEW_WAP_TEST_CIDRS_JSON
};

const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'wap-labs-network-preview-plan-'));
const tofuRoot = path.join(repositoryRoot, 'infra/network-preview/environments/preview');
const planDirectory = path.join(tofuRoot, '.plans');
const planTimestamp = new Date().toISOString().replaceAll(/[-:.]/g, '');
const planPath = path.join(planDirectory, `preview-${planTimestamp}.tfplan`);

try {
  mkdirSync(planDirectory, { recursive: true, mode: 0o700 });
  childEnv.TF_DATA_DIR = path.join(temporaryRoot, 'tofu-data');
  const backendPath = path.join(temporaryRoot, 'backend.hcl');

  run(
    'sh',
    [path.join(repositoryRoot, 'scripts/ci/write-network-preview-backend-config.sh'), backendPath],
    { env: childEnv, stdio: ['ignore', 'ignore', 'inherit'] }
  );
  run(
    tofu,
    [
      `-chdir=${tofuRoot}`,
      'init',
      '-reconfigure',
      `-backend-config=${backendPath}`,
      '-lockfile=readonly',
      '-no-color'
    ],
    { env: childEnv, stdio: ['ignore', 'ignore', 'inherit'] }
  );
  run(
    tofu,
    [
      `-chdir=${tofuRoot}`,
      'plan',
      '-lock-timeout=5m',
      '-input=false',
      '-no-color',
      `-out=${planPath}`
    ],
    { env: childEnv, stdio: ['ignore', 'ignore', 'inherit'] }
  );

  run(
    path.join(repositoryRoot, 'scripts/ci/summarize-network-preview-plan.sh'),
    [tofuRoot, planPath],
    { env: childEnv }
  );

  const digest = createHash('sha256').update(readFileSync(planPath)).digest('hex');
  console.log(`PASS: encrypted local plan created for commit ${sourceCommit}`);
  console.log(`Plan: ${path.relative(repositoryRoot, planPath)}`);
  console.log(`SHA-256: ${digest}`);
  console.log('No cloud resources were changed.');
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
