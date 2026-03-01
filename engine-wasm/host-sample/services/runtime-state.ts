import type { EngineSnapshot } from '../renderer';

export function renderRuntimeState(element: HTMLPreElement, snapshot: EngineSnapshot): void {
  element.textContent = [
    `activeCardId: ${snapshot.activeCardId}`,
    `focusedLinkIndex: ${snapshot.focusedLinkIndex}`,
    `baseUrl: ${snapshot.baseUrl}`,
    `contentType: ${snapshot.contentType}`,
    `nextCardVar: ${snapshot.nextCardVar ?? '(none)'}`,
    `externalNavigationIntent: ${snapshot.externalNavigationIntent ?? '(none)'}`,
    `lastScriptExecutionOk: ${snapshot.lastScriptExecutionOk ?? '(none)'}`,
    `lastScriptExecutionTrap: ${snapshot.lastScriptExecutionTrap ?? '(none)'}`,
    `lastScriptRequiresRefresh: ${snapshot.lastScriptRequiresRefresh ?? '(none)'}`
  ].join('\n');
}
