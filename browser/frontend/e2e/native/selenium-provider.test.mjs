import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import {
  createSeleniumProvider,
  reserveLoopbackPorts,
  terminateSpawnedProcess
} from './selenium-provider.mjs';

test('loopback port leases keep distinct assigned ports locked until release', async () => {
  const assignedPorts = [47001, 47002];
  const lockedPorts = new Set();
  let closeCount = 0;
  const createServer = () => {
    const server = new EventEmitter();
    let port;
    server.listen = ({ host, port: requestedPort, exclusive }) => {
      assert.equal(host, '127.0.0.1');
      assert.equal(requestedPort, 0);
      assert.equal(exclusive, true);
      port = assignedPorts.shift();
      lockedPorts.add(port);
      queueMicrotask(() => server.emit('listening'));
    };
    server.address = () => ({ address: '127.0.0.1', family: 'IPv4', port });
    server.close = (callback) => {
      closeCount += 1;
      lockedPorts.delete(port);
      queueMicrotask(() => callback());
    };
    return server;
  };

  const lease = await reserveLoopbackPorts({ count: 2, createServer });
  assert.equal(lease.host, '127.0.0.1');
  assert.deepEqual(lease.ports, [47001, 47002]);
  assert.deepEqual([...lockedPorts], [47001, 47002]);

  await lease.release();
  await lease.release();
  assert.deepEqual([...lockedPorts], []);
  assert.equal(closeCount, 2);
});

test('loopback port reservation releases earlier locks when a later bind fails', async () => {
  let createCount = 0;
  let firstServerClosed = false;
  const createServer = () => {
    createCount += 1;
    const server = new EventEmitter();
    server.listen = () => {
      queueMicrotask(() => {
        if (createCount === 1) {
          server.emit('listening');
        } else {
          server.emit('error', Object.assign(new Error('bind failed'), { code: 'EADDRINUSE' }));
        }
      });
    };
    server.address = () => ({ address: '127.0.0.1', family: 'IPv4', port: 48001 });
    server.close = (callback) => {
      firstServerClosed = true;
      queueMicrotask(() => callback());
    };
    return server;
  };

  await assert.rejects(
    reserveLoopbackPorts({ count: 2, createServer }),
    (error) => error?.code === 'EADDRINUSE'
  );
  assert.equal(firstServerClosed, true);
});

const createChild = (pid) => {
  const child = new EventEmitter();
  child.pid = pid;
  child.exitCode = null;
  child.signalCode = null;
  return child;
};

test('provider releases each port lease before spawn and retries fresh ports after startup failure', async () => {
  const events = [];
  const leases = [
    {
      host: '127.0.0.1',
      ports: [41001, 41002],
      release: async () => events.push('release-1')
    },
    {
      host: '127.0.0.1',
      ports: [42001, 42002],
      release: async () => events.push('release-2')
    }
  ];
  const children = [createChild(101), createChild(102)];
  const fakeDriver = { quit: async () => events.push('quit-driver') };
  let readinessAttempt = 0;

  const provider = createSeleniumProvider({
    reservePorts: async () => leases.shift(),
    spawnProcess: (command, arguments_, options) => {
      assert.equal(command, 'tauri-driver');
      assert.deepEqual(options.env, { RUN_ID: 'test-run' });
      events.push({ arguments: arguments_, detached: options.detached });
      assert.match(events.at(-2), /^release-/);
      return children.shift();
    },
    waitUntilReady: async ({ driverUrl }) => {
      readinessAttempt += 1;
      events.push(`ready-${driverUrl}`);
      if (readinessAttempt === 1) {
        throw new Error('address was claimed before tauri-driver bound it');
      }
    },
    buildDriver: async (options) => {
      events.push({ build: options });
      return fakeDriver;
    },
    terminateProcess: async (child) => {
      events.push(`terminate-${child.pid}`);
      return 'terminated';
    },
    platform: 'linux'
  });

  const session = await provider.startSession({
    application: '/tmp/wavenav_host',
    environment: { RUN_ID: 'test-run' },
    maxStartupAttempts: 2,
    startupTimeoutMs: 500,
    pollIntervalMs: 10
  });

  assert.equal(session.driver, fakeDriver);
  assert.equal(session.driverUrl, 'http://127.0.0.1:42001/');
  assert.deepEqual(session.ports, { intermediary: 42001, native: 42002 });
  assert.deepEqual(events, [
    'release-1',
    {
      arguments: [
        '--port',
        '41001',
        '--native-port',
        '41002',
        '--native-host',
        '127.0.0.1'
      ],
      detached: true
    },
    'ready-http://127.0.0.1:41001/',
    'terminate-101',
    'release-2',
    {
      arguments: [
        '--port',
        '42001',
        '--native-port',
        '42002',
        '--native-host',
        '127.0.0.1'
      ],
      detached: true
    },
    'ready-http://127.0.0.1:42001/',
    {
      build: {
        application: '/tmp/wavenav_host',
        driverUrl: 'http://127.0.0.1:42001/'
      }
    }
  ]);
});

