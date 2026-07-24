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
    expect(root?.textContent).toBe('Ready.');
    expect(root?.className).toContain('status-ok');

    el.remove();
  });

  it('exposes the status text as a polite live region for screen readers', async () => {
    if (!customElements.get(TAG)) {
      customElements.define(TAG, WvStatusPanel);
    }
    const el = document.createElement(TAG) as WvStatusPanel;
    document.body.appendChild(el);

    el.setStatus('Ready.', 'ok');
    await el.updateComplete;
    const root = el.shadowRoot?.querySelector<HTMLDivElement>('#status-root');
    expect(root?.getAttribute('aria-live')).toBe('polite');
    expect(root?.getAttribute('role')).toBe('status');

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
    expect(root?.textContent).toBe('Loading...');
    expect(root?.className).toContain('status-loading');

    el.remove();
  });
});
