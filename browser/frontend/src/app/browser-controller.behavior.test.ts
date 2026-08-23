import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FetchResponse, HostSessionState } from '../../../contracts/transport';
import type { BrowserShellRefs } from './browser-shell-template';
import { BrowserController } from './browser-controller';
import { controllerPrivates } from './browser-controller.test-helpers';
import { BrowserPresenter } from './browser-presenter';
import { defaultLocalDeckExample } from './local-examples';
import { fetchOk, frame, renderStub, snapshot } from './navigation-state.test-helpers';
import { WAVES_COPY } from './waves-copy';

const flushAsyncWork = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

const createButton = (id: string): HTMLButtonElement => {
  const button = document.createElement('button');
  button.id = id;
  document.body.append(button);
  return button;
};

const createRefs = (): BrowserShellRefs & { statusMessages: string[] } => {
  document.body.innerHTML = '';
  createButton('btn-health');
  createButton('btn-load-context');
  createButton('btn-fetch-url');
  createButton('btn-reload');
  createButton('btn-stop-navigation');
  createButton('btn-render');
  createButton('btn-up');
  createButton('btn-down');
  createButton('btn-enter');
  createButton('btn-back');
  createButton('btn-snapshot');
  createButton('btn-clear-intent');
  createButton('btn-export-timeline');
  createButton('btn-clear-timeline');
  const navigationPhaseBarEl = document.createElement('section');
  navigationPhaseBarEl.id = 'navigation-phase-bar';
  navigationPhaseBarEl.hidden = true;
  navigationPhaseBarEl.innerHTML = `
    <strong id="navigation-phase-label"></strong>
    <span id="navigation-phase-detail"></span>
    <code id="navigation-correlation-id"></code>
    <div id="navigation-recovery" hidden>
      <strong id="navigation-error-title"></strong>
      <span id="navigation-error-message"></span>
      <button id="btn-navigation-retry"></button>
      <button id="btn-navigation-change-route"></button>
      <button id="btn-navigation-details"></button>
      <button id="btn-navigation-return"></button>
    </div>
  `;
  document.body.append(navigationPhaseBarEl);

  const viewportEl = document.createElement('div');
  viewportEl.tabIndex = -1;
  const snapshotEl = document.createElement('pre');
  const fetchUrlInput = document.createElement('input');
  fetchUrlInput.value = 'http://local.test/start.wml';
  const transportResponseEl = document.createElement('pre');
  const sessionStateEl = document.createElement('pre');
  const timelineEl = document.createElement('pre');
  const activeUrlLabelEl = document.createElement('span');
  const devDrawerEl = document.createElement('details');
  const utilityRailPanelEl = document.createElement('details');
  const toastEl = document.createElement('div');
  const liveAnnouncerEl = document.createElement('div');
  const wmlInput = document.createElement('textarea');
  const baseUrlInput = document.createElement('input');
  const viewportColsInput = document.createElement('input');
  viewportColsInput.value = '20';
  const runModeSelectEl = document.createElement('select');
  const localOption = document.createElement('option');
  localOption.value = 'local';
  runModeSelectEl.append(localOption);
  const networkOption = document.createElement('option');
  networkOption.value = 'network';
  runModeSelectEl.append(networkOption);
  runModeSelectEl.value = 'local';
  const localExampleSelectEl = document.createElement('select');
  const loadLocalBtnEl = document.createElement('button');
  const localExampleWrapEl = document.createElement('label');
  const localExampleNotesEl = document.createElement('details');
  const localExampleCoverageEl = document.createElement('p');
  const localExampleDescriptionEl = document.createElement('p');
  const localExampleGoalEl = document.createElement('p');
  const localExampleTestingAcEl = document.createElement('ul');
  const statusMessages: string[] = [];
  const statusEl = {
    setStatus: (message: string) => {
      statusMessages.push(message);
    }
  } as unknown as BrowserShellRefs['statusEl'];

  return {
    wmlInput,
    baseUrlInput,
    viewportColsInput,
    viewportEl,
    snapshotEl,
    statusEl,
    fetchUrlInput,
    transportResponseEl,
    sessionStateEl,
    timelineEl,
    activeUrlLabelEl,
    devDrawerEl,
    utilityRailPanelEl,
    toastEl,
    liveAnnouncerEl,
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    localExampleWrapEl,
    localExampleNotesEl,
    localExampleCoverageEl,
    localExampleDescriptionEl,
    localExampleGoalEl,
    localExampleTestingAcEl,
    navigationPhaseBarEl,
    statusMessages
  };
};

const initialSession: HostSessionState = {
  runMode: 'local',
  navigationStatus: 'idle',
  requestedUrl: 'http://local.test/start.wml'
};

const createHostClient = () => {
  const defaultExample = defaultLocalDeckExample();
  return {
    health: vi.fn(async () => 'ok'),
    fetchDeck: vi.fn(async (request: { url: string }) => ({
      ok: true,
      status: 200,
      finalUrl: request.url,
      contentType: 'text/vnd.wap.wml',
      wml: '<wml><card id="home"><p>ok</p></card></wml>',
      timingMs: { encode: 0, udpRtt: 0, decode: 0 },
      engineDeckInput: {
        wmlXml: '<wml><card id="home"><p>ok</p></card></wml>',
        baseUrl: request.url,
        contentType: 'text/vnd.wap.wml'
      }
    })),
    cancelFetch: vi.fn(async () => true),
    engineLoadDeck: vi.fn(),
    engineLoadDeckContext: vi.fn(async () => snapshot({ activeCardId: 'home' })),
    engineLoadDeckContextFrame: vi.fn(
      async (request: { baseUrl: string; wmlXml: string; contentType: string }) =>
        frame({
          activeCardId: request.baseUrl === defaultExample.baseUrl ? 'default-home' : 'loaded-home',
          baseUrl: request.baseUrl,
          contentType: request.contentType
        })
    ),
    engineRender: vi.fn(async () => renderStub),
    engineRenderFrame: vi.fn(async () => frame({ activeCardId: 'render-home' })),
    engineHandleKey: vi.fn(async () => snapshot({ activeCardId: 'key-home' })),
    engineHandleKeyFrame: vi.fn(async () => frame({ activeCardId: 'key-home' })),
    engineHandleInputFrame: vi.fn(async ({ event }: { event: { type: string } }) =>
      frame({ activeCardId: event.type === 'key' ? 'key-home' : 'click-home' })
    ),
    engineNavigateToCard: vi.fn(async () => snapshot({ activeCardId: 'card-home' })),
    engineNavigateToCardFrame: vi.fn(async () => frame({ activeCardId: 'card-home' })),
    engineNavigateBack: vi.fn(async () => snapshot({ activeCardId: 'back-home' })),
    engineNavigateBackFrame: vi.fn(async () =>
      frame({ activeCardId: 'back-home', focusedLinkIndex: 0 })
    ),
    engineSetViewportCols: vi.fn(async () => snapshot({ activeCardId: 'viewport-home' })),
    engineAdvanceTimeMs: vi.fn(async () => snapshot({ activeCardId: 'timer-home' })),
    engineAdvanceTimeMsFrame: vi.fn(async () => frame({ activeCardId: 'timer-home' })),
    engineSnapshot: vi.fn(async () => snapshot({ activeCardId: 'snap-home' })),
    engineClearExternalNavigationIntent: vi.fn(async () =>
      snapshot({ activeCardId: 'snap-home', externalNavigationIntent: undefined })
    ),
    engineClearExternalNavigationIntentFrame: vi.fn(async () =>
      frame({ activeCardId: 'snap-home', externalNavigationIntent: undefined })
    ),
    engineBeginFocusedInputEdit: vi.fn(async () => snapshot({ activeCardId: 'edit-home' })),
    engineBeginFocusedInputEditFrame: vi.fn(async () => frame({ activeCardId: 'edit-home' })),
    engineSetFocusedInputEditDraft: vi.fn(async () => snapshot({ activeCardId: 'edit-home' })),
    engineSetFocusedInputEditDraftFrame: vi.fn(async () => frame({ activeCardId: 'edit-home' })),
    engineCommitFocusedInputEdit: vi.fn(async () => snapshot({ activeCardId: 'edit-home' })),
    engineCommitFocusedInputEditFrame: vi.fn(async () => frame({ activeCardId: 'edit-home' })),
    engineCancelFocusedInputEdit: vi.fn(async () => snapshot({ activeCardId: 'edit-home' })),
    engineCancelFocusedInputEditFrame: vi.fn(async () => frame({ activeCardId: 'edit-home' })),
    engineBeginFocusedSelectEdit: vi.fn(async () => snapshot({ activeCardId: 'select-home' })),
    engineBeginFocusedSelectEditFrame: vi.fn(async () => frame({ activeCardId: 'select-home' })),
    engineMoveFocusedSelectEdit: vi.fn(async () => snapshot({ activeCardId: 'select-home' })),
    engineMoveFocusedSelectEditFrame: vi.fn(async () => frame({ activeCardId: 'select-home' })),
    engineCommitFocusedSelectEdit: vi.fn(async () => snapshot({ activeCardId: 'select-home' })),
    engineCommitFocusedSelectEditFrame: vi.fn(async () => frame({ activeCardId: 'select-home' })),
    engineCancelFocusedSelectEdit: vi.fn(async () => snapshot({ activeCardId: 'select-home' })),
    engineCancelFocusedSelectEditFrame: vi.fn(async () => frame({ activeCardId: 'select-home' }))
  };
};

