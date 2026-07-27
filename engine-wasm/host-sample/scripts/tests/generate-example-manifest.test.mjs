import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  loadExampleRecords,
  parseExecutableFlow,
  parseExampleMetadata
} from '../generate-example-manifest.mjs';

const METADATA = `<!--
label: Test Example
work-items: R0-10
spec-items: WML-R-007
description: Test description.
goal: Test goal.
testing-ac:
- Verify behavior.
-->
<wml><card id="home"><p>Home</p></card></wml>
`;

const validFlow = (overrides = {}) => ({
  version: 1,
  example: 'testExample',
  flows: [
    {
      id: 'smoke',
      title: 'Smoke flow',
      workItems: ['R0-10'],
      specItems: ['WML-R-007'],
      initial: { state: { activeCardId: 'home', externalNavigationIntent: null } },
      steps: [
        {
          action: { type: 'key', key: 'enter' },
          expect: { state: { activeCardId: 'home' } }
        }
      ],
      ...overrides
    }
  ]
});

test('parses required WML metadata without embedding the comment in deck source', () => {
  const metadata = parseExampleMetadata(METADATA, 'test-example.wml');
  assert.deepEqual(metadata.workItems, ['R0-10']);
  assert.deepEqual(metadata.specItems, ['WML-R-007']);
  assert.match(metadata.wml, /^<wml>/);
});

test('rejects unknown executable actions deterministically', () => {
  const document = validFlow({
    steps: [
      {
        action: { type: 'teleport' },
        expect: { state: { activeCardId: 'home' } }
      }
    ]
  });
  assert.throws(
    () => parseExecutableFlow(JSON.stringify(document), 'test-example.flow.json', 'testExample'),
    /unknown action "teleport"/
  );
});

test('parses waves-browser target setup, keyboard actions, and semantic expectations', () => {
  const document = validFlow({
    target: 'waves-browser',
    setup: { runMode: 'network' },
    initial: {
      state: { activeCardId: 'home' },
      session: { navigationStatus: 'loaded' },
      render: { textIncludes: ['Home'] }
    },
    steps: [
      {
        action: { type: 'keyboard', key: 'Enter' },
        expect: {
          state: { activeCardId: 'home' },
          statusIncludes: 'loaded'
        }
      }
    ]
  });

  const parsed = parseExecutableFlow(
    JSON.stringify(document),
    'test-example.flow.json',
    'testExample'
  );
  assert.equal(parsed.flows[0].target, 'waves-browser');
  assert.deepEqual(parsed.flows[0].setup, { runMode: 'network' });
  assert.deepEqual(parsed.flows[0].initial.render, { textIncludes: ['Home'] });
});

test('parses script outcomes and structured external request policy expectations', () => {
  const document = validFlow({
    initial: {
      state: {
        activeCardId: 'home',
        lastScriptExecutionOk: null,
        lastScriptExecutionTrap: null,
        lastScriptRequiresRefresh: false,
        externalNavigationRequestPolicy: null
      }
    },
    steps: [
      {
        action: { type: 'key', key: 'enter' },
        expect: {
          state: {
            activeCardId: 'home',
            lastScriptExecutionOk: true,
            externalNavigationRequestPolicy: {
              refererUrl: 'http://local.test/form.wml',
              postContext: {
                sameDeck: false,
                contentType: 'application/x-www-form-urlencoded',
                payload: 'username=BOB'
              },
              requestIntent: {
                method: 'post',
                enctype: 'application/x-www-form-urlencoded',
                sendReferer: true,
                sameDeck: false,
                postFields: [{ name: 'username', value: 'BOB' }]
              }
            }
          }
        }
      }
    ]
  });

  const parsed = parseExecutableFlow(
    JSON.stringify(document),
    'test-example.flow.json',
    'testExample'
  );
  assert.equal(parsed.flows[0].steps[0].expect.state.lastScriptExecutionOk, true);
  assert.equal(
    parsed.flows[0].steps[0].expect.state.externalNavigationRequestPolicy.postContext.payload,
    'username=BOB'
  );
  assert.deepEqual(
    parsed.flows[0].steps[0].expect.state.externalNavigationRequestPolicy.requestIntent.postFields,
    [{ name: 'username', value: 'BOB' }]
  );
});

test('rejects malformed structured external request policy expectations', () => {
  const document = validFlow({
    initial: {
      state: {
        activeCardId: 'home',
        externalNavigationRequestPolicy: {
          postContext: { sameDeck: 'no' }
        }
      }
    }
  });

  assert.throws(
    () => parseExecutableFlow(JSON.stringify(document), 'test-example.flow.json', 'testExample'),
    /postContext\.sameDeck must be boolean/
  );
});

test('rejects malformed WML go request intent expectations', () => {
  const document = validFlow({
    initial: {
      state: {
        activeCardId: 'home',
        externalNavigationRequestPolicy: {
          requestIntent: {
            method: 'put',
            enctype: 'application/x-www-form-urlencoded',
            sendReferer: false,
            sameDeck: false,
            postFields: []
          }
        }
      }
    }
  });

  assert.throws(
    () => parseExecutableFlow(JSON.stringify(document), 'test-example.flow.json', 'testExample'),
    /requestIntent\.method must be get or post/
  );
});

test('rejects flow companions for examples that do not exist', async () => {
  const examplesDir = await mkdtemp(path.join(os.tmpdir(), 'wavenav-examples-'));
  await writeFile(path.join(examplesDir, 'unknown.flow.json'), JSON.stringify(validFlow()), 'utf8');
  await assert.rejects(
    () => loadExampleRecords({ examplesDir }),
    /references unknown example "unknown"/
  );
});

test('rejects inconsistent extra ticket mappings in executable flows', async () => {
  const examplesDir = await mkdtemp(path.join(os.tmpdir(), 'wavenav-examples-'));
  await writeFile(path.join(examplesDir, 'test-example.wml'), METADATA, 'utf8');
  await writeFile(
    path.join(examplesDir, 'test-example.flow.json'),
    JSON.stringify(validFlow({ workItems: ['R0-11'] })),
    'utf8'
  );
  await assert.rejects(
    () => loadExampleRecords({ examplesDir }),
    /maps unknown work item\(s\): R0-11/
  );
});

test('rejects ticket mappings that are present in metadata but missing from flows', async () => {
  const examplesDir = await mkdtemp(path.join(os.tmpdir(), 'wavenav-examples-'));
  await writeFile(
    path.join(examplesDir, 'test-example.wml'),
    METADATA.replace('work-items: R0-10', 'work-items: R0-10, R0-11'),
    'utf8'
  );
  await writeFile(
    path.join(examplesDir, 'test-example.flow.json'),
    JSON.stringify(validFlow()),
    'utf8'
  );
  await assert.rejects(
    () => loadExampleRecords({ examplesDir }),
    /flow is missing work item mapping\(s\): R0-11/
  );
});

test('merges a valid companion into the canonical example record', async () => {
  const examplesDir = await mkdtemp(path.join(os.tmpdir(), 'wavenav-examples-'));
  await writeFile(path.join(examplesDir, 'test-example.wml'), METADATA, 'utf8');
  await writeFile(
    path.join(examplesDir, 'test-example.flow.json'),
    JSON.stringify(validFlow()),
    'utf8'
  );
  const records = await loadExampleRecords({ examplesDir });
  assert.equal(records.length, 1);
  assert.equal(records[0].key, 'testExample');
  assert.equal(records[0].flows[0].id, 'smoke');
});
