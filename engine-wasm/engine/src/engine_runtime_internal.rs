use crate::*;

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
        let Some(bytes) = self.script_units.get(src) else {
            return ScriptExecutionOutcome::fatal(
                format!("loader: script unit not registered ({src})"),
                ScriptErrorCategoryLiteral::HostBinding,
            );
        };

        let decoded_unit = match decode_compilation_unit(bytes) {
            Ok(unit) => unit,
            Err(err) => {
                return ScriptExecutionOutcome::fatal(
                    format_decode_error(err),
                    ScriptErrorCategoryLiteral::Integrity,
                );
            }
        };

        let entry_pc = if function_name == "main" {
            0
        } else {
            let Some(entrypoints) = self.script_entrypoints.get(src) else {
                return ScriptExecutionOutcome::fatal(
                    format!("loader: function entry point not registered ({src}#{function_name})"),
                    ScriptErrorCategoryLiteral::HostBinding,
                );
            };
            let Some(entry_pc) = entrypoints.get(function_name) else {
                return ScriptExecutionOutcome::fatal(
                    format!("loader: function entry point not registered ({src}#{function_name})"),
                    ScriptErrorCategoryLiteral::HostBinding,
                );
            };
            *entry_pc
        };

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

        self.apply_pending_script_effects()?;
        Ok(ScriptInvocationOutcome::from_execution(&outcome))
    }

    pub(crate) fn handle_key_internal(&mut self, key: &str) -> Result<(), String> {
        self.push_trace("KEY", format!("key={key}"));
        let (layout, accept_action) = {
            let card = self.active_card_internal()?;
            (
                layout_card(card, self.viewport_cols, self.focused_link_idx),
                self.active_do_action_internal("accept")?,
            )
        };
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
                self.focused_link_idx = move_focus_up(self.focused_link_idx, target_total);
            }
            "down" => {
                if self.active_select_edit.is_some() {
                    self.move_focused_select_edit(1);
                    return Ok(());
                }
                if self.active_input_edit.is_some() {
                    self.commit_focused_input_edit_internal()?;
                }
                self.focused_link_idx = move_focus_down(self.focused_link_idx, target_total);
            }
            "enter" => {
                if target_total == 0 {
                    if let Some(action) = accept_action {
                        self.push_trace("ACTION_ACCEPT", String::new());
                        self.execute_card_task_action(&action)?;
                    }
                    return Ok(());
                }
                let target = layout
                    .focus_targets
                    .get(self.focused_link_idx)
                    .ok_or_else(|| "Focused target index out of range".to_string())?;
                match target {
                    FocusTarget::Input(name) => {
                        self.active_select_edit = None;
                        self.push_trace("ACTION_INPUT", name.clone());
                        if self.active_input_edit.is_some() {
                            self.commit_focused_input_edit_internal()?;
                            if let Some(action) = accept_action {
                                self.push_trace("ACTION_ACCEPT", String::new());
                                self.execute_card_task_action(&action)?;
                            }
                        } else if let Some(action) = accept_action {
                            self.push_trace("ACTION_ACCEPT", String::new());
                            self.execute_card_task_action(&action)?;
                        } else {
                            self.begin_focused_input_edit_internal()?;
                        }
                        return Ok(());
                    }
                    FocusTarget::Select(name) => {
                        self.active_input_edit = None;
                        self.push_trace("ACTION_SELECT", name.clone());
                        if self.active_select_edit.is_some() {
                            self.commit_focused_select_edit_internal()?;
                        } else {
                            self.begin_focused_select_edit_internal()?;
                        }
                        return Ok(());
                    }
                    FocusTarget::Link(href) => {
                        self.active_input_edit = None;
                        self.active_select_edit = None;
                        self.execute_action_href(href, None, &[])?;
                    }
                }
            }
            _ => {}
        }

        Ok(())
    }

    pub(crate) fn begin_focused_input_edit_internal(&mut self) -> Result<bool, String> {
        let Some(input_name) = self.focused_input_name_internal()? else {
            return Ok(false);
        };
        let current = self
            .input_value_on_active_card(&input_name)
            .unwrap_or_default();
        self.active_select_edit = None;
        self.active_input_edit = Some(InputEditState {
            input_name: input_name.clone(),
            original_value: current.clone(),
            draft_value: current,
        });
        self.push_trace("INPUT_EDIT_START", input_name);
        Ok(true)
    }

    pub(crate) fn commit_focused_input_edit_internal(&mut self) -> Result<bool, String> {
        let Some(edit) = self.active_input_edit.clone() else {
            return Ok(false);
        };
        let Some((mask, empty_ok)) = self.input_constraints_on_active_card(&edit.input_name) else {
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
        let committed = self.set_input_value_on_active_card(&edit.input_name, &edit.draft_value)?;
        if !committed {
            return Ok(false);
        }
        self.set_var(edit.input_name.clone(), edit.draft_value.clone());
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

        for input in node_lookup::inputs_mut(card) {
            let valid_existing = vars
                .get(input.name)
                .cloned()
                .filter(|candidate| input_value_is_valid(input.mask, input.empty_ok, candidate));
            let initial_value = if let Some(existing) = valid_existing {
                Some(existing)
            } else {
                vars.remove(input.name);
                input
                    .default_value
                    .as_deref()
                    .map(|candidate| evaluate_vdata(candidate, vars))
                    .filter(|candidate| input_value_is_valid(input.mask, input.empty_ok, candidate))
            };

            if let Some(initial_value) = initial_value {
                vars.insert(input.name.to_string(), initial_value.clone());
                *input.value = initial_value;
            } else {
                vars.remove(input.name);
                input.value.clear();
            }
        }

        for select in node_lookup::selects_mut(card) {
            *select.selected_indices = initial_select_indices(
                select.name,
                select.iname,
                select.default_value,
                select.default_index_value,
                select.multiple,
                select.options,
                vars,
            );
            sync_select_variables(
                vars,
                select.name,
                select.iname,
                select.multiple,
                select.options,
                select.selected_indices,
            );
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
        self.active_input_edit = None;
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
            let onpick = evaluate_vdata(&onpick, &self.vars);
            self.push_trace("ACTION_ONPICK", onpick.clone());
            self.execute_action_href(&onpick, None, &[])?;
        }
        Ok(true)
    }

    fn focused_input_name_internal(&self) -> Result<Option<String>, String> {
        let card = self.active_card_internal()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx);
        let focused_idx = clamp_focus(self.focused_link_idx, layout.focus_targets.len());
        let Some(target) = layout.focus_targets.get(focused_idx) else {
            return Ok(None);
        };
        match target {
            FocusTarget::Input(name) => Ok(Some(name.clone())),
            FocusTarget::Select(_) | FocusTarget::Link(_) => Ok(None),
        }
    }

    fn focused_select_name_internal(&self) -> Result<Option<String>, String> {
        let card = self.active_card_internal()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx);
        let focused_idx = clamp_focus(self.focused_link_idx, layout.focus_targets.len());
        let Some(target) = layout.focus_targets.get(focused_idx) else {
            return Ok(None);
        };
        match target {
            FocusTarget::Select(name) => Ok(Some(name.clone())),
            FocusTarget::Input(_) | FocusTarget::Link(_) => Ok(None),
        }
    }

    fn input_value_on_active_card(&self, input_name: &str) -> Option<String> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_input(card, input_name).map(|input| input.value.to_string())
    }

    fn set_input_value_on_active_card(
        &mut self,
        input_name: &str,
        value: &str,
    ) -> Result<bool, String> {
        let card = self.active_card_internal_mut()?;
        let Some(input) = node_lookup::find_input_mut(card, input_name) else {
            return Ok(false);
        };
        *input.value = value.to_string();
        Ok(true)
    }

    pub(crate) fn apply_input_value_to_card(
        &self,
        card: &mut runtime::card::Card,
        input_name: &str,
        value: &str,
    ) {
        if let Some(input) = node_lookup::find_input_mut(card, input_name) {
            *input.value = value.to_string();
        }
    }

    pub(crate) fn select_selected_index_on_active_card(&self, select_name: &str) -> Option<usize> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_select(card, select_name)
            .map(|select| select.selected_indices.first().copied().unwrap_or(0))
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
            .map(|option| evaluate_vdata(&option.value, &self.vars))
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
    ) -> Option<(bool, Vec<usize>, Option<String>)> {
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
        );
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
            );
        }
        Ok(())
    }

    pub(crate) fn input_max_len_on_active_card(&self, input_name: &str) -> Option<usize> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_input(card, input_name).and_then(|input| input.max_length)
    }

    fn input_constraints_on_active_card(
        &self,
        input_name: &str,
    ) -> Option<(runtime::input_mask::InputMask, bool)> {
        let card = self.active_card_internal().ok()?;
        node_lookup::find_input(card, input_name).map(|input| (input.mask.clone(), input.empty_ok))
    }
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
) -> Vec<usize> {
    let mut indices = iname
        .and_then(|variable| vars.get(variable))
        .map(|value| validate_select_indices(value, multiple, options.len()))
        .unwrap_or_default();
    if indices.is_empty() {
        indices = default_index_value
            .map(|value| evaluate_vdata(value, vars))
            .map(|value| validate_select_indices(&value, multiple, options.len()))
            .unwrap_or_default();
    }
    if indices.is_empty() {
        indices = name
            .and_then(|variable| vars.get(variable))
            .map(|value| select_indices_for_values(value, multiple, options, vars))
            .unwrap_or_default();
    }
    if indices.is_empty() {
        indices = default_value
            .map(|value| evaluate_vdata(value, vars))
            .map(|value| select_indices_for_values(&value, multiple, options, vars))
            .unwrap_or_default();
    }
    if indices.is_empty() && !multiple && !options.is_empty() {
        indices.push(0);
    }
    indices
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
) -> Vec<usize> {
    let values = if multiple {
        raw.split(';').collect::<Vec<_>>()
    } else {
        vec![raw]
    };
    let mut indices = Vec::new();
    for value in values {
        if let Some(index) = options
            .iter()
            .position(|option| evaluate_vdata(&option.value, vars) == value)
        {
            if !indices.contains(&index) {
                indices.push(index);
            }
        }
    }
    indices
}

