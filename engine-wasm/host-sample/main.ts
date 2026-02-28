import { bootWmlEngine } from './renderer';
import { EXAMPLES } from './.generated/examples';

const LIVE_RELOAD_DEBOUNCE_MS = 250;

function mapKeyboardKey(key: string): 'up' | 'down' | 'enter' | null {
  if (key === 'ArrowUp') return 'up';
  if (key === 'ArrowDown') return 'down';
  if (key === 'Enter') return 'enter';
  return null;
}

async function main() {
  const canvas = document.querySelector<HTMLCanvasElement>('#wap-screen');
  const textarea = document.querySelector<HTMLTextAreaElement>('#deck-input');
  const reloadButton = document.querySelector<HTMLButtonElement>('#reload-deck');
  const loadExampleButton = document.querySelector<HTMLButtonElement>('#load-example');
  const exampleSelect = document.querySelector<HTMLSelectElement>('#example-select');
  const liveCheckbox = document.querySelector<HTMLInputElement>('#live-reload');
  const pressUpButton = document.querySelector<HTMLButtonElement>('#press-up');
  const pressDownButton = document.querySelector<HTMLButtonElement>('#press-down');
  const pressEnterButton = document.querySelector<HTMLButtonElement>('#press-enter');
  const status = document.querySelector<HTMLParagraphElement>('#status');
  const runtimeState = document.querySelector<HTMLPreElement>('#runtime-state');

  if (
    !canvas ||
    !textarea ||
    !reloadButton ||
    !loadExampleButton ||
    !exampleSelect ||
    !liveCheckbox ||
    !pressUpButton ||
    !pressDownButton ||
    !pressEnterButton ||
    !status ||
    !runtimeState
  ) {
    throw new Error('Host sample DOM not found');
  }

  exampleSelect.replaceChildren();
  for (const example of EXAMPLES) {
    const option = document.createElement('option');
    option.value = example.key;
    option.textContent = example.label;
    exampleSelect.appendChild(option);
  }

  if (EXAMPLES.length === 0) {
    throw new Error('No examples available. Run: pnpm run examples:generate');
  }

  const exampleMap = new Map(EXAMPLES.map((item) => [item.key, item.wml]));
  const defaultExample = EXAMPLES[0];
  exampleSelect.value = defaultExample.key;
  textarea.value = defaultExample.wml;
  const host = await bootWmlEngine(canvas, textarea.value);
  status.textContent = `Loaded example: ${defaultExample.key}`;

  const updateRuntimeState = () => {
    const snapshot = host.snapshot();
    runtimeState.textContent = [
      `activeCardId: ${snapshot.activeCardId}`,
      `focusedLinkIndex: ${snapshot.focusedLinkIndex}`,
      `baseUrl: ${snapshot.baseUrl}`,
      `contentType: ${snapshot.contentType}`
    ].join('\n');
  };

  const reloadFromEditor = (prefix: string) => {
    try {
      host.loadDeck(textarea.value);
      const snapshot = host.snapshot();
      status.textContent = `${prefix} Active card: ${snapshot.activeCardId}`;
      updateRuntimeState();
    } catch (error) {
      status.textContent = `Load error: ${String(error)}`;
      updateRuntimeState();
    }
  };

  const pressKey = (key: 'up' | 'down' | 'enter') => {
    try {
      host.pressKey(key);
      const snapshot = host.snapshot();
      status.textContent = `Key "${key}" applied. Active card: ${snapshot.activeCardId}`;
      updateRuntimeState();
    } catch (error) {
      status.textContent = `Key error (${key}): ${String(error)}`;
      updateRuntimeState();
    }
  };

  let liveTimer: ReturnType<typeof setTimeout> | null = null;
  const queueLiveReload = () => {
    if (!liveCheckbox.checked) {
      return;
    }
    if (liveTimer) {
      clearTimeout(liveTimer);
    }
    liveTimer = setTimeout(() => {
      reloadFromEditor('Live reload complete.');
      liveTimer = null;
    }, LIVE_RELOAD_DEBOUNCE_MS);
  };

  loadExampleButton.addEventListener('click', () => {
    const key = exampleSelect.value;
    const example = exampleMap.get(key);
    if (!example) {
      return;
    }
    textarea.value = example;
    reloadFromEditor(`Loaded example: ${key}.`);
  });

  reloadButton.addEventListener('click', () => {
    reloadFromEditor('Deck reloaded.');
  });

  textarea.addEventListener('input', queueLiveReload);

  pressUpButton.addEventListener('click', () => pressKey('up'));
  pressDownButton.addEventListener('click', () => pressKey('down'));
  pressEnterButton.addEventListener('click', () => pressKey('enter'));

  window.addEventListener('keydown', (event) => {
    const key = mapKeyboardKey(event.key);
    if (!key) {
      return;
    }
    event.preventDefault();
    pressKey(key);
  });

  updateRuntimeState();
}

main().catch((error) => {
  const status = document.querySelector<HTMLParagraphElement>('#status');
  if (status) {
    status.textContent = `Boot error: ${String(error)}`;
  }
});
