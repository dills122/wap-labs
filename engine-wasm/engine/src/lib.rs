use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

mod layout;
mod nav;
mod parser;
mod render;
mod runtime;
#[allow(dead_code)]
mod wmlscript;

use layout::flow_layout::layout_card;
use nav::focus::{clamp_focus, move_focus_down, move_focus_up};
use parser::wml_parser::parse_wml;
use runtime::deck::Deck;
use runtime::events::{ScriptNavigationIntent, ScriptRuntimeEffects};
use std::mem;
use wmlscript::decoder::{decode_compilation_unit, DecodeError};
use wmlscript::stdlib::wmlbrowser::WmlBrowserHost;
use wmlscript::value::ScriptValue;
use wmlscript::vm::{Vm, VmTrap};

const DEFAULT_VIEWPORT_COLS: usize = 20;
const MAX_TRACE_ENTRIES: usize = 256;

#[wasm_bindgen]
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
    trace_entries: Vec<EngineTraceEntry>,
    next_trace_seq: u64,
}

impl Default for WmlEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl WmlEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WmlEngine {
        WmlEngine {
            deck: None,
            active_card_idx: 0,
            nav_stack: Vec::new(),
            focused_link_idx: 0,
            external_nav_intent: None,
            viewport_cols: DEFAULT_VIEWPORT_COLS,
            base_url: String::new(),
            content_type: String::new(),
            raw_bytes_base64: None,
            vars: HashMap::new(),
            script_units: HashMap::new(),
            script_entrypoints: HashMap::new(),
            pending_script_effects: ScriptRuntimeEffects::default(),
            last_script_outcome: None,
            trace_entries: Vec::new(),
            next_trace_seq: 1,
        }
    }

    #[wasm_bindgen(js_name = loadDeck)]
    pub fn load_deck(&mut self, xml: &str) -> Result<(), JsValue> {
        self.load_deck_context(xml, "", "text/vnd.wap.wml", None)
    }

    #[wasm_bindgen(js_name = loadDeckContext)]
    pub fn load_deck_context(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
    ) -> Result<(), JsValue> {
        let deck = parse_wml(wml_xml).map_err(as_js_err)?;
        self.deck = Some(deck);
        self.active_card_idx = 0;
        self.nav_stack.clear();
        self.focused_link_idx = 0;
        self.external_nav_intent = None;
        self.base_url = base_url.to_string();
        self.content_type = content_type.to_string();
        self.raw_bytes_base64 = raw_bytes_base64;
        self.vars.clear();
        self.script_units.clear();
        self.script_entrypoints.clear();
        self.pending_script_effects = ScriptRuntimeEffects::default();
        self.last_script_outcome = None;
        self.clear_trace_entries();
        self.push_trace("LOAD_DECK", format!("contentType={content_type}"));
        Ok(())
    }

    #[wasm_bindgen(js_name = getVar)]
    pub fn get_var(&self, name: String) -> Option<String> {
        self.vars.get(&name).cloned()
    }

    #[wasm_bindgen(js_name = setVar)]
    pub fn set_var(&mut self, name: String, value: String) -> bool {
        if !is_valid_var_name(&name) {
            return false;
        }
        self.vars.insert(name, value);
        true
    }

    #[wasm_bindgen]
    pub fn render(&self) -> Result<JsValue, JsValue> {
        let card = self.active_card()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx);
        to_js_value(&layout.render_list)
    }

    #[wasm_bindgen(js_name = handleKey)]
    pub fn handle_key(&mut self, key: String) -> Result<(), JsValue> {
        self.handle_key_internal(&key).map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = navigateToCard)]
    pub fn navigate_to_card(&mut self, id: String) -> Result<(), JsValue> {
        self.navigate_to_card_internal(&id).map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = navigateBack)]
    pub fn navigate_back(&mut self) -> bool {
        self.navigate_back_internal()
    }

    #[wasm_bindgen(js_name = setViewportCols)]
    pub fn set_viewport_cols(&mut self, cols: usize) {
        self.viewport_cols = cols.max(1);
    }

    #[wasm_bindgen(js_name = activeCardId)]
    pub fn active_card_id(&self) -> Result<String, JsValue> {
        let card = self.active_card()?;
        Ok(card.id.clone())
    }

    #[wasm_bindgen(js_name = focusedLinkIndex)]
    pub fn focused_link_index(&self) -> usize {
        self.focused_link_idx
    }

    #[wasm_bindgen(js_name = baseUrl)]
    pub fn base_url(&self) -> String {
        self.base_url.clone()
    }

    #[wasm_bindgen(js_name = contentType)]
    pub fn content_type(&self) -> String {
        self.content_type.clone()
    }

    #[wasm_bindgen(js_name = externalNavigationIntent)]
    pub fn external_navigation_intent(&self) -> Option<String> {
        self.external_nav_intent.clone()
    }

    #[wasm_bindgen(js_name = clearExternalNavigationIntent)]
    pub fn clear_external_navigation_intent(&mut self) {
        self.external_nav_intent = None;
    }

    #[wasm_bindgen(js_name = executeScriptUnit)]
    pub fn execute_script_unit(&self, bytes: Vec<u8>) -> Result<JsValue, JsValue> {
        to_js_value(&self.execute_script_unit_internal(&bytes))
    }

    #[wasm_bindgen(js_name = registerScriptUnit)]
    pub fn register_script_unit(&mut self, src: String, bytes: Vec<u8>) {
        self.script_units.insert(src, bytes);
    }

    #[wasm_bindgen(js_name = clearScriptUnits)]
    pub fn clear_script_units(&mut self) {
        self.script_units.clear();
        self.script_entrypoints.clear();
    }

    #[wasm_bindgen(js_name = registerScriptEntryPoint)]
    pub fn register_script_entry_point(
        &mut self,
        src: String,
        function_name: String,
        entry_pc: usize,
    ) {
        self.script_entrypoints
            .entry(src)
            .or_default()
            .insert(function_name, entry_pc);
    }

    #[wasm_bindgen(js_name = clearScriptEntryPoints)]
    pub fn clear_script_entry_points(&mut self) {
        self.script_entrypoints.clear();
    }

    #[wasm_bindgen(js_name = executeScriptRef)]
    pub fn execute_script_ref(&mut self, src: String) -> Result<JsValue, JsValue> {
        let outcome = self.execute_script_ref_internal(&src, "main");
        self.last_script_outcome = Some(outcome.clone());
        if outcome.ok {
            self.apply_pending_script_effects().map_err(as_js_err)?;
        } else {
            self.pending_script_effects = ScriptRuntimeEffects::default();
        }
        to_js_value(&outcome)
    }

    #[wasm_bindgen(js_name = executeScriptRefFunction)]
    pub fn execute_script_ref_function(
        &mut self,
        src: String,
        function_name: String,
    ) -> Result<JsValue, JsValue> {
        let outcome = self.execute_script_ref_internal(&src, &function_name);
        self.last_script_outcome = Some(outcome.clone());
        if outcome.ok {
            self.apply_pending_script_effects().map_err(as_js_err)?;
        } else {
            self.pending_script_effects = ScriptRuntimeEffects::default();
        }
        to_js_value(&outcome)
    }

    #[wasm_bindgen(js_name = executeScriptRefCall)]
    pub fn execute_script_ref_call(
        &mut self,
        src: String,
        function_name: String,
        args: JsValue,
    ) -> Result<JsValue, JsValue> {
        let call_args: Vec<ScriptCallArgLiteral> = serde_wasm_bindgen::from_value(args)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let vm_args = convert_script_call_args(&call_args);
        let outcome = self.execute_script_ref_call_internal(&src, &function_name, &vm_args);
        self.last_script_outcome = Some(outcome.clone());
        if outcome.ok {
            self.apply_pending_script_effects().map_err(as_js_err)?;
        } else {
            self.pending_script_effects = ScriptRuntimeEffects::default();
        }
        to_js_value(&outcome)
    }

    #[wasm_bindgen(js_name = lastScriptExecutionTrap)]
    pub fn last_script_execution_trap(&self) -> Option<String> {
        self.last_script_outcome
            .as_ref()
            .and_then(|outcome| outcome.trap.clone())
    }

    #[wasm_bindgen(js_name = lastScriptExecutionOk)]
    pub fn last_script_execution_ok(&self) -> Option<bool> {
        self.last_script_outcome.as_ref().map(|outcome| outcome.ok)
    }

    #[wasm_bindgen(js_name = traceEntries)]
    pub fn trace_entries(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.trace_entries)
    }

    #[wasm_bindgen(js_name = clearTraceEntries)]
    pub fn clear_trace_entries(&mut self) {
        self.trace_entries.clear();
        self.next_trace_seq = 1;
    }
}

