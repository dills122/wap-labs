import type {
  EngineKey,
  RenderList,
  ScriptDialogRequest,
  ScriptTimerRequest,
  WmlDeckInput
} from '../../engine-wasm/contracts/wml-engine';

export interface EngineRuntimeSnapshot {
  activeCardId?: string;
  focusedLinkIndex: number;
  baseUrl: string;
  contentType: string;
  externalNavigationIntent?: string;
  lastScriptExecutionOk?: boolean;
  lastScriptExecutionTrap?: string;
  lastScriptExecutionErrorClass?: 'none' | 'non-fatal' | 'fatal';
  lastScriptRequiresRefresh?: boolean;
  lastScriptDialogRequests?: ScriptDialogRequest[];
  lastScriptTimerRequests?: ScriptTimerRequest[];
}

export interface EngineHostClient {
  loadDeck(input: { wmlXml: string }): Promise<EngineRuntimeSnapshot>;
  loadDeckContext(input: WmlDeckInput): Promise<EngineRuntimeSnapshot>;
  render(): Promise<RenderList>;
  handleKey(input: { key: EngineKey }): Promise<EngineRuntimeSnapshot>;
  navigateToCard(input: { cardId: string }): Promise<EngineRuntimeSnapshot>;
  navigateBack(): Promise<EngineRuntimeSnapshot>;
  setViewportCols(input: { cols: number }): Promise<EngineRuntimeSnapshot>;
  snapshot(): Promise<EngineRuntimeSnapshot>;
  clearExternalNavigationIntent(): Promise<EngineRuntimeSnapshot>;
}
