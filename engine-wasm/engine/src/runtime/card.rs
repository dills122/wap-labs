use crate::runtime::node::Node;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Card {
    pub id: String,
    pub nodes: Vec<Node>,
    pub accept_action_href: Option<String>,
    pub onenterforward_href: Option<String>,
    pub onenterbackward_href: Option<String>,
}
