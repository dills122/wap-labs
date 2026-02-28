import { bootWmlEngine } from './renderer';

const SAMPLE_WML = `<wml>
  <card id="home">
    <p>WAP Lab MVP Harness</p>
    <p>Use up/down keys.</p>
    <a href="#next">Go to next card</a>
    <br/>
    <a href="http://example.com/other.wml">External link (ignored in MVP engine)</a>
  </card>
  <card id="next">
    <p>Second card loaded.</p>
    <a href="#home">Return home</a>
  </card>
</wml>`;

async function main() {
  const canvas = document.querySelector<HTMLCanvasElement>('#wap-screen');
  const textarea = document.querySelector<HTMLTextAreaElement>('#deck-input');
  const reloadButton = document.querySelector<HTMLButtonElement>('#reload-deck');
  const status = document.querySelector<HTMLParagraphElement>('#status');

  if (!canvas || !textarea || !reloadButton || !status) {
    throw new Error('Host sample DOM not found');
  }

  textarea.value = SAMPLE_WML;

  const host = await bootWmlEngine(canvas, textarea.value);
  status.textContent = `Loaded. Active card: ${host.getEngine().activeCardId()}`;

  reloadButton.addEventListener('click', () => {
    try {
      host.loadDeck(textarea.value);
      status.textContent = `Deck reloaded. Active card: ${host.getEngine().activeCardId()}`;
    } catch (error) {
      status.textContent = `Load error: ${String(error)}`;
    }
  });
}

main().catch((error) => {
  const status = document.querySelector<HTMLParagraphElement>('#status');
  if (status) {
    status.textContent = `Boot error: ${String(error)}`;
  }
});
