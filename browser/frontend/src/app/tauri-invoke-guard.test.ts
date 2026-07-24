import { describe, expect, it, vi } from 'vitest';
import { createGuardedTauriInvoke } from './tauri-invoke-guard';

describe('createGuardedTauriInvoke', () => {
  it('passes through well-formed responses unchanged', async () => {
    const invokeFn = vi.fn().mockResolvedValue({ activeCardId: 'home' });
    const guarded = createGuardedTauriInvoke(invokeFn);

    const result = await guarded('engine_snapshot');

    expect(result).toEqual({ activeCardId: 'home' });
    expect(invokeFn).toHaveBeenCalledWith('engine_snapshot', undefined);
  });

  it('forwards command name and args to the wrapped invoke', async () => {
    const invokeFn = vi.fn().mockResolvedValue('ok');
    const guarded = createGuardedTauriInvoke(invokeFn);

    await guarded('health', { request: { key: 'up' } });

    expect(invokeFn).toHaveBeenCalledWith('health', { request: { key: 'up' } });
  });

  it('rejects when the host returns undefined instead of a value', async () => {
    const invokeFn = vi.fn().mockResolvedValue(undefined);
    const guarded = createGuardedTauriInvoke(invokeFn);

    await expect(guarded('engine_render_frame')).rejects.toThrow(
      'Host command "engine_render_frame" returned no data.'
    );
  });

  it('rejects when the host returns null instead of a value', async () => {
    const invokeFn = vi.fn().mockResolvedValue(null);
    const guarded = createGuardedTauriInvoke(invokeFn);

    await expect(guarded('engine_handle_key_frame')).rejects.toThrow(
      'Host command "engine_handle_key_frame" returned no data.'
    );
  });

  it('propagates rejections from the wrapped invoke unchanged', async () => {
    const invokeFn = vi.fn().mockRejectedValue(new Error('ipc failure'));
    const guarded = createGuardedTauriInvoke(invokeFn);

    await expect(guarded('fetch_deck')).rejects.toThrow('ipc failure');
  });

  it('allows falsy-but-defined values through (e.g. empty string, zero, false)', async () => {
    const invokeFn = vi.fn().mockResolvedValue('');
    const guarded = createGuardedTauriInvoke(invokeFn);

    await expect(guarded('health')).resolves.toBe('');
  });
});
