import { WAVES_CONFIG } from '../waves-config';
import { WAVES_COPY } from '../waves-copy';
import { welcomeHelpTemplate } from './welcome-help-template';

export const UTILITY_RAIL_NARROW_MEDIA_QUERY = '(max-width: 900px)';

export const utilityRailTemplate = () => `
  <aside class="utility-rail" aria-label="Utility rail">
    <details id="utility-rail-panel" class="utility-rail-panel chrome-disclosure" open>
      <summary id="utility-rail-toggle">${WAVES_COPY.shell.utilityRail}</summary>
      <div class="utility-rail-body">
        ${welcomeHelpTemplate()}
        <label class="compact-field">
          ${WAVES_COPY.shell.viewportCols}
          <input
            id="viewport-cols"
            class="host-control"
            type="number"
            value="${WAVES_CONFIG.defaultViewportCols}"
            min="1"
          />
        </label>
        <label class="compact-field">
          ${WAVES_COPY.shell.displayScale}
          <select id="handset-scale-select" class="host-control">
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="3">3x</option>
          </select>
        </label>
        <wv-surface-panel heading="${WAVES_COPY.shell.status}">
          <wv-status-panel id="status"></wv-status-panel>
        </wv-surface-panel>
        <details id="local-example-notes" class="local-example-notes chrome-disclosure">
          <summary id="local-example-notes-toggle">${WAVES_COPY.shell.localExampleNotes}</summary>
          <div class="local-example-notes-body">
            <p id="local-example-coverage" class="local-example-notes-coverage"></p>
            <p id="local-example-description"></p>
            <p id="local-example-goal"></p>
            <h2>${WAVES_COPY.shell.localExampleTestingAc}</h2>
            <ul id="local-example-testing-ac"></ul>
          </div>
        </details>
      </div>
    </details>
    <div id="toast" class="toast toast-hidden"></div>
  </aside>
`;
