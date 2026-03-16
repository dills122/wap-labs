import { describe, expect, it } from 'vitest';
import {
  canHistoryBack,
  commitHistoryBack,
  createHostHistoryState,
  peekHistoryBack,
  pushHostHistoryEntry,
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

  it('deduplicates current URL and merges latest card/source', () => {
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

    expect(state.index).toBe(0);
    expect(state.entries).toEqual([
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
