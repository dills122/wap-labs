import { describe, expect, it } from 'vitest';
import { createNavigationStateMachine } from './navigation-state';
import { createHostClientMock, fetchOk, snapshot } from './navigation-state.test-helpers';

describe('navigation-state load behavior', () => {
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
    expect(machine.getHistoryState().entries[0]).toMatchObject({
      url: 'http://example.test/start.wml',
      requestedUrl: 'http://example.test/start.wml',
      method: 'GET',
      source: 'user'
    });
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

  it('allows private destination policy for localhost lab URLs', async () => {
    const requestPolicies: unknown[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) => {
          requestPolicies.push(request.requestPolicy);
          return fetchOk({ finalUrl: request.url });
        }
      }),
      'wap://localhost/'
    );

    await machine.loadTransportUrl({
      url: 'wap://localhost/',
      source: 'user',
      followExternalIntent: false
    });

    expect(requestPolicies[0]).toEqual({
      destinationPolicy: 'allow-private',
      uaCapabilityProfile: 'wap-baseline'
    });
  });

  it('replays host back using stored request method and request policy', async () => {
    const fetchRequests: Array<{
      url: string;
      method: string | undefined;
      headers: Record<string, string | undefined> | undefined;
      requestPolicy: unknown;
    }> = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) => {
          fetchRequests.push({
            url: request.url,
            method: request.method,
            headers: request.headers,
            requestPolicy: request.requestPolicy
          });
          return fetchOk({ finalUrl: request.url });
        },
        engineSnapshot: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }),
        engineNavigateBack: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      headers: {
        Accept: 'text/vnd.wap.wml'
      },
      source: 'user',
      followExternalIntent: false
    });
    await machine.loadTransportUrl({
      url: 'http://example.test/post-target.wml',
      method: 'POST',
      source: 'user',
      followExternalIntent: false,
      requestPolicy: {
        postContext: {
          payload: 'x=1'
        }
      }
    });

    const mode = await machine.navigateBackWithFallback();
    expect(mode).toBe('host');
    expect(fetchRequests.at(-1)).toEqual({
      url: 'http://example.test/start.wml',
      method: 'GET',
      headers: {
        accept: 'text/vnd.wap.wml'
      },
      requestPolicy: { uaCapabilityProfile: 'wap-baseline' }
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

  it('skips render and session-state churn for no-op timer ticks', async () => {
    let renderCount = 0;
    const stateEvents: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        engineRender: async () => {
          renderCount += 1;
          return { draw: [{ type: 'text', x: 0, y: 0, text: 'ok' }] };
        },
        engineAdvanceTimeMs: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })
      }),
      'http://seed.test',
      {
        onStateEvent: (action) => stateEvents.push(action)
      }
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: false
    });
    const renderCountAfterLoad = renderCount;
    const stateEventsAfterLoad = stateEvents.length;

    await machine.applyEngineTimerTick(50);

    expect(renderCount).toBe(renderCountAfterLoad);
    expect(stateEvents.length).toBe(stateEventsAfterLoad);
  });
});