impl WmlEngine {
    fn execute_script_unit_internal(&self, bytes: &[u8]) -> ScriptExecutionOutcome {
        let decoded_unit = match decode_compilation_unit(bytes) {
            Ok(unit) => unit,
            Err(err) => {
                return ScriptExecutionOutcome::trap(format_decode_error(err));
            }
        };

        let vm = Vm::default();
        match vm.execute(&decoded_unit) {
            Ok(result) => ScriptExecutionOutcome::ok(
                script_value_to_literal(result),
                ScriptNavigationIntentLiteral::None,
                false,
            ),
            Err(trap) => ScriptExecutionOutcome::trap(format_vm_trap(trap)),
        }
    }

    fn execute_script_ref_internal(
        &mut self,
        src: &str,
        function_name: &str,
    ) -> ScriptExecutionOutcome {
        self.execute_script_ref_call_internal(src, function_name, &[])
    }

    fn execute_script_ref_call_internal(
        &mut self,
        src: &str,
        function_name: &str,
        args: &[ScriptValue],
    ) -> ScriptExecutionOutcome {
        let Some(bytes) = self.script_units.get(src) else {
            return ScriptExecutionOutcome::trap(format!(
                "loader: script unit not registered ({src})"
            ));
        };

        let decoded_unit = match decode_compilation_unit(bytes) {
            Ok(unit) => unit,
            Err(err) => {
                return ScriptExecutionOutcome::trap(format_decode_error(err));
            }
        };

        let entry_pc = if function_name == "main" {
            0
        } else {
            let Some(entrypoints) = self.script_entrypoints.get(src) else {
                return ScriptExecutionOutcome::trap(format!(
                    "loader: function entry point not registered ({src}#{function_name})"
                ));
            };
            let Some(entry_pc) = entrypoints.get(function_name) else {
                return ScriptExecutionOutcome::trap(format!(
                    "loader: function entry point not registered ({src}#{function_name})"
                ));
            };
            *entry_pc
        };

        self.pending_script_effects = ScriptRuntimeEffects::default();
        let mut host = WmlBrowserHost::new(&mut self.vars, &mut self.pending_script_effects);
        let vm = Vm::default();
        match vm.execute_from_pc_with_locals_and_host(
            &decoded_unit,
            entry_pc,
            args.to_vec(),
            &mut host,
        ) {
            Ok(result) => ScriptExecutionOutcome::ok(
                script_value_to_literal(result),
                script_nav_intent_to_literal(self.pending_script_effects.navigation_intent()),
                self.pending_script_effects.requires_refresh(),
            ),
            Err(trap) => ScriptExecutionOutcome::trap(format_vm_trap(trap)),
        }
    }

    fn handle_key_internal(&mut self, key: &str) -> Result<(), String> {
        self.push_trace("KEY", format!("key={key}"));
        let (layout, accept_action_href) = {
            let card = self.active_card_internal()?;
            (
                layout_card(card, self.viewport_cols, self.focused_link_idx),
                card.accept_action_href.clone(),
            )
        };
        let link_total = layout.links.len();

        match key {
            "up" => {
                self.focused_link_idx = move_focus_up(self.focused_link_idx, link_total);
            }
            "down" => {
                self.focused_link_idx = move_focus_down(self.focused_link_idx, link_total);
            }
            "enter" => {
                if link_total == 0 {
                    if let Some(href) = accept_action_href {
                        self.push_trace("ACTION_ACCEPT", href.clone());
                        self.execute_action_href(&href)?;
                    }
                    return Ok(());
                }
                let idx = clamp_focus(self.focused_link_idx, link_total);
                let href = &layout.links[idx];
                self.execute_action_href(href)?;
            }
            _ => {}
        }

        Ok(())
    }

    fn navigate_to_card_internal(&mut self, id: &str) -> Result<(), String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;

        let next_idx = deck
            .card_index(id)
            .ok_or_else(|| "Card id not found".to_string())?;

