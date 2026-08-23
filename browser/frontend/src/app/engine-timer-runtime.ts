import type { EngineRuntimeSnapshot } from '../../../contracts/engine';
import type { HostSessionState } from '../../../contracts/transport';
import { shouldRenderTimerSnapshot } from './navigation-state';
import { ScriptTimerRegistry } from './script-timer-registry';
import { WAVES_CONFIG } from './waves-config';

export interface EngineTimerRuntimeDependencies {
  canTick(): boolean;
  getRunMode(): 'local' | 'network';
  advanceLocal(deltaMs: number): Promise<EngineRuntimeSnapshot | null>;
  advanceNetwork(deltaMs: number): Promise<EngineRuntimeSnapshot | null>;
  getSessionState(): HostSessionState;
  renderLocalSnapshot(snapshot: EngineRuntimeSnapshot): Promise<void>;
  handleExternalIntent(intentUrl: string, snapshot: EngineRuntimeSnapshot): Promise<void>;
  recordTimeline(action: string, phase: 'state' | 'error', details?: Record<string, unknown>): void;
}

export class EngineTimerRuntime {
  private timerLoopHandle: ReturnType<typeof setTimeout> | null = null;
  private timerTickInFlight = false;
  private timerIdle: Promise<void> = Promise.resolve();
  private resolveTimerIdle: (() => void) | undefined;
  private running = false;
  private nativeTimerWakeupMs: number | undefined;
  private readonly scriptTimerRegistry = new ScriptTimerRegistry();

  constructor(private readonly deps: EngineTimerRuntimeDependencies) {}

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.scheduleNextWakeup();
  }

  stop(): void {
    this.running = false;
    if (this.timerLoopHandle) {
      clearTimeout(this.timerLoopHandle);
      this.timerLoopHandle = null;
    }
  }

  resetScriptTimers(): void {
    this.scriptTimerRegistry.reset();
  }

  whenIdle(): Promise<void> {
    return this.timerIdle;
  }

  applySnapshot(snapshot: EngineRuntimeSnapshot): void {
    this.nativeTimerWakeupMs = snapshot.nextTimerWakeupMs;
    const applied = this.scriptTimerRegistry.applyRequests(snapshot.lastScriptTimerRequests);
    for (const scheduled of applied.scheduled) {
      this.deps.recordTimeline('script-timer-schedule', 'state', {
        id: scheduled.id,
        token: scheduled.token,
        delayMs: scheduled.delayMs,
        dueMs: scheduled.dueMs,
        nowMs: this.scriptTimerRegistry.currentTimeMs()
      });
    }
    for (const token of applied.cancelled) {
      this.deps.recordTimeline('script-timer-cancel', 'state', {
        token,
        nowMs: this.scriptTimerRegistry.currentTimeMs()
      });
    }
    this.scheduleNextWakeup();
  }

  async tick(deltaMs: number = WAVES_CONFIG.engineTimerTickMs): Promise<void> {
    if (this.timerTickInFlight) {
      return;
    }
    if (!this.deps.canTick()) {
      if (this.timerLoopHandle === null) {
        this.scheduleNextWakeup(WAVES_CONFIG.engineTimerTickMs);
      }
      return;
    }
    this.timerTickInFlight = true;
    this.timerIdle = new Promise((resolve) => {
      this.resolveTimerIdle = resolve;
    });
    try {
      const before = this.deps.getSessionState().activeCardId;
      const snapshot =
        this.deps.getRunMode() === 'local'
          ? await this.deps.advanceLocal(deltaMs)
          : await this.deps.advanceNetwork(deltaMs);
      if (!snapshot) {
        return;
      }
      if (
        this.deps.getRunMode() === 'local' &&
        shouldRenderTimerSnapshot(snapshot, this.deps.getSessionState())
      ) {
        await this.deps.renderLocalSnapshot(snapshot);
      }
      this.applySnapshot(snapshot);
      const expired = this.scriptTimerRegistry.advance(deltaMs);
      for (const timer of expired) {
        this.deps.recordTimeline('script-timer-expire', 'state', {
          id: timer.id,
          token: timer.token,
          dueMs: timer.dueMs,
          nowMs: this.scriptTimerRegistry.currentTimeMs()
        });
      }
      if (snapshot.externalNavigationIntent) {
        await this.deps.handleExternalIntent(snapshot.externalNavigationIntent, snapshot);
      }
      if (before && snapshot.activeCardId && before !== snapshot.activeCardId) {
        this.deps.recordTimeline('engine-timer-transition', 'state', {
          from: before,
          to: snapshot.activeCardId
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.deps.recordTimeline('engine-timer-tick', 'error', { message });
    } finally {
      this.timerTickInFlight = false;
      this.resolveTimerIdle?.();
      this.resolveTimerIdle = undefined;
      this.scheduleNextWakeup();
    }
  }

  private scheduleNextWakeup(minimumDelayMs = 0): void {
    if (!this.running || this.timerTickInFlight) {
      return;
    }
    if (this.timerLoopHandle) {
      clearTimeout(this.timerLoopHandle);
      this.timerLoopHandle = null;
    }
    const delays = [this.nativeTimerWakeupMs, this.scriptTimerRegistry.nextWakeupMs()].filter(
      (delay): delay is number => delay !== undefined
    );
    if (delays.length === 0) {
      return;
    }
    const requestedDelayMs = Math.max(0, Math.min(...delays));
    const delayMs = requestedDelayMs === 0 ? minimumDelayMs : requestedDelayMs;
    this.timerLoopHandle = setTimeout(() => {
      this.timerLoopHandle = null;
      void this.tick(delayMs);
    }, delayMs);
  }
}
