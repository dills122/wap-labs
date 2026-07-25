import { describe, expect, it } from 'vitest';
import { mountBrowserShell } from './browser-shell-template';
import { WAVES_CONFIG } from './waves-config';

describe('mountBrowserShell', () => {
  it('assigns runtime URL values via element properties after mount', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const injectedUrl = 'http://example.test/start.wml?x=%22%3Cscript%3E';
    const refs = mountBrowserShell(injectedUrl, 'network');

    expect(refs.fetchUrlInput.value).toBe(injectedUrl);
    expect(refs.runModeSelectEl.value).toBe('network');
    expect(refs.baseUrlInput.value).toBe(WAVES_CONFIG.defaultDebugBaseUrl);
    expect(document.querySelectorAll('#fetch-url')).toHaveLength(1);
    expect(document.querySelectorAll('#base-url')).toHaveLength(1);
    expect(refs.viewportEl.getAttribute('tabindex')).toBe('0');

    const softkeyRow = document.querySelector('.softkey-row');
    expect(softkeyRow?.getAttribute('role')).toBe('group');
    expect(softkeyRow?.getAttribute('aria-label')).toBeTruthy();
  });

  it('decomposes the shell into landmark-labelled sections', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('http://example.test/start.wml', 'local');

    const nav = document.querySelector('nav.nav-toolbar');
    const handsetStage = document.querySelector('section.handset-stage');
    const utilityRail = document.querySelector('aside.utility-rail');
    const devDrawerSection = document.querySelector('section.developer-drawer-section');

    expect(nav?.getAttribute('aria-label')).toBeTruthy();
    expect(handsetStage?.getAttribute('aria-label')).toBeTruthy();
    expect(utilityRail?.getAttribute('aria-label')).toBeTruthy();
    expect(devDrawerSection?.getAttribute('aria-label')).toBeTruthy();

    // Handset stage still owns the engine viewport adapter directly.
    expect(handsetStage?.querySelector('#viewport')).not.toBeNull();
    // Developer drawer moved out from under the utility rail to its own
    // top-level sibling section, per the desktop product IA.
    expect(utilityRail?.querySelector('#dev-drawer')).toBeNull();
    expect(devDrawerSection?.querySelector('#dev-drawer')).not.toBeNull();

    const phaseBarSlot = document.querySelector('.phase-bar-slot');
    expect(phaseBarSlot?.hasAttribute('hidden')).toBe(true);
  });

  it('opens the utility rail by default at normal window widths', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('http://example.test/start.wml', 'local');

    const railPanel = document.querySelector<HTMLDetailsElement>('#utility-rail-panel');
    expect(railPanel?.open).toBe(true);
  });
});
