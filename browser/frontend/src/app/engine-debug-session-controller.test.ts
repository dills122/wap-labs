import { describe, expect, it, vi } from 'vitest';
import type {
  EngineDebugCapabilities,
  EngineDebugErrorCode,
  EngineDebugEvent,
  EngineDebugOpenSessionOutcome,
  EngineDebugSnapshot
} from '../../../contracts/engine';
import type { EngineDebugSessionClient } from './engine-debug-client';
import { EngineDebugStore } from './engine-debug-store';
import {
  createEngineDebugSessionController,
  type EngineDebugSessionController
} from './engine-debug-session-controller';
import type { EngineDebugInspectorViewModel } from './engine-debug-view-model';

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

const snapshot: EngineDebugSnapshot = {
  protocolVersion: 1,
  capturedSeq: '3',
  activeCardId: 'home',
  focusedLinkIndex: 0,
  runtimeVars: [],
  runtimeVarsSummary: { totalCount: 0, returnedCount: 0, truncated: false },
  timers: [],
  timersSummary: { totalCount: 0, returnedCount: 0, truncated: false },
  buffer: { oldestSeq: '1', latestSeq: '3', droppedCount: 0, capacity: 2048 },
  viewportCols: 20,
  baseUrl: { state: 'visible', value: 'http://local.test/start.wml' },
  contentType: 'text/vnd.wap.wml'
};

const event: EngineDebugEvent = {
  seq: '3',
  kind: 'card.enter',
  monotonicTimeMs: 15,
  cardId: 'home',
  payload: { type: 'card-enter' }
};

const openSuccess = (sessionId: string): EngineDebugOpenSessionOutcome => ({
  status: 'success',
  session: { sessionId, cursor: '0', capabilities }
});

const failure = (code: EngineDebugErrorCode) =>
  ({
    status: 'failure',
    error: { code, message: 'ignored host message', retryable: false }
  }) as const;

class TestScheduler {
  private nextId = 1;
  readonly callbacks = new Map<number, () => void>();

  setTimeout(callback: () => void): ReturnType<typeof setTimeout> {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }

  clearTimeout(timer: ReturnType<typeof setTimeout>): void {
    this.callbacks.delete(timer);
  }
}

const createClient = (): EngineDebugSessionClient => ({
  open: vi.fn(async () => openSuccess('session-1')),
  poll: vi.fn(async () => ({
    status: 'success' as const,
    batch: { events: [event], nextCursor: '3', droppedCount: 0, hasMore: false }
  })),
  snapshot: vi.fn(async () => ({ status: 'success' as const, snapshot })),
  close: vi.fn(async () => ({ status: 'success' as const, result: { closed: true } }))
});

const observe = (
  controller: EngineDebugSessionController
): { latest: () => EngineDebugInspectorViewModel; dispose: () => void } => {
  let viewModel: EngineDebugInspectorViewModel | undefined;
  const dispose = controller.subscribe((next) => {
    viewModel = next;
  });
  return {
    latest: () => {
      if (!viewModel) throw new Error('missing Inspector view-model');
      return viewModel;
    },
    dispose
  };
};

