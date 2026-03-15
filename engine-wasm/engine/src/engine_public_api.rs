use crate::*;
impl WmlEngine {
    /// Construct a new engine instance with empty runtime state.
    pub fn new() -> WmlEngine {
        WmlEngine {
            deck: None,
            active_card_idx: 0,
            nav_stack: Vec::new(),
            focused_link_idx: 0,
            external_nav_intent: None,
            external_nav_request_policy: None,
            viewport_cols: DEFAULT_VIEWPORT_COLS,
            base_url: String::new(),
            content_type: String::new(),
            raw_bytes_base64: None,
            vars: HashMap::new(),
            script_units: HashMap::new(),
            script_entrypoints: HashMap::new(),
            pending_script_effects: ScriptRuntimeEffects::default(),
            last_script_outcome: None,
            last_script_dialog_requests: Vec::new(),
            last_script_timer_requests: Vec::new(),
            trace_entries: Vec::new(),
            next_trace_seq: 1,
            timer_dispatch_depth: 0,
            active_timer: None,
            active_input_edit: None,
            active_select_edit: None,
        }
    }

    /// Load a WML deck using default metadata (`text/vnd.wap.wml`).
    pub fn load_deck(&mut self, xml: &str) -> Result<(), String> {
        self.load_deck_context(xml, "", "text/vnd.wap.wml", None)
    }

    /// Load a WML deck with explicit transport metadata for traceability.
    pub fn load_deck_context(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
    ) -> Result<(), String> {
        if wml_xml.len() > MAX_DECK_WML_XML_BYTES {
            return Err(format!(
                "Deck payload exceeds {}-byte limit (got {} bytes)",
                MAX_DECK_WML_XML_BYTES,
                wml_xml.len()
            ));
        }
        if raw_bytes_base64
            .as_ref()
            .is_some_and(|payload| payload.len() > MAX_DECK_RAW_BYTES_BASE64_BYTES)
        {
            return Err(format!(
                "Raw deck payload exceeds {}-byte limit (got {} bytes)",
                MAX_DECK_RAW_BYTES_BASE64_BYTES,
                raw_bytes_base64.as_ref().map_or(0, |payload| payload.len())
            ));
        }

        let deck = parse_wml(wml_xml)?;
        self.deck = Some(deck);
        self.active_card_idx = 0;
        self.nav_stack.clear();
        self.focused_link_idx = 0;
        self.external_nav_intent = None;
        self.external_nav_request_policy = None;
        self.base_url = base_url.to_string();
        self.content_type = content_type.to_string();
        self.raw_bytes_base64 = raw_bytes_base64;
        self.vars.clear();
        self.script_units.clear();
        self.script_entrypoints.clear();
        self.pending_script_effects = ScriptRuntimeEffects::default();
        self.last_script_outcome = None;
        self.last_script_dialog_requests.clear();
        self.last_script_timer_requests.clear();
        self.active_input_edit = None;
        self.active_select_edit = None;
        self.clear_trace_entries();
        self.active_timer = None;
        self.push_trace("LOAD_DECK", format!("contentType={content_type}"));
        self.start_or_resume_timer_for_active_card(false)?;
        Ok(())
    }

    /// Read a runtime variable.
    pub fn get_var(&self, name: String) -> Option<String> {
        self.vars.get(&name).cloned()
    }

    /// Set a runtime variable if `name` passes deterministic validation.
    pub fn set_var(&mut self, name: String, value: String) -> bool {
        if !is_valid_var_name(&name) {
            return false;
        }
        self.vars.insert(name, value);
        true
    }

    /// Render active card into draw commands for the current viewport width.
    pub fn render(&self) -> Result<RenderList, String> {
        let card = self.active_card_internal()?;
        let mut runtime_card = card.clone();
        if let Some(edit) = &self.active_input_edit {
            self.apply_input_value_to_card(&mut runtime_card, &edit.input_name, &edit.draft_value);
        }
        if let Some(edit) = &self.active_select_edit {
            self.apply_select_index_to_card(&mut runtime_card, &edit.select_name, edit.draft_index);
        }
        let layout = layout_card(&runtime_card, self.viewport_cols, self.focused_link_idx);
        Ok(layout.render_list)
    }

    /// Handle one input key (`up`, `down`, `enter`).
    pub fn handle_key(&mut self, key: String) -> Result<(), String> {
        self.handle_key_internal(&key)
    }

    /// Navigate directly to a card id and push history.
    pub fn navigate_to_card(&mut self, id: String) -> Result<(), String> {
        self.navigate_to_card_internal(&id)
    }

    /// Navigate back in history. Returns `false` when history is empty.
    pub fn navigate_back(&mut self) -> bool {
        self.navigate_back_internal()
    }

    /// Advance simulated runtime clock for card timer lifecycle behavior.
    pub fn advance_time_ms(&mut self, delta_ms: u32) -> Result<(), String> {
        self.advance_time_ms_internal(delta_ms)
    }

    /// Set viewport width in columns.
    pub fn set_viewport_cols(&mut self, cols: usize) {
        self.viewport_cols = cols.max(1);
    }

