import type {
  EngineDebugCloseSessionOutcome,
  EngineDebugCloseSessionRequest,
  EngineDebugConnector,
  EngineDebugEvent,
  EngineDebugOpenSessionOutcome,
  EngineDebugOpenSessionRequest,
  EngineDebugPollEventsOutcome,
  EngineDebugPollEventsRequest,
  EngineDebugSnapshot,
  EngineDebugSnapshotOutcome,
  EngineDebugSnapshotRequest,
  EngineTraceEntry,
  RenderList,
  ScriptCallArgLiteral,
  ScriptDialogRequest,
  ScriptErrorCategory,
  ScriptErrorClass,
  ScriptExecutionOutcome,
  ScriptInvocationOutcome,
  ScriptTimerRequest,
  WmlGoRequestPolicy,
  WmlLoadDiagnostic
} from './generated/runtime-dtos';

export { ENGINE_DEBUG_CONTRACT_BASELINE } from './generated/runtime-dtos';

export type {
  DrawCmd,
  EngineDebugBufferSnapshot,
  EngineDebugCapabilities,
  EngineDebugCloseSessionOutcome,
  EngineDebugCloseSessionRequest,
  EngineDebugCloseSessionResult,
  EngineDebugCollectionSummary,
  EngineDebugConnector,
  EngineDebugError,
  EngineDebugErrorCode,
  EngineDebugEvent,
  EngineDebugEventBatch,
  EngineDebugEventKind,
  EngineDebugEventPayload,
  EngineDebugExternalNavigationSnapshot,
  EngineDebugMaskingPolicy,
  EngineDebugNamedValue,
  EngineDebugOpenSessionOutcome,
  EngineDebugOpenSessionRequest,
  EngineDebugPollEventsOutcome,
  EngineDebugPollEventsRequest,
  EngineDebugPostfieldResolution,
  EngineDebugPostfieldResolutionSource,
  EngineDebugRedactionReason,
  EngineDebugSession,
  EngineDebugSnapshot,
  EngineDebugSnapshotOutcome,
  EngineDebugSnapshotRequest,
  EngineDebugTimerSnapshot,
  EngineDebugTimestampKind,
  EngineDebugValue,
  EngineTraceEntry,
  RenderList,
  ScriptCallArgLiteral,
  ScriptDialogRequest,
  ScriptErrorCategory,
  ScriptErrorClass,
  ScriptExecutionOutcome,
  ScriptInvocationOutcome,
  ScriptNavigationIntent,
  ScriptTimerRequest,
  ScriptValueLiteral,
  WmlGoCacheControlPolicy,
  WmlGoPostContext,
  WmlGoRequestPolicy,
  WmlLoadDiagnostic,
  WmlLoadDiagnosticClass,
  WmlLoadDiagnosticCode,
  WmlLoadDiagnosticOutcome
} from './generated/runtime-dtos';

// The debug connector is a separate, host-owned session broker contract.
// It is intentionally not part of WmlEngineCommon: D0-01 defines DTOs and
// lifecycle sequencing only, while D0-02 and D0-03 retain engine-recording and
// browser-host implementation ownership respectively.
export type WmlEngineDebugConnector = EngineDebugConnector;
export type WmlEngineDebugEvent = EngineDebugEvent;
export type WmlEngineDebugSnapshot = EngineDebugSnapshot;
export type WmlEngineDebugOpen = (
  request: EngineDebugOpenSessionRequest
) => Promise<EngineDebugOpenSessionOutcome>;
export type WmlEngineDebugPoll = (
  request: EngineDebugPollEventsRequest
) => Promise<EngineDebugPollEventsOutcome>;
export type WmlEngineDebugGetSnapshot = (
  request: EngineDebugSnapshotRequest
) => Promise<EngineDebugSnapshotOutcome>;
export type WmlEngineDebugClose = (
  request: EngineDebugCloseSessionRequest
) => Promise<EngineDebugCloseSessionOutcome>;

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
  // Referring deck URI supplied by the host for destination access checks.
  referringUrl?: string;
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
  args: ScriptCallArgLiteral[];
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

