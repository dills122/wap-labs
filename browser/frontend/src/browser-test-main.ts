import './styles.css';
import { composeBrowserApplication, initializeBrowserApplication } from './app/browser-application';
import { createWasmBrowserTestHost } from './test-support/wasm-browser-test-host';
import { installWavesStoryObservationBridge } from './test-support/waves-story-observation';

const main = async (): Promise<void> => {
  const host = await createWasmBrowserTestHost();
  const application = composeBrowserApplication(host.client, {
    startUrl: 'http://local.test/examples/basic.wml',
    runMode: 'local'
  });
  await initializeBrowserApplication(application);
  const retainWelcome = new URLSearchParams(window.location.search).get('welcome') === '1';
  if (!retainWelcome) {
    document.querySelector<HTMLButtonElement>('#btn-welcome-toggle')?.click();
  }
  installWavesStoryObservationBridge(application, host.diagnostics);
  document.body.setAttribute('data-story-target', 'waves-browser');
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  document.body.setAttribute('data-boot-phase', 'boot-error');
  const banner = document.createElement('div');
  banner.setAttribute('data-boot-error', 'true');
  banner.setAttribute('role', 'alert');
  banner.textContent = `Waves browser-test boot error: ${message}`;
  (document.querySelector('#app') ?? document.body).prepend(banner);
});
