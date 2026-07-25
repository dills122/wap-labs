use crate::runtime::input_mask::InputMask;
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
    let mut select_ordinal = 0usize;
    map_card_level_nodes(&card.children, &mut out, budget, 0, &mut select_ordinal)?;
    Ok(out)
}

fn map_card_level_nodes(
    nodes: &[XmlNode],
    out: &mut Vec<Node>,
    budget: &mut ParseBudget,
    depth: usize,
    select_ordinal: &mut usize,
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
                    let inline =
                        map_inline_nodes(&element.children, budget, depth + 1, select_ordinal)?;
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
                    let input_node = parse_input_inline_node(element)?;
                    out.push(Node::Paragraph(vec![input_node]));
                }
                "select" => {
                    if let Some(select_node) =
                        parse_select_inline_node(element, budget, depth + 1, select_ordinal)?
                    {
                        out.push(Node::Paragraph(vec![select_node]));
                    }
                }
                "fieldset" => {
                    validate_fieldset_element(element)?;
                    map_card_level_nodes(
                        &element.children,
                        out,
                        budget,
                        depth + 1,
                        select_ordinal,
                    )?;
                }
                "option" => {
                    return Err(
                        "Invalid <option>: must be contained by <select> or <optgroup>".to_string(),
                    )
                }
                "optgroup" => {
                    return Err(
                        "Invalid <optgroup>: must be contained by <select> or <optgroup>"
                            .to_string(),
                    )
                }
                _ => {
                    map_card_level_nodes(&element.children, out, budget, depth + 1, select_ordinal)?
                }
            },
        }
    }
    Ok(())
}

fn map_inline_nodes(
    nodes: &[XmlNode],
    budget: &mut ParseBudget,
    depth: usize,
    select_ordinal: &mut usize,
) -> Result<Vec<InlineNode>, String> {
    let mut out = Vec::new();
    let mut pending_text = String::new();
    map_inline_nodes_recursive(
        nodes,
        &mut pending_text,
        &mut out,
        budget,
        depth,
        select_ordinal,
    )?;
    flush_pending_inline_text(&mut pending_text, &mut out);
    Ok(out)
}

