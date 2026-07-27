import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { WAVES_BASELINE_MIN_RUNS } from '../engine-wasm/host-sample/scripts/waves-baseline-run-policy.mjs';

export const OUTCOMES = Object.freeze({
  pass: 'PASS',
  excluded: 'INTENTIONAL EXCLUSION',
  unavailable: 'UNAVAILABLE PREREQUISITE',
  advisory: 'ADVISORY',
  failure: 'FAILURE'
});

export const PROFILES = Object.freeze(['fast', 'change', 'full', 'extended']);

const allChangePaths = [
  '.github/workflows/',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'scripts/verify',
  'scripts/tests/verify.test.mjs'
];

const prerequisite = (command, remediation) => ({
  kind: 'command',
  value: command,
  remediation
});

const workspaceDependencies = {
  kind: 'path',
  value: 'node_modules/.pnpm',
  remediation: 'run ./scripts/init-refresh.sh'
};

const offlineTofuEnv = Object.freeze({
  TF_IN_AUTOMATION: '1',
  TF_INPUT: '0',
  TF_VAR_admin_cidrs: '[]',
  TF_VAR_monitoring_alert_email: 'owner@example.com',
  TF_VAR_project_name: 'offline-validation',
  TF_VAR_region: 'nyc3',
  TF_VAR_ssh_key_name: 'offline-validation',
  TF_VAR_state_encryption_passphrase: 'offline-validation-only-not-for-state',
  TF_VAR_tailscale_auth_key: 'tskey-auth-offline-validation',
  TF_VAR_wap_test_cidrs: '[]'
});

const playwrightChromium = (packageDirectory) => ({
  kind: 'playwright-chromium',
  value: packageDirectory,
  remediation: `run pnpm --dir ${packageDirectory} exec playwright install chromium`
});

const command = (label, executable, args, options = {}) => ({
  label,
  executable,
  args,
  ...options
});

