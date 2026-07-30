import { describe, expect, it, vi } from 'vitest';
import type {
  ApplicationStateLoadResult,
  ApplicationStateV1
} from '../../../contracts/application-state';
import {
  MemoryApplicationStateStore,
  TauriApplicationStateStore,
  WELCOME_STARTUP_STORAGE_KEY,
  defaultApplicationStateV1
} from './application-state-store';

const loaded = (state = defaultApplicationStateV1()): ApplicationStateLoadResult => ({
  state,
  status: 'loaded',
  writeAllowed: true,
  removedMonitorWindowState: false
});

const createLegacyStorage = (value: string | null) => {
  const values = new Map<string, string>();
  if (value !== null) values.set(WELCOME_STARTUP_STORAGE_KEY, value);
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    value: () => values.get(WELCOME_STARTUP_STORAGE_KEY) ?? null
  };
};

const createNativeClient = (loadResult: ApplicationStateLoadResult = loaded()) => {
  let state = loadResult.state;
  return {
    applicationStateLoad: vi.fn(async () => loadResult),
    applicationStateSave: vi.fn(async ({ state: next }: { state: ApplicationStateV1 }) => {
      state = next;
      return state;
    }),
    applicationStateReset: vi.fn(async () => {
      state = defaultApplicationStateV1();
      return state;
    }),
    applicationStateClearComponent: vi.fn(async () => state)
  };
};

describe('ApplicationStateStore', () => {
  it('provides deterministic clean-install defaults in the memory adapter', async () => {
    const store = new MemoryApplicationStateStore();

    const first = await store.load();
    const second = await store.load();

    expect(first.status).toBe('defaulted-absent');
    expect(first.state).toEqual(defaultApplicationStateV1());
    expect(second).toEqual(first);
  });

  it('projects only Rust-owned safe DTO keys before memory persistence', async () => {
    const state = defaultApplicationStateV1() as ApplicationStateV1 & Record<string, unknown>;
    state.history = {
      headers: { Authorization: 'header-canary' },
      postContext: { payload: 'post-canary' }
    };
    (state.settings as ApplicationStateV1['settings'] & Record<string, unknown>).transport = {
      rawPayload: 'payload-canary'
    };
    state.favorites.entries.push({
      id: 'favorite-1',
      title: 'Safe favorite',
      target: {
        kind: 'network',
        url: 'https://user:password@example.test/deck.wml?view=compact&token=query-canary',
        canonicalUrl: 'https://user:password@example.test/deck.wml?view=compact&token=query-canary'
      },
      createdAt: '2026-07-30T00:00:00Z',
      updatedAt: '2026-07-30T00:00:00Z'
    });
    state.safeSession = {
      recoveryPending: true,
      session: {
        kind: 'network-get',
        url: 'https://example.test/deck.wml?password=session-canary'
      }
    };
    const store = new MemoryApplicationStateStore();

    await store.save(state);

    const serialized = JSON.stringify(store.snapshot());
    expect(serialized).not.toContain('header-canary');
    expect(serialized).not.toContain('post-canary');
    expect(serialized).not.toContain('payload-canary');
    expect(serialized).not.toContain('query-canary');
    expect(serialized).not.toContain('session-canary');
    expect(serialized).toContain('view=compact');
    expect(store.snapshot()?.safeSession).toEqual({ recoveryPending: false });
    expect(serialized).not.toContain('history');
    expect(serialized).not.toContain('transport');
  });

  it('migrates the isolated Welcome preference once and removes it only after a safe write', async () => {
    const storage = createLegacyStorage('false');
    const client = createNativeClient();
    const store = new TauriApplicationStateStore(client, storage);

    const result = await store.load();

    expect(result.state.onboarding.showWelcomeOnLaunch).toBe(false);
    expect(client.applicationStateSave).toHaveBeenCalledOnce();
    expect(storage.removeItem).toHaveBeenCalledWith(WELCOME_STARTUP_STORAGE_KEY);
    expect(storage.value()).toBeNull();
  });

  it('preserves the legacy preference and future file when writes are blocked', async () => {
    const storage = createLegacyStorage('false');
    const client = createNativeClient({
      ...loaded(),
      status: 'defaulted-future-version',
      writeAllowed: false,
      futureSchemaVersion: 2
    });
    const store = new TauriApplicationStateStore(client, storage);

    const result = await store.load();

    expect(result.writeAllowed).toBe(false);
    expect(client.applicationStateSave).not.toHaveBeenCalled();
    expect(storage.value()).toBe('false');
  });

  it('turns a rejected native read into a non-blocking safe startup result', async () => {
    const client = createNativeClient();
    client.applicationStateLoad.mockRejectedValueOnce(new Error('unreadable'));
    const store = new TauriApplicationStateStore(client, null);

    await expect(store.load()).resolves.toEqual({
      state: defaultApplicationStateV1(),
      status: 'defaulted-read-failed',
      writeAllowed: false,
      removedMonitorWindowState: false
    });
  });

  it('survives ten deterministic write/restart cycles through the memory adapter', async () => {
    let state = defaultApplicationStateV1();
    for (let cycle = 0; cycle < 10; cycle += 1) {
      const writer = new MemoryApplicationStateStore({ initialState: state });
      state = await writer.save({
        ...state,
        settings: { ...state.settings, displayScalePercent: 100 + cycle }
      });
      const restarted = new MemoryApplicationStateStore({ initialState: writer.snapshot() });
      expect((await restarted.load()).state).toEqual(state);
    }
  });

  it('clears one component without ambiguously clearing the others', async () => {
    const state = defaultApplicationStateV1();
    state.onboarding.showWelcomeOnLaunch = false;
    state.safeSession = {
      recoveryPending: true,
      session: { kind: 'local-example', exampleId: 'yourFirstDeck', fragment: '#next' }
    };
    const store = new MemoryApplicationStateStore({ initialState: state });

    const cleared = await store.clear('safe-session');

    expect(cleared.safeSession).toEqual(defaultApplicationStateV1().safeSession);
    expect(cleared.onboarding.showWelcomeOnLaunch).toBe(false);
  });
});
