export type EngineKey = 'up' | 'down' | 'enter';

export interface WmlDeckInput {
  wmlXml: string;
  baseUrl: string;
  contentType: string;
  rawBytesBase64?: string;
}

export type ScriptCallSite =
  | 'softkey-do'
  | 'intrinsic-onevent'
  | 'ontimer'
  | 'onenterforward'
  | 'onenterbackward'
  | 'onpick';

export interface ScriptInvocationRef {
  src: string;
  functionName: string;
  callSite: ScriptCallSite;
  args: ScriptValueLiteral[];
}

export type ScriptValueLiteral = boolean | number | string | { invalid: true };

export type ScriptNavigationIntent =
  | { type: 'none' }
  | { type: 'go'; href: string }
  | { type: 'prev' };

export interface ScriptInvocationOutcome {
  navigationIntent: ScriptNavigationIntent;
  requiresRefresh: boolean;
  result: ScriptValueLiteral;
}

export interface ScriptExecutionOutcome {
  ok: boolean;
  result: ScriptValueLiteral;
  trap?: string;
}

export interface EngineTraceEntry {
  seq: number;
  kind: string;
  detail: string;
  active_card_id?: string;
  focused_link_index: number;
  external_navigation_intent?: string;
  script_ok?: boolean;
  script_trap?: string;
}

export interface RenderList {
  draw: DrawCmd[];
}

export type DrawCmd = DrawText | DrawLink;

export interface DrawText {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

export interface DrawLink {
  type: 'link';
  x: number;
  y: number;
  text: string;
  focused: boolean;
  href: string;
}

export interface WmlEngineWasm {
  loadDeck(xml: string): void;
  loadDeckContext(
    wmlXml: string,
    baseUrl: string,
    contentType: string,
    rawBytesBase64?: string
  ): void;
  render(): RenderList;
  handleKey(key: EngineKey): void;
  navigateToCard(id: string): void;
  navigateBack(): boolean;
  setViewportCols(cols: number): void;
  activeCardId(): string;
  focusedLinkIndex(): number;
  baseUrl(): string;
  contentType(): string;
  externalNavigationIntent(): string | undefined;
  clearExternalNavigationIntent(): void;
  executeScriptUnit(bytes: Uint8Array): ScriptExecutionOutcome;
  registerScriptUnit(src: string, bytes: Uint8Array): void;
  clearScriptUnits(): void;
  registerScriptEntryPoint(src: string, functionName: string, entryPc: number): void;
  clearScriptEntryPoints(): void;
  executeScriptRef(src: string): ScriptExecutionOutcome;
  executeScriptRefFunction(src: string, functionName: string): ScriptExecutionOutcome;
  executeScriptRefCall(
    src: string,
    functionName: string,
    args: ScriptValueLiteral[]
  ): ScriptExecutionOutcome;
  lastScriptExecutionTrap(): string | undefined;
  lastScriptExecutionOk(): boolean | undefined;
  traceEntries(): EngineTraceEntry[];
  clearTraceEntries(): void;
}