export const LANES = Object.freeze([
  {
    id: 'orchestration',
    label: 'verification orchestrator tests',
    profiles: PROFILES,
    always: true,
    prerequisites: [prerequisite('node', 'install the repository Node version')],
    commands: [
      command('selection and failure-propagation tests', 'node', [
        '--test',
        'scripts/tests/verify.test.mjs'
      ])
    ]
  },
  {
    id: 'repo-hygiene',
    label: 'repository hygiene',
    profiles: PROFILES,
    always: true,
    prerequisites: [
      prerequisite('git', 'install Git'),
      prerequisite('node', 'install the repository Node version'),
      prerequisite('pnpm', 'run ./scripts/init-refresh.sh')
    ],
    commands: [
      command('whitespace errors', 'git', ['diff', '--check']),
      command('managed release versions', 'pnpm', ['run', 'version:check'])
    ]
  },
  {
    id: 'workspace-quality',
    label: 'workspace format, lint, type, link, and drift checks',
    profiles: ['change', 'full', 'extended'],
    always: true,
    prerequisites: [
      prerequisite('node', 'install the repository Node version'),
      prerequisite('pnpm', 'run ./scripts/init-refresh.sh'),
      prerequisite('cargo', 'install the stable Rust toolchain'),
      prerequisite('wasm-pack', 'run AUTO_INSTALL_RUST_TOOLS=1 ./scripts/init-refresh.sh'),
      workspaceDependencies
    ],
    commands: [
      command(
        'WaveNav WASM package prerequisite',
        'wasm-pack',
        ['build', '--target', 'web', '--out-dir', '../pkg'],
        { cwd: 'engine-wasm/engine' }
      ),
      command('workspace format', 'pnpm', ['run', 'format:check:node']),
      command('workspace lint', 'pnpm', ['run', 'lint:node']),
      command('workspace typecheck', 'pnpm', ['run', 'typecheck:node']),
      command('active ticket file references', 'node', [
        'scripts/check-ticket-file-references.mjs'
      ]),
      command('active worklist pointers', 'node', ['scripts/check-worklist-drift.mjs']),
      command('source corpus rollups', 'node', ['scripts/check-source-corpus-drift.mjs']),
      command('networking profile gates', 'node', ['scripts/check-networking-profile-gates.mjs'])
    ]
  },
  {
    id: 'compliance',
    label: 'WAP compliance and status drift',
    profiles: ['change', 'full', 'extended'],
    paths: [
      'docs/knowledge-graph/',
      'docs/waves/',
      'spec-processing/',
      'scripts/check-active-compliance-facts.mjs',
      'scripts/check-requirement-status-drift.mjs',
      'scripts/check-wap-',
      'scripts/wap-context-pack.mjs'
    ],
    prerequisites: [
      prerequisite('node', 'install the repository Node version'),
      prerequisite('pnpm', 'run ./scripts/init-refresh.sh'),
      workspaceDependencies
    ],
    commands: [
      command('complete compliance wrapper', 'pnpm', ['run', 'wap-compliance:check']),
      command('knowledge graph projection', 'pnpm', ['run', 'wap-graph:check'])
    ]
  },
  {
    id: 'engine-native',
    label: 'WaveNav native engine',
    profiles: ['change', 'full', 'extended'],
    paths: ['engine-wasm/engine/', 'engine-wasm/contracts/'],
    prerequisites: [prerequisite('cargo', 'install the stable Rust toolchain')],
    commands: [
      command('engine formatting', 'cargo', ['fmt', '--check'], {
        cwd: 'engine-wasm/engine'
      }),
      command('engine native tests', 'cargo', ['test', '--locked'], {
        cwd: 'engine-wasm/engine'
      })
    ]
  },
  {
    id: 'engine-wasm-stories',
    label: 'WaveNav WASM contracts and executable stories',
    profiles: ['change', 'full', 'extended'],
    paths: ['engine-wasm/', 'browser/contracts/', 'browser/frontend/'],
    prerequisites: [
      prerequisite('cargo', 'install the stable Rust toolchain'),
      prerequisite('wasm-pack', 'run AUTO_INSTALL_RUST_TOOLS=1 ./scripts/init-refresh.sh'),
      prerequisite('pnpm', 'run ./scripts/init-refresh.sh'),
      workspaceDependencies,
      playwrightChromium('engine-wasm/host-sample')
    ],
    commands: [
      command('engine DTO contract drift', 'pnpm', [
        '--dir',
        'engine-wasm/host-sample',
        'run',
        'contracts:check'
      ]),
      command('WASM boundary tests', 'wasm-pack', ['test', '--node'], {
        cwd: 'engine-wasm/engine'
      }),
      command('story schema tests', 'pnpm', [
        '--dir',
        'engine-wasm/host-sample',
        'run',
        'test:story:unit'
      ]),
      command('example manifest drift', 'pnpm', [
        '--dir',
        'engine-wasm/host-sample',
        'run',
        'examples:check'
      ]),
      command('all executable stories', 'pnpm', ['run', 'test:story', 'all'])
    ]
  },
  {
    id: 'story-coverage-advisory',
    label: 'example story coverage inventory',
    profiles: ['change', 'full', 'extended'],
    paths: ['engine-wasm/examples/', 'engine-wasm/host-sample/'],
    advisory: true,
    prerequisites: [prerequisite('pnpm', 'run ./scripts/init-refresh.sh'), workspaceDependencies],
    commands: [
      command('story coverage inventory', 'pnpm', [
        '--dir',
        'engine-wasm/host-sample',
        'run',
        'examples:story-coverage'
      ])
    ]
  },
  {
    id: 'transport',
    label: 'Lowband transport',
    profiles: ['change', 'full', 'extended'],
    paths: ['transport-rust/', 'browser/contracts/transport.ts'],
    prerequisites: [prerequisite('cargo', 'install the stable Rust toolchain')],
    commands: [
      command('transport formatting', 'cargo', ['fmt', '--check'], {
        cwd: 'transport-rust'
      }),
      command(
        'transport Clippy',
        'cargo',
        ['clippy', '--all-targets', '--all-features', '--', '-D', 'warnings'],
        { cwd: 'transport-rust' }
      ),
      command('transport tests', 'cargo', ['test', '--locked', '--', '--test-threads=1'], {
        cwd: 'transport-rust',
        env: { RUST_TEST_THREADS: '1' }
      })
    ]
  },
  {
    id: 'browser',
    label: 'Waves browser contracts, host, frontend, and accessibility',
    profiles: ['change', 'full', 'extended'],
    paths: ['browser/', 'engine-wasm/contracts/', 'transport-rust/src/lib.rs'],
    prerequisites: [
      prerequisite('cargo', 'install the stable Rust toolchain'),
      prerequisite('pnpm', 'run ./scripts/init-refresh.sh'),
      workspaceDependencies,
      playwrightChromium('browser/frontend')
    ],
    commands: [
      command('browser generated contracts and schemas', 'pnpm', [
        '--dir',
        'browser',
        'run',
        'tauri:generated:check'
      ]),
      command('browser host formatting', 'cargo', ['fmt', '--check'], {
        cwd: 'browser/src-tauri'
      }),
      command('browser host tests', 'cargo', ['test', '--locked'], {
        cwd: 'browser/src-tauri'
      }),
      command('browser frontend unit tests', 'pnpm', ['--dir', 'browser/frontend', 'test']),
      command('rendered accessibility', 'pnpm', [
        '--dir',
        'browser/frontend',
        'run',
        'test:accessibility:rendered'
      ])
    ]
  },
  {
    id: 'atlas',
    label: 'Project Atlas data and build',
    profiles: ['change', 'full', 'extended'],
    paths: ['docs-portal/', 'docs/', 'spec-processing/'],
    prerequisites: [prerequisite('pnpm', 'run ./scripts/init-refresh.sh'), workspaceDependencies],
    commands: [
      command('Atlas data validation', 'pnpm', ['--dir', 'docs-portal', 'run', 'test:data']),
      command('Atlas type and content checks', 'pnpm', ['--dir', 'docs-portal', 'run', 'check']),
      command('Atlas production build', 'pnpm', ['--dir', 'docs-portal', 'run', 'build'])
    ]
  },
  {
    id: 'marketing-site',
    label: 'marketing site build',
    profiles: ['change', 'full', 'extended'],
    paths: ['marketing-site/'],
    prerequisites: [
      prerequisite('pnpm', 'install marketing-site dependencies'),
      {
        kind: 'path',
        value: 'marketing-site/node_modules',
        remediation: 'run ./scripts/init-refresh.sh'
      }
    ],
    commands: [
      command('marketing production build', 'pnpm', [
        '--dir',
        'marketing-site',
        '--ignore-workspace',
        'run',
        'build'
      ])
    ]
  },
  {
    id: 'wml-server',
    label: 'WML origin checks',
    profiles: ['change', 'full', 'extended'],
    paths: ['wml-server/'],
    prerequisites: [prerequisite('go', 'install Go 1.25 or newer')],
    commands: [
      command(
        'Go format check',
        'sh',
        ['-c', 'test -z "$(find . -name \'*.go\' -type f -exec gofmt -l {} +)"'],
        { cwd: 'wml-server' }
      ),
      command('Go vet', 'go', ['vet', './...'], { cwd: 'wml-server' }),
      command('Go tests', 'go', ['test', './...'], { cwd: 'wml-server' })
    ]
  },
  {
    id: 'opentofu-static',
    label: 'network preview OpenTofu static checks',
    profiles: ['change', 'full', 'extended'],
    paths: [
      'infra/network-preview/',
      'scripts/ci/check-network-preview-workflows.sh',
      'scripts/ci/check-network-preview-r2-lock.sh',
      'scripts/ci/check-network-preview-encrypted-plan.sh',
      'scripts/ci/manage-network-preview-recovery.sh',
      'scripts/ci/network-preview-lib.sh',
      'scripts/ci/summarize-network-preview-plan.sh',
      'scripts/ci/verify-network-preview-plan-provenance.sh',
      'scripts/ci/write-network-preview-backend-config.sh',
      'scripts/network-preview-local-plan.mjs',
      'scripts/tests/network-preview-protected.test.mjs',
      '.github/workflows/opentofu.yml',
      '.github/workflows/opentofu-protected-apply.yml',
      '.github/workflows/opentofu-protected-plan.yml'
    ],
    prerequisites: [
      prerequisite('tofu', 'install OpenTofu 1.12.5'),
      prerequisite(
        'actionlint',
        'run go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12'
      ),
      prerequisite('sh', 'install a POSIX shell'),
      prerequisite('node', 'install the repository Node version')
    ],
    commands: [
      command('OpenTofu formatting', 'tofu', [
        'fmt',
        '-check',
        '-recursive',
        'infra/network-preview'
      ]),
      command(
        'GitHub Actions semantic validation',
        'scripts/ci/check-network-preview-workflows.sh',
        []
      ),
      command(
        'backend-disabled initialization',
        'tofu',
        ['init', '-backend=false', '-lockfile=readonly', '-no-color'],
        {
          cwd: 'infra/network-preview/environments/preview',
          env: offlineTofuEnv
        }
      ),
      command('OpenTofu validation', 'tofu', ['validate', '-no-color'], {
        cwd: 'infra/network-preview/environments/preview',
        env: offlineTofuEnv
      }),
      command('network-preview script POSIX syntax', 'sh', [
        '-n',
        'scripts/ci/check-network-preview-workflows.sh',
        'scripts/ci/check-network-preview-r2-lock.sh',
        'scripts/ci/check-network-preview-encrypted-plan.sh',
        'scripts/ci/manage-network-preview-recovery.sh',
        'scripts/ci/network-preview-lib.sh',
        'scripts/ci/summarize-network-preview-plan.sh',
        'scripts/ci/verify-network-preview-plan-provenance.sh',
        'scripts/ci/write-network-preview-backend-config.sh'
      ]),
      command('network-preview local plan helper syntax', 'node', [
        '--check',
        'scripts/network-preview-local-plan.mjs'
      ]),
      command(
        'encrypted offline plan check',
        'scripts/ci/check-network-preview-encrypted-plan.sh',
        [],
        {
          env: {
            TF_VAR_state_encryption_passphrase: 'offline-validation-only-not-for-state'
          }
        }
      ),
      command('protected workflow contract tests', 'node', [
        '--test',
        'scripts/tests/network-preview-protected.test.mjs'
      ])
    ]
  },
  {
    id: 'live-kannel',
    label: 'live Kannel transport/browser smoke',
    profiles: ['extended'],
    always: true,
    extendedOnly: true,
    prerequisites: [
      prerequisite('cargo', 'install the stable Rust toolchain'),
      prerequisite('curl', 'install curl'),
      prerequisite('docker', 'install Docker and start the Kannel/WML stack')
    ],
    commands: [command('live Kannel smoke', './scripts/transport-wap-smoke.sh', [])]
  },
  {
    id: 'browser-baseline',
    label: 'browser stability baseline',
    profiles: ['extended'],
    always: true,
    extendedOnly: true,
    advisory: true,
    prerequisites: [prerequisite('pnpm', 'run ./scripts/init-refresh.sh'), workspaceDependencies],
    commands: [
      command(
        `minimum supported browser baseline (${WAVES_BASELINE_MIN_RUNS} runs)`,
        'pnpm',
        ['run', 'test:baseline:waves'],
        {
          env: { WAVES_BASELINE_RUNS: String(WAVES_BASELINE_MIN_RUNS) }
        }
      )
    ]
  }
]);

