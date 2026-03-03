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

use layout::flow_layout::layout_card;
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
    ScriptNavigationIntentLiteral, ScriptTimerRequestLiteral, ScriptValueLiteral,
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

#[derive(Clone, Debug)]
struct CardTimerState {
    card_idx: usize,
    remaining_ms: u32,
    ontimer_action: Option<CardTaskAction>,
}

#[cfg_attr(all(feature = "wasm-bindings", target_arch = "wasm32"), wasm_bindgen)]
pub struct WmlEngine {
    deck: Option<Deck>,
    active_card_idx: usize,
    nav_stack: Vec<usize>,
    focused_link_idx: usize,
    external_nav_intent: Option<String>,
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
    active_timer: Option<CardTimerState>,
}

impl Default for WmlEngine {
    fn default() -> Self {
        Self::new()
    }
}
