import type { FetchResponse } from '../../../contracts/transport';
import type {
  EngineFrame,
  EnginePresentationFrame,
  EngineRuntimeSnapshot,
  RenderList
} from '../../../contracts/engine';
import type { NavigationHostClient } from './navigation-state';

export const renderStub: RenderList = {
  draw: [{ type: 'text', x: 0, y: 0, text: 'ok' }]
};

export const presentationStub: EnginePresentationFrame = {
  contractVersion: 1,
  frameId: 'test-frame',
  profileId: 'class-c-reference',
  viewport: { cols: 20 },
  deck: {
    baseUrl: 'http://example.test/start.wml',
    contentType: 'text/vnd.wap.wml'
  },
  card: { id: 'home' },
  rows: [{ index: 0, segments: [{ type: 'text', x: 0, text: 'ok' }] }],
  selection: { type: 'none' },
  affordances: [],
  backAvailable: false
};

export const snapshot = (
  overrides: Partial<EngineRuntimeSnapshot> = {}
): EngineRuntimeSnapshot => ({
  focusedLinkIndex: 0,
  baseUrl: 'http://example.test/start.wml',
  contentType: 'text/vnd.wap.wml',
  browserContextEpoch: 0,
  lastBackNavigationHandled: false,
  lastScriptDialogRequests: [],
  lastScriptTimerRequests: [],
  ...overrides
});

export const frame = (
  snapshotOverrides: Partial<EngineRuntimeSnapshot> = {},
  render: RenderList = renderStub
): EngineFrame => ({
  snapshot: snapshot(snapshotOverrides),
  render,
  presentation: presentationStub
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
        render: await renderForFrame(),
        presentation: presentationStub
      })),
    engineRenderFrame:
      overrides.engineRenderFrame ??
      (async () => ({
        snapshot: await host.engineSnapshot(),
        render: await renderForFrame(),
        presentation: presentationStub
      })),
    engineHandleKeyFrame:
      overrides.engineHandleKeyFrame ??
      (async (request) => ({
        snapshot: await host.engineHandleKey(request),
        render: await renderForFrame(),
        presentation: presentationStub
      })),
    engineNavigateBackFrame:
      overrides.engineNavigateBackFrame ??
      (async () => ({
        snapshot: await host.engineNavigateBack(),
        render: await renderForFrame(),
        presentation: presentationStub
      })),
    engineNavigateToCardFrame:
      overrides.engineNavigateToCardFrame ??
      (async (request) => ({
        snapshot: await host.engineNavigateToCard(request),
        render: await renderForFrame(),
        presentation: presentationStub
      })),
    engineAdvanceTimeMsFrame:
      overrides.engineAdvanceTimeMsFrame ??
      (async (request) => ({
        snapshot: await host.engineAdvanceTimeMs(request),
        render: await renderForFrame(),
        presentation: presentationStub
      })),
    engineClearExternalNavigationIntentFrame:
      overrides.engineClearExternalNavigationIntentFrame ??
      (async () => ({
        snapshot: await host.engineClearExternalNavigationIntent(),
        render: await renderForFrame(),
        presentation: presentationStub
      }))
  };
};
