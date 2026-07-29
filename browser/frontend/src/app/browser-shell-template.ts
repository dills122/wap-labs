import type { WvStatusPanel } from '../components/status-panel';
import { bindHandsetScaleControl } from './handset-scale-control';
import { bindRouteIndicator } from './route-indicator';
import { bindWelcomeHelpControls } from './welcome-help-control';
import { WAVES_CONFIG } from './waves-config';
import { handsetStageTemplate } from './shell/handset-stage-template';
import { navigationToolbarTemplate } from './shell/navigation-toolbar-template';
import { statusBarTemplate } from './shell/status-bar-template';
import { utilityRailTemplate } from './shell/utility-rail-template';

const browserShellTemplate = () => `
  <div class="browser-shell" data-host-presentation="native">
    <header class="browser-chrome">
      ${navigationToolbarTemplate()}
    </header>

    <main class="browser-main">
      ${handsetStageTemplate()}
      ${utilityRailTemplate()}
    </main>

    <div class="phase-bar-slot" hidden aria-hidden="true"></div>

    ${statusBarTemplate()}

    <div
      id="live-announcer"
      class="visually-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    ></div>
  </div>
`;

export interface BrowserShellRefs {
  wmlInput: HTMLTextAreaElement;
  baseUrlInput: HTMLInputElement;
  viewportColsInput: HTMLInputElement;
  viewportEl: HTMLDivElement;
  snapshotEl: HTMLPreElement;
  statusEl: WvStatusPanel;
  fetchUrlInput: HTMLInputElement;
  transportResponseEl: HTMLPreElement;
  sessionStateEl: HTMLPreElement;
  timelineEl: HTMLPreElement;
  activeUrlLabelEl: HTMLSpanElement;
  devDrawerEl: HTMLDetailsElement;
  toastEl: HTMLDivElement;
  liveAnnouncerEl: HTMLDivElement;
  runModeSelectEl: HTMLSelectElement;
  localExampleSelectEl: HTMLSelectElement;
  loadLocalBtnEl: HTMLButtonElement;
  localExampleWrapEl: HTMLLabelElement;
  localExampleNotesEl: HTMLDetailsElement;
  localExampleCoverageEl: HTMLParagraphElement;
  localExampleDescriptionEl: HTMLParagraphElement;
  localExampleGoalEl: HTMLParagraphElement;
  localExampleTestingAcEl: HTMLUListElement;
}

