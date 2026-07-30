use crate::runtime::node::{InlineNode, Node};
use crate::runtime::variable::{
    checked_insert as checked_insert_var, evaluate as evaluate_variable, SubstitutionContext,
};
use crate::*;

mod debug;
mod navigation;
mod node_lookup;
mod script_effects;
mod timers;
mod trace;

#[cfg(test)]
pub(crate) use navigation::{parse_script_href, ParsedScriptRef};

impl WmlEngine {
    pub(crate) fn execute_script_unit_internal(&self, bytes: &[u8]) -> ScriptExecutionOutcome {
        let decoded_unit = match decode_compilation_unit(bytes) {
            Ok(unit) => unit,
            Err(err) => {
                return ScriptExecutionOutcome::fatal(
                    format_decode_error(err),
                    ScriptErrorCategoryLiteral::Integrity,
                );
            }
        };

        let vm = Vm::default();
        match vm.execute(&decoded_unit) {
            Ok(result) => ScriptExecutionOutcome::ok(
                script_value_to_literal(result),
                ScriptNavigationIntentLiteral::None,
                false,
            ),
            Err(trap) => classify_vm_trap_outcome(trap, ScriptNavigationIntentLiteral::None, false),
        }
    }

    pub(crate) fn execute_script_ref_internal(
        &mut self,
        src: &str,
        function_name: &str,
    ) -> ScriptExecutionOutcome {
        self.execute_script_ref_call_internal(src, function_name, &[])
    }

    pub(crate) fn execute_script_ref_call_internal(
        &mut self,
        src: &str,
        function_name: &str,
        args: &[ScriptValue],
    ) -> ScriptExecutionOutcome {
        if self.debug_recorder.is_some() {
            self.debug_emit(EngineDebugEventPayload::ScriptInvoke {
                source: crate::engine_debug_recorder::sanitize_url(src),
                function_name: self.debug_safe_function_name(function_name),
            });
        }
        let outcome = self.execute_script_ref_call_uninstrumented(src, function_name, args);
        if outcome.trap.is_some() && self.debug_recorder.is_some() {
            self.debug_emit(EngineDebugEventPayload::ScriptTrap {
                source: crate::engine_debug_recorder::sanitize_url(src),
                function_name: self.debug_safe_function_name(function_name),
                detail: EngineDebugValue::Omitted {
                    reason: EngineDebugRedactionReason::Policy,
                },
            });
        }
        outcome
    }

