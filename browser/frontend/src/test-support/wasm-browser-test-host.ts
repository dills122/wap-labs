import init, { WmlEngine } from '../../../../engine-wasm/pkg/wavenav_engine.js';
import type { EngineFrame, EngineRuntimeSnapshot, RenderList } from '../../../contracts/engine';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';
import type { EngineTraceEntry, WmlEngineWasm } from '../../../../engine-wasm/contracts/wml-engine';
import { MemoryApplicationStateStore } from '../app/application-state-store';
import { createDeterministicFixtureFetch } from './deterministic-fixture-fetch';
import type {
  BrowserTestDelayableCommand,
  BrowserTestHostOptions
} from './browser-test-host-options';

export interface BrowserTestHostDiagnostics {
  delayedCommandCounts(): Partial<Record<BrowserTestDelayableCommand, number>>;
  traceEntries(): EngineTraceEntry[];
}

export interface BrowserTestHost {
  client: TauriHostClient;
  diagnostics: BrowserTestHostDiagnostics;
}

export const createWasmBrowserTestHost = async (
  options: BrowserTestHostOptions = { commandDelaysMs: {} }
): Promise<BrowserTestHost> => {
  await init();
  const engine = new WmlEngine() as unknown as WmlEngineWasm;
  const fetchDeck = createDeterministicFixtureFetch();
  const applicationState = new MemoryApplicationStateStore();

  const snapshot = (): EngineRuntimeSnapshot => ({
    activeCardId: readActiveCardId(engine),
    focusedLinkIndex: engine.focusedLinkIndex(),
    nextTimerWakeupMs: engine.nextTimerWakeupMs(),
    focusedInputEditName: engine.focusedInputEditName(),
    focusedInputEditValue: engine.focusedInputEditValue(),
    focusedSelectEditName: engine.focusedSelectEditName(),
    focusedSelectEditValue: engine.focusedSelectEditValue(),
    baseUrl: engine.baseUrl(),
    contentType: engine.contentType(),
    browserContextEpoch: engine.browserContextEpoch(),
    historyPushSequence: engine.historyPushSequence(),
    lastRuntimeFailureCode: engine.lastRuntimeFailureCode(),
    lastRuntimeFailureMessage: engine.lastRuntimeFailureMessage(),
    lastBackNavigationHandled: engine.lastBackNavigationHandled(),
    externalNavigationIntent: engine.externalNavigationIntent(),
    externalNavigationRequestPolicy: engine.externalNavigationRequestPolicy(),
    lastScriptExecutionOk: engine.lastScriptExecutionOk(),
    lastScriptExecutionTrap: engine.lastScriptExecutionTrap(),
    lastScriptExecutionErrorClass: engine.lastScriptExecutionErrorClass(),
    lastScriptExecutionErrorCategory: engine.lastScriptExecutionErrorCategory(),
    lastScriptRequiresRefresh: engine.lastScriptRequiresRefresh(),
    lastScriptDialogRequests: engine.lastScriptDialogRequests(),
    lastScriptTimerRequests: engine.lastScriptTimerRequests()
  });
  const render = (): RenderList => engine.render();
  const frame = (): EngineFrame => ({
    snapshot: snapshot(),
    render: render(),
    presentation: engine.renderFrame()
  });
  const applyRuntimeMutation = (mutation: () => void): void => {
    try {
      mutation();
    } catch (error) {
      if (!engine.lastRuntimeFailureCode()) {
        throw error;
      }
    }
  };

  const baseClient: TauriHostClient = {
    health: async () => 'waves-browser-test-host:ok',
    applicationStateLoad: () => applicationState.load(),
    applicationStateSave: ({ state }) => applicationState.save(state),
    applicationStateReset: () => applicationState.reset(),
    applicationStateClearComponent: ({ component }) => applicationState.clear(component),
    fetchDeck,
    cancelFetch: async () => false,
    engineLoadDeck: async ({ wmlXml }) => {
      engine.loadDeck(wmlXml);
      return snapshot();
    },
    engineLoadDeckContext: async (request) => {
      loadDeckContext(engine, request);
      return snapshot();
    },
    engineLoadDeckContextFrame: async (request) => {
      loadDeckContext(engine, request);
      return frame();
    },
    engineRender: async () => render(),
    engineRenderFrame: async () => frame(),
    engineHandleKey: async ({ key }) => {
      applyRuntimeMutation(() => engine.handleKey(key));
      return snapshot();
    },
    engineHandleKeyFrame: async ({ key }) => {
      applyRuntimeMutation(() => engine.handleKey(key));
      return frame();
    },
    engineHandleInputFrame: async ({ event }) => {
      applyRuntimeMutation(() => engine.handleInput(event));
      return frame();
    },
    engineNavigateToCard: async ({ cardId }) => {
      applyRuntimeMutation(() => engine.navigateToCard(cardId));
      return snapshot();
    },
    engineNavigateToCardFrame: async ({ cardId }) => {
      applyRuntimeMutation(() => engine.navigateToCard(cardId));
      return frame();
    },
    engineNavigateBackToCardFrame: async ({ cardId }) => {
      applyRuntimeMutation(() => engine.navigateBackToCard(cardId));
      return frame();
    },
    engineNavigateBack: async () => {
      engine.navigateBack();
      return snapshot();
    },
    engineNavigateBackFrame: async () => {
      engine.navigateBack();
      return frame();
    },
    engineSetViewportCols: async ({ cols }) => {
      engine.setViewportCols(cols);
      return snapshot();
    },
    engineAdvanceTimeMs: async ({ deltaMs }) => {
      applyRuntimeMutation(() => engine.advanceTimeMs(deltaMs));
      return snapshot();
    },
    engineAdvanceTimeMsFrame: async ({ deltaMs }) => {
      applyRuntimeMutation(() => engine.advanceTimeMs(deltaMs));
      return frame();
    },
    engineSnapshot: async () => snapshot(),
    engineDebugOpenSession: async () => ({
      status: 'failure',
      error: {
        code: 'DEBUG_DISABLED',
        message: 'engine debug connector is disabled by host policy',
        retryable: false
      }
    }),
    engineDebugPollEvents: async () => ({
      status: 'failure',
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'engine debug session was not found',
        retryable: false
      }
    }),
    engineDebugGetSnapshot: async () => ({
      status: 'failure',
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'engine debug session was not found',
        retryable: false
      }
    }),
    engineDebugCloseSession: async () => ({
      status: 'success',
      result: { closed: false }
    }),
    engineClearExternalNavigationIntent: async () => {
      engine.clearExternalNavigationIntent();
      return snapshot();
    },
    engineClearExternalNavigationIntentFrame: async () => {
      engine.clearExternalNavigationIntent();
      return frame();
    },
    engineBeginFocusedInputEdit: async () => {
      engine.beginFocusedInputEdit();
      return snapshot();
    },
    engineBeginFocusedInputEditFrame: async () => {
      engine.beginFocusedInputEdit();
      return frame();
    },
    engineSetFocusedInputEditDraft: async ({ value }) => {
      engine.setFocusedInputEditDraft(value);
      return snapshot();
    },
    engineSetFocusedInputEditDraftFrame: async ({ value }) => {
      engine.setFocusedInputEditDraft(value);
      return frame();
    },
    engineCommitFocusedInputEdit: async () => {
      engine.commitFocusedInputEdit();
      return snapshot();
    },
    engineCommitFocusedInputEditFrame: async () => {
      engine.commitFocusedInputEdit();
      return frame();
    },
    engineCancelFocusedInputEdit: async () => {
      engine.cancelFocusedInputEdit();
      return snapshot();
    },
    engineCancelFocusedInputEditFrame: async () => {
      engine.cancelFocusedInputEdit();
      return frame();
    },
    engineBeginFocusedSelectEdit: async () => {
      engine.beginFocusedSelectEdit();
      return snapshot();
    },
    engineBeginFocusedSelectEditFrame: async () => {
      engine.beginFocusedSelectEdit();
      return frame();
    },
    engineMoveFocusedSelectEdit: async ({ delta }) => {
      engine.moveFocusedSelectEdit(delta);
      return snapshot();
    },
    engineMoveFocusedSelectEditFrame: async ({ delta }) => {
      engine.moveFocusedSelectEdit(delta);
      return frame();
    },
    engineCommitFocusedSelectEdit: async () => {
      engine.commitFocusedSelectEdit();
      return snapshot();
    },
    engineCommitFocusedSelectEditFrame: async () => {
      engine.commitFocusedSelectEdit();
      return frame();
    },
    engineCancelFocusedSelectEdit: async () => {
      engine.cancelFocusedSelectEdit();
      return snapshot();
    },
    engineCancelFocusedSelectEditFrame: async () => {
      engine.cancelFocusedSelectEdit();
      return frame();
    }
  };

  const delayedCommandCounts: Partial<Record<BrowserTestDelayableCommand, number>> = {};
  const client = withCommandDelays(baseClient, options, delayedCommandCounts);

  return {
    client,
    diagnostics: {
      delayedCommandCounts: () => ({ ...delayedCommandCounts }),
      traceEntries: () => engine.traceEntries().map((entry) => ({ ...entry }))
    }
  };
};