export const mountBrowserShell = (
  defaultUrl: string,
  defaultRunMode: 'local' | 'network'
): BrowserShellRefs => {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('missing #app root');
  }
  app.innerHTML = browserShellTemplate();

  const wmlInput = document.querySelector<HTMLTextAreaElement>('#wml-input');
  const baseUrlInput = document.querySelector<HTMLInputElement>('#base-url');
  const viewportColsInput = document.querySelector<HTMLInputElement>('#viewport-cols');
  const viewportEl = document.querySelector<HTMLDivElement>('#viewport');
  const snapshotEl = document.querySelector<HTMLPreElement>('#snapshot');
  const statusEl = document.querySelector<WvStatusPanel>('#status');
  const fetchUrlInput = document.querySelector<HTMLInputElement>('#fetch-url');
  const transportResponseEl = document.querySelector<HTMLPreElement>('#transport-response');
  const sessionStateEl = document.querySelector<HTMLPreElement>('#session-state');
  const timelineEl = document.querySelector<HTMLPreElement>('#timeline');
  const activeUrlLabelEl = document.querySelector<HTMLSpanElement>('#active-url-label');
  const devDrawerEl = document.querySelector<HTMLDetailsElement>('#dev-drawer');
  const toastEl = document.querySelector<HTMLDivElement>('#toast');
  const liveAnnouncerEl = document.querySelector<HTMLDivElement>('#live-announcer');
  const runModeSelectEl = document.querySelector<HTMLSelectElement>('#run-mode');
  const localExampleSelectEl = document.querySelector<HTMLSelectElement>('#local-example');
  const loadLocalBtnEl = document.querySelector<HTMLButtonElement>('#btn-load-local');
  const localExampleWrapEl = document.querySelector<HTMLLabelElement>('#local-example-wrap');
  const localExampleNotesEl = document.querySelector<HTMLDetailsElement>('#local-example-notes');
  const localExampleCoverageEl =
    document.querySelector<HTMLParagraphElement>('#local-example-coverage');
  const localExampleDescriptionEl = document.querySelector<HTMLParagraphElement>(
    '#local-example-description'
  );
  const localExampleGoalEl = document.querySelector<HTMLParagraphElement>('#local-example-goal');
  const localExampleTestingAcEl = document.querySelector<HTMLUListElement>(
    '#local-example-testing-ac'
  );

  if (
    !wmlInput ||
    !baseUrlInput ||
    !viewportColsInput ||
    !viewportEl ||
    !snapshotEl ||
    !statusEl ||
    !fetchUrlInput ||
    !transportResponseEl ||
    !sessionStateEl ||
    !timelineEl ||
    !activeUrlLabelEl ||
    !devDrawerEl ||
    !toastEl ||
    !liveAnnouncerEl ||
    !runModeSelectEl ||
    !localExampleSelectEl ||
    !loadLocalBtnEl ||
    !localExampleWrapEl ||
    !localExampleNotesEl ||
    !localExampleCoverageEl ||
    !localExampleDescriptionEl ||
    !localExampleGoalEl ||
    !localExampleTestingAcEl
  ) {
    throw new Error('missing expected UI element');
  }

  // Assign URL values as properties to avoid template interpolation of runtime-provided strings.
  fetchUrlInput.value = defaultUrl;
  runModeSelectEl.value = defaultRunMode;
  baseUrlInput.value = WAVES_CONFIG.defaultDebugBaseUrl;

  const utilityRailPanelEl = document.querySelector<HTMLDetailsElement>('#utility-rail-panel');
  const inspectorButtonEl = document.querySelector<HTMLButtonElement>('#btn-inspector');
  const localModeButtonEl = document.querySelector<HTMLButtonElement>('#btn-mode-local');
  const networkModeButtonEl = document.querySelector<HTMLButtonElement>('#btn-mode-network');
  const browserShellEl = document.querySelector<HTMLElement>('.browser-shell');

  const syncRunModePresentation = (): void => {
    const mode = runModeSelectEl.value === 'network' ? 'network' : 'local';
    browserShellEl?.setAttribute('data-run-mode', mode);
    localModeButtonEl?.setAttribute('aria-pressed', String(mode === 'local'));
    networkModeButtonEl?.setAttribute('aria-pressed', String(mode === 'network'));
  };

  const requestRunMode = (mode: 'local' | 'network'): void => {
    if (runModeSelectEl.value === mode) {
      syncRunModePresentation();
      return;
    }
    runModeSelectEl.value = mode;
    syncRunModePresentation();
    runModeSelectEl.dispatchEvent(new Event('change', { bubbles: true }));
  };

  localModeButtonEl?.addEventListener('click', () => requestRunMode('local'));
  networkModeButtonEl?.addEventListener('click', () => requestRunMode('network'));
  runModeSelectEl.addEventListener('change', syncRunModePresentation);
  syncRunModePresentation();

  if (utilityRailPanelEl && inspectorButtonEl) {
    const syncInspectorPresentation = (): void => {
      inspectorButtonEl.setAttribute('aria-expanded', String(utilityRailPanelEl.open));
    };
    inspectorButtonEl.addEventListener('click', () => {
      utilityRailPanelEl.open = !utilityRailPanelEl.open;
      syncInspectorPresentation();
    });
    utilityRailPanelEl.addEventListener('toggle', syncInspectorPresentation);
    syncInspectorPresentation();
  }

  const handsetScaleSelectEl = document.querySelector<HTMLSelectElement>('#handset-scale-select');
  if (handsetScaleSelectEl) {
    bindHandsetScaleControl(handsetScaleSelectEl, document.documentElement);
  }

  const routeLabelEl = document.querySelector<HTMLSpanElement>('#route-label');
  if (routeLabelEl) {
    bindRouteIndicator(routeLabelEl, runModeSelectEl, fetchUrlInput);
  }

  const startTourBtn = document.querySelector<HTMLButtonElement>('#btn-start-tour');
  const tryLocalBtn = document.querySelector<HTMLButtonElement>('#btn-try-local-examples');
  const connectNetworkBtn = document.querySelector<HTMLButtonElement>('#btn-connect-network');
  if (startTourBtn && tryLocalBtn && connectNetworkBtn) {
    bindWelcomeHelpControls({
      startTourBtn,
      tryLocalBtn,
      connectNetworkBtn,
      runModeSelectEl,
      localExampleSelectEl,
      loadLocalBtnEl,
      fetchUrlInputEl: fetchUrlInput
    });
  }

  return {
    wmlInput,
    baseUrlInput,
    viewportColsInput,
    viewportEl,
    snapshotEl,
    statusEl,
    fetchUrlInput,
    transportResponseEl,
    sessionStateEl,
    timelineEl,
    activeUrlLabelEl,
    devDrawerEl,
    toastEl,
    liveAnnouncerEl,
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    localExampleWrapEl,
    localExampleNotesEl,
    localExampleCoverageEl,
    localExampleDescriptionEl,
    localExampleGoalEl,
    localExampleTestingAcEl
  };
};
