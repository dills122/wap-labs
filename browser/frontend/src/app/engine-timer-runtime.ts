import type { EngineRuntimeSnapshot } from '../../../contracts/engine';
import type { HostSessionState } from '../../../contracts/transport';
import { shouldRenderTimerSnapshot } from './navigation-state';
import { ScriptTimerRegistry } from './script-timer-registry';
import { WAVES_CONFIG } from './waves-config';

export interface EngineTimerRuntimeDependencies {
  canTick(): boolean;
  getRunMode(): 'local' | 'network';
  advanceLocal(deltaMs: number): Promise<EngineRuntimeSnapshot>;
  advanceNetwork(deltaMs: number): Promise<EngineRuntimeSnapshot>;
  getSessionState(): HostSessionState;
  renderLocalSnapshot(snapshot: EngineRuntimeSnapshot): Promise<void>;
  handleExternalIntent(intentUrl: string, snapshot: EngineRuntimeSnapshot): Promise<void>;
  recordTimeline(action: string, phase: 'state' | 'error', details?: Record<string, unknown>): void;
}

export class EngineTimerRuntime {
  private timerLoopHandle: ReturnType<typeof setInterval> | null = null;
  private timerTickInFlight = false;
  private readonly scriptTimerRegistry = new ScriptTimerRegistry();

  constructor(private readonly deps: EngineTimerRuntimeDependencies) {}

  start(): void {
    if (this.timerLoopHandle) {
      return;
    }
    this.timerLoopHandle = setInterval(() => {
      void this.tick();
    }, WAVES_CONFIG.engineTimerTickMs);
  }

  stop(): void {
    if (!this.timerLoopHandle) {
      return;
    }
    clearInterval(this.timerLoopHandle);
    this.timerLoopHandle = null;
  }

  resetScriptTimers(): void {
    this.scriptTimerRegistry.reset();
  }

  applySnapshot(snapshot: EngineRuntimeSnapshot): void {
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
  }

  async tick(): Promise<void> {
    if (this.timerTickInFlight || !this.deps.canTick()) {
      return;
    }
    this.timerTickInFlight = true;
    try {
      const before = this.deps.getSessionState().activeCardId;
      const snapshot =
        this.deps.getRunMode() === 'local'
          ? await this.deps.advanceLocal(WAVES_CONFIG.engineTimerTickMs)
          : await this.deps.advanceNetwork(WAVES_CONFIG.engineTimerTickMs);
      if (
        this.deps.getRunMode() === 'local' &&
        shouldRenderTimerSnapshot(snapshot, this.deps.getSessionState())
      ) {
        await this.deps.renderLocalSnapshot(snapshot);
      }
      this.applySnapshot(snapshot);
      const expired = this.scriptTimerRegistry.advance(WAVES_CONFIG.engineTimerTickMs);
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
    }
  }
}
