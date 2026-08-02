import { WAVES_COPY } from '../waves-copy';

export const sessionRecoveryTemplate = () => `
  <section
    id="session-recovery"
    class="session-recovery"
    aria-labelledby="session-recovery-title"
    data-recovery-state="idle"
    hidden
  >
    <div class="session-recovery-copy">
      <strong id="session-recovery-title">${WAVES_COPY.recovery.title}</strong>
      <span id="session-recovery-message"></span>
    </div>
    <div id="session-recovery-actions" class="session-recovery-actions">
      <button id="btn-session-recovery-restore" class="btn primary" type="button">
        ${WAVES_COPY.recovery.restore}
      </button>
      <button id="btn-session-recovery-dismiss" class="btn" type="button">
        ${WAVES_COPY.recovery.dismiss}
      </button>
    </div>
  </section>
`;