        self.nav_stack.push(self.active_card_idx);
        self.active_card_idx = next_idx;
        self.focused_link_idx = 0;
        self.run_onenterforward_for_active_card()?;
        Ok(())
    }

    fn navigate_back_internal(&mut self) -> bool {
        let Some(previous_idx) = self.nav_stack.pop() else {
            self.push_trace("ACTION_BACK_EMPTY", String::new());
            return false;
        };

        self.active_card_idx = previous_idx;
        self.focused_link_idx = 0;
        self.push_trace("ACTION_BACK", String::new());
        true
    }

    fn run_onenterforward_for_active_card(&mut self) -> Result<(), String> {
        let href = self.active_card_internal()?.onenterforward_href.clone();
        if let Some(href) = href {
            self.execute_action_href(&href)?;
        }
        Ok(())
    }

    fn execute_action_href(&mut self, href: &str) -> Result<(), String> {
        if let Some(script_ref) = parse_script_href(href) {
            let function_name = script_ref.function_name.unwrap_or("main");
            self.push_trace(
                "ACTION_SCRIPT",
                format!("{}#{}", script_ref.src, function_name),
            );
            let outcome = self.execute_script_ref_internal(script_ref.src, function_name);
            self.last_script_outcome = Some(outcome.clone());
            if let Some(message) = outcome.trap {
                self.pending_script_effects = ScriptRuntimeEffects::default();
                self.push_trace("SCRIPT_TRAP", message.clone());
                return Err(message);
            }
            self.apply_pending_script_effects()?;
            self.push_trace("SCRIPT_OK", String::new());
            return Ok(());
        }

        if let Some(card_id) = href.strip_prefix('#') {
            self.push_trace("ACTION_FRAGMENT", card_id.to_string());
            self.navigate_to_card_internal(card_id)?;
            return Ok(());
        }

        self.push_trace("ACTION_EXTERNAL", href.to_string());
        self.external_nav_intent = Some(self.resolve_external_href(href));
        Ok(())
    }

    fn apply_pending_script_effects(&mut self) -> Result<(), String> {
        let effects = mem::take(&mut self.pending_script_effects);
        let nav_intent = effects.navigation_intent().clone();

        match nav_intent {
            ScriptNavigationIntent::None => {}
            ScriptNavigationIntent::Prev => {
                self.navigate_back_internal();
            }
            ScriptNavigationIntent::Go(href) => {
                if let Some(card_id) = href.strip_prefix('#') {
                    self.navigate_to_card_internal(card_id)?;
                } else if !href.is_empty() {
                    self.external_nav_intent = Some(self.resolve_external_href(&href));
                }
            }
        }

        Ok(())
    }

    fn push_trace(&mut self, kind: &str, detail: String) {
        if self.trace_entries.len() >= MAX_TRACE_ENTRIES {
            self.trace_entries.remove(0);
        }

        let active_card_id = self.active_card_internal().ok().map(|card| card.id.clone());
        let entry = EngineTraceEntry {
            seq: self.next_trace_seq,
            kind: kind.to_string(),
            detail,
            active_card_id,
            focused_link_index: self.focused_link_idx,
            external_navigation_intent: self.external_nav_intent.clone(),
            script_ok: self.last_script_outcome.as_ref().map(|outcome| outcome.ok),
            script_trap: self
                .last_script_outcome
                .as_ref()
                .and_then(|outcome| outcome.trap.clone()),
        };
        self.next_trace_seq += 1;
        self.trace_entries.push(entry);
    }

    fn active_card_internal(&self) -> Result<&runtime::card::Card, String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;

        deck.cards
            .get(self.active_card_idx)
            .ok_or_else(|| "Active card index out of range".to_string())
    }

    fn active_card(&self) -> Result<&runtime::card::Card, JsValue> {
        self.active_card_internal().map_err(as_js_err)
    }

    fn resolve_external_href(&self, href: &str) -> String {
        if self.base_url.is_empty() || has_uri_scheme(href) || href.starts_with("//") {
            return href.to_string();
        }

        if let Some(path_from_root) = href.strip_prefix('/') {
            let Some(origin) = extract_origin(&self.base_url) else {
                return href.to_string();
            };
            return format!("{origin}/{path_from_root}");
        }

        let Some(base_dir) = extract_base_dir(&self.base_url) else {
            return href.to_string();
        };

        format!("{base_dir}{href}")
    }
}

fn has_uri_scheme(value: &str) -> bool {
    let Some((scheme, _)) = value.split_once(':') else {
        return false;
    };

    !scheme.is_empty()
        && scheme
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '+' || ch == '-' || ch == '.')
}

fn extract_origin(base_url: &str) -> Option<String> {
    let (scheme, remainder) = base_url.split_once("://")?;
    let authority = remainder.split('/').next().unwrap_or(remainder);
    if authority.is_empty() {
        return None;
    }
    Some(format!("{scheme}://{authority}"))
}

fn extract_base_dir(base_url: &str) -> Option<String> {
    let no_query_or_fragment = base_url
        .split('#')
        .next()
        .unwrap_or(base_url)
        .split('?')
        .next()
        .unwrap_or(base_url);

    if no_query_or_fragment.ends_with('/') {
        return Some(no_query_or_fragment.to_string());
    }

    let (prefix, _) = no_query_or_fragment.rsplit_once('/')?;
    Some(format!("{prefix}/"))
}

#[derive(Debug, PartialEq, Eq)]
struct ParsedScriptRef<'a> {
    src: &'a str,
    function_name: Option<&'a str>,
}

fn parse_script_href(href: &str) -> Option<ParsedScriptRef<'_>> {
    let body = href.strip_prefix("script:")?;
    let (src, function_name) = match body.split_once('#') {
        Some((src, fn_name)) => {
            let fn_name = if fn_name.is_empty() {
                None
            } else {
                Some(fn_name)
            };
            (src, fn_name)
        }
        None => (body, None),
    };
    if src.is_empty() {
        return None;
    }
    Some(ParsedScriptRef { src, function_name })
}

fn to_js_value<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(value).map_err(|err| JsValue::from_str(&err.to_string()))
}

fn as_js_err(message: String) -> JsValue {
    JsValue::from_str(&message)
}

fn format_decode_error(err: DecodeError) -> String {
    match err {
        DecodeError::EmptyUnit => "decode: empty compilation unit".to_string(),
        DecodeError::UnitTooLarge { size, limit } => {
            format!("decode: unit too large (size={size}, limit={limit})")
        }
    }
}

