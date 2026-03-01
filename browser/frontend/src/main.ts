import { invoke } from '@tauri-apps/api/core';
import './styles.css';

type EngineKey = 'up' | 'down' | 'enter';

interface DrawText {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

interface DrawLink {
  type: 'link';
  x: number;
  y: number;
  text: string;
  focused: boolean;
  href: string;
}

type DrawCmd = DrawText | DrawLink;

interface RenderList {
  draw: DrawCmd[];
}

interface EngineRuntimeSnapshot {
  activeCardId?: string;
  focusedLinkIndex: number;
  baseUrl: string;
  contentType: string;
  externalNavigationIntent?: string;
  lastScriptExecutionOk?: boolean;
  lastScriptExecutionTrap?: string;
  lastScriptRequiresRefresh?: boolean;
}

interface FetchErrorInfo {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface FetchTiming {
  encode: number;
  udpRtt: number;
  decode: number;
}

interface EngineDeckInput {
  wmlXml: string;
  baseUrl: string;
  contentType: string;
  rawBytesBase64?: string;
}

interface FetchDeckResponse {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType: string;
  wml?: string;
  error?: FetchErrorInfo;
  timingMs: FetchTiming;
  engineDeckInput?: EngineDeckInput;
}

const SAMPLE_WML = `<wml>
  <card id="home">
    <p>WaveNav native engine harness</p>
    <a href="#next">Go to next card</a>
    <a href="https://example.org/">External link</a>
  </card>
  <card id="next">
    <p>You are on the next card.</p>
    <a href="#home">Go home</a>
  </card>
</wml>`;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('missing #app root');
}

app.innerHTML = `
  <h1>Waves Native Engine Harness</h1>
  <div class="layout">
    <section class="panel">
      <h2>Deck Input</h2>
      <textarea id="wml-input"></textarea>
      <div class="row">
        <label>
          Base URL
          <input id="base-url" type="text" value="http://local.test/start.wml" />
        </label>
        <label>
          Viewport Cols
          <input id="viewport-cols" type="number" value="20" min="1" />
        </label>
      </div>
      <div class="actions">
        <button id="btn-health">Health</button>
        <button id="btn-fetch-url">Fetch URL</button>
        <button id="btn-load-context">Load Deck Context</button>
        <button id="btn-render">Render</button>
        <button id="btn-up">Key Up</button>
        <button id="btn-down">Key Down</button>
        <button id="btn-enter">Key Enter</button>
        <button id="btn-back">Navigate Back</button>
        <button id="btn-snapshot">Snapshot</button>
        <button id="btn-clear-intent">Clear External Intent</button>
      </div>
      <div id="status" class="status"></div>
    </section>
    <section class="panel">
      <h2>Viewport</h2>
      <div id="viewport" class="viewport"></div>
      <h2 style="margin-top: 14px;">Transport URL</h2>
      <input id="fetch-url" type="text" value="http://127.0.0.1:3000/" />
      <h2 style="margin-top: 14px;">Transport Response</h2>
      <pre id="transport-response"></pre>
      <h2 style="margin-top: 14px;">Runtime Snapshot</h2>
      <pre id="snapshot"></pre>
    </section>
  </div>
`;

const wmlInput = document.querySelector<HTMLTextAreaElement>('#wml-input');
const baseUrlInput = document.querySelector<HTMLInputElement>('#base-url');
const viewportColsInput = document.querySelector<HTMLInputElement>('#viewport-cols');
const viewportEl = document.querySelector<HTMLDivElement>('#viewport');
const snapshotEl = document.querySelector<HTMLPreElement>('#snapshot');
const statusEl = document.querySelector<HTMLDivElement>('#status');
const fetchUrlInput = document.querySelector<HTMLInputElement>('#fetch-url');
const transportResponseEl = document.querySelector<HTMLPreElement>('#transport-response');

if (
  !wmlInput ||
  !baseUrlInput ||
  !viewportColsInput ||
  !viewportEl ||
  !snapshotEl ||
  !statusEl ||
  !fetchUrlInput ||
  !transportResponseEl
) {
  throw new Error('missing expected UI element');
}

wmlInput.value = SAMPLE_WML;

const setStatus = (message: string): void => {
  statusEl.textContent = message;
};

const setSnapshot = (snapshot: EngineRuntimeSnapshot): void => {
  snapshotEl.textContent = JSON.stringify(snapshot, null, 2);
};

const setTransportResponse = (response: FetchDeckResponse | null): void => {
  transportResponseEl.textContent = response ? JSON.stringify(response, null, 2) : '';
};

const drawRenderList = (renderList: RenderList): void => {
  const byLine = new Map<number, string[]>();
  for (const cmd of renderList.draw) {
    const current = byLine.get(cmd.y) ?? [];
    if (cmd.type === 'text') {
      current.push(cmd.text);
    } else {
      current.push(cmd.focused ? `[${cmd.text}]` : cmd.text);
    }
    byLine.set(cmd.y, current);
  }

  const lines = Array.from(byLine.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, chunks]) => chunks.join(' '));

  viewportEl.innerHTML = lines.map((line) => `<div class="line">${escapeHtml(line)}</div>`).join('');
};

