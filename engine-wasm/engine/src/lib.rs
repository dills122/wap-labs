//! WaveNav/Wavescript engine crate.
//!
//! Public API is exported through [`WmlEngine`] with `wasm_bindgen` so host
//! shells can load decks, drive input, invoke scripts, and read runtime state.
//! Use `cargo doc --no-deps` from `engine-wasm/engine` to generate API docs.

use std::collections::HashMap;

#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
use wasm_bindgen::prelude::*;

#[cfg(feature = "contract-codegen")]
pub mod contract_codegen;
mod engine_debug_contract;
mod engine_debug_recorder;
mod engine_public_api;
mod engine_runtime_internal;
mod engine_script_types;
mod engine_wasm_bindings;
mod engine_wml_types;
mod layout;
mod nav;
mod parser;
mod render;
mod runtime;
mod wavescript;

#[cfg(test)]
mod engine_tests;

use layout::flow_layout::{layout_card, layout_card_with_limits, FocusTarget};
use nav::focus::{clamp_focus, move_focus_down, move_focus_up};
use parser::wml_parser::parse_wml_report_for_content_type;
use runtime::card::CardTaskAction;
use runtime::deck::Deck;
use runtime::events::{
    ScriptDialogRequest, ScriptNavigationIntent, ScriptRuntimeEffects, ScriptTimerRequest,
};
use wavescript::decoder::{decode_compilation_unit, DecodeError};
use wavescript::stdlib::wmlbrowser::WmlBrowserHost;
use wavescript::value::ScriptValue;
use wavescript::vm::{Vm, VmTrap};
use wavescript::wap_runtime::{execute_named_function, WapRuntimeError};

#[cfg(feature = "contract-codegen")]
pub use engine_debug_contract::{
    engine_debug_typescript_contract, ENGINE_DEBUG_CONNECTOR_TS_INTERFACE,
};
pub use engine_debug_contract::{
    EngineDebugBufferSnapshot, EngineDebugCapabilities, EngineDebugCloseSessionOutcome,
    EngineDebugCloseSessionRequest, EngineDebugCloseSessionResult, EngineDebugCollectionSummary,
    EngineDebugError, EngineDebugErrorCode, EngineDebugEvent, EngineDebugEventBatch,
    EngineDebugEventKind, EngineDebugEventPayload, EngineDebugExternalNavigationSnapshot,
    EngineDebugMaskingPolicy, EngineDebugNamedValue, EngineDebugOpenSessionOutcome,
    EngineDebugOpenSessionRequest, EngineDebugPollEventsOutcome, EngineDebugPollEventsRequest,
    EngineDebugPostfieldResolution, EngineDebugPostfieldResolutionSource,
    EngineDebugRedactionReason, EngineDebugSession, EngineDebugSnapshot,
    EngineDebugSnapshotOutcome, EngineDebugSnapshotRequest, EngineDebugTimerSnapshot,
    EngineDebugTimestampKind, EngineDebugValue, ENGINE_DEBUG_DEFAULT_MAX_EVENTS_PER_POLL,
    ENGINE_DEBUG_EVENT_BUFFER_CAPACITY, ENGINE_DEBUG_MAX_EVENTS_PER_POLL,
    ENGINE_DEBUG_MAX_SNAPSHOT_TIMERS, ENGINE_DEBUG_MAX_SNAPSHOT_VARIABLES,
    ENGINE_DEBUG_MAX_TEXT_BYTES, ENGINE_DEBUG_PROTOCOL_VERSION, ENGINE_DEBUG_SESSION_LIMIT,
};
pub use engine_script_types::{
    EngineTraceEntry, ScriptCallArgLiteral, ScriptDialogRequestLiteral, ScriptErrorCategoryLiteral,
    ScriptErrorClassLiteral, ScriptExecutionOutcome, ScriptInvocationOutcome,
    ScriptNavigationCacheControlPolicyLiteral, ScriptNavigationIntentLiteral,
    ScriptNavigationMethodLiteral, ScriptNavigationPostContextLiteral,
    ScriptNavigationPostFieldLiteral, ScriptNavigationRequestIntentLiteral,
    ScriptNavigationRequestPolicyLiteral, ScriptTimerRequestLiteral, ScriptValueLiteral,
    SCRIPT_ERROR_CATEGORY_METADATA,
};
pub use engine_wml_types::{
    WmlLoadDiagnostic, WmlLoadDiagnosticClassLiteral, WmlLoadDiagnosticCodeLiteral,
    WmlLoadDiagnosticOutcomeLiteral,
};
use render::frame::EngineRenderLimits;
#[cfg(feature = "contract-codegen")]
pub use render::frame::{
    engine_render_limits_typescript_contract, engine_viewport_typescript_contract,
};
pub use render::frame::{
    EngineAffordance, EngineAffordanceSource, EngineCardDisplayMetadata, EngineControlAssociation,
    EngineDeckDisplayMetadata, EngineFocusState, EngineFocusTargetKind, EngineFrameRow,
    EngineFrameSegment, EngineHitRegion, EngineInputEvent, EngineInputKey, EnginePresentationFrame,
    EngineRenderError, EngineRenderOutput, EngineRenderResource, EngineSelectionState,
    EngineViewport, EngineViewportError, ENGINE_FRAME_CONTRACT_VERSION, ENGINE_FRAME_PROFILE_ID,
    ENGINE_MAX_DRAW_COMMANDS, ENGINE_MAX_LAYOUT_ROWS, ENGINE_MAX_LAYOUT_SEGMENTS,
    ENGINE_MAX_SERIALIZED_RENDER_BYTES, ENGINE_VIEWPORT_MAX_COLS, ENGINE_VIEWPORT_MIN_COLS,
};

