import { describe, expect, it } from 'vitest';
import { mapRenderListToLines, renderWmlViewportHtml } from './wml-render-primitives';

describe('wml-render-primitives', () => {
  it('maps draw commands into deterministic y-sorted lines', () => {
    const lines = mapRenderListToLines({
      draw: [
        { type: 'text', x: 0, y: 2, text: 'tail' },
        { type: 'link', x: 0, y: 1, text: 'Go', focused: true, href: '#next' },
        { type: 'text', x: 0, y: 1, text: 'Head' }
      ]
    });

    expect(lines.map((line) => line.y)).toEqual([1, 2]);
    expect(lines[0]?.segments.map((segment) => `${segment.kind}:${segment.text}`)).toEqual([
      'link:Go',
      'text:Head'
    ]);
    expect(lines[0]?.segments[0]?.focused).toBe(true);
  });

  it('renders focused links and escapes text content', () => {
    const html = renderWmlViewportHtml({
      draw: [{ type: 'link', x: 0, y: 0, text: '<unsafe>', focused: true, href: '#home' }]
    });

    expect(html).toContain('wml-segment-link');
    expect(html).toContain('is-focused');
    expect(html).toContain('&lt;unsafe&gt;');
  });
});
