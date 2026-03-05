import { describe, expect, it } from 'vitest';
import type { FetchResponse } from '../../../contracts/transport';
import type { EngineRuntimeSnapshot, RenderList } from '../../../contracts/engine';
import { createNavigationStateMachine, type NavigationHostClient } from './navigation-state';

const renderStub: RenderList = {
  draw: [{ type: 'text', x: 0, y: 0, text: 'ok' }]
};

const snapshot = (overrides: Partial<EngineRuntimeSnapshot> = {}): EngineRuntimeSnapshot => ({
  focusedLinkIndex: 0,
  baseUrl: 'http://example.test/start.wml',
  contentType: 'text/vnd.wap.wml',
  lastScriptDialogRequests: [],
  lastScriptTimerRequests: [],
  ...overrides
});

const fetchOk = (overrides: Partial<FetchResponse> = {}): FetchResponse => ({
  ok: true,
  status: 200,
  finalUrl: 'http://example.test/start.wml',
  contentType: 'text/vnd.wap.wml',
  wml: '<wml><card id="home"><p>ok</p></card></wml>',
  timingMs: { encode: 0, udpRtt: 1, decode: 0 },
  engineDeckInput: {
    wmlXml: '<wml><card id="home"><p>ok</p></card></wml>',
    baseUrl: 'http://example.test/start.wml',
    contentType: 'text/vnd.wap.wml'
  },
  ...overrides
});

const createHostClientMock = (
  overrides: Partial<NavigationHostClient> = {}
): NavigationHostClient => {
  const base: NavigationHostClient = {
    fetchDeck: async () => fetchOk(),
    engineLoadDeckContext: async () => snapshot({ activeCardId: 'home' }),
    engineRender: async () => renderStub,
    engineHandleKey: async () => snapshot({ activeCardId: 'home' }),
    engineSnapshot: async () => snapshot({ activeCardId: 'home' }),
    engineNavigateBack: async () => snapshot({ activeCardId: 'home' }),
    engineNavigateToCard: async () => snapshot({ activeCardId: 'home' }),
    engineAdvanceTimeMs: async () => snapshot({ activeCardId: 'home' }),
    engineClearExternalNavigationIntent: async () => snapshot({ activeCardId: 'home' })
  };
  return {
    ...base,
    ...overrides
  };
};

