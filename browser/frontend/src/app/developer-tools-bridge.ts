import type { DeveloperToolsState } from './developer-tools-workspace';
import {
  bindDeveloperToolsWorkspace,
  renderDeveloperToolsState
} from './developer-tools-workspace';
import {
  bindEngineDebugInspector,
  type EngineDebugInspectorBinding
} from '../components/engine-debug-inspector';
import type { EngineDebugInspectorAction } from './engine-debug-session-controller';
import type { EngineDebugInspectorViewModel } from './engine-debug-view-model';
import { WAVES_COPY } from './waves-copy';

const DEVTOOLS_WINDOW_LABEL = 'developer-tools';
const DEVTOOLS_CHANNEL = 'waves-developer-tools';
const DEVTOOLS_READY_EVENT = 'waves://developer-tools/ready';
const DEVTOOLS_CLOSED_EVENT = 'waves://developer-tools/closed';
const DEVTOOLS_STATE_EVENT = 'waves://developer-tools/state';
const DEVTOOLS_ACTION_EVENT = 'waves://developer-tools/action';
const DEVTOOLS_INSPECTOR_STATE_EVENT = 'waves://developer-tools/inspector-state';
const DEVTOOLS_INSPECTOR_ACTION_EVENT = 'waves://developer-tools/inspector-action';

type DeveloperToolsActionId =
  | 'health'
  | 'render'
  | 'snapshot'
  | 'clear-intent'
  | 'export-timeline'
  | 'clear-timeline'
  | 'load-source';

interface DeveloperToolsAction {
  action: DeveloperToolsActionId;
  baseUrl?: string;
  wml?: string;
}

interface ChannelMessage {
  type: 'ready' | 'closed' | 'state' | 'action' | 'inspector-state' | 'inspector-action';
  state?: DeveloperToolsState;
  action?: DeveloperToolsAction;
  inspectorState?: EngineDebugInspectorViewModel;
  inspectorAction?: EngineDebugInspectorAction;
}

export interface DeveloperToolsHostBridge {
  isConnected(): boolean;
  publish(state: DeveloperToolsState): void;
  publishInspector(state: EngineDebugInspectorViewModel): void;
  dispose(): void;
}

interface BindDeveloperToolsHostOptions {
  root: HTMLElement;
  getState: () => DeveloperToolsState;
  onError: (message: string) => void;
  onInspectorAction?: (action: EngineDebugInspectorAction) => void;
}

const isTauriRuntime = (): boolean => Reflect.has(globalThis, '__TAURI_INTERNALS__');

const isDeveloperToolsAction = (value: unknown): value is DeveloperToolsAction => {
  if (!value || typeof value !== 'object' || !('action' in value)) return false;
  return [
    'health',
    'render',
    'snapshot',
    'clear-intent',
    'export-timeline',
    'clear-timeline',
    'load-source'
  ].includes(String(value.action));
};

const isEngineDebugInspectorAction = (value: unknown): value is EngineDebugInspectorAction => {
  if (!value || typeof value !== 'object' || !('type' in value)) return false;
  const action = value as Record<string, unknown>;
  if (['start', 'stop', 'snapshot', 'export'].includes(String(action.type))) return true;
  if (action.type === 'filter') {
    return (
      ['all', 'deck', 'navigation', 'input', 'action', 'script', 'timer'].includes(
        String(action.group)
      ) && typeof action.query === 'string'
    );
  }
  return (
    action.type === 'visibility' &&
    ['docked', 'window'].includes(String(action.surface)) &&
    typeof action.visible === 'boolean'
  );
};

const dispatchDeveloperToolsAction = (action: DeveloperToolsAction): void => {
  const selectors: Record<Exclude<DeveloperToolsActionId, 'load-source'>, string> = {
    health: '#btn-health',
    render: '#btn-render',
    snapshot: '#btn-snapshot',
    'clear-intent': '#btn-clear-intent',
    'export-timeline': '#btn-export-timeline',
    'clear-timeline': '#btn-clear-timeline'
  };

  if (action.action === 'load-source') {
    const baseUrlEl = document.querySelector<HTMLInputElement>('#base-url');
    const wmlEl = document.querySelector<HTMLTextAreaElement>('#wml-input');
    if (baseUrlEl && typeof action.baseUrl === 'string') baseUrlEl.value = action.baseUrl;
    if (wmlEl && typeof action.wml === 'string') wmlEl.value = action.wml;
    document.querySelector<HTMLButtonElement>('#btn-load-context')?.click();
    return;
  }

  document.querySelector<HTMLButtonElement>(selectors[action.action])?.click();
};

