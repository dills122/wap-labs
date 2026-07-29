import { WAVES_COPY } from '../waves-copy';

export type DeveloperToolsSurface = 'docked' | 'window';

const actionButton = (id: string, action: string, label: string, primary = false): string => `
  <button
    id="${id}"
    class="btn developer-tools-action${primary ? ' primary' : ''}"
    type="button"
    data-devtools-action="${action}"
  >${label}</button>
`;

export const developerDrawerTemplate = (surface: DeveloperToolsSurface = 'docked') => {
  const headingTag = surface === 'window' ? 'h1' : 'h2';
  return `
  <section
    class="developer-drawer-section"
    aria-label="${WAVES_COPY.shell.developerTools}"
    aria-labelledby="developer-tools-title"
    data-developer-tools-surface="${surface}"
  >
    <details id="dev-drawer" class="dev-drawer"${surface === 'window' ? ' open' : ''}>
      <summary id="dev-drawer-toggle" class="visually-hidden" tabindex="-1" aria-hidden="true">
        ${WAVES_COPY.shell.developerTools}
      </summary>
      <div id="developer-tools-workspace" class="developer-tools-workspace">
        <header class="developer-tools-toolbar">
          <div class="developer-tools-heading">
            <${headingTag} id="developer-tools-title">${WAVES_COPY.shell.developerTools}</${headingTag}>
            <p id="developer-tools-target">${WAVES_COPY.shell.noActiveDeck}</p>
          </div>
          <div class="developer-tools-actions" aria-label="${WAVES_COPY.shell.developerToolsActions}">
            ${actionButton('btn-health', 'health', WAVES_COPY.shell.health)}
            ${actionButton('btn-render', 'render', WAVES_COPY.shell.render)}
            ${actionButton('btn-snapshot', 'snapshot', WAVES_COPY.shell.snapshot, true)}
            ${
              surface === 'docked'
                ? actionButton(
                    'btn-open-devtools-window',
                    'open-window',
                    WAVES_COPY.shell.openInWindow
                  )
                : ''
            }
          </div>
          <p class="developer-tools-activity">
            <span>${WAVES_COPY.shell.status}</span>
            <output
              id="developer-tools-host-status"
              ${surface === 'window' ? 'role="status" aria-live="polite" aria-atomic="true"' : ''}
            >${WAVES_COPY.status.ready}</output>
          </p>
        </header>

        <div
          class="developer-tools-tabs"
          role="tablist"
          aria-label="${WAVES_COPY.shell.developerToolsPanels}"
        >
          <button id="devtools-tab-overview" class="developer-tools-tab" type="button" role="tab" aria-selected="true" aria-controls="devtools-panel-overview" tabindex="0">${WAVES_COPY.shell.overview}</button>
          <button id="devtools-tab-transport" class="developer-tools-tab" type="button" role="tab" aria-selected="false" aria-controls="devtools-panel-transport" tabindex="-1">${WAVES_COPY.shell.transport}</button>
          <button id="devtools-tab-runtime" class="developer-tools-tab" type="button" role="tab" aria-selected="false" aria-controls="devtools-panel-runtime" tabindex="-1">${WAVES_COPY.shell.runtime}</button>
          <button id="devtools-tab-timeline" class="developer-tools-tab" type="button" role="tab" aria-selected="false" aria-controls="devtools-panel-timeline" tabindex="-1">${WAVES_COPY.shell.timeline}</button>
          <button id="devtools-tab-source" class="developer-tools-tab" type="button" role="tab" aria-selected="false" aria-controls="devtools-panel-source" tabindex="-1">${WAVES_COPY.shell.source}</button>
        </div>

        <div class="developer-tools-panels">
          <section id="devtools-panel-overview" class="developer-tools-panel" role="tabpanel" aria-labelledby="devtools-tab-overview" tabindex="0">
            <div class="developer-tools-summary" aria-label="${WAVES_COPY.shell.currentSessionSummary}">
              <div><span>${WAVES_COPY.shell.mode}</span><strong data-devtools-value="run-mode">—</strong></div>
              <div><span>${WAVES_COPY.shell.navigation}</span><strong data-devtools-value="navigation-status">—</strong></div>
              <div><span>${WAVES_COPY.shell.activeCard}</span><strong data-devtools-value="active-card">—</strong></div>
              <div><span>${WAVES_COPY.shell.events}</span><strong data-devtools-value="event-count">0</strong></div>
            </div>

            <details id="local-example-notes" class="developer-tools-section inspector-document">
              <summary id="local-example-notes-toggle">
                <span id="inspector-document-title">${WAVES_COPY.shell.document}</span>
                <span data-devtools-value="document-coverage">${WAVES_COPY.shell.noCoverage}</span>
              </summary>
              <div class="local-example-notes-body">
                <p id="local-example-coverage" class="local-example-notes-coverage"></p>
                <p id="local-example-description"></p>
                <p id="local-example-goal"></p>
                <h3>${WAVES_COPY.shell.localExampleTestingAc}</h3>
                <ul id="local-example-testing-ac"></ul>
              </div>
            </details>

            <details class="developer-tools-disclosure">
              <summary>${WAVES_COPY.shell.sessionState}</summary>
              <pre id="session-state" tabindex="0"></pre>
            </details>
          </section>

          <section id="devtools-panel-transport" class="developer-tools-panel" role="tabpanel" aria-labelledby="devtools-tab-transport" tabindex="0" hidden>
            <div class="developer-tools-summary" aria-label="${WAVES_COPY.shell.transportSummary}">
              <div><span>${WAVES_COPY.shell.status}</span><strong data-devtools-value="transport-status">—</strong></div>
              <div><span>${WAVES_COPY.shell.contentType}</span><strong data-devtools-value="content-type">—</strong></div>
              <div><span>${WAVES_COPY.shell.finalAddress}</span><strong data-devtools-value="final-url">—</strong></div>
              <div><span>${WAVES_COPY.shell.elapsed}</span><strong data-devtools-value="transport-time">—</strong></div>
            </div>
            <div class="developer-tools-code-pane">
              <h3>${WAVES_COPY.shell.transportResponse}</h3>
              <pre id="transport-response" tabindex="0"></pre>
            </div>
          </section>

          <section id="devtools-panel-runtime" class="developer-tools-panel" role="tabpanel" aria-labelledby="devtools-tab-runtime" tabindex="0" hidden>
            <div class="developer-tools-summary" aria-label="${WAVES_COPY.shell.runtimeSummary}">
              <div><span>${WAVES_COPY.shell.activeCard}</span><strong data-devtools-value="runtime-card">—</strong></div>
              <div><span>${WAVES_COPY.shell.focusedLink}</span><strong data-devtools-value="focused-link">—</strong></div>
              <div><span>${WAVES_COPY.shell.nextTimer}</span><strong data-devtools-value="next-timer">—</strong></div>
              <div><span>${WAVES_COPY.shell.baseUrl}</span><strong data-devtools-value="runtime-base-url">—</strong></div>
            </div>
            <div class="developer-tools-code-pane">
              <h3>${WAVES_COPY.shell.runtimeSnapshot}</h3>
              <pre id="snapshot" tabindex="0"></pre>
            </div>
            <div class="developer-tools-inline-actions">
              ${actionButton('btn-clear-intent', 'clear-intent', WAVES_COPY.shell.clearExternalIntent)}
            </div>
          </section>

          <section id="devtools-panel-timeline" class="developer-tools-panel" role="tabpanel" aria-labelledby="devtools-tab-timeline" tabindex="0" hidden>
            <div class="developer-tools-panel-heading">
              <div>
                <h3>${WAVES_COPY.shell.eventTimeline}</h3>
                <p>${WAVES_COPY.shell.timelineDescription}</p>
              </div>
              <div class="developer-tools-inline-actions">
                ${actionButton('btn-export-timeline', 'export-timeline', WAVES_COPY.shell.exportTimeline)}
                ${actionButton('btn-clear-timeline', 'clear-timeline', WAVES_COPY.shell.clearTimeline)}
              </div>
            </div>
            <pre id="timeline" tabindex="0"></pre>
          </section>

          <section id="devtools-panel-source" class="developer-tools-panel developer-tools-source" role="tabpanel" aria-labelledby="devtools-tab-source" tabindex="0" hidden>
            <div id="debug-raw-mode" class="developer-tools-source-editor">
              <div class="developer-tools-panel-heading">
                <div>
                  <h3 id="debug-raw-mode-toggle">${WAVES_COPY.shell.rawWmlPaste}</h3>
                  <p>${WAVES_COPY.shell.sourceDescription}</p>
                </div>
              </div>
              <label class="developer-tools-field" for="base-url">
                <span>${WAVES_COPY.shell.baseUrl}</span>
                <input id="base-url" class="host-control" type="text" value="" autocomplete="url" />
              </label>
              <label class="developer-tools-field" for="wml-input">
                <span>${WAVES_COPY.shell.rawWmlPaste}</span>
                <textarea id="wml-input" class="host-control" aria-label="${WAVES_COPY.shell.rawWmlPaste}" spellcheck="false"></textarea>
              </label>
              <div class="developer-tools-inline-actions">
                ${actionButton('btn-load-context', 'load-source', WAVES_COPY.shell.loadRawWml, true)}
              </div>
            </div>
          </section>
        </div>
      </div>
    </details>
  </section>
`;
};
