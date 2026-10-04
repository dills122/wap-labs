#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const dryRun = process.argv.includes('--dry-run');
const bundles = ['core', 'node', 'orchestration', 'delivery', 'rust', 'infra'];
const additionalSkills = [
  'repository-doc-drift',
  'vite',
  'vitest',
  'pnpm',
  'browser-testing-with-devtools',
  'claude-playwright-review',
  'frontend-design-review'
];
const sharedSteeringFiles = ['frontend-design-steering.md'];

function usage() {
  console.log(`Usage: node scripts/setup-codex-links.mjs [--dry-run]

Installs the repository's curated AI Central skill bundles as local links and
refreshes reusable steering links while preserving repo-owned files.

Environment:
  AI_CENTRAL_HOME  Path to ai-central or ai-central/templates.
                   Defaults to ~/.ai-central.

Options:
  --dry-run        Report changes without writing links.
  --help           Show this help.`);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  usage();
  process.exit(0);
}

const unknownArguments = process.argv
  .slice(2)
  .filter((argument) => !['--', '--dry-run'].includes(argument));
if (unknownArguments.length > 0) {
  console.error(`Unknown option: ${unknownArguments[0]}`);
  usage();
  process.exit(2);
}

function resolveAiCentralRoot() {
  const input = process.env.AI_CENTRAL_HOME ?? path.join(os.homedir(), '.ai-central');
  const absolute = path.resolve(input);
  return path.basename(absolute) === 'templates' ? path.dirname(absolute) : absolute;
}

async function pathExists(target) {
  try {
    await fs.lstat(target);
    return true;
  } catch (error) {
    if (['ENOENT', 'EACCES', 'EPERM'].includes(error.code)) {
      return false;
    }
    throw error;
  }
}

async function ensureSymlink(linkPath, target) {
  let existing;

  try {
    existing = await fs.lstat(linkPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (existing && !existing.isSymbolicLink()) {
    return { action: 'preserved', linkPath, target };
  }

  if (existing?.isSymbolicLink()) {
    const currentTarget = await fs.readlink(linkPath);
    if (path.resolve(path.dirname(linkPath), currentTarget) === target) {
      return { action: 'unchanged', linkPath, target };
    }

    if (!dryRun) {
      await fs.unlink(linkPath);
    }
  }

  if (!dryRun) {
    await fs.mkdir(path.dirname(linkPath), { recursive: true });
    await fs.symlink(target, linkPath);
  }

  return { action: existing ? 'updated' : 'created', linkPath, target };
}

async function main() {
  const aiCentralRoot = resolveAiCentralRoot();
  const templatesRoot = path.join(aiCentralRoot, 'templates');
  const installer = path.join(aiCentralRoot, 'scripts', 'install-skill-bundle.sh');

  if (!(await pathExists(path.join(templatesRoot, 'catalog.json')))) {
    console.error(`AI Central catalog not found: ${templatesRoot}`);
    console.error('Set AI_CENTRAL_HOME to your ai-central checkout or templates directory.');
    process.exitCode = 1;
    return;
  }

  if (!(await pathExists(installer))) {
    console.error(`AI Central bundle installer not found: ${installer}`);
    process.exitCode = 1;
    return;
  }

  console.log(`AI Central source: ${aiCentralRoot}`);
  console.log(`Selected bundles: ${bundles.join(',')}`);
  console.log(`Additional skills: ${additionalSkills.join(',')}`);

  const installerArguments = [
    repoRoot,
    '--bundle',
    bundles.join(','),
    '--skills',
    additionalSkills.join(','),
    '--mode',
    'link',
    '--sync'
  ];
  if (dryRun) {
    installerArguments.push('--dry-run');
  }

  const result = spawnSync(installer, installerArguments, { stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return;
  }

  for (const fileName of sharedSteeringFiles) {
    const target = path.join(templatesRoot, 'steering', fileName);
    if (!(await pathExists(target))) {
      console.error(`AI Central steering file not found: ${target}`);
      process.exitCode = 1;
      return;
    }

    const linkPath = path.join(repoRoot, '.codex', 'steering', fileName);
    const link = await ensureSymlink(linkPath, target);
    console.log(`${link.action}: ${path.relative(repoRoot, link.linkPath)} -> ${link.target}`);
  }
}

await main();
