import { describe, expect, it, vi } from 'vitest';
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

  it('wraps the device frame in a handset housing and wires the display-scale control', () => {
    document.body.innerHTML = '<div id="app"></div>';
    document.documentElement.style.removeProperty('--handset-scale');
    mountBrowserShell('http://example.test/start.wml', 'local');

    const housing = document.querySelector('.handset-housing');
    expect(housing?.querySelector('.device-frame')).not.toBeNull();

    const scaleSelect = document.querySelector<HTMLSelectElement>('#handset-scale-select');
    expect(scaleSelect).not.toBeNull();
    expect(scaleSelect?.value).toBe('1');

    if (scaleSelect) {
      scaleSelect.value = '2';
      scaleSelect.dispatchEvent(new Event('change'));
    }
    expect(document.documentElement.style.getPropertyValue('--handset-scale')).toBe('2');

    // Display scale must not touch the independent viewport-cols engine config.
    expect((document.querySelector('#viewport-cols') as HTMLInputElement).value).toBe(
      String(WAVES_CONFIG.defaultViewportCols)
    );
  });

  it('distinguishes source, route, and compatibility profile in the toolbar', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('wap://localhost/start.wml', 'local');

    const runModeSelectEl = document.querySelector<HTMLSelectElement>('#run-mode');
    const routeLabelEl = document.querySelector('#route-label');
    const profileLabelEl = document.querySelector('#profile-label');

    // Source (run mode) is a live, user-configurable control.
    expect(runModeSelectEl?.tagName).toBe('SELECT');
    // Route is read-only display text derived from source + address, not a
    // separate control -- there is no configurable transport route yet.
    expect(routeLabelEl?.tagName).toBe('SPAN');
    expect(routeLabelEl?.textContent).toBe('Local fixtures');
    // Profile is a static read-only label: profile switching does not exist
    // yet, so it must not be presented as an interactive/functional control.
    expect(profileLabelEl?.tagName).toBe('SPAN');
    expect(profileLabelEl?.textContent).toBe('Class C Reference');

    if (runModeSelectEl) {
      runModeSelectEl.value = 'network';
      runModeSelectEl.dispatchEvent(new Event('change'));
    }
    expect(routeLabelEl?.textContent).toBe('Network — localhost');
  });

  it('wires the Welcome/Help panel into the ordinary mode/local-example controls', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('wap://localhost/start.wml', 'network');

    const welcomePanel = document.querySelector('#welcome-help-panel');
    expect(welcomePanel).not.toBeNull();

    const runModeSelectEl = document.querySelector<HTMLSelectElement>('#run-mode');
    const loadLocalBtnEl = document.querySelector<HTMLButtonElement>('#btn-load-local');
    const loadClickSpy = vi.fn();
    loadLocalBtnEl?.addEventListener('click', loadClickSpy);

    document.querySelector<HTMLButtonElement>('#btn-start-tour')?.click();

    expect(runModeSelectEl?.value).toBe('local');
    expect(loadClickSpy).toHaveBeenCalledTimes(1);

    // Mode is already "local" from the tour click above; confirm "Connect to
    // a WAP Server" switches it to network.
    document.querySelector<HTMLButtonElement>('#btn-connect-network')?.click();
    expect(runModeSelectEl?.value).toBe('network');
  });
});
