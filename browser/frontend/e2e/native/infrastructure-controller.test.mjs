import assert from 'node:assert/strict';
import test from 'node:test';

import { createGatewayInfrastructureController } from './infrastructure-controller.mjs';

function fixture() {
  const commands = [];
  let running = true;
  const controller = createGatewayInfrastructureController({
    rootDir: '/workspace/wap-labs',
    runId: 'waves-e2e-run-7',
    composeProject: 'waves-e2e-run-7',
    adminBase: 'http://127.0.0.1:49152',
    adminPassword: 'test-secret',
    pollIntervalMs: 10,
    timeoutMs: 100,
    sleep: async () => {},
    runCommand: async (command, arguments_) => {
      commands.push([command, ...arguments_]);
      running = arguments_.includes('unpause');
    },
    fetchImpl: async () => {
      if (!running) throw new Error('connection refused');
      return { ok: true, text: async () => 'Status: running\nwapbox, on-line' };
    }
  });
  return { commands, controller, isRunning: () => running };
}

test('owned gateway outage uses exact Compose scope and restores Kannel health', async () => {
  const { commands, controller, isRunning } = fixture();

  const result = await controller.withGatewayStopped(async () => {
    assert.equal(isRunning(), false);
    return 'observed outage';
  });

  assert.equal(result, 'observed outage');
  assert.equal(isRunning(), true);
  assert.deepEqual(commands, [
    [
      'docker', 'compose', '--project-name', 'waves-e2e-run-7',
      '--file', '/workspace/wap-labs/docker-compose.yml',
      '--file', '/workspace/wap-labs/docker-compose.native-e2e.yml',
      'pause', 'kannel'
    ],
    [
      'docker', 'compose', '--project-name', 'waves-e2e-run-7',
      '--file', '/workspace/wap-labs/docker-compose.yml',
      '--file', '/workspace/wap-labs/docker-compose.native-e2e.yml',
      'unpause', 'kannel'
    ]
  ]);
});

test('gateway recovery waits for an online wapbox after bearerbox reports running', async () => {
  let running = true;
  let recoveryReads = 0;
  let sleeps = 0;
  const controller = createGatewayInfrastructureController({
    rootDir: '/workspace/wap-labs',
    runId: 'waves-e2e-run-7',
    composeProject: 'waves-e2e-run-7',
    adminBase: 'http://127.0.0.1:49152',
    adminPassword: 'test-secret',
    pollIntervalMs: 10,
    timeoutMs: 100,
    sleep: async () => { sleeps += 1; },
    runCommand: async (_command, arguments_) => {
      running = arguments_.includes('unpause');
    },
    fetchImpl: async () => {
      if (!running) throw new Error('connection refused');
      recoveryReads += 1;
      return {
        ok: true,
        text: async () => recoveryReads === 1
          ? 'Status: running\nBox connections:'
          : 'Status: running\nwapbox, on-line'
      };
    }
  });

  await controller.withGatewayStopped(async () => {});

  assert.equal(sleeps, 1, 'bearerbox-only readiness must not release recovery');
  assert.equal(recoveryReads, 2);
});

test('owned gateway outage restores Kannel when the scenario body fails', async () => {
  const { commands, controller, isRunning } = fixture();

  await assert.rejects(
    controller.withGatewayStopped(async () => {
      throw new Error('injected scenario failure');
    }),
    /injected scenario failure/
  );

  assert.equal(isRunning(), true);
  assert.equal(commands.length, 2);
  assert.equal(commands[1].at(-2), 'unpause');
});

test('owned gateway controller rejects mismatched ownership and unsafe admin endpoints', () => {
  const common = {
    rootDir: '/workspace/wap-labs',
    runId: 'waves-e2e-run-7',
    composeProject: 'waves-e2e-run-7',
    adminBase: 'http://127.0.0.1:49152',
    adminPassword: 'test-secret'
  };
  assert.throws(
    () => createGatewayInfrastructureController({ ...common, composeProject: 'another-run' }),
    /must match run identity/
  );
  assert.throws(
    () => createGatewayInfrastructureController({ ...common, adminBase: 'http://example.com' }),
    /loopback/
  );
  assert.throws(
    () => createGatewayInfrastructureController({ ...common, rootDir: 'relative/path' }),
    /absolute repository root/
  );
});

test('owned gateway controller rejects overlapping outage mutations', async () => {
  const { controller } = fixture();
  let release;
  let markStarted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  const held = new Promise((resolve) => { release = resolve; });
  const first = controller.withGatewayStopped(async () => {
    markStarted();
    await held;
  });
  await started;

  await assert.rejects(controller.withGatewayStopped(async () => {}), /already active/);

  release();
  await first;
});

test('owned gateway controller reports both scenario and recovery failures', async () => {
  let running = true;
  const controller = createGatewayInfrastructureController({
    rootDir: '/workspace/wap-labs',
    runId: 'waves-e2e-run-7',
    composeProject: 'waves-e2e-run-7',
    adminBase: 'http://127.0.0.1:49152',
    adminPassword: 'test-secret',
    timeoutMs: 100,
    pollIntervalMs: 10,
    sleep: async () => {},
    runCommand: async (_command, arguments_) => {
      if (arguments_.includes('unpause')) throw new Error('injected recovery failure');
      running = false;
    },
    fetchImpl: async () => {
      if (!running) throw new Error('connection refused');
      return { ok: true, text: async () => 'Status: running\nwapbox, on-line' };
    }
  });

  await assert.rejects(
    controller.withGatewayStopped(async () => {
      throw new Error('injected scenario failure');
    }),
    (error) =>
      error instanceof AggregateError &&
      error.errors.some(({ message }) => message === 'injected scenario failure') &&
      error.errors.some(({ message }) => message === 'injected recovery failure')
  );
});
