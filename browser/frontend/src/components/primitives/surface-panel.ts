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
      border-block: 1px solid var(--panel-border-mid);
      color: var(--host-text);
      background: transparent;
    }

    .heading {
      margin: 0;
      padding: var(--space-xs) var(--space-sm);
      border-bottom: 1px solid var(--panel-border-mid);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--panel-heading-text);
      font-weight: 700;
      background: transparent;
    }

    .body {
      padding: var(--space-sm);
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
