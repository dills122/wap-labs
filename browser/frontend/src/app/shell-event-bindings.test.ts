import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserShellRefs } from './browser-shell-template';
import {
  ShellEventBindings,
  type ShellEventBindingActions,
  type ShellEventBindingsDependencies
} from './shell-event-bindings';

// ShellEventBindings looks up most buttons directly via document.querySelector
// (matching BrowserController's original bindListeners implementation), so
// the DOM fixture below mirrors the ids browser-shell-template.ts renders.
const BUTTON_IDS = [
  'btn-back',
  'btn-reload',
  'btn-fetch-url',
  'btn-up',
  'btn-enter',
  'btn-down',
  'btn-health',
  'btn-render',
  'btn-snapshot',
  'btn-clear-intent',
  'btn-export-timeline',
  'btn-clear-timeline',
  'btn-load-context'
];

const mountButtons = (): void => {
  for (const id of BUTTON_IDS) {
    const button = document.createElement('button');
    button.id = id;
    document.body.append(button);
  }
};

const createRefs = (): BrowserShellRefs => {
  const fetchUrlInput = document.createElement('input');
  const runModeSelectEl = document.createElement('select');
  const localExampleSelectEl = document.createElement('select');
  const loadLocalBtnEl = document.createElement('button');

  return {
    wmlInput: document.createElement('textarea'),
    baseUrlInput: document.createElement('input'),
    viewportColsInput: document.createElement('input'),
    viewportEl: document.createElement('div'),
    snapshotEl: document.createElement('pre'),
    statusEl: { setStatus: () => undefined } as unknown as BrowserShellRefs['statusEl'],
    fetchUrlInput,
    transportResponseEl: document.createElement('pre'),
    sessionStateEl: document.createElement('pre'),
    timelineEl: document.createElement('pre'),
    activeUrlLabelEl: document.createElement('span'),
    devDrawerEl: document.createElement('details'),
    toastEl: document.createElement('div'),
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    localExampleWrapEl: document.createElement('label'),
    localExampleNotesEl: document.createElement('details'),
    localExampleCoverageEl: document.createElement('p'),
    localExampleDescriptionEl: document.createElement('p'),
    localExampleGoalEl: document.createElement('p'),
    localExampleTestingAcEl: document.createElement('ul')
  };
};

const createActions = (): ShellEventBindingActions & Record<string, ReturnType<typeof vi.fn>> => ({
  health: vi.fn(async () => undefined),
  loadRawWml: vi.fn(async () => undefined),
  fetchUrl: vi.fn(async () => undefined),
  fetchUrlEnter: vi.fn(async () => undefined),
  reload: vi.fn(async () => undefined),
  changeMode: vi.fn(async () => undefined),
  selectLocalExample: vi.fn(async () => undefined),
  loadLocalExample: vi.fn(async () => undefined),
  render: vi.fn(async () => undefined),
  navigateBack: vi.fn(async () => undefined),
  snapshot: vi.fn(async () => undefined),
  clearExternalIntent: vi.fn(async () => undefined),
  exportTimeline: vi.fn(async () => undefined),
  clearTimeline: vi.fn(async () => undefined),
  handleKey: vi.fn(async () => undefined)
});

const createDeps = (
  actions: ShellEventBindingActions,
  refs: BrowserShellRefs
): ShellEventBindingsDependencies & { onWindowKeydown: ReturnType<typeof vi.fn> } => {
  const onWindowKeydown = vi.fn();
  return {
    refs,
    actions,
    // Mirrors BrowserController's real `withAction`: run the action
    // directly, ignoring the action name and forwarding the event.
    runAction: (_actionName, action) => (event?: Event) => action(event),
    onWindowKeydown
  };
};

