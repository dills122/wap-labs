import { describe, expect, it } from 'vitest';
import { isNetworkUnavailableErrorCode, isProbeReachable } from './network';

describe('app/network', () => {
  it('detects network-unavailable transport codes', () => {
    expect(isNetworkUnavailableErrorCode('TRANSPORT_UNAVAILABLE')).toBe(true);
    expect(isNetworkUnavailableErrorCode('GATEWAY_TIMEOUT')).toBe(true);
    expect(isNetworkUnavailableErrorCode('PROTOCOL_ERROR')).toBe(false);
    expect(isNetworkUnavailableErrorCode(undefined)).toBe(false);
  });

  it('treats successful responses as reachable', () => {
    expect(
      isProbeReachable({
        ok: true,
        status: 200,
        finalUrl: 'http://local.test/',
        contentType: 'text/vnd.wap.wml',
        timingMs: { encode: 1, udpRtt: 1, decode: 1 }
      })
    ).toBe(true);
  });

  it('treats explicit transport timeout/unavailable as unreachable', () => {
    expect(
      isProbeReachable({
        ok: false,
        status: 503,
        finalUrl: 'http://local.test/',
        contentType: '',
        error: {
          code: 'TRANSPORT_UNAVAILABLE',
          message: 'offline'
        },
        timingMs: { encode: 1, udpRtt: 1, decode: 1 }
      })
    ).toBe(false);
  });

  it('does not mistake a preflight policy rejection for gateway reachability', () => {
    expect(
      isProbeReachable({
        ok: false,
        status: 400,
        finalUrl: 'wap://localhost/',
        contentType: 'text/plain',
        error: {
          code: 'INVALID_REQUEST',
          message: 'private destinations are blocked'
        },
        timingMs: { encode: 0, udpRtt: 0, decode: 0 }
      })
    ).toBe(false);
  });

  it('treats an upstream error response as evidence that an endpoint answered', () => {
    expect(
      isProbeReachable({
        ok: false,
        status: 500,
        finalUrl: 'http://local.test/',
        contentType: '',
        error: {
          code: 'PROTOCOL_ERROR',
          message: 'upstream failure'
        },
        timingMs: { encode: 1, udpRtt: 1, decode: 1 }
      })
    ).toBe(true);
  });
});
