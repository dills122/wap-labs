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
                    let token = token.as_deref().unwrap_or("timer");
                    if self.debug_recorder.is_some() {
                        let reason = self.debug_value_reason(token).or_else(|| {
                            crate::engine_debug_recorder::is_sensitive_name(token)
                                .then_some(EngineDebugRedactionReason::SensitiveName)
                        });
                        self.debug_emit(EngineDebugEventPayload::TimerSchedule {
                            delay_ms: *delay_ms,
                            token: crate::engine_debug_recorder::sanitize_text(token, reason),
                        });
                    }
                }
                ScriptTimerRequest::Cancel { token } => {
                    self.push_trace("TIMER_CANCEL", token.clone());
                    if self.debug_recorder.is_some() {
                        let reason = self.debug_value_reason(token).or_else(|| {
                            crate::engine_debug_recorder::is_sensitive_name(token)
                                .then_some(EngineDebugRedactionReason::SensitiveName)
                        });
                        self.debug_emit(EngineDebugEventPayload::TimerCancel {
                            token: crate::engine_debug_recorder::sanitize_text(token, reason),
                        });
                    }
                }
            }
        }

        let nav_intent = effects.navigation_intent().clone();
        let context_reset_requested = effects.context_reset_requested();

        if context_reset_requested {
            self.stop_active_timer_for_exit();
            self.reset_browser_context_state();
            self.push_trace("ACTION_NEWCONTEXT", String::new());
        }

        let effective_nav_intent =
            if context_reset_requested && matches!(nav_intent, ScriptNavigationIntent::Prev) {
                ScriptNavigationIntent::None
            } else {
                nav_intent
            };

        match effective_nav_intent {
            ScriptNavigationIntent::None => {}
            ScriptNavigationIntent::Prev => {
                self.debug_emit_lazy(|| EngineDebugEventPayload::NavigationIntent {
                    target: EngineDebugValue::Visible {
                        value: "prev".to_string(),
                    },
                });
                self.navigate_back_internal();
            }
            ScriptNavigationIntent::Go(href) => {
                if self.debug_recorder.is_some() {
                    let target = if href.starts_with('#') {
                        crate::engine_debug_recorder::sanitize_url(&href)
                    } else {
                        crate::engine_debug_recorder::sanitize_url(
                            &self.resolve_external_href(&href),
                        )
                    };
                    self.debug_emit(EngineDebugEventPayload::NavigationIntent {
                        target: target.clone(),
                    });
                    if !href.is_empty() && !href.starts_with('#') {
                        self.debug_emit(EngineDebugEventPayload::ActionExternal { target });
                    }
                }
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
