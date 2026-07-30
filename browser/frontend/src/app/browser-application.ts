import type { HostSessionState } from '../../../contracts/transport';
import type { EngineRuntimeSnapshot } from '../../../contracts/engine';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';
import { BrowserController } from './browser-controller';
import { BrowserPresenter } from './browser-presenter';
import { mountBrowserShell, type BrowserShellRefs } from './browser-shell-template';
import { defaultRunMode, defaultStartUrl } from './defaults';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';
import { registerBrowserComponents } from '../components';
import { bindDeveloperToolsHost } from './developer-tools-bridge';
import { ApplicationCommandBridge } from './application-command-bridge';

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
  commandBridge: ApplicationCommandBridge;
  controller: BrowserController;
  presenter: BrowserPresenter;
  refs: BrowserShellRefs;
}

export interface BrowserApplicationOptions {
  startUrl?: string;
  runMode?: 'local' | 'network';
}

export const isWmlCommandEditingContext = (
  snapshot: Pick<EngineRuntimeSnapshot, 'focusedInputEditName' | 'focusedSelectEditName'> | null
): boolean =>
  snapshot?.focusedInputEditName !== undefined || snapshot?.focusedSelectEditName !== undefined;

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
  if (refs.developerToolsRootEl) {
    presenter.attachDeveloperToolsBridge(
      bindDeveloperToolsHost({
        root: refs.developerToolsRootEl,
        getState: () => presenter.getDeveloperToolsState(),
        onError: (message) =>
          presenter.showToast(WAVES_COPY.status.developerToolsWindowFailed(message), 'error')
      })
    );
  }
  const controller = new BrowserController(hostClient, presenter, refs);
  const commandBridge = new ApplicationCommandBridge({
    isWmlEditing: () => {
      return isWmlCommandEditingContext(presenter.getSnapshot());
    }
  });

  return { commandBridge, controller, presenter, refs };
};

export const initializeBrowserApplication = async (
  application: BrowserApplication
): Promise<void> => {
  try {
    await Promise.all([application.controller.init(SAMPLE_WML), application.commandBridge.bind()]);
  } catch (error) {
    application.commandBridge.dispose();
    throw error;
  }
};

export const disposeBrowserApplication = (application: BrowserApplication): void => {
  application.commandBridge.dispose();
  application.controller.dispose();
};