    fn execute_script_ref_call_uninstrumented(
        &mut self,
        src: &str,
        function_name: &str,
        args: &[ScriptValue],
    ) -> ScriptExecutionOutcome {
        let Some(bytes) = self.script_units.get(src) else {
            return ScriptExecutionOutcome::fatal(
                format!("loader: script unit not registered ({src})"),
                ScriptErrorCategoryLiteral::HostBinding,
            );
        };

        if !self.script_entrypoints.contains_key(src) {
            return self.execute_wap_script_ref_call(bytes, src, function_name, args);
        }

        let decoded_unit = match decode_compilation_unit(bytes) {
            Ok(unit) => unit,
            Err(err) => {
                return ScriptExecutionOutcome::fatal(
                    format_decode_error(err),
                    ScriptErrorCategoryLiteral::Integrity,
                );
            }
        };

        let Some(entry_pc) = self
            .script_entrypoints
            .get(src)
            .and_then(|entrypoints| entrypoints.get(function_name))
        else {
            return ScriptExecutionOutcome::fatal(
                format!("loader: function entry point not registered ({src}#{function_name})"),
                ScriptErrorCategoryLiteral::HostBinding,
            );
        };
        let entry_pc = *entry_pc;

        self.pending_script_effects = ScriptRuntimeEffects::default();
        let active_card_id = self.active_card_id().ok();
        let mut host = WmlBrowserHost::new(
            &mut self.vars,
            &mut self.pending_script_effects,
            crate::wavescript::stdlib::wmlbrowser::WmlBrowserContext {
                base_url: Some(self.base_url.clone()),
                active_card_id,
            },
        );
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
            Err(trap) => classify_vm_trap_outcome(
                trap,
                script_nav_intent_to_literal(self.pending_script_effects.navigation_intent()),
                self.pending_script_effects.requires_refresh(),
            ),
        }
    }

    fn execute_wap_script_ref_call(
        &self,
        bytes: &[u8],
        src: &str,
        function_name: &str,
        args: &[ScriptValue],
    ) -> ScriptExecutionOutcome {
        let unit = match decode_wap_compilation_unit(bytes) {
            Ok(unit) => unit,
            Err(error) => {
                let category = if error.is_resource_exhaustion() {
                    ScriptErrorCategoryLiteral::Resource
                } else {
                    ScriptErrorCategoryLiteral::Integrity
                };
                return ScriptExecutionOutcome::fatal(format!("wap decode: {error}"), category);
            }
        };

        match execute_named_function(&unit, function_name, args) {
            Ok(result) => ScriptExecutionOutcome::ok(
                script_value_to_literal(result),
                ScriptNavigationIntentLiteral::None,
                false,
            ),
            Err(WapRuntimeError::ExternalFunctionNotFound { function_name }) => {
                ScriptExecutionOutcome::fatal(
                    format!("wap runtime: external function not found ({src}#{function_name})"),
                    ScriptErrorCategoryLiteral::HostBinding,
                )
            }
            Err(WapRuntimeError::InvalidArgumentCount {
                function,
                expected,
                actual,
            }) => ScriptExecutionOutcome::fatal(
                format!(
                    "wap runtime: invalid argument count for function {function} (expected={expected}, actual={actual})"
                ),
                ScriptErrorCategoryLiteral::Integrity,
            ),
            Err(WapRuntimeError::UnsupportedExecutionOpcode {
                function,
                pc,
                opcode,
            }) => ScriptExecutionOutcome::fatal(
                format!(
                    "wap runtime: unsupported execution opcode 0x{opcode:02x} in function {function} at pc={pc}"
                ),
                ScriptErrorCategoryLiteral::HostBinding,
            ),
            Err(WapRuntimeError::UnsupportedImplicitReturn { function }) => {
                ScriptExecutionOutcome::fatal(
                    format!(
                        "wap runtime: unsupported implicit return in function {function}"
                    ),
                    ScriptErrorCategoryLiteral::HostBinding,
                )
            }
            Err(WapRuntimeError::InvalidFunctionIndex { index }) => {
                ScriptExecutionOutcome::fatal(
                    format!("wap runtime: invalid function index {index}"),
                    ScriptErrorCategoryLiteral::Integrity,
                )
            }
        }
    }

    pub(crate) fn invoke_script_ref_internal(
        &mut self,
        src: &str,
        function_name: &str,
        args: &[ScriptValue],
    ) -> Result<ScriptInvocationOutcome, String> {
        let outcome = self.execute_script_ref_call_internal(src, function_name, args);
        self.last_script_outcome = Some(outcome.clone());

        if outcome.invocation_aborted {
            self.pending_script_effects = ScriptRuntimeEffects::default();
            self.last_script_dialog_requests.clear();
            self.last_script_timer_requests.clear();
            return Err(outcome
                .trap
                .unwrap_or_else(|| "script invocation failed".to_string()));
        }

        if let Err(message) = self.apply_pending_script_effects() {
            // The script's own execution succeeded, but the navigation it
            // requested (e.g. `WMLBrowser.go("#missing")`) failed. The outcome
            // recorded above still reflects the script's success and must be
            // overwritten, or `lastScriptExecutionOk()`/error-class queries
            // would contradict the `Err` this function is about to return.
            self.last_script_outcome = Some(ScriptExecutionOutcome::fatal(
                message.clone(),
                ScriptErrorCategoryLiteral::HostBinding,
            ));
            return Err(message);
        }
        Ok(ScriptInvocationOutcome::from_execution(&outcome))
    }

    pub(crate) fn handle_key_internal(&mut self, key: &str) -> Result<(), String> {
        self.push_trace("KEY", format!("key={key}"));
        let card = self.active_card_internal()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx)
            .map_err(|error| error.to_string())?;
        let accept_action = self.active_do_action_internal("accept")?;
        let target_total = layout.focus_targets.len();
        self.focused_link_idx = clamp_focus(self.focused_link_idx, target_total);

        match key {
            "up" => {
                if self.active_select_edit.is_some() {
                    self.move_focused_select_edit(-1);
                    return Ok(());
                }
                if self.active_input_edit.is_some() {
                    self.commit_focused_input_edit_internal()?;
                }
                self.set_focused_link_idx_with_debug(move_focus_up(
                    self.focused_link_idx,
                    target_total,
                ));
            }
            "down" => {
                if self.active_select_edit.is_some() {
                    self.move_focused_select_edit(1);
                    return Ok(());
                }
                if self.active_input_edit.is_some() {
                    self.commit_focused_input_edit_internal()?;
                }
                self.set_focused_link_idx_with_debug(move_focus_down(
                    self.focused_link_idx,
                    target_total,
                ));
            }
            "enter" => {
                if target_total == 0 {
                    if let Some(action) = accept_action {
                        self.push_trace("ACTION_ACCEPT", String::new());
                        self.debug_emit_lazy(|| EngineDebugEventPayload::ActionAccept {
                            action_type: "accept".to_string(),
                            name: None,
                        });
                        self.execute_card_task_action(&action)?;
                    }
                    return Ok(());
                }
                let target = layout
                    .focus_targets
                    .get(self.focused_link_idx)
                    .ok_or_else(|| "Focused target index out of range".to_string())?;
                match target {
                    FocusTarget::Input { name, .. } => {
                        self.active_select_edit = None;
                        self.push_trace("ACTION_INPUT", name.clone());
                        if self.active_input_edit.is_some() {
                            self.commit_focused_input_edit_internal()?;
                            if let Some(action) = accept_action {
                                self.push_trace("ACTION_ACCEPT", String::new());
                                self.debug_emit_lazy(|| EngineDebugEventPayload::ActionAccept {
                                    action_type: "accept".to_string(),
                                    name: None,
                                });
                                self.execute_card_task_action(&action)?;
                            }
                        } else if let Some(action) = accept_action {
                            self.push_trace("ACTION_ACCEPT", String::new());
                            self.debug_emit_lazy(|| EngineDebugEventPayload::ActionAccept {
                                action_type: "accept".to_string(),
                                name: None,
                            });
                            self.execute_card_task_action(&action)?;
                        } else {
                            self.begin_focused_input_edit_internal()?;
                        }
                        return Ok(());
                    }
                    FocusTarget::Select(name) => {
                        self.cancel_active_input_edit_with_debug();
                        self.push_trace("ACTION_SELECT", name.clone());
                        if self.active_select_edit.is_some() {
                            self.commit_focused_select_edit_internal()?;
                        } else {
                            self.begin_focused_select_edit_internal()?;
                        }
                        return Ok(());
                    }
                    FocusTarget::Link(href) => {
                        self.cancel_active_input_edit_with_debug();
                        self.active_select_edit = None;
                        self.execute_action_href(href)?;
                    }
                }
            }
            _ => {}
        }

        Ok(())
    }

    pub(crate) fn begin_focused_input_edit_internal(&mut self) -> Result<bool, String> {
        let Some((control_id, input_name)) = self.focused_input_internal()? else {
            return Ok(false);
        };
        let current = self
            .input_value_on_active_card(&control_id)
            .unwrap_or_default();
        self.active_select_edit = None;
        let debug_reason = self
            .debug_recorder
            .is_some()
            .then(|| self.debug_input_reason(&control_id, &input_name))
            .flatten();
        self.active_input_edit = Some(InputEditState {
            control_id,
            input_name: input_name.clone(),
            original_value: current.clone(),
            draft_value: current,
        });
        if let Some(reason) = debug_reason {
            self.debug_mark_variable(input_name.clone(), reason);
        }
        self.debug_emit_lazy(|| EngineDebugEventPayload::InputEditStart {
            name: input_name.clone(),
        });
        self.push_trace("INPUT_EDIT_START", input_name);
        Ok(true)
    }

    pub(crate) fn commit_focused_input_edit_internal(&mut self) -> Result<bool, String> {
        let Some(edit) = self.active_input_edit.clone() else {
            return Ok(false);
        };
        let Some((mask, empty_ok)) = self.input_constraints_on_active_card(&edit.control_id) else {
            return Ok(false);
        };
        let rejection = if edit.draft_value.is_empty() && !empty_ok {
            Some(format!(
                "Input '{}' rejected: empty value is not allowed",
                edit.input_name
            ))
        } else if !edit.draft_value.is_empty() && !mask.accepts(&edit.draft_value) {
            Some(format!(
                "Input '{}' rejected: value does not conform to format mask",
                edit.input_name
            ))
        } else {
            None
        };
        if let Some(error) = rejection {
            self.push_trace("INPUT_EDIT_REJECT", edit.input_name);
            return Err(error);
        }
        let committed = self.set_input_value_on_active_card(&edit.control_id, &edit.draft_value)?;
        if !committed {
            return Ok(false);
        }
        self.set_var(edit.input_name.clone(), edit.draft_value.clone());
        if self.debug_recorder.is_some() {
            let reason = self.debug_input_reason(&edit.control_id, &edit.input_name);
            if let Some(reason) = reason.clone() {
                self.debug_mark_variable(edit.input_name.clone(), reason);
            }
            self.debug_emit(EngineDebugEventPayload::InputEditCommit {
                name: edit.input_name.clone(),
                value: crate::engine_debug_recorder::sanitize_text(&edit.draft_value, reason),
            });
        }
        self.active_input_edit = None;
        self.push_trace("INPUT_EDIT_COMMIT", edit.input_name);
        Ok(true)
    }

    pub(crate) fn initialize_controls_on_active_card(&mut self) -> Result<(), String> {
        let (deck, vars) = (&mut self.deck, &mut self.vars);
        let card = deck
            .as_mut()
            .and_then(|deck| deck.cards.get_mut(self.active_card_idx))
            .ok_or_else(|| "Active card not found".to_string())?;

        for control in node_lookup::controls_mut(card) {
            match control {
                node_lookup::ControlMut::Input(input) => {
                    let valid_existing = vars.get(input.name).cloned().filter(|candidate| {
                        input_value_is_valid(input.mask, input.empty_ok, candidate)
                    });
                    let initial_value = if let Some(existing) = valid_existing {
                        Some(existing)
                    } else {
                        vars.remove(input.name);
                        input
                            .default_value
                            .as_deref()
                            .map(|candidate| evaluate_vdata(candidate, vars))
                            .transpose()?
                            .filter(|candidate| {
                                input_value_is_valid(input.mask, input.empty_ok, candidate)
                            })
                    };

                    if let Some(initial_value) = initial_value {
                        checked_insert_var(vars, input.name.to_string(), initial_value.clone())?;
                        *input.value = initial_value;
                    } else {
                        vars.remove(input.name);
                        input.value.clear();
                    }
                }
                node_lookup::ControlMut::Select(select) => {
                    *select.selected_indices = initial_select_indices(
                        select.name,
                        select.iname,
                        select.default_value,
                        select.default_index_value,
                        select.multiple,
                        select.options,
                        vars,
                    )?;
                    sync_select_variables(
                        vars,
                        select.name,
                        select.iname,
                        select.multiple,
                        select.options,
                        select.selected_indices,
                    )?;
                }
            }
        }
        Ok(())
    }

    pub(crate) fn begin_focused_select_edit_internal(&mut self) -> Result<bool, String> {
        let Some(select_name) = self.focused_select_name_internal()? else {
            return Ok(false);
        };
        let Some(current_index) = self.select_selected_index_on_active_card(&select_name) else {
            return Ok(false);
        };
        self.cancel_active_input_edit_with_debug();
        self.active_select_edit = Some(SelectEditState {
            select_name: select_name.clone(),
            draft_index: current_index,
        });
        self.push_trace("SELECT_EDIT_START", select_name);
        Ok(true)
    }

    pub(crate) fn commit_focused_select_edit_internal(&mut self) -> Result<bool, String> {
        let Some(edit) = self.active_select_edit.clone() else {
            return Ok(false);
        };
        let Some((multiple, mut selected_indices, onpick)) =
            self.select_state_on_active_card(&edit.select_name, edit.draft_index)
        else {
            return Ok(false);
        };
        if multiple {
            if let Some(position) = selected_indices
                .iter()
                .position(|index| *index == edit.draft_index)
            {
                selected_indices.remove(position);
            } else {
                selected_indices.push(edit.draft_index);
            }
        } else {
            selected_indices.clear();
            selected_indices.push(edit.draft_index);
        }
        let committed =
            self.set_select_selected_indices_on_active_card(&edit.select_name, &selected_indices)?;
        if !committed {
            return Ok(false);
        }
        self.sync_select_variables_on_active_card(&edit.select_name)?;
        self.active_select_edit = None;
        self.push_trace("SELECT_EDIT_COMMIT", edit.select_name.clone());
        if let Some(onpick) = onpick {
            let (base_action, _) = onpick.base_and_set_vars();
            let detail = match base_action {
                CardTaskAction::Go { href, .. } => href.clone(),
                CardTaskAction::Prev => "prev".to_string(),
                CardTaskAction::Refresh => "refresh".to_string(),
                CardTaskAction::Noop => "noop".to_string(),
                CardTaskAction::WithSetVars { .. } => {
                    unreachable!("base_and_set_vars unwraps the setvar wrapper")
                }
            };
            self.push_trace("ACTION_ONPICK", detail);
            self.execute_card_task_action(&onpick)?;
        }
        Ok(true)
    }

    fn focused_input_internal(&self) -> Result<Option<(String, String)>, String> {
        let card = self.active_card_internal()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx)
            .map_err(|error| error.to_string())?;
        let focused_idx = clamp_focus(self.focused_link_idx, layout.focus_targets.len());
        let Some(target) = layout.focus_targets.get(focused_idx) else {
            return Ok(None);
        };
        match target {
            FocusTarget::Input { control_id, name } => Ok(Some((control_id.clone(), name.clone()))),
            FocusTarget::Select(_) | FocusTarget::Link(_) => Ok(None),
        }
    }

    fn focused_select_name_internal(&self) -> Result<Option<String>, String> {
        let card = self.active_card_internal()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx)
            .map_err(|error| error.to_string())?;
        let focused_idx = clamp_focus(self.focused_link_idx, layout.focus_targets.len());
        let Some(target) = layout.focus_targets.get(focused_idx) else {
            return Ok(None);
        };
        match target {
            FocusTarget::Select(name) => Ok(Some(name.clone())),
            FocusTarget::Input { .. } | FocusTarget::Link(_) => Ok(None),
        }
    }

    fn input_value_on_active_card(&self, control_id: &str) -> Option<String> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_input(card, control_id).map(|input| input.value.to_string())
    }

    fn input_value_for_name_on_active_card(&self, name: &str) -> Option<String> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_input_by_name(card, name).map(|input| input.value.to_string())
    }

    fn set_input_value_on_active_card(
        &mut self,
        control_id: &str,
        value: &str,
    ) -> Result<bool, String> {
        let card = self.active_card_internal_mut()?;
        let Some(input) = node_lookup::find_input_mut(card, control_id) else {
            return Ok(false);
        };
        *input.value = value.to_string();
        Ok(true)
    }

    pub(crate) fn apply_input_value_to_card(
        &self,
        card: &mut runtime::card::Card,
        control_id: &str,
        value: &str,
    ) {
        if let Some(input) = node_lookup::find_input_mut(card, control_id) {
            *input.value = value.to_string();
        }
    }

    pub(crate) fn select_selected_index_on_active_card(&self, select_name: &str) -> Option<usize> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_select(card, select_name).and_then(|select| {
            select
                .selected_indices
                .first()
                .copied()
                .or_else(|| (!select.options.is_empty()).then_some(0))
        })
    }

    pub(crate) fn select_option_count_on_active_card(&self, select_name: &str) -> Option<usize> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_select(card, select_name).map(|select| select.options.len())
    }

    pub(crate) fn select_value_on_active_card(
        &self,
        select_name: &str,
        selected_index: usize,
    ) -> Option<String> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_select(card, select_name)?
            .options
            .get(selected_index)
            .and_then(|option| evaluate_vdata(&option.value, &self.vars).ok())
    }

    pub(crate) fn set_select_selected_indices_on_active_card(
        &mut self,
        select_name: &str,
        selected_indices: &[usize],
    ) -> Result<bool, String> {
        let card = self.active_card_internal_mut()?;
        for select in node_lookup::selects_with_control_id_mut(card, select_name) {
            if selected_indices
                .iter()
                .all(|index| *index < select.options.len())
            {
                *select.selected_indices = selected_indices.to_vec();
                return Ok(true);
            }
        }
        Ok(false)
    }

    pub(crate) fn apply_select_index_to_card(
        &self,
        card: &mut runtime::card::Card,
        select_name: &str,
        selected_index: usize,
    ) {
        for select in node_lookup::selects_with_control_id_mut(card, select_name) {
            if !select.multiple && selected_index < select.options.len() {
                select.selected_indices.clear();
                select.selected_indices.push(selected_index);
                return;
            }
        }
    }

    fn select_state_on_active_card(
        &self,
        select_name: &str,
        selected_index: usize,
    ) -> Option<(bool, Vec<usize>, Option<CardTaskAction>)> {
        let card = self.active_card_internal().ok()?;
        let select = node_lookup::find_select(card, select_name)?;
        let option = select.options.get(selected_index)?;
        Some((
            select.multiple,
            select.selected_indices.to_vec(),
            option.onpick.clone(),
        ))
    }

    pub(crate) fn sync_select_variables_on_active_card(
        &mut self,
        select_name: &str,
    ) -> Result<(), String> {
        let (deck, vars) = (&self.deck, &mut self.vars);
        let card = deck
            .as_ref()
            .and_then(|deck| deck.cards.get(self.active_card_idx))
            .ok_or_else(|| "Active card not found".to_string())?;
        let Some(select) = node_lookup::find_select(card, select_name) else {
            return Err(format!("Select '{select_name}' not found"));
        };
        sync_select_variables(
            vars,
            select.name,
            select.iname,
            select.multiple,
            select.options,
            select.selected_indices,
        )?;
        Ok(())
    }

    pub(crate) fn sync_all_select_variables_on_active_card(&mut self) -> Result<(), String> {
        let (deck, vars) = (&self.deck, &mut self.vars);
        let card = deck
            .as_ref()
            .and_then(|deck| deck.cards.get(self.active_card_idx))
            .ok_or_else(|| "Active card not found".to_string())?;
        for select in node_lookup::selects(card) {
            sync_select_variables(
                vars,
                select.name,
                select.iname,
                select.multiple,
                select.options,
                select.selected_indices,
            )?;
        }
        Ok(())
    }

    pub(crate) fn input_max_len_on_active_card(&self, control_id: &str) -> Option<usize> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_input(card, control_id).and_then(|input| input.max_length)
    }

    fn input_constraints_on_active_card(
        &self,
        control_id: &str,
    ) -> Option<(runtime::input_mask::InputMask, bool)> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_input(card, control_id).map(|input| (input.mask.clone(), input.empty_ok))
    }

    pub(crate) fn runtime_card_for_layout(&self) -> Result<runtime::card::Card, String> {
        let mut card = self.active_card_internal()?.clone();
        if let Some(edit) = &self.active_input_edit {
            self.apply_input_value_to_card(&mut card, &edit.control_id, &edit.draft_value);
        }
        if let Some(edit) = &self.active_select_edit {
            self.apply_select_index_to_card(&mut card, &edit.select_name, edit.draft_index);
        }
        substitute_card_text_and_links(&mut card, &self.vars)?;
        Ok(card)
    }
}