fn format_vm_trap(trap: VmTrap) -> String {
    match trap {
        VmTrap::EmptyUnit => "vm: empty unit".to_string(),
        VmTrap::InvalidEntryPoint { entry_pc } => {
            format!("vm: invalid entry point ({entry_pc})")
        }
        VmTrap::UnsupportedOpcode(opcode) => format!("vm: unsupported opcode 0x{opcode:02x}"),
        VmTrap::TruncatedImmediate { opcode } => {
            format!("vm: truncated immediate for opcode 0x{opcode:02x}")
        }
        VmTrap::StackOverflow { limit } => format!("vm: stack overflow (limit={limit})"),
        VmTrap::StackUnderflow => "vm: stack underflow".to_string(),
        VmTrap::TypeError(message) => format!("vm: type error ({message})"),
        VmTrap::InvalidLocalIndex { index } => format!("vm: invalid local index ({index})"),
        VmTrap::InvalidCallTarget { target } => format!("vm: invalid call target ({target})"),
        VmTrap::CallDepthExceeded { limit } => format!("vm: call depth exceeded (limit={limit})"),
        VmTrap::ReturnFromRootFrame => "vm: return from root frame".to_string(),
        VmTrap::ExecutionLimitExceeded { limit } => {
            format!("vm: execution step limit exceeded ({limit})")
        }
        VmTrap::Utf8ImmediateDecode => "vm: invalid utf-8 string immediate".to_string(),
        VmTrap::HostCallUnavailable { function_id } => {
            format!("vm: host call unavailable (function={function_id})")
        }
        VmTrap::HostCallError {
            function_id,
            message,
        } => {
            format!("vm: host call error (function={function_id}, message={message})")
        }
    }
}

fn script_value_to_literal(value: ScriptValue) -> ScriptValueLiteral {
    match value {
        ScriptValue::Bool(value) => ScriptValueLiteral::Bool(value),
        ScriptValue::Int32(value) => ScriptValueLiteral::Number(f64::from(value)),
        ScriptValue::Float64(value) => ScriptValueLiteral::Number(value),
        ScriptValue::String(value) => ScriptValueLiteral::String(value),
        ScriptValue::Invalid => ScriptValueLiteral::Invalid { invalid: true },
    }
}

#[derive(Clone, Serialize)]
struct ScriptExecutionOutcome {
    ok: bool,
    result: ScriptValueLiteral,
    trap: Option<String>,
    navigation_intent: ScriptNavigationIntentLiteral,
    requires_refresh: bool,
}

#[derive(Clone, Serialize)]
struct EngineTraceEntry {
    seq: u64,
    kind: String,
    detail: String,
    active_card_id: Option<String>,
    focused_link_index: usize,
    external_navigation_intent: Option<String>,
    script_ok: Option<bool>,
    script_trap: Option<String>,
}

impl ScriptExecutionOutcome {
    fn ok(
        result: ScriptValueLiteral,
        navigation_intent: ScriptNavigationIntentLiteral,
        requires_refresh: bool,
    ) -> Self {
        Self {
            ok: true,
            result,
            trap: None,
            navigation_intent,
            requires_refresh,
        }
    }

    fn trap(message: String) -> Self {
        Self {
            ok: false,
            result: ScriptValueLiteral::Invalid { invalid: true },
            trap: Some(message),
            navigation_intent: ScriptNavigationIntentLiteral::None,
            requires_refresh: false,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum ScriptNavigationIntentLiteral {
    None,
    Go { href: String },
    Prev,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(untagged)]
enum ScriptValueLiteral {
    Bool(bool),
    Number(f64),
    String(String),
    Invalid { invalid: bool },
}

#[derive(Deserialize)]
#[serde(untagged)]
enum ScriptCallArgLiteral {
    Bool(bool),
    Number(f64),
    String(String),
    Invalid { invalid: bool },
}

fn convert_script_call_args(args: &[ScriptCallArgLiteral]) -> Vec<ScriptValue> {
    args.iter()
        .map(|arg| match arg {
            ScriptCallArgLiteral::Bool(value) => ScriptValue::Bool(*value),
            ScriptCallArgLiteral::Number(value) => {
                if value.fract() == 0.0 && *value >= i32::MIN as f64 && *value <= i32::MAX as f64 {
                    ScriptValue::Int32(*value as i32)
                } else {
                    ScriptValue::Float64(*value)
                }
            }
            ScriptCallArgLiteral::String(value) => ScriptValue::String(value.clone()),
            ScriptCallArgLiteral::Invalid { invalid } => {
                if *invalid {
                    ScriptValue::Invalid
                } else {
                    ScriptValue::String(String::new())
                }
            }
        })
        .collect()
}

fn is_valid_var_name(name: &str) -> bool {
    if name.is_empty() {
        return false;
    }
    let mut chars = name.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    if !(first.is_ascii_alphabetic() || first == '_') {
        return false;
    }
    chars.all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '.' || ch == '-')
}

fn script_nav_intent_to_literal(intent: &ScriptNavigationIntent) -> ScriptNavigationIntentLiteral {
    match intent {
        ScriptNavigationIntent::None => ScriptNavigationIntentLiteral::None,
        ScriptNavigationIntent::Go(href) => {
            ScriptNavigationIntentLiteral::Go { href: href.clone() }
        }
        ScriptNavigationIntent::Prev => ScriptNavigationIntentLiteral::Prev,
    }
}

#[cfg(test)]
mod tests {
    use super::{
        convert_script_call_args, parse_script_href, ParsedScriptRef, ScriptCallArgLiteral,
        ScriptNavigationIntentLiteral, ScriptValueLiteral, WmlEngine,
    };
    use crate::layout::flow_layout::layout_card;
    use crate::render::render_list::DrawCmd;
    use crate::wmlscript::value::ScriptValue;

    const SAMPLE: &str = r##"
    <wml>
      <card id="home">
        <p>Hello</p>
        <a href="#next">Next</a>
      </card>
      <card id="next">
        <p>World</p>
      </card>
    </wml>
    "##;
    const FIELD_EXAMPLE_01: &str =
        include_str!("../tests/fixtures/field/openwave-2011-example-01-navigation.wml");
    const FIXTURE_BASIC_TWO_CARD: &str =
        include_str!("../tests/fixtures/phase-a/basic-two-card.wml");
    const FIXTURE_MIXED_INLINE_TEXT_LINKS: &str =
        include_str!("../tests/fixtures/phase-a/mixed-inline-text-links.wml");
    const FIXTURE_LINK_WRAP: &str = include_str!("../tests/fixtures/phase-a/link-wrap.wml");
    const FIXTURE_MISSING_FRAGMENT: &str =
        include_str!("../tests/fixtures/phase-a/missing-fragment.wml");

    fn render_snapshot_lines(engine: &WmlEngine) -> Vec<String> {
        let card = engine
            .active_card_internal()
            .expect("active card must exist for snapshot");
        let layout = layout_card(card, engine.viewport_cols, engine.focused_link_idx);
        layout
            .render_list
            .draw
            .iter()
            .map(|cmd| match cmd {
                DrawCmd::Text { x, y, text } => format!("text:{x}:{y}:{text}"),
                DrawCmd::Link {
                    x,
                    y,
                    text,
                    focused,
                    href,
                } => format!("link:{x}:{y}:focused={focused}:href={href}:text={text}"),
            })
            .collect()
    }

    fn push_string(bytes: &mut Vec<u8>, value: &str) {
        let raw = value.as_bytes();
        assert!(
            u8::try_from(raw.len()).is_ok(),
            "test string too long for PUSH_STRING8"
        );
        bytes.push(0x03);
        bytes.push(raw.len() as u8);
        bytes.extend_from_slice(raw);
    }

    #[test]
    fn enter_navigates_to_fragment_card() {
        let mut engine = WmlEngine::new();
        engine.load_deck(SAMPLE).expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("enter should succeed");

        assert_eq!(
            engine.active_card_id().expect("active card should exist"),
            "next"
        );
    }

    #[cfg(target_arch = "wasm32")]
    #[test]
    fn load_deck_returns_structured_error_for_invalid_root() {
        let mut engine = WmlEngine::new();
        let err = engine
            .load_deck("<card id=\"home\"><p>Hello</p></card>")
            .expect_err("missing wml root must fail");

        let msg = err
            .as_string()
            .expect("parser errors should cross wasm boundary as strings");
        assert!(msg.contains("<wml>"), "unexpected error message: {msg}");
    }

    #[test]
    fn load_deck_accepts_unknown_tags() {
        let mut engine = WmlEngine::new();
        let xml = r#"
        <wml>
          <experimental>
            <ignored/>
          </experimental>
          <card id="home">
            <p>Hello</p>
          </card>
        </wml>
        "#;

        engine
            .load_deck(xml)
            .expect("unknown tags should be ignored, not rejected");
        assert_eq!(engine.active_card_id().expect("active card"), "home");
    }

    #[test]
    fn down_enter_fragment_navigation_resets_focus() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
            <a href="#third">Third</a>
          </card>
          <card id="next">
            <p>Second</p>
          </card>
          <card id="third">
            <p>Third</p>
          </card>
        </wml>
        "##;

        engine.load_deck(xml).expect("deck should load");
        engine
            .handle_key("down".to_string())
            .expect("down should succeed");
        assert_eq!(engine.focused_link_index(), 1);
        engine
            .handle_key("enter".to_string())
            .expect("enter should navigate");

        assert_eq!(engine.active_card_id().expect("active card"), "third");
        assert_eq!(engine.focused_link_index(), 0);
    }

    #[test]
    fn missing_fragment_returns_error_and_preserves_state() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#missing">Broken</a>
          </card>
          <card id="next">
            <p>Second</p>
          </card>
        </wml>
        "##;

        engine.load_deck(xml).expect("deck should load");
        let err = engine
            .handle_key_internal("enter")
            .expect_err("missing fragment should return error");
        assert!(
            err.contains("Card id not found"),
            "unexpected error message: {err}"
        );
        assert_eq!(engine.active_card_idx, 0);
        assert_eq!(engine.focused_link_idx, 0);
        assert!(engine.nav_stack.is_empty());
    }

