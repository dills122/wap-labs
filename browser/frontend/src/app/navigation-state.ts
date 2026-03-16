import type {
  FetchRequestPolicy,
  FetchRequest,
  FetchResponse,
  HostNavigationSource,
  HostSessionState
} from '../../../contracts/transport';
import type {
  AdvanceTimeRequest,
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
  updateCurrentHistoryCard,
  type HostHistoryState
} from '../session-history';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';

export type BackNavigationMode = 'engine' | 'host' | 'none';

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
  onStateEvent?(action: string, details?: Record<string, unknown>): void;
}

export interface LoadTransportOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  source: HostNavigationSource;
  followExternalIntent: boolean;
  pushHistory?: boolean;
  requestPolicy?: FetchRequestPolicy;
}

export interface NavigationStateMachine {
  loadTransportUrl(options: LoadTransportOptions): Promise<EngineRuntimeSnapshot | null>;
  applyEngineKey(key: HandleKeyRequest['key']): Promise<EngineRuntimeSnapshot>;
  applyEngineTimerTick(deltaMs: number): Promise<EngineRuntimeSnapshot>;
  navigateBackWithFallback(): Promise<BackNavigationMode>;
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
  let activeNavigationGeneration = 0;

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

  const renderSnapshot = async (snapshot: EngineRuntimeSnapshot): Promise<void> => {
    const frame = await hostClient.engineRenderFrame();
    hooks.onSnapshot?.(snapshot);
    hooks.onRender?.(frame.render);
    syncSessionFromSnapshot(snapshot);
  };

  const isCurrentNavigation = (generation: number): boolean =>
    generation === activeNavigationGeneration;

  const cancelPendingNavigation = (): void => {
    activeNavigationGeneration += 1;
  };

  const loadTransportUrl = async (
    options: LoadTransportOptions,
    generation = activeNavigationGeneration + 1
  ): Promise<EngineRuntimeSnapshot | null> => {
    activeNavigationGeneration = generation;
    const requestedUrl = options.url.trim();
    if (!requestedUrl) {
      throw new Error(WAVES_COPY.errors.urlRequired);
    }
    const defaultRequestPolicy = defaultRequestPolicyForSource(
      options.source,
      requestedUrl,
      hostSessionState.finalUrl
    );
    const requestPolicy = options.requestPolicy
      ? {
          ...defaultRequestPolicy,
          ...options.requestPolicy
        }
      : defaultRequestPolicy;
    const method = resolveTransportMethod(options.method, requestPolicy);
    const pushHistory = options.pushHistory ?? true;

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
        finalUrl: transport.finalUrl,
        contentType: transport.contentType,
        lastError: errorMessage
      });
      if (transport.error?.code === 'TRANSPORT_UNAVAILABLE') {
        hooks.onNetworkUnavailable?.();
      }
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
        finalUrl: transport.finalUrl,
        contentType: transport.contentType,
        lastError: WAVES_COPY.errors.missingWmlPayload
      });
      return null;
    }

    const frame = await hostClient.engineLoadDeckContextFrame({
      wmlXml: deckInput.wmlXml,
      baseUrl: deckInput.baseUrl,
      contentType: deckInput.contentType,
      rawBytesBase64: deckInput.rawBytesBase64
    });
    if (!isCurrentNavigation(generation)) {
      return null;
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
        await hostClient.engineClearExternalNavigationIntent();
        const nextSnapshot = await loadTransportUrl(
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
        }
      }
    }

    return frame.snapshot;
  };

  const applyEngineKey = async (key: HandleKeyRequest['key']): Promise<EngineRuntimeSnapshot> => {
    const frame = await hostClient.engineHandleKeyFrame({ key });
    updateCurrentHistoryCard(hostHistory, frame.snapshot.activeCardId);
    applyFrame(frame);
    return frame.snapshot;
  };

  const applyEngineTimerTick = async (deltaMs: number): Promise<EngineRuntimeSnapshot> => {
    const snapshot = await hostClient.engineAdvanceTimeMs({ deltaMs });
    if (!shouldRenderTimerSnapshot(snapshot, hostSessionState)) {
      return snapshot;
    }
    updateCurrentHistoryCard(hostHistory, snapshot.activeCardId);
    await renderSnapshot(snapshot);
    return snapshot;
  };

  const navigateBackWithFallback = async (): Promise<BackNavigationMode> => {
    const before = await hostClient.engineSnapshot();
    const afterFrame = await hostClient.engineNavigateBackFrame();
    const after = afterFrame.snapshot;

    const engineHandled = !engineSnapshotsEqual(before, after);
    if (engineHandled) {
      updateCurrentHistoryCard(hostHistory, after.activeCardId);
      applyFrame(afterFrame);
      return 'engine';
    }

    if (canHistoryBack(hostHistory)) {
      const previous = peekHistoryBack(hostHistory);
      if (previous?.url) {
        const prevSnapshot = await loadTransportUrl({
          url: previous.requestedUrl ?? previous.url,
          method: previous.method ?? 'GET',
          headers: previous.headers,
          source: 'history-back',
          followExternalIntent: true,
          pushHistory: false,
          requestPolicy: previous.requestPolicy
        });
        if (prevSnapshot) {
          let restoredSnapshot = prevSnapshot;
          if (previous.activeCardId && previous.activeCardId !== prevSnapshot.activeCardId) {
            const frame = await hostClient.engineNavigateToCardFrame({
              cardId: previous.activeCardId
            });
            restoredSnapshot = frame.snapshot;
            applyFrame(frame);
          }
          const committed = commitHistoryBack(hostHistory);
          if (!committed) {
            return 'none';
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
  };

  emitSession();

  return {
    loadTransportUrl,
    applyEngineKey,
    applyEngineTimerTick,
    navigateBackWithFallback,
    cancelPendingNavigation,
    getSessionState: () => hostSessionState,
    getHistoryState: () => hostHistory
  };
};

export const defaultRequestPolicyForSource = (
  source: HostNavigationSource,
  requestedUrl: string,
  refererUrl?: string
): FetchRequestPolicy | undefined => {
  const uaCapabilityProfile = WAVES_CONFIG.transportUaCapabilityProfile;
  const destinationPolicy = shouldAllowPrivateDestination(requestedUrl)
    ? 'allow-private'
    : undefined;
  if (source === 'reload') {
    return { cacheControl: 'no-cache', destinationPolicy, uaCapabilityProfile };
  }
  if (source === 'external-intent' && refererUrl) {
    return { refererUrl, destinationPolicy, uaCapabilityProfile };
  }
  return { destinationPolicy, uaCapabilityProfile };
};

const normalizeMethod = (method?: string): string => {
  const normalized = method?.trim().toUpperCase();
  return normalized || 'GET';
};

const engineSnapshotsEqual = (a: EngineRuntimeSnapshot, b: EngineRuntimeSnapshot): boolean =>
  a.activeCardId === b.activeCardId &&
  a.focusedLinkIndex === b.focusedLinkIndex &&
  a.focusedInputEditName === b.focusedInputEditName &&
  a.focusedInputEditValue === b.focusedInputEditValue &&
  a.focusedSelectEditName === b.focusedSelectEditName &&
  a.focusedSelectEditValue === b.focusedSelectEditValue &&
  a.baseUrl === b.baseUrl &&
  a.contentType === b.contentType &&
  a.externalNavigationIntent === b.externalNavigationIntent &&
  requestPoliciesEqual(a.externalNavigationRequestPolicy, b.externalNavigationRequestPolicy) &&
  a.lastScriptExecutionOk === b.lastScriptExecutionOk &&
  a.lastScriptExecutionTrap === b.lastScriptExecutionTrap &&
  a.lastScriptExecutionErrorClass === b.lastScriptExecutionErrorClass &&
  a.lastScriptExecutionErrorCategory === b.lastScriptExecutionErrorCategory &&
  a.lastScriptRequiresRefresh === b.lastScriptRequiresRefresh &&
  dialogRequestsEqual(a.lastScriptDialogRequests, b.lastScriptDialogRequests) &&
  timerRequestsEqual(a.lastScriptTimerRequests, b.lastScriptTimerRequests);

const requestPoliciesEqual = (
  a: EngineRuntimeSnapshot['externalNavigationRequestPolicy'],
  b: EngineRuntimeSnapshot['externalNavigationRequestPolicy']
): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return !a && !b;
  }
  return (
    a.cacheControl === b.cacheControl &&
    a.refererUrl === b.refererUrl &&
    postContextsEqual(a.postContext, b.postContext)
  );
};

const postContextsEqual = (
  a: NonNullable<EngineRuntimeSnapshot['externalNavigationRequestPolicy']>['postContext'],
  b: NonNullable<EngineRuntimeSnapshot['externalNavigationRequestPolicy']>['postContext']
): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return !a && !b;
  }
  return a.sameDeck === b.sameDeck && a.contentType === b.contentType && a.payload === b.payload;
};

