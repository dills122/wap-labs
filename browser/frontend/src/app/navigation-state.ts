import type {
  FetchRequestPolicy,
  FetchRequest,
  FetchResponse,
  HostNavigationSource,
  HostSessionState
} from '../../../contracts/transport';
import type {
  AdvanceTimeRequest,
  DeckNavigationKind,
  EngineFrame,
  EngineRuntimeSnapshot,
  HandleKeyRequest,
  LoadDeckContextRequest,
  NavigateToCardRequest,
  RenderList
} from '../../../contracts/engine';
import {
  canHistoryBack,
  commitHistoryBack,
  createHostHistoryState,
  peekHistoryBack,
  pushHostHistoryEntry,
  resetHostHistoryState,
  updateCurrentHistoryCard,
  type HostHistoryState
} from '../session-history';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';

export type BackNavigationMode = 'engine' | 'host' | 'none';

// Distinguishes *why* loadTransportUrl failed so callers can word the
// status/toast message differently instead of a single generic "fetch
// failed" for every case (see U2 in USABILITY_RESILIENCE_BACKLOG.md):
// 'network' covers transport-layer failures (timeout, non-200, protocol
// error, TRANSPORT_UNAVAILABLE, external-intent hop limit); 'parse' covers a
// transport response that succeeded but carried no usable WML payload.
export type NavigationErrorKind = 'network' | 'parse';

export interface NavigationHostClient {
  fetchDeck(request: FetchRequest): Promise<FetchResponse>;
  engineLoadDeckContext(request: LoadDeckContextRequest): Promise<EngineRuntimeSnapshot>;
  engineLoadDeckContextFrame(request: LoadDeckContextRequest): Promise<EngineFrame>;
  engineRender(): Promise<RenderList>;
  engineRenderFrame(): Promise<EngineFrame>;
  engineHandleKey(request: HandleKeyRequest): Promise<EngineRuntimeSnapshot>;
  engineHandleKeyFrame(request: HandleKeyRequest): Promise<EngineFrame>;
  engineSnapshot(): Promise<EngineRuntimeSnapshot>;
  engineNavigateBack(): Promise<EngineRuntimeSnapshot>;
  engineNavigateBackFrame(): Promise<EngineFrame>;
  engineNavigateToCard(request: NavigateToCardRequest): Promise<EngineRuntimeSnapshot>;
  engineNavigateToCardFrame(request: NavigateToCardRequest): Promise<EngineFrame>;
  engineAdvanceTimeMs(request: AdvanceTimeRequest): Promise<EngineRuntimeSnapshot>;
  engineAdvanceTimeMsFrame(request: AdvanceTimeRequest): Promise<EngineFrame>;
  engineClearExternalNavigationIntent(): Promise<EngineRuntimeSnapshot>;
  engineClearExternalNavigationIntentFrame(): Promise<EngineFrame>;
}

export interface NavigationHooks {
  onSessionState?(session: HostSessionState): void;
  onSnapshot?(snapshot: EngineRuntimeSnapshot): void;
  onRender?(render: RenderList): void;
  onTransportResponse?(response: FetchResponse | null): void;
  onNetworkUnavailable?(): void;
  /**
   * Fired for every navigation failure that transitions navigationStatus to
   * 'error' (timeout, non-200/protocol error, malformed/missing payload,
   * external-intent hop limit) - including TRANSPORT_UNAVAILABLE, which also
   * fires the more specific onNetworkUnavailable hook. Lets callers surface a
   * consistent, visible failure indicator (e.g. a toast) regardless of which
   * failure kind occurred, instead of only the quieter status-panel text.
   */
  onNavigationError?(message: string, kind: NavigationErrorKind): void;
  onStateEvent?(action: string, details?: Record<string, unknown>): void;
}

export interface LoadTransportOptions {
  url: string;
  navigationUrl?: string;
  method?: string;
  headers?: Record<string, string>;
  source: HostNavigationSource;
  followExternalIntent: boolean;
  pushHistory?: boolean;
  requestPolicy?: FetchRequestPolicy;
}

export interface NavigationStateMachine {
  loadTransportUrl(options: LoadTransportOptions): Promise<EngineRuntimeSnapshot | null>;
  applyEngineKey(key: HandleKeyRequest['key']): Promise<EngineRuntimeSnapshot | null>;
  applyEngineTimerTick(deltaMs: number): Promise<EngineRuntimeSnapshot | null>;
  navigateBackWithFallback(): Promise<BackNavigationMode>;
  beginNavigationOperation(): number;
  finishNavigationOperation(generation: number): void;
  captureNavigationGeneration(): number;
  isCurrentNavigation(generation: number): boolean;
  isNavigationInFlight(): boolean;
  cancelPendingNavigation(): void;
  getSessionState(): HostSessionState;
  getHistoryState(): HostHistoryState;
}

