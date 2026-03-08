import { describe, expect, it } from 'vitest';
import { defaultRunMode, defaultStartUrl, defaultStartUrlFallback } from './defaults';

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

describe('defaultRunMode', () => {
  it('defaults to local for http targets', () => {
    expect(defaultRunMode(undefined, 'http://example.test/start.wml')).toBe('local');
    expect(defaultRunMode(undefined, 'https://example.test/start.wml')).toBe('local');
  });

  it('defaults to network for wap targets', () => {
    expect(defaultRunMode(undefined, 'wap://example.test/start.wml')).toBe('network');
    expect(defaultRunMode(undefined, 'waps://example.test/start.wml')).toBe('network');
  });

  it('honors explicit configured run mode', () => {
    expect(defaultRunMode('local', 'wap://example.test/start.wml')).toBe('local');
    expect(defaultRunMode('network', 'http://example.test/start.wml')).toBe('network');
  });
});
