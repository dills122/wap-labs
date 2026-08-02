import { WAVES_COPY } from '../waves-copy';

export const applicationSurfacesTemplate = () => `
  <section
    id="library-surface"
    class="application-surface"
    aria-labelledby="library-title"
    tabindex="-1"
    hidden
  >
    <div class="application-surface-header">
      <div>
        <p class="application-surface-eyebrow">${WAVES_COPY.library.eyebrow}</p>
        <h2 id="library-title">${WAVES_COPY.library.title}</h2>
        <p>${WAVES_COPY.library.description}</p>
      </div>
      <button id="btn-library-close" class="btn" type="button">${WAVES_COPY.library.close}</button>
    </div>

    <div class="library-actions" aria-label="${WAVES_COPY.library.actions}">
      <button id="btn-add-favorite" class="btn primary" type="button">${WAVES_COPY.library.addFavorite}</button>
      <button id="btn-import-favorites" class="btn" type="button">${WAVES_COPY.library.importFavorites}</button>
      <button id="btn-export-favorites" class="btn" type="button">${WAVES_COPY.library.exportFavorites}</button>
      <input id="favorites-import-file" type="file" accept="application/json,.json" hidden />
    </div>

    <div class="library-grid">
      <section class="library-section" aria-labelledby="library-examples-title">
        <h3 id="library-examples-title">${WAVES_COPY.library.examples}</h3>
        <p>${WAVES_COPY.library.examplesDescription}</p>
        <div id="library-example-list" class="library-list"></div>
      </section>

      <section class="library-section" aria-labelledby="library-favorites-title">
        <h3 id="library-favorites-title">${WAVES_COPY.library.favorites}</h3>
        <p id="library-favorites-summary"></p>
        <div id="library-favorite-list" class="library-list"></div>
      </section>

      <section class="library-section" aria-labelledby="library-services-title">
        <h3 id="library-services-title">${WAVES_COPY.library.services}</h3>
        <p>${WAVES_COPY.library.servicesUnavailable}</p>
        <button class="btn" type="button" disabled aria-describedby="library-services-title">
          ${WAVES_COPY.library.noPublishedServices}
        </button>
      </section>
    </div>
  </section>

  <section
    id="preferences-surface"
    class="application-surface"
    aria-labelledby="preferences-title"
    tabindex="-1"
    hidden
  >
    <div class="application-surface-header">
      <div>
        <p class="application-surface-eyebrow">${WAVES_COPY.preferences.eyebrow}</p>
        <h2 id="preferences-title">${WAVES_COPY.preferences.title}</h2>
        <p>${WAVES_COPY.preferences.description}</p>
      </div>
      <button id="btn-preferences-close" class="btn" type="button">${WAVES_COPY.preferences.close}</button>
    </div>

    <form id="preferences-form" class="preferences-grid">
      <fieldset>
        <legend>${WAVES_COPY.preferences.basic}</legend>
        <label>${WAVES_COPY.preferences.defaultMode}
          <select id="preference-default-mode" class="host-control">
            <option value="local">${WAVES_COPY.shell.localMode}</option>
            <option value="network">${WAVES_COPY.shell.networkMode}</option>
          </select>
        </label>
        <label>${WAVES_COPY.preferences.startBehavior}
          <select id="preference-start-behavior" class="host-control">
            <option value="home">${WAVES_COPY.preferences.startHome}</option>
            <option value="safe-session">${WAVES_COPY.preferences.startSafeSession}</option>
          </select>
        </label>
        <label>${WAVES_COPY.preferences.displayScale}
          <select id="preference-display-scale" class="host-control">
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>${WAVES_COPY.preferences.accessibility}</legend>
        <label class="preference-check"><input id="preference-high-contrast" type="checkbox" /> ${WAVES_COPY.preferences.highContrast}</label>
        <label class="preference-check"><input id="preference-reduced-motion" type="checkbox" /> ${WAVES_COPY.preferences.reducedMotion}</label>
      </fieldset>

      <fieldset>
        <legend>${WAVES_COPY.preferences.safety}</legend>
        <label class="preference-check"><input id="preference-safe-restore" type="checkbox" /> ${WAVES_COPY.preferences.safeRestore}</label>
        <p>${WAVES_COPY.preferences.safeRestoreDetail}</p>
      </fieldset>

      <fieldset>
        <legend>${WAVES_COPY.preferences.developer}</legend>
        <label class="preference-check"><input id="preference-developer-mode" type="checkbox" /> ${WAVES_COPY.preferences.developerMode}</label>
        <label>${WAVES_COPY.preferences.retention}
          <input id="preference-retention" class="host-control" type="number" min="25" max="2000" step="25" />
        </label>
        <p>${WAVES_COPY.preferences.noProtocolChanges}</p>
      </fieldset>

      <div class="preferences-actions">
        <button id="btn-save-preferences" class="btn primary" type="submit">${WAVES_COPY.preferences.save}</button>
        <button id="btn-reset-preferences" class="btn" type="button">${WAVES_COPY.preferences.resetPreferences}</button>
        <button id="btn-request-reset-all" class="btn danger" type="button">${WAVES_COPY.preferences.resetAll}</button>
      </div>
    </form>

    <div id="reset-all-confirmation" class="reset-confirmation" hidden>
      <p>${WAVES_COPY.preferences.resetAllConfirmation}</p>
      <button id="btn-confirm-reset-all" class="btn danger" type="button">${WAVES_COPY.preferences.confirmResetAll}</button>
      <button id="btn-cancel-reset-all" class="btn" type="button">${WAVES_COPY.preferences.cancel}</button>
    </div>
  </section>
`;
