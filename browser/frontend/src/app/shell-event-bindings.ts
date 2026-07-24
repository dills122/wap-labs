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

    this.bindButton('#btn-health', runAction('health', actions.health));
    this.bindButton('#btn-load-context', runAction('load-raw-wml', actions.loadRawWml));
    this.bindButton('#btn-fetch-url', runAction('fetch-url', actions.fetchUrl));
    this.bindButton('#btn-reload', runAction('reload', actions.reload));

    this.bindEvent(
      refs.fetchUrlInput,
      'keydown',
      runAction('fetch-url-enter', async (event?: Event) => {
        if (event instanceof KeyboardEvent && event.key === 'Enter') {
          event.preventDefault();
          await actions.fetchUrlEnter(event);
        }
      })
    );

    this.bindEvent(refs.runModeSelectEl, 'change', runAction('change-mode', actions.changeMode));
    this.bindEvent(
      refs.localExampleSelectEl,
      'change',
      runAction('select-local-example', actions.selectLocalExample)
    );
    this.bindEvent(
      refs.loadLocalBtnEl,
      'click',
      runAction('load-local-example', actions.loadLocalExample)
    );

    this.bindButton('#btn-render', runAction('render', actions.render));
    this.bindKeyButton('#btn-up', 'up');
    this.bindKeyButton('#btn-down', 'down');
    this.bindKeyButton('#btn-enter', 'enter');

    const backBtn = document.querySelector<HTMLButtonElement>('#btn-back');
    if (backBtn) {
      this.backBtnEl = backBtn;
      this.bindEvent(backBtn, 'click', runAction('navigate-back', actions.navigateBack));
    }

    this.bindButton('#btn-snapshot', runAction('snapshot', actions.snapshot));
    this.bindButton(
      '#btn-clear-intent',
      runAction('clear-external-intent', actions.clearExternalIntent)
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

  // U3: back-button dim/enable is driven by BrowserController (which knows
  // run-mode + history state), but the DOM element itself belongs to this
  // module since it owns the #btn-back binding.
  setBackButtonAvailable(available: boolean): void {
    if (!this.backBtnEl) {
      return;
    }
    this.backBtnEl.disabled = !available;
    this.backBtnEl.setAttribute('aria-disabled', String(!available));
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
