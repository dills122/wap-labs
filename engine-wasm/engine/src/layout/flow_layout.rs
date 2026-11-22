use std::borrow::Cow;
use std::collections::HashMap;

use crate::engine_runtime_internal::{substitute_inline, RuntimeLayoutCard};
use crate::render::frame::{EngineRenderError, EngineRenderLimits, EngineRenderResource};
use crate::render::render_list::{DrawCmd, RenderList};
use crate::runtime::card::{Card, CardTaskAction};
use crate::runtime::node::{
    is_breakable_space, InlineContext, InlineNode, Node, ParagraphMode, Table, NONBREAKING_SPACE,
};

#[derive(Clone, Debug, Default)]
pub struct LayoutResult<'card> {
    pub render_list: RenderList,
    pub focus_targets: Vec<FocusTarget<'card>>,
    pub segments: Vec<LayoutSegment>,
    pub(crate) reserved_row_end: u32,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LayoutSegment {
    pub x: u32,
    pub y: u32,
    pub text: String,
    pub focus_index: Option<usize>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FocusTarget<'card> {
    Link(&'card str),
    Anchor(&'card CardTaskAction),
    Input {
        control_id: &'card str,
        name: &'card str,
    },
    Select(&'card str),
}

impl<'card> FocusTarget<'card> {
    fn for_inline_node(node: &'card InlineNode) -> Option<Self> {
        match node {
            InlineNode::Link { href, .. } => Some(Self::Link(href)),
            InlineNode::Anchor { action, .. } => Some(Self::Anchor(action)),
            InlineNode::Input {
                control_id, name, ..
            } => Some(Self::Input { control_id, name }),
            InlineNode::Select { control_id, .. } => Some(Self::Select(control_id)),
            InlineNode::Table(_)
            | InlineNode::Text(_)
            | InlineNode::Break
            | InlineNode::BreakOpportunity => None,
        }
    }

    pub(crate) fn in_card(card: &'card Card) -> impl Iterator<Item = Self> + 'card {
        card.nodes
            .iter()
            .filter_map(|node| match node {
                Node::Paragraph { inline, .. } | Node::CardContent(inline) => Some(inline),
                Node::Break => None,
            })
            .flatten()
            .flat_map(InlineNode::legacy_inline)
            .filter_map(Self::for_inline_node)
    }

    /// Encode this target as the `href` string carried by [`DrawCmd::Link`].
    ///
    /// This is the only place the `input:`/`select:` prefix encoding is
    /// produced. The prefixes are part of the host-visible render-list shape
    /// (see the `browser/src-tauri` render assertions). Build the string when
    /// emitting a draw command for this target.
    fn to_render_href(self) -> String {
        let (prefix, destination) = self.render_href_parts();
        [prefix, destination].concat()
    }

    fn render_href_parts(&self) -> (&str, &str) {
        match self {
            FocusTarget::Link(href) => ("", href),
            FocusTarget::Anchor(action) => match action.base_and_set_vars().0 {
                CardTaskAction::Go { href, .. } => ("", href),
                _ => ("", "anchor:task"),
            },
            FocusTarget::Input { control_id, .. } => ("input:", control_id),
            FocusTarget::Select(name) => ("select:", name),
        }
    }

    pub fn frame_kind(&self) -> crate::EngineFocusTargetKind {
        match self {
            FocusTarget::Link(_) | FocusTarget::Anchor(_) => crate::EngineFocusTargetKind::Link,
            FocusTarget::Input { .. } => crate::EngineFocusTargetKind::Input,
            FocusTarget::Select(_) => crate::EngineFocusTargetKind::Select,
        }
    }
}

struct Fragment<'a> {
    text: Cow<'a, str>,
    focus_index: Option<usize>,
    keep_nbsp: bool,
}

enum ParagraphPart<'a> {
    Fragment(Fragment<'a>),
    Control {
        entry: &'a InlineNode,
        focus_index: Option<usize>,
    },
    Break,
    BreakOpportunity,
    Table {
        table: &'a Table,
        first_focus_index: usize,
    },
}

fn register_focus<'a>(entry: &'a InlineNode, targets: &mut Vec<FocusTarget<'a>>) -> Option<usize> {
    let target = FocusTarget::for_inline_node(entry)?;
    let index = targets.len();
    targets.push(target);
    Some(index)
}

fn inline_parts<'a>(
    entry: &'a InlineNode,
    context: InlineContext,
    targets: &mut Vec<FocusTarget<'a>>,
) -> impl Iterator<Item = ParagraphPart<'a>> + 'a {
    let keep_nbsp = context == InlineContext::Paragraph;
    let focus_index = register_focus(entry, targets);
    let fragment = move |text, keep_nbsp| {
        ParagraphPart::Fragment(Fragment {
            text,
            focus_index,
            keep_nbsp,
        })
    };

    let mut anchor_lines = &[][..];
    let part = match entry {
        InlineNode::Table(_) => unreachable!("tables are expanded by the paragraph layout"),
        InlineNode::Break => Some(ParagraphPart::Break),
        InlineNode::BreakOpportunity => Some(ParagraphPart::BreakOpportunity),
        InlineNode::Text(text) if keep_nbsp && text.is_empty() => None,
        InlineNode::Text(text) if keep_nbsp && text.chars().all(is_breakable_space) => {
            Some(ParagraphPart::BreakOpportunity)
        }
        InlineNode::Text(text) | InlineNode::Link { text, .. } => {
            Some(fragment(Cow::Borrowed(text.as_str()), keep_nbsp))
        }
        InlineNode::Anchor { label_lines, .. } => {
            anchor_lines = label_lines;
            None
        }
        InlineNode::Input { .. } | InlineNode::Select { .. } => {
            Some(ParagraphPart::Control { entry, focus_index })
        }
    };
    part.into_iter().chain(
        anchor_lines
            .iter()
            .enumerate()
            .flat_map(move |(index, text)| {
                [
                    (index != 0).then_some(ParagraphPart::Break),
                    Some(fragment(Cow::Borrowed(text.as_str()), keep_nbsp)),
                ]
                .into_iter()
                .flatten()
            }),
    )
}

struct ResolvedTableCell {
    text: String,
    href: Option<String>,
}

const TABLE_CELL_SEPARATOR: &str = " ";

fn table_row_columns(
    row: &[Option<InlineNode>],
    columns: usize,
) -> impl Iterator<Item = &[Option<InlineNode>]> {
    let (leading, final_column) = row.split_at(row.len().min(columns - 1));
    leading
        .iter()
        .map(std::slice::from_ref)
        .chain((!final_column.is_empty()).then_some(final_column))
}

fn resolve_table_cell(
    entry: &InlineNode,
    viewport_cols: usize,
    context: InlineContext,
    vars: &HashMap<String, String>,
) -> Option<ResolvedTableCell> {
    let mut entry = entry.clone();
    substitute_inline(&mut entry, context, vars).ok()?;
    let (text, href) = match entry {
        InlineNode::Text(text) => (text, None),
        InlineNode::Link { text, href } => (text, Some(href)),
        _ => return None,
    };
    let [line]: [WrappedLine; 1] = wrap_text(
        WrapSource {
            text: &text,
            seams: &[],
            keep_nbsp: true,
        },
        viewport_cols,
        1,
    )
    .ok()?
    .try_into()
    .ok()?;
    Some(ResolvedTableCell {
        text: line.text,
        href,
    })
}

pub(crate) fn table_column_starts(
    table: &Table,
    viewport_cols: usize,
    context: InlineContext,
    vars: &HashMap<String, String>,
) -> Option<Vec<u32>> {
    let columns = usize::try_from(table.columns).ok()?;
    if columns == 0 || columns > viewport_cols {
        return None;
    }
    // Unauthored trailing columns have zero width in every row.
    let authored_columns = table.rows.iter().map(Vec::len).max()?.min(columns);
    let mut widths = vec![0; authored_columns];
    let mut remaining_width = viewport_cols;
    // Column maxima only grow. Reject overflow immediately and retain just
    // the widths while checking the whole table's eligibility.
    for row in &table.rows {
        for (fragments, width) in table_row_columns(row, authored_columns).zip(&mut widths) {
            let mut cols = 0;
            for (index, entry) in fragments.iter().flatten().enumerate() {
                let cell = resolve_table_cell(entry, viewport_cols, context, vars)?;
                cols +=
                    cell.text.chars().count() + TABLE_CELL_SEPARATOR.len() * usize::from(index > 0);
                if cols > *width + remaining_width {
                    return None;
                }
            }
            remaining_width = remaining_width.checked_sub(cols.saturating_sub(*width))?;
            *width = (*width).max(cols);
        }
    }
    let starts = widths.into_iter().scan(0, |x, width| {
        let start = *x;
        *x += width as u32;
        Some(start)
    });
    Some(starts.collect())
}

enum ControlDisplayChunk<'a> {
    Text(&'a str),
    MaskedPassword(char),
}

fn write_control_display<E>(
    entry: &InlineNode,
    mut write: impl FnMut(ControlDisplayChunk<'_>) -> Result<(), E>,
) -> Result<(), E> {
    use ControlDisplayChunk::{MaskedPassword, Text};

    write(Text("["))?;
    let mut write_label = |label: &str| {
        write(Text(label))?;
        write(Text(": "))
    };
    match entry {
        InlineNode::Input {
            name,
            title,
            value,
            is_password,
            mask,
            ..
        } => {
            write_label(
                title
                    .as_deref()
                    .filter(|title| !title.trim().is_empty())
                    .unwrap_or(name),
            )?;
            if *is_password {
                for ch in mask.obscure(value) {
                    write(MaskedPassword(ch))?;
                }
            } else {
                write(Text(value))?;
            }
        }
        InlineNode::Select {
            control_id,
            name,
            iname,
            title,
            options,
            selected_indices,
            multiple,
            ..
        } => {
            write_label(
                title
                    .as_ref()
                    .or(name.as_ref())
                    .or(iname.as_ref())
                    .unwrap_or(control_id),
            )?;
            for (index, option) in selected_indices
                .iter()
                .filter_map(|index| options.get(*index))
                .enumerate()
            {
                if index != 0 && *multiple {
                    write(Text("; "))?;
                }
                write(Text(&option.label))?;
            }
        }
        _ => unreachable!("only form controls have a control display"),
    }
    write(Text("]"))
}

fn joins_previous(previous: &str, next: &Fragment<'_>) -> bool {
    if !next.keep_nbsp {
        return false;
    }
    // Ignore discretionary markers at the seam while keeping them in the wrap source.
    let previous = previous.trim_end_matches(SOFT_HYPHEN);
    let following = next.text.trim_start_matches(SOFT_HYPHEN);
    !previous.is_empty()
        && !following.is_empty()
        && !previous.ends_with(is_breakable_space)
        && !following.starts_with(is_breakable_space)
        && (previous.ends_with(NONBREAKING_SPACE) || following.starts_with(NONBREAKING_SPACE))
}

#[cfg(test)]
pub fn layout_card(
    card: &Card,
    viewport_cols: usize,
    focused_link_idx: usize,
) -> Result<LayoutResult<'_>, EngineRenderError> {
    layout_card_impl(
        &card.nodes,
        &HashMap::new(),
        viewport_cols,
        focused_link_idx,
        EngineRenderLimits::default(),
        false,
    )
}

pub(crate) fn layout_card_with_limits<'a>(
    card: &'a RuntimeLayoutCard<'_>,
    viewport_cols: usize,
    focused_link_idx: usize,
    limits: EngineRenderLimits,
) -> Result<LayoutResult<'a>, EngineRenderError> {
    layout_card_impl(
        &card.nodes,
        card.vars,
        viewport_cols,
        focused_link_idx,
        limits,
        true,
    )
}

fn layout_card_impl<'a>(
    nodes: &'a [Node],
    vars: &HashMap<String, String>,
    viewport_cols: usize,
    focused_link_idx: usize,
    limits: EngineRenderLimits,
    count_render_pass: bool,
) -> Result<LayoutResult<'a>, EngineRenderError> {
    #[cfg(feature = "render-test-instrumentation")]
    if count_render_pass {
        LAYOUT_PASS_COUNT.with(|count| count.set(count.get() + 1));
    }
    #[cfg(not(feature = "render-test-instrumentation"))]
    let _ = count_render_pass;

    let mut result = LayoutResult::default();
    let mut row_count = 0usize;
    let mut nowrap = NowrapState::default();
    // A significant nowrap paragraph anywhere on the card makes earlier
    // unpainted wrapped paragraphs part of the logical row layout.
    let has_nowrap = nodes.iter().any(|node| {
        matches!(node, Node::Paragraph { inline, mode: Some(ParagraphMode::NoWrap) }
            if inline.iter().any(InlineNode::is_significant_in_paragraph))
    });

    for node in nodes {
        let (inline, context, is_nowrap) = match node {
            Node::Paragraph { inline, mode } => (
                inline,
                InlineContext::Paragraph,
                *mode == Some(ParagraphMode::NoWrap),
            ),
            Node::CardContent(inline) => (inline, InlineContext::Card, false),
            Node::Break => {
                nowrap.advance_row(&limits, &mut row_count, &mut result)?;
                // Card-level breaks (including those inside pre) consume a row
                // even when nothing paints after them.
                if has_nowrap {
                    result.reserved_row_end = row_count as u32;
                }
                continue;
            }
        };

        if is_nowrap {
            layout_nowrap(
                inline,
                &mut result,
                &limits,
                &mut row_count,
                focused_link_idx,
                &mut nowrap,
            )?;
            continue;
        }
        let significant_paragraph = context == InlineContext::Paragraph
            && inline.iter().any(InlineNode::is_significant_in_paragraph);
        // Wrapped paragraphs can reuse a row opened by another wrapped
        // paragraph's trailing break. Nowrap starts on a new row.
        if significant_paragraph && nowrap.pending_row != PendingParagraphRow::TrailingWrap {
            nowrap.consume_paragraph_boundary(&limits, &mut row_count, &mut result)?;
        }
        let first_row = row_count;
        let mut painted = false;

        // Card-level paint or a break can occupy the pending line itself.
        // Empty card content leaves it available for the next node.
        let mut parts = Vec::new();
        for entry in inline {
            if let InlineNode::Table(table) = entry {
                if !table.column_starts.is_empty() {
                    let first_focus_index = result.focus_targets.len();
                    result.focus_targets.extend(
                        table
                            .rows
                            .iter()
                            .flatten()
                            .flatten()
                            .filter_map(FocusTarget::for_inline_node),
                    );
                    parts.push(ParagraphPart::Table {
                        table,
                        first_focus_index,
                    });
                    continue;
                }
            }
            for entry in entry.legacy_inline() {
                parts.extend(inline_parts(entry, context, &mut result.focus_targets));
            }
        }
        let mut parts = parts.into_iter();
        while let Some(part) = parts.next() {
            let first = match part {
                // Explicit breaks consume a row even when they have no paint.
                ParagraphPart::Break => {
                    nowrap.advance_row(&limits, &mut row_count, &mut result)?;
                    if significant_paragraph && has_nowrap {
                        result.reserved_row_end = row_count as u32;
                        // A focus target belongs to the open row even when its label
                        // paints nothing. Paint or a subsequent break uses that row.
                        let row_has_focus = parts
                            .as_slice()
                            .iter()
                            .take_while(|part| !matches!(part, ParagraphPart::Break))
                            .any(|part| {
                                matches!(part, ParagraphPart::Fragment(fragment)
                                    if fragment.focus_index.is_some())
                            });
                        if row_has_focus {
                            nowrap.pending_row = PendingParagraphRow::UnpaintedWrap;
                        } else if !painted {
                            // A following nowrap paragraph starts after the open row.
                            nowrap.pending_row = PendingParagraphRow::TrailingWrap;
                        }
                    }
                    continue;
                }
                ParagraphPart::BreakOpportunity => continue,
                ParagraphPart::Table {
                    table,
                    first_focus_index,
                } => {
                    painted = true;
                    nowrap.pending_row = PendingParagraphRow::None;
                    if table.rows.len() > limits.rows.saturating_sub(row_count) {
                        check_next_row(&limits, limits.rows)?;
                    }
                    let columns = table.column_starts.len();
                    // Long rows have no empty cells, so each excess cell adds a separator.
                    let outputs = table
                        .rows
                        .iter()
                        .map(|row| row.iter().flatten().count() + row.len().saturating_sub(columns))
                        .sum();
                    check_output_slots(&limits, &result, outputs)?;
                    let mut next_focus_index = first_focus_index;
                    for row in &table.rows {
                        let y = row_count as u32;
                        for (fragments, &start) in
                            table_row_columns(row, columns).zip(&table.column_starts)
                        {
                            let mut x = start;
                            for (index, entry) in fragments.iter().flatten().enumerate() {
                                if index > 0 {
                                    nowrap
                                        .account_draw_bytes(&limits, TABLE_CELL_SEPARATOR.len())?;
                                    x = push_segment(
                                        &mut result,
                                        &limits,
                                        LayoutSegment {
                                            x,
                                            y,
                                            text: TABLE_CELL_SEPARATOR.to_owned(),
                                            focus_index: None,
                                        },
                                        focused_link_idx,
                                    )?;
                                }
                                let cell = resolve_table_cell(entry, viewport_cols, context, vars)
                                    .ok_or_else(|| {
                                        EngineRenderError::engine_failure(
                                            "Measured table cell could not be rendered",
                                        )
                                    })?;
                                let focus_index = cell.href.as_ref().map(|_| {
                                    let index = next_focus_index;
                                    next_focus_index += 1;
                                    index
                                });
                                nowrap.account_draw_bytes(
                                    &limits,
                                    cell.text.len() + cell.href.as_ref().map_or(0, String::len),
                                )?;
                                x = push_segment_with_href(
                                    &mut result,
                                    &limits,
                                    LayoutSegment {
                                        x,
                                        y,
                                        text: cell.text,
                                        focus_index,
                                    },
                                    focused_link_idx,
                                    cell.href,
                                )?;
                            }
                        }
                        row_count += 1;
                    }
                    continue;
                }
                ParagraphPart::Fragment(fragment) => fragment,
                ParagraphPart::Control { entry, focus_index } => {
                    let mut text = String::new();
                    write_control_display(entry, |chunk| {
                        match chunk {
                            ControlDisplayChunk::Text(chunk) => text.push_str(chunk),
                            ControlDisplayChunk::MaskedPassword(ch) => text.push(ch),
                        }
                        Ok::<_, std::convert::Infallible>(())
                    })
                    .expect("writing to a string is infallible");
                    Fragment {
                        text: Cow::Owned(text),
                        focus_index,
                        keep_nbsp: false,
                    }
                }
            };

            let mut text = first.text;
            let mut seams = Vec::new();
            let mut focus_indices = vec![first.focus_index];
            if first.keep_nbsp {
                loop {
                    let marker_count = parts
                        .as_slice()
                        .iter()
                        .take_while(|part| {
                            matches!(part, ParagraphPart::Fragment(fragment)
                                if fragment.keep_nbsp
                                    && !fragment.text.is_empty()
                                    && fragment.text.trim_matches(SOFT_HYPHEN).is_empty())
                        })
                        .count();
                    let joins = matches!(
                        parts.as_slice().get(marker_count),
                        Some(ParagraphPart::Fragment(next)) if joins_previous(&text, next)
                    );
                    if !joins {
                        // Standalone discretionary markers paint nothing. Consume them once
                        // without stepping past a space, explicit break, or control.
                        parts.by_ref().take(marker_count).for_each(drop);
                        break;
                    }
                    for part in parts.by_ref().take(marker_count + 1) {
                        if let ParagraphPart::Fragment(fragment) = part {
                            seams.push(text.len());
                            text.to_mut().push_str(&fragment.text);
                            focus_indices.push(fragment.focus_index);
                        }
                    }
                }
            }

            let remaining_chunks = limits
                .rows
                .saturating_sub(row_count)
                .min(limits.segments.saturating_sub(result.segments.len()))
                .min(
                    limits
                        .draw_commands
                        .saturating_sub(result.render_list.draw.len()),
                );
            let lines = wrap_text(
                WrapSource {
                    text: &text,
                    seams: &seams,
                    keep_nbsp: first.keep_nbsp,
                },
                viewport_cols,
                remaining_chunks,
            )
            .map_err(|_| {
                next_output_error(&limits, row_count, result.segments.len(), remaining_chunks)
            })?;

            for line in lines {
                painted = true;
                nowrap.pending_row = PendingParagraphRow::None;
                check_next_row(&limits, row_count)?;
                let y = row_count as u32;
                let mut x = 0;
                for (fragment, text) in line.fragments() {
                    let focus_index = focus_indices[fragment];
                    x = push_segment(
                        &mut result,
                        &limits,
                        LayoutSegment {
                            x,
                            y,
                            text: text.to_owned(),
                            focus_index,
                        },
                        focused_link_idx,
                    )?;
                }
                row_count += 1;
            }
        }
        if row_count == first_row && significant_paragraph && has_nowrap {
            nowrap.pending_row = PendingParagraphRow::UnpaintedWrap;
        }
    }

    if nowrap.pending_row.reserves_extent() {
        nowrap.consume_paragraph_boundary(&limits, &mut row_count, &mut result)?;
    }
    Ok(result)
}

