import { describe, expect, it, vi } from 'vitest';
import { APPLICATION_COMMANDS } from '../../../contracts/generated/application-commands';
import {
  APPLICATION_COMMAND_DISPATCHED_EVENT,
  ApplicationCommandRegistry,
  applicationShortcutReference,
  projectApplicationCommands,
  resolveApplicationShortcut,
  type ApplicationCommandDispatchDetail
} from './application-command-registry';

describe('application command registry', () => {
  it('projects default and overridden enabled states without changing canonical metadata', () => {
    const defaults = projectApplicationCommands();
    expect(defaults.find(({ command }) => command.id === 'app.reload')?.enabled).toBe(true);
    expect(defaults.find(({ command }) => command.id === 'app.library')?.enabled).toBe(true);

    const projected = projectApplicationCommands({
      'app.reload': false,
      'app.library': true
    });
    expect(projected.find(({ command }) => command.id === 'app.reload')?.enabled).toBe(false);
    expect(projected.find(({ command }) => command.id === 'app.library')?.enabled).toBe(true);
    expect(APPLICATION_COMMANDS.find(({ id }) => id === 'app.reload')?.defaultEnabled).toBe(true);
    expect(APPLICATION_COMMANDS.find(({ id }) => id === 'app.library')?.defaultEnabled).toBe(true);
  });

  it('executes enabled commands through one observable dispatch event', () => {
    const eventTarget = new EventTarget();
    const handler = vi.fn();
    const observed: ApplicationCommandDispatchDetail[] = [];
    eventTarget.addEventListener(APPLICATION_COMMAND_DISPATCHED_EVENT, (event) => {
      observed.push((event as CustomEvent<ApplicationCommandDispatchDetail>).detail);
    });
    const registry = new ApplicationCommandRegistry({ 'app.reload': handler }, {}, eventTarget);

    expect(registry.dispatch('app.reload', 'native-menu')).toEqual({
      status: 'executed',
      detail: { commandId: 'app.reload', source: 'native-menu' }
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(observed).toEqual([{ commandId: 'app.reload', source: 'native-menu' }]);
  });

  it('rejects disabled, handlerless, and unknown commands without dispatching', () => {
    const eventTarget = new EventTarget();
    const observed = vi.fn();
    eventTarget.addEventListener(APPLICATION_COMMAND_DISPATCHED_EVENT, observed);
    const registry = new ApplicationCommandRegistry({ 'app.reload': vi.fn() }, {}, eventTarget);

    expect(registry.dispatch('app.library', 'shortcut')).toEqual({
      status: 'disabled',
      commandId: 'app.library'
    });
    expect(registry.dispatch('app.unknown', 'native-menu')).toEqual({
      status: 'unknown',
      commandId: 'app.unknown'
    });
    expect(observed).not.toHaveBeenCalled();
  });

  it('resolves deterministic macOS and Linux shortcut mappings', () => {
    const enabled = {
      'app.focus-location': () => undefined,
      'app.inspector': () => undefined,
      'app.help': () => undefined
    } as const;
    const registry = new ApplicationCommandRegistry(enabled);

    const macLocation = new KeyboardEvent('keydown', { key: 'l', metaKey: true });
    const linuxLocation = new KeyboardEvent('keydown', { key: 'l', ctrlKey: true });
    const macInspector = new KeyboardEvent('keydown', { key: 'i', metaKey: true, altKey: true });
    const linuxHelp = new KeyboardEvent('keydown', { key: 'F1' });

    expect(
      resolveApplicationShortcut(macLocation, 'macos', registry.projectedCommands())?.command.id
    ).toBe('app.focus-location');
    expect(
      resolveApplicationShortcut(linuxLocation, 'linux', registry.projectedCommands())?.command.id
    ).toBe('app.focus-location');
    expect(
      resolveApplicationShortcut(macInspector, 'macos', registry.projectedCommands())?.command.id
    ).toBe('app.inspector');
    expect(
      resolveApplicationShortcut(linuxHelp, 'linux', registry.projectedCommands())?.command.id
    ).toBe('app.help');
  });

  it('derives shortcut reference rows from the canonical registry', () => {
    for (const platform of ['macos', 'linux'] as const) {
      const reference = applicationShortcutReference(platform);
      const commandsWithShortcuts = APPLICATION_COMMANDS.filter(
        (command) => command.shortcuts[platform] !== null
      );
      expect(reference.map(({ commandId }) => commandId)).toEqual(
        commandsWithShortcuts.map(({ id }) => id)
      );
      expect(reference.find(({ commandId }) => commandId === 'app.library')?.enabled).toBe(true);
      expect(reference.every(({ shortcut }) => shortcut.length > 0)).toBe(true);
    }
  });
});
