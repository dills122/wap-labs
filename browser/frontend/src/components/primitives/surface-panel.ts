import { LitElement, css, html } from 'lit';

export class WvSurfacePanel extends LitElement {
  static properties = {
    heading: { type: String }
  };

  static styles = css`
    :host {
      display: block;
    }

    .panel {
      border: 2px solid #808080;
      border-right-color: #000000;
      border-bottom-color: #000000;
      background: #c0c0c0;
    }

    .heading {
      margin: 0;
      padding: 4px 6px;
      border-bottom: 1px solid #808080;
      font-size: 12px;
      letter-spacing: 0;
      text-transform: none;
      color: #ffffff;
      font-weight: 700;
      background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
    }

    .body {
      padding: 6px;
    }
  `;

  declare heading: string;

  constructor() {
    super();
    this.heading = '';
  }

  override render() {
    return html`
      <section class="panel">
        ${this.heading ? html`<h3 class="heading">${this.heading}</h3>` : null}
        <div class="body">
          <slot></slot>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wv-surface-panel': WvSurfacePanel;
  }
}