#[derive(Default, PartialEq, Eq)]
enum PendingParagraphRow {
    #[default]
    None,
    TrailingNowrap,
    TrailingWrap,
    UnpaintedWrap,
}

impl PendingParagraphRow {
    fn reserves_extent(&self) -> bool {
        matches!(self, Self::TrailingNowrap | Self::UnpaintedWrap)
    }
}

#[derive(Default)]
struct NowrapState {
    draw_payload_bytes: usize,
    pending_row: PendingParagraphRow,
}

impl NowrapState {
    fn consume_paragraph_boundary(
        &mut self,
        limits: &EngineRenderLimits,
        row_count: &mut usize,
        result: &mut LayoutResult<'_>,
    ) -> Result<(), EngineRenderError> {
        if self.pending_row != PendingParagraphRow::None {
            self.advance_row(limits, row_count, result)?;
        }
        Ok(())
    }

    fn advance_row(
        &mut self,
        limits: &EngineRenderLimits,
        row_count: &mut usize,
        result: &mut LayoutResult<'_>,
    ) -> Result<(), EngineRenderError> {
        check_next_row(limits, *row_count)?;
        *row_count += 1;
        if std::mem::take(&mut self.pending_row).reserves_extent() {
            result.reserved_row_end = *row_count as u32;
        }
        Ok(())
    }

    fn account_draw_bytes(
        &mut self,
        limits: &EngineRenderLimits,
        bytes: usize,
    ) -> Result<(), EngineRenderError> {
        let observed = self.draw_payload_bytes.saturating_add(bytes);
        if observed > limits.serialized_bytes {
            return Err(EngineRenderError::resource_limit(
                EngineRenderResource::SerializedBytes,
                limits.serialized_bytes,
                observed,
            ));
        }
        self.draw_payload_bytes = observed;
        Ok(())
    }
}

fn layout_nowrap<'card>(
    inline: &'card [InlineNode],
    result: &mut LayoutResult<'card>,
    limits: &EngineRenderLimits,
    row_count: &mut usize,
    focused_link_idx: usize,
    state: &mut NowrapState,
) -> Result<(), EngineRenderError> {
    let first_row = *row_count;
    let mut x = 0;
    let mut pending_space = false;
    for entry in inline.iter().flat_map(InlineNode::legacy_inline) {
        for part in inline_parts(entry, InlineContext::Paragraph, &mut result.focus_targets) {
            // Hold whitespace until the next painted character, even across substitutions
            // that expand to nothing. Keep separators outside a focus target's hit region.
            let mut text = String::new();
            let mut separator = false;
            let mut normalize = |chunk: ControlDisplayChunk<'_>, focus_index: Option<usize>| {
                let mut utf8 = [0; 4];
                let (chunk, masked_password): (&str, _) = match chunk {
                    ControlDisplayChunk::Text(chunk) => (chunk, false),
                    // The obscurer has already resolved which mask literals to keep.
                    ControlDisplayChunk::MaskedPassword(ch) => (ch.encode_utf8(&mut utf8), true),
                };
                for ch in chunk
                    .chars()
                    .filter(|&ch| masked_password || ch != SOFT_HYPHEN)
                {
                    if !masked_password && is_breakable_space(ch) {
                        pending_space = x > 0 || !text.is_empty();
                        continue;
                    }
                    let space = std::mem::take(&mut pending_space);
                    if text.is_empty() {
                        state.consume_paragraph_boundary(limits, row_count, result)?;
                        check_next_row(limits, *row_count)?;
                        separator = space && focus_index.is_some();
                        check_output_slots(limits, result, 1 + usize::from(separator))?;
                    }
                    // Each painted byte appears in the draw list, even beyond the viewport.
                    state.account_draw_bytes(limits, ch.len_utf8() + usize::from(space))?;
                    if space && !(text.is_empty() && separator) {
                        text.push(' ');
                    }
                    text.push(ch);
                }
                Ok::<_, EngineRenderError>(())
            };
            let focus_index = match part {
                ParagraphPart::Table { .. } => unreachable!("nowrap uses legacy table layout"),
                ParagraphPart::Break => {
                    state.consume_paragraph_boundary(limits, row_count, result)?;
                    // End the current logical row, even if another break left it empty.
                    check_next_row(limits, *row_count)?;
                    *row_count += 1;
                    x = 0;
                    pending_space = false;
                    continue;
                }
                ParagraphPart::BreakOpportunity => {
                    pending_space = x > 0;
                    continue;
                }
                ParagraphPart::Fragment(fragment) => {
                    normalize(
                        ControlDisplayChunk::Text(&fragment.text),
                        fragment.focus_index,
                    )?;
                    fragment.focus_index
                }
                ParagraphPart::Control { entry, focus_index } => {
                    write_control_display(entry, |chunk| normalize(chunk, focus_index))?;
                    focus_index
                }
            };
            if text.is_empty() {
                continue;
            }

            if let Some(index) = focus_index {
                // A multiline anchor repeats its destination in every emitted command.
                let (prefix, destination) = result.focus_targets[index].render_href_parts();
                state.account_draw_bytes(limits, prefix.len().saturating_add(destination.len()))?;
            }
            let y = *row_count as u32;
            if separator {
                x = push_segment(
                    result,
                    limits,
                    LayoutSegment {
                        x,
                        y,
                        text: " ".into(),
                        focus_index: None,
                    },
                    focused_link_idx,
                )?;
            }
            x = push_segment(
                result,
                limits,
                LayoutSegment {
                    x,
                    y,
                    text,
                    focus_index,
                },
                focused_link_idx,
            )?;
        }
    }
    let ends_with_break = x == 0 && *row_count > first_row;
    if x > 0 {
        *row_count += 1;
    } else if !ends_with_break && inline.iter().any(InlineNode::is_significant_in_paragraph) {
        // A focus target can be significant even when its label has no painted glyphs.
        state.consume_paragraph_boundary(limits, row_count, result)?;
        check_next_row(limits, *row_count)?;
        *row_count += 1;
    }
    if *row_count > first_row {
        // A trailing break opens an empty line. Defer it until the next significant
        // paragraph or the end of the card so intervening insignificant content costs no row.
        state.pending_row = if ends_with_break {
            PendingParagraphRow::TrailingNowrap
        } else {
            PendingParagraphRow::None
        };
        result.reserved_row_end = *row_count as u32;
    }
    Ok(())
}

fn push_segment(
    result: &mut LayoutResult<'_>,
    limits: &EngineRenderLimits,
    segment: LayoutSegment,
    focused_link_idx: usize,
) -> Result<u32, EngineRenderError> {
    push_segment_with_href(result, limits, segment, focused_link_idx, None)
}

fn push_segment_with_href(
    result: &mut LayoutResult<'_>,
    limits: &EngineRenderLimits,
    segment: LayoutSegment,
    focused_link_idx: usize,
    resolved_href: Option<String>,
) -> Result<u32, EngineRenderError> {
    check_output_slots(limits, result, 1)?;
    let LayoutSegment {
        x,
        y,
        text,
        focus_index,
    } = &segment;
    let (x, y) = (*x, *y);
    let draw = match *focus_index {
        Some(index) => DrawCmd::Link {
            x,
            y,
            text: text.clone(),
            focused: index == focused_link_idx,
            href: resolved_href.unwrap_or_else(|| result.focus_targets[index].to_render_href()),
        },
        None => DrawCmd::Text {
            x,
            y,
            text: text.clone(),
        },
    };
    let end_x = x + text.chars().count() as u32;
    result.segments.push(segment);
    result.render_list.draw.push(draw);
    Ok(end_x)
}

fn check_next_row(limits: &EngineRenderLimits, rows: usize) -> Result<(), EngineRenderError> {
    if rows >= limits.rows {
        return Err(EngineRenderError::resource_limit(
            EngineRenderResource::LayoutRows,
            limits.rows,
            rows.saturating_add(1),
        ));
    }
    Ok(())
}

fn check_output_slots(
    limits: &EngineRenderLimits,
    result: &LayoutResult<'_>,
    needed: usize,
) -> Result<(), EngineRenderError> {
    if limits.segments.saturating_sub(result.segments.len()) < needed {
        return Err(EngineRenderError::resource_limit(
            EngineRenderResource::LayoutSegments,
            limits.segments,
            limits.segments.saturating_add(1),
        ));
    }
    if limits
        .draw_commands
        .saturating_sub(result.render_list.draw.len())
        < needed
    {
        return Err(EngineRenderError::resource_limit(
            EngineRenderResource::DrawCommands,
            limits.draw_commands,
            limits.draw_commands.saturating_add(1),
        ));
    }
    Ok(())
}

fn next_output_error(
    limits: &EngineRenderLimits,
    rows: usize,
    segments: usize,
    additional_outputs: usize,
) -> EngineRenderError {
    if limits.rows.saturating_sub(rows) == additional_outputs {
        return EngineRenderError::resource_limit(
            EngineRenderResource::LayoutRows,
            limits.rows,
            limits.rows.saturating_add(1),
        );
    }
    if limits.segments.saturating_sub(segments) == additional_outputs {
        return EngineRenderError::resource_limit(
            EngineRenderResource::LayoutSegments,
            limits.segments,
            limits.segments.saturating_add(1),
        );
    }
    EngineRenderError::resource_limit(
        EngineRenderResource::DrawCommands,
        limits.draw_commands,
        limits.draw_commands.saturating_add(1),
    )
}

const SOFT_HYPHEN: char = '\u{00ad}';

struct WrapSource<'a> {
    text: &'a str,
    /// Byte offsets at which a new inline fragment starts.
    seams: &'a [usize],
    keep_nbsp: bool,
}

impl WrapSource<'_> {
    fn wrap_bytes(&self, text: &str) -> usize {
        // Keep the existing byte-based fit rule for other Unicode characters.
        text.len()
            - if self.keep_nbsp {
                text.matches(NONBREAKING_SPACE).count()
            } else {
                0
            }
    }
}

#[derive(Default)]
struct WrappedLine {
    text: String,
    wrap_bytes: usize,
    /// The source fragment index and painted byte offset at each change of owner.
    owners: Vec<(usize, usize)>,
}

impl WrappedLine {
    fn append(&mut self, source: &WrapSource<'_>, mut slice: &str, strip_soft_hyphens: bool) {
        if source.seams.is_empty() {
            self.append_piece(source, slice, strip_soft_hyphens);
            return;
        }

        // All slices passed by the wrapper borrow from the same source string.
        let mut start = slice.as_ptr() as usize - source.text.as_ptr() as usize;
        let mut owner = source.seams.partition_point(|&seam| seam <= start);
        while let Some(&end) = source
            .seams
            .get(owner)
            .filter(|&&end| end < start + slice.len())
        {
            let (piece, rest) = slice.split_at(end - start);
            self.append_owned_piece(source, piece, strip_soft_hyphens, owner);
            start = end;
            slice = rest;
            owner += 1;
        }
        self.append_owned_piece(source, slice, strip_soft_hyphens, owner);
    }

    fn append_piece(&mut self, source: &WrapSource<'_>, piece: &str, strip_soft_hyphens: bool) {
        let before = self.text.len();
        if strip_soft_hyphens {
            self.text
                .extend(piece.chars().filter(|&ch| ch != SOFT_HYPHEN));
        } else {
            self.text.push_str(piece);
        }
        self.wrap_bytes += source.wrap_bytes(&self.text[before..]);
    }

    fn append_owned_piece(
        &mut self,
        source: &WrapSource<'_>,
        piece: &str,
        strip_soft_hyphens: bool,
        owner: usize,
    ) {
        let before = self.text.len();
        self.append_piece(source, piece, strip_soft_hyphens);
        if before != self.text.len() {
            self.note_owner(owner, before);
        }
    }

    fn note_owner(&mut self, owner: usize, start: usize) {
        if self
            .owners
            .last()
            .is_none_or(|&(previous, _)| previous != owner)
        {
            self.owners.push((owner, start));
        }
    }

    fn push_ascii(&mut self, character: char) {
        self.text.push(character);
        self.wrap_bytes += 1;
    }

    fn fragments(&self) -> impl Iterator<Item = (usize, &str)> {
        let owners = if self.owners.is_empty() {
            &[(0, 0)]
        } else {
            self.owners.as_slice()
        };
        owners.iter().enumerate().map(|(index, &(owner, start))| {
            let end = owners
                .get(index + 1)
                .map_or(self.text.len(), |&(_, end)| end);
            (owner, &self.text[start..end])
        })
    }
}

fn push_line(
    lines: &mut Vec<WrappedLine>,
    current: &mut WrappedLine,
    max_lines: usize,
) -> Result<(), ()> {
    if lines.len() >= max_lines {
        return Err(());
    }
    lines.push(std::mem::take(current));
    Ok(())
}

fn push_word_with_discretionary_breaks(
    source: &WrapSource<'_>,
    mut word: &str,
    width: usize,
    max_lines: usize,
    lines: &mut Vec<WrappedLine>,
    current: &mut WrappedLine,
    current_cols: &mut usize,
) -> Result<(), ()> {
    let has_nbsp = source.keep_nbsp && word.contains(NONBREAKING_SPACE);
    loop {
        word = word.trim_matches(SOFT_HYPHEN);
        if word.is_empty() {
            return Ok(());
        }

        let needs_space = !current.text.is_empty();
        let available = width.saturating_sub(*current_cols + usize::from(needs_space));
        let mut visible = 0;
        let mut visible_bytes = 0;
        let mut soft_break = None;
        let mut hard_break = None;
        for (index, character) in word.char_indices() {
            if character == SOFT_HYPHEN {
                // A selected soft break needs one column for the rendered hyphen.
                if visible < available {
                    soft_break = Some((index, index + character.len_utf8()));
                }
            } else if visible == available {
                hard_break = Some(index);
                break;
            } else {
                visible += 1;
                visible_bytes += character.len_utf8()
                    - usize::from(source.keep_nbsp && character == NONBREAKING_SPACE);
            }
        }

        let Some(hard_break) = hard_break else {
            // Match ordinary word wrapping when the word fits in painted columns.
            // Appending to a populated line uses UTF-8 bytes, excluding soft hyphens.
            if needs_space {
                if current.wrap_bytes + 1 + visible_bytes <= width {
                    current.push_ascii(' ');
                    *current_cols += 1;
                } else {
                    push_line(lines, current, max_lines)?;
                    *current_cols = 0;
                }
            }
            current.append(source, word, true);
            *current_cols += visible;
            return Ok(());
        };

        if let Some((end, resume)) = soft_break {
            if needs_space {
                current.push_ascii(' ');
            }
            current.append(source, &word[..end], true);
            if !source.seams.is_empty() {
                // A painted discretionary hyphen belongs to its authored fragment.
                let offset = word.as_ptr() as usize - source.text.as_ptr() as usize + end;
                let owner = source.seams.partition_point(|&seam| seam <= offset);
                current.note_owner(owner, current.text.len());
            }
            current.push_ascii('-');
            word = &word[resume..];
        } else if !needs_space {
            let end = if has_nbsp {
                nonbreaking_hard_wrap(word, hard_break)
            } else {
                hard_break
            };
            current.append(source, &word[..end], true);
            word = &word[end..];
        }
        push_line(lines, current, max_lines)?;
        *current_cols = 0;
    }
}

