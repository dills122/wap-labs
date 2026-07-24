import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostSessionState } from '../../../contracts/transport';
import type { BrowserShellRefs } from './browser-shell-template';
import { BrowserPresenter } from './browser-presenter';
import { WAVES_COPY } from './waves-copy';

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

  it('clears the frozen skeleton placeholder markup when a first load fails', () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);

    presenter.setViewportSkeleton(true);
    expect(refs.viewportEl.querySelector('.skeleton-hint')).not.toBeNull();

    // First load failed before any deck ever rendered: hiding the skeleton
    // must clear the placeholder markup (shimmering bars + hint text), not
    // just the CSS class, or it stays frozen on screen forever.
    presenter.setViewportSkeleton(false);

    expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
    expect(refs.viewportEl.getAttribute('aria-busy')).toBe('false');
    expect(refs.viewportEl.querySelector('.skeleton-hint')).toBeNull();
    expect(refs.viewportEl.innerHTML).toBe('');
  });

  it('does not touch viewport markup when hiding the skeleton after a successful render', () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);

    presenter.setViewportSkeleton(true);
    presenter.drawRenderList({
      draw: [{ type: 'text', text: 'hello', x: 0, y: 0 }]
    });

    // Redundant setViewportSkeleton(false) calls after a successful render
    // (e.g. from a caller's finally block) must not wipe the real content.
    presenter.setViewportSkeleton(false);

    expect(refs.viewportEl.textContent).toContain('hello');
  });

  it('queues a toast instead of clobbering one that is still showing', () => {
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);

      presenter.showToast('first message', 'error', 1000);
      expect(refs.toastEl.textContent).toBe('first message');
      expect(refs.toastEl.className).toBe('toast toast-error');

      // Fired before the first toast's TTL elapses -- must not clobber it.
      presenter.showToast('second message', 'ok', 1000);
      expect(refs.toastEl.textContent).toBe('first message');

      vi.advanceTimersByTime(1000);
      expect(refs.toastEl.textContent).toBe('second message');
      expect(refs.toastEl.className).toBe('toast toast-ok');

      vi.advanceTimersByTime(1000);
      expect(refs.toastEl.className).toBe('toast toast-hidden');
    } finally {
      vi.useRealTimers();
    }
  });

  it('announces a new script dialog request as a toast', () => {
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);

      presenter.setSnapshot({
        activeCardId: 'home',
        focusedLinkIndex: 0,
        baseUrl: 'http://local.test/start.wml',
        contentType: 'text/vnd.wap.wml',
        lastScriptDialogRequests: [{ type: 'confirm', message: 'Proceed?' }],
        lastScriptTimerRequests: []
      });

      expect(refs.toastEl.textContent).toBe(WAVES_COPY.status.scriptDialogConfirm('Proceed?'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not re-announce the same dialog request across repeated snapshots', () => {
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);
      const baseSnapshot = {
        activeCardId: 'home',
        focusedLinkIndex: 0,
        baseUrl: 'http://local.test/start.wml',
        contentType: 'text/vnd.wap.wml',
        lastScriptDialogRequests: [{ type: 'alert' as const, message: 'Hi' }],
        lastScriptTimerRequests: []
      };

      presenter.setSnapshot(baseSnapshot);
      expect(refs.toastEl.textContent).toBe(WAVES_COPY.status.scriptDialogAlert('Hi'));

      refs.toastEl.textContent = '__unchanged__';
      presenter.setSnapshot({ ...baseSnapshot });

      expect(refs.toastEl.textContent).toBe('__unchanged__');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the first-render skeleton immediately with no delay', () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);

    const endProgress = presenter.beginNavigationProgress();

    // No timers involved for the very first render -- it appears synchronously.
    expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(true);
    expect(refs.viewportEl.querySelector('.skeleton-hint')).not.toBeNull();

    endProgress();
    expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
    expect(refs.viewportEl.innerHTML).toBe('');
  });

  it('does not flash an in-progress indicator for a repeat navigation that resolves within the delay', () => {
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);
      presenter.drawRenderList({ draw: [{ type: 'text', text: 'hello', x: 0, y: 0 }] });

      const endProgress = presenter.beginNavigationProgress(180);
      // Resolves fast (well under the delay threshold).
      vi.advanceTimersByTime(50);
      expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
      expect(refs.viewportEl.querySelector('.viewport-navigation-hint')).toBeNull();

      endProgress();
      expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
      expect(refs.viewportEl.querySelector('.viewport-navigation-hint')).toBeNull();
      // Existing content must never be touched by a navigation that never
      // visibly showed progress.
      expect(refs.viewportEl.textContent).toContain('hello');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a lightweight in-progress hint for a repeat navigation slower than the delay', () => {
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);
      presenter.drawRenderList({ draw: [{ type: 'text', text: 'hello', x: 0, y: 0 }] });

      const endProgress = presenter.beginNavigationProgress(180);
      vi.advanceTimersByTime(180);

      expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(true);
      expect(refs.viewportEl.getAttribute('aria-busy')).toBe('true');
      const hint = refs.viewportEl.querySelector('.viewport-navigation-hint');
      expect(hint).not.toBeNull();
      expect(hint?.textContent).toBe(WAVES_COPY.shell.navigationPending);
      // Existing content must stay on screen underneath the hint.
      expect(refs.viewportEl.textContent).toContain('hello');

      endProgress();
      expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
      expect(refs.viewportEl.querySelector('.viewport-navigation-hint')).toBeNull();
      expect(refs.viewportEl.textContent).toContain('hello');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels a pending in-progress delay if a fresh render arrives first', () => {
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);
      presenter.drawRenderList({ draw: [{ type: 'text', text: 'first', x: 0, y: 0 }] });

      const endProgress = presenter.beginNavigationProgress(180);
      vi.advanceTimersByTime(50);
      presenter.drawRenderList({ draw: [{ type: 'text', text: 'second', x: 0, y: 0 }] });
      vi.advanceTimersByTime(200);

      // The delayed indicator must not appear after the render already landed.
      expect(refs.viewportEl.classList.contains('viewport-skeleton')).toBe(false);
      expect(refs.viewportEl.textContent).toContain('second');

      endProgress();
      expect(refs.viewportEl.textContent).toContain('second');
    } finally {
      vi.useRealTimers();
    }
  });

  it('announces a fatal WMLScript trap as a distinctly worded toast', () => {
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);

      presenter.setSnapshot({
        activeCardId: 'home',
        focusedLinkIndex: 0,
        baseUrl: 'http://local.test/start.wml',
        contentType: 'text/vnd.wap.wml',
        lastScriptDialogRequests: [],
        lastScriptTimerRequests: [],
        lastScriptExecutionOk: false,
        lastScriptExecutionTrap: 'vm: stack overflow (limit=64)',
        lastScriptExecutionErrorClass: 'fatal',
        lastScriptExecutionErrorCategory: 'resource'
      });

      expect(refs.toastEl.textContent).toBe(
        WAVES_COPY.status.scriptExecutionFailed(
          'resource limit error',
          'vm: stack overflow (limit=64)'
        )
      );
      expect(refs.toastEl.className).toBe('toast toast-error');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not re-announce the same sticky script trap across repeated snapshots', () => {
    vi.useFakeTimers();
    try {
      const refs = createRefs();
      const presenter = new BrowserPresenter(refs, initialSession, 20);
      const baseSnapshot = {
        activeCardId: 'home',
        focusedLinkIndex: 0,
        baseUrl: 'http://local.test/start.wml',
        contentType: 'text/vnd.wap.wml',
        lastScriptDialogRequests: [],
        lastScriptTimerRequests: [],
        lastScriptExecutionOk: false,
        lastScriptExecutionTrap: 'vm: type error (expected number)',
        lastScriptExecutionErrorClass: 'fatal',
        lastScriptExecutionErrorCategory: 'computational'
      };

      presenter.setSnapshot(baseSnapshot);
      expect(refs.toastEl.textContent).toBe(
        WAVES_COPY.status.scriptExecutionFailed(
          'computation error',
          'vm: type error (expected number)'
        )
      );

      refs.toastEl.textContent = '__unchanged__';
      // lastScriptExecutionOk is sticky on the engine side -- a later
      // snapshot carrying the exact same trap must not re-toast.
      presenter.setSnapshot({ ...baseSnapshot });

      expect(refs.toastEl.textContent).toBe('__unchanged__');
    } finally {
      vi.useRealTimers();
    }
  });

  it('removes the dev-drawer toggle listener on dispose', () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);

    presenter.patchSessionState({ navigationStatus: 'loaded' });
    presenter.dispose();

    refs.devDrawerEl.open = true;
    refs.devDrawerEl.dispatchEvent(new Event('toggle'));

    // flushDeveloperPanels would normally populate this once the drawer
    // opens; after dispose, the listener is gone so it stays empty.
    expect(refs.sessionStateEl.textContent).toBe('');
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
