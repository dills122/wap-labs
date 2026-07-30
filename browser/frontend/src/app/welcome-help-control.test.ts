import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApplicationStateLoadResult } from '../../../contracts/application-state';
import {
  MemoryApplicationStateStore,
  configureApplicationStateStore,
  defaultApplicationStateV1
} from './application-state-store';
import {
  TUTORIAL_EXAMPLE_KEY,
  WELCOME_STARTUP_STORAGE_KEY,
  bindWelcomeHelpControls
} from './welcome-help-control';

const setup = () => {
  const startTourBtn = document.createElement('button');
  const tryLocalBtn = document.createElement('button');
  const connectNetworkBtn = document.createElement('button');
  const localModeButtonEl = document.createElement('button');
  const networkModeButtonEl = document.createElement('button');
  const welcomeToggleBtn = document.createElement('button');
  const welcomePanelEl = document.createElement('section');
  const showWelcomeOnLaunchEl = document.createElement('input');
  showWelcomeOnLaunchEl.type = 'checkbox';
  const browserShellEl = document.createElement('div');

  const runModeSelectEl = document.createElement('select');
  for (const value of ['local', 'network']) {
    const option = document.createElement('option');
    option.value = value;
    runModeSelectEl.appendChild(option);
  }
  runModeSelectEl.value = 'network';

  const localExampleSelectEl = document.createElement('select');
  for (const value of ['someOtherExample', TUTORIAL_EXAMPLE_KEY]) {
    const option = document.createElement('option');
    option.value = value;
    localExampleSelectEl.appendChild(option);
  }
  localExampleSelectEl.value = 'someOtherExample';

  const loadLocalBtnEl = document.createElement('button');
  const fetchUrlInputEl = document.createElement('input');

  document.body.append(
    startTourBtn,
    tryLocalBtn,
    connectNetworkBtn,
    localModeButtonEl,
    networkModeButtonEl,
    welcomeToggleBtn,
    welcomePanelEl,
    showWelcomeOnLaunchEl,
    browserShellEl,
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    fetchUrlInputEl
  );

  return {
    startTourBtn,
    tryLocalBtn,
    connectNetworkBtn,
    localModeButtonEl,
    networkModeButtonEl,
    welcomeToggleBtn,
    welcomePanelEl,
    showWelcomeOnLaunchEl,
    browserShellEl,
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    fetchUrlInputEl
  };
};

