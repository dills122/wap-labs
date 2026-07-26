use std::collections::HashSet;

use crate::runtime::card::{
    CardEventBinding, CardEventBindingKind, CardPostField, CardSetVar, CardTaskAction, CardTimer,
};

use super::nodes::validate_nmtoken;
use super::xml::{XmlElement, XmlNode};
use super::ParseBudget;

const CARD_EVENT_TYPES: [&str; 3] = ["onenterforward", "onenterbackward", "ontimer"];

pub(super) fn parse_card_bindings(
    card: &XmlElement,
    budget: &mut ParseBudget,
) -> Result<(Vec<CardEventBinding>, Option<CardTimer>), String> {
    let mut elements = Vec::new();
    collect_card_action_elements(&card.children, &mut elements, budget, 0)?;
    let mut bindings = Vec::new();
    let mut do_names = HashSet::new();
    let mut event_types = HashSet::new();
    parse_intrinsic_attributes(card, "card", &mut bindings, &mut event_types)?;
    for (depth, element) in &elements {
        match element.name.as_str() {
            "do" => push_do_binding(element, "card", &mut bindings, &mut do_names, budget)?,
            "onevent" if *depth == 0 => {
                push_onevent_binding(element, "card", &mut bindings, &mut event_types, budget)?
            }
            _ => {}
        }
    }
    Ok((bindings, parse_timer_xml(&elements, budget)))
}

pub(super) fn parse_template_bindings(
    template: &XmlElement,
    budget: &mut ParseBudget,
) -> Result<Vec<CardEventBinding>, String> {
    let mut bindings = Vec::new();
    let mut do_names = HashSet::new();
    let mut event_types = HashSet::new();
    parse_intrinsic_attributes(template, "template", &mut bindings, &mut event_types)?;

    for node in &template.children {
        match node {
            XmlNode::Text(text) if text.trim().is_empty() => {}
            XmlNode::Text(_) => {
                return Err("Invalid <template>: text content is not allowed".to_string())
            }
            XmlNode::Element(element) => {
                budget.visit_node("template binding traversal")?;
                match element.name.as_str() {
                    "do" => {
                        push_do_binding(element, "template", &mut bindings, &mut do_names, budget)?
                    }
                    "onevent" => push_onevent_binding(
                        element,
                        "template",
                        &mut bindings,
                        &mut event_types,
                        budget,
                    )?,
                    _ => return Err(
                        "Invalid <template>: only <do> and <onevent> child elements are allowed"
                            .to_string(),
                    ),
                }
            }
        }
    }
    Ok(bindings)
}

