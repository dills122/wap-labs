use crate::runtime::node::Node;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub enum CardEventBindingIdentity {
    Do(String),
    Onevent(String),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CardPostField {
    pub name: String,
    pub value: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CardGoRequest {
    pub method: String,
    pub send_referer: bool,
    pub cache_control: Option<String>,
    pub enctype: String,
    pub accept_charset: Option<String>,
    pub post_fields: Vec<CardPostField>,
}

impl Default for CardGoRequest {
    fn default() -> Self {
        Self {
            method: "GET".to_string(),
            send_referer: false,
            cache_control: None,
            enctype: "application/x-www-form-urlencoded".to_string(),
            accept_charset: None,
            post_fields: Vec::new(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CardSetVar {
    pub name: String,
    pub value: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CardTimer {
    pub name: Option<String>,
    pub value: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CardTaskAction {
    Go {
        href: String,
        request: CardGoRequest,
    },
    Prev,
    Refresh,
    Noop,
    WithSetVars {
        action: Box<CardTaskAction>,
        set_vars: Vec<CardSetVar>,
    },
}

impl CardTaskAction {
    // Merges into an existing `WithSetVars` instead of nesting one inside
    // another, so `WithSetVars.action` is never itself a `WithSetVars`. This
    // is a structural guarantee, not just a call-site convention: every
    // `base_and_set_vars()` caller matches out a single non-`WithSetVars`
    // base action and treats the wrapped case as unreachable, so a nested
    // wrapper would panic on ordinary WML deck content instead of merely
    // being unreachable today by coincidence of there being exactly one
    // `with_set_vars()` call per parsed task element.
    pub fn with_set_vars(self, set_vars: Vec<CardSetVar>) -> Self {
        if set_vars.is_empty() {
            return self;
        }
        match self {
            Self::WithSetVars {
                action,
                set_vars: mut existing,
            } => {
                existing.extend(set_vars);
                Self::WithSetVars {
                    action,
                    set_vars: existing,
                }
            }
            action => Self::WithSetVars {
                action: Box::new(action),
                set_vars,
            },
        }
    }

    pub fn base_and_set_vars(&self) -> (&Self, &[CardSetVar]) {
        match self {
            Self::WithSetVars { action, set_vars } => (action, set_vars),
            action => (action, &[]),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn with_set_vars_merges_instead_of_nesting_when_called_twice() {
        let action = CardTaskAction::Go {
            href: "#next".to_string(),
            request: CardGoRequest::default(),
        }
        .with_set_vars(vec![CardSetVar {
            name: "a".to_string(),
            value: "1".to_string(),
        }])
        .with_set_vars(vec![CardSetVar {
            name: "b".to_string(),
            value: "2".to_string(),
        }]);

        let (base, set_vars) = action.base_and_set_vars();
        assert_eq!(
            base,
            &CardTaskAction::Go {
                href: "#next".to_string(),
                request: CardGoRequest::default(),
            }
        );
        assert_eq!(
            set_vars,
            &[
                CardSetVar {
                    name: "a".to_string(),
                    value: "1".to_string(),
                },
                CardSetVar {
                    name: "b".to_string(),
                    value: "2".to_string(),
                },
            ]
        );
    }

    #[test]
    fn with_set_vars_is_a_noop_for_an_empty_list() {
        let action = CardTaskAction::Prev.with_set_vars(Vec::new());
        assert_eq!(action, CardTaskAction::Prev);
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CardEventBindingKind {
    Do {
        name: String,
        do_type: String,
        label: Option<String>,
        optional: bool,
        language: Option<String>,
    },
    Onevent {
        event_type: String,
    },
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CardEventBinding {
    pub kind: CardEventBindingKind,
    pub action: CardTaskAction,
}

impl CardEventBinding {
    pub fn identity(&self) -> CardEventBindingIdentity {
        match &self.kind {
            CardEventBindingKind::Do { name, .. } => CardEventBindingIdentity::Do(name.clone()),
            CardEventBindingKind::Onevent { event_type } => {
                CardEventBindingIdentity::Onevent(event_type.clone())
            }
        }
    }

    pub fn is_noop(&self) -> bool {
        self.action == CardTaskAction::Noop
    }

    pub fn is_optional_do(&self) -> bool {
        matches!(&self.kind, CardEventBindingKind::Do { optional: true, .. })
    }

    pub fn matches_do_type(&self, target_type: &str) -> bool {
        matches!(
            &self.kind,
            CardEventBindingKind::Do { do_type, .. }
                if do_type.eq_ignore_ascii_case(target_type)
        )
    }

    pub fn matches_onevent_type(&self, target_type: &str) -> bool {
        matches!(
            &self.kind,
            CardEventBindingKind::Onevent { event_type }
                if event_type == target_type
        )
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Card {
    pub id: String,
    pub language: Option<String>,
    pub new_context: bool,
    pub ordered: bool,
    pub nodes: Vec<Node>,
    pub event_bindings: Vec<CardEventBinding>,
    pub timer: Option<CardTimer>,
}
