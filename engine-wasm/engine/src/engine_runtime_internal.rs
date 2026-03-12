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
        let link_total = layout.links.len();
        self.focused_link_idx = clamp_focus(self.focused_link_idx, link_total);

        match key {
            "up" => {
                self.focused_link_idx = move_focus_up(self.focused_link_idx, link_total);
            }
            "down" => {
                self.focused_link_idx = move_focus_down(self.focused_link_idx, link_total);
            }
            "enter" => {
                if link_total == 0 {
                    if let Some(action) = accept_action {
                        self.push_trace("ACTION_ACCEPT", String::new());
                        self.execute_card_task_action(&action)?;
                    }
                    return Ok(());
                }
                let href = &layout.links[self.focused_link_idx];
                if href.starts_with("input:") {
                    self.push_trace("ACTION_INPUT", href.clone());
                    return Ok(());
                }
                self.execute_action_href(href, None, &[])?;
            }
            _ => {}
        }

        Ok(())
    }
}
