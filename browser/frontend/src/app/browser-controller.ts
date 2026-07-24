import type {
  FetchRequestPolicy,
  HostNavigationSource,
  HostSessionState
} from '../../../contracts/transport';
import type { EngineFrame, EngineKey, EngineRuntimeSnapshot } from '../../../contracts/engine';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';
import { EngineTimerRuntime } from './engine-timer-runtime';
import { FocusedControlEditController } from './focused-control-edit';
import { createNavigationStateMachine, type NavigationErrorKind } from './navigation-state';
import { canHistoryBack } from '../session-history';
import { StartupNetworkProbeController } from './startup-network-probe';
import { KeyboardIntentRouter } from './keyboard-intent-router';
import { ShellEventBindings } from './shell-event-bindings';
import { defaultStartUrl } from './defaults';
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

const WAP_ACCEPT_HEADER = 'text/vnd.wap.wml, application/vnd.wap.wmlc, application/vnd.wap.wml+xml';

export class BrowserController {
  private readonly hostClient: TauriHostClient;

  private readonly presenter: BrowserPresenter;

  private readonly refs: BrowserShellRefs;

  private readonly navigation: ReturnType<typeof createNavigationStateMachine>;
  private readonly startupProbe: StartupNetworkProbeController;
  private readonly timerRuntime: EngineTimerRuntime;
  private readonly focusedControlEdit: FocusedControlEditController;
  // M1-08 residual: DOM listener wiring and keyboard-intent routing/queueing
  // were split out of this controller into their own boundary modules (see
  // shell-event-bindings.ts and keyboard-intent-router.ts). BrowserController
  // still owns run-mode orchestration and transport-URL loading directly, and
  // supplies the action bodies the two extracted modules call back into.
  private readonly shellEventBindings: ShellEventBindings;
  private readonly keyboardIntentRouter: KeyboardIntentRouter;

  private bootDeckReadyEmitted = false;
  private runMode: RunMode = 'local';
  private activeLocalExampleKey = defaultLocalDeckExample().key;
  private lastNetworkUrl: string;
  // U2: set by the navigation state machine's onNavigationError hook just
  // before loadTransportUrl below reads state.navigationStatus === 'error',
  // so the status text can be worded distinctly for a network-layer failure
  // vs. a deck that fetched fine but didn't parse into usable WML.
  private lastNavigationErrorKind: NavigationErrorKind = 'network';
  // U3: back-button availability tracking. Network mode has an exact answer
  // (host history array); local mode has no engine-exposed "nav stack depth"
  // to query without attempting a (destructive) back navigation, so this is
  // maintained as a frontend-side approximation: reset false on every fresh
  // engine deck load (which always clears the engine's nav stack) and set
  // true whenever a forward card change is observed while in local mode.
  private localBackAvailable = false;

