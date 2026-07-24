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
  const toggleDeveloperTools = vi.fn(() => true);
  const applyFocusedControlEditKey = vi.fn(async () => 'unhandled' as const);
  const applyEngineKey = vi.fn(async () => undefined);
  const navigateBackWithFallback = vi.fn(async () => 'engine' as const);
  const setStatus = vi.fn();

  const base: KeyboardIntentRouterDependencies = {
    // Mirrors BrowserController's real `withAction`: run the action directly,
    // ignoring the action name (timeline recording is irrelevant here).
    runAction: (_actionName, action) => action,
    toggleDeveloperTools,
    applyFocusedControlEditKey,
    applyEngineKey,
    navigateBackWithFallback,
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
  it('toggles developer tools on Ctrl+Shift+D without enqueueing an action', () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(
      new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, shiftKey: true })
    );

    expect(deps.toggleDeveloperTools).toHaveBeenCalledTimes(1);
    expect(deps.setStatus).toHaveBeenCalledTimes(1);
    expect(router.isActionInFlight()).toBe(false);
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

    await flushAsyncWork();

    expect(deps.applyEngineKey).toHaveBeenCalledWith('up');
    expect(deps.setStatus).toHaveBeenCalledTimes(1);
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

  it('routes a plain Backspace through the focused-control-edit check first', async () => {
    const deps = createDeps();
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

  it('ignores non-KeyboardEvent input', () => {
    const deps = createDeps();
    const router = new KeyboardIntentRouter(deps);

    router.handleWindowKeydown(new Event('keydown'));

    expect(deps.applyEngineKey).not.toHaveBeenCalled();
    expect(deps.toggleDeveloperTools).not.toHaveBeenCalled();
  });
});
