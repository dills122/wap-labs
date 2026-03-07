import { describe, expect, it } from 'vitest';
import { createNavigationStateMachine } from './navigation-state';
import { createHostClientMock, fetchOk, snapshot } from './navigation-state.test-helpers';

describe('navigation-state history behavior', () => {
  it('keeps host history pointer stable when history-back transport load fails', async () => {
    let callCount = 0;
    const host = createHostClientMock({
      fetchDeck: async (request) => {
        callCount += 1;
        if (callCount === 3) {
          return fetchOk({
            ok: false,
            status: 0,
            finalUrl: request.url,
            contentType: 'text/plain',
            error: { code: 'TRANSPORT_UNAVAILABLE', message: 'offline on back' },
            wml: undefined,
            engineDeckInput: undefined
          });
        }
        return fetchOk({ finalUrl: request.url });
      },
      engineSnapshot: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }),
      engineNavigateBack: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })
    });
    const machine = createNavigationStateMachine(host, 'http://seed.test');

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.loadTransportUrl({
      url: 'http://example.test/b.wml',
      source: 'user',
      followExternalIntent: false
    });
    expect(machine.getHistoryState().index).toBe(1);

    const mode = await machine.navigateBackWithFallback();
    expect(mode).toBe('none');
    expect(machine.getHistoryState().index).toBe(1);
    expect(machine.getSessionState().navigationStatus).toBe('error');
    expect(machine.getSessionState().lastError).toBe('offline on back');
  });

  it('prefers engine back when runtime state changes', async () => {
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) =>
          fetchOk({
            finalUrl: request.url
          }),
        engineSnapshot: async () => snapshot({ activeCardId: 'next', focusedLinkIndex: 0 }),
        engineNavigateBack: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: false
    });

    const mode = await machine.navigateBackWithFallback();
    expect(mode).toBe('engine');
    expect(machine.getHistoryState().index).toBe(0);
    expect(machine.getHistoryState().entries[0]?.activeCardId).toBe('home');
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

  it('restores latest in-deck card snapshot on host-history back', async () => {
    const navigateToCardCalls: string[] = [];
    let loadCount = 0;
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) =>
          fetchOk({
            finalUrl: request.url,
            engineDeckInput: {
              wmlXml: '<wml><card id="home"><p>ok</p></card></wml>',
              baseUrl: request.url,
              contentType: 'text/vnd.wap.wml'
            }
          }),
        engineLoadDeckContext: async (request) => {
          loadCount += 1;
          if (request.baseUrl.includes('/a.wml')) {
            return snapshot({ activeCardId: 'home-a', baseUrl: request.baseUrl });
          }
          return snapshot({ activeCardId: 'home-b', baseUrl: request.baseUrl });
        },
        engineHandleKey: async () =>
          snapshot({ activeCardId: 'details-a', baseUrl: 'http://example.test/a.wml' }),
        engineSnapshot: async () =>
          snapshot({ activeCardId: 'home-b', baseUrl: 'http://example.test/b.wml' }),
        engineNavigateBack: async () =>
          snapshot({ activeCardId: 'home-b', baseUrl: 'http://example.test/b.wml' }),
        engineNavigateToCard: async ({ cardId }) => {
          navigateToCardCalls.push(cardId);
          return snapshot({ activeCardId: cardId, baseUrl: 'http://example.test/a.wml' });
        }
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.applyEngineKey('enter');
    await machine.loadTransportUrl({
      url: 'http://example.test/b.wml',
      source: 'user',
      followExternalIntent: false
    });

    expect(machine.getHistoryState().entries[0]?.activeCardId).toBe('details-a');

    const mode = await machine.navigateBackWithFallback();
    expect(mode).toBe('host');
    expect(navigateToCardCalls).toEqual(['details-a']);
    expect(machine.getSessionState().activeCardId).toBe('details-a');
    expect(machine.getHistoryState().index).toBe(0);
    expect(loadCount).toBe(3);
  });

  it('commits restored card id into history entry during host-history back', async () => {
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) =>
          fetchOk({
            finalUrl: request.url,
            engineDeckInput: {
              wmlXml: '<wml><card id="home"><p>ok</p></card></wml>',
              baseUrl: request.url,
              contentType: 'text/vnd.wap.wml'
            }
          }),
        engineLoadDeckContext: async (request) => {
          if (request.baseUrl.includes('/a.wml')) {
            return snapshot({ activeCardId: 'home-a', baseUrl: request.baseUrl });
          }
          return snapshot({ activeCardId: 'home-b', baseUrl: request.baseUrl });
        },
        engineSnapshot: async () =>
          snapshot({ activeCardId: 'home-b', baseUrl: 'http://example.test/b.wml' }),
        engineNavigateBack: async () =>
          snapshot({ activeCardId: 'home-b', baseUrl: 'http://example.test/b.wml' })
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.loadTransportUrl({
      url: 'http://example.test/b.wml',
      source: 'user',
      followExternalIntent: false
    });

    const previousEntry = machine.getHistoryState().entries[0];
    if (!previousEntry) {
      throw new Error('expected first history entry');
    }
    previousEntry.activeCardId = undefined;

    const mode = await machine.navigateBackWithFallback();
    expect(mode).toBe('host');
    expect(machine.getHistoryState().index).toBe(0);
    expect(machine.getHistoryState().entries[0]?.activeCardId).toBe('home-a');
    expect(machine.getSessionState().activeCardId).toBe('home-a');
  });

  it('emits deterministic state-event order for host-history back fallback', async () => {
    const events: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) =>
          fetchOk({
            finalUrl: request.url
          }),
        engineSnapshot: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }),
        engineNavigateBack: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })
      }),
      'http://seed.test',
      {
        onStateEvent: (action) => events.push(action)
      }
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.loadTransportUrl({
      url: 'http://example.test/b.wml',
      source: 'user',
      followExternalIntent: false
    });

    events.length = 0;
    const mode = await machine.navigateBackWithFallback();

    expect(mode).toBe('host');
    expect(events).toContain('load-transport-url');
    expect(events).toContain('fetch-deck-response');
    expect(events).toContain('host-history-back');
    expect(events.indexOf('load-transport-url')).toBeLessThan(events.indexOf('host-history-back'));
    expect(events.indexOf('fetch-deck-response')).toBeLessThan(events.indexOf('host-history-back'));
  });
});
