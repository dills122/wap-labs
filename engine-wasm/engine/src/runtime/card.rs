use crate::runtime::node::Node;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Card {
    pub id: String,
    pub nodes: Vec<Node>,
}
