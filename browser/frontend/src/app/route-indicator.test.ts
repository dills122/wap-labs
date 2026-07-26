import { describe, expect, it } from 'vitest';
import { bindRouteIndicator, deriveRouteLabel } from './route-indicator';

describe('deriveRouteLabel', () => {
  it('labels local mode as local fixtures regardless of url', () => {
    expect(deriveRouteLabel('local', 'http://example.test/start.wml')).toBe('Local fixtures');
    expect(deriveRouteLabel('local', '')).toBe('Local fixtures');
  });

  it('derives the network route from the url host', () => {
    expect(deriveRouteLabel('network', 'wap://localhost/start.wml')).toBe('Network — localhost');
    expect(deriveRouteLabel('network', 'http://gateway.example.test:9200/')).toBe(
      'Network — gateway.example.test:9200'
    );
  });

  it('falls back gracefully for unparseable network urls', () => {
    expect(deriveRouteLabel('network', 'not-a-url')).toBe('Network — not-a-url');
    expect(deriveRouteLabel('network', '')).toBe('Network');
  });
});

describe('bindRouteIndicator', () => {
  const setup = () => {
    const routeLabelEl = document.createElement('span');
    const runModeSelectEl = document.createElement('select');
    for (const value of ['local', 'network']) {
      const option = document.createElement('option');
      option.value = value;
      runModeSelectEl.appendChild(option);
    }
    const fetchUrlInputEl = document.createElement('input');
    return { routeLabelEl, runModeSelectEl, fetchUrlInputEl };
  };

  it('applies the initial label immediately on bind', () => {
    const { routeLabelEl, runModeSelectEl, fetchUrlInputEl } = setup();
    runModeSelectEl.value = 'local';

    bindRouteIndicator(routeLabelEl, runModeSelectEl, fetchUrlInputEl);

    expect(routeLabelEl.textContent).toBe('Local fixtures');
  });

  it('updates when run mode or address changes', () => {
    const { routeLabelEl, runModeSelectEl, fetchUrlInputEl } = setup();
    runModeSelectEl.value = 'local';
    bindRouteIndicator(routeLabelEl, runModeSelectEl, fetchUrlInputEl);

    runModeSelectEl.value = 'network';
    fetchUrlInputEl.value = 'wap://gateway.test/start.wml';
    runModeSelectEl.dispatchEvent(new Event('change'));

    expect(routeLabelEl.textContent).toBe('Network — gateway.test');

    fetchUrlInputEl.value = 'wap://other.test/start.wml';
    fetchUrlInputEl.dispatchEvent(new Event('input'));

    expect(routeLabelEl.textContent).toBe('Network — other.test');
  });

  it('stops updating once unbound', () => {
    const { routeLabelEl, runModeSelectEl, fetchUrlInputEl } = setup();
    runModeSelectEl.value = 'local';
    const unbind = bindRouteIndicator(routeLabelEl, runModeSelectEl, fetchUrlInputEl);

    unbind();
    runModeSelectEl.value = 'network';
    fetchUrlInputEl.value = 'wap://gateway.test/start.wml';
    runModeSelectEl.dispatchEvent(new Event('change'));

    expect(routeLabelEl.textContent).toBe('Local fixtures');
  });
});
