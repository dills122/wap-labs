import init, { WmlEngine } from '../pkg/wml_engine.js';
import type { DrawCmd } from '../contracts/wml-engine';

const lineHeight = 16;
const charWidth = 8;

export interface EngineHost {
  loadDeck(xml: string): void;
  render(): void;
  getEngine(): WmlEngine;
}

export async function bootWmlEngine(canvas: HTMLCanvasElement, xml: string): Promise<EngineHost> {
  await init();

  const engine = new WmlEngine();
  engine.setViewportCols(20);
  engine.loadDeck(xml);

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

  function mapKey(event: KeyboardEvent): 'up' | 'down' | 'enter' | null {
    if (event.key === 'ArrowUp') return 'up';
    if (event.key === 'ArrowDown') return 'down';
    if (event.key === 'Enter') return 'enter';
    return null;
  }

  window.addEventListener('keydown', (event) => {
    const key = mapKey(event);
    if (!key) {
      return;
    }

    event.preventDefault();
    engine.handleKey(key);
    paint();
  });

  paint();

  return {
    loadDeck(nextXml: string) {
      engine.loadDeck(nextXml);
      paint();
    },
    render: paint,
    getEngine() {
      return engine;
    }
  };
}