fn map_inline_nodes_recursive(
    nodes: &[XmlNode],
    pending_text: &mut String,
    out: &mut Vec<InlineNode>,
    budget: &mut ParseBudget,
    depth: usize,
    select_ordinal: &mut usize,
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
                    out.push(parse_input_inline_node(element)?);
                }
                "select" => {
                    flush_pending_inline_text(pending_text, out);
                    if let Some(select_node) =
                        parse_select_inline_node(element, budget, depth + 1, select_ordinal)?
                    {
                        out.push(select_node);
                    }
                }
                "fieldset" => {
                    validate_fieldset_element(element)?;
                    map_inline_nodes_recursive(
                        &element.children,
                        pending_text,
                        out,
                        budget,
                        depth + 1,
                        select_ordinal,
                    )?;
                }
                "option" => {
                    return Err(
                        "Invalid <option>: must be contained by <select> or <optgroup>".to_string(),
                    )
                }
                "optgroup" => {
                    return Err(
                        "Invalid <optgroup>: must be contained by <select> or <optgroup>"
                            .to_string(),
                    )
                }
                _ => map_inline_nodes_recursive(
                    &element.children,
                    pending_text,
                    out,
                    budget,
                    depth + 1,
                    select_ordinal,
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

fn parse_input_inline_node(element: &XmlElement) -> Result<InlineNode, String> {
    validate_allowed_attributes(
        element,
        &[
            "accesskey",
            "class",
            "emptyok",
            "format",
            "id",
            "maxlength",
            "name",
            "size",
            "tabindex",
            "title",
            "type",
            "value",
            "xml:lang",
        ],
    )?;
    if !element.children.is_empty() {
        return Err("Invalid <input>: element must be empty".to_string());
    }
    let name = element
        .attr("name")
        .ok_or_else(|| "Invalid <input>: missing required 'name' attribute".to_string())?;
    validate_nmtoken("input", "name", name)?;
    validate_optional_xml_name(element, "id")?;
    validate_optional_nmtoken(element, "xml:lang")?;
    validate_optional_enum(element, "type", &["text", "password"])?;
    validate_optional_enum(element, "emptyok", &["true", "false"])?;
    for attr in ["size", "maxlength", "tabindex"] {
        validate_optional_number(element, attr)?;
    }

    let name = name.to_string();
    let default_value = element.attr("value").map(normalize_text);
    let value = default_value.clone().unwrap_or_default();
    let is_password = element
        .attr("type")
        .map(|value| value == "password")
        .unwrap_or(false);
    let max_length = element
        .attr("maxlength")
        .map(|value| {
            value
                .parse::<u32>()
                .map(|value| value as usize)
                .map_err(|_| {
                    "Invalid <input>: attribute 'maxlength' exceeds supported range".to_string()
                })
        })
        .transpose()?;
    let mask = element
        .attr("format")
        .and_then(InputMask::parse)
        .unwrap_or_default();
    let empty_ok = element
        .attr("emptyok")
        .map(|value| value == "true")
        .unwrap_or_else(|| mask.allows_empty());
    Ok(InlineNode::Input {
        name,
        value,
        default_value,
        is_password,
        max_length,
        mask,
        empty_ok,
    })
}

fn parse_select_inline_node(
    element: &XmlElement,
    budget: &mut ParseBudget,
    depth: usize,
    select_ordinal: &mut usize,
) -> Result<Option<InlineNode>, String> {
    validate_allowed_attributes(
        element,
        &[
            "class", "id", "iname", "ivalue", "multiple", "name", "tabindex", "title", "value",
            "xml:lang",
        ],
    )?;
    validate_optional_xml_name(element, "id")?;
    for attr in ["name", "iname", "xml:lang"] {
        validate_optional_nmtoken(element, attr)?;
    }
    validate_optional_enum(element, "multiple", &["true", "false"])?;
    validate_optional_number(element, "tabindex")?;

    let title = {
        let value = normalize_text(element.attr("title").unwrap_or_default());
        if value.is_empty() {
            None
        } else {
            Some(value)
        }
    };

    let mut options = Vec::new();
    let choice_child_count =
        collect_select_options(element, "select", &mut options, budget, depth)?;
    if choice_child_count == 0 {
        return Err(
            "Invalid <select>: expected one or more <option> or <optgroup> children".to_string(),
        );
    }

    if options.is_empty() {
        return Ok(None);
    }
    *select_ordinal = select_ordinal.saturating_add(1);
    let name = element.attr("name").map(str::to_string);
    let iname = element.attr("iname").map(str::to_string);
    let control_id = name
        .clone()
        .or_else(|| iname.clone())
        .unwrap_or_else(|| format!("select-{}", *select_ordinal));

    Ok(Some(InlineNode::Select {
        control_id,
        name,
        iname,
        title,
        default_value: element.attr("value").map(str::to_string),
        default_index_value: element.attr("ivalue").map(str::to_string),
        multiple: element.attr("multiple") == Some("true"),
        options,
        selected_indices: Vec::new(),
    }))
}

fn collect_select_options(
    element: &XmlElement,
    container_name: &str,
    options: &mut Vec<SelectOption>,
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<usize, String> {
    budget.enter_scope(depth, "select option traversal")?;
    let mut choice_child_count = 0usize;
    for child in &element.children {
        budget.visit_node("select option traversal")?;
        match child {
            XmlNode::Text(text) if text.trim().is_empty() => {}
            XmlNode::Text(_) => {
                return Err(format!(
                    "Invalid <{container_name}>: text content is not allowed"
                ))
            }
            XmlNode::Element(child) if child.name == "option" => {
                choice_child_count = choice_child_count.saturating_add(1);
                validate_option_element(child)?;
                let label = normalize_text(
                    &child
                        .children
                        .iter()
                        .filter_map(|node| match node {
                            XmlNode::Text(text) => Some(text.as_str()),
                            XmlNode::Element(_) => None,
                        })
                        .collect::<String>(),
                );
                let value = child
                    .attr("value")
                    .map(normalize_text)
                    .unwrap_or_else(|| label.clone());
                options.push(SelectOption {
                    label,
                    value,
                    onpick: child.attr("onpick").map(str::to_string),
                });
            }
            XmlNode::Element(child) if child.name == "optgroup" => {
                choice_child_count = choice_child_count.saturating_add(1);
                validate_optgroup_element(child)?;
                collect_select_options(child, "optgroup", options, budget, depth + 1)?;
            }
            XmlNode::Element(child) => {
                return Err(format!(
                    "Invalid <{container_name}>: unexpected child <{}>",
                    child.name
                ))
            }
        }
    }
    Ok(choice_child_count)
}

fn validate_optgroup_element(element: &XmlElement) -> Result<(), String> {
    validate_allowed_attributes(element, &["class", "id", "title", "xml:lang"])?;
    validate_optional_xml_name(element, "id")?;
    validate_optional_nmtoken(element, "xml:lang")?;
    for child in &element.children {
        match child {
            XmlNode::Text(text) if text.trim().is_empty() => {}
            XmlNode::Text(_) => {
                return Err("Invalid <optgroup>: text content is not allowed".to_string())
            }
            XmlNode::Element(child) if child.name == "option" || child.name == "optgroup" => {}
            XmlNode::Element(child) => {
                return Err(format!(
                    "Invalid <optgroup>: unexpected child <{}>",
                    child.name
                ))
            }
        }
    }
    let choice_count = element
        .children
        .iter()
        .filter(|child| {
            matches!(
                child,
                XmlNode::Element(child) if child.name == "option" || child.name == "optgroup"
            )
        })
        .count();
    if choice_count == 0 {
        return Err(
            "Invalid <optgroup>: expected one or more <option> or <optgroup> children".to_string(),
        );
    }
    Ok(())
}

fn validate_fieldset_element(element: &XmlElement) -> Result<(), String> {
    validate_allowed_attributes(element, &["class", "id", "title", "xml:lang"])?;
    validate_optional_xml_name(element, "id")?;
    validate_optional_nmtoken(element, "xml:lang")
}

fn validate_option_element(element: &XmlElement) -> Result<(), String> {
    validate_allowed_attributes(
        element,
        &["class", "id", "onpick", "title", "value", "xml:lang"],
    )?;
    validate_optional_xml_name(element, "id")?;
    validate_optional_nmtoken(element, "xml:lang")?;

    for child in &element.children {
        if let XmlNode::Element(child) = child {
            if child.name != "onevent" {
                return Err(format!(
                    "Invalid <option>: unexpected child <{}>",
                    child.name
                ));
            }
        }
    }
    Ok(())
}

fn validate_allowed_attributes(element: &XmlElement, allowed: &[&str]) -> Result<(), String> {
    let mut unexpected = element
        .attrs
        .keys()
        .filter(|attr| !allowed.contains(&attr.as_str()))
        .collect::<Vec<_>>();
    unexpected.sort();
    if let Some(attr) = unexpected.first() {
        return Err(format!(
            "Invalid <{}>: unexpected attribute '{}'",
            element.name, attr
        ));
    }
    Ok(())
}

fn validate_optional_enum(
    element: &XmlElement,
    attr: &str,
    allowed: &[&str],
) -> Result<(), String> {
    let Some(value) = element.attr(attr) else {
        return Ok(());
    };
    if allowed.contains(&value) {
        return Ok(());
    }
    let expectation = allowed
        .iter()
        .map(|value| format!("'{value}'"))
        .collect::<Vec<_>>()
        .join(" or ");
    Err(format!(
        "Invalid <{}>: attribute '{attr}' must be {expectation}",
        element.name
    ))
}

fn validate_optional_number(element: &XmlElement, attr: &str) -> Result<(), String> {
    let Some(value) = element.attr(attr) else {
        return Ok(());
    };
    if !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit()) {
        return Ok(());
    }
    Err(format!(
        "Invalid <{}>: attribute '{attr}' must contain decimal digits",
        element.name
    ))
}

fn validate_optional_nmtoken(element: &XmlElement, attr: &str) -> Result<(), String> {
    let Some(value) = element.attr(attr) else {
        return Ok(());
    };
    validate_nmtoken(&element.name, attr, value)
}

fn validate_nmtoken(element_name: &str, attr: &str, value: &str) -> Result<(), String> {
    if !value.is_empty() && value.chars().all(is_xml_name_char) {
        return Ok(());
    }
    Err(format!(
        "Invalid <{element_name}>: attribute '{attr}' must be an XML NMTOKEN"
    ))
}

fn validate_optional_xml_name(element: &XmlElement, attr: &str) -> Result<(), String> {
    let Some(value) = element.attr(attr) else {
        return Ok(());
    };
    let mut chars = value.chars();
    if chars.next().is_some_and(is_xml_name_start_char) && chars.all(is_xml_name_char) {
        return Ok(());
    }
    Err(format!(
        "Invalid <{}>: attribute '{attr}' must be an XML Name",
        element.name
    ))
}

fn is_xml_name_start_char(ch: char) -> bool {
    matches!(
        ch,
        ':'
            | 'A'..='Z'
            | '_'
            | 'a'..='z'
            | '\u{C0}'..='\u{D6}'
            | '\u{D8}'..='\u{F6}'
            | '\u{F8}'..='\u{2FF}'
            | '\u{370}'..='\u{37D}'
            | '\u{37F}'..='\u{1FFF}'
            | '\u{200C}'..='\u{200D}'
            | '\u{2070}'..='\u{218F}'
            | '\u{2C00}'..='\u{2FEF}'
            | '\u{3001}'..='\u{D7FF}'
            | '\u{F900}'..='\u{FDCF}'
            | '\u{FDF0}'..='\u{FFFD}'
            | '\u{10000}'..='\u{EFFFF}'
    )
}

fn is_xml_name_char(ch: char) -> bool {
    is_xml_name_start_char(ch)
        || matches!(
            ch,
            '-' | '.'
                | '0'..='9'
                | '\u{B7}'
                | '\u{300}'..='\u{36F}'
                | '\u{203F}'..='\u{2040}'
        )
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
