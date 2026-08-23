import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostSessionState, RunMode } from '../../../contracts/transport';
import { EngineTimerRuntime, type EngineTimerRuntimeDependencies } from './engine-timer-runtime';
import { snapshot } from './navigation-state.test-helpers';

const createDeps = (
  overrides: Partial<EngineTimerRuntimeDependencies> = {}
): EngineTimerRuntimeDependencies & {
  renderLocalSnapshot: ReturnType<typeof vi.fn>;
  handleExternalIntent: ReturnType<typeof vi.fn>;
  recordTimeline: ReturnType<typeof vi.fn>;
} => {
  const renderLocalSnapshot = vi.fn(async () => undefined);
  const handleExternalIntent = vi.fn(async () => undefined);
  const recordTimeline = vi.fn();

  const base: EngineTimerRuntimeDependencies = {
    canTick: vi.fn(() => true),
    getRunMode: vi.fn((): RunMode => 'local'),
    advanceLocal: vi.fn(async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })),
    advanceNetwork: vi.fn(async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })),
    getSessionState: vi.fn((): HostSessionState => ({
      runMode: 'local',
      navigationStatus: 'loaded',
      requestedUrl: 'http://local.test/start.wml',
      finalUrl: 'http://local.test/start.wml',
      activeCardId: 'home',
      focusedLinkIndex: 0
    })),
    renderLocalSnapshot,
    handleExternalIntent,
    recordTimeline
  };

  return Object.assign(base, overrides, {
    renderLocalSnapshot,
    handleExternalIntent,
    recordTimeline
  });
};

