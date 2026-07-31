import type { EngineDebugErrorCode, EngineDebugSession } from '../../../contracts/engine';
import {
  ENGINE_DEBUG_CONSUMER_LIMITS,
  serializeEngineDebugCapture,
  type SerializedEngineDebugCapture
} from './engine-debug-capture';
import type { EngineDebugSessionClient } from './engine-debug-client';
import { EngineDebugStore, type EngineDebugEventGroup } from './engine-debug-store';
import {
  buildEngineDebugInspectorViewModel,
  type EngineDebugInspectorViewModel
} from './engine-debug-view-model';

export const ENGINE_DEBUG_POLL_INTERVAL_MS = 750;
export const ENGINE_DEBUG_POLL_BATCH_SIZE = 100;
export const ENGINE_DEBUG_CAPTURE_FILENAME = 'waves-engine-debug-capture-v1.json';

export type EngineDebugInspectorSurface = 'docked' | 'window';

export type EngineDebugInspectorAction =
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'snapshot' }
  | { type: 'export' }
  | { type: 'filter'; group: EngineDebugEventGroup; query: string }
  | { type: 'visibility'; surface: EngineDebugInspectorSurface; visible: boolean };

interface EngineDebugScheduler {
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  clearTimeout(timer: ReturnType<typeof setTimeout>): void;
}

export interface EngineDebugSessionControllerOptions {
  client: EngineDebugSessionClient;
  store?: EngineDebugStore;
  scheduler?: EngineDebugScheduler;
  pollIntervalMs?: number;
  onCapture?: (capture: SerializedEngineDebugCapture) => void;
}

export interface EngineDebugSessionController {
  subscribe(listener: (viewModel: EngineDebugInspectorViewModel) => void): () => void;
  dispatch(action: EngineDebugInspectorAction): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  refreshSnapshot(): Promise<void>;
  exportCapture(): SerializedEngineDebugCapture;
  dispose(): Promise<void>;
}

const browserScheduler: EngineDebugScheduler = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (timer) => clearTimeout(timer)
};

