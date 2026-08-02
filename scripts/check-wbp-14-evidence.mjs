import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'docs/waves/wbp-14-desktop-evidence.json');

const requiredScenarios = [
  'startup',
  'success',
  'softkeys-and-keyboard',
  'pointer-parity',
  'scroll-and-viewport',
  'loading-phases',
  'timeout',
  'cancellation',
  'history',
  'invalid-deck',
  'script-trap',
  'failure-recovery',
  'crash-recovery',
  'native-wasm-parity',
  'interaction-latency',
  'memory-bound',
  'zoom-and-reflow',
  'screen-reader',
  'sanitized-replay'
];
const validStatuses = new Set(['complete', 'partial', 'missing', 'blocked']);
const validEvidenceClasses = new Set(['fixture', 'native-gateway', 'packaged-manual']);

export function validateEvidenceManifest(manifest, repositoryRoot = root) {
  const failures = [];
  if (manifest.schemaVersion !== 1 || manifest.workItem !== 'WBP-14') {
    failures.push('manifest must identify WBP-14 schema version 1');
  }
  if (!Array.isArray(manifest.scenarios)) {
    return [...failures, 'scenarios must be an array'];
  }

  const byId = new Map();
  for (const scenario of manifest.scenarios) {
    if (!scenario?.id || byId.has(scenario.id)) {
      failures.push(`scenario id is missing or duplicated: ${scenario?.id ?? '<missing>'}`);
      continue;
    }
    byId.set(scenario.id, scenario);
    if (!validStatuses.has(scenario.status)) {
      failures.push(`${scenario.id}: invalid status ${scenario.status}`);
    }
    if (!validEvidenceClasses.has(scenario.evidenceClass)) {
      failures.push(`${scenario.id}: invalid evidence class ${scenario.evidenceClass}`);
    }
    if (!Array.isArray(scenario.workItems) || !scenario.workItems.includes('WBP-14')) {
      failures.push(`${scenario.id}: workItems must include WBP-14`);
    }
    if (!Array.isArray(scenario.requirements) || !Array.isArray(scenario.evidence)) {
      failures.push(`${scenario.id}: requirements and evidence must be arrays`);
      continue;
    }
    for (const evidencePath of scenario.evidence) {
      if (!fs.existsSync(path.join(repositoryRoot, evidencePath))) {
        failures.push(`${scenario.id}: evidence path does not exist: ${evidencePath}`);
      }
    }
    if (scenario.status === 'complete' && scenario.evidence.length === 0) {
      failures.push(`${scenario.id}: complete scenarios require direct evidence`);
    }
    if (scenario.status !== 'complete' && !scenario.blocker) {
      failures.push(`${scenario.id}: incomplete scenarios require an explicit blocker`);
    }
  }

  for (const id of requiredScenarios) {
    if (!byId.has(id)) {
      failures.push(`required scenario is absent: ${id}`);
    }
  }

  const incomplete = manifest.scenarios.some((scenario) => scenario.status !== 'complete');
  if (manifest.releaseComplete && incomplete) {
    failures.push('releaseComplete cannot be true while a required scenario is incomplete');
  }
  if (
    !Array.isArray(manifest.explicitComplianceGaps) ||
    manifest.explicitComplianceGaps.length === 0
  ) {
    failures.push('explicit compliance gaps must remain recorded');
  }
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const failures = validateEvidenceManifest(manifest);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL ${failure}`);
    }
    process.exitCode = 1;
  } else {
    const totals = Object.groupBy(manifest.scenarios, ({ status }) => status);
    console.log(
      `PASS WBP-14 evidence inventory (${manifest.scenarios.length} scenarios; ` +
        `${totals.complete?.length ?? 0} complete, ${totals.partial?.length ?? 0} partial, ` +
        `${totals.missing?.length ?? 0} missing, ${totals.blocked?.length ?? 0} blocked)`
    );
  }
}
