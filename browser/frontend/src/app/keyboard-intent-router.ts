import type { EngineKey } from '../../../contracts/engine';
import type { ControlEditDisposition } from './focused-control-edit';
import { resolveKeyboardIntent } from './keyboard';
import { WAVES_COPY } from './waves-copy';

// M1-08 residual: extracted from BrowserController's window keydown handler.
// Owns keyboard-intent resolution/routing (engine keys, back navigation,
// dev-tools toggle, focused-control-edit interception) and the serialized
// action queue that keeps overlapping keydowns from interleaving with each
// other or with a concurrent engine timer tick. BrowserController still owns
// what each routed action actually *does* (applyEngineKey,
// navigateBackWithFallback, etc.) -- those are injected as dependencies,
// same constructor-injected pattern as EngineTimerRuntime/
// StartupNetworkProbeController/FocusedControlEditController.
export interface KeyboardIntentRouterDependencies {
  // Same shape as BrowserController's `withAction`: wraps an action with
  // timeline start/ok/error recording and status-on-error reporting.
  runAction: (
    actionName: string,
    action: (event?: Event) => Promise<void>
  ) => (event?: Event) => Promise<void>;
  // Toggles the dev drawer open/closed and returns the resulting open state.
  toggleDeveloperTools(): boolean;
  applyFocusedControlEditKey(key: string): Promise<ControlEditDisposition>;
  applyEngineKey(key: EngineKey): Promise<void>;
  navigateBackWithFallback(): Promise<'engine' | 'host' | 'none'>;
  setStatus(message: string): void;
}

export class KeyboardIntentRouter {
  private actionInFlight = false;
  private actionsPending = 0;
  private actionQueue: Promise<void> = Promise.resolve();

  constructor(private readonly deps: KeyboardIntentRouterDependencies) {}

  // Polled by EngineTimerRuntime's canTick() so a timer tick never
  // interleaves with an in-flight keyboard action.
  isActionInFlight(): boolean {
    return this.actionInFlight;
  }

  readonly handleWindowKeydown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    const intent = resolveKeyboardIntent(
      event.key,
      event.ctrlKey,
      event.shiftKey,
      isTextEntryTarget(event.target)
    );

    if (intent.type === 'none') {
      if (this.shouldRouteKeyToControlEdit(event)) {
        event.preventDefault();
        this.enqueueAction(async () => {
          await this.deps.runAction('keyboard-control-edit', async () => {
            const handled = await this.deps.applyFocusedControlEditKey(event.key);
            if (handled) {
              this.deps.setStatus(WAVES_COPY.status.keyboard(event.key));
            }
          })();
        });
      }
      return;
    }
    event.preventDefault();

    if (intent.type === 'toggle-dev-tools') {
      const open = this.deps.toggleDeveloperTools();
      this.deps.setStatus(
        open ? WAVES_COPY.status.developerToolsOpened : WAVES_COPY.status.developerToolsHidden
      );
      return;
    }

    if (intent.type === 'engine-key') {
      this.enqueueAction(async () => {
        await this.deps.runAction(`keyboard-${intent.key}`, async () => {
          if (this.shouldRouteKeyToControlEdit(event)) {
            const disposition = await this.deps.applyFocusedControlEditKey(event.key);
            if (disposition === 'handled-stop') {
              this.deps.setStatus(WAVES_COPY.status.keyboard(intent.key));
              return;
            }
            if (disposition === 'handled' && intent.key !== 'enter') {
              this.deps.setStatus(WAVES_COPY.status.keyboard(intent.key));
              return;
            }
          }
          await this.deps.applyEngineKey(intent.key);
          this.deps.setStatus(WAVES_COPY.status.keyboard(intent.key));
        })();
      });
      return;
    }

    if (intent.type === 'navigate-back') {
      this.enqueueAction(async () => {
        await this.deps.runAction('keyboard-backspace', async () => {
          if (this.shouldRouteKeyToControlEdit(event)) {
            const handled = await this.deps.applyFocusedControlEditKey(event.key);
            if (handled) {
              this.deps.setStatus(WAVES_COPY.status.keyboard(event.key));
              return;
            }
          }
          const mode = await this.deps.navigateBackWithFallback();
          if (mode === 'engine') {
            this.deps.setStatus(WAVES_COPY.status.keyboardBackEngine);
          } else if (mode === 'host') {
            this.deps.setStatus(WAVES_COPY.status.keyboardBackBrowser);
          } else {
            this.deps.setStatus(WAVES_COPY.status.keyboardBackNone);
          }
        })();
      });
    }
  };

  private enqueueAction(action: () => Promise<void>): void {
    // Flip the in-flight flag synchronously, before any await, so
    // isActionInFlight() (polled by the timer runtime's canTick()) can never
    // observe a false "not busy" reading between this keydown and the
    // queued action actually starting. A pending counter (rather than a
    // plain boolean) is used so overlapping queued actions don't clear the
    // flag early while a later action is still waiting its turn.
    this.actionsPending += 1;
    this.actionInFlight = true;
    this.actionQueue = this.actionQueue
      .then(async () => {
        try {
          await action();
        } finally {
          this.actionsPending = Math.max(0, this.actionsPending - 1);
          this.actionInFlight = this.actionsPending > 0;
        }
      })
      .catch(() => {
        // The action's own finally above already accounted for the pending
        // count; this catch exists only to keep the queue promise resolved
        // so subsequent actions can still run after a rejection.
      });
  }

  private shouldRouteKeyToControlEdit(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }
    if (isTextEntryTarget(event.target)) {
      return false;
    }
    if (
      event.key === 'Enter' ||
      event.key === 'Escape' ||
      event.key === 'Backspace' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown'
    ) {
      return true;
    }
    return event.key.length === 1;
  }
}

const isTextEntryTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target instanceof HTMLInputElement) {
    const type = target.type.toLowerCase();
    return type === 'text' || type === 'search' || type === 'url' || type === 'number';
  }
  if (target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (target instanceof HTMLSelectElement) {
    return true;
  }
  return target.getAttribute('contenteditable') === 'true';
};
