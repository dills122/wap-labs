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
// transport response that carried no usable WML payload, including unsupported
// content types and WBXML decode failures.
export type NavigationErrorKind = 'network' | 'parse';

const navigationErrorKindForFetchFailure = (response: FetchResponse): NavigationErrorKind =>
  response.error?.code === 'UNSUPPORTED_CONTENT_TYPE' ||
  response.error?.code === 'WBXML_DECODE_FAILED'
    ? 'parse'
    : 'network';

export interface NavigationHostClient {
  fetchDeck(request: FetchRequest): Promise<FetchResponse>;
  cancelFetch(requestId: string): Promise<boolean>;
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
  onFrame?(frame: EngineFrame): void;
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
  isExternalIntentQuarantined(intentUrl: string, requestPolicy?: FetchRequestPolicy): boolean;
  quarantineExternalIntent(intentUrl: string, requestPolicy?: FetchRequestPolicy): void;
  cancelPendingNavigation(): Promise<void> | undefined;
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
  let navigationRequestSequence = 0;
  let pendingHostCancellation: Promise<void> | undefined;
  let activeTransportOperation:
    | {
        generation: number;
        identity: NavigationOperationIdentity;
        requestId: string;
        promise: Promise<EngineRuntimeSnapshot | null>;
      }
    | undefined;
  let observedBrowserContextEpoch: number | undefined;
  // WML-205 keeps a failed task's engine state and intent intact. This
  // browser-only record prevents that preserved intent from becoming an
  // implicit retry loop while retaining it for an explicit user retry.
  let quarantinedExternalIntent:
    | {
        generation: number;
        requestedUrl: string;
        method: string;
        requestPolicy?: FetchRequestPolicy;
      }
    | undefined;

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

  const publishFrame = (frame: EngineFrame): void => {
    hooks.onFrame?.(frame);
    hooks.onSnapshot?.(frame.snapshot);
    hooks.onRender?.(frame.render);
    syncSessionFromSnapshot(frame.snapshot);
  };

  const isCurrentNavigation = (generation: number): boolean =>
    generation === activeNavigationGeneration;

  const isNavigationInFlight = (): boolean =>
    navigationInFlightGeneration === activeNavigationGeneration;

  const beginNavigationOperation = (): number => {
    const superseded = activeTransportOperation;
    activeTransportOperation = undefined;
    if (superseded) {
      pendingHostCancellation = hostClient
        .cancelFetch(superseded.requestId)
        .then(() => undefined)
        .catch((error: unknown) => {
          hooks.onStateEvent?.('cancel-fetch-failed', {
            requestId: superseded.requestId,
            message: error instanceof Error ? error.message : String(error)
          });
        });
    } else {
      pendingHostCancellation = undefined;
    }
    activeNavigationGeneration += 1;
    navigationInFlightGeneration = activeNavigationGeneration;
    return activeNavigationGeneration;
  };

