import { WAVES_COPY } from '../waves-copy';

export const welcomeHelpTemplate = () => `
  <section id="welcome-help-panel" class="welcome-empty-state" aria-labelledby="welcome-help-toggle">
    <span class="welcome-mark" aria-hidden="true"></span>
    <div class="welcome-help-body">
      <h2 id="welcome-help-toggle">${WAVES_COPY.shell.welcomeHelpTitle}</h2>
      <p>${WAVES_COPY.shell.welcomeIntro}</p>
      <p>${WAVES_COPY.shell.welcomeModes}</p>
      <div class="actions">
        <button id="btn-start-tour" class="btn">${WAVES_COPY.shell.takeTheTour}</button>
        <button id="btn-try-local-examples" class="btn">
          ${WAVES_COPY.shell.tryLocalExamples}
        </button>
        <button id="btn-connect-network" class="btn">
          ${WAVES_COPY.shell.connectToServer}
        </button>
      </div>
      <h2>${WAVES_COPY.shell.controlsReferenceTitle}</h2>
      <p>${WAVES_COPY.shell.controlsReferenceBody}</p>
      <h2>${WAVES_COPY.shell.troubleshootingTitle}</h2>
      <p>${WAVES_COPY.shell.troubleshootingBody}</p>
    </div>
  </section>
`;
