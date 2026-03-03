import { invoke } from '@tauri-apps/api/core';
import type { HostSessionState } from '../../contracts/transport';
import { createTauriHostClient } from '../../contracts/generated/tauri-host-client';
import './styles.css';
import { BrowserController } from './app/browser-controller';
import { BrowserPresenter } from './app/browser-presenter';
import { mountBrowserShell } from './app/browser-shell-template';
import { defaultStartUrl } from './app/defaults';
import { WAVES_CONFIG } from './app/waves-config';
import { WAVES_COPY } from './app/waves-copy';
import { registerBrowserComponents } from './components';

const SAMPLE_WML = `<wml>
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

let activeController: BrowserController | undefined;

const bootstrap = async (): Promise<void> => {
  activeController?.dispose();
  activeController = undefined;

  document.title = WAVES_CONFIG.appName;
  const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.content = WAVES_COPY.app.description;
  }

  registerBrowserComponents();

  const refs = mountBrowserShell(defaultStartUrl());
  const hostClient = createTauriHostClient(invoke);

  const initialSession: HostSessionState = {
    navigationStatus: 'idle',
    requestedUrl: refs.fetchUrlInput.value
  };

  const presenter = new BrowserPresenter(refs, initialSession, WAVES_CONFIG.maxTimelineEvents);
  const controller = new BrowserController(hostClient, presenter, refs);
  activeController = controller;

  await controller.init(SAMPLE_WML);
};

void bootstrap();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    activeController?.dispose();
    activeController = undefined;
  });
}
