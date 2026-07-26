import type { WvStatusPanel } from '../components/status-panel';
import { bindHandsetScaleControl } from './handset-scale-control';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';
import { developerDrawerTemplate } from './shell/developer-drawer-template';
import { handsetStageTemplate } from './shell/handset-stage-template';
import { navigationToolbarTemplate } from './shell/navigation-toolbar-template';
import {
  UTILITY_RAIL_NARROW_MEDIA_QUERY,
  utilityRailTemplate
} from './shell/utility-rail-template';

const browserShellTemplate = () => `
  <div class="browser-shell card square wv-shell-window">
    <header class="browser-chrome card-header icon">
      <div class="title-row">
        <div class="brand">${WAVES_COPY.app.brand}</div>
        <div class="caption">${WAVES_COPY.app.tagline}</div>
      </div>
      ${navigationToolbarTemplate()}
    </header>

    <main class="browser-main">
      ${handsetStageTemplate()}
      ${utilityRailTemplate()}
    </main>

    <div class="phase-bar-slot" hidden aria-hidden="true"></div>

    ${developerDrawerTemplate()}
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

// Narrow windows start with the utility rail collapsed so the handset stage
// gets the available width; the native <details> disclosure still lets the
// user reopen it manually. Guarded because jsdom's matchMedia support is
// inconsistent across environments running this same mount path in tests.
const utilityRailPrefersNarrow = (): boolean => {
  try {
    return typeof window.matchMedia === 'function'
      ? window.matchMedia(UTILITY_RAIL_NARROW_MEDIA_QUERY).matches
      : false;
  } catch {
    return false;
  }
};

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
  if (utilityRailPanelEl && utilityRailPrefersNarrow()) {
    utilityRailPanelEl.open = false;
  }

  const handsetScaleSelectEl = document.querySelector<HTMLSelectElement>('#handset-scale-select');
  if (handsetScaleSelectEl) {
    bindHandsetScaleControl(handsetScaleSelectEl, document.documentElement);
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
