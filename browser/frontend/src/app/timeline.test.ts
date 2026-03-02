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
      navigationStatus: 'idle',
      requestedUrl: 'a'
    });
    state = appendTimelineEntry(state, 2, 'b', 'ok', {
      navigationStatus: 'loaded',
      requestedUrl: 'b'
    });
    state = appendTimelineEntry(state, 2, 'c', 'error', {
      navigationStatus: 'error',
      requestedUrl: 'c'
    });

    expect(state.entries).toHaveLength(2);
    expect(state.entries.map((entry) => entry.action)).toEqual(['b', 'c']);
    expect(state.nextSeq).toBe(4);
  });

  it('builds and validates timeline export payload', () => {
    const state = appendTimelineEntry(
      appendTimelineEntry(createTimelineState(), 200, 'bootstrap', 'state', {
        navigationStatus: 'idle',
        requestedUrl: 'http://local.test'
      }),
      200,
      'fetch',
      'ok',
      { navigationStatus: 'loaded', requestedUrl: 'http://local.test' }
    );

    const payload = buildTimelineExport(state.entries, {
      navigationStatus: 'loaded',
      requestedUrl: 'http://local.test'
    });
    expect(payload.timelineLength).toBe(2);
    expect(payload.schemaVersion).toBe(1);
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
