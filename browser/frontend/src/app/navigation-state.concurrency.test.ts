import { describe, expect, it, vi } from 'vitest';
import type { FetchResponse } from '../../../contracts/transport';
import type { EngineFrame } from '../../../contracts/engine';
import { createNavigationStateMachine } from './navigation-state';
import { createHostClientMock, fetchOk, frame } from './navigation-state.test-helpers';

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

const deferred = <T>(): Deferred<T> => {
  let resolvePromise: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve: (value) => resolvePromise?.(value)
  };
};

const load = (machine: ReturnType<typeof createNavigationStateMachine>, url: string) =>
  machine.loadTransportUrl({
    url,
    source: 'user',
    followExternalIntent: false
  });

describe('NavigationStateMachine concurrency ownership', () => {
  it('does not begin key or timer engine work while a transport navigation is in flight', async () => {
    const pendingFetch = deferred<FetchResponse>();
    const engineHandleKeyFrame = vi.fn(async () => frame({ activeCardId: 'stale-key' }));
    const engineAdvanceTimeMs = vi.fn(async () => frame({ activeCardId: 'stale-timer' }).snapshot);
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: vi.fn(() => pendingFetch.promise),
        engineHandleKeyFrame,
        engineAdvanceTimeMs
      }),
      'http://seed.test'
    );

    const pendingLoad = load(machine, 'http://example.test/pending.wml');
    await Promise.resolve();

    expect(await machine.applyEngineKey('up')).toBeNull();
    expect(await machine.applyEngineTimerTick(100)).toBeNull();
    expect(engineHandleKeyFrame).not.toHaveBeenCalled();
    expect(engineAdvanceTimeMs).not.toHaveBeenCalled();

    pendingFetch.resolve(fetchOk({ finalUrl: 'http://example.test/pending.wml' }));
    await pendingLoad;
  });

  it('discards a key completion when a transport navigation starts during its engine await', async () => {
    const pendingKey = deferred<EngineFrame>();
    const pendingFetch = deferred<FetchResponse>();
    const snapshots: string[] = [];
    let fetchCount = 0;
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: vi.fn(() => {
          fetchCount += 1;
          return fetchCount === 1
            ? Promise.resolve(fetchOk({ finalUrl: 'http://example.test/current.wml' }))
            : pendingFetch.promise;
        }),
        engineLoadDeckContextFrame: vi.fn(async (request) =>
          frame({ activeCardId: 'current', baseUrl: request.baseUrl, browserContextEpoch: 1 })
        ),
        engineHandleKeyFrame: vi.fn(() => pendingKey.promise)
      }),
      'http://seed.test',
      {
        onSnapshot: (snapshot) => snapshots.push(snapshot.activeCardId ?? '')
      }
    );

    await load(machine, 'http://example.test/current.wml');
    snapshots.length = 0;
    const keyResult = machine.applyEngineKey('enter');
    await Promise.resolve();
    const nextLoad = load(machine, 'http://example.test/next.wml');

    pendingKey.resolve(
      frame({
        activeCardId: 'stale-key',
        browserContextEpoch: 1,
        externalNavigationIntent: 'http://example.test/stale-intent.wml'
      })
    );

    expect(await keyResult).toBeNull();
    expect(snapshots).not.toContain('stale-key');
    expect(machine.getHistoryState().entries.map((entry) => entry.activeCardId)).toEqual([
      'current'
    ]);

    pendingFetch.resolve(fetchOk({ finalUrl: 'http://example.test/next.wml' }));
    await nextLoad;
  });

  it('discards a timer completion when a transport navigation starts during its engine await', async () => {
    const pendingTimer = deferred<ReturnType<typeof frame>['snapshot']>();
    const pendingFetch = deferred<FetchResponse>();
    const renders: string[] = [];
    let fetchCount = 0;
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: vi.fn(() => {
          fetchCount += 1;
          return fetchCount === 1
            ? Promise.resolve(fetchOk({ finalUrl: 'http://example.test/current.wml' }))
            : pendingFetch.promise;
        }),
        engineLoadDeckContextFrame: vi.fn(async (request) =>
          frame({ activeCardId: 'current', baseUrl: request.baseUrl, browserContextEpoch: 1 })
        ),
        engineAdvanceTimeMs: vi.fn(() => pendingTimer.promise),
        engineRenderFrame: vi.fn(async () => frame({ activeCardId: 'stale-timer' }))
      }),
      'http://seed.test',
      {
        onRender: (render) => renders.push(render.draw[0]?.type ?? '')
      }
    );

    await load(machine, 'http://example.test/current.wml');
    const renderCount = renders.length;
    const timerResult = machine.applyEngineTimerTick(100);
    await Promise.resolve();
    const nextLoad = load(machine, 'http://example.test/next.wml');

    pendingTimer.resolve(
      frame({
        activeCardId: 'stale-timer',
        browserContextEpoch: 1,
        externalNavigationIntent: 'http://example.test/stale-intent.wml'
      }).snapshot
    );

    expect(await timerResult).toBeNull();
    expect(renders).toHaveLength(renderCount);
    expect(machine.getHistoryState().entries.map((entry) => entry.activeCardId)).toEqual([
      'current'
    ]);

    pendingFetch.resolve(fetchOk({ finalUrl: 'http://example.test/next.wml' }));
    await nextLoad;
  });

  it('Back cancels a pending fetch before awaiting or applying engine history state', async () => {
    const pendingFetch = deferred<FetchResponse>();
    const pendingBack = deferred<EngineFrame>();
    const engineLoadDeckContextFrame = vi.fn(async (request) =>
      frame({
        activeCardId: request.baseUrl.includes('/one.wml') ? 'one' : 'two',
        baseUrl: request.baseUrl,
        browserContextEpoch: 1
      })
    );
    let fetchCount = 0;
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: vi.fn((request) => {
          fetchCount += 1;
          return fetchCount <= 2
            ? Promise.resolve(fetchOk({ finalUrl: request.url }))
            : pendingFetch.promise;
        }),
        engineLoadDeckContextFrame,
        engineNavigateBackFrame: vi.fn(() => pendingBack.promise)
      }),
      'http://seed.test'
    );

    await load(machine, 'http://example.test/one.wml');
    await load(machine, 'http://example.test/two.wml');
    const interruptedLoad = load(machine, 'http://example.test/stale.wml');
    await Promise.resolve();
    const back = machine.navigateBackWithFallback();
    await Promise.resolve();

    pendingFetch.resolve(fetchOk({ finalUrl: 'http://example.test/stale.wml' }));
    await interruptedLoad;
    expect(engineLoadDeckContextFrame).toHaveBeenCalledTimes(2);

    pendingBack.resolve(
      frame({
        activeCardId: 'one',
        baseUrl: 'http://example.test/one.wml',
        browserContextEpoch: 1,
        lastBackNavigationHandled: true
      })
    );
    expect(await back).toBe('engine');
    expect(machine.getSessionState().activeCardId).toBe('one');
  });
});
