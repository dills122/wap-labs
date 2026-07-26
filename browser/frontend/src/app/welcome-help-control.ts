// Key of the bundled onboarding tutorial deck, `your-first-deck.wml`
// (see engine-wasm/examples/source/your-first-deck.wml), loaded through the
// ordinary local-example path rather than a bespoke tutorial loader.
export const TUTORIAL_EXAMPLE_KEY = 'yourFirstDeck';

export interface WelcomeHelpControlRefs {
  startTourBtn: HTMLButtonElement;
  tryLocalBtn: HTMLButtonElement;
  connectNetworkBtn: HTMLButtonElement;
  runModeSelectEl: HTMLSelectElement;
  localExampleSelectEl: HTMLSelectElement;
  loadLocalBtnEl: HTMLButtonElement;
  fetchUrlInputEl: HTMLInputElement;
}

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
  const handleStartTour = (): void => {
    setRunMode(refs.runModeSelectEl, 'local');
    refs.localExampleSelectEl.value = TUTORIAL_EXAMPLE_KEY;
    refs.localExampleSelectEl.dispatchEvent(new Event('change'));
    refs.loadLocalBtnEl.click();
  };
  const handleTryLocal = (): void => {
    setRunMode(refs.runModeSelectEl, 'local');
    refs.localExampleSelectEl.focus();
  };
  const handleConnectNetwork = (): void => {
    setRunMode(refs.runModeSelectEl, 'network');
    refs.fetchUrlInputEl.focus();
  };

  refs.startTourBtn.addEventListener('click', handleStartTour);
  refs.tryLocalBtn.addEventListener('click', handleTryLocal);
  refs.connectNetworkBtn.addEventListener('click', handleConnectNetwork);

  return () => {
    refs.startTourBtn.removeEventListener('click', handleStartTour);
    refs.tryLocalBtn.removeEventListener('click', handleTryLocal);
    refs.connectNetworkBtn.removeEventListener('click', handleConnectNetwork);
  };
};
