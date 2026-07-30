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

const load = (
  machine: ReturnType<typeof createNavigationStateMachine>,
  url: string,
  followExternalIntent = false
) =>
  machine.loadTransportUrl({
    url,
    source: 'user',
    followExternalIntent
  });

const fetchOkFor = (url: string): FetchResponse => {
  const response = fetchOk({ finalUrl: url });
  return {
    ...response,
    engineDeckInput: response.engineDeckInput
      ? { ...response.engineDeckInput, baseUrl: url }
      : undefined
  };
};

describe('navigation-state frame sequencing', () => {
  it('publishes each load and input frame only after its engine transition resolves', async () => {
    const sequence: string[] = [];
    const publishedCards: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        engineLoadDeckContextFrame: vi.fn(async () => {
          sequence.push('engine-load');
          return frame({ activeCardId: 'loaded' });
        }),
        engineHandleKeyFrame: vi.fn(async () => {
          sequence.push('engine-input');
          return frame({ activeCardId: 'after-input' });
        })
      }),
      'http://seed.test',
      {
        onFrame: (committedFrame) => {
          const cardId = committedFrame.snapshot.activeCardId ?? '';
          sequence.push(`frame:${cardId}`);
          publishedCards.push(cardId);
        }
      }
    );

    await load(machine, 'http://example.test/start.wml');
    await machine.applyEngineKey('enter');

    expect(sequence).toEqual(['engine-load', 'frame:loaded', 'engine-input', 'frame:after-input']);
    expect(publishedCards).toEqual(['loaded', 'after-input']);
  });

  it('publishes the atomic timer frame without a follow-up render request', async () => {
    const engineAdvanceTimeMs = vi.fn();
    const engineRenderFrame = vi.fn();
    const engineAdvanceTimeMsFrame = vi.fn(async () =>
      frame({ activeCardId: 'after-timer', lastScriptRequiresRefresh: true })
    );
    const publishedCards: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        engineLoadDeckContextFrame: vi.fn(async () => frame({ activeCardId: 'before-timer' })),
        engineAdvanceTimeMs,
        engineRenderFrame,
        engineAdvanceTimeMsFrame
      }),
      'http://seed.test',
      {
        onFrame: (committedFrame) => publishedCards.push(committedFrame.snapshot.activeCardId ?? '')
      }
    );

    await load(machine, 'http://example.test/timer.wml');
    publishedCards.length = 0;

    await expect(machine.applyEngineTimerTick(100)).resolves.toMatchObject({
      activeCardId: 'after-timer'
    });

    expect(engineAdvanceTimeMsFrame).toHaveBeenCalledWith({ deltaMs: 100 });
    expect(engineAdvanceTimeMs).not.toHaveBeenCalled();
    expect(engineRenderFrame).not.toHaveBeenCalled();
    expect(publishedCards).toEqual(['after-timer']);
  });

  it('publishes only the restored card frame for host-history Back', async () => {
    const publishedCards: string[] = [];
    const transitions: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: vi.fn(async (request) => fetchOkFor(request.url)),
        engineLoadDeckContextFrame: vi.fn(async (request) => {
          const cardId = request.baseUrl.includes('/a.wml') ? 'a-home' : 'b-home';
          transitions.push(`load:${cardId}`);
          return frame({ activeCardId: cardId, baseUrl: request.baseUrl });
        }),
        engineHandleKeyFrame: vi.fn(async () => {
          transitions.push('input:a-details');
          return frame({
            activeCardId: 'a-details',
            baseUrl: 'http://example.test/a.wml'
          });
        }),
        engineNavigateBackFrame: vi.fn(async () => {
          transitions.push('back:no-op');
          return frame({ activeCardId: 'b-home', lastBackNavigationHandled: false });
        }),
        engineNavigateToCardFrame: vi.fn(async ({ cardId }) => {
          transitions.push(`card:${cardId}`);
          return frame({ activeCardId: cardId, baseUrl: 'http://example.test/a.wml' });
        })
      }),
      'http://seed.test',
      {
        onFrame: (committedFrame) => publishedCards.push(committedFrame.snapshot.activeCardId ?? '')
      }
    );

    await load(machine, 'http://example.test/a.wml');
    await machine.applyEngineKey('enter');
    await load(machine, 'http://example.test/b.wml');
    publishedCards.length = 0;
    transitions.length = 0;

    await expect(machine.navigateBackWithFallback()).resolves.toBe('host');

    expect(transitions).toEqual(['back:no-op', 'load:a-home', 'card:a-details']);
    expect(publishedCards).toEqual(['a-details']);
  });

  it('does not publish a cancelled load frame that resolves after cancellation', async () => {
    const pendingFrame = deferred<EngineFrame>();
    const engineLoadDeckContextFrame = vi.fn(() => pendingFrame.promise);
    const publishedCards: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({ engineLoadDeckContextFrame }),
      'http://seed.test',
      {
        onFrame: (committedFrame) => publishedCards.push(committedFrame.snapshot.activeCardId ?? '')
      }
    );

    const pendingLoad = load(machine, 'http://example.test/cancelled.wml');
    await vi.waitFor(() => expect(engineLoadDeckContextFrame).toHaveBeenCalledOnce());
    await machine.cancelPendingNavigation();
    pendingFrame.resolve(frame({ activeCardId: 'cancelled' }));

    await expect(pendingLoad).resolves.toBeNull();
    expect(publishedCards).toEqual([]);
  });

  it('publishes frames only from the generation that wins a superseding load race', async () => {
    const staleFrame = deferred<EngineFrame>();
    const publishedCards: string[] = [];
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: vi.fn(async (request): Promise<FetchResponse> => fetchOkFor(request.url)),
        engineLoadDeckContextFrame: vi.fn((request) =>
          request.baseUrl.includes('stale')
            ? staleFrame.promise
            : Promise.resolve(frame({ activeCardId: 'committed', baseUrl: request.baseUrl }))
        )
      }),
      'http://seed.test',
      {
        onFrame: (committedFrame) => publishedCards.push(committedFrame.snapshot.activeCardId ?? '')
      }
    );

    const staleLoad = load(machine, 'http://example.test/stale.wml');
    await Promise.resolve();
    const committedLoad = load(machine, 'http://example.test/committed.wml');
    await expect(committedLoad).resolves.toMatchObject({ activeCardId: 'committed' });

    staleFrame.resolve(frame({ activeCardId: 'stale' }));
    await expect(staleLoad).resolves.toBeNull();

    expect(publishedCards).toEqual(['committed']);
  });

  it('publishes one frame for each accepted external-intent transition', async () => {
    const publishedCards: string[] = [];
    let loadCount = 0;
    const machine = createNavigationStateMachine(
      createHostClientMock({
        fetchDeck: vi.fn(async (request) => fetchOkFor(request.url)),
        engineLoadDeckContextFrame: vi.fn(async (request) => {
          loadCount += 1;
          return loadCount === 1
            ? frame({
                activeCardId: 'source',
                baseUrl: request.baseUrl,
                externalNavigationIntent: 'http://example.test/target.wml'
              })
            : frame({ activeCardId: 'target', baseUrl: request.baseUrl });
        })
      }),
      'http://seed.test',
      {
        onFrame: (committedFrame) => publishedCards.push(committedFrame.snapshot.activeCardId ?? '')
      }
    );

    await load(machine, 'http://example.test/source.wml', true);

    expect(publishedCards).toEqual(['source', 'target']);
    expect(machine.getSessionState()).toMatchObject({
      finalUrl: 'http://example.test/target.wml',
      activeCardId: 'target'
    });
  });
});
