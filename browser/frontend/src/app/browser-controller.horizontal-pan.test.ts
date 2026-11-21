import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EngineFrame, EngineInputEvent } from '../../../contracts/engine';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';
import { BrowserController } from './browser-controller';
import { controllerPrivates } from './browser-controller.test-helpers';
import { BrowserPresenter } from './browser-presenter';
import { mountBrowserShell } from './browser-shell-template';
import { defaultLocalDeckExample } from './local-examples';
import { frame, presentationStub } from './navigation-state.test-helpers';

function nowrapFrame(
  frameId: string,
  focusedLinkIndex: number,
  cardId = 'main',
  tailHref = '#next'
): EngineFrame {
  return {
    ...frame(
      { activeCardId: cardId, focusedLinkIndex },
      {
        draw: [
          {
            type: 'link',
            x: 0,
            y: 0,
            text: 'Near',
            href: '#main',
            focused: focusedLinkIndex === 0
          },
          {
            type: 'link',
            x: 60,
            y: 1,
            text: 'Tail',
            href: tailHref,
            focused: focusedLinkIndex === 1
          }
        ]
      }
    ),
    presentation: {
      ...presentationStub,
      card: { id: cardId },
      frameId,
      focus: { index: focusedLinkIndex, focusId: `focus:${focusedLinkIndex}`, targetKind: 'link' },
      hitRegions: [
        { x: 0, y: 0, width: 4, height: 1, actionId: 'focus:0', targetKind: 'link' },
        { x: 60, y: 1, width: 4, height: 1, actionId: 'focus:1', targetKind: 'link' }
      ]
    }
  };
}

async function mountController() {
  document.body.innerHTML = '<div id="app"></div>';
  const refs = mountBrowserShell('', 'local');
  refs.statusEl.setStatus = vi.fn();
  refs.viewportEl.style.fontSize = '14px';
  const canvas = refs.viewportCanvasEl!;
  Object.defineProperties(refs.viewportEl, {
    clientWidth: { value: 100 },
    clientHeight: { value: 80 }
  });
  vi.stubGlobal('devicePixelRatio', 2);
  vi.stubGlobal('CanvasRenderingContext2D', class {});
  const fillText = vi.fn();
  vi.spyOn(canvas, 'getContext').mockReturnValue({
    fillText,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    setTransform: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 8 })
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 20, 50, 40));
  const host = {
    engineSetViewportCols: vi.fn(async () => nowrapFrame('initial', 0).snapshot),
    engineLoadDeckContextFrame: vi.fn(async () => nowrapFrame('initial', 0)),
    engineBeginFocusedSelectEditFrame: vi.fn(async () => nowrapFrame('tail-focused', 1)),
    engineHandleInputFrame: vi.fn(async ({ event }: { event: EngineInputEvent }) => {
      if (event.type === 'key' && event.key === 'down') return nowrapFrame('tail-focused', 1);
      if (event.type === 'scroll') return nowrapFrame('unrelated-rerender', 1);
      if (event.type === 'key' && event.key === 'enter') return nowrapFrame('other', 0, 'other');
      return frame(
        { activeCardId: 'next' },
        {
          draw: [{ type: 'text', x: 0, y: 0, text: 'Destination' }]
        }
      );
    })
  } satisfies Partial<TauriHostClient>;
  const presenter = new BrowserPresenter(
    refs,
    {
      runMode: 'local',
      navigationStatus: 'idle',
      requestedUrl: ''
    },
    20
  );
  const controller = new BrowserController(host as unknown as TauriHostClient, presenter, refs);
  await controller.init('');
  const range = document.querySelector<HTMLInputElement>('.viewport-horizontal-pan input')!;
  const key = async (target: EventTarget, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    await controllerPrivates(controller).keyboardIntentRouter.whenIdle();
    return event;
  };
  const pan = (value: string) => {
    range.value = value;
    range.dispatchEvent(new Event('input'));
  };
  return {
    canvas,
    controller,
    fillText,
    host,
    key,
    pan,
    presenter,
    range,
    viewport: refs.viewportEl
  };
}