const escapeHtml = (input: string): string =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderAndSnapshot = async (): Promise<void> => {
  const snapshot = await invoke<EngineRuntimeSnapshot>('engine_snapshot');
  const renderList = await invoke<RenderList>('engine_render');
  setSnapshot(snapshot);
  drawRenderList(renderList);
};

const setViewportCols = async (): Promise<void> => {
  const cols = Number(viewportColsInput.value);
  if (!Number.isFinite(cols) || cols < 1) {
    throw new Error('viewport cols must be a positive number');
  }
  await invoke<EngineRuntimeSnapshot>('engine_set_viewport_cols', {
    request: { cols }
  });
};

const withAction = (action: () => Promise<void>) => async (): Promise<void> => {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Error: ${message}`);
  }
};

document.querySelector<HTMLButtonElement>('#btn-health')?.addEventListener(
  'click',
  withAction(async () => {
    const message = await invoke<string>('health');
    setStatus(`Health: ${message}`);
  })
);

document.querySelector<HTMLButtonElement>('#btn-load-context')?.addEventListener(
  'click',
  withAction(async () => {
    await setViewportCols();
    const snapshot = await invoke<EngineRuntimeSnapshot>('engine_load_deck_context', {
      request: {
        wmlXml: wmlInput.value,
        baseUrl: baseUrlInput.value,
        contentType: 'text/vnd.wap.wml',
        rawBytesBase64: null
      }
    });
    setSnapshot(snapshot);
    const renderList = await invoke<RenderList>('engine_render');
    drawRenderList(renderList);
    setStatus('Deck loaded and rendered.');
  })
);

document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.addEventListener(
  'click',
  withAction(async () => {
    await setViewportCols();
    const transport = await invoke<FetchDeckResponse>('fetch_deck', {
      request: {
        url: fetchUrlInput.value,
        method: 'GET',
        timeoutMs: 5000,
        retries: 1
      }
    });
    setTransportResponse(transport);

    if (!transport.ok) {
      const errorMessage = transport.error?.message ?? 'unknown transport failure';
      setStatus(`Fetch failed: ${errorMessage}`);
      return;
    }

    const deckInput = transport.engineDeckInput ?? {
      wmlXml: transport.wml ?? '',
      baseUrl: transport.finalUrl,
      contentType: transport.contentType,
      rawBytesBase64: undefined
    };
    if (!deckInput.wmlXml) {
      setStatus('Fetch succeeded but returned no WML payload.');
      return;
    }

    const snapshot = await invoke<EngineRuntimeSnapshot>('engine_load_deck_context', {
      request: {
        wmlXml: deckInput.wmlXml,
        baseUrl: deckInput.baseUrl,
        contentType: deckInput.contentType,
        rawBytesBase64: deckInput.rawBytesBase64 ?? null
      }
    });
    setSnapshot(snapshot);
    const renderList = await invoke<RenderList>('engine_render');
    drawRenderList(renderList);
    setStatus(`Fetched and loaded deck from ${transport.finalUrl}`);
  })
);

document.querySelector<HTMLButtonElement>('#btn-render')?.addEventListener(
  'click',
  withAction(async () => {
    await renderAndSnapshot();
    setStatus('Rendered current card.');
  })
);

const bindKeyButton = (id: string, key: EngineKey): void => {
  document.querySelector<HTMLButtonElement>(id)?.addEventListener(
    'click',
    withAction(async () => {
      const snapshot = await invoke<EngineRuntimeSnapshot>('engine_handle_key', {
        request: { key }
      });
      setSnapshot(snapshot);
      const renderList = await invoke<RenderList>('engine_render');
      drawRenderList(renderList);
      setStatus(`Handled key: ${key}`);
    })
  );
};

bindKeyButton('#btn-up', 'up');
bindKeyButton('#btn-down', 'down');
bindKeyButton('#btn-enter', 'enter');

document.querySelector<HTMLButtonElement>('#btn-back')?.addEventListener(
  'click',
  withAction(async () => {
    const snapshot = await invoke<EngineRuntimeSnapshot>('engine_navigate_back');
    setSnapshot(snapshot);
    const renderList = await invoke<RenderList>('engine_render');
    drawRenderList(renderList);
    setStatus('navigateBack invoked.');
  })
);

document.querySelector<HTMLButtonElement>('#btn-snapshot')?.addEventListener(
  'click',
  withAction(async () => {
    await renderAndSnapshot();
    setStatus('Snapshot refreshed.');
  })
);

document.querySelector<HTMLButtonElement>('#btn-clear-intent')?.addEventListener(
  'click',
  withAction(async () => {
    const snapshot = await invoke<EngineRuntimeSnapshot>('engine_clear_external_navigation_intent');
    setSnapshot(snapshot);
    setStatus('Cleared external navigation intent.');
  })
);
