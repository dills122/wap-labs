import { invoke } from '@tauri-apps/api/core';
import type { HostSessionState } from '../../contracts/transport';
import { createTauriHostClient } from '../../contracts/generated/tauri-host-client';
import './styles.css';
import { BrowserController } from './app/browser-controller';
import { BrowserPresenter } from './app/browser-presenter';
import { mountBrowserShell } from './app/browser-shell-template';
import { registerBrowserComponents } from './components';

const SAMPLE_WML = `<wml>
  <card id="home">
    <p>WAP/WML based browser 1.x</p>
    <a href="#next">Go to next card</a>
    <a href="https://example.org/">External link</a>
  </card>
  <card id="next">
    <p>You are on the next card.</p>
    <a href="#home">Go home</a>
  </card>
</wml>`;

const MAX_TIMELINE_EVENTS = 200;

let activeController: BrowserController | undefined;

const bootstrap = async (): Promise<void> => {
  activeController?.dispose();
  activeController = undefined;

  registerBrowserComponents();

  const refs = mountBrowserShell();
  const hostClient = createTauriHostClient(invoke);

  const initialSession: HostSessionState = {
    navigationStatus: 'idle',
    requestedUrl: refs.fetchUrlInput.value
  };

  const presenter = new BrowserPresenter(refs, initialSession, MAX_TIMELINE_EVENTS);
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
