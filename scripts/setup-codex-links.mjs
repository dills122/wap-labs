#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const codexDir = path.join(repoRoot, '.codex');
const skillsDir = path.join(codexDir, 'skills');
const steeringDir = path.join(codexDir, 'steering');
const templatesRoot = resolveTemplatesRoot();
const dryRun = process.argv.includes('--dry-run');
const sharedSteeringFiles = ['frontend-design-steering.md', 'javascript-esm-steering.md'];

function usage() {
  console.log(`Usage: node scripts/setup-codex-links.mjs [--dry-run]

Creates local .codex symlinks from AI Central while preserving repo-owned files.

Environment:
  AI_CENTRAL_HOME  Path to ai-central or ai-central/templates.
                   Defaults to ../ai-central/templates.

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

function resolveTemplatesRoot() {
  const input = process.env.AI_CENTRAL_HOME ?? path.resolve(repoRoot, '../ai-central/templates');
  const absolute = path.resolve(input);
  return path.basename(absolute) === 'ai-central' ? path.join(absolute, 'templates') : absolute;
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

async function* walkDirectories(root) {
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (['ENOENT', 'EACCES', 'EPERM'].includes(error.code)) {
      return;
    }
    throw error;
  }

  yield root;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      yield* walkDirectories(path.join(root, entry.name));
    }
  }
}

function skillLinkName(parts, name) {
  if (!name || parts[0] === undefined) {
    return undefined;
  }

  if (parts[0] === 'adapted' || parts[0] !== 'imported') {
    return name;
  }

  switch (parts[1]) {
    case 'agent-skills':
      return name;
    case 'pm-skills':
      return `pm-${name}`;
    case 'claude-skills':
      return `claude-${name}`;
    case 'agent-toolkit':
      return `toolkit-${name}`;
    case 'web-quality-skills':
      return `web-${name}`;
    default:
      return name;
  }
}

async function findSkillLinks() {
  const skillRoot = path.join(templatesRoot, 'skills');
  const links = new Map();

  for await (const directory of walkDirectories(skillRoot)) {
    if (!(await pathExists(path.join(directory, 'SKILL.md')))) {
      continue;
    }

    const relativeDirectory = path.relative(skillRoot, directory);
    const parts = relativeDirectory.split(path.sep);
    const linkName = skillLinkName(parts, parts.at(-1));
    if (!linkName) {
      continue;
    }

    const existingTarget = links.get(linkName);
    if (existingTarget && existingTarget !== directory) {
      throw new Error(`AI Central has duplicate skill link name '${linkName}'`);
    }
    links.set(linkName, directory);
  }

  return [...links.entries()]
    .map(([linkName, target]) => ({ linkName, target }))
    .sort((left, right) => left.linkName.localeCompare(right.linkName));
}

async function findSteeringLinks() {
  const root = path.join(templatesRoot, 'steering');
  const links = [];

  for (const fileName of sharedSteeringFiles) {
    const target = path.join(root, fileName);
    if (await pathExists(target)) {
      links.push({ linkName: fileName, target });
    }
  }

  return links;
}

async function ensureSymlink(directory, linkName, target) {
  const linkPath = path.join(directory, linkName);
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
    await fs.symlink(target, linkPath);
  }

  return { action: existing ? 'updated' : 'created', linkPath, target };
}

async function main() {
  if (!(await pathExists(path.join(templatesRoot, 'skills')))) {
    console.error(`AI Central templates not found: ${templatesRoot}`);
    console.error('Set AI_CENTRAL_HOME to your ai-central checkout or templates directory.');
    process.exitCode = 1;
    return;
  }

  if (!dryRun) {
    await fs.mkdir(skillsDir, { recursive: true });
    await fs.mkdir(steeringDir, { recursive: true });
  }

  const links = [
    ...(await findSkillLinks()).map((link) => ({ ...link, directory: skillsDir })),
    ...(await findSteeringLinks()).map((link) => ({ ...link, directory: steeringDir }))
  ];
  const results = [];

  for (const link of links) {
    results.push(await ensureSymlink(link.directory, link.linkName, link.target));
  }

  const counts = results.reduce((summary, result) => {
    summary[result.action] = (summary[result.action] ?? 0) + 1;
    return summary;
  }, {});

  for (const result of results.filter(
    (item) => !['unchanged', 'preserved'].includes(item.action)
  )) {
    console.log(
      `${result.action}: ${path.relative(repoRoot, result.linkPath)} -> ${result.target}`
    );
  }

  console.log(
    `AI Central links checked: ${results.length} ` +
      `(created ${counts.created ?? 0}, updated ${counts.updated ?? 0}, ` +
      `unchanged ${counts.unchanged ?? 0}, preserved ${counts.preserved ?? 0})`
  );
}

await main();