const downloadCapture = (capture: SerializedEngineDebugCapture): void => {
  const blob = new Blob([capture.json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = ENGINE_DEBUG_CAPTURE_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
};

export const createEngineDebugSessionController = ({
  client,
  store = new EngineDebugStore(),
  scheduler = browserScheduler,
  pollIntervalMs = ENGINE_DEBUG_POLL_INTERVAL_MS,
  onCapture = downloadCapture
}: EngineDebugSessionControllerOptions): EngineDebugSessionController => {
  const listeners = new Set<(viewModel: EngineDebugInspectorViewModel) => void>();
  const visibleSurfaces: Record<EngineDebugInspectorSurface, boolean> = {
    docked: false,
    window: false
  };
  let session: EngineDebugSession | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let pollInFlight = false;
  let disposed = false;

  const emit = (): void => {
    const viewModel = buildEngineDebugInspectorViewModel(store.getState());
    for (const listener of listeners) listener(viewModel);
  };

  const isVisible = (): boolean => visibleSurfaces.docked || visibleSurfaces.window;

  const clearPollTimer = (): void => {
    if (timer !== undefined) {
      scheduler.clearTimeout(timer);
      timer = undefined;
    }
  };

  const pollLimit = (): number => {
    const capabilities = session?.capabilities;
    if (!capabilities) return ENGINE_DEBUG_POLL_BATCH_SIZE;
    return Math.max(
      1,
      Math.min(
        ENGINE_DEBUG_POLL_BATCH_SIZE,
        capabilities.defaultMaxEventsPerPoll,
        capabilities.maxEventsPerPoll
      )
    );
  };

  const schedulePoll = (delayMs: number): void => {
    clearPollTimer();
    if (disposed || !session || !isVisible() || store.getState().phase !== 'active') return;
    const expectedGeneration = generation;
    timer = scheduler.setTimeout(
      () => {
        timer = undefined;
        void poll(expectedGeneration);
      },
      Math.max(0, delayMs)
    );
  };

  const closeQuietly = async (sessionId: string): Promise<void> => {
    try {
      await client.close(sessionId);
    } catch {
      // Teardown deliberately ignores host internals and never retries without a new user action.
    }
  };

  const failSession = async (
    code: EngineDebugErrorCode,
    expectedGeneration: number
  ): Promise<void> => {
    if (expectedGeneration !== generation) return;
    clearPollTimer();
    const failedSession = session;
    session = undefined;
    generation += 1;
    store.markFailure(code);
    emit();
    if (failedSession) await closeQuietly(failedSession.sessionId);
  };

  const snapshot = async (expectedGeneration: number): Promise<boolean> => {
    const activeSession = session;
    if (!activeSession || expectedGeneration !== generation) return false;
    try {
      const outcome = await client.snapshot(activeSession.sessionId);
      if (expectedGeneration !== generation) return false;
      if (outcome.status === 'failure') {
        await failSession(outcome.error.code, expectedGeneration);
        return false;
      }
      store.setSnapshot(outcome.snapshot);
      emit();
      return true;
    } catch {
      await failSession('INTERNAL_ERROR', expectedGeneration);
      return false;
    }
  };

  const poll = async (expectedGeneration: number): Promise<void> => {
    const activeSession = session;
    if (
      pollInFlight ||
      !activeSession ||
      expectedGeneration !== generation ||
      !isVisible() ||
      store.getState().phase !== 'active'
    ) {
      return;
    }
    pollInFlight = true;
    const previousCursor = activeSession.cursor;
    try {
      const outcome = await client.poll(activeSession.sessionId, previousCursor, pollLimit());
      if (expectedGeneration !== generation) return;
      if (outcome.status === 'failure') {
        await failSession(outcome.error.code, expectedGeneration);
        return;
      }
      activeSession.cursor = outcome.batch.nextCursor;
      store.appendEvents(outcome.batch.events, outcome.batch.droppedCount);
      emit();
      const madeProgress = outcome.batch.nextCursor !== previousCursor;
      schedulePoll(outcome.batch.hasMore && madeProgress ? 0 : pollIntervalMs);
    } catch {
      await failSession('INTERNAL_ERROR', expectedGeneration);
    } finally {
      pollInFlight = false;
    }
  };

  const start = async (): Promise<void> => {
    if (disposed || ['opening', 'active', 'closing'].includes(store.getState().phase)) return;
    clearPollTimer();
    const expectedGeneration = ++generation;
    store.beginOpen();
    emit();
    try {
      const outcome = await client.open();
      if (expectedGeneration !== generation || disposed) {
        if (outcome.status === 'success') await closeQuietly(outcome.session.sessionId);
        return;
      }
      if (outcome.status === 'failure') {
        store.markFailure(outcome.error.code);
        emit();
        return;
      }
      session = {
        sessionId: outcome.session.sessionId,
        cursor: outcome.session.cursor,
        capabilities: outcome.session.capabilities
      };
      store.markActive(outcome.session.capabilities);
      emit();
      if (!(await snapshot(expectedGeneration))) return;
      if (isVisible()) await poll(expectedGeneration);
    } catch {
      await failSession('INTERNAL_ERROR', expectedGeneration);
    }
  };

  const stop = async (): Promise<void> => {
    if (store.getState().phase === 'idle' && !session) return;
    const activeSession = session;
    session = undefined;
    generation += 1;
    clearPollTimer();
    store.beginClose();
    emit();
    if (!activeSession) {
      store.markStopped();
      emit();
      return;
    }
    try {
      const outcome = await client.close(activeSession.sessionId);
      if (outcome.status === 'failure') {
        store.markFailure(outcome.error.code);
      } else {
        store.markStopped();
      }
    } catch {
      store.markFailure('INTERNAL_ERROR');
    }
    emit();
  };

  const refreshSnapshot = async (): Promise<void> => {
    if (!session || store.getState().phase !== 'active') return;
    await snapshot(generation);
  };

  const exportCapture = (): SerializedEngineDebugCapture => {
    const state = store.getState();
    const events = [...state.events];
    const capture = serializeEngineDebugCapture({
      capabilities: state.capabilities,
      events,
      snapshot: state.snapshot,
      accounting: {
        producerDroppedEvents: state.producerDroppedEvents,
        frontendDroppedEvents: state.frontendDroppedEvents,
        retainedEvents: events.length,
        ...(events.at(0) ? { oldestSeq: events[0]?.seq } : {}),
        ...(events.at(-1) ? { latestSeq: events.at(-1)?.seq } : {})
      }
    });
    onCapture(capture);
    return capture;
  };

  const dispatch = (action: EngineDebugInspectorAction): void => {
    switch (action.type) {
      case 'start':
        void start();
        break;
      case 'stop':
        void stop();
        break;
      case 'snapshot':
        void refreshSnapshot();
        break;
      case 'export':
        exportCapture();
        break;
      case 'filter':
        store.setFilter(action.group, action.query);
        emit();
        break;
      case 'visibility': {
        const wasVisible = isVisible();
        visibleSurfaces[action.surface] = action.visible;
        const nowVisible = isVisible();
        if (wasVisible && !nowVisible) clearPollTimer();
        if (!wasVisible && nowVisible) schedulePoll(0);
        break;
      }
    }
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      listener(buildEngineDebugInspectorViewModel(store.getState()));
      return () => listeners.delete(listener);
    },
    dispatch,
    start,
    stop,
    refreshSnapshot,
    exportCapture,
    dispose: async () => {
      if (disposed) return;
      disposed = true;
      visibleSurfaces.docked = false;
      visibleSurfaces.window = false;
      listeners.clear();
      await stop();
    }
  };
};

export const engineDebugExportCapacity = ENGINE_DEBUG_CONSUMER_LIMITS.exportBytes;