function pathMatches(changedPath, prefix) {
  return prefix.endsWith('/')
    ? changedPath.startsWith(prefix)
    : changedPath === prefix || changedPath.startsWith(prefix);
}

export function normalizeChangedPaths(paths) {
  return [...new Set(paths.map((item) => item.trim()).filter(Boolean))].sort();
}

export function buildPlan(profile, changedPaths = []) {
  if (!PROFILES.includes(profile)) {
    throw new Error(`unknown verification profile "${profile}"; choose ${PROFILES.join(', ')}`);
  }

  const normalizedPaths = normalizeChangedPaths(changedPaths);
  const selectEveryChangeLane = normalizedPaths.some((changedPath) =>
    allChangePaths.some((prefix) => pathMatches(changedPath, prefix))
  );

  return LANES.map((lane) => {
    if (!lane.profiles.includes(profile)) {
      return {
        ...lane,
        selected: false,
        selectionReason: lane.extendedOnly
          ? 'available only in the explicit extended profile'
          : `not part of the ${profile} profile`
      };
    }
    if (profile === 'full' || profile === 'extended' || lane.always) {
      return {
        ...lane,
        selected: true,
        selectionReason:
          profile === 'extended' && lane.extendedOnly
            ? 'explicit extended gate'
            : `${profile} profile`
      };
    }
    if (profile === 'fast') {
      return {
        ...lane,
        selected: false,
        selectionReason: 'fast profile intentionally limits scope'
      };
    }
    const matched = selectEveryChangeLane
      ? ['root verification or CI surface changed']
      : normalizedPaths.filter((changedPath) =>
          (lane.paths ?? []).some((prefix) => pathMatches(changedPath, prefix))
        );
    return {
      ...lane,
      selected: matched.length > 0,
      selectionReason:
        matched.length > 0
          ? `selected by ${matched.slice(0, 3).join(', ')}`
          : 'no changed path selects this lane'
    };
  });
}

