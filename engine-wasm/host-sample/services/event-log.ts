import type { EngineSnapshot } from '../renderer';

export type EventLogExportFormat = 'txt' | 'json';

export interface EventLogExport {
  filename: string;
  mimeType: string;
  payload: string;
}

export class ExampleEventLog {
  private readonly logs = new Map<string, string[]>();
  private sequence = 1;
  private activeExampleKey: string;
  private readonly output: HTMLPreElement;

  constructor(output: HTMLPreElement, activeExampleKey: string) {
    this.output = output;
    this.activeExampleKey = activeExampleKey;
  }

  setActiveExample(key: string): void {
    this.activeExampleKey = key;
    this.renderActive();
  }

  append(action: string, snapshot?: EngineSnapshot): void {
    const timestamp = new Date().toLocaleTimeString('en-CA', { hour12: false });
    const summary = snapshot
      ? `activeCardId=${snapshot.activeCardId} focus=${snapshot.focusedLinkIndex} intent=${snapshot.externalNavigationIntent ?? '(none)'}`
      : '';
    const line = `${String(this.sequence).padStart(4, '0')} ${timestamp} | ${action}${summary ? ` | ${summary}` : ''}`;
    this.sequence += 1;

    const items = this.logs.get(this.activeExampleKey) ?? [];
    items.push(line);
    this.logs.set(this.activeExampleKey, items);
    this.output.textContent = items.join('\n');
  }

  clearActive(): void {
    this.logs.set(this.activeExampleKey, []);
    this.renderActive();
  }

  renderActive(): void {
    const items = this.logs.get(this.activeExampleKey) ?? [];
    this.output.textContent = items.length > 0 ? items.join('\n') : 'No events yet for this example.';
  }

  exportActive(format: EventLogExportFormat): EventLogExport | null {
    const events = this.logs.get(this.activeExampleKey) ?? [];
    if (events.length === 0) {
      return null;
    }

    const exportedAt = new Date().toISOString();
    if (format === 'json') {
      return {
        filename: `wavenav-event-log-${this.activeExampleKey}.json`,
        mimeType: 'application/json;charset=utf-8',
        payload: JSON.stringify(
          {
            exampleKey: this.activeExampleKey,
            exportedAt,
            events
          },
          null,
          2
        )
      };
    }

    return {
      filename: `wavenav-event-log-${this.activeExampleKey}.txt`,
      mimeType: 'text/plain;charset=utf-8',
      payload: [`exampleKey: ${this.activeExampleKey}`, `exportedAt: ${exportedAt}`, '', ...events].join('\n')
    };
  }
}
