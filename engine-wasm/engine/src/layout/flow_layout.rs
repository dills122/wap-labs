use crate::render::render_list::{DrawCmd, RenderList};
use crate::runtime::card::Card;
use crate::runtime::node::{InlineNode, Node};

#[derive(Clone, Debug, Default)]
pub struct LayoutResult {
    pub render_list: RenderList,
    pub focus_targets: Vec<FocusTarget>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum FocusTarget {
    Link(String),
    Input(String),
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
            FocusTarget::Input(name) => format!("input:{name}"),
            FocusTarget::Select(name) => format!("select:{name}"),
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

pub fn layout_card(card: &Card, viewport_cols: usize, focused_link_idx: usize) -> LayoutResult {
    let mut result = LayoutResult::default();
    let mut line = 0u32;

    for node in &card.nodes {
        match node {
            Node::Break => {
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
                                Some(FocusTarget::Input(name.clone())),
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
                            line += 1;
                            continue;
                        }
                        ParagraphPart::Segment(segment, target) => (segment, target),
                    };

                    let chunks = wrap_text(&segment, viewport_cols);
                    let focus_index = target.as_ref().map(|target| {
                        let idx = result.focus_targets.len();
                        result.focus_targets.push(target.clone());
                        idx
                    });
                    // Stringify once per segment, at the render-list boundary.
                    let href = target.as_ref().map(FocusTarget::to_render_href);

                    for chunk in chunks {
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
                        line += 1;
                    }
                }
            }
        }
    }

    result
}

fn wrap_text(text: &str, width: usize) -> Vec<String> {
    let width = width.max(1);
    let words: Vec<String> = text
        .split_whitespace()
        .flat_map(|word| split_long_word(word, width))
        .collect();
    if words.is_empty() {
        return Vec::new();
    }

    let mut lines = Vec::new();
    let mut current = String::new();

    for word in &words {
        if current.is_empty() {
            current.push_str(word);
            continue;
        }

        let candidate_len = current.len() + 1 + word.len();
        if candidate_len <= width {
            current.push(' ');
            current.push_str(word);
        } else {
            lines.push(current);
            current = word.to_string();
        }
    }

    if !current.is_empty() {
        lines.push(current);
    }

    lines
}

fn split_long_word(word: &str, width: usize) -> Vec<String> {
    if word.chars().count() <= width {
        return vec![word.to_string()];
    }

    let mut out = Vec::new();
    let mut current = String::new();
    let mut count = 0usize;

    for ch in word.chars() {
        current.push(ch);
        count += 1;
        if count == width {
            out.push(current);
            current = String::new();
            count = 0;
        }
    }

    if !current.is_empty() {
        out.push(current);
    }

    out
}

#[cfg(test)]
mod tests {
    use super::{layout_card, FocusTarget};
    use crate::render::render_list::DrawCmd;
    use crate::runtime::card::Card;
    use crate::runtime::node::{InlineNode, Node};

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
            timer_value_ds: None,
        };

        let out = layout_card(&card, 10, 0);
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
            timer_value_ds: None,
        };

        let out = layout_card(&card, 20, 0);
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
            timer_value_ds: None,
        };

        let out = layout_card(&card, 5, 0);
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
            timer_value_ds: None,
        };

        let out = layout_card(&card, 4, 0);
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
                    name: "UserName".to_string(),
                    value: "AHMED".to_string(),
                    default_value: Some("AHMED".to_string()),
                    is_password: false,
                    max_length: None,
                    mask: Default::default(),
                    empty_ok: true,
                },
                InlineNode::Input {
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
            timer_value_ds: None,
        };

        let out = layout_card(&card, 40, 1);
        assert_eq!(
            out.focus_targets,
            vec![
                FocusTarget::Input("UserName".to_string()),
                FocusTarget::Input("Password".to_string()),
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