    /// Start edit session for the currently focused input control.
    pub fn begin_focused_input_edit(&mut self) -> Result<bool, String> {
        self.begin_focused_input_edit_internal()
    }

    /// Replace edit-session draft value for the focused input.
    pub fn set_focused_input_edit_draft(&mut self, value: String) -> bool {
        let Some(input_name) = self
            .active_input_edit
            .as_ref()
            .map(|edit| edit.input_name.clone())
        else {
            return false;
        };
        let max_len = self.input_max_len_on_active_card(&input_name);
        let draft = truncate_to_chars(&value, max_len);
        if let Some(edit) = self.active_input_edit.as_mut() {
            edit.draft_value = draft;
            true
        } else {
            false
        }
    }

    /// Commit active focused-input edit session.
    pub fn commit_focused_input_edit(&mut self) -> Result<bool, String> {
        self.commit_focused_input_edit_internal()
    }

    /// Cancel active focused-input edit session.
    pub fn cancel_focused_input_edit(&mut self) -> bool {
        if self.active_input_edit.is_none() {
            return false;
        }
        self.active_input_edit = None;
        true
    }

    /// Start edit session for the currently focused select control.
    pub fn begin_focused_select_edit(&mut self) -> Result<bool, String> {
        self.begin_focused_select_edit_internal()
    }

    /// Move the draft selection for the active focused-select edit session.
    pub fn move_focused_select_edit(&mut self, delta: i32) -> bool {
        let Some(select_name) = self
            .active_select_edit
            .as_ref()
            .map(|edit| edit.select_name.clone())
        else {
            return false;
        };
        let Some(option_count) = self.select_option_count_on_active_card(&select_name) else {
            return false;
        };
        if option_count == 0 {
            return false;
        }
        if let Some(edit) = self.active_select_edit.as_mut() {
            edit.draft_index = wrap_select_index(edit.draft_index, delta, option_count);
            true
        } else {
            false
        }
    }

    /// Commit active focused-select edit session.
    pub fn commit_focused_select_edit(&mut self) -> Result<bool, String> {
        self.commit_focused_select_edit_internal()
    }

    /// Cancel active focused-select edit session.
    pub fn cancel_focused_select_edit(&mut self) -> bool {
        if self.active_select_edit.is_none() {
            return false;
        }
        self.active_select_edit = None;
        true
    }

    /// Return focused input name when edit session is active.
    pub fn focused_input_edit_name(&self) -> Option<String> {
        self.active_input_edit
            .as_ref()
            .map(|edit| edit.input_name.clone())
    }

    /// Return focused input draft value when edit session is active.
    pub fn focused_input_edit_value(&self) -> Option<String> {
        self.active_input_edit
            .as_ref()
            .map(|edit| edit.draft_value.clone())
    }

    /// Return focused select name when edit session is active.
    pub fn focused_select_edit_name(&self) -> Option<String> {
        self.active_select_edit
            .as_ref()
            .map(|edit| edit.select_name.clone())
    }

    /// Return focused select draft value when edit session is active.
    pub fn focused_select_edit_value(&self) -> Option<String> {
        let edit = self.active_select_edit.as_ref()?;
        self.select_value_on_active_card(&edit.select_name, edit.draft_index)
    }

    /// Get active card id.
    pub fn active_card_id(&self) -> Result<String, String> {
        let card = self.active_card_internal()?;
        Ok(card.id.clone())
    }

    /// Get focused link index for the active card layout.
    pub fn focused_link_index(&self) -> usize {
        self.focused_link_idx
    }

    /// Get deck base URL metadata from last `loadDeckContext`.
    pub fn base_url(&self) -> String {
        self.base_url.clone()
    }

    /// Get content type metadata from last `loadDeckContext`.
    pub fn content_type(&self) -> String {
        self.content_type.clone()
    }

    /// Get host-resolved external navigation intent when one is pending.
    pub fn external_navigation_intent(&self) -> Option<String> {
        self.external_nav_intent.clone()
    }

    /// Get request-policy metadata for the pending external navigation intent.
    pub fn external_navigation_request_policy(
        &self,
    ) -> Option<ScriptNavigationRequestPolicyLiteral> {
        self.external_nav_request_policy.clone()
    }

    /// Clear pending external navigation intent.
    pub fn clear_external_navigation_intent(&mut self) {
        self.external_nav_intent = None;
        self.external_nav_request_policy = None;
    }

    /// Execute a raw bytecode unit with no runtime host bindings.
    pub fn execute_script_unit(&self, bytes: Vec<u8>) -> ScriptExecutionOutcome {
        self.execute_script_unit_internal(&bytes)
    }

    /// Register a bytecode unit by source key.
    pub fn register_script_unit(&mut self, src: String, bytes: Vec<u8>) {
        self.script_units.insert(src, bytes);
    }

    /// Clear all registered units and function entry points.
    pub fn clear_script_units(&mut self) {
        self.script_units.clear();
        self.script_entrypoints.clear();
    }

    /// Register an entry point program counter for `src#function_name`.
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