export const bindDeveloperToolsHost = ({
  root,
  getState,
  onError,
  onInspectorAction
}: BindDeveloperToolsHostOptions): DeveloperToolsHostBridge => {
  let connected = false;
  let disposed = false;
  const unlisteners: Array<() => void> = [];
  const openButton = root.querySelector<HTMLButtonElement>('#btn-open-devtools-window');
  const channel =
    typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(DEVTOOLS_CHANNEL);
  let inspectorState: EngineDebugInspectorViewModel | undefined;

  const publish = (state: DeveloperToolsState): void => {
    if (!connected || disposed) return;
    if (isTauriRuntime()) {
      void import('@tauri-apps/api/event')
        .then(({ emitTo }) => emitTo(DEVTOOLS_WINDOW_LABEL, DEVTOOLS_STATE_EVENT, state))
        .catch((error: unknown) => onError(String(error)));
      return;
    }
    channel?.postMessage({ type: 'state', state } satisfies ChannelMessage);
  };

  const publishInspector = (state: EngineDebugInspectorViewModel): void => {
    inspectorState = state;
    if (!connected || disposed) return;
    if (isTauriRuntime()) {
      void import('@tauri-apps/api/event')
        .then(({ emitTo }) => emitTo(DEVTOOLS_WINDOW_LABEL, DEVTOOLS_INSPECTOR_STATE_EVENT, state))
        .catch(() => onError(WAVES_COPY.status.developerToolsInspectorStateFailed));
      return;
    }
    channel?.postMessage({
      type: 'inspector-state',
      inspectorState: state
    } satisfies ChannelMessage);
  };

  const markReady = (): void => {
    connected = true;
    publish(getState());
    if (inspectorState) publishInspector(inspectorState);
  };

  const markClosed = (): void => {
    connected = false;
    onInspectorAction?.({ type: 'visibility', surface: 'window', visible: false });
  };

  const handleChannelMessage = (event: MessageEvent<ChannelMessage>): void => {
    if (event.data.type === 'ready') markReady();
    if (event.data.type === 'closed') markClosed();
    if (event.data.type === 'action' && event.data.action) {
      dispatchDeveloperToolsAction(event.data.action);
    }
    if (
      event.data.type === 'inspector-action' &&
      event.data.inspectorAction &&
      isEngineDebugInspectorAction(event.data.inspectorAction)
    ) {
      onInspectorAction?.(event.data.inspectorAction);
    }
  };
  channel?.addEventListener('message', handleChannelMessage);

  const tauriListenersReady = isTauriRuntime()
    ? import('@tauri-apps/api/event')
        .then(async ({ listen }) => {
          const stopReady = await listen(DEVTOOLS_READY_EVENT, markReady);
          const stopClosed = await listen(DEVTOOLS_CLOSED_EVENT, markClosed);
          const stopAction = await listen<DeveloperToolsAction>(DEVTOOLS_ACTION_EVENT, (event) => {
            if (isDeveloperToolsAction(event.payload)) dispatchDeveloperToolsAction(event.payload);
          });
          const stopInspectorAction = await listen<EngineDebugInspectorAction>(
            DEVTOOLS_INSPECTOR_ACTION_EVENT,
            (event) => {
              if (isEngineDebugInspectorAction(event.payload)) {
                onInspectorAction?.(event.payload);
              }
            }
          );
          if (disposed) {
            stopReady();
            stopClosed();
            stopAction();
            stopInspectorAction();
            return;
          }
          unlisteners.push(stopReady, stopClosed, stopAction, stopInspectorAction);
        })
        .catch((error: unknown) => {
          onError(String(error));
        })
    : Promise.resolve();

  const openWindow = async (): Promise<void> => {
    if (!openButton) return;
    openButton.setAttribute('aria-busy', 'true');
    try {
      if (isTauriRuntime()) {
        await tauriListenersReady;
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const existing = await WebviewWindow.getByLabel(DEVTOOLS_WINDOW_LABEL);
        if (existing) {
          await existing.show();
          await existing.setFocus();
          connected = true;
          publish(getState());
          return;
        }

        const child = new WebviewWindow(DEVTOOLS_WINDOW_LABEL, {
          url: 'devtools.html',
          title: 'Waves Developer Tools',
          width: 960,
          height: 680,
          minWidth: 720,
          minHeight: 520,
          center: true,
          resizable: true
        });
        child.once('tauri://error', (event) => onError(String(event.payload)));
        child.once('tauri://destroyed', markClosed);
        return;
      }

      const popup = window.open(
        new URL('devtools.html', window.location.href).href,
        DEVTOOLS_WINDOW_LABEL,
        'popup,width=960,height=680,resizable=yes,scrollbars=yes'
      );
      if (!popup)
        throw new Error('The developer tools window was blocked. Allow pop-ups and try again.');
      popup.focus();
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    } finally {
      openButton.removeAttribute('aria-busy');
    }
  };

  const handleOpenClick = (): void => {
    void openWindow();
  };
  openButton?.addEventListener('click', handleOpenClick);

  return {
    isConnected: () => connected,
    publish,
    publishInspector,
    dispose: () => {
      disposed = true;
      openButton?.removeEventListener('click', handleOpenClick);
      channel?.removeEventListener('message', handleChannelMessage);
      channel?.close();
      while (unlisteners.length > 0) unlisteners.pop()?.();
    }
  };
};

