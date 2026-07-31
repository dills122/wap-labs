import { beforeEach, describe, expect, it } from 'vitest';
import { developerDrawerTemplate } from './shell/developer-drawer-template';
import {
  bindDeveloperToolsWorkspace,
  renderDeveloperToolsState,
  type DeveloperToolsState
} from './developer-tools-workspace';

const state: DeveloperToolsState = {
  hostStatus: 'Health: ok',
  sessionState: {
    runMode: 'local',
    navigationStatus: 'loaded',
    requestedUrl: 'http://local.test/examples/basic.wml',
    finalUrl: 'http://local.test/examples/basic.wml',
    hasActiveCard: true,
    hasError: false,
    historyLength: 0
  },
  transportResponse: {
    ok: true,
    status: 200,
    finalUrl: 'http://local.test/examples/basic.wml',
    contentType: 'text/vnd.wap.wml',
    timingMs: { encode: 1, udpRtt: 4, decode: 2 }
  },
  runtimeSnapshot: {
    hasActiveCard: true,
    focusedLinkIndex: 0,
    nextTimerWakeupMs: 250,
    baseUrl: 'http://local.test/examples/basic.wml',
    contentType: 'text/vnd.wap.wml',
    editingInput: false,
    editingSelect: false,
    lastBackNavigationHandled: false,
    scriptDialogRequestCount: 0,
    scriptTimerRequestCount: 0
  },
  timeline: [
    {
      seq: 1,
      action: 'load-local-example',
      phase: 'ok',
      session: {
        runMode: 'local',
        navigationStatus: 'loaded',
        requestedUrl: 'http://local.test/examples/basic.wml',
        hasActiveCard: false,
        hasError: false,
        historyLength: 0
      }
    }
  ],
  document: {
    coverage: 'Coverage: WML-201',
    description: 'Description: Basic navigation',
    goal: 'Goal: Exercise card navigation',
    testingAcceptance: ['Select advances to the next card.']
  }
};

describe('Developer Tools workspace', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `<main>${developerDrawerTemplate('window')}</main>`;
    const workspace = document.querySelector<HTMLElement>('#developer-tools-workspace');
    if (!workspace) throw new Error('missing workspace in test fixture');
    root = workspace;
  });

  it('uses one selected tab and one exposed task panel at a time', () => {
    const dispose = bindDeveloperToolsWorkspace(root);
    const transportTab = root.querySelector<HTMLButtonElement>('#devtools-tab-transport');
    const overviewPanel = root.querySelector<HTMLElement>('#devtools-panel-overview');
    const transportPanel = root.querySelector<HTMLElement>('#devtools-panel-transport');

    transportTab?.click();

    expect(transportTab?.getAttribute('aria-selected')).toBe('true');
    expect(transportTab?.tabIndex).toBe(0);
    expect(overviewPanel?.hidden).toBe(true);
    expect(transportPanel?.hidden).toBe(false);
    dispose();
  });

  it('supports roving keyboard focus without scrolling the document', () => {
    const dispose = bindDeveloperToolsWorkspace(root);
    const overviewTab = root.querySelector<HTMLButtonElement>('#devtools-tab-overview');
    const transportTab = root.querySelector<HTMLButtonElement>('#devtools-tab-transport');

    overviewTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(transportTab?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(transportTab);
    dispose();
  });

  it('renders structured summaries from allowlisted diagnostics', () => {
    renderDeveloperToolsState(root, state);

    expect(root.querySelector('#developer-tools-host-status')?.textContent).toBe('Health: ok');
    expect(root.querySelector('#developer-tools-host-status')?.getAttribute('role')).toBe('status');
    expect(root.querySelector('#developer-tools-host-status')?.getAttribute('aria-live')).toBe(
      'polite'
    );
    expect(root.querySelector('[data-devtools-value="run-mode"]')?.textContent).toBe('local');
    expect(root.querySelector('[data-devtools-value="transport-time"]')?.textContent).toBe('7 ms');
    expect(root.querySelector('[data-devtools-value="next-timer"]')?.textContent).toBe('250 ms');
    expect(root.querySelector('#session-state')?.textContent).toContain(
      '"navigationStatus": "loaded"'
    );
    expect(root.querySelector('#transport-response')?.textContent).toContain('"status": 200');
    expect(root.querySelector('#snapshot')?.textContent).toContain('"hasActiveCard": true');
    expect(root.querySelector('#timeline')?.textContent).toContain('"load-local-example"');
    expect(root.querySelector('#local-example-testing-ac li')?.textContent).toContain(
      'Select advances'
    );
  });
});
