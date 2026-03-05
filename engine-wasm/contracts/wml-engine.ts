export type EngineKey = 'up' | 'down' | 'enter';

export interface WmlDeckInput {
  // Normalized textual WML payload passed into engine runtime.
  wmlXml: string;
  // Resolved document URL used for fragment and relative navigation resolution.
  baseUrl: string;
  // Normalized source media-type metadata from transport handoff.
  contentType: string;
  // Optional raw source payload bytes (base64) for diagnostics and parity checks.
  rawBytesBase64?: string;
}

export type ScriptCallSite =
  | 'softkey-do'
  | 'intrinsic-onevent'
  | 'ontimer'
  | 'onenterforward'
  | 'onenterbackward'
  | 'onpick';

// Script invocation metadata passed from runtime-owned action/event plumbing.
// This shape is runtime-centric and does not encode host-specific policy semantics.
export interface ScriptInvocationContext {
  callSite: ScriptCallSite;
  cardId: string;
  sourceHref?: string;
}

export interface ScriptInvocationRef {
  src: string;
  functionName: string;
  context: ScriptInvocationContext;
  args: ScriptValueLiteral[];
}

export type ScriptValueLiteral = boolean | number | string | { invalid: true };

export type ScriptNavigationIntent =
  | { type: 'none' }
  | { type: 'go'; href: string; requestPolicy?: WmlGoRequestPolicy }
  | { type: 'prev' };

export type WmlGoCacheControlPolicy = 'default' | 'no-cache';

export interface WmlGoPostContext {
  sameDeck?: boolean;
  contentType?: string;
  payload?: string;
}

export interface WmlGoRequestPolicy {
  cacheControl?: WmlGoCacheControlPolicy;
  refererUrl?: string;
  postContext?: WmlGoPostContext;
}

// Runtime applies script side effects at deterministic post-invocation boundaries.
export interface ScriptPostInvocationEffects {
  navigationIntent: ScriptNavigationIntent;
  requiresRefresh: boolean;
}

export type ScriptDialogRequest =
  | { type: 'alert'; message: string }
  | { type: 'confirm'; message: string }
  | { type: 'prompt'; message: string; defaultValue?: string };

export type ScriptTimerRequest =
  | { type: 'schedule'; delayMs: number; token?: string }
  | { type: 'cancel'; token: string };

export interface ScriptInvocationOutcome {
  effects: ScriptPostInvocationEffects;
  result: ScriptValueLiteral;
}

export interface ScriptExecutionOutcome {
  ok: boolean;
  result: ScriptValueLiteral;
  trap?: string;
  errorClass: 'none' | 'non-fatal' | 'fatal';
  errorCategory: 'none' | 'computational' | 'integrity' | 'resource' | 'host-binding';
  invocationAborted: boolean;
  effects: ScriptPostInvocationEffects;
}

// Host capabilities are side-effect adapters only; they do not define script semantics.
export interface ScriptHostCapabilities {
  dialogs?: {
    alert(message: string): void;
    confirm(message: string): boolean;
    prompt(message: string, defaultValue?: string): string | undefined;
  };
  timers?: {
    schedule(delayMs: number, token?: string): void;
    cancel(token: string): void;
  };
  scriptFetch?: {
    fetchUnit(src: string): Promise<Uint8Array>;
  };
}

