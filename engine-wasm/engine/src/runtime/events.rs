#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum ScriptNavigationIntent {
    #[default]
    None,
    Go(String),
    Prev,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ScriptRuntimeEffects {
    navigation_intent: ScriptNavigationIntent,
    requires_refresh: bool,
}

impl ScriptRuntimeEffects {
    pub fn navigation_intent(&self) -> &ScriptNavigationIntent {
        &self.navigation_intent
    }

    pub fn requires_refresh(&self) -> bool {
        self.requires_refresh
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
}

#[cfg(test)]
mod tests {
    use super::{ScriptNavigationIntent, ScriptRuntimeEffects};

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
}
