import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  buildNativeE2EManifest,
  createNativeE2ERunIdentity,
  formatPublishedEndpoint,
  parseComposePublishedPort
} from './environment.mjs';

const requireCount = (values, expected) => {
  assert.equal(values.length, expected, 'invalid environment command arguments');
};

const [command, ...values] = process.argv.slice(2);

try {
  if (command === 'run-id') {
    requireCount(values, 2);
    const processId = Number.parseInt(values[1], 10);
    const { runId } = createNativeE2ERunIdentity({ nonce: values[0], processId });
    process.stdout.write(`${runId}\n`);
  } else if (command === 'url') {
    requireCount(values, 3);
    const [scheme, protocol, binding] = values;
    process.stdout.write(`${formatPublishedEndpoint(binding, { scheme, protocol })}\n`);
  } else if (command === 'write-manifest') {
    requireCount(values, 5);
    const [output, runId, composeProject, gatewayBinding, originInstanceId] = values;
    assert.ok(path.isAbsolute(output), 'manifest output path must be absolute');
    const manifest = buildNativeE2EManifest({
      runId,
      composeProject,
      gatewayBinding: parseComposePublishedPort(gatewayBinding, 'udp'),
      originInstanceId
    });
    await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600
    });
  } else {
    throw new Error('unknown environment command');
  }
} catch {
  process.stderr.write('native-e2e-environment: CONFIG ERROR\n');
  process.exitCode = 2;
}
