import type { HostSessionState } from '../../../contracts/transport';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';
import { BrowserController } from './browser-controller';
import { BrowserPresenter } from './browser-presenter';
import { mountBrowserShell, type BrowserShellRefs } from './browser-shell-template';
import { defaultRunMode, defaultStartUrl } from './defaults';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';
import { registerBrowserComponents } from '../components';

const SAMPLE_WML = `<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>${WAVES_COPY.sampleDeck.intro}</p>
    <a href="#next">${WAVES_COPY.sampleDeck.next}</a>
    <a href="https://example.org/">${WAVES_COPY.sampleDeck.external}</a>
  </card>
  <card id="next">
    <p>${WAVES_COPY.sampleDeck.nextCard}</p>
    <a href="#home">${WAVES_COPY.sampleDeck.home}</a>
  </card>
</wml>`;

export interface BrowserApplication {
  controller: BrowserController;
  presenter: BrowserPresenter;
  refs: BrowserShellRefs;
}

export interface BrowserApplicationOptions {
  startUrl?: string;
  runMode?: 'local' | 'network';
}

export const composeBrowserApplication = (
  hostClient: TauriHostClient,
  options: BrowserApplicationOptions = {}
): BrowserApplication => {
  document.body.setAttribute('data-boot-phase', 'booting');
  document.title = WAVES_CONFIG.appName;
  const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.content = WAVES_COPY.app.description;
  }

  registerBrowserComponents();

  const startUrl = options.startUrl ?? defaultStartUrl();
  const runMode = options.runMode ?? defaultRunMode(undefined, startUrl);
  const refs = mountBrowserShell(startUrl, runMode);
  const initialSession: HostSessionState = {
    runMode,
    navigationStatus: 'idle',
    requestedUrl: refs.fetchUrlInput.value
  };
  const presenter = new BrowserPresenter(refs, initialSession, WAVES_CONFIG.maxTimelineEvents);
  const controller = new BrowserController(hostClient, presenter, refs);

  return { controller, presenter, refs };
};

export const initializeBrowserApplication = async (
  application: BrowserApplication
): Promise<void> => {
  await application.controller.init(SAMPLE_WML);
};
