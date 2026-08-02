import { WAVES_COPY } from '../waves-copy';

export const navigationPhaseBarTemplate = () => `
  <section
    id="navigation-phase-bar"
    class="phase-bar-slot"
    data-navigation-state="idle"
    aria-label="${WAVES_COPY.navigation.lifecycle}"
    hidden
  >
    <div class="phase-bar-summary">
      <span class="phase-bar-indicator" aria-hidden="true"></span>
      <strong id="navigation-phase-label"></strong>
      <span id="navigation-phase-detail"></span>
      <code id="navigation-correlation-id"></code>
    </div>
    <div id="navigation-recovery" class="phase-bar-recovery" hidden>
      <div class="phase-bar-error-copy">
        <strong id="navigation-error-title"></strong>
        <span id="navigation-error-message"></span>
      </div>
      <div class="phase-bar-actions" role="group" aria-label="${WAVES_COPY.navigation.recoveryActions}">
        <button id="btn-navigation-retry" class="btn" type="button">
          ${WAVES_COPY.navigation.retry}
        </button>
        <button id="btn-navigation-change-route" class="btn" type="button">
          ${WAVES_COPY.navigation.changeRoute}
        </button>
        <button id="btn-navigation-details" class="btn" type="button">
          ${WAVES_COPY.navigation.details}
        </button>
        <button id="btn-navigation-return" class="btn" type="button">
          ${WAVES_COPY.navigation.returnToDeck}
        </button>
      </div>
    </div>
  </section>
`;
