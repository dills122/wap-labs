#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';

import { validateSafeEvidenceRoot } from './evidence-publisher.mjs';

if (process.argv.length !== 4 || process.argv[2] !== 'validate-root') {
  process.stderr.write('usage: evidence-cli.mjs validate-root <artifact-root>\n');
  process.exitCode = 2;
} else {
  try {
    const result = await validateSafeEvidenceRoot({ artifactRoot: path.resolve(process.argv[3]) });
    process.stdout.write(`native-e2e-evidence: validated ${result.bundles} safe bundle(s)\n`);
  } catch {
    process.stderr.write('native-e2e-evidence: validation failed\n');
    process.exitCode = 1;
  }
}
