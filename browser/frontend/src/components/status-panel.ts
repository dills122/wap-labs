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
      border: 2px solid #808080;
      border-top-color: #000000;
      border-left-color: #000000;
      padding: 8px;
      font-size: 13px;
      min-height: 44px;
      background: #ffffff;
      color: #222222;
      line-height: 1.35;
    }

    .status-idle {
      background: #ffffff;
      color: #222222;
    }

    .status-loading {
      background: #ffffcc;
      color: #222222;
    }

    .status-ok {
      background: #ccffcc;
      color: #222222;
    }

    .status-error {
      background: #ffcccc;
      color: #222222;
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
