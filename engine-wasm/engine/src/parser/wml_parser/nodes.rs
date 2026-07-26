use crate::runtime::card::{CardPostField, CardTaskAction};
use crate::runtime::input_mask::InputMask;
use crate::runtime::node::{InlineNode, Node, SelectOption};
use crate::runtime::variable::{decode_literal_dollars, validate as validate_vdata};
use std::collections::HashMap;

use super::actions::parse_first_task_action_xml;
use super::xml::{normalize_text, XmlElement, XmlNode};
use super::ParseBudget;

#[derive(Default)]
struct ControlIdAllocator {
    input_counts: HashMap<String, usize>,
    select_counts: HashMap<String, usize>,
    anonymous_select_ordinal: usize,
}

impl ControlIdAllocator {
    fn input(&mut self, name: &str) -> String {
        unique_control_id(&mut self.input_counts, name.to_string())
    }

    fn select(&mut self, preferred: Option<&str>) -> String {
        let base = preferred.map(str::to_string).unwrap_or_else(|| {
            self.anonymous_select_ordinal = self.anonymous_select_ordinal.saturating_add(1);
            format!("select-{}", self.anonymous_select_ordinal)
        });
        unique_control_id(&mut self.select_counts, base)
    }
}

fn unique_control_id(counts: &mut HashMap<String, usize>, base: String) -> String {
    let count = counts.entry(base.clone()).or_default();
    *count = count.saturating_add(1);
    if *count == 1 {
        base
    } else {
        format!("{base}#{}", *count)
    }
}

pub(super) fn parse_card_nodes_xml(
    card: &XmlElement,
    budget: &mut ParseBudget,
) -> Result<Vec<Node>, String> {
    let mut out = Vec::new();
    let mut control_ids = ControlIdAllocator::default();
    map_card_level_nodes(&card.children, &mut out, budget, 0, &mut control_ids)?;
    Ok(out)
}

/// What a tag from the shared inline tag set contributed to its walker.
///
/// The two walkers place the same inline content in different output models
/// (`Node` for card level, `InlineNode` for paragraph level), so the shared
/// dispatch reports *what* was produced and each walker decides *where* it
/// goes.
enum InlineTagOutcome {
    /// A line break, rendered differently by each walker.
    Break,
    /// A concrete inline node to emit.
    Node(InlineNode),
    /// A recognized tag that intentionally contributes nothing (for example an
    /// `<a>` without an `href`, or a `<select>` without a usable name).
    Skip,
}

/// Handles the tags that both walkers treat identically (`a`, `br`, `input`,
/// `select`, `option`).
///
/// Returns `Ok(None)` when `element` is not part of the shared set, leaving the
/// caller to apply its own walker-specific handling (`<p>` at card level, or
/// recursion into an unknown wrapper). Keeping this in one place means a new
/// inline tag only has to be added here rather than in both walkers.
///
/// `child_depth` is the traversal depth used for `element`'s children, so the
/// parse budget keeps counting nesting exactly as the callers do.
fn map_shared_inline_tag(
    element: &XmlElement,
    budget: &mut ParseBudget,
    child_depth: usize,
    control_ids: &mut ControlIdAllocator,
) -> Result<Option<InlineTagOutcome>, String> {
    let outcome = match element.name.as_str() {
        "a" => parse_link_inline_node(element, budget, child_depth)?
            .map_or(InlineTagOutcome::Skip, InlineTagOutcome::Node),
        "br" => InlineTagOutcome::Break,
        "input" => InlineTagOutcome::Node(parse_input_inline_node(element, control_ids)?),
        "select" => parse_select_inline_node(element, budget, child_depth, control_ids)?
            .map_or(InlineTagOutcome::Skip, InlineTagOutcome::Node),
        "option" => {
            return Err("Invalid <option>: must be contained by <select> or <optgroup>".to_string())
        }
        _ => return Ok(None),
    };
    Ok(Some(outcome))
}

fn map_card_level_nodes(
    nodes: &[XmlNode],
    out: &mut Vec<Node>,
    budget: &mut ParseBudget,
    depth: usize,
    control_ids: &mut ControlIdAllocator,
) -> Result<(), String> {
    budget.enter_scope(depth, "card-node traversal")?;
    for node in nodes {
        budget.visit_node("card-node traversal")?;
        match node {
            XmlNode::Text(text) => {
                validate_text_variables(text)?;
                let text = normalize_text(text);
                if !text.is_empty() {
                    out.push(Node::Paragraph(vec![InlineNode::Text(text)]));
                }
            }
            XmlNode::Element(element) => {
                if let Some(outcome) =
                    map_shared_inline_tag(element, budget, depth + 1, control_ids)?
                {
                    match outcome {
                        InlineTagOutcome::Break => out.push(Node::Break),
                        InlineTagOutcome::Node(inline) => out.push(Node::Paragraph(vec![inline])),
                        InlineTagOutcome::Skip => {}
                    }
                    continue;
                }

                if element.name == "p" {
                    let inline =
                        map_inline_nodes(&element.children, budget, depth + 1, control_ids)?;
                    if !inline.is_empty() {
                        out.push(Node::Paragraph(inline));
                    }
                    continue;
                }

                if element.name == "fieldset" {
                    validate_fieldset_element(element)?;
                    map_card_level_nodes(&element.children, out, budget, depth + 1, control_ids)?;
                    continue;
                }

                if element.name == "optgroup" {
                    return Err(
                        "Invalid <optgroup>: must be contained by <select> or <optgroup>"
                            .to_string(),
                    );
                }

                budget.note_alternate_dtd_unknown(&element.name);
                map_card_level_nodes(&element.children, out, budget, depth + 1, control_ids)?;
            }
        }
    }
    Ok(())
}

