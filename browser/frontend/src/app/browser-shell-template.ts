import type { WvStatusPanel } from '../components/status-panel';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';

const browserShellTemplate = () => `
  <div class="browser-shell card square wv-shell-window">
    <header class="browser-chrome card-header icon">
      <div class="title-row">
        <div class="brand">${WAVES_COPY.app.brand}</div>
        <div class="caption">${WAVES_COPY.app.tagline}</div>
      </div>
      <div class="nav-row">
        <button id="btn-back" class="btn chrome-btn">${WAVES_COPY.shell.back}</button>
        <button id="btn-reload" class="btn chrome-btn">${WAVES_COPY.shell.reload}</button>
        <input id="fetch-url" class="form-95" type="text" value="" aria-label="Address" />
        <button id="btn-fetch-url" class="btn chrome-btn primary">${WAVES_COPY.shell.go}</button>
      </div>
      <div class="mode-row">
        <label class="mode-field">
          <span>${WAVES_COPY.shell.mode}</span>
          <select id="run-mode" class="form-95">
            <option value="local">${WAVES_COPY.shell.localMode}</option>
            <option value="network">${WAVES_COPY.shell.networkMode}</option>
          </select>
        </label>
        <label id="local-example-wrap" class="mode-field">
          <span>${WAVES_COPY.shell.localExample}</span>
          <select id="local-example" class="form-95"></select>
        </label>
        <button id="btn-load-local" class="btn chrome-btn">${WAVES_COPY.shell.loadLocal}</button>
      </div>
    </header>

    <main class="browser-main">
      <section class="device-frame">
        <div class="device-header">
          <span>${WAVES_COPY.shell.deckView}</span>
          <span id="active-url-label" class="muted-url">${WAVES_COPY.shell.idle}</span>
        </div>
        <div id="viewport" class="viewport viewport-skeleton" aria-busy="true">
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-wide"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-wide"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-hint">${WAVES_COPY.shell.firstRenderPending}</div>
        </div>
        <div class="softkey-row">
          <button id="btn-up" class="btn">${WAVES_COPY.shell.up}</button>
          <button id="btn-enter" class="btn">${WAVES_COPY.shell.select}</button>
          <button id="btn-down" class="btn">${WAVES_COPY.shell.down}</button>
        </div>
      </section>

      <aside class="side-panel">
        <label class="compact-field">
          ${WAVES_COPY.shell.viewportCols}
          <input
            id="viewport-cols"
            class="form-95"
            type="number"
            value="${WAVES_CONFIG.defaultViewportCols}"
            min="1"
          />
        </label>
        <wv-surface-panel heading="${WAVES_COPY.shell.status}">
          <wv-status-panel id="status"></wv-status-panel>
        </wv-surface-panel>
        <details id="local-example-notes" class="local-example-notes" aria-live="polite">
          <summary>${WAVES_COPY.shell.localExampleNotes}</summary>
          <div class="local-example-notes-body">
            <p id="local-example-coverage" class="local-example-notes-coverage"></p>
            <p id="local-example-description"></p>
            <p id="local-example-goal"></p>
            <h3>${WAVES_COPY.shell.localExampleTestingAc}</h3>
            <ul id="local-example-testing-ac"></ul>
          </div>
        </details>
        <div id="toast" class="toast toast-hidden" role="alert" aria-live="polite"></div>

        <details id="dev-drawer" class="dev-drawer">
          <summary>${WAVES_COPY.shell.developerTools}</summary>
          <div class="panel-body">
            <div class="actions">
              <button id="btn-health" class="btn wv95-btn">${WAVES_COPY.shell.health}</button>
              <button id="btn-render" class="btn wv95-btn">${WAVES_COPY.shell.render}</button>
              <button id="btn-snapshot" class="btn wv95-btn">${WAVES_COPY.shell.snapshot}</button>
              <button id="btn-clear-intent" class="btn wv95-btn">${WAVES_COPY.shell.clearExternalIntent}</button>
              <button id="btn-export-timeline" class="btn wv95-btn">${WAVES_COPY.shell.exportTimeline}</button>
              <button id="btn-clear-timeline" class="btn wv95-btn">${WAVES_COPY.shell.clearTimeline}</button>
            </div>
            <details id="debug-raw-mode" class="debug-raw-mode">
              <summary>${WAVES_COPY.shell.rawWmlPaste}</summary>
              <div class="debug-raw-mode-content">
                <label class="compact-field">
                  ${WAVES_COPY.shell.baseUrl}
                  <input id="base-url" class="form-95" type="text" value="" />
                </label>
                <textarea id="wml-input" class="form-95"></textarea>
                <div class="actions">
                  <button id="btn-load-context" class="btn wv95-btn">${WAVES_COPY.shell.loadRawWml}</button>
                </div>
              </div>
            </details>
            <h3>${WAVES_COPY.shell.sessionState}</h3>
            <pre id="session-state"></pre>
            <h3>${WAVES_COPY.shell.transportResponse}</h3>
            <pre id="transport-response"></pre>
            <h3>${WAVES_COPY.shell.runtimeSnapshot}</h3>
            <pre id="snapshot"></pre>
            <h3>${WAVES_COPY.shell.eventTimeline}</h3>
            <pre id="timeline"></pre>
          </div>
        </details>
      </aside>
    </main>
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

export const mountBrowserShell = (defaultUrl: string): BrowserShellRefs => {
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
  baseUrlInput.value = WAVES_CONFIG.defaultDebugBaseUrl;

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
