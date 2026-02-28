use crate::runtime::card::Card;
use crate::runtime::deck::Deck;
use crate::runtime::node::{InlineNode, Node};

pub fn parse_wml(xml: &str) -> Result<Deck, String> {
    let mut cards = Vec::new();
    let mut cursor = 0usize;

    while let Some(start) = find_tag_from(xml, "card", cursor) {
        let open_end = xml[start..]
            .find('>')
            .map(|idx| start + idx)
            .ok_or_else(|| "Malformed <card> opening tag".to_string())?;

        let open_tag = &xml[start..=open_end];
        let id = extract_attr(open_tag, "id").unwrap_or_else(|| format!("card-{}", cards.len() + 1));

        let close_start = xml[open_end + 1..]
            .find("</card>")
            .map(|idx| open_end + 1 + idx)
            .ok_or_else(|| format!("Missing closing </card> for card {id}"))?;

        let card_body = &xml[open_end + 1..close_start];
        let nodes = parse_card_nodes(card_body)?;
        cards.push(Card { id, nodes });

        cursor = close_start + "</card>".len();
    }

    if cards.is_empty() {
        return Err("No <card> elements found".to_string());
    }

    Ok(Deck { cards })
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

            if body[tag_start..].starts_with("<br") {
                let end = body[tag_start..]
                    .find('>')
                    .map(|idx| tag_start + idx)
                    .ok_or_else(|| "Malformed <br> tag".to_string())?;
                nodes.push(Node::Break);
                cursor = end + 1;
                continue;
            }

            if body[tag_start..].starts_with("<p") {
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

            if body[tag_start..].starts_with("<a") {
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
                    let text = if link_text.is_empty() { href.clone() } else { link_text };
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

            if content[tag_start..].starts_with("<a") {
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

            if content[tag_start..].starts_with("<br") {
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
    xml[from..].find(&needle).map(|idx| from + idx)
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
mod tests {
    use super::parse_wml;
    use crate::runtime::node::{InlineNode, Node};

    #[test]
    fn parses_cards_and_links() {
        let xml = r##"
        <wml>
          <card id="home">
            <p>Hello <a href="#next">Next</a></p>
            <br/>
            <a href="other.wml">External</a>
          </card>
          <card id="next"><p>World</p></card>
        </wml>
        "##;

        let deck = parse_wml(xml).expect("deck should parse");
        assert_eq!(deck.cards.len(), 2);
        assert_eq!(deck.cards[0].id, "home");

        match &deck.cards[0].nodes[0] {
            Node::Paragraph(items) => {
                assert!(matches!(&items[0], InlineNode::Text(t) if t == "Hello"));
                assert!(matches!(&items[1], InlineNode::Link { href, .. } if href == "#next"));
            }
            _ => panic!("expected paragraph"),
        }
    }
}
