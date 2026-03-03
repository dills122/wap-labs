import type { HostNavigationSource } from '../../../contracts/transport';
import type { EngineKey, EngineRuntimeSnapshot } from '../../../contracts/engine';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';
import { resolveKeyboardIntent } from './keyboard';
import { isProbeReachable } from './network';
import { createNavigationStateMachine } from './navigation-state';
import { ScriptTimerRegistry } from './script-timer-registry';
import type { BrowserPresenter } from './browser-presenter';
import type { BrowserShellRefs } from './browser-shell-template';

const MAX_EXTERNAL_INTENT_HOPS = 3;
const NETWORK_PROBE_MAX_ATTEMPTS = 3;
const NETWORK_PROBE_DELAY_MS = 1200;
const NETWORK_PROBE_TIMEOUT_MS = 1800;
const ENGINE_TIMER_TICK_MS = 100;

export class BrowserController {
  private readonly hostClient: TauriHostClient;

  private readonly presenter: BrowserPresenter;

  private readonly refs: BrowserShellRefs;

  private readonly navigation: ReturnType<typeof createNavigationStateMachine>;

  private readonly listenerCleanup: Array<() => void> = [];

  private listenersBound = false;
  private timerLoopHandle: ReturnType<typeof setInterval> | null = null;
  private timerTickInFlight = false;
  private readonly scriptTimerRegistry = new ScriptTimerRegistry();

  constructor(hostClient: TauriHostClient, presenter: BrowserPresenter, refs: BrowserShellRefs) {
    this.hostClient = hostClient;
    this.presenter = presenter;
    this.refs = refs;
    this.navigation = createNavigationStateMachine(
      this.hostClient,
      this.refs.fetchUrlInput.value,
      {
        onSessionState: (session) => this.presenter.setSessionState(session),
        onSnapshot: (snapshot) => this.presenter.setSnapshot(snapshot),
        onRender: (render) => this.presenter.drawRenderList(render),
        onTransportResponse: (response) => this.presenter.setTransportResponse(response),
        onNetworkUnavailable: () => {
          this.presenter.showToast(
            'No network available currently. WAP server/gateway is unreachable.',
            'error'
          );
        },
        onStateEvent: (action, details) => {
          this.presenter.recordTimeline(action, 'state', details);
        }
      },
      MAX_EXTERNAL_INTENT_HOPS
    );
  }

  async init(sampleWml: string): Promise<void> {
    this.refs.wmlInput.value = sampleWml;
    this.presenter.setSessionState({
      navigationStatus: 'idle',
      requestedUrl: this.refs.fetchUrlInput.value
    });
    this.presenter.clearTimeline();
    this.presenter.recordTimeline('bootstrap', 'state', {
      requestedUrl: this.refs.fetchUrlInput.value
    });
    this.presenter.setStatus('Starting WAP/WML based browser 1.x...');

    if (this.listenersBound) {
      this.unbindListeners();
    }
    this.bindListeners();
    this.startTimerRuntimeLoop();
    await this.runStartupNetworkProbe();
  }

  dispose(): void {
    this.stopTimerRuntimeLoop();
    this.unbindListeners();
  }

