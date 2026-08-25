import { WAVES_COPY } from '../waves-copy';
import { WAVES_CONFIG } from '../waves-config';

const networkAddressOptions = WAVES_CONFIG.networkAddressSuggestions
  .map(({ label, url }) => `<option value="${url}" label="${label}"></option>`)
  .join('');

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
          placeholder="${WAVES_COPY.shell.addressPlaceholder}"
          list="network-address-options"
          inputmode="url"
          autocapitalize="none"
          spellcheck="false"
        />
        <datalist id="network-address-options">${networkAddressOptions}</datalist>
        <label id="local-example-wrap" class="omnibox-local">
          <span class="visually-hidden">${WAVES_COPY.shell.localExample}</span>
          <select id="local-example" class="host-control"></select>
        </label>
      </div>
      <div class="omnibox-actions">
        <button
          id="btn-fetch-url"
          class="btn chrome-btn primary"
          data-navigation-action="go"
        >${WAVES_COPY.shell.go}</button>
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

    <div class="application-control" role="group" aria-label="${WAVES_COPY.shell.applicationControls}">
      <button id="btn-library" class="btn chrome-btn" type="button" aria-controls="library-surface" aria-expanded="false">
        ${WAVES_COPY.library.title}
      </button>
      <button id="btn-preferences" class="btn chrome-btn" type="button" aria-controls="preferences-surface" aria-expanded="false">
        ${WAVES_COPY.preferences.title}
      </button>
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