export const createNavigationStateMachine = (
  hostClient: NavigationHostClient,
  initialRequestedUrl: string,
  hooks: NavigationHooks = {},
  maxExternalIntentHops: number = WAVES_CONFIG.maxExternalIntentHops
): NavigationStateMachine => {
  const hostHistory = createHostHistoryState();
  let hostSessionState: HostSessionState = {
    runMode: 'network',
    navigationStatus: 'idle',
    requestedUrl: initialRequestedUrl.trim()
  };
  // A navigation is in flight exactly while the current generation owns a
  // transport load or Back operation. Starting either operation advances the
  // generation; finishing clears ownership only if that generation is still
  // current. Mode switches cancel by advancing the generation and clearing
  // ownership, so stale async completions cannot reclaim it.
  let activeNavigationGeneration = 0;
  let navigationInFlightGeneration: number | undefined;
  let observedBrowserContextEpoch: number | undefined;

  const emitSession = (): void => {
    hooks.onSessionState?.(hostSessionState);
  };

  const setSessionState = (next: HostSessionState): boolean => {
    if (sessionStatesEqual(hostSessionState, next)) {
      return false;
    }
    hostSessionState = next;
    emitSession();
    return true;
  };

  const mergeSessionState = (patch: Partial<HostSessionState>): void => {
    const changed = setSessionState({
      ...hostSessionState,
      ...patch,
      historyIndex: hostHistory.index,
      history: hostHistory.entries
    });
    if (changed) {
      hooks.onStateEvent?.('session-state', { patch });
    }
  };

  const syncSessionFromSnapshot = (snapshot: EngineRuntimeSnapshot): void => {
    mergeSessionState({
      activeCardId: snapshot.activeCardId,
      focusedLinkIndex: snapshot.focusedLinkIndex,
      externalNavigationIntent: snapshot.externalNavigationIntent
    });
  };

  const applyFrame = (frame: EngineFrame): void => {
    hooks.onSnapshot?.(frame.snapshot);
    hooks.onRender?.(frame.render);
    syncSessionFromSnapshot(frame.snapshot);
  };

  const isCurrentNavigation = (generation: number): boolean =>
    generation === activeNavigationGeneration;

  const isNavigationInFlight = (): boolean =>
    navigationInFlightGeneration === activeNavigationGeneration;

  const beginNavigationOperation = (): number => {
    activeNavigationGeneration += 1;
    navigationInFlightGeneration = activeNavigationGeneration;
    return activeNavigationGeneration;
  };

  const finishNavigationOperation = (generation: number): void => {
    if (isCurrentNavigation(generation) && navigationInFlightGeneration === generation) {
      navigationInFlightGeneration = undefined;
    }
  };

  const observeBrowserContext = (snapshot: EngineRuntimeSnapshot): boolean => {
    if (snapshot.browserContextEpoch === undefined) {
      return false;
    }
    const changed =
      observedBrowserContextEpoch !== undefined &&
      observedBrowserContextEpoch !== snapshot.browserContextEpoch;
    observedBrowserContextEpoch = snapshot.browserContextEpoch;
    return changed;
  };

  const resetHistoryToCurrentCard = (snapshot: EngineRuntimeSnapshot): void => {
    const current = hostHistory.entries[hostHistory.index];
    resetHostHistoryState(hostHistory);
    if (!current) {
      return;
    }
    pushHostHistoryEntry(hostHistory, current.url, snapshot.activeCardId, current.source, {
      requestedUrl: current.requestedUrl,
      method: current.method,
      headers: current.headers,
      requestPolicy: current.requestPolicy
    });
  };

  const cancelPendingNavigation = (): void => {
    activeNavigationGeneration += 1;
    navigationInFlightGeneration = undefined;
  };

  const loadTransportUrlForGeneration = async (
    options: LoadTransportOptions,
    generation: number
  ): Promise<EngineRuntimeSnapshot | null> => {
    const requestedUrl = options.url.trim();
    const navigationUrl = options.navigationUrl?.trim() || requestedUrl;
    if (!requestedUrl) {
      throw new Error(WAVES_COPY.errors.urlRequired);
    }
    const defaultRequestPolicy = defaultRequestPolicyForSource(
      options.source,
      requestedUrl,
      hostSessionState.finalUrl
    );
    const mergedRequestPolicy = options.requestPolicy
      ? {
          ...defaultRequestPolicy,
          ...options.requestPolicy
        }
      : defaultRequestPolicy;
    const requestPolicy = withSubmissionSourceContentType(
      mergedRequestPolicy,
      hostSessionState.contentType
    );
    const method = resolveTransportMethod(options.method, requestPolicy);
    const pushHistory = options.pushHistory ?? true;
    const referringUrl =
      options.source === 'external-intent' ? hostSessionState.finalUrl : undefined;

    hooks.onStateEvent?.('load-transport-url', {
      source: options.source,
      requestedUrl,
      method,
      headers: options.headers,
      followExternalIntent: options.followExternalIntent,
      pushHistory,
      requestPolicy
    });

    mergeSessionState({
      navigationStatus: 'loading',
      requestedUrl,
      navigationSource: options.source,
      lastError: undefined
    });

    const transport = await hostClient.fetchDeck({
      url: requestedUrl,
      method,
      headers: options.headers,
      timeoutMs: WAVES_CONFIG.transportFetchTimeoutMs,
      retries: WAVES_CONFIG.transportFetchRetries,
      requestPolicy
    });
    if (!isCurrentNavigation(generation)) {
      return null;
    }
    hooks.onTransportResponse?.(transport);
    hooks.onStateEvent?.('fetch-deck-response', {
      ok: transport.ok,
      status: transport.status,
      finalUrl: transport.finalUrl,
      contentType: transport.contentType
    });

    if (!transport.ok) {
      const errorMessage = transport.error?.message ?? WAVES_COPY.errors.unknownTransportFailure;
      mergeSessionState({
        navigationStatus: 'error',
        lastError: errorMessage
      });
      if (transport.error?.code === 'TRANSPORT_UNAVAILABLE') {
        hooks.onNetworkUnavailable?.();
      }
      hooks.onNavigationError?.(errorMessage, 'network');
      return null;
    }

    const deckInput = transport.engineDeckInput ?? {
      wmlXml: transport.wml ?? '',
      baseUrl: transport.finalUrl,
      contentType: transport.contentType,
      rawBytesBase64: undefined
    };

    if (!deckInput.wmlXml) {
      mergeSessionState({
        navigationStatus: 'error',
        lastError: WAVES_COPY.errors.missingWmlPayload
      });
      hooks.onNavigationError?.(WAVES_COPY.errors.missingWmlPayload, 'parse');
      return null;
    }

    let frame: EngineFrame;
    try {
      frame = await hostClient.engineLoadDeckContextFrame({
        wmlXml: deckInput.wmlXml,
        baseUrl: deckInput.baseUrl,
        contentType: deckInput.contentType,
        rawBytesBase64: deckInput.rawBytesBase64,
        referringUrl,
        navigationUrl,
        navigationKind: navigationKindForSource(options.source)
      });
    } catch (error) {
      if (!isCurrentNavigation(generation)) {
        return null;
      }
      const message = error instanceof Error ? error.message : String(error);
      mergeSessionState({
        navigationStatus: 'error',
        lastError: message
      });
      hooks.onNavigationError?.(message, 'parse');
      return null;
    }
    if (!isCurrentNavigation(generation)) {
      return null;
    }
    const browserContextChanged = observeBrowserContext(frame.snapshot);
    if (browserContextChanged) {
      resetHostHistoryState(hostHistory);
      hooks.onStateEvent?.('browser-context-reset', {
        browserContextEpoch: frame.snapshot.browserContextEpoch
      });
    }
    hooks.onStateEvent?.('engine-load-deck-context', {
      activeCardId: frame.snapshot.activeCardId,
      focusedLinkIndex: frame.snapshot.focusedLinkIndex,
      externalNavigationIntent: frame.snapshot.externalNavigationIntent
    });
    applyFrame(frame);

    mergeSessionState({
      navigationStatus: 'loaded',
      finalUrl: transport.finalUrl,
      contentType: transport.contentType,
      activeCardId: frame.snapshot.activeCardId,
      focusedLinkIndex: frame.snapshot.focusedLinkIndex,
      externalNavigationIntent: frame.snapshot.externalNavigationIntent,
      navigationSource: options.source,
      lastError: undefined
    });

    if (pushHistory) {
      pushHostHistoryEntry(
        hostHistory,
        transport.finalUrl,
        frame.snapshot.activeCardId,
        options.source,
        {
          requestedUrl,
          method,
          headers: options.headers,
          requestPolicy
        }
      );
      mergeSessionState({
        historyIndex: hostHistory.index,
        history: hostHistory.entries
      });
    }

    if (options.followExternalIntent && frame.snapshot.externalNavigationIntent) {
      let nextUrl = frame.snapshot.externalNavigationIntent;
      let nextRequestPolicy = frame.snapshot.externalNavigationRequestPolicy;
      for (let hop = 1; hop <= maxExternalIntentHops; hop += 1) {
        const nextSnapshot = await loadTransportUrlForGeneration(
          {
            url: nextUrl,
            method: 'GET',
            source: 'external-intent',
            followExternalIntent: false,
            pushHistory: true,
            requestPolicy: nextRequestPolicy
          },
          generation
        );
        if (!nextSnapshot || !nextSnapshot.externalNavigationIntent) {
          break;
        }
        nextUrl = nextSnapshot.externalNavigationIntent;
        nextRequestPolicy = nextSnapshot.externalNavigationRequestPolicy;
        if (hop === maxExternalIntentHops) {
          const message = `External intent hop limit reached (${maxExternalIntentHops}).`;
          mergeSessionState({ navigationStatus: 'error', lastError: message });
          hooks.onNavigationError?.(message, 'network');
        }
      }
    }

    return frame.snapshot;
  };

  const loadTransportUrl = async (
    options: LoadTransportOptions
  ): Promise<EngineRuntimeSnapshot | null> => {
    const generation = beginNavigationOperation();
    try {
      return await loadTransportUrlForGeneration(options, generation);
    } finally {
      finishNavigationOperation(generation);
    }
  };

  const applyEngineKey = async (
    key: HandleKeyRequest['key']
  ): Promise<EngineRuntimeSnapshot | null> => {
    if (isNavigationInFlight()) {
      return null;
    }
    const generation = activeNavigationGeneration;
    const previousCardId = hostSessionState.activeCardId;
    const frame = await hostClient.engineHandleKeyFrame({ key });
    if (!isCurrentNavigation(generation) || isNavigationInFlight()) {
      return null;
    }
    if (observeBrowserContext(frame.snapshot)) {
      resetHistoryToCurrentCard(frame.snapshot);
    } else if (frame.snapshot.activeCardId && frame.snapshot.activeCardId !== previousCardId) {
      pushCurrentRequestHistoryCard(frame.snapshot.activeCardId);
    } else {
      updateCurrentHistoryCard(hostHistory, frame.snapshot.activeCardId);
    }
    applyFrame(frame);
    return frame.snapshot;
  };

  const applyEngineTimerTick = async (deltaMs: number): Promise<EngineRuntimeSnapshot | null> => {
    if (isNavigationInFlight()) {
      return null;
    }
    const generation = activeNavigationGeneration;
    const previousCardId = hostSessionState.activeCardId;
    const snapshot = await hostClient.engineAdvanceTimeMs({ deltaMs });
    if (!isCurrentNavigation(generation) || isNavigationInFlight()) {
      return null;
    }
    const shouldRender = shouldRenderTimerSnapshot(snapshot, hostSessionState);
    const renderFrame = shouldRender ? await hostClient.engineRenderFrame() : null;
    if (!isCurrentNavigation(generation) || isNavigationInFlight()) {
      return null;
    }
    const browserContextChanged = observeBrowserContext(snapshot);
    if (browserContextChanged) {
      resetHistoryToCurrentCard(snapshot);
    }
    if (!shouldRender) {
      return snapshot;
    }
    if (
      !browserContextChanged &&
      snapshot.activeCardId &&
      snapshot.activeCardId !== previousCardId
    ) {
      pushCurrentRequestHistoryCard(snapshot.activeCardId);
    } else {
      updateCurrentHistoryCard(hostHistory, snapshot.activeCardId);
    }
    if (renderFrame) {
      applyFrame(renderFrame);
    }
    return snapshot;
  };

  const navigateBackWithFallback = async (): Promise<BackNavigationMode> => {
    const generation = beginNavigationOperation();
    try {
      const afterFrame = await hostClient.engineNavigateBackFrame();
      if (!isCurrentNavigation(generation)) {
        return 'none';
      }
      const after = afterFrame.snapshot;
      const browserContextChanged = observeBrowserContext(after);
      if (browserContextChanged) {
        resetHistoryToCurrentCard(after);
      }

      if (after.lastBackNavigationHandled) {
        const current = hostHistory.entries[hostHistory.index];
        const previous = peekHistoryBack(hostHistory);
        if (
          !browserContextChanged &&
          hostSessionState.activeCardId !== after.activeCardId &&
          current &&
          previous &&
          previous.activeCardId === after.activeCardId &&
          sameHistoryDocument(current.url, previous.url)
        ) {
          commitHistoryBack(hostHistory);
        } else {
          updateCurrentHistoryCard(hostHistory, after.activeCardId);
        }
        applyFrame(afterFrame);
        return 'engine';
      }

      if (canHistoryBack(hostHistory)) {
        const previous = peekHistoryBack(hostHistory);
        if (previous?.url) {
          const prevSnapshot = await loadTransportUrlForGeneration(
            {
              url: previous.requestedUrl ?? previous.url,
              navigationUrl: historyNavigationUrl(previous.url, previous.activeCardId),
              method: previous.method ?? 'GET',
              headers: previous.headers,
              source: 'history-back',
              followExternalIntent: true,
              pushHistory: false,
              requestPolicy: previous.requestPolicy
            },
            generation
          );
          if (prevSnapshot && isCurrentNavigation(generation)) {
            let restoredSnapshot = prevSnapshot;
            let restoredFrame: EngineFrame | undefined;
            if (previous.activeCardId && previous.activeCardId !== prevSnapshot.activeCardId) {
              restoredFrame = await hostClient.engineNavigateToCardFrame({
                cardId: previous.activeCardId
              });
              if (!isCurrentNavigation(generation)) {
                return 'none';
              }
              restoredSnapshot = restoredFrame.snapshot;
            }
            const committed = commitHistoryBack(hostHistory);
            if (!committed) {
              return 'none';
            }
            if (restoredFrame) {
              applyFrame(restoredFrame);
            }
            updateCurrentHistoryCard(hostHistory, restoredSnapshot.activeCardId);
            mergeSessionState({
              historyIndex: hostHistory.index,
              history: hostHistory.entries
            });
            hooks.onStateEvent?.('host-history-back', {
              historyIndex: hostHistory.index,
              url: previous.url,
              restoredCardId: restoredSnapshot.activeCardId
            });
            return 'host';
          }
        }
      }

      return 'none';
    } finally {
      finishNavigationOperation(generation);
    }
  };

  function pushCurrentRequestHistoryCard(activeCardId: string): void {
    const current = hostHistory.entries[hostHistory.index];
    if (!current) {
      return;
    }
    pushHostHistoryEntry(hostHistory, current.url, activeCardId, current.source, {
      requestedUrl: current.requestedUrl,
      method: current.method,
      headers: current.headers,
      requestPolicy: current.requestPolicy
    });
  }

  emitSession();

  return {
    loadTransportUrl,
    applyEngineKey,
    applyEngineTimerTick,
    navigateBackWithFallback,
    beginNavigationOperation,
    finishNavigationOperation,
    captureNavigationGeneration: () => activeNavigationGeneration,
    isCurrentNavigation,
    isNavigationInFlight,
    cancelPendingNavigation,
    getSessionState: () => hostSessionState,
    getHistoryState: () => hostHistory
  };
};

