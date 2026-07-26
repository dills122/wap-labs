import { describe, expect, it, vi } from 'vitest';
import { TUTORIAL_EXAMPLE_KEY, bindWelcomeHelpControls } from './welcome-help-control';

const setup = () => {
  const startTourBtn = document.createElement('button');
  const tryLocalBtn = document.createElement('button');
  const connectNetworkBtn = document.createElement('button');

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
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    fetchUrlInputEl
  );

  return {
    startTourBtn,
    tryLocalBtn,
    connectNetworkBtn,
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    fetchUrlInputEl
  };
};

describe('bindWelcomeHelpControls', () => {
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
  });

  it('Connect to a WAP Server switches to network mode and focuses the address field', () => {
    const refs = setup();
    refs.runModeSelectEl.value = 'local';

    bindWelcomeHelpControls(refs);
    refs.connectNetworkBtn.click();

    expect(refs.runModeSelectEl.value).toBe('network');
    expect(document.activeElement).toBe(refs.fetchUrlInputEl);
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
