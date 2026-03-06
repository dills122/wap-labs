use crate::runtime::node::Node;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CardTaskAction {
    Go { href: String },
    Prev,
    Refresh,
    Noop,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Card {
    pub id: String,
    pub nodes: Vec<Node>,
    pub accept_action: Option<CardTaskAction>,
    pub onenterforward_action: Option<CardTaskAction>,
    pub onenterbackward_action: Option<CardTaskAction>,
    pub ontimer_action: Option<CardTaskAction>,
    pub timer_value_ds: Option<u32>,
}
