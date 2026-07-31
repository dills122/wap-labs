import { describe, expect, it } from 'vitest';
import {
  canHistoryBack,
  commitHistoryBack,
  createHostHistoryState,
  HOST_HISTORY_ENTRY_CAPACITY,
  peekHistoryBack,
  pushHostHistoryEntry,
  RETAINED_WML_BACK_DEPTH,
  resetHostHistoryState,
  updateCurrentHistoryCard
} from './session-history';

describe('session-history', () => {
  it('starts empty with no back navigation', () => {
    const state = createHostHistoryState();
    expect(state.entries).toEqual([]);
    expect(state.index).toBe(-1);
    expect(canHistoryBack(state)).toBe(false);
    expect(peekHistoryBack(state)).toBeNull();
    expect(commitHistoryBack(state)).toBeNull();
  });

  it('pushes normalized entries and updates index', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, '  http://local.test/a  ', 'home', 'user', {
      requestedUrl: 'http://local.test/a',
      method: 'get'
    });
    pushHostHistoryEntry(state, 'http://local.test/b', 'next', 'external-intent', {
      requestedUrl: 'http://local.test/b',
      method: 'GET',
      requestPolicy: {
        refererUrl: 'http://local.test/a'
      }
    });

    expect(state.index).toBe(1);
    expect(state.entries).toEqual([
      {
        url: 'http://local.test/a',
        requestedUrl: 'http://local.test/a',
        method: 'GET',
        activeCardId: 'home',
        source: 'user'
      },
      {
        url: 'http://local.test/b',
        requestedUrl: 'http://local.test/b',
        method: 'GET',
        requestPolicy: {
          refererUrl: 'http://local.test/a'
        },
        activeCardId: 'next',
        source: 'external-intent'
      }
    ]);
  });

  it('ignores empty URLs', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, '   ');
    expect(state.entries).toEqual([]);
    expect(state.index).toBe(-1);
  });

  it('pushes every explicit access even when the request identity is duplicated', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, 'http://local.test/a', 'home', 'user', {
      requestedUrl: 'http://local.test/a',
      method: 'GET'
    });
    pushHostHistoryEntry(state, 'http://local.test/a', 'home2', 'reload', {
      requestedUrl: 'http://local.test/a',
      method: 'GET',
      requestPolicy: {
        cacheControl: 'no-cache'
      }
    });

    expect(state.index).toBe(1);
    expect(state.entries).toEqual([
      {
        url: 'http://local.test/a',
        requestedUrl: 'http://local.test/a',
        method: 'GET',
        activeCardId: 'home',
        source: 'user'
      },
      {
        url: 'http://local.test/a',
        requestedUrl: 'http://local.test/a',
        method: 'GET',
        requestPolicy: {
          cacheControl: 'no-cache'
        },
        activeCardId: 'home2',
        source: 'reload'
      }
    ]);
  });

  it('resets the stack for a new browser context', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, 'http://local.test/a', 'a');
    pushHostHistoryEntry(state, 'http://local.test/b', 'b');

    resetHostHistoryState(state);

    expect(state).toEqual({ entries: [], index: -1 });
  });

  it('keeps separate entries when method or post payload differs', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, 'http://local.test/a', 'home', 'user', {
      requestedUrl: 'http://local.test/a',
      method: 'GET'
    });
    pushHostHistoryEntry(state, 'http://local.test/a', 'posted', 'user', {
      requestedUrl: 'http://local.test/a',
      method: 'POST',
      requestPolicy: {
        postContext: {
          payload: 'foo=1'
        }
      }
    });

    expect(state.index).toBe(1);
    expect(state.entries).toHaveLength(2);
    expect(state.entries[0]?.method).toBe('GET');
    expect(state.entries[1]?.method).toBe('POST');
    expect(state.entries[1]?.requestPolicy?.postContext?.payload).toBe('foo=1');
  });

  it('preserves byte-exact replay credentials inside history', () => {
    const state = createHostHistoryState();
    const payload = 'username=alice&pin=%30%30%30%30&note=a+b';
    pushHostHistoryEntry(state, 'http://local.test/login', 'result', 'user', {
      requestedUrl: 'http://local.test/login',
      method: 'POST',
      headers: {
        Authorization: 'Basic YWxpY2U6c2VjcmV0',
        Cookie: 'sid=replay-secret'
      },
      requestPolicy: {
        postContext: {
          contentType: 'application/x-www-form-urlencoded',
          payload
        },
        requestIntent: {
          method: 'post',
          enctype: 'application/x-www-form-urlencoded',
          sendReferer: true,
          sameDeck: false,
          postFields: [
            { name: 'username', value: 'alice' },
            { name: 'pin', value: '0000' }
          ]
        }
      }
    });

    const replay = peekHistoryBack({
      entries: [
        ...state.entries,
        {
          url: 'http://local.test/next',
          method: 'GET'
        }
      ],
      index: 1
    });
    expect(replay?.headers).toEqual({
      authorization: 'Basic YWxpY2U6c2VjcmV0',
      cookie: 'sid=replay-secret'
    });
    expect(replay?.requestPolicy?.postContext?.payload).toBe(payload);
    expect(replay?.requestPolicy?.requestIntent?.postFields).toEqual([
      { name: 'username', value: 'alice' },
      { name: 'pin', value: '0000' }
    ]);
  });

  it('keeps separate entries when request headers differ', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, 'http://local.test/a', 'home', 'user', {
      requestedUrl: 'http://local.test/a',
      method: 'GET',
      headers: {
        Accept: 'text/vnd.wap.wml'
      }
    });
    pushHostHistoryEntry(state, 'http://local.test/a', 'home', 'user', {
      requestedUrl: 'http://local.test/a',
      method: 'GET',
      headers: {
        Accept: 'application/vnd.wap.wmlc'
      }
    });

    expect(state.index).toBe(1);
    expect(state.entries).toHaveLength(2);
    expect(state.entries[0]?.headers).toEqual({ accept: 'text/vnd.wap.wml' });
    expect(state.entries[1]?.headers).toEqual({ accept: 'application/vnd.wap.wmlc' });
  });

  it('keeps separate entries when request policy metadata differs', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, 'http://local.test/a', 'home', 'user', {
      requestedUrl: 'http://local.test/a',
      method: 'GET',
      requestPolicy: {
        refererUrl: 'http://local.test/start-a.wml',
        uaCapabilityProfile: 'wap-baseline'
      }
    });
    pushHostHistoryEntry(state, 'http://local.test/a', 'home', 'user', {
      requestedUrl: 'http://local.test/a',
      method: 'GET',
      requestPolicy: {
        refererUrl: 'http://local.test/start-b.wml',
        uaCapabilityProfile: 'wap-baseline'
      }
    });

    expect(state.index).toBe(1);
    expect(state.entries).toHaveLength(2);
    expect(state.entries[0]?.requestPolicy).toEqual({
      refererUrl: 'http://local.test/start-a.wml',
      uaCapabilityProfile: 'wap-baseline'
    });
    expect(state.entries[1]?.requestPolicy).toEqual({
      refererUrl: 'http://local.test/start-b.wml',
      uaCapabilityProfile: 'wap-baseline'
    });
  });

  it('drops forward history when pushing after a back step', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, 'http://local.test/a', 'a', 'user');
    pushHostHistoryEntry(state, 'http://local.test/b', 'b', 'user');
    pushHostHistoryEntry(state, 'http://local.test/c', 'c', 'user');

    const committed = commitHistoryBack(state);
    expect(committed?.url).toBe('http://local.test/b');
    expect(state.index).toBe(1);

    pushHostHistoryEntry(state, 'http://local.test/d', 'd', 'reload');
    expect(state.index).toBe(2);
    expect(state.entries.map((entry) => entry.url)).toEqual([
      'http://local.test/a',
      'http://local.test/b',
      'http://local.test/d'
    ]);
  });

  it('evicts the oldest entry and retains a deterministic WML Back window', () => {
    const state = createHostHistoryState();
    for (let navigation = 0; navigation < 10_000; navigation += 1) {
      pushHostHistoryEntry(state, `http://local.test/${navigation}`, `card-${navigation}`, 'user');
    }

    expect(state.entries).toHaveLength(HOST_HISTORY_ENTRY_CAPACITY);
    expect(state.index).toBe(HOST_HISTORY_ENTRY_CAPACITY - 1);
    expect(state.entries[0]?.url).toBe('http://local.test/9968');
    expect(state.entries.at(-1)?.url).toBe('http://local.test/9999');

    const traversed: string[] = [];
    while (canHistoryBack(state)) {
      const entry = commitHistoryBack(state);
      if (entry) {
        traversed.push(entry.url);
      }
    }
    expect(traversed).toHaveLength(RETAINED_WML_BACK_DEPTH);
    expect(traversed.at(-1)).toBe('http://local.test/9968');
    expect(state.index).toBe(0);
  });

  it('truncates forward entries before applying oldest-entry eviction', () => {
    const state = createHostHistoryState();
    for (let navigation = 0; navigation < HOST_HISTORY_ENTRY_CAPACITY; navigation += 1) {
      pushHostHistoryEntry(state, `http://local.test/${navigation}`);
    }
    commitHistoryBack(state);
    commitHistoryBack(state);

    pushHostHistoryEntry(state, 'http://local.test/replacement');

    expect(state.entries).toHaveLength(HOST_HISTORY_ENTRY_CAPACITY - 1);
    expect(state.index).toBe(HOST_HISTORY_ENTRY_CAPACITY - 2);
    expect(state.entries[0]?.url).toBe('http://local.test/0');
    expect(state.entries.at(-2)?.url).toBe('http://local.test/29');
    expect(state.entries.at(-1)?.url).toBe('http://local.test/replacement');

    pushHostHistoryEntry(state, 'http://local.test/newest');
    pushHostHistoryEntry(state, 'http://local.test/evicts-oldest');
    expect(state.entries).toHaveLength(HOST_HISTORY_ENTRY_CAPACITY);
    expect(state.entries[0]?.url).toBe('http://local.test/1');
    expect(state.entries.at(-1)?.url).toBe('http://local.test/evicts-oldest');
    expect(state.index).toBe(HOST_HISTORY_ENTRY_CAPACITY - 1);
  });

  it('clones retained POST replay identity independently from caller mutation', () => {
    const state = createHostHistoryState();
    const requestIdentity = {
      method: 'POST',
      headers: { Authorization: 'Basic byte-exact' },
      requestPolicy: {
        postContext: {
          contentType: 'application/x-www-form-urlencoded',
          payload: 'pin=%30%30%30%30'
        },
        requestIntent: {
          method: 'post' as const,
          enctype: 'application/x-www-form-urlencoded',
          sendReferer: true,
          sameDeck: false,
          postFields: [{ name: 'pin', value: '0000' }]
        }
      }
    };

    pushHostHistoryEntry(state, 'http://local.test/login', 'result', 'user', requestIdentity);
    requestIdentity.headers.Authorization = 'changed';
    requestIdentity.requestPolicy.postContext.payload = 'changed';
    requestIdentity.requestPolicy.requestIntent.postFields[0].value = 'changed';

    expect(state.entries[0]?.headers).toEqual({ authorization: 'Basic byte-exact' });
    expect(state.entries[0]?.requestPolicy?.postContext?.payload).toBe('pin=%30%30%30%30');
    expect(state.entries[0]?.requestPolicy?.requestIntent?.postFields).toEqual([
      { name: 'pin', value: '0000' }
    ]);
  });

  it('updates current card only when active entry exists', () => {
    const state = createHostHistoryState();
    updateCurrentHistoryCard(state, 'ignored');
    expect(state.entries).toEqual([]);

    pushHostHistoryEntry(state, 'http://local.test/a', 'home');
    updateCurrentHistoryCard(state, undefined);
    expect(state.entries[0].activeCardId).toBe('home');

    updateCurrentHistoryCard(state, 'next');
    expect(state.entries[0].activeCardId).toBe('next');
  });

  it('supports peek/commit back traversal deterministically', () => {
    const state = createHostHistoryState();
    pushHostHistoryEntry(state, 'http://local.test/a', 'a');
    pushHostHistoryEntry(state, 'http://local.test/b', 'b');
    pushHostHistoryEntry(state, 'http://local.test/c', 'c');

    expect(canHistoryBack(state)).toBe(true);
    expect(peekHistoryBack(state)?.url).toBe('http://local.test/b');

    expect(commitHistoryBack(state)?.url).toBe('http://local.test/b');
    expect(state.index).toBe(1);
    expect(peekHistoryBack(state)?.url).toBe('http://local.test/a');

    expect(commitHistoryBack(state)?.url).toBe('http://local.test/a');
    expect(state.index).toBe(0);
    expect(canHistoryBack(state)).toBe(false);
    expect(commitHistoryBack(state)).toBeNull();
  });
});
