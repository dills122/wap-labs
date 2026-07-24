import { invoke } from '@tauri-apps/api/core';
import type { HostSessionState } from '../../contracts/transport';
import { createTauriHostClient } from '../../contracts/generated/tauri-host-client';
import './styles.css';
import { BrowserController } from './app/browser-controller';
import { BrowserPresenter } from './app/browser-presenter';
import { mountBrowserShell } from './app/browser-shell-template';
import { defaultRunMode, defaultStartUrl } from './app/defaults';
import { createGuardedTauriInvoke } from './app/tauri-invoke-guard';
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
let activePresenter: BrowserPresenter | undefined;

const bootstrap = async (): Promise<void> => {
  document.body.setAttribute('data-boot-phase', 'booting');
  activeController?.dispose();
  activeController = undefined;
  activePresenter = undefined;

  document.title = WAVES_CONFIG.appName;
  const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.content = WAVES_COPY.app.description;
  }

  registerBrowserComponents();

  const startUrl = defaultStartUrl();
  const runMode = defaultRunMode(undefined, startUrl);
  const refs = mountBrowserShell(startUrl, runMode);
  const hostClient = createTauriHostClient(createGuardedTauriInvoke(invoke));

  const initialSession: HostSessionState = {
    runMode,
    navigationStatus: 'idle',
    requestedUrl: refs.fetchUrlInput.value
  };

  const presenter = new BrowserPresenter(refs, initialSession, WAVES_CONFIG.maxTimelineEvents);
  activePresenter = presenter;
  const controller = new BrowserController(hostClient, presenter, refs);
  activeController = controller;

  await controller.init(SAMPLE_WML);
};

/**
 * Surfaces a boot failure instead of leaving the UI silently stuck (see
 * `bootstrap` below). If the shell/presenter mounted successfully before the
 * failure, reuse the existing status/toast surfaces. Otherwise (e.g.
 * `mountBrowserShell` threw because `#app` is missing) fall back to a
 * minimal, dependency-free banner so the failure is still visible.
 */
const reportBootFailure = (error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  document.body.setAttribute('data-boot-phase', 'boot-error');

  if (activePresenter) {
    activePresenter.patchSessionState({ navigationStatus: 'error', lastError: message });
    activePresenter.setStatus(WAVES_COPY.status.error(message));
    activePresenter.showToast(WAVES_COPY.status.error(message), 'error');
    activePresenter.recordTimeline('bootstrap', 'error', { message });
    return;
  }

  const host = document.querySelector<HTMLElement>('#app') ?? document.body;
  const banner = document.createElement('div');
  banner.setAttribute('data-boot-error', 'true');
  banner.setAttribute('role', 'alert');
  banner.textContent = WAVES_COPY.status.error(message);
  host.prepend(banner);
};

void bootstrap().catch(reportBootFailure);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    activeController?.dispose();
    activeController = undefined;
  });
}
