import { describe, expect, it, vi } from 'vitest';
import {
  canvasFrameFromRenderList,
  mapCanvasPointerToEngineCoordinates,
  CanvasViewportRenderer,
  ensureCanvasViewportElements,
  type CanvasViewportContext,
  type CanvasViewportStyle
} from './canvas-viewport-renderer';

interface DrawOperation {
  kind: 'clear' | 'fill-rect' | 'fill-text' | 'transform';
  args: readonly (number | string | undefined)[];
  fillStyle?: string;
}

const FIXED_STYLE: CanvasViewportStyle = {
  font: '14px monospace',
  fontSize: 14,
  lineHeight: 18,
  inlinePadding: 3,
  underlineOffset: 1,
  underlineThickness: 1,
  textColor: '#111111',
  linkColor: '#0000aa',
  focusForeground: '#eeeecc',
  focusBackground: '#223322'
};

const createContext = (operations: DrawOperation[]): CanvasViewportContext => ({
  fillStyle: '#000000',
  font: '',
  textBaseline: 'alphabetic',
  setTransform(...args) {
    operations.push({ kind: 'transform', args });
  },
  clearRect(...args) {
    operations.push({ kind: 'clear', args });
  },
  fillRect(...args) {
    operations.push({ kind: 'fill-rect', args, fillStyle: String(this.fillStyle) });
  },
  fillText(...args) {
    operations.push({ kind: 'fill-text', args, fillStyle: String(this.fillStyle) });
  },
  measureText(text) {
    return { width: text.length * 6 };
  }
});

