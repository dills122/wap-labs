import { WAVES_COPY } from '../waves-copy';
import { developerDrawerTemplate } from './developer-drawer-template';

export const utilityRailTemplate = () => `
  <aside class="utility-rail" aria-label="${WAVES_COPY.shell.inspector}">
    <details id="utility-rail-panel" class="utility-rail-panel">
      <summary id="utility-rail-toggle">${WAVES_COPY.shell.utilityRail}</summary>
      <div class="utility-rail-body">
        <section class="inspector-section inspector-document" aria-labelledby="inspector-document-title">
          <h2 id="inspector-document-title">${WAVES_COPY.shell.document}</h2>
          <details id="local-example-notes" class="local-example-notes inspector-disclosure">
            <summary id="local-example-notes-toggle">${WAVES_COPY.shell.localExampleNotes}</summary>
            <div class="local-example-notes-body">
              <p id="local-example-coverage" class="local-example-notes-coverage"></p>
              <p id="local-example-description"></p>
              <p id="local-example-goal"></p>
              <h3>${WAVES_COPY.shell.localExampleTestingAc}</h3>
              <ul id="local-example-testing-ac"></ul>
            </div>
          </details>
        </section>
        ${developerDrawerTemplate()}
      </div>
    </details>
    <div id="toast" class="toast toast-hidden"></div>
  </aside>
`;
