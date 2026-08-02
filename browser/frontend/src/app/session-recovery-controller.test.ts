import { describe, expect, it, vi } from 'vitest';
import type {
  ApplicationStateLoadResult,
  SafeSessionV1
} from '../../../contracts/application-state';
import { networkHistoryEntryIsSafeForRecovery } from './browser-controller';
import {
  MemoryApplicationStateStore,
  defaultApplicationStateV1,
  type ApplicationStateStore
} from './application-state-store';
import {
  RECOVERY_OFFER_DEADLINE_MS,
  SessionRecoveryController
} from './session-recovery-controller';
import { sessionRecoveryTemplate } from './shell/session-recovery-template';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const setup = (): void => {
  document.body.innerHTML = `<main id="shell">Ready</main>${sessionRecoveryTemplate()}`;
};

const crashedState = (session: SafeSessionV1) => {
  const state = defaultApplicationStateV1();
  state.safeSession = { recoveryPending: true, session };
  return state;
};

describe('safe session and crash recovery', () => {
  it('leaves the shell painted while persistence is still loading', async () => {
    setup();
    const pending = deferred<ApplicationStateLoadResult>();
    const fallback = new MemoryApplicationStateStore();
    const store: ApplicationStateStore = {
      load: () => pending.promise,
      save: (state) => fallback.save(state),
      update: (project) => fallback.update(project),
      reset: () => fallback.reset(),
      clear: (component) => fallback.clear(component)
    };
    const controller = new SessionRecoveryController({
      store,
      shellAppearedAt: 0,
      now: () => 25,
      restoreSession: vi.fn(),
      notify: vi.fn()
    });

    const preparation = controller.prepare();

    expect(document.querySelector('#shell')?.textContent).toBe('Ready');
    expect(document.querySelector<HTMLElement>('#session-recovery')?.hidden).toBe(true);
    pending.resolve({
      state: defaultApplicationStateV1(),
      status: 'defaulted-absent',
      writeAllowed: true,
      removedMonitorWindowState: false
    });
    await preparation;
  });

  it('offers a crashed network GET before the two-second deadline and never fetches automatically', async () => {
    setup();
    const session: SafeSessionV1 = {
      kind: 'network-get',
      url: 'https://example.test/deck.wml#card'
    };
    const restoreSession = vi.fn(async () => undefined);
    const store = new MemoryApplicationStateStore({ initialState: crashedState(session) });
    const controller = new SessionRecoveryController({
      store,
      shellAppearedAt: 100,
      now: () => 100 + RECOVERY_OFFER_DEADLINE_MS - 1,
      restoreSession,
      notify: vi.fn()
    });

    await controller.prepare();

    const panel = document.querySelector<HTMLElement>('#session-recovery');
    expect(panel?.hidden).toBe(false);
    expect(panel?.dataset.offerWithinDeadline).toBe('true');
    expect(panel?.dataset.recoveryReason).toBe('crash');
    expect(restoreSession).not.toHaveBeenCalled();

    document.querySelector<HTMLButtonElement>('#btn-session-recovery-restore')?.click();
    await vi.waitFor(() => expect(restoreSession).toHaveBeenCalledWith(session));
    await controller.settled();
    expect(store.snapshot()?.safeSession).toEqual({ recoveryPending: true, session });
  });

  it('restores crashed local content automatically after the engine is ready', async () => {
    setup();
    const session: SafeSessionV1 = {
      kind: 'local-example',
      exampleId: 'yourFirstDeck',
      fragment: '#next'
    };
    const restoreSession = vi.fn(async () => undefined);
    const store = new MemoryApplicationStateStore({ initialState: crashedState(session) });
    const controller = new SessionRecoveryController({
      store,
      shellAppearedAt: 0,
      now: () => 50,
      restoreSession,
      notify: vi.fn()
    });

    await controller.prepare();
    expect(restoreSession).not.toHaveBeenCalled();
    expect(document.querySelector<HTMLElement>('#session-recovery')?.dataset.recoveryState).toBe(
      'restoring'
    );

    await controller.activate();

    expect(restoreSession).toHaveBeenCalledWith(session);
    expect(document.querySelector<HTMLElement>('#session-recovery')?.hidden).toBe(true);
  });

  it('removes recovery data after an unsafe committed request', async () => {
    setup();
    const store = new MemoryApplicationStateStore({
      initialState: crashedState({ kind: 'network-get', url: 'https://example.test/old.wml' })
    });
    const controller = new SessionRecoveryController({
      store,
      shellAppearedAt: 0,
      restoreSession: vi.fn(),
      notify: vi.fn()
    });

    await controller.prepare();
    await controller.commitUnsafeSession();
    document.querySelector<HTMLButtonElement>('#btn-session-recovery-dismiss')?.click();
    await vi.waitFor(() =>
      expect(store.snapshot()?.safeSession).toEqual({ recoveryPending: false })
    );

    expect(store.snapshot()?.safeSession.session).toBeUndefined();
  });

  it('classifies POST context and credential headers as non-replayable', () => {
    expect(
      networkHistoryEntryIsSafeForRecovery({
        url: 'https://example.test/deck.wml',
        method: 'POST',
        requestPolicy: {
          postContext: { contentType: 'application/x-www-form-urlencoded', payload: 'pin=1234' }
        }
      })
    ).toBe(false);
    expect(
      networkHistoryEntryIsSafeForRecovery({
        url: 'https://example.test/deck.wml',
        method: 'GET',
        headers: { Authorization: 'Basic canary' }
      })
    ).toBe(false);
    expect(
      networkHistoryEntryIsSafeForRecovery({
        url: 'https://example.test/deck.wml',
        method: 'GET',
        headers: { Accept: 'text/vnd.wap.wml' }
      })
    ).toBe(true);
  });

  it('keeps the prior committed artifact when persistence fails', async () => {
    setup();
    const initial = crashedState({ kind: 'network-get', url: 'https://example.test/old.wml' });
    const store = new MemoryApplicationStateStore({ initialState: initial, failWrites: true });
    const controller = new SessionRecoveryController({
      store,
      shellAppearedAt: 0,
      restoreSession: vi.fn(),
      notify: vi.fn()
    });

    await controller.prepare();
    await controller.commitUnsafeSession();
    document.querySelector<HTMLButtonElement>('#btn-session-recovery-dismiss')?.click();
    await controller.settled();

    expect(store.snapshot()).toEqual(initial);
  });
});
