import { WAVES_COPY } from '../waves-copy';
import { developerDrawerTemplate } from './developer-drawer-template';

export const utilityRailTemplate = () => `
  <aside class="utility-rail" aria-label="${WAVES_COPY.shell.inspector}">
    <details id="utility-rail-panel" class="utility-rail-panel">
      <summary id="utility-rail-toggle">${WAVES_COPY.shell.utilityRail}</summary>
      <div class="utility-rail-body">
        ${developerDrawerTemplate()}
      </div>
    </details>
    <div id="toast" class="toast toast-hidden"></div>
  </aside>
`;