  private bindListeners(): void {
    const healthBtn = document.querySelector<HTMLButtonElement>('#btn-health');
    if (healthBtn) {
      this.bindEvent(
        healthBtn,
        'click',
        this.withAction('health', async () => {
          const message = await this.hostClient.health();
          this.presenter.setStatus(`Health: ${message}`);
        })
      );
    }

    const loadContextBtn = document.querySelector<HTMLButtonElement>('#btn-load-context');
    if (loadContextBtn) {
      this.bindEvent(
        loadContextBtn,
        'click',
        this.withAction('load-raw-wml', async () => {
          await this.setViewportCols();
          this.scriptTimerRegistry.reset();
          const snapshot = await this.hostClient.engineLoadDeckContext({
            wmlXml: this.refs.wmlInput.value,
            baseUrl: this.refs.baseUrlInput.value,
            contentType: 'text/vnd.wap.wml'
          });
          this.presenter.setSnapshot(snapshot);
          this.presenter.drawRenderList(await this.hostClient.engineRender());
          this.presenter.patchSessionState({
            navigationStatus: 'loaded',
            requestedUrl: this.refs.baseUrlInput.value,
            finalUrl: this.refs.baseUrlInput.value,
            contentType: 'text/vnd.wap.wml',
            activeCardId: snapshot.activeCardId,
            focusedLinkIndex: snapshot.focusedLinkIndex,
            externalNavigationIntent: snapshot.externalNavigationIntent,
            lastError: undefined
          });
          this.presenter.setStatus('Raw WML loaded and rendered (debug mode).');
        })
      );
    }

    const fetchUrlBtn = document.querySelector<HTMLButtonElement>('#btn-fetch-url');
    if (fetchUrlBtn) {
      this.bindEvent(
        fetchUrlBtn,
        'click',
        this.withAction('fetch-url', async () => {
          await this.loadTransportUrl(this.refs.fetchUrlInput.value, 'user', true, true);
        })
      );
    }

    const reloadBtn = document.querySelector<HTMLButtonElement>('#btn-reload');
    if (reloadBtn) {
      this.bindEvent(
        reloadBtn,
        'click',
        this.withAction('reload', async () => {
          const state = this.presenter.getSessionState();
          const reloadUrl = state.finalUrl ?? state.requestedUrl ?? this.refs.fetchUrlInput.value;
          this.refs.fetchUrlInput.value = reloadUrl;
          await this.loadTransportUrl(reloadUrl, 'user', true, false);
        })
      );
    }

    this.bindEvent(
      this.refs.fetchUrlInput,
      'keydown',
      this.withAction('fetch-url-enter', async (event?: Event) => {
        if (event instanceof KeyboardEvent && event.key === 'Enter') {
          event.preventDefault();
          await this.loadTransportUrl(this.refs.fetchUrlInput.value, 'user', true, true);
        }
      })
    );

    const renderBtn = document.querySelector<HTMLButtonElement>('#btn-render');
    if (renderBtn) {
      this.bindEvent(
        renderBtn,
        'click',
        this.withAction('render', async () => {
          await this.renderAndSnapshot();
          this.presenter.setStatus('Rendered current card.');
        })
      );
    }

    this.bindKeyButton('#btn-up', 'up');
    this.bindKeyButton('#btn-down', 'down');
    this.bindKeyButton('#btn-enter', 'enter');

    const backBtn = document.querySelector<HTMLButtonElement>('#btn-back');
    if (backBtn) {
      this.bindEvent(
        backBtn,
        'click',
        this.withAction('navigate-back', async () => {
          const mode = await this.navigateBackWithFallback();
          if (mode === 'engine') {
            this.presenter.setStatus('navigateBack invoked (engine history).');
          } else if (mode === 'host') {
            this.presenter.setStatus('navigateBack invoked (browser history).');
          } else {
            this.presenter.setStatus('No back history available.');
          }
        })
      );
    }

    const snapshotBtn = document.querySelector<HTMLButtonElement>('#btn-snapshot');
    if (snapshotBtn) {
      this.bindEvent(
        snapshotBtn,
        'click',
        this.withAction('snapshot', async () => {
          await this.renderAndSnapshot();
          this.presenter.setStatus('Snapshot refreshed.');
        })
      );
    }

    const clearIntentBtn = document.querySelector<HTMLButtonElement>('#btn-clear-intent');
    if (clearIntentBtn) {
      this.bindEvent(
        clearIntentBtn,
        'click',
        this.withAction('clear-external-intent', async () => {
          const snapshot = await this.hostClient.engineClearExternalNavigationIntent();
          this.presenter.setSnapshot(snapshot);
          this.presenter.patchSessionState({
            externalNavigationIntent: snapshot.externalNavigationIntent
          });
          this.presenter.setStatus('Cleared external navigation intent.');
        })
      );
    }

    const exportTimelineBtn = document.querySelector<HTMLButtonElement>('#btn-export-timeline');
    if (exportTimelineBtn) {
      this.bindEvent(
        exportTimelineBtn,
        'click',
        this.withAction('export-timeline', async () => {
          if (this.presenter.timelineLength() === 0) {
            throw new Error('No timeline events to export yet.');
          }
          this.presenter.exportTimeline();
          this.presenter.setStatus('Exported timeline JSON.');
        })
      );
    }

    const clearTimelineBtn = document.querySelector<HTMLButtonElement>('#btn-clear-timeline');
    if (clearTimelineBtn) {
      this.bindEvent(
        clearTimelineBtn,
        'click',
        this.withAction('clear-timeline', async () => {
          this.presenter.clearTimeline();
          this.presenter.setStatus('Cleared event timeline.');
        })
      );
    }

    this.bindEvent(window, 'keydown', this.handleWindowKeydown);
    this.listenersBound = true;
  }

