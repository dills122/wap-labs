import { LitElement, css, html } from 'lit';
import type { EngineTraceEntry } from '../../contracts/wml-engine';
import { downloadFile } from '../services/download';

type TraceExportFormat = 'txt' | 'json';
type TracePreset = 'all' | 'scripts' | 'navigation' | 'traps';

interface TraceExportedDetail {
  outcome: 'exported' | 'empty';
  format: TraceExportFormat;
  count: number;
}

interface TracePresetAppliedDetail {
  preset: TracePreset;
}

export class RuntimeInspectorPanel extends LitElement {
  static properties = {
    entries: { attribute: false },
    exportFormat: { state: true },
    kindFilter: { state: true },
    cardFilter: { state: true },
    trapsOnly: { state: true }
  };

  static styles = css`
    .trace-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .trace-actions button {
      font-size: 0.75rem;
      padding: 6px 10px;
      background: #1552a1;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .trace-export-label {
      font-size: 0.78rem;
      align-self: center;
    }

    #trace-export-format {
      border: 1px solid #d8d2c3;
      border-radius: 8px;
      background: #fff;
      font-size: 0.78rem;
      padding: 6px 8px;
    }

    .trace-filters {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .trace-filters label,
    .trace-presets-label {
      font-size: 0.78rem;
    }

    .trace-filters button {
      font-size: 0.72rem;
      padding: 5px 8px;
      background: #1552a1;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .trace-filters input[type='text'] {
      border: 1px solid #d8d2c3;
      border-radius: 8px;
      background: #fff;
      font-size: 0.78rem;
      padding: 6px 8px;
      min-width: 120px;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .trace-traps-only {
      min-width: 0;
    }

    .engine-trace {
      margin: 0;
      min-height: 120px;
      max-height: 220px;
      overflow: auto;
      border: 1px solid #d8d2c3;
      border-radius: 8px;
      padding: 10px;
      background: #fcfcfc;
      font-size: 0.74rem;
      line-height: 1.45;
      font-family: 'IBM Plex Mono', Consolas, monospace;
      white-space: pre-wrap;
    }
  `;

  entries: EngineTraceEntry[] = [];

  private exportFormat: TraceExportFormat = 'txt';

  private kindFilter = '';

  private cardFilter = '';

  private trapsOnly = false;

  render() {
    const filteredEntries = this.getFilteredEntries();
    const traceText =
      filteredEntries.length === 0
        ? 'No engine trace entries yet.'
        : filteredEntries
            .map((entry) => {
              const card = entry.active_card_id ?? '(none)';
              const intent = entry.external_navigation_intent ?? '(none)';
              const scriptOk =
                typeof entry.script_ok === 'boolean' ? String(entry.script_ok) : '(none)';
              const trap = entry.script_trap ?? '(none)';
              return `${entry.seq.toString().padStart(4, '0')} ${entry.kind} detail="${entry.detail}" card=${card} focus=${entry.focused_link_index} intent=${intent} scriptOk=${scriptOk} trap=${trap}`;
            })
            .join('\n');

    return html`
      <div class="trace-actions">
        <button type="button" @click=${this.onClearClicked}>Clear Engine Trace</button>
        <label class="trace-export-label" for="trace-export-format">Export as</label>
        <select
          id="trace-export-format"
          .value=${this.exportFormat}
          @change=${this.onExportFormatChanged}
        >
          <option value="txt">Text (.txt)</option>
          <option value="json">JSON (.json)</option>
        </select>
        <button type="button" @click=${this.onExportClicked}>Export Engine Trace</button>
      </div>
      <div class="trace-filters">
        <span class="trace-presets-label">Presets</span>
        <button type="button" @click=${() => this.applyPreset('all')}>All</button>
        <button type="button" @click=${() => this.applyPreset('scripts')}>Scripts</button>
        <button type="button" @click=${() => this.applyPreset('navigation')}>Navigation</button>
        <button type="button" @click=${() => this.applyPreset('traps')}>Traps</button>
        <label for="trace-filter-kind">Kind</label>
        <input
          id="trace-filter-kind"
          type="text"
          placeholder="e.g. ACTION_SCRIPT"
          .value=${this.kindFilter}
          @input=${this.onKindFilterChanged}
        />
        <label for="trace-filter-card">Card</label>
        <input
          id="trace-filter-card"
          type="text"
          placeholder="e.g. home"
          .value=${this.cardFilter}
          @input=${this.onCardFilterChanged}
        />
        <label class="checkbox-row trace-traps-only" for="trace-filter-traps">
          <input
            id="trace-filter-traps"
            type="checkbox"
            .checked=${this.trapsOnly}
            @change=${this.onTrapsOnlyChanged}
          />
          Traps only
        </label>
      </div>
      <pre class="engine-trace">${traceText}</pre>
    `;
  }

  private getFilteredEntries(): EngineTraceEntry[] {
    const kindNeedle = this.kindFilter.trim().toLowerCase();
    const cardNeedle = this.cardFilter.trim().toLowerCase();
    return this.entries.filter((entry) => {
      if (this.trapsOnly && !entry.script_trap) {
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
  }

  private onClearClicked = () => {
    this.dispatchEvent(new CustomEvent('trace-clear-requested'));
  };

  private onExportFormatChanged = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    this.exportFormat = target.value === 'json' ? 'json' : 'txt';
  };

  private onExportClicked = () => {
    const entries = this.getFilteredEntries();
    const format = this.exportFormat;
    if (entries.length === 0) {
      this.dispatchEvent(
        new CustomEvent<TraceExportedDetail>('trace-exported', {
          detail: { outcome: 'empty', format, count: 0 }
        })
      );
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
    this.dispatchEvent(
      new CustomEvent<TraceExportedDetail>('trace-exported', {
        detail: { outcome: 'exported', format, count: entries.length }
      })
    );
  };

  private applyPreset(preset: TracePreset) {
    if (preset === 'all') {
      this.kindFilter = '';
      this.cardFilter = '';
      this.trapsOnly = false;
    } else if (preset === 'scripts') {
      this.kindFilter = 'ACTION_SCRIPT';
      this.cardFilter = '';
      this.trapsOnly = false;
    } else if (preset === 'navigation') {
      this.kindFilter = 'ACTION_';
      this.cardFilter = '';
      this.trapsOnly = false;
    } else {
      this.kindFilter = '';
      this.cardFilter = '';
      this.trapsOnly = true;
    }
    this.dispatchEvent(
      new CustomEvent<TracePresetAppliedDetail>('trace-preset-applied', {
        detail: { preset }
      })
    );
  }

  private onKindFilterChanged = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.kindFilter = target.value;
  };

  private onCardFilterChanged = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.cardFilter = target.value;
  };

  private onTrapsOnlyChanged = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.trapsOnly = target.checked;
  };
}

customElements.define('runtime-inspector-panel', RuntimeInspectorPanel);

declare global {
  interface HTMLElementTagNameMap {
    'runtime-inspector-panel': RuntimeInspectorPanel;
  }
}