export function findExecutable(commandName, environment = process.env) {
  if (commandName.includes('/')) {
    return fs.existsSync(commandName);
  }
  return (environment.PATH ?? '')
    .split(path.delimiter)
    .filter(Boolean)
    .some((directory) => {
      const candidate = path.join(directory, commandName);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return true;
      } catch {
        return false;
      }
    });
}

export function defaultCheckPrerequisite(item, root, environment = process.env) {
  if (item.kind === 'command') {
    return findExecutable(item.value, environment);
  }
  if (item.kind === 'path') {
    return fs.existsSync(path.join(root, item.value));
  }
  if (item.kind === 'playwright-chromium') {
    try {
      const require = createRequire(path.join(root, item.value, 'package.json'));
      const { chromium } = require('@playwright/test');
      return fs.existsSync(chromium.executablePath());
    } catch {
      return false;
    }
  }
  throw new Error(`unsupported prerequisite kind: ${item.kind}`);
}

export function defaultRunCommand(item, root, environment = process.env) {
  const result = spawnSync(item.executable, item.args, {
    cwd: path.join(root, item.cwd ?? '.'),
    env: { ...environment, ...(item.env ?? {}) },
    stdio: 'inherit',
    shell: false
  });
  return {
    status: result.status,
    error: result.error
  };
}

