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
      border: 1px solid var(--panel-border-mid);
      border-radius: 5px;
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
      border-color: #c8ac59;
      background: var(--status-loading-bg);
      box-shadow: inset 3px 0 0 #9b7410;
      color: var(--status-loading-text);
    }

    .status-ok {
      border-color: #91b99a;
      background: var(--status-ok-bg);
      box-shadow: inset 3px 0 0 #3a8051;
      color: var(--status-ok-text);
    }

    .status-error {
      border-color: #d58a82;
      background: var(--status-error-bg);
      box-shadow: inset 3px 0 0 #b33a32;
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
    return html`<div class=${`status status-${this.tone}`} id="status-root">${this.message}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wv-status-panel': WvStatusPanel;
  }
}
