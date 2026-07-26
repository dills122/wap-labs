import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostSessionState } from '../../../contracts/transport';
import { registerBrowserComponents } from '../components';
import { mountBrowserShell } from './browser-shell-template';
import { BrowserPresenter } from './browser-presenter';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';

const initialSession: HostSessionState = {
  runMode: 'network',
  navigationStatus: 'idle',
  requestedUrl: 'http://example.test/start.wml'
};

const observeAnnouncements = (element: HTMLElement) => {
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((mutations) => records.push(...mutations));
  observer.observe(element, { childList: true });
  return { records, observer };
};

describe('navigation accessibility announcements', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('mounts exactly one live-announcement channel outside visual status and toast surfaces', () => {
    document.body.innerHTML = '<div id="app"></div>';
    registerBrowserComponents();
    const refs = mountBrowserShell('http://example.test/start.wml', 'network');

    const liveChannels = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
    expect(liveChannels).toHaveLength(1);
    expect(liveChannels[0]).toBe(refs.liveAnnouncerEl);
    expect(refs.liveAnnouncerEl.getAttribute('role')).toBe('status');
    expect(refs.liveAnnouncerEl.getAttribute('aria-live')).toBe('polite');
    expect(refs.liveAnnouncerEl.getAttribute('aria-atomic')).toBe('true');
    expect(refs.toastEl.hasAttribute('aria-live')).toBe(false);
    expect(refs.toastEl.hasAttribute('role')).toBe(false);
  });

  it('writes one loading announcement while retaining the visual status state', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    registerBrowserComponents();
    const refs = mountBrowserShell('http://example.test/start.wml', 'network');
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const announcements = observeAnnouncements(refs.liveAnnouncerEl);
    const message = WAVES_COPY.status.loading('http://example.test/start.wml');

    presenter.setStatus(message);
    await Promise.resolve();
    await refs.statusEl.updateComplete;

    expect(announcements.records).toHaveLength(1);
    expect(refs.liveAnnouncerEl.textContent).toBe(message);
    expect(refs.statusEl.shadowRoot?.querySelector('#status-root')?.textContent?.trim()).toBe(
      message
    );
    announcements.observer.disconnect();
    presenter.dispose();
  });

  it('writes one failure announcement while retaining visual status and recovery toast', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="app"></div>';
    registerBrowserComponents();
    const refs = mountBrowserShell('http://example.test/start.wml', 'network');
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    const announcements = observeAnnouncements(refs.liveAnnouncerEl);
    const message = WAVES_COPY.status.fetchFailed('gateway timed out');

    presenter.setStatus(message);
    presenter.showToast(message, 'error', WAVES_CONFIG.toastTtlMs, false);
    await Promise.resolve();
    await refs.statusEl.updateComplete;

    expect(announcements.records).toHaveLength(1);
    expect(refs.liveAnnouncerEl.textContent).toBe(message);
    expect(refs.statusEl.shadowRoot?.querySelector('#status-root')?.textContent?.trim()).toBe(
      message
    );
    expect(refs.toastEl.textContent).toBe(message);
    expect(refs.toastEl.className).toBe('toast toast-error');
    announcements.observer.disconnect();
    presenter.dispose();
  });
});
