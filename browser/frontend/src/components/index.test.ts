import { describe, expect, it } from 'vitest';
import { registerBrowserComponents } from './index';

describe('registerBrowserComponents', () => {
  it('defines components idempotently', () => {
    registerBrowserComponents();
    const firstStatus = customElements.get('wv-status-panel');
    const firstSurface = customElements.get('wv-surface-panel');
    expect(firstStatus).toBeDefined();
    expect(firstSurface).toBeDefined();

    registerBrowserComponents();
    const secondStatus = customElements.get('wv-status-panel');
    const secondSurface = customElements.get('wv-surface-panel');
    expect(secondStatus).toBe(firstStatus);
    expect(secondSurface).toBe(firstSurface);
  });
});
