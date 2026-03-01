import type { EngineTraceEntry } from '../contracts/wml-engine';
import { downloadFile } from '../services/download';

type TraceExportFormat = 'txt' | 'json';

type TraceExportOutcome = 'exported' | 'empty';

interface RuntimeInspectorOptions {
  output: HTMLPreElement;
  clearButton: HTMLButtonElement;
  exportButton: HTMLButtonElement;
  exportFormat: HTMLSelectElement;
  presetAllButton: HTMLButtonElement;
  presetScriptsButton: HTMLButtonElement;
  presetNavigationButton: HTMLButtonElement;
  presetTrapsButton: HTMLButtonElement;
  kindFilter: HTMLInputElement;
  cardFilter: HTMLInputElement;
  trapsOnlyFilter: HTMLInputElement;
  getEntries: () => EngineTraceEntry[];
  onCleared?: () => void;
  onExported?: (outcome: TraceExportOutcome, format: TraceExportFormat, count: number) => void;
  onPresetApplied?: (preset: 'all' | 'scripts' | 'navigation' | 'traps') => void;
}

export interface RuntimeInspector {
  render: () => void;
}

export function createRuntimeInspector(options: RuntimeInspectorOptions): RuntimeInspector {
  const {
    output,
    clearButton,
    exportButton,
    exportFormat,
    presetAllButton,
    presetScriptsButton,
    presetNavigationButton,
    presetTrapsButton,
    kindFilter,
    cardFilter,
    trapsOnlyFilter,
    getEntries,
    onCleared,
    onExported,
    onPresetApplied
  } = options;

  const filterEntries = (entries: EngineTraceEntry[]): EngineTraceEntry[] => {
    const kindNeedle = kindFilter.value.trim().toLowerCase();
    const cardNeedle = cardFilter.value.trim().toLowerCase();
    const trapsOnly = trapsOnlyFilter.checked;

    return entries.filter((entry) => {
      if (trapsOnly && !entry.script_trap) {
        return false;
      }
      if (kindNeedle && !entry.kind.toLowerCase().includes(kindNeedle)) {
        return false;
      }
      const card = entry.active_card_id ?? '';
      if (cardNeedle && !card.toLowerCase().includes(cardNeedle)) {
        return false;
      }
      return true;
    });
  };

  const render = () => {
    const entries = filterEntries(getEntries());
    if (entries.length === 0) {
      output.textContent = 'No engine trace entries yet.';
      return;
    }

    output.textContent = entries
      .map((entry) => {
        const card = entry.active_card_id ?? '(none)';
        const intent = entry.external_navigation_intent ?? '(none)';
        const scriptOk =
          typeof entry.script_ok === 'boolean' ? String(entry.script_ok) : '(none)';
        const trap = entry.script_trap ?? '(none)';
        return `${entry.seq.toString().padStart(4, '0')} ${entry.kind} detail="${entry.detail}" card=${card} focus=${entry.focused_link_index} intent=${intent} scriptOk=${scriptOk} trap=${trap}`;
      })
      .join('\n');
  };

  clearButton.addEventListener('click', () => {
    onCleared?.();
    render();
  });

  exportButton.addEventListener('click', () => {
    const entries = filterEntries(getEntries());
    const format: TraceExportFormat = exportFormat.value === 'json' ? 'json' : 'txt';
    if (entries.length === 0) {
      onExported?.('empty', format, 0);
      return;
    }

    const exportedAt = new Date().toISOString();
    const file =
      format === 'json'
        ? {
            filename: 'wavenav-engine-trace.json',
            mimeType: 'application/json',
            payload: JSON.stringify({ exportedAt, entries }, null, 2)
          }
        : {
            filename: 'wavenav-engine-trace.txt',
            mimeType: 'text/plain',
            payload: [
              `exportedAt: ${exportedAt}`,
              `entryCount: ${entries.length}`,
              '',
              ...entries.map((entry) => {
                const card = entry.active_card_id ?? '(none)';
                const intent = entry.external_navigation_intent ?? '(none)';
                const scriptOk =
                  typeof entry.script_ok === 'boolean' ? String(entry.script_ok) : '(none)';
                const trap = entry.script_trap ?? '(none)';
                return `${entry.seq.toString().padStart(4, '0')} ${entry.kind} detail="${entry.detail}" card=${card} focus=${entry.focused_link_index} intent=${intent} scriptOk=${scriptOk} trap=${trap}`;
              })
            ].join('\n')
          };

    downloadFile(file);
    onExported?.('exported', format, entries.length);
  });

  const applyPreset = (preset: 'all' | 'scripts' | 'navigation' | 'traps') => {
    if (preset === 'all') {
      kindFilter.value = '';
      cardFilter.value = '';
      trapsOnlyFilter.checked = false;
    } else if (preset === 'scripts') {
      kindFilter.value = 'ACTION_SCRIPT';
      cardFilter.value = '';
      trapsOnlyFilter.checked = false;
    } else if (preset === 'navigation') {
      kindFilter.value = 'ACTION_';
      cardFilter.value = '';
      trapsOnlyFilter.checked = false;
    } else {
      kindFilter.value = '';
      cardFilter.value = '';
      trapsOnlyFilter.checked = true;
    }
    render();
    onPresetApplied?.(preset);
  };

  presetAllButton.addEventListener('click', () => applyPreset('all'));
  presetScriptsButton.addEventListener('click', () => applyPreset('scripts'));
  presetNavigationButton.addEventListener('click', () => applyPreset('navigation'));
  presetTrapsButton.addEventListener('click', () => applyPreset('traps'));

  kindFilter.addEventListener('input', render);
  cardFilter.addEventListener('input', render);
  trapsOnlyFilter.addEventListener('change', render);

  return { render };
}
