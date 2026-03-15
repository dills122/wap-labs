import type {
  FetchRequestPolicy,
  FetchRequest,
  FetchResponse,
  HostNavigationSource,
  HostSessionState
} from '../../../contracts/transport';
import type {
  AdvanceTimeRequest,
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
  engineRender(): Promise<RenderList>;
  engineHandleKey(request: HandleKeyRequest): Promise<EngineRuntimeSnapshot>;
  engineSnapshot(): Promise<EngineRuntimeSnapshot>;
  engineNavigateBack(): Promise<EngineRuntimeSnapshot>;
  engineNavigateToCard(request: NavigateToCardRequest): Promise<EngineRuntimeSnapshot>;
  engineAdvanceTimeMs(request: AdvanceTimeRequest): Promise<EngineRuntimeSnapshot>;
  engineClearExternalNavigationIntent(): Promise<EngineRuntimeSnapshot>;
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

  const renderSnapshot = async (snapshot: EngineRuntimeSnapshot): Promise<void> => {
    hooks.onSnapshot?.(snapshot);
    const render = await hostClient.engineRender();
    hooks.onRender?.(render);
    syncSessionFromSnapshot(snapshot);
  };

  const loadTransportUrl = async (
    options: LoadTransportOptions
  ): Promise<EngineRuntimeSnapshot | null> => {
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

    const snapshot = await hostClient.engineLoadDeckContext({
      wmlXml: deckInput.wmlXml,
      baseUrl: deckInput.baseUrl,
      contentType: deckInput.contentType,
      rawBytesBase64: deckInput.rawBytesBase64
    });
    hooks.onStateEvent?.('engine-load-deck-context', {
      activeCardId: snapshot.activeCardId,
      focusedLinkIndex: snapshot.focusedLinkIndex,
      externalNavigationIntent: snapshot.externalNavigationIntent
    });
    await renderSnapshot(snapshot);

    mergeSessionState({
      navigationStatus: 'loaded',
      finalUrl: transport.finalUrl,
      contentType: transport.contentType,
      activeCardId: snapshot.activeCardId,
      focusedLinkIndex: snapshot.focusedLinkIndex,
      externalNavigationIntent: snapshot.externalNavigationIntent,
      navigationSource: options.source,
      lastError: undefined
    });

    if (pushHistory) {
      pushHostHistoryEntry(hostHistory, transport.finalUrl, snapshot.activeCardId, options.source, {
        requestedUrl,
        method,
        headers: options.headers,
        requestPolicy
      });
      mergeSessionState({
        historyIndex: hostHistory.index,
        history: hostHistory.entries
      });
    }

    if (options.followExternalIntent && snapshot.externalNavigationIntent) {
      let nextUrl = snapshot.externalNavigationIntent;
      let nextRequestPolicy = snapshot.externalNavigationRequestPolicy;
      for (let hop = 1; hop <= maxExternalIntentHops; hop += 1) {
        await hostClient.engineClearExternalNavigationIntent();
        const nextSnapshot = await loadTransportUrl({
          url: nextUrl,
          method: 'GET',
          source: 'external-intent',
          followExternalIntent: false,
          pushHistory: true,
          requestPolicy: nextRequestPolicy
        });
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

    return snapshot;
  };

  const applyEngineKey = async (key: HandleKeyRequest['key']): Promise<EngineRuntimeSnapshot> => {
    const snapshot = await hostClient.engineHandleKey({ key });
    updateCurrentHistoryCard(hostHistory, snapshot.activeCardId);
    await renderSnapshot(snapshot);
    return snapshot;
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
    const after = await hostClient.engineNavigateBack();
    await renderSnapshot(after);

    const engineHandled =
      before.activeCardId !== after.activeCardId ||
      before.focusedLinkIndex !== after.focusedLinkIndex;
    if (engineHandled) {
      updateCurrentHistoryCard(hostHistory, after.activeCardId);
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
            restoredSnapshot = await hostClient.engineNavigateToCard({
              cardId: previous.activeCardId
            });
            await renderSnapshot(restoredSnapshot);
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
  JSON.stringify(a) === JSON.stringify(b);

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
