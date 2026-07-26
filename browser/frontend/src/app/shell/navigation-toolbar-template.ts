import { WAVES_COPY } from '../waves-copy';

export const navigationToolbarTemplate = () => `
  <nav class="nav-toolbar" aria-label="Browser navigation">
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
    <div class="toolbar-meta">
      <span class="toolbar-meta-item">
        <span class="toolbar-meta-label">${WAVES_COPY.shell.route}</span>
        <span id="route-label"></span>
      </span>
      <span class="toolbar-meta-item">
        <span class="toolbar-meta-label">${WAVES_COPY.shell.profile}</span>
        <span id="profile-label">${WAVES_COPY.shell.classCReferenceProfile}</span>
      </span>
    </div>
  </nav>
`;