const beginPendingInputDraft = async (
  hostClient: ReturnType<typeof createHostClient>,
  key = '1'
): Promise<() => void> => {
  vi.mocked(hostClient.engineBeginFocusedInputEditFrame).mockResolvedValueOnce(
    frame({
      activeCardId: 'login',
      focusedLinkIndex: 1,
      focusedInputEditName: 'pin',
      focusedInputEditValue: ''
    })
  );

  let resolveDraft: ((value: ReturnType<typeof frame>) => void) | undefined;
  vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveDraft = resolve;
      })
  );

  window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
  await vi.waitFor(() => {
    expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledWith({ value: key });
  });

  return () => {
    if (!resolveDraft) {
      throw new Error('pending input draft was not started');
    }
    resolveDraft(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: key
      })
    );
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

const gatewayTimeoutResponse = (): FetchResponse => ({
  ok: false,
  status: 504,
  finalUrl: 'http://example.test/network.wml',
  contentType: 'text/plain',
  error: { code: 'GATEWAY_TIMEOUT', message: 'gateway timed out' },
  timingMs: { encode: 0, udpRtt: 0, decode: 0 },
  engineDeckInput: undefined
});

const wbxmlDecodeFailureResponse = (url: string): FetchResponse => ({
  ok: false,
  status: 502,
  finalUrl: url,
  contentType: 'application/vnd.wap.wmlc',
  error: { code: 'WBXML_DECODE_FAILED', message: 'WML public ID mismatch' },
  timingMs: { encode: 0, udpRtt: 1, decode: 0 },
  engineDeckInput: undefined
});

