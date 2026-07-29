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
      border-left: 4px solid var(--status-idle-indicator);
      border-radius: 6px;
      padding: 9px 10px;
      font-size: 13px;
      min-height: 44px;
      background: var(--status-idle-bg);
      color: var(--status-idle-text);
      line-height: 1.35;
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 55%);
    }

    .status-idle {
      background: var(--status-idle-bg);
      color: var(--status-idle-text);
    }

    .status-loading {
      border-left-color: var(--status-loading-indicator);
      background: var(--status-loading-bg);
      color: var(--status-loading-text);
    }

    .status-ok {
      border-left-color: var(--status-ok-indicator);
      background: var(--status-ok-bg);
      color: var(--status-ok-text);
    }

    .status-error {
      border-left-color: var(--status-error-indicator);
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
    return html`<div class=${`status status-${this.tone}`} id="status-root">${this.message}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wv-status-panel': WvStatusPanel;
  }
}
