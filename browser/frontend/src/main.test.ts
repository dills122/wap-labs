import { afterEach, describe, expect, it, vi } from 'vitest';

const flushAsyncWork = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('bootstrap boot-failure handling', () => {
  it('surfaces a raw fallback banner when the shell fails to mount (no #app root)', async () => {
    document.body.innerHTML = '';

    await import('./main');
    await flushAsyncWork();

    expect(document.body.getAttribute('data-boot-phase')).toBe('boot-error');
    const banner = document.querySelector('[data-boot-error]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain('missing #app root');
  });

  it('surfaces a visible toast/status error when boot fails after the shell has mounted', async () => {
    // Force local run mode so controller.init() awaits the local deck load
    // chain (setRunMode -> loadSelectedLocalDeck -> loadLocalDeck ->
    // setViewportCols -> hostClient.engineSetViewportCols) directly, instead
    // of the network branch's fire-and-forget startup probe.
    vi.stubEnv('VITE_WAVES_DEFAULT_URL', 'http://local.test/start.wml');
    vi.stubEnv('VITE_WAVES_DEFAULT_RUN_MODE', 'local');
    document.body.innerHTML = '<div id="app"></div>';

    // No Tauri runtime is present under jsdom, so the real `invoke` call
    // made partway through that chain rejects. This exercises the
    // post-presenter failure path without any mocking of the host client.
    await import('./main');
    await flushAsyncWork();

    expect(document.body.getAttribute('data-boot-phase')).toBe('boot-error');
    const toastEl = document.querySelector<HTMLDivElement>('#toast');
    expect(toastEl).not.toBeNull();
    expect(toastEl?.className).toContain('toast-error');
    expect(toastEl?.textContent).toContain('Error:');
  });
});