export function executePlan(
  plan,
  {
    root = process.cwd(),
    environment = process.env,
    checkPrerequisite = defaultCheckPrerequisite,
    runCommand = defaultRunCommand,
    write = (line) => console.log(line)
  } = {}
) {
  const results = [];

  for (const lane of plan) {
    if (!lane.selected) {
      const result = {
        id: lane.id,
        outcome: OUTCOMES.excluded,
        detail: lane.selectionReason
      };
      results.push(result);
      write(`[${result.outcome}] ${lane.label} — ${result.detail}`);
      continue;
    }

    const missing = (lane.prerequisites ?? []).filter(
      (item) => !checkPrerequisite(item, root, environment)
    );
    if (missing.length > 0) {
      const detail = missing.map((item) => `${item.value} (${item.remediation})`).join('; ');
      const result = {
        id: lane.id,
        outcome: lane.advisory ? OUTCOMES.advisory : OUTCOMES.unavailable,
        detail
      };
      results.push(result);
      write(`[${result.outcome}] ${lane.label} — ${detail}`);
      continue;
    }

    let commandFailure;
    for (const item of lane.commands) {
      write(`==> ${lane.label}: ${item.label}`);
      const commandResult = runCommand(item, root, environment);
      if (commandResult.error || commandResult.status !== 0) {
        commandFailure = {
          label: item.label,
          status: commandResult.status,
          error: commandResult.error
        };
        break;
      }
    }

    if (commandFailure) {
      const detail = commandFailure.error
        ? `${commandFailure.label}: ${commandFailure.error.message}`
        : `${commandFailure.label} exited ${commandFailure.status}`;
      const result = {
        id: lane.id,
        outcome: lane.advisory ? OUTCOMES.advisory : OUTCOMES.failure,
        detail
      };
      results.push(result);
      write(`[${result.outcome}] ${lane.label} — ${detail}`);
      continue;
    }

    const result = {
      id: lane.id,
      outcome: lane.advisory ? OUTCOMES.advisory : OUTCOMES.pass,
      detail: lane.advisory ? 'non-blocking evidence passed' : 'all selected commands passed'
    };
    results.push(result);
    write(`[${result.outcome}] ${lane.label} — ${result.detail}`);
  }

  const failed = results.some((result) =>
    [OUTCOMES.unavailable, OUTCOMES.failure].includes(result.outcome)
  );
  return { results, exitCode: failed ? 1 : 0 };
}