#[cfg(feature = "render-test-instrumentation")]
pub use layout::flow_layout::{layout_pass_count, reset_layout_pass_count};
pub use render::render_list::{DrawCmd, RenderList};
pub use wavescript::wap_decoder::{
    decode_wap_compilation_unit, WapCompilationUnit, WapConstant, WapDecodeError, WapFunction,
    WapFunctionName, WapInstruction, WapPragma, MAX_WAP_COMPILATION_UNIT_BYTES,
    MAX_WAP_OPERAND_STACK_DEPTH, WAP_BYTECODE_VERSION,
};

#[cfg(test)]
pub(crate) use engine_runtime_internal::{parse_script_href, ParsedScriptRef};
#[cfg(test)]
pub(crate) use engine_script_types::{classify_vm_trap, classify_vm_trap_category};
pub(crate) use engine_script_types::{
    classify_vm_trap_outcome, convert_script_call_args, format_decode_error, is_valid_var_name,
    script_dialog_request_to_literal, script_nav_intent_to_literal,
    script_timer_request_to_literal, script_value_to_literal,
};

const DEFAULT_VIEWPORT_COLS: usize = 20;
const MAX_TRACE_ENTRIES: usize = 256;
const MAX_TIMER_DISPATCH_DEPTH: u8 = 8;
const MAX_NAV_DISPATCH_DEPTH: u8 = 8;
const MAX_DECK_WML_XML_BYTES: usize = 512 * 1024;
const MAX_DECK_RAW_BYTES_BASE64_BYTES: usize = 1024 * 1024;
const CARD_ID_NOT_FOUND_ERROR: &str = "Card id not found";
const CONTAINED_ENGINE_PANIC_ERROR: &str = "engine: internal panic contained";
#[cfg(test)]
const PANIC_BOUNDARY_TEST_WML: &str = "<!-- test-only engine panic boundary probe -->";

/// Panic-containment boundary for public engine entrypoints.
///
/// Native targets use [`std::panic::catch_unwind`]. The shipping
/// `wasm32-unknown-unknown` target cannot unwind on stable Rust, so its
/// implementation calls `f` through a small JavaScript re-entry boundary and
/// converts the resulting WebAssembly trap into the same deterministic error.
///
/// Mutating entrypoints invoke this boundary only against a cloned candidate
/// engine and commit the candidate after `f` returns. A panic therefore never
/// exposes partially-mutated live state, including on wasm where aborting a
/// nested callback does not run that callback's Rust destructors.
#[cfg(not(target_arch = "wasm32"))]
pub(crate) fn catch_engine_panic<T: 'static>(f: impl FnMut() -> T + 'static) -> Result<T, String> {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(f))
        .map_err(|_| CONTAINED_ENGINE_PANIC_ERROR.to_string())
}

#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
#[wasm_bindgen(inline_js = r#"
export function wavenavCatchEngineTrap(callback) {
    try {
        callback();
        return false;
    } catch (_) {
        return true;
    }
}
"#)]
extern "C" {
    #[wasm_bindgen(js_name = wavenavCatchEngineTrap)]
    fn catch_engine_trap(callback: &wasm_bindgen::JsValue) -> bool;
}