describe('BrowserController behavior coverage', () => {
  it('rejects one-over-limit viewport input before IPC and accepts a later valid value', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    refs.viewportColsInput.value = String(2 ** 32);
    await expect(controllerPrivates(controller).setViewportCols()).rejects.toThrow(
      'viewport cols must be an integer from 1 through 4294967295'
    );
    expect(hostClient.engineSetViewportCols).not.toHaveBeenCalled();

    refs.viewportColsInput.value = '20';
    await controllerPrivates(controller).setViewportCols();
    expect(hostClient.engineSetViewportCols).toHaveBeenCalledWith({ cols: 20 });
  });

  it('reports an unrelated action failure without corrupting committed navigation state', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    const committedSession = presenter.getSessionState();
    refs.viewportColsInput.value = '0';

    document.querySelector<HTMLButtonElement>('#btn-load-context')?.click();
    await flushAsyncWork();

    expect(hostClient.engineLoadDeckContextFrame).toHaveBeenCalledTimes(1);
    expect(presenter.getSessionState()).toEqual(committedSession);
    expect(presenter.getSessionState().navigationStatus).toBe('loaded');
    expect(presenter.getSessionState().lastError).toBeUndefined();
    expect(refs.statusMessages.at(-1)).toBe(
      WAVES_COPY.status.error('viewport cols must be an integer from 1 through 4294967295')
    );

    controller.dispose();
  });

  it('reports a current engine navigation failure without changing the committed frame', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    const committedSession = presenter.getSessionState();
    const committedSnapshot = presenter.getSnapshot();
    const committedViewport = refs.viewportEl.innerHTML;
    vi.mocked(hostClient.engineHandleInputFrame).mockRejectedValueOnce(
      new Error('Card id not found')
    );

    document.querySelector<HTMLButtonElement>('#btn-enter')?.click();
    await flushAsyncWork();

    expect(presenter.getSessionState()).toEqual({
      ...committedSession,
      navigationStatus: 'error',
      lastError: 'Card id not found'
    });
    expect(presenter.getSnapshot()).toEqual(committedSnapshot);
    expect(refs.viewportEl.innerHTML).toBe(committedViewport);
    expect(refs.statusMessages.at(-1)).toBe(WAVES_COPY.status.error('Card id not found'));

    controller.dispose();
  });

  it('leaves application shortcuts to the shared command registry', () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const controller = new BrowserController(createHostClient() as never, presenter, refs);

    controllerPrivates(controller).keyboardIntentRouter.handleWindowKeydown(
      new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, shiftKey: true })
    );
    expect(refs.utilityRailPanelEl?.open).toBe(false);
    expect(refs.devDrawerEl.open).toBe(false);

    controller.dispose();
  });

  it('initializes local mode by loading the default local example and populating notes', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');

    const defaultExample = defaultLocalDeckExample();
    expect(hostClient.engineLoadDeckContextFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: defaultExample.baseUrl,
        wmlXml: defaultExample.wml,
        contentType: 'text/vnd.wap.wml'
      })
    );
    expect(refs.localExampleSelectEl.options.length).toBeGreaterThan(0);
    expect(refs.localExampleDescriptionEl.textContent).toContain(defaultExample.description);
    expect(presenter.getSessionState()).toMatchObject({
      runMode: 'local',
      navigationStatus: 'loaded',
      finalUrl: defaultExample.baseUrl
    });
  });

  it('loads raw WML through the bound debug button flow', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineLoadDeckContextFrame).mockClear();
    vi.mocked(hostClient.engineSetViewportCols).mockClear();

    refs.wmlInput.value = '<wml><card id="debug"><p>debug</p></card></wml>';
    refs.baseUrlInput.value = 'http://debug.local/raw.wml';
    document.querySelector<HTMLButtonElement>('#btn-load-context')?.click();
    await flushAsyncWork();

    expect(hostClient.engineLoadDeckContextFrame).toHaveBeenCalledWith({
      wmlXml: refs.wmlInput.value,
      baseUrl: refs.baseUrlInput.value,
      contentType: 'text/vnd.wap.wml'
    });
    expect(presenter.getSessionState()).toMatchObject({
      navigationStatus: 'loaded',
      finalUrl: refs.baseUrlInput.value,
      requestedUrl: refs.baseUrlInput.value
    });
  });

  it('fetches and reloads transport URLs through bound network actions', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
    vi.mocked(hostClient.fetchDeck).mockClear();

    refs.fetchUrlInput.value = 'http://example.test/network.wml';
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await flushAsyncWork();

    expect(hostClient.fetchDeck).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://example.test/network.wml',
        headers: expect.objectContaining({
          Accept: 'text/vnd.wap.wml, application/vnd.wap.wmlc, application/vnd.wap.wml+xml'
        })
      })
    );
    expect(presenter.getSessionState()).toMatchObject({
      runMode: 'network',
      navigationStatus: 'loaded',
      finalUrl: 'http://example.test/network.wml'
    });

    presenter.setSessionState({
      ...presenter.getSessionState(),
      finalUrl: 'http://example.test/reload-target.wml',
      requestedUrl: 'http://example.test/reload-target.wml'
    });
    vi.mocked(hostClient.fetchDeck).mockClear();
    document.querySelector<HTMLButtonElement>('#btn-reload')?.click();
    await flushAsyncWork();

    expect(hostClient.fetchDeck).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://example.test/reload-target.wml'
      })
    );
  });

  it('routes keyboard and control buttons through the unified typed input frame path', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineHandleKeyFrame).mockClear();
    vi.mocked(hostClient.engineHandleInputFrame).mockClear();
    vi.mocked(hostClient.engineRenderFrame).mockClear();

    document.querySelector<HTMLButtonElement>('#btn-up')?.click();
    await flushAsyncWork();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    await flushAsyncWork();

    expect(hostClient.engineHandleInputFrame).toHaveBeenNthCalledWith(1, {
      event: { type: 'key', key: 'up' }
    });
    expect(hostClient.engineHandleInputFrame).toHaveBeenNthCalledWith(2, {
      event: { type: 'key', key: 'down' }
    });
    expect(hostClient.engineHandleKeyFrame).not.toHaveBeenCalled();
    // Typed input returns the committed frame directly; neither source falls
    // back to a redundant engineRenderFrame call.
    expect(hostClient.engineRenderFrame).not.toHaveBeenCalled();
    expect(presenter.getSessionState()).toMatchObject({ activeCardId: 'key-home' });
  });

  it('waits for a pending input draft before a Select button submits the form', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineHandleInputFrame).mockClear();
    vi.mocked(hostClient.engineBeginFocusedInputEditFrame).mockResolvedValueOnce(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: ''
      })
    );

    let resolveDraft: ((value: ReturnType<typeof frame>) => void) | undefined;
    vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDraft = resolve;
        })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', cancelable: true }));
    await vi.waitFor(() => {
      expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledWith({ value: '1' });
    });

    document.querySelector<HTMLButtonElement>('#btn-enter')?.click();
    await Promise.resolve();

    expect(hostClient.engineHandleInputFrame).not.toHaveBeenCalled();

    resolveDraft?.(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: '1'
      })
    );
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();
    await flushAsyncWork();

    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: { type: 'key', key: 'enter' }
    });
  });

  it('waits for a pending input draft before a Canvas click mutates the engine', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    const canvas = refs.viewportEl.querySelector<HTMLCanvasElement>('.viewport-canvas');
    expect(canvas).not.toBeNull();
    if (!canvas) {
      return;
    }
    vi.stubGlobal('CanvasRenderingContext2D', class {});
    vi.spyOn(canvas, 'getContext').mockReturnValue({
      font: '',
      measureText: () => ({ width: 8 })
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 150,
      right: 300,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });
    vi.mocked(hostClient.engineHandleInputFrame).mockClear();
    vi.mocked(hostClient.engineBeginFocusedInputEditFrame).mockResolvedValueOnce(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: ''
      })
    );

    let resolveDraft: ((value: ReturnType<typeof frame>) => void) | undefined;
    vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDraft = resolve;
        })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', cancelable: true }));
    await vi.waitFor(() => {
      expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledWith({ value: '1' });
    });

    canvas.dispatchEvent(
      new MouseEvent('click', { bubbles: true, button: 0, clientX: 11, clientY: 1 })
    );
    await Promise.resolve();

    expect(hostClient.engineHandleInputFrame).not.toHaveBeenCalled();

    resolveDraft?.(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: '1'
      })
    );
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();
    await flushAsyncWork();

    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: {
        type: 'click',
        frameId: 'test-frame',
        x: 1,
        y: 0
      }
    });
  });

  it('waits for a pending input draft before Back navigates', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineNavigateBackFrame).mockClear();
    vi.mocked(hostClient.engineBeginFocusedInputEditFrame).mockResolvedValueOnce(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: ''
      })
    );

    let resolveDraft: ((value: ReturnType<typeof frame>) => void) | undefined;
    vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDraft = resolve;
        })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', cancelable: true }));
    await vi.waitFor(() => {
      expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledWith({ value: '1' });
    });

    document.querySelector<HTMLButtonElement>('#btn-back')?.click();
    await Promise.resolve();

    expect(hostClient.engineNavigateBackFrame).not.toHaveBeenCalled();

    resolveDraft?.(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: '1'
      })
    );
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();
    await flushAsyncWork();

    expect(hostClient.engineNavigateBackFrame).toHaveBeenCalledTimes(1);
  });

  it('waits for a pending input draft before replacing the current deck', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineLoadDeckContextFrame).mockClear();
    vi.mocked(hostClient.engineSetViewportCols).mockClear();
    vi.mocked(hostClient.engineBeginFocusedInputEditFrame).mockResolvedValueOnce(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: ''
      })
    );

    let resolveDraft: ((value: ReturnType<typeof frame>) => void) | undefined;
    vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDraft = resolve;
        })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', cancelable: true }));
    await vi.waitFor(() => {
      expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledWith({ value: '1' });
    });

    document.querySelector<HTMLButtonElement>('#btn-reload')?.click();
    await Promise.resolve();

    expect(hostClient.engineSetViewportCols).not.toHaveBeenCalled();
    expect(hostClient.engineLoadDeckContextFrame).not.toHaveBeenCalled();

    resolveDraft?.(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: '1'
      })
    );
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();
    await flushAsyncWork();

    expect(hostClient.engineLoadDeckContextFrame).toHaveBeenCalledTimes(1);
  });

  it('waits for a pending input draft before opening a Library favorite', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    const favorite = controller.currentFavoriteTarget();
    expect(favorite).toBeDefined();
    if (!favorite) {
      return;
    }
    vi.mocked(hostClient.engineLoadDeckContextFrame).mockClear();
    vi.mocked(hostClient.engineSetViewportCols).mockClear();
    vi.mocked(hostClient.engineBeginFocusedInputEditFrame).mockResolvedValueOnce(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: ''
      })
    );

    let resolveDraft: ((value: ReturnType<typeof frame>) => void) | undefined;
    vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDraft = resolve;
        })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', cancelable: true }));
    await vi.waitFor(() => {
      expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledWith({ value: '1' });
    });

    const opening = controller.openFavoriteTarget(favorite.target);
    await flushAsyncWork();

    expect(hostClient.engineSetViewportCols).not.toHaveBeenCalled();
    expect(hostClient.engineLoadDeckContextFrame).not.toHaveBeenCalled();

    resolveDraft?.(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: '1'
      })
    );
    await opening;

    expect(hostClient.engineLoadDeckContextFrame).toHaveBeenCalledTimes(1);
  });

  it('preserves every character when rapid typing overlaps a slow first draft update', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockClear();
    const releaseFirstDraft = await beginPendingInputDraft(hostClient, '1');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', cancelable: true }));
    await flushAsyncWork();

    expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledTimes(1);

    releaseFirstDraft();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenNthCalledWith(2, {
      value: '12'
    });
  });

  it('waits for a pending input draft before a Canvas wheel mutation', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    const canvas = refs.viewportEl.querySelector<HTMLCanvasElement>('.viewport-canvas');
    expect(canvas).not.toBeNull();
    if (!canvas) {
      return;
    }
    vi.mocked(hostClient.engineHandleInputFrame).mockClear();
    const releaseDraft = await beginPendingInputDraft(hostClient);

    const wheel = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 120
    });
    canvas.dispatchEvent(wheel);
    await Promise.resolve();

    expect(wheel.defaultPrevented).toBe(true);
    expect(hostClient.engineHandleInputFrame).not.toHaveBeenCalled();

    releaseDraft();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: {
        type: 'scroll',
        frameId: 'test-frame',
        deltaRows: 1
      }
    });
  });

  it('waits for a pending input draft before loading raw WML', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineSetViewportCols).mockClear();
    vi.mocked(hostClient.engineLoadDeckContextFrame).mockClear();
    const releaseDraft = await beginPendingInputDraft(hostClient);

    document.querySelector<HTMLButtonElement>('#btn-load-context')?.click();
    await Promise.resolve();

    expect(hostClient.engineSetViewportCols).not.toHaveBeenCalled();
    expect(hostClient.engineLoadDeckContextFrame).not.toHaveBeenCalled();

    releaseDraft();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineLoadDeckContextFrame).toHaveBeenCalledOnce();
  });

  it.each([
    ['Render', '#btn-render'],
    ['Snapshot', '#btn-snapshot']
  ] as const)('waits for a pending input draft before %s', async (_label, selector) => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineRenderFrame).mockClear();
    const releaseDraft = await beginPendingInputDraft(hostClient);

    document.querySelector<HTMLButtonElement>(selector)?.click();
    await Promise.resolve();

    expect(hostClient.engineRenderFrame).not.toHaveBeenCalled();

    releaseDraft();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineRenderFrame).toHaveBeenCalledOnce();
  });

  it('waits for a pending input draft before clearing external navigation intent', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineClearExternalNavigationIntentFrame).mockClear();
    const releaseDraft = await beginPendingInputDraft(hostClient);

    document.querySelector<HTMLButtonElement>('#btn-clear-intent')?.click();
    await Promise.resolve();

    expect(hostClient.engineClearExternalNavigationIntentFrame).not.toHaveBeenCalled();

    releaseDraft();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineClearExternalNavigationIntentFrame).toHaveBeenCalledOnce();
  });

  it('waits for a pending input draft before changing run mode', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    const releaseDraft = await beginPendingInputDraft(hostClient);

    refs.runModeSelectEl.value = 'network';
    refs.runModeSelectEl.dispatchEvent(new Event('change'));
    await Promise.resolve();

    expect(presenter.getSessionState().runMode).toBe('local');

    releaseDraft();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(presenter.getSessionState().runMode).toBe('network');
  });

  it('waits for a pending input draft before starting a network Go action', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
    vi.mocked(hostClient.fetchDeck).mockClear();
    refs.fetchUrlInput.value = 'http://example.test/login.wml';
    const releaseDraft = await beginPendingInputDraft(hostClient);

    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await Promise.resolve();

    expect(hostClient.fetchDeck).not.toHaveBeenCalled();

    releaseDraft();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.fetchDeck).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://example.test/login.wml' })
    );
  });

  it('continues to Select after a queued draft update fails', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineHandleInputFrame).mockClear();
    vi.mocked(hostClient.engineBeginFocusedInputEditFrame).mockResolvedValueOnce(
      frame({
        activeCardId: 'login',
        focusedLinkIndex: 1,
        focusedInputEditName: 'pin',
        focusedInputEditValue: ''
      })
    );
    let rejectDraft: ((error: Error) => void) | undefined;
    vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectDraft = reject;
        })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', cancelable: true }));
    await vi.waitFor(() => {
      expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledOnce();
    });
    document.querySelector<HTMLButtonElement>('#btn-enter')?.click();
    expect(hostClient.engineHandleInputFrame).not.toHaveBeenCalled();

    rejectDraft?.(new Error('draft IPC failed'));
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: { type: 'key', key: 'enter' }
    });
    expect(refs.statusMessages).toContain('Error: draft IPC failed');
  });

  it('serializes rapid repeated Select presses without overlapping engine calls', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    let releaseFirstSelect: (() => void) | undefined;
    vi.mocked(hostClient.engineHandleInputFrame)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseFirstSelect = () => resolve(frame({ activeCardId: 'submitted' }));
          })
      )
      .mockResolvedValue(frame({ activeCardId: 'submitted-again' }));

    document.querySelector<HTMLButtonElement>('#btn-enter')?.click();
    document.querySelector<HTMLButtonElement>('#btn-enter')?.click();
    await vi.waitFor(() => {
      expect(hostClient.engineHandleInputFrame).toHaveBeenCalledTimes(1);
    });

    releaseFirstSelect?.();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledTimes(2);
  });

  it('waits for a pending input draft before explicitly loading a local example', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineSetViewportCols).mockClear();
    vi.mocked(hostClient.engineLoadDeckContextFrame).mockClear();
    const releaseDraft = await beginPendingInputDraft(hostClient);

    refs.loadLocalBtnEl.click();
    await Promise.resolve();

    expect(hostClient.engineSetViewportCols).not.toHaveBeenCalled();
    expect(hostClient.engineLoadDeckContextFrame).not.toHaveBeenCalled();

    releaseDraft();
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineLoadDeckContextFrame).toHaveBeenCalledOnce();
  });

  it('routes a Canvas click as frame-bound logical coordinates without host target lookup', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    const canvas = refs.viewportEl.querySelector<HTMLCanvasElement>('.viewport-canvas');
    expect(canvas).not.toBeNull();
    if (!canvas) {
      return;
    }
    vi.stubGlobal('CanvasRenderingContext2D', class {});
    vi.spyOn(canvas, 'getContext').mockReturnValue({
      font: '',
      measureText: () => ({ width: 8 })
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 150,
      right: 300,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });
    vi.mocked(hostClient.engineHandleInputFrame).mockClear();

    canvas.dispatchEvent(
      new MouseEvent('click', { bubbles: true, button: 0, clientX: 11, clientY: 1 })
    );
    await flushAsyncWork();

    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: {
        type: 'click',
        frameId: 'test-frame',
        x: 1,
        y: 0
      }
    });
    expect(presenter.getSessionState()).toMatchObject({ activeCardId: 'click-home' });
    controller.dispose();
  });

  it('routes a Canvas wheel step through the frame-bound scroll input path', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    const canvas = refs.viewportEl.querySelector<HTMLCanvasElement>('.viewport-canvas');
    expect(canvas).not.toBeNull();
    if (!canvas) {
      return;
    }
    vi.mocked(hostClient.engineHandleInputFrame).mockClear();

    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 });
    canvas.dispatchEvent(event);
    await flushAsyncWork();

    expect(event.defaultPrevented).toBe(true);
    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: {
        type: 'scroll',
        frameId: 'test-frame',
        deltaRows: 1
      }
    });
    controller.dispose();
  });

  it('uses the local back flow when back is triggered in local mode', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    vi.mocked(hostClient.engineNavigateBackFrame).mockResolvedValue(
      frame({
        activeCardId: 'previous-card',
        focusedLinkIndex: 0,
        baseUrl: 'http://local.test/previous.wml',
        lastBackNavigationHandled: true
      })
    );
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    const backBtn = document.querySelector<HTMLButtonElement>('#btn-back');
    // BACK remains accessible even before history exists.
    expect(backBtn?.disabled).toBe(false);
    expect(backBtn?.dataset.historyAvailable).toBe('false');
    document.querySelector<HTMLButtonElement>('#btn-enter')?.click();
    await flushAsyncWork();
    expect(backBtn?.disabled).toBe(false);

    presenter.setSessionState({
      ...presenter.getSessionState(),
      activeCardId: 'current-card',
      focusedLinkIndex: 1
    });
    backBtn?.click();
    await flushAsyncWork();

    expect(hostClient.engineNavigateBackFrame).toHaveBeenCalledTimes(1);
    expect(presenter.getSessionState()).toMatchObject({
      activeCardId: 'previous-card',
      finalUrl: 'http://local.test/previous.wml'
    });
  });

  it('does not re-render when a local-mode back press is a no-op for the engine', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    // The engine reports the exact same card/focus back -- it did not
    // actually navigate anywhere.
    vi.mocked(hostClient.engineNavigateBackFrame).mockResolvedValue(
      frame({
        activeCardId: 'current-card',
        focusedLinkIndex: 1,
        baseUrl: 'http://local.test/current.wml'
      })
    );
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    // Establish forward history before checking the no-op transition.
    document.querySelector<HTMLButtonElement>('#btn-enter')?.click();
    await flushAsyncWork();
    presenter.setSessionState({
      ...presenter.getSessionState(),
      activeCardId: 'current-card',
      focusedLinkIndex: 1
    });
    const drawRenderListSpy = vi.spyOn(presenter, 'drawRenderList');
    const setSnapshotSpy = vi.spyOn(presenter, 'setSnapshot');

    document.querySelector<HTMLButtonElement>('#btn-back')?.click();
    await flushAsyncWork();

    expect(hostClient.engineNavigateBackFrame).toHaveBeenCalledTimes(1);
    // The engine call itself is unavoidable (it's how we detect the no-op),
    // but nothing should be rendered since the engine didn't move anywhere.
    expect(drawRenderListSpy).not.toHaveBeenCalled();
    expect(setSnapshotSpy).not.toHaveBeenCalled();
    expect(refs.statusMessages.at(-1)).toBe(WAVES_COPY.status.navigateBackNone);
    const backBtn = document.querySelector<HTMLButtonElement>('#btn-back');
    expect(backBtn?.disabled).toBe(false);
    expect(backBtn?.dataset.historyAvailable).toBe('false');
  });

  it('marks a keyboard action in-flight synchronously so a concurrent timer tick cannot interleave', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineAdvanceTimeMsFrame).mockClear();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    // The keydown handler enqueues the action synchronously; the in-flight
    // flag must already be set here -- before the queued action has even
    // had a chance to run its own engine IPC call -- so a timer tick
    // landing in this window cannot interleave with it.
    await (
      controller as unknown as { tickEngineTimerRuntime(): Promise<void> }
    ).tickEngineTimerRuntime();
    expect(hostClient.engineAdvanceTimeMsFrame).not.toHaveBeenCalled();

    await flushAsyncWork();

    // Once the queued action has fully completed, ticks are allowed again.
    await (
      controller as unknown as { tickEngineTimerRuntime(): Promise<void> }
    ).tickEngineTimerRuntime();
    expect(hostClient.engineAdvanceTimeMsFrame).toHaveBeenCalledTimes(1);
  });

  it('waits for an in-flight timer tick before applying later user input', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    vi.mocked(hostClient.engineAdvanceTimeMsFrame).mockClear();
    vi.mocked(hostClient.engineHandleInputFrame).mockClear();

    let resolveTimer: ((value: ReturnType<typeof frame>) => void) | undefined;
    vi.mocked(hostClient.engineAdvanceTimeMsFrame).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveTimer = resolve;
        })
    );

    const ticking = controllerPrivates(controller).tickEngineTimerRuntime();
    await vi.waitFor(() => {
      expect(hostClient.engineAdvanceTimeMsFrame).toHaveBeenCalledTimes(1);
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await flushAsyncWork();

    expect(hostClient.engineHandleInputFrame).not.toHaveBeenCalled();

    resolveTimer?.(frame({ activeCardId: 'timer-home' }));
    await ticking;
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: { type: 'key', key: 'up' }
    });
  });

  it('does not tick the network engine while a transport navigation is in flight', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
    await flushAsyncWork();
    vi.mocked(hostClient.engineAdvanceTimeMsFrame).mockClear();

    let resolveFetch: ((response: FetchResponse) => void) | undefined;
    vi.mocked(hostClient.fetchDeck).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );
    refs.fetchUrlInput.value = 'http://example.test/pending.wml';
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await Promise.resolve();
    await Promise.resolve();

    await controllerPrivates(controller).tickEngineTimerRuntime();
    expect(hostClient.engineAdvanceTimeMsFrame).not.toHaveBeenCalled();

    resolveFetch?.({
      ok: true,
      status: 200,
      finalUrl: 'http://example.test/pending.wml',
      contentType: 'text/vnd.wap.wml',
      wml: '<wml><card id="pending"><p>ok</p></card></wml>',
      timingMs: { encode: 0, udpRtt: 0, decode: 0 },
      engineDeckInput: {
        wmlXml: '<wml><card id="pending"><p>ok</p></card></wml>',
        baseUrl: 'http://example.test/pending.wml',
        contentType: 'text/vnd.wap.wml'
      }
    });
    await flushAsyncWork();
  });

  it('does not replay a terminally failed external intent on later timer ticks', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const invokingUrl = 'http://example.test/invoking.wml';
    const targetUrl = 'http://example.test/invalid.wml';
    const changedTargetUrl = 'http://example.test/recovered.wml';
    let timerIntent: string | undefined = targetUrl;
    const invokingSnapshot = snapshot({
      activeCardId: 'invoking-card',
      focusedLinkIndex: 2,
      baseUrl: invokingUrl,
      externalNavigationIntent: targetUrl
    });
    vi.mocked(hostClient.engineLoadDeckContextFrame).mockImplementation(async (request) => {
      if (request.baseUrl === changedTargetUrl) {
        timerIntent = undefined;
        return frame({ activeCardId: 'recovered-card', baseUrl: changedTargetUrl });
      }
      return frame({ activeCardId: 'invoking-card', focusedLinkIndex: 2, baseUrl: invokingUrl });
    });
    vi.mocked(hostClient.engineHandleInputFrame).mockResolvedValue(frame(invokingSnapshot));
    vi.mocked(hostClient.engineAdvanceTimeMsFrame).mockImplementation(async () =>
      frame({
        activeCardId: timerIntent ? 'invoking-card' : 'recovered-card',
        focusedLinkIndex: timerIntent ? 2 : 0,
        baseUrl: timerIntent ? invokingUrl : changedTargetUrl,
        externalNavigationIntent: timerIntent
      })
    );
    vi.mocked(hostClient.fetchDeck).mockImplementation(async (request) =>
      request.url === targetUrl
        ? wbxmlDecodeFailureResponse(request.url)
        : {
            ok: true,
            status: 200,
            finalUrl: request.url,
            contentType: 'text/vnd.wap.wml',
            wml: '<wml><card id="invoking-card"><p>state</p></card></wml>',
            timingMs: { encode: 0, udpRtt: 1, decode: 0 },
            engineDeckInput: {
              wmlXml: '<wml><card id="invoking-card"><p>state</p></card></wml>',
              baseUrl: request.url,
              contentType: 'text/vnd.wap.wml'
            }
          }
    );
    const showToast = vi.spyOn(presenter, 'showToast');
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
    vi.mocked(hostClient.fetchDeck).mockClear();
    vi.mocked(hostClient.engineLoadDeckContextFrame).mockClear();
    showToast.mockClear();

    refs.fetchUrlInput.value = invokingUrl;
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await flushAsyncWork();
    await controllerPrivates(controller).applyEngineKey('enter');

    const stateAfterFailure = presenter.getSessionState();
    const snapshotAfterFailure = presenter.getSnapshot();
    for (let tick = 0; tick < 50; tick += 1) {
      await controllerPrivates(controller).tickEngineTimerRuntime();
    }

    const targetFetches = vi
      .mocked(hostClient.fetchDeck)
      .mock.calls.filter(([request]) => request.url === targetUrl);
    expect(targetFetches).toHaveLength(1);
    expect(hostClient.engineLoadDeckContextFrame).toHaveBeenCalledTimes(1);
    expect(hostClient.engineClearExternalNavigationIntent).not.toHaveBeenCalled();
    expect(presenter.getSessionState()).toEqual(stateAfterFailure);
    expect(presenter.getSnapshot()).toEqual(snapshotAfterFailure);
    expect(stateAfterFailure).toMatchObject({
      navigationStatus: 'error',
      finalUrl: invokingUrl,
      activeCardId: 'invoking-card',
      focusedLinkIndex: 2,
      externalNavigationIntent: targetUrl,
      history: [expect.objectContaining({ url: invokingUrl, activeCardId: 'invoking-card' })]
    });
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(refs.fetchUrlInput.value).toBe(targetUrl);

    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await flushAsyncWork();
    for (let tick = 0; tick < 50; tick += 1) {
      await controllerPrivates(controller).tickEngineTimerRuntime();
    }
    expect(
      vi.mocked(hostClient.fetchDeck).mock.calls.filter(([request]) => request.url === targetUrl)
    ).toHaveLength(2);
    expect(showToast).toHaveBeenCalledTimes(2);

    document.querySelector<HTMLButtonElement>('#btn-reload')?.click();
    await flushAsyncWork();
    for (let tick = 0; tick < 50; tick += 1) {
      await controllerPrivates(controller).tickEngineTimerRuntime();
    }
    expect(
      vi.mocked(hostClient.fetchDeck).mock.calls.filter(([request]) => request.url === targetUrl)
    ).toHaveLength(3);
    expect(showToast).toHaveBeenCalledTimes(3);

    timerIntent = changedTargetUrl;
    await controllerPrivates(controller).tickEngineTimerRuntime();

    expect(
      vi
        .mocked(hostClient.fetchDeck)
        .mock.calls.filter(([request]) => request.url === changedTargetUrl)
    ).toHaveLength(1);
    expect(presenter.getSessionState()).toMatchObject({
      navigationStatus: 'loaded',
      finalUrl: changedTargetUrl,
      activeCardId: 'recovered-card',
      externalNavigationIntent: undefined,
      lastError: undefined
    });

    controller.dispose();
  });

  it('discards an engine key result after its starting run mode changes', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
    await flushAsyncWork();

    let resolveKey: ((value: ReturnType<typeof frame>) => void) | undefined;
    vi.mocked(hostClient.engineHandleInputFrame).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveKey = resolve;
        })
    );
    const applyTimerSnapshot = vi.spyOn(
      controllerPrivates(controller).timerRuntime,
      'applySnapshot'
    );
    const pendingKey = controllerPrivates(controller).applyEngineKey('up');
    await Promise.resolve();
    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: { type: 'key', key: 'up' }
    });

    await controllerPrivates(controller).setRunMode('local', { loadLocalOnEnter: false });
    const activeCardBeforeCompletion = presenter.getSessionState().activeCardId;
    applyTimerSnapshot.mockClear();
    resolveKey?.(
      frame({
        activeCardId: 'stale-key',
        externalNavigationIntent: 'http://example.test/stale-intent.wml'
      })
    );
    await pendingKey;

    expect(presenter.getSessionState()).toMatchObject({
      runMode: 'local',
      activeCardId: activeCardBeforeCompletion
    });
    expect(presenter.getSnapshot()?.activeCardId).not.toBe('stale-key');
    expect(refs.fetchUrlInput.value).not.toBe('http://example.test/stale-intent.wml');
    expect(applyTimerSnapshot).not.toHaveBeenCalled();
  });

  it('discards an engine key failure after its starting run mode changes', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
    await flushAsyncWork();

    let rejectKey: ((reason: Error) => void) | undefined;
    vi.mocked(hostClient.engineHandleInputFrame).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectKey = reject;
        })
    );
    const pendingKey = controllerPrivates(controller).applyEngineKey('enter');
    await Promise.resolve();
    expect(hostClient.engineHandleInputFrame).toHaveBeenCalledWith({
      event: { type: 'key', key: 'enter' }
    });

    await controllerPrivates(controller).setRunMode('local', { loadLocalOnEnter: false });
    const committedSession = presenter.getSessionState();
    rejectKey?.(new Error('stale navigation failure'));
    await expect(pendingKey).resolves.toBeUndefined();

    expect(presenter.getSessionState()).toEqual(committedSession);
    expect(presenter.getSessionState().navigationStatus).toBe('loaded');
    expect(presenter.getSessionState().lastError).toBeUndefined();

    controller.dispose();
  });

  it('clears the frozen skeleton placeholder when the very first deck load fails', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    // Fail the very first engine load (the default local example, loaded
    // during init()) so the skeleton shown for the app's first-ever render
    // never gets replaced by real content.
    vi.mocked(hostClient.engineLoadDeckContextFrame).mockRejectedValue(new Error('boom'));
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await expect(controller.init('<wml><card id="seed"/></wml>')).rejects.toThrow('boom');

    expect(presenter.hasRenderedDeck()).toBe(false);
    // Previously setViewportSkeleton(false) only removed the CSS class,
    // leaving the shimmering bars + "waiting for first render" hint frozen
    // in the viewport forever even though the load already failed.
    expect(refs.viewportEl.querySelector('.skeleton-hint')).toBeNull();
    expect(refs.viewportEl.querySelector('.skeleton-line')).toBeNull();
    expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
  });

  it('shows a toast for a non-transport-unavailable fetch failure kind', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    vi.mocked(hostClient.fetchDeck).mockResolvedValue(gatewayTimeoutResponse() as never);
    const controller = new BrowserController(hostClient as never, presenter, refs);
    await controller.init('<wml><card id="seed"/></wml>');
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });

    refs.fetchUrlInput.value = 'http://example.test/network.wml';
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await flushAsyncWork();

    // Previously only TRANSPORT_UNAVAILABLE reached the toast; other failure
    // kinds (timeout, non-200, malformed payload) only updated the quieter
    // status panel. Every navigation-failure kind must now also toast.
    expect(refs.toastEl.textContent).toBe(WAVES_COPY.status.fetchFailed('gateway timed out'));
    expect(refs.toastEl.className).toBe('toast toast-error');
    // Status panel behavior is preserved, not replaced.
    expect(presenter.getSessionState().lastError).toBe('gateway timed out');
  });

  it('consumes Backspace on a refocused PIN after a failed POST', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    controllerPrivates(controller).timerRuntime.stop();
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
    await flushAsyncWork();

    vi.mocked(hostClient.fetchDeck).mockClear();
    vi.mocked(hostClient.engineNavigateBackFrame).mockClear();
    vi.mocked(hostClient.engineHandleInputFrame).mockResolvedValueOnce(
      frame(
        {
          activeCardId: 'login',
          focusedLinkIndex: 1,
          externalNavigationIntent: 'http://example.test/login',
          externalNavigationRequestPolicy: {
            postContext: {
              sameDeck: false,
              contentType: 'application/x-www-form-urlencoded',
              payload: 'pin='
            }
          }
        },
        { draw: [{ type: 'text', x: 0, y: 0, text: 'PIN: ••••' }] }
      )
    );
    vi.mocked(hostClient.fetchDeck).mockResolvedValueOnce(gatewayTimeoutResponse() as never);

    controllerPrivates(controller).keyboardIntentRouter.handleWindowKeydown(
      new KeyboardEvent('keydown', { key: 'Enter' })
    );
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(hostClient.fetchDeck).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: 'http://example.test/login' })
    );
    expect(presenter.getSessionState().navigationStatus).toBe('error');

    vi.mocked(hostClient.engineBeginFocusedInputEditFrame).mockResolvedValueOnce(
      frame(
        {
          activeCardId: 'login',
          focusedLinkIndex: 1,
          focusedInputEditName: 'pin',
          focusedInputEditValue: '••••'
        },
        { draw: [{ type: 'text', x: 0, y: 0, text: 'PIN: ••••' }] }
      )
    );
    vi.mocked(hostClient.engineSetFocusedInputEditDraftFrame).mockResolvedValueOnce(
      frame(
        {
          activeCardId: 'login',
          focusedLinkIndex: 1,
          focusedInputEditName: 'pin',
          focusedInputEditValue: '•••'
        },
        { draw: [{ type: 'text', x: 0, y: 0, text: 'PIN: •••' }] }
      )
    );

    const backspace = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });
    controllerPrivates(controller).keyboardIntentRouter.handleWindowKeydown(backspace);
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

    expect(backspace.defaultPrevented).toBe(true);
    expect(hostClient.engineBeginFocusedInputEditFrame).toHaveBeenCalledTimes(1);
    expect(hostClient.engineSetFocusedInputEditDraftFrame).toHaveBeenCalledWith({ value: '•••' });
    expect(hostClient.engineNavigateBackFrame).not.toHaveBeenCalled();
    expect(refs.viewportEl.textContent).toBe('PIN: •••');
  });

  it('words a malformed-deck-payload failure distinctly from a network failure', async () => {
    // U2: a fetch that succeeded but returned no usable WML must not read
    // like a network-layer "fetch failed" -- both toast and status text
    // should say "Deck parse failed" instead.
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    vi.mocked(hostClient.fetchDeck).mockResolvedValue({
      ok: true,
      status: 200,
      finalUrl: 'http://example.test/network.wml',
      contentType: 'text/vnd.wap.wml',
      wml: undefined,
      timingMs: { encode: 0, udpRtt: 0, decode: 0 },
      engineDeckInput: undefined
    } as never);
    const controller = new BrowserController(hostClient as never, presenter, refs);
    await controller.init('<wml><card id="seed"/></wml>');
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });

    refs.fetchUrlInput.value = 'http://example.test/network.wml';
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await flushAsyncWork();

    const expectedMessage = WAVES_COPY.status.deckParseFailed(
      'Fetch succeeded but returned no WML payload.'
    );
    expect(refs.toastEl.textContent).toBe(expectedMessage);
    expect(refs.statusMessages.at(-1)).toBe(expectedMessage);
  });

  it('surfaces a WBXML decode failure as a deck parse error', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const targetUrl = 'http://example.test/deck.wmlc';
    vi.mocked(hostClient.fetchDeck).mockResolvedValue(
      wbxmlDecodeFailureResponse(targetUrl) as never
    );
    const controller = new BrowserController(hostClient as never, presenter, refs);
    await controller.init('<wml><card id="seed"/></wml>');
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });

    refs.fetchUrlInput.value = targetUrl;
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await flushAsyncWork();

    const expectedMessage = WAVES_COPY.status.deckParseFailed('WML public ID mismatch');
    expect(refs.toastEl.textContent).toBe(expectedMessage);
    expect(refs.statusMessages.at(-1)).toBe(expectedMessage);
    expect(presenter.getSessionState()).toMatchObject({
      navigationStatus: 'error',
      lastError: 'WML public ID mismatch'
    });
  });

  it('shows a delayed in-progress hint for a slow network navigation but not for the enabling mode-switch load', async () => {
    // U1: repeat navigations (not just the very first render) get an
    // in-progress indicator once they run past the short delay threshold.
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);
      const hostClient = createHostClient();
      const controller = new BrowserController(hostClient as never, presenter, refs);

      await controller.init('<wml><card id="seed"/></wml>');
      // The periodic engine timer tick is irrelevant to this test and its
      // mocked engineAdvanceTimeMsFrame response would otherwise trigger an
      // unrelated re-render mid-delay, incidentally canceling the pending
      // indicator this test is trying to observe.
      controllerPrivates(controller).timerRuntime.stop();
      await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
      // setRunMode kicks off the startup network probe, which also calls
      // hostClient.fetchDeck -- let that settle against the default (fast,
      // successful) mock before installing the pending mock below, so it
      // doesn't steal the mockImplementationOnce meant for the button click.
      await vi.advanceTimersByTimeAsync(0);

      let resolveFetch: (() => void) | undefined;
      vi.mocked(hostClient.fetchDeck).mockImplementationOnce(
        (request: { url: string }) =>
          new Promise((resolve) => {
            resolveFetch = () =>
              resolve({
                ok: true,
                status: 200,
                finalUrl: request.url,
                contentType: 'text/vnd.wap.wml',
                wml: '<wml><card id="home"><p>ok</p></card></wml>',
                timingMs: { encode: 0, udpRtt: 0, decode: 0 },
                engineDeckInput: {
                  wmlXml: '<wml><card id="home"><p>ok</p></card></wml>',
                  baseUrl: request.url,
                  contentType: 'text/vnd.wap.wml'
                }
              });
          })
      );

      refs.fetchUrlInput.value = 'http://example.test/slow.wml';
      document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
      // Flush the microtask/zero-delay-timer chain up to (but not through)
      // the still-pending fetchDeck call, so beginNavigationProgress() has
      // already been invoked and its delay timer scheduled.
      await vi.advanceTimersByTimeAsync(0);

      expect(refs.navigationPhaseBarEl?.hidden).toBe(false);
      expect(refs.navigationPhaseBarEl?.querySelector('#navigation-phase-label')?.textContent).toBe(
        'Connecting'
      );
      expect(document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.textContent).toBe(
        WAVES_COPY.shell.stop
      );

      // Still well under the delay threshold: no indicator yet.
      await vi.advanceTimersByTimeAsync(50);
      expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);

      // Past the delay threshold and the fetch still hasn't resolved.
      await vi.advanceTimersByTimeAsync(200);
      expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(true);
      expect(refs.viewportEl.querySelector('.viewport-navigation-hint')).not.toBeNull();

      resolveFetch?.();
      // Still under fake timers here -- flushAsyncWork's real setTimeout(0)
      // would never fire, so drain via the fake-timer equivalent instead.
      await vi.advanceTimersByTimeAsync(0);

      expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
      expect(refs.viewportEl.querySelector('.viewport-navigation-hint')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('tracks back-button availability from host history in network mode', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
    const backBtn = document.querySelector<HTMLButtonElement>('#btn-back');
    // No page has been fetched yet in this mode -- nothing to go back to.
    expect(backBtn?.disabled).toBe(false);
    expect(backBtn?.dataset.historyAvailable).toBe('false');

    refs.fetchUrlInput.value = 'http://example.test/page-one.wml';
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await flushAsyncWork();
    // Still the first page fetched in this mode -- nothing before it yet.
    expect(backBtn?.disabled).toBe(false);
    expect(backBtn?.dataset.historyAvailable).toBe('false');

    refs.fetchUrlInput.value = 'http://example.test/page-two.wml';
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    await flushAsyncWork();
    expect(backBtn?.disabled).toBe(false);
    expect(backBtn?.dataset.historyAvailable).toBe('true');
  });
});

