import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  APPLICATION_COMMAND_DISPATCHED_EVENT,
  type ApplicationCommandDispatchDetail
} from './application-command-registry';
import {
  ApplicationCommandBridge,
  NATIVE_APPLICATION_COMMAND_EVENT
} from './application-command-bridge';

const mountCommandControls = (): void => {
  document.body.innerHTML = `
    <input id="fetch-url" />
    <select id="run-mode"><option value="local">Local</option><option value="network" selected>Network</option></select>
    <select id="local-example"><option>Example</option></select>
    <button id="btn-reload">Reload</button>
    <button id="btn-inspector">Inspector</button>
    <button id="btn-welcome-toggle">Help</button>
  `;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('application command bridge', () => {
  it.each([
    ['app.reload', '#btn-reload', { key: 'r', ctrlKey: true }],
    ['app.inspector', '#btn-inspector', { key: 'i', ctrlKey: true, shiftKey: true }],
    ['app.help', '#btn-welcome-toggle', { key: 'F1' }]
  ] as const)(
    'routes %s controls, shortcuts, and native menus through one observable path',
    async (commandId, selector, shortcut) => {
      mountCommandControls();
      const controlAction = vi.fn();
      document.querySelector(selector)?.addEventListener('click', controlAction);
      const observed: ApplicationCommandDispatchDetail[] = [];
      const handleDispatch = (event: Event): void => {
        observed.push((event as CustomEvent<ApplicationCommandDispatchDetail>).detail);
      };
      window.addEventListener(APPLICATION_COMMAND_DISPATCHED_EVENT, handleDispatch);
      let nativeHandler: ((payload: unknown) => void) | undefined;
      const bridge = new ApplicationCommandBridge({
        platform: 'linux',
        listenNative: async (eventName, handler) => {
          expect(eventName).toBe(NATIVE_APPLICATION_COMMAND_EVENT);
          nativeHandler = handler;
          return () => undefined;
        }
      });
      await bridge.bind();

      document.querySelector<HTMLButtonElement>(selector)?.click();
      window.dispatchEvent(new KeyboardEvent('keydown', { ...shortcut, cancelable: true }));
      nativeHandler?.({ commandId, source: 'native-menu' });

      expect(controlAction).toHaveBeenCalledTimes(3);
      expect(observed).toEqual([
        { commandId, source: 'frontend-control' },
        { commandId, source: 'shortcut' },
        { commandId, source: 'native-menu' }
      ]);
      bridge.dispose();
      window.removeEventListener(APPLICATION_COMMAND_DISPATCHED_EVENT, handleDispatch);
    }
  );

  it('focuses the usable location control for shortcut and native requests', async () => {
    mountCommandControls();
    const bridge = new ApplicationCommandBridge({ platform: 'linux' });
    await bridge.bind();

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'l', ctrlKey: true, cancelable: true })
    );
    expect(document.activeElement?.id).toBe('fetch-url');

    const runMode = document.querySelector<HTMLSelectElement>('#run-mode');
    if (runMode) runMode.value = 'local';
    bridge.request('app.focus-location', 'native-menu');
    expect(document.activeElement?.id).toBe('local-example');
    bridge.dispose();
  });

  it('does not execute disabled commands or unknown native payloads', async () => {
    mountCommandControls();
    let nativeHandler: ((payload: unknown) => void) | undefined;
    const observed = vi.fn();
    window.addEventListener(APPLICATION_COMMAND_DISPATCHED_EVENT, observed);
    const bridge = new ApplicationCommandBridge({
      listenNative: async (_eventName, handler) => {
        nativeHandler = handler;
        return () => undefined;
      }
    });
    await bridge.bind();

    expect(bridge.request('app.library', 'shortcut')).toEqual({
      status: 'disabled',
      commandId: 'app.library'
    });
    nativeHandler?.({ commandId: 'app.unknown', source: 'native-menu' });
    nativeHandler?.({ commandId: 'app.reload', source: 'wrong-source' });
    expect(observed).not.toHaveBeenCalled();
    bridge.dispose();
    window.removeEventListener(APPLICATION_COMMAND_DISPATCHED_EVENT, observed);
  });

  it.each([
    ['input', '<input />'],
    ['select', '<select><option>One</option></select>'],
    ['textarea', '<textarea></textarea>'],
    ['contenteditable', '<div contenteditable="true"></div>']
  ])('never intercepts a registry shortcut from focused %s editing', async (_name, markup) => {
    mountCommandControls();
    const host = document.createElement('div');
    host.innerHTML = markup;
    const editor = host.firstElementChild as HTMLElement;
    document.body.append(editor);
    editor.focus();
    const reloadAction = vi.fn();
    document.querySelector('#btn-reload')?.addEventListener('click', reloadAction);
    const bridge = new ApplicationCommandBridge({ platform: 'linux' });
    await bridge.bind();
    const downstream = vi.fn();
    window.addEventListener('keydown', downstream);
    const event = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });

    editor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(reloadAction).not.toHaveBeenCalled();
    expect(downstream).toHaveBeenCalledTimes(1);
    bridge.dispose();
    window.removeEventListener('keydown', downstream);
  });

  it('does not intercept shortcuts while a WML input or select edit is active', async () => {
    mountCommandControls();
    const reloadAction = vi.fn();
    document.querySelector('#btn-reload')?.addEventListener('click', reloadAction);
    const bridge = new ApplicationCommandBridge({
      platform: 'linux',
      isWmlEditing: () => true
    });
    await bridge.bind();
    const downstream = vi.fn();
    window.addEventListener('keydown', downstream);
    const event = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      cancelable: true
    });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(reloadAction).not.toHaveBeenCalled();
    expect(downstream).toHaveBeenCalledTimes(1);
    bridge.dispose();
    window.removeEventListener('keydown', downstream);
  });

  it('does not intercept the retired Ctrl+Shift+D route in focused text editing', async () => {
    mountCommandControls();
    const input = document.querySelector<HTMLInputElement>('#fetch-url');
    input?.focus();
    const legacyHandler = vi.fn();
    window.addEventListener('keydown', legacyHandler);
    const bridge = new ApplicationCommandBridge({ platform: 'linux' });
    await bridge.bind();
    const event = new KeyboardEvent('keydown', {
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });

    input?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(legacyHandler).toHaveBeenCalledTimes(1);
    bridge.dispose();
    window.removeEventListener('keydown', legacyHandler);
  });

  it('rejects a control-backed command when its visible control is disabled', async () => {
    mountCommandControls();
    const reload = document.querySelector<HTMLButtonElement>('#btn-reload');
    if (reload) reload.disabled = true;
    const bridge = new ApplicationCommandBridge({ platform: 'linux' });
    await bridge.bind();

    expect(bridge.request('app.reload', 'native-menu')).toEqual({
      status: 'disabled',
      commandId: 'app.reload'
    });
    bridge.dispose();
  });
});