/// An oversized word can hard-wrap at a letter boundary. If the portion glued
/// by a nonbreaking space itself exceeds the viewport, keep it on one row.
/// Draw commands and hit regions retain their full coordinates even beyond the
/// visible columns, and any links there can still be focused and activated by key.
fn nonbreaking_hard_wrap(word: &str, preferred: usize) -> usize {
    let mut previous = None;
    let mut last_safe = None;
    for (index, ch) in word.char_indices().filter(|&(_, ch)| ch != SOFT_HYPHEN) {
        if previous.is_some_and(|prev| prev != NONBREAKING_SPACE) && ch != NONBREAKING_SPACE {
            if index > preferred {
                return last_safe.unwrap_or(index);
            }
            last_safe = Some(index);
        }
        previous = Some(ch);
    }
    last_safe.unwrap_or(word.len())
}

fn wrap_text(
    source: WrapSource<'_>,
    width: usize,
    max_lines: usize,
) -> Result<Vec<WrappedLine>, ()> {
    let width = width.max(1);
    let mut lines = Vec::new();
    let mut current = WrappedLine::default();
    let mut current_cols = 0;
    let delimiter = if source.keep_nbsp {
        is_breakable_space
    } else {
        char::is_whitespace
    };

    for word in source.text.split(delimiter).filter(|word| !word.is_empty()) {
        if word.contains(SOFT_HYPHEN) || (source.keep_nbsp && word.contains(NONBREAKING_SPACE)) {
            push_word_with_discretionary_breaks(
                &source,
                word,
                width,
                max_lines,
                &mut lines,
                &mut current,
                &mut current_cols,
            )?;
            continue;
        }

        let mut push_word = |word: &str, cols: usize| -> Result<(), ()> {
            if !current.text.is_empty() {
                let candidate_len = current.wrap_bytes + 1 + word.len();
                if candidate_len <= width {
                    current.push_ascii(' ');
                    current.append(&source, word, false);
                    current_cols += 1 + cols;
                    return Ok(());
                }
                push_line(&mut lines, &mut current, max_lines)?;
            }
            current.append(&source, word, false);
            current_cols = cols;
            Ok(())
        };

        let word_cols = word.chars().count();
        if word_cols <= width {
            push_word(word, word_cols)?;
        } else {
            let mut start = 0;
            for (index, _) in word.char_indices().step_by(width).skip(1) {
                push_word(&word[start..index], width)?;
                start = index;
            }
            let trailing = &word[start..];
            push_word(trailing, trailing.chars().count())?;
        }
    }

    if !current.text.is_empty() {
        push_line(&mut lines, &mut current, max_lines)?;
    }

    Ok(lines)
}

#[cfg(feature = "render-test-instrumentation")]
std::thread_local! {
    static LAYOUT_PASS_COUNT: std::cell::Cell<usize> = const { std::cell::Cell::new(0) };
}

#[cfg(feature = "render-test-instrumentation")]
pub fn reset_layout_pass_count() {
    LAYOUT_PASS_COUNT.with(|count| count.set(0));
}

#[cfg(feature = "render-test-instrumentation")]
pub fn layout_pass_count() -> usize {
    LAYOUT_PASS_COUNT.with(std::cell::Cell::get)
}

#[cfg(test)]
mod tests {
    use super::{layout_card, layout_card_with_limits, FocusTarget};
    use crate::render::frame::{EngineRenderError, EngineRenderLimits, EngineRenderResource};
    use crate::render::render_list::DrawCmd;
    use crate::runtime::card::Card;
    use crate::runtime::node::{InlineNode, Node};
    use crate::{EngineInputEvent, WmlEngine};

    fn load_strict_deck(wml: &str) -> WmlEngine {
        let mut engine = WmlEngine::new();
        engine.set_viewport_cols(20).unwrap();
        engine
            .load_deck_context(
                wml,
                "http://example.test/paragraph-nonbreaking-space.wml",
                "text/vnd.wap.wml; validation=strict",
                None,
            )
            .expect("strict WML 1.3 deck must load");
        engine
    }

    fn strict_paragraph(paragraph: &str) -> WmlEngine {
        strict_card_body(&format!("<p>{paragraph}</p>"))
    }

    fn strict_card_body(body: &str) -> WmlEngine {
        let wml = format!(
            r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="main">{body}</card><card id="next"><p>Destination</p></card></wml>"#
        );
        let mut engine = load_strict_deck(&wml);
        assert!(engine.set_var("space".into(), "\u{a0}".into()));
        assert!(engine.set_var("word".into(), "Fox".into()));
        engine
    }

