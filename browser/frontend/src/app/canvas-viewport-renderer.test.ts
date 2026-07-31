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
  args: readonly (number | string)[];
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
            { type: 'focusable', text: 'Go', focused: true },
            { type: 'text', text: ' now' }
          ]
        },
        { index: 2, segments: [{ type: 'text', text: 'tail' }] }
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
        { index: 2, segments: [{ type: 'text', text: 'Last' }] },
        {
          index: 1,
          segments: [
            { type: 'focusable', text: 'Go', focused: true },
            { type: 'text', text: ' ' },
            { type: 'focusable', text: 'Next', focused: false }
          ]
        }
      ]
    });

    expect(elements.canvas.width).toBe(200);
    expect(elements.canvas.height).toBe(120);
    expect(elements.canvas.style.height).toBe('60px');
    expect(elements.accessibleText.textContent).toBe('Go NextLast');
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

  it('converts CSS-scaled device pixels into deterministic engine columns and rows', () => {
    const geometry = {
      bounds: { left: 10, top: 20, width: 160, height: 100 },
      backingWidth: 640,
      backingHeight: 400,
      pixelRatio: 2,
      columnWidth: 8,
      lineHeight: 16,
      inlinePadding: 4
    };

    expect(mapCanvasPointerToEngineCoordinates(30, 29, geometry)).toEqual({ x: 4, y: 1 });
    expect(mapCanvasPointerToEngineCoordinates(11, 29, geometry)).toEqual(null);
    expect(mapCanvasPointerToEngineCoordinates(170, 29, geometry)).toEqual(null);
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

    renderer.render({ rows: [{ index: 0, segments: [{ type: 'text', text: 'Ready' }] }] });
    const drawCount = operations.filter(({ kind }) => kind === 'fill-text').length;

    redraw?.();
    expect(operations.filter(({ kind }) => kind === 'fill-text')).toHaveLength(drawCount + 1);

    renderer.dispose();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
