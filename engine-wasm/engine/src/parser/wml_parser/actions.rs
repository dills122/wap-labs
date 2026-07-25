use crate::runtime::card::{CardPostField, CardTaskAction};

use super::xml::{XmlElement, XmlNode};
use super::ParseBudget;

type CardActions = (
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<u32>,
);

pub(super) fn parse_card_actions(
    card: &XmlElement,
    budget: &mut ParseBudget,
) -> Result<CardActions, String> {
    let mut elements = Vec::new();
    collect_elements_in_order(&card.children, &mut elements, budget, 0)?;

    let accept_action = parse_do_accept_action_xml(&elements, budget)?;
    let onenterforward_action = parse_onevent_action_xml(&elements, "onenterforward", budget)?;
    let onenterbackward_action = parse_onevent_action_xml(&elements, "onenterbackward", budget)?;
    let ontimer_action = parse_onevent_action_xml(&elements, "ontimer", budget)?;
    let timer_value_ds = parse_timer_value_ds_xml(&elements);
    Ok((
        accept_action,
        onenterforward_action,
        onenterbackward_action,
        ontimer_action,
        timer_value_ds,
    ))
}

fn collect_elements_in_order<'a>(
    nodes: &'a [XmlNode],
    out: &mut Vec<&'a XmlElement>,
    budget: &mut ParseBudget,
    depth: usize,
) -> Result<(), String> {
    budget.enter_scope(depth, "action element traversal")?;
    for node in nodes {
        if let XmlNode::Element(element) = node {
            budget.visit_node("action element traversal")?;
            out.push(element);
            collect_elements_in_order(&element.children, out, budget, depth + 1)?;
        }
    }
    Ok(())
}

fn parse_do_accept_action_xml(
    elements: &[&XmlElement],
    budget: &mut ParseBudget,
) -> Result<Option<CardTaskAction>, String> {
    for element in elements {
        if element.name != "do" {
            continue;
        }

        let do_type = element
            .attr("type")
            .unwrap_or_default()
            .to_ascii_lowercase();
        if do_type != "accept" {
            continue;
        }

        if let Some(href) = element.attr("href").filter(|href| !href.is_empty()) {
            return Ok(Some(CardTaskAction::Go {
                href: href.to_string(),
                method: parse_go_method_xml(element),
                post_fields: parse_post_fields_xml(&element.children),
            }));
        }

        if let Some(action) = parse_first_task_action_xml(&element.children, budget, 0)? {
            return Ok(Some(action));
        }
    }
    Ok(None)
}

fn parse_onevent_action_xml(
    elements: &[&XmlElement],
    target_event_type: &str,
    budget: &mut ParseBudget,
) -> Result<Option<CardTaskAction>, String> {
    for element in elements {
        if element.name != "onevent" {
            continue;
        }

        let event_type = element
            .attr("type")
            .unwrap_or_default()
            .to_ascii_lowercase();
        if event_type == target_event_type {
            return parse_first_task_action_xml(&element.children, budget, 0);
        }
    }
    Ok(None)
}

fn parse_first_task_action_xml(
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
                    return Ok(Some(CardTaskAction::Go {
                        href: href.to_string(),
                        method: parse_go_method_xml(element),
                        post_fields: parse_post_fields_xml(&element.children),
                    }));
                }
            }
            "prev" => return Ok(Some(CardTaskAction::Prev)),
            "refresh" => return Ok(Some(CardTaskAction::Refresh)),
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

fn parse_timer_value_ds_xml(elements: &[&XmlElement]) -> Option<u32> {
    for element in elements {
        if element.name != "timer" {
            continue;
        }
        if let Some(raw) = element.attr("value") {
            if let Ok(value_ds) = raw.trim().parse::<u32>() {
                return Some(value_ds);
            }
        }
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
