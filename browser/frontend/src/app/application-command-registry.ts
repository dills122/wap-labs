import {
  APPLICATION_COMMANDS,
  type ApplicationCommand,
  type ApplicationCommandId,
  type ApplicationCommandPlatform,
  type ApplicationShortcut
} from '../../../contracts/generated/application-commands';

export const APPLICATION_COMMAND_DISPATCHED_EVENT = 'waves:application-command-dispatched';

export type ApplicationCommandSource = 'frontend-control' | 'native-menu' | 'shortcut';
export type ApplicationCommandHandler = () => void;
export type ApplicationCommandEnablement = Partial<Record<ApplicationCommandId, boolean>>;

export interface ProjectedApplicationCommand {
  command: ApplicationCommand;
  enabled: boolean;
}

export interface ApplicationCommandDispatchDetail {
  commandId: ApplicationCommandId;
  source: ApplicationCommandSource;
}

export type ApplicationCommandDispatchResult =
  | { status: 'executed'; detail: ApplicationCommandDispatchDetail }
  | { status: 'disabled'; commandId: ApplicationCommandId }
  | { status: 'unknown'; commandId: string };

export interface ShortcutReferenceEntry {
  commandId: ApplicationCommandId;
  label: string;
  shortcut: string;
  enabled: boolean;
}

const COMMAND_IDS = new Set<string>(APPLICATION_COMMANDS.map((command) => command.id));

export const isApplicationCommandId = (value: string): value is ApplicationCommandId =>
  COMMAND_IDS.has(value);

export const detectApplicationCommandPlatform = (): ApplicationCommandPlatform => {
  const platform = globalThis.navigator?.platform ?? '';
  const userAgent = globalThis.navigator?.userAgent ?? '';
  return /Mac|iPhone|iPad|iPod/i.test(`${platform} ${userAgent}`) ? 'macos' : 'linux';
};

export const projectApplicationCommands = (
  enablement: ApplicationCommandEnablement = {}
): readonly ProjectedApplicationCommand[] =>
  APPLICATION_COMMANDS.map((command) => ({
    command,
    enabled: enablement[command.id] ?? command.defaultEnabled
  }));

const modifierPressed = (event: KeyboardEvent, modifier: string): boolean => {
  switch (modifier) {
    case 'alt':
      return event.altKey;
    case 'control':
      return event.ctrlKey;
    case 'meta':
      return event.metaKey;
    case 'shift':
      return event.shiftKey;
    default:
      return false;
  }
};

const shortcutKeyMatches = (event: KeyboardEvent, shortcut: ApplicationShortcut): boolean => {
  if (shortcut.key === '/' && (event.code === 'Slash' || event.key === '?')) {
    return true;
  }
  return event.key.toLocaleLowerCase() === shortcut.key.toLocaleLowerCase();
};

export const keyboardEventMatchesShortcut = (
  event: KeyboardEvent,
  shortcut: ApplicationShortcut
): boolean => {
  const expected = new Set<string>(shortcut.modifiers);
  return (
    shortcutKeyMatches(event, shortcut) &&
    event.altKey === expected.has('alt') &&
    event.ctrlKey === expected.has('control') &&
    event.metaKey === expected.has('meta') &&
    event.shiftKey === expected.has('shift') &&
    shortcut.modifiers.every((modifier) => modifierPressed(event, modifier))
  );
};

export const resolveApplicationShortcut = (
  event: KeyboardEvent,
  platform: ApplicationCommandPlatform,
  projection = projectApplicationCommands()
): ProjectedApplicationCommand | undefined =>
  projection.find(({ command, enabled }) => {
    const shortcut = command.shortcuts[platform];
    return enabled && shortcut !== null && keyboardEventMatchesShortcut(event, shortcut);
  });

const shortcutKeyLabel = (key: string): string =>
  key.length === 1 ? key.toLocaleUpperCase() : key;

export const formatApplicationShortcut = (
  shortcut: ApplicationShortcut,
  platform: ApplicationCommandPlatform
): string => {
  const modifierLabels: Record<string, string> =
    platform === 'macos'
      ? { alt: '⌥', control: '⌃', meta: '⌘', shift: '⇧' }
      : { alt: 'Alt', control: 'Ctrl', meta: 'Meta', shift: 'Shift' };
  const labels = shortcut.modifiers.map((modifier) => modifierLabels[modifier]);
  labels.push(shortcutKeyLabel(shortcut.key));
  return platform === 'macos' ? labels.join('') : labels.join('+');
};

export const applicationShortcutReference = (
  platform: ApplicationCommandPlatform,
  enablement: ApplicationCommandEnablement = {}
): readonly ShortcutReferenceEntry[] =>
  projectApplicationCommands(enablement).flatMap(({ command, enabled }) => {
    const shortcut = command.shortcuts[platform];
    return shortcut === null
      ? []
      : [
          {
            commandId: command.id,
            label: command.label,
            shortcut: formatApplicationShortcut(shortcut, platform),
            enabled
          }
        ];
  });

export class ApplicationCommandRegistry {
  private readonly projection: readonly ProjectedApplicationCommand[];

  constructor(
    private readonly handlers: Partial<Record<ApplicationCommandId, ApplicationCommandHandler>>,
    enablement: ApplicationCommandEnablement = {},
    private readonly eventTarget: EventTarget = window
  ) {
    this.projection = projectApplicationCommands(
      Object.fromEntries(
        APPLICATION_COMMANDS.map((command) => [
          command.id,
          (enablement[command.id] ?? command.defaultEnabled) &&
            this.handlers[command.id] !== undefined
        ])
      ) as ApplicationCommandEnablement
    );
  }

  projectedCommands(): readonly ProjectedApplicationCommand[] {
    return this.projection;
  }

  projectedCommand(id: string): ProjectedApplicationCommand | undefined {
    return this.projection.find(({ command }) => command.id === id);
  }

  dispatch(commandId: string, source: ApplicationCommandSource): ApplicationCommandDispatchResult {
    if (!isApplicationCommandId(commandId)) {
      return { status: 'unknown', commandId };
    }
    const projected = this.projectedCommand(commandId);
    const handler = this.handlers[commandId];
    if (!projected?.enabled || !handler) {
      return { status: 'disabled', commandId };
    }

    const detail: ApplicationCommandDispatchDetail = { commandId, source };
    this.eventTarget.dispatchEvent(
      new CustomEvent<ApplicationCommandDispatchDetail>(APPLICATION_COMMAND_DISPATCHED_EVENT, {
        detail
      })
    );
    handler();
    return { status: 'executed', detail };
  }
}