describe('navigation-state', () => {
  it('transitions idle -> loading -> loaded on successful user load', async () => {
    const sessions: string[] = [];
    const machine = createNavigationStateMachine(createHostClientMock(), 'http://seed.test', {
      onSessionState: (session) => sessions.push(session.navigationStatus)
    });

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: true
    });

    expect(sessions).toContain('loading');
    expect(machine.getSessionState().navigationStatus).toBe('loaded');
    expect(machine.getSessionState().finalUrl).toBe('http://example.test/start.wml');
    expect(machine.getHistoryState().index).toBe(0);
  });

  it('transitions to error on transport failure and emits network unavailable hook', async () => {
    let networkUnavailable = 0;
    const host = createHostClientMock({
      fetchDeck: async () =>
        fetchOk({
          ok: false,
          status: 0,
          contentType: 'text/plain',
          error: { code: 'TRANSPORT_UNAVAILABLE', message: 'offline' },
          engineDeckInput: undefined,
          wml: undefined
        })
    });
    const machine = createNavigationStateMachine(host, 'http://seed.test', {
      onNetworkUnavailable: () => {
        networkUnavailable += 1;
      }
    });

    const result = await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: true
    });

    expect(result).toBeNull();
    expect(machine.getSessionState().navigationStatus).toBe('error');
    expect(machine.getSessionState().lastError).toBe('offline');
    expect(networkUnavailable).toBe(1);
  });

  it('prefers engine back when runtime state changes', async () => {
    const machine = createNavigationStateMachine(
      createHostClientMock({
        engineSnapshot: async () => snapshot({ activeCardId: 'next', focusedLinkIndex: 0 }),
        engineNavigateBack: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })
      }),
      'http://seed.test'
    );

    const mode = await machine.navigateBackWithFallback();
    expect(mode).toBe('engine');
  });

  it('falls back to host history when engine back is a no-op', async () => {
    const fetchCalls: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) => {
          fetchCalls.push(request.url);
          return fetchOk({
            finalUrl: request.url
          });
        },
        engineSnapshot: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }),
        engineNavigateBack: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: true
    });
    await machine.loadTransportUrl({
      url: 'http://example.test/b.wml',
      source: 'user',
      followExternalIntent: true
    });

    const mode = await machine.navigateBackWithFallback();
    expect(mode).toBe('host');
    expect(fetchCalls.at(-1)).toBe('http://example.test/a.wml');
    expect(machine.getHistoryState().index).toBe(0);
  });

  it('follows external intent loop and applies hop cap', async () => {
    let loadCount = 0;
    let clearCount = 0;
    const host = createHostClientMock({
      fetchDeck: async (request) =>
        fetchOk({
          finalUrl: request.url
        }),
      engineLoadDeckContext: async () => {
        loadCount += 1;
        if (loadCount === 1) {
          return snapshot({
            activeCardId: 'home',
            externalNavigationIntent: 'http://example.test/step-1.wml'
          });
        }
        if (loadCount === 2) {
          return snapshot({
            activeCardId: 'step-1',
            externalNavigationIntent: 'http://example.test/step-2.wml'
          });
        }
        return snapshot({
          activeCardId: 'step-2',
          externalNavigationIntent: 'http://example.test/step-3.wml'
        });
      },
      engineClearExternalNavigationIntent: async () => {
        clearCount += 1;
        return snapshot({ activeCardId: 'clear' });
      }
    });
    const machine = createNavigationStateMachine(host, 'http://seed.test', {}, 2);

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: true
    });

    expect(clearCount).toBe(2);
    expect(machine.getSessionState().navigationStatus).toBe('error');
    expect(machine.getSessionState().lastError).toContain('hop limit');
  });

  it('uses runtime-provided external intent request policy when following intents', async () => {
    const capturedPolicies: unknown[] = [];
    let loadCount = 0;
    const host = createHostClientMock({
      fetchDeck: async (request) => {
        capturedPolicies.push(request.requestPolicy);
        return fetchOk({ finalUrl: request.url });
      },
      engineLoadDeckContext: async () => {
        loadCount += 1;
        if (loadCount === 1) {
          return snapshot({
            activeCardId: 'home',
            externalNavigationIntent: 'http://example.test/step-1.wml',
            externalNavigationRequestPolicy: {
              refererUrl: 'http://example.test/start.wml'
            }
          });
        }
        return snapshot({
          activeCardId: 'step-1'
        });
      }
    });
    const machine = createNavigationStateMachine(host, 'http://seed.test');

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: true
    });

    expect(capturedPolicies).toHaveLength(2);
    expect(capturedPolicies[0]).toEqual({ uaCapabilityProfile: 'wap-baseline' });
    expect(capturedPolicies[1]).toEqual({
      refererUrl: 'http://example.test/start.wml',
      uaCapabilityProfile: 'wap-baseline'
    });
  });

  it('does not push duplicate history entry when reload uses pushHistory=false', async () => {
    const machine = createNavigationStateMachine(createHostClientMock(), 'http://seed.test');

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: true,
      pushHistory: true
    });
    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'reload',
      followExternalIntent: false,
      pushHistory: false
    });

    expect(machine.getHistoryState().entries).toHaveLength(1);
    expect(machine.getHistoryState().entries[0]?.source).toBe('user');
  });

  it('maps reload source to no-cache request policy', async () => {
    const requestPolicies: unknown[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) => {
          requestPolicies.push(request.requestPolicy);
          return fetchOk({ finalUrl: request.url });
        }
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'reload',
      followExternalIntent: false,
      pushHistory: false
    });

    expect(requestPolicies).toHaveLength(1);
    expect(requestPolicies[0]).toEqual({
      cacheControl: 'no-cache',
      uaCapabilityProfile: 'wap-baseline'
    });
  });

  it('maps external-intent source to referer request policy', async () => {
    const requestPolicies: unknown[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) => {
          requestPolicies.push(request.requestPolicy);
          return fetchOk({ finalUrl: request.url });
        }
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.loadTransportUrl({
      url: 'http://example.test/next.wml',
      source: 'external-intent',
      followExternalIntent: false
    });

    expect(requestPolicies).toHaveLength(2);
    expect(requestPolicies[0]).toEqual({ uaCapabilityProfile: 'wap-baseline' });
    expect(requestPolicies[1]).toEqual({
      refererUrl: 'http://example.test/start.wml',
      uaCapabilityProfile: 'wap-baseline'
    });
  });

  it('applies timer tick via host advanceTimeMs and renders snapshot', async () => {
    const machine = createNavigationStateMachine(
      createHostClientMock({
        engineAdvanceTimeMs: async ({ deltaMs }) =>
          snapshot({ activeCardId: deltaMs >= 100 ? 'done' : 'timed' })
      }),
      'http://seed.test'
    );

    const timed = await machine.applyEngineTimerTick(50);
    expect(timed.activeCardId).toBe('timed');

    const done = await machine.applyEngineTimerTick(100);
    expect(done.activeCardId).toBe('done');
  });
});