fn substitute_card_text_and_links(
    card: &mut runtime::card::Card,
    vars: &HashMap<String, String>,
) -> Result<(), String> {
    for node in &mut card.nodes {
        let Node::Paragraph(inline) = node else {
            continue;
        };
        for entry in inline {
            match entry {
                InlineNode::Text(text) => *text = evaluate_vdata(text, vars)?,
                InlineNode::Link { text, href } => {
                    *text = evaluate_vdata(text, vars)?;
                    *href = evaluate_href(href, vars)?;
                }
                InlineNode::Select { title, options, .. } => {
                    if let Some(title) = title {
                        *title = evaluate_vdata(title, vars)?;
                    }
                    for option in options {
                        option.label = evaluate_vdata(&option.label, vars)?;
                    }
                }
                InlineNode::Break | InlineNode::Input { .. } => {}
            }
        }
    }
    Ok(())
}

fn input_value_is_valid(
    mask: &runtime::input_mask::InputMask,
    empty_ok: bool,
    value: &str,
) -> bool {
    if value.is_empty() {
        empty_ok
    } else {
        mask.accepts(value)
    }
}

fn initial_select_indices(
    name: Option<&str>,
    iname: Option<&str>,
    default_value: Option<&str>,
    default_index_value: Option<&str>,
    multiple: bool,
    options: &[runtime::node::SelectOption],
    vars: &HashMap<String, String>,
) -> Result<Vec<usize>, String> {
    let mut indices = iname
        .and_then(|variable| vars.get(variable))
        .map(|value| validate_select_indices(value, multiple, options.len()))
        .unwrap_or_default();
    if indices.is_empty() {
        indices = match default_index_value {
            Some(value) => {
                validate_select_indices(&evaluate_vdata(value, vars)?, multiple, options.len())
            }
            None => Vec::new(),
        };
    }
    if indices.is_empty() {
        indices = name
            .and_then(|variable| vars.get(variable))
            .map(|value| select_indices_for_values(value, multiple, options, vars))
            .transpose()?
            .unwrap_or_default();
    }
    if indices.is_empty() {
        indices = match default_value {
            Some(value) => {
                select_indices_for_values(&evaluate_vdata(value, vars)?, multiple, options, vars)?
            }
            None => Vec::new(),
        };
    }
    if indices.is_empty() && !multiple && !options.is_empty() {
        indices.push(0);
    }
    Ok(indices)
}

