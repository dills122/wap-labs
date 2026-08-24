import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runNativeE2E } from './runtime.mjs';

test('native runtime starts one isolated provider session and safe result per scenario', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  const starts = [];
  const stops = [];
  try {
    const results = await runNativeE2E({
      scenarios: [
        { id: 'ONE', suite: 'smoke', name: 'one', secretBearing: false, async run(context) {
          assert.equal(context.waves.kind, 'waves-page');
          context.recordAssertion('one passed', 'bounded detail');
        } },
        { id: 'TWO', suite: 'smoke', name: 'two', secretBearing: false, async run() {} }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-1',
      origin: { readCounter: async () => 0, waitForExactlyOne: async () => ({}) },
      selector: (value) => value,
      keys: { Enter: 'Enter' },
      provider: {
        async startSession(options) {
          starts.push(options);
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() { stops.push(options.environment.XDG_DATA_HOME); return {
              webdriverSession: 'closed', processGroup: 'terminated'
            }; }
          };
        }
      },
      createWaves: () => ({ kind: 'waves-page' })
    });

    assert.deepEqual(results.map(({ result }) => result), ['pass', 'pass']);
    assert.equal(starts.length, 2);
    assert.equal(new Set(starts.map(({ environment }) => environment.XDG_DATA_HOME)).size, 2);
    assert.equal(stops.length, 2);
    for (const id of ['one', 'two']) {
      const resultPath = path.join(artifactRoot, 'run-1', id, 'safe-upload', 'result.json');
      const result = JSON.parse(await readFile(resultPath, 'utf8'));
      assert.equal(result.scenarioId, id.toUpperCase());
      assert.equal(result.result, 'pass');
      assert.equal((await stat(resultPath)).mode & 0o777, 0o600);
    }
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime safe result omits arbitrary thrown error text', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  try {
    await runNativeE2E({
      scenarios: [{ id: 'FAIL', suite: 'smoke', name: 'failure', secretBearing: false, async run() {
        throw new Error('do-not-retain-this-runtime-value');
      } }],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-2',
      origin: {},
      selector: (value) => value,
      provider: {
        async startSession() {
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() { return { webdriverSession: 'closed', processGroup: 'terminated' }; }
          };
        }
      },
      createWaves: () => ({})
    });
    const retained = await readFile(
      path.join(artifactRoot, 'run-2', 'fail', 'safe-upload', 'result.json'),
      'utf8'
    );
    assert.doesNotMatch(retained, /do-not-retain/);
    assert.match(retained, /"result": "fail"/);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime creates fresh in-memory authentication data only for secret scenarios', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  const created = [];
  try {
    await runNativeE2E({
      scenarios: [{ id: 'AUTH', suite: 'smoke', name: 'auth', secretBearing: true, async run({ testData }) {
        assert.equal(testData.pin, '4927');
      } }],
      application: '/tmp/waves-app', artifactRoot, runId: 'run-auth', origin: {},
      selector: (value) => value,
      testDataFactory(id) { created.push(id); return { pin: '4927' }; },
      provider: { async startSession() { return {
        driver: { findElement() {}, executeScript() {} },
        async stop() { return { webdriverSession: 'closed', processGroup: 'terminated' }; }
      }; } },
      createWaves: () => ({})
    });
    assert.deepEqual(created, ['AUTH']);
    const retained = await readFile(
      path.join(artifactRoot, 'run-auth', 'auth', 'safe-upload', 'result.json'), 'utf8'
    );
    assert.doesNotMatch(retained, /4927/);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});
