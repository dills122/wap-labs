use crate::runtime::card::CardTaskAction;

#[cfg(test)]
use super::xml::{extract_attr, find_tag_from};
use super::xml::{XmlElement, XmlNode};

type CardActions = (
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<u32>,
);

pub(super) fn parse_card_actions(card: &XmlElement) -> Result<CardActions, String> {
    let mut elements = Vec::new();
    collect_elements_in_order(&card.children, &mut elements);

    let accept_action = parse_do_accept_action_xml(&elements);
    let onenterforward_action = parse_onevent_action_xml(&elements, "onenterforward");
    let onenterbackward_action = parse_onevent_action_xml(&elements, "onenterbackward");
    let ontimer_action = parse_onevent_action_xml(&elements, "ontimer");
    let timer_value_ds = parse_timer_value_ds_xml(&elements);
    Ok((
        accept_action,
        onenterforward_action,
        onenterbackward_action,
        ontimer_action,
        timer_value_ds,
    ))
}

fn collect_elements_in_order<'a>(nodes: &'a [XmlNode], out: &mut Vec<&'a XmlElement>) {
    for node in nodes {
        if let XmlNode::Element(element) = node {
            out.push(element);
            collect_elements_in_order(&element.children, out);
        }
    }
}

fn parse_do_accept_action_xml(elements: &[&XmlElement]) -> Option<CardTaskAction> {
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
            return Some(CardTaskAction::Go {
                href: href.to_string(),
            });
        }

        if let Some(action) = parse_first_task_action_xml(&element.children) {
            return Some(action);
        }
    }
    None
}

fn parse_onevent_action_xml(
    elements: &[&XmlElement],
    target_event_type: &str,
) -> Option<CardTaskAction> {
    for element in elements {
        if element.name != "onevent" {
            continue;
        }

        let event_type = element
            .attr("type")
            .unwrap_or_default()
            .to_ascii_lowercase();
        if event_type == target_event_type {
            return parse_first_task_action_xml(&element.children);
        }
    }
    None
}

fn parse_first_task_action_xml(nodes: &[XmlNode]) -> Option<CardTaskAction> {
    for node in nodes {
        let XmlNode::Element(element) = node else {
            continue;
        };
        match element.name.as_str() {
            "go" => {
                if let Some(href) = element.attr("href").filter(|href| !href.is_empty()) {
                    return Some(CardTaskAction::Go {
                        href: href.to_string(),
                    });
                }
            }
            "prev" => return Some(CardTaskAction::Prev),
            "refresh" => return Some(CardTaskAction::Refresh),
            _ => {
                if let Some(action) = parse_first_task_action_xml(&element.children) {
                    return Some(action);
                }
            }
        }
    }
    None
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
        let Some((tag, start)) = choose_next_task_tag(next_go, next_prev, next_refresh) else {
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
) -> Option<(&'static str, usize)> {
    let mut candidate: Option<(&'static str, usize)> = None;
    for (tag, pos) in [
        ("go", next_go),
        ("prev", next_prev),
        ("refresh", next_refresh),
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