const historyNavigationUrl = (url: string, activeCardId?: string): string => {
  if (!activeCardId) {
    return url;
  }
  try {
    const parsed = new URL(url);
    parsed.hash = activeCardId;
    return parsed.toString();
  } catch {
    return `${url.split('#', 1)[0]}#${encodeURIComponent(activeCardId)}`;
  }
};

const sameHistoryDocument = (left: string, right: string): boolean =>
  left.split('#', 1)[0] === right.split('#', 1)[0];

export const defaultRequestPolicyForSource = (
  source: HostNavigationSource,
  _requestedUrl: string,
  refererUrl?: string
): FetchRequestPolicy | undefined => {
  const uaCapabilityProfile = WAVES_CONFIG.transportUaCapabilityProfile;
  if (source === 'reload') {
    return { cacheControl: 'no-cache', uaCapabilityProfile };
  }
  if (source === 'external-intent' && refererUrl) {
    return { refererUrl, uaCapabilityProfile };
  }
  return { uaCapabilityProfile };
};

const navigationKindForSource = (source: HostNavigationSource): DeckNavigationKind => {
  switch (source) {
    case 'external-intent':
      return 'forward';
    case 'history-back':
    case 'engine-back':
      return 'backward';
    case 'reload':
      return 'reload';
    case 'user':
    case 'keyboard':
      return 'independent';
  }
};

