import type {
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

export type {
  DrawCmd,
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

// --- Debug connector contract (D0-01: additive, contract-only) ---
//
// See `docs/waves/ENGINE_DEBUG_CONNECTOR_PLAN.md` for the full design and
// `docs/waves/ENGINE_DEBUG_CONNECTOR_RESEARCH.md` for the rationale behind
// the choices below. No engine crate Rust types back these yet (that is
// `D0-02`), so unlike the rest of this file's imports these are hand-authored
// here rather than generated from `./generated/runtime-dtos`.

export type EngineDebugEventKind =
  | 'deck.load'
  | 'card.enter'
  | 'card.exit'
  | 'focus.change'
  | 'input.edit.start'
  | 'input.edit.draft'
  | 'input.edit.commit'
  | 'input.edit.cancel'
  | 'action.accept'
  | 'action.external'
  | 'nav.intent'
  | 'postfield.resolve'
  | 'script.invoke'
  | 'script.trap'
  | 'timer.schedule'
  | 'timer.fire'
  | 'timer.cancel';

// Flat, JSON-serializable payload dict. Exact per-kind fields are deferred to
// `D0-02` once real emission points exist, with one deliberate exception:
// `postfield.resolve` events must include a `source` field with one of
// `'var' | 'draft' | 'card' | 'fallback'` (the single highest-value detail
// for form-submit triage per the research doc).
export type EngineDebugEventPayload = Record<string, string | number | boolean | undefined>;

export interface EngineDebugEvent {
  // Monotonic per-engine-process sequence number; the ordering source of
  // truth. `tsMs` is for operator context only, never for correctness.
  seq: number;
  kind: EngineDebugEventKind;
  tsMs: number;
  cardId?: string;
  payload: EngineDebugEventPayload;
}

export interface EngineDebugFormFieldStateSummary {
  name: string;
  masked: boolean;
  value?: string;
}

export interface EngineDebugTimerStateSummary {
  scheduledCount: number;
  nextFireDelayMs?: number;
}

export interface EngineDebugBufferMetadata {
  oldestSeq?: number;
  latestSeq?: number;
  droppedCount: number;
}

// MVP read-only snapshot surface. Sensitive fields (focused input value,
// runtime vars) are masked at the engine boundary per the masking policy in
// `ENGINE_DEBUG_CONNECTOR_PLAN.md`; this contract does not distinguish masked
// from unmasked payloads beyond the `masked` flag on each summarized field.
export interface EngineDebugSnapshot {
  activeCardId?: string;
  focusedLinkIndex: number;
  focusedInputEditName?: string;
  focusedInputEditValue?: string;
  formState: EngineDebugFormFieldStateSummary[];
  runtimeVars: EngineDebugFormFieldStateSummary[];
  externalNavigationIntent?: string;
  externalNavigationRequestPolicy?: WmlGoRequestPolicy;
  timerState: EngineDebugTimerStateSummary;
  bufferMetadata: EngineDebugBufferMetadata;
  viewportCols: number;
  baseUrl: string;
  contentType: string;
}

export type EngineDebugMaskingPolicy = 'masked' | 'unmasked';

export interface EngineDebugCapabilities {
  supportsSnapshots: boolean;
  supportsPolling: boolean;
  masking: EngineDebugMaskingPolicy;
  supportsUnmaskSensitive: boolean;
}

export interface EngineDebugEventBatch {
  events: EngineDebugEvent[];
  nextSeq: number;
  droppedCount: number;
}

// Engine-owned debug primitives. Deliberately NOT part of `WmlEngineCommon`:
// this surface is additive/optional and unimplemented until `D0-02`, so it
// must not be required by every native/WASM target today. Once implemented,
// `WmlEngineCompatibilityRules`-style parity applies here too — both targets
// must expose identical event ordering and snapshot content.
export interface WmlEngineDebugSurface {
  debugSnapshot(): EngineDebugSnapshot;
  debugEvents(sinceSeq: number, maxEvents: number): EngineDebugEventBatch;
}