fn collect_card_action_elements<'a>(
    nodes: &'a [XmlNode],
    out: &mut Vec<(usize, &'a XmlElement)>,
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<(), String> {
    budget.enter_scope(depth, "action element traversal")?;
    for node in nodes {
        if let XmlNode::Element(element) = node {
            budget.visit_node("action element traversal")?;
            out.push((depth, element));
            if !matches!(
                element.name.as_str(),
                "do" | "onevent" | "card" | "template"
            ) {
                collect_card_action_elements(&element.children, out, budget, depth + 1)?;
            }
        }
    }
    Ok(())
}

fn parse_intrinsic_attributes(
    container: &XmlElement,
    scope: &str,
    bindings: &mut Vec<CardEventBinding>,
    event_types: &mut HashSet<String>,
) -> Result<(), String> {
    for event_type in CARD_EVENT_TYPES {
        let Some(href) = container.attr(event_type) else {
            continue;
        };
        push_unique_onevent(
            scope,
            event_type.to_string(),
            CardTaskAction::Go {
                href: href.to_string(),
                method: None,
                post_fields: Vec::new(),
            },
            bindings,
            event_types,
        )?;
    }
    Ok(())
}

fn push_do_binding(
    element: &XmlElement,
    scope: &str,
    bindings: &mut Vec<CardEventBinding>,
    do_names: &mut HashSet<String>,
    budget: &mut ParseBudget,
) -> Result<(), String> {
    let do_type = element
        .attr("type")
        .ok_or_else(|| "Invalid <do>: missing required 'type' attribute".to_string())?;
    let name = element.attr("name").unwrap_or(do_type);
    validate_nmtoken("do", "name", name)?;
    if !do_names.insert(name.to_string()) {
        return Err(format!(
            "Invalid <{scope}>: duplicate <do> binding name '{name}'"
        ));
    }
    let action = if let Some(href) = element.attr("href").filter(|href| !href.is_empty()) {
        CardTaskAction::Go {
            href: href.to_string(),
            method: parse_go_method_xml(element),
            post_fields: parse_post_fields_xml(&element.children),
        }
    } else {
        parse_first_task_action_xml(&element.children, budget, 0)?.ok_or_else(|| {
            "Invalid <do>: expected one <go>, <prev>, <refresh>, or <noop> task".to_string()
        })?
    };
    bindings.push(CardEventBinding {
        kind: CardEventBindingKind::Do {
            name: name.to_string(),
            do_type: do_type.to_string(),
            label: element.attr("label").map(str::to_string),
            optional: element.attr("optional") == Some("true"),
            language: element.attr("xml:lang").map(str::to_string),
        },
        action,
    });
    Ok(())
}

fn push_onevent_binding(
    element: &XmlElement,
    scope: &str,
    bindings: &mut Vec<CardEventBinding>,
    event_types: &mut HashSet<String>,
    budget: &mut ParseBudget,
) -> Result<(), String> {
    let event_type = element
        .attr("type")
        .ok_or_else(|| "Invalid <onevent>: missing required 'type' attribute".to_string())?
        .to_ascii_lowercase();
    if !CARD_EVENT_TYPES.contains(&event_type.as_str()) {
        return Ok(());
    }
    let action = parse_first_task_action_xml(&element.children, budget, 0)?.ok_or_else(|| {
        "Invalid <onevent>: expected one <go>, <prev>, <refresh>, or <noop> task".to_string()
    })?;
    push_unique_onevent(scope, event_type, action, bindings, event_types)
}

fn push_unique_onevent(
    scope: &str,
    event_type: String,
    action: CardTaskAction,
    bindings: &mut Vec<CardEventBinding>,
    event_types: &mut HashSet<String>,
) -> Result<(), String> {
    if !event_types.insert(event_type.clone()) {
        return Err(format!(
            "Invalid <{scope}>: conflicting '{event_type}' event bindings"
        ));
    }
    bindings.push(CardEventBinding {
        kind: CardEventBindingKind::Onevent { event_type },
        action,
    });
    Ok(())
}

pub(super) fn parse_first_task_action_xml(
    nodes: &[XmlNode],
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<Option<CardTaskAction>, String> {
    budget.enter_scope(depth, "task-action traversal")?;
    for node in nodes {
        let XmlNode::Element(element) = node else {
            continue;
        };
        match element.name.as_str() {
            "go" => {
                if let Some(href) = element.attr("href").filter(|href| !href.is_empty()) {
                    return Ok(Some(
                        CardTaskAction::Go {
                            href: href.to_string(),
                            method: parse_go_method_xml(element),
                            post_fields: parse_post_fields_xml(&element.children),
                        }
                        .with_set_vars(parse_set_vars_xml(&element.children)),
                    ));
                }
            }
            "prev" => {
                return Ok(Some(
                    CardTaskAction::Prev.with_set_vars(parse_set_vars_xml(&element.children)),
                ))
            }
            "refresh" => {
                return Ok(Some(
                    CardTaskAction::Refresh.with_set_vars(parse_set_vars_xml(&element.children)),
                ))
            }
            "noop" => return Ok(Some(CardTaskAction::Noop)),
            _ => {
                if let Some(action) =
                    parse_first_task_action_xml(&element.children, budget, depth + 1)?
                {
                    return Ok(Some(action));
                }
            }
        }
    }
    Ok(None)
}

fn parse_set_vars_xml(nodes: &[XmlNode]) -> Vec<CardSetVar> {
    nodes
        .iter()
        .filter_map(|node| {
            let XmlNode::Element(element) = node else {
                return None;
            };
            if element.name != "setvar" {
                return None;
            }
            Some(CardSetVar {
                name: element.attr("name")?.to_string(),
                value: element.attr("value")?.to_string(),
            })
        })
        .collect()
}

fn parse_timer_xml(
    elements: &[(usize, &XmlElement)],
    budget: &mut ParseBudget,
) -> Option<CardTimer> {
    for (_, element) in elements {
        if element.name != "timer" {
            continue;
        }
        let Some(raw) = element.attr("value") else {
            budget.note_recoverable(
                "Recoverable <timer>: invalid or missing 'value' attribute was ignored",
            );
            return None;
        };
        if !raw.contains('$') && raw.trim().parse::<u32>().is_err() {
            budget.note_recoverable(
                "Recoverable <timer>: invalid or missing 'value' attribute was ignored",
            );
        }
        return Some(CardTimer {
            name: element.attr("name").map(str::to_string),
            value: raw.to_string(),
        });
    }
    None
}

fn parse_go_method_xml(element: &XmlElement) -> Option<String> {
    normalize_go_method(element.attr("method"))
}

fn parse_post_fields_xml(nodes: &[XmlNode]) -> Vec<CardPostField> {
    let mut out = Vec::new();
    collect_post_fields_xml(nodes, &mut out);
    out
}

fn collect_post_fields_xml(nodes: &[XmlNode], out: &mut Vec<CardPostField>) {
    for node in nodes {
        let XmlNode::Element(element) = node else {
            continue;
        };
        if element.name == "postfield" {
            if let Some(name) = element.attr("name").filter(|value| !value.is_empty()) {
                out.push(CardPostField {
                    name: name.to_string(),
                    value: element.attr("value").unwrap_or_default().to_string(),
                });
            }
        }
        collect_post_fields_xml(&element.children, out);
    }
}

fn normalize_go_method(method: Option<&str>) -> Option<String> {
    let method = method?.trim();
    if method.is_empty() {
        return None;
    }
    Some(method.to_ascii_uppercase())
}