fn map_inline_nodes(
    nodes: &[XmlNode],
    budget: &mut ParseBudget,
    depth: usize,
    control_ids: &mut ControlIdAllocator,
) -> Result<Vec<InlineNode>, String> {
    let mut out = Vec::new();
    let mut pending_text = String::new();
    map_inline_nodes_recursive(
        nodes,
        &mut pending_text,
        &mut out,
        budget,
        depth,
        control_ids,
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
    control_ids: &mut ControlIdAllocator,
) -> Result<(), String> {
    budget.enter_scope(depth, "inline-node traversal")?;
    for node in nodes {
        budget.visit_node("inline-node traversal")?;
        match node {
            XmlNode::Text(text) => {
                validate_text_variables(text)?;
                pending_text.push_str(text);
            }
            XmlNode::Element(element) => {
                if let Some(outcome) =
                    map_shared_inline_tag(element, budget, depth + 1, control_ids)?
                {
                    // Text accumulated before this tag has to be emitted first
                    // so inline ordering is preserved.
                    flush_pending_inline_text(pending_text, out);
                    match outcome {
                        InlineTagOutcome::Break => out.push(InlineNode::Break),
                        InlineTagOutcome::Node(inline) => out.push(inline),
                        InlineTagOutcome::Skip => {}
                    }
                    continue;
                }

                if element.name == "fieldset" {
                    validate_fieldset_element(element)?;
                    map_inline_nodes_recursive(
                        &element.children,
                        pending_text,
                        out,
                        budget,
                        depth + 1,
                        control_ids,
                    )?;
                    continue;
                }

                if element.name == "optgroup" {
                    return Err(
                        "Invalid <optgroup>: must be contained by <select> or <optgroup>"
                            .to_string(),
                    );
                }

                budget.note_alternate_dtd_unknown(&element.name);
                map_inline_nodes_recursive(
                    &element.children,
                    pending_text,
                    out,
                    budget,
                    depth + 1,
                    control_ids,
                )?;
            }
        }
    }
    Ok(())
}

fn parse_link_inline_node(
    element: &XmlElement,
    budget: &mut ParseBudget,
    child_depth: usize,
) -> Result<Option<InlineNode>, String> {
    let href = element.attr("href").unwrap_or_default().to_string();
    if href.is_empty() {
        return Ok(None);
    }
    let text = normalize_text(&inline_text_content(
        &element.children,
        budget,
        child_depth,
    )?);
    let text = if text.is_empty() { href.clone() } else { text };
    Ok(Some(InlineNode::Link { text, href }))
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

fn parse_input_inline_node(
    element: &XmlElement,
    control_ids: &mut ControlIdAllocator,
) -> Result<InlineNode, String> {
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
    validate_vdata_attributes(element, &["accesskey", "title", "value"])?;
    validate_literal_attributes(element, &["class", "format"])?;
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
    let control_id = control_ids.input(&name);
    let default_value = element.attr("value").map(str::to_string);
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
    let format = element
        .attr("format")
        .map(decode_literal_dollars)
        .transpose()?;
    let mask = format
        .as_deref()
        .and_then(InputMask::parse)
        .unwrap_or_default();
    let empty_ok = element
        .attr("emptyok")
        .map(|value| value == "true")
        .unwrap_or_else(|| mask.allows_empty());
    Ok(InlineNode::Input {
        control_id,
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
    control_ids: &mut ControlIdAllocator,
) -> Result<Option<InlineNode>, String> {
    validate_allowed_attributes(
        element,
        &[
            "class", "id", "iname", "ivalue", "multiple", "name", "tabindex", "title", "value",
            "xml:lang",
        ],
    )?;
    validate_vdata_attributes(element, &["ivalue", "title", "value"])?;
    validate_literal_attributes(element, &["class"])?;
    validate_optional_xml_name(element, "id")?;
    for attr in ["name", "iname", "xml:lang"] {
        validate_optional_nmtoken(element, attr)?;
    }
    validate_optional_enum(element, "multiple", &["true", "false"])?;
    validate_optional_number(element, "tabindex")?;

    let title = element
        .attr("title")
        .filter(|value| !value.is_empty())
        .map(str::to_string);

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
    let name = element.attr("name").map(str::to_string);
    let iname = element.attr("iname").map(str::to_string);
    let control_id = control_ids.select(name.as_deref().or(iname.as_deref()));

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
                let value = child.attr("value").unwrap_or_default().to_string();
                let onpick = parse_option_onpick_action(child, budget, depth + 1)?;
                options.push(SelectOption {
                    label,
                    value,
                    onpick,
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

fn parse_option_onpick_action(
    option: &XmlElement,
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<Option<CardTaskAction>, String> {
    let mut action = option.attr("onpick").map(|href| CardTaskAction::Go {
        href: href.to_string(),
        method: None,
        post_fields: Vec::<CardPostField>::new(),
    });
    for child in &option.children {
        let XmlNode::Element(onevent) = child else {
            continue;
        };
        if onevent.name != "onevent"
            || !onevent
                .attr("type")
                .is_some_and(|event_type| event_type.eq_ignore_ascii_case("onpick"))
        {
            continue;
        }
        if action.is_some() {
            return Err("Invalid <option>: conflicting 'onpick' event bindings".to_string());
        }
        action = parse_first_task_action_xml(&onevent.children, budget, depth)?;
    }
    Ok(action)
}

fn validate_optgroup_element(element: &XmlElement) -> Result<(), String> {
    validate_allowed_attributes(element, &["class", "id", "title", "xml:lang"])?;
    validate_vdata_attributes(element, &["title"])?;
    validate_literal_attributes(element, &["class"])?;
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
    validate_vdata_attributes(element, &["title"])?;
    validate_literal_attributes(element, &["class"])?;
    validate_optional_xml_name(element, "id")?;
    validate_optional_nmtoken(element, "xml:lang")?;

    let mut has_content = false;
    for child in &element.children {
        match child {
            XmlNode::Text(text) if text.trim().is_empty() => {}
            XmlNode::Text(_) => has_content = true,
            XmlNode::Element(child)
                if matches!(
                    child.name.as_str(),
                    "a" | "anchor"
                        | "b"
                        | "big"
                        | "br"
                        | "do"
                        | "em"
                        | "fieldset"
                        | "i"
                        | "img"
                        | "input"
                        | "select"
                        | "small"
                        | "strong"
                        | "table"
                        | "u"
                ) =>
            {
                has_content = true;
            }
            XmlNode::Element(child) => {
                return Err(format!(
                    "Invalid <fieldset>: unexpected child <{}>",
                    child.name
                ));
            }
        }
    }

    if !has_content {
        return Err("Invalid <fieldset>: element must not be empty".to_string());
    }
    Ok(())
}

fn validate_option_element(element: &XmlElement) -> Result<(), String> {
    validate_allowed_attributes(
        element,
        &["class", "id", "onpick", "title", "value", "xml:lang"],
    )?;
    validate_vdata_attributes(element, &["onpick", "title", "value"])?;
    validate_literal_attributes(element, &["class"])?;
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

fn validate_vdata_attributes(element: &XmlElement, attrs: &[&str]) -> Result<(), String> {
    for attr in attrs {
        let Some(value) = element.attr(attr) else {
            continue;
        };
        validate_vdata(value).map_err(|error| {
            format!(
                "Invalid <{}>: attribute '{attr}' contains an invalid variable reference: {error}",
                element.name
            )
        })?;
    }
    Ok(())
}

fn validate_literal_attributes(element: &XmlElement, attrs: &[&str]) -> Result<(), String> {
    for attr in attrs {
        let Some(value) = element.attr(attr) else {
            continue;
        };
        crate::runtime::variable::validate_literal_only(value).map_err(|error| {
            format!(
                "Invalid <{}>: attribute '{attr}' contains an invalid variable reference: {error}",
                element.name
            )
        })?;
    }
    Ok(())
}

fn validate_text_variables(text: &str) -> Result<(), String> {
    validate_vdata(text).map_err(|error| format!("Invalid card text variable reference: {error}"))
}

pub(super) fn validate_allowed_attributes(
    element: &XmlElement,
    allowed: &[&str],
) -> Result<(), String> {
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

pub(super) fn validate_optional_enum(
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
    if is_decimal_number(value) {
        return Ok(());
    }
    Err(format!(
        "Invalid <{}>: attribute '{attr}' must contain decimal digits",
        element.name
    ))
}

pub(super) fn is_decimal_number(value: &str) -> bool {
    !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit())
}

fn validate_optional_nmtoken(element: &XmlElement, attr: &str) -> Result<(), String> {
    let Some(value) = element.attr(attr) else {
        return Ok(());
    };
    validate_nmtoken(&element.name, attr, value)
}

pub(super) fn validate_nmtoken(element_name: &str, attr: &str, value: &str) -> Result<(), String> {
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
    if is_xml_name(value) {
        return Ok(());
    }
    Err(format!(
        "Invalid <{}>: attribute '{attr}' must be an XML Name",
        element.name
    ))
}

pub(super) fn is_xml_name(value: &str) -> bool {
    let mut chars = value.chars();
    chars.next().is_some_and(is_xml_name_start_char) && chars.all(is_xml_name_char)
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
            XmlNode::Text(text) => {
                validate_text_variables(text)?;
                out.push_str(text);
            }
            XmlNode::Element(element) => {
                out.push_str(&inline_text_content(&element.children, budget, depth + 1)?)
            }
        }
    }
    Ok(out)
}
