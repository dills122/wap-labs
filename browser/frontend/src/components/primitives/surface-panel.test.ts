import { describe, expect, it } from 'vitest';
import { WvSurfacePanel } from './surface-panel';

const TAG = 'wv-surface-panel-test';

describe('WvSurfacePanel', () => {
  it('renders heading and slot content', async () => {
    if (!customElements.get(TAG)) {
      customElements.define(TAG, WvSurfacePanel);
    }
    const el = document.createElement(TAG) as WvSurfacePanel;
    el.heading = 'Runtime';
    el.innerHTML = '<div id="child">hello</div>';
    document.body.appendChild(el);
    await el.updateComplete;

    const heading = el.shadowRoot?.querySelector('.heading');
    const slot = el.shadowRoot?.querySelector('slot');
    expect(heading?.textContent).toBe('Runtime');
    expect(slot).toBeTruthy();

    el.remove();
  });
});
