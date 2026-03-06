use crate::runtime::card::CardTaskAction;

#[cfg(test)]
use super::xml::{extract_attr, find_tag_from};
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

#[cfg(test)]
pub(super) fn parse_do_accept_action(body: &str) -> Result<Option<CardTaskAction>, String> {
    let mut cursor = 0usize;
    while let Some(start) = find_tag_from(body, "do", cursor) {
        let open_end = body[start..]
            .find('>')
            .map(|idx| start + idx)
            .ok_or_else(|| "Malformed <do> opening tag".to_string())?;
        let open_tag = &body[start..=open_end];
        let close_start = body[open_end + 1..]
            .find("</do>")
            .map(|idx| open_end + 1 + idx)
            .ok_or_else(|| "Missing closing </do> tag".to_string())?;
        let do_body = &body[open_end + 1..close_start];

        let do_type = extract_attr(open_tag, "type")
            .unwrap_or_default()
            .to_ascii_lowercase();
        if do_type == "accept" {
            if let Some(href) = extract_attr(open_tag, "href") {
                if !href.is_empty() {
                    return Ok(Some(CardTaskAction::Go { href }));
                }
            }
            if let Some(action) = parse_first_task_action(do_body)? {
                return Ok(Some(action));
            }
        }

        cursor = close_start + "</do>".len();
    }

    Ok(None)
}

#[cfg(test)]
pub(super) fn parse_onevent_action(
    body: &str,
    target_event_type: &str,
) -> Result<Option<CardTaskAction>, String> {
    let mut cursor = 0usize;
    while let Some(start) = find_tag_from(body, "onevent", cursor) {
        let open_end = body[start..]
            .find('>')
            .map(|idx| start + idx)
            .ok_or_else(|| "Malformed <onevent> opening tag".to_string())?;
        let open_tag = &body[start..=open_end];
        let close_start = body[open_end + 1..]
            .find("</onevent>")
            .map(|idx| open_end + 1 + idx)
            .ok_or_else(|| "Missing closing </onevent> tag".to_string())?;
        let onevent_body = &body[open_end + 1..close_start];

        let event_type = extract_attr(open_tag, "type")
            .unwrap_or_default()
            .to_ascii_lowercase();
        if event_type == target_event_type {
            return parse_first_task_action(onevent_body);
        }

        cursor = close_start + "</onevent>".len();
    }

    Ok(None)
}

#[cfg(test)]
pub(super) fn parse_first_task_action(body: &str) -> Result<Option<CardTaskAction>, String> {
    let mut cursor = 0usize;
    while cursor < body.len() {
        let next_go = find_tag_from(body, "go", cursor);
        let next_prev = find_tag_from(body, "prev", cursor);
        let next_refresh = find_tag_from(body, "refresh", cursor);
        let next_noop = find_tag_from(body, "noop", cursor);
        let Some((tag, start)) = choose_next_task_tag(next_go, next_prev, next_refresh, next_noop)
        else {
            break;
        };

        let open_end = body[start..]
            .find('>')
            .map(|idx| start + idx)
            .ok_or_else(|| format!("Malformed <{tag}> tag"))?;
        let open_tag = &body[start..=open_end];
        match tag {
            "go" => {
                if let Some(href) = extract_attr(open_tag, "href") {
                    if !href.is_empty() {
                        return Ok(Some(CardTaskAction::Go { href }));
                    }
                }
            }
            "prev" => return Ok(Some(CardTaskAction::Prev)),
            "refresh" => return Ok(Some(CardTaskAction::Refresh)),
            "noop" => return Ok(Some(CardTaskAction::Noop)),
            _ => {}
        }
        cursor = open_end + 1;
    }
    Ok(None)
}

#[cfg(test)]
fn choose_next_task_tag(
    next_go: Option<usize>,
    next_prev: Option<usize>,
    next_refresh: Option<usize>,
    next_noop: Option<usize>,
) -> Option<(&'static str, usize)> {
    let mut candidate: Option<(&'static str, usize)> = None;
    for (tag, pos) in [
        ("go", next_go),
        ("prev", next_prev),
        ("refresh", next_refresh),
        ("noop", next_noop),
    ] {
        if let Some(pos) = pos {
            match candidate {
                Some((_, current_pos)) if current_pos <= pos => {}
                _ => candidate = Some((tag, pos)),
            }
        }
    }
    candidate
}

#[cfg(test)]
pub(super) fn parse_timer_value_ds(body: &str) -> Result<Option<u32>, String> {
    let mut cursor = 0usize;
    while let Some(start) = find_tag_from(body, "timer", cursor) {
        let open_end = body[start..]
            .find('>')
            .map(|idx| start + idx)
            .ok_or_else(|| "Malformed <timer> tag".to_string())?;
        let open_tag = &body[start..=open_end];
        if let Some(raw) = extract_attr(open_tag, "value") {
            if let Ok(value_ds) = raw.trim().parse::<u32>() {
                return Ok(Some(value_ds));
            }
        }
        cursor = open_end + 1;
    }
    Ok(None)
}
