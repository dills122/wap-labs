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
    Link {
        text: String,
        href: String,
    },
    Input {
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