const actionFromButton = (
  button: HTMLButtonElement,
  root: HTMLElement
): DeveloperToolsAction | null => {
  const action = button.dataset.devtoolsAction;
  if (!action || action === 'open-window') return null;
  if (action === 'load-source') {
    return {
      action,
      baseUrl: root.querySelector<HTMLInputElement>('#base-url')?.value ?? '',
      wml: root.querySelector<HTMLTextAreaElement>('#wml-input')?.value ?? ''
    };
  }
  const candidate = { action };
  return isDeveloperToolsAction(candidate) ? candidate : null;
};

export const bindDeveloperToolsWindow = async (root: HTMLElement): Promise<() => void> => {
  const disposeWorkspace = bindDeveloperToolsWorkspace(root);
  const cleanups: Array<() => void> = [disposeWorkspace];
  const channel =
    typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(DEVTOOLS_CHANNEL);

  const sendAction = async (action: DeveloperToolsAction): Promise<void> => {
    if (isTauriRuntime()) {
      const { emitTo } = await import('@tauri-apps/api/event');
      await emitTo('main', DEVTOOLS_ACTION_EVENT, action);
      return;
    }
    channel?.postMessage({ type: 'action', action } satisfies ChannelMessage);
  };

  const sendInspectorAction = async (action: EngineDebugInspectorAction): Promise<void> => {
    if (isTauriRuntime()) {
      const { emitTo } = await import('@tauri-apps/api/event');
      await emitTo('main', DEVTOOLS_INSPECTOR_ACTION_EVENT, action);
      return;
    }
    channel?.postMessage({
      type: 'inspector-action',
      inspectorAction: action
    } satisfies ChannelMessage);
  };
  const inspectorBinding: EngineDebugInspectorBinding = bindEngineDebugInspector(root, {
    dispatch: (action) => void sendInspectorAction(action)
  });
  cleanups.push(() => inspectorBinding.dispose());

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-devtools-action]')) {
    const handleClick = (): void => {
      const action = actionFromButton(button, root);
      if (action) void sendAction(action);
    };
    button.addEventListener('click', handleClick);
    cleanups.push(() => button.removeEventListener('click', handleClick));
  }

  if (isTauriRuntime()) {
    const { emitTo, listen } = await import('@tauri-apps/api/event');
    const stopState = await listen<DeveloperToolsState>(DEVTOOLS_STATE_EVENT, (event) => {
      renderDeveloperToolsState(root, event.payload);
    });
    const stopInspectorState = await listen<EngineDebugInspectorViewModel>(
      DEVTOOLS_INSPECTOR_STATE_EVENT,
      (event) => inspectorBinding.render(event.payload)
    );
    cleanups.push(stopState, stopInspectorState);
    await emitTo('main', DEVTOOLS_READY_EVENT);
  } else {
    const handleState = (event: MessageEvent<ChannelMessage>): void => {
      if (event.data.type === 'state' && event.data.state) {
        renderDeveloperToolsState(root, event.data.state);
      }
      if (event.data.type === 'inspector-state' && event.data.inspectorState) {
        inspectorBinding.render(event.data.inspectorState);
      }
    };
    channel?.addEventListener('message', handleState);
    cleanups.push(() => channel?.removeEventListener('message', handleState));
    channel?.postMessage({ type: 'ready' } satisfies ChannelMessage);
  }

  const handleBeforeUnload = (): void => {
    void sendInspectorAction({ type: 'visibility', surface: 'window', visible: false });
    if (isTauriRuntime()) {
      void import('@tauri-apps/api/event').then(({ emitTo }) =>
        emitTo('main', DEVTOOLS_CLOSED_EVENT)
      );
    } else {
      channel?.postMessage({ type: 'closed' } satisfies ChannelMessage);
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  cleanups.push(() => window.removeEventListener('beforeunload', handleBeforeUnload));

  return () => {
    while (cleanups.length > 0) cleanups.pop()?.();
    channel?.close();
  };
};
