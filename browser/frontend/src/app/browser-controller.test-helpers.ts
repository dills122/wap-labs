import type { BrowserController, RunMode } from './browser-controller';
import type { EngineKey } from '../../../contracts/engine';
import type { EngineTimerRuntime } from './engine-timer-runtime';
import type { KeyboardIntentRouter } from './keyboard-intent-router';

/**
 * Typed access to `BrowserController`'s private test-only surface, so test
 * files reach into implementation details through one narrow, reviewable
 * cast instead of scattering `as any` at each call site.
 */
interface BrowserControllerPrivates {
  setRunMode(mode: RunMode, options: { loadLocalOnEnter: boolean }): Promise<void>;
  applyEngineKey(key: EngineKey): Promise<void>;
  tickEngineTimerRuntime(): Promise<void>;
  readonly timerRuntime: EngineTimerRuntime;
  readonly keyboardIntentRouter: Omit<KeyboardIntentRouter, 'actionQueue'> & {
    actionQueue: Promise<void>;
  };
}

export function controllerPrivates(controller: BrowserController): BrowserControllerPrivates {
  return controller as unknown as BrowserControllerPrivates;
}
