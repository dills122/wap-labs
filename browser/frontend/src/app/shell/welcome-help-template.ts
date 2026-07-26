import { WAVES_COPY } from '../waves-copy';

export const welcomeHelpTemplate = () => `
  <details id="welcome-help-panel" class="welcome-help-panel chrome-disclosure" open>
    <summary id="welcome-help-toggle">${WAVES_COPY.shell.welcomeHelpTitle}</summary>
    <div class="welcome-help-body">
      <p>${WAVES_COPY.shell.welcomeIntro}</p>
      <p>${WAVES_COPY.shell.welcomeModes}</p>
      <div class="actions">
        <button id="btn-start-tour" class="btn wv95-btn">${WAVES_COPY.shell.takeTheTour}</button>
        <button id="btn-try-local-examples" class="btn wv95-btn">
          ${WAVES_COPY.shell.tryLocalExamples}
        </button>
        <button id="btn-connect-network" class="btn wv95-btn">
          ${WAVES_COPY.shell.connectToServer}
        </button>
      </div>
      <h2>${WAVES_COPY.shell.controlsReferenceTitle}</h2>
      <p>${WAVES_COPY.shell.controlsReferenceBody}</p>
      <h2>${WAVES_COPY.shell.troubleshootingTitle}</h2>
      <p>${WAVES_COPY.shell.troubleshootingBody}</p>
    </div>
  </details>
`;
