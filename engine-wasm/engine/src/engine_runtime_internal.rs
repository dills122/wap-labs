use crate::*;
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
                let idx = clamp_focus(self.focused_link_idx, link_total);
                let href = &layout.links[idx];
                self.execute_action_href(href)?;
            }
            _ => {}
        }

        Ok(())
    }

    pub(crate) fn navigate_to_card_internal(&mut self, id: &str) -> Result<(), String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;

        let next_idx = deck
            .card_index(id)
            .ok_or_else(|| "Card id not found".to_string())?;

        let previous_idx = self.active_card_idx;
        let previous_focus = self.focused_link_idx;
        let previous_stack_len = self.nav_stack.len();
        let previous_timer = self.active_timer.clone();
        self.stop_active_timer_for_exit();
        self.nav_stack.push(self.active_card_idx);
        self.active_card_idx = next_idx;
        self.focused_link_idx = 0;
        if let Err(err) = self.run_onenterforward_for_active_card() {
            // Roll back all state for deterministic failure behavior on entry-task failures.
            self.active_card_idx = previous_idx;
            self.focused_link_idx = previous_focus;
            self.nav_stack.truncate(previous_stack_len);
            self.active_timer = previous_timer;
            return Err(err);
        }
        if let Err(err) = self.start_or_resume_timer_for_active_card(false) {
            self.active_card_idx = previous_idx;
            self.focused_link_idx = previous_focus;
            self.nav_stack.truncate(previous_stack_len);
            self.active_timer = previous_timer;
            return Err(err);
        }
        Ok(())
    }

    pub(crate) fn navigate_back_internal(&mut self) -> bool {
        let rollback_active_idx = self.active_card_idx;
        let rollback_focus = self.focused_link_idx;
        let rollback_stack = self.nav_stack.clone();
        let rollback_timer = self.active_timer.clone();
        let Some(back_target_idx) = self.nav_stack.pop() else {
            self.push_trace("ACTION_BACK_EMPTY", String::new());
            return false;
        };

        self.stop_active_timer_for_exit();
        self.active_card_idx = back_target_idx;
        self.focused_link_idx = 0;
        self.push_trace("ACTION_BACK", String::new());
        if let Err(err) = self.run_onenterbackward_for_active_card() {
            self.push_trace("ACTION_ONENTERBACKWARD_ERROR", err);
            self.active_card_idx = rollback_active_idx;
            self.focused_link_idx = rollback_focus;
            self.nav_stack = rollback_stack;
            self.active_timer = rollback_timer;
            return true;
        }
        if let Err(err) = self.start_or_resume_timer_for_active_card(false) {
            self.push_trace("ACTION_ONTIMER_ERROR", err);
            self.active_card_idx = rollback_active_idx;
            self.focused_link_idx = rollback_focus;
            self.nav_stack = rollback_stack;
            self.active_timer = rollback_timer;
        }
        true
    }

    pub(crate) fn run_onenterforward_for_active_card(&mut self) -> Result<(), String> {
        let action = self.active_card_internal()?.onenterforward_action.clone();
        if let Some(action) = action {
            self.execute_card_task_action(&action)?;
        }
        Ok(())
    }

    pub(crate) fn run_onenterbackward_for_active_card(&mut self) -> Result<(), String> {
        let action = self.active_card_internal()?.onenterbackward_action.clone();
        if let Some(action) = action {
            self.execute_card_task_action(&action)?;
        }
        Ok(())
    }

    pub(crate) fn execute_card_task_action(
        &mut self,
        action: &CardTaskAction,
    ) -> Result<(), String> {
        match action {
            CardTaskAction::Go { href } => self.execute_action_href(href),
            CardTaskAction::Prev => {
                self.push_trace("ACTION_PREV", String::new());
                self.navigate_back_internal();
                Ok(())
            }
            CardTaskAction::Refresh => {
                self.push_trace("ACTION_REFRESH", String::new());
                self.start_or_resume_timer_for_active_card(true)?;
                Ok(())
            }
        }
    }

    pub(crate) fn start_or_resume_timer_for_active_card(
        &mut self,
        is_refresh: bool,
    ) -> Result<(), String> {
        let (timer_value_ds, ontimer_action) = {
            let card = self.active_card_internal()?;
            (card.timer_value_ds, card.ontimer_action.clone())
        };
        let Some(value_ds) = timer_value_ds else {
            self.active_timer = None;
            return Ok(());
        };
        if is_refresh {
            if let Some(timer) = &self.active_timer {
                if timer.card_idx == self.active_card_idx {
                    self.push_trace(
                        "TIMER_RESUME",
                        format!("remainingMs={}", timer.remaining_ms),
                    );
                    return Ok(());
                }
            }
        }
        let remaining_ms = value_ds.saturating_mul(100);
        self.active_timer = Some(CardTimerState {
            card_idx: self.active_card_idx,
            remaining_ms,
            ontimer_action,
        });
        self.push_trace("TIMER_START", format!("valueDs={value_ds}"));
        if remaining_ms != 0 {
            return Ok(());
        }
        self.dispatch_active_timer_expiry()
    }

    pub(crate) fn stop_active_timer_for_exit(&mut self) {
        let Some(timer) = self.active_timer.take() else {
            return;
        };
        self.push_trace("TIMER_STOP", format!("remainingMs={}", timer.remaining_ms));
    }

    pub(crate) fn dispatch_active_timer_expiry(&mut self) -> Result<(), String> {
        let Some(timer) = self.active_timer.take() else {
            return Ok(());
        };
        self.push_trace("TIMER_EXPIRE", String::new());
        let Some(action) = timer.ontimer_action else {
            return Ok(());
        };
        if self.timer_dispatch_depth >= MAX_TIMER_DISPATCH_DEPTH {
            return Err("timer: dispatch depth exceeded".to_string());
        }
        self.timer_dispatch_depth += 1;
        self.push_trace("ACTION_ONTIMER", String::new());
        let result = self.execute_card_task_action(&action);
        self.timer_dispatch_depth -= 1;
        result
    }

    pub(crate) fn advance_time_ms_internal(&mut self, delta_ms: u32) -> Result<(), String> {
        let Some(timer_card_idx) = self.active_timer.as_ref().map(|timer| timer.card_idx) else {
            return Ok(());
        };
        if delta_ms == 0 {
            return Ok(());
        }
        if timer_card_idx != self.active_card_idx {
            self.active_timer = None;
            return Ok(());
        }
        let (before, after) = {
            let timer = self
                .active_timer
                .as_mut()
                .expect("timer must exist after guard");
            let before = timer.remaining_ms;
            timer.remaining_ms = timer.remaining_ms.saturating_sub(delta_ms);
            (before, timer.remaining_ms)
        };
        self.push_trace(
            "TIMER_TICK",
            format!("deltaMs={delta_ms};beforeMs={before};afterMs={after}"),
        );
        if after == 0 {
            self.dispatch_active_timer_expiry()?;
        }
        Ok(())
    }

    pub(crate) fn execute_action_href(&mut self, href: &str) -> Result<(), String> {
        if let Some(script_ref) = parse_script_href(href) {
            let function_name = script_ref.function_name.unwrap_or("main");
            self.push_trace(
                "ACTION_SCRIPT",
                format!("{}#{}", script_ref.src, function_name),
            );
            if let Err(message) =
                self.invoke_script_ref_internal(script_ref.src, function_name, &[])
            {
                self.push_trace("SCRIPT_TRAP", message.clone());
                return Err(message);
            }
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

    pub(crate) fn apply_pending_script_effects(&mut self) -> Result<(), String> {
        let effects = mem::take(&mut self.pending_script_effects);
        self.last_script_dialog_requests = effects.dialog_requests().to_vec();
        self.last_script_timer_requests = effects.timer_requests().to_vec();
        for dialog in effects.dialog_requests() {
            match dialog {
                ScriptDialogRequest::Alert { message } => {
                    self.push_trace("DIALOG_ALERT", message.clone());
                }
                ScriptDialogRequest::Confirm { message } => {
                    self.push_trace("DIALOG_CONFIRM", message.clone());
                }
                ScriptDialogRequest::Prompt {
                    message,
                    default_value,
                } => {
                    self.push_trace(
                        "DIALOG_PROMPT",
                        format!(
                            "message={message};default={}",
                            default_value.clone().unwrap_or_default()
                        ),
                    );
                }
            }
        }

        for timer in effects.timer_requests() {
            match timer {
                ScriptTimerRequest::Schedule { delay_ms, token } => {
                    self.push_trace(
                        "TIMER_SCHEDULE",
                        format!(
                            "delayMs={delay_ms};token={}",
                            token.clone().unwrap_or_default()
                        ),
                    );
                }
                ScriptTimerRequest::Cancel { token } => {
                    self.push_trace("TIMER_CANCEL", token.clone());
                }
            }
        }

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

    pub(crate) fn push_trace(&mut self, kind: &str, detail: String) {
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
            script_error_class: self
                .last_script_outcome
                .as_ref()
                .map(|outcome| outcome.error_class.clone()),
            script_error_category: self
                .last_script_outcome
                .as_ref()
                .map(|outcome| outcome.error_category.clone()),
            script_trap: self
                .last_script_outcome
                .as_ref()
                .and_then(|outcome| outcome.trap.clone()),
        };
        self.next_trace_seq += 1;
        self.trace_entries.push(entry);
    }

    pub(crate) fn active_card_internal(&self) -> Result<&runtime::card::Card, String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;

        deck.cards
            .get(self.active_card_idx)
            .ok_or_else(|| "Active card index out of range".to_string())
    }

    pub(crate) fn resolve_external_href(&self, href: &str) -> String {
        if self.base_url.is_empty() {
            return href.to_string();
        }

        let Ok(base) = Url::parse(&self.base_url) else {
            return href.to_string();
        };

        match base.join(href) {
            Ok(resolved) => resolved.to_string(),
            Err(_) => href.to_string(),
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
pub(crate) struct ParsedScriptRef<'a> {
    pub(crate) src: &'a str,
    pub(crate) function_name: Option<&'a str>,
}

pub(crate) fn parse_script_href(href: &str) -> Option<ParsedScriptRef<'_>> {
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