describe('engine debug session controller lifecycle', () => {
  it('reports the default-disabled policy without opening a runtime control path', async () => {
    const client = createClient();
    vi.mocked(client.open).mockResolvedValueOnce(failure('DEBUG_DISABLED'));
    const controller = createEngineDebugSessionController({ client, onCapture: vi.fn() });
    const observation = observe(controller);

    expect(observation.latest().policyLabel).toBe('Disabled by default');
    await controller.start();

    expect(observation.latest().phase).toBe('unavailable');
    expect(observation.latest().policyLabel).toBe('Local policy disabled');
    expect(observation.latest().statusDetail).toContain('WAVES_ENGINE_DEBUG_POLICY=enabled');
    expect(client.poll).not.toHaveBeenCalled();
    expect(client.snapshot).not.toHaveBeenCalled();
    expect(client.close).not.toHaveBeenCalled();
  });

  it('opens, snapshots, polls by cursor, accounts for gaps, and closes one session', async () => {
    const client = createClient();
    vi.mocked(client.poll).mockResolvedValueOnce({
      status: 'success',
      batch: { events: [event], nextCursor: '3', droppedCount: 9, hasMore: false }
    });
    const store = new EngineDebugStore();
    const controller = createEngineDebugSessionController({
      client,
      store,
      scheduler: new TestScheduler(),
      onCapture: vi.fn()
    });
    const observation = observe(controller);
    controller.dispatch({ type: 'visibility', surface: 'docked', visible: true });

    await controller.start();

    expect(client.open).toHaveBeenCalledOnce();
    expect(client.snapshot).toHaveBeenCalledWith('session-1');
    expect(client.poll).toHaveBeenCalledWith('session-1', '0', 100);
    expect(observation.latest().phase).toBe('active');
    expect(observation.latest().retainedEventCount).toBe(1);
    expect(observation.latest().producerDroppedEvents).toBe(9);
    expect(observation.latest().snapshotSummary).toContain('Sequence 3');

    await controller.stop();

    expect(client.close).toHaveBeenCalledWith('session-1');
    expect(observation.latest().phase).toBe('idle');
  });

  it('surfaces the single-session host limit without retrying or mutating engine state', async () => {
    const client = createClient();
    vi.mocked(client.open).mockResolvedValueOnce(failure('SESSION_LIMIT_REACHED'));
    const controller = createEngineDebugSessionController({ client, onCapture: vi.fn() });
    const observation = observe(controller);

    await controller.start();

    expect(observation.latest().phase).toBe('error');
    expect(observation.latest().statusDetail).toContain('Another local Inspector session');
    expect(client.poll).not.toHaveBeenCalled();
    expect(client.close).not.toHaveBeenCalled();
  });

  it('closes after a poll error and discards arbitrary error internals', async () => {
    const client = createClient();
    const canary = 'CANARY-ARBITRARY-ERROR-INTERNALS';
    vi.mocked(client.poll).mockResolvedValueOnce({
      status: 'failure',
      error: { code: 'INVALID_CURSOR', message: canary, retryable: false }
    });
    const controller = createEngineDebugSessionController({ client, onCapture: vi.fn() });
    const observation = observe(controller);
    controller.dispatch({ type: 'visibility', surface: 'docked', visible: true });

    await controller.start();

    expect(observation.latest().phase).toBe('error');
    expect(observation.latest().statusDetail).toContain('cursor was rejected');
    expect(JSON.stringify(observation.latest())).not.toContain(canary);
    expect(client.close).toHaveBeenCalledWith('session-1');
  });

  it('rotates identity on close/reopen and cleans up the active session on unmount', async () => {
    const client = createClient();
    vi.mocked(client.open)
      .mockResolvedValueOnce(openSuccess('session-first'))
      .mockResolvedValueOnce(openSuccess('session-second'));
    const scheduler = new TestScheduler();
    const controller = createEngineDebugSessionController({
      client,
      scheduler,
      onCapture: vi.fn()
    });
    controller.dispatch({ type: 'visibility', surface: 'docked', visible: true });

    await controller.start();
    await controller.stop();
    await controller.start();
    expect(scheduler.callbacks.size).toBe(1);

    await controller.dispose();

    expect(client.close).toHaveBeenNthCalledWith(1, 'session-first');
    expect(client.close).toHaveBeenNthCalledWith(2, 'session-second');
    expect(scheduler.callbacks.size).toBe(0);
  });

  it('pauses scheduled polling when every Inspector surface is hidden', async () => {
    const client = createClient();
    const scheduler = new TestScheduler();
    const controller = createEngineDebugSessionController({
      client,
      scheduler,
      onCapture: vi.fn()
    });
    controller.dispatch({ type: 'visibility', surface: 'docked', visible: true });
    await controller.start();
    expect(scheduler.callbacks.size).toBe(1);

    controller.dispatch({ type: 'visibility', surface: 'docked', visible: false });
    expect(scheduler.callbacks.size).toBe(0);

    controller.dispatch({ type: 'visibility', surface: 'window', visible: true });
    expect(scheduler.callbacks.size).toBe(1);
    await controller.dispose();
  });
});
