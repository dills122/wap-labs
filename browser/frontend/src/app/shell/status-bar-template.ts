import { WAVES_CONFIG } from '../waves-config';
import { WAVES_COPY } from '../waves-copy';

export const statusBarTemplate = () => `
  <footer class="status-bar" aria-label="${WAVES_COPY.shell.applicationStatus}">
    <div class="status-readout status-connection">
      <wv-status-panel id="status"></wv-status-panel>
    </div>
    <span class="status-divider" aria-hidden="true"></span>
    <span class="status-readout route-meta">
      <span class="status-label">${WAVES_COPY.shell.route}</span>
      <span id="route-label"></span>
    </span>
    <span class="status-readout status-profile">
      <span class="status-label">${WAVES_COPY.shell.profile}</span>
      <span id="profile-label">${WAVES_COPY.shell.classCReferenceProfile}</span>
    </span>
    <span class="status-readout status-location">
      <span class="status-label">${WAVES_COPY.shell.address}</span>
      <span id="active-url-label">${WAVES_COPY.shell.idle}</span>
    </span>
    <label class="status-control status-viewport">
      <span>${WAVES_COPY.shell.viewportCols}</span>
      <input
        id="viewport-cols"
        class="status-input"
        type="number"
        value="${WAVES_CONFIG.defaultViewportCols}"
        min="1"
      />
    </label>
    <label class="status-control status-scale">
      <span>${WAVES_COPY.shell.displayScale}</span>
      <select id="handset-scale-select" class="status-input">
        <option value="1">1×</option>
        <option value="2">2×</option>
        <option value="3">3×</option>
      </select>
    </label>
  </footer>
`;
