import { WAVES_COPY } from '../waves-copy';

export const handsetStageTemplate = () => `
  <section class="handset-stage" aria-label="Handset display">
    <div class="device-frame">
      <div class="device-header">
        <span>${WAVES_COPY.shell.deckView}</span>
        <span id="active-url-label" class="muted-url">${WAVES_COPY.shell.idle}</span>
      </div>
      <div
        id="viewport"
        class="viewport viewport-skeleton"
        aria-busy="true"
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
  </section>
`;
