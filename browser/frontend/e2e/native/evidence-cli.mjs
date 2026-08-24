#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';

import { initializeScenarioEvidence } from './evidence.mjs';
import {
  constructStaticRunFailureBundle,
  validateSafeEvidenceRoot
} from './evidence-publisher.mjs';

const command = process.argv[2];
const validArguments =
  (command === 'validate-root' && process.argv.length === 4) ||
  (command === 'ensure-run-failure' && process.argv.length === 5);

if (!validArguments) {
  process.stderr.write(
    'usage: evidence-cli.mjs <validate-root <artifact-root>|ensure-run-failure <artifact-root> <run-id>>\n'
  );
  process.exitCode = 2;
} else {
  try {
    const artifactRoot = path.resolve(process.argv[3]);
    if (command === 'ensure-run-failure') {
      let synthesized = false;
      try {
        await validateSafeEvidenceRoot({ artifactRoot });
      } catch {
        const layout = await initializeScenarioEvidence({
          artifactRoot,
          runId: process.argv[4],
          scenarioId: 'RUN-INFRASTRUCTURE'
        });
        await constructStaticRunFailureBundle({ layout });
        await validateSafeEvidenceRoot({ artifactRoot });
        synthesized = true;
      }
      process.stdout.write('native-e2e-evidence: safe failure bundle available\n');
      if (synthesized) process.exitCode = 1;
    } else {
      const result = await validateSafeEvidenceRoot({ artifactRoot });
      process.stdout.write(`native-e2e-evidence: validated ${result.bundles} safe bundle(s)\n`);
    }
  } catch {
    process.stderr.write('native-e2e-evidence: operation failed\n');
    process.exitCode = 1;
  }
}