    fn draw(engine: &WmlEngine) -> serde_json::Value {
        serde_json::to_value(engine.render().unwrap().draw).unwrap()
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_long_row_aggregation() {
        // WAP-191_104-WML §11.8.5 puts every excess cell in the last column,
        // with a single inter-word space at each merged boundary.
        let mut engine = strict_paragraph(concat!(
            r##"<a href="#main">$(before)</a><table columns="2">"##,
            r#"<tr><td>Wide</td><td>Base</td></tr><tr><td>S</td></tr>"#,
            r##"<tr><td>A</td><td>$(word)</td><td><a href="#$(target)">$(label)</a></td><td>End</td></tr>"##,
            r##"</table><a href="#main">$(after)</a>"##,
        ));
        for (name, value) in [
            ("before", "Before"),
            ("target", "next"),
            ("label", "Go"),
            ("after", "After"),
        ] {
            assert!(engine.set_var(name.into(), value.into()));
        }
        assert_eq!(
            draw(&engine),
            serde_json::json!([
                {"type": "link", "x": 0, "y": 0, "text": "Before", "href": "#main", "focused": true},
                {"type": "text", "x": 0, "y": 2, "text": "Wide"},
                {"type": "text", "x": 4, "y": 2, "text": "Base"},
                {"type": "text", "x": 0, "y": 3, "text": "S"},
                {"type": "text", "x": 0, "y": 4, "text": "A"},
                {"type": "text", "x": 4, "y": 4, "text": "Fox"},
                {"type": "text", "x": 7, "y": 4, "text": " "},
                {"type": "link", "x": 8, "y": 4, "text": "Go", "href": "#next", "focused": false},
                {"type": "text", "x": 10, "y": 4, "text": " "},
                {"type": "text", "x": 11, "y": 4, "text": "End"},
                {"type": "link", "x": 0, "y": 6, "text": "After", "href": "#main", "focused": false}
            ])
        );
        let frame = engine.render_output().unwrap().presentation;
        assert_table_hit_regions(
            &frame,
            &[
                (0, 0, 6, 1, "focus:0"),
                (8, 4, 2, 1, "focus:1"),
                (0, 6, 5, 1, "focus:2"),
            ],
        );
        for x in [7, 10] {
            engine
                .handle_input(EngineInputEvent::Click {
                    frame_id: frame.frame_id.clone(),
                    x,
                    y: 4,
                })
                .unwrap();
            assert_eq!(engine.focused_link_index(), 0);
            assert_eq!(engine.active_card_id().as_deref(), Ok("main"));
        }
        engine.handle_key("down".into()).unwrap();
        assert_eq!(engine.focused_link_index(), 1);
        assert_eq!(draw(&engine)[7]["focused"], true);
        engine.handle_key("down".into()).unwrap();
        assert_eq!(engine.focused_link_index(), 2);
        assert_eq!(draw(&engine)[10]["focused"], true);
        engine.handle_key("up".into()).unwrap();
        engine.handle_key("enter".into()).unwrap();
        assert_eq!(engine.active_card_id().as_deref(), Ok("next"));
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_long_row_aggregation_one_column_and_limits() {
        let mut engine = strict_paragraph(concat!(
            r##"<table columns="1"><tr><td><a href="#$(first)">$(left)</a></td>"##,
            r##"<td><a href="#$(target)">$(right)</a></td><td>$(end)</td></tr></table>"##,
        ));
        for (name, value) in [
            ("first", "main"),
            ("left", "Up"),
            ("target", "next"),
            ("right", "Go"),
            ("end", "é"),
        ] {
            assert!(engine.set_var(name.into(), value.into()));
        }
        let expected = serde_json::json!([
            {"type": "link", "x": 0, "y": 0, "text": "Up", "href": "#main", "focused": true},
            {"type": "text", "x": 2, "y": 0, "text": " "},
            {"type": "link", "x": 3, "y": 0, "text": "Go", "href": "#next", "focused": false},
            {"type": "text", "x": 5, "y": 0, "text": " "},
            {"type": "text", "x": 6, "y": 0, "text": "é"}
        ]);
        assert_eq!(draw(&engine), expected);
        assert_table_limits(&engine, 1, 5, "Up#main Go#next é".len());
        assert_eq!(draw(&engine), expected);

        let frame = engine.render_output().unwrap().presentation;
        assert_table_hit_regions(&frame, &[(0, 0, 2, 1, "focus:0"), (3, 0, 2, 1, "focus:1")]);
        engine
            .handle_input(EngineInputEvent::Click {
                frame_id: frame.frame_id.clone(),
                x: 2,
                y: 0,
            })
            .unwrap();
        assert_eq!(engine.focused_link_index(), 0);
        engine
            .handle_input(EngineInputEvent::Click {
                frame_id: frame.frame_id,
                x: 3,
                y: 0,
            })
            .unwrap();
        assert_eq!(engine.active_card_id().as_deref(), Ok("next"));
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_long_row_aggregation_whole_table_fallback() {
        let balanced = "<tr><td>Wide</td><td>Base</td></tr>";
        let long = r##"<tr><td>A</td><td>$(word)</td><td><a href="#next">Z</a></td></tr>"##;
        let source = |mode, attrs, extra| {
            format!(
                r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="main"><p mode="{mode}">Before<table {attrs}>{balanced}{long}{extra}</table>After</p></card>
<card id="next"><p>Destination</p></card></wml>"#
            )
        };
        let supported = source("wrap", r#"columns="2""#, "");
        let mut grid = load_strict_deck(&supported);
        grid.set_viewport_cols(10).unwrap();
        assert!(grid.set_var("word".into(), "Four".into()));
        assert_eq!(
            draw(&grid)[6],
            serde_json::json!({"type": "link", "x": 9, "y": 3, "text": "Z", "href": "#next", "focused": true})
        );
        let mut alternate = load_strict_deck(&alternate_table_dtd(&supported));
        alternate.set_viewport_cols(10).unwrap();
        assert!(alternate.set_var("word".into(), "Four".into()));
        assert_ne!(draw(&grid), draw(&alternate));

        for (word, case) in [
            ("Seven", "combined width after substitution"),
            ("LongerThanViewport", "wrapped expansion"),
            ("", "empty expansion"),
            ("\u{00ad}", "invisible expansion"),
        ] {
            assert_table_legacy(&supported, word, case);
        }
        for (case, mode, attrs, extra) in [
            ("alignment", "wrap", r#"columns="2" align="LR""#, ""),
            (
                "oversized positive declaration",
                "wrap",
                r#"columns="4294967295""#,
                "",
            ),
            ("nowrap", "nowrap", r#"columns="2""#, ""),
            (
                "entirely empty row",
                "wrap",
                r#"columns="2""#,
                "<tr><td/><td/></tr>",
            ),
            (
                "unsupported aggregate fragment",
                "wrap",
                r#"columns="2""#,
                "<tr><td>A</td><td>B</td><td>C<br/>D</td></tr>",
            ),
            (
                "authored empty in long row",
                "wrap",
                r#"columns="2""#,
                "<tr><td>A</td><td>B</td><td/></tr>",
            ),
        ] {
            assert_table_legacy(&source(mode, attrs, extra), "Four", case);
        }
    }

    fn assert_table_hit_regions(
        frame: &crate::render::frame::EnginePresentationFrame,
        expected: &[(u32, u32, u32, u32, &str)],
    ) {
        assert_eq!(
            frame
                .hit_regions
                .iter()
                .map(|hit| (hit.x, hit.y, hit.width, hit.height, hit.action_id.as_str()))
                .collect::<Vec<_>>(),
            expected
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_short_row_padding() {
        // WAP-191_104-WML §11.8.5: missing cells act like appended empty td elements.
        let source = include_str!("../../../examples/source/wml-201-table-short-row-padding.wml");
        let mut engine = load_strict_deck(source);
        let mut explicit =
            load_strict_deck(&source.replacen("</td></tr>", "</td><td/><td/></tr>", 1));
        let expected = serde_json::json!([
            {"type": "text", "x": 0, "y": 0, "text": "Before"},
            {"type": "link", "x": 0, "y": 2, "text": "Short", "href": "#main", "focused": true},
            {"type": "text", "x": 0, "y": 3, "text": "Wide"},
            {"type": "text", "x": 5, "y": 3, "text": "Mid"},
            {"type": "link", "x": 8, "y": 3, "text": "Open", "href": "#next", "focused": false},
            {"type": "text", "x": 0, "y": 5, "text": "After"}
        ]);
        assert_eq!(draw(&engine), expected);
        assert_eq!(draw(&explicit), expected);
        let alternate = load_strict_deck(&alternate_table_dtd(source));
        assert_eq!(draw(&alternate)[2]["text"], "WideMid");
        assert_eq!(draw(&alternate)[3]["y"], 4);

        for (deck, authored_cells) in [(&engine, 1), (&explicit, 3)] {
            let card = deck.runtime_card_for_layout().unwrap();
            let [Node::Paragraph { inline, .. }] = card.nodes.as_slice() else {
                panic!("expected one paragraph");
            };
            let table = inline
                .iter()
                .find_map(|entry| match entry {
                    InlineNode::Table(table) => Some(table),
                    _ => None,
                })
                .expect("the table must use the bounded grid");
            assert_eq!(table.columns, 3, "logical slots in each row");
            assert_eq!(table.rows[0].len(), authored_cells);
            assert!(table.rows[0][1..].iter().all(Option::is_none));
            assert_eq!(table.rows[1].len(), 3);
            assert_eq!(table.column_starts, [0, 5, 8]);
        }

        let frame = engine.render_output().unwrap().presentation;
        let explicit_frame = explicit.render_output().unwrap().presentation;
        assert_eq!(frame.rows, explicit_frame.rows);
        assert_eq!(frame.hit_regions, explicit_frame.hit_regions);
        assert_table_hit_regions(&frame, &[(0, 2, 5, 1, "focus:0"), (8, 3, 4, 1, "focus:1")]);
        explicit.handle_key("down".into()).unwrap();
        assert_eq!(explicit.focused_link_index(), 1);
        assert_eq!(draw(&explicit)[4]["focused"], true);
        explicit.handle_key("down".into()).unwrap();
        assert_eq!(explicit.focused_link_index(), 0);
        explicit.handle_key("down".into()).unwrap();
        explicit.handle_key("enter".into()).unwrap();
        assert_eq!(explicit.active_card_id().as_deref(), Ok("next"));
        engine
            .handle_input(EngineInputEvent::Click {
                frame_id: frame.frame_id,
                x: 8,
                y: 3,
            })
            .unwrap();
        assert_eq!(engine.active_card_id().as_deref(), Ok("next"));
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_short_row_padding_only_short_rows_and_limits() {
        let mut engine = strict_paragraph(concat!(
            r#"<table columns="3"><tr><td>$(word)</td></tr>"#,
            r##"<tr><td>X</td><td><a href="#$(target)">Open</a></td></tr></table>"##,
        ));
        assert!(engine.set_var("target".into(), "next".into()));
        let expected = serde_json::json!([
            {"type": "text", "x": 0, "y": 0, "text": "Fox"},
            {"type": "text", "x": 0, "y": 1, "text": "X"},
            {"type": "link", "x": 3, "y": 1, "text": "Open", "href": "#next", "focused": true}
        ]);
        assert_eq!(draw(&engine), expected);
        assert_table_limits(&engine, 2, 3, "FoxXOpen#next".len());
        assert_eq!(draw(&engine), expected);
        engine.handle_key("enter".into()).unwrap();
        assert_eq!(engine.active_card_id().as_deref(), Ok("next"));
    }

    fn assert_table_limits(engine: &WmlEngine, rows: usize, outputs: usize, payload_bytes: usize) {
        let output = engine.render_output().unwrap();
        assert_eq!(output.presentation.viewport.content_rows as usize, rows);
        let limits = EngineRenderLimits {
            rows,
            segments: outputs,
            draw_commands: outputs,
            serialized_bytes: serde_json::to_vec(&output).unwrap().len(),
        };
        let fit = engine.render_output_with_limits(limits).unwrap();
        assert_eq!(
            serde_json::to_value(fit).unwrap(),
            serde_json::to_value(output).unwrap()
        );
        let card = engine.runtime_card_for_layout().unwrap();
        let payload_limits = EngineRenderLimits {
            serialized_bytes: payload_bytes,
            ..limits
        };
        assert!(layout_card_with_limits(&card, 20, 0, payload_limits).is_ok());
        assert!(matches!(
            layout_card_with_limits(&card, 20, 0, EngineRenderLimits {
                serialized_bytes: payload_bytes - 1,
                ..payload_limits
            }),
            Err(EngineRenderError::ResourceLimit {
                resource: EngineRenderResource::SerializedBytes,
                limit,
                observed,
                ..
            }) if limit == payload_bytes - 1 && observed == payload_bytes
        ));
        for (below, resource, fitting) in [
            (
                EngineRenderLimits {
                    rows: rows - 1,
                    ..limits
                },
                EngineRenderResource::LayoutRows,
                limits.rows,
            ),
            (
                EngineRenderLimits {
                    segments: outputs - 1,
                    ..limits
                },
                EngineRenderResource::LayoutSegments,
                limits.segments,
            ),
            (
                EngineRenderLimits {
                    draw_commands: outputs - 1,
                    ..limits
                },
                EngineRenderResource::DrawCommands,
                limits.draw_commands,
            ),
            (
                EngineRenderLimits {
                    serialized_bytes: limits.serialized_bytes - 1,
                    ..limits
                },
                EngineRenderResource::SerializedBytes,
                limits.serialized_bytes,
            ),
        ] {
            assert!(
                matches!(
                    engine.render_output_with_limits(below),
                    Err(EngineRenderError::ResourceLimit { resource: actual, limit, observed, .. })
                        if actual == resource && limit == fitting - 1 && observed == fitting
                ),
                "{resource:?}"
            );
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_short_row_padding_balanced_control_and_fallback() {
        let short = "<tr><td>$(word)</td></tr>";
        let full = r##"<tr><td>A</td><td>B</td><td><a href="#$(target)">Open</a></td></tr>"##;
        let balanced = strict_paragraph(&format!(r#"<table columns="3">{full}{full}</table>"#));
        assert_eq!(balanced.render().unwrap().draw.len(), 6);
        for (case, mode, attrs, rows) in [
            (
                "columns wider than viewport",
                "wrap",
                r#"columns="4294967295""#,
                "",
            ),
            (
                "columns outside the viewport range",
                "wrap",
                r#"columns="4294967296""#,
                "",
            ),
            (
                "columns outside machine integers",
                "wrap",
                r#"columns="1234567890123456789012345678901234567890""#,
                "",
            ),
            (
                "entirely empty row",
                "wrap",
                r#"columns="3""#,
                "<tr><td/><td/></tr>",
            ),
            (
                "interior empty cell",
                "wrap",
                r#"columns="3""#,
                "<tr><td>A</td><td/><td>C</td></tr>",
            ),
            (
                "unsupported content",
                "wrap",
                r#"columns="3""#,
                "<tr><td>A<br/>B</td></tr>",
            ),
            ("alignment", "wrap", r#"columns="3" align="L""#, ""),
            ("nowrap", "nowrap", r#"columns="3""#, ""),
        ] {
            let body = format!("<p>Before</p><p mode=\"{mode}\"><table {attrs}>{short}{full}{rows}</table></p><p>After</p>");
            let source = format!(
                r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="main">{body}</card><card id="next"><p>Destination</p></card></wml>"#
            );
            assert_table_legacy(&source, "Fox", case);
        }
        // A variable may make a previously eligible grid too wide.
        assert_table_legacy(
            &include_str!("../../../examples/source/wml-201-table-short-row-padding.wml")
                .replace(">Short<", ">$(word)<"),
            "123456789",
            "overwide expanded content",
        );
    }

    fn assert_table_legacy(source: &str, word: &str, case: &str) {
        let mut strict = load_strict_deck(source);
        let mut alternate = load_strict_deck(&alternate_table_dtd(source));
        let renders = [&mut strict, &mut alternate].map(|engine| {
            engine.set_viewport_cols(10).unwrap();
            assert!(engine.set_var("word".into(), word.into()));
            assert!(engine.set_var("target".into(), "next".into()));
            engine.render_output().unwrap()
        });
        assert_eq!(
            serde_json::to_value(&renders[0].render).unwrap(),
            serde_json::to_value(&renders[1].render).unwrap(),
            "{case}"
        );
        assert_eq!(
            renders[0].presentation.rows, renders[1].presentation.rows,
            "{case}"
        );
        assert_eq!(
            renders[0].presentation.hit_regions, renders[1].presentation.hit_regions,
            "{case}"
        );
    }

    fn alternate_table_dtd(source: &str) -> String {
        source.replace(
            r#"PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd""#,
            r#"SYSTEM "http://example.test/alternate.dtd""#,
        )
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_exact_columns() {
        // WAP-191_104-WML §11.8.5: each authored cell in these balanced rows
        // occupies its own declared column, with shared starts across rows.
        let mut engine = load_strict_deck(include_str!(
            "../../../examples/source/wml-201-table-exact-columns.wml"
        ));
        let expected = serde_json::json!([
            {"type": "link", "x": 0, "y": 0, "text": "Before", "href": "#main", "focused": true},
            {"type": "text", "x": 0, "y": 2, "text": "Single"},
            {"type": "text", "x": 0, "y": 4, "text": "Between"},
            {"type": "text", "x": 0, "y": 6, "text": "A"},
            {"type": "link", "x": 4, "y": 6, "text": "Open", "href": "#next", "focused": false},
            {"type": "text", "x": 0, "y": 7, "text": "Long"},
            {"type": "text", "x": 4, "y": 7, "text": "Z"},
            {"type": "link", "x": 0, "y": 9, "text": "After", "href": "#main", "focused": false}
        ]);
        assert_eq!(draw(&engine), expected);
        let frame = engine.render_output().unwrap().presentation;
        assert_table_hit_regions(
            &frame,
            &[
                (0, 0, 6, 1, "focus:0"),
                (4, 6, 4, 1, "focus:1"),
                (0, 9, 5, 1, "focus:2"),
            ],
        );
        assert!(matches!(
            engine.render_output_with_limits(EngineRenderLimits {
                draw_commands: 4,
                ..EngineRenderLimits::default()
            }),
            Err(EngineRenderError::ResourceLimit {
                resource: EngineRenderResource::DrawCommands,
                limit: 4,
                observed: 5,
                ..
            })
        ));
        assert_eq!(draw(&engine), expected);
        engine.handle_key("down".into()).unwrap();
        assert_eq!(engine.focused_link_index(), 1);
        assert_eq!(draw(&engine)[4]["focused"], true);
        engine.handle_key("up".into()).unwrap();
        assert_eq!(engine.focused_link_index(), 0);
        engine
            .handle_input(EngineInputEvent::Click {
                frame_id: frame.frame_id,
                x: 4,
                y: 6,
            })
            .unwrap();
        assert_eq!(engine.active_card_id().as_deref(), Ok("next"));
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_exact_columns_whole_table_fallback() {
        for (fixture, mode, columns, rows) in [
            (
                "overwide combined columns",
                "wrap",
                "2",
                "<tr><td>123456</td><td>B</td></tr><tr><td>C</td><td>123456</td></tr>",
            ),
            (
                "declaration outside machine integer sizes",
                "wrap",
                "1234567890123456789012345678901234567890",
                "<tr><td>A</td><td>B</td></tr>",
            ),
            (
                "in-cell break",
                "wrap",
                "2",
                r##"<tr><td>A</td><td>B</td></tr><tr><td>C<br/>D</td><td><a href="#next">Open</a></td></tr>"##,
            ),
            (
                "nowrap paragraph",
                "nowrap",
                "2",
                "<tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr>",
            ),
        ] {
            let source = format!(
                r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="main"><p mode="{mode}">Before<table columns="{columns}">{rows}</table>After</p></card>
<card id="next"><p>Destination</p></card></wml>"#
            );
            let mut strict = load_strict_deck(&source);
            strict.set_viewport_cols(10).unwrap();
            let mut alternate = load_strict_deck(&alternate_table_dtd(&source));
            alternate.set_viewport_cols(10).unwrap();
            assert_eq!(draw(&strict), draw(&alternate), "{fixture}");
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_exact_columns_resolves_cell_text_and_link_before_layout() {
        let mut engine = strict_paragraph(
            r#"<table columns="02"><tr><td>$(word)</td><td><a href="$(dest)">$(label)</a></td></tr></table>"#,
        );
        assert!(engine.set_var("dest".into(), "#next".into()));
        assert!(engine.set_var("label".into(), "Open".into()));
        assert_eq!(
            draw(&engine),
            serde_json::json!([
                {"type": "text", "x": 0, "y": 0, "text": "Fox"},
                {"type": "link", "x": 3, "y": 0, "text": "Open", "href": "%23next", "focused": true}
            ])
        );
        assert!(engine.set_var("word".into(), "12345678901234567890".into()));
        assert_eq!(draw(&engine)[1]["y"], 1);
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_exact_columns_skips_unused_legacy_substitution() {
        let rows = "<tr><td>$(word)</td><td>Z</td></tr>".repeat(1_800);
        let mut engine = strict_paragraph(&format!(r#"<table columns="2">{rows}</table>"#));
        engine.set_viewport_cols(42).unwrap();
        let word = "x".repeat(40);
        assert!(engine.set_var("word".into(), word.clone()));

        let render = engine.render().unwrap();
        assert_eq!(render.draw.len(), 3_600);
        for (row, pair) in render.draw.as_chunks::<2>().0.iter().enumerate() {
            assert!(matches!(
                pair,
                [DrawCmd::Text { x: 0, y, text }, DrawCmd::Text { x: 40, y: right_y, text: right }]
                    if *y == row as u32 && y == right_y && text == &word && right == "Z"
            ));
        }
        assert!(matches!(
            engine.render_output_with_limits(EngineRenderLimits {
                rows: 1_799,
                ..EngineRenderLimits::default()
            }),
            Err(EngineRenderError::ResourceLimit {
                resource: EngineRenderResource::LayoutRows,
                limit: 1_799,
                observed: 1_800,
                ..
            })
        ));
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_table_exact_columns_overwide_expansion_uses_legacy() {
        let rows = "<tr><td>$x</td><td>z</td></tr>".repeat(512);
        let mut engine = strict_paragraph(&format!(r#"<table columns="2">{rows}</table>"#));
        assert!(engine.set_var("x".into(), "x".repeat(64 * 1024)));
        // The legacy projection joins the source text before substituting.
        // Its references to the undefined variable xz produce no draws.
        assert!(engine.render().unwrap().draw.is_empty());
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout() {
        // WAP-191_104-WML §11.8.3: an unspecified mode inherits within the card.
        let mut engine =
            strict_card_body(r#"<p mode="nowrap">Alpha Beta Gamma</p><p>Delta Epsilon</p>"#);
        engine.set_viewport_cols(8).expect("valid viewport");
        assert_paragraph_text_rows(&engine, &[(0, "Alpha Beta Gamma"), (1, "Delta Epsilon")]);

        engine
            .navigate_to_card("next".into())
            .expect("navigate to next card");
        assert_paragraph_text_rows(&engine, &[(0, "Destinat"), (1, "ion")]);
    }

    fn assert_paragraph_text_rows(engine: &WmlEngine, expected: &[(u32, &str)]) {
        let render = engine.render().expect("paragraph fixture must render");
        assert_paragraph_draw_rows(&render.draw, expected);
    }

    fn assert_paragraph_draw_rows(draw: &[DrawCmd], expected: &[(u32, &str)]) {
        assert!(
            draw.len() == expected.len()
                && draw.iter().zip(expected).all(|(cmd, &(row, line))| {
                    matches!(cmd, DrawCmd::Text { x: 0, y, text } if *y == row && text == line)
                }),
            "paragraph fixture must paint the expected rows"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_ignores_insignificant_mode_changes() {
        let mut engine = strict_card_body(concat!(
            r#"<p mode="nowrap">Alpha Beta Gamma</p>"#,
            r#"<p mode="wrap">   </p><p mode="wrap">$(blank)</p><p mode="wrap">&shy;</p>"#,
            r#"<p>Delta Epsilon</p><p mode="wrap">Alpha Beta Gamma</p><p>Delta Epsilon</p>"#,
        ));
        engine.set_viewport_cols(8).expect("valid viewport");
        assert!(engine.set_var("blank".into(), " \t\n ".into()));
        assert_paragraph_text_rows(
            &engine,
            &[
                (0, "Alpha Beta Gamma"),
                (1, "Delta Epsilon"),
                (2, "Alpha"),
                (3, "Beta"),
                (4, "Gamma"),
                (5, "Delta"),
                (6, "Epsilon"),
            ],
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_preserves_inline_seams_and_breaks() {
        let mut engine = strict_card_body(concat!(
            r##"<p mode="nowrap">$(left)<a href="#next">$(middle)</a> &#9; $(missing)"##,
            r##"<a href="#main">Café&nbsp;D&shy;EF</a>$(right)<br/><br/>tail</p><p>after line</p>"##,
        ));
        engine.set_viewport_cols(8).expect("valid viewport");
        assert!(engine.set_var("left".into(), "  Alpha\t Beta".into()));
        assert!(engine.set_var("middle".into(), "G\u{ad}amma".into()));
        assert!(engine.set_var("right".into(), "\t seam \t".into()));
        assert!(
            draw(&engine)
                == serde_json::json!([
                    {"type": "text", "x": 0, "y": 0, "text": "Alpha Beta"},
                    {"type": "link", "x": 10, "y": 0, "text": "Gamma", "focused": true, "href": "#next"},
                    {"type": "text", "x": 15, "y": 0, "text": " "},
                    {"type": "link", "x": 16, "y": 0, "text": "Café\u{a0}DEF", "focused": false, "href": "#main"},
                    {"type": "text", "x": 24, "y": 0, "text": " seam"},
                    {"type": "text", "x": 0, "y": 2, "text": "tail"},
                    {"type": "text", "x": 0, "y": 3, "text": "after line"}
                ]),
            "nowrap must preserve inline seams, ownership, and explicit breaks"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_retains_offscreen_targets() {
        use crate::{EngineFocusTargetKind, EngineFrameSegment, EngineInputEvent};

        let mut engine = strict_card_body(concat!(
            r##"<p mode="nowrap"><a href="#main">Stay</a>abcdefghijklmno"##,
            r##"<anchor>Go<go href="#next"/></anchor><input name="pin" type="password" value="123"/>"##,
            r#"<select name="pick"><option>é</option></select></p>"#,
        ));
        engine.set_viewport_cols(8).expect("valid viewport");
        engine
            .handle_key("down".into())
            .expect("focus offscreen anchor");
        let output = engine.render_output().expect("focus fixture must render");
        let frame = output.presentation;
        assert!(
            matches!(
                output.render.draw.get(2),
                Some(DrawCmd::Link { x: 19, y: 0, text, focused: true, href })
                    if text == "Go" && href == "#next"
            ),
            "offscreen anchor must retain its draw coordinates and focus"
        );
        let [row] = frame.rows.as_slice() else {
            panic!("expected one presentation row");
        };
        assert_eq!(row.index, 0);
        assert!(
            matches!(
                row.segments.get(2),
                Some(EngineFrameSegment::Focusable { x: 19, text, focused: true, .. })
                    if text == "Go"
            ) && matches!(
                row.segments.get(3),
                Some(EngineFrameSegment::Focusable { x: 21, text, .. }) if text == "[pin: ***]"
            ) && matches!(
                row.segments.get(4),
                Some(EngineFrameSegment::Focusable { x: 31, text, .. }) if text == "[pick: é]"
            ),
            "offscreen presentation must keep anchor and form geometry and mask the password"
        );
        let hits = frame.hit_regions.iter().map(|hit| {
            (
                hit.x,
                hit.y,
                hit.width,
                hit.height,
                hit.action_id.as_str(),
                hit.target_kind,
            )
        });
        assert!(
            hits.eq([
                (0, 0, 4, 1, "focus:0", EngineFocusTargetKind::Link),
                (19, 0, 2, 1, "focus:1", EngineFocusTargetKind::Link),
                (21, 0, 10, 1, "focus:2", EngineFocusTargetKind::Input),
                (31, 0, 9, 1, "focus:3", EngineFocusTargetKind::Select),
            ]),
            "hit regions must match the logical coordinates and target order"
        );
        engine
            .handle_key("enter".into())
            .expect("activate focused anchor");
        assert!(
            engine.active_card_id().as_deref() == Ok("next"),
            "keyboard must open the destination card"
        );
        assert!(engine.navigate_back());
        let frame = engine.render_frame().expect("restored card must render");
        engine
            .handle_input(EngineInputEvent::Click {
                frame_id: frame.frame_id,
                x: 20,
                y: 0,
            })
            .expect("click at logical offscreen coordinates");
        assert!(
            engine.active_card_id().as_deref() == Ok("next"),
            "pointer must open the destination card"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_preserves_form_control_seams() {
        use crate::EngineFocusTargetKind::{Input, Link, Select};

        let mut engine = strict_card_body(concat!(
            r##"<p mode="nowrap">A <input name="n"/> <a href="#next">B</a>"##,
            r#" <select name="s"><option>é</option></select> C</p>"#,
            r#"<p mode="wrap">$(missing)</p>"#,
            r##"<p>D<input name="m"/><a href="#next">E</a>"##,
            r#"<select name="t"><option>é</option></select>F</p>"#,
            r##"<p>G<a href="#next">H </a><input name="q"/> <select name="u">"##,
            r##"<option>é</option></select><a href="#next"> I</a></p>"##,
        ));
        engine.set_viewport_cols(8).expect("valid viewport");
        let output = engine
            .render_output()
            .expect("form seams fixture must render");
        let paint = output.render.draw.iter().map(|command| match command {
            DrawCmd::Text { x, y, text } | DrawCmd::Link { x, y, text, .. } => {
                (*x, *y, text.as_str())
            }
        });
        assert!(
            paint.eq([
                (0, 0, "A"),
                (1, 0, " "),
                (2, 0, "[n: ]"),
                (7, 0, " "),
                (8, 0, "B"),
                (9, 0, " "),
                (10, 0, "[s: é]"),
                (16, 0, " C"),
                (0, 1, "D"),
                (1, 1, "[m: ]"),
                (6, 1, "E"),
                (7, 1, "[t: é]"),
                (13, 1, "F"),
                (0, 2, "G"),
                (1, 2, "H"),
                (2, 2, " "),
                (3, 2, "[q: ]"),
                (8, 2, " "),
                (9, 2, "[u: é]"),
                (15, 2, " "),
                (16, 2, "I"),
            ]),
            "form seams must paint authored spaces and preserve adjoining fragments"
        );
        let hits = output
            .presentation
            .hit_regions
            .iter()
            .map(|hit| (hit.x, hit.y, hit.width, hit.target_kind));
        assert!(
            hits.eq([
                (2, 0, 5, Input),
                (8, 0, 1, Link),
                (10, 0, 6, Select),
                (1, 1, 5, Input),
                (6, 1, 1, Link),
                (7, 1, 6, Select),
                (1, 2, 1, Link),
                (3, 2, 5, Input),
                (9, 2, 6, Select),
                (16, 2, 1, Link),
            ]),
            "form seams must keep spaces outside link and control hit regions"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_reports_terminal_logical_rows() {
        use crate::render::frame::ENGINE_VIEWPORT_ROWS;
        use crate::EngineInputEvent;

        type TerminalBreakCase = (&'static str, &'static [(u32, &'static str)], u32, usize);
        let cases: &[TerminalBreakCase] = &[
            (
                r#"<p mode="wrap"><br/></p><p mode="nowrap">B</p>"#,
                &[(2, "B")],
                3,
                3,
            ),
            (
                r#"<p mode="wrap">A<br/></p><pre>$(missing)</pre><p mode="nowrap">B</p>"#,
                &[(0, "A"), (2, "B")],
                3,
                3,
            ),
            (
                r#"<p mode="wrap"><br/><br/></p><pre>$(missing)</pre><p mode="nowrap">B</p>"#,
                &[(3, "B")],
                4,
                4,
            ),
            (r#"<p mode="wrap"><br/></p><p>B</p>"#, &[(1, "B")], 2, 2),
            (
                r#"<p mode="nowrap">A<br/></p><p><br/>B</p>"#,
                &[(0, "A"), (3, "B")],
                4,
                4,
            ),
            (
                r#"<p mode="nowrap"><br/><br/></p><p>B</p>"#,
                &[(3, "B")],
                4,
                4,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><p mode="wrap"><br/>B</p>"#,
                &[(0, "A"), (3, "B")],
                4,
                4,
            ),
            (
                r#"<p mode="nowrap">A</p><p mode="wrap"><br/></p>"#,
                &[(0, "A")],
                2,
                2,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><p mode="wrap"><br/></p>"#,
                &[(0, "A")],
                3,
                3,
            ),
            (
                r#"<p mode="nowrap">A</p><p mode="wrap">B<br/><br/></p>"#,
                &[(0, "A"), (1, "B")],
                4,
                4,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><p mode="wrap"><br/></p><p>B</p>"#,
                &[(0, "A"), (3, "B")],
                4,
                4,
            ),
            (
                r#"<p mode="wrap">A<br/></p><p mode="wrap"><br/></p>"#,
                &[(0, "A")],
                1,
                3,
            ),
            (r#"<p mode="nowrap"><br/><br/></p>"#, &[], 3, 3),
            (r#"<p mode="nowrap">A<br/><br/></p>"#, &[(0, "A")], 3, 3),
            (
                r#"<p mode="nowrap">A<br/></p><p><br/></p>"#,
                &[(0, "A")],
                4,
                4,
            ),
            (
                r#"<p mode="nowrap">A<br/>B</p>"#,
                &[(0, "A"), (1, "B")],
                2,
                2,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><p>B</p>"#,
                &[(0, "A"), (2, "B")],
                3,
                3,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><p> </p><p mode="wrap">B</p>"#,
                &[(0, "A"), (2, "B")],
                3,
                3,
            ),
            (
                r##"<p mode="nowrap">A<br/></p><p mode="wrap"><a href="#next">&shy;</a></p><pre>B</pre>"##,
                &[(0, "A"), (2, "B")],
                3,
                3,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><pre>$(missing)</pre><p>B</p>"#,
                &[(0, "A"), (2, "B")],
                3,
                3,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><pre>$(blank)</pre>"#,
                &[(0, "A")],
                2,
                2,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><pre>$(missing)</pre>"#,
                &[(0, "A")],
                2,
                2,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><pre>&shy;</pre>"#,
                &[(0, "A")],
                2,
                2,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><pre>Paint</pre><p>B</p>"#,
                &[(0, "A"), (1, "Paint"), (2, "B")],
                3,
                3,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><pre><br/></pre><p>B</p>"#,
                &[(0, "A"), (2, "B")],
                3,
                3,
            ),
            (
                r#"<p mode="nowrap">A<br/></p><pre><br/></pre>"#,
                &[(0, "A")],
                2,
                2,
            ),
            (
                r#"<p mode="nowrap">A</p><p mode="wrap">B</p><pre/>"#,
                &[(0, "A"), (1, "B")],
                2,
                2,
            ),
            (
                r#"<p mode="nowrap">A</p><p mode="wrap">B</p><pre><br/></pre>"#,
                &[(0, "A"), (1, "B")],
                3,
                3,
            ),
            (
                r#"<p mode="nowrap">A</p><p mode="wrap">B</p><pre><br/></pre><p>C</p>"#,
                &[(0, "A"), (1, "B"), (3, "C")],
                4,
                4,
            ),
            (
                r#"<p mode="wrap">A</p><p>B</p><pre><br/></pre>"#,
                &[(0, "A"), (1, "B")],
                2,
                3,
            ),
            (
                r##"<p mode="nowrap">A</p><p mode="wrap"><a href="#next">&shy;</a></p>"##,
                &[(0, "A")],
                2,
                2,
            ),
            (
                r##"<p mode="wrap">A</p><p><a href="#next">&shy;</a></p>"##,
                &[(0, "A")],
                1,
                1,
            ),
            (
                r##"<p mode="nowrap">A</p><p mode="wrap"><br/><a href="#next">&shy;</a></p><p>B</p>"##,
                &[(0, "A"), (3, "B")],
                4,
                4,
            ),
            (
                r##"<p mode="nowrap">A</p><p mode="wrap"><br/><a href="#next">&shy;</a></p>"##,
                &[(0, "A")],
                3,
                3,
            ),
            (
                r##"<p mode="nowrap">A</p><p mode="wrap">B<br/><a href="#next">&shy;</a></p><p>C</p>"##,
                &[(0, "A"), (1, "B"), (4, "C")],
                5,
                5,
            ),
            (
                r##"<p mode="wrap">A</p><p><br/><a href="#next">&shy;</a></p><p>B</p>"##,
                &[(0, "A"), (2, "B")],
                3,
                3,
            ),
            (
                r##"<p mode="wrap">A</p><p><br/><a href="#next">&shy;</a></p>"##,
                &[(0, "A")],
                1,
                2,
            ),
            (r#"<p mode="wrap">A<br/><br/></p>"#, &[(0, "A")], 1, 3),
        ];
        for &(body, painted_rows, content_rows, rows) in cases {
            let mut engine = strict_card_body(body);
            assert!(engine.set_var("blank".into(), " \t ".into()));
            let limits = EngineRenderLimits {
                rows,
                ..EngineRenderLimits::default()
            };
            let output = engine
                .render_output_with_limits(limits)
                .unwrap_or_else(|err| panic!("{body} must fit the row budget: {err:?}"));
            let frame = output.presentation;
            assert_paragraph_draw_rows(&output.render.draw, painted_rows);
            assert!(
                frame
                    .rows
                    .iter()
                    .map(|row| row.index)
                    .eq(painted_rows.iter().map(|&(row, _)| row)),
                "the frame must preserve the painted logical row indices"
            );
            assert_eq!(frame.viewport.content_rows, content_rows, "{body}");
            assert!(
                matches!(
                    engine.render_output_with_limits(EngineRenderLimits {
                        rows: rows - 1,
                        ..limits
                    }),
                    Err(EngineRenderError::ResourceLimit {
                        resource: EngineRenderResource::LayoutRows,
                        limit,
                        observed,
                        ..
                    }) if limit == rows - 1 && observed == rows
                ),
                "paragraph breaks and boundaries must report the typed row limit"
            );
        }

        let breaks = "<br/>".repeat(ENGINE_VIEWPORT_ROWS as usize + 1);
        let mut engine = strict_card_body(&format!(r#"<p mode="nowrap">{breaks}</p>"#));
        let frame = engine
            .render_frame()
            .expect("blank scroll fixture must render");
        assert_eq!(frame.viewport.content_rows, ENGINE_VIEWPORT_ROWS + 2);
        engine
            .handle_input(EngineInputEvent::Scroll {
                frame_id: frame.frame_id,
                delta_rows: 2,
            })
            .expect("scroll must reach the final blank row");
        let frame = engine
            .render_frame()
            .expect("scrolled blank fixture must render");
        assert_eq!(frame.viewport.offset_row, 2);
        assert!(
            frame.rows.is_empty(),
            "blank logical rows must not add paint"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_scrolls_to_terminal_unpainted_wrap_rows() {
        use crate::render::frame::ENGINE_VIEWPORT_ROWS;
        use crate::EngineInputEvent;

        let prefix = r#"<p mode="nowrap">A</p>"#.repeat(ENGINE_VIEWPORT_ROWS as usize);
        for (suffix, extra_rows) in [
            ("<pre/>".to_owned(), 0),
            ("<pre><br/></pre>".to_owned(), 1),
            (r#"<p mode="wrap"><br/></p>"#.to_owned(), 1),
            (
                r##"<p mode="wrap"><a href="#next">&shy;</a></p>"##.repeat(2),
                2,
            ),
        ] {
            let mut engine = strict_card_body(&format!("{prefix}{suffix}"));
            let frame = engine.render_frame().expect("mixed card must render");
            assert_eq!(
                frame.viewport.content_rows,
                ENGINE_VIEWPORT_ROWS + extra_rows,
                "{suffix}"
            );
            engine
                .handle_input(EngineInputEvent::Scroll {
                    frame_id: frame.frame_id,
                    delta_rows: 3,
                })
                .expect("scroll must reach the terminal logical rows");
            let frame = engine
                .render_frame()
                .expect("scrolled mixed card must render");
            assert_eq!(frame.viewport.offset_row, extra_rows);
            assert_eq!(
                frame.rows.len(),
                (ENGINE_VIEWPORT_ROWS - extra_rows) as usize
            );
            assert!(frame.hit_regions.is_empty());
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_starts_after_unpainted_wrapped_paragraphs() {
        let wrap = r##"<p mode="wrap"><a href="#next">&shy;</a></p><p> </p>"##;
        for unpainted_rows in 1..=2 {
            let wrapped_prefix = wrap.repeat(unpainted_rows);
            let mixed = strict_card_body(&format!(r#"{wrapped_prefix}<p mode="nowrap">B</p>"#));
            let limits = EngineRenderLimits {
                rows: unpainted_rows + 1,
                segments: 1,
                draw_commands: 1,
                ..EngineRenderLimits::default()
            };
            let output = mixed
                .render_output_with_limits(limits)
                .expect("mixed paragraphs must fit the logical row budget");
            assert_paragraph_draw_rows(&output.render.draw, &[(unpainted_rows as u32, "B")]);
            assert_eq!(
                output.presentation.viewport.content_rows,
                limits.rows as u32
            );
            assert!(matches!(output.presentation.focus, Some(focus) if focus.index == 0));
            assert!(matches!(
                mixed.render_output_with_limits(EngineRenderLimits {
                    rows: unpainted_rows,
                    ..limits
                }),
                Err(EngineRenderError::ResourceLimit {
                    resource: EngineRenderResource::LayoutRows,
                    limit,
                    observed,
                    ..
                }) if limit == unpainted_rows && observed == limits.rows
            ));

            let wrapped = strict_card_body(&format!("{wrapped_prefix}<p>B</p>"));
            let output = wrapped
                .render_output_with_limits(EngineRenderLimits { rows: 1, ..limits })
                .expect("wrapped paragraphs must retain their existing row budget");
            assert_paragraph_draw_rows(&output.render.draw, &[(0, "B")]);
            assert_eq!(output.presentation.viewport.content_rows, 1);
        }

        let mixed = strict_card_body(&format!(r#"{wrap}<p>B</p><p mode="nowrap">C</p>"#));
        let output = mixed
            .render_output_with_limits(EngineRenderLimits {
                rows: 3,
                segments: 2,
                draw_commands: 2,
                ..EngineRenderLimits::default()
            })
            .expect("a wrapped paragraph must keep its row before nowrap begins");
        assert_paragraph_draw_rows(&output.render.draw, &[(1, "B"), (2, "C")]);
        assert_eq!(output.presentation.viewport.content_rows, 3);
        assert!(output.presentation.hit_regions.is_empty());
        assert!(matches!(output.presentation.focus, Some(focus) if focus.index == 0));
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_keeps_unpainted_row_before_next_wrap() {
        let suffix = r##"<p mode="wrap"><a href="#next">&shy;</a></p><p> </p><p>B</p>"##;
        for (mode, final_row) in [("wrap", 1), ("nowrap", 2)] {
            let engine = strict_card_body(&format!(r#"<p mode="{mode}">A</p>{suffix}"#));
            let output = engine
                .render_output_with_limits(EngineRenderLimits {
                    rows: final_row as usize + 1,
                    segments: 2,
                    draw_commands: 2,
                    ..EngineRenderLimits::default()
                })
                .expect("the paragraph boundary must fit the row budget");
            assert_paragraph_draw_rows(&output.render.draw, &[(0, "A"), (final_row, "B")]);
            assert_eq!(output.presentation.viewport.content_rows, final_row + 1);
            assert!(output.presentation.hit_regions.is_empty());
            assert!(matches!(output.presentation.focus, Some(focus) if focus.index == 0));
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_reserves_significant_unpainted_rows() {
        let mut engine = strict_card_body(concat!(
            r#"<p mode="nowrap">A<br/></p><p mode="wrap"> &shy; </p>"#,
            r##"<p><a href="#next">&shy;</a></p><p>Delta Epsilon</p>"##,
        ));
        engine.set_viewport_cols(8).expect("valid viewport");
        let limits = EngineRenderLimits {
            rows: 4,
            segments: 2,
            draw_commands: 2,
            ..EngineRenderLimits::default()
        };
        let output = engine
            .render_output_with_limits(limits)
            .expect("the invisible link must spend only a logical row");
        assert_paragraph_draw_rows(&output.render.draw, &[(0, "A"), (3, "Delta Epsilon")]);
        assert_eq!(output.presentation.viewport.content_rows, 4);
        assert!(output.presentation.hit_regions.is_empty());
        assert!(matches!(output.presentation.focus, Some(focus) if focus.index == 0));
        assert!(matches!(
            engine.render_output_with_limits(EngineRenderLimits { rows: 2, ..limits }),
            Err(EngineRenderError::ResourceLimit {
                resource: EngineRenderResource::LayoutRows,
                limit: 2,
                observed: 3,
                ..
            })
        ));
        engine
            .handle_key("enter".into())
            .expect("invisible link must activate");
        assert!(engine.active_card_id().as_deref() == Ok("next"));

        let terminal = strict_card_body(concat!(
            r##"<p mode="nowrap"><a href="#next">&shy;</a></p>"##,
            r#"<p mode="wrap"> &shy; </p>"#,
        ));
        let blank_limits = EngineRenderLimits {
            rows: 1,
            segments: 0,
            draw_commands: 0,
            ..limits
        };
        let output = terminal
            .render_output_with_limits(blank_limits)
            .expect("a terminal invisible link must fit with no paint slots");
        assert_eq!(output.presentation.viewport.content_rows, 1);
        assert!(output.render.draw.is_empty());
        assert!(output.presentation.rows.is_empty());
        assert!(matches!(
            terminal.render_output_with_limits(EngineRenderLimits {
                rows: 0,
                ..blank_limits
            }),
            Err(EngineRenderError::ResourceLimit {
                resource: EngineRenderResource::LayoutRows,
                limit: 0,
                observed: 1,
                ..
            })
        ));
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_keeps_invisible_link_focus_with_long_destination() {
        let mut engine = strict_card_body(
            r#"<p mode="nowrap"><a href="https://example.test/$(path)">&shy;</a></p>"#,
        );
        let path = "x".repeat(8192);
        let destination = format!("https://example.test/{path}");
        assert!(engine.set_var("path".into(), path));
        let limits = EngineRenderLimits {
            rows: 1,
            segments: 0,
            draw_commands: 0,
            serialized_bytes: 4096,
        };
        let output = engine
            .render_output_with_limits(limits)
            .expect("the invisible link must fit without drawing its destination");
        let frame = output.presentation;
        assert_eq!(frame.viewport.content_rows, 1);
        assert!(output.render.draw.is_empty());
        assert!(frame.rows.is_empty());
        assert!(frame.hit_regions.is_empty());
        assert!(matches!(
            frame.focus,
            Some(focus) if focus.index == 0 && focus.focus_id == "focus:0"
                && focus.target_kind == crate::EngineFocusTargetKind::Link
        ));
        assert!(matches!(
            engine.render_output_with_limits(EngineRenderLimits { rows: 0, ..limits }),
            Err(EngineRenderError::ResourceLimit {
                resource: EngineRenderResource::LayoutRows,
                limit: 0,
                observed: 1,
                ..
            })
        ));
        engine
            .handle_key("enter".into())
            .expect("keyboard must activate the invisible link");
        assert!(
            engine.external_navigation_intent().as_deref() == Some(destination.as_str()),
            "activation must use the complete expanded destination"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_counts_each_draw_destination() {
        let mut engine = strict_card_body(
            r#"<p mode="nowrap"><anchor>A<br/>B<go href="https://example.test/$(path)"/></anchor></p>"#,
        );
        let path = "x".repeat(2048);
        let destination = format!("https://example.test/{path}");
        assert!(engine.set_var("path".into(), path));
        let limits = EngineRenderLimits {
            rows: 2,
            segments: 2,
            draw_commands: 2,
            ..EngineRenderLimits::default()
        };
        let output = engine
            .render_output_with_limits(limits)
            .expect("both copies of the destination must fit");
        assert!(matches!(
            output.render.draw.as_slice(),
            [DrawCmd::Link { y: 0, href: first, text: a, .. },
             DrawCmd::Link { y: 1, href: second, text: b, .. }]
                if first == &destination && second == &destination && a == "A" && b == "B"
        ));
        let serialized_bytes = destination.len() + 2;
        assert!(matches!(
            engine.render_output_with_limits(EngineRenderLimits { serialized_bytes, ..limits }),
            Err(EngineRenderError::ResourceLimit {
                resource: EngineRenderResource::SerializedBytes,
                limit,
                observed,
                ..
            }) if limit == serialized_bytes && observed == 2 * destination.len() + 2
        ));
        assert!(matches!(
            engine.render_output_with_limits(EngineRenderLimits {
                serialized_bytes,
                draw_commands: 1,
                ..limits
            }),
            Err(EngineRenderError::ResourceLimit {
                resource: EngineRenderResource::DrawCommands,
                limit: 1,
                observed: 2,
                ..
            })
        ));
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_bounds_cumulative_painted_bytes() {
        let engine = strict_card_body(concat!(
            r#"<p mode="nowrap">  éé&shy;  </p>"#,
            r##"<p>ééé  <a href="#next">界界界</a></p>"##,
        ));
        let limits = EngineRenderLimits {
            rows: 2,
            segments: 4,
            draw_commands: 4,
            serialized_bytes: 10,
        };
        let output = engine
            .render_output_with_limits(EngineRenderLimits {
                serialized_bytes: usize::MAX,
                ..limits
            })
            .expect("the painted text must fit the structural budgets");
        assert_eq!(output.render.draw.len(), 4);
        assert!(
            matches!(
                engine.render_output_with_limits(limits),
                Err(EngineRenderError::ResourceLimit {
                    resource: EngineRenderResource::SerializedBytes,
                    limit: 10,
                    observed: 14,
                    ..
                })
            ),
            "layout must reject the first separator and character that exceed the painted UTF-8 budget"
        );
        assert!(
            matches!(
                engine.render_output_with_limits(EngineRenderLimits {
                    serialized_bytes: 25,
                    ..limits
                }),
                Err(EngineRenderError::ResourceLimit {
                    resource: EngineRenderResource::SerializedBytes,
                    limit: 25,
                    observed: 26,
                    ..
                })
            ),
            "exact serialization must also enforce its budget when the draw payload fits"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_streams_multiselect_labels() {
        let mut engine = strict_card_body(concat!(
            r#"<p mode="nowrap">Pick <select name="choices" title="$(heading)" multiple="true" value="first;second">"#,
            r#"<option value="first">$(first)</option><option value="second">$(second)</option>"#,
            r#"</select> done</p>"#,
        ));
        engine.set_viewport_cols(8).expect("valid viewport");
        let first = "é".repeat(2048);
        let second = "界".repeat(2048);
        assert!(engine.set_var("heading".into(), "  Pick   two  ".into()));
        assert!(engine.set_var("first".into(), format!("  {first}  ")));
        assert!(engine.set_var("second".into(), format!("  {second}  ")));
        let limits = EngineRenderLimits {
            rows: 2,
            segments: 8,
            draw_commands: 8,
            serialized_bytes: 24,
        };
        let Err(EngineRenderError::ResourceLimit {
            resource,
            limit,
            observed,
            ..
        }) = engine.render_output_with_limits(limits)
        else {
            panic!("the multiselect must exceed the byte budget");
        };
        assert_eq!(resource, EngineRenderResource::SerializedBytes);
        assert_eq!(limit, 24);
        // "Pick [ Pick two : " costs 18 bytes before the first two-byte glyph.
        assert_eq!(
            observed, 26,
            "the multiselect must stop at the first normalized byte-budget overflow"
        );

        let output = engine
            .render_output()
            .expect("the multiselect must fit the default byte budget");
        let expected = format!("[ Pick two : {first} ; {second} ]");
        let width = expected.chars().count() as u32;
        assert!(
            matches!(
                output.render.draw.as_slice(),
                [
                    DrawCmd::Text { x: 0, y: 0, text: prefix },
                    DrawCmd::Text { x: 4, y: 0, text: space },
                    DrawCmd::Link { x: 5, y: 0, text, .. },
                    DrawCmd::Text { x, y: 0, text: suffix },
                ] if prefix == "Pick" && space == " " && text == &expected
                    && *x == 5 + width && suffix == " done"
            ),
            "the multiselect must paint its normalized title and selected labels in one segment"
        );
        assert!(
            matches!(
                output.presentation.hit_regions.as_slice(),
                [hit] if (hit.x, hit.y, hit.width, hit.target_kind)
                    == (5, 0, width, crate::EngineFocusTargetKind::Select)
            ),
            "the full multiselect display must have one logical hit region"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_streams_password_drafts() {
        use crate::{EngineFocusTargetKind, EngineFrameSegment, EngineSelectionState};

        let mut engine = strict_card_body(
            r#"<p mode="nowrap">abcdefgh<input name="pin" type="password" value="7"/></p>"#,
        );
        engine.set_viewport_cols(8).expect("valid viewport");
        assert!(engine
            .begin_focused_input_edit()
            .expect("input edit must begin"));
        let draft = "界".repeat(4096);
        assert!(engine.set_focused_input_edit_draft(draft));
        let limits = EngineRenderLimits {
            rows: 1,
            segments: 2,
            draw_commands: 2,
            serialized_bytes: 16,
        };
        assert!(
            matches!(
                engine.render_output_with_limits(limits),
                Err(EngineRenderError::ResourceLimit {
                    resource: EngineRenderResource::SerializedBytes,
                    limit: 16,
                    observed: 17,
                    ..
                })
            ),
            "the active password draft must stop at the first painted-byte overflow"
        );

        let output = engine
            .render_output_with_limits(EngineRenderLimits {
                serialized_bytes: EngineRenderLimits::default().serialized_bytes,
                ..limits
            })
            .expect("the full masked draft must fit one row and two draw slots");
        let expected = format!("[pin: {}]", "*".repeat(4096));
        let frame = output.presentation;
        assert_eq!(frame.viewport.content_rows, 1);
        assert!(matches!(
            frame.selection,
            EngineSelectionState::Input { editing: true, .. }
        ));
        assert!(
            matches!(
                output.render.draw.as_slice(),
                [DrawCmd::Text { x: 0, y: 0, text: prefix }, DrawCmd::Link { x: 8, y: 0, text, .. }]
                    if prefix == "abcdefgh" && text == &expected
            ),
            "the draw list must keep the offscreen password masked on one row"
        );
        assert!(
            matches!(
                frame.rows.as_slice(),
                [row] if row.index == 0 && matches!(
                    row.segments.as_slice(),
                    [EngineFrameSegment::Text { .. }, EngineFrameSegment::Focusable {
                        x: 8, text, target_kind: EngineFocusTargetKind::Input, focused: true, ..
                    }] if text == &expected
                )
            ),
            "the presentation must keep the focused password masked at the same position"
        );
        assert!(
            matches!(
                frame.hit_regions.as_slice(),
                [hit] if (hit.x, hit.y, hit.width, hit.target_kind)
                    == (8, 0, expected.len() as u32, EngineFocusTargetKind::Input)
            ),
            "the password hit region must span the full offscreen display"
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_preserves_password_mask_literals() {
        // The escaped literal is visible only when matched. The suffix exceeds the mask.
        let input = r#"<input name="pin" type="password" format="M\é1M"/>"#;
        let mut card_content = WmlEngine::new();
        card_content
            .load_deck(&format!(r#"<wml><card id="main">{input}</card></wml>"#))
            .expect("card-level input must load in compatibility mode");
        for mut engine in [
            strict_card_body(&format!(r#"<p mode="nowrap">{input}</p>"#)),
            strict_card_body(&format!(r#"<p mode="wrap">{input}</p>"#)),
            card_content,
        ] {
            assert!(engine
                .begin_focused_input_edit()
                .expect("input edit must begin"));
            for (draft, expected) in [("界éab", "[pin: *é**]"), ("界øab", "[pin: ****]")] {
                assert!(engine.set_focused_input_edit_draft(draft.into()));
                let output = engine.render().expect("literal mask must render");
                assert!(
                    matches!(output.draw.as_slice(), [DrawCmd::Link { text, .. }] if text == expected),
                    "password painting must preserve only matching mask literals"
                );
            }
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_preserves_password_mask_literal_geometry() {
        use crate::EngineFocusTargetKind::{Input, Link};

        for (format, drafts) in [
            (
                r"M\ \ M",
                [("a  b", "[pin: *  *]"), ("a xb", "[pin: * **]")],
            ),
            (
                r"N\&#x2003;\&#x2003;N",
                [
                    ("1\u{2003}\u{2003}2", "[pin: *\u{2003}\u{2003}*]"),
                    ("1\u{2003}x2", "[pin: *\u{2003}**]"),
                ],
            ),
            (
                r"M\&#173;M",
                [("a\u{ad}b", "[pin: *\u{ad}*]"), ("axb", "[pin: ***]")],
            ),
        ] {
            let mut engine = strict_card_body(&format!(
                r##"<p mode="nowrap">abcdefgh<input name="pin" type="password" format="{format}"/><a href="#next">Next</a></p>"##
            ));
            engine.set_viewport_cols(8).expect("valid viewport");
            assert!(engine
                .begin_focused_input_edit()
                .expect("input edit must begin"));
            for (draft, expected) in drafts {
                assert!(engine.set_focused_input_edit_draft(draft.into()));
                let output = engine
                    .render_output_with_limits(EngineRenderLimits::default())
                    .expect("the password mask must render");
                let width = expected.chars().count() as u32;
                assert!(
                    matches!(
                        output.render.draw.as_slice(),
                        [DrawCmd::Text { .. }, DrawCmd::Link { x: 8, y: 0, text, .. },
                            DrawCmd::Link { x, y: 0, text: next, .. }]
                            if text == expected && *x == 8 + width && next == "Next"
                    ),
                    "unexpected draw commands for {draft:?}: {:?}",
                    output.render.draw
                );
                assert!(matches!(
                    output.presentation.hit_regions.as_slice(),
                    [pin, next] if (pin.x, pin.y, pin.width, pin.target_kind) == (8, 0, width, Input)
                        && (next.x, next.y, next.width, next.target_kind) == (8 + width, 0, 4, Link)
                ));
            }
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_checks_structure_before_painted_bytes() {
        let after_break = strict_card_body(concat!(
            r#"<p mode="nowrap">A<br/></p><p>$(missing)&shy;</p>"#,
            r#"<p>ééé</p>"#,
        ));
        let control = strict_card_body(r#"<p mode="nowrap">A <input name="n" value="abc"/></p>"#);
        let limits = EngineRenderLimits {
            rows: 2,
            segments: 3,
            draw_commands: 3,
            serialized_bytes: 1,
        };
        for (engine, limited, expected) in [
            (&after_break, limits, EngineRenderResource::LayoutRows),
            (
                &control,
                EngineRenderLimits {
                    segments: 2,
                    ..limits
                },
                EngineRenderResource::LayoutSegments,
            ),
            (
                &control,
                EngineRenderLimits {
                    draw_commands: 2,
                    ..limits
                },
                EngineRenderResource::DrawCommands,
            ),
        ] {
            assert!(
                matches!(
                    engine.render_output_with_limits(limited),
                    Err(EngineRenderError::ResourceLimit {
                        resource,
                        limit: 2,
                        observed: 3,
                        ..
                    }) if resource == expected
                ),
                "nowrap must check the deferred row and both separator/control slots before bytes"
            );
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nowrap_layout_enforces_structural_budgets() {
        let mut engine = strict_card_body(
            r##"<p mode="nowrap">Alpha Beta Gamma<a href="#next">abcdefghijklmnop</a></p>"##,
        );
        engine.set_viewport_cols(1).expect("valid viewport");
        let limits = EngineRenderLimits {
            rows: 1,
            segments: 2,
            draw_commands: 2,
            serialized_bytes: usize::MAX,
        };
        let output = engine
            .render_output_with_limits(limits)
            .expect("one logical row must fit");
        assert_eq!(output.presentation.viewport.content_rows, 1);
        assert_eq!(output.render.draw.len(), 2);
        assert!(
            matches!(
                output.render.draw.get(1),
                Some(DrawCmd::Link { x: 16, y: 0, text, .. }) if text == "abcdefghijklmnop"
            ),
            "width must not split the offscreen link"
        );
        for (limited, expected, limit) in [
            (
                EngineRenderLimits { rows: 0, ..limits },
                EngineRenderResource::LayoutRows,
                0,
            ),
            (
                EngineRenderLimits {
                    segments: 1,
                    ..limits
                },
                EngineRenderResource::LayoutSegments,
                1,
            ),
            (
                EngineRenderLimits {
                    draw_commands: 1,
                    ..limits
                },
                EngineRenderResource::DrawCommands,
                1,
            ),
        ] {
            assert!(
                matches!(
                    engine.render_output_with_limits(limited),
                    Err(EngineRenderError::ResourceLimit { resource, limit: actual, observed, .. })
                        if resource == expected && actual == limit && observed == limit + 1
                ),
                "nowrap must report the expected typed structural limit"
            );
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_empty_ignored() {
        // WAP-191_104-WML §11.8.3 ignores insignificant paragraphs and
        // starts consecutive significant paragraphs on separate rows.
        let first = "<p>Before</p>";
        let next = r##"<p><a href="#next">Continue</a></p>"##;
        let baseline = strict_card_body(&format!("{first}{next}"));
        let baseline_render = baseline.render().expect("baseline must render");
        assert!(
            matches!(
                baseline_render.draw.as_slice(),
                [
                    DrawCmd::Text { x: 0, y: 0, text: before },
                    DrawCmd::Link { x: 0, y: 1, text: link, focused: true, href },
                ] if before == "Before" && link == "Continue" && href == "#next"
            ),
            "significant paragraphs must occupy consecutive rows"
        );
        let baseline_frame = baseline.render_frame().expect("baseline frame must render");
        let [baseline_hit] = baseline_frame.hit_regions.as_slice() else {
            panic!("expected one baseline link region");
        };
        assert_eq!(
            (
                baseline_hit.x,
                baseline_hit.y,
                baseline_hit.width,
                baseline_hit.height
            ),
            (0, 1, 8, 1)
        );

        let mut example = load_strict_deck(include_str!(
            "../../../examples/source/wml-201-paragraph-empty-ignored.wml"
        ));
        for (value, visible) in [
            ("", false),
            (" \t\n ", false),
            ("Visible", true),
            (" \r\n ", false),
        ] {
            assert!(example.set_var("message".into(), value.into()));
            let frame = example.render_frame().expect("example frame must render");
            assert!(
                frame.focus == baseline_frame.focus,
                "link focus must remain stable"
            );
            if visible {
                let render = example.render().expect("visible paragraph must render");
                assert!(
                    matches!(
                        render.draw.as_slice(),
                        [
                            DrawCmd::Text { x: 0, y: 0, text: before },
                            DrawCmd::Text { x: 0, y: 1, text: message },
                            DrawCmd::Link { x: 0, y: 2, text: link, focused: true, href },
                        ] if before == "Before" && message == "Visible"
                            && link == "Continue" && href == "#next"
                    ),
                    "visible substitution must add one row before the link"
                );
                let mut expected_hit = baseline_hit.clone();
                expected_hit.y = 2;
                assert!(
                    frame.hit_regions == [expected_hit],
                    "visible substitution must move the link region down one row"
                );
            } else {
                assert!(
                    frame.rows == baseline_frame.rows,
                    "empty elements and insignificant white space must leave the rows unchanged"
                );
                assert!(
                    frame.hit_regions == baseline_frame.hit_regions,
                    "insignificant paragraphs must leave link geometry unchanged"
                );
            }
        }
        example
            .handle_key("enter".into())
            .expect("link must activate");
        assert_eq!(example.active_card_id().as_deref(), Ok("next"));

        for paragraph in [
            "<p>&nbsp;</p>",
            "<p><br/></p>",
            r#"<p><input name="entry"/></p>"#,
        ] {
            let engine = strict_card_body(&format!("{first}{paragraph}{next}"));
            let frame = engine
                .render_frame()
                .expect("significant control frame must render");
            let link = frame
                .hit_regions
                .last()
                .expect("expected a following link region");
            assert_eq!((link.x, link.y, link.width, link.height), (0, 2, 8, 1));
            assert!(
                link.target_kind == crate::EngineFocusTargetKind::Link,
                "the following link must keep its hit region"
            );
            match paragraph {
                "<p>&nbsp;</p>" => assert!(
                    matches!(
                        engine.render().expect("nonbreaking space must render").draw.as_slice(),
                        [_, DrawCmd::Text { x: 0, y: 1, text }, _] if text == "\u{a0}"
                    ),
                    "nonbreaking space must keep its glyph"
                ),
                "<p><br/></p>" => assert!(
                    matches!(
                        engine
                            .render()
                            .expect("authored break must render")
                            .draw
                            .as_slice(),
                        [DrawCmd::Text { y: 0, .. }, DrawCmd::Link { y: 2, .. }]
                    ),
                    "authored break must leave an unpainted row"
                ),
                _ => {
                    assert!(
                        matches!(
                            frame.hit_regions.as_slice(),
                            [input, _] if input.x == 0 && input.y == 1
                                && input.width > 0 && input.height == 1
                                && input.target_kind == crate::EngineFocusTargetKind::Input
                        ),
                        "the input must keep its own hit region"
                    );
                    assert!(
                        matches!(
                            frame.focus,
                            Some(focus) if focus.index == 0
                                && focus.target_kind == crate::EngineFocusTargetKind::Input
                        ),
                        "the input must take focus before the following link"
                    );
                }
            }
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space() {
        let mut example = load_strict_deck(include_str!(
            "../../../examples/source/wml-201-inline-nonbreaking-space.wml"
        ));
        assert_eq!(
            draw(&example),
            serde_json::json!([
                {"type": "text", "x": 0, "y": 0, "text": "Keep these words Red"},
                {"type": "link", "x": 0, "y": 1, "text": "Fox", "focused": true, "href": "#joined"}
            ])
        );
        example.handle_key("enter".into()).unwrap();

        let anchor = strict_paragraph(
            r##"Keep these words Red&nbsp;<anchor>Fox<go href="#next"/></anchor>"##,
        );
        for mut engine in [example, anchor] {
            assert_eq!(
                draw(&engine),
                serde_json::json!([
                    {"type": "text", "x": 0, "y": 0, "text": "Keep these words"},
                    {"type": "text", "x": 0, "y": 1, "text": "Red\u{a0}"},
                    {"type": "link", "x": 4, "y": 1, "text": "Fox", "focused": true, "href": "#next"}
                ])
            );
            let frame = engine.render_frame().unwrap();
            let [hit] = frame.hit_regions.as_slice() else {
                panic!("expected one link region");
            };
            assert_eq!((hit.x, hit.y, hit.width, hit.height), (4, 1, 3, 1));
            assert_eq!(hit.action_id, "focus:0");
            assert_eq!(hit.target_kind, crate::EngineFocusTargetKind::Link);
            let source = engine.active_card_id().unwrap();
            for x in [3, 7] {
                engine
                    .handle_input(crate::EngineInputEvent::Click {
                        frame_id: frame.frame_id.clone(),
                        x,
                        y: 1,
                    })
                    .unwrap();
                assert_eq!(engine.active_card_id().unwrap(), source);
            }
            engine
                .handle_input(crate::EngineInputEvent::Click {
                    frame_id: frame.frame_id,
                    x: 6,
                    y: 1,
                })
                .unwrap();
            assert_eq!(engine.active_card_id().unwrap(), "next");
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_expands_before_joining() {
        let link = |label: &str| format!(r##"<a href="#next">{label}</a>"##);
        for (paragraphs, expected_link_x, expected_link_y, expected_link_text) in [
            (
                [
                    format!("Keep these words Red\u{a0}{}", link("Fox")),
                    format!("Keep these words Red&nbsp;{}", link("Fox")),
                    format!("Keep these words Red$(space){}", link("Fox")),
                ],
                4,
                1,
                "Fox",
            ),
            (
                [
                    format!("Keep these words Red{}", link("\u{a0}Fox")),
                    format!("Keep these words Red{}", link("&nbsp;Fox")),
                    format!("Keep these words Red{}", link("$(space)Fox")),
                ],
                3,
                1,
                "\u{a0}Fox",
            ),
            (
                [
                    format!("Keep these words Red\u{a0}{}", link(" Fox")),
                    format!("Keep these words Red&nbsp;{}", link(" $(word)")),
                    format!("Keep these words Red$(space){}", link(" $(word)")),
                ],
                0,
                2,
                "Fox",
            ),
            (
                [
                    format!("Keep these words Red {}", link("\u{a0}")),
                    format!("Keep these words Red {}", link("&nbsp;")),
                    format!("Keep these words Red {}", link("$(space)")),
                ],
                0,
                1,
                "\u{a0}",
            ),
        ] {
            let literal = draw(&strict_paragraph(&paragraphs[0]));
            for paragraph in &paragraphs[1..] {
                assert_eq!(draw(&strict_paragraph(paragraph)), literal, "{paragraph}");
            }
            let commands = literal.as_array().unwrap();
            assert_eq!(
                commands.last().unwrap(),
                &serde_json::json!({
                    "type": "link", "x": expected_link_x, "y": expected_link_y,
                    "text": expected_link_text, "focused": true, "href": "#next"
                })
            );
        }

        // The variable-only text fragment still has the ordinary space authored
        // after the link in front of it, so the two draws start separate rows.
        let literal = draw(&strict_paragraph(r##"<a href="#next">Red</a>  "##));
        let substituted = draw(&strict_paragraph(r##"<a href="#next">Red</a> $(space)"##));
        assert_eq!(literal, substituted);
        assert_eq!(
            substituted,
            serde_json::json!([
                {"type": "link", "x": 0, "y": 0, "text": "Red", "focused": true, "href": "#next"},
                {"type": "text", "x": 0, "y": 1, "text": "\u{a0}"}
            ])
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_is_significant_around_tables() {
        let table = r#"<table columns="1"><tr><td>Data</td></tr></table>"#;
        assert_eq!(
            draw(&strict_paragraph(&format!(" \t{table}\n "))),
            serde_json::json!([{"type": "text", "x": 0, "y": 0, "text": "Data"}])
        );
        for marker in ["\u{a0}", "&nbsp;", "$(space)"] {
            assert_eq!(
                draw(&strict_paragraph(&format!("{marker}{table}"))),
                serde_json::json!([
                    {"type": "text", "x": 0, "y": 0, "text": "\u{a0}"},
                    {"type": "text", "x": 0, "y": 2, "text": "Data"}
                ]),
                "{marker} before table"
            );
            assert_eq!(
                draw(&strict_paragraph(&format!("{table}{marker}"))),
                serde_json::json!([
                    {"type": "text", "x": 0, "y": 0, "text": "Data"},
                    {"type": "text", "x": 0, "y": 2, "text": "\u{a0}"}
                ]),
                "{marker} after table"
            );
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_preserves_preformatted_table_boundaries() {
        let table = r#"<p><table columns="1"><tr><td>Data</td></tr></table></p>"#;
        for (content, pre_text, table_row) in [
            (" \t\n ", None, 0),
            ("\u{a0}", None, 0),
            ("&nbsp;", None, 0),
            ("$(space)", None, 1),
            ("x", Some("x"), 2),
            ("x$(space)y", Some("x y"), 2),
        ] {
            let pre = format!("<pre>{content}</pre>");
            for (body, before_table) in [
                (format!("{pre}{table}"), true),
                (format!("{table}{pre}"), false),
            ] {
                let engine = strict_card_body(&body);
                let data_row = if before_table { table_row } else { 0 };
                let mut expected = vec![
                    serde_json::json!({"type": "text", "x": 0, "y": data_row, "text": "Data"}),
                ];
                if let Some(text) = pre_text {
                    let row = if before_table { 0 } else { 2 };
                    let position = usize::from(!before_table);
                    expected.insert(
                        position,
                        serde_json::json!({"type": "text", "x": 0, "y": row, "text": text}),
                    );
                }
                assert_eq!(draw(&engine), serde_json::Value::Array(expected), "{body}");
            }
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_preserves_preformatted_labels() {
        for marker in ["\u{a0}", "&nbsp;", "$(space)"] {
            for (open, close, task_value) in [
                (r##"<a href="#next">"##, "</a>", None),
                (
                    "<anchor>",
                    r##"<go href="#next"><setvar name="activated" value="yes"/></go></anchor>"##,
                    Some("yes"),
                ),
            ] {
                let label = format!("{open}Red{marker}Fox{close}");
                let mut engine = strict_card_body(&format!("<pre>{label}</pre>"));
                engine.set_viewport_cols(6).unwrap();
                assert_eq!(
                    draw(&engine),
                    serde_json::json!([
                        {"type": "link", "x": 0, "y": 0, "text": "Red", "focused": true, "href": "#next"},
                        {"type": "link", "x": 0, "y": 1, "text": "Fox", "focused": true, "href": "#next"}
                    ]),
                    "{label}"
                );
                let frame = engine.render_frame().unwrap();
                assert_eq!(frame.hit_regions.len(), 2, "{label}");
                for (row, hit) in frame.hit_regions.iter().enumerate() {
                    assert_eq!((hit.x, hit.y, hit.width, hit.height), (0, row as u32, 3, 1));
                    assert_eq!(hit.action_id, "focus:0");
                    assert_eq!(hit.target_kind, crate::EngineFocusTargetKind::Link);
                }
                engine
                    .handle_input(crate::EngineInputEvent::Click {
                        frame_id: frame.frame_id,
                        x: 2,
                        y: 1,
                    })
                    .unwrap();
                assert_eq!(engine.active_card_id().unwrap(), "next");
                assert_eq!(engine.get_var("activated".into()).as_deref(), task_value);

                let mut engine = strict_card_body(&format!("<pre>{open}{marker}{close}</pre>"));
                assert_eq!(
                    draw(&engine),
                    serde_json::json!([
                        {"type": "link", "x": 0, "y": 0, "text": "#next", "focused": true, "href": "#next"}
                    ]),
                    "label fallback for {open}{marker}{close}"
                );
                engine.handle_key("enter".into()).unwrap();
                assert_eq!(engine.active_card_id().unwrap(), "next");
                assert_eq!(engine.get_var("activated".into()).as_deref(), task_value);

                let engine = strict_paragraph(&label);
                assert_eq!(
                    draw(&engine),
                    serde_json::json!([
                        {"type": "link", "x": 0, "y": 0, "text": "Red\u{a0}Fox", "focused": true, "href": "#next"}
                    ]),
                    "{label} in a paragraph"
                );
            }
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_preserves_discretionary_break_at_seam() {
        let mut engine =
            strict_paragraph(r##"<a href="#main">Red&nbsp;&shy;</a><a href="#next">Fox</a>"##);
        for (cols, red, fox_x, fox_y) in [(20, "Red\u{a0}", 4, 0), (5, "Red\u{a0}-", 0, 1)] {
            engine.set_viewport_cols(cols).unwrap();
            assert_eq!(
                draw(&engine),
                serde_json::json!([
                    {"type": "link", "x": 0, "y": 0, "text": red, "focused": true, "href": "#main"},
                    {"type": "link", "x": fox_x, "y": fox_y, "text": "Fox", "focused": false, "href": "#next"}
                ])
            );
            let frame = engine.render_frame().unwrap();
            let [first, second] = frame.hit_regions.as_slice() else {
                panic!("expected two link regions");
            };
            for (hit, x, y, width, action_id) in [
                (first, 0, 0, red.chars().count() as u32, "focus:0"),
                (second, fox_x, fox_y, 3, "focus:1"),
            ] {
                assert_eq!((hit.x, hit.y, hit.width, hit.height), (x, y, width, 1));
                assert_eq!(hit.action_id, action_id);
                assert_eq!(hit.target_kind, crate::EngineFocusTargetKind::Link);
            }
        }

        let leading_marker =
            strict_paragraph(r##"<a href="#main">Red</a><a href="#next">&shy;&nbsp;Fox</a>"##);
        assert_eq!(
            draw(&leading_marker),
            serde_json::json!([
                {"type": "link", "x": 0, "y": 0, "text": "Red", "focused": true, "href": "#main"},
                {"type": "link", "x": 3, "y": 0, "text": "\u{a0}Fox", "focused": false, "href": "#next"}
            ])
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_looks_through_discretionary_only_fragments() {
        let inline = r##"<a href="#main">Red&shy;</a><a href="#next">&nbsp;Fox</a>"##;
        let standalone = r##"<a href="#main">Red</a>&shy;<a href="#next">&nbsp;Fox</a>"##;
        let multiple = r##"<a href="#main">Red</a>&shy;<a href="#main">&shy;</a><a href="#next">&nbsp;Fox</a>"##;
        let expected = serde_json::json!([
            {"type": "link", "x": 0, "y": 0, "text": "Red", "focused": true, "href": "#main"},
            {"type": "link", "x": 3, "y": 0, "text": "\u{a0}Fox", "focused": false, "href": "#next"}
        ]);
        for paragraph in [inline, standalone, multiple] {
            assert_eq!(draw(&strict_paragraph(paragraph)), expected, "{paragraph}");
        }

        for (between, label, y) in [
            ("&shy;", "Fox", 1),
            (" &shy;", "&nbsp;Fox", 1),
            ("&shy; ", "&nbsp;Fox", 1),
            ("&shy;<br/>", "&nbsp;Fox", 2),
            (r#"&shy;<input name="entry"/>"#, "&nbsp;Fox", 2),
        ] {
            let paragraph =
                format!(r##"<a href="#main">Red</a>{between}<a href="#next">{label}</a>"##);
            let rendered = draw(&strict_paragraph(&paragraph));
            assert_eq!(rendered[0]["text"], "Red", "{paragraph}");
            let fox = rendered.as_array().unwrap().last().unwrap();
            assert_eq!(fox["x"], 0, "{paragraph}");
            assert_eq!(fox["y"], y, "{paragraph}");
            assert_eq!(fox["href"], "#next", "{paragraph}");
        }

        let marker_text = serde_json::json!({"type": "text", "x": 3, "y": 0, "text": "-"});
        let marker_link = serde_json::json!(
            {"type": "link", "x": 3, "y": 0, "text": "-", "focused": false, "href": "#main"}
        );
        for (paragraph, first, hyphen, marker_focus) in [
            (inline, "Red-", None, false),
            (standalone, "Red", Some(marker_text), false),
            (multiple, "Red", Some(marker_link), true),
        ] {
            let mut engine = strict_paragraph(paragraph);
            engine.set_viewport_cols(4).unwrap();
            let mut expected = vec![
                serde_json::json!({"type": "link", "x": 0, "y": 0, "text": first, "focused": true, "href": "#main"}),
            ];
            if let Some(hyphen) = hyphen {
                expected.push(hyphen);
            }
            expected.push(
                serde_json::json!({"type": "link", "x": 0, "y": 1, "text": "\u{a0}Fox", "focused": false, "href": "#next"}),
            );
            assert_eq!(draw(&engine), serde_json::json!(expected), "{paragraph}");
            let frame = engine.render_frame().unwrap();
            assert_eq!(frame.hit_regions.len(), if marker_focus { 3 } else { 2 });
            let red = &frame.hit_regions[0];
            let fox = frame.hit_regions.last().unwrap();
            assert_eq!(
                (red.x, red.y, red.width, red.height),
                (0, 0, first.len() as u32, 1)
            );
            assert_eq!(red.action_id, "focus:0");
            assert_eq!((fox.x, fox.y, fox.width, fox.height), (0, 1, 4, 1));
            assert_eq!(
                fox.action_id,
                if marker_focus { "focus:2" } else { "focus:1" }
            );
            assert_eq!(fox.target_kind, crate::EngineFocusTargetKind::Link);
            if marker_focus {
                let hyphen = &frame.hit_regions[1];
                assert_eq!(
                    (hyphen.x, hyphen.y, hyphen.width, hyphen.height),
                    (3, 0, 1, 1)
                );
                assert_eq!(hyphen.action_id, "focus:1");
                assert_eq!(hyphen.target_kind, crate::EngineFocusTargetKind::Link);
            }
            engine
                .handle_input(crate::EngineInputEvent::Click {
                    frame_id: frame.frame_id,
                    x: 0,
                    y: 1,
                })
                .unwrap();
            assert_eq!(engine.active_card_id().unwrap(), "next");
        }
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_retains_offscreen_link() {
        let mut engine =
            strict_paragraph(r##"<a href="#main">R&nbsp;&nbsp;&nbsp;</a><a href="#next">F</a>"##);
        engine.set_viewport_cols(4).unwrap();
        engine.handle_key("down".into()).unwrap();
        assert_eq!(
            draw(&engine),
            serde_json::json!([
                {"type": "link", "x": 0, "y": 0, "text": "R\u{a0}\u{a0}\u{a0}", "focused": false, "href": "#main"},
                {"type": "link", "x": 4, "y": 0, "text": "F", "focused": true, "href": "#next"}
            ])
        );
        let frame = engine.render_frame().unwrap();
        let [_, hit] = frame.hit_regions.as_slice() else {
            panic!("expected both link regions");
        };
        assert_eq!((hit.x, hit.y, hit.width, hit.height), (4, 0, 1, 1));
        assert_eq!(hit.action_id, "focus:1");
        assert_eq!(hit.target_kind, crate::EngineFocusTargetKind::Link);
        engine.handle_key("enter".into()).unwrap();
        assert_eq!(engine.active_card_id().unwrap(), "next");
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_keeps_breaks_and_controls() {
        let explicit_break = draw(&strict_paragraph(
            r##"Red&nbsp;<br/><a href="#next">Fox</a>"##,
        ));
        assert_eq!(
            explicit_break,
            draw(&strict_paragraph(
                r##"Red$(space)<br/><a href="#next">Fox</a>"##
            ))
        );
        assert_eq!(
            explicit_break,
            serde_json::json!([
                {"type": "text", "x": 0, "y": 0, "text": "Red\u{a0}"},
                {"type": "link", "x": 0, "y": 2, "text": "Fox", "focused": true, "href": "#next"}
            ])
        );

        let paragraph = r#"Red&nbsp;<input name="name" title="First&nbsp;name" value="Jo"/>
<select name="choice" title="Pick&nbsp;one"><option value="first">Red&nbsp;Fox</option><option value="second">Blue&nbsp;Fox</option></select>&nbsp;Fox"#;
        let mut control = strict_paragraph(
            &paragraph
                .replace("First&nbsp;name", "First name")
                .replace("Pick&nbsp;one", "Pick one")
                .replace("Red&nbsp;Fox", "Red Fox")
                .replace("Blue&nbsp;Fox", "Blue Fox"),
        );
        let mut nbsp = strict_paragraph(paragraph);
        let expected = draw(&control);
        assert_eq!(draw(&nbsp), expected);
        assert_eq!(expected[0]["text"], "Red\u{a0}");
        assert_eq!(expected[1]["text"], "[First name: Jo]");
        assert_eq!(expected[1]["y"], 1);
        assert_eq!(expected[2]["text"], "[Pick one: Red Fox]");
        assert_eq!(expected[2]["y"], 2);
        assert_eq!(expected[3]["text"], "\u{a0}Fox");
        assert_eq!(expected[3]["y"], 3);

        for engine in [&mut control, &mut nbsp] {
            assert!(engine.begin_focused_input_edit().unwrap());
            assert!(engine.set_focused_input_edit_draft("Sam".into()));
            assert!(engine.commit_focused_input_edit().unwrap());
            assert_eq!(engine.get_var("name".into()).as_deref(), Some("Sam"));
            engine.handle_key("down".into()).unwrap();
            assert!(engine.begin_focused_select_edit().unwrap());
            assert!(engine.move_focused_select_edit(1));
            assert!(engine.commit_focused_select_edit().unwrap());
            assert_eq!(engine.get_var("choice".into()).as_deref(), Some("second"));
        }
        let edited = draw(&nbsp);
        assert_eq!(edited, draw(&control));
        assert_eq!(edited[1]["text"], "[First name: Sam]");
        assert_eq!(edited[2]["text"], "[Pick one: Blue Fox]");
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_nonbreaking_space_counts_shared_row_once() {
        let engine = strict_paragraph(r##"Red&nbsp;<a href="#next">Fox</a>"##);
        let card = engine.runtime_card_for_layout().unwrap();
        let limits = EngineRenderLimits {
            rows: 1,
            segments: 2,
            draw_commands: 2,
            serialized_bytes: usize::MAX,
        };
        let layout = layout_card_with_limits(&card, 20, 0, limits).unwrap();
        assert_eq!(layout.segments.len(), 2);
        assert_eq!(layout.segments[0].y, 0);
        assert_eq!(layout.segments[1].y, 0);
        assert_eq!(layout.render_list.draw.len(), 2);
        for (limited, expected) in [
            (
                EngineRenderLimits {
                    segments: 1,
                    ..limits
                },
                EngineRenderResource::LayoutSegments,
            ),
            (
                EngineRenderLimits {
                    draw_commands: 1,
                    ..limits
                },
                EngineRenderResource::DrawCommands,
            ),
        ] {
            assert!(matches!(
                layout_card_with_limits(&card, 20, 0, limited),
                Err(EngineRenderError::ResourceLimit { resource, limit: 1, observed: 2, .. })
                    if resource == expected
            ));
        }
    }

    fn text_rows(count: usize) -> Card {
        Card {
            id: "limits".to_string(),
            language: None,
            new_context: false,
            ordered: true,
            nodes: vec![Node::Paragraph {
                mode: None,
                inline: vec![InlineNode::Text("a ".repeat(count))],
            }],
            event_bindings: vec![],
            timer: None,
        }
    }

    fn assert_resource_limit(error: EngineRenderError, expected: EngineRenderResource) {
        assert!(matches!(
            error,
            EngineRenderError::ResourceLimit {
                resource,
                limit: 3,
                observed: 4,
                ..
            } if resource == expected
        ));
    }

    #[test]
    fn every_structural_budget_accepts_exactly_at_limit_and_rejects_one_over() {
        fn layout(
            card: &Card,
            limits: EngineRenderLimits,
        ) -> Result<super::LayoutResult<'_>, EngineRenderError> {
            super::layout_card_impl(
                &card.nodes,
                &std::collections::HashMap::new(),
                1,
                0,
                limits,
                false,
            )
        }
        let exact = text_rows(3);
        let one_over = text_rows(4);

        let segment_limits = EngineRenderLimits {
            rows: 4,
            segments: 3,
            draw_commands: 4,
            serialized_bytes: usize::MAX,
        };
        assert_eq!(
            layout(&exact, segment_limits)
                .expect("exact segment limit should render")
                .segments
                .len(),
            3
        );
        assert_resource_limit(
            layout(&one_over, segment_limits).expect_err("one over segment limit should fail"),
            EngineRenderResource::LayoutSegments,
        );

        let draw_limits = EngineRenderLimits {
            rows: 4,
            segments: 4,
            draw_commands: 3,
            serialized_bytes: usize::MAX,
        };
        assert_eq!(
            layout(&exact, draw_limits)
                .expect("exact draw limit should render")
                .render_list
                .draw
                .len(),
            3
        );
        assert_resource_limit(
            layout(&one_over, draw_limits).expect_err("one over draw limit should fail"),
            EngineRenderResource::DrawCommands,
        );

        let exact_rows = Card {
            nodes: vec![Node::Break; 3],
            ..text_rows(0)
        };
        let one_over_rows = Card {
            nodes: vec![Node::Break; 4],
            ..text_rows(0)
        };
        let row_limits = EngineRenderLimits {
            rows: 3,
            segments: 0,
            draw_commands: 0,
            serialized_bytes: usize::MAX,
        };
        layout(&exact_rows, row_limits).expect("exact row limit should render");
        assert_resource_limit(
            layout(&one_over_rows, row_limits).expect_err("one over row limit should fail"),
            EngineRenderResource::LayoutRows,
        );
    }

    #[test]
    fn wraps_and_marks_focus() {
        let card = Card {
            id: "home".to_string(),
            language: None,
            new_context: false,
            ordered: true,
            nodes: vec![Node::Paragraph {
                mode: None,
                inline: vec![
                    InlineNode::Text("Hello world from wap".to_string()),
                    InlineNode::Link {
                        text: "Next page".to_string(),
                        href: "#next".to_string(),
                    },
                ],
            }],
            event_bindings: vec![],
            timer: None,
        };

        let out = layout_card(&card, 10, 0).expect("layout should fit budgets");
        assert_eq!(out.focus_targets.len(), 1);
        assert!(out.render_list.draw.iter().any(|cmd| matches!(
            cmd,
            crate::render::render_list::DrawCmd::Link { focused: true, .. }
        )));
    }

    #[test]
    fn wml_fx_paragraph_alignment_default() {
        // WAP-191_104-WML §11.8.3 defaults an omitted paragraph alignment to left.
        let wml = r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="main"><p>Same text</p><p align="left">Same text</p></card></wml>"#;

        let mut engine = WmlEngine::new();
        engine
            .set_viewport_cols(40)
            .expect("viewport must leave space for alignment");
        engine
            .load_deck_context(
                wml,
                "http://example.test/paragraph-alignment.wml",
                "text/vnd.wap.wml; validation=strict",
                None,
            )
            .expect("strict WML 1.3 deck must load");

        let render = engine.render().expect("deck must render");
        assert!(
            matches!(
                render.draw.as_slice(),
                [DrawCmd::Text { x: 0, text: default, .. }, DrawCmd::Text { x: 0, text: explicit, .. }]
                    if default == "Same text" && default == explicit
            ),
            "omitted and explicit left alignment must draw the same text at column zero: {:?}",
            render.draw
        );
    }

    #[test]
    fn wml_fx_paragraph_significant_break_starts_next_paragraph_on_new_line() {
        let wml = r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="main"><p>First paragraph</p><p>Second paragraph</p></card></wml>"#;

        let mut engine = WmlEngine::new();
        engine
            .set_viewport_cols(40)
            .expect("viewport must fit both strings on one line");
        let base_url = "http://example.test/paragraphs.wml";
        let content_type = "text/vnd.wap.wml; validation=strict";
        engine
            .load_deck_context(wml, base_url, content_type, None)
            .expect("strict WML 1.3 deck must load");

        let deck = engine.deck.as_ref().expect("loaded deck must be available");
        assert!(
            matches!(
                deck.cards[0].nodes.as_slice(),
                [Node::Paragraph { .. }, Node::Paragraph { .. }]
            ),
            "both significant paragraphs must survive as separate nodes"
        );

        let render = engine.render().expect("deck must render");
        assert!(
            matches!(
                render.draw.as_slice(),
                [DrawCmd::Text { y: 0, text: first, .. }, DrawCmd::Text { y: 1, text: second, .. }]
                    if first == "First paragraph" && second == "Second paragraph"
            ),
            "significant paragraphs must start on consecutive lines: {:?}",
            render.draw
        );

        let single_paragraph = wml.replace("</p><p>", " ");
        engine
            .load_deck_context(&single_paragraph, base_url, content_type, None)
            .expect("single-paragraph control deck must load");
        let render = engine.render().expect("single paragraph must render");
        assert!(
            matches!(
                render.draw.as_slice(),
                [DrawCmd::Text { y: 0, text, .. }] if text == "First paragraph Second paragraph"
            ),
            "the same text in one paragraph must fit on one line: {:?}",
            render.draw
        );
    }

    #[cfg_attr(not(target_arch = "wasm32"), test)]
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
    fn wml_fx_paragraph_soft_hyphen() {
        // WAP-191_104-WML §11.8.3 inserts a hyphen only at a selected soft break.
        for (paragraph, width, expected) in [
            ("co&shy;operate", 9, &["cooperate"][..]),
            ("co&shy;operate", 7, &["co-", "operate"][..]),
            ("co&shy;operate", 2, &["co", "op", "er", "at", "e"][..]),
            ("éé a&shy;b", 6, &["éé", "ab"][..]),
            ("éé ab", 6, &["éé", "ab"][..]),
            ("éé a&shy;b", 7, &["éé ab"][..]),
            ("éé a&shy;bcde", 6, &["éé a-", "bcde"][..]),
            ("é&shy;éb", 3, &["ééb"][..]),
            ("é&shy;éb", 1, &["é", "é", "b"][..]),
        ] {
            let wml = format!(
                r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="main"><p>{paragraph}</p></card></wml>"#
            );
            let mut engine = WmlEngine::new();
            engine
                .load_deck_context(
                    &wml,
                    "http://example.test/paragraph-soft-hyphen.wml",
                    "text/vnd.wap.wml; validation=strict",
                    None,
                )
                .expect("strict WML 1.3 deck must load");
            engine.set_viewport_cols(width).expect("valid width");
            let render = engine.render().expect("deck must render");
            let rows: Vec<_> = render
                .draw
                .iter()
                .map(|command| match command {
                    DrawCmd::Text { x: 0, y, text } => (*y, text.as_str()),
                    _ => panic!("expected paragraph text, got {command:?}"),
                })
                .collect();
            assert!(
                rows.iter().copied().eq((0..).zip(expected.iter().copied())),
                "paragraph {paragraph:?} at viewport {width}: expected rows {expected:?}, got {rows:?}"
            );
        }
    }

    #[test]
    fn inline_break_forces_a_hard_line_break_between_segments() {
        // WAP-191_104-WML SS11.8.4: `br` must force a line break wherever it occurs, including
        // nested inline content. Regression coverage for a real bug: `wrap_text` on a
        // whitespace-only segment returns zero chunks (`str::split_whitespace` yields no words
        // for an all-blank string), so mapping inline `<br/>` to `InlineNode::Text(" ")` made
        // the break silently vanish -- no line advance, no rendered break -- rather than
        // "collapse to a space" as it might appear from the WML source alone.
        let card = Card {
            id: "home".to_string(),
            language: None,
            new_context: false,
            ordered: true,
            nodes: vec![Node::Paragraph {
                mode: None,
                inline: vec![
                    InlineNode::Text("before".to_string()),
                    InlineNode::Break,
                    InlineNode::Text("after".to_string()),
                ],
            }],
            event_bindings: vec![],
            timer: None,
        };

        let out = layout_card(&card, 20, 0).expect("layout should fit budgets");
        let lines: Vec<(u32, String)> = out
            .render_list
            .draw
            .iter()
            .filter_map(|cmd| match cmd {
                DrawCmd::Text { y, text, .. } => Some((*y, text.clone())),
                _ => None,
            })
            .collect();

        assert_eq!(
            lines,
            vec![(0, "before".to_string()), (2, "after".to_string())],
            "the br must consume its own line slot (y=1, left blank between the two text \
             segments) rather than being skipped entirely -- got {lines:?}"
        );
    }

    #[test]
    fn hard_wraps_single_token_longer_than_width() {
        let card = Card {
            id: "home".to_string(),
            language: None,
            new_context: false,
            ordered: true,
            nodes: vec![Node::Paragraph {
                mode: None,
                inline: vec![InlineNode::Text("supercalifragilistic".to_string())],
            }],
            event_bindings: vec![],
            timer: None,
        };

        let out = layout_card(&card, 5, 0).expect("layout should fit budgets");
        let lines: Vec<String> = out
            .render_list
            .draw
            .iter()
            .filter_map(|cmd| match cmd {
                crate::render::render_list::DrawCmd::Text { text, .. } => Some(text.clone()),
                _ => None,
            })
            .collect();

        assert_eq!(lines, vec!["super", "calif", "ragil", "istic"]);
    }

    #[test]
    fn wrapped_link_keeps_single_logical_focus_index() {
        let card = Card {
            id: "home".to_string(),
            language: None,
            new_context: false,
            ordered: true,
            nodes: vec![Node::Paragraph {
                mode: None,
                inline: vec![InlineNode::Link {
                    text: "abcdefghijkl".to_string(),
                    href: "#next".to_string(),
                }],
            }],
            event_bindings: vec![],
            timer: None,
        };

        let out = layout_card(&card, 4, 0).expect("layout should fit budgets");
        assert_eq!(out.focus_targets, vec![FocusTarget::Link("#next")]);

        let link_chunks: Vec<bool> = out
            .render_list
            .draw
            .iter()
            .filter_map(|cmd| match cmd {
                crate::render::render_list::DrawCmd::Link { focused, .. } => Some(*focused),
                _ => None,
            })
            .collect();

        assert_eq!(link_chunks, vec![true, true, true]);
    }

    #[test]
    fn input_nodes_render_as_focusable_segments_and_mask_passwords() {
        let card = Card {
            id: "home".to_string(),
            language: None,
            new_context: false,
            ordered: true,
            nodes: vec![Node::Paragraph {
                mode: None,
                inline: vec![
                    InlineNode::Input {
                        control_id: "UserName".to_string(),
                        name: "UserName".to_string(),
                        title: None,
                        value: "AHMED".to_string(),
                        default_value: Some("AHMED".to_string()),
                        is_password: false,
                        max_length: None,
                        mask: Default::default(),
                        empty_ok: true,
                    },
                    InlineNode::Input {
                        control_id: "Password".to_string(),
                        name: "Password".to_string(),
                        title: None,
                        value: "secret".to_string(),
                        default_value: Some("secret".to_string()),
                        is_password: true,
                        max_length: None,
                        mask: Default::default(),
                        empty_ok: true,
                    },
                    InlineNode::Select {
                        control_id: "Country".to_string(),
                        name: Some("Country".to_string()),
                        iname: None,
                        title: Some("Country".to_string()),
                        default_value: None,
                        default_index_value: None,
                        multiple: false,
                        options: vec![
                            crate::runtime::node::SelectOption {
                                label: "Jordan".to_string(),
                                value: "Jordan".to_string(),
                                onpick: None,
                            },
                            crate::runtime::node::SelectOption {
                                label: "France".to_string(),
                                value: "France".to_string(),
                                onpick: None,
                            },
                        ],
                        selected_indices: vec![1],
                    },
                ],
            }],
            event_bindings: vec![],
            timer: None,
        };

        let out = layout_card(&card, 40, 1).expect("layout should fit budgets");
        assert_eq!(
            out.focus_targets,
            vec![
                FocusTarget::Input {
                    control_id: "UserName",
                    name: "UserName",
                },
                FocusTarget::Input {
                    control_id: "Password",
                    name: "Password",
                },
                FocusTarget::Select("Country")
            ]
        );
        assert!(out
            .render_list
            .draw
            .iter()
            .any(|cmd| matches!(cmd, DrawCmd::Link { text, focused: false, href, .. } if text == "[UserName: AHMED]" && href == "input:UserName")));
        assert!(out.render_list.draw.iter().any(
            |cmd| matches!(cmd, DrawCmd::Link { text, focused: true, href, .. } if text == "[Password: ******]" && href == "input:Password")
        ));
        assert!(out.render_list.draw.iter().any(
            |cmd| matches!(cmd, DrawCmd::Link { text, focused: false, href, .. } if text == "[Country: France]" && href == "select:Country")
        ));
    }
}