const normalizeMethod = (method?: string): string => {
  const normalized = method?.trim().toUpperCase();
  return normalized || 'GET';
};

const resolveTransportMethod = (
  method: string | undefined,
  requestPolicy: FetchRequestPolicy | undefined
): string => {
  // The typed engine intent is authoritative. Legacy postContext remains a
  // compatibility fallback until its callers migrate to requestIntent.
  if (requestPolicy?.requestIntent) {
    return requestPolicy.requestIntent.method.toUpperCase();
  }
  if (requestPolicy?.postContext) {
    return 'POST';
  }
  return normalizeMethod(method);
};

const withSubmissionSourceContentType = (
  requestPolicy: FetchRequestPolicy | undefined,
  sourceContentType: string | undefined
): FetchRequestPolicy | undefined => {
  if (!requestPolicy?.requestIntent || requestPolicy.requestIntent.sourceContentType) {
    return requestPolicy;
  }
  return {
    ...requestPolicy,
    requestIntent: {
      ...requestPolicy.requestIntent,
      sourceContentType
    }
  };
};

export const shouldRenderTimerSnapshot = (
  snapshot: EngineRuntimeSnapshot,
  session: HostSessionState
): boolean => {
  if (snapshot.activeCardId !== session.activeCardId) {
    return true;
  }
  if (snapshot.focusedLinkIndex !== (session.focusedLinkIndex ?? 0)) {
    return true;
  }
  if (snapshot.externalNavigationIntent !== session.externalNavigationIntent) {
    return true;
  }
  if (snapshot.lastScriptRequiresRefresh) {
    return true;
  }
  if (snapshot.lastScriptDialogRequests.length > 0 || snapshot.lastScriptTimerRequests.length > 0) {
    return true;
  }
  return false;
};

