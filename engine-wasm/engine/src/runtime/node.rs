use super::input_mask::InputMask;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Node {
    Paragraph(Vec<InlineNode>),
    Break,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SelectOption {
    pub label: String,
    pub value: String,
    pub onpick: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum InlineNode {
    Text(String),
    /// An explicit `<br/>` occurring inside a paragraph's inline content (as opposed to
    /// card-level `Node::Break`, e.g. text mixed with a link or input on the same paragraph).
    /// WAP-191_104-WML §11.8.4 requires `br` to force a line break regardless of nesting
    /// position; this variant lets the layout engine honor that instead of the element being
    /// silently dropped or mapped to ordinary whitespace.
    Break,
    Link {
        text: String,
        href: String,
    },
    Input {
        control_id: String,
        name: String,
        value: String,
        default_value: Option<String>,
        is_password: bool,
        max_length: Option<usize>,
        mask: InputMask,
        empty_ok: bool,
    },
    Select {
        control_id: String,
        name: Option<String>,
        iname: Option<String>,
        title: Option<String>,
        default_value: Option<String>,
        default_index_value: Option<String>,
        multiple: bool,
        options: Vec<SelectOption>,
        selected_indices: Vec<usize>,
    },
}
