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
import { createEngineDebugSessionClient } from './engine-debug-client';
import {
  createEngineDebugSessionController,
  type EngineDebugSessionController
} from './engine-debug-session-controller';
import {
  bindEngineDebugInspector,
  type EngineDebugInspectorBinding
} from '../components/engine-debug-inspector';
import { LibraryPreferencesController } from './library-preferences-controller';
import { SessionRecoveryController } from './session-recovery-controller';
import { WindowStateController, type WindowStateAdapter } from './window-state-controller';

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
  debugInspector?: {
    binding: EngineDebugInspectorBinding;
    controller: EngineDebugSessionController;
    unsubscribe: () => void;
  };
  presenter: BrowserPresenter;
  refs: BrowserShellRefs;
  libraryPreferences: LibraryPreferencesController;
  sessionRecovery: SessionRecoveryController;
  windowState?: WindowStateController;
}

export interface BrowserApplicationOptions {
  startUrl?: string;
  runMode?: 'local' | 'network';
  windowStateAdapter?: WindowStateAdapter;
  now?: () => number;
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
  const shellAppearedAt = options.now?.() ?? performance.now();
  const initialSession: HostSessionState = {
    runMode,
    navigationStatus: 'idle',
    requestedUrl: refs.fetchUrlInput.value
  };
  const presenter = new BrowserPresenter(refs, initialSession, WAVES_CONFIG.maxTimelineEvents);
  let debugInspector: BrowserApplication['debugInspector'];
  if (refs.developerToolsRootEl) {
    const debugInspectorController = createEngineDebugSessionController({
      client: createEngineDebugSessionClient(hostClient)
    });
    const developerToolsBridge = bindDeveloperToolsHost({
      root: refs.developerToolsRootEl,
      getState: () => presenter.getDeveloperToolsState(),
      onError: (message) =>
        presenter.showToast(WAVES_COPY.status.developerToolsWindowFailed(message), 'error'),
      onInspectorAction: (action) => debugInspectorController.dispatch(action)
    });
    presenter.attachDeveloperToolsBridge(developerToolsBridge);
    const binding = bindEngineDebugInspector(refs.developerToolsRootEl, {
      dispatch: (action) => debugInspectorController.dispatch(action)
    });
    const unsubscribe = debugInspectorController.subscribe((viewModel) => {
      binding.render(viewModel);
      developerToolsBridge.publishInspector(viewModel);
    });
    debugInspector = {
      binding,
      controller: debugInspectorController,
      unsubscribe
    };
  }
  const sessionRecovery: SessionRecoveryController = new SessionRecoveryController({
    shellAppearedAt,
    ...(options.now ? { now: options.now } : {}),
    restoreSession: async (session): Promise<void> => {
      await controller.restoreSafeSession(session);
    },
    notify: (message) => presenter.setStatus(message)
  });
  const controller: BrowserController = new BrowserController(hostClient, presenter, refs, {
    onSafeSessionCommitted: (session): void => {
      void sessionRecovery.commitSafeSession(session);
    },
    onUnsafeSessionCommitted: (): void => {
      void sessionRecovery.commitUnsafeSession();
    }
  });
  const windowState = options.windowStateAdapter
    ? new WindowStateController({ adapter: options.windowStateAdapter })
    : undefined;
  const libraryPreferences = new LibraryPreferencesController({
    openTarget: (target) => controller.openFavoriteTarget(target),
    currentTarget: () => controller.currentFavoriteTarget(),
    notify: (message) => presenter.setStatus(message)
  });
  const commandBridge = new ApplicationCommandBridge({
    isWmlEditing: () => {
      return isWmlCommandEditingContext(presenter.getSnapshot());
    },
    handlers: libraryPreferences.commandHandlers()
  });

  return {
    commandBridge,
    controller,
    debugInspector,
    libraryPreferences,
    presenter,
    refs,
    sessionRecovery,
    windowState
  };
};

export const initializeBrowserApplication = async (
  application: BrowserApplication
): Promise<void> => {
  try {
    await Promise.all([
      application.sessionRecovery?.prepare(),
      application.controller.init(SAMPLE_WML),
      application.libraryPreferences?.init(),
      application.windowState?.init(),
      application.commandBridge.bind()
    ]);
    await application.sessionRecovery?.activate();
  } catch (error) {
    application.commandBridge.dispose();
    throw error;
  }
};

export const disposeBrowserApplication = (application: BrowserApplication): void => {
  application.commandBridge.dispose();
  application.sessionRecovery.dispose();
  application.windowState?.dispose();
  application.libraryPreferences.dispose();
  application.debugInspector?.binding.dispose();
  application.debugInspector?.unsubscribe();
  void application.debugInspector?.controller.dispose();
  application.controller.dispose();
};
