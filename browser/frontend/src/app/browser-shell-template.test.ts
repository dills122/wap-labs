import { describe, expect, it } from 'vitest';
import { mountBrowserShell } from './browser-shell-template';
import { WAVES_CONFIG } from './waves-config';

describe('mountBrowserShell', () => {
  it('assigns runtime URL values via element properties after mount', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const injectedUrl = 'http://example.test/start.wml?x=%22%3Cscript%3E';
    const refs = mountBrowserShell(injectedUrl);

    expect(refs.fetchUrlInput.value).toBe(injectedUrl);
    expect(refs.baseUrlInput.value).toBe(WAVES_CONFIG.defaultDebugBaseUrl);
    expect(document.querySelectorAll('#fetch-url')).toHaveLength(1);
    expect(document.querySelectorAll('#base-url')).toHaveLength(1);
  });
});
