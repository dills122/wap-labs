#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Node {
    Paragraph(Vec<InlineNode>),
    Break,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum InlineNode {
    Text(String),
    Link { text: String, href: String },
}
