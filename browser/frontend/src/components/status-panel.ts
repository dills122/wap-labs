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
      border: 1px solid #cad5e6;
      border-radius: 10px;
      padding: 10px;
      font-size: 13px;
      min-height: 44px;
      background: #f7fbff;
      color: #5f6f86;
    }

    .status-idle {
      background: #f7fbff;
      color: #5f6f86;
    }

    .status-loading {
      background: #eff6ff;
      color: #1d4ed8;
    }

    .status-ok {
      background: #ecfdf5;
      color: #047857;
    }

    .status-error {
      background: #fef2f2;
      color: #b91c1c;
    }
  `;

  accessor message = '';
  accessor tone: StatusTone = 'idle';

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