  const finishNavigationOperation = (generation: number): void => {
    if (isCurrentNavigation(generation) && navigationInFlightGeneration === generation) {
      navigationInFlightGeneration = undefined;
    }
    if (activeTransportOperation?.generation === generation) {
      activeTransportOperation = undefined;
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

  const cancelPendingNavigation = (): Promise<void> | undefined => {
    beginNavigationOperation();
    navigationInFlightGeneration = undefined;
    if (hostSessionState.navigationStatus === 'loading') {
      mergeSessionState({ navigationStatus: 'idle', lastError: undefined });
    }
    return pendingHostCancellation;
  };

  const externalIntentRequestIdentity = (
    intentUrl: string,
    requestPolicy?: FetchRequestPolicy
  ): Omit<NonNullable<typeof quarantinedExternalIntent>, 'generation'> => {
    const requestedUrl = intentUrl.trim();
    const defaultRequestPolicy = defaultRequestPolicyForSource(
      'external-intent',
      requestedUrl,
      hostSessionState.finalUrl
    );
    const mergedRequestPolicy = requestPolicy
      ? { ...defaultRequestPolicy, ...requestPolicy }
      : defaultRequestPolicy;
    const resolvedRequestPolicy = withSubmissionSourceContentType(
      mergedRequestPolicy,
      hostSessionState.contentType
    );
    return {
      requestedUrl,
      method: resolveTransportMethod('GET', resolvedRequestPolicy),
      requestPolicy: resolvedRequestPolicy
    };
  };

  const quarantineExternalIntentRequest = (
    requestedUrl: string,
    method: string,
    requestPolicy: FetchRequestPolicy | undefined,
    generation: number
  ): void => {
    const next = { generation, requestedUrl, method, requestPolicy };
    if (
      quarantinedExternalIntent?.generation === next.generation &&
      externalIntentRequestIdentitiesEqual(quarantinedExternalIntent, next)
    ) {
      return;
    }
    quarantinedExternalIntent = next;
    hooks.onStateEvent?.('external-intent-quarantined', {
      generation,
      requestedUrl,
      method
    });
  };

  const quarantineExternalIntent = (
    intentUrl: string,
    requestPolicy?: FetchRequestPolicy
  ): void => {
    const identity = externalIntentRequestIdentity(intentUrl, requestPolicy);
    quarantineExternalIntentRequest(
      identity.requestedUrl,
      identity.method,
      identity.requestPolicy,
      activeNavigationGeneration
    );
  };

  const isExternalIntentQuarantined = (
    intentUrl: string,
    requestPolicy?: FetchRequestPolicy
  ): boolean => {
    if (!quarantinedExternalIntent) {
      return false;
    }
    const identity = externalIntentRequestIdentity(intentUrl, requestPolicy);
    return (
      quarantinedExternalIntent.generation === activeNavigationGeneration &&
      externalIntentRequestIdentitiesEqual(quarantinedExternalIntent, identity)
    );
  };

  const loadTransportUrlForGeneration = async (
    options: LoadTransportOptions,
    generation: number,
    requestId: string,
    publishLoadedFrame = true
  ): Promise<EngineFrame | null> => {
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
      requestId,
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
      if (options.source === 'external-intent') {
        quarantineExternalIntentRequest(requestedUrl, method, requestPolicy, generation);
      }
      hooks.onNavigationError?.(errorMessage, navigationErrorKindForFetchFailure(transport));
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
      if (options.source === 'external-intent') {
        quarantineExternalIntentRequest(requestedUrl, method, requestPolicy, generation);
      }
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
      if (options.source === 'external-intent') {
        quarantineExternalIntentRequest(requestedUrl, method, requestPolicy, generation);
      }
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
    if (publishLoadedFrame) {
      publishFrame(frame);
    }
    // A committed navigation establishes a fresh engine state, so a prior
    // terminal-intent quarantine no longer applies.
    quarantinedExternalIntent = undefined;

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
        const nextFrame = await loadTransportUrlForGeneration(
          {
            url: nextUrl,
            method: 'GET',
            source: 'external-intent',
            followExternalIntent: false,
            pushHistory: true,
            requestPolicy: nextRequestPolicy
          },
          generation,
          requestId
        );
        if (!nextFrame || !nextFrame.snapshot.externalNavigationIntent) {
          break;
        }
        nextUrl = nextFrame.snapshot.externalNavigationIntent;
        nextRequestPolicy = nextFrame.snapshot.externalNavigationRequestPolicy;
        if (hop === maxExternalIntentHops) {
          const message = `External intent hop limit reached (${maxExternalIntentHops}).`;
          mergeSessionState({ navigationStatus: 'error', lastError: message });
          hooks.onNavigationError?.(message, 'network');
        }
      }
    }

    return frame;
  };

  const loadTransportUrl = async (
    options: LoadTransportOptions
  ): Promise<EngineRuntimeSnapshot | null> => {
    const identity = navigationOperationIdentity(options, hostSessionState);
    if (
      activeTransportOperation &&
      navigationOperationIdentitiesEqual(activeTransportOperation.identity, identity)
    ) {
      hooks.onStateEvent?.('navigation-coalesced', {
        requestedUrl: identity.requestedUrl,
        requestId: activeTransportOperation.requestId
      });
      return activeTransportOperation.promise;
    }
    const generation = beginNavigationOperation();
    navigationRequestSequence += 1;
    const requestId = `waves-navigation-${generation}-${navigationRequestSequence}`;
    let resolveOperation: (value: EngineRuntimeSnapshot | null) => void = () => undefined;
    let rejectOperation: (reason: unknown) => void = () => undefined;
    const operationPromise = new Promise<EngineRuntimeSnapshot | null>((resolve, reject) => {
      resolveOperation = resolve;
      rejectOperation = reject;
    });
    activeTransportOperation = { generation, identity, requestId, promise: operationPromise };
    void (async () => {
      try {
        if (pendingHostCancellation) {
          await pendingHostCancellation;
        }
        if (!isCurrentNavigation(generation)) {
          resolveOperation(null);
          return;
        }
        const frame = await loadTransportUrlForGeneration(options, generation, requestId);
        resolveOperation(frame?.snapshot ?? null);
      } catch (error) {
        rejectOperation(error);
      } finally {
        finishNavigationOperation(generation);
      }
    })();
    return operationPromise;
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
    publishFrame(frame);
    return frame.snapshot;
  };

