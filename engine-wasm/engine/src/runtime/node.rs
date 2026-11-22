use super::card::CardTaskAction;
use super::input_mask::InputMask;

pub(crate) const NONBREAKING_SPACE: char = '\u{a0}';
pub(crate) const TABLE_CELL_SEPARATOR: &str = " ";

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
    // Every retained row has this many logical slots. Slots beyond the
    // authored cells are significant trailing empties and need no storage.
    pub(crate) columns: u32,
    // Rows keep authored cells in order. The final logical column contains
    // all cells from its authored position onward. None is a trailing empty
    // cell in a balanced or short row.
    pub(crate) rows: Vec<Vec<Option<InlineNode>>>,
    pub(crate) legacy: Vec<InlineNode>,
    // The parser verified a single row of surplus literal text cells in one column.
    pub(crate) merge_legacy_cells: bool,
    // Populated only on the layout copy after the whole grid is measured.
    // Columns with no authored cells share the end of the measured columns.
    pub(crate) column_starts: Vec<u32>,
}

impl Table {
    pub(crate) fn space_legacy_cells(&mut self) {
        if !self.merge_legacy_cells {
            return;
        }
        // Keep any leading spacing marker in the legacy projection.
        let Some(InlineNode::Text(text)) = self.legacy.last_mut() else {
            return;
        };
        text.clear();
        for (index, cell) in self.rows[0].iter().flatten().enumerate() {
            let InlineNode::Text(cell_text) = cell else {
                unreachable!("the parser retained only literal text cells");
            };
            if index > 0 {
                text.push_str(TABLE_CELL_SEPARATOR);
            }
            text.push_str(cell_text);
        }
    }
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
