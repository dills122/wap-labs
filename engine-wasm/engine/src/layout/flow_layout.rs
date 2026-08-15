use crate::render::frame::{EngineRenderError, EngineRenderLimits, EngineRenderResource};
use crate::render::render_list::{DrawCmd, RenderList};
use crate::runtime::card::Card;
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
    Input { control_id: String, name: String },
    Select(String),
}

impl FocusTarget {
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
            FocusTarget::Input { control_id, .. } => format!("input:{control_id}"),
            FocusTarget::Select(name) => format!("select:{name}"),
        }
    }

    pub fn frame_kind(&self) -> crate::EngineFocusTargetKind {
        match self {
            FocusTarget::Link(_) => crate::EngineFocusTargetKind::Link,
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
    Segment(String, Option<FocusTarget>),
    Break,
}

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
                let mut parts: Vec<ParagraphPart> = Vec::new();
                for entry in inline {
                    match entry {
                        InlineNode::Break => parts.push(ParagraphPart::Break),
                        InlineNode::Text(text) => {
                            parts.push(ParagraphPart::Segment(text.clone(), None));
                        }
                        InlineNode::Link { text, href } => {
                            parts.push(ParagraphPart::Segment(
                                text.clone(),
                                Some(FocusTarget::Link(href.clone())),
                            ));
                        }
                        InlineNode::Input {
                            control_id,
                            name,
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
                            let rendered = format!("[{name}: {display_value}]");
                            parts.push(ParagraphPart::Segment(
                                rendered,
                                Some(FocusTarget::Input {
                                    control_id: control_id.clone(),
                                    name: name.clone(),
                                }),
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
                                .map(|option| option.label.clone())
                                .collect::<Vec<_>>()
                                .join(if *multiple { "; " } else { "" });
                            let label = title
                                .clone()
                                .or_else(|| name.clone())
                                .or_else(|| iname.clone())
                                .unwrap_or_else(|| control_id.clone());
                            let rendered = format!("[{label}: {selected}]");
                            // Selects are looked up by `control_id` everywhere downstream
                            // (WML-204 select semantics allow duplicate/absent `name`), so
                            // the focus target must carry `control_id`, not `name`.
                            parts.push(ParagraphPart::Segment(
                                rendered,
                                Some(FocusTarget::Select(control_id.clone())),
                            ));
                        }
                    }
                }

                for part in parts {
                    let (segment, target) = match part {
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
                        ParagraphPart::Segment(segment, target) => (segment, target),
                    };

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
                        wrap_text(&segment, viewport_cols, remaining_chunks).map_err(|_| {
                            next_output_error(
                                &limits,
                                row_count,
                                result.segments.len(),
                                remaining_chunks,
                            )
                        })?;
                    let focus_index = target.as_ref().map(|target| {
                        let idx = result.focus_targets.len();
                        result.focus_targets.push(target.clone());
                        idx
                    });
                    // Stringify once per segment, at the render-list boundary.
                    let href = target.as_ref().map(FocusTarget::to_render_href);

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

fn wrap_text(text: &str, width: usize, max_lines: usize) -> Result<Vec<String>, ()> {
    let width = width.max(1);
    let mut lines = Vec::new();
    let mut current = String::new();

    for word in text.split(|character: char| character.is_whitespace() && character != '\u{00a0}') {
        if word.is_empty() {
            continue;
        }
        for (part_index, (part, break_after)) in wrap_word(word, width).into_iter().enumerate() {
            let separator_width = usize::from(!current.is_empty() && part_index == 0);
            let candidate_width = current.chars().count() + separator_width + part.chars().count();
            if !current.is_empty() && candidate_width > width {
                push_wrapped_line(&mut lines, &mut current, max_lines)?;
            }
            if !current.is_empty() && part_index == 0 {
                current.push(' ');
            }
            current.push_str(&part);
            if break_after {
                push_wrapped_line(&mut lines, &mut current, max_lines)?;
            }
        }
    }

    if !current.is_empty() {
        push_wrapped_line(&mut lines, &mut current, max_lines)?;
    }

    Ok(lines)
}

fn push_wrapped_line(
    lines: &mut Vec<String>,
    current: &mut String,
    max_lines: usize,
) -> Result<(), ()> {
    if lines.len() >= max_lines {
        return Err(());
    }
    lines.push(std::mem::take(current));
    Ok(())
}

fn wrap_word(word: &str, width: usize) -> Vec<(String, bool)> {
    let mut remaining: Vec<char> = word.chars().collect();
    let mut parts = Vec::new();

    while visible_width(&remaining) > width {
        let mut visible = 0usize;
        let mut soft_break = None;
        for (index, character) in remaining.iter().enumerate() {
            if *character == '\u{00ad}' {
                if visible > 0 && visible < width {
                    soft_break = Some(index);
                }
            } else {
                visible += 1;
                if visible >= width {
                    break;
                }
            }
        }

        if let Some(index) = soft_break {
            let mut part = visible_text(&remaining[..index]);
            part.push('-');
            parts.push((part, true));
            remaining.drain(..=index);
            continue;
        }

        let mut visible = 0usize;
        let mut boundary = remaining.len();
        for (index, character) in remaining.iter().enumerate() {
            if *character != '\u{00ad}' {
                visible += 1;
            }
            if visible == width {
                boundary = index + 1;
                break;
            }
        }
        let original_boundary = boundary;
        while boundary > 1
            && (remaining.get(boundary - 1) == Some(&'\u{00a0}')
                || remaining.get(boundary) == Some(&'\u{00a0}'))
        {
            boundary -= 1;
        }
        if boundary == 0 {
            boundary = original_boundary;
        }
        let part = visible_text(&remaining[..boundary]);
        parts.push((part, true));
        remaining.drain(..boundary);
    }

    let final_part = visible_text(&remaining);
    if !final_part.is_empty() {
        parts.push((final_part, false));
    }
    parts
}

fn visible_width(characters: &[char]) -> usize {
    characters
        .iter()
        .filter(|character| **character != '\u{00ad}')
        .count()
}

fn visible_text(characters: &[char]) -> String {
    characters
        .iter()
        .filter(|character| **character != '\u{00ad}')
        .collect()
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
    fn wml_307_nonbreaking_space_is_not_an_inter_word_break_point() {
        assert_eq!(
            super::wrap_text("aa bb", 4, usize::MAX).expect("ordinary spaces should wrap"),
            vec!["aa", "bb"]
        );
        assert_eq!(
            super::wrap_text("aa\u{00a0}bb", 4, usize::MAX)
                .expect("non-breaking spaces should remain attached"),
            vec!["aa\u{00a0}b", "b"]
        );
    }

    #[test]
    fn wml_307_soft_hyphen_only_renders_when_selected_as_a_break() {
        assert_eq!(
            super::wrap_text("encyclo\u{00ad}pedia", 20, usize::MAX)
                .expect("unbroken soft hyphen should be ignored"),
            vec!["encyclopedia"]
        );
        assert_eq!(
            super::wrap_text("encyclo\u{00ad}pedia", 8, usize::MAX)
                .expect("soft hyphen should provide a discretionary break"),
            vec!["encyclo-", "pedia"]
        );
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
