import { WAVES_COPY } from '../waves-copy';
import { welcomeHelpTemplate } from './welcome-help-template';

// #viewport is tabindex="0" so keyboard/softkey input reaches the engine,
// and gets a minimal aria-label so it isn't a silently unnamed stop in the
// tab order. It is still a plain rendered box, not an accessible tree of the
// deck's cards/focus/actions -- that semantic frame adapter is WBP-09's
// scope (see WAVES_DESKTOP_PRODUCT_DESIGN.md "Accessibility Model"), not
// this host-chrome baseline slice (WBP-05).
export const handsetStageTemplate = () => `
  <section class="handset-stage simulator-stage" aria-label="${WAVES_COPY.shell.simulatorStage}">
    <div class="stage-heading">
      <span>${WAVES_COPY.shell.referenceView}</span>
      <span class="stage-heading-actions">
        <button
          id="btn-welcome-toggle"
          class="stage-welcome-toggle"
          type="button"
          aria-controls="welcome-help-panel"
          aria-expanded="true"
        >
          ${WAVES_COPY.shell.welcome}
        </button>
        <span>${WAVES_COPY.shell.classCReferenceProfile}</span>
      </span>
    </div>
    ${welcomeHelpTemplate()}
    <div class="handset-housing reference-view">
      <div class="device-frame">
        <div
          id="viewport"
          class="viewport viewport-skeleton"
          aria-busy="true"
          aria-label="${WAVES_COPY.shell.deckViewport}"
          tabindex="0"
        >
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-wide"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-wide"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-hint">${WAVES_COPY.shell.firstRenderPending}</div>
        </div>
        <div class="softkey-row" role="group" aria-label="Softkey navigation">
          <button id="btn-up" class="btn">${WAVES_COPY.shell.up}</button>
          <button id="btn-enter" class="btn">${WAVES_COPY.shell.select}</button>
          <button id="btn-down" class="btn">${WAVES_COPY.shell.down}</button>
        </div>
      </div>
    </div>
  </section>
`;
