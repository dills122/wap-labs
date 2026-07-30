import type { RenderList } from '../../../contracts/engine';

export interface CanvasViewportSegment {
  type: 'text' | 'focusable';
  text: string;
  focused?: boolean;
}

export interface CanvasViewportRow {
  index: number;
  segments: readonly CanvasViewportSegment[];
}

// This is deliberately a structural subset of EnginePresentationFrame. F1-03
// can pass presentation frames directly once the controller owns that input;
// until then the presenter adapts the legacy RenderList through the helper
// below.
export interface CanvasViewportFrame {
  rows: readonly CanvasViewportRow[];
}

export interface CanvasViewportElements {
  canvas: HTMLCanvasElement;
  accessibleText: HTMLSpanElement;
}

export interface CanvasViewportStyle {
  font: string;
  fontSize: number;
  lineHeight: number;
  inlinePadding: number;
  underlineOffset: number;
  underlineThickness: number;
  textColor: string;
  linkColor: string;
  focusForeground: string;
  focusBackground: string;
}

export interface CanvasViewportContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  font: string;
  textBaseline: CanvasTextBaseline;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): Pick<TextMetrics, 'width'>;
}

interface ResizeSubscription {
  disconnect(): void;
}

export interface CanvasViewportRendererOptions {
  context?: CanvasViewportContext | null;
  getPixelRatio?: () => number;
  getSize?: () => { width: number; height: number };
  getStyle?: () => CanvasViewportStyle;
  observeResize?: (redraw: () => void) => ResizeSubscription;
}

const CANVAS_CLASS = 'viewport-canvas';
const ACCESSIBLE_TEXT_CLASS = 'viewport-accessible-text';

export const ensureCanvasViewportElements = (viewport: HTMLElement): CanvasViewportElements => {
  let canvas = viewport.querySelector<HTMLCanvasElement>(`.${CANVAS_CLASS}`);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = CANVAS_CLASS;
    canvas.setAttribute('aria-hidden', 'true');
    viewport.prepend(canvas);
  }

  let accessibleText = viewport.querySelector<HTMLSpanElement>(`.${ACCESSIBLE_TEXT_CLASS}`);
  if (!accessibleText) {
    accessibleText = document.createElement('span');
    accessibleText.className = `visually-hidden ${ACCESSIBLE_TEXT_CLASS}`;
    accessibleText.setAttribute('data-canvas-text-fallback', '');
    viewport.append(accessibleText);
  }

  return { canvas, accessibleText };
};

export const canvasFrameFromRenderList = (renderList: RenderList): CanvasViewportFrame => {
  const rows = new Map<number, CanvasViewportSegment[]>();
  for (const command of renderList.draw) {
    const segments = rows.get(command.y) ?? [];
    segments.push(
      command.type === 'link'
        ? { type: 'focusable', text: command.text, focused: command.focused }
        : { type: 'text', text: command.text }
    );
    rows.set(command.y, segments);
  }

  return {
    rows: Array.from(rows, ([index, segments]) => ({ index, segments })).sort(
      (left, right) => left.index - right.index
    )
  };
};

export class CanvasViewportRenderer {
  private readonly context: CanvasViewportContext | null;
  private readonly getPixelRatio: () => number;
  private readonly getSize: () => { width: number; height: number };
  private readonly getStyle: () => CanvasViewportStyle;
  private readonly resizeSubscription: ResizeSubscription | undefined;
  private lastFrame: CanvasViewportFrame | null = null;

  constructor(
    private readonly viewport: HTMLElement,
    private readonly elements: CanvasViewportElements,
    options: CanvasViewportRendererOptions = {}
  ) {
    this.context =
      options.context === undefined ? getCanvasContext(elements.canvas) : options.context;
    this.getPixelRatio = options.getPixelRatio ?? (() => window.devicePixelRatio || 1);
    this.getSize = options.getSize ?? (() => measureViewport(viewport));
    this.getStyle = options.getStyle ?? (() => readViewportStyle(viewport));
    const observeResize = options.observeResize ?? defaultResizeObserver(viewport);
    this.resizeSubscription = observeResize?.(() => {
      if (this.lastFrame) {
        this.render(this.lastFrame);
      }
    });
  }

