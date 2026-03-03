use crate::*;
use url::Url;

impl WmlEngine {
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
