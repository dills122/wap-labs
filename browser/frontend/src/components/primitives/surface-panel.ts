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
      border: 2px solid var(--panel-border-mid);
      border-right-color: var(--panel-border-dark);
      border-bottom-color: var(--panel-border-dark);
      background: var(--panel-bg);
    }

    .heading {
      margin: 0;
      padding: 4px 6px;
      border-bottom: 1px solid var(--panel-border-mid);
      font-size: 12px;
      letter-spacing: 0;
      text-transform: none;
      color: var(--panel-heading-text);
      font-weight: 700;
      background: linear-gradient(
        90deg,
        var(--panel-heading-gradient-start) 0%,
        var(--panel-heading-gradient-end) 100%
      );
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