  constructor(hostClient: TauriHostClient, presenter: BrowserPresenter, refs: BrowserShellRefs) {
    this.hostClient = hostClient;
    this.presenter = presenter;
    this.refs = refs;
    this.lastNetworkUrl = refs.fetchUrlInput.value.trim() || defaultStartUrl();
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
        onNavigationError: (message, kind) => {
          this.lastNavigationErrorKind = kind;
          this.presenter.showToast(
            kind === 'parse'
              ? WAVES_COPY.status.deckParseFailed(message)
              : WAVES_COPY.status.fetchFailed(message),
            'error'
          );
        },
        onStateEvent: (action, details) => {
          this.presenter.recordTimeline(action, 'state', details);
          if (action === 'engine-load-deck-context') {
            // Every engineLoadDeckContextFrame call (local or network)
            // clears the engine's nav stack; keep the local back-availability
            // approximation in sync so it doesn't go stale across a mode
            // switch (see U3).
            this.localBackAvailable = false;
            this.updateBackButtonAvailability();
          }
        }
      },
      WAVES_CONFIG.maxExternalIntentHops
    );
    this.startupProbe = new StartupNetworkProbeController({
      fetchDeck: (request) => this.hostClient.fetchDeck(request),
      getTargetUrl: () => this.refs.fetchUrlInput.value,
      getRunMode: () => this.runMode,
      setLastNetworkUrl: (url) => {
        this.lastNetworkUrl = url;
      },
      recordTimeline: (action, details) => this.presenter.recordTimeline(action, 'state', details),
      setStatus: (message) => this.presenter.setStatus(message),
      patchSessionState: (patch) => this.presenter.patchSessionState(patch),
      showToast: (message, tone) => this.presenter.showToast(message, tone),
      createHeaders: () => this.defaultNavigationHeaders(),
      wait
    });
    this.timerRuntime = new EngineTimerRuntime({
      canTick: () => !this.keyboardIntentRouter.isActionInFlight(),
      getRunMode: () => this.runMode,
      advanceLocal: (deltaMs) => this.hostClient.engineAdvanceTimeMs({ deltaMs }),
      advanceNetwork: (deltaMs) => this.navigation.applyEngineTimerTick(deltaMs),
      getSessionState: () => this.presenter.getSessionState(),
      renderLocalSnapshot: async (snapshot) => {
        const previousActiveCardId = this.presenter.getSessionState().activeCardId;
        this.applyFrame(await this.hostClient.engineRenderFrame(), snapshot);
        this.syncLocalSessionFromSnapshot(snapshot);
        this.noteLocalForwardNavigation(previousActiveCardId, snapshot.activeCardId);
      },
      handleExternalIntent: async (intentUrl, snapshot) => {
        if (this.runMode === 'local') {
          await this.handleExternalIntentInLocalMode(intentUrl);
          return;
        }
        this.refs.fetchUrlInput.value = intentUrl;
        await this.loadTransportUrl(
          intentUrl,
          'external-intent',
          true,
          true,
          snapshot.externalNavigationRequestPolicy,
          this.defaultNavigationHeaders()
        );
      },
      recordTimeline: (action, phase, details) =>
        this.presenter.recordTimeline(action, phase, details)
    });
    this.focusedControlEdit = new FocusedControlEditController({
      getSnapshot: () => this.presenter.getSnapshot(),
      loadSnapshot: () => this.hostClient.engineSnapshot(),
      syncSnapshot: (snapshot) => this.syncInteractiveSnapshot(snapshot),
      recordTimeline: (action, details) => this.presenter.recordTimeline(action, 'state', details),
      applyFrame: (frame) => this.applyFrame(frame),
      beginFocusedInputEdit: () => this.hostClient.engineBeginFocusedInputEditFrame(),
      setFocusedInputEditDraft: (value) =>
        this.hostClient.engineSetFocusedInputEditDraftFrame({ value }),
      commitFocusedInputEdit: () => this.hostClient.engineCommitFocusedInputEditFrame(),
      cancelFocusedInputEdit: () => this.hostClient.engineCancelFocusedInputEditFrame(),
      beginFocusedSelectEdit: () => this.hostClient.engineBeginFocusedSelectEditFrame(),
      moveFocusedSelectEdit: (delta) => this.hostClient.engineMoveFocusedSelectEditFrame({ delta }),
      commitFocusedSelectEdit: () => this.hostClient.engineCommitFocusedSelectEditFrame(),
      cancelFocusedSelectEdit: () => this.hostClient.engineCancelFocusedSelectEditFrame()
    });
    this.keyboardIntentRouter = new KeyboardIntentRouter({
      runAction: this.withAction,
      toggleDeveloperTools: () => {
        this.refs.devDrawerEl.open = !this.refs.devDrawerEl.open;
        return this.refs.devDrawerEl.open;
      },
      applyFocusedControlEditKey: (key) => this.focusedControlEdit.applyKey(key),
      applyEngineKey: (key) => this.applyEngineKey(key),
      navigateBackWithFallback: () => this.navigateBackWithFallback(),
      setStatus: (message) => this.presenter.setStatus(message)
    });
    this.shellEventBindings = new ShellEventBindings({
      refs: this.refs,
      runAction: this.withAction,
      onWindowKeydown: this.keyboardIntentRouter.handleWindowKeydown,
      actions: {
        health: this.handleHealthClick,
        loadRawWml: this.handleLoadRawWmlClick,
        fetchUrl: this.handleFetchUrlClick,
        fetchUrlEnter: this.handleFetchUrlClick,
        reload: this.handleReloadClick,
        changeMode: this.handleChangeModeClick,
        selectLocalExample: this.handleSelectLocalExampleClick,
        loadLocalExample: this.handleLoadLocalExampleClick,
        render: this.handleRenderClick,
        navigateBack: this.handleNavigateBackClick,
        snapshot: this.handleSnapshotClick,
        clearExternalIntent: this.handleClearExternalIntentClick,
        exportTimeline: this.handleExportTimelineClick,
        clearTimeline: this.handleClearTimelineClick,
        handleKey: this.handleKeyButtonPress
      }
    });
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

    this.populateLocalExampleOptions();
    this.renderActiveLocalExampleNotes();
    this.shellEventBindings.bind();
    this.timerRuntime.start();
    this.presenter.setBootPhase('engine-ready');
    const selectedMode = this.refs.runModeSelectEl.value === 'network' ? 'network' : 'local';
    await this.setRunMode(selectedMode, { loadLocalOnEnter: true });
  }

  dispose(): void {
    this.startupProbe.cancel();
    this.timerRuntime.stop();
    this.shellEventBindings.unbind();
    this.presenter.dispose();
  }

  // -- Shell click/keyboard action handlers ---------------------------------
  // The bodies below are the action implementations wired up to DOM events by
  // ShellEventBindings (see the `actions` object passed to it above). Kept as
  // bound arrow properties so they can be handed off by reference while still
  // resolving `this` correctly.

  private readonly handleHealthClick = async (): Promise<void> => {
    const message = await this.hostClient.health();
    this.presenter.setStatus(WAVES_COPY.status.health(message));
  };

  private readonly handleLoadRawWmlClick = async (): Promise<void> => {
    await this.setViewportCols();
    this.timerRuntime.resetScriptTimers();
    const frame = await this.hostClient.engineLoadDeckContextFrame({
      wmlXml: this.refs.wmlInput.value,
      baseUrl: this.refs.baseUrlInput.value,
      contentType: 'text/vnd.wap.wml'
    });
    const snapshot = frame.snapshot;
    this.applyFrame(frame);
    // This always loads directly through the engine, clearing its nav
    // stack regardless of which mode is active (see U3).
    this.localBackAvailable = false;
    this.updateBackButtonAvailability();
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
  };

  private readonly handleFetchUrlClick = async (): Promise<void> => {
    if (this.runMode === 'local') {
      await this.loadSelectedLocalDeck();
      return;
    }
    await this.loadTransportUrl(
      this.refs.fetchUrlInput.value,
      'user',
      true,
      true,
      undefined,
      this.defaultNavigationHeaders()
    );
  };

  private readonly handleReloadClick = async (): Promise<void> => {
    if (this.runMode === 'local') {
      await this.loadSelectedLocalDeck();
      return;
    }
    const state = this.presenter.getSessionState();
    const reloadUrl = state.finalUrl ?? state.requestedUrl ?? this.refs.fetchUrlInput.value;
    this.refs.fetchUrlInput.value = reloadUrl;
    await this.loadTransportUrl(
      reloadUrl,
      'reload',
      true,
      false,
      undefined,
      this.defaultNavigationHeaders()
    );
  };

  private readonly handleChangeModeClick = async (): Promise<void> => {
    const nextMode: RunMode = this.refs.runModeSelectEl.value === 'network' ? 'network' : 'local';
    await this.setRunMode(nextMode, { loadLocalOnEnter: false });
  };

  private readonly handleSelectLocalExampleClick = async (): Promise<void> => {
    this.activeLocalExampleKey = this.refs.localExampleSelectEl.value;
    this.renderActiveLocalExampleNotes();
    if (this.runMode === 'local') {
      await this.loadSelectedLocalDeck();
    }
  };

  private readonly handleLoadLocalExampleClick = async (): Promise<void> => {
    await this.loadSelectedLocalDeck();
  };

  private readonly handleRenderClick = async (): Promise<void> => {
    await this.renderAndSnapshot();
    this.presenter.setStatus(WAVES_COPY.status.renderedCurrentCard);
  };

  private readonly handleNavigateBackClick = async (): Promise<void> => {
    const mode = await this.navigateBackWithFallback();
    if (mode === 'engine') {
      this.presenter.setStatus(WAVES_COPY.status.navigateBackEngine);
    } else if (mode === 'host') {
      this.presenter.setStatus(WAVES_COPY.status.navigateBackBrowser);
    } else {
      this.presenter.setStatus(WAVES_COPY.status.navigateBackNone);
    }
  };

  private readonly handleSnapshotClick = async (): Promise<void> => {
    await this.renderAndSnapshot();
    this.presenter.setStatus(WAVES_COPY.status.snapshotRefreshed);
  };

  private readonly handleClearExternalIntentClick = async (): Promise<void> => {
    const snapshot = await this.hostClient.engineClearExternalNavigationIntent();
    this.presenter.setSnapshot(snapshot);
    this.presenter.patchSessionState({
      externalNavigationIntent: snapshot.externalNavigationIntent
    });
    this.presenter.setStatus(WAVES_COPY.status.clearedExternalIntent);
  };

  private readonly handleExportTimelineClick = async (): Promise<void> => {
    if (this.presenter.timelineLength() === 0) {
      throw new Error(WAVES_COPY.status.noTimelineToExport);
    }
    this.presenter.exportTimeline();
    this.presenter.setStatus(WAVES_COPY.status.exportedTimeline);
  };

  private readonly handleClearTimelineClick = async (): Promise<void> => {
    this.presenter.clearTimeline();
    this.presenter.setStatus(WAVES_COPY.status.clearedTimeline);
  };

  private readonly handleKeyButtonPress = async (key: EngineKey): Promise<void> => {
    await this.applyEngineKey(key);
    this.presenter.setStatus(WAVES_COPY.status.handledKey(key));
  };

  // ---------------------------------------------------------------------

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

  // U3: toggles disabled/aria-disabled on #btn-back to match Chrome/Firefox's
  // "dim the back button at the start of history" convention, instead of
  // requiring a click + status-message read to discover there's nowhere to
  // go back to.
  private updateBackButtonAvailability(): void {
    const available =
      this.runMode === 'local'
        ? this.localBackAvailable
        : canHistoryBack(this.navigation.getHistoryState());
    this.shellEventBindings.setBackButtonAvailable(available);
  }

  // See localBackAvailable above: a forward card change while in local mode
  // means the engine's nav stack just grew, so back becomes available.
  private noteLocalForwardNavigation(
    previousCardId: string | undefined,
    nextCardId: string | undefined
  ): void {
    if (this.runMode !== 'local' || previousCardId === nextCardId) {
      return;
    }
    this.localBackAvailable = true;
    this.updateBackButtonAvailability();
  }

  private async setRunMode(mode: RunMode, options: { loadLocalOnEnter: boolean }): Promise<void> {
    this.startupProbe.cancel();
    this.navigation.cancelPendingNavigation();
    this.runMode = mode;
    this.refs.runModeSelectEl.value = mode;
    this.applyModeUiState();
    this.presenter.patchSessionState({ runMode: mode });
    if (mode === 'local') {
      this.presenter.setStatus(WAVES_COPY.status.localModeEnabled);
      if (options.loadLocalOnEnter || !this.presenter.hasRenderedDeck()) {
        await this.loadSelectedLocalDeck();
      }
      this.updateBackButtonAvailability();
      return;
    }

    this.presenter.setStatus(WAVES_COPY.status.networkModeEnabled);
    this.refs.fetchUrlInput.value = this.lastNetworkUrl || defaultStartUrl();
    this.startupProbe.start();
    this.updateBackButtonAvailability();
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
    const endNavigationProgress = this.presenter.beginNavigationProgress();

    try {
      this.presenter.setStatus(WAVES_COPY.status.loading(example.baseUrl));
      const frame = await this.hostClient.engineLoadDeckContextFrame({
        wmlXml: example.wml,
        baseUrl: example.baseUrl,
        contentType: 'text/vnd.wap.wml'
      });
      const snapshot = frame.snapshot;
      this.applyFrame(frame);
      // A fresh deck load always clears the engine's nav stack (see U3).
      this.localBackAvailable = false;
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
      this.timerRuntime.resetScriptTimers();
      this.timerRuntime.applySnapshot(snapshot);
      this.presenter.setStatus(WAVES_COPY.status.loadedLocalDeck(example.label));
    } finally {
      endNavigationProgress();
      this.updateBackButtonAvailability();
    }
  }

  private async handleExternalIntentInLocalMode(intentUrl: string): Promise<void> {
    this.refs.fetchUrlInput.value = intentUrl;
    this.presenter.patchSessionState({ externalNavigationIntent: intentUrl });
    this.presenter.setStatus(WAVES_COPY.status.localExternalIntentCaptured(intentUrl));
  }

  private syncLocalSessionFromSnapshot(snapshot: EngineRuntimeSnapshot): void {
    this.syncLocalSessionFromSnapshotWithOptions(snapshot, true);
  }

  private syncLocalSessionFromSnapshotWithOptions(
    snapshot: EngineRuntimeSnapshot,
    recordTimeline: boolean
  ): void {
    const resolvedUrl = snapshot.baseUrl || this.refs.fetchUrlInput.value;
    const patch: Partial<HostSessionState> = {
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
    };
    if (recordTimeline) {
      this.presenter.patchSessionState(patch);
      return;
    }
    this.presenter.setSessionState({
      ...this.presenter.getSessionState(),
      ...patch
    });
  }

  private syncInteractiveSnapshot(snapshot: EngineRuntimeSnapshot): void {
    if (this.runMode === 'local') {
      this.syncLocalSessionFromSnapshotWithOptions(snapshot, false);
      return;
    }
    const patch: Partial<HostSessionState> = {
      activeCardId: snapshot.activeCardId,
      focusedLinkIndex: snapshot.focusedLinkIndex,
      externalNavigationIntent: snapshot.externalNavigationIntent,
      lastError: undefined
    };
    this.presenter.setSessionState({
      ...this.presenter.getSessionState(),
      ...patch
    });
  }

  private async renderAndSnapshot(): Promise<EngineRuntimeSnapshot> {
    const frame = await this.hostClient.engineRenderFrame();
    this.applyFrame(frame);
    return frame.snapshot;
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

  private async applyEngineKey(key: EngineKey): Promise<void> {
    const previousActiveCardId = this.presenter.getSessionState().activeCardId;
    const localFrame =
      this.runMode === 'local' ? await this.hostClient.engineHandleKeyFrame({ key }) : null;
    const snapshot = localFrame ? localFrame.snapshot : await this.navigation.applyEngineKey(key);
    if (this.runMode === 'local' && localFrame) {
      this.applyFrame(localFrame, snapshot);
      this.syncLocalSessionFromSnapshot(snapshot);
      this.noteLocalForwardNavigation(previousActiveCardId, snapshot.activeCardId);
    }
    this.timerRuntime.applySnapshot(snapshot);
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
          snapshot.externalNavigationRequestPolicy,
          this.defaultNavigationHeaders()
        );
      }
    }
  }

  private async navigateBackWithFallback(): Promise<'engine' | 'host' | 'none'> {
    const endNavigationProgress = this.presenter.beginNavigationProgress();
    try {
      if (this.runMode === 'local') {
        const before = {
          activeCardId: this.presenter.getSessionState().activeCardId,
          focusedLinkIndex: this.presenter.getSessionState().focusedLinkIndex ?? 0
        };
        const frame = await this.hostClient.engineNavigateBackFrame();
        const after = frame.snapshot;
        const engineHandled =
          before.activeCardId !== after.activeCardId ||
          before.focusedLinkIndex !== after.focusedLinkIndex;
        if (!engineHandled) {
          // Definitive ground truth: the engine's nav stack was already empty.
          this.localBackAvailable = false;
          return 'none';
        }
        this.applyFrame(frame);
        this.syncLocalSessionFromSnapshot(after);
        return 'engine';
      }

      const mode = await this.navigation.navigateBackWithFallback();
      const state = this.navigation.getSessionState();
      const resolvedUrl = state.finalUrl ?? state.requestedUrl;
      if (resolvedUrl) {
        this.refs.fetchUrlInput.value = resolvedUrl;
      }
      return mode;
    } finally {
      endNavigationProgress();
      this.updateBackButtonAvailability();
    }
  }

  private async loadTransportUrl(
    url: string,
    source: HostNavigationSource,
    followExternalIntent: boolean,
    pushHistory = true,
    requestPolicy?: FetchRequestPolicy,
    headers?: Record<string, string>
  ): Promise<EngineRuntimeSnapshot | null> {
    if (this.runMode === 'local') {
      await this.loadSelectedLocalDeck();
      return null;
    }
    await this.setViewportCols();
    const requestedUrl = url.trim();
    const endNavigationProgress = this.presenter.beginNavigationProgress();
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
        requestPolicy,
        headers
      });
      if (snapshot) {
        this.timerRuntime.resetScriptTimers();
        this.timerRuntime.applySnapshot(snapshot);
      }

      const state = this.navigation.getSessionState();
      if (state.finalUrl) {
        this.lastNetworkUrl = state.finalUrl;
        this.refs.fetchUrlInput.value = state.finalUrl;
      } else if (requestedUrl) {
        this.lastNetworkUrl = requestedUrl;
      }
      if (state.navigationStatus === 'error') {
        const message = state.lastError ?? WAVES_COPY.errors.unknownTransportFailure;
        this.presenter.setStatus(
          this.lastNavigationErrorKind === 'parse'
            ? WAVES_COPY.status.deckParseFailed(message)
            : WAVES_COPY.status.fetchFailed(message)
        );
      } else if (state.navigationStatus === 'loaded' && state.finalUrl) {
        this.presenter.setStatus(WAVES_COPY.status.fetchedAndLoadedDeck(state.finalUrl));
        if (source === 'user' || source === 'reload') {
          this.refs.viewportEl.focus();
        }
      }

      return snapshot;
    } finally {
      endNavigationProgress();
      this.updateBackButtonAvailability();
    }
  }

  private async tickEngineTimerRuntime(): Promise<void> {
    await this.timerRuntime.tick();
  }

  private defaultNavigationHeaders(): Record<string, string> {
    return {
      Accept: WAP_ACCEPT_HEADER
    };
  }

  private applyFrame(frame: EngineFrame, snapshot = frame.snapshot): void {
    this.presenter.setSnapshot(snapshot);
    this.presenter.drawRenderList(frame.render);
  }
}

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
