import { describe, expect, it } from 'vitest';
import type {
  EngineDebugCapabilities,
  EngineDebugEvent,
  EngineDebugSnapshot
} from '../../../contracts/engine';
import {
  ENGINE_DEBUG_CAPTURE_KIND,
  ENGINE_DEBUG_CAPTURE_SCHEMA_VERSION,
  ENGINE_DEBUG_CONSUMER_LIMITS,
  serializeEngineDebugCapture
} from './engine-debug-capture';
import { EngineDebugStore } from './engine-debug-store';
import { buildEngineDebugInspectorViewModel } from './engine-debug-view-model';

const capabilities: EngineDebugCapabilities = {
  protocolVersion: 1,
  supportsPolling: true,
  supportsSnapshots: true,
  supportsSensitiveUnmasking: false,
  maskingPolicy: 'required',
  timestampKind: 'monotonic',
  sessionLimit: 1,
  eventBufferCapacity: 2048,
  defaultMaxEventsPerPoll: 100,
  maxEventsPerPoll: 256,
  maxSnapshotVariables: 256,
  maxSnapshotTimers: 64,
  maxTextBytes: 4096
};

const event = (seq: number, value = `value-${seq}`): EngineDebugEvent => ({
  seq: String(seq),
  kind: 'input.edit.draft',
  monotonicTimeMs: seq,
  cardId: 'form',
  payload: {
    type: 'input-edit-draft',
    name: 'query',
    value: { state: 'visible', value }
  }
});

const snapshot = (canary?: string): EngineDebugSnapshot => {
  const maskedValue = canary
    ? { state: 'masked' as const, reason: 'password-input' as const, originalValue: canary }
    : { state: 'masked' as const, reason: 'password-input' as const };
  return {
    protocolVersion: 1,
    capturedSeq: '900',
    activeCardId: 'form',
    focusedLinkIndex: 0,
    focusedInputEdit: {
      name: 'password',
      value: maskedValue
    },
    runtimeVars: Array.from({ length: 300 }, (_, index) => ({
      name: `variable-${index}`,
      value: { state: 'visible' as const, value: 'x'.repeat(4096) }
    })),
    runtimeVarsSummary: { totalCount: 300, returnedCount: 300, truncated: false },
    timers: Array.from({ length: 90 }, (_, index) => ({
      remainingMs: index,
      token: { state: 'visible' as const, value: `timer-${index}` }
    })),
    timersSummary: { totalCount: 90, returnedCount: 90, truncated: false },
    buffer: { oldestSeq: '1', latestSeq: '900', droppedCount: 3, capacity: 2048 },
    viewportCols: 20,
    baseUrl: { state: 'visible', value: 'http://local.test/form.wml' },
    contentType: 'text/vnd.wap.wml'
  };
};

describe('engine debug bounded capture and view projection', () => {
  it('caps retained events, rendered rows, filters, and snapshot collections', () => {
    const store = new EngineDebugStore();
    store.markActive(capabilities);
    store.appendEvents(
      Array.from({ length: ENGINE_DEBUG_CONSUMER_LIMITS.retainedEvents + 88 }, (_, index) =>
        event(index + 1)
      ),
      7
    );
    store.setSnapshot(snapshot());
    store.setFilter('input', 'q'.repeat(ENGINE_DEBUG_CONSUMER_LIMITS.filterQueryLength + 20));

    const state = store.getState();
    const viewModel = buildEngineDebugInspectorViewModel(state);
    const renderedSnapshot = JSON.parse(viewModel.snapshotText) as EngineDebugSnapshot;

    expect(state.events).toHaveLength(ENGINE_DEBUG_CONSUMER_LIMITS.retainedEvents);
    expect(state.frontendDroppedEvents).toBe(88);
    expect(state.producerDroppedEvents).toBe(7);
    expect(state.filter.query).toHaveLength(ENGINE_DEBUG_CONSUMER_LIMITS.filterQueryLength);
    expect(viewModel.rows.length).toBeLessThanOrEqual(ENGINE_DEBUG_CONSUMER_LIMITS.renderedRows);
    expect(state.snapshot?.runtimeVars).toHaveLength(
      ENGINE_DEBUG_CONSUMER_LIMITS.snapshotVariables
    );
    expect(state.snapshot?.timers).toHaveLength(ENGINE_DEBUG_CONSUMER_LIMITS.snapshotTimers);
    expect(renderedSnapshot.runtimeVars).toHaveLength(32);
    expect(renderedSnapshot.timers).toHaveLength(16);
  });

  it('serializes only the versioned allowlist and never carries masked originals', () => {
    const canary = 'CANARY-RAW-PASSWORD-74f1';
    const unsafeEvent = {
      ...event(1),
      requestBody: canary,
      rawWml: `<wml>${canary}</wml>`,
      payload: {
        type: 'input-edit-draft',
        name: 'password',
        value: {
          state: 'masked',
          reason: 'password-input',
          originalValue: canary,
          value: canary
        }
      }
    } as unknown as EngineDebugEvent;
    const capture = serializeEngineDebugCapture({
      capabilities,
      events: [unsafeEvent],
      snapshot: snapshot(canary),
      accounting: {
        producerDroppedEvents: 0,
        frontendDroppedEvents: 0,
        retainedEvents: 1,
        oldestSeq: '1',
        latestSeq: '1'
      }
    });
    const store = new EngineDebugStore();
    store.appendEvents([unsafeEvent], 0);
    store.setSnapshot(snapshot(canary));
    const rendered = JSON.stringify(buildEngineDebugInspectorViewModel(store.getState()));

    expect(capture.document.schemaVersion).toBe(ENGINE_DEBUG_CAPTURE_SCHEMA_VERSION);
    expect(capture.document.kind).toBe(ENGINE_DEBUG_CAPTURE_KIND);
    expect(capture.json).not.toContain(canary);
    expect(capture.json).not.toContain('requestBody');
    expect(capture.json).not.toContain('rawWml');
    expect(capture.json).toContain('"reason": "password-input"');
    expect(rendered).not.toContain(canary);
  });

  it('keeps export bytes bounded even after repeated maximum-size polling retention', () => {
    const events = Array.from({ length: ENGINE_DEBUG_CONSUMER_LIMITS.retainedEvents }, (_, index) =>
      event(index + 1, 'x'.repeat(ENGINE_DEBUG_CONSUMER_LIMITS.storedTextLength))
    );
    const capture = serializeEngineDebugCapture({
      capabilities,
      events,
      snapshot: snapshot(),
      accounting: {
        producerDroppedEvents: 999,
        frontendDroppedEvents: 10_000,
        retainedEvents: events.length,
        oldestSeq: events[0]?.seq,
        latestSeq: events.at(-1)?.seq
      }
    });

    expect(capture.byteLength).toBeLessThanOrEqual(ENGINE_DEBUG_CONSUMER_LIMITS.exportBytes);
    expect(capture.document.events.length).toBeLessThanOrEqual(
      ENGINE_DEBUG_CONSUMER_LIMITS.exportEvents
    );
    expect(capture.document.accounting.exportTruncated).toBe(true);
    expect(capture.document.accounting.retainedEvents).toBe(
      ENGINE_DEBUG_CONSUMER_LIMITS.retainedEvents
    );
  });
});
