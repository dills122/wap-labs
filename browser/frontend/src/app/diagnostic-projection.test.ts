import { describe, expect, it } from 'vitest';
import type { EngineRuntimeSnapshot } from '../../../contracts/engine';
import type { FetchResponse, HostSessionState } from '../../../contracts/transport';
import {
  DIAGNOSTIC_PROJECTION_LIMITS,
  projectDiagnosticUrl,
  projectRuntimeSnapshot,
  projectSessionState,
  projectTimelineDetails,
  projectTransportResponse
} from './diagnostic-projection';

const SECRET_VALUES = [
  'userinfo-secret',
  'pin-0000',
  'password-hunter2',
  'typed-post-secret',
  'legacy-payload-secret',
  'authorization-secret',
  'cookie-secret',
  'proxy-authorization-secret',
  'raw-wml-secret',
  'raw-bytes-secret',
  'internal-error-secret',
  'dialog-secret',
  'timer-token-secret'
] as const;

const expectSecretsAbsent = (value: unknown): string => {
  const serialized = JSON.stringify(value);
  for (const secret of SECRET_VALUES) {
    expect(serialized).not.toContain(secret);
  }
  return serialized;
};

describe('diagnostic projection', () => {
  it('removes URL userinfo and sensitive query values without redacting near-miss names', () => {
    const projected = projectDiagnosticUrl(
      'https://alice:userinfo-secret@example.test/login?pin=pin-0000&password=password-hunter2&user[token]=typed-post-secret&pinboard=pinboard-safe&tokenizer=tokenizer-safe&passwordHint=hint-safe&author=author-safe&monkey=monkey-safe'
    );

    expect(projected).not.toContain('alice');
    expect(projected).not.toContain('userinfo-secret');
    expect(projected).not.toContain('pin-0000');
    expect(projected).not.toContain('password-hunter2');
    expect(projected).not.toContain('typed-post-secret');
    expect(projected).toContain('pinboard=pinboard-safe');
    expect(projected).toContain('tokenizer=tokenizer-safe');
    expect(projected).toContain('passwordHint=hint-safe');
    expect(projected).toContain('author=author-safe');
    expect(projected).toContain('monkey=monkey-safe');
  });

  it('projects replay history to safe request metadata while omitting credentials and values', () => {
    const session: HostSessionState = {
      runMode: 'network',
      navigationStatus: 'error',
      requestedUrl:
        'https://alice:userinfo-secret@example.test/form?pin=pin-0000&pinboard=pinboard-safe',
      finalUrl: 'https://example.test/form?password=password-hunter2',
      lastError: 'internal-error-secret',
      historyIndex: 0,
      history: [
        {
          url: 'https://example.test/form',
          requestedUrl: 'https://example.test/form?token=typed-post-secret',
          method: 'POST',
          headers: {
            Authorization: 'authorization-secret',
            Cookie: 'cookie-secret',
            'Proxy-Authorization': 'proxy-authorization-secret',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          requestPolicy: {
            refererUrl: 'https://bob:password-hunter2@example.test/start',
            postContext: {
              contentType: 'application/x-www-form-urlencoded',
              payload: 'legacy-payload-secret'
            },
            requestIntent: {
              method: 'post',
              enctype: 'application/x-www-form-urlencoded',
              sendReferer: true,
              sameDeck: false,
              postFields: [{ name: 'pin', value: 'typed-post-secret' }]
            }
          },
          activeCardId: 'login'
        }
      ]
    };

    const projected = projectSessionState(session);
    const serialized = expectSecretsAbsent(projected);

    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('Cookie');
    expect(serialized).not.toContain('Proxy-Authorization');
    expect(projected.hasError).toBe(true);
    expect(projected.historyLength).toBe(1);
    expect(projected.currentHistoryEntry?.headers).toEqual({
      count: 4,
      contentType: 'application/x-www-form-urlencoded'
    });
    expect(projected.currentHistoryEntry?.requestPolicy?.post).toEqual({
      contentType: 'application/x-www-form-urlencoded',
      payloadLength: 'legacy-payload-secret'.length,
      postFieldCount: 1,
      postFieldValueLength: 'typed-post-secret'.length
    });
    expect(projected.requestedUrl).toContain('pinboard=pinboard-safe');
  });

  it('omits transport bodies and arbitrary error internals while retaining failure metadata', () => {
    const response: FetchResponse = {
      ok: false,
      status: 502,
      finalUrl: 'https://example.test/deck?token=typed-post-secret',
      contentType: 'text/vnd.wap.wml; charset=utf-8',
      wml: '<wml>raw-wml-secret</wml>',
      raw: { bytesBase64: 'raw-bytes-secret', contentType: 'application/vnd.wap.wmlc' },
      error: {
        code: 'WBXML_DECODE_FAILED',
        message: 'internal-error-secret',
        details: { cause: 'internal-error-secret' }
      },
      timingMs: { encode: 1, udpRtt: 2, decode: 3 }
    };

    const projected = projectTransportResponse(response);
    expectSecretsAbsent(projected);
    expect(projected).toEqual({
      ok: false,
      status: 502,
      finalUrl: 'https://example.test/deck?token=%5Bredacted%5D',
      contentType: 'text/vnd.wap.wml',
      timingMs: { encode: 1, udpRtt: 2, decode: 3 },
      error: { code: 'WBXML_DECODE_FAILED' },
      body: {
        decodedWmlLength: '<wml>raw-wml-secret</wml>'.length,
        rawBase64Length: 'raw-bytes-secret'.length
      }
    });
  });

  it('omits runtime edit values, dialogs, timer tokens, traps, and post-field values', () => {
    const snapshot: EngineRuntimeSnapshot = {
      activeCardId: 'login',
      focusedLinkIndex: 1,
      focusedInputEditName: 'pin',
      focusedInputEditValue: 'pin-0000',
      baseUrl: 'https://alice:userinfo-secret@example.test/deck',
      contentType: 'text/vnd.wap.wml',
      lastBackNavigationHandled: false,
      externalNavigationIntent: 'https://example.test/submit?password=password-hunter2',
      externalNavigationRequestPolicy: {
        postContext: { payload: 'legacy-payload-secret' },
        requestIntent: {
          method: 'post',
          enctype: 'application/x-www-form-urlencoded',
          sendReferer: false,
          sameDeck: true,
          postFields: [{ name: 'pin', value: 'typed-post-secret' }]
        }
      },
      lastScriptExecutionOk: false,
      lastScriptExecutionTrap: 'internal-error-secret',
      lastScriptExecutionErrorClass: 'internal-error-secret',
      lastScriptExecutionErrorCategory: 'resource',
      lastScriptDialogRequests: [{ type: 'alert', message: 'dialog-secret' }],
      lastScriptTimerRequests: [{ type: 'schedule', delayMs: 10, token: 'timer-token-secret' }]
    };

    const projected = projectRuntimeSnapshot(snapshot);
    expectSecretsAbsent(projected);
    expect(projected).toMatchObject({
      hasActiveCard: true,
      editingInput: true,
      editingSelect: false,
      lastScriptExecutionOk: false,
      lastScriptExecutionErrorCategory: 'resource',
      scriptDialogRequestCount: 1,
      scriptTimerRequestCount: 1
    });
  });

  it('drops unknown timeline details and bounds allowlisted correlation metadata', () => {
    expect(
      projectTimelineDetails('unknown-action', {
        message: 'internal-error-secret',
        payload: 'legacy-payload-secret'
      })
    ).toBeUndefined();

    const projected = projectTimelineDetails('navigation-coalesced', {
      requestedUrl: `https://example.test/${'a'.repeat(3_000)}?token=typed-post-secret`,
      requestId: `waves-${'b'.repeat(300)}`
    });
    expectSecretsAbsent(projected);
    expect(String(projected?.requestedUrl).length).toBe(DIAGNOSTIC_PROJECTION_LIMITS.urlLength);
    expect(String(projected?.requestId).length).toBe(DIAGNOSTIC_PROJECTION_LIMITS.requestIdLength);
  });
});
