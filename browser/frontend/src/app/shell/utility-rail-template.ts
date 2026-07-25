import { WAVES_CONFIG } from '../waves-config';
import { WAVES_COPY } from '../waves-copy';

export const UTILITY_RAIL_NARROW_MEDIA_QUERY = '(max-width: 900px)';

export const utilityRailTemplate = () => `
  <aside class="utility-rail" aria-label="Utility rail">
    <details id="utility-rail-panel" class="utility-rail-panel" open>
      <summary>${WAVES_COPY.shell.utilityRail}</summary>
      <div class="utility-rail-body">
        <label class="compact-field">
          ${WAVES_COPY.shell.viewportCols}
          <input
            id="viewport-cols"
            class="form-95"
            type="number"
            value="${WAVES_CONFIG.defaultViewportCols}"
            min="1"
          />
        </label>
        <wv-surface-panel heading="${WAVES_COPY.shell.status}">
          <wv-status-panel id="status"></wv-status-panel>
        </wv-surface-panel>
        <details id="local-example-notes" class="local-example-notes" aria-live="polite">
          <summary>${WAVES_COPY.shell.localExampleNotes}</summary>
          <div class="local-example-notes-body">
            <p id="local-example-coverage" class="local-example-notes-coverage"></p>
            <p id="local-example-description"></p>
            <p id="local-example-goal"></p>
            <h3>${WAVES_COPY.shell.localExampleTestingAc}</h3>
            <ul id="local-example-testing-ac"></ul>
          </div>
        </details>
      </div>
    </details>
    <div id="toast" class="toast toast-hidden" role="alert" aria-live="polite"></div>
  </aside>
`;
