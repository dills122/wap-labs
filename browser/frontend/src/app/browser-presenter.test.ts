import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostSessionState } from '../../../contracts/transport';
import type { BrowserShellRefs } from './browser-shell-template';
import { BrowserPresenter } from './browser-presenter';

const createRefs = (): BrowserShellRefs => {
  const viewportEl = document.createElement('div');
  const snapshotEl = document.createElement('pre');
  const fetchUrlInput = document.createElement('input');
  const transportResponseEl = document.createElement('pre');
  const sessionStateEl = document.createElement('pre');
  const timelineEl = document.createElement('pre');
  const activeUrlLabelEl = document.createElement('span');
  const devDrawerEl = document.createElement('details');
  const toastEl = document.createElement('div');
  const wmlInput = document.createElement('textarea');
  const baseUrlInput = document.createElement('input');
  const viewportColsInput = document.createElement('input');
  const runModeSelectEl = document.createElement('select');
  const localExampleSelectEl = document.createElement('select');
  const loadLocalBtnEl = document.createElement('button');
  const localExampleWrapEl = document.createElement('label');
  const localExampleNotesEl = document.createElement('details');
  const localExampleCoverageEl = document.createElement('p');
  const localExampleDescriptionEl = document.createElement('p');
  const localExampleGoalEl = document.createElement('p');
  const localExampleTestingAcEl = document.createElement('ul');
  const statusEl = {
    setStatus: () => {
      // no-op
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
    localExampleTestingAcEl
  };
};

const initialSession: HostSessionState = {
  runMode: 'local',
  navigationStatus: 'idle',
  requestedUrl: 'http://127.0.0.1:3000/'
};

describe('BrowserPresenter', () => {
  let createObjectUrlSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectUrlSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  afterEach(() => {
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('sets boot phase on document body', () => {
    const presenter = new BrowserPresenter(createRefs(), initialSession, 20);
    presenter.setBootPhase('engine-ready');
    expect(document.body.getAttribute('data-boot-phase')).toBe('engine-ready');
  });

  it('clears viewport skeleton after first render', () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);

    presenter.setViewportSkeleton(true);
    expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(true);
    expect(refs.viewportEl.getAttribute('aria-busy')).toBe('true');

    presenter.drawRenderList({
      draw: [{ type: 'text', text: 'hello', x: 0, y: 0 }]
    });

    expect(presenter.hasRenderedDeck()).toBe(true);
    expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
    expect(refs.viewportEl.getAttribute('aria-busy')).toBe('false');
    expect(refs.viewportEl.textContent).toContain('hello');
  });

  it('does not append timeline entries when replacing session state directly', () => {
    const presenter = new BrowserPresenter(createRefs(), initialSession, 20);
    presenter.patchSessionState({ navigationStatus: 'loaded' });
    expect(presenter.timelineLength()).toBe(1);

    presenter.setSessionState({
      ...presenter.getSessionState(),
      activeCardId: 'login',
      focusedLinkIndex: 0
    });
    expect(presenter.timelineLength()).toBe(1);
  });

  it('only flushes developer panel state when the drawer is open', () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);

    presenter.setSessionState({
      ...initialSession,
      navigationStatus: 'loaded',
      finalUrl: 'http://local.test/start.wml'
    });
    presenter.setSnapshot({
      activeCardId: 'home',
      focusedLinkIndex: 0,
      baseUrl: 'http://local.test/start.wml',
      contentType: 'text/vnd.wap.wml',
      lastScriptDialogRequests: [],
      lastScriptTimerRequests: []
    });
    presenter.setTransportResponse({
      ok: true,
      status: 200,
      finalUrl: 'http://local.test/start.wml',
      contentType: 'text/vnd.wap.wml',
      wml: '<wml/>',
      timingMs: { encode: 0, udpRtt: 1, decode: 0 },
      engineDeckInput: undefined
    });

    expect(refs.sessionStateEl.textContent).toBe('');
    expect(refs.snapshotEl.textContent).toBe('');
    expect(refs.transportResponseEl.textContent).toBe('');

    refs.devDrawerEl.open = true;
    refs.devDrawerEl.dispatchEvent(new Event('toggle'));

    expect(refs.sessionStateEl.textContent).toContain('"navigationStatus": "loaded"');
    expect(refs.snapshotEl.textContent).toContain('"activeCardId": "home"');
    expect(refs.transportResponseEl.textContent).toContain('"status": 200');
    expect(refs.activeUrlLabelEl.textContent).toBe('http://local.test/start.wml');
  });

  it('exports timeline data through a blob download', () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    refs.devDrawerEl.open = true;

    presenter.patchSessionState({ navigationStatus: 'loaded', activeCardId: 'home' });
    presenter.recordTimeline('load', 'start', { url: 'http://local.test/start.wml' });
    presenter.recordTimeline('render', 'state', { count: 1 });

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    presenter.exportTimeline();

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:test');

    clickSpy.mockRestore();
  });
});
