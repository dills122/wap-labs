const MAX_EFFECT_QUEUE_LEN: usize = 32;

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum ScriptNavigationIntent {
    #[default]
    None,
    Go(String),
    Prev,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ScriptDialogRequest {
    Alert {
        message: String,
    },
    Confirm {
        message: String,
    },
    Prompt {
        message: String,
        default_value: Option<String>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ScriptTimerRequest {
    Schedule {
        delay_ms: u32,
        token: Option<String>,
    },
    Cancel {
        token: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ScriptRuntimeEffects {
    navigation_intent: ScriptNavigationIntent,
    requires_refresh: bool,
    context_reset_requested: bool,
    dialog_requests: Vec<ScriptDialogRequest>,
    timer_requests: Vec<ScriptTimerRequest>,
}

impl ScriptRuntimeEffects {
    pub fn navigation_intent(&self) -> &ScriptNavigationIntent {
        &self.navigation_intent
    }

    pub fn requires_refresh(&self) -> bool {
        self.requires_refresh
    }

    pub fn dialog_requests(&self) -> &[ScriptDialogRequest] {
        &self.dialog_requests
    }

    pub fn context_reset_requested(&self) -> bool {
        self.context_reset_requested
    }

    pub fn timer_requests(&self) -> &[ScriptTimerRequest] {
        &self.timer_requests
    }

    pub fn request_go(&mut self, href: String) {
        if href.is_empty() {
            self.navigation_intent = ScriptNavigationIntent::None;
        } else {
            self.navigation_intent = ScriptNavigationIntent::Go(href);
        }
    }

    pub fn request_prev(&mut self) {
        self.navigation_intent = ScriptNavigationIntent::Prev;
    }

    pub fn mark_refresh_required(&mut self) {
        self.requires_refresh = true;
    }

    pub fn request_new_context(&mut self) {
        self.context_reset_requested = true;
    }

    pub fn request_alert(&mut self, message: String) {
        self.push_dialog_request(ScriptDialogRequest::Alert { message });
    }

    pub fn request_confirm(&mut self, message: String) {
        self.push_dialog_request(ScriptDialogRequest::Confirm { message });
    }

    pub fn request_prompt(&mut self, message: String, default_value: Option<String>) {
        self.push_dialog_request(ScriptDialogRequest::Prompt {
            message,
            default_value,
        });
    }

    pub fn request_timer_schedule(&mut self, delay_ms: u32, token: Option<String>) {
        self.push_timer_request(ScriptTimerRequest::Schedule { delay_ms, token });
    }

    pub fn request_timer_cancel(&mut self, token: String) {
        self.push_timer_request(ScriptTimerRequest::Cancel { token });
    }

    fn push_dialog_request(&mut self, request: ScriptDialogRequest) {
        if self.dialog_requests.len() >= MAX_EFFECT_QUEUE_LEN {
            self.dialog_requests.remove(0);
        }
        self.dialog_requests.push(request);
    }

    fn push_timer_request(&mut self, request: ScriptTimerRequest) {
        if self.timer_requests.len() >= MAX_EFFECT_QUEUE_LEN {
            self.timer_requests.remove(0);
        }
        self.timer_requests.push(request);
    }
}

#[cfg(test)]
mod tests {
    use super::{
        ScriptDialogRequest, ScriptNavigationIntent, ScriptRuntimeEffects, ScriptTimerRequest,
    };

    #[test]
    fn go_empty_clears_navigation() {
        let mut effects = ScriptRuntimeEffects::default();
        effects.request_prev();
        effects.request_go(String::new());
        assert_eq!(effects.navigation_intent(), &ScriptNavigationIntent::None);
    }

    #[test]
    fn last_navigation_request_wins() {
        let mut effects = ScriptRuntimeEffects::default();
        effects.request_go("#one".to_string());
        effects.request_prev();
        effects.request_go("#two".to_string());

        assert_eq!(
            effects.navigation_intent(),
            &ScriptNavigationIntent::Go("#two".to_string())
        );
    }

    #[test]
    fn refresh_flag_can_be_set() {
        let mut effects = ScriptRuntimeEffects::default();
        assert!(!effects.requires_refresh());

        effects.mark_refresh_required();
        assert!(effects.requires_refresh());
    }

    #[test]
    fn context_reset_can_be_requested() {
        let mut effects = ScriptRuntimeEffects::default();
        assert!(!effects.context_reset_requested());

        effects.request_new_context();
        assert!(effects.context_reset_requested());
    }

    #[test]
    fn dialog_requests_are_recorded_in_order() {
        let mut effects = ScriptRuntimeEffects::default();
        effects.request_alert("a".to_string());
        effects.request_confirm("b".to_string());
        effects.request_prompt("c".to_string(), Some("d".to_string()));

        assert_eq!(
            effects.dialog_requests(),
            &[
                ScriptDialogRequest::Alert {
                    message: "a".to_string()
                },
                ScriptDialogRequest::Confirm {
                    message: "b".to_string()
                },
                ScriptDialogRequest::Prompt {
                    message: "c".to_string(),
                    default_value: Some("d".to_string())
                },
            ]
        );
    }

    #[test]
    fn timer_requests_are_recorded_in_order() {
        let mut effects = ScriptRuntimeEffects::default();
        effects.request_timer_schedule(250, Some("token-a".to_string()));
        effects.request_timer_cancel("token-a".to_string());

        assert_eq!(
            effects.timer_requests(),
            &[
                ScriptTimerRequest::Schedule {
                    delay_ms: 250,
                    token: Some("token-a".to_string())
                },
                ScriptTimerRequest::Cancel {
                    token: "token-a".to_string()
                },
            ]
        );
    }
}
