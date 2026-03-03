use crate::runtime::card::{Card, CardTaskAction};
use crate::runtime::deck::Deck;
use crate::runtime::node::{InlineNode, Node};

type CardActions = (
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<u32>,
);

pub fn parse_wml(xml: &str) -> Result<Deck, String> {
    let wml_body = extract_wml_body(xml)?;
    let mut cards = Vec::new();
    let mut cursor = 0usize;

    while let Some(start) = find_tag_from(wml_body, "card", cursor) {
        let open_end = wml_body[start..]
            .find('>')
            .map(|idx| start + idx)
            .ok_or_else(|| "Malformed <card> opening tag".to_string())?;

        let open_tag = &wml_body[start..=open_end];
        let id =
            extract_attr(open_tag, "id").unwrap_or_else(|| format!("card-{}", cards.len() + 1));

        let close_start = wml_body[open_end + 1..]
            .find("</card>")
            .map(|idx| open_end + 1 + idx)
            .ok_or_else(|| format!("Missing closing </card> for card {id}"))?;

        let card_body = &wml_body[open_end + 1..close_start];
        let (
            accept_action,
            onenterforward_action,
            onenterbackward_action,
            ontimer_action,
            timer_value_ds,
        ) = parse_card_actions(card_body)?;
        let nodes = parse_card_nodes(card_body)?;
        cards.push(Card {
            id,
            nodes,
            accept_action,
            onenterforward_action,
            onenterbackward_action,
            ontimer_action,
            timer_value_ds,
        });

        cursor = close_start + "</card>".len();
    }

    if cards.is_empty() {
        return Err("No <card> elements found".to_string());
    }

    Ok(Deck::new(cards))
}

fn parse_card_actions(body: &str) -> Result<CardActions, String> {
    let accept_action = parse_do_accept_action(body)?;
    let onenterforward_action = parse_onevent_action(body, "onenterforward")?;
    let onenterbackward_action = parse_onevent_action(body, "onenterbackward")?;
    let ontimer_action = parse_onevent_action(body, "ontimer")?;
    let timer_value_ds = parse_timer_value_ds(body)?;
    Ok((
        accept_action,
        onenterforward_action,
        onenterbackward_action,
        ontimer_action,
        timer_value_ds,
    ))
}

fn parse_do_accept_action(body: &str) -> Result<Option<CardTaskAction>, String> {
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

fn parse_onevent_action(
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

fn parse_first_task_action(body: &str) -> Result<Option<CardTaskAction>, String> {
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

fn parse_timer_value_ds(body: &str) -> Result<Option<u32>, String> {
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

fn extract_wml_body(xml: &str) -> Result<&str, String> {
    let open_start = find_tag_from(xml, "wml", 0)
        .ok_or_else(|| "Missing required <wml> root element".to_string())?;

    let open_end = xml[open_start..]
        .find('>')
        .map(|idx| open_start + idx)
        .ok_or_else(|| "Malformed <wml> opening tag".to_string())?;

    let close_start = xml[open_end + 1..]
        .find("</wml>")
        .map(|idx| open_end + 1 + idx)
        .ok_or_else(|| "Missing closing </wml> root element".to_string())?;

    Ok(&xml[open_end + 1..close_start])
}

fn parse_card_nodes(body: &str) -> Result<Vec<Node>, String> {
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

fn parse_inline_nodes(content: &str) -> Result<Vec<InlineNode>, String> {
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

fn find_tag_from(xml: &str, tag_name: &str, from: usize) -> Option<usize> {
    let needle = format!("<{tag_name}");
    let mut search = from;
    while let Some(rel_idx) = xml[search..].find(&needle) {
        let idx = search + rel_idx;
        let next = xml[idx + needle.len()..].chars().next();
        match next {
            Some(ch) if ch.is_whitespace() || ch == '>' || ch == '/' => return Some(idx),
            _ => {
                search = idx + needle.len();
            }
        }
    }
    None
}

fn starts_with_tag_at(xml: &str, from: usize, tag_name: &str) -> bool {
    if from >= xml.len() {
        return false;
    }
    let tail = &xml[from..];
    let needle = format!("<{tag_name}");
    let Some(rest) = tail.strip_prefix(&needle) else {
        return false;
    };
    match rest.chars().next() {
        Some(ch) => ch.is_whitespace() || ch == '>' || ch == '/',
        None => true,
    }
}

fn extract_attr(tag: &str, attr: &str) -> Option<String> {
    let needle = format!("{attr}=\"");
    let start = tag.find(&needle)? + needle.len();
    let rest = &tag[start..];
    let end = rest.find('"')?;
    Some(rest[..end].to_string())
}

fn normalize_text(input: &str) -> String {
    let mut out = String::new();
    let mut saw_whitespace = false;

    for ch in decode_entities(input).chars() {
        if ch.is_whitespace() {
            if !saw_whitespace {
                out.push(' ');
                saw_whitespace = true;
            }
        } else {
            out.push(ch);
            saw_whitespace = false;
        }
    }

    out.trim().to_string()
}

fn decode_entities(input: &str) -> String {
    input
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
}

#[cfg(test)]
#[path = "wml_parser_tests.rs"]
mod tests;
