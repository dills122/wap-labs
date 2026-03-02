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
      border: 1px solid #cad5e6;
      border-radius: 10px;
      background: #f8fbff;
      overflow: hidden;
    }

    .heading {
      margin: 0;
      padding: 8px 10px;
      border-bottom: 1px solid #cad5e6;
      font-size: 12px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #315983;
      font-weight: 700;
    }

    .body {
      padding: 8px;
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
