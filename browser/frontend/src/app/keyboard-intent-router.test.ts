import { describe, expect, it, vi } from 'vitest';
import {
  KeyboardIntentRouter,
  type KeyboardIntentRouterDependencies
} from './keyboard-intent-router';

const flushAsyncWork = async (turns = 4): Promise<void> => {
  for (let index = 0; index < turns; index += 1) {
    await Promise.resolve();
  }
};

const createDeps = (
  overrides: Partial<KeyboardIntentRouterDependencies> = {}
): KeyboardIntentRouterDependencies & {
  toggleDeveloperTools: ReturnType<typeof vi.fn>;
  applyFocusedControlEditKey: ReturnType<typeof vi.fn>;
  applyEngineKey: ReturnType<typeof vi.fn>;
  navigateBackWithFallback: ReturnType<typeof vi.fn>;
  setStatus: ReturnType<typeof vi.fn>;
} => {
  const toggleDeveloperTools = vi.fn(overrides.toggleDeveloperTools ?? (() => true));
  const applyFocusedControlEditKey = vi.fn(
    overrides.applyFocusedControlEditKey ?? (async () => 'unhandled' as const)
  );
  const applyEngineKey = vi.fn(overrides.applyEngineKey ?? (async () => undefined));
  const navigateBackWithFallback = vi.fn(
    overrides.navigateBackWithFallback ?? (async () => 'engine' as const)
  );
  const setStatus = vi.fn(overrides.setStatus ?? (() => undefined));

  const base: KeyboardIntentRouterDependencies = {
    // Mirrors BrowserController's real `withAction`: run the action directly,
    // ignoring the action name (timeline recording is irrelevant here).
    runAction: (_actionName, action) => action,
    toggleDeveloperTools,
    applyFocusedControlEditKey,
    applyEngineKey,
    navigateBackWithFallback,
    waitForEngineTimerIdle: async () => undefined,
    setStatus
  };

  return Object.assign(base, overrides, {
    toggleDeveloperTools,
    applyFocusedControlEditKey,
    applyEngineKey,
    navigateBackWithFallback,
    setStatus
  });
};

