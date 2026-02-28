import init, { WmlEngine } from '../pkg/wml_engine';
import type { DrawCmd } from '../contracts/wml-engine';

const lineHeight = 16;

export async function bootWmlEngine(canvas: HTMLCanvasElement, xml: string) {
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
    const renderList = engine.render() as { draw: DrawCmd[] };

    for (const cmd of renderList.draw) {
      if (cmd.type === 'text') {
        ctx.fillStyle = '#111';
        ctx.fillText(cmd.text, cmd.x, (cmd.y + 1) * lineHeight);
        continue;
      }

      if (cmd.type === 'link') {
        ctx.fillStyle = cmd.focused ? '#ffffff' : '#0b3d91';
        if (cmd.focused) {
          ctx.fillRect(0, cmd.y * lineHeight + 2, canvas.width, lineHeight);
          ctx.fillStyle = '#000000';
        }
        ctx.fillText(cmd.text, cmd.x, (cmd.y + 1) * lineHeight);
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

    engine.handleKey(key);
    paint();
  });

  paint();
  return engine;
}
