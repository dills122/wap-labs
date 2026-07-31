import { describe, expect, it } from 'vitest';
import {
  appendTimelineEntry,
  buildTimelineExport,
  clearTimelineState,
  createTimelineState,
  validateTimelineExport
} from './timeline';

describe('app/timeline', () => {
  it('creates and clears timeline state', () => {
    const created = createTimelineState();
    expect(created.entries).toEqual([]);
    expect(created.nextSeq).toBe(1);

    const cleared = clearTimelineState();
    expect(cleared.entries).toEqual([]);
    expect(cleared.nextSeq).toBe(1);
  });

  it('appends entries and increments sequence', () => {
    const next = appendTimelineEntry(createTimelineState(), 200, 'bootstrap', 'state', {
      runMode: 'network',
      navigationStatus: 'idle',
      requestedUrl: 'http://local.test'
    });
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].seq).toBe(1);
    expect(next.nextSeq).toBe(2);
  });

  it('enforces max timeline window', () => {
    let state = createTimelineState();
    state = appendTimelineEntry(state, 2, 'a', 'state', {
      runMode: 'network',
      navigationStatus: 'idle',
      requestedUrl: 'a'
    });
    state = appendTimelineEntry(state, 2, 'b', 'ok', {
      runMode: 'network',
      navigationStatus: 'loaded',
      requestedUrl: 'b'
    });
    state = appendTimelineEntry(state, 2, 'c', 'error', {
      runMode: 'network',
      navigationStatus: 'error',
      requestedUrl: 'c'
    });

    expect(state.entries).toHaveLength(2);
    expect(state.entries.map((entry) => entry.action)).toEqual(['b', 'c']);
    expect(state.nextSeq).toBe(4);
  });

  it('stores only the allowlisted projection at the producer boundary', () => {
    const next = appendTimelineEntry(
      createTimelineState(),
      200,
      'load-transport-url',
      'state',
      {
        runMode: 'network',
        navigationStatus: 'loading',
        requestedUrl: 'https://alice:userinfo-secret@example.test/?pin=pin-0000',
        lastError: 'internal-error-secret',
        historyIndex: 0,
        history: [
          {
            url: 'https://example.test/',
            method: 'POST',
            headers: { Authorization: 'authorization-secret' },
            requestPolicy: { postContext: { payload: 'legacy-payload-secret' } }
          }
        ]
      },
      {
        requestedUrl: 'https://example.test/?password=password-hunter2',
        method: 'POST',
        headers: { Cookie: 'cookie-secret' },
        requestPolicy: {
          requestIntent: {
            method: 'post',
            enctype: 'application/x-www-form-urlencoded',
            sendReferer: false,
            sameDeck: false,
            postFields: [{ name: 'pin', value: 'typed-post-secret' }]
          }
        }
      }
    );

    const serialized = JSON.stringify(next.entries);
    for (const secret of [
      'userinfo-secret',
      'pin-0000',
      'internal-error-secret',
      'authorization-secret',
      'legacy-payload-secret',
      'password-hunter2',
      'cookie-secret',
      'typed-post-secret'
    ]) {
      expect(serialized).not.toContain(secret);
    }
    expect(next.entries[0]?.session).toMatchObject({
      navigationStatus: 'loading',
      hasError: true,
      historyLength: 1
    });
    expect(next.entries[0]?.details).toMatchObject({
      method: 'POST',
      headers: { count: 1 },
      requestPolicy: {
        post: { postFieldCount: 1, postFieldValueLength: 'typed-post-secret'.length }
      }
    });
  });

  it('builds and validates timeline export payload', () => {
    const state = appendTimelineEntry(
      appendTimelineEntry(createTimelineState(), 200, 'bootstrap', 'state', {
        runMode: 'network',
        navigationStatus: 'idle',
        requestedUrl: 'http://local.test'
      }),
      200,
      'fetch',
      'ok',
      { runMode: 'network', navigationStatus: 'loaded', requestedUrl: 'http://local.test' }
    );

    const payload = buildTimelineExport(state.entries, {
      runMode: 'network',
      navigationStatus: 'loaded',
      requestedUrl: 'http://local.test'
    });
    expect(payload.timelineLength).toBe(2);
    expect(payload.schemaVersion).toBe(2);
    expect(payload.redactionPolicy).toBe('allowlist-v1');
    expect(() =>
      validateTimelineExport(payload as unknown as Record<string, unknown>)
    ).not.toThrow();
  });

  it('rejects invalid timeline export shapes', () => {
    expect(() => validateTimelineExport({ timeline: [] })).toThrow(
      'Timeline export requires at least one event.'
    );
    expect(() =>
      validateTimelineExport({
        timeline: [{ phase: 'state' }]
      })
    ).toThrow('Timeline export must contain both action and state chronology.');
  });
});
