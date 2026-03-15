use crate::runtime::node::{InlineNode, Node, SelectOption};

#[cfg(test)]
use super::xml::{extract_attr, starts_with_tag_at};
use super::xml::{normalize_text, XmlElement, XmlNode};
use super::ParseBudget;

pub(super) fn parse_card_nodes_xml(
    card: &XmlElement,
    budget: &mut ParseBudget,
) -> Result<Vec<Node>, String> {
    let mut out = Vec::new();
    map_card_level_nodes(&card.children, &mut out, budget, 0)?;
    Ok(out)
}

fn map_card_level_nodes(
    nodes: &[XmlNode],
    out: &mut Vec<Node>,
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<(), String> {
    budget.enter_scope(depth, "card-node traversal")?;
    for node in nodes {
        budget.visit_node("card-node traversal")?;
        match node {
            XmlNode::Text(text) => {
                let text = normalize_text(text);
                if !text.is_empty() {
                    out.push(Node::Paragraph(vec![InlineNode::Text(text)]));
                }
            }
            XmlNode::Element(element) => match element.name.as_str() {
                "br" => out.push(Node::Break),
                "p" => {
                    let inline = map_inline_nodes(&element.children, budget, depth + 1)?;
                    if !inline.is_empty() {
                        out.push(Node::Paragraph(inline));
                    }
                }
                "a" => {
                    let href = element.attr("href").unwrap_or_default().to_string();
                    if !href.is_empty() {
                        let text = normalize_text(&inline_text_content(
                            &element.children,
                            budget,
                            depth + 1,
                        )?);
                        let text = if text.is_empty() { href.clone() } else { text };
                        out.push(Node::Paragraph(vec![InlineNode::Link { text, href }]));
                    }
                }
                "input" => {
                    if let Some(input_node) = parse_input_inline_node(element) {
                        out.push(Node::Paragraph(vec![input_node]));
                    }
                }
                "select" => {
                    if let Some(select_node) = parse_select_inline_node(element, budget, depth + 1)?
                    {
                        out.push(Node::Paragraph(vec![select_node]));
                    }
                }
                _ => map_card_level_nodes(&element.children, out, budget, depth + 1)?,
            },
        }
    }
    Ok(())
}

fn map_inline_nodes(
    nodes: &[XmlNode],
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<Vec<InlineNode>, String> {
    let mut out = Vec::new();
    let mut pending_text = String::new();
    map_inline_nodes_recursive(nodes, &mut pending_text, &mut out, budget, depth)?;
    flush_pending_inline_text(&mut pending_text, &mut out);
    Ok(out)
}

fn map_inline_nodes_recursive(
    nodes: &[XmlNode],
    pending_text: &mut String,
    out: &mut Vec<InlineNode>,
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<(), String> {
    budget.enter_scope(depth, "inline-node traversal")?;
    for node in nodes {
        budget.visit_node("inline-node traversal")?;
        match node {
            XmlNode::Text(text) => pending_text.push_str(text),
            XmlNode::Element(element) => match element.name.as_str() {
                "a" => {
                    flush_pending_inline_text(pending_text, out);
                    let href = element.attr("href").unwrap_or_default().to_string();
                    if !href.is_empty() {
                        let text = normalize_text(&inline_text_content(
                            &element.children,
                            budget,
                            depth + 1,
                        )?);
                        out.push(InlineNode::Link {
                            text: if text.is_empty() { href.clone() } else { text },
                            href,
                        });
                    }
                }
                "br" => {
                    flush_pending_inline_text(pending_text, out);
                    out.push(InlineNode::Text(" ".to_string()));
                }
                "input" => {
                    flush_pending_inline_text(pending_text, out);
                    if let Some(input_node) = parse_input_inline_node(element) {
                        out.push(input_node);
                    }
                }
                "select" => {
                    flush_pending_inline_text(pending_text, out);
                    if let Some(select_node) = parse_select_inline_node(element, budget, depth + 1)?
                    {
                        out.push(select_node);
                    }
                }
                _ => map_inline_nodes_recursive(
                    &element.children,
                    pending_text,
                    out,
                    budget,
                    depth + 1,
                )?,
            },
        }
    }
    Ok(())
}

fn flush_pending_inline_text(pending_text: &mut String, out: &mut Vec<InlineNode>) {
    if pending_text.is_empty() {
        return;
    }
    let normalized = normalize_text(pending_text);
    pending_text.clear();
    if !normalized.is_empty() {
        out.push(InlineNode::Text(normalized));
    }
}

fn parse_input_inline_node(element: &XmlElement) -> Option<InlineNode> {
    let name = normalize_text(element.attr("name").unwrap_or_default());
    if name.is_empty() {
        return None;
    }
    let value = normalize_text(element.attr("value").unwrap_or_default());
    let is_password = element
        .attr("type")
        .map(|value| value.eq_ignore_ascii_case("password"))
        .unwrap_or(false);
    let max_length = element
        .attr("maxlength")
        .and_then(|value| value.parse::<usize>().ok())
        .filter(|value| *value > 0);
    Some(InlineNode::Input {
        name,
        value,
        is_password,
        max_length,
    })
}

fn parse_select_inline_node(
    element: &XmlElement,
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<Option<InlineNode>, String> {
    let name = normalize_text(element.attr("name").unwrap_or_default());
    if name.is_empty() {
        return Ok(None);
    }

    let title = {
        let value = normalize_text(element.attr("title").unwrap_or_default());
        if value.is_empty() {
            None
        } else {
            Some(value)
        }
    };

    let mut options = Vec::new();
    let mut selected_index = None;

    budget.enter_scope(depth, "select option traversal")?;
    for child in &element.children {
        budget.visit_node("select option traversal")?;
        let XmlNode::Element(option) = child else {
            continue;
        };
        if option.name != "option" {
            continue;
        }

        let label = normalize_text(&inline_text_content(&option.children, budget, depth + 1)?);
        if label.is_empty() {
            continue;
        }
        let value = {
            let explicit = normalize_text(option.attr("value").unwrap_or_default());
            if explicit.is_empty() {
                label.clone()
            } else {
                explicit
            }
        };
        let is_selected = option
            .attr("selected")
            .map(|value| {
                let value = value.trim();
                value.is_empty()
                    || value.eq_ignore_ascii_case("true")
                    || value.eq_ignore_ascii_case("selected")
            })
            .unwrap_or(false);
        let idx = options.len();
        options.push(SelectOption { label, value });
        if is_selected && selected_index.is_none() {
            selected_index = Some(idx);
        }
    }

    if options.is_empty() {
        return Ok(None);
    }

    Ok(Some(InlineNode::Select {
        name,
        title,
        options,
        selected_index: selected_index.unwrap_or(0),
    }))
}

fn inline_text_content(
    nodes: &[XmlNode],
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<String, String> {
    budget.enter_scope(depth, "inline text extraction")?;
    let mut out = String::new();
    for node in nodes {
        budget.visit_node("inline text extraction")?;
        match node {
            XmlNode::Text(text) => out.push_str(text),
            XmlNode::Element(element) => {
                out.push_str(&inline_text_content(&element.children, budget, depth + 1)?)
            }
        }
    }
    Ok(out)
}

#[cfg(test)]
pub(super) fn parse_card_nodes(body: &str) -> Result<Vec<Node>, String> {
    let mut nodes = Vec::new();
    let mut cursor = 0usize;

    while cursor < body.len() {
        if let Some(start) = body[cursor..].find('<') {
            let tag_start = cursor + start;

            if tag_start > cursor {
                let text = normalize_text(&body[cursor..tag_start]);
                if !text.is_empty() {
                    nodes.push(Node::Paragraph(vec![InlineNode::Text(text)]));
                }
            }

            if starts_with_tag_at(body, tag_start, "br") {
                let end = body[tag_start..]
                    .find('>')
                    .map(|idx| tag_start + idx)
                    .ok_or_else(|| "Malformed <br> tag".to_string())?;
                nodes.push(Node::Break);
                cursor = end + 1;
                continue;
            }

            if starts_with_tag_at(body, tag_start, "p") {
                let open_end = body[tag_start..]
                    .find('>')
                    .map(|idx| tag_start + idx)
                    .ok_or_else(|| "Malformed <p> opening tag".to_string())?;
                let close_start = body[open_end + 1..]
                    .find("</p>")
                    .map(|idx| open_end + 1 + idx)
                    .ok_or_else(|| "Missing closing </p> tag".to_string())?;

                let content = &body[open_end + 1..close_start];
                let inline = parse_inline_nodes(content)?;
                if !inline.is_empty() {
                    nodes.push(Node::Paragraph(inline));
                }
                cursor = close_start + "</p>".len();
                continue;
            }

            if starts_with_tag_at(body, tag_start, "a") {
                let open_end = body[tag_start..]
                    .find('>')
                    .map(|idx| tag_start + idx)
                    .ok_or_else(|| "Malformed <a> opening tag".to_string())?;
                let open_tag = &body[tag_start..=open_end];
                let href = extract_attr(open_tag, "href").unwrap_or_default();
                let close_start = body[open_end + 1..]
                    .find("</a>")
                    .map(|idx| open_end + 1 + idx)
                    .ok_or_else(|| "Missing closing </a> tag".to_string())?;

                let link_text_raw = &body[open_end + 1..close_start];
                let link_text = normalize_text(link_text_raw);
                if !href.is_empty() {
                    let text = if link_text.is_empty() {
                        href.clone()
                    } else {
                        link_text
                    };
                    nodes.push(Node::Paragraph(vec![InlineNode::Link { text, href }]));
                }
                cursor = close_start + "</a>".len();
                continue;
            }

            let end = body[tag_start..]
                .find('>')
                .map(|idx| tag_start + idx)
                .ok_or_else(|| "Malformed tag".to_string())?;
            cursor = end + 1;
        } else {
            let text = normalize_text(&body[cursor..]);
            if !text.is_empty() {
                nodes.push(Node::Paragraph(vec![InlineNode::Text(text)]));
            }
            break;
        }
    }

    Ok(nodes)
}

#[cfg(test)]
pub(super) fn parse_inline_nodes(content: &str) -> Result<Vec<InlineNode>, String> {
    let mut nodes = Vec::new();
    let mut cursor = 0usize;

    while cursor < content.len() {
        if let Some(start) = content[cursor..].find('<') {
            let tag_start = cursor + start;
            if tag_start > cursor {
                let text = normalize_text(&content[cursor..tag_start]);
                if !text.is_empty() {
                    nodes.push(InlineNode::Text(text));
                }
            }

            if starts_with_tag_at(content, tag_start, "a") {
                let open_end = content[tag_start..]
                    .find('>')
                    .map(|idx| tag_start + idx)
                    .ok_or_else(|| "Malformed inline <a> opening tag".to_string())?;
                let open_tag = &content[tag_start..=open_end];
                let href = extract_attr(open_tag, "href").unwrap_or_default();
                let close_start = content[open_end + 1..]
                    .find("</a>")
                    .map(|idx| open_end + 1 + idx)
                    .ok_or_else(|| "Missing closing inline </a> tag".to_string())?;
                let raw_text = &content[open_end + 1..close_start];
                let text = normalize_text(raw_text);
                if !href.is_empty() {
                    nodes.push(InlineNode::Link {
                        text: if text.is_empty() { href.clone() } else { text },
                        href,
                    });
                }
                cursor = close_start + "</a>".len();
                continue;
            }

            if starts_with_tag_at(content, tag_start, "br") {
                let end = content[tag_start..]
                    .find('>')
                    .map(|idx| tag_start + idx)
                    .ok_or_else(|| "Malformed inline <br> tag".to_string())?;
                nodes.push(InlineNode::Text(" ".to_string()));
                cursor = end + 1;
                continue;
            }

            let end = content[tag_start..]
                .find('>')
                .map(|idx| tag_start + idx)
                .ok_or_else(|| "Malformed inline tag".to_string())?;
            cursor = end + 1;
        } else {
            let text = normalize_text(&content[cursor..]);
            if !text.is_empty() {
                nodes.push(InlineNode::Text(text));
            }
            break;
        }
    }

    Ok(nodes)
}
