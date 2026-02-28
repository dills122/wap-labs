import init, { WmlEngine } from '../pkg/wavenav_engine.js';
import type { DrawCmd } from '../contracts/wml-engine';

const lineHeight = 16;
const charWidth = 8;
const DEFAULT_BASE_URL = 'http://local.test/deck.wml';
const DEFAULT_CONTENT_TYPE = 'text/vnd.wap.wml';
type KeyName = 'up' | 'down' | 'enter';

export interface EngineSnapshot {
  activeCardId: string;
  focusedLinkIndex: number;
  baseUrl: string;
  contentType: string;
}

export interface EngineHost {
  loadDeck(xml: string): void;
  pressKey(key: KeyName): void;
  snapshot(): EngineSnapshot;
  render(): void;
  getEngine(): WmlEngine;
}

export async function bootWmlEngine(canvas: HTMLCanvasElement, xml: string): Promise<EngineHost> {
  await init();

  const engine = new WmlEngine();
  engine.setViewportCols(20);
  engine.loadDeckContext(xml, DEFAULT_BASE_URL, DEFAULT_CONTENT_TYPE);

  function paint() {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'top';

    const renderList = engine.render() as { draw: DrawCmd[] };

    for (const cmd of renderList.draw) {
      const x = cmd.x * charWidth;
      const y = cmd.y * lineHeight;

      if (cmd.type === 'text') {
        ctx.fillStyle = '#111';
        ctx.fillText(cmd.text, x, y);
        continue;
      }

      if (cmd.type === 'link') {
        if (cmd.focused) {
          ctx.fillStyle = '#c8ddff';
          ctx.fillRect(0, y - 1, canvas.width, lineHeight + 2);
        }

        ctx.fillStyle = cmd.focused ? '#10274d' : '#0b3d91';
        ctx.fillText(cmd.text, x, y);
      }
    }
  }

  paint();

  return {
    loadDeck(nextXml: string) {
      engine.loadDeckContext(nextXml, DEFAULT_BASE_URL, DEFAULT_CONTENT_TYPE);
      paint();
    },
    pressKey(key: KeyName) {
      engine.handleKey(key);
      paint();
    },
    snapshot() {
      return {
        activeCardId: engine.activeCardId(),
        focusedLinkIndex: engine.focusedLinkIndex(),
        baseUrl: engine.baseUrl(),
        contentType: engine.contentType()
      };
    },
    render: paint,
    getEngine() {
      return engine;
    }
  };
}