describe('bindWelcomeHelpControls', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    configureApplicationStateStore(new MemoryApplicationStateStore());
  });

  it('shows Welcome by default and lets the persistent stage control hide or restore it', () => {
    const refs = setup();

    bindWelcomeHelpControls(refs);

    expect(refs.welcomePanelEl.hidden).toBe(false);
    expect(refs.browserShellEl.dataset.welcomeVisible).toBe('true');
    expect(refs.welcomeToggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(refs.showWelcomeOnLaunchEl.checked).toBe(true);

    refs.welcomeToggleBtn.click();
    expect(refs.welcomePanelEl.hidden).toBe(true);
    expect(refs.browserShellEl.dataset.welcomeVisible).toBe('false');

    refs.welcomeToggleBtn.click();
    expect(refs.welcomePanelEl.hidden).toBe(false);
  });

  it('persists the launch preference without removing the current-session toggle', async () => {
    const refs = setup();
    bindWelcomeHelpControls(refs);

    refs.showWelcomeOnLaunchEl.checked = false;
    refs.showWelcomeOnLaunchEl.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(localStorage.getItem(WELCOME_STARTUP_STORAGE_KEY)).toBeNull();
    });

    const nextRefs = setup();
    bindWelcomeHelpControls(nextRefs);
    await vi.waitFor(() => {
      expect(nextRefs.welcomePanelEl.hidden).toBe(true);
      expect(nextRefs.welcomeToggleBtn.getAttribute('aria-expanded')).toBe('false');
    });

    nextRefs.welcomeToggleBtn.click();
    expect(nextRefs.welcomePanelEl.hidden).toBe(false);
    expect(nextRefs.showWelcomeOnLaunchEl.checked).toBe(false);
  });

  it('paints from the safe synchronous preference before an asynchronous state read finishes', async () => {
    const refs = setup();
    let resolveLoad: ((result: ApplicationStateLoadResult) => void) | undefined;
    const load = new Promise<ApplicationStateLoadResult>((resolve) => {
      resolveLoad = resolve;
    });
    const store = {
      load: () => load,
      save: vi.fn(),
      reset: vi.fn(),
      clear: vi.fn()
    };

    bindWelcomeHelpControls(refs, store);

    expect(refs.welcomePanelEl.hidden).toBe(false);
    const state = defaultApplicationStateV1();
    state.onboarding.showWelcomeOnLaunch = false;
    resolveLoad?.({
      state,
      status: 'loaded',
      writeAllowed: true,
      removedMonitorWindowState: false
    });
    await load;
    await Promise.resolve();

    expect(refs.welcomePanelEl.hidden).toBe(true);
    expect(refs.showWelcomeOnLaunchEl.checked).toBe(false);
  });

  it('dismisses Welcome when either header mode segment is chosen', () => {
    const refs = setup();
    bindWelcomeHelpControls(refs);

    refs.networkModeButtonEl.click();
    expect(refs.welcomePanelEl.hidden).toBe(true);

    refs.welcomeToggleBtn.click();
    refs.localModeButtonEl.click();
    expect(refs.welcomePanelEl.hidden).toBe(true);
  });

  it('Take the Tour switches to local mode, selects the tutorial deck, and clicks load', () => {
    const refs = setup();
    const modeChangeSpy = vi.fn();
    refs.runModeSelectEl.addEventListener('change', modeChangeSpy);
    const loadClickSpy = vi.fn();
    refs.loadLocalBtnEl.addEventListener('click', loadClickSpy);

    bindWelcomeHelpControls(refs);
    refs.startTourBtn.click();

    expect(refs.runModeSelectEl.value).toBe('local');
    expect(modeChangeSpy).toHaveBeenCalledTimes(1);
    expect(refs.localExampleSelectEl.value).toBe(TUTORIAL_EXAMPLE_KEY);
    expect(loadClickSpy).toHaveBeenCalledTimes(1);
    expect(refs.welcomePanelEl.hidden).toBe(true);
  });

  it('Try Local Examples switches to local mode and focuses the example picker without loading anything', () => {
    const refs = setup();
    const loadClickSpy = vi.fn();
    refs.loadLocalBtnEl.addEventListener('click', loadClickSpy);

    bindWelcomeHelpControls(refs);
    refs.tryLocalBtn.click();

    expect(refs.runModeSelectEl.value).toBe('local');
    expect(document.activeElement).toBe(refs.localExampleSelectEl);
    expect(loadClickSpy).not.toHaveBeenCalled();
    expect(refs.welcomePanelEl.hidden).toBe(true);
  });

  it('Connect to a WAP Server switches to network mode and focuses the address field', () => {
    const refs = setup();
    refs.runModeSelectEl.value = 'local';

    bindWelcomeHelpControls(refs);
    refs.connectNetworkBtn.click();

    expect(refs.runModeSelectEl.value).toBe('network');
    expect(document.activeElement).toBe(refs.fetchUrlInputEl);
    expect(refs.welcomePanelEl.hidden).toBe(true);
  });

  it('does not dispatch a redundant change event when already in the target mode', () => {
    const refs = setup();
    refs.runModeSelectEl.value = 'local';
    const modeChangeSpy = vi.fn();
    refs.runModeSelectEl.addEventListener('change', modeChangeSpy);

    bindWelcomeHelpControls(refs);
    refs.tryLocalBtn.click();

    expect(modeChangeSpy).not.toHaveBeenCalled();
  });

  it('stops reacting once unbound', () => {
    const refs = setup();
    refs.runModeSelectEl.value = 'local';
    const unbind = bindWelcomeHelpControls(refs);
    unbind();

    refs.connectNetworkBtn.click();

    // Handler no longer runs: mode is unchanged and the address field never focuses.
    expect(refs.runModeSelectEl.value).toBe('local');
    expect(document.activeElement).not.toBe(refs.fetchUrlInputEl);
  });
});
