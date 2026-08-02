#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
use crate::*;
#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
use serde::Serialize;
#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
use wasm_bindgen::prelude::{wasm_bindgen, JsValue};
#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
#[wasm_bindgen]
impl WmlEngine {
    #[wasm_bindgen(constructor)]
    pub fn wasm_new() -> WmlEngine {
        Self::new()
    }

    #[wasm_bindgen(js_name = loadDeck)]
    pub fn load_deck_wasm(&mut self, xml: &str) -> Result<(), JsValue> {
        self.load_deck(xml).map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = loadDeckContext)]
    pub fn load_deck_context_wasm(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
        referring_url: Option<String>,
    ) -> Result<(), JsValue> {
        self.load_deck_context_with_referring_url(
            wml_xml,
            base_url,
            content_type,
            raw_bytes_base64,
            referring_url.as_deref(),
        )
        .map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = loadDeckContextForNavigation)]
    pub fn load_deck_context_for_navigation_wasm(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
        referring_url: Option<String>,
        navigation_url: Option<String>,
        navigation_kind: Option<String>,
    ) -> Result<(), JsValue> {
        let navigation_kind = match navigation_kind.as_deref() {
            None | Some("independent") => DeckNavigationKind::Independent,
            Some("forward") => DeckNavigationKind::Forward,
            Some("backward") => DeckNavigationKind::Backward,
            Some("reload") => DeckNavigationKind::Reload,
            Some(value) => return Err(as_js_err(format!("Unknown deck navigation kind: {value}"))),
        };
        self.load_deck_context_for_navigation(
            wml_xml,
            base_url,
            content_type,
            raw_bytes_base64,
            DeckNavigationContext::new(
                referring_url.as_deref(),
                navigation_url.as_deref(),
                navigation_kind,
            ),
        )
        .map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = getVar)]
    pub fn get_var_wasm(&self, name: String) -> Option<String> {
        self.get_var(name)
    }

    #[wasm_bindgen(js_name = setVar)]
    pub fn set_var_wasm(&mut self, name: String, value: String) -> bool {
        self.set_var(name, value)
    }

    #[wasm_bindgen(js_name = beginFocusedInputEdit)]
    pub fn begin_focused_input_edit_wasm(&mut self) -> Result<bool, JsValue> {
        self.begin_focused_input_edit().map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = setFocusedInputEditDraft)]
    pub fn set_focused_input_edit_draft_wasm(&mut self, value: String) -> bool {
        self.set_focused_input_edit_draft(value)
    }

    #[wasm_bindgen(js_name = commitFocusedInputEdit)]
    pub fn commit_focused_input_edit_wasm(&mut self) -> Result<bool, JsValue> {
        self.commit_focused_input_edit().map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = cancelFocusedInputEdit)]
    pub fn cancel_focused_input_edit_wasm(&mut self) -> bool {
        self.cancel_focused_input_edit()
    }

    #[wasm_bindgen(js_name = focusedInputEditName)]
    pub fn focused_input_edit_name_wasm(&self) -> Option<String> {
        self.focused_input_edit_name()
    }

    #[wasm_bindgen(js_name = focusedInputEditValue)]
    pub fn focused_input_edit_value_wasm(&self) -> Option<String> {
        self.focused_input_edit_value()
    }

    #[wasm_bindgen(js_name = beginFocusedSelectEdit)]
    pub fn begin_focused_select_edit_wasm(&mut self) -> Result<bool, JsValue> {
        self.begin_focused_select_edit().map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = moveFocusedSelectEdit)]
    pub fn move_focused_select_edit_wasm(&mut self, delta: i32) -> bool {
        self.move_focused_select_edit(delta)
    }

    #[wasm_bindgen(js_name = commitFocusedSelectEdit)]
    pub fn commit_focused_select_edit_wasm(&mut self) -> Result<bool, JsValue> {
        self.commit_focused_select_edit().map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = cancelFocusedSelectEdit)]
    pub fn cancel_focused_select_edit_wasm(&mut self) -> bool {
        self.cancel_focused_select_edit()
    }

    #[wasm_bindgen(js_name = focusedSelectEditName)]
    pub fn focused_select_edit_name_wasm(&self) -> Option<String> {
        self.focused_select_edit_name()
    }

    #[wasm_bindgen(js_name = focusedSelectEditValue)]
    pub fn focused_select_edit_value_wasm(&self) -> Option<String> {
        self.focused_select_edit_value()
    }

    #[wasm_bindgen(js_name = render)]
    pub fn render_wasm(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.render().map_err(render_js_err)?)
    }

    #[wasm_bindgen(js_name = renderFrame)]
    pub fn render_frame_wasm(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.render_frame().map_err(render_js_err)?)
    }

    #[wasm_bindgen(js_name = handleKey)]
    pub fn handle_key_wasm(&mut self, key: String) -> Result<(), JsValue> {
        self.handle_key(key).map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = handleInput)]
    pub fn handle_input_wasm(&mut self, event: JsValue) -> Result<(), JsValue> {
        let event: EngineInputEvent = serde_wasm_bindgen::from_value(event)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        self.handle_input(event).map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = navigateToCard)]
    pub fn navigate_to_card_wasm(&mut self, id: String) -> Result<(), JsValue> {
        self.navigate_to_card(id).map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = navigateBack)]
    pub fn navigate_back_wasm(&mut self) -> bool {
        self.navigate_back()
    }

    #[wasm_bindgen(js_name = lastBackNavigationHandled)]
    pub fn last_back_navigation_handled_wasm(&self) -> bool {
        self.last_back_navigation_handled()
    }

    #[wasm_bindgen(js_name = advanceTimeMs)]
    pub fn advance_time_ms_wasm(&mut self, delta_ms: u32) -> Result<(), JsValue> {
        self.advance_time_ms(delta_ms).map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = lastRuntimeFailureCode)]
    pub fn last_runtime_failure_code_wasm(&self) -> Option<String> {
        self.last_runtime_failure_code()
    }

    #[wasm_bindgen(js_name = lastRuntimeFailureMessage)]
    pub fn last_runtime_failure_message_wasm(&self) -> Option<String> {
        self.last_runtime_failure_message()
    }

    #[wasm_bindgen(js_name = nextTimerWakeupMs)]
    pub fn next_timer_wakeup_ms_wasm(&self) -> Option<u32> {
        self.next_timer_wakeup_ms()
    }

    #[wasm_bindgen(js_name = setViewportCols)]
    pub fn set_viewport_cols_wasm(&mut self, cols: f64) -> Result<(), JsValue> {
        if !cols.is_finite()
            || cols.fract() != 0.0
            || cols < f64::from(ENGINE_VIEWPORT_MIN_COLS)
            || cols > f64::from(ENGINE_VIEWPORT_MAX_COLS)
        {
            return Err(viewport_js_err(EngineViewportError::invalid(cols)));
        }
        self.set_viewport_cols(cols as u64).map_err(viewport_js_err)
    }

    #[wasm_bindgen(js_name = activeCardId)]
    pub fn active_card_id_wasm(&self) -> Result<String, JsValue> {
        self.active_card_id().map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = focusedLinkIndex)]
    pub fn focused_link_index_wasm(&self) -> usize {
        self.focused_link_index()
    }

    #[wasm_bindgen(js_name = baseUrl)]
    pub fn base_url_wasm(&self) -> String {
        self.base_url()
    }

    #[wasm_bindgen(js_name = contentType)]
    pub fn content_type_wasm(&self) -> String {
        self.content_type()
    }

    #[wasm_bindgen(js_name = browserContextEpoch)]
    pub fn browser_context_epoch_wasm(&self) -> u32 {
        self.browser_context_epoch()
    }

    #[wasm_bindgen(js_name = historyPushSequence)]
    pub fn history_push_sequence_wasm(&self) -> u32 {
        self.history_push_sequence()
    }

    #[wasm_bindgen(js_name = deckLanguage)]
    pub fn deck_language_wasm(&self) -> Option<String> {
        self.deck_language()
    }

    #[wasm_bindgen(js_name = activeCardLanguage)]
    pub fn active_card_language_wasm(&self) -> Option<String> {
        self.active_card_language()
    }

    #[wasm_bindgen(js_name = lastWmlLoadDiagnostics)]
    pub fn last_wml_load_diagnostics_wasm(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.last_wml_load_diagnostics())
    }

    #[wasm_bindgen(js_name = externalNavigationIntent)]
    pub fn external_navigation_intent_wasm(&self) -> Option<String> {
        self.external_navigation_intent()
    }

    #[wasm_bindgen(js_name = externalNavigationRequestPolicy)]
    pub fn external_navigation_request_policy_wasm(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.external_navigation_request_policy())
    }

    #[wasm_bindgen(js_name = clearExternalNavigationIntent)]
    pub fn clear_external_navigation_intent_wasm(&mut self) {
        self.clear_external_navigation_intent();
    }

    #[wasm_bindgen(js_name = executeScriptUnit)]
    pub fn execute_script_unit_wasm(&self, bytes: Vec<u8>) -> Result<JsValue, JsValue> {
        to_js_value(&self.execute_script_unit(bytes))
    }

    #[wasm_bindgen(js_name = registerScriptUnit)]
    pub fn register_script_unit_wasm(&mut self, src: String, bytes: Vec<u8>) {
        self.register_script_unit(src, bytes);
    }

    #[wasm_bindgen(js_name = clearScriptUnits)]
    pub fn clear_script_units_wasm(&mut self) {
        self.clear_script_units();
    }

    #[wasm_bindgen(js_name = registerScriptEntryPoint)]
    pub fn register_script_entry_point_wasm(
        &mut self,
        src: String,
        function_name: String,
        entry_pc: usize,
    ) {
        self.register_script_entry_point(src, function_name, entry_pc);
    }

    #[wasm_bindgen(js_name = clearScriptEntryPoints)]
    pub fn clear_script_entry_points_wasm(&mut self) {
        self.clear_script_entry_points();
    }

    #[wasm_bindgen(js_name = executeScriptRef)]
    pub fn execute_script_ref_wasm(&mut self, src: String) -> Result<JsValue, JsValue> {
        to_js_value(&self.execute_script_ref(src))
    }

    #[wasm_bindgen(js_name = executeScriptRefFunction)]
    pub fn execute_script_ref_function_wasm(
        &mut self,
        src: String,
        function_name: String,
    ) -> Result<JsValue, JsValue> {
        to_js_value(&self.execute_script_ref_function(src, function_name))
    }

    #[wasm_bindgen(js_name = executeScriptRefCall)]
    pub fn execute_script_ref_call_wasm(
        &mut self,
        src: String,
        function_name: String,
        args: JsValue,
    ) -> Result<JsValue, JsValue> {
        let call_args: Vec<ScriptCallArgLiteral> = serde_wasm_bindgen::from_value(args)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        to_js_value(&self.execute_script_ref_call(src, function_name, call_args))
    }

    #[wasm_bindgen(js_name = invokeScriptRef)]
    pub fn invoke_script_ref_wasm(&mut self, src: String) -> Result<JsValue, JsValue> {
        let outcome = self.invoke_script_ref(src).map_err(as_js_err)?;
        to_js_value(&outcome)
    }

    #[wasm_bindgen(js_name = invokeScriptRefFunction)]
    pub fn invoke_script_ref_function_wasm(
        &mut self,
        src: String,
        function_name: String,
    ) -> Result<JsValue, JsValue> {
        let outcome = self
            .invoke_script_ref_function(src, function_name)
            .map_err(as_js_err)?;
        to_js_value(&outcome)
    }

    #[wasm_bindgen(js_name = invokeScriptRefCall)]
    pub fn invoke_script_ref_call_wasm(
        &mut self,
        src: String,
        function_name: String,
        args: JsValue,
    ) -> Result<JsValue, JsValue> {
        let call_args: Vec<ScriptCallArgLiteral> = serde_wasm_bindgen::from_value(args)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let outcome = self
            .invoke_script_ref_call(src, function_name, call_args)
            .map_err(as_js_err)?;
        to_js_value(&outcome)
    }

    #[wasm_bindgen(js_name = lastScriptExecutionTrap)]
    pub fn last_script_execution_trap_wasm(&self) -> Option<String> {
        self.last_script_execution_trap()
    }

    #[wasm_bindgen(js_name = lastScriptExecutionOk)]
    pub fn last_script_execution_ok_wasm(&self) -> Option<bool> {
        self.last_script_execution_ok()
    }

    #[wasm_bindgen(js_name = lastScriptExecutionErrorClass)]
    pub fn last_script_execution_error_class_wasm(&self) -> Option<String> {
        self.last_script_execution_error_class()
    }

    #[wasm_bindgen(js_name = lastScriptExecutionErrorCategory)]
    pub fn last_script_execution_error_category_wasm(&self) -> Option<String> {
        self.last_script_execution_error_category()
    }

    #[wasm_bindgen(js_name = lastScriptRequiresRefresh)]
    pub fn last_script_requires_refresh_wasm(&self) -> Option<bool> {
        self.last_script_requires_refresh()
    }

    #[wasm_bindgen(js_name = lastScriptDialogRequests)]
    pub fn last_script_dialog_requests_wasm(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.last_script_dialog_requests())
    }

    #[wasm_bindgen(js_name = lastScriptTimerRequests)]
    pub fn last_script_timer_requests_wasm(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.last_script_timer_requests())
    }

    #[wasm_bindgen(js_name = traceEntries)]
    pub fn trace_entries_wasm(&self) -> Result<JsValue, JsValue> {
        to_js_value(&self.trace_entries())
    }

    #[wasm_bindgen(js_name = clearTraceEntries)]
    pub fn clear_trace_entries_wasm(&mut self) {
        self.clear_trace_entries();
    }
}
#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
fn to_js_value<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(value).map_err(|err| JsValue::from_str(&err.to_string()))
}

#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
fn as_js_err(message: String) -> JsValue {
    JsValue::from_str(&message)
}

#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
fn viewport_js_err(error: EngineViewportError) -> JsValue {
    to_js_value(&error).unwrap_or_else(|serialization_error| serialization_error)
}

#[cfg(all(feature = "wasm-bindings", target_arch = "wasm32"))]
fn render_js_err(error: EngineRenderError) -> JsValue {
    to_js_value(&error).unwrap_or_else(|serialization_error| serialization_error)
}

#[cfg(all(test, feature = "wasm-bindings", target_arch = "wasm32"))]
#[path = "engine_wasm_bindings_tests.rs"]
mod tests;