test('provider releases an invalid lease before rejecting configuration', async () => {
  let released = false;
  const provider = createSeleniumProvider({
    reservePorts: async () => ({
      host: '127.0.0.1',
      ports: [42001, 42001],
      release: async () => {
        released = true;
      }
    }),
    spawnProcess: () => {
      throw new Error('must not spawn with an invalid lease');
    }
  });

  await assert.rejects(
    provider.startSession({ application: '/tmp/wavenav_host' }),
    /provider ports must be distinct/
  );
  assert.equal(released, true);
});

for (const { name, options, message } of [
  {
    name: 'zero startup timeout',
    options: { startupTimeoutMs: 0 },
    message: 'startupTimeoutMs must be positive'
  },
  {
    name: 'zero session build timeout',
    options: { sessionBuildTimeoutMs: 0 },
    message: 'sessionBuildTimeoutMs must be positive'
  },
  {
    name: 'zero session close timeout',
    options: { sessionCloseTimeoutMs: 0 },
    message: 'sessionCloseTimeoutMs must be positive'
  },
  {
    name: 'zero poll interval',
    options: { pollIntervalMs: 0 },
    message: 'pollIntervalMs must be positive'
  },
  {
    name: 'zero startup attempts',
    options: { maxStartupAttempts: 0 },
    message: 'maxStartupAttempts must be positive'
  }
]) {
  test(`provider rejects ${name} before reserving resources`, async () => {
    let reservations = 0;
    const provider = createSeleniumProvider({
      reservePorts: async () => {
        reservations += 1;
        throw new Error('must not reserve for invalid configuration');
      }
    });

    await assert.rejects(
      provider.startSession({ application: '/tmp/wavenav_host', ...options }),
      new RegExp(message)
    );
    assert.equal(reservations, 0);
  });
}

test('provider stop is idempotent and cleans the WebDriver session before its process group', async () => {
  const events = [];
  const child = createChild(201);
  const driver = { quit: async () => events.push('quit-driver') };
  const provider = createSeleniumProvider({
    reservePorts: async () => ({
      host: '127.0.0.1',
      ports: [43001, 43002],
      release: async () => undefined
    }),
    spawnProcess: () => child,
    waitUntilReady: async () => undefined,
    buildDriver: async () => driver,
    terminateProcess: async () => {
      events.push('terminate-process');
      return 'terminated';
    }
  });
  const session = await provider.startSession({ application: '/tmp/wavenav_host' });

  const first = await session.stop();
  const second = await provider.stopSession(session);

  assert.deepEqual(first, { webdriverSession: 'closed', processGroup: 'terminated' });
  assert.equal(second, first);
  assert.deepEqual(events, ['quit-driver', 'terminate-process']);
});

test('provider cleans the spawned process when WebDriver session construction fails', async () => {
  const child = createChild(301);
  const terminated = [];
  const provider = createSeleniumProvider({
    reservePorts: async () => ({
      host: '127.0.0.1',
      ports: [44001, 44002],
      release: async () => undefined
    }),
    spawnProcess: () => child,
    waitUntilReady: async () => undefined,
    buildDriver: async () => {
      throw new Error('session rejected');
    },
    terminateProcess: async (process) => {
      terminated.push(process.pid);
      return 'terminated';
    }
  });

  await assert.rejects(
    provider.startSession({ application: '/tmp/wavenav_host', maxStartupAttempts: 1 }),
    /failed to construct the WebDriver session/
  );
  assert.deepEqual(terminated, [301]);
});

test('provider bounds a hung WebDriver session construction before terminating the process', async () => {
  const terminated = [];
  const provider = createSeleniumProvider({
    reservePorts: async () => ({
      host: '127.0.0.1',
      ports: [44011, 44012],
      release: async () => undefined
    }),
    spawnProcess: () => createChild(302),
    waitUntilReady: async () => undefined,
    buildDriver: async () => new Promise(() => undefined),
    terminateProcess: async (process) => {
      terminated.push(process.pid);
      return 'terminated';
    }
  });

  await assert.rejects(
    provider.startSession({
      application: '/tmp/wavenav_host',
      maxStartupAttempts: 1,
      sessionBuildTimeoutMs: 5
    }),
    /failed to construct the WebDriver session/
  );
  assert.deepEqual(terminated, [302]);
});

test('provider retries fresh ports when the native driver race breaks session construction', async () => {
  const leases = [
    { host: '127.0.0.1', ports: [44101, 44102], release: async () => undefined },
    { host: '127.0.0.1', ports: [44201, 44202], release: async () => undefined }
  ];
  const children = [createChild(311), createChild(312)];
  const terminated = [];
  let builds = 0;
  const driver = { quit: async () => undefined };
  const provider = createSeleniumProvider({
    reservePorts: async () => leases.shift(),
    spawnProcess: () => children.shift(),
    waitUntilReady: async () => undefined,
    buildDriver: async () => {
      builds += 1;
      if (builds === 1) {
        throw new Error('native WebDriver port was claimed');
      }
      return driver;
    },
    terminateProcess: async (child) => {
      terminated.push(child.pid);
      return 'terminated';
    }
  });

  const session = await provider.startSession({
    application: '/tmp/wavenav_host',
    maxStartupAttempts: 2
  });

  assert.equal(session.driver, driver);
  assert.deepEqual(session.ports, { intermediary: 44201, native: 44202 });
  assert.deepEqual(terminated, [311]);
});

