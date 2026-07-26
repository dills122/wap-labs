import { WAVES_COPY } from '../waves-copy';

export const developerDrawerTemplate = () => `
  <section class="developer-drawer-section" aria-label="Developer tools">
    <details id="dev-drawer" class="dev-drawer chrome-disclosure">
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
  </section>
`;
