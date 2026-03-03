import { describe, expect, it } from 'vitest';
import { defaultStartUrl, defaultStartUrlFallback } from './defaults';

describe('defaultStartUrl', () => {
  it('returns fallback when value is missing or invalid', () => {
    const fallback = defaultStartUrlFallback();
    expect(defaultStartUrl(undefined)).toBe(fallback);
    expect(defaultStartUrl('')).toBe(fallback);
    expect(defaultStartUrl('   ')).toBe(fallback);
    expect(defaultStartUrl('not-a-url')).toBe(fallback);
    expect(defaultStartUrl('ftp://example.test')).toBe(fallback);
  });

  it('accepts supported url schemes', () => {
    expect(defaultStartUrl('http://example.test/start.wml')).toBe('http://example.test/start.wml');
    expect(defaultStartUrl('https://example.test/start.wml')).toBe(
      'https://example.test/start.wml'
    );
    expect(defaultStartUrl('wap://example.test/start.wml')).toBe('wap://example.test/start.wml');
    expect(defaultStartUrl('waps://example.test/start.wml')).toBe('waps://example.test/start.wml');
  });
});