describe('ShellEventBindings', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    mountButtons();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('wires each button/control to its corresponding action', async () => {
    const refs = createRefs();
    const actions = createActions();
    const deps = createDeps(actions, refs);
    const bindings = new ShellEventBindings(deps);
    bindings.bind();

    document.querySelector<HTMLButtonElement>('#btn-health')?.click();
    document.querySelector<HTMLButtonElement>('#btn-render')?.click();
    document.querySelector<HTMLButtonElement>('#btn-snapshot')?.click();
    document.querySelector<HTMLButtonElement>('#btn-clear-intent')?.click();
    document.querySelector<HTMLButtonElement>('#btn-export-timeline')?.click();
    document.querySelector<HTMLButtonElement>('#btn-clear-timeline')?.click();
    document.querySelector<HTMLButtonElement>('#btn-load-context')?.click();
    document.querySelector<HTMLButtonElement>('#btn-reload')?.click();
    document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.click();
    document.querySelector<HTMLButtonElement>('#btn-back')?.click();
    refs.loadLocalBtnEl.click();
    refs.runModeSelectEl.dispatchEvent(new Event('change'));
    refs.localExampleSelectEl.dispatchEvent(new Event('change'));

    await Promise.resolve();

    expect(actions.health).toHaveBeenCalledTimes(1);
    expect(actions.render).toHaveBeenCalledTimes(1);
    expect(actions.snapshot).toHaveBeenCalledTimes(1);
    expect(actions.clearExternalIntent).toHaveBeenCalledTimes(1);
    expect(actions.exportTimeline).toHaveBeenCalledTimes(1);
    expect(actions.clearTimeline).toHaveBeenCalledTimes(1);
    expect(actions.loadRawWml).toHaveBeenCalledTimes(1);
    expect(actions.reload).toHaveBeenCalledTimes(1);
    expect(actions.fetchUrl).toHaveBeenCalledTimes(1);
    expect(actions.navigateBack).toHaveBeenCalledTimes(1);
    expect(actions.loadLocalExample).toHaveBeenCalledTimes(1);
    expect(actions.changeMode).toHaveBeenCalledTimes(1);
    expect(actions.selectLocalExample).toHaveBeenCalledTimes(1);
  });

  it('routes the arrow/select key buttons through handleKey with the right key', async () => {
    const refs = createRefs();
    const actions = createActions();
    const bindings = new ShellEventBindings(createDeps(actions, refs));
    bindings.bind();

    document.querySelector<HTMLButtonElement>('#btn-up')?.click();
    document.querySelector<HTMLButtonElement>('#btn-down')?.click();
    document.querySelector<HTMLButtonElement>('#btn-enter')?.click();
    await Promise.resolve();

    expect(actions.handleKey).toHaveBeenNthCalledWith(1, 'up');
    expect(actions.handleKey).toHaveBeenNthCalledWith(2, 'down');
    expect(actions.handleKey).toHaveBeenNthCalledWith(3, 'enter');
  });

  it('only calls fetchUrlEnter when Enter is pressed in the fetch URL input', async () => {
    const refs = createRefs();
    const actions = createActions();
    const bindings = new ShellEventBindings(createDeps(actions, refs));
    bindings.bind();

    refs.fetchUrlInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    await Promise.resolve();
    expect(actions.fetchUrlEnter).not.toHaveBeenCalled();

    refs.fetchUrlInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    );
    await Promise.resolve();
    expect(actions.fetchUrlEnter).toHaveBeenCalledTimes(1);
  });

  it('forwards window keydown events to onWindowKeydown', () => {
    const refs = createRefs();
    const actions = createActions();
    const deps = createDeps(actions, refs);
    const bindings = new ShellEventBindings(deps);
    bindings.bind();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(deps.onWindowKeydown).toHaveBeenCalledTimes(1);
  });

  it('unbind removes all listeners so no action fires afterward', async () => {
    const refs = createRefs();
    const actions = createActions();
    const deps = createDeps(actions, refs);
    const bindings = new ShellEventBindings(deps);
    bindings.bind();
    bindings.unbind();

    document.querySelector<HTMLButtonElement>('#btn-health')?.click();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await Promise.resolve();

    expect(actions.health).not.toHaveBeenCalled();
    expect(deps.onWindowKeydown).not.toHaveBeenCalled();
  });

  it('re-binding is idempotent (no duplicate listeners)', async () => {
    const refs = createRefs();
    const actions = createActions();
    const bindings = new ShellEventBindings(createDeps(actions, refs));
    bindings.bind();
    bindings.bind();

    document.querySelector<HTMLButtonElement>('#btn-health')?.click();
    await Promise.resolve();

    expect(actions.health).toHaveBeenCalledTimes(1);
  });

  it('drives the #btn-back element via setBackButtonAvailable', () => {
    const refs = createRefs();
    const actions = createActions();
    const bindings = new ShellEventBindings(createDeps(actions, refs));
    bindings.bind();

    const backBtn = document.querySelector<HTMLButtonElement>('#btn-back');
    expect(backBtn).not.toBeNull();

    bindings.setBackButtonAvailable(false);
    expect(backBtn?.disabled).toBe(true);
    expect(backBtn?.getAttribute('aria-disabled')).toBe('true');

    bindings.setBackButtonAvailable(true);
    expect(backBtn?.disabled).toBe(false);
    expect(backBtn?.getAttribute('aria-disabled')).toBe('false');
  });

  it('setBackButtonAvailable is a no-op when #btn-back is missing from the DOM', () => {
    document.querySelector('#btn-back')?.remove();
    const refs = createRefs();
    const actions = createActions();
    const bindings = new ShellEventBindings(createDeps(actions, refs));
    bindings.bind();

    expect(() => bindings.setBackButtonAvailable(true)).not.toThrow();
  });
});
