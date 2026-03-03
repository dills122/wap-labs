import type {
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
  source: HostNavigationSource;
  followExternalIntent: boolean;
  pushHistory?: boolean;
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
    navigationStatus: 'idle',
    requestedUrl: initialRequestedUrl.trim()
  };

  const emitSession = (): void => {
    hooks.onSessionState?.(hostSessionState);
  };

  const setSessionState = (next: HostSessionState): void => {
    hostSessionState = next;
    emitSession();
  };

  const mergeSessionState = (patch: Partial<HostSessionState>): void => {
    setSessionState({
      ...hostSessionState,
      ...patch,
      historyIndex: hostHistory.index,
      history: hostHistory.entries
    });
    hooks.onStateEvent?.('session-state', { patch });
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
    const pushHistory = options.pushHistory ?? true;

    hooks.onStateEvent?.('load-transport-url', {
      source: options.source,
      requestedUrl,
      followExternalIntent: options.followExternalIntent,
      pushHistory
    });

    mergeSessionState({
      navigationStatus: 'loading',
      requestedUrl,
      navigationSource: options.source,
      lastError: undefined
    });

    const transport = await hostClient.fetchDeck({
      url: requestedUrl,
      method: 'GET',
      timeoutMs: WAVES_CONFIG.transportFetchTimeoutMs,
      retries: WAVES_CONFIG.transportFetchRetries
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
      pushHostHistoryEntry(hostHistory, transport.finalUrl, snapshot.activeCardId, options.source);
      mergeSessionState({
        historyIndex: hostHistory.index,
        history: hostHistory.entries
      });
    }

    if (options.followExternalIntent && snapshot.externalNavigationIntent) {
      let nextUrl = snapshot.externalNavigationIntent;
      for (let hop = 1; hop <= maxExternalIntentHops; hop += 1) {
        await hostClient.engineClearExternalNavigationIntent();
        const nextSnapshot = await loadTransportUrl({
          url: nextUrl,
          source: 'external-intent',
          followExternalIntent: false,
          pushHistory: true
        });
        if (!nextSnapshot || !nextSnapshot.externalNavigationIntent) {
          break;
        }
        nextUrl = nextSnapshot.externalNavigationIntent;
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
    await renderSnapshot(snapshot);
    return snapshot;
  };

  const applyEngineTimerTick = async (deltaMs: number): Promise<EngineRuntimeSnapshot> => {
    const snapshot = await hostClient.engineAdvanceTimeMs({ deltaMs });
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
      return 'engine';
    }

    if (canHistoryBack(hostHistory)) {
      const previous = peekHistoryBack(hostHistory);
      if (previous?.url) {
        const prevSnapshot = await loadTransportUrl({
          url: previous.url,
          source: 'history-back',
          followExternalIntent: true,
          pushHistory: false
        });
        if (prevSnapshot) {
          if (previous.activeCardId && previous.activeCardId !== prevSnapshot.activeCardId) {
            const restored = await hostClient.engineNavigateToCard({
              cardId: previous.activeCardId
            });
            await renderSnapshot(restored);
          }
          const committed = commitHistoryBack(hostHistory);
          if (!committed) {
            return 'none';
          }
          mergeSessionState({
            historyIndex: hostHistory.index,
            history: hostHistory.entries
          });
          hooks.onStateEvent?.('host-history-back', {
            historyIndex: hostHistory.index,
            url: previous.url,
            restoredCardId: previous.activeCardId
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