fn validate_select_indices(raw: &str, multiple: bool, option_count: usize) -> Vec<usize> {
    let candidates = if multiple {
        raw.split(';').collect::<Vec<_>>()
    } else {
        vec![raw]
    };
    let mut indices = Vec::new();
    for candidate in candidates {
        let candidate = candidate.trim();
        if candidate.is_empty() || !candidate.bytes().all(|byte| byte.is_ascii_digit()) {
            continue;
        }
        let Ok(index) = candidate.parse::<usize>() else {
            continue;
        };
        if index == 0 || index > option_count {
            continue;
        }
        let zero_based = index - 1;
        if !indices.contains(&zero_based) {
            indices.push(zero_based);
        }
    }
    indices
}

fn select_indices_for_values(
    raw: &str,
    multiple: bool,
    options: &[runtime::node::SelectOption],
    vars: &HashMap<String, String>,
) -> Result<Vec<usize>, String> {
    let values = if multiple {
        raw.split(';').collect::<Vec<_>>()
    } else {
        vec![raw]
    };
    let mut indices = Vec::new();
    for value in values {
        let mut matching_index = None;
        for (index, option) in options.iter().enumerate() {
            if evaluate_vdata(&option.value, vars)? == value {
                matching_index = Some(index);
                break;
            }
        }
        if let Some(index) = matching_index {
            if !indices.contains(&index) {
                indices.push(index);
            }
        }
    }
    Ok(indices)
}