  private unbindListeners(): void {
    while (this.listenerCleanup.length > 0) {
      const dispose = this.listenerCleanup.pop();
      dispose?.();
    }
    this.listenersBound = false;
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

  private readonly handleWindowKeydown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    const intent = resolveKeyboardIntent(
      event.key,
      event.ctrlKey,
      event.shiftKey,
      this.isTextEntryTarget(event.target)
    );

    if (intent.type === 'none') {
      return;
    }
    event.preventDefault();

    if (intent.type === 'toggle-dev-tools') {
      this.refs.devDrawerEl.open = !this.refs.devDrawerEl.open;
      this.presenter.setStatus(
        this.refs.devDrawerEl.open ? 'Developer tools opened.' : 'Developer tools hidden.'
      );
      return;
    }

    if (intent.type === 'engine-key') {
      void this.withAction(`keyboard-${intent.key}`, async () => {
        await this.applyEngineKey(intent.key);
        this.presenter.setStatus(`Keyboard: ${intent.key}`);
      })();
      return;
    }

    if (intent.type === 'navigate-back') {
      void this.withAction('keyboard-backspace', async () => {
        const mode = await this.navigateBackWithFallback();
        if (mode === 'engine') {
          this.presenter.setStatus('Keyboard: back (engine history)');
        } else if (mode === 'host') {
          this.presenter.setStatus('Keyboard: back (browser history)');
        } else {
          this.presenter.setStatus('Keyboard: no back history');
        }
      })();
    }
  };

  private async renderAndSnapshot(): Promise<EngineRuntimeSnapshot> {
    const snapshot = await this.hostClient.engineSnapshot();
    this.presenter.setSnapshot(snapshot);
    this.presenter.drawRenderList(await this.hostClient.engineRender());
    return snapshot;
  }

  private async setViewportCols(): Promise<void> {
    const cols = Number(this.refs.viewportColsInput.value);
    if (!Number.isFinite(cols) || cols < 1) {
      throw new Error('viewport cols must be a positive number');
    }
    await this.hostClient.engineSetViewportCols({ cols });
  }

  private withAction =
    (actionName: string, action: (event?: Event) => Promise<void>) =>
    async (event?: Event): Promise<void> => {
      this.presenter.recordTimeline(actionName, 'start');
      try {
        await action(event);
        this.presenter.recordTimeline(actionName, 'ok');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.presenter.patchSessionState({ navigationStatus: 'error', lastError: message });
        this.presenter.setStatus(`Error: ${message}`);
        this.presenter.recordTimeline(actionName, 'error', { message });
      }
    };

  private isTextEntryTarget(target: EventTarget | null): boolean {
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
  }

  private async applyEngineKey(key: EngineKey): Promise<void> {
    const snapshot = await this.navigation.applyEngineKey(key);
    this.applyTimerRequestsFromSnapshot(snapshot);
    if (snapshot.externalNavigationIntent) {
      this.refs.fetchUrlInput.value = snapshot.externalNavigationIntent;
      await this.loadTransportUrl(snapshot.externalNavigationIntent, 'external-intent', true, true);
    }
  }

  private async navigateBackWithFallback(): Promise<'engine' | 'host' | 'none'> {
    const mode = await this.navigation.navigateBackWithFallback();
    const state = this.navigation.getSessionState();
    const resolvedUrl = state.finalUrl ?? state.requestedUrl;
    if (resolvedUrl) {
      this.refs.fetchUrlInput.value = resolvedUrl;
    }
    return mode;
  }

  private async loadTransportUrl(
    url: string,
    source: HostNavigationSource,
    followExternalIntent: boolean,
    pushHistory = true
  ): Promise<EngineRuntimeSnapshot | null> {
    await this.setViewportCols();
    const requestedUrl = url.trim();
    if (source === 'user') {
      this.presenter.setStatus(`Loading ${requestedUrl}...`);
    } else if (source === 'external-intent') {
      this.presenter.setStatus(`Following external intent: ${requestedUrl}`);
    } else {
      this.presenter.setStatus(`Loading previous page: ${requestedUrl}`);
    }

    const snapshot = await this.navigation.loadTransportUrl({
      url: requestedUrl,
      source,
      followExternalIntent,
      pushHistory
    });
    if (snapshot) {
      this.scriptTimerRegistry.reset();
      this.applyTimerRequestsFromSnapshot(snapshot);
    }

    const state = this.navigation.getSessionState();
    if (state.finalUrl) {
      this.refs.fetchUrlInput.value = state.finalUrl;
    }
    if (state.navigationStatus === 'error') {
      this.presenter.setStatus(`Fetch failed: ${state.lastError ?? 'unknown transport failure'}`);
    } else if (state.navigationStatus === 'loaded' && state.finalUrl) {
      this.presenter.setStatus(`Fetched and loaded deck from ${state.finalUrl}`);
    }

    return snapshot;
  }

