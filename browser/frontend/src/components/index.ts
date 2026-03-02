import { WvStatusPanel } from './status-panel';
import { WvSurfacePanel } from './primitives/surface-panel';

export const registerBrowserComponents = (): void => {
  if (!customElements.get('wv-status-panel')) {
    customElements.define('wv-status-panel', WvStatusPanel);
  }
  if (!customElements.get('wv-surface-panel')) {
    customElements.define('wv-surface-panel', WvSurfacePanel);
  }
};
