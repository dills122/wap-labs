import { invoke } from '@tauri-apps/api/core';
import './styles.css';

type EngineKey = 'up' | 'down' | 'enter';
type HostNavigationStatus = 'idle' | 'loading' | 'loaded' | 'error';

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

interface HostSessionState {
  navigationStatus: HostNavigationStatus;
  requestedUrl: string;
  finalUrl?: string;
  contentType?: string;
  activeCardId?: string;
  focusedLinkIndex?: number;
  externalNavigationIntent?: string;
  lastError?: string;
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

const MAX_EXTERNAL_INTENT_HOPS = 3;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('missing #app root');
}

app.innerHTML = `
  <h1>Waves Native Engine Harness</h1>
  <div class="layout">
    <section class="panel">
      <h2>Navigation</h2>
      <label>
        Transport URL
        <input id="fetch-url" type="text" value="http://127.0.0.1:3000/" />
      </label>
      <div class="row">
        <label>
          Viewport Cols
          <input id="viewport-cols" type="number" value="20" min="1" />
        </label>
      </div>
      <div class="actions">
        <button id="btn-health">Health</button>
        <button id="btn-fetch-url">Go</button>
        <button id="btn-render">Render</button>
        <button id="btn-up">Key Up</button>
        <button id="btn-down">Key Down</button>
        <button id="btn-enter">Key Enter</button>
        <button id="btn-back">Navigate Back</button>
        <button id="btn-snapshot">Snapshot</button>
        <button id="btn-clear-intent">Clear External Intent</button>
      </div>
      <details id="debug-raw-mode" style="margin-top: 12px;">
        <summary>Debug: Raw WML paste mode</summary>
        <div style="margin-top: 8px;">
          <label>
            Base URL
            <input id="base-url" type="text" value="http://local.test/start.wml" />
          </label>
          <textarea id="wml-input"></textarea>
          <div class="actions">
            <button id="btn-load-context">Load Raw WML (Debug)</button>
          </div>
        </div>
      </details>
      <div id="status" class="status"></div>
    </section>
    <section class="panel">
      <h2>Viewport</h2>
      <div id="viewport" class="viewport"></div>
      <h2 style="margin-top: 14px;">Session State</h2>
      <pre id="session-state"></pre>
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
const sessionStateEl = document.querySelector<HTMLPreElement>('#session-state');

if (
  !wmlInput ||
  !baseUrlInput ||
  !viewportColsInput ||
  !viewportEl ||
  !snapshotEl ||
  !statusEl ||
  !fetchUrlInput ||
  !transportResponseEl ||
  !sessionStateEl
) {
  throw new Error('missing expected UI element');
}

wmlInput.value = SAMPLE_WML;

let hostSessionState: HostSessionState = {
  navigationStatus: 'idle',
  requestedUrl: fetchUrlInput.value
};

const setStatus = (message: string): void => {
  statusEl.textContent = message;
};

const setSnapshot = (snapshot: EngineRuntimeSnapshot): void => {
  snapshotEl.textContent = JSON.stringify(snapshot, null, 2);
};

const setTransportResponse = (response: FetchDeckResponse | null): void => {
  transportResponseEl.textContent = response ? JSON.stringify(response, null, 2) : '';
};

const setSessionState = (next: HostSessionState): void => {
  hostSessionState = next;
  sessionStateEl.textContent = JSON.stringify(hostSessionState, null, 2);
};

const mergeSessionState = (patch: Partial<HostSessionState>): void => {
  setSessionState({ ...hostSessionState, ...patch });
};

const syncSessionFromSnapshot = (snapshot: EngineRuntimeSnapshot): void => {
  mergeSessionState({
    activeCardId: snapshot.activeCardId,
    focusedLinkIndex: snapshot.focusedLinkIndex,
    externalNavigationIntent: snapshot.externalNavigationIntent
  });
};

setSessionState(hostSessionState);

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

const renderAndSnapshot = async (): Promise<EngineRuntimeSnapshot> => {
  const snapshot = await invoke<EngineRuntimeSnapshot>('engine_snapshot');
  const renderList = await invoke<RenderList>('engine_render');
  setSnapshot(snapshot);
  drawRenderList(renderList);
  syncSessionFromSnapshot(snapshot);
  return snapshot;
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

const withAction =
  (action: (event?: Event) => Promise<void>) =>
  async (event?: Event): Promise<void> => {
    try {
      await action(event);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      mergeSessionState({ navigationStatus: 'error', lastError: message });
      setStatus(`Error: ${message}`);
    }
  };

const loadTransportUrl = async (
  url: string,
  source: 'user' | 'external-intent',
  followExternalIntent: boolean
): Promise<EngineRuntimeSnapshot | null> => {
  const requestedUrl = url.trim();
  if (!requestedUrl) {
    throw new Error('URL is required');
  }

  await setViewportCols();
  mergeSessionState({
    navigationStatus: 'loading',
    requestedUrl,
    lastError: undefined
  });
  setStatus(source === 'user' ? `Loading ${requestedUrl}...` : `Following external intent: ${requestedUrl}`);

  const transport = await invoke<FetchDeckResponse>('fetch_deck', {
    request: {
      url: requestedUrl,
      method: 'GET',
      timeoutMs: 5000,
      retries: 1
    }
  });
  setTransportResponse(transport);

  if (!transport.ok) {
    const errorMessage = transport.error?.message ?? 'unknown transport failure';
    mergeSessionState({
      navigationStatus: 'error',
      finalUrl: transport.finalUrl,
      contentType: transport.contentType,
      lastError: errorMessage
    });
    setStatus(`Fetch failed: ${errorMessage}`);
    return null;
  }

  const deckInput = transport.engineDeckInput ?? {
    wmlXml: transport.wml ?? '',
    baseUrl: transport.finalUrl,
    contentType: transport.contentType,
    rawBytesBase64: undefined
  };
  if (!deckInput.wmlXml) {
    mergeSessionState({
      navigationStatus: 'error',
      finalUrl: transport.finalUrl,
      contentType: transport.contentType,
      lastError: 'Fetch succeeded but returned no WML payload.'
    });
    setStatus('Fetch succeeded but returned no WML payload.');
    return null;
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

  mergeSessionState({
    navigationStatus: 'loaded',
    finalUrl: transport.finalUrl,
    contentType: transport.contentType,
    activeCardId: snapshot.activeCardId,
    focusedLinkIndex: snapshot.focusedLinkIndex,
    externalNavigationIntent: snapshot.externalNavigationIntent,
    lastError: undefined
  });
  setStatus(`Fetched and loaded deck from ${transport.finalUrl}`);

  if (followExternalIntent && snapshot.externalNavigationIntent) {
    let nextUrl = snapshot.externalNavigationIntent;
    for (let hop = 1; hop <= MAX_EXTERNAL_INTENT_HOPS; hop += 1) {
      await invoke<EngineRuntimeSnapshot>('engine_clear_external_navigation_intent');
      fetchUrlInput.value = nextUrl;
      const nextSnapshot = await loadTransportUrl(nextUrl, 'external-intent', false);
      if (!nextSnapshot || !nextSnapshot.externalNavigationIntent) {
        break;
      }
      nextUrl = nextSnapshot.externalNavigationIntent;
      if (hop === MAX_EXTERNAL_INTENT_HOPS) {
        const message = `External intent hop limit reached (${MAX_EXTERNAL_INTENT_HOPS}).`;
        mergeSessionState({ navigationStatus: 'error', lastError: message });
        setStatus(message);
      }
    }
  }

  return snapshot;
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
    mergeSessionState({
      navigationStatus: 'loaded',
      requestedUrl: baseUrlInput.value,
      finalUrl: baseUrlInput.value,
      contentType: 'text/vnd.wap.wml',
      activeCardId: snapshot.activeCardId,
      focusedLinkIndex: snapshot.focusedLinkIndex,
      externalNavigationIntent: snapshot.externalNavigationIntent,
      lastError: undefined
    });
    setStatus('Raw WML loaded and rendered (debug mode).');
  })
);

document.querySelector<HTMLButtonElement>('#btn-fetch-url')?.addEventListener(
  'click',
  withAction(async () => {
    await loadTransportUrl(fetchUrlInput.value, 'user', true);
  })
);

fetchUrlInput.addEventListener(
  'keydown',
  withAction(async (event?: Event) => {
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      event.preventDefault();
      await loadTransportUrl(fetchUrlInput.value, 'user', true);
    }
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
      syncSessionFromSnapshot(snapshot);
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
    syncSessionFromSnapshot(snapshot);
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
    syncSessionFromSnapshot(snapshot);
    setStatus('Cleared external navigation intent.');
  })
);