export interface EngineTraceEntry {
  seq: number;
  kind: string;
  detail: string;
  active_card_id?: string;
  focused_link_index: number;
  external_navigation_intent?: string;
  script_ok?: boolean;
  script_error_class?: 'none' | 'non-fatal' | 'fatal';
  script_error_category?: 'none' | 'computational' | 'integrity' | 'resource' | 'host-binding';
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
  advanceTimeMs(deltaMs: number): void;
  navigateToCard(id: string): void;
  navigateBack(): boolean;
  setViewportCols(cols: number): void;
  activeCardId(): string;
  focusedLinkIndex(): number;
  baseUrl(): string;
  contentType(): string;
  getVar(name: string): string | undefined;
  setVar(name: string, value: string): boolean;
  externalNavigationIntent(): string | undefined;
  clearExternalNavigationIntent(): void;
  executeScriptUnit(bytes: Uint8Array): ScriptExecutionOutcome;
  registerScriptUnit(src: string, bytes: Uint8Array): void;
  clearScriptUnits(): void;
  registerScriptEntryPoint(src: string, functionName: string, entryPc: number): void;
  clearScriptEntryPoints(): void;
  invokeScriptRef(src: string): ScriptInvocationOutcome;
  invokeScriptRefFunction(src: string, functionName: string): ScriptInvocationOutcome;
  invokeScriptRefCall(
    src: string,
    functionName: string,
    args: ScriptValueLiteral[]
  ): ScriptInvocationOutcome;
  executeScriptRef(src: string): ScriptExecutionOutcome;
  executeScriptRefFunction(src: string, functionName: string): ScriptExecutionOutcome;
  executeScriptRefCall(
    src: string,
    functionName: string,
    args: ScriptValueLiteral[]
  ): ScriptExecutionOutcome;
  lastScriptExecutionTrap(): string | undefined;
  lastScriptExecutionOk(): boolean | undefined;
  lastScriptExecutionErrorClass(): 'none' | 'non-fatal' | 'fatal' | undefined;
  lastScriptExecutionErrorCategory():
    | 'none'
    | 'computational'
    | 'integrity'
    | 'resource'
    | 'host-binding'
    | undefined;
  lastScriptRequiresRefresh(): boolean | undefined;
  lastScriptDialogRequests(): ScriptDialogRequest[];
  lastScriptTimerRequests(): ScriptTimerRequest[];
  traceEntries(): EngineTraceEntry[];
  clearTraceEntries(): void;
}

export interface WmlEngineNative {
  loadDeck(xml: string): void;
  loadDeckContext(input: WmlDeckInput): void;
  render(): RenderList;
  handleKey(key: EngineKey): void;
  advanceTimeMs(deltaMs: number): void;
  navigateToCard(id: string): void;
  navigateBack(): boolean;
  setViewportCols(cols: number): void;
  activeCardId(): string;
  focusedLinkIndex(): number;
  baseUrl(): string;
  contentType(): string;
  getVar(name: string): string | undefined;
  setVar(name: string, value: string): boolean;
  externalNavigationIntent(): string | undefined;
  clearExternalNavigationIntent(): void;
  executeScriptUnit(bytes: Uint8Array): ScriptExecutionOutcome;
  registerScriptUnit(src: string, bytes: Uint8Array): void;
  clearScriptUnits(): void;
  registerScriptEntryPoint(src: string, functionName: string, entryPc: number): void;
  clearScriptEntryPoints(): void;
  invokeScriptRef(src: string): ScriptInvocationOutcome;
  invokeScriptRefFunction(src: string, functionName: string): ScriptInvocationOutcome;
  invokeScriptRefCall(
    src: string,
    functionName: string,
    args: ScriptValueLiteral[]
  ): ScriptInvocationOutcome;
  executeScriptRef(src: string): ScriptExecutionOutcome;
  executeScriptRefFunction(src: string, functionName: string): ScriptExecutionOutcome;
  executeScriptRefCall(
    src: string,
    functionName: string,
    args: ScriptValueLiteral[]
  ): ScriptExecutionOutcome;
  lastScriptExecutionTrap(): string | undefined;
  lastScriptExecutionOk(): boolean | undefined;
  lastScriptExecutionErrorClass(): 'none' | 'non-fatal' | 'fatal' | undefined;
  lastScriptExecutionErrorCategory():
    | 'none'
    | 'computational'
    | 'integrity'
    | 'resource'
    | 'host-binding'
    | undefined;
  lastScriptRequiresRefresh(): boolean | undefined;
  lastScriptDialogRequests(): ScriptDialogRequest[];
  lastScriptTimerRequests(): ScriptTimerRequest[];
  traceEntries(): EngineTraceEntry[];
  clearTraceEntries(): void;
}

export interface WmlEngineCompatibilityRules {
  behaviorParityRequired: true;
  renderOutputParityRequired: true;
  navigationParityRequired: true;
  scriptInvocationParityRequired: true;
}
