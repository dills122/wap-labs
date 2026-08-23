import type { EngineKey } from '../../../contracts/engine';
import type { BrowserShellRefs } from './browser-shell-template';

// M1-08 residual: extracted from BrowserController's bindListeners/
// unbindListeners so the controller no longer owns raw addEventListener
// bookkeeping. This module only wires DOM events to caller-supplied action
// callbacks (and the window keydown handler) -- it holds no navigation,
// run-mode, or keyboard-routing logic of its own. That logic stays defined
// on BrowserController (or the keyboard intent router) and is passed in via
// `actions`/`onWindowKeydown`, matching the constructor-injected pattern
// already used by EngineTimerRuntime/StartupNetworkProbeController/
// FocusedControlEditController.
export interface ShellEventBindingActions {
  health(): Promise<void>;
  loadRawWml(): Promise<void>;
  fetchUrl(): Promise<void>;
  fetchUrlEnter(event: Event): Promise<void>;
  reload(): Promise<void>;
  stopNavigation(): Promise<void>;
  retryNavigation(): Promise<void>;
  changeNavigationRoute(): Promise<void>;
  showNavigationDetails(): Promise<void>;
  returnFromNavigationError(): Promise<void>;
  changeMode(): Promise<void>;
  selectLocalExample(): Promise<void>;
  loadLocalExample(): Promise<void>;
  render(): Promise<void>;
  navigateBack(): Promise<void>;
  snapshot(): Promise<void>;
  clearExternalIntent(): Promise<void>;
  exportTimeline(): Promise<void>;
  clearTimeline(): Promise<void>;
  handleKey(key: EngineKey): Promise<void>;
}

export interface ShellEventBindingsDependencies {
  refs: BrowserShellRefs;
  actions: ShellEventBindingActions;
  // Same shape as BrowserController's existing `withAction`: wraps an action
  // with timeline start/ok/error recording and status-on-error reporting.
  runAction: (
    actionName: string,
    action: (event?: Event) => Promise<void>
  ) => (event?: Event) => Promise<void>;
  serializeEngineAction(action: () => Promise<void>): Promise<void>;
  onWindowKeydown: (event: Event) => void;
}

export class ShellEventBindings {
  private readonly listenerCleanup: Array<() => void> = [];

  private bound = false;

  private backBtnEl: HTMLButtonElement | null = null;

  constructor(private readonly deps: ShellEventBindingsDependencies) {}

  bind(): void {
    if (this.bound) {
      this.unbind();
    }
    const { refs, runAction, actions } = this.deps;
    const runEngineAction = (
      actionName: string,
      action: (event?: Event) => Promise<void>
    ): ((event?: Event) => Promise<void>) => {
      const wrapped = runAction(actionName, action);
      return (event?: Event) => this.deps.serializeEngineAction(() => wrapped(event));
    };

    this.bindButton('#btn-health', runAction('health', actions.health));
    this.bindButton('#btn-load-context', runEngineAction('load-raw-wml', actions.loadRawWml));
    // Fetch owns a dual Go/Stop state. Its controller action serializes the
    // Go branch, while Stop must remain able to cancel an in-flight request
    // immediately instead of waiting behind that same request in this queue.
    this.bindButton('#btn-fetch-url', runAction('fetch-url', actions.fetchUrl));
    this.bindButton('#btn-reload', runEngineAction('reload', actions.reload));
    this.bindButton('#btn-stop-navigation', runAction('stop-navigation', actions.stopNavigation));
    this.bindButton(
      '#btn-navigation-retry',
      runEngineAction('retry-navigation', actions.retryNavigation)
    );
    this.bindButton(
      '#btn-navigation-change-route',
      runAction('change-navigation-route', actions.changeNavigationRoute)
    );
    this.bindButton(
      '#btn-navigation-details',
      runAction('show-navigation-details', actions.showNavigationDetails)
    );
    this.bindButton(
      '#btn-navigation-return',
      runAction('return-from-navigation-error', actions.returnFromNavigationError)
    );

    const fetchUrlEnter = runAction('fetch-url-enter', async (event) => {
      if (event) {
        await actions.fetchUrlEnter(event);
      }
    });
    const stopNavigation = runAction('stop-navigation', actions.stopNavigation);
    this.bindEvent(refs.fetchUrlInput, 'keydown', (event) => {
      if (!(event instanceof KeyboardEvent)) {
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        void fetchUrlEnter(event);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        void stopNavigation(event);
      }
    });

    this.bindEvent(
      refs.runModeSelectEl,
      'change',
      runEngineAction('change-mode', actions.changeMode)
    );
    this.bindEvent(
      refs.localExampleSelectEl,
      'change',
      runEngineAction('select-local-example', actions.selectLocalExample)
    );
    this.bindEvent(
      refs.loadLocalBtnEl,
      'click',
      runEngineAction('load-local-example', actions.loadLocalExample)
    );

    this.bindButton('#btn-render', runEngineAction('render', actions.render));
    this.bindKeyButton('#btn-up', 'up');
    this.bindKeyButton('#btn-down', 'down');
    this.bindKeyButton('#btn-enter', 'enter');

    const backBtn = document.querySelector<HTMLButtonElement>('#btn-back');
    if (backBtn) {
      this.backBtnEl = backBtn;
      this.bindEvent(backBtn, 'click', runEngineAction('navigate-back', actions.navigateBack));
    }

    this.bindButton('#btn-snapshot', runEngineAction('snapshot', actions.snapshot));
    this.bindButton(
      '#btn-clear-intent',
      runEngineAction('clear-external-intent', actions.clearExternalIntent)
    );
    this.bindButton('#btn-export-timeline', runAction('export-timeline', actions.exportTimeline));
    this.bindButton('#btn-clear-timeline', runAction('clear-timeline', actions.clearTimeline));

    this.bindEvent(window, 'keydown', this.deps.onWindowKeydown);
    this.bound = true;
  }

  unbind(): void {
    while (this.listenerCleanup.length > 0) {
      const dispose = this.listenerCleanup.pop();
      dispose?.();
    }
    this.bound = false;
  }

  // History availability is useful presentation metadata, but WML requires
  // the BACK action path itself to remain user-accessible at all times.
  setBackButtonAvailable(available: boolean): void {
    if (!this.backBtnEl) {
      return;
    }
    this.backBtnEl.disabled = false;
    this.backBtnEl.setAttribute('aria-disabled', 'false');
    this.backBtnEl.dataset.historyAvailable = String(available);
  }

  private bindButton(selector: string, handler: EventListenerOrEventListenerObject): void {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (!button) {
      return;
    }
    this.bindEvent(button, 'click', handler);
  }

  private bindKeyButton(selector: string, key: EngineKey): void {
    const { runAction, actions } = this.deps;
    this.bindButton(
      selector,
      runAction(`handle-key-${key}`, async () => {
        await actions.handleKey(key);
      })
    );
  }

  private bindEvent(
    target: EventTarget,
    eventType: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(eventType, handler, options);
    this.listenerCleanup.push(() => {
      target.removeEventListener(eventType, handler, options);
    });
  }
}
