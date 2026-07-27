import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

const planWorkflowPath = '.github/workflows/opentofu-protected-plan.yml';
const applyWorkflowPath = '.github/workflows/opentofu-protected-apply.yml';
const staticWorkflow = read('.github/workflows/opentofu.yml');
const planWorkflow = read(planWorkflowPath);
const applyWorkflow = read(applyWorkflowPath);

test('protected plan and apply serialize the same shared state without cancellation', () => {
  for (const workflow of [planWorkflow, applyWorkflow]) {
    assert.match(workflow, /group: opentofu-network-preview-state/);
    assert.match(workflow, /cancel-in-progress: false/);
    assert.match(workflow, /workflow_dispatch:/);
    assert.doesNotMatch(workflow, /pull_request(?:_target)?:/);
  }
});

test('runner-dependent OpenTofu data paths are configured only after runner allocation', () => {
  for (const workflow of [planWorkflow, applyWorkflow]) {
    assert.doesNotMatch(workflow, /TF_DATA_DIR:\s*\$\{\{\s*runner\./);
    assert.match(
      workflow,
      /echo "TF_DATA_DIR=\$RUNNER_TEMP\/network-preview-terraform" >>"\$GITHUB_ENV"/
    );
  }
});

test('static validation runs pinned semantic workflow lint', () => {
  assert.match(
    staticWorkflow,
    /uses: actions\/setup-go@[0-9a-f]{40} # v7\.0\.0[\s\S]*?go-version: '1\.25'/
  );
  assert.match(
    staticWorkflow,
    /go install github\.com\/rhysd\/actionlint\/cmd\/actionlint@v1\.7\.12/
  );
  assert.match(staticWorkflow, /run: scripts\/ci\/check-network-preview-workflows\.sh/);
});

test('staged local infrastructure fails closed before explicit publication', () => {
  const main = read('infra/network-preview/environments/preview/main.tf');
  const dns = read('infra/network-preview/environments/preview/dns.tf');
  const variables = read('infra/network-preview/environments/preview/variables.tf');
  const userData = read('infra/network-preview/cloud-init/user-data.yaml.tftpl');

  assert.match(variables, /variable "publish_preview"[\s\S]*?default\s+=\s+false/);
  assert.match(
    main,
    /source_addresses = var\.publish_preview \? \["0\.0\.0\.0\/0"\] : var\.wap_test_cidrs/
  );
  assert.match(dns, /for_each = var\.publish_preview \? local\.preview_hostnames : toset\(\[\]\)/);
  assert.match(variables, /cidr != "0\.0\.0\.0\/0"/);
  assert.match(userData, /disable_root: true/);
  assert.match(userData, /ssh_pwauth: false/);
  assert.match(userData, /PermitRootLogin no/);
  assert.match(userData, /PasswordAuthentication no/);
});

test('protected workflows carry every staged provider input without exposing it in commands', () => {
  for (const workflow of [planWorkflow, applyWorkflow]) {
    for (const variable of [
      'TF_VAR_admin_cidrs',
      'TF_VAR_cloudflare_zone_id',
      'TF_VAR_droplet_size',
      'TF_VAR_monitoring_alert_email',
      'TF_VAR_publish_preview',
      'TF_VAR_ssh_key_name',
      'TF_VAR_wap_test_cidrs'
    ]) {
      assert.match(workflow, new RegExp(`\\s${variable}:`));
    }
    assert.match(workflow, /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
  }
});

test('protected workflows pin every external action to a full commit SHA', () => {
  for (const [workflowPath, workflow] of [
    [planWorkflowPath, planWorkflow],
    [applyWorkflowPath, applyWorkflow]
  ]) {
    const usesLines = workflow.split('\n').filter((line) => line.includes('uses:'));
    assert.ok(usesLines.length > 0, `${workflowPath} should use pinned setup actions`);
    for (const line of usesLines) {
      assert.match(line, /uses:\s+[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[0-9a-f]{40}(?:\s|$)/);
    }
  }
});

test('shell run blocks do not interpolate GitHub expressions', () => {
  for (const [workflowPath, workflow] of [
    [planWorkflowPath, planWorkflow],
    [applyWorkflowPath, applyWorkflow]
  ]) {
    const lines = workflow.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      const match = lines[index].match(/^(\s*)run:\s*\|\s*$/);
      if (!match) continue;
      const indentation = match[1].length;
      const block = [];
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        const next = lines[cursor];
        if (next.trim() && next.search(/\S/) <= indentation) break;
        block.push(next);
      }
      assert.doesNotMatch(
        block.join('\n'),
        /\$\{\{/u,
        `${workflowPath} has run-time expression injection`
      );
    }
  }
});

test('apply verifies exact trusted provenance and never creates a replacement plan', () => {
  assert.match(applyWorkflow, /permissions:\n\s+actions: read\n\s+contents: read/);
  assert.match(applyWorkflow, /environment: network-preview-apply/);
  assert.match(applyWorkflow, /verify-network-preview-plan-provenance\.sh/);
  assert.match(applyWorkflow, /manage-network-preview-recovery\.sh prepare/);
  assert.match(applyWorkflow, /manage-network-preview-recovery\.sh assert/);
  assert.match(applyWorkflow, /manage-network-preview-recovery\.sh finalize/);
  assert.match(applyWorkflow, /tofu -chdir=.* apply/);
  assert.doesNotMatch(applyWorkflow, /tofu -chdir=.* plan/);

  const verifier = read('scripts/ci/verify-network-preview-plan-provenance.sh');
  for (const invariant of [
    '.repository.id == $repository_id',
    '.head_repository.id == $repository_id',
    '.workflow_id == $workflow_id',
    '.head_branch == "main"',
    '.event == "workflow_dispatch"',
    '.conclusion == "success"',
    '.workflow_run.id == $run_id',
    'downloaded_digest" != "$plan_digest'
  ]) {
    assert.ok(verifier.includes(invariant), `missing provenance invariant: ${invariant}`);
  }
});

test('backend and recovery contracts enforce encryption, native locking, and retention five', () => {
  const backend = read('infra/network-preview/environments/preview/backend.tf');
  const encryption = read('infra/network-preview/environments/preview/encryption.tf');
  const recovery = read('scripts/ci/manage-network-preview-recovery.sh');
  assert.match(backend, /use_lockfile\s+=\s+true/);
  assert.match(encryption, /state\s*\{[\s\S]*?enforced\s+=\s+true/);
  assert.match(encryption, /plan\s*\{[\s\S]*?enforced\s+=\s+true/);
  assert.match(recovery, /--if-none-match '\*'/);
  assert.match(recovery, /source-sha256=/);
  assert.match(recovery, /tofu -chdir="\$TOFU_ROOT" state pull >\/dev\/null/);
  assert.match(recovery, /if \[ "\$verified_count" -gt 5 \]/);
  assert.match(recovery, /sed -n '6,\$p'/);
});

test('partial backend writer accepts only the fixed preview state and recovery keys', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wap-labs-backend-test-'));
  const outputPath = path.join(temporaryRoot, 'backend.hcl');
  const scriptPath = path.join(
    repositoryRoot,
    'scripts/ci/write-network-preview-backend-config.sh'
  );
  const baseEnvironment = {
    ...process.env,
    NETWORK_PREVIEW_R2_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
    NETWORK_PREVIEW_R2_BUCKET: 'wap-labs-preview',
    NETWORK_PREVIEW_R2_STATE_KEY: 'wap-labs/network-preview/preview.tfstate',
    NETWORK_PREVIEW_R2_RECOVERY_PREFIX: 'wap-labs/network-preview/recovery'
  };

  try {
    const accepted = spawnSync(scriptPath, [outputPath], {
      cwd: repositoryRoot,
      env: baseEnvironment,
      encoding: 'utf8'
    });
    assert.equal(accepted.status, 0, accepted.stderr);
    const backendConfig = fs.readFileSync(outputPath, 'utf8');
    assert.match(backendConfig, /key = "wap-labs\/network-preview\/preview\.tfstate"/);
    assert.doesNotMatch(backendConfig, /AWS_|credential|secret/i);

    const rejected = spawnSync(scriptPath, [path.join(temporaryRoot, 'bad.hcl')], {
      cwd: repositoryRoot,
      env: { ...baseEnvironment, NETWORK_PREVIEW_R2_STATE_KEY: 'wrong/state.tfstate' },
      encoding: 'utf8'
    });
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /must equal wap-labs\/network-preview\/preview\.tfstate/);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

function writeExecutable(filePath, contents) {
  fs.writeFileSync(filePath, contents, { mode: 0o755 });
}

function parseOutputs(outputPath) {
  return Object.fromEntries(
    fs
      .readFileSync(outputPath, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
  );
}

test('recovery helper verifies copies and retains only the newest five after state verification', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wap-labs-recovery-test-'));
  const fakeBin = path.join(temporaryRoot, 'bin');
  const objectRoot = path.join(temporaryRoot, 'objects');
  const tofuRoot = path.join(temporaryRoot, 'tofu-root');
  fs.mkdirSync(fakeBin, { recursive: true });
  fs.mkdirSync(objectRoot, { recursive: true });
  fs.mkdirSync(tofuRoot, { recursive: true });

  writeExecutable(
    path.join(fakeBin, 'tofu'),
    `#!/usr/bin/env node
if (process.argv.includes('state') && process.argv.includes('pull')) {
  process.stdout.write('{"version":4}\\n');
  process.exit(0);
}
process.exit(2);
`
  );
  writeExecutable(
    path.join(fakeBin, 'aws'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const root = process.env.FAKE_R2_ROOT;
const option = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) throw new Error('missing ' + name);
  return args[index + 1];
};
const keyPath = (key) => path.join(root, ...key.split('/'));
const metadataPath = (key) => keyPath(key) + '.metadata.json';
const walk = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
};
const operation = args[1];
if (operation === 'list-objects-v2') {
  const prefix = option('--prefix');
  const contents = walk(root)
    .filter((file) => !file.endsWith('.metadata.json'))
    .map((file) => path.relative(root, file).split(path.sep).join('/'))
    .filter((key) => key.startsWith(prefix))
    .map((key) => {
      const runMatch = key.match(/\\/(\\d+)-\\d+-[0-9a-f]{32}\\.tfstate$/);
      const seconds = runMatch ? Number(runMatch[1]) : 0;
      return { Key: key, LastModified: new Date(seconds * 1000).toISOString() };
    });
  process.stdout.write(JSON.stringify({ Contents: contents }));
} else if (operation === 'get-object') {
  fs.copyFileSync(keyPath(option('--key')), args.at(-1));
  process.stdout.write('{}');
} else if (operation === 'head-object') {
  process.stdout.write(fs.readFileSync(metadataPath(option('--key')), 'utf8'));
} else if (operation === 'put-object') {
  const key = option('--key');
  const destination = keyPath(key);
  if (args.includes('--if-none-match') && fs.existsSync(destination)) process.exit(12);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(option('--body'), destination);
  const metadata = Object.fromEntries(
    option('--metadata').split(',').map((entry) => {
      const separator = entry.indexOf('=');
      return [entry.slice(0, separator), entry.slice(separator + 1)];
    })
  );
  fs.writeFileSync(metadataPath(key), JSON.stringify({ Metadata: metadata }));
  process.stdout.write('{}');
} else if (operation === 'delete-object') {
  const key = option('--key');
  fs.rmSync(keyPath(key));
  fs.rmSync(metadataPath(key), { force: true });
  process.stdout.write('{}');
} else {
  process.stderr.write('unsupported fake aws operation: ' + operation + '\\n');
  process.exit(2);
}
`
  );

  const stateKey = 'wap-labs/network-preview/preview.tfstate';
  const statePath = path.join(objectRoot, ...stateKey.split('/'));
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, 'encrypted-state-fixture-v1');

  const scriptPath = path.join(repositoryRoot, 'scripts/ci/manage-network-preview-recovery.sh');
  const baseEnvironment = {
    ...process.env,
    PATH: `${fakeBin}:${process.env.PATH}`,
    FAKE_R2_ROOT: objectRoot,
    NETWORK_PREVIEW_R2_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
    NETWORK_PREVIEW_R2_BUCKET: 'wap-labs-preview',
    NETWORK_PREVIEW_R2_STATE_KEY: stateKey,
    NETWORK_PREVIEW_R2_RECOVERY_PREFIX: 'wap-labs/network-preview/recovery',
    AWS_ACCESS_KEY_ID: 'fixture-access',
    AWS_SECRET_ACCESS_KEY: 'fixture-secret',
    SOURCE_COMMIT: 'a'.repeat(40),
    APPLY_RUN_ATTEMPT: '1',
    TOFU_ROOT: tofuRoot
  };

  const runRecovery = (phase, runId, extraEnvironment = {}) => {
    const outputPath = path.join(temporaryRoot, `outputs-${phase}-${runId}.txt`);
    const result = spawnSync(scriptPath, [phase], {
      cwd: repositoryRoot,
      env: {
        ...baseEnvironment,
        APPLY_RUN_ID: String(runId),
        RECOVERY_NONCE: String(runId).padStart(32, '0'),
        GITHUB_OUTPUT: outputPath,
        ...extraEnvironment
      },
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    return fs.existsSync(outputPath) ? parseOutputs(outputPath) : {};
  };

  try {
    let selectedRecovery;
    for (let runId = 101; runId <= 106; runId += 1) {
      selectedRecovery = runRecovery('prepare', runId);
    }
    assert.equal(selectedRecovery.recovery_mode, 'copy');
    runRecovery('assert', 106, {
      RECOVERY_MODE: selectedRecovery.recovery_mode,
      RECOVERY_KEY: selectedRecovery.recovery_key,
      RECOVERY_SHA256: selectedRecovery.recovery_sha256
    });
    const finalized = runRecovery('finalize', 106, {
      RECOVERY_MODE: selectedRecovery.recovery_mode,
      RECOVERY_KEY: selectedRecovery.recovery_key,
      RECOVERY_SHA256: selectedRecovery.recovery_sha256
    });
    assert.equal(finalized.recovery_retained_count, '5');
    assert.equal(finalized.current_state_sha256, selectedRecovery.recovery_sha256);

    const retained = [];
    const walk = (directory) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(fullPath);
        else if (entry.name.endsWith('.tfstate')) retained.push(fullPath);
      }
    };
    walk(path.join(objectRoot, 'wap-labs/network-preview/recovery'));
    assert.equal(retained.length, 5);
    assert.ok(fs.existsSync(path.join(objectRoot, ...selectedRecovery.recovery_key.split('/'))));
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('bootstrap recovery mode fails closed unless both state and native lock are absent', () => {
  const recovery = read('scripts/ci/manage-network-preview-recovery.sh');
  const bootstrapBlock = recovery.slice(
    recovery.indexOf('0)\n      # This is permitted only'),
    recovery.indexOf('1)\n      source_path=')
  );
  assert.match(bootstrapBlock, /require_exact_object_count "\$lock_key" 0/);
  assert.match(recovery, /bootstrap\)\n\s+require_exact_object_count "\$state_key" 0/);
  assert.match(recovery, /bootstrap state and lock absence reconfirmed immediately before apply/);
});
