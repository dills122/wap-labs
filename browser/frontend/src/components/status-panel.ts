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
    }

    .status {
      position: relative;
      border: 1px solid var(--panel-border-mid);
      border-radius: var(--radius-control);
      padding: var(--space-xs) var(--space-sm) var(--space-xs) 2rem;
      font-size: var(--text-sm);
      min-height: 44px;
      background: var(--status-idle-bg);
      color: var(--status-idle-text);
      line-height: 1.5;
      box-shadow: inset 0 1px 0 var(--color-highlight-medium);
    }

    .status::before {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: var(--space-sm);
      display: grid;
      width: 0.875rem;
      height: 0.875rem;
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
      transform: translateY(-50%);
    }

    .status-idle {
      background: var(--status-idle-bg);
      color: var(--status-idle-text);
    }

    .status-loading {
      background: var(--status-loading-bg);
      color: var(--status-loading-text);
    }

    .status-loading::before {
      background: var(--status-loading-indicator);
      color: var(--status-loading-bg);
      content: '…';
    }

    .status-ok {
      background: var(--status-ok-bg);
      color: var(--status-ok-text);
    }

    .status-ok::before {
      background: var(--status-ok-indicator);
      color: var(--status-ok-bg);
      content: '✓';
    }

    .status-error {
      background: var(--status-error-bg);
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
