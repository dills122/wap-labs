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
      overflow: clip;
      border: 1px solid var(--panel-border-mid);
      border-radius: 7px;
      background: var(--panel-bg);
    }

    .heading {
      margin: 0;
      padding: 6px 8px;
      border-bottom: 1px solid var(--panel-border-mid);
      font-size: 12px;
      letter-spacing: 0;
      text-transform: none;
      color: var(--panel-heading-text);
      font-weight: 650;
      background: var(--panel-heading-bg);
    }

    .body {
      padding: 7px;
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
        ${this.heading ? html`<h2 class="heading">${this.heading}</h2>` : null}
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
