use crate::render::render_list::{DrawCmd, RenderList};
use crate::runtime::card::Card;
use crate::runtime::node::{InlineNode, Node};

#[derive(Clone, Debug, Default)]
pub struct LayoutResult {
    pub render_list: RenderList,
    pub links: Vec<String>,
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
                let mut parts = Vec::new();
                for entry in inline {
                    match entry {
                        InlineNode::Text(text) => parts.push((text.clone(), None)),
                        InlineNode::Link { text, href } => {
                            parts.push((text.clone(), Some(href.clone())));
                        }
                        InlineNode::Input {
                            name,
                            value,
                            is_password,
                        } => {
                            let display_value = if *is_password {
                                "*".repeat(value.chars().count())
                            } else {
                                value.clone()
                            };
                            let rendered = format!("[{name}: {display_value}]");
                            parts.push((rendered, Some(format!("input:{name}"))));
                        }
                    }
                }

                for (segment, href) in parts {
                    let chunks = wrap_text(&segment, viewport_cols);
                    let link_index = href.as_ref().map(|_| {
                        let idx = result.links.len();
                        if let Some(link_href) = &href {
                            result.links.push(link_href.clone());
                        }
                        idx
                    });

                    for chunk in chunks {
                        match &href {
                            Some(link_href) => {
                                result.render_list.draw.push(DrawCmd::Link {
                                    x: 0,
                                    y: line,
                                    text: chunk,
                                    focused: link_index == Some(focused_link_idx),
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
    use super::layout_card;
    use crate::render::render_list::DrawCmd;
    use crate::runtime::card::Card;
    use crate::runtime::node::{InlineNode, Node};

    #[test]
    fn wraps_and_marks_focus() {
        let card = Card {
            id: "home".to_string(),
            nodes: vec![Node::Paragraph(vec![
                InlineNode::Text("Hello world from wap".to_string()),
                InlineNode::Link {
                    text: "Next page".to_string(),
                    href: "#next".to_string(),
                },
            ])],
            accept_action: None,
            onenterforward_action: None,
            onenterbackward_action: None,
            ontimer_action: None,
            timer_value_ds: None,
        };

        let out = layout_card(&card, 10, 0);
        assert_eq!(out.links.len(), 1);
        assert!(out.render_list.draw.iter().any(|cmd| matches!(
            cmd,
            crate::render::render_list::DrawCmd::Link { focused: true, .. }
        )));
    }

    #[test]
    fn hard_wraps_single_token_longer_than_width() {
        let card = Card {
            id: "home".to_string(),
            nodes: vec![Node::Paragraph(vec![InlineNode::Text(
                "supercalifragilistic".to_string(),
            )])],
            accept_action: None,
            onenterforward_action: None,
            onenterbackward_action: None,
            ontimer_action: None,
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
            nodes: vec![Node::Paragraph(vec![InlineNode::Link {
                text: "abcdefghijkl".to_string(),
                href: "#next".to_string(),
            }])],
            accept_action: None,
            onenterforward_action: None,
            onenterbackward_action: None,
            ontimer_action: None,
            timer_value_ds: None,
        };

        let out = layout_card(&card, 4, 0);
        assert_eq!(out.links, vec!["#next".to_string()]);

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
            nodes: vec![Node::Paragraph(vec![
                InlineNode::Input {
                    name: "UserName".to_string(),
                    value: "AHMED".to_string(),
                    is_password: false,
                },
                InlineNode::Input {
                    name: "Password".to_string(),
                    value: "secret".to_string(),
                    is_password: true,
                },
            ])],
            accept_action: None,
            onenterforward_action: None,
            onenterbackward_action: None,
            ontimer_action: None,
            timer_value_ds: None,
        };

        let out = layout_card(&card, 40, 1);
        assert_eq!(
            out.links,
            vec!["input:UserName".to_string(), "input:Password".to_string()]
        );
        assert!(out
            .render_list
            .draw
            .iter()
            .any(|cmd| matches!(cmd, DrawCmd::Link { text, focused: false, href, .. } if text == "[UserName: AHMED]" && href == "input:UserName")));
        assert!(out.render_list.draw.iter().any(
            |cmd| matches!(cmd, DrawCmd::Link { text, focused: true, href, .. } if text == "[Password: ******]" && href == "input:Password")
        ));
    }
}
