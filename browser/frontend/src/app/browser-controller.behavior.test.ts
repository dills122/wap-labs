import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostSessionState } from '../../../contracts/transport';
import type { BrowserShellRefs } from './browser-shell-template';
import { BrowserController } from './browser-controller';
import { BrowserPresenter } from './browser-presenter';
import { defaultLocalDeckExample } from './local-examples';
import { frame, renderStub, snapshot } from './navigation-state.test-helpers';
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
  createButton('btn-render');
  createButton('btn-up');
  createButton('btn-down');
  createButton('btn-enter');
  createButton('btn-back');
  createButton('btn-snapshot');
  createButton('btn-clear-intent');
  createButton('btn-export-timeline');
  createButton('btn-clear-timeline');

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
  const toastEl = document.createElement('div');
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
    toastEl,
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    localExampleWrapEl,
    localExampleNotesEl,
    localExampleCoverageEl,
    localExampleDescriptionEl,
    localExampleGoalEl,
    localExampleTestingAcEl,
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

afterEach(() => {
  document.body.innerHTML = '';
});

describe('BrowserController behavior coverage', () => {
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
    await (controller as any).setRunMode('network', { loadLocalOnEnter: false });
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

  it('renders directly from the local engine-key frame without a fallback render call', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineHandleKeyFrame).mockClear();
    vi.mocked(hostClient.engineRenderFrame).mockClear();

    document.querySelector<HTMLButtonElement>('#btn-up')?.click();
    await flushAsyncWork();

    expect(hostClient.engineHandleKeyFrame).toHaveBeenCalledTimes(1);
    // applyEngineKey renders using the frame the key handler already
    // returned; it must not fall back to a redundant engineRenderFrame call.
    expect(hostClient.engineRenderFrame).not.toHaveBeenCalled();
    expect(presenter.getSessionState()).toMatchObject({ activeCardId: 'key-home' });
  });

  it('uses the local back flow when back is triggered in local mode', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    vi.mocked(hostClient.engineNavigateBackFrame).mockResolvedValue(
      frame({
        activeCardId: 'previous-card',
        focusedLinkIndex: 0,
        baseUrl: 'http://local.test/previous.wml'
      })
    );
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    presenter.setSessionState({
      ...presenter.getSessionState(),
      activeCardId: 'current-card',
      focusedLinkIndex: 1
    });
    document.querySelector<HTMLButtonElement>('#btn-back')?.click();
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
  });

  it('marks a keyboard action in-flight synchronously so a concurrent timer tick cannot interleave', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const hostClient = createHostClient();
    const controller = new BrowserController(hostClient as never, presenter, refs);

    await controller.init('<wml><card id="seed"/></wml>');
    vi.mocked(hostClient.engineAdvanceTimeMs).mockClear();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    // The keydown handler enqueues the action synchronously; the in-flight
    // flag must already be set here -- before the queued action has even
    // had a chance to run its own engine IPC call -- so a timer tick
    // landing in this window cannot interleave with it.
    await (
      controller as unknown as { tickEngineTimerRuntime(): Promise<void> }
    ).tickEngineTimerRuntime();
    expect(hostClient.engineAdvanceTimeMs).not.toHaveBeenCalled();

    await flushAsyncWork();

    // Once the queued action has fully completed, ticks are allowed again.
    await (
      controller as unknown as { tickEngineTimerRuntime(): Promise<void> }
    ).tickEngineTimerRuntime();
    expect(hostClient.engineAdvanceTimeMs).toHaveBeenCalledTimes(1);
  });
});