fn sync_select_variables(
    vars: &mut HashMap<String, String>,
    name: Option<&str>,
    iname: Option<&str>,
    multiple: bool,
    options: &[runtime::node::SelectOption],
    selected_indices: &[usize],
) {
    if let Some(name) = name {
        let values = selected_indices
            .iter()
            .filter_map(|index| options.get(*index))
            .map(|option| evaluate_vdata(&option.value, vars))
            .filter(|value| !value.is_empty())
            .collect::<Vec<_>>();
        if values.is_empty() {
            vars.remove(name);
        } else {
            vars.insert(
                name.to_string(),
                values.join(if multiple { ";" } else { "" }),
            );
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
        vars.insert(iname.to_string(), serialized);
    }
}

fn evaluate_vdata(raw: &str, vars: &HashMap<String, String>) -> String {
    let mut out = String::new();
    let chars = raw.char_indices().collect::<Vec<_>>();
    let mut cursor = 0usize;
    while cursor < chars.len() {
        let (byte_index, ch) = chars[cursor];
        if ch != '$' {
            out.push(ch);
            cursor += 1;
            continue;
        }
        if chars.get(cursor + 1).is_some_and(|(_, next)| *next == '$') {
            out.push('$');
            cursor += 2;
            continue;
        }
        if chars.get(cursor + 1).is_some_and(|(_, next)| *next == '(') {
            let Some(close_offset) = raw[byte_index + 2..].find(')') else {
                out.push('$');
                cursor += 1;
                continue;
            };
            let close = byte_index + 2 + close_offset;
            let variable = raw[byte_index + 2..close]
                .split(':')
                .next()
                .unwrap_or_default();
            out.push_str(vars.get(variable).map(String::as_str).unwrap_or_default());
            cursor = chars
                .iter()
                .position(|(index, _)| *index > close)
                .unwrap_or(chars.len());
            continue;
        }
        let variable_start = byte_index + 1;
        let variable_end = raw[variable_start..]
            .find(|ch: char| !(ch == '_' || ch.is_ascii_alphanumeric()))
            .map(|offset| variable_start + offset)
            .unwrap_or(raw.len());
        if variable_end == variable_start {
            out.push('$');
            cursor += 1;
            continue;
        }
        let variable = &raw[variable_start..variable_end];
        out.push_str(vars.get(variable).map(String::as_str).unwrap_or_default());
        cursor = chars
            .iter()
            .position(|(index, _)| *index >= variable_end)
            .unwrap_or(chars.len());
    }
    out
}
