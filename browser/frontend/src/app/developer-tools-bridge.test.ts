import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindDeveloperToolsHost } from './developer-tools-bridge';
import type { DeveloperToolsState } from './developer-tools-workspace';
import { developerDrawerTemplate } from './shell/developer-drawer-template';

class TestBroadcastChannel extends EventTarget {
  static channels: TestBroadcastChannel[] = [];

  constructor(readonly name: string) {
    super();
    TestBroadcastChannel.channels.push(this);
  }

  postMessage(data: unknown): void {
    for (const channel of TestBroadcastChannel.channels) {
      if (channel !== this && channel.name === this.name) {
        channel.dispatchEvent(new MessageEvent('message', { data }));
      }
    }
  }

  close(): void {
    TestBroadcastChannel.channels = TestBroadcastChannel.channels.filter(
      (channel) => channel !== this
    );
  }
}

const state: DeveloperToolsState = {
  hostStatus: 'Ready.',
  sessionState: {
    runMode: 'local',
    navigationStatus: 'idle',
    requestedUrl: '',
    hasActiveCard: false,
    hasError: false,
    historyLength: 0
  },
  transportResponse: null,
  runtimeSnapshot: null,
  timeline: [],
  document: { coverage: '', description: '', goal: '', testingAcceptance: [] }
};

describe('Developer Tools browser bridge', () => {
  beforeEach(() => {
    TestBroadcastChannel.channels = [];
    vi.stubGlobal('BroadcastChannel', TestBroadcastChannel);
    document.body.innerHTML = `<main>${developerDrawerTemplate()}</main>`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens a detached surface and publishes the current session when it becomes ready', async () => {
    const focus = vi.fn();
    const open = vi.spyOn(window, 'open').mockReturnValue({ focus } as unknown as Window);
    const root = document.querySelector<HTMLElement>('#developer-tools-workspace');
    if (!root) throw new Error('missing workspace in test fixture');
    const bridge = bindDeveloperToolsHost({ root, getState: () => state, onError: vi.fn() });
    const detached = new TestBroadcastChannel('waves-developer-tools');
    const received: unknown[] = [];
    detached.addEventListener('message', (event) => received.push((event as MessageEvent).data));

    root.querySelector<HTMLButtonElement>('#btn-open-devtools-window')?.click();
    await Promise.resolve();
    detached.postMessage({ type: 'ready' });

    expect(open).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    expect(bridge.isConnected()).toBe(true);
    expect(received).toContainEqual({ type: 'state', state });
    bridge.dispose();
    detached.close();
  });

  it('relays detached actions through the existing controller-bound buttons', () => {
    const root = document.querySelector<HTMLElement>('#developer-tools-workspace');
    if (!root) throw new Error('missing workspace in test fixture');
    const healthClick = vi.fn();
    document.querySelector('#btn-health')?.addEventListener('click', healthClick);
    const bridge = bindDeveloperToolsHost({ root, getState: () => state, onError: vi.fn() });
    const detached = new TestBroadcastChannel('waves-developer-tools');

    detached.postMessage({ type: 'action', action: { action: 'health' } });

    expect(healthClick).toHaveBeenCalledOnce();
    bridge.dispose();
    detached.close();
  });
});