// Target-agnostic engine surface. Every method here must behave identically on
// the WASM and native targets (see `WmlEngineCompatibilityRules`); only the
// `loadDeckContext` argument shape is allowed to diverge, and that divergence
// lives in the two target interfaces below.
export interface WmlEngineCommon {
  loadDeck(xml: string): void;
  // A rejected load preserves prior runtime state and publishes one diagnostic.
  // A successful load replaces this list with ordered ignored/recoverable warnings.
  lastWmlLoadDiagnostics(): WmlLoadDiagnostic[];
  render(): RenderList;
  handleKey(key: EngineKey): void;
  advanceTimeMs(deltaMs: number): void;
  navigateToCard(id: string): void;
  navigateBack(): boolean;
  // Reports whether the most recent BACK activation was consumed by either
  // an effective WML `do type="prev"` binding or intrinsic history fallback.
  lastBackNavigationHandled(): boolean;
  setViewportCols(cols: number): void;
  activeCardId(): string;
  focusedLinkIndex(): number;
  baseUrl(): string;
  contentType(): string;
  deckLanguage(): string | undefined;
  activeCardLanguage(): string | undefined;
  getVar(name: string): string | undefined;
  setVar(name: string, value: string): boolean;
  beginFocusedInputEdit(): boolean;
  setFocusedInputEditDraft(value: string): boolean;
  commitFocusedInputEdit(): boolean;
  cancelFocusedInputEdit(): boolean;
  focusedInputEditName(): string | undefined;
  focusedInputEditValue(): string | undefined;
  beginFocusedSelectEdit(): boolean;
  moveFocusedSelectEdit(delta: number): boolean;
  commitFocusedSelectEdit(): boolean;
  cancelFocusedSelectEdit(): boolean;
  focusedSelectEditName(): string | undefined;
  focusedSelectEditValue(): string | undefined;
  externalNavigationIntent(): string | undefined;
  externalNavigationRequestPolicy(): WmlGoRequestPolicy | undefined;
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
    args: ScriptCallArgLiteral[]
  ): ScriptInvocationOutcome;
  executeScriptRef(src: string): ScriptExecutionOutcome;
  executeScriptRefFunction(src: string, functionName: string): ScriptExecutionOutcome;
  executeScriptRefCall(
    src: string,
    functionName: string,
    args: ScriptCallArgLiteral[]
  ): ScriptExecutionOutcome;
  lastScriptExecutionTrap(): string | undefined;
  lastScriptExecutionOk(): boolean | undefined;
  lastScriptExecutionErrorClass(): ScriptErrorClass | undefined;
  lastScriptExecutionErrorCategory(): ScriptErrorCategory | undefined;
  lastScriptRequiresRefresh(): boolean | undefined;
  lastScriptDialogRequests(): ScriptDialogRequest[];
  lastScriptTimerRequests(): ScriptTimerRequest[];
  traceEntries(): EngineTraceEntry[];
  clearTraceEntries(): void;
}

// WASM target: `loadDeckContext` takes positional arguments because the
// wasm-bindgen boundary does not carry a structured input object.
export interface WmlEngineWasm extends WmlEngineCommon {
  loadDeckContext(
    wmlXml: string,
    baseUrl: string,
    contentType: string,
    rawBytesBase64?: string,
    referringUrl?: string
  ): void;
}

// Native target: `loadDeckContext` takes the structured `WmlDeckInput`.
export interface WmlEngineNative extends WmlEngineCommon {
  loadDeckContext(input: WmlDeckInput): void;
}

export interface WmlEngineCompatibilityRules {
  behaviorParityRequired: true;
  renderOutputParityRequired: true;
  navigationParityRequired: true;
  scriptInvocationParityRequired: true;
}
