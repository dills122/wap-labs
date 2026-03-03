import { bootWmlEngine } from './renderer';
import { EXAMPLES } from './.generated/examples';
import type { EngineSnapshot } from './renderer';
import { mapKeyboardKey } from './utils/keyboard';
import { createCollapsible } from './ui/collapsible';
import { renderRuntimeState } from './services/runtime-state';
import { ExampleEventLog } from './services/event-log';
import { renderExampleMetadata } from './ui/example-metadata';
import { downloadFile } from './services/download';
import './ui/runtime-inspector-panel';
import type { RuntimeInspectorPanel } from './ui/runtime-inspector-panel';

const LIVE_RELOAD_DEBOUNCE_MS = 250;
const AUTO_TICK_DEFAULT_MS = 100;
const AUTO_TICK_STEPS = new Set([100, 250, 500, 1000]);

async function main() {
  const canvas = document.querySelector<HTMLCanvasElement>('#wap-screen');
  const textarea = document.querySelector<HTMLTextAreaElement>('#deck-input');
  const reloadButton = document.querySelector<HTMLButtonElement>('#reload-deck');
  const exampleSelect = document.querySelector<HTMLSelectElement>('#example-select');
  const editorWrap = document.querySelector<HTMLElement>('.editor-wrap');
  const toggleEditor = document.querySelector<HTMLButtonElement>('#toggle-editor');
  const liveCheckbox = document.querySelector<HTMLInputElement>('#live-reload');
  const pressBackButton = document.querySelector<HTMLButtonElement>('#press-back');
  const pressUpButton = document.querySelector<HTMLButtonElement>('#press-up');
  const pressDownButton = document.querySelector<HTMLButtonElement>('#press-down');
  const pressEnterButton = document.querySelector<HTMLButtonElement>('#press-enter');
  const tick100msButton = document.querySelector<HTMLButtonElement>('#tick-100ms');
  const tick1sButton = document.querySelector<HTMLButtonElement>('#tick-1s');
  const autoTickStepSelect = document.querySelector<HTMLSelectElement>('#auto-tick-step');
  const toggleAutoTickButton = document.querySelector<HTMLButtonElement>('#toggle-auto-tick');
  const clearIntentButton = document.querySelector<HTMLButtonElement>('#clear-intent');
  const copyIntentButton = document.querySelector<HTMLButtonElement>('#copy-intent');
  const probeExecuteScriptButton =
    document.querySelector<HTMLButtonElement>('#probe-execute-script');
  const probeInvokeScriptButton = document.querySelector<HTMLButtonElement>('#probe-invoke-script');
  const eventLogWrap = document.querySelector<HTMLElement>('.event-log-wrap');
  const toggleEventLog = document.querySelector<HTMLButtonElement>('#toggle-event-log');
  const clearEventLogButton = document.querySelector<HTMLButtonElement>('#clear-event-log');
  const eventLogExportFormat = document.querySelector<HTMLSelectElement>(
    '#event-log-export-format'
  );
  const exportEventLogButton = document.querySelector<HTMLButtonElement>('#export-event-log');
  const traceWrap = document.querySelector<HTMLElement>('.trace-wrap');
  const toggleTrace = document.querySelector<HTMLButtonElement>('#toggle-trace');
  const runtimeInspector = document.querySelector<RuntimeInspectorPanel>('#runtime-inspector');
  const status = document.querySelector<HTMLParagraphElement>('#status');
  const runtimeState = document.querySelector<HTMLPreElement>('#runtime-state');
  const eventLog = document.querySelector<HTMLPreElement>('#event-log');
  const exampleMeta = document.querySelector<HTMLElement>('.example-meta');
  const toggleExampleMeta = document.querySelector<HTMLButtonElement>('#toggle-example-meta');
  const exampleTitle = document.querySelector<HTMLHeadingElement>('#example-title');
  const exampleCoverage = document.querySelector<HTMLParagraphElement>('#example-coverage');
  const exampleDescription = document.querySelector<HTMLParagraphElement>('#example-description');
  const exampleGoal = document.querySelector<HTMLParagraphElement>('#example-goal');
  const exampleTestingAc = document.querySelector<HTMLUListElement>('#example-testing-ac');

  if (
    !canvas ||
    !textarea ||
    !reloadButton ||
    !exampleSelect ||
    !editorWrap ||
    !toggleEditor ||
    !liveCheckbox ||
    !pressBackButton ||
    !pressUpButton ||
    !pressDownButton ||
    !pressEnterButton ||
    !tick100msButton ||
    !tick1sButton ||
    !autoTickStepSelect ||
    !toggleAutoTickButton ||
    !clearIntentButton ||
    !copyIntentButton ||
    !probeExecuteScriptButton ||
    !probeInvokeScriptButton ||
    !eventLogWrap ||
    !toggleEventLog ||
    !clearEventLogButton ||
    !eventLogExportFormat ||
    !exportEventLogButton ||
    !traceWrap ||
    !toggleTrace ||
    !runtimeInspector ||
    !status ||
    !runtimeState ||
    !eventLog ||
    !exampleMeta ||
    !toggleExampleMeta ||
    !exampleTitle ||
    !exampleCoverage ||
    !exampleDescription ||
    !exampleGoal ||
    !exampleTestingAc
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

  const exampleMap = new Map(EXAMPLES.map((item) => [item.key, item]));
  const defaultExample = EXAMPLES[0];
  exampleSelect.value = defaultExample.key;
  textarea.value = defaultExample.wml;
  const host = await bootWmlEngine(canvas, textarea.value);
  status.textContent = `Loaded example: ${defaultExample.key}`;
  let activeExampleKey = defaultExample.key;
  const exampleMetadataElements = {
    title: exampleTitle,
    coverage: exampleCoverage,
    description: exampleDescription,
    goal: exampleGoal,
    testingAc: exampleTestingAc
  };
  const exampleMetaSection = createCollapsible({
    container: exampleMeta,
    toggleButton: toggleExampleMeta,
    collapsedClass: 'is-collapsed'
  });
  const editorSection = createCollapsible({
    container: editorWrap,
    toggleButton: toggleEditor,
    collapsedClass: 'is-collapsed'
  });
  const eventLogSection = createCollapsible({
    container: eventLogWrap,
    toggleButton: toggleEventLog,
    collapsedClass: 'is-collapsed'
  });
  const traceSection = createCollapsible({
    container: traceWrap,
    toggleButton: toggleTrace,
    collapsedClass: 'is-collapsed'
  });
  const eventLogService = new ExampleEventLog(eventLog, defaultExample.key);
  runtimeInspector.addEventListener('trace-clear-requested', () => {
    host.clearTraceEntries();
    runtimeInspector.entries = host.traceEntries();
    status.textContent = 'Cleared engine trace.';
    appendEvent('TRACE_CLEARED');
  });
  runtimeInspector.addEventListener('trace-exported', (event) => {
    const detail = (
      event as CustomEvent<{ outcome: 'exported' | 'empty'; format: 'txt' | 'json'; count: number }>
    ).detail;
    if (detail.outcome === 'empty') {
      status.textContent = 'No engine trace entries to export.';
      appendEvent('TRACE_EXPORT_SKIPPED (empty)');
      return;
    }
    status.textContent = `Exported ${detail.count} engine trace entr${detail.count === 1 ? 'y' : 'ies'} as ${detail.format}.`;
    appendEvent(`TRACE_EXPORTED (${detail.format})`);
  });
  runtimeInspector.addEventListener('trace-preset-applied', (event) => {
    const detail = (event as CustomEvent<{ preset: 'all' | 'scripts' | 'navigation' | 'traps' }>)
      .detail;
    status.textContent = `Applied trace preset: ${detail.preset}`;
    appendEvent(`TRACE_PRESET (${detail.preset})`);
  });

  const updateRuntimeState = () => {
    const snapshot = host.snapshot();
    renderRuntimeState(runtimeState, snapshot);
    runtimeInspector.entries = host.traceEntries();
    return snapshot;
  };

  const appendEvent = (action: string, snapshot?: EngineSnapshot) =>
    eventLogService.append(action, snapshot);

  const reloadFromEditor = (prefix: string, reason: string) => {
    try {
      host.loadDeck(textarea.value);
      const snapshot = updateRuntimeState();
      status.textContent = `${prefix} Active card: ${snapshot.activeCardId}`;
      appendEvent(`LOAD (${reason})`, snapshot);
    } catch (error) {
      status.textContent = `Load error: ${String(error)}`;
      const snapshot = updateRuntimeState();
      appendEvent(`LOAD_ERROR (${reason}) ${String(error)}`, snapshot);
    }
  };

  const pressKey = (key: 'up' | 'down' | 'enter') => {
    try {
      host.pressKey(key);
      const snapshot = updateRuntimeState();
      status.textContent = `Key "${key}" applied. Active card: ${snapshot.activeCardId}`;
      appendEvent(`KEY ${key}`, snapshot);
    } catch (error) {
      status.textContent = `Key error (${key}): ${String(error)}`;
      const snapshot = updateRuntimeState();
      appendEvent(`KEY_ERROR ${key} ${String(error)}`, snapshot);
    }
  };

  let autoTickStepMs = AUTO_TICK_DEFAULT_MS;
  autoTickStepSelect.value = String(autoTickStepMs);
  let autoTickTimer: ReturnType<typeof setInterval> | null = null;
  const applyAutoTickButtonState = () => {
    const running = autoTickTimer !== null;
    toggleAutoTickButton.setAttribute('aria-pressed', running ? 'true' : 'false');
    toggleAutoTickButton.textContent = running
      ? `Auto Tick: On (${autoTickStepMs}ms)`
      : 'Auto Tick: Off';
  };
  const stopAutoTick = (reason?: string) => {
    if (!autoTickTimer) {
      return;
    }
    clearInterval(autoTickTimer);
    autoTickTimer = null;
    applyAutoTickButtonState();
    if (reason) {
      const snapshot = updateRuntimeState();
      status.textContent = reason;
      appendEvent('AUTO_TICK_STOP', snapshot);
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
      reloadFromEditor('Live reload complete.', 'live-reload');
      liveTimer = null;
    }, LIVE_RELOAD_DEBOUNCE_MS);
  };

  exampleSelect.addEventListener('change', () => {
    const key = exampleSelect.value;
    const example = exampleMap.get(key);
    if (!example) {
      return;
    }
    activeExampleKey = key;
    eventLogService.setActiveExample(key);
    textarea.value = example.wml;
    renderExampleMetadata(exampleMetadataElements, example);
    appendEvent('EXAMPLE_SELECTED');
    reloadFromEditor(`Loaded example: ${key}.`, 'example-select');
  });

  toggleExampleMeta.addEventListener('click', () => exampleMetaSection.toggle());
  toggleEditor.addEventListener('click', () => editorSection.toggle());
  toggleEventLog.addEventListener('click', () => eventLogSection.toggle());
  toggleTrace.addEventListener('click', () => traceSection.toggle());

  reloadButton.addEventListener('click', () => {
    reloadFromEditor('Deck reloaded.', 'manual-reload');
  });

  textarea.addEventListener('input', queueLiveReload);

  pressUpButton.addEventListener('click', () => pressKey('up'));
  pressDownButton.addEventListener('click', () => pressKey('down'));
  pressEnterButton.addEventListener('click', () => pressKey('enter'));
  const tickTime = (deltaMs: number, source: 'manual' | 'auto' = 'manual') => {
    try {
      const beforeCardId = host.snapshot().activeCardId;
      host.advanceTimeMs(deltaMs);
      const snapshot = updateRuntimeState();
      if (source === 'manual') {
        status.textContent = `Advanced timer clock by ${deltaMs}ms. Active card: ${snapshot.activeCardId}`;
        appendEvent(`TICK ${deltaMs}ms`, snapshot);
        return;
      }
      if (snapshot.activeCardId !== beforeCardId) {
        status.textContent = `Auto tick advanced card: ${beforeCardId} -> ${snapshot.activeCardId}`;
        appendEvent(`AUTO_TICK_NAV ${beforeCardId}->${snapshot.activeCardId}`, snapshot);
      }
    } catch (error) {
      const snapshot = updateRuntimeState();
      if (source === 'auto') {
        stopAutoTick();
        status.textContent = `Auto tick error (${deltaMs}ms): ${String(error)}`;
        appendEvent(`AUTO_TICK_ERROR ${deltaMs}ms ${String(error)}`, snapshot);
        return;
      }
      status.textContent = `Tick error (${deltaMs}ms): ${String(error)}`;
      appendEvent(`TICK_ERROR ${deltaMs}ms ${String(error)}`, snapshot);
    }
  };
  const startAutoTick = () => {
    if (autoTickTimer) {
      return;
    }
    autoTickTimer = setInterval(() => tickTime(autoTickStepMs, 'auto'), autoTickStepMs);
    applyAutoTickButtonState();
    const snapshot = updateRuntimeState();
    status.textContent = `Auto tick started (${autoTickStepMs}ms).`;
    appendEvent('AUTO_TICK_START', snapshot);
  };
  tick100msButton.addEventListener('click', () => tickTime(100));
  tick1sButton.addEventListener('click', () => tickTime(1000));
  autoTickStepSelect.addEventListener('change', () => {
    const parsed = Number.parseInt(autoTickStepSelect.value, 10);
    if (!AUTO_TICK_STEPS.has(parsed)) {
      autoTickStepSelect.value = String(autoTickStepMs);
      return;
    }
    autoTickStepMs = parsed;
    if (autoTickTimer) {
      stopAutoTick();
      startAutoTick();
      return;
    }
    applyAutoTickButtonState();
  });
  toggleAutoTickButton.addEventListener('click', () => {
    if (autoTickTimer) {
      stopAutoTick(`Auto tick stopped (${autoTickStepMs}ms).`);
      return;
    }
    startAutoTick();
  });
  pressBackButton.addEventListener('click', () => {
    const handled = host.navigateBack();
    const snapshot = updateRuntimeState();
    status.textContent = handled
      ? `Back applied. Active card: ${snapshot.activeCardId}`
      : 'Back ignored (history empty).';
    appendEvent(handled ? 'BACK' : 'BACK_EMPTY', snapshot);
  });
  clearIntentButton.addEventListener('click', () => {
    host.clearExternalNavigationIntent();
    const snapshot = updateRuntimeState();
    status.textContent = 'External navigation intent cleared.';
    appendEvent('INTENT_CLEARED', snapshot);
  });
  copyIntentButton.addEventListener('click', async () => {
    const snapshot = host.snapshot();
    const intent = snapshot.externalNavigationIntent;
    if (!intent) {
      status.textContent = 'No external intent to copy.';
      appendEvent('INTENT_COPY_SKIPPED (none)', snapshot);
      return;
    }
    try {
      await navigator.clipboard.writeText(intent);
      status.textContent = 'External intent URL copied.';
      appendEvent('INTENT_COPIED', snapshot);
    } catch (error) {
      status.textContent = `Copy intent failed: ${String(error)}`;
      appendEvent(`INTENT_COPY_ERROR ${String(error)}`, snapshot);
    }
  });
  probeExecuteScriptButton.addEventListener('click', () => {
    try {
      const outcome = host.executeScriptRefFunction('wavescript-fixtures.wmlsc', 'externalGo');
      const snapshot = updateRuntimeState();
      status.textContent = `executeScriptRefFunction externalGo => ok=${outcome.ok}; intent=${snapshot.externalNavigationIntent ?? '(none)'}`;
      appendEvent('SCRIPT_PROBE_EXECUTE externalGo', snapshot);
    } catch (error) {
      const snapshot = updateRuntimeState();
      status.textContent = `executeScriptRefFunction error: ${String(error)}`;
      appendEvent(`SCRIPT_PROBE_EXECUTE_ERROR ${String(error)}`, snapshot);
    }
  });
  probeInvokeScriptButton.addEventListener('click', () => {
    try {
      const outcome = host.invokeScriptRefFunction('wavescript-fixtures.wmlsc', 'externalGo');
      const snapshot = updateRuntimeState();
      status.textContent = `invokeScriptRefFunction externalGo => nav=${outcome.effects.navigationIntent.type}; intent=${snapshot.externalNavigationIntent ?? '(none)'}`;
      appendEvent('SCRIPT_PROBE_INVOKE externalGo', snapshot);
    } catch (error) {
      const snapshot = updateRuntimeState();
      status.textContent = `invokeScriptRefFunction error: ${String(error)}`;
      appendEvent(`SCRIPT_PROBE_INVOKE_ERROR ${String(error)}`, snapshot);
    }
  });
  clearEventLogButton.addEventListener('click', () => {
    eventLogService.clearActive();
    status.textContent = `Cleared event log for example: ${activeExampleKey}`;
  });
  exportEventLogButton.addEventListener('click', () => {
    const exportFormat = eventLogExportFormat.value === 'json' ? 'json' : 'txt';
    const file = eventLogService.exportActive(exportFormat);
    if (!file) {
      status.textContent = `No events to export for example: ${activeExampleKey}`;
      appendEvent('EVENT_LOG_EXPORT_SKIPPED (empty)');
      return;
    }

    downloadFile(file);
    status.textContent = `Exported event log for example: ${activeExampleKey}`;
    appendEvent('EVENT_LOG_EXPORTED');
  });

  window.addEventListener('keydown', (event) => {
    if (event.target === textarea) {
      return;
    }
    const key = mapKeyboardKey(event.key);
    if (!key) {
      return;
    }
    event.preventDefault();
    pressKey(key);
  });
  window.addEventListener('beforeunload', () => {
    stopAutoTick();
  });

  renderExampleMetadata(exampleMetadataElements, defaultExample);
  exampleMetaSection.apply();
  editorSection.apply();
  eventLogSection.apply();
  traceSection.apply();
  applyAutoTickButtonState();
  const initialSnapshot = updateRuntimeState();
  appendEvent('BOOT');
  appendEvent('INITIAL_LOAD', initialSnapshot);
  eventLogService.renderActive();
}

main().catch((error) => {
  const status = document.querySelector<HTMLParagraphElement>('#status');
  if (status) {
    status.textContent = `Boot error: ${String(error)}`;
  }
});
