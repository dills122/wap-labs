import { describe, expect, it, vi } from 'vitest';
import type { WindowStateV1 } from '../../../contracts/application-state';
import { MemoryApplicationStateStore, defaultApplicationStateV1 } from './application-state-store';
import {
  WINDOW_STATE_WRITE_DEBOUNCE_MS,
  WindowStateController,
  type WindowStateAdapter
} from './window-state-controller';

const windowState: WindowStateV1 = {
  maximized: false,
  bounds: { monitorId: 'primary', x: 40, y: 60, width: 1024, height: 768 }
};

const adapter = (captured: WindowStateV1 = windowState) => {
  let changed: () => void = () => undefined;
  const value: WindowStateAdapter & { emitChanged(): void; restore: ReturnType<typeof vi.fn> } = {
    restore: vi.fn(async () => undefined),
    capture: vi.fn(async () => captured),
    subscribe: vi.fn(async (listener: () => void) => {
      changed = listener;
      return () => undefined;
    }),
    emitChanged: () => changed()
  };
  return value;
};

describe('window state persistence', () => {
  it('restores persisted bounds asynchronously and survives a restart', async () => {
    const state = defaultApplicationStateV1();
    state.windowState = windowState;
    const store = new MemoryApplicationStateStore({ initialState: state });
    const firstAdapter = adapter();
    const first = new WindowStateController({ adapter: firstAdapter, store });

    const initialization = first.init();
    expect(firstAdapter.restore).not.toHaveBeenCalled();
    await initialization;
    expect(firstAdapter.restore).toHaveBeenCalledWith(windowState);

    const restartedAdapter = adapter();
    const restarted = new WindowStateController({ adapter: restartedAdapter, store });
    await restarted.init();
    expect(restartedAdapter.restore).toHaveBeenCalledWith(windowState);
  });

  it('debounces window changes and retains normal bounds while maximized', async () => {
    vi.useFakeTimers();
    const state = defaultApplicationStateV1();
    state.windowState = windowState;
    const store = new MemoryApplicationStateStore({ initialState: state });
    const maximized = adapter({
      maximized: true,
      bounds: { monitorId: 'primary', x: 0, y: 0, width: 1920, height: 1080 }
    });
    const controller = new WindowStateController({ adapter: maximized, store });
    await controller.init();

    maximized.emitChanged();
    await vi.advanceTimersByTimeAsync(WINDOW_STATE_WRITE_DEBOUNCE_MS - 1);
    expect(store.snapshot()?.windowState).toEqual(windowState);
    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() =>
      expect(store.snapshot()?.windowState).toEqual({ maximized: true, bounds: windowState.bounds })
    );
    controller.dispose();
    vi.useRealTimers();
  });

  it('does not fail startup when native window restoration rejects', async () => {
    const failing: WindowStateAdapter = {
      restore: vi.fn(async () => {
        throw new Error('removed monitor');
      }),
      capture: vi.fn(),
      subscribe: vi.fn()
    };
    const controller = new WindowStateController({
      adapter: failing,
      store: new MemoryApplicationStateStore()
    });

    await expect(controller.init()).resolves.toBeUndefined();
  });
});
