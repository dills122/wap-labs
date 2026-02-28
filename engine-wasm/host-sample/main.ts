import { bootWmlEngine } from './renderer';

const EXAMPLES: Record<string, string> = {
  basic: `<wml>
  <card id="home">
    <p>WaveNav Host Harness</p>
    <p>Use ArrowUp / ArrowDown / Enter.</p>
    <a href="#next">Go to next card</a>
    <br/>
    <a href="http://example.com/other.wml">External link (MVP no-op)</a>
  </card>
  <card id="next">
    <p>Second card loaded.</p>
    <a href="#home">Return home</a>
  </card>
</wml>`,
  missingFragment: `<wml>
  <card id="home">
    <p>Missing fragment test</p>
    <a href="#missing">Broken target</a>
  </card>
</wml>`,
  parserRobust: `<wml>
  <cardinal id="noise">Ignore me</cardinal>
  <card id="home">
    <p>Hello <a href="#next">Next</a></p>
  </card>
  <card id="next">
    <p>Still works.</p>
    <a href="#home">Back</a>
  </card>
</wml>`,
  wrapStress: `<wml>
  <card id="home">
    <p>supercalifragilisticpseudopneumonoultramicroscopicsilicovolcanoconiosis</p>
    <a href="#next">Continue</a>
  </card>
  <card id="next">
    <p>Wrap test complete.</p>
    <a href="#home">Back</a>
  </card>
</wml>`
};

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

  textarea.value = EXAMPLES.basic;
  const host = await bootWmlEngine(canvas, textarea.value);
  status.textContent = 'Loaded example: basic';

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
    const example = EXAMPLES[key];
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