describe('Waves horizontal pan', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('paints and clicks the same offscreen logical link on a scaled DPR canvas', async () => {
    const { canvas, controller, fillText, host, pan, presenter, range } = await mountController();
    try {
      expect(host.engineSetViewportCols).toHaveBeenCalledWith({ cols: 20 });
      expect(canvas.width).toBe(200);
      pan(range.max);
      expect(fillText).toHaveBeenLastCalledWith('Tail', 65, 17.5);
      canvas.dispatchEvent(new MouseEvent('click', { button: 0, clientX: 44, clientY: 30 }));
      await controllerPrivates(controller).keyboardIntentRouter.whenIdle();
      expect(host.engineHandleInputFrame).toHaveBeenCalledWith({
        event: { type: 'click', frameId: 'initial', x: 60, y: 1 }
      });
      expect(presenter.getSnapshot()?.activeCardId).toBe('next');
      expect(range.valueAsNumber).toBe(0);
      expect(range.closest('label')?.hidden).toBe(true);
    } finally {
      controller.dispose();
    }
  });

  it('activates a horizontally panned link using the committed wheel-scrolled hit window', async () => {
    const { canvas, controller, fillText, host, pan, presenter, range } = await mountController();
    const scrolled = nowrapFrame('scrolled', 0);
    scrolled.render.draw = [
      ...scrolled.render.draw.map((draw) => (draw.x === 60 ? { ...draw, y: 2 } : draw)),
      { type: 'text', x: 0, y: 23, text: 'Last row' }
    ];
    scrolled.presentation.viewport = { cols: 20, rows: 20, offsetRow: 1, contentRows: 24 };
    scrolled.presentation.hitRegions = [
      { x: 60, y: 1, width: 4, height: 1, actionId: 'focus:1', targetKind: 'link' }
    ];
    const tail = scrolled.presentation.hitRegions[0];
    const whenIdle = () => controllerPrivates(controller).keyboardIntentRouter.whenIdle();
    try {
      host.engineHandleInputFrame.mockResolvedValueOnce(scrolled);
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 1 }));
      await whenIdle();
      expect(host.engineHandleInputFrame).toHaveBeenLastCalledWith({
        event: { type: 'scroll', frameId: 'initial', deltaRows: 1 }
      });
      host.engineHandleInputFrame.mockImplementation(async ({ event }) =>
        event.type === 'click' &&
        event.frameId === 'scrolled' &&
        event.x >= tail.x &&
        event.x < tail.x + tail.width &&
        event.y === tail.y
          ? frame({ activeCardId: 'next' })
          : scrolled
      );

      vi.mocked(canvas.getBoundingClientRect).mockReturnValue(new DOMRect(10, 20, 50, 210));
      pan(range.max);
      expect(fillText).toHaveBeenCalledWith('Tail', 65, 35);

      // Rows 0 and 21 are on the canvas but outside the engine's rows 1–20.
      for (const clientY of [22, 205]) {
        canvas.dispatchEvent(new MouseEvent('click', { button: 0, clientX: 44, clientY }));
      }
      canvas.dispatchEvent(new MouseEvent('click', { button: 0, clientX: 44, clientY: 40 }));
      await whenIdle();

      expect(host.engineHandleInputFrame.mock.calls.slice(1)).toEqual([
        [{ event: { type: 'click', frameId: 'scrolled', x: 60, y: 1 } }]
      ]);
      expect(presenter.getSnapshot()?.activeCardId).toBe('next');
    } finally {
      controller.dispose();
    }
  });

  it('reveals changed focus, preserves manual pan on a scroll frame, and resets a deck reload', async () => {
    const { canvas, controller, host, key, pan, presenter, range, viewport } =
      await mountController();
    try {
      expect((await key(range, 'ArrowDown')).defaultPrevented).toBe(false);
      expect(host.engineHandleInputFrame).not.toHaveBeenCalled();
      await key(viewport, 'ArrowDown');
      expect(presenter.getSnapshot()?.focusedLinkIndex).toBe(1);
      expect(range.value).toBe(range.max);

      pan('40');
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 1 }));
      await controllerPrivates(controller).keyboardIntentRouter.whenIdle();
      expect(host.engineHandleInputFrame).toHaveBeenLastCalledWith({
        event: { type: 'scroll', frameId: 'tail-focused', deltaRows: 1 }
      });
      expect(range.valueAsNumber).toBe(40);
      await key(viewport, 'Enter');
      expect(host.engineHandleInputFrame).toHaveBeenLastCalledWith({
        event: { type: 'key', key: 'enter' }
      });
      expect(presenter.getSnapshot()?.activeCardId).toBe('other');
      expect(range.valueAsNumber).toBe(0);
      expect(range.closest('label')?.hidden).toBe(false);

      const example = { kind: 'local-example' as const, exampleId: defaultLocalDeckExample().key };
      await controller.restoreSafeSession(example);
      pan(range.max);
      await controller.restoreSafeSession(example);
      expect(range.valueAsNumber).toBe(0);
      expect(range.closest('label')?.hidden).toBe(false);
    } finally {
      controller.dispose();
    }
  });

  it('reveals a newly focused link below the engine hit window', async () => {
    const { controller, host, key, presenter, range, viewport } = await mountController();
    const focusedFrame = nowrapFrame('tail-below-hit-window', 1);
    focusedFrame.render.draw = focusedFrame.render.draw.map((draw) =>
      draw.type === 'link' && draw.focused ? { ...draw, y: 25 } : draw
    );
    focusedFrame.presentation.hitRegions = focusedFrame.presentation.hitRegions.filter(
      (region) => region.actionId !== 'focus:1'
    );
    try {
      host.engineHandleInputFrame.mockResolvedValueOnce(focusedFrame);
      await key(viewport, 'ArrowDown');

      expect(presenter.getSnapshot()?.focusedLinkIndex).toBe(1);
      expect(range.valueAsNumber).toBeGreaterThan(0);
      expect(range.value).toBe(range.max);
    } finally {
      controller.dispose();
    }
  });

  it.each([
    {
      nextFrameId: 'initial',
      expectedClicks: [{ type: 'click', frameId: 'initial', x: 60, y: 1 }]
    },
    { nextFrameId: 'updated', expectedClicks: [] }
  ])(
    'keeps click-time coordinates and rejects stale clicks after frame $nextFrameId',
    async ({ nextFrameId, expectedClicks }) => {
      const { canvas, controller, host, key, pan, range, viewport } = await mountController();
      let finishInput: (frame: EngineFrame) => void = () => {};
      const pendingInput = new Promise<EngineFrame>((resolve) => {
        finishInput = resolve;
      });
      try {
        host.engineHandleInputFrame.mockReturnValueOnce(pendingInput);
        const pendingKey = key(viewport, 'ArrowDown');
        await vi.waitFor(() => expect(host.engineHandleInputFrame).toHaveBeenCalledOnce());

        pan(range.max);
        canvas.dispatchEvent(new MouseEvent('click', { button: 0, clientX: 44, clientY: 30 }));
        pan('0');
        finishInput(nowrapFrame(nextFrameId, 0));
        await pendingKey;
        await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

        const clicks = host.engineHandleInputFrame.mock.calls
          .map(([{ event }]) => event)
          .filter((event) => event.type === 'click');
        expect(clicks).toEqual(expectedClicks);
      } finally {
        finishInput(nowrapFrame(nextFrameId, 0));
        controller.dispose();
      }
    }
  );

  it('rejects a click queued during a deck reload that reuses the committed frame ID', async () => {
    const { canvas, controller, host, pan, range } = await mountController();
    const replacement = nowrapFrame('initial', 0, 'main', '#replacement');
    let finishReload: (frame: EngineFrame) => void = () => {};
    const pendingDeck = new Promise<EngineFrame>((resolve) => {
      finishReload = resolve;
    });
    try {
      host.engineLoadDeckContextFrame.mockReturnValueOnce(pendingDeck);
      const reload = controller.restoreSafeSession({
        kind: 'local-example',
        exampleId: defaultLocalDeckExample().key
      });
      await vi.waitFor(() => expect(host.engineLoadDeckContextFrame).toHaveBeenCalledTimes(2));

      pan(range.max);
      canvas.dispatchEvent(new MouseEvent('click', { button: 0, clientX: 44, clientY: 30 }));
      finishReload(replacement);
      await reload;
      await controllerPrivates(controller).keyboardIntentRouter.whenIdle();

      expect(host.engineHandleInputFrame).not.toHaveBeenCalled();
    } finally {
      finishReload(replacement);
      controller.dispose();
    }
  });
});
