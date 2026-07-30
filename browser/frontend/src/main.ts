import { invoke } from '@tauri-apps/api/core';
import { createTauriHostClient } from '../../contracts/generated/tauri-host-client';
import './styles.css';
import {
  composeBrowserApplication,
  disposeBrowserApplication,
  initializeBrowserApplication,
  type BrowserApplication
} from './app/browser-application';
import { createGuardedTauriInvoke } from './app/tauri-invoke-guard';
import { WAVES_COPY } from './app/waves-copy';

let activeApplication: BrowserApplication | undefined;

const bootstrap = async (): Promise<void> => {
  if (activeApplication) {
    disposeBrowserApplication(activeApplication);
  }
  activeApplication = undefined;
  const hostClient = createTauriHostClient(createGuardedTauriInvoke(invoke));
  const application = composeBrowserApplication(hostClient);
  activeApplication = application;
  await initializeBrowserApplication(application);
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

  if (activeApplication) {
    activeApplication.presenter.patchSessionState({
      navigationStatus: 'error',
      lastError: message
    });
    activeApplication.presenter.setStatus(WAVES_COPY.status.error(message));
    activeApplication.presenter.showToast(WAVES_COPY.status.error(message), 'error');
    activeApplication.presenter.recordTimeline('bootstrap', 'error', { message });
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
    if (activeApplication) {
      disposeBrowserApplication(activeApplication);
    }
    activeApplication = undefined;
  });
}
