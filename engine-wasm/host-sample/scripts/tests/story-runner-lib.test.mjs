import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NoExecutableCoverageError,
  assertStoryExpectation,
  isExpectedHostFailureStatus,
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
        target: 'host-sample',
        workItems: ['R0-10'],
        specItems: ['WML-R-007']
      },
      {
        id: 'waves-smoke',
        target: 'waves-browser',
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
  assert.equal(selectExecutableStories(records, 'r0-10').length, 2);
  assert.equal(selectExecutableStories(records, 'WML-R-007').length, 2);
});

test('selects fast target-specific story lanes', () => {
  assert.equal(selectExecutableStories(records, 'host-sample').length, 1);
  assert.equal(selectExecutableStories(records, 'waves').length, 1);
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

test('accepts host failure status only when the flow expects its text', () => {
  assert.equal(
    isExpectedHostFailureStatus('Key error (enter): Card id not found', {
      statusIncludes: 'Key error (enter):'
    }),
    true
  );
  assert.equal(
    isExpectedHostFailureStatus('Key error (enter): Card id not found', {
      statusIncludes: 'Loaded'
    }),
    false
  );
  assert.equal(isExpectedHostFailureStatus('Key error', {}), false);
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

test('asserts Waves host session, status, and semantic render evidence', () => {
  const evidence = {
    snapshot: {
      activeCardId: 'home',
      focusedLinkIndex: 0
    },
    traceEntries: [],
    session: {
      runMode: 'network',
      navigationStatus: 'error'
    },
    status: 'Error: card not found',
    render: {
      draw: [{ type: 'link', x: 0, y: 0, text: 'Broken target', focused: true, href: '#missing' }]
    }
  };

  assert.doesNotThrow(() =>
    assertStoryExpectation(
      evidence,
      {
        state: { activeCardId: 'home' },
        session: { navigationStatus: 'error' },
        statusIncludes: 'card not found',
        render: { textIncludes: ['Broken target'] }
      },
      'waves'
    )
  );
});

test('asserts the canonical frame contract and ordered affordances', () => {
  const frame = {
    contractVersion: 1,
    frameId: 'cafef00d',
    profileId: 'class-c-reference',
    card: { id: 'home' },
    affordances: [
      {
        actionId: 'do:open',
        label: 'Open',
        source: 'card-do',
        control: 'primary',
        enabled: true,
        doName: 'open',
        doType: 'accept'
      }
    ]
  };
  const expectation = {
    state: { activeCardId: 'home' },
    frame: {
      contractVersion: 1,
      profileId: 'class-c-reference',
      cardId: 'home',
      affordances: [
        {
          actionId: 'do:open',
          label: 'Open',
          source: 'card-do',
          control: 'primary',
          enabled: true
        }
      ]
    }
  };
  const evidence = {
    snapshot: { activeCardId: 'home' },
    traceEntries: [],
    frame
  };

  assert.doesNotThrow(() => assertStoryExpectation(evidence, expectation, 'frame'));
  frame.affordances[0].label = 'Different';
  assert.throws(() => assertStoryExpectation(evidence, expectation, 'frame'), /frame.affordances/);
});

test('normalizes undefined optional fields in structured snapshot expectations', () => {
  const evidence = {
    snapshot: {
      activeCardId: 'home',
      externalNavigationRequestPolicy: {
        cacheControl: undefined,
        refererUrl: 'http://local.test/form.wml',
        postContext: {
          sameDeck: false,
          contentType: 'application/x-www-form-urlencoded',
          payload: 'username=BOB'
        }
      }
    },
    traceEntries: []
  };

  assert.doesNotThrow(() =>
    assertStoryExpectation(
      evidence,
      {
        state: {
          externalNavigationRequestPolicy: {
            refererUrl: 'http://local.test/form.wml',
            postContext: {
              sameDeck: false,
              contentType: 'application/x-www-form-urlencoded',
              payload: 'username=BOB'
            }
          }
        }
      },
      'request-policy'
    )
  );
});
