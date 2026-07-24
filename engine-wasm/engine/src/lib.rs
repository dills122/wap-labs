//! WaveNav/Wavescript engine crate.
//!
//! Public API is exported through [`WmlEngine`] with `wasm_bindgen` so host
//! shells can load decks, drive input, invoke scripts, and read runtime state.
//! Use `cargo doc --no-deps` from `engine-wasm/engine` to generate API docs.

use std::collections::HashMap;

#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
use wasm_bindgen::prelude::*;

mod engine_public_api;
mod engine_runtime_internal;
mod engine_script_types;
mod engine_wasm_bindings;
mod layout;
mod nav;
mod parser;
mod render;
mod runtime;
#[allow(dead_code)]
mod wavescript;

#[cfg(test)]
mod engine_tests;

use layout::flow_layout::{layout_card, FocusTarget};
use nav::focus::{clamp_focus, move_focus_down, move_focus_up};
use parser::wml_parser::parse_wml;
use runtime::card::CardTaskAction;
use runtime::deck::Deck;
use runtime::events::{
    ScriptDialogRequest, ScriptNavigationIntent, ScriptRuntimeEffects, ScriptTimerRequest,
};
use wavescript::decoder::{decode_compilation_unit, DecodeError};
use wavescript::stdlib::wmlbrowser::WmlBrowserHost;
use wavescript::value::ScriptValue;
use wavescript::vm::{Vm, VmTrap};

pub use engine_script_types::{
    EngineTraceEntry, ScriptCallArgLiteral, ScriptDialogRequestLiteral, ScriptErrorCategoryLiteral,
    ScriptErrorClassLiteral, ScriptExecutionOutcome, ScriptInvocationOutcome,
    ScriptNavigationCacheControlPolicyLiteral, ScriptNavigationIntentLiteral,
    ScriptNavigationPostContextLiteral, ScriptNavigationRequestPolicyLiteral,
    ScriptTimerRequestLiteral, ScriptValueLiteral,
};
pub use render::render_list::{DrawCmd, RenderList};

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

/// Panic-containment boundary for public engine entrypoints.
///
/// Runs `f` under [`std::panic::catch_unwind`] and converts an unwinding
/// panic into the engine's existing typed `Result<_, String>` error path
/// instead of letting it propagate. This exists so a defensive-programming
/// bug elsewhere in the engine (parser, navigation, VM, ...) degrades to a
/// recoverable error the host can observe, rather than an uncaught panic —
/// which, at the `#[wasm_bindgen]` boundary, traps the whole WASM instance
/// uncatchably from JS (the instance cannot be used again after that).
///
/// `AssertUnwindSafe` is used because these entrypoints take `&mut self`,
/// which is not `UnwindSafe` by default: unwinding through a mutable
/// reference can leave the pointee in a partially-updated state. That
/// tradeoff is accepted deliberately here — surfacing a typed error and
/// keeping the host process/instance alive is strictly better than crashing
/// it, even if the caught-panic path leaves engine state non-pristine. Call
/// sites that care about state precision (e.g. navigation cycles) already
/// guard against runaway recursion with typed errors before a panic would
/// ever occur (see `MAX_NAV_DISPATCH_DEPTH`, `MAX_TIMER_DISPATCH_DEPTH`);
/// this boundary is a last-resort net for bugs those guards don't cover.
///
/// Kept target-agnostic (native and `wasm32` both support unwind-based
/// `catch_unwind` here, since this crate does not set
/// `[profile.release] panic = "abort"`) and crate-private: it is glue for
/// the public API surface, not parser/runtime/layout core logic.
pub(crate) fn catch_engine_panic<T>(f: impl FnOnce() -> T) -> Result<T, String> {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(f)).map_err(|payload| {
        // NOTE: pass `payload.as_ref()` here, not `&payload`. `payload` is a
        // `Box<dyn Any + Send>`, and `Box<T: 'static>` itself implements
        // `Any` via the blanket impl — so `&payload` coerces (via unsized
        // coercion, not `Deref`) to a `&(dyn Any + Send)` describing the
        // *Box*, not the panic payload it holds, and every `downcast_ref`
        // below silently misses. `.as_ref()` forces the `Deref` step first.
        format!(
            "engine: internal panic contained: {}",
            panic_payload_message(payload.as_ref())
        )
    })
}

fn panic_payload_message(payload: &(dyn std::any::Any + Send)) -> String {
    if let Some(message) = payload.downcast_ref::<&str>() {
        (*message).to_string()
    } else if let Some(message) = payload.downcast_ref::<String>() {
        message.clone()
    } else {
        "non-string panic payload".to_string()
    }
}

#[derive(Clone, Debug)]
struct CardTimerState {
    card_idx: usize,
    remaining_ms: u32,
    ontimer_action: Option<CardTaskAction>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct InputEditState {
    input_name: String,
    original_value: String,
    draft_value: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct SelectEditState {
    select_name: String,
    original_index: usize,
    draft_index: usize,
}

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
}

impl Default for WmlEngine {
    fn default() -> Self {
        Self::new()
    }
}