describe('KeyboardIntentRouter', () => {
  it('leaves application shortcuts to the shared command registry', () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(
      new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, shiftKey: true })
    );

    expect(deps.toggleDeveloperTools).not.toHaveBeenCalled();
    expect(deps.setStatus).not.toHaveBeenCalled();
    expect(router.isActionInFlight()).toBe(false);
  });

  it('preserves native Enter activation for browser-owned controls', async () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);
    const summary = document.createElement('summary');
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    Object.defineProperty(event, 'target', { value: summary });

    router.handleWindowKeydown(event);
    await router.whenIdle();

    expect(event.defaultPrevented).toBe(false);
    expect(deps.applyEngineKey).not.toHaveBeenCalled();
    expect(deps.applyFocusedControlEditKey).not.toHaveBeenCalled();
  });

  it('routes an engine-key intent through applyEngineKey and reports status', async () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    // The in-flight flag must flip synchronously, before the queued action
    // has had a chance to run -- this is what lets EngineTimerRuntime's
    // canTick() reliably avoid interleaving with a keyboard action.
    expect(router.isActionInFlight()).toBe(true);
    expect(deps.applyEngineKey).not.toHaveBeenCalled();

    await router.whenIdle();

    expect(deps.applyEngineKey).toHaveBeenCalledWith('up');
    expect(deps.setStatus).toHaveBeenCalledTimes(1);
    expect(deps.setStatus.mock.invocationCallOrder[0]).toBeLessThan(
      deps.applyEngineKey.mock.invocationCallOrder[0]
    );
    expect(router.isActionInFlight()).toBe(false);
  });

  it('lets the engine commit an active input and resolve accept on Enter', async () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    await flushAsyncWork();

    expect(deps.applyFocusedControlEditKey).toHaveBeenCalledWith('Enter');
    expect(deps.applyEngineKey).toHaveBeenCalledWith('enter');
  });

  it('does not fall through to the engine when focused select editing handles Enter', async () => {
    const deps = createDeps({
      applyFocusedControlEditKey: vi.fn(async () => 'handled-stop' as const)
    });
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    await router.whenIdle();

    expect(deps.applyFocusedControlEditKey).toHaveBeenCalledWith('Enter');
    expect(deps.applyEngineKey).not.toHaveBeenCalled();
  });

  it('does not fall through to the engine when input editing handles a navigation key', async () => {
    const deps = createDeps({
      applyFocusedControlEditKey: vi.fn(async () => 'handled' as const)
    });
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await router.whenIdle();

    expect(deps.applyFocusedControlEditKey).toHaveBeenCalledWith('ArrowDown');
    expect(deps.applyEngineKey).not.toHaveBeenCalled();
  });

  it('waits for an active engine timer before applying a physical softkey', async () => {
    let releaseTimer: (() => void) | undefined;
    const timerIdle = new Promise<void>((resolve) => {
      releaseTimer = resolve;
    });
    const deps = createDeps({
      waitForEngineTimerIdle: vi.fn(async () => timerIdle)
    });
    const router = new KeyboardIntentRouter(deps);

    const pressing = router.handleButtonKey('enter');
    await flushAsyncWork();

    expect(router.isActionInFlight()).toBe(true);
    expect(deps.applyEngineKey).not.toHaveBeenCalled();

    releaseTimer?.();
    await pressing;

    expect(deps.applyEngineKey).toHaveBeenCalledWith('enter');
    expect(router.isActionInFlight()).toBe(false);
  });

  it('applies physical softkeys in FIFO order', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const observed: string[] = [];
    const deps = createDeps({
      applyEngineKey: vi.fn(async (key) => {
        observed.push(`start:${key}`);
        if (key === 'up') {
          await firstGate;
        }
        observed.push(`end:${key}`);
      })
    });
    const router = new KeyboardIntentRouter(deps);

    const up = router.handleButtonKey('up');
    const down = router.handleButtonKey('down');
    const enter = router.handleButtonKey('enter');
    await vi.waitFor(() => {
      expect(observed).toEqual(['start:up']);
    });

    releaseFirst?.();
    await Promise.all([up, down, enter]);

    expect(observed).toEqual([
      'start:up',
      'end:up',
      'start:down',
      'end:down',
      'start:enter',
      'end:enter'
    ]);
  });

  it('keeps whenIdle pending until every already-queued engine action completes', async () => {
    let releaseFirst: (() => void) | undefined;
    let releaseSecond: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const secondGate = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });
    const router = new KeyboardIntentRouter(createDeps());
    const first = vi.fn(async () => firstGate);
    const second = vi.fn(async () => secondGate);

    void router.serializeEngineAction(first);
    void router.serializeEngineAction(second);
    let idleResolved = false;
    const idle = router.whenIdle().then(() => {
      idleResolved = true;
    });
    await vi.waitFor(() => {
      expect(first).toHaveBeenCalledOnce();
    });
    expect(second).not.toHaveBeenCalled();
    expect(idleResolved).toBe(false);

    releaseFirst?.();
    await vi.waitFor(() => {
      expect(second).toHaveBeenCalledOnce();
    });
    expect(idleResolved).toBe(false);

    releaseSecond?.();
    await idle;
    expect(idleResolved).toBe(true);
    expect(router.isActionInFlight()).toBe(false);
  });

  it('routes Backspace through navigateBackWithFallback and words status by outcome', async () => {
    const deps = createDeps({
      navigateBackWithFallback: vi.fn(async () => 'host' as const)
    });
    const router = new KeyboardIntentRouter(deps);

    // A held modifier is what makes shouldRouteKeyToControlEdit bail out
    // before the focused-control-edit interception, so this exercises the
    // navigateBackWithFallback call directly (a plain, unmodified Backspace
    // is intercepted by the control-edit check first -- see the next test).
    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true }));
    await flushAsyncWork();

    expect(deps.navigateBackWithFallback).toHaveBeenCalledTimes(1);
    expect(deps.setStatus).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['engine', 'Keyboard: back (engine history)'],
    ['host', 'Keyboard: back (browser history)'],
    ['none', 'Keyboard: no back history']
  ] as const)('reports the %s Back outcome', async (outcome, expectedStatus) => {
    const deps = createDeps({
      navigateBackWithFallback: vi.fn(async () => outcome)
    });
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true }));
    await router.whenIdle();

    expect(deps.setStatus).toHaveBeenLastCalledWith(expectedStatus);
  });

  it('retains back navigation when the focused WML target is not an input', async () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'Backspace' }));
    await flushAsyncWork();

    expect(deps.applyFocusedControlEditKey).toHaveBeenCalledWith('Backspace');
    expect(deps.navigateBackWithFallback).toHaveBeenCalledTimes(1);
  });

  it('does not navigate back when focused input editing handles Backspace', async () => {
    const deps = createDeps();
    deps.applyFocusedControlEditKey.mockResolvedValue('handled');
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'Backspace' }));
    await flushAsyncWork();

    expect(deps.applyFocusedControlEditKey).toHaveBeenCalledWith('Backspace');
    expect(deps.navigateBackWithFallback).not.toHaveBeenCalled();
  });

  it('serializes overlapping keydowns so a later action waits for an earlier one', async () => {
    let resolveGate: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      resolveGate = resolve;
    });
    const applyEngineKey = vi.fn(async (key: 'up' | 'down' | 'enter') => {
      if (key === 'up') {
        await gate;
      }
    });
    const deps = createDeps({ applyEngineKey });
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    router.handleWindowKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await flushAsyncWork();

    // The second action must not have run yet -- the first is still pending
    // on the gate.
    expect(deps.applyEngineKey).toHaveBeenCalledTimes(1);
    expect(deps.applyEngineKey).toHaveBeenCalledWith('up');
    expect(router.isActionInFlight()).toBe(true);

    resolveGate?.();
    await flushAsyncWork(20);

    expect(deps.applyEngineKey).toHaveBeenCalledTimes(2);
    expect(deps.applyEngineKey).toHaveBeenLastCalledWith('down');
    expect(router.isActionInFlight()).toBe(false);
  });

  it('keeps the shared engine-action queue usable after an action rejects', async () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);
    const laterAction = vi.fn(async () => undefined);

    await expect(
      router.serializeEngineAction(async () => {
        throw new Error('draft update failed');
      })
    ).rejects.toThrow('draft update failed');
    await router.serializeEngineAction(laterAction);

    expect(laterAction).toHaveBeenCalledTimes(1);
    expect(router.isActionInFlight()).toBe(false);
  });

  it('runs an already-queued action after the preceding action rejects', async () => {
    const router = new KeyboardIntentRouter(createDeps());
    const failure = router.serializeEngineAction(async () => {
      throw new Error('first action failed');
    });
    const laterAction = vi.fn(async () => undefined);
    const later = router.serializeEngineAction(laterAction);

    await expect(failure).rejects.toThrow('first action failed');
    await later;

    expect(laterAction).toHaveBeenCalledOnce();
    expect(router.isActionInFlight()).toBe(false);
  });

  it('keeps the pending flag set while a later action waits after an earlier failure', async () => {
    let releaseLater: (() => void) | undefined;
    const laterGate = new Promise<void>((resolve) => {
      releaseLater = resolve;
    });
    const router = new KeyboardIntentRouter(createDeps());
    const failure = router.serializeEngineAction(async () => {
      throw new Error('first action failed');
    });
    const later = router.serializeEngineAction(async () => laterGate);

    await expect(failure).rejects.toThrow('first action failed');
    await flushAsyncWork();
    expect(router.isActionInFlight()).toBe(true);

    releaseLater?.();
    await later;
    expect(router.isActionInFlight()).toBe(false);
  });

  it('ignores non-KeyboardEvent input', () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new Event('keydown'));

    expect(deps.applyEngineKey).not.toHaveBeenCalled();
    expect(deps.toggleDeveloperTools).not.toHaveBeenCalled();
  });
});
