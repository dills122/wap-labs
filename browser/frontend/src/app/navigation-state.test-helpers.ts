import type { FetchResponse } from '../../../contracts/transport';
import type { EngineRuntimeSnapshot, RenderList } from '../../../contracts/engine';
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
