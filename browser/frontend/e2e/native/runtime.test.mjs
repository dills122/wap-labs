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
  const infrastructure = { kind: 'owned-infrastructure' };
  try {
    const results = await runNativeE2E({
      scenarios: [
        {
          id: 'ONE',
          suite: 'smoke',
          name: 'one',
          secretBearing: false,
          async run(context) {
            assert.equal(context.waves.kind, 'waves-page');
            assert.equal(context.infrastructure, infrastructure);
            context.recordAssertion('native startup', 'bounded detail');
          }
        },
        { id: 'TWO', suite: 'smoke', name: 'two', secretBearing: false, async run() {} }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-1',
      origin: { readCounter: async () => 0, waitForExactlyOne: async () => ({}) },
      infrastructure,
      selector: (value) => value,
      keys: { Enter: 'Enter' },
      provider: {
        async startSession(options) {
          starts.push(options);
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              stops.push(options.environment.XDG_DATA_HOME);
              return {
                webdriverSession: 'closed',
                processGroup: 'terminated'
              };
            }
          };
        }
      },
      createWaves: () => ({ kind: 'waves-page' })
    });

    assert.deepEqual(
      results.map(({ result }) => result),
      ['pass', 'pass']
    );
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

test('native runtime preserves driver output across failed startup attempts', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  try {
    await runNativeE2E({
      scenarios: [
        {
          id: 'RETRY-OUTPUT',
          suite: 'smoke',
          name: 'retry output',
          secretBearing: false,
          async run() {}
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-retry-output',
      origin: {},
      selector: (value) => value,
      provider: {
        async startSession(options) {
          const { once } = await import('node:events');
          const { Readable } = await import('node:stream');
          const first = {
            stdout: Readable.from(['attempt-one\n']),
            stderr: Readable.from([])
          };
          options.onProcessStarted(first);
          await once(first.stdout, 'end');

          const second = {
            stdout: Readable.from(['attempt-two\n']),
            stderr: Readable.from([])
          };
          options.onProcessStarted(second);
          await once(second.stdout, 'end');
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              return { webdriverSession: 'closed', processGroup: 'terminated' };
            }
          };
        }
      },
      createWaves: () => ({})
    });

    const retained = await readFile(
      path.join(artifactRoot, 'run-retry-output', 'retry-output', 'raw', 'tauri-driver.stdout.log'),
      'utf8'
    );
    assert.equal(retained, 'attempt-one\nattempt-two\n');
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime turns a raw secret canary into only a static failed bundle', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  try {
    const results = await runNativeE2E({
      scenarios: [
        { id: 'CANARY', suite: 'smoke', name: 'canary', secretBearing: true, async run() {} }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-canary',
      origin: {},
      selector: (value) => value,
      testDataFactory: () => ({ pin: '4927' }),
      provider: {
        async startSession(options) {
          const { Readable } = await import('node:stream');
          options.onProcessStarted({
            stdout: Readable.from(['unexpected 4927']),
            stderr: Readable.from([])
          });
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              return { webdriverSession: 'closed', processGroup: 'terminated' };
            }
          };
        }
      },
      createWaves: () => ({})
    });
    assert.equal(results[0].result, 'fail');
    const safeDirectory = path.join(artifactRoot, 'run-canary', 'canary', 'safe-upload');
    assert.deepEqual(await (await import('node:fs/promises')).readdir(safeDirectory), [
      'sanitizer-failure.json'
    ]);
    const retained = await readFile(path.join(safeDirectory, 'sanitizer-failure.json'), 'utf8');
    assert.doesNotMatch(retained, /4927/);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime safe result omits arbitrary thrown error text', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  try {
    await runNativeE2E({
      scenarios: [
        {
          id: 'FAIL',
          suite: 'smoke',
          name: 'failure',
          secretBearing: false,
          async run({ observe }) {
            observe({ phase: 'ui-dispatched' });
            throw new Error('do-not-retain-this-runtime-value');
          }
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-2',
      origin: {},
      selector: (value) => value,
      provider: {
        async startSession() {
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              return { webdriverSession: 'closed', processGroup: 'terminated' };
            }
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
    const result = JSON.parse(retained);
    assert.equal(result.failureClass, 'response-rendering');
    assert.deepEqual(result.checkpoints, [{ phase: 'ui-dispatched' }]);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime creates fresh in-memory authentication data only for secret scenarios', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  const created = [];
  try {
    await runNativeE2E({
      scenarios: [
        {
          id: 'AUTH',
          suite: 'smoke',
          name: 'auth',
          secretBearing: true,
          async run({ testData }) {
            assert.equal(testData.pin, '4927');
          }
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-auth',
      origin: {},
      selector: (value) => value,
      testDataFactory(id) {
        created.push(id);
        return { pin: '4927' };
      },
      provider: {
        async startSession() {
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              return { webdriverSession: 'closed', processGroup: 'terminated' };
            }
          };
        }
      },
      createWaves: () => ({})
    });
    assert.deepEqual(created, ['AUTH']);
    const retained = await readFile(
      path.join(artifactRoot, 'run-auth', 'auth', 'safe-upload', 'result.json'),
      'utf8'
    );
    assert.doesNotMatch(retained, /4927/);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime passes abort through startup and immediately stops a session returned after abort', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  const controller = new AbortController();
  let runs = 0;
  let stops = 0;
  try {
    const results = await runNativeE2E({
      scenarios: [
        {
          id: 'ABORT-START',
          suite: 'smoke',
          name: 'abort',
          secretBearing: false,
          async run() {
            runs += 1;
          }
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-abort',
      origin: {},
      selector: (value) => value,
      signal: controller.signal,
      provider: {
        async startSession(options) {
          assert.notEqual(options.signal, controller.signal);
          controller.abort(new Error('stop requested'));
          assert.equal(options.signal.aborted, true);
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              stops += 1;
              return { webdriverSession: 'closed', processGroup: 'terminated' };
            }
          };
        }
      },
      createWaves: () => ({})
    });

    assert.equal(runs, 0);
    assert.equal(stops, 1);
    assert.equal(results[0].result, 'fail');
    assert.equal(results[0].error.name, 'AbortError');
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime stops the provider when Waves driver construction fails', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  let stops = 0;
  try {
    const [result] = await runNativeE2E({
      scenarios: [
        {
          id: 'DRIVER-FAIL',
          suite: 'smoke',
          name: 'driver failure',
          secretBearing: false,
          async run() {}
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-driver-fail',
      origin: {},
      selector: (value) => value,
      provider: {
        async startSession() {
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              stops += 1;
              return { webdriverSession: 'closed', processGroup: 'terminated' };
            }
          };
        }
      },
      createWaves() {
        throw new Error('injected Waves driver construction failure');
      }
    });

    assert.equal(stops, 1);
    assert.equal(result.result, 'fail');
    assert.equal(result.failureClass, 'infrastructure-startup');
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime stops the suite when driver construction cleanup cannot release ownership', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  let starts = 0;
  let runs = 0;
  try {
    const results = await runNativeE2E({
      scenarios: [
        {
          id: 'DRIVER-CLEANUP-FAIL',
          suite: 'smoke',
          name: 'driver cleanup failure',
          secretBearing: false,
          async run() {
            runs += 1;
          }
        },
        {
          id: 'MUST-NOT-START',
          suite: 'smoke',
          name: 'must not start',
          secretBearing: false,
          async run() {
            runs += 1;
          }
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-driver-cleanup-fail',
      origin: {},
      selector: (value) => value,
      provider: {
        async startSession() {
          starts += 1;
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              throw new Error('injected provider cleanup failure');
            }
          };
        }
      },
      createWaves() {
        throw new Error('injected Waves driver construction failure');
      }
    });

    assert.equal(starts, 1);
    assert.equal(runs, 0);
    assert.equal(results.length, 1);
    assert.equal(results[0].error.name, 'NativeE2EOwnershipError');
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime stops the suite when driver construction cleanup reports an owned process', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  let starts = 0;
  try {
    const results = await runNativeE2E({
      scenarios: [
        {
          id: 'DRIVER-PROCESS-OWNED',
          suite: 'smoke',
          name: 'driver process remains owned',
          secretBearing: false,
          async run() {}
        },
        {
          id: 'MUST-NOT-START',
          suite: 'smoke',
          name: 'must not start',
          secretBearing: false,
          async run() {}
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-driver-process-owned',
      origin: {},
      selector: (value) => value,
      provider: {
        async startSession() {
          starts += 1;
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              return { webdriverSession: 'closed', processGroup: 'cleanup-failed' };
            }
          };
        }
      },
      createWaves() {
        throw new Error('injected Waves driver construction failure');
      }
    });

    assert.equal(starts, 1);
    assert.equal(results.length, 1);
    assert.equal(results[0].error.name, 'NativeE2EOwnershipError');
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime publishes a static safe result when scenario ownership is unresolved', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  try {
    const [result] = await runNativeE2E({
      scenarios: [
        {
          id: 'OWNERSHIP-FAIL',
          suite: 'smoke',
          name: 'ownership failure',
          secretBearing: true,
          async run() {}
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-ownership-fail',
      origin: {},
      selector: (value) => value,
      testDataFactory: () => ({ pin: '4927' }),
      provider: {
        async startSession() {
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              return { webdriverSession: 'closed', processGroup: 'cleanup-failed' };
            }
          };
        }
      },
      createWaves: () => ({})
    });

    assert.equal(result.result, 'fail');
    const scenarioRoot = path.join(artifactRoot, 'run-ownership-fail', 'ownership-fail');
    const safeFiles = await (
      await import('node:fs/promises')
    ).readdir(path.join(scenarioRoot, 'safe-upload'));
    assert.deepEqual(safeFiles, ['run-failure.json']);
    assert.deepEqual(
      JSON.parse(
        await readFile(path.join(scenarioRoot, 'safe-upload', 'run-failure.json'), 'utf8')
      ),
      { schemaVersion: 1, mode: 'run-failure', result: 'fail', phase: 'ownership' }
    );
    assert.equal((await stat(path.join(scenarioRoot, 'raw'))).isDirectory(), true);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});

test('native runtime removes restricted authentication evidence after delayed ownership release', async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-runtime-'));
  let releaseStop;
  const stopSettlement = new Promise((resolve) => {
    releaseStop = resolve;
  });
  let confirmRestrictedCleanup;
  const restrictedCleanup = new Promise((resolve) => {
    confirmRestrictedCleanup = resolve;
  });
  try {
    const [result] = await runNativeE2E({
      scenarios: [
        {
          id: 'DELAYED-OWNERSHIP',
          suite: 'smoke',
          name: 'delayed ownership',
          secretBearing: true,
          async run() {}
        }
      ],
      application: '/tmp/waves-app',
      artifactRoot,
      runId: 'run-delayed-ownership',
      origin: {},
      selector: (value) => value,
      cleanupTimeoutMs: 10,
      testDataFactory: () => ({ pin: '4927' }),
      async cleanupRestricted(layout) {
        const { cleanupRestrictedEvidence } = await import('./evidence.mjs');
        await cleanupRestrictedEvidence(layout);
        confirmRestrictedCleanup();
      },
      provider: {
        async startSession() {
          return {
            driver: { findElement() {}, executeScript() {} },
            async stop() {
              return stopSettlement;
            }
          };
        }
      },
      createWaves: () => ({})
    });

    assert.equal(result.result, 'fail');
    const scenarioRoot = path.join(artifactRoot, 'run-delayed-ownership', 'delayed-ownership');
    assert.deepEqual(
      JSON.parse(
        await readFile(path.join(scenarioRoot, 'safe-upload', 'run-failure.json'), 'utf8')
      ),
      { schemaVersion: 1, mode: 'run-failure', result: 'fail', phase: 'ownership' }
    );
    assert.equal((await stat(path.join(scenarioRoot, 'raw'))).isDirectory(), true);

    releaseStop({ webdriverSession: 'closed', processGroup: 'terminated' });
    await restrictedCleanup;
    await assert.rejects(stat(path.join(scenarioRoot, 'raw')), { code: 'ENOENT' });
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});
