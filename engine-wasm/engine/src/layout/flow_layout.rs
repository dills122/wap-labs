use crate::render::frame::{EngineRenderError, EngineRenderLimits, EngineRenderResource};
use crate::render::render_list::{DrawCmd, RenderList};
use crate::runtime::card::{Card, CardTaskAction};
use crate::runtime::node::{InlineNode, Node};

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
            InlineNode::Text(_) | InlineNode::Break => None,
        }
    }

    pub(crate) fn in_card(card: &Card) -> impl Iterator<Item = Self> + '_ {
        card.nodes
            .iter()
            .filter_map(|node| match node {
                Node::Paragraph(inline) => Some(inline),
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

/// Intermediate form of one `InlineNode` while building a paragraph's render output: either a
/// text/link/input/select segment to be word-wrapped, or an explicit inline `<br/>` that must
/// advance the line directly instead of going through the word-wrapper (see the comment at the
/// `ParagraphPart::Break` match arm below for why).
enum ParagraphPart {
    Segment(String),
    Anchor(Vec<String>),
    Break,
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
    let mut line = 0u32;
    let mut row_count = 0usize;

    for node in &card.nodes {
        match node {
            Node::Break => {
                check_next_output(
                    &limits,
                    row_count,
                    result.segments.len(),
                    result.render_list.draw.len(),
                    true,
                )?;
                row_count += 1;
                line += 1;
            }
            Node::Paragraph(inline) => {
                let mut parts = Vec::new();
                for entry in inline {
                    let part = match entry {
                        InlineNode::Break => ParagraphPart::Break,
                        InlineNode::Text(text) | InlineNode::Link { text, .. } => {
                            ParagraphPart::Segment(text.clone())
                        }
                        InlineNode::Anchor { label_lines, .. } => {
                            ParagraphPart::Anchor(label_lines.clone())
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
                            ParagraphPart::Segment(format!("[{label}: {display_value}]"))
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
                                .map(|option| option.label.clone())
                                .collect::<Vec<_>>()
                                .join(if *multiple { "; " } else { "" });
                            let label = title
                                .clone()
                                .or_else(|| name.clone())
                                .or_else(|| iname.clone())
                                .unwrap_or_else(|| control_id.clone());
                            ParagraphPart::Segment(format!("[{label}: {selected}]"))
                        }
                    };
                    parts.push((part, FocusTarget::for_inline_node(entry)));
                }

                for (part, target) in &parts {
                    let lines = match part {
                        // WAP-191_104-WML SS11.8.4: `br` forces a line break wherever it
                        // occurs, including nested inline content -- this must advance the
                        // line directly rather than going through `wrap_text`, which drops
                        // whitespace-only segments entirely (`str::split_whitespace` yields no
                        // words for a blank string) and would otherwise silently swallow the
                        // break.
                        ParagraphPart::Break => {
                            check_next_output(
                                &limits,
                                row_count,
                                result.segments.len(),
                                result.render_list.draw.len(),
                                true,
                            )?;
                            row_count += 1;
                            line += 1;
                            continue;
                        }
                        ParagraphPart::Segment(text) => std::slice::from_ref(text),
                        ParagraphPart::Anchor(lines) => lines.as_slice(),
                    };

                    let focus_index = target.as_ref().map(|target| {
                        let idx = result.focus_targets.len();
                        result.focus_targets.push(target.clone());
                        idx
                    });
                    // Stringify once per focus target, at the render-list boundary.
                    let href = target.as_ref().map(FocusTarget::to_render_href);

                    for (index, text) in lines.iter().enumerate() {
                        if index > 0 {
                            check_next_output(
                                &limits,
                                row_count,
                                result.segments.len(),
                                result.render_list.draw.len(),
                                true,
                            )?;
                            row_count += 1;
                            line += 1;
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
                        let chunks =
                            wrap_text(text, viewport_cols, remaining_chunks).map_err(|_| {
                                next_output_error(
                                    &limits,
                                    row_count,
                                    result.segments.len(),
                                    remaining_chunks,
                                )
                            })?;
                        for chunk in chunks {
                            check_next_output(
                                &limits,
                                row_count,
                                result.segments.len(),
                                result.render_list.draw.len(),
                                false,
                            )?;
                            result.segments.push(LayoutSegment {
                                x: 0,
                                y: line,
                                text: chunk.clone(),
                                focus_index,
                            });
                            match &href {
                                Some(link_href) => {
                                    result.render_list.draw.push(DrawCmd::Link {
                                        x: 0,
                                        y: line,
                                        text: chunk,
                                        focused: focus_index == Some(focused_link_idx),
                                        href: link_href.clone(),
                                    });
                                }
                                None => {
                                    result.render_list.draw.push(DrawCmd::Text {
                                        x: 0,
                                        y: line,
                                        text: chunk,
                                    });
                                }
                            }
                            row_count += 1;
                            line += 1;
                        }
                    }
                }
            }
        }
    }

    Ok(result)
}

fn check_next_output(
    limits: &EngineRenderLimits,
    rows: usize,
    segments: usize,
    draw_commands: usize,
    row_only: bool,
) -> Result<(), EngineRenderError> {
    if rows >= limits.rows {
        return Err(EngineRenderError::resource_limit(
            EngineRenderResource::LayoutRows,
            limits.rows,
            rows.saturating_add(1),
        ));
    }
    if !row_only && segments >= limits.segments {
        return Err(EngineRenderError::resource_limit(
            EngineRenderResource::LayoutSegments,
            limits.segments,
            segments.saturating_add(1),
        ));
    }
    if !row_only && draw_commands >= limits.draw_commands {
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

fn push_line(lines: &mut Vec<String>, current: &mut String, max_lines: usize) -> Result<(), ()> {
    if lines.len() >= max_lines {
        return Err(());
    }
    lines.push(std::mem::take(current));
    Ok(())
}

fn push_word_with_soft_hyphens(
    mut word: &str,
    width: usize,
    max_lines: usize,
    lines: &mut Vec<String>,
    current: &mut String,
    current_cols: &mut usize,
) -> Result<(), ()> {
    loop {
        word = word.trim_matches(SOFT_HYPHEN);
        if word.is_empty() {
            return Ok(());
        }

        let needs_space = !current.is_empty();
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
                visible_bytes += character.len_utf8();
            }
        }

        let Some(hard_break) = hard_break else {
            // Match ordinary word wrapping when the word fits in painted columns.
            // Appending to a populated line uses UTF-8 bytes, excluding soft hyphens.
            if needs_space {
                if current.len() + 1 + visible_bytes <= width {
                    current.push(' ');
                    *current_cols += 1;
                } else {
                    push_line(lines, current, max_lines)?;
                    *current_cols = 0;
                }
            }
            current.extend(word.chars().filter(|&character| character != SOFT_HYPHEN));
            *current_cols += visible;
            return Ok(());
        };

        if let Some((end, resume)) = soft_break {
            if needs_space {
                current.push(' ');
            }
            current.extend(
                word[..end]
                    .chars()
                    .filter(|&character| character != SOFT_HYPHEN),
            );
            current.push('-');
            word = &word[resume..];
        } else if !needs_space {
            current.extend(
                word[..hard_break]
                    .chars()
                    .filter(|&character| character != SOFT_HYPHEN),
            );
            word = &word[hard_break..];
        }
        push_line(lines, current, max_lines)?;
        *current_cols = 0;
    }
}

fn wrap_text(text: &str, width: usize, max_lines: usize) -> Result<Vec<String>, ()> {
    let width = width.max(1);
    let mut lines = Vec::new();
    let mut current = String::new();
    let mut current_cols = 0;

    for word in text.split_whitespace() {
        if word.contains(SOFT_HYPHEN) {
            push_word_with_soft_hyphens(
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
            if !current.is_empty() {
                let candidate_len = current.len() + 1 + word.len();
                if candidate_len <= width {
                    current.push(' ');
                    current.push_str(word);
                    current_cols += 1 + cols;
                    return Ok(());
                }
                push_line(&mut lines, &mut current, max_lines)?;
            }
            current.push_str(word);
            current_cols = cols;
            Ok(())
        };

        let word_cols = word.chars().count();
        if word_cols <= width {
            push_word(word, word_cols)?;
        } else {
            let mut chunk = String::new();
            let mut count = 0usize;
            for character in word.chars() {
                chunk.push(character);
                count += 1;
                if count == width {
                    push_word(&chunk, count)?;
                    chunk.clear();
                    count = 0;
                }
            }
            if !chunk.is_empty() {
                push_word(&chunk, count)?;
            }
        }
    }

    if !current.is_empty() {
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

    fn text_rows(count: usize) -> Card {
        Card {
            id: "limits".to_string(),
            language: None,
            new_context: false,
            ordered: true,
            nodes: vec![Node::Paragraph(vec![InlineNode::Text("a ".repeat(count))])],
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
            nodes: vec![Node::Paragraph(vec![
                InlineNode::Text("Hello world from wap".to_string()),
                InlineNode::Link {
                    text: "Next page".to_string(),
                    href: "#next".to_string(),
                },
            ])],
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
                [Node::Paragraph(_), Node::Paragraph(_)]
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
            nodes: vec![Node::Paragraph(vec![
                InlineNode::Text("before".to_string()),
                InlineNode::Break,
                InlineNode::Text("after".to_string()),
            ])],
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
            nodes: vec![Node::Paragraph(vec![InlineNode::Text(
                "supercalifragilistic".to_string(),
            )])],
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
            nodes: vec![Node::Paragraph(vec![InlineNode::Link {
                text: "abcdefghijkl".to_string(),
                href: "#next".to_string(),
            }])],
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
            nodes: vec![Node::Paragraph(vec![
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
            ])],
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
