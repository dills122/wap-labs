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
    getSessionState: vi.fn(
      (): HostSessionState => ({
        runMode: 'local',
        navigationStatus: 'loaded',
        requestedUrl: 'http://local.test/start.wml',
        finalUrl: 'http://local.test/start.wml',
        activeCardId: 'home',
        focusedLinkIndex: 0
      })
    ),
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

  it('starts one interval and stops it cleanly', () => {
    const deps = createDeps();
    const runtime = new EngineTimerRuntime(deps);

    runtime.start();
    runtime.start();
    expect(vi.getTimerCount()).toBe(1);

    runtime.stop();
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
