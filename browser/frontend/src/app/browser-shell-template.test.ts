import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountBrowserShell } from './browser-shell-template';
import { WAVES_CONFIG } from './waves-config';

describe('mountBrowserShell', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

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
    expect(refs.viewportCanvasEl?.classList.contains('viewport-canvas')).toBe(true);
    expect(refs.viewportCanvasEl?.getAttribute('aria-hidden')).toBe('true');
    expect(refs.viewportAccessibleTextEl?.dataset.canvasTextFallback).toBe('');
    expect(refs.viewportEl.querySelectorAll('canvas.viewport-canvas')).toHaveLength(1);

    const softkeyRow = document.querySelector('.softkey-row');
    expect(softkeyRow?.getAttribute('role')).toBe('group');
    expect(softkeyRow?.getAttribute('aria-label')).toBeTruthy();
  });

  it('starts with an empty editable network address and native endpoint suggestions', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const refs = mountBrowserShell('', 'network');
    const suggestionList = document.querySelector<HTMLDataListElement>('#network-address-options');
    const suggestedUrls = Array.from(suggestionList?.options ?? [], (option) => option.value);

    expect(refs.fetchUrlInput.value).toBe('');
    expect(refs.fetchUrlInput.getAttribute('list')).toBe('network-address-options');
    expect(refs.fetchUrlInput.getAttribute('placeholder')).toBeTruthy();
    expect(suggestedUrls).toEqual(WAVES_CONFIG.networkAddressSuggestions.map(({ url }) => url));
  });

  it('decomposes the shell into landmark-labelled sections', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('http://example.test/start.wml', 'local');

    const nav = document.querySelector('nav.nav-toolbar');
    const handsetStage = document.querySelector('section.handset-stage');
    const utilityRail = document.querySelector('aside.utility-rail');
    const devDrawerSection = document.querySelector('section.developer-drawer-section');
    const statusBar = document.querySelector('footer.status-bar');
    const primaryHeading = document.querySelector('h1.brand');

    expect(nav?.getAttribute('aria-label')).toBeTruthy();
    expect(handsetStage?.getAttribute('aria-label')).toBeTruthy();
    expect(utilityRail?.getAttribute('aria-label')).toBeTruthy();
    expect(devDrawerSection?.getAttribute('aria-label')).toBeTruthy();
    expect(statusBar?.getAttribute('aria-label')).toBeTruthy();
    expect(primaryHeading?.textContent).toBeTruthy();

    // Handset stage still owns the engine viewport adapter directly.
    expect(handsetStage?.querySelector('#viewport')).not.toBeNull();
    // Supporting diagnostics belong to the optional inspector, while live
    // route and display telemetry remain persistent in the status strip.
    expect(utilityRail?.querySelector('#dev-drawer')).not.toBeNull();
    expect(devDrawerSection?.querySelector('#dev-drawer')).not.toBeNull();
    expect(devDrawerSection?.querySelector('[role="tablist"]')).not.toBeNull();
    expect(devDrawerSection?.querySelectorAll('[role="tabpanel"]')).toHaveLength(5);
    expect(devDrawerSection?.querySelector('#btn-open-devtools-window')).not.toBeNull();
    expect(statusBar?.querySelector('#status')).not.toBeNull();
    expect(statusBar?.querySelector('#viewport-cols')).not.toBeNull();

    const phaseBarSlot = document.querySelector('.phase-bar-slot');
    expect(phaseBarSlot?.hasAttribute('hidden')).toBe(true);
  });

  it('uses the native window as the only application frame', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('http://example.test/start.wml', 'local');

    const shell = document.querySelector<HTMLElement>('.browser-shell');
    const chrome = document.querySelector<HTMLElement>('.browser-chrome');

    expect(shell?.dataset.hostPresentation).toBe('native');
    expect(shell?.classList.contains('card')).toBe(false);
    expect(shell?.classList.contains('wv-shell-window')).toBe(false);
    expect(chrome?.classList.contains('card-header')).toBe(false);
    expect(document.querySelector('.wv95-btn')).toBeNull();
    expect(document.querySelector('.form-95')).toBeNull();
  });

  it('adds a decorative Waves identity without changing the accessible heading', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('http://example.test/start.wml', 'local');

    const brand = document.querySelector<HTMLHeadingElement>('h1.brand');
    const brandMark = brand?.querySelector<HTMLElement>('.brand-mark');

    expect(brand?.textContent?.trim()).toBe('Waves');
    expect(brandMark?.getAttribute('aria-hidden')).toBe('true');
    expect(brandMark?.textContent).toBe('');
  });

  it('keeps the inspector closed until explicitly requested', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('http://example.test/start.wml', 'local');

    const railPanel = document.querySelector<HTMLDetailsElement>('#utility-rail-panel');
    expect(railPanel?.open).toBe(false);
    expect(document.querySelector('#btn-inspector')?.getAttribute('aria-expanded')).toBe('false');
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

  it('distinguishes source, route, and compatibility profile across command and status bars', () => {
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

  it('proxies the visible mode segments to the controller-bound mode selector', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const refs = mountBrowserShell('wap://localhost/start.wml', 'local');
    const modeChangeSpy = vi.fn();
    refs.runModeSelectEl.addEventListener('change', modeChangeSpy);

    const shell = document.querySelector<HTMLElement>('.browser-shell');
    const localButton = document.querySelector<HTMLButtonElement>('#btn-mode-local');
    const networkButton = document.querySelector<HTMLButtonElement>('#btn-mode-network');

    expect(shell?.dataset.runMode).toBe('local');
    expect(localButton?.getAttribute('aria-pressed')).toBe('true');
    expect(networkButton?.getAttribute('aria-pressed')).toBe('false');

    const welcomePanel = document.querySelector<HTMLElement>('#welcome-help-panel');
    localButton?.click();
    expect(welcomePanel?.hidden).toBe(true);
    expect(modeChangeSpy).not.toHaveBeenCalled();

    document.querySelector<HTMLButtonElement>('#btn-welcome-toggle')?.click();
    expect(welcomePanel?.hidden).toBe(false);

    networkButton?.click();
    expect(refs.runModeSelectEl.value).toBe('network');
    expect(shell?.dataset.runMode).toBe('network');
    expect(modeChangeSpy).toHaveBeenCalledTimes(1);
    expect(networkButton?.getAttribute('aria-pressed')).toBe('true');
    expect(welcomePanel?.hidden).toBe(true);
  });

  it('opens and closes the inspector from the command bar', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('wap://localhost/start.wml', 'local');

    const railPanel = document.querySelector<HTMLDetailsElement>('#utility-rail-panel');
    const inspectorButton = document.querySelector<HTMLButtonElement>('#btn-inspector');

    inspectorButton?.click();
    expect(railPanel?.open).toBe(true);
    expect(document.querySelector<HTMLDetailsElement>('#dev-drawer')?.open).toBe(true);
    expect(inspectorButton?.getAttribute('aria-expanded')).toBe('true');

    inspectorButton?.click();
    expect(railPanel?.open).toBe(false);
    expect(document.querySelector<HTMLDetailsElement>('#dev-drawer')?.open).toBe(false);
    expect(inspectorButton?.getAttribute('aria-expanded')).toBe('false');
  });

  it('exposes the visible utility rail to keyboard intent routing', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const refs = mountBrowserShell('wap://localhost/start.wml', 'local');

    expect(refs.utilityRailPanelEl?.id).toBe('utility-rail-panel');
    expect(refs.utilityRailPanelEl?.open).toBe(false);
  });

  it('wires the Welcome/Help panel into the ordinary mode/local-example controls', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('wap://localhost/start.wml', 'network');

    const welcomePanel = document.querySelector('#welcome-help-panel');
    expect(welcomePanel).not.toBeNull();
    expect(welcomePanel?.hasAttribute('hidden')).toBe(false);
    expect(document.querySelector('#btn-welcome-toggle')?.getAttribute('aria-expanded')).toBe(
      'true'
    );
    expect((document.querySelector('#show-welcome-on-launch') as HTMLInputElement).checked).toBe(
      true
    );

    const runModeSelectEl = document.querySelector<HTMLSelectElement>('#run-mode');
    const loadLocalBtnEl = document.querySelector<HTMLButtonElement>('#btn-load-local');
    const loadClickSpy = vi.fn();
    loadLocalBtnEl?.addEventListener('click', loadClickSpy);

    document.querySelector<HTMLButtonElement>('#btn-start-tour')?.click();

    expect(runModeSelectEl?.value).toBe('local');
    expect(loadClickSpy).toHaveBeenCalledTimes(1);
    expect(welcomePanel?.hasAttribute('hidden')).toBe(true);

    // Mode is already "local" from the tour click above; confirm "Connect to
    // a WAP Server" switches it to network.
    document.querySelector<HTMLButtonElement>('#btn-connect-network')?.click();
    expect(runModeSelectEl?.value).toBe('network');
  });

  it('restores Welcome after it is dismissed and respects the saved launch preference', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('', 'local');

    const toggle = document.querySelector<HTMLButtonElement>('#btn-welcome-toggle');
    const panel = document.querySelector<HTMLElement>('#welcome-help-panel');
    const launchPreference = document.querySelector<HTMLInputElement>('#show-welcome-on-launch');

    toggle?.click();
    expect(panel?.hidden).toBe(true);

    toggle?.click();
    expect(panel?.hidden).toBe(false);

    if (launchPreference) {
      launchPreference.checked = false;
      launchPreference.dispatchEvent(new Event('change'));
    }

    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('', 'local');
    expect(document.querySelector<HTMLElement>('#welcome-help-panel')?.hidden).toBe(true);
    expect(document.querySelector('#btn-welcome-toggle')?.getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('keeps the inspector closed independent of viewport matching', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }))
    );
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('http://example.test/start.wml', 'local');

    const railPanel = document.querySelector<HTMLDetailsElement>('#utility-rail-panel');
    expect(railPanel?.open).toBe(false);
  });

  it('provides stable selectors for every shell disclosure seam', () => {
    document.body.innerHTML = '<div id="app"></div>';
    mountBrowserShell('http://example.test/start.wml', 'local');

    expect(document.querySelector('#utility-rail-toggle')).not.toBeNull();
    expect(document.querySelector('#welcome-help-toggle')).not.toBeNull();
    expect(document.querySelector('#local-example-notes-toggle')).not.toBeNull();
    expect(document.querySelector('#dev-drawer-toggle')).not.toBeNull();
    expect(document.querySelector('#debug-raw-mode-toggle')).not.toBeNull();
    expect(document.querySelector('#wml-input')?.getAttribute('aria-label')).toBeTruthy();
    expect(document.querySelector('#timeline')?.getAttribute('tabindex')).toBe('0');
  });
});