  private startTimerRuntimeLoop(): void {
    if (this.timerLoopHandle) {
      return;
    }
    this.timerLoopHandle = setInterval(() => {
      void this.tickEngineTimerRuntime();
    }, ENGINE_TIMER_TICK_MS);
  }

  private stopTimerRuntimeLoop(): void {
    if (!this.timerLoopHandle) {
      return;
    }
    clearInterval(this.timerLoopHandle);
    this.timerLoopHandle = null;
  }

  private applyTimerRequestsFromSnapshot(_snapshot: EngineRuntimeSnapshot): void {
    const applied = this.scriptTimerRegistry.applyRequests(_snapshot.lastScriptTimerRequests);
    for (const scheduled of applied.scheduled) {
      this.presenter.recordTimeline('script-timer-schedule', 'state', {
        id: scheduled.id,
        token: scheduled.token,
        delayMs: scheduled.delayMs,
        dueMs: scheduled.dueMs,
        nowMs: this.scriptTimerRegistry.currentTimeMs()
      });
    }
    for (const token of applied.cancelled) {
      this.presenter.recordTimeline('script-timer-cancel', 'state', {
        token,
        nowMs: this.scriptTimerRegistry.currentTimeMs()
      });
    }
  }

  private async tickEngineTimerRuntime(): Promise<void> {
    if (this.timerTickInFlight) {
      return;
    }
    this.timerTickInFlight = true;
    try {
      const before = this.presenter.getSessionState().activeCardId;
      const snapshot = await this.navigation.applyEngineTimerTick(ENGINE_TIMER_TICK_MS);
      this.applyTimerRequestsFromSnapshot(snapshot);
      const expired = this.scriptTimerRegistry.advance(ENGINE_TIMER_TICK_MS);
      for (const timer of expired) {
        this.presenter.recordTimeline('script-timer-expire', 'state', {
          id: timer.id,
          token: timer.token,
          dueMs: timer.dueMs,
          nowMs: this.scriptTimerRegistry.currentTimeMs()
        });
      }
      if (snapshot.externalNavigationIntent) {
        this.refs.fetchUrlInput.value = snapshot.externalNavigationIntent;
        await this.loadTransportUrl(
          snapshot.externalNavigationIntent,
          'external-intent',
          true,
          true
        );
      }
      if (before && snapshot.activeCardId && before !== snapshot.activeCardId) {
        this.presenter.recordTimeline('engine-timer-transition', 'state', {
          from: before,
          to: snapshot.activeCardId
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.presenter.recordTimeline('engine-timer-tick', 'error', { message });
    } finally {
      this.timerTickInFlight = false;
    }
  }

  private async runStartupNetworkProbe(): Promise<void> {
    const targetUrl = this.refs.fetchUrlInput.value.trim();
    if (!targetUrl) {
      return;
    }

    for (let attempt = 1; attempt <= NETWORK_PROBE_MAX_ATTEMPTS; attempt += 1) {
      this.presenter.recordTimeline('startup-network-probe', 'state', {
        attempt,
        targetUrl
      });
      try {
        const probe = await this.hostClient.fetchDeck({
          url: targetUrl,
          method: 'GET',
          timeoutMs: NETWORK_PROBE_TIMEOUT_MS,
          retries: 0
        });
        if (isProbeReachable(probe)) {
          this.presenter.setStatus('Ready. Network available.');
          return;
        }
      } catch {
        // Keep retrying on invocation errors.
      }
      if (attempt < NETWORK_PROBE_MAX_ATTEMPTS) {
        await wait(NETWORK_PROBE_DELAY_MS);
      }
    }

    const message = 'No network available currently. Could not reach WAP server/gateway.';
    this.presenter.patchSessionState({
      navigationStatus: 'error',
      lastError: message
    });
    this.presenter.setStatus(message);
    this.presenter.showToast(message, 'error');
  }

  private bindKeyButton(id: string, key: EngineKey): void {
    const button = document.querySelector<HTMLButtonElement>(id);
    if (!button) {
      return;
    }
    this.bindEvent(
      button,
      'click',
      this.withAction(`handle-key-${key}`, async () => {
        await this.applyEngineKey(key);
        this.presenter.setStatus(`Handled key: ${key}`);
      })
    );
  }
}

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