  const applyEngineTimerTick = async (deltaMs: number): Promise<EngineRuntimeSnapshot | null> => {
    if (isNavigationInFlight()) {
      return null;
    }
    const generation = activeNavigationGeneration;
    const previousCardId = hostSessionState.activeCardId;
    const frame = await hostClient.engineAdvanceTimeMsFrame({ deltaMs });
    if (!isCurrentNavigation(generation) || isNavigationInFlight()) {
      return null;
    }
    const snapshot = frame.snapshot;
    const shouldRender = shouldRenderTimerSnapshot(snapshot, hostSessionState);
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
    publishFrame(frame);
    return snapshot;
  };

  const navigateBackWithFallback = async (): Promise<BackNavigationMode> => {
    const generation = beginNavigationOperation();
    try {
      if (pendingHostCancellation) {
        await pendingHostCancellation;
      }
      if (!isCurrentNavigation(generation)) {
        return 'none';
      }
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
        publishFrame(afterFrame);
        return 'engine';
      }

      if (canHistoryBack(hostHistory)) {
        const previous = peekHistoryBack(hostHistory);
        if (previous?.url) {
          const loadedFrame = await loadTransportUrlForGeneration(
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
            generation,
            `waves-navigation-${generation}-history`,
            false
          );
          if (loadedFrame && isCurrentNavigation(generation)) {
            let restoredFrame = loadedFrame;
            if (
              previous.activeCardId &&
              previous.activeCardId !== loadedFrame.snapshot.activeCardId
            ) {
              restoredFrame = await hostClient.engineNavigateToCardFrame({
                cardId: previous.activeCardId
              });
              if (!isCurrentNavigation(generation)) {
                return 'none';
              }
            }
            const committed = commitHistoryBack(hostHistory);
            if (!committed) {
              return 'none';
            }
            publishFrame(restoredFrame);
            const restoredSnapshot = restoredFrame.snapshot;
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
    isExternalIntentQuarantined,
    quarantineExternalIntent,
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

interface NavigationOperationIdentity {
  requestedUrl: string;
  navigationUrl: string;
  method: string;
  source: HostNavigationSource;
  followExternalIntent: boolean;
  pushHistory: boolean;
  headers?: Record<string, string>;
  requestPolicy?: FetchRequestPolicy;
}

const navigationOperationIdentity = (
  options: LoadTransportOptions,
  session: HostSessionState
): NavigationOperationIdentity => {
  const requestedUrl = options.url.trim();
  const defaultRequestPolicy = defaultRequestPolicyForSource(
    options.source,
    requestedUrl,
    session.finalUrl
  );
  const mergedRequestPolicy = options.requestPolicy
    ? { ...defaultRequestPolicy, ...options.requestPolicy }
    : defaultRequestPolicy;
  const requestPolicy = withSubmissionSourceContentType(mergedRequestPolicy, session.contentType);
  return {
    requestedUrl,
    navigationUrl: options.navigationUrl?.trim() || requestedUrl,
    method: resolveTransportMethod(options.method, requestPolicy),
    source: options.source,
    followExternalIntent: options.followExternalIntent,
    pushHistory: options.pushHistory ?? true,
    headers: options.headers,
    requestPolicy
  };
};

const navigationOperationIdentitiesEqual = (
  a: NavigationOperationIdentity,
  b: NavigationOperationIdentity
): boolean =>
  a.requestedUrl === b.requestedUrl &&
  a.navigationUrl === b.navigationUrl &&
  a.method === b.method &&
  a.source === b.source &&
  a.followExternalIntent === b.followExternalIntent &&
  a.pushHistory === b.pushHistory &&
  stringRecordsEqual(a.headers, b.headers) &&
  requestPolicyEqual(a.requestPolicy, b.requestPolicy);

const stringRecordsEqual = (a?: Record<string, string>, b?: Record<string, string>): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key, index) => key === bKeys[index] && a[key] === b[key])
  );
};

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
    postContextEqual(a.postContext, b.postContext) &&
    requestIntentEqual(a.requestIntent, b.requestIntent));

const externalIntentRequestIdentitiesEqual = (
  a: { requestedUrl: string; method: string; requestPolicy?: FetchRequestPolicy },
  b: { requestedUrl: string; method: string; requestPolicy?: FetchRequestPolicy }
): boolean =>
  a.requestedUrl === b.requestedUrl &&
  a.method === b.method &&
  requestPolicyEqual(a.requestPolicy, b.requestPolicy);

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

const requestIntentEqual = (
  a?: FetchRequestPolicy['requestIntent'],
  b?: FetchRequestPolicy['requestIntent']
): boolean =>
  a === b ||
  (!!a &&
    !!b &&
    a.method === b.method &&
    a.enctype === b.enctype &&
    a.sendReferer === b.sendReferer &&
    a.acceptCharset === b.acceptCharset &&
    a.sameDeck === b.sameDeck &&
    a.sourceContentType === b.sourceContentType &&
    a.postFields.length === b.postFields.length &&
    a.postFields.every(
      (field, index) =>
        field.name === b.postFields[index]?.name && field.value === b.postFields[index]?.value
    ));
