import {
  getCurrentWindow,
  currentMonitor,
  PhysicalPosition,
  PhysicalSize,
  type Window as TauriWindow
} from '@tauri-apps/api/window';
import type { WindowBoundsV1, WindowStateV1 } from '../../../contracts/application-state';
import { getApplicationStateStore, type ApplicationStateStore } from './application-state-store';

export const WINDOW_STATE_WRITE_DEBOUNCE_MS = 250;

export interface WindowStateAdapter {
  restore(state: WindowStateV1): Promise<void>;
  capture(): Promise<WindowStateV1>;
  subscribe(onChanged: () => void): Promise<() => void>;
}

export class TauriWindowStateAdapter implements WindowStateAdapter {
  constructor(private readonly targetWindow?: TauriWindow) {}

  async restore(state: WindowStateV1): Promise<void> {
    if (!state.bounds && !state.maximized) return;
    const window = this.targetWindow ?? getCurrentWindow();
    if (state.bounds) {
      await window.setSize(new PhysicalSize(state.bounds.width, state.bounds.height));
      await window.setPosition(new PhysicalPosition(state.bounds.x, state.bounds.y));
    }
    if (state.maximized) {
      await window.maximize();
    }
  }

  async capture(): Promise<WindowStateV1> {
    const window = this.targetWindow ?? getCurrentWindow();
    const [position, size, maximized, monitor] = await Promise.all([
      window.innerPosition(),
      window.innerSize(),
      window.isMaximized(),
      currentMonitor()
    ]);
    return {
      maximized,
      bounds: {
        monitorId: monitor?.name ?? 'unnamed-monitor-0',
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height
      }
    };
  }

  async subscribe(onChanged: () => void): Promise<() => void> {
    const window = this.targetWindow ?? getCurrentWindow();
    const [unlistenMoved, unlistenResized] = await Promise.all([
      window.onMoved(onChanged),
      window.onResized(onChanged)
    ]);
    return () => {
      unlistenMoved();
      unlistenResized();
    };
  }
}

export interface WindowStateControllerOptions {
  adapter: WindowStateAdapter;
  store?: ApplicationStateStore;
  debounceMs?: number;
  setTimer?: typeof setTimeout;
  clearTimer?: typeof clearTimeout;
}

export class WindowStateController {
  private readonly store: ApplicationStateStore;
  private readonly debounceMs: number;
  private readonly setTimer: typeof setTimeout;
  private readonly clearTimer: typeof clearTimeout;
  private unlisten: (() => void) | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private lastNormalBounds: WindowBoundsV1 | undefined;
  private disposed = false;

  constructor(private readonly options: WindowStateControllerOptions) {
    this.store = options.store ?? getApplicationStateStore();
    this.debounceMs = options.debounceMs ?? WINDOW_STATE_WRITE_DEBOUNCE_MS;
    this.setTimer = options.setTimer ?? setTimeout;
    this.clearTimer = options.clearTimer ?? clearTimeout;
  }

  async init(): Promise<void> {
    const loaded = await this.store.load();
    if (this.disposed) return;
    this.lastNormalBounds = loaded.state.windowState.bounds;
    try {
      await this.options.adapter.restore(loaded.state.windowState);
      if (this.disposed) return;
      this.unlisten = await this.options.adapter.subscribe(this.scheduleCapture);
    } catch {
      // Window persistence is best-effort and must never block or tear down the shell.
    }
  }

  dispose(): void {
    this.disposed = true;
    this.unlisten?.();
    this.unlisten = undefined;
    if (this.timer) {
      this.clearTimer(this.timer);
      this.timer = undefined;
    }
  }

  private readonly scheduleCapture = (): void => {
    if (this.timer) this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = undefined;
      void this.captureAndPersist();
    }, this.debounceMs);
  };

  private async captureAndPersist(): Promise<void> {
    if (this.disposed) return;
    try {
      const captured = await this.options.adapter.capture();
      if (!captured.maximized && captured.bounds) {
        this.lastNormalBounds = captured.bounds;
      }
      const windowState: WindowStateV1 = {
        maximized: captured.maximized,
        ...(this.lastNormalBounds ? { bounds: this.lastNormalBounds } : {})
      };
      await this.store.update((current) => ({ ...current, windowState }));
    } catch {
      // The prior atomic state remains valid if capture or persistence fails.
    }
  }
}
