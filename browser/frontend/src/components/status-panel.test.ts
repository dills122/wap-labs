import { describe, expect, it } from 'vitest';
import { WvStatusPanel } from './status-panel';

const TAG = 'wv-status-panel-test';

describe('WvStatusPanel', () => {
  it('renders message and tone class via setStatus', async () => {
    if (!customElements.get(TAG)) {
      customElements.define(TAG, WvStatusPanel);
    }
    const el = document.createElement(TAG) as WvStatusPanel;
    document.body.appendChild(el);

    el.setStatus('Ready.', 'ok');
    await el.updateComplete;
    const root = el.shadowRoot?.querySelector<HTMLDivElement>('#status-root');
    expect(root?.textContent?.trim()).toBe('Ready.');
    expect(root?.className).toContain('status-ok');

    el.remove();
  });

  it('keeps status text visual while the shell owns live announcements', async () => {
    if (!customElements.get(TAG)) {
      customElements.define(TAG, WvStatusPanel);
    }
    const el = document.createElement(TAG) as WvStatusPanel;
    document.body.appendChild(el);

    el.setStatus('Ready.', 'ok');
    await el.updateComplete;
    const root = el.shadowRoot?.querySelector<HTMLDivElement>('#status-root');
    expect(root?.hasAttribute('aria-live')).toBe(false);
    expect(root?.hasAttribute('role')).toBe(false);

    el.remove();
  });

  it('reacts to attribute updates', async () => {
    if (!customElements.get(TAG)) {
      customElements.define(TAG, WvStatusPanel);
    }
    const el = document.createElement(TAG) as WvStatusPanel;
    document.body.appendChild(el);

    el.setAttribute('message', 'Loading...');
    el.setAttribute('tone', 'loading');
    await el.updateComplete;
    const root = el.shadowRoot?.querySelector<HTMLDivElement>('#status-root');
    expect(root?.textContent?.trim()).toBe('Loading...');
    expect(root?.className).toContain('status-loading');

    el.remove();
  });
});
