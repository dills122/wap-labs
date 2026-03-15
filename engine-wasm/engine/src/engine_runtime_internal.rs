use crate::*;

mod navigation;
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
                card.accept_action.clone(),
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
        let committed = self.set_input_value_on_active_card(&edit.input_name, &edit.draft_value)?;
        if !committed {
            return Ok(false);
        }
        self.set_var(edit.input_name.clone(), edit.draft_value.clone());
        self.active_input_edit = None;
        self.push_trace("INPUT_EDIT_COMMIT", edit.input_name);
        Ok(true)
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
            original_index: current_index,
            draft_index: current_index,
        });
        self.push_trace("SELECT_EDIT_START", select_name);
        Ok(true)
    }

    pub(crate) fn commit_focused_select_edit_internal(&mut self) -> Result<bool, String> {
        let Some(edit) = self.active_select_edit.clone() else {
            return Ok(false);
        };
        let committed =
            self.set_select_selected_index_on_active_card(&edit.select_name, edit.draft_index)?;
        if !committed {
            return Ok(false);
        }
        if let Some(value) = self.select_value_on_active_card(&edit.select_name, edit.draft_index) {
            self.set_var(edit.select_name.clone(), value);
        }
        self.active_select_edit = None;
        self.push_trace("SELECT_EDIT_COMMIT", edit.select_name);
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
        for node in &card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Input { name, value, .. } = item {
                    if name == input_name {
                        return Some(value.clone());
                    }
                }
            }
        }
        None
    }

    fn set_input_value_on_active_card(
        &mut self,
        input_name: &str,
        value: &str,
    ) -> Result<bool, String> {
        let card = self.active_card_internal_mut()?;
        let mut updated = false;
        for node in &mut card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Input {
                    name,
                    value: current_value,
                    ..
                } = item
                {
                    if name == input_name {
                        *current_value = value.to_string();
                        updated = true;
                        break;
                    }
                }
            }
            if updated {
                break;
            }
        }
        Ok(updated)
    }

    pub(crate) fn apply_input_value_to_card(
        &self,
        card: &mut runtime::card::Card,
        input_name: &str,
        value: &str,
    ) {
        for node in &mut card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Input {
                    name,
                    value: current_value,
                    ..
                } = item
                {
                    if name == input_name {
                        *current_value = value.to_string();
                        return;
                    }
                }
            }
        }
    }

    pub(crate) fn select_selected_index_on_active_card(&self, select_name: &str) -> Option<usize> {
        let card = self.active_card_internal().ok()?;
        for node in &card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Select {
                    name,
                    selected_index,
                    ..
                } = item
                {
                    if name == select_name {
                        return Some(*selected_index);
                    }
                }
            }
        }
        None
    }

    pub(crate) fn select_option_count_on_active_card(&self, select_name: &str) -> Option<usize> {
        let card = self.active_card_internal().ok()?;
        for node in &card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Select { name, options, .. } = item {
                    if name == select_name {
                        return Some(options.len());
                    }
                }
            }
        }
        None
    }

    pub(crate) fn select_value_on_active_card(
        &self,
        select_name: &str,
        selected_index: usize,
    ) -> Option<String> {
        let card = self.active_card_internal().ok()?;
        for node in &card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Select { name, options, .. } = item {
                    if name == select_name {
                        return options
                            .get(selected_index)
                            .or_else(|| options.first())
                            .map(|option| option.value.clone());
                    }
                }
            }
        }
        None
    }

    pub(crate) fn set_select_selected_index_on_active_card(
        &mut self,
        select_name: &str,
        selected_index: usize,
    ) -> Result<bool, String> {
        let card = self.active_card_internal_mut()?;
        let mut updated = false;
        for node in &mut card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Select {
                    name,
                    options,
                    selected_index: current_index,
                    ..
                } = item
                {
                    if name == select_name && selected_index < options.len() {
                        *current_index = selected_index;
                        updated = true;
                        break;
                    }
                }
            }
            if updated {
                break;
            }
        }
        Ok(updated)
    }

    pub(crate) fn apply_select_index_to_card(
        &self,
        card: &mut runtime::card::Card,
        select_name: &str,
        selected_index: usize,
    ) {
        for node in &mut card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Select {
                    name,
                    options,
                    selected_index: current_index,
                    ..
                } = item
                {
                    if name == select_name && selected_index < options.len() {
                        *current_index = selected_index;
                        return;
                    }
                }
            }
        }
    }

    pub(crate) fn input_max_len_on_active_card(&self, input_name: &str) -> Option<usize> {
        let card = self.active_card_internal().ok()?;
        for node in &card.nodes {
            let runtime::node::Node::Paragraph(items) = node else {
                continue;
            };
            for item in items {
                if let runtime::node::InlineNode::Input {
                    name, max_length, ..
                } = item
                {
                    if name == input_name {
                        return *max_length;
                    }
                }
            }
        }
        None
    }
}