it('switches Go to Stop only while a network fetch is cancellable', async () => {
  const refs = createRefs();
  const presenter = new BrowserPresenter(refs, initialSession, 20);
  const hostClient = createHostClient();
  const controller = new BrowserController(hostClient as never, presenter, refs);

  await controller.init('<wml><card id="seed"/></wml>');
  controllerPrivates(controller).timerRuntime.stop();
  await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
  await flushAsyncWork();
  vi.mocked(hostClient.fetchDeck).mockClear();

  let resolveFetch: ((response: FetchResponse) => void) | undefined;
  vi.mocked(hostClient.fetchDeck).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
  );
  refs.fetchUrlInput.value = 'http://example.test/coalesced.wml';
  const fetchButton = document.querySelector<HTMLButtonElement>('#btn-fetch-url');
  fetchButton?.click();
  await flushAsyncWork();

  expect(hostClient.fetchDeck).toHaveBeenCalledTimes(1);
  expect(hostClient.cancelFetch).not.toHaveBeenCalled();
  expect(fetchButton?.textContent).toBe(WAVES_COPY.shell.stop);
  expect(fetchButton?.dataset.navigationAction).toBe('stop');

  fetchButton?.click();
  await flushAsyncWork();

  expect(hostClient.cancelFetch).toHaveBeenCalledTimes(1);
  expect(fetchButton?.textContent).toBe(WAVES_COPY.shell.go);
  expect(fetchButton?.dataset.navigationAction).toBe('go');

  resolveFetch?.(fetchOk({ finalUrl: 'http://example.test/coalesced.wml' }));
  await flushAsyncWork();
});

