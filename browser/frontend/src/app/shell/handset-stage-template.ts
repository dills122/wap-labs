import { WAVES_COPY } from '../waves-copy';

// #viewport is tabindex="0" so keyboard/softkey input reaches the engine,
// and gets a minimal aria-label so it isn't a silently unnamed stop in the
// tab order. It is still a plain rendered box, not an accessible tree of the
// deck's cards/focus/actions -- that semantic frame adapter is WBP-09's
// scope (see WAVES_DESKTOP_PRODUCT_DESIGN.md "Accessibility Model"), not
// this host-chrome baseline slice (WBP-05).
export const handsetStageTemplate = () => `
  <section class="handset-stage" aria-label="Handset display">
    <div class="handset-housing">
      <div class="device-frame">
        <div class="device-header">
          <span class="device-title">${WAVES_COPY.shell.deckView}</span>
          <span id="active-url-label" class="muted-url">${WAVES_COPY.shell.idle}</span>
        </div>
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
