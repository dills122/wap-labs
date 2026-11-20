use std::borrow::Cow;

use crate::render::frame::{EngineRenderError, EngineRenderLimits, EngineRenderResource};
use crate::render::render_list::{DrawCmd, RenderList};
use crate::runtime::card::{Card, CardTaskAction};
use crate::runtime::node::{
    is_breakable_space, InlineContext, InlineNode, Node, NONBREAKING_SPACE,
};

#[derive(Clone, Debug, Default)]
pub struct LayoutResult {
    pub render_list: RenderList,
    pub focus_targets: Vec<FocusTarget>,
    pub segments: Vec<LayoutSegment>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LayoutSegment {
    pub x: u32,
    pub y: u32,
    pub text: String,
    pub focus_index: Option<usize>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum FocusTarget {
    Link(String),
    Anchor(CardTaskAction),
    Input { control_id: String, name: String },
    Select(String),
}

impl FocusTarget {
    fn for_inline_node(node: &InlineNode) -> Option<Self> {
        match node {
            InlineNode::Link { href, .. } => Some(Self::Link(href.clone())),
            InlineNode::Anchor { action, .. } => Some(Self::Anchor(action.clone())),
            InlineNode::Input {
                control_id, name, ..
            } => Some(Self::Input {
                control_id: control_id.clone(),
                name: name.clone(),
            }),
            InlineNode::Select { control_id, .. } => Some(Self::Select(control_id.clone())),
            InlineNode::Text(_) | InlineNode::Break | InlineNode::BreakOpportunity => None,
        }
    }

    pub(crate) fn in_card(card: &Card) -> impl Iterator<Item = Self> + '_ {
        card.nodes
            .iter()
            .filter_map(|node| match node {
                Node::Paragraph { inline, .. } | Node::CardContent(inline) => Some(inline),
                Node::Break => None,
            })
            .flatten()
            .filter_map(Self::for_inline_node)
    }

    /// Encode this target as the `href` string carried by [`DrawCmd::Link`].
    ///
    /// This is the only place the `input:`/`select:` prefix encoding is
    /// produced. The prefixes are part of the host-visible render-list shape
    /// (see the `browser/src-tauri` render assertions), so the string form is
    /// built once here at the output boundary rather than being round-tripped
    /// back into a `FocusTarget` internally.
    pub fn to_render_href(&self) -> String {
        match self {
            FocusTarget::Link(href) => href.clone(),
            FocusTarget::Anchor(action) => match action.base_and_set_vars().0 {
                CardTaskAction::Go { href, .. } => href.clone(),
                _ => "anchor:task".to_string(),
            },
            FocusTarget::Input { control_id, .. } => format!("input:{control_id}"),
            FocusTarget::Select(name) => format!("select:{name}"),
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
    Break,
    BreakOpportunity,
}

fn paragraph_parts<'a>(
    inline: &'a [InlineNode],
    context: InlineContext,
    targets: &mut Vec<FocusTarget>,
) -> Vec<ParagraphPart<'a>> {
    let keep_nbsp = context == InlineContext::Paragraph;
    let mut parts = Vec::new();
    for entry in inline {
        let focus_index = FocusTarget::for_inline_node(entry).map(|target| {
            let index = targets.len();
            targets.push(target);
            index
        });
        let fragment = |text, keep_nbsp| {
            ParagraphPart::Fragment(Fragment {
                text,
                focus_index,
                keep_nbsp,
            })
        };

        match entry {
            InlineNode::Break => parts.push(ParagraphPart::Break),
            InlineNode::BreakOpportunity => parts.push(ParagraphPart::BreakOpportunity),
            InlineNode::Text(text) if keep_nbsp && text.is_empty() => {}
            InlineNode::Text(text) if keep_nbsp && text.chars().all(is_breakable_space) => {
                parts.push(ParagraphPart::BreakOpportunity);
            }
            InlineNode::Text(text) | InlineNode::Link { text, .. } => {
                parts.push(fragment(Cow::Borrowed(text.as_str()), keep_nbsp));
            }
            InlineNode::Anchor { label_lines, .. } => {
                for (index, text) in label_lines.iter().enumerate() {
                    if index != 0 {
                        parts.push(ParagraphPart::Break);
                    }
                    parts.push(fragment(Cow::Borrowed(text.as_str()), keep_nbsp));
                }
            }
            InlineNode::Input {
                name,
                title,
                value,
                is_password,
                mask,
                ..
            } => {
                let display_value = if *is_password {
                    mask.obscure(value)
                } else {
                    value.clone()
                };
                let label = title
                    .as_deref()
                    .filter(|title| !title.trim().is_empty())
                    .unwrap_or(name);
                parts.push(fragment(
                    Cow::Owned(format!("[{label}: {display_value}]")),
                    false,
                ));
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
                let selected = selected_indices
                    .iter()
                    .filter_map(|index| options.get(*index))
                    .map(|option| option.label.as_str())
                    .collect::<Vec<_>>()
                    .join(if *multiple { "; " } else { "" });
                let label = title
                    .as_ref()
                    .or(name.as_ref())
                    .or(iname.as_ref())
                    .unwrap_or(control_id);
                parts.push(fragment(
                    Cow::Owned(format!("[{label}: {selected}]")),
                    false,
                ));
            }
        }
    }
    parts
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
) -> Result<LayoutResult, EngineRenderError> {
    layout_card_impl(
        card,
        viewport_cols,
        focused_link_idx,
        EngineRenderLimits::default(),
        false,
    )
}

pub(crate) fn layout_card_with_limits(
    card: &Card,
    viewport_cols: usize,
    focused_link_idx: usize,
    limits: EngineRenderLimits,
) -> Result<LayoutResult, EngineRenderError> {
    layout_card_impl(card, viewport_cols, focused_link_idx, limits, true)
}

fn layout_card_impl(
    card: &Card,
    viewport_cols: usize,
    focused_link_idx: usize,
    limits: EngineRenderLimits,
    count_render_pass: bool,
) -> Result<LayoutResult, EngineRenderError> {
    #[cfg(feature = "render-test-instrumentation")]
    if count_render_pass {
        LAYOUT_PASS_COUNT.with(|count| count.set(count.get() + 1));
    }
    #[cfg(not(feature = "render-test-instrumentation"))]
    let _ = count_render_pass;

    let mut result = LayoutResult::default();
    let mut row_count = 0usize;

    for node in &card.nodes {
        let (inline, context) = match node {
            Node::Paragraph { inline, .. } => (inline, InlineContext::Paragraph),
            Node::CardContent(inline) => (inline, InlineContext::Card),
            Node::Break => {
                check_next_row(&limits, row_count)?;
                row_count += 1;
                continue;
            }
        };

        let first_focus = result.focus_targets.len();
        let parts = paragraph_parts(inline, context, &mut result.focus_targets);
        let hrefs: Vec<_> = result.focus_targets[first_focus..]
            .iter()
            .map(FocusTarget::to_render_href)
            .collect();
        let mut parts = parts.into_iter();
        while let Some(part) = parts.next() {
            let first = match part {
                // Explicit breaks consume a row even when they have no paint.
                ParagraphPart::Break => {
                    check_next_row(&limits, row_count)?;
                    row_count += 1;
                    continue;
                }
                ParagraphPart::BreakOpportunity => continue,
                ParagraphPart::Fragment(fragment) => fragment,
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
                check_next_row(&limits, row_count)?;
                let y = row_count as u32;
                let mut x = 0;
                for (fragment, text) in line.fragments() {
                    check_next_draw(
                        &limits,
                        result.segments.len(),
                        result.render_list.draw.len(),
                    )?;
                    let focus_index = focus_indices[fragment];
                    let draw = match focus_index {
                        Some(index) => DrawCmd::Link {
                            x,
                            y,
                            text: text.to_owned(),
                            focused: index == focused_link_idx,
                            href: hrefs[index - first_focus].clone(),
                        },
                        None => DrawCmd::Text {
                            x,
                            y,
                            text: text.to_owned(),
                        },
                    };
                    result.segments.push(LayoutSegment {
                        x,
                        y,
                        text: text.to_owned(),
                        focus_index,
                    });
                    result.render_list.draw.push(draw);
                    x += text.chars().count() as u32;
                }
                row_count += 1;
            }
        }
    }

    Ok(result)
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

fn check_next_draw(
    limits: &EngineRenderLimits,
    segments: usize,
    draw_commands: usize,
) -> Result<(), EngineRenderError> {
    if segments >= limits.segments {
        return Err(EngineRenderError::resource_limit(
            EngineRenderResource::LayoutSegments,
            limits.segments,
            segments.saturating_add(1),
        ));
    }
    if draw_commands >= limits.draw_commands {
        return Err(EngineRenderError::resource_limit(
            EngineRenderResource::DrawCommands,
            limits.draw_commands,
            draw_commands.saturating_add(1),
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
    use crate::WmlEngine;

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
        let exact = text_rows(3);
        let one_over = text_rows(4);

        let segment_limits = EngineRenderLimits {
            rows: 4,
            segments: 3,
            draw_commands: 4,
            serialized_bytes: usize::MAX,
        };
        assert_eq!(
            layout_card_with_limits(&exact, 1, 0, segment_limits)
                .expect("exact segment limit should render")
                .segments
                .len(),
            3
        );
        assert_resource_limit(
            layout_card_with_limits(&one_over, 1, 0, segment_limits)
                .expect_err("one over segment limit should fail"),
            EngineRenderResource::LayoutSegments,
        );

        let draw_limits = EngineRenderLimits {
            rows: 4,
            segments: 4,
            draw_commands: 3,
            serialized_bytes: usize::MAX,
        };
        assert_eq!(
            layout_card_with_limits(&exact, 1, 0, draw_limits)
                .expect("exact draw limit should render")
                .render_list
                .draw
                .len(),
            3
        );
        assert_resource_limit(
            layout_card_with_limits(&one_over, 1, 0, draw_limits)
                .expect_err("one over draw limit should fail"),
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
        layout_card_with_limits(&exact_rows, 1, 0, row_limits)
            .expect("exact row limit should render");
        assert_resource_limit(
            layout_card_with_limits(&one_over_rows, 1, 0, row_limits)
                .expect_err("one over row limit should fail"),
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
        assert_eq!(
            out.focus_targets,
            vec![FocusTarget::Link("#next".to_string())]
        );

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
                    control_id: "UserName".to_string(),
                    name: "UserName".to_string(),
                },
                FocusTarget::Input {
                    control_id: "Password".to_string(),
                    name: "Password".to_string(),
                },
                FocusTarget::Select("Country".to_string())
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
