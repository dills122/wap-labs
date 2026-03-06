import type { FetchRequestPolicy, HostNavigationSource } from '../../../contracts/transport';
import type { EngineKey, EngineRuntimeSnapshot } from '../../../contracts/engine';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';
import { resolveKeyboardIntent } from './keyboard';
import { isProbeReachable } from './network';
import { createNavigationStateMachine } from './navigation-state';
import { ScriptTimerRegistry } from './script-timer-registry';
import type { BrowserPresenter } from './browser-presenter';
import type { BrowserShellRefs } from './browser-shell-template';
import {
  defaultLocalDeckExample,
  findLocalDeckExample,
  LOCAL_DECK_EXAMPLES,
  type LocalDeckExample
} from './local-examples';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';

type RunMode = 'local' | 'network';

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
  private bootDeckReadyEmitted = false;
  private runMode: RunMode = 'local';
  private activeLocalExampleKey = defaultLocalDeckExample().key;

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
        onRender: (render) => {
          this.presenter.drawRenderList(render);
          if (!this.bootDeckReadyEmitted) {
            this.bootDeckReadyEmitted = true;
            this.presenter.setBootPhase('deck-ready');
            this.presenter.setStatus(WAVES_COPY.status.bootDeckReady);
          }
        },
        onTransportResponse: (response) => this.presenter.setTransportResponse(response),
        onNetworkUnavailable: () => {
          this.presenter.showToast(WAVES_COPY.status.networkUnavailableToast, 'error');
        },
        onStateEvent: (action, details) => {
          this.presenter.recordTimeline(action, 'state', details);
        }
      },
      WAVES_CONFIG.maxExternalIntentHops
    );
  }

  async init(sampleWml: string): Promise<void> {
    this.bootDeckReadyEmitted = false;
    this.refs.wmlInput.value = sampleWml;
    this.presenter.setSessionState({
      runMode: this.runMode,
      navigationStatus: 'idle',
      requestedUrl: this.refs.fetchUrlInput.value
    });
    this.presenter.clearTimeline();
    this.presenter.setBootPhase('shell-ready');
    this.presenter.recordTimeline('bootstrap', 'state', {
      requestedUrl: this.refs.fetchUrlInput.value
    });
    this.presenter.setStatus(WAVES_COPY.status.bootShellReady);

    if (this.listenersBound) {
      this.unbindListeners();
    }
    this.populateLocalExampleOptions();
    this.renderActiveLocalExampleNotes();
    this.bindListeners();
    this.startTimerRuntimeLoop();
    this.presenter.setBootPhase('engine-ready');
    const selectedMode = this.refs.runModeSelectEl.value === 'network' ? 'network' : 'local';
    await this.setRunMode(selectedMode, { loadLocalOnEnter: true });
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
          this.presenter.setStatus(WAVES_COPY.status.health(message));
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
          this.presenter.setStatus(WAVES_COPY.status.rawWmlLoaded);
        })
      );
    }

    const fetchUrlBtn = document.querySelector<HTMLButtonElement>('#btn-fetch-url');
    if (fetchUrlBtn) {
      this.bindEvent(
        fetchUrlBtn,
        'click',
        this.withAction('fetch-url', async () => {
          if (this.runMode === 'local') {
            await this.loadSelectedLocalDeck();
            return;
          }
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
          if (this.runMode === 'local') {
            await this.loadSelectedLocalDeck();
            return;
          }
          const state = this.presenter.getSessionState();
          const reloadUrl = state.finalUrl ?? state.requestedUrl ?? this.refs.fetchUrlInput.value;
          this.refs.fetchUrlInput.value = reloadUrl;
          await this.loadTransportUrl(reloadUrl, 'reload', true, false);
        })
      );
    }

    this.bindEvent(
      this.refs.fetchUrlInput,
      'keydown',
      this.withAction('fetch-url-enter', async (event?: Event) => {
        if (event instanceof KeyboardEvent && event.key === 'Enter') {
          event.preventDefault();
          if (this.runMode === 'local') {
            await this.loadSelectedLocalDeck();
            return;
          }
          await this.loadTransportUrl(this.refs.fetchUrlInput.value, 'user', true, true);
        }
      })
    );

    this.bindEvent(
      this.refs.runModeSelectEl,
      'change',
      this.withAction('change-mode', async () => {
        const nextMode: RunMode =
          this.refs.runModeSelectEl.value === 'network' ? 'network' : 'local';
        await this.setRunMode(nextMode, { loadLocalOnEnter: false });
      })
    );

    this.bindEvent(
      this.refs.localExampleSelectEl,
      'change',
      this.withAction('select-local-example', async () => {
        this.activeLocalExampleKey = this.refs.localExampleSelectEl.value;
        this.renderActiveLocalExampleNotes();
        if (this.runMode === 'local') {
          await this.loadSelectedLocalDeck();
        }
      })
    );

    this.bindEvent(
      this.refs.loadLocalBtnEl,
      'click',
      this.withAction('load-local-example', async () => {
        await this.loadSelectedLocalDeck();
      })
    );

    const renderBtn = document.querySelector<HTMLButtonElement>('#btn-render');
    if (renderBtn) {
      this.bindEvent(
        renderBtn,
        'click',
        this.withAction('render', async () => {
          await this.renderAndSnapshot();
          this.presenter.setStatus(WAVES_COPY.status.renderedCurrentCard);
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
            this.presenter.setStatus(WAVES_COPY.status.navigateBackEngine);
          } else if (mode === 'host') {
            this.presenter.setStatus(WAVES_COPY.status.navigateBackBrowser);
          } else {
            this.presenter.setStatus(WAVES_COPY.status.navigateBackNone);
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
          this.presenter.setStatus(WAVES_COPY.status.snapshotRefreshed);
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
          this.presenter.setStatus(WAVES_COPY.status.clearedExternalIntent);
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
            throw new Error(WAVES_COPY.status.noTimelineToExport);
          }
          this.presenter.exportTimeline();
          this.presenter.setStatus(WAVES_COPY.status.exportedTimeline);
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
          this.presenter.setStatus(WAVES_COPY.status.clearedTimeline);
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

  private populateLocalExampleOptions(): void {
    this.refs.localExampleSelectEl.replaceChildren();
    for (const example of LOCAL_DECK_EXAMPLES) {
      const option = document.createElement('option');
      option.value = example.key;
      option.textContent = example.label;
      this.refs.localExampleSelectEl.append(option);
    }
    const fallback = defaultLocalDeckExample();
    const active = findLocalDeckExample(this.activeLocalExampleKey) ?? fallback;
    this.activeLocalExampleKey = active.key;
    this.refs.localExampleSelectEl.value = active.key;
  }

  private applyModeUiState(): void {
    const localMode = this.runMode === 'local';
    this.refs.fetchUrlInput.disabled = localMode;
    this.refs.fetchUrlInput.setAttribute('aria-disabled', localMode ? 'true' : 'false');
    const fetchButton = document.querySelector<HTMLButtonElement>('#btn-fetch-url');
    if (fetchButton) {
      fetchButton.disabled = localMode;
      fetchButton.setAttribute('aria-disabled', localMode ? 'true' : 'false');
    }
    this.refs.loadLocalBtnEl.disabled = !localMode;
    this.refs.localExampleSelectEl.disabled = !localMode;
    this.refs.localExampleWrapEl.style.opacity = localMode ? '1' : '0.72';
    this.refs.localExampleNotesEl.style.display = localMode ? 'block' : 'none';
    if (!localMode) {
      this.refs.localExampleNotesEl.open = false;
    }
  }

  private async setRunMode(mode: RunMode, options: { loadLocalOnEnter: boolean }): Promise<void> {
    this.runMode = mode;
    this.refs.runModeSelectEl.value = mode;
    this.applyModeUiState();
    this.presenter.patchSessionState({ runMode: mode });
    if (mode === 'local') {
      this.presenter.setStatus(WAVES_COPY.status.localModeEnabled);
      if (options.loadLocalOnEnter || !this.presenter.hasRenderedDeck()) {
        await this.loadSelectedLocalDeck();
      }
      return;
    }

    this.presenter.setStatus(WAVES_COPY.status.networkModeEnabled);
    await this.runStartupNetworkProbe();
  }

  private async loadSelectedLocalDeck(): Promise<void> {
    const selected = this.refs.localExampleSelectEl.value || this.activeLocalExampleKey;
    const example = findLocalDeckExample(selected);
    if (!example) {
      throw new Error(`Unknown local example key: ${selected}`);
    }
    this.activeLocalExampleKey = example.key;
    this.renderLocalExampleNotes(example);
    await this.loadLocalDeck(example);
  }

  private renderActiveLocalExampleNotes(): void {
    const fallback = defaultLocalDeckExample();
    const active = findLocalDeckExample(this.activeLocalExampleKey) ?? fallback;
    this.activeLocalExampleKey = active.key;
    this.renderLocalExampleNotes(active);
  }

  private renderLocalExampleNotes(example: LocalDeckExample): void {
    const coverage = [...example.workItems, ...example.specItems];
    this.refs.localExampleCoverageEl.textContent =
      coverage.length > 0
        ? `${WAVES_COPY.shell.localExampleCoverage} ${coverage.join(', ')}`
        : `${WAVES_COPY.shell.localExampleCoverage} (none)`;
    this.refs.localExampleDescriptionEl.textContent = `${WAVES_COPY.shell.localExampleDescription} ${example.description}`;
    this.refs.localExampleGoalEl.textContent = `${WAVES_COPY.shell.localExampleGoal} ${example.goal}`;

    this.refs.localExampleTestingAcEl.replaceChildren();
    for (const item of example.testingAc) {
      const li = document.createElement('li');
      li.textContent = item;
      this.refs.localExampleTestingAcEl.append(li);
    }
  }

  private async loadLocalDeck(example: LocalDeckExample): Promise<void> {
    await this.setViewportCols();
    const needsFirstRenderSkeleton = !this.presenter.hasRenderedDeck();
    if (needsFirstRenderSkeleton) {
      this.presenter.setViewportSkeleton(true);
    }

    try {
      this.presenter.setStatus(WAVES_COPY.status.loading(example.baseUrl));
      const snapshot = await this.hostClient.engineLoadDeckContext({
        wmlXml: example.wml,
        baseUrl: example.baseUrl,
        contentType: 'text/vnd.wap.wml'
      });
      this.presenter.setSnapshot(snapshot);
      this.presenter.drawRenderList(await this.hostClient.engineRender());
      if (!this.bootDeckReadyEmitted) {
        this.bootDeckReadyEmitted = true;
        this.presenter.setBootPhase('deck-ready');
      }
      this.presenter.setTransportResponse(null);
      this.refs.fetchUrlInput.value = example.baseUrl;
      this.presenter.patchSessionState({
        runMode: this.runMode,
        navigationStatus: 'loaded',
        requestedUrl: example.baseUrl,
        finalUrl: example.baseUrl,
        contentType: 'text/vnd.wap.wml',
        activeCardId: snapshot.activeCardId,
        focusedLinkIndex: snapshot.focusedLinkIndex,
        externalNavigationIntent: snapshot.externalNavigationIntent,
        navigationSource: 'user',
        lastError: undefined
      });
      this.scriptTimerRegistry.reset();
      this.applyTimerRequestsFromSnapshot(snapshot);
      this.presenter.setStatus(WAVES_COPY.status.loadedLocalDeck(example.label));
    } finally {
      if (needsFirstRenderSkeleton && !this.presenter.hasRenderedDeck()) {
        this.presenter.setViewportSkeleton(false);
      }
    }
  }

  private async handleExternalIntentInLocalMode(intentUrl: string): Promise<void> {
    this.refs.fetchUrlInput.value = intentUrl;
    this.presenter.patchSessionState({ externalNavigationIntent: intentUrl });
    this.presenter.setStatus(WAVES_COPY.status.localExternalIntentCaptured(intentUrl));
  }

  private syncLocalSessionFromSnapshot(snapshot: EngineRuntimeSnapshot): void {
    const resolvedUrl = snapshot.baseUrl || this.refs.fetchUrlInput.value;
    this.presenter.patchSessionState({
      runMode: this.runMode,
      navigationStatus: 'loaded',
      requestedUrl: resolvedUrl,
      finalUrl: resolvedUrl,
      contentType: snapshot.contentType,
      activeCardId: snapshot.activeCardId,
      focusedLinkIndex: snapshot.focusedLinkIndex,
      externalNavigationIntent: snapshot.externalNavigationIntent,
      navigationSource: 'user',
      lastError: undefined
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
        this.refs.devDrawerEl.open
          ? WAVES_COPY.status.developerToolsOpened
          : WAVES_COPY.status.developerToolsHidden
      );
      return;
    }

    if (intent.type === 'engine-key') {
      void this.withAction(`keyboard-${intent.key}`, async () => {
        await this.applyEngineKey(intent.key);
        this.presenter.setStatus(WAVES_COPY.status.keyboard(intent.key));
      })();
      return;
    }

    if (intent.type === 'navigate-back') {
      void this.withAction('keyboard-backspace', async () => {
        const mode = await this.navigateBackWithFallback();
        if (mode === 'engine') {
          this.presenter.setStatus(WAVES_COPY.status.keyboardBackEngine);
        } else if (mode === 'host') {
          this.presenter.setStatus(WAVES_COPY.status.keyboardBackBrowser);
        } else {
          this.presenter.setStatus(WAVES_COPY.status.keyboardBackNone);
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
      throw new Error(WAVES_COPY.errors.viewportColsPositive);
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
        this.presenter.setStatus(WAVES_COPY.status.error(message));
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
    const snapshot =
      this.runMode === 'local'
        ? await this.hostClient.engineHandleKey({ key })
        : await this.navigation.applyEngineKey(key);
    if (this.runMode === 'local') {
      this.presenter.setSnapshot(snapshot);
      this.presenter.drawRenderList(await this.hostClient.engineRender());
      this.syncLocalSessionFromSnapshot(snapshot);
    }
    this.applyTimerRequestsFromSnapshot(snapshot);
    if (snapshot.externalNavigationIntent) {
      if (this.runMode === 'local') {
        await this.handleExternalIntentInLocalMode(snapshot.externalNavigationIntent);
      } else {
        this.refs.fetchUrlInput.value = snapshot.externalNavigationIntent;
        await this.loadTransportUrl(
          snapshot.externalNavigationIntent,
          'external-intent',
          true,
          true,
          snapshot.externalNavigationRequestPolicy
        );
      }
    }
  }

  private async navigateBackWithFallback(): Promise<'engine' | 'host' | 'none'> {
    if (this.runMode === 'local') {
      const before = await this.hostClient.engineSnapshot();
      const after = await this.hostClient.engineNavigateBack();
      this.presenter.setSnapshot(after);
      this.presenter.drawRenderList(await this.hostClient.engineRender());
      this.syncLocalSessionFromSnapshot(after);
      const engineHandled =
        before.activeCardId !== after.activeCardId ||
        before.focusedLinkIndex !== after.focusedLinkIndex;
      return engineHandled ? 'engine' : 'none';
    }

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
    pushHistory = true,
    requestPolicy?: FetchRequestPolicy
  ): Promise<EngineRuntimeSnapshot | null> {
    if (this.runMode === 'local') {
      await this.loadSelectedLocalDeck();
      return null;
    }
    await this.setViewportCols();
    const requestedUrl = url.trim();
    const needsFirstRenderSkeleton = !this.presenter.hasRenderedDeck();
    if (needsFirstRenderSkeleton) {
      this.presenter.setViewportSkeleton(true);
    }
    if (source === 'user') {
      this.presenter.setStatus(WAVES_COPY.status.loading(requestedUrl));
    } else if (source === 'external-intent') {
      this.presenter.setStatus(WAVES_COPY.status.followingExternalIntent(requestedUrl));
    } else {
      this.presenter.setStatus(WAVES_COPY.status.loadingPreviousPage(requestedUrl));
    }

    try {
      const snapshot = await this.navigation.loadTransportUrl({
        url: requestedUrl,
        source,
        followExternalIntent,
        pushHistory,
        requestPolicy
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
        this.presenter.setStatus(
          WAVES_COPY.status.fetchFailed(
            state.lastError ?? WAVES_COPY.errors.unknownTransportFailure
          )
        );
      } else if (state.navigationStatus === 'loaded' && state.finalUrl) {
        this.presenter.setStatus(WAVES_COPY.status.fetchedAndLoadedDeck(state.finalUrl));
      }

      return snapshot;
    } finally {
      if (needsFirstRenderSkeleton && !this.presenter.hasRenderedDeck()) {
        this.presenter.setViewportSkeleton(false);
      }
    }
  }

  private startTimerRuntimeLoop(): void {
    if (this.timerLoopHandle) {
      return;
    }
    this.timerLoopHandle = setInterval(() => {
      void this.tickEngineTimerRuntime();
    }, WAVES_CONFIG.engineTimerTickMs);
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
      const snapshot =
        this.runMode === 'local'
          ? await this.hostClient.engineAdvanceTimeMs({ deltaMs: WAVES_CONFIG.engineTimerTickMs })
          : await this.navigation.applyEngineTimerTick(WAVES_CONFIG.engineTimerTickMs);
      if (this.runMode === 'local') {
        this.presenter.setSnapshot(snapshot);
        this.presenter.drawRenderList(await this.hostClient.engineRender());
        this.syncLocalSessionFromSnapshot(snapshot);
      }
      this.applyTimerRequestsFromSnapshot(snapshot);
      const expired = this.scriptTimerRegistry.advance(WAVES_CONFIG.engineTimerTickMs);
      for (const timer of expired) {
        this.presenter.recordTimeline('script-timer-expire', 'state', {
          id: timer.id,
          token: timer.token,
          dueMs: timer.dueMs,
          nowMs: this.scriptTimerRegistry.currentTimeMs()
        });
      }
      if (snapshot.externalNavigationIntent) {
        if (this.runMode === 'local') {
          await this.handleExternalIntentInLocalMode(snapshot.externalNavigationIntent);
        } else {
          this.refs.fetchUrlInput.value = snapshot.externalNavigationIntent;
          await this.loadTransportUrl(
            snapshot.externalNavigationIntent,
            'external-intent',
            true,
            true,
            snapshot.externalNavigationRequestPolicy
          );
        }
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

    for (let attempt = 1; attempt <= WAVES_CONFIG.networkProbeMaxAttempts; attempt += 1) {
      this.presenter.recordTimeline('startup-network-probe', 'state', {
        attempt,
        targetUrl
      });
      try {
        const probe = await this.hostClient.fetchDeck({
          url: targetUrl,
          method: 'GET',
          timeoutMs: WAVES_CONFIG.networkProbeTimeoutMs,
          retries: 0,
          requestPolicy: { uaCapabilityProfile: WAVES_CONFIG.transportUaCapabilityProfile }
        });
        if (isProbeReachable(probe)) {
          this.presenter.setStatus(WAVES_COPY.status.readyNetwork);
          return;
        }
      } catch {
        // Keep retrying on invocation errors.
      }
      if (attempt < WAVES_CONFIG.networkProbeMaxAttempts) {
        await wait(WAVES_CONFIG.networkProbeDelayMs);
      }
    }

    const message = WAVES_COPY.status.networkUnavailable;
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
        this.presenter.setStatus(WAVES_COPY.status.handledKey(key));
      })
    );
  }
}

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
