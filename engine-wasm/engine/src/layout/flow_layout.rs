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
    let words: Vec<&str> = text.split_whitespace().collect();
    if words.is_empty() {
        return Vec::new();
    }

    let mut lines = Vec::new();
    let mut current = String::new();

    for word in words {
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

#[cfg(test)]
mod tests {
    use super::layout_card;
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
        };

        let out = layout_card(&card, 10, 0);
        assert_eq!(out.links.len(), 1);
        assert!(out
            .render_list
            .draw
            .iter()
            .any(|cmd| matches!(cmd, crate::render::render_list::DrawCmd::Link { focused: true, .. })));
    }
}
