import { WAVES_COPY } from '../waves-copy';

export const navigationToolbarTemplate = () => `
  <nav class="nav-toolbar" aria-label="Browser navigation">
    <h1 class="brand">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-name">${WAVES_COPY.app.brand}</span>
    </h1>

    <div class="history-control" role="group" aria-label="${WAVES_COPY.shell.historyControls}">
      <button
        id="btn-back"
        class="btn chrome-btn icon-btn"
        aria-label="${WAVES_COPY.shell.back}"
        title="${WAVES_COPY.shell.back}"
      >
        <span aria-hidden="true">‹</span>
        <span class="toolbar-button-label">${WAVES_COPY.shell.back}</span>
      </button>
      <button
        id="btn-reload"
        class="btn chrome-btn icon-btn"
        aria-label="${WAVES_COPY.shell.reload}"
        title="${WAVES_COPY.shell.reload}"
      >
        <span aria-hidden="true">↻</span>
        <span class="toolbar-button-label">${WAVES_COPY.shell.reload}</span>
      </button>
    </div>

    <div class="omnibox">
      <div class="omnibox-field">
        <input
          id="fetch-url"
          class="host-control omnibox-network"
          type="text"
          value=""
          aria-label="${WAVES_COPY.shell.address}"
        />
        <label id="local-example-wrap" class="omnibox-local">
          <span class="visually-hidden">${WAVES_COPY.shell.localExample}</span>
          <select id="local-example" class="host-control"></select>
        </label>
      </div>
      <div class="omnibox-actions">
        <button id="btn-fetch-url" class="btn chrome-btn primary">${WAVES_COPY.shell.go}</button>
        <button id="btn-load-local" class="btn chrome-btn primary">
          ${WAVES_COPY.shell.loadLocal}
        </button>
      </div>
    </div>

    <div class="mode-switch" role="group" aria-label="${WAVES_COPY.shell.mode}">
      <button id="btn-mode-local" class="mode-segment" type="button" aria-pressed="false">
        ${WAVES_COPY.shell.localMode}
      </button>
      <button id="btn-mode-network" class="mode-segment" type="button" aria-pressed="false">
        ${WAVES_COPY.shell.networkMode}
      </button>
      <label class="visually-hidden">
        ${WAVES_COPY.shell.mode}
        <select id="run-mode" tabindex="-1" aria-hidden="true">
          <option value="local">${WAVES_COPY.shell.localMode}</option>
          <option value="network">${WAVES_COPY.shell.networkMode}</option>
        </select>
      </label>
    </div>

    <button
      id="btn-inspector"
      class="btn chrome-btn inspector-toggle"
      type="button"
      aria-controls="utility-rail-panel"
      aria-expanded="false"
      title="${WAVES_COPY.shell.inspector}"
    >
      <span class="inspector-glyph" aria-hidden="true"></span>
      <span class="toolbar-button-label">${WAVES_COPY.shell.inspector}</span>
    </button>
  </nav>
`;
