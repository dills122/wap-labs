import { invoke } from '@tauri-apps/api/core';
import type { FetchResponse as FetchDeckResponse, HostSessionState } from '../../contracts/transport';
import './styles.css';
import {
  canHistoryBack,
  commitHistoryBack,
  createHostHistoryState,
  peekHistoryBack,
  pushHostHistoryEntry,
  updateCurrentHistoryCard
} from './session-history';

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
  lastScriptExecutionErrorClass?: 'none' | 'non-fatal' | 'fatal';
  lastScriptRequiresRefresh?: boolean;
  lastScriptDialogRequests?: Array<
    | { type: 'alert'; message: string }
    | { type: 'confirm'; message: string }
    | { type: 'prompt'; message: string; defaultValue?: string }
  >;
  lastScriptTimerRequests?: Array<
    | { type: 'schedule'; delayMs: number; token?: string }
    | { type: 'cancel'; token: string }
  >;
}

interface TimelineEntry {
  seq: number;
  action: string;
  phase: 'start' | 'ok' | 'error' | 'state';
  session: HostSessionState;
  details?: Record<string, unknown>;
}

type NavSource = 'user' | 'external-intent' | 'history-back';

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
const MAX_TIMELINE_EVENTS = 200;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('missing #app root');
}

app.innerHTML = `
  <div class="browser-shell">
    <header class="browser-chrome">
      <div class="title-row">
        <div class="brand">WaveNav</div>
        <div class="caption">WAP Browser Preview</div>
      </div>
      <div class="nav-row">
        <button id="btn-back" class="chrome-btn">Back</button>
        <button id="btn-reload" class="chrome-btn">Reload</button>
        <input id="fetch-url" type="text" value="http://127.0.0.1:3000/" aria-label="Address" />
        <button id="btn-fetch-url" class="chrome-btn primary">Go</button>
      </div>
    </header>

    <main class="browser-main">
      <section class="device-frame">
        <div class="device-header">
          <span>Deck View</span>
          <span id="active-url-label" class="muted-url">idle</span>
        </div>
        <div id="viewport" class="viewport"></div>
        <div class="softkey-row">
          <button id="btn-up">Up</button>
          <button id="btn-enter">Select</button>
          <button id="btn-down">Down</button>
        </div>
      </section>

      <aside class="side-panel">
        <label class="compact-field">
          Viewport Cols
          <input id="viewport-cols" type="number" value="20" min="1" />
        </label>
        <div id="status" class="status"></div>

        <details id="dev-drawer" class="dev-drawer">
          <summary>Developer Tools</summary>
          <div class="panel-body">
            <div class="actions">
              <button id="btn-health">Health</button>
              <button id="btn-render">Render</button>
              <button id="btn-snapshot">Snapshot</button>
              <button id="btn-clear-intent">Clear External Intent</button>
              <button id="btn-export-timeline">Export Timeline</button>
              <button id="btn-clear-timeline">Clear Timeline</button>
            </div>
            <details id="debug-raw-mode" style="margin-top: 10px;">
              <summary>Raw WML Paste</summary>
              <div style="margin-top: 8px;">
                <label>
                  Base URL
                  <input id="base-url" type="text" value="http://local.test/start.wml" />
                </label>
                <textarea id="wml-input"></textarea>
                <div class="actions">
                  <button id="btn-load-context">Load Raw WML</button>
                </div>
              </div>
            </details>
            <h3>Session State</h3>
            <pre id="session-state"></pre>
            <h3>Transport Response</h3>
            <pre id="transport-response"></pre>
            <h3>Runtime Snapshot</h3>
            <pre id="snapshot"></pre>
            <h3>Event Timeline</h3>
            <pre id="timeline"></pre>
          </div>
        </details>
      </aside>
    </main>
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
const timelineEl = document.querySelector<HTMLPreElement>('#timeline');
const activeUrlLabelEl = document.querySelector<HTMLSpanElement>('#active-url-label');
const devDrawerEl = document.querySelector<HTMLDetailsElement>('#dev-drawer');

if (
  !wmlInput ||
  !baseUrlInput ||
  !viewportColsInput ||
  !viewportEl ||
  !snapshotEl ||
  !statusEl ||
  !fetchUrlInput ||
  !transportResponseEl ||
  !sessionStateEl ||
  !timelineEl ||
  !activeUrlLabelEl ||
  !devDrawerEl
) {
  throw new Error('missing expected UI element');
}

wmlInput.value = SAMPLE_WML;

let hostSessionState: HostSessionState = {
  navigationStatus: 'idle',
  requestedUrl: fetchUrlInput.value
};
const hostHistory = createHostHistoryState();
let timelineSeq = 0;
const timelineEntries: TimelineEntry[] = [];

const cloneSessionState = (): HostSessionState => ({ ...hostSessionState });

const renderTimeline = (): void => {
  timelineEl.textContent = JSON.stringify(timelineEntries, null, 2);
};

const recordTimeline = (
  action: string,
  phase: TimelineEntry['phase'],
  details?: Record<string, unknown>
): void => {
  timelineSeq += 1;
  timelineEntries.push({
    seq: timelineSeq,
    action,
    phase,
    session: cloneSessionState(),
    ...(details ? { details } : {})
  });
  if (timelineEntries.length > MAX_TIMELINE_EVENTS) {
    timelineEntries.splice(0, timelineEntries.length - MAX_TIMELINE_EVENTS);
  }
  renderTimeline();
};

const clearTimeline = (): void => {
  timelineEntries.length = 0;
  timelineSeq = 0;
  renderTimeline();
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
  const shownUrl = hostSessionState.finalUrl ?? hostSessionState.requestedUrl ?? 'idle';
  activeUrlLabelEl.textContent = shownUrl;
};

const mergeSessionState = (patch: Partial<HostSessionState>): void => {
  setSessionState({
    ...hostSessionState,
    ...patch,
    historyIndex: hostHistory.index,
    history: hostHistory.entries
  });
  recordTimeline('session-state', 'state', { patch });
};

const syncSessionFromSnapshot = (snapshot: EngineRuntimeSnapshot): void => {
  mergeSessionState({
    activeCardId: snapshot.activeCardId,
    focusedLinkIndex: snapshot.focusedLinkIndex,
    externalNavigationIntent: snapshot.externalNavigationIntent
  });
  updateCurrentHistoryCard(hostHistory, snapshot.activeCardId);
};

setSessionState(hostSessionState);
clearTimeline();
recordTimeline('bootstrap', 'state', {
  requestedUrl: hostSessionState.requestedUrl
});
setStatus('Ready.');

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

const buildTimelineExport = (): Record<string, unknown> => ({
  schemaVersion: 1,
  timelineLength: timelineEntries.length,
  latestSessionState: cloneSessionState(),
  timeline: timelineEntries.map((entry) => ({
    seq: entry.seq,
    action: entry.action,
    phase: entry.phase,
    session: entry.session,
    ...(entry.details ? { details: entry.details } : {})
  }))
});

const validateTimelineExport = (payload: Record<string, unknown>): void => {
  const timeline = payload.timeline;
  if (!Array.isArray(timeline) || timeline.length === 0) {
    throw new Error('Timeline export requires at least one event.');
  }
  const hasState = timeline.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'phase' in entry &&
      (entry as { phase: string }).phase === 'state'
  );
  const hasAction = timeline.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'phase' in entry &&
      (entry as { phase: string }).phase !== 'state'
  );
  if (!hasState || !hasAction) {
    throw new Error('Timeline export must contain both action and state chronology.');
  }
};

const exportTimeline = (): void => {
  const payload = buildTimelineExport();
  validateTimelineExport(payload);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'waves-event-timeline.json';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

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
  (actionName: string, action: (event?: Event) => Promise<void>) =>
  async (event?: Event): Promise<void> => {
    recordTimeline(actionName, 'start');
    try {
      await action(event);
      recordTimeline(actionName, 'ok');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      mergeSessionState({ navigationStatus: 'error', lastError: message });
      setStatus(`Error: ${message}`);
      recordTimeline(actionName, 'error', { message });
    }
  };

const isTextEntryTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target instanceof HTMLInputElement) {
    const type = target.type.toLowerCase();
    return type === 'text' || type === 'search' || type === 'url' || type === 'number';
  }
  if (target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (target instanceof HTMLSelectElement) {
    return true;
  }
  return target.getAttribute('contenteditable') === 'true';
};

const applyEngineKey = async (key: EngineKey): Promise<void> => {
  const snapshot = await invoke<EngineRuntimeSnapshot>('engine_handle_key', {
    request: { key }
  });
  setSnapshot(snapshot);
  const renderList = await invoke<RenderList>('engine_render');
  drawRenderList(renderList);
  syncSessionFromSnapshot(snapshot);

  if (snapshot.externalNavigationIntent) {
    fetchUrlInput.value = snapshot.externalNavigationIntent;
    await loadTransportUrl(snapshot.externalNavigationIntent, 'external-intent', true, true);
  }
};

const applyNavigateBack = async (): Promise<EngineRuntimeSnapshot> => {
  const snapshot = await invoke<EngineRuntimeSnapshot>('engine_navigate_back');
  setSnapshot(snapshot);
  const renderList = await invoke<RenderList>('engine_render');
  drawRenderList(renderList);
  syncSessionFromSnapshot(snapshot);
  return snapshot;
};

const navigateBackWithFallback = async (): Promise<'engine' | 'host' | 'none'> => {
  const before = await invoke<EngineRuntimeSnapshot>('engine_snapshot');
  const after = await applyNavigateBack();
  const engineHandled =
    before.activeCardId !== after.activeCardId || before.focusedLinkIndex !== after.focusedLinkIndex;
  if (engineHandled) {
    return 'engine';
  }

  if (canHistoryBack(hostHistory)) {
    const previous = peekHistoryBack(hostHistory);
    if (previous?.url) {
      const prevSnapshot = await loadTransportUrl(previous.url, 'history-back', true, false);
      if (prevSnapshot) {
        if (previous.activeCardId && previous.activeCardId !== prevSnapshot.activeCardId) {
          const restored = await invoke<EngineRuntimeSnapshot>('engine_navigate_to_card', {
            request: { cardId: previous.activeCardId }
          });
          setSnapshot(restored);
          const renderList = await invoke<RenderList>('engine_render');
          drawRenderList(renderList);
          syncSessionFromSnapshot(restored);
        }
        const committed = commitHistoryBack(hostHistory);
        if (!committed) {
          return 'none';
        }
        fetchUrlInput.value = previous.url;
        mergeSessionState({
          historyIndex: hostHistory.index,
          history: hostHistory.entries
        });
        recordTimeline('host-history-back', 'state', {
          historyIndex: hostHistory.index,
          url: previous.url,
          restoredCardId: previous.activeCardId
        });
        return 'host';
      }
    }
  }

  return 'none';
};

const loadTransportUrl = async (
  url: string,
  source: NavSource,
  followExternalIntent: boolean,
  pushHistory = true
): Promise<EngineRuntimeSnapshot | null> => {
  const requestedUrl = url.trim();
  if (!requestedUrl) {
    throw new Error('URL is required');
  }
  recordTimeline('load-transport-url', 'state', {
    source,
    requestedUrl,
    followExternalIntent,
    pushHistory
  });

  await setViewportCols();
  mergeSessionState({
    navigationStatus: 'loading',
    requestedUrl,
    navigationSource: source,
    lastError: undefined
  });
  if (source === 'user') {
    setStatus(`Loading ${requestedUrl}...`);
  } else if (source === 'external-intent') {
    setStatus(`Following external intent: ${requestedUrl}`);
  } else {
    setStatus(`Loading previous page: ${requestedUrl}`);
  }

  const transport = await invoke<FetchDeckResponse>('fetch_deck', {
    request: {
      url: requestedUrl,
      method: 'GET',
      timeoutMs: 5000,
      retries: 1
    }
  });
  setTransportResponse(transport);
  recordTimeline('fetch-deck-response', 'state', {
    ok: transport.ok,
    status: transport.status,
    finalUrl: transport.finalUrl,
    contentType: transport.contentType
  });

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
  recordTimeline('engine-load-deck-context', 'state', {
    activeCardId: snapshot.activeCardId,
    focusedLinkIndex: snapshot.focusedLinkIndex,
    externalNavigationIntent: snapshot.externalNavigationIntent
  });
  const renderList = await invoke<RenderList>('engine_render');
  drawRenderList(renderList);

  mergeSessionState({
    navigationStatus: 'loaded',
    finalUrl: transport.finalUrl,
    contentType: transport.contentType,
    activeCardId: snapshot.activeCardId,
    focusedLinkIndex: snapshot.focusedLinkIndex,
    externalNavigationIntent: snapshot.externalNavigationIntent,
    navigationSource: source,
    lastError: undefined
  });
  if (pushHistory) {
    pushHostHistoryEntry(hostHistory, transport.finalUrl, snapshot.activeCardId, source);
    mergeSessionState({
      historyIndex: hostHistory.index,
      history: hostHistory.entries
    });
  }
  setStatus(`Fetched and loaded deck from ${transport.finalUrl}`);

  if (followExternalIntent && snapshot.externalNavigationIntent) {
    let nextUrl = snapshot.externalNavigationIntent;
    for (let hop = 1; hop <= MAX_EXTERNAL_INTENT_HOPS; hop += 1) {
      await invoke<EngineRuntimeSnapshot>('engine_clear_external_navigation_intent');
      fetchUrlInput.value = nextUrl;
      const nextSnapshot = await loadTransportUrl(nextUrl, 'external-intent', false, true);
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
  withAction('health', async () => {
    const message = await invoke<string>('health');
    setStatus(`Health: ${message}`);
  })
);

document.querySelector<HTMLButtonElement>('#btn-load-context')?.addEventListener(
  'click',
  withAction('load-raw-wml', async () => {
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
  withAction('fetch-url', async () => {
    await loadTransportUrl(fetchUrlInput.value, 'user', true, true);
  })
);

document.querySelector<HTMLButtonElement>('#btn-reload')?.addEventListener(
  'click',
  withAction('reload', async () => {
    const reloadUrl = hostSessionState.finalUrl ?? hostSessionState.requestedUrl ?? fetchUrlInput.value;
    fetchUrlInput.value = reloadUrl;
    await loadTransportUrl(reloadUrl, 'user', true, false);
  })
);

fetchUrlInput.addEventListener(
  'keydown',
  withAction('fetch-url-enter', async (event?: Event) => {
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      event.preventDefault();
      await loadTransportUrl(fetchUrlInput.value, 'user', true, true);
    }
  })
);

document.querySelector<HTMLButtonElement>('#btn-render')?.addEventListener(
  'click',
  withAction('render', async () => {
    await renderAndSnapshot();
    setStatus('Rendered current card.');
  })
);

const bindKeyButton = (id: string, key: EngineKey): void => {
  document.querySelector<HTMLButtonElement>(id)?.addEventListener(
    'click',
    withAction(`handle-key-${key}`, async () => {
      await applyEngineKey(key);
      setStatus(`Handled key: ${key}`);
    })
  );
};

bindKeyButton('#btn-up', 'up');
bindKeyButton('#btn-down', 'down');
bindKeyButton('#btn-enter', 'enter');

document.querySelector<HTMLButtonElement>('#btn-back')?.addEventListener(
  'click',
  withAction('navigate-back', async () => {
    const mode = await navigateBackWithFallback();
    if (mode === 'engine') {
      setStatus('navigateBack invoked (engine history).');
    } else if (mode === 'host') {
      setStatus('navigateBack invoked (browser history).');
    } else {
      setStatus('No back history available.');
    }
  })
);

document.querySelector<HTMLButtonElement>('#btn-snapshot')?.addEventListener(
  'click',
  withAction('snapshot', async () => {
    await renderAndSnapshot();
    setStatus('Snapshot refreshed.');
  })
);

document.querySelector<HTMLButtonElement>('#btn-clear-intent')?.addEventListener(
  'click',
  withAction('clear-external-intent', async () => {
    const snapshot = await invoke<EngineRuntimeSnapshot>('engine_clear_external_navigation_intent');
    setSnapshot(snapshot);
    syncSessionFromSnapshot(snapshot);
    setStatus('Cleared external navigation intent.');
  })
);

document.querySelector<HTMLButtonElement>('#btn-export-timeline')?.addEventListener(
  'click',
  withAction('export-timeline', async () => {
    if (timelineEntries.length === 0) {
      throw new Error('No timeline events to export yet.');
    }
    exportTimeline();
    setStatus('Exported timeline JSON.');
  })
);

document.querySelector<HTMLButtonElement>('#btn-clear-timeline')?.addEventListener(
  'click',
  withAction('clear-timeline', async () => {
    clearTimeline();
    setStatus('Cleared event timeline.');
  })
);

window.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
    event.preventDefault();
    devDrawerEl.open = !devDrawerEl.open;
    setStatus(devDrawerEl.open ? 'Developer tools opened.' : 'Developer tools hidden.');
    return;
  }

  if (isTextEntryTarget(event.target)) {
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    void withAction('keyboard-up', async () => {
      await applyEngineKey('up');
      setStatus('Keyboard: up');
    })();
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    void withAction('keyboard-down', async () => {
      await applyEngineKey('down');
      setStatus('Keyboard: down');
    })();
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    void withAction('keyboard-enter', async () => {
      await applyEngineKey('enter');
      setStatus('Keyboard: enter');
    })();
    return;
  }

  if (event.key === 'Backspace') {
    event.preventDefault();
    void withAction('keyboard-backspace', async () => {
      const mode = await navigateBackWithFallback();
      if (mode === 'engine') {
        setStatus('Keyboard: back (engine history)');
      } else if (mode === 'host') {
        setStatus('Keyboard: back (browser history)');
      } else {
        setStatus('Keyboard: no back history');
      }
    })();
  }
});
