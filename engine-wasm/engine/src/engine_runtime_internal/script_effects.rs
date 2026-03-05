use crate::*;
use std::mem;

impl WmlEngine {
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
                    self.external_nav_request_policy =
                        Some(self.default_external_navigation_request_policy());
                }
            }
        }

        Ok(())
    }
}
