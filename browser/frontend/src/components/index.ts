import { WvStatusPanel } from './status-panel';

export const registerBrowserComponents = (): void => {
  if (!customElements.get('wv-status-panel')) {
    customElements.define('wv-status-panel', WvStatusPanel);
  }
};