#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
pub(crate) fn catch_engine_panic<T: 'static>(
    mut f: impl FnMut() -> T + 'static,
) -> Result<T, String> {
    use std::cell::RefCell;
    use std::rc::Rc;
    use wasm_bindgen::closure::Closure;

    let output = Rc::new(RefCell::new(None));
    let callback_output = Rc::clone(&output);
    let callback = Closure::wrap(Box::new(move || {
        callback_output.borrow_mut().replace(f());
    }) as Box<dyn FnMut()>);

    let trapped = catch_engine_trap(callback.as_ref());
    drop(callback);
    if trapped {
        return Err(CONTAINED_ENGINE_PANIC_ERROR.to_string());
    }

    let result = output
        .borrow_mut()
        .take()
        .ok_or_else(|| "engine: panic boundary callback did not run".to_string());
    result
}

#[derive(Clone, Debug)]
struct CardTimerState {
    card_idx: usize,
    remaining_ms: u32,
    name: Option<String>,
    ontimer_action: Option<CardTaskAction>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct InputEditState {
    control_id: String,
    input_name: String,
    original_value: String,
    draft_value: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct SelectEditState {
    select_name: String,
    draft_index: usize,
}

/// Host-authored relationship between the active browser context and a deck
/// being loaded. The transport remains outside the runtime; this value only
/// selects the WML context and card-entry semantics applied after parsing.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum DeckNavigationKind {
    /// A bookmark, URL entry, or other navigation independent of the current
    /// WML content establishes a fresh browser context.
    #[default]
    Independent,
    /// A WML `go` crossing a deck boundary preserves the current context and
    /// enters the destination through `onenterforward` processing.
    Forward,
    /// A host-history pop preserves the current context and enters the
    /// destination through `onenterbackward` processing.
    Backward,
    /// Re-fetch the current request without changing context or history.
    Reload,
}

/// Host-resolved URLs and relationship used when loading a fetched deck into
/// the active WML browser context.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DeckNavigationContext<'a> {
    referring_url: Option<&'a str>,
    navigation_url: Option<&'a str>,
    kind: DeckNavigationKind,
}

impl<'a> DeckNavigationContext<'a> {
    /// Describe how the fetched deck relates to the current browser context.
    pub fn new(
        referring_url: Option<&'a str>,
        navigation_url: Option<&'a str>,
        kind: DeckNavigationKind,
    ) -> Self {
        Self {
            referring_url,
            navigation_url,
            kind,
        }
    }
}

#[derive(Clone)]
#[cfg_attr(all(feature = "wasm-bindings", target_arch = "wasm32"), wasm_bindgen)]
pub struct WmlEngine {
    deck: Option<Deck>,
    active_card_idx: usize,
    nav_stack: Vec<usize>,
    focused_link_idx: usize,
    external_nav_intent: Option<String>,
    external_nav_request_policy: Option<ScriptNavigationRequestPolicyLiteral>,
    viewport_cols: usize,
    base_url: String,
    content_type: String,
    raw_bytes_base64: Option<String>,
    vars: HashMap<String, String>,
    script_units: HashMap<String, Vec<u8>>,
    script_entrypoints: HashMap<String, HashMap<String, usize>>,
    pending_script_effects: ScriptRuntimeEffects,
    last_script_outcome: Option<ScriptExecutionOutcome>,
    last_script_dialog_requests: Vec<ScriptDialogRequest>,
    last_script_timer_requests: Vec<ScriptTimerRequest>,
    trace_entries: Vec<EngineTraceEntry>,
    next_trace_seq: u64,
    timer_dispatch_depth: u8,
    nav_dispatch_depth: u8,
    active_timer: Option<CardTimerState>,
    active_input_edit: Option<InputEditState>,
    active_select_edit: Option<SelectEditState>,
    last_back_navigation_handled: bool,
    last_wml_load_diagnostics: Vec<WmlLoadDiagnostic>,
    browser_context_epoch: u32,
    history_push_sequence: u32,
    debug_recorder: Option<engine_debug_recorder::EngineDebugRecorder>,
}

impl Default for WmlEngine {
    fn default() -> Self {
        Self::new()
    }
}
