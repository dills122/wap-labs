use crate::runtime::node::Node;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CardTaskAction {
    Go { href: String },
    Prev,
    Refresh,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Card {
    pub id: String,
    pub nodes: Vec<Node>,
    pub accept_action: Option<CardTaskAction>,
    pub onenterforward_action: Option<CardTaskAction>,
    pub onenterbackward_action: Option<CardTaskAction>,
}
