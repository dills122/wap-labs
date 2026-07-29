// Key of the bundled onboarding tutorial deck, `your-first-deck.wml`
// (see engine-wasm/examples/source/your-first-deck.wml), loaded through the
// ordinary local-example path rather than a bespoke tutorial loader.
export const TUTORIAL_EXAMPLE_KEY = 'yourFirstDeck';
export const WELCOME_STARTUP_STORAGE_KEY = 'waves.showWelcomeOnLaunch';

export interface WelcomeHelpControlRefs {
  startTourBtn: HTMLButtonElement;
  tryLocalBtn: HTMLButtonElement;
  connectNetworkBtn: HTMLButtonElement;
  localModeButtonEl: HTMLButtonElement;
  networkModeButtonEl: HTMLButtonElement;
  welcomeToggleBtn: HTMLButtonElement;
  welcomePanelEl: HTMLElement;
  showWelcomeOnLaunchEl: HTMLInputElement;
  browserShellEl: HTMLElement;
  runModeSelectEl: HTMLSelectElement;
  localExampleSelectEl: HTMLSelectElement;
  loadLocalBtnEl: HTMLButtonElement;
  fetchUrlInputEl: HTMLInputElement;
}

const getLocalStorage = (): Storage | null => {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

export const showWelcomeOnLaunch = (storage = getLocalStorage()): boolean => {
  try {
    return storage?.getItem(WELCOME_STARTUP_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

const saveWelcomeOnLaunch = (enabled: boolean, storage = getLocalStorage()): void => {
  try {
    storage?.setItem(WELCOME_STARTUP_STORAGE_KEY, String(enabled));
  } catch {
    // The preference is optional; keep the current-session control usable when storage is blocked.
  }
};

const setRunMode = (runModeSelectEl: HTMLSelectElement, mode: 'local' | 'network'): void => {
  if (runModeSelectEl.value === mode) {
    return;
  }
  runModeSelectEl.value = mode;
  runModeSelectEl.dispatchEvent(new Event('change'));
};

// Wires the Welcome/Help panel's three entry points to the existing
// mode-select, local-example-select, and load-local controls -- the same
// ones a user would click directly -- so onboarding never bypasses the
// ordinary engine load path (see WBP-04 accept criteria in
// WAVES_BROWSER_PRODUCT_IMPLEMENTATION_PLAN.md).
export const bindWelcomeHelpControls = (refs: WelcomeHelpControlRefs): (() => void) => {
  let welcomeVisible = showWelcomeOnLaunch();

  const syncWelcomePresentation = (): void => {
    refs.browserShellEl.dataset.welcomeVisible = String(welcomeVisible);
    refs.welcomePanelEl.hidden = !welcomeVisible;
    refs.welcomeToggleBtn.setAttribute('aria-expanded', String(welcomeVisible));
  };
  const hideWelcome = (): void => {
    welcomeVisible = false;
    syncWelcomePresentation();
  };
  const handleWelcomeToggle = (): void => {
    welcomeVisible = !welcomeVisible;
    syncWelcomePresentation();
  };
  const handleStartupPreference = (): void => {
    saveWelcomeOnLaunch(refs.showWelcomeOnLaunchEl.checked);
  };
  const handleStartTour = (): void => {
    hideWelcome();
    setRunMode(refs.runModeSelectEl, 'local');
    refs.localExampleSelectEl.value = TUTORIAL_EXAMPLE_KEY;
    refs.localExampleSelectEl.dispatchEvent(new Event('change'));
    refs.loadLocalBtnEl.click();
  };
  const handleTryLocal = (): void => {
    hideWelcome();
    setRunMode(refs.runModeSelectEl, 'local');
    refs.localExampleSelectEl.focus();
  };
  const handleConnectNetwork = (): void => {
    hideWelcome();
    setRunMode(refs.runModeSelectEl, 'network');
    refs.fetchUrlInputEl.focus();
  };

  refs.showWelcomeOnLaunchEl.checked = showWelcomeOnLaunch();
  refs.welcomeToggleBtn.addEventListener('click', handleWelcomeToggle);
  refs.showWelcomeOnLaunchEl.addEventListener('change', handleStartupPreference);
  refs.startTourBtn.addEventListener('click', handleStartTour);
  refs.tryLocalBtn.addEventListener('click', handleTryLocal);
  refs.connectNetworkBtn.addEventListener('click', handleConnectNetwork);
  refs.localModeButtonEl.addEventListener('click', hideWelcome);
  refs.networkModeButtonEl.addEventListener('click', hideWelcome);
  syncWelcomePresentation();

  return () => {
    refs.welcomeToggleBtn.removeEventListener('click', handleWelcomeToggle);
    refs.showWelcomeOnLaunchEl.removeEventListener('change', handleStartupPreference);
    refs.startTourBtn.removeEventListener('click', handleStartTour);
    refs.tryLocalBtn.removeEventListener('click', handleTryLocal);
    refs.connectNetworkBtn.removeEventListener('click', handleConnectNetwork);
    refs.localModeButtonEl.removeEventListener('click', hideWelcome);
    refs.networkModeButtonEl.removeEventListener('click', hideWelcome);
  };
};
