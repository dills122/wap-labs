import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildPlan, executePlan, OUTCOMES } from '../verify-lib.mjs';

function byId(plan, id) {
  return plan.find((lane) => lane.id === id);
}

test('fast selects only strict portable smoke lanes', () => {
  const plan = buildPlan('fast', []);
  assert.equal(byId(plan, 'orchestration').selected, true);
  assert.equal(byId(plan, 'repo-hygiene').selected, true);
  assert.equal(byId(plan, 'compliance').selected, false);
  assert.equal(byId(plan, 'live-kannel').selected, false);
});

test('change selects compliance and Atlas for canonical compliance inputs', () => {
  const plan = buildPlan('change', ['spec-processing/source-manifests/wap-1.2.1-wml-scr.json']);
  assert.equal(byId(plan, 'compliance').selected, true);
  assert.equal(byId(plan, 'atlas').selected, true);
  assert.equal(byId(plan, 'transport').selected, false);
});

test('change selects browser, engine stories, and transport for contract changes', () => {
  const plan = buildPlan('change', ['browser/contracts/transport.ts']);
  assert.equal(byId(plan, 'browser').selected, true);
  assert.equal(byId(plan, 'engine-wasm-stories').selected, true);
  assert.equal(byId(plan, 'transport').selected, true);
});

test('root verification surfaces select every ordinary change lane', () => {
  const plan = buildPlan('change', ['package.json']);
  for (const lane of plan.filter((item) => !item.extendedOnly)) {
    assert.equal(lane.selected, true, lane.id);
  }
  assert.equal(byId(plan, 'live-kannel').selected, false);
});

test('full intentionally excludes live external gates', () => {
  const plan = buildPlan('full', []);
  assert.equal(byId(plan, 'compliance').selected, true);
  assert.equal(byId(plan, 'browser').selected, true);
  assert.equal(byId(plan, 'live-kannel').selected, false);
  assert.match(byId(plan, 'live-kannel').selectionReason, /explicit extended profile/);
});

test('full builds the WASM package before workspace typecheck', () => {
  const workspace = byId(buildPlan('full', []), 'workspace-quality');
  const labels = workspace.commands.map((command) => command.label);
  assert.ok(
    labels.indexOf('WaveNav WASM package prerequisite') < labels.indexOf('workspace typecheck')
  );
});

test('full keeps the platform-sensitive frontend coverage threshold in GitHub CI', () => {
  const browser = byId(buildPlan('full', []), 'browser');
  const frontend = browser.commands.find((command) =>
    command.label.startsWith('browser frontend')
  );
  assert.equal(frontend.label, 'browser frontend unit tests');
  assert.deepEqual(frontend.args, ['--dir', 'browser/frontend', 'test']);
});

test('extended selects live smoke and keeps baseline advisory', () => {
  const plan = buildPlan('extended', []);
  assert.equal(byId(plan, 'live-kannel').selected, true);
  assert.equal(byId(plan, 'browser-baseline').selected, true);
  assert.equal(byId(plan, 'browser-baseline').advisory, true);
});

test('missing required prerequisite is unavailable and fails the run', () => {
  const plan = [
    {
      id: 'required',
      label: 'required lane',
      selected: true,
      prerequisites: [{ kind: 'command', value: 'missing', remediation: 'install it' }],
      commands: []
    }
  ];
  const lines = [];
  const execution = executePlan(plan, {
    checkPrerequisite: () => false,
    write: (line) => lines.push(line)
  });
  assert.equal(execution.exitCode, 1);
  assert.equal(execution.results[0].outcome, OUTCOMES.unavailable);
  assert.match(lines[0], /UNAVAILABLE PREREQUISITE/);
});

test('required command failure propagates while advisory failure does not', () => {
  const required = {
    id: 'required',
    label: 'required lane',
    selected: true,
    commands: [{ label: 'required command' }]
  };
  const advisory = {
    id: 'advisory',
    label: 'advisory lane',
    selected: true,
    advisory: true,
    commands: [{ label: 'advisory command' }]
  };
  const failed = executePlan([required, advisory], {
    runCommand: () => ({ status: 9 }),
    write: () => {}
  });
  assert.equal(failed.exitCode, 1);
  assert.deepEqual(
    failed.results.map((result) => result.outcome),
    [OUTCOMES.failure, OUTCOMES.advisory]
  );

  const advisoryOnly = executePlan([advisory], {
    runCommand: () => ({ status: 7 }),
    write: () => {}
  });
  assert.equal(advisoryOnly.exitCode, 0);
});

test('unselected lane is reported as an intentional exclusion', () => {
  const lines = [];
  const execution = executePlan(
    [
      {
        id: 'excluded',
        label: 'external lane',
        selected: false,
        selectionReason: 'manual only'
      }
    ],
    { write: (line) => lines.push(line) }
  );
  assert.equal(execution.exitCode, 0);
  assert.equal(execution.results[0].outcome, OUTCOMES.excluded);
  assert.match(lines[0], /INTENTIONAL EXCLUSION/);
});

test('root compliance wrapper and CI enforce program and requirement status drift', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.match(packageJson.scripts['wap-compliance:check'], /check-wap-compliance-program\.mjs/);
  assert.match(packageJson.scripts['wap-compliance:check'], /check-requirement-status-drift\.mjs/);

  const workflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(workflow, /compliance: \$\{\{ steps\.filter\.outputs\.compliance \}\}/);
  assert.match(workflow, /name: WAP Compliance and Status Drift/);
  assert.match(workflow, /run: pnpm run wap-compliance:check/);
  assert.match(workflow, /COMPLIANCE_RESULT: \$\{\{ needs\.compliance\.result \}\}/);
});