  render(frame: CanvasViewportFrame): void {
    const rows = [...frame.rows].sort((left, right) => left.index - right.index);
    this.lastFrame = { rows };
    this.elements.accessibleText.textContent = rows
      .map((row) => row.segments.map((segment) => segment.text).join(''))
      .join('');

    const context = this.context;
    if (!context) {
      return;
    }

    const style = this.getStyle();
    const contentHeight = rows.length * style.lineHeight;
    // Release the previous measured height before reading the viewport. This
    // lets a handset-scale decrease shrink the surface instead of allowing
    // the old inline canvas height to keep its parent artificially tall.
    this.elements.canvas.style.height = `${contentHeight}px`;
    const measuredSize = this.getSize();
    const cssWidth = positiveDimension(measuredSize.width, 320);
    const cssHeight = Math.max(positiveDimension(measuredSize.height, 400), contentHeight);
    const pixelRatio = positiveDimension(this.getPixelRatio(), 1);
    const backingWidth = Math.max(1, Math.round(cssWidth * pixelRatio));
    const backingHeight = Math.max(1, Math.round(cssHeight * pixelRatio));

    if (this.elements.canvas.width !== backingWidth) {
      this.elements.canvas.width = backingWidth;
    }
    if (this.elements.canvas.height !== backingHeight) {
      this.elements.canvas.height = backingHeight;
    }
    this.elements.canvas.style.height = `${cssHeight}px`;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, backingWidth, backingHeight);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.font = style.font;
    context.textBaseline = 'top';

    rows.forEach((row, rowIndex) => {
      let cursorX = style.inlinePadding;
      const rowY = rowIndex * style.lineHeight;
      for (const segment of row.segments) {
        const textWidth = context.measureText(segment.text).width;
        if (segment.type === 'focusable' && segment.focused) {
          context.fillStyle = style.focusBackground;
          context.fillRect(cursorX, rowY, textWidth, style.lineHeight);
          context.fillStyle = style.focusForeground;
        } else {
          context.fillStyle = segment.type === 'focusable' ? style.linkColor : style.textColor;
        }
        context.fillText(segment.text, cursorX, rowY);
        if (segment.type === 'focusable' && !segment.focused) {
          context.fillRect(
            cursorX,
            rowY + style.fontSize + style.underlineOffset,
            textWidth,
            style.underlineThickness
          );
        }
        cursorX += textWidth;
      }
    });
  }

  dispose(): void {
    this.resizeSubscription?.disconnect();
  }
}

const getCanvasContext = (canvas: HTMLCanvasElement): CanvasViewportContext | null => {
  // jsdom deliberately has no Canvas implementation. Avoid calling its
  // not-implemented getContext stub; deterministic unit tests inject a fake.
  if (typeof CanvasRenderingContext2D === 'undefined') {
    return null;
  }
  return canvas.getContext('2d');
};

const positiveDimension = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const measureViewport = (viewport: HTMLElement): { width: number; height: number } => {
  const bounds = viewport.getBoundingClientRect();
  return {
    width: viewport.clientWidth || bounds.width,
    height: viewport.clientHeight || bounds.height
  };
};

const defaultResizeObserver = (
  viewport: HTMLElement
): CanvasViewportRendererOptions['observeResize'] | undefined => {
  if (typeof ResizeObserver === 'undefined') {
    return undefined;
  }
  return (redraw) => {
    const observer = new ResizeObserver(redraw);
    observer.observe(viewport);
    return observer;
  };
};

const readViewportStyle = (viewport: HTMLElement): CanvasViewportStyle => {
  const computed = getComputedStyle(viewport);
  const rootComputed = getComputedStyle(document.documentElement);
  const fontSize = Number.parseFloat(computed.fontSize) || 14;
  const scale =
    Number.parseFloat(rootComputed.getPropertyValue('--handset-scale')) || fontSize / 14;
  const computedLineHeight = Number.parseFloat(computed.lineHeight);

  return {
    font: computed.font || `${fontSize}px ${computed.fontFamily || "'Courier New', monospace"}`,
    fontSize,
    lineHeight: computedLineHeight || fontSize * 1.25,
    inlinePadding: 3 * scale,
    underlineOffset: 1 * scale,
    underlineThickness: Math.max(1, scale),
    textColor: computed.color || '#415148',
    linkColor: resolveCssVariable(computed, '--color-lcd-link', '#2252a3'),
    focusForeground: resolveCssVariable(computed, '--lcd-focus-fg', '#e6e8a3'),
    focusBackground: resolveCssVariable(computed, '--lcd-focus-bg', '#415148')
  };
};

const resolveCssVariable = (
  computed: CSSStyleDeclaration,
  property: string,
  fallback: string
): string => {
  let value = computed.getPropertyValue(property).trim();
  const visited = new Set<string>();
  while (value.startsWith('var(')) {
    const match = value.match(/^var\(\s*(--[^,\s)]+)(?:\s*,\s*([^)]*))?\s*\)$/);
    if (!match) {
      return fallback;
    }
    const nextProperty = match[1];
    if (!nextProperty || visited.has(nextProperty)) {
      return fallback;
    }
    visited.add(nextProperty);
    value = computed.getPropertyValue(nextProperty).trim() || match[2]?.trim() || '';
  }
  return value || fallback;
};
