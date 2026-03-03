import { describe, expect, it } from 'vitest';
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
    toastEl
  };
};

const initialSession: HostSessionState = {
  navigationStatus: 'idle',
  requestedUrl: 'http://127.0.0.1:3000/'
};

describe('BrowserPresenter', () => {
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
});