const dialogRequestsEqual = (
  a: EngineRuntimeSnapshot['lastScriptDialogRequests'],
  b: EngineRuntimeSnapshot['lastScriptDialogRequests']
): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((request, index) => {
    const other = b[index];
    return (
      other !== undefined &&
      request.type === other.type &&
      request.message === other.message &&
      ('defaultValue' in request ? request.defaultValue : undefined) ===
        ('defaultValue' in other ? other.defaultValue : undefined)
    );
  });
};

const timerRequestsEqual = (
  a: EngineRuntimeSnapshot['lastScriptTimerRequests'],
  b: EngineRuntimeSnapshot['lastScriptTimerRequests']
): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((request, index) => {
    const other = b[index];
    return (
      other !== undefined &&
      request.type === other.type &&
      ('delayMs' in request ? request.delayMs : undefined) ===
        ('delayMs' in other ? other.delayMs : undefined) &&
      request.token === other.token
    );
  });
};

const resolveTransportMethod = (
  method: string | undefined,
  requestPolicy: FetchRequestPolicy | undefined
): string => {
  // Engine emits POST body via requestPolicy.postContext for WML <go method="post"> intents.
  // Treat that as authoritative even if caller defaulted method to GET.
  if (requestPolicy?.postContext) {
    return 'POST';
  }
  return normalizeMethod(method);
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

const shouldAllowPrivateDestination = (requestedUrl: string): boolean => {
  try {
    const { hostname } = new URL(requestedUrl);
    const normalized = hostname.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    if (normalized === 'localhost' || normalized === '::1' || normalized.endsWith('.localhost')) {
      return true;
    }

    if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
      return true;
    }

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
      return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
      return true;
    }

    const private172 = normalized.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (private172) {
      const secondOctet = Number.parseInt(private172[1], 10);
      return secondOctet >= 16 && secondOctet <= 31;
    }

    return false;
  } catch {
    return false;
  }
};
