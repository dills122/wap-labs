import type { WvStatusPanel } from '../components/status-panel';

const BROWSER_SHELL_TEMPLATE = `
  <div class="browser-shell">
    <header class="browser-chrome">
      <div class="title-row">
        <div class="brand">Waves</div>
        <div class="caption">Desktop WAP Browser Preview</div>
      </div>
      <div class="nav-row">
        <button id="btn-back" class="chrome-btn">Back</button>
        <button id="btn-reload" class="chrome-btn">Reload</button>
        <input id="fetch-url" type="text" value="http://127.0.0.1:3000/" aria-label="Address" />
        <button id="btn-fetch-url" class="chrome-btn primary">Go</button>
      </div>
    </header>

    <main class="browser-main">
      <section class="device-frame">
        <div class="device-header">
          <span>Deck View</span>
          <span id="active-url-label" class="muted-url">idle</span>
        </div>
        <div id="viewport" class="viewport"></div>
        <div class="softkey-row">
          <button id="btn-up">Up</button>
          <button id="btn-enter">Select</button>
          <button id="btn-down">Down</button>
        </div>
      </section>

      <aside class="side-panel">
        <label class="compact-field">
          Viewport Cols
          <input id="viewport-cols" type="number" value="20" min="1" />
        </label>
        <wv-surface-panel heading="Status">
          <wv-status-panel id="status"></wv-status-panel>
        </wv-surface-panel>
        <div id="toast" class="toast toast-hidden" role="alert" aria-live="polite"></div>

        <details id="dev-drawer" class="dev-drawer">
          <summary>Developer Tools</summary>
          <div class="panel-body">
            <div class="actions">
              <button id="btn-health">Health</button>
              <button id="btn-render">Render</button>
              <button id="btn-snapshot">Snapshot</button>
              <button id="btn-clear-intent">Clear External Intent</button>
              <button id="btn-export-timeline">Export Timeline</button>
              <button id="btn-clear-timeline">Clear Timeline</button>
            </div>
            <details id="debug-raw-mode" style="margin-top: 10px;">
              <summary>Raw WML Paste</summary>
              <div style="margin-top: 8px;">
                <label>
                  Base URL
                  <input id="base-url" type="text" value="http://local.test/start.wml" />
                </label>
                <textarea id="wml-input"></textarea>
                <div class="actions">
                  <button id="btn-load-context">Load Raw WML</button>
                </div>
              </div>
            </details>
            <h3>Session State</h3>
            <pre id="session-state"></pre>
            <h3>Transport Response</h3>
            <pre id="transport-response"></pre>
            <h3>Runtime Snapshot</h3>
            <pre id="snapshot"></pre>
            <h3>Event Timeline</h3>
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
}

export const mountBrowserShell = (): BrowserShellRefs => {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('missing #app root');
  }
  app.innerHTML = BROWSER_SHELL_TEMPLATE;

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
    !toastEl
  ) {
    throw new Error('missing expected UI element');
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
    toastEl
  };
};
