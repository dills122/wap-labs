import type { FetchResponse } from '../../../contracts/transport';
import type { EngineFrame, EngineRuntimeSnapshot, RenderList } from '../../../contracts/engine';
import type { NavigationHostClient } from './navigation-state';

export const renderStub: RenderList = {
  draw: [{ type: 'text', x: 0, y: 0, text: 'ok' }]
};

export const snapshot = (
  overrides: Partial<EngineRuntimeSnapshot> = {}
): EngineRuntimeSnapshot => ({
  focusedLinkIndex: 0,
  baseUrl: 'http://example.test/start.wml',
  contentType: 'text/vnd.wap.wml',
  lastScriptDialogRequests: [],
  lastScriptTimerRequests: [],
  ...overrides
});

export const frame = (
  snapshotOverrides: Partial<EngineRuntimeSnapshot> = {},
  render: RenderList = renderStub
): EngineFrame => ({
  snapshot: snapshot(snapshotOverrides),
  render
});

export const fetchOk = (overrides: Partial<FetchResponse> = {}): FetchResponse => ({
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

export const createHostClientMock = (
  overrides: Partial<NavigationHostClient> = {}
): NavigationHostClient => {
  const base = {
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
  const host = {
    ...base,
    ...overrides
  };
  const renderForFrame = async (): Promise<RenderList> => host.engineRender();
  return {
    ...host,
    engineLoadDeckContextFrame:
      overrides.engineLoadDeckContextFrame ??
      (async (request) => ({
        snapshot: await host.engineLoadDeckContext(request),
        render: await renderForFrame()
      })),
    engineRenderFrame:
      overrides.engineRenderFrame ??
      (async () => ({
        snapshot: await host.engineSnapshot(),
        render: await renderForFrame()
      })),
    engineHandleKeyFrame:
      overrides.engineHandleKeyFrame ??
      (async (request) => ({
        snapshot: await host.engineHandleKey(request),
        render: await renderForFrame()
      })),
    engineNavigateBackFrame:
      overrides.engineNavigateBackFrame ??
      (async () => ({
        snapshot: await host.engineNavigateBack(),
        render: await renderForFrame()
      })),
    engineNavigateToCardFrame:
      overrides.engineNavigateToCardFrame ??
      (async (request) => ({
        snapshot: await host.engineNavigateToCard(request),
        render: await renderForFrame()
      })),
    engineAdvanceTimeMsFrame:
      overrides.engineAdvanceTimeMsFrame ??
      (async (request) => ({
        snapshot: await host.engineAdvanceTimeMs(request),
        render: await renderForFrame()
      })),
    engineClearExternalNavigationIntentFrame:
      overrides.engineClearExternalNavigationIntentFrame ??
      (async () => ({
        snapshot: await host.engineClearExternalNavigationIntent(),
        render: await renderForFrame()
      }))
  };
};
