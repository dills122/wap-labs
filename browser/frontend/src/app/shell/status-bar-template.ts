import { WAVES_CONFIG } from '../waves-config';
import { WAVES_COPY } from '../waves-copy';
import { HANDSET_SCALE_STEPS } from '../handset-scale-control';

const handsetScaleOptions = HANDSET_SCALE_STEPS.map(
  (scale) => `<option value="${scale}">${scale}×</option>`
).join('');

export const statusBarTemplate = () => `
  <footer class="status-bar" aria-label="${WAVES_COPY.shell.applicationStatus}">
    <div class="status-primary">
      <div class="status-readout status-connection">
        <wv-status-panel id="status"></wv-status-panel>
      </div>
    </div>
    <div class="status-context">
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
    </div>
    <div class="status-controls">
      <label class="status-control status-viewport">
        <span class="status-control-label status-control-label-full">
          ${WAVES_COPY.shell.viewportCols}
        </span>
        <span class="status-control-label status-control-label-short" aria-hidden="true">
          Cols
        </span>
        <input
          id="viewport-cols"
          class="status-input"
          type="number"
          value="${WAVES_CONFIG.defaultViewportCols}"
          min="1"
          aria-label="${WAVES_COPY.shell.viewportCols}"
        />
      </label>
      <label class="status-control status-scale">
        <span class="status-control-label status-control-label-full">
          ${WAVES_COPY.shell.displayScale}
        </span>
        <span class="status-control-label status-control-label-short" aria-hidden="true">
          Scale
        </span>
        <select
          id="handset-scale-select"
          class="status-input"
          aria-label="${WAVES_COPY.shell.displayScale}"
        >
          ${handsetScaleOptions}
        </select>
      </label>
    </div>
  </footer>
`;
