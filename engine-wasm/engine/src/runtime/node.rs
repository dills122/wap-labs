use super::card::CardTaskAction;
use super::input_mask::InputMask;

pub(crate) const NONBREAKING_SPACE: char = '\u{a0}';

pub(crate) fn is_breakable_space(character: char) -> bool {
    character != NONBREAKING_SPACE && character.is_whitespace()
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum InlineContext {
    Card,
    Paragraph,
}

impl InlineContext {
    pub(crate) fn is_space(self, character: char) -> bool {
        match self {
            Self::Card => character.is_whitespace(),
            Self::Paragraph => is_breakable_space(character),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ParagraphMode {
    Wrap,
    NoWrap,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Node {
    Paragraph {
        /// Authored mode in the deck, effective mode for significant paragraphs in layout snapshots.
        mode: Option<ParagraphMode>,
        inline: Vec<InlineNode>,
    },
    /// Content emitted by the card-level walker, including the legacy `pre` path.
    CardContent(Vec<InlineNode>),
    Break,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SelectOption {
    pub label: String,
    pub value: String,
    pub onpick: Option<CardTaskAction>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Table {
    pub(crate) columns: u32,
    // A cell without a simple text or link fragment requires legacy layout.
    pub(crate) rows: Vec<Vec<Option<InlineNode>>>,
    pub(crate) legacy: Vec<InlineNode>,
    // Populated only on the layout copy after the whole grid is measured.
    pub(crate) column_starts: Vec<u32>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum InlineNode {
    Table(Table),
    Text(String),
    /// Authored whitespace trimmed from an inline text or label boundary.
    /// Layout uses it to retain a legal break after variable substitution.
    BreakOpportunity,
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
    Anchor {
        label_lines: Vec<String>,
        action: CardTaskAction,
    },
    Input {
        control_id: String,
        name: String,
        title: Option<String>,
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

impl InlineNode {
    pub(crate) fn legacy_inline(&self) -> &[Self] {
        match self {
            Self::Table(table) => &table.legacy,
            _ => std::slice::from_ref(self),
        }
    }

    pub(crate) fn is_significant_in_paragraph(&self) -> bool {
        match self {
            Self::Table(table) => {
                !table.column_starts.is_empty()
                    || table.legacy.iter().any(Self::is_significant_in_paragraph)
            }
            // A soft hyphen only has an effect when a line breaks there.
            Self::Text(text) => text
                .chars()
                .any(|character| character != '\u{00ad}' && !is_breakable_space(character)),
            Self::BreakOpportunity => false,
            Self::Break
            | Self::Link { .. }
            | Self::Anchor { .. }
            | Self::Input { .. }
            | Self::Select { .. } => true,
        }
    }
}