it('retries a categorized failure and keeps the committed frame visible', async () => {
  const refs = createRefs();
  const presenter = new BrowserPresenter(refs, initialSession, 20);
  const hostClient = createHostClient();
  const controller = new BrowserController(hostClient as never, presenter, refs);

  await controller.init('<wml><card id="seed"><p>stable</p></card></wml>');
  controllerPrivates(controller).timerRuntime.stop();
  const committedRender = presenter.getRenderList();
  await controllerPrivates(controller).setRunMode('network', { loadLocalOnEnter: false });
  await flushAsyncWork();
  vi.mocked(hostClient.fetchDeck).mockClear();
  vi.mocked(hostClient.fetchDeck)
    .mockResolvedValueOnce(
      fetchOk({
        ok: false,
        status: 504,
        finalUrl: 'wap://example.test/failing.wml',
        contentType: 'text/plain',
        error: { code: 'GATEWAY_TIMEOUT', message: 'gateway timed out' },
        wml: undefined,
        engineDeckInput: undefined
      }) as Awaited<ReturnType<typeof hostClient.fetchDeck>>
    )
    .mockResolvedValueOnce(
      fetchOk({
        finalUrl: 'wap://example.test/failing.wml'
      }) as Awaited<ReturnType<typeof hostClient.fetchDeck>>
    );

  refs.fetchUrlInput.value = 'wap://example.test/failing.wml';
  document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
  await flushAsyncWork();

  expect(refs.navigationPhaseBarEl?.dataset.navigationState).toBe('error');
  expect(refs.navigationPhaseBarEl?.querySelector('#navigation-error-title')?.textContent).toBe(
    'gateway · GATEWAY_TIMEOUT'
  );
  expect(
    refs.navigationPhaseBarEl?.querySelector('#navigation-correlation-id')?.textContent
  ).toMatch(/^Request waves-navigation-\d+-1$/);
  expect(presenter.getRenderList()).toEqual(committedRender);

  document.querySelector<HTMLButtonElement>('#btn-navigation-retry')?.click();
  await flushAsyncWork();

  expect(hostClient.fetchDeck).toHaveBeenCalledTimes(2);
  expect(vi.mocked(hostClient.fetchDeck).mock.calls[1]?.[0]).toMatchObject({
    url: 'wap://example.test/failing.wml',
    method: 'GET'
  });
  expect(refs.navigationPhaseBarEl?.hidden).toBe(true);
  expect(presenter.getSessionState().navigationStatus).toBe('loaded');
});

it('projects committed local decks and raw debug loads into distinct persistence outcomes', async () => {
  const refs = createRefs();
  const presenter = new BrowserPresenter(refs, initialSession, 20);
  const hostClient = createHostClient();
  const onSafeSessionCommitted = vi.fn();
  const onUnsafeSessionCommitted = vi.fn();
  const controller = new BrowserController(hostClient as never, presenter, refs, {
    onSafeSessionCommitted,
    onUnsafeSessionCommitted
  });

  await controller.init('<wml><card id="seed"/></wml>');
  controllerPrivates(controller).timerRuntime.stop();

  expect(onSafeSessionCommitted).toHaveBeenCalledWith({
    kind: 'local-example',
    exampleId: defaultLocalDeckExample().key,
    fragment: '#default-home'
  });

  document.querySelector<HTMLButtonElement>('#btn-load-context')?.click();
  await flushAsyncWork();

  expect(onUnsafeSessionCommitted).toHaveBeenCalledOnce();

  const safeCommitCount = onSafeSessionCommitted.mock.calls.length;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
  await flushAsyncWork();

  expect(onSafeSessionCommitted).toHaveBeenCalledTimes(safeCommitCount);
  expect(onUnsafeSessionCommitted).toHaveBeenCalledTimes(2);
});