    /// Clear all registered entry points.
    pub fn clear_script_entry_points(&mut self) {
        self.script_entrypoints.clear();
    }

    /// Execute script reference without applying deferred runtime effects.
    pub fn execute_script_ref(&mut self, src: String) -> ScriptExecutionOutcome {
        let outcome = self.execute_script_ref_internal(&src, "main");
        self.last_script_outcome = Some(outcome.clone());
        self.pending_script_effects = ScriptRuntimeEffects::default();
        self.last_script_dialog_requests.clear();
        self.last_script_timer_requests.clear();
        outcome
    }

    /// Execute script function without applying deferred runtime effects.
    pub fn execute_script_ref_function(
        &mut self,
        src: String,
        function_name: String,
    ) -> ScriptExecutionOutcome {
        let outcome = self.execute_script_ref_internal(&src, &function_name);
        self.last_script_outcome = Some(outcome.clone());
        self.pending_script_effects = ScriptRuntimeEffects::default();
        self.last_script_dialog_requests.clear();
        self.last_script_timer_requests.clear();
        outcome
    }

    /// Execute script function call without applying deferred runtime effects.
    pub fn execute_script_ref_call(
        &mut self,
        src: String,
        function_name: String,
        args: Vec<ScriptCallArgLiteral>,
    ) -> ScriptExecutionOutcome {
        let vm_args = convert_script_call_args(&args);
        let outcome = self.execute_script_ref_call_internal(&src, &function_name, &vm_args);
        self.last_script_outcome = Some(outcome.clone());
        self.pending_script_effects = ScriptRuntimeEffects::default();
        self.last_script_dialog_requests.clear();
        self.last_script_timer_requests.clear();
        outcome
    }

    /// Invoke script reference and apply deferred runtime effects at boundary.
    pub fn invoke_script_ref(&mut self, src: String) -> Result<ScriptInvocationOutcome, String> {
        self.invoke_script_ref_internal(&src, "main", &[])
    }

    /// Invoke script function and apply deferred runtime effects at boundary.
    pub fn invoke_script_ref_function(
        &mut self,
        src: String,
        function_name: String,
    ) -> Result<ScriptInvocationOutcome, String> {
        self.invoke_script_ref_internal(&src, &function_name, &[])
    }

    /// Invoke script function call and apply deferred runtime effects.
    pub fn invoke_script_ref_call(
        &mut self,
        src: String,
        function_name: String,
        args: Vec<ScriptCallArgLiteral>,
    ) -> Result<ScriptInvocationOutcome, String> {
        let vm_args = convert_script_call_args(&args);
        self.invoke_script_ref_internal(&src, &function_name, &vm_args)
    }

    /// Read last script trap message, if any.
    pub fn last_script_execution_trap(&self) -> Option<String> {
        self.last_script_outcome
            .as_ref()
            .and_then(|outcome| outcome.trap.clone())
    }

    /// Read `ok` status from the last script execution.
    pub fn last_script_execution_ok(&self) -> Option<bool> {
        self.last_script_outcome.as_ref().map(|outcome| outcome.ok)
    }

    /// Read classified error class from the last script execution.
    pub fn last_script_execution_error_class(&self) -> Option<String> {
        self.last_script_outcome
            .as_ref()
            .map(|outcome| outcome.error_class.as_str().to_string())
    }

    /// Read classified error category from the last script execution.
    pub fn last_script_execution_error_category(&self) -> Option<String> {
        self.last_script_outcome
            .as_ref()
            .map(|outcome| outcome.error_category.as_str().to_string())
    }

    /// Read refresh requirement from the last script execution.
    pub fn last_script_requires_refresh(&self) -> Option<bool> {
        self.last_script_outcome
            .as_ref()
            .map(|outcome| outcome.requires_refresh)
    }

    /// Read dialog side-effect requests from the last successful script invocation.
    pub fn last_script_dialog_requests(&self) -> Vec<ScriptDialogRequestLiteral> {
        self.last_script_dialog_requests
            .iter()
            .map(script_dialog_request_to_literal)
            .collect()
    }

    /// Read timer side-effect requests from the last successful script invocation.
    pub fn last_script_timer_requests(&self) -> Vec<ScriptTimerRequestLiteral> {
        self.last_script_timer_requests
            .iter()
            .map(script_timer_request_to_literal)
            .collect()
    }

    /// Get bounded trace buffer entries.
    pub fn trace_entries(&self) -> Vec<EngineTraceEntry> {
        self.trace_entries.clone()
    }

    /// Clear trace entries and reset trace sequence numbering.
    pub fn clear_trace_entries(&mut self) {
        self.trace_entries.clear();
        self.next_trace_seq = 1;
    }
}

fn truncate_to_chars(value: &str, max_len: Option<usize>) -> String {
    let Some(limit) = max_len else {
        return value.to_string();
    };
    value.chars().take(limit).collect()
}

fn wrap_select_index(current: usize, delta: i32, len: usize) -> usize {
    let len = len.max(1) as i32;
    let current = current as i32;
    let next = (current + delta).rem_euclid(len);
    next as usize
}
