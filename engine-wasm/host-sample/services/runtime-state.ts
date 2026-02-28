import type { EngineSnapshot } from '../renderer';

export function renderRuntimeState(element: HTMLPreElement, snapshot: EngineSnapshot): void {
  element.textContent = [
    `activeCardId: ${snapshot.activeCardId}`,
    `focusedLinkIndex: ${snapshot.focusedLinkIndex}`,
    `baseUrl: ${snapshot.baseUrl}`,
    `contentType: ${snapshot.contentType}`,
    `externalNavigationIntent: ${snapshot.externalNavigationIntent ?? '(none)'}`
  ].join('\n');
}