fn sync_select_variables(
    vars: &mut HashMap<String, String>,
    name: Option<&str>,
    iname: Option<&str>,
    multiple: bool,
    options: &[runtime::node::SelectOption],
    selected_indices: &[usize],
) -> Result<(), String> {
    if let Some(name) = name {
        let mut values = Vec::new();
        for option in selected_indices
            .iter()
            .filter_map(|index| options.get(*index))
        {
            let value = evaluate_vdata(&option.value, vars)?;
            if !value.is_empty() {
                values.push(value);
            }
        }
        if values.is_empty() {
            vars.remove(name);
        } else {
            checked_insert_var(
                vars,
                name.to_string(),
                values.join(if multiple { ";" } else { "" }),
            )?;
        }
    }
    if let Some(iname) = iname {
        let serialized = if selected_indices.is_empty() {
            "0".to_string()
        } else {
            selected_indices
                .iter()
                .map(|index| (index + 1).to_string())
                .collect::<Vec<_>>()
                .join(if multiple { ";" } else { "" })
        };
        checked_insert_var(vars, iname.to_string(), serialized)?;
    }
    Ok(())
}

pub(crate) fn evaluate_vdata(raw: &str, vars: &HashMap<String, String>) -> Result<String, String> {
    evaluate_variable(raw, vars, SubstitutionContext::VData)
}

fn evaluate_href(raw: &str, vars: &HashMap<String, String>) -> Result<String, String> {
    evaluate_variable(raw, vars, SubstitutionContext::Href)
}