describe('EngineTimerRuntime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules only the exact native timer wakeup and stops it cleanly', () => {
    const deps = createDeps();
    const runtime = new EngineTimerRuntime(deps);

    runtime.start();
    runtime.start();
    expect(vi.getTimerCount()).toBe(0);

    runtime.applySnapshot(
      snapshot({ activeCardId: 'home', focusedLinkIndex: 0, nextTimerWakeupMs: 250 })
    );
    expect(vi.getTimerCount()).toBe(1);

    runtime.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('advances by the engine-provided wakeup delay', async () => {
    const advanceLocal = vi.fn(async () => snapshot({ activeCardId: 'done', focusedLinkIndex: 0 }));
    const deps = createDeps({ advanceLocal });
    const runtime = new EngineTimerRuntime(deps);

    runtime.start();
    runtime.applySnapshot(
      snapshot({ activeCardId: 'timed', focusedLinkIndex: 0, nextTimerWakeupMs: 275 })
    );
    await vi.advanceTimersByTimeAsync(274);
    expect(advanceLocal).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(advanceLocal).toHaveBeenCalledWith(275);
  });

  it('keeps whenIdle pending until an active tick completes', async () => {
    let releaseTick: (() => void) | undefined;
    const advanceLocal = vi.fn(
      async () =>
        new Promise<ReturnType<typeof snapshot>>((resolve) => {
          releaseTick = () => resolve(snapshot({ activeCardId: 'done', focusedLinkIndex: 0 }));
        })
    );
    const runtime = new EngineTimerRuntime(createDeps({ advanceLocal }));

    const ticking = runtime.tick();
    let idleResolved = false;
    const idle = runtime.whenIdle().then(() => {
      idleResolved = true;
    });
    await Promise.resolve();

    expect(idleResolved).toBe(false);

    releaseTick?.();
    await ticking;
    await idle;

    expect(idleResolved).toBe(true);
  });

  it('resolves whenIdle after a failing tick is recorded', async () => {
    let rejectTick: ((error: Error) => void) | undefined;
    const advanceLocal = vi.fn(
      async () =>
        new Promise<ReturnType<typeof snapshot>>((_resolve, reject) => {
          rejectTick = reject;
        })
    );
    const deps = createDeps({ advanceLocal });
    const runtime = new EngineTimerRuntime(deps);

    const ticking = runtime.tick();
    const idle = runtime.whenIdle();
    rejectTick?.(new Error('timer failed'));
    await ticking;
    await expect(idle).resolves.toBeUndefined();

    expect(deps.recordTimeline).toHaveBeenCalledWith('engine-timer-tick', 'error', {
      message: 'timer failed'
    });
  });

  it('leaves whenIdle already resolved when a blocked tick never starts', async () => {
    const advanceLocal = vi.fn(async () => snapshot({ activeCardId: 'done' }));
    const runtime = new EngineTimerRuntime(
      createDeps({
        canTick: () => false,
        advanceLocal
      })
    );

    await runtime.tick();
    await expect(runtime.whenIdle()).resolves.toBeUndefined();

    expect(advanceLocal).not.toHaveBeenCalled();
  });

  it('re-arms a native timer wakeup skipped while an action is in flight', async () => {
    let actionInFlight = true;
    const advanceLocal = vi.fn(async () => snapshot({ activeCardId: 'done', focusedLinkIndex: 0 }));
    const deps = createDeps({
      canTick: () => !actionInFlight,
      advanceLocal
    });
    const runtime = new EngineTimerRuntime(deps);

    runtime.start();
    runtime.applySnapshot(
      snapshot({ activeCardId: 'timed', focusedLinkIndex: 0, nextTimerWakeupMs: 100 })
    );

    await vi.advanceTimersByTimeAsync(100);
    expect(advanceLocal).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);

    actionInFlight = false;
    await vi.advanceTimersByTimeAsync(100);
    expect(advanceLocal).toHaveBeenCalledOnce();
    expect(advanceLocal).toHaveBeenCalledWith(100);
  });

  it('stops a re-armed blocked wakeup without scheduling again', async () => {
    let actionInFlight = true;
    const advanceLocal = vi.fn(async () => snapshot({ activeCardId: 'done', focusedLinkIndex: 0 }));
    const deps = createDeps({
      canTick: () => !actionInFlight,
      advanceLocal
    });
    const runtime = new EngineTimerRuntime(deps);

    runtime.start();
    runtime.applySnapshot(
      snapshot({ activeCardId: 'timed', focusedLinkIndex: 0, nextTimerWakeupMs: 100 })
    );
    await vi.advanceTimersByTimeAsync(100);
    expect(vi.getTimerCount()).toBe(1);

    runtime.stop();
    actionInFlight = false;
    await vi.advanceTimersByTimeAsync(1_000);

    expect(advanceLocal).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves script timer cadence across a blocked wakeup', async () => {
    let actionInFlight = true;
    const advanceLocal = vi.fn(async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }));
    const deps = createDeps({
      canTick: () => !actionInFlight,
      advanceLocal
    });
    const runtime = new EngineTimerRuntime(deps);

    runtime.start();
    runtime.applySnapshot(
      snapshot({
        activeCardId: 'home',
        focusedLinkIndex: 0,
        lastScriptTimerRequests: [{ type: 'schedule', token: 'blocked', delayMs: 80 }]
      })
    );

    await vi.advanceTimersByTimeAsync(80);
    expect(advanceLocal).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);

    actionInFlight = false;
    await vi.advanceTimersByTimeAsync(79);
    expect(advanceLocal).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(advanceLocal).toHaveBeenCalledWith(80);
    expect(deps.recordTimeline).toHaveBeenCalledWith(
      'script-timer-expire',
      'state',
      expect.objectContaining({ token: 'blocked', dueMs: 80, nowMs: 80 })
    );
  });

  it('backs off an already-due blocked timer to the engine cadence', async () => {
    let actionInFlight = true;
    const advanceLocal = vi.fn(async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }));
    const deps = createDeps({
      canTick: () => !actionInFlight,
      advanceLocal
    });
    const runtime = new EngineTimerRuntime(deps);

    runtime.start();
    runtime.applySnapshot(
      snapshot({ activeCardId: 'home', focusedLinkIndex: 0, nextTimerWakeupMs: 0 })
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(advanceLocal).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);

    actionInFlight = false;
    await vi.advanceTimersByTimeAsync(99);
    expect(advanceLocal).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(advanceLocal).toHaveBeenCalledWith(100);
  });

  it('lets the active tick re-arm after re-entrant wakeups without duplicate timers', async () => {
    let releaseTick: (() => void) | undefined;
    const advanceLocal = vi
      .fn()
      .mockImplementationOnce(
        async () =>
          new Promise<ReturnType<typeof snapshot>>((resolve) => {
            releaseTick = () =>
              resolve(
                snapshot({ activeCardId: 'home', focusedLinkIndex: 0, nextTimerWakeupMs: 100 })
              );
          })
      )
      .mockResolvedValue(snapshot({ activeCardId: 'done', focusedLinkIndex: 0 }));
    const deps = createDeps({ advanceLocal });
    const runtime = new EngineTimerRuntime(deps);

    runtime.start();
    runtime.applySnapshot(
      snapshot({ activeCardId: 'home', focusedLinkIndex: 0, nextTimerWakeupMs: 100 })
    );
    const firstTick = runtime.tick();

    await vi.advanceTimersByTimeAsync(100);
    expect(advanceLocal).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);

    await runtime.tick();
    expect(vi.getTimerCount()).toBe(0);

    releaseTick?.();
    await firstTick;
    expect(vi.getTimerCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(100);
    expect(advanceLocal).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('renders local snapshots when timer advancement changes state', async () => {
    const deps = createDeps({
      advanceLocal: vi.fn(async () =>
        snapshot({
          activeCardId: 'next',
          focusedLinkIndex: 0
        })
      )
    });
    const runtime = new EngineTimerRuntime(deps);

    await runtime.tick();

    expect(deps.advanceLocal).toHaveBeenCalled();
    expect(deps.renderLocalSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ activeCardId: 'next' })
    );
    expect(deps.recordTimeline).toHaveBeenCalledWith('engine-timer-transition', 'state', {
      from: 'home',
      to: 'next'
    });
  });

  it('does not render or follow navigation when advancement returns no snapshot', async () => {
    const deps = createDeps({
      advanceLocal: vi.fn(async () => null)
    });
    const runtime = new EngineTimerRuntime(deps);

    await runtime.tick();

    expect(deps.renderLocalSnapshot).not.toHaveBeenCalled();
    expect(deps.handleExternalIntent).not.toHaveBeenCalled();
    expect(deps.recordTimeline).not.toHaveBeenCalledWith(
      'engine-timer-transition',
      'state',
      expect.anything()
    );
  });

  it('does not render during network ticks and follows external intents', async () => {
    const deps = createDeps({
      getRunMode: vi.fn((): RunMode => 'network'),
      advanceNetwork: vi.fn(async () =>
        snapshot({
          activeCardId: 'home',
          focusedLinkIndex: 0,
          externalNavigationIntent: 'http://local.test/next.wml'
        })
      )
    });
    const runtime = new EngineTimerRuntime(deps);

    await runtime.tick();

    expect(deps.advanceNetwork).toHaveBeenCalled();
    expect(deps.renderLocalSnapshot).not.toHaveBeenCalled();
    expect(deps.handleExternalIntent).toHaveBeenCalledWith(
      'http://local.test/next.wml',
      expect.objectContaining({ externalNavigationIntent: 'http://local.test/next.wml' })
    );
  });

  it('records script timer schedule and expiration events from snapshots', async () => {
    const deps = createDeps({
      advanceLocal: vi.fn(async () =>
        snapshot({
          activeCardId: 'home',
          focusedLinkIndex: 0,
          lastScriptTimerRequests: [{ type: 'schedule', token: 'tok-1', delayMs: 100 }]
        })
      )
    });
    const runtime = new EngineTimerRuntime(deps);

    await runtime.tick();

    expect(deps.recordTimeline).toHaveBeenCalledWith(
      'script-timer-schedule',
      'state',
      expect.objectContaining({ token: 'tok-1', delayMs: 100 })
    );
    expect(deps.recordTimeline).toHaveBeenCalledWith(
      'script-timer-expire',
      'state',
      expect.objectContaining({ token: 'tok-1' })
    );
  });

  it('records timer tick errors and suppresses re-entrant ticks', async () => {
    let releaseTick: (() => void) | undefined;
    const deps = createDeps({
      advanceLocal: vi.fn(
        async () =>
          new Promise<ReturnType<typeof snapshot>>((resolve) => {
            releaseTick = () => resolve(snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }));
          })
      )
    });
    const runtime = new EngineTimerRuntime(deps);

    const firstTick = runtime.tick();
    const secondTick = runtime.tick();
    expect(deps.advanceLocal).toHaveBeenCalledTimes(1);
    releaseTick?.();
    await firstTick;
    await secondTick;

    const failingDeps = createDeps({
      advanceLocal: vi.fn(async () => {
        throw new Error('timer boom');
      })
    });
    const failingRuntime = new EngineTimerRuntime(failingDeps);

    await failingRuntime.tick();

    expect(failingDeps.recordTimeline).toHaveBeenCalledWith('engine-timer-tick', 'error', {
      message: 'timer boom'
    });
  });
});
