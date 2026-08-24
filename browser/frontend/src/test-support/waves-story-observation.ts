import type { EngineTraceEntry } from '../../../../engine-wasm/contracts/wml-engine';
import type { BrowserApplication } from '../app/browser-application';
import type { BrowserTestHostDiagnostics } from './wasm-browser-test-host';

export interface WavesStoryEvidence {
  activeExampleKey: string;
  snapshot: ReturnType<BrowserApplication['presenter']['getSnapshot']>;
  traceEntries: EngineTraceEntry[];
  status: string;
  session: ReturnType<BrowserApplication['presenter']['getSessionState']>;
  render: ReturnType<BrowserApplication['presenter']['getRenderList']>;
  testHost: {
    delayedCommandCounts: ReturnType<BrowserTestHostDiagnostics['delayedCommandCounts']>;
  };
}

declare global {
  interface Window {
    __WAVENAV_STORY_EVIDENCE__?: {
      collect(): WavesStoryEvidence;
    };
  }
}

export const installWavesStoryObservationBridge = (
  application: BrowserApplication,
  diagnostics: BrowserTestHostDiagnostics
): void => {
  window.__WAVENAV_STORY_EVIDENCE__ = {
    collect: () => ({
      activeExampleKey: application.refs.localExampleSelectEl.value,
      snapshot: application.presenter.getSnapshot(),
      traceEntries: diagnostics.traceEntries(),
      status: application.presenter.getStatus(),
      session: application.presenter.getSessionState(),
      render: application.presenter.getRenderList(),
      testHost: {
        delayedCommandCounts: diagnostics.delayedCommandCounts()
      }
    })
  };
};
