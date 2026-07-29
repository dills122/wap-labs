import { describe, expect, it } from 'vitest';
import { registerBrowserComponents } from '../components';
import { mountBrowserShell } from './browser-shell-template';

// WBP-05 accept criterion: "all browser-owned actions are keyboard reachable
// with visible focus." The visible-focus half is covered by the
// :focus-visible CSS override in styles.css and verified against the live
// rendered shell (see the WBP-05 PR description); this test covers the
// "reachable" half -- every action a mouse user can click must also be a
// real, non-disabled, tabbable element that a keyboard user can .focus().
const expectFocusable = (selector: string): void => {
  const el = document.querySelector<HTMLElement>(selector);
  expect(el, `expected ${selector} to exist`).not.toBeNull();
  if (!el) {
    return;
  }
  expect(el.hasAttribute('disabled'), `${selector} must not be disabled`).toBe(false);
  expect(el.tabIndex, `${selector} must have a non-negative tabIndex`).toBeGreaterThanOrEqual(0);
  el.focus();
  expect(document.activeElement, `${selector} did not actually receive focus`).toBe(el);
};

describe('keyboard reachability of host-chrome actions', () => {
  it('reaches every navigation-toolbar control', () => {
    document.body.innerHTML = '<div id="app"></div>';
    registerBrowserComponents();
    mountBrowserShell('wap://localhost/start.wml', 'local');

    for (const selector of [
      '#btn-back',
      '#btn-reload',
      '#local-example',
      '#btn-load-local',
      '#btn-mode-local',
      '#btn-mode-network',
      '#btn-inspector'
    ]) {
      expectFocusable(selector);
    }

    expect(document.querySelector<HTMLElement>('#run-mode')?.tabIndex).toBe(-1);
  });

  it('reaches the softkey row', () => {
    document.body.innerHTML = '<div id="app"></div>';
    registerBrowserComponents();
    mountBrowserShell('wap://localhost/start.wml', 'local');

    for (const selector of ['#btn-up', '#btn-enter', '#btn-down']) {
      expectFocusable(selector);
    }
  });

  it('reaches persistent display controls and empty-state actions with the inspector closed', () => {
    document.body.innerHTML = '<div id="app"></div>';
    registerBrowserComponents();
    mountBrowserShell('wap://localhost/start.wml', 'local');

    expect(document.querySelector<HTMLDetailsElement>('#utility-rail-panel')?.open).toBe(false);
    expect(document.querySelector('#welcome-help-panel')?.tagName).toBe('SECTION');

    for (const selector of [
      '#viewport-cols',
      '#handset-scale-select',
      '#btn-start-tour',
      '#btn-try-local-examples',
      '#btn-connect-network'
    ]) {
      expectFocusable(selector);
    }
  });

  it('reaches the developer drawer actions once opened, as a keyboard user would open it', () => {
    document.body.innerHTML = '<div id="app"></div>';
    registerBrowserComponents();
    mountBrowserShell('wap://localhost/start.wml', 'local');

    const drawer = document.querySelector<HTMLDetailsElement>('#dev-drawer');
    expect(drawer).not.toBeNull();
    expect(drawer?.open).toBe(false);
    document.querySelector<HTMLButtonElement>('#btn-inspector')?.click();
    expect(drawer?.open).toBe(true);

    for (const selector of [
      '#devtools-tab-overview',
      '#btn-health',
      '#btn-render',
      '#btn-snapshot',
      '#btn-open-devtools-window'
    ]) {
      expectFocusable(selector);
    }

    document.querySelector<HTMLButtonElement>('#devtools-tab-runtime')?.click();
    expectFocusable('#btn-clear-intent');

    document.querySelector<HTMLButtonElement>('#devtools-tab-timeline')?.click();
    expectFocusable('#btn-export-timeline');
    expectFocusable('#btn-clear-timeline');

    document.querySelector<HTMLButtonElement>('#devtools-tab-source')?.click();
    expectFocusable('#btn-load-context');
  });
});