test('provider detects an early tauri-driver exit without waiting for readiness timeout', async () => {
  const child = createChild(401);
  const provider = createSeleniumProvider({
    reservePorts: async () => ({
      host: '127.0.0.1',
      ports: [45001, 45002],
      release: async () => undefined
    }),
    spawnProcess: () => {
      queueMicrotask(() => {
        child.exitCode = 2;
        child.emit('exit', 2, null);
      });
      return child;
    },
    waitUntilReady: async () => new Promise(() => undefined),
    terminateProcess: async () => 'already-exited'
  });

  await assert.rejects(
    provider.startSession({
      application: '/tmp/wavenav_host',
      maxStartupAttempts: 1,
      startupTimeoutMs: 10_000
    }),
    /tauri-driver exited before WebDriver readiness \(code 2\)/
  );
});

test('provider detects a process that exited synchronously during spawn', async () => {
  const child = createChild(402);
  child.exitCode = 3;
  const provider = createSeleniumProvider({
    reservePorts: async () => ({
      host: '127.0.0.1',
      ports: [45101, 45102],
      release: async () => undefined
    }),
    spawnProcess: () => child,
    waitUntilReady: async () => {
      throw new Error('readiness should not hide an exited process');
    },
    terminateProcess: async () => 'already-exited'
  });

  await assert.rejects(
    provider.startSession({
      application: '/tmp/wavenav_host',
      maxStartupAttempts: 1
    }),
    /tauri-driver exited before WebDriver readiness \(code 3\)/
  );
});

test('provider does not retry when failed-attempt process cleanup cannot be proven', async () => {
  let reservations = 0;
  const provider = createSeleniumProvider({
    reservePorts: async () => {
      reservations += 1;
      return {
        host: '127.0.0.1',
        ports: [46001, 46002],
        release: async () => undefined
      };
    },
    spawnProcess: () => createChild(501),
    waitUntilReady: async () => {
      throw new Error('not ready');
    },
    terminateProcess: async () => 'cleanup-failed'
  });

  await assert.rejects(
    provider.startSession({
      application: '/tmp/wavenav_host',
      maxStartupAttempts: 3
    }),
    /cleanup failed after startup attempt 1/
  );
  assert.equal(reservations, 1);
});

test('process termination escalates from TERM to KILL and reports bounded cleanup', async () => {
  const child = createChild(601);
  const signals = [];
  let current = 0;
  let alive = true;

  const result = await terminateSpawnedProcess(child, {
    signalProcess: (_process, signal) => {
      signals.push(signal);
      if (signal === 'SIGKILL') {
        alive = false;
      }
    },
    isProcessAlive: () => alive,
    now: () => current,
    sleep: async (milliseconds) => {
      current += milliseconds;
    },
    terminateTimeoutMs: 20,
    killTimeoutMs: 10,
    pollIntervalMs: 10
  });

  assert.equal(result, 'killed');
  assert.deepEqual(signals, ['SIGTERM', 'SIGKILL']);
  assert.equal(current, 20);
});

test('provider still terminates its process when WebDriver quit rejects', async () => {
  const events = [];
  const provider = createSeleniumProvider({
    reservePorts: async () => ({
      host: '127.0.0.1',
      ports: [49001, 49002],
      release: async () => undefined
    }),
    spawnProcess: () => createChild(701),
    waitUntilReady: async () => undefined,
    buildDriver: async () => ({
      quit: async () => {
        events.push('quit-rejected');
        throw new Error('already gone');
      }
    }),
    terminateProcess: async () => {
      events.push('terminate-process');
      return 'terminated';
    }
  });
  const session = await provider.startSession({ application: '/tmp/wavenav_host' });

  assert.deepEqual(await session.stop(), {
    webdriverSession: 'close-failed',
    processGroup: 'terminated'
  });
  assert.deepEqual(events, ['quit-rejected', 'terminate-process']);
});

test('provider bounds a hung WebDriver quit before terminating its process', async () => {
  const events = [];
  const provider = createSeleniumProvider({
    reservePorts: async () => ({
      host: '127.0.0.1',
      ports: [49101, 49102],
      release: async () => undefined
    }),
    spawnProcess: () => createChild(702),
    waitUntilReady: async () => undefined,
    buildDriver: async () => ({ quit: async () => new Promise(() => undefined) }),
    terminateProcess: async () => {
      events.push('terminate-process');
      return 'terminated';
    }
  });
  const session = await provider.startSession({
    application: '/tmp/wavenav_host',
    sessionCloseTimeoutMs: 5
  });

  assert.deepEqual(await session.stop(), {
    webdriverSession: 'close-failed',
    processGroup: 'terminated'
  });
  assert.deepEqual(events, ['terminate-process']);
});
