import { describe, expect, it } from 'vitest';
import { registerBrowserComponents } from './index';

describe('registerBrowserComponents', () => {
  it('defines status component idempotently', () => {
    registerBrowserComponents();
    const first = customElements.get('wv-status-panel');
    expect(first).toBeDefined();

    registerBrowserComponents();
    const second = customElements.get('wv-status-panel');
    expect(second).toBe(first);
  });
});
