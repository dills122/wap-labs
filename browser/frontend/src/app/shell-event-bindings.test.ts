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
  'btn-stop-navigation',
  'btn-navigation-retry',
  'btn-navigation-change-route',
  'btn-navigation-details',
  'btn-navigation-return',
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
    liveAnnouncerEl: document.createElement('div'),
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
  stopNavigation: vi.fn(async () => undefined),
  retryNavigation: vi.fn(async () => undefined),
  changeNavigationRoute: vi.fn(async () => undefined),
  showNavigationDetails: vi.fn(async () => undefined),
  returnFromNavigationError: vi.fn(async () => undefined),
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
    serializeEngineAction: (action) => action(),
    onWindowKeydown
  };
};

type ShellControlTarget =
  | { selector: string; eventType: 'click' }
  | {
      ref: 'runModeSelectEl' | 'localExampleSelectEl' | 'loadLocalBtnEl';
      eventType: 'click' | 'change';
    };

const triggerShellControl = (refs: BrowserShellRefs, target: ShellControlTarget): void => {
  const element = 'selector' in target ? document.querySelector(target.selector) : refs[target.ref];
  element?.dispatchEvent(new Event(target.eventType));
};

const SERIALIZED_SHELL_ACTIONS = [
  ['raw WML load', { selector: '#btn-load-context', eventType: 'click' }, 'loadRawWml'],
  ['reload', { selector: '#btn-reload', eventType: 'click' }, 'reload'],
  [
    'navigation retry',
    { selector: '#btn-navigation-retry', eventType: 'click' },
    'retryNavigation'
  ],
  ['render', { selector: '#btn-render', eventType: 'click' }, 'render'],
  ['Back', { selector: '#btn-back', eventType: 'click' }, 'navigateBack'],
  ['snapshot', { selector: '#btn-snapshot', eventType: 'click' }, 'snapshot'],
  [
    'external-intent clear',
    { selector: '#btn-clear-intent', eventType: 'click' },
    'clearExternalIntent'
  ],
  ['mode change', { ref: 'runModeSelectEl', eventType: 'change' }, 'changeMode'],
  [
    'local-example selection',
    { ref: 'localExampleSelectEl', eventType: 'change' },
    'selectLocalExample'
  ],
  ['local-example load', { ref: 'loadLocalBtnEl', eventType: 'click' }, 'loadLocalExample']
] as const satisfies ReadonlyArray<readonly [string, ShellControlTarget, string]>;

