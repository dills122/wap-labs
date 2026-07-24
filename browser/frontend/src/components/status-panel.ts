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
      border: 2px solid var(--panel-border-mid);
      border-top-color: var(--panel-border-dark);
      border-left-color: var(--panel-border-dark);
      padding: 8px;
      font-size: 13px;
      min-height: 44px;
      background: var(--status-idle-bg);
      color: var(--status-idle-text);
      line-height: 1.35;
    }

    .status-idle {
      background: var(--status-idle-bg);
      color: var(--status-idle-text);
    }

    .status-loading {
      background: var(--status-loading-bg);
      color: var(--status-loading-text);
    }

    .status-ok {
      background: var(--status-ok-bg);
      color: var(--status-ok-text);
    }

    .status-error {
      background: var(--status-error-bg);
      color: var(--status-error-text);
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
    return html`<div
      class=${`status status-${this.tone}`}
      id="status-root"
      role="status"
      aria-live="polite"
    >
      ${this.message}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wv-status-panel': WvStatusPanel;
  }
}
