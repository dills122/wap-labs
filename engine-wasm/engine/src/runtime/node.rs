#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Node {
    Paragraph(Vec<InlineNode>),
    Break,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum InlineNode {
    Text(String),
    Link {
        text: String,
        href: String,
    },
    Input {
        name: String,
        value: String,
        is_password: bool,
        max_length: Option<usize>,
    },
}
