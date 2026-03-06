import type { WvStatusPanel } from '../components/status-panel';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';

const browserShellTemplate = () => `
  <div class="browser-shell">
    <header class="browser-chrome">
      <div class="title-row">
        <div class="brand">${WAVES_COPY.app.brand}</div>
        <div class="caption">${WAVES_COPY.app.tagline}</div>
      </div>
      <div class="nav-row">
        <button id="btn-back" class="chrome-btn">${WAVES_COPY.shell.back}</button>
        <button id="btn-reload" class="chrome-btn">${WAVES_COPY.shell.reload}</button>
        <input id="fetch-url" type="text" value="" aria-label="Address" />
        <button id="btn-fetch-url" class="chrome-btn primary">${WAVES_COPY.shell.go}</button>
      </div>
      <div class="mode-row">
        <label class="mode-field">
          <span>${WAVES_COPY.shell.mode}</span>
          <select id="run-mode">
            <option value="local">${WAVES_COPY.shell.localMode}</option>
            <option value="network">${WAVES_COPY.shell.networkMode}</option>
          </select>
        </label>
        <label id="local-example-wrap" class="mode-field">
          <span>${WAVES_COPY.shell.localExample}</span>
          <select id="local-example"></select>
        </label>
        <button id="btn-load-local" class="chrome-btn">${WAVES_COPY.shell.loadLocal}</button>
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
          <button id="btn-up">${WAVES_COPY.shell.up}</button>
          <button id="btn-enter">${WAVES_COPY.shell.select}</button>
          <button id="btn-down">${WAVES_COPY.shell.down}</button>
        </div>
      </section>

      <aside class="side-panel">
        <label class="compact-field">
          ${WAVES_COPY.shell.viewportCols}
          <input id="viewport-cols" type="number" value="${WAVES_CONFIG.defaultViewportCols}" min="1" />
        </label>
        <wv-surface-panel heading="${WAVES_COPY.shell.status}">
          <wv-status-panel id="status"></wv-status-panel>
        </wv-surface-panel>
        <div id="toast" class="toast toast-hidden" role="alert" aria-live="polite"></div>

        <details id="dev-drawer" class="dev-drawer">
          <summary>${WAVES_COPY.shell.developerTools}</summary>
          <div class="panel-body">
            <div class="actions">
              <button id="btn-health">${WAVES_COPY.shell.health}</button>
              <button id="btn-render">${WAVES_COPY.shell.render}</button>
              <button id="btn-snapshot">${WAVES_COPY.shell.snapshot}</button>
              <button id="btn-clear-intent">${WAVES_COPY.shell.clearExternalIntent}</button>
              <button id="btn-export-timeline">${WAVES_COPY.shell.exportTimeline}</button>
              <button id="btn-clear-timeline">${WAVES_COPY.shell.clearTimeline}</button>
            </div>
            <details id="debug-raw-mode" style="margin-top: 10px;">
              <summary>${WAVES_COPY.shell.rawWmlPaste}</summary>
              <div style="margin-top: 8px;">
                <label>
                  ${WAVES_COPY.shell.baseUrl}
                  <input id="base-url" type="text" value="" />
                </label>
                <textarea id="wml-input"></textarea>
                <div class="actions">
                  <button id="btn-load-context">${WAVES_COPY.shell.loadRawWml}</button>
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
    !localExampleWrapEl
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
    localExampleWrapEl
  };
};
