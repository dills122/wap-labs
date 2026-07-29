import { LitElement, css, html } from 'lit';
import type { StatusTone } from '../ui-helpers';

export class WvStatusPanel extends LitElement {
  static properties = {
    message: { type: String },
    tone: { type: String, reflect: true }
  };

  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }

    .status {
      display: flex;
      min-width: 0;
      min-height: 22px;
      align-items: center;
      gap: var(--space-2xs);
      padding: 0;
      border: 0;
      color: var(--status-idle-text);
      background: transparent;
      font-size: var(--text-xs);
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status::before {
      display: grid;
      width: 0.75rem;
      height: 0.75rem;
      flex: 0 0 0.75rem;
      place-items: center;
      border: 1px solid currentColor;
      border-radius: var(--radius-xs);
      background: var(--status-idle-indicator);
      color: var(--status-idle-bg);
      content: '–';
      font-family: var(--font-mono);
      font-size: 0.625rem;
      font-weight: 700;
      line-height: 1;
    }

    .status-idle {
      color: var(--status-idle-text);
    }

    .status-loading {
      color: var(--status-loading-text);
    }

    .status-loading::before {
      background: var(--status-loading-indicator);
      color: var(--status-loading-bg);
      content: '…';
    }

    .status-ok {
      color: var(--status-ok-text);
    }

    .status-ok::before {
      background: var(--status-ok-indicator);
      color: var(--status-ok-bg);
      content: '✓';
    }

    .status-error {
      color: var(--status-error-text);
    }

    .status-error::before {
      background: var(--status-error-indicator);
      color: var(--status-error-bg);
      content: '!';
    }
  `;

  declare message: string;
  declare tone: StatusTone;

  constructor() {
    super();
    this.message = '';
    this.tone = 'idle';
  }

  setStatus(message: string, tone: StatusTone): void {
    this.message = message;
    this.tone = tone;
  }

  override render() {
    return html`<div class=${`status status-${this.tone}`} id="status-root">${this.message}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wv-status-panel': WvStatusPanel;
  }
}
