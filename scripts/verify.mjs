#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { buildPlan, executePlan, PROFILES } from './verify-lib.mjs';

function gitLines(args) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${(result.stderr ?? '').trim()}`);
  }
  return result.stdout.split('\n').filter(Boolean);
}

function changedPaths(base) {
  const paths = [];
  const mergeBase = gitLines(['merge-base', base, 'HEAD'])[0];
  paths.push(...gitLines(['diff', '--name-only', mergeBase, 'HEAD']));
  paths.push(...gitLines(['diff', '--name-only']));
  paths.push(...gitLines(['diff', '--cached', '--name-only']));
  paths.push(...gitLines(['ls-files', '--others', '--exclude-standard']));
  return paths;
}

function usage() {
  console.log(`usage: node scripts/verify.mjs <${PROFILES.join('|')}> [--base <git-ref>]`);
}

const args = process.argv.slice(2);
const profile = args.shift() ?? 'change';
let base = process.env.WAP_VERIFY_BASE ?? 'origin/main';
while (args.length > 0) {
  const flag = args.shift();
  if (flag === '--base' && args.length > 0) {
    base = args.shift();
    continue;
  }
  usage();
  process.exit(2);
}

try {
  const paths = profile === 'change' ? changedPaths(base) : [];
  console.log(`==> verification profile: ${profile}`);
  if (profile === 'change') {
    console.log(`==> change base: ${base}; changed paths: ${new Set(paths).size}`);
  }
  const execution = executePlan(buildPlan(profile, paths));
  console.log(
    `==> verification summary: ${execution.results
      .map((result) => `${result.outcome}=${result.id}`)
      .join(', ')}`
  );
  process.exitCode = execution.exitCode;
} catch (error) {
  console.error(`[FAILURE] verification setup — ${error.message}`);
  usage();
  process.exitCode = 2;
}
