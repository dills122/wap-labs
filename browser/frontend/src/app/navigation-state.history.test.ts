import { describe, expect, it } from 'vitest';
import { createNavigationStateMachine } from './navigation-state';
import { createHostClientMock, fetchOk, frame, snapshot } from './navigation-state.test-helpers';

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
        engineNavigateBackFrame: async () =>
          frame({
            activeCardId: 'home',
            focusedLinkIndex: 0,
            lastBackNavigationHandled: true
          })
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

  it('treats engine back as handled when runtime context changes without card or focus change', async () => {
    const fetchCalls: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) => {
          fetchCalls.push(request.url);
          return fetchOk({ finalUrl: request.url });
        },
        engineSnapshot: async () =>
          snapshot({
            activeCardId: 'home',
            focusedLinkIndex: 0,
            baseUrl: 'http://example.test/flow-b.wml'
          }),
        engineNavigateBackFrame: async () =>
          frame({
            activeCardId: 'home',
            focusedLinkIndex: 0,
            baseUrl: 'http://example.test/flow-a.wml',
            lastBackNavigationHandled: true
          })
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });

    const mode = await machine.navigateBackWithFallback();

    expect(mode).toBe('engine');
    expect(fetchCalls).toEqual(['http://example.test/a.wml']);
    expect(machine.getSessionState().activeCardId).toBe('home');
    expect(machine.getSessionState().finalUrl).toBe('http://example.test/a.wml');
  });

  it('trusts the engine back result when a WML prev override leaves the snapshot unchanged', async () => {
    const machine = createNavigationStateMachine(
      createHostClientMock({
        engineSnapshot: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }),
        engineNavigateBackFrame: async () =>
          frame({
            activeCardId: 'home',
            focusedLinkIndex: 0,
            lastBackNavigationHandled: true
          })
      }),
      'http://seed.test'
    );

    const mode = await machine.navigateBackWithFallback();

    expect(mode).toBe('engine');
    expect(machine.getSessionState().activeCardId).toBe('home');
  });

  it('falls back to host history when engine back is a no-op', async () => {
    const fetchCalls: string[] = [];
    let renderCount = 0;
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) => {
          fetchCalls.push(request.url);
          return fetchOk({
            finalUrl: request.url
          });
        },
        engineRender: async () => {
          renderCount += 1;
          return { draw: [{ type: 'text', x: 0, y: 0, text: 'ok' }] };
        },
        engineSnapshot: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }),
        engineNavigateBackFrame: async () => frame({ activeCardId: 'home', focusedLinkIndex: 0 })
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
    expect(renderCount).toBe(3);
  });

  it('does not emit duplicate session updates when back navigation is a no-op', async () => {
    const sessions: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) =>
          fetchOk({
            finalUrl: request.url
          }),
        engineSnapshot: async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }),
        engineNavigateBackFrame: async () => frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      }),
      'http://seed.test',
      {
        onSessionState: (session) => sessions.push(JSON.stringify(session))
      }
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });

    const countAfterLoad = sessions.length;
    const mode = await machine.navigateBackWithFallback();

    expect(mode).toBe('none');
    expect(sessions.length).toBe(countAfterLoad);
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
        engineNavigateBackFrame: async () =>
          frame({ activeCardId: 'home-b', baseUrl: 'http://example.test/b.wml' }),
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

    expect(machine.getHistoryState().entries.map((entry) => entry.activeCardId)).toEqual([
      'home-a',
      'details-a',
      'home-b'
    ]);

    const mode = await machine.navigateBackWithFallback();
    expect(mode).toBe('host');
    expect(navigateToCardCalls).toEqual(['details-a']);
    expect(machine.getSessionState().activeCardId).toBe('details-a');
    expect(machine.getHistoryState().index).toBe(1);
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
        engineNavigateBackFrame: async () =>
          frame({ activeCardId: 'home-b', baseUrl: 'http://example.test/b.wml' })
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
        engineNavigateBackFrame: async () => frame({ activeCardId: 'home', focusedLinkIndex: 0 })
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

  it('keeps duplicate explicit URL accesses as separate history entries', async () => {
    const machine = createNavigationStateMachine(createHostClientMock(), 'http://seed.test');

    await machine.loadTransportUrl({
      url: 'http://example.test/repeat.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.loadTransportUrl({
      url: 'http://example.test/repeat.wml',
      source: 'user',
      followExternalIntent: false
    });

    expect(machine.getHistoryState().entries).toHaveLength(2);
    expect(machine.getHistoryState().index).toBe(1);
  });

  it('preserves every same-deck card access across a cross-deck round trip', async () => {
    const navigationUrls: Array<string | undefined> = [];
    const cardTransitions = ['a-2', 'a-3'];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) =>
          fetchOk({
            finalUrl: request.url,
            engineDeckInput: {
              wmlXml: '<wml><card id="a-1"><p>ok</p></card></wml>',
              baseUrl: request.url,
              contentType: 'text/vnd.wap.wml'
            }
          }),
        engineLoadDeckContextFrame: async (request) => {
          navigationUrls.push(request.navigationUrl);
          const fragment = request.navigationUrl
            ? new URL(request.navigationUrl).hash.slice(1)
            : '';
          const activeCardId = fragment || (request.baseUrl.includes('/b.wml') ? 'b-1' : 'a-1');
          return frame({ activeCardId, baseUrl: request.baseUrl, browserContextEpoch: 1 });
        },
        engineHandleKeyFrame: async () =>
          frame({
            activeCardId: cardTransitions.shift() ?? 'a-3',
            baseUrl: 'http://example.test/a.wml',
            browserContextEpoch: 1
          }),
        engineNavigateBackFrame: async () =>
          frame({
            activeCardId: machine.getSessionState().activeCardId,
            baseUrl: machine.getSessionState().finalUrl,
            browserContextEpoch: 1,
            lastBackNavigationHandled: false
          })
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.applyEngineKey('enter');
    await machine.applyEngineKey('enter');
    await machine.loadTransportUrl({
      url: 'http://example.test/b.wml',
      source: 'external-intent',
      followExternalIntent: false
    });

    expect(machine.getHistoryState().entries.map((entry) => entry.activeCardId)).toEqual([
      'a-1',
      'a-2',
      'a-3',
      'b-1'
    ]);
    expect(await machine.navigateBackWithFallback()).toBe('host');
    expect(machine.getSessionState().activeCardId).toBe('a-3');
    expect(await machine.navigateBackWithFallback()).toBe('host');
    expect(machine.getSessionState().activeCardId).toBe('a-2');
    expect(await machine.navigateBackWithFallback()).toBe('host');
    expect(machine.getSessionState().activeCardId).toBe('a-1');
    expect(navigationUrls.slice(-3)).toEqual([
      'http://example.test/a.wml#a-3',
      'http://example.test/a.wml#a-2',
      'http://example.test/a.wml#a-1'
    ]);
  });

  it('preserves a duplicate same-card access across a cross-deck round trip', async () => {
    let loadCount = 0;
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: async (request) =>
          fetchOk({
            finalUrl: request.url,
            engineDeckInput: {
              wmlXml: '<wml><card id="a"><p>ok</p></card></wml>',
              baseUrl: request.url,
              contentType: 'text/vnd.wap.wml'
            }
          }),
        engineLoadDeckContextFrame: async (request) => {
          loadCount += 1;
          return frame({
            activeCardId: request.baseUrl.includes('/b.wml') ? 'b' : 'a',
            baseUrl: request.baseUrl,
            browserContextEpoch: 1,
            historyPushSequence: loadCount === 1 ? 0 : 3
          });
        },
        engineHandleKeyFrame: async () =>
          frame({
            activeCardId: 'a',
            baseUrl: 'http://example.test/a.wml',
            browserContextEpoch: 1,
            historyPushSequence: 1
          }),
        engineHandleInputFrame: async () =>
          frame({
            activeCardId: 'a',
            baseUrl: 'http://example.test/a.wml',
            browserContextEpoch: 1,
            historyPushSequence: 2
          }),
        engineAdvanceTimeMsFrame: async () =>
          frame({
            activeCardId: 'a',
            baseUrl: 'http://example.test/a.wml',
            browserContextEpoch: 1,
            historyPushSequence: 3
          }),
        engineNavigateBackFrame: async () =>
          frame({
            activeCardId: machine.getSessionState().activeCardId,
            baseUrl: machine.getSessionState().finalUrl,
            browserContextEpoch: 1,
            lastBackNavigationHandled: false
          })
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.applyEngineKey('enter');
    await machine.applyEngineInput({
      type: 'activate-action',
      frameId: 'frame-a',
      actionId: 'do:repeat'
    });
    await machine.applyEngineTimerTick(100);
    await machine.loadTransportUrl({
      url: 'http://example.test/b.wml',
      source: 'external-intent',
      followExternalIntent: false
    });

    expect(machine.getHistoryState().entries.map((entry) => entry.activeCardId)).toEqual([
      'a',
      'a',
      'a',
      'a',
      'b'
    ]);
    expect(await machine.navigateBackWithFallback()).toBe('host');
    expect(machine.getSessionState().activeCardId).toBe('a');
    expect(await machine.navigateBackWithFallback()).toBe('host');
    expect(machine.getSessionState().activeCardId).toBe('a');
    expect(await machine.navigateBackWithFallback()).toBe('host');
    expect(machine.getSessionState().activeCardId).toBe('a');
    expect(await machine.navigateBackWithFallback()).toBe('host');
    expect(machine.getSessionState().activeCardId).toBe('a');
  });

  it('keeps host history synchronized when engine back pops a same-deck card', async () => {
    const backCards = ['a-2', 'a-1'];
    const cardTransitions = ['a-2', 'a-3'];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        engineLoadDeckContextFrame: async () =>
          frame({ activeCardId: 'a-1', browserContextEpoch: 1 }),
        engineHandleKeyFrame: async () =>
          frame({ activeCardId: cardTransitions.shift() ?? 'a-3', browserContextEpoch: 1 }),
        engineNavigateBackFrame: async () =>
          frame({
            activeCardId: backCards.shift() ?? 'a-1',
            browserContextEpoch: 1,
            lastBackNavigationHandled: true
          })
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/a.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.applyEngineKey('enter');
    await machine.applyEngineKey('enter');

    expect(await machine.navigateBackWithFallback()).toBe('engine');
    expect(machine.getHistoryState().index).toBe(1);
    expect(await machine.navigateBackWithFallback()).toBe('engine');
    expect(machine.getHistoryState().index).toBe(0);
  });

  it('resets host history to the current card after same-deck newcontext', async () => {
    const unchangedFreshFrame = frame({
      activeCardId: 'fresh',
      browserContextEpoch: 2,
      historyPushSequence: 1
    });
    const contextFrames = [
      frame({
        activeCardId: 'fresh',
        browserContextEpoch: 2,
        historyPushSequence: 1
      }),
      unchangedFreshFrame
    ];
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
        engineLoadDeckContextFrame: async () =>
          frame({
            activeCardId: 'home',
            browserContextEpoch: 1,
            historyPushSequence: 0
          }),
        engineHandleKeyFrame: async () => contextFrames.shift() ?? unchangedFreshFrame
      }),
      'http://seed.test'
    );

    await machine.loadTransportUrl({
      url: 'http://example.test/context.wml',
      source: 'user',
      followExternalIntent: false
    });
    await machine.applyEngineKey('enter');
    await machine.applyEngineKey('down');

    expect(machine.getHistoryState()).toEqual({
      entries: [
        expect.objectContaining({
          url: 'http://example.test/context.wml',
          activeCardId: 'fresh'
        })
      ],
      index: 0
    });
  });
});
