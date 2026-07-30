import { describe, expect, it, vi } from 'vitest';
import { createGuardedTauriInvoke, HostCommandFailure } from './tauri-invoke-guard';

describe('createGuardedTauriInvoke', () => {
  it('passes through structurally valid responses unchanged', async () => {
    const invokeFn = vi.fn().mockResolvedValue('ok');
    const guarded = createGuardedTauriInvoke(invokeFn);

    await expect(guarded('health')).resolves.toBe('ok');
    expect(invokeFn).toHaveBeenCalledWith('health', undefined);
  });

  it('forwards command name and args to the wrapped invoke', async () => {
    const invokeFn = vi.fn().mockResolvedValue(true);
    const guarded = createGuardedTauriInvoke(invokeFn);

    await guarded('cancel_fetch', { requestId: 'bounded-id' });

    expect(invokeFn).toHaveBeenCalledWith('cancel_fetch', { requestId: 'bounded-id' });
  });

  it.each([undefined, null, {}, [], { ok: 'yes' }])(
    'rejects malformed non-null and empty response shape %#',
    async (response) => {
      const guarded = createGuardedTauriInvoke(vi.fn().mockResolvedValue(response));

      await expect(guarded('fetch_deck')).rejects.toMatchObject({
        name: 'HostCommandFailure',
        code: 'MALFORMED_RESPONSE',
        recoverable: true
      });
    }
  );

  it('accepts Serde-null optional fields in a valid fetch response', async () => {
    const response = {
      ok: true,
      status: 200,
      finalUrl: 'wap://localhost/',
      contentType: 'text/vnd.wap.wml',
      wml: '<wml><card id="home"/></wml>',
      error: null,
      timingMs: { encode: 1, udpRtt: 2, decode: 3 },
      engineDeckInput: {
        wmlXml: '<wml><card id="home"/></wml>',
        baseUrl: 'wap://localhost/',
        contentType: 'text/vnd.wap.wml',
        rawBytesBase64: null
      }
    };
    const guarded = createGuardedTauriInvoke(vi.fn().mockResolvedValue(response));

    await expect(guarded('fetch_deck')).resolves.toBe(response);
  });

  it('rejects an invalid non-null value in an optional response field', async () => {
    const guarded = createGuardedTauriInvoke(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        finalUrl: 'wap://localhost/',
        contentType: 'text/vnd.wap.wml',
        wml: 42,
        error: null,
        timingMs: { encode: 1, udpRtt: 2, decode: 3 },
        engineDeckInput: null
      })
    );

    await expect(guarded('fetch_deck')).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
      recoverable: true
    });
  });

  it.each([
    'INVALID_REQUEST',
    'CANCELLED',
    'TASK_SPAWN_FAILED',
    'TASK_JOIN_FAILED',
    'MUTEX_UNAVAILABLE',
    'ENGINE_RESOURCE_LIMIT',
    'ENGINE_FAILURE',
    'HOST_FAILURE',
    'MALFORMED_RESPONSE'
  ] as const)('preserves the typed %s host rejection', async (code) => {
    const guarded = createGuardedTauriInvoke(
      vi.fn().mockRejectedValue({
        code,
        message: 'Safe host failure.',
        recoverable: true
      })
    );

    await expect(guarded('engine_snapshot')).rejects.toMatchObject({
      name: 'HostCommandFailure',
      code,
      recoverable: true
    });
  });

  it('normalizes opaque rejections without echoing sensitive values', async () => {
    const secret = 'pin=1234';
    const guarded = createGuardedTauriInvoke(vi.fn().mockRejectedValue(new Error(secret)));

    const error = await guarded('fetch_deck').catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(HostCommandFailure);
    expect(error).toMatchObject({ code: 'HOST_FAILURE', recoverable: true });
    expect(String(error)).not.toContain(secret);
  });

  it('remains usable after a malformed response failure', async () => {
    const invokeFn = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce('healthy');
    const guarded = createGuardedTauriInvoke(invokeFn);

    await expect(guarded('health')).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
    await expect(guarded('health')).resolves.toBe('healthy');
  });
});