const withCommandDelays = (
  client: TauriHostClient,
  options: BrowserTestHostOptions,
  counts: Partial<Record<BrowserTestDelayableCommand, number>>
): TauriHostClient =>
  new Proxy(client, {
    get(target, property, receiver) {
      const member = Reflect.get(target, property, receiver);
      if (typeof property !== 'string' || typeof member !== 'function') {
        return member;
      }
      const command = property as BrowserTestDelayableCommand;
      const delayMs = options.commandDelaysMs[command];
      if (delayMs === undefined) {
        return member;
      }
      return async (...args: unknown[]) => {
        counts[command] = (counts[command] ?? 0) + 1;
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, delayMs);
        });
        return Reflect.apply(member, target, args);
      };
    }
  });

const loadDeckContext = (
  engine: WmlEngineWasm,
  request: Parameters<TauriHostClient['engineLoadDeckContext']>[0]
): void => {
  if (request.navigationUrl !== undefined || request.navigationKind !== undefined) {
    engine.loadDeckContextForNavigation(
      request.wmlXml,
      request.baseUrl,
      request.contentType,
      request.rawBytesBase64,
      request.referringUrl,
      request.navigationUrl,
      request.navigationKind
    );
    return;
  }
  engine.loadDeckContext(
    request.wmlXml,
    request.baseUrl,
    request.contentType,
    request.rawBytesBase64,
    request.referringUrl
  );
};

const readActiveCardId = (engine: WmlEngineWasm): string | undefined => {
  try {
    return engine.activeCardId();
  } catch {
    return undefined;
  }
};
