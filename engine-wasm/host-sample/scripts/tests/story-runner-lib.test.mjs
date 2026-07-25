import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NoExecutableCoverageError,
  assertStoryExpectation,
  selectExecutableStories,
  traceContainsSubsequence
} from '../story-runner-lib.mjs';

const records = [
  {
    key: 'covered',
    workItems: ['R0-10'],
    specItems: ['WML-R-007'],
    flows: [
      {
        id: 'smoke',
        workItems: ['R0-10'],
        specItems: ['WML-R-007']
      }
    ]
  },
  {
    key: 'metadataOnly',
    workItems: ['R0-11'],
    specItems: ['WML-R-008']
  }
];

test('selects executable stories by work item or spec item, case-insensitively', () => {
  assert.equal(selectExecutableStories(records, 'r0-10').length, 1);
  assert.equal(selectExecutableStories(records, 'WML-R-007').length, 1);
});

test('reports an explicit metadata-only coverage gap', () => {
  assert.throws(
    () => selectExecutableStories(records, 'R0-11'),
    (error) =>
      error instanceof NoExecutableCoverageError &&
      error.message.includes('exists in example metadata')
  );
});

test('checks ordered trace subsequences without requiring adjacent entries', () => {
  assert.equal(
    traceContainsSubsequence(
      ['LOAD', 'ACTION_FRAGMENT', 'TIMER_START', 'KEY', 'ACTION_ONTIMER'],
      ['ACTION_FRAGMENT', 'TIMER_START', 'ACTION_ONTIMER']
    ),
    true
  );
});

test('asserts structured runtime state and trace evidence', () => {
  const evidence = {
    snapshot: {
      activeCardId: 'next',
      focusedLinkIndex: 0,
      externalNavigationIntent: undefined
    },
    traceEntries: [{ kind: 'KEY' }, { kind: 'ACTION_FRAGMENT' }]
  };
  assert.doesNotThrow(() =>
    assertStoryExpectation(
      evidence,
      {
        state: {
          activeCardId: 'next',
          externalNavigationIntent: null
        },
        traceKinds: ['KEY', 'ACTION_FRAGMENT']
      },
      'test'
    )
  );
  assert.throws(
    () => assertStoryExpectation(evidence, { state: { activeCardId: 'home' } }, 'test'),
    /snapshot.activeCardId/
  );
});