const IMMEDIATE_SHELL_ACTIONS = [
  ['health', '#btn-health', 'health'],
  ['Stop', '#btn-stop-navigation', 'stopNavigation'],
  ['change route', '#btn-navigation-change-route', 'changeNavigationRoute'],
  ['navigation details', '#btn-navigation-details', 'showNavigationDetails'],
  ['return from error', '#btn-navigation-return', 'returnFromNavigationError'],
  ['Go/Stop dispatch', '#btn-fetch-url', 'fetchUrl'],
  ['timeline export', '#btn-export-timeline', 'exportTimeline'],
  ['timeline clear', '#btn-clear-timeline', 'clearTimeline']
] as const;

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
    document.querySelector<HTMLButtonElement>('#btn-stop-navigation')?.click();
    document.querySelector<HTMLButtonElement>('#btn-navigation-retry')?.click();
    document.querySelector<HTMLButtonElement>('#btn-navigation-change-route')?.click();
    document.querySelector<HTMLButtonElement>('#btn-navigation-details')?.click();
    document.querySelector<HTMLButtonElement>('#btn-navigation-return')?.click();
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
    expect(actions.stopNavigation).toHaveBeenCalledTimes(1);
    expect(actions.retryNavigation).toHaveBeenCalledTimes(1);
    expect(actions.changeNavigationRoute).toHaveBeenCalledTimes(1);
    expect(actions.showNavigationDetails).toHaveBeenCalledTimes(1);
    expect(actions.returnFromNavigationError).toHaveBeenCalledTimes(1);
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

  it('serializes engine-affecting shell actions while leaving Stop immediate', async () => {
    const refs = createRefs();
    const actions = createActions();
    const deps = createDeps(actions, refs);
    let releaseReload: (() => Promise<void>) | undefined;
    deps.serializeEngineAction = vi.fn(async (action) => {
      releaseReload = action;
    });
    const bindings = new ShellEventBindings(deps);
    bindings.bind();

    document.querySelector<HTMLButtonElement>('#btn-reload')?.click();
    document.querySelector<HTMLButtonElement>('#btn-stop-navigation')?.click();
    await Promise.resolve();

    expect(deps.serializeEngineAction).toHaveBeenCalledTimes(1);
    expect(actions.reload).not.toHaveBeenCalled();
    expect(actions.stopNavigation).toHaveBeenCalledTimes(1);

    await releaseReload?.();

    expect(actions.reload).toHaveBeenCalledTimes(1);
  });

  it.each(SERIALIZED_SHELL_ACTIONS)(
    'routes %s through the shared engine serializer',
    async (_label, target, actionName) => {
      const refs = createRefs();
      const actions = createActions();
      const deps = createDeps(actions, refs);
      deps.serializeEngineAction = vi.fn(async (action) => action());
      const bindings = new ShellEventBindings(deps);
      bindings.bind();

      triggerShellControl(refs, target);
      await Promise.resolve();

      expect(deps.serializeEngineAction).toHaveBeenCalledOnce();
      expect(actions[actionName]).toHaveBeenCalledOnce();
    }
  );

  it.each(IMMEDIATE_SHELL_ACTIONS)(
    'keeps %s outside the shell serializer',
    async (_label, selector, actionName) => {
      const refs = createRefs();
      const actions = createActions();
      const deps = createDeps(actions, refs);
      deps.serializeEngineAction = vi.fn(async (action) => action());
      const bindings = new ShellEventBindings(deps);
      bindings.bind();

      document.querySelector(selector)?.dispatchEvent(new Event('click'));
      await Promise.resolve();

      expect(deps.serializeEngineAction).not.toHaveBeenCalled();
      expect(actions[actionName]).toHaveBeenCalledOnce();
    }
  );

  it.each([
    ['#btn-up', 'up'],
    ['#btn-down', 'down'],
    ['#btn-enter', 'enter']
  ] as const)(
    'delegates the %s softkey without double-serializing it in the shell',
    async (selector, key) => {
      const refs = createRefs();
      const actions = createActions();
      const deps = createDeps(actions, refs);
      deps.serializeEngineAction = vi.fn(async (action) => action());
      const bindings = new ShellEventBindings(deps);
      bindings.bind();

      document.querySelector(selector)?.dispatchEvent(new Event('click'));
      await Promise.resolve();

      expect(deps.serializeEngineAction).not.toHaveBeenCalled();
      expect(actions.handleKey).toHaveBeenCalledWith(key);
    }
  );

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

  it('routes Escape in the URL field to Stop navigation', async () => {
    const refs = createRefs();
    const actions = createActions();
    const bindings = new ShellEventBindings(createDeps(actions, refs));
    bindings.bind();

    refs.fetchUrlInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    );
    await Promise.resolve();

    expect(actions.stopNavigation).toHaveBeenCalledTimes(1);
    expect(actions.fetchUrlEnter).not.toHaveBeenCalled();
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
    expect(backBtn?.disabled).toBe(false);
    expect(backBtn?.getAttribute('aria-disabled')).toBe('false');
    expect(backBtn?.dataset.historyAvailable).toBe('false');

    bindings.setBackButtonAvailable(true);
    expect(backBtn?.disabled).toBe(false);
    expect(backBtn?.getAttribute('aria-disabled')).toBe('false');
    expect(backBtn?.dataset.historyAvailable).toBe('true');
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
