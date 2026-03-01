import { bootWmlEngine } from './renderer';
import { EXAMPLES } from './.generated/examples';
import type { EngineSnapshot } from './renderer';
import { mapKeyboardKey } from './utils/keyboard';
import { createCollapsible } from './ui/collapsible';
import { renderRuntimeState } from './services/runtime-state';
import { ExampleEventLog } from './services/event-log';
import { renderExampleMetadata } from './ui/example-metadata';
import { downloadFile } from './services/download';
import { createRuntimeInspector } from './ui/runtime-inspector';

const LIVE_RELOAD_DEBOUNCE_MS = 250;

async function main() {
  const canvas = document.querySelector<HTMLCanvasElement>('#wap-screen');
  const textarea = document.querySelector<HTMLTextAreaElement>('#deck-input');
  const reloadButton = document.querySelector<HTMLButtonElement>('#reload-deck');
  const exampleSelect = document.querySelector<HTMLSelectElement>('#example-select');
  const editorWrap = document.querySelector<HTMLElement>('.editor-wrap');
  const toggleEditor = document.querySelector<HTMLButtonElement>('#toggle-editor');
  const liveCheckbox = document.querySelector<HTMLInputElement>('#live-reload');
  const pressUpButton = document.querySelector<HTMLButtonElement>('#press-up');
  const pressDownButton = document.querySelector<HTMLButtonElement>('#press-down');
  const pressEnterButton = document.querySelector<HTMLButtonElement>('#press-enter');
  const clearIntentButton = document.querySelector<HTMLButtonElement>('#clear-intent');
  const copyIntentButton = document.querySelector<HTMLButtonElement>('#copy-intent');
  const eventLogWrap = document.querySelector<HTMLElement>('.event-log-wrap');
  const toggleEventLog = document.querySelector<HTMLButtonElement>('#toggle-event-log');
  const clearEventLogButton = document.querySelector<HTMLButtonElement>('#clear-event-log');
  const eventLogExportFormat = document.querySelector<HTMLSelectElement>('#event-log-export-format');
  const exportEventLogButton = document.querySelector<HTMLButtonElement>('#export-event-log');
  const traceWrap = document.querySelector<HTMLElement>('.trace-wrap');
  const toggleTrace = document.querySelector<HTMLButtonElement>('#toggle-trace');
  const clearTraceButton = document.querySelector<HTMLButtonElement>('#clear-trace');
  const traceExportFormat = document.querySelector<HTMLSelectElement>('#trace-export-format');
  const exportTraceButton = document.querySelector<HTMLButtonElement>('#export-trace');
  const tracePresetAll = document.querySelector<HTMLButtonElement>('#trace-preset-all');
  const tracePresetScripts = document.querySelector<HTMLButtonElement>('#trace-preset-scripts');
  const tracePresetNavigation = document.querySelector<HTMLButtonElement>('#trace-preset-navigation');
  const tracePresetTraps = document.querySelector<HTMLButtonElement>('#trace-preset-traps');
  const traceFilterKind = document.querySelector<HTMLInputElement>('#trace-filter-kind');
  const traceFilterCard = document.querySelector<HTMLInputElement>('#trace-filter-card');
  const traceFilterTraps = document.querySelector<HTMLInputElement>('#trace-filter-traps');
  const engineTrace = document.querySelector<HTMLPreElement>('#engine-trace');
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
    !pressUpButton ||
    !pressDownButton ||
    !pressEnterButton ||
    !clearIntentButton ||
    !copyIntentButton ||
    !eventLogWrap ||
    !toggleEventLog ||
    !clearEventLogButton ||
    !eventLogExportFormat ||
    !exportEventLogButton ||
    !traceWrap ||
    !toggleTrace ||
    !clearTraceButton ||
    !traceExportFormat ||
    !exportTraceButton ||
    !tracePresetAll ||
    !tracePresetScripts ||
    !tracePresetNavigation ||
    !tracePresetTraps ||
    !traceFilterKind ||
    !traceFilterCard ||
    !traceFilterTraps ||
    !engineTrace ||
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
  const runtimeInspector = createRuntimeInspector({
    output: engineTrace,
    clearButton: clearTraceButton,
    exportButton: exportTraceButton,
    exportFormat: traceExportFormat,
    presetAllButton: tracePresetAll,
    presetScriptsButton: tracePresetScripts,
    presetNavigationButton: tracePresetNavigation,
    presetTrapsButton: tracePresetTraps,
    kindFilter: traceFilterKind,
    cardFilter: traceFilterCard,
    trapsOnlyFilter: traceFilterTraps,
    getEntries: () => host.traceEntries(),
    onCleared: () => {
      host.clearTraceEntries();
      status.textContent = 'Cleared engine trace.';
      appendEvent('TRACE_CLEARED');
    },
    onExported: (outcome, format, count) => {
      if (outcome === 'empty') {
        status.textContent = 'No engine trace entries to export.';
        appendEvent('TRACE_EXPORT_SKIPPED (empty)');
        return;
      }
      status.textContent = `Exported ${count} engine trace entr${count === 1 ? 'y' : 'ies'} as ${format}.`;
      appendEvent(`TRACE_EXPORTED (${format})`);
    },
    onPresetApplied: (preset) => {
      status.textContent = `Applied trace preset: ${preset}`;
      appendEvent(`TRACE_PRESET (${preset})`);
    }
  });

  const updateRuntimeState = () => {
    const snapshot = host.snapshot();
    renderRuntimeState(runtimeState, snapshot);
    runtimeInspector.render();
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

  renderExampleMetadata(exampleMetadataElements, defaultExample);
  exampleMetaSection.apply();
  editorSection.apply();
  eventLogSection.apply();
  traceSection.apply();
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
