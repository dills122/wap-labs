import type {
  ApplicationCommandId,
  ApplicationCommandPlatform,
  NativeApplicationCommandRequest
} from '../../../contracts/generated/application-commands';
import { APPLICATION_COMMAND_EVENT } from '../../../contracts/generated/application-commands';
import {
  ApplicationCommandRegistry,
  detectApplicationCommandPlatform,
  isApplicationCommandId,
  resolveApplicationShortcut,
  type ApplicationCommandDispatchResult,
  type ApplicationCommandEnablement,
  type ApplicationCommandHandler,
  type ApplicationCommandSource
} from './application-command-registry';

export { APPLICATION_COMMAND_EVENT as NATIVE_APPLICATION_COMMAND_EVENT };

const CONTROL_COMMANDS = {
  'app.reload': '#btn-reload',
  'app.add-favorite': '#btn-add-favorite',
  'app.library': '#btn-library',
  'app.preferences': '#btn-preferences',
  'app.inspector': '#btn-inspector',
  'app.help': '#btn-welcome-toggle',
  'app.import-favorites': '#btn-import-favorites',
  'app.export-favorites': '#btn-export-favorites'
} as const satisfies Partial<Record<ApplicationCommandId, string>>;

type ControlCommandId = keyof typeof CONTROL_COMMANDS;

type NativeCommandListen = (
  eventName: string,
  handler: (payload: unknown) => void
) => Promise<() => void>;

export interface ApplicationCommandBridgeOptions {
  platform?: ApplicationCommandPlatform;
  eventTarget?: EventTarget;
  document?: Document;
  listenNative?: NativeCommandListen;
  isWmlEditing?: () => boolean;
  handlers?: Partial<Record<ApplicationCommandId, ApplicationCommandHandler>>;
  enablement?: ApplicationCommandEnablement;
}

const isTauriRuntime = (): boolean => Reflect.has(globalThis, '__TAURI_INTERNALS__');

const defaultNativeListener: NativeCommandListen = async (eventName, handler) => {
  if (!isTauriRuntime()) {
    return () => undefined;
  }
  const { listen } = await import('@tauri-apps/api/event');
  return listen(eventName, (event) => handler(event.payload));
};

const isNativeApplicationCommandPayload = (
  payload: unknown
): payload is NativeApplicationCommandRequest =>
  typeof payload === 'object' &&
  payload !== null &&
  'commandId' in payload &&
  typeof payload.commandId === 'string' &&
  'source' in payload &&
  payload.source === 'native-menu';

export const isFocusedEditingTarget = (
  target: EventTarget | null,
  activeElement: Element | null = document.activeElement
): boolean => {
  const candidate = target instanceof Element ? target : activeElement;
  if (!candidate) {
    return false;
  }
  return Boolean(candidate.closest('input, select, textarea, [contenteditable="true"]'));
};

export class ApplicationCommandBridge {
  readonly registry: ApplicationCommandRegistry;

  private readonly platform: ApplicationCommandPlatform;
  private readonly eventTarget: EventTarget;
  private readonly document: Document;
  private readonly listenNative: NativeCommandListen;
  private readonly isWmlEditing: () => boolean;
  private readonly pendingControlSource = new Map<Element, ApplicationCommandSource>();
  private unlistenNative: (() => void) | undefined;
  private bound = false;

  constructor(options: ApplicationCommandBridgeOptions = {}) {
    this.platform = options.platform ?? detectApplicationCommandPlatform();
    this.eventTarget = options.eventTarget ?? window;
    this.document = options.document ?? document;
    this.listenNative = options.listenNative ?? defaultNativeListener;
    this.isWmlEditing = options.isWmlEditing ?? (() => false);

    const focusLocation = (): void => {
      const runMode = this.document.querySelector<HTMLSelectElement>('#run-mode')?.value;
      if (runMode === 'local') {
        this.document.querySelector<HTMLSelectElement>('#local-example')?.focus();
        return;
      }
      const networkLocation = this.document.querySelector<HTMLInputElement>('#fetch-url');
      if (networkLocation && !networkLocation.disabled) {
        networkLocation.focus();
        networkLocation.select();
        return;
      }
      this.document.querySelector<HTMLSelectElement>('#local-example')?.focus();
    };
    const handlers: Partial<Record<ApplicationCommandId, () => void>> = {
      ...options.handlers,
      'app.focus-location': focusLocation
    };
    for (const [commandId, selector] of Object.entries(CONTROL_COMMANDS) as Array<
      [ControlCommandId, string]
    >) {
      if (this.document.querySelector(selector)) {
        // The established control remains the action owner. Dispatch observation occurs in the
        // capture listener, before the control's existing handler runs.
        handlers[commandId] = () => undefined;
      }
    }
    this.registry = new ApplicationCommandRegistry(
      handlers,
      options.enablement ?? {},
      this.eventTarget
    );
  }

  async bind(): Promise<void> {
    if (this.bound) {
      return;
    }
    this.document.addEventListener('click', this.handleControlClick, true);
    this.eventTarget.addEventListener('keydown', this.handleKeydown, true);
    this.bound = true;
    let unlisten: () => void;
    try {
      unlisten = await this.listenNative(APPLICATION_COMMAND_EVENT, (payload) => {
        if (
          !isNativeApplicationCommandPayload(payload) ||
          !isApplicationCommandId(payload.commandId)
        ) {
          return;
        }
        this.request(payload.commandId, 'native-menu');
      });
    } catch (error) {
      this.dispose();
      throw error;
    }
    if (!this.bound) {
      unlisten();
      return;
    }
    this.unlistenNative = unlisten;
  }

  dispose(): void {
    this.bound = false;
    this.document.removeEventListener('click', this.handleControlClick, true);
    this.eventTarget.removeEventListener('keydown', this.handleKeydown, true);
    this.unlistenNative?.();
    this.unlistenNative = undefined;
    this.pendingControlSource.clear();
  }

  request(
    commandId: ApplicationCommandId,
    source: ApplicationCommandSource
  ): ApplicationCommandDispatchResult {
    const projected = this.registry.projectedCommand(commandId);
    if (!projected?.enabled) {
      return this.registry.dispatch(commandId, source);
    }
    if (commandId in CONTROL_COMMANDS) {
      const selector = CONTROL_COMMANDS[commandId as ControlCommandId];
      const control = this.document.querySelector<HTMLButtonElement>(selector);
      if (!control || control.disabled) {
        return { status: 'disabled', commandId };
      }
      this.pendingControlSource.set(control, source);
      try {
        control.click();
      } finally {
        this.pendingControlSource.delete(control);
      }
      return { status: 'executed', detail: { commandId, source } };
    }
    return this.registry.dispatch(commandId, source);
  }

  private readonly handleControlClick = (event: Event): void => {
    if (!(event.target instanceof Element)) {
      return;
    }
    for (const [commandId, selector] of Object.entries(CONTROL_COMMANDS) as Array<
      [ControlCommandId, string]
    >) {
      const control = event.target.closest(selector);
      if (!control) {
        continue;
      }
      const source = this.pendingControlSource.get(control) ?? 'frontend-control';
      this.registry.dispatch(commandId, source);
      return;
    }
  };

  private readonly handleKeydown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    const editing = isFocusedEditingTarget(event.target, this.document.activeElement);
    const projected = resolveApplicationShortcut(
      event,
      this.platform,
      this.registry.projectedCommands()
    );

    if (!projected) {
      return;
    }
    if (editing || this.isWmlEditing()) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    this.request(projected.command.id, 'shortcut');
  };
}
