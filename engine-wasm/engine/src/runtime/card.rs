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
pub enum CardTaskAction {
    Go {
        href: String,
        method: Option<String>,
        post_fields: Vec<CardPostField>,
    },
    Prev,
    Refresh,
    Noop,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CardEventBindingKind {
    Do {
        name: String,
        do_type: String,
        label: Option<String>,
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
    pub timer_value_ds: Option<u32>,
}