const sessionStatesEqual = (a: HostSessionState, b: HostSessionState): boolean =>
  a.runMode === b.runMode &&
  a.navigationStatus === b.navigationStatus &&
  a.requestedUrl === b.requestedUrl &&
  a.finalUrl === b.finalUrl &&
  a.contentType === b.contentType &&
  a.activeCardId === b.activeCardId &&
  a.focusedLinkIndex === b.focusedLinkIndex &&
  a.externalNavigationIntent === b.externalNavigationIntent &&
  a.lastError === b.lastError &&
  a.navigationSource === b.navigationSource &&
  a.historyIndex === b.historyIndex &&
  historyEntriesEqual(a.history, b.history);

const historyEntriesEqual = (
  a: HostSessionState['history'],
  b: HostSessionState['history']
): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return a === b;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((entry, index) => historyEntryEqual(entry, b[index]));
};

const historyEntryEqual = (
  a: NonNullable<HostSessionState['history']>[number],
  b: NonNullable<HostSessionState['history']>[number] | undefined
): boolean =>
  !!b &&
  a.url === b.url &&
  a.requestedUrl === b.requestedUrl &&
  a.method === b.method &&
  a.activeCardId === b.activeCardId &&
  a.source === b.source &&
  headersEqual(a.headers, b.headers) &&
  requestPolicyEqual(a.requestPolicy, b.requestPolicy);

const headersEqual = (a?: Record<string, string>, b?: Record<string, string>): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return a === b;
  }
  const aEntries = Object.entries(a);
  const bEntries = Object.entries(b);
  if (aEntries.length !== bEntries.length) {
    return false;
  }
  return aEntries.every(([key, value]) => b[key] === value);
};

const requestPolicyEqual = (a?: FetchRequestPolicy, b?: FetchRequestPolicy): boolean =>
  a === b ||
  (!!a &&
    !!b &&
    a.destinationPolicy === b.destinationPolicy &&
    a.cacheControl === b.cacheControl &&
    a.refererUrl === b.refererUrl &&
    a.uaCapabilityProfile === b.uaCapabilityProfile &&
    postContextEqual(a.postContext, b.postContext));

const postContextEqual = (
  a?: FetchRequestPolicy['postContext'],
  b?: FetchRequestPolicy['postContext']
): boolean =>
  a === b ||
  (!!a &&
    !!b &&
    a.sameDeck === b.sameDeck &&
    a.contentType === b.contentType &&
    a.payload === b.payload);