    #[test]
    fn field_example_01_loads_and_fragment_navigation_works() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(FIELD_EXAMPLE_01)
            .expect("field fixture should load");
        assert_eq!(engine.active_card_id().expect("active card"), "main");

        engine
            .handle_key("enter".to_string())
            .expect("enter should move to #content");
        assert_eq!(engine.active_card_id().expect("active card"), "content");
        assert_eq!(engine.external_navigation_intent(), None);
    }

    #[test]
    fn enter_on_external_link_sets_intent_without_mutating_card() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="next.wml?foo=1">Load</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;

        engine
            .load_deck_context(
                xml,
                "http://local.test/dir/start.wml",
                "text/vnd.wap.wml",
                None,
            )
            .expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("external enter should succeed");

        assert_eq!(engine.active_card_id().expect("active card"), "home");
        assert_eq!(
            engine.external_navigation_intent(),
            Some("http://local.test/dir/next.wml?foo=1".to_string())
        );
        assert!(engine.nav_stack.is_empty());
    }

    #[test]
    fn clear_external_navigation_intent_removes_intent() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="https://example.org/path">Load</a>
          </card>
        </wml>
        "##;

        engine.load_deck(xml).expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("external enter should succeed");
        assert_eq!(
            engine.external_navigation_intent(),
            Some("https://example.org/path".to_string())
        );

        engine.clear_external_navigation_intent();
        assert_eq!(engine.external_navigation_intent(), None);
    }

    #[test]
    fn load_deck_sets_default_metadata_values() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(
                r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
            )
            .expect("deck should load");

        assert_eq!(engine.base_url(), "");
        assert_eq!(engine.content_type(), "text/vnd.wap.wml");
    }

    #[test]
    fn load_deck_context_overrides_metadata_values() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck_context(
                r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
                "http://local.test/path/start.wml",
                "application/vnd.wap.wmlc",
                Some("AQID".to_string()),
            )
            .expect("deck should load");

        assert_eq!(engine.base_url(), "http://local.test/path/start.wml");
        assert_eq!(engine.content_type(), "application/vnd.wap.wmlc");
    }

    #[test]
    fn load_deck_compat_path_resets_metadata_to_defaults() {
        let mut engine = WmlEngine::new();
        let xml = r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#;
        engine
            .load_deck_context(
                xml,
                "http://local.test/path/start.wml",
                "application/vnd.wap.wmlc",
                Some("AQID".to_string()),
            )
            .expect("deck should load");
        assert_eq!(engine.base_url(), "http://local.test/path/start.wml");
        assert_eq!(engine.content_type(), "application/vnd.wap.wmlc");

        engine
            .load_deck(xml)
            .expect("loadDeck should remain functional");
        assert_eq!(engine.base_url(), "");
        assert_eq!(engine.content_type(), "text/vnd.wap.wml");
    }

    #[test]
    fn execute_script_unit_halt_bytecode_returns_ok() {
        let engine = WmlEngine::new();

        let outcome = engine.execute_script_unit_internal(&[0x00]);
        assert!(outcome.ok);
        assert!(outcome.trap.is_none());
        assert_eq!(
            outcome.result,
            super::ScriptValueLiteral::String(String::new())
        );
    }

    #[test]
    fn execute_script_unit_empty_bytecode_returns_decode_trap() {
        let engine = WmlEngine::new();

        let outcome = engine.execute_script_unit_internal(&[]);
        assert!(!outcome.ok);
        assert_eq!(
            outcome.trap.as_deref(),
            Some("decode: empty compilation unit")
        );
        assert_eq!(
            outcome.result,
            super::ScriptValueLiteral::Invalid { invalid: true }
        );
    }

    #[test]
    fn execute_script_unit_unknown_opcode_returns_vm_trap() {
        let engine = WmlEngine::new();

        let outcome = engine.execute_script_unit_internal(&[0xff]);
        assert!(!outcome.ok);
        assert_eq!(outcome.trap.as_deref(), Some("vm: unsupported opcode 0xff"));
        assert_eq!(
            outcome.result,
            super::ScriptValueLiteral::Invalid { invalid: true }
        );
    }

    #[test]
    fn execute_script_unit_addition_returns_ok() {
        let engine = WmlEngine::new();

        let outcome = engine.execute_script_unit_internal(&[0x01, 4, 0x01, 8, 0x02, 0x00]);
        assert!(outcome.ok);
        assert!(outcome.trap.is_none());
        assert_eq!(outcome.result, super::ScriptValueLiteral::Number(12.0));
    }

    #[test]
    fn execute_script_unit_truncated_immediate_returns_vm_trap() {
        let engine = WmlEngine::new();

        let outcome = engine.execute_script_unit_internal(&[0x01]);
        assert!(!outcome.ok);
        assert_eq!(
            outcome.trap.as_deref(),
            Some("vm: truncated immediate for opcode 0x01")
        );
    }

    #[test]
    fn execute_script_unit_return_from_root_reports_vm_trap() {
        let engine = WmlEngine::new();

        let outcome = engine.execute_script_unit_internal(&[0x13]);
        assert!(!outcome.ok);
        assert_eq!(outcome.trap.as_deref(), Some("vm: return from root frame"));
    }

    #[test]
    fn execute_script_ref_reports_missing_unit() {
        let mut engine = WmlEngine::new();
        let outcome = engine.execute_script_ref_internal("missing.wmlsc", "main");
        engine.last_script_outcome = Some(outcome);
        assert_eq!(engine.last_script_execution_ok(), Some(false));
        assert_eq!(
            engine.last_script_execution_trap().as_deref(),
            Some("loader: script unit not registered (missing.wmlsc)")
        );
    }

    #[test]
    fn script_link_executes_registered_unit_without_external_navigation() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="script:calc.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");
        engine.register_script_unit("calc.wmlsc".to_string(), vec![0x01, 4, 0x01, 5, 0x02, 0x00]);

        engine
            .handle_key("enter".to_string())
            .expect("script execution should succeed");
        assert_eq!(engine.active_card_id().expect("active card"), "home");
        assert_eq!(engine.external_navigation_intent(), None);
        assert_eq!(engine.last_script_execution_ok(), Some(true));
        assert_eq!(engine.last_script_execution_trap(), None);
    }

    #[test]
    fn script_link_returns_error_when_unit_is_missing() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="script:missing.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");

        let err = engine
            .handle_key_internal("enter")
            .expect_err("missing script unit should fail");
        assert_eq!(err, "loader: script unit not registered (missing.wmlsc)");
        assert_eq!(
            engine.last_script_execution_trap().as_deref(),
            Some("loader: script unit not registered (missing.wmlsc)")
        );
    }

    #[test]
    fn clear_script_units_removes_registered_units() {
        let mut engine = WmlEngine::new();
        engine.register_script_unit("unit.wmlsc".to_string(), vec![0x00]);
        engine.clear_script_units();

        let outcome = engine
            .execute_script_ref_internal("unit.wmlsc", "main")
            .trap
            .expect("missing unit should trap");
        assert_eq!(outcome, "loader: script unit not registered (unit.wmlsc)");
    }

    #[test]
    fn parse_script_href_extracts_source_before_fragment() {
        assert!(matches!(
            parse_script_href("script:calc.wmlsc#main"),
            Some(ParsedScriptRef {
                src: "calc.wmlsc",
                function_name: Some("main")
            })
        ));
        assert!(matches!(
            parse_script_href("script:calc.wmlsc"),
            Some(ParsedScriptRef {
                src: "calc.wmlsc",
                function_name: None
            })
        ));
        assert_eq!(parse_script_href("script:#main"), None);
        assert_eq!(parse_script_href("#next"), None);
    }

    #[test]
    fn execute_script_ref_function_uses_registered_entry_point() {
        let mut engine = WmlEngine::new();
        engine.register_script_unit(
            "multi.wmlsc".to_string(),
            vec![0x01, 1, 0x00, 0x01, 9, 0x00],
        );
        engine.register_script_entry_point("multi.wmlsc".to_string(), "alt".to_string(), 3);

        let outcome = engine.execute_script_ref_internal("multi.wmlsc", "alt");
        assert!(outcome.ok);
        assert_eq!(outcome.result, super::ScriptValueLiteral::Number(9.0));
        assert_eq!(outcome.trap, None);
    }

    #[test]
    fn execute_script_ref_function_missing_entry_point_traps() {
        let mut engine = WmlEngine::new();
        engine.register_script_unit("multi.wmlsc".to_string(), vec![0x01, 1, 0x00]);

        let outcome = engine.execute_script_ref_internal("multi.wmlsc", "missing");
        assert!(!outcome.ok);
        assert_eq!(
            outcome.trap.as_deref(),
            Some("loader: function entry point not registered (multi.wmlsc#missing)")
        );
    }

    #[test]
    fn script_link_function_dispatch_uses_registered_entry_point() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="script:multi.wmlsc#alt">Run alt</a>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");
        engine.register_script_unit(
            "multi.wmlsc".to_string(),
            vec![0x01, 1, 0x00, 0x01, 9, 0x00],
        );
        engine.register_script_entry_point("multi.wmlsc".to_string(), "alt".to_string(), 3);

        engine
            .handle_key("enter".to_string())
            .expect("script alt entrypoint should execute");
        assert_eq!(engine.last_script_execution_ok(), Some(true));
        assert_eq!(engine.last_script_execution_trap(), None);
    }

    #[test]
    fn execute_script_ref_call_passes_args_into_function_locals() {
        let mut engine = WmlEngine::new();
        engine.register_script_unit("sum.wmlsc".to_string(), vec![0x11, 0, 0x11, 1, 0x02, 0x00]);
        engine.register_script_entry_point("sum.wmlsc".to_string(), "sum".to_string(), 0);

        let outcome = engine.execute_script_ref_call_internal(
            "sum.wmlsc",
            "sum",
            &[ScriptValue::Int32(10), ScriptValue::Int32(32)],
        );
        assert!(outcome.ok);
        assert_eq!(outcome.result, ScriptValueLiteral::Number(42.0));
        assert_eq!(outcome.trap, None);
    }

    #[test]
    fn wmlbrowser_setvar_getvar_lifecycle_and_coercion() {
        let mut engine = WmlEngine::new();
        assert!(engine.set_var("alpha".to_string(), "1".to_string()));
        assert_eq!(engine.get_var("alpha".to_string()).as_deref(), Some("1"));
        assert!(!engine.set_var("9bad".to_string(), "x".to_string()));

        let mut unit = Vec::new();
        push_string(&mut unit, "score");
        unit.push(0x01);
        unit.push(7);
        unit.push(0x20);
        unit.push(0x02);
        unit.push(0x02);
        push_string(&mut unit, "score");
        unit.push(0x20);
        unit.push(0x01);
        unit.push(0x01);
        unit.push(0x00);
        engine.register_script_unit("vars.wmlsc".to_string(), unit);

        let outcome = engine.execute_script_ref_internal("vars.wmlsc", "main");
        assert!(outcome.ok);
        assert_eq!(outcome.result, ScriptValueLiteral::String("7".to_string()));
        assert_eq!(engine.get_var("score".to_string()).as_deref(), Some("7"));
        assert_eq!(outcome.requires_refresh, true);
        assert_eq!(
            outcome.navigation_intent,
            ScriptNavigationIntentLiteral::None
        );
    }

    #[test]
    fn wmlbrowser_script_go_fragment_applies_at_post_invocation_boundary() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="script:nav.wmlsc#main">Script go</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");
        let mut unit = Vec::new();
        push_string(&mut unit, "#next");
        unit.push(0x20);
        unit.push(0x03);
        unit.push(0x01);
        unit.push(0x00);
        engine.register_script_unit("nav.wmlsc".to_string(), unit);

        engine
            .handle_key("enter".to_string())
            .expect("script go should apply post invocation");
        assert_eq!(engine.active_card_id().expect("active card"), "next");
    }

    #[test]
    fn wmlbrowser_script_prev_applies_post_invocation() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Go next</a>
          </card>
          <card id="next">
            <a href="script:nav.wmlsc#back">Back via script</a>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("fragment nav should work");
        assert_eq!(engine.active_card_id().expect("active"), "next");

        engine.register_script_unit("nav.wmlsc".to_string(), vec![0x20, 0x04, 0x00, 0x00]);
        engine.register_script_entry_point("nav.wmlsc".to_string(), "back".to_string(), 0);
        engine
            .handle_key("enter".to_string())
            .expect("script prev should apply");
        assert_eq!(engine.active_card_id().expect("active"), "home");
    }

    #[test]
    fn wmlbrowser_navigation_last_call_wins_matrix() {
        let mut engine = WmlEngine::new();
        let mut unit = Vec::new();
        push_string(&mut unit, "#next");
        unit.push(0x20);
        unit.push(0x03);
        unit.push(0x01); // go #next
        unit.push(0x20);
        unit.push(0x04);
        unit.push(0x00); // prev
        unit.push(0x00);
        let go_prev = unit.clone();

        let mut unit = Vec::new();
        unit.push(0x20);
        unit.push(0x04);
        unit.push(0x00); // prev
        push_string(&mut unit, "#next");
        unit.push(0x20);
        unit.push(0x03);
        unit.push(0x01); // go #next
        unit.push(0x00);
        let prev_go = unit.clone();

        let mut unit = Vec::new();
        push_string(&mut unit, "#next");
        unit.push(0x20);
        unit.push(0x03);
        unit.push(0x01); // go #next
        push_string(&mut unit, "");
        unit.push(0x20);
        unit.push(0x03);
        unit.push(0x01); // go ""
        unit.push(0x00);
        let go_cancel = unit.clone();

        engine.register_script_unit("go_prev.wmlsc".to_string(), go_prev);
        engine.register_script_unit("prev_go.wmlsc".to_string(), prev_go);
        engine.register_script_unit("go_cancel.wmlsc".to_string(), go_cancel);

        let go_prev_outcome = engine.execute_script_ref_internal("go_prev.wmlsc", "main");
        assert!(go_prev_outcome.ok);
        assert_eq!(
            go_prev_outcome.navigation_intent,
            ScriptNavigationIntentLiteral::Prev
        );

        let prev_go_outcome = engine.execute_script_ref_internal("prev_go.wmlsc", "main");
        assert!(prev_go_outcome.ok);
        assert_eq!(
            prev_go_outcome.navigation_intent,
            ScriptNavigationIntentLiteral::Go {
                href: "#next".to_string()
            }
        );

        let go_cancel_outcome = engine.execute_script_ref_internal("go_cancel.wmlsc", "main");
        assert!(go_cancel_outcome.ok);
        assert_eq!(
            go_cancel_outcome.navigation_intent,
            ScriptNavigationIntentLiteral::None
        );
    }

    #[test]
    fn convert_script_call_args_maps_number_to_int_when_whole() {
        let args = vec![
            ScriptCallArgLiteral::Number(7.0),
            ScriptCallArgLiteral::Number(7.5),
            ScriptCallArgLiteral::Bool(true),
            ScriptCallArgLiteral::String("x".to_string()),
            ScriptCallArgLiteral::Invalid { invalid: true },
        ];
        let converted = convert_script_call_args(&args);
        assert_eq!(
            converted,
            vec![
                ScriptValue::Int32(7),
                ScriptValue::Float64(7.5),
                ScriptValue::Bool(true),
                ScriptValue::String("x".to_string()),
                ScriptValue::Invalid
            ]
        );
    }

    #[test]
    fn enter_triggers_accept_do_action_when_no_links_exist() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <do type="accept">
              <go href="script:calc.wmlsc#main"/>
            </do>
            <p>No focusable links on this card.</p>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");
        engine.register_script_unit("calc.wmlsc".to_string(), vec![0x01, 2, 0x01, 3, 0x02, 0x00]);

        engine
            .handle_key("enter".to_string())
            .expect("enter should execute accept action script");
        assert_eq!(engine.active_card_id().expect("active card"), "home");
        assert_eq!(engine.last_script_execution_ok(), Some(true));
        assert_eq!(engine.last_script_execution_trap(), None);
    }

    #[test]
    fn navigate_runs_onenterforward_action() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterforward">
              <go href="#next"/>
            </onevent>
            <p>Middle</p>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");

        engine
            .handle_key("enter".to_string())
            .expect("enter should navigate and run onenterforward");
        assert_eq!(engine.active_card_id().expect("active card"), "next");
    }

    #[test]
    fn navigate_back_restores_previous_card() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("enter should navigate");
        assert_eq!(engine.active_card_id().expect("active card"), "next");

        let handled = engine.navigate_back();
        assert!(handled, "back should pop existing history entry");
        assert_eq!(engine.active_card_id().expect("active card"), "home");
        assert_eq!(engine.focused_link_index(), 0);
    }

    #[test]
    fn navigate_back_returns_false_when_history_empty() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(
                r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
            )
            .expect("deck should load");

        let handled = engine.navigate_back();
        assert!(!handled, "back should report false with empty history");
        assert_eq!(engine.active_card_id().expect("active card"), "home");
    }

    #[test]
    fn trace_entries_record_key_and_actions() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("enter should navigate");

        assert!(!engine.trace_entries.is_empty());
        assert!(
            engine.trace_entries.iter().any(|entry| entry.kind == "KEY"),
            "expected KEY trace entry"
        );
        assert!(
            engine
                .trace_entries
                .iter()
                .any(|entry| entry.kind == "ACTION_FRAGMENT"),
            "expected ACTION_FRAGMENT trace entry"
        );
    }

    #[test]
    fn clear_trace_entries_resets_trace_state() {
        let mut engine = WmlEngine::new();
        engine.push_trace("TEST", "x".to_string());
        assert!(!engine.trace_entries.is_empty());

        engine.clear_trace_entries();
        assert!(engine.trace_entries.is_empty());
        assert_eq!(engine.next_trace_seq, 1);
    }

    #[test]
    fn phase_a_basic_two_card_fixture_snapshot_and_navigation() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(FIXTURE_BASIC_TWO_CARD)
            .expect("fixture should load");
        assert_eq!(
            render_snapshot_lines(&engine),
            vec![
                "text:0:0:Welcome".to_string(),
                "link:0:1:focused=true:href=#next:text=Go next".to_string(),
            ]
        );

        engine
            .handle_key("enter".to_string())
            .expect("enter should navigate to next");
        assert_eq!(engine.active_card_id().expect("active card"), "next");
        assert_eq!(
            render_snapshot_lines(&engine),
            vec![
                "text:0:0:Second card".to_string(),
                "link:0:1:focused=true:href=#home:text=Back home".to_string(),
            ]
        );
    }

    #[test]
    fn phase_a_mixed_inline_text_links_fixture_preserves_source_order() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(FIXTURE_MIXED_INLINE_TEXT_LINKS)
            .expect("fixture should load");

        assert_eq!(
            render_snapshot_lines(&engine),
            vec![
                "text:0:0:Hello".to_string(),
                "link:0:1:focused=true:href=#next:text=Next".to_string(),
                "text:0:2:and".to_string(),
                "link:0:3:focused=false:href=#final:text=Final".to_string(),
            ]
        );

        engine
            .handle_key("down".to_string())
            .expect("down should move focus to second link");
        assert_eq!(engine.focused_link_index(), 1);
    }

    #[test]
    fn phase_a_link_wrap_fixture_snapshots_widths_and_focus_stability() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(FIXTURE_LINK_WRAP)
            .expect("fixture should load");

        engine.set_viewport_cols(16);
        assert_eq!(
            render_snapshot_lines(&engine),
            vec![
                "text:0:0:abcdefghijklmnop".to_string(),
                "text:0:1:qrstuvwx".to_string(),
                "link:0:2:focused=true:href=#one:text=abcdefghijklmnop".to_string(),
                "link:0:3:focused=true:href=#one:text=qrstuvwx".to_string(),
                "link:0:4:focused=false:href=#two:text=short".to_string(),
            ]
        );

        engine.set_viewport_cols(20);
        assert_eq!(
            render_snapshot_lines(&engine),
            vec![
                "text:0:0:abcdefghijklmnopqrst".to_string(),
                "text:0:1:uvwx".to_string(),
                "link:0:2:focused=true:href=#one:text=abcdefghijklmnopqrst".to_string(),
                "link:0:3:focused=true:href=#one:text=uvwx".to_string(),
                "link:0:4:focused=false:href=#two:text=short".to_string(),
            ]
        );

        engine.set_viewport_cols(24);
        assert_eq!(
            render_snapshot_lines(&engine),
            vec![
                "text:0:0:abcdefghijklmnopqrstuvwx".to_string(),
                "link:0:1:focused=true:href=#one:text=abcdefghijklmnopqrstuvwx".to_string(),
                "link:0:2:focused=false:href=#two:text=short".to_string(),
            ]
        );

        engine.set_viewport_cols(8);
        engine
            .handle_key("down".to_string())
            .expect("down should move focus to second logical link");
        assert_eq!(engine.focused_link_index(), 1);
        assert_eq!(
            render_snapshot_lines(&engine),
            vec![
                "text:0:0:abcdefgh".to_string(),
                "text:0:1:ijklmnop".to_string(),
                "text:0:2:qrstuvwx".to_string(),
                "link:0:3:focused=false:href=#one:text=abcdefgh".to_string(),
                "link:0:4:focused=false:href=#one:text=ijklmnop".to_string(),
                "link:0:5:focused=false:href=#one:text=qrstuvwx".to_string(),
                "link:0:6:focused=true:href=#two:text=short".to_string(),
            ]
        );
    }

    #[test]
    fn phase_a_missing_fragment_fixture_keeps_runtime_state_stable() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(FIXTURE_MISSING_FRAGMENT)
            .expect("fixture should load");
        assert_eq!(
            render_snapshot_lines(&engine),
            vec![
                "text:0:0:Missing fragment".to_string(),
                "text:0:1:check".to_string(),
                "link:0:2:focused=true:href=#missing:text=Broken".to_string(),
            ]
        );

        let err = engine
            .handle_key_internal("enter")
            .expect_err("missing fragment must return error");
        assert!(
            err.contains("Card id not found"),
            "unexpected missing fragment error: {err}"
        );
        assert_eq!(engine.active_card_id().expect("active card"), "home");
        assert_eq!(engine.focused_link_index(), 0);
    }
}