describe('CanvasViewportRenderer', () => {
  it('pans to the engine nowrap anchor at column 19 without widening the canvas', () => {
    const container = document.createElement('div');
    const viewport = container.appendChild(document.createElement('div'));
    const elements = ensureCanvasViewportElements(viewport);
    const operations: DrawOperation[] = [];
    const renderer = new CanvasViewportRenderer(viewport, elements, {
      context: createContext(operations),
      getPixelRatio: () => 2,
      getSize: () => ({ width: 80, height: 40 }),
      getStyle: () => FIXED_STYLE
    });

    // The leading draw commands from wml_fx_paragraph_nowrap_layout_retains_offscreen_targets.
    renderer.render(
      canvasFrameFromRenderList({
        draw: [
          { type: 'link', x: 0, y: 0, text: 'Stay', focused: true, href: '#main' },
          { type: 'text', x: 4, y: 0, text: 'abcdefghijklmno' },
          { type: 'link', x: 19, y: 0, text: 'Go', focused: false, href: '#next' }
        ]
      })
    );

    expect(elements.canvas.width).toBe(160);
    const range = container.querySelector<HTMLInputElement>('input[type="range"]');
    expect(range?.labels?.[0]?.textContent).toBe('Horizontal pan');
    expect(range?.closest('label')?.hidden).toBe(false);
    expect(range?.max).toBe('52');
    if (!range) throw new Error('Missing horizontal pan control');
    range.value = range.max;
    range.dispatchEvent(new Event('input'));
    expect(operations.filter(({ kind }) => kind === 'fill-text').at(-1)?.args).toEqual([
      'Go',
      65,
      0
    ]);
    expect(elements.canvas.width).toBe(160);
    renderer.dispose();
  });

  it('adapts legacy draw commands to presentation-frame-shaped rows', () => {
    const frame = canvasFrameFromRenderList({
      draw: [
        { type: 'text', x: 0, y: 2, text: 'tail' },
        { type: 'link', x: 0, y: 1, text: 'Go', focused: true, href: '#next' },
        { type: 'text', x: 2, y: 1, text: ' now' }
      ]
    });

    expect(frame).toEqual({
      rows: [
        {
          index: 1,
          segments: [
            { type: 'focusable', x: 0, text: 'Go', focused: true },
            { type: 'text', x: 2, text: ' now' }
          ]
        },
        { index: 2, segments: [{ type: 'text', x: 0, text: 'tail' }] }
      ]
    });
  });

  it('draws rows in visual order with deterministic focus and link treatment', () => {
    const viewport = document.createElement('div');
    const elements = ensureCanvasViewportElements(viewport);
    const operations: DrawOperation[] = [];
    const renderer = new CanvasViewportRenderer(viewport, elements, {
      context: createContext(operations),
      getPixelRatio: () => 2,
      getSize: () => ({ width: 100, height: 60 }),
      getStyle: () => FIXED_STYLE,
      observeResize: () => ({ disconnect: vi.fn() })
    });

    renderer.render({
      rows: [
        { index: 2, segments: [{ type: 'text', x: 0, text: 'Last' }] },
        {
          index: 1,
          segments: [
            { type: 'focusable', x: 0, text: 'Go', focused: true },
            { type: 'text', x: 2, text: ' ' },
            { type: 'focusable', x: 3, text: 'Next', focused: false }
          ]
        }
      ]
    });

    expect(elements.canvas.width).toBe(200);
    expect(elements.canvas.height).toBe(120);
    expect(elements.canvas.style.height).toBe('60px');
    expect(elements.accessibleText.textContent).toBe('Go Next\nLast');
    expect(operations.filter(({ kind }) => kind === 'fill-text')).toEqual([
      { kind: 'fill-text', args: ['Go', 3, 18], fillStyle: '#eeeecc' },
      { kind: 'fill-text', args: [' ', 15, 18], fillStyle: '#111111' },
      { kind: 'fill-text', args: ['Next', 21, 18], fillStyle: '#0000aa' },
      { kind: 'fill-text', args: ['Last', 3, 36], fillStyle: '#111111' }
    ]);
    expect(operations.filter(({ kind }) => kind === 'fill-rect')).toEqual([
      { kind: 'fill-rect', args: [3, 18, 12, 18], fillStyle: '#223322' },
      { kind: 'fill-rect', args: [21, 33, 24, 1], fillStyle: '#0000aa' }
    ]);
  });

  it('draws the engine-provided input title and masked value as text', () => {
    const viewport = document.createElement('div');
    const elements = ensureCanvasViewportElements(viewport);
    const operations: DrawOperation[] = [];
    const renderer = new CanvasViewportRenderer(viewport, elements, {
      context: createContext(operations),
      getStyle: () => FIXED_STYLE
    });
    const text = '[Access & security: ****]';
    renderer.render({
      rows: [{ index: 0, segments: [{ type: 'focusable', x: 0, text, focused: true }] }]
    });

    expect(elements.accessibleText.textContent).toBe(text);
    expect(operations).toContainEqual({
      kind: 'fill-text',
      args: [text, 3, 0],
      fillStyle: FIXED_STYLE.focusForeground
    });
    renderer.dispose();
  });

  it('fits wide fallback glyphs and link decorations within wrapped logical cells', () => {
    const container = document.createElement('div');
    const viewport = container.appendChild(document.createElement('div'));
    const elements = ensureCanvasViewportElements(viewport);
    const operations: DrawOperation[] = [];
    const context = createContext(operations);
    context.measureText = (text) => ({ width: text === 'M' || text === 'A' ? 8 : 14 });
    vi.spyOn(elements.canvas, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 30, 40));
    const renderer = new CanvasViewportRenderer(viewport, elements, {
      context,
      getPixelRatio: () => 1,
      getSize: () => ({ width: 30, height: 40 }),
      getStyle: () => FIXED_STYLE
    });

    renderer.render({
      rows: [
        {
          index: 0,
          segments: [
            { type: 'focusable', x: 0, text: '漢', focused: true },
            { type: 'focusable', x: 1, text: 'A' },
            { type: 'focusable', x: 2, text: '語' }
          ]
        }
      ]
    });

    expect(operations.filter(({ kind }) => kind === 'fill-text').map(({ args }) => args)).toEqual([
      ['漢', 3, 0, 8],
      ['A', 11, 0],
      ['語', 19, 0, 8]
    ]);
    expect(operations.filter(({ kind }) => kind === 'fill-rect').map(({ args }) => args)).toEqual([
      [3, 0, 8, 18],
      [11, 15, 8, 1],
      [19, 15, 8, 1]
    ]);
    expect(renderer.pointerToEngineCoordinates(11, 2)).toEqual({ x: 1, y: 0 });
    expect(container.querySelector('label')?.hidden).toBe(true);
    renderer.dispose();
  });

  it('converts CSS-scaled device pixels into deterministic engine columns and rows', () => {
    const geometry = {
      bounds: { left: 10, top: 20, width: 160, height: 100 },
      backingWidth: 640,
      backingHeight: 400,
      pixelRatio: 2,
      columnWidth: 8,
      lineHeight: 16,
      inlinePadding: 4,
      panOffset: 0
    };

    expect(mapCanvasPointerToEngineCoordinates(30, 29, geometry)).toEqual({ x: 4, y: 1 });
    expect(mapCanvasPointerToEngineCoordinates(11, 29, geometry)).toEqual(null);
    expect(mapCanvasPointerToEngineCoordinates(170, 29, geometry)).toEqual(null);
    expect(mapCanvasPointerToEngineCoordinates(11, 29, { ...geometry, panOffset: 162 })).toEqual({
      x: 20,
      y: 1
    });
  });

  it('redraws on resize and disconnects its observer', () => {
    const viewport = document.createElement('div');
    const elements = ensureCanvasViewportElements(viewport);
    const operations: DrawOperation[] = [];
    const disconnect = vi.fn();
    let redraw: (() => void) | undefined;
    const renderer = new CanvasViewportRenderer(viewport, elements, {
      context: createContext(operations),
      getPixelRatio: () => 1,
      getSize: () => ({ width: 80, height: 40 }),
      getStyle: () => FIXED_STYLE,
      observeResize: (callback) => {
        redraw = callback;
        return { disconnect };
      }
    });

    renderer.render({ rows: [{ index: 0, segments: [{ type: 'text', x: 0, text: 'Ready' }] }] });
    const drawCount = operations.filter(({ kind }) => kind === 'fill-text').length;

    redraw?.();
    expect(operations.filter(({ kind }) => kind === 'fill-text')).toHaveLength(drawCount + 1);

    renderer.dispose();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('clamps to the widest draw row on resize and hides the control when content fits', () => {
    const container = document.createElement('div');
    const viewport = container.appendChild(document.createElement('div'));
    const elements = ensureCanvasViewportElements(viewport);
    const operations: DrawOperation[] = [];
    let resize: (() => void) | undefined;
    let width = 80;
    const renderer = new CanvasViewportRenderer(viewport, elements, {
      context: createContext(operations),
      getSize: () => ({ width, height: 40 }),
      getStyle: () => FIXED_STYLE,
      observeResize: (redraw) => {
        resize = redraw;
        return { disconnect: vi.fn() };
      }
    });
    const firstRow = { index: 0, segments: [{ type: 'text' as const, x: 0, text: 'Wrapped' }] };
    const lastRow = { index: 25, segments: [{ type: 'text' as const, x: 20, text: 'End' }] };
    renderer.render({ rows: [firstRow, lastRow] });
    const range = container.querySelector<HTMLInputElement>('input[type="range"]')!;
    expect(range.max).toBe('64');
    range.value = range.max;
    range.dispatchEvent(new Event('input'));
    expect(operations.filter(({ kind }) => kind === 'fill-text').at(-1)?.args).toEqual([
      'End',
      59,
      450
    ]);

    width = 110;
    resize?.();
    expect(elements.canvas.width).toBe(110);
    expect(range.valueAsNumber).toBe(34);
    renderer.render({
      rows: [firstRow, { ...lastRow, segments: [{ type: 'text', x: 16, text: 'End' }] }]
    });
    expect(range.valueAsNumber).toBe(10);
    renderer.render({ rows: [firstRow] });
    expect(range.valueAsNumber).toBe(0);
    expect(range.closest('label')?.hidden).toBe(true);
    renderer.dispose();
  });
});
