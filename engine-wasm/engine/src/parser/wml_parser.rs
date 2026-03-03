use crate::runtime::card::{Card, CardTaskAction};
use crate::runtime::deck::Deck;
use crate::runtime::node::{InlineNode, Node};

type CardActions = (
    Option<CardTaskAction>,
    Option<CardTaskAction>,
    Option<CardTaskAction>,
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
        let (accept_action, onenterforward_action, onenterbackward_action) =
            parse_card_actions(card_body)?;
        let nodes = parse_card_nodes(card_body)?;
        cards.push(Card {
            id,
            nodes,
            accept_action,
            onenterforward_action,
            onenterbackward_action,
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
    Ok((accept_action, onenterforward_action, onenterbackward_action))
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
mod tests {
    use super::{
        extract_wml_body, parse_card_nodes, parse_do_accept_action, parse_first_task_action,
        parse_inline_nodes, parse_onevent_action, parse_wml,
    };
    use crate::runtime::card::CardTaskAction;
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

    #[test]
    fn rejects_document_without_wml_root() {
        let xml = r#"
        <card id="home">
          <p>Hello</p>
        </card>
        "#;

        let err = parse_wml(xml).expect_err("document without <wml> root must fail");
        assert!(
            err.contains("<wml>"),
            "expected error to reference wml root, got: {err}"
        );
    }

    #[test]
    fn ignores_unknown_tags_without_panicking() {
        let xml = r#"
        <wml>
          <unknown>
            <nested data-x="1">Ignored</nested>
          </unknown>
          <card id="home">
            <p>Hello</p>
            <unsupported attr="x">ignored wrapper</unsupported>
            <p>World</p>
          </card>
        </wml>
        "#;

        let deck = parse_wml(xml).expect("unknown tags should not fail parse");
        assert_eq!(deck.cards.len(), 1);
        assert_eq!(deck.cards[0].id, "home");
    }

    #[test]
    fn assigns_deterministic_ids_when_missing() {
        let xml = r#"
        <wml>
          <card><p>A</p></card>
          <card><p>B</p></card>
        </wml>
        "#;

        let deck = parse_wml(xml).expect("deck should parse");
        assert_eq!(deck.cards[0].id, "card-1");
        assert_eq!(deck.cards[1].id, "card-2");
        assert_eq!(deck.card_index("card-1"), Some(0));
        assert_eq!(deck.card_index("card-2"), Some(1));
    }

    #[test]
    fn preserves_inline_text_and_link_order_in_paragraph() {
        let xml = r##"
        <wml>
          <card id="home">
            <p>one <a href="#a">A</a> two <a href="#b">B</a> three</p>
          </card>
        </wml>
        "##;

        let deck = parse_wml(xml).expect("deck should parse");
        let first = &deck.cards[0].nodes[0];
        match first {
            Node::Paragraph(items) => {
                assert_eq!(items.len(), 5);
                assert!(matches!(&items[0], InlineNode::Text(t) if t == "one"));
                assert!(
                    matches!(&items[1], InlineNode::Link { text, href } if text == "A" && href == "#a")
                );
                assert!(matches!(&items[2], InlineNode::Text(t) if t == "two"));
                assert!(
                    matches!(&items[3], InlineNode::Link { text, href } if text == "B" && href == "#b")
                );
                assert!(matches!(&items[4], InlineNode::Text(t) if t == "three"));
            }
            _ => panic!("expected paragraph"),
        }
    }

    #[test]
    fn ignores_card_like_unknown_tags_without_failing_parse() {
        let xml = r#"
        <wml>
          <cardinal id="x">ignored wrapper</cardinal>
          <card id="home">
            <p>Hello</p>
          </card>
        </wml>
        "#;

        let deck = parse_wml(xml).expect("card-like unknown tags should be ignored");
        assert_eq!(deck.cards.len(), 1);
        assert_eq!(deck.cards[0].id, "home");
    }

    #[test]
    fn decodes_entities_and_uses_href_as_fallback_link_text() {
        let xml = r##"
        <wml>
          <card id="home">
            <p>&lt;safe&gt; &amp; ok</p>
            <a href="#next"></a>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;

        let deck = parse_wml(xml).expect("deck should parse");
        match &deck.cards[0].nodes[0] {
            Node::Paragraph(items) => {
                assert!(matches!(&items[0], InlineNode::Text(t) if t == "<safe> & ok"));
            }
            _ => panic!("expected paragraph"),
        }

        match &deck.cards[0].nodes[1] {
            Node::Paragraph(items) => {
                assert!(matches!(
                    &items[0],
                    InlineNode::Link { text, href } if text == "#next" && href == "#next"
                ));
            }
            _ => panic!("expected link paragraph"),
        }
    }

    #[test]
    fn rejects_missing_card_closing_tag() {
        let xml = r#"
        <wml>
          <card id="home">
            <p>Hello</p>
        </wml>
        "#;

        let err = parse_wml(xml).expect_err("unclosed card must fail parse");
        assert!(
            err.contains("Missing closing </card>"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn parses_accept_do_and_card_entry_go_actions() {
        let xml = r##"
        <wml>
          <card id="home">
            <do type="accept">
              <go href="script:calc.wmlsc#main"/>
            </do>
            <onevent type="onenterforward">
              <go href="#next"/>
            </onevent>
            <onevent type="onenterbackward">
              <go href="#back"/>
            </onevent>
            <p>Home</p>
          </card>
          <card id="next"><p>Next</p></card>
          <card id="back"><p>Back</p></card>
        </wml>
        "##;

        let deck = parse_wml(xml).expect("deck should parse");
        assert_eq!(
            deck.cards[0].accept_action,
            Some(CardTaskAction::Go {
                href: "script:calc.wmlsc#main".to_string(),
            })
        );
        assert_eq!(
            deck.cards[0].onenterforward_action,
            Some(CardTaskAction::Go {
                href: "#next".to_string(),
            })
        );
        assert_eq!(
            deck.cards[0].onenterbackward_action,
            Some(CardTaskAction::Go {
                href: "#back".to_string(),
            })
        );
    }

    #[test]
    fn does_not_treat_prev_tag_as_paragraph_opening_tag() {
        let xml = r##"
        <wml>
          <card id="menu">
            <p>Menu</p>
            <do type="prev" label="Back"><prev/></do>
          </card>
        </wml>
        "##;

        let deck = parse_wml(xml).expect("deck with <prev/> in <do> should parse");
        assert_eq!(deck.cards.len(), 1);
        assert_eq!(deck.cards[0].id, "menu");
        assert!(
            deck.cards[0]
                .nodes
                .iter()
                .any(|node| matches!(node, Node::Paragraph(_))),
            "paragraph content should still be parsed"
        );
    }

    #[test]
    fn helper_extract_wml_body_reports_root_errors() {
        let malformed = extract_wml_body("<wml ").expect_err("malformed wml open tag must fail");
        assert!(malformed.contains("Malformed <wml> opening tag"));

        let missing_close = extract_wml_body("<wml><card id=\"x\"></card>")
            .expect_err("missing wml close must fail");
        assert!(missing_close.contains("Missing closing </wml> root element"));
    }

    #[test]
    fn helper_parse_first_task_action_handles_go_prev_and_malformed() {
        assert_eq!(
            parse_first_task_action("<go href=\"#ok\"/>").expect("go should parse"),
            Some(CardTaskAction::Go {
                href: "#ok".to_string(),
            })
        );
        assert_eq!(
            parse_first_task_action("<prev/>").expect("prev should parse"),
            Some(CardTaskAction::Prev)
        );
        assert_eq!(
            parse_first_task_action("<refresh/>").expect("refresh should parse"),
            Some(CardTaskAction::Refresh)
        );
        assert_eq!(
            parse_first_task_action("<go/><prev/>").expect("empty go should fall through"),
            Some(CardTaskAction::Prev)
        );
        assert_eq!(
            parse_first_task_action("<go/><refresh/>")
                .expect("empty go should fall through to refresh"),
            Some(CardTaskAction::Refresh)
        );
        assert_eq!(
            parse_first_task_action("<noop/>").expect("no task should parse"),
            None
        );
        let malformed_go =
            parse_first_task_action("<go href=\"#broken\"").expect_err("malformed go must fail");
        assert!(malformed_go.contains("Malformed <go> tag"));
    }

    #[test]
    fn helper_parse_do_accept_action_exercises_direct_and_error_paths() {
        assert_eq!(
            parse_do_accept_action("<do type=\"accept\" href=\"#direct\"></do>")
                .expect("direct href should parse"),
            Some(CardTaskAction::Go {
                href: "#direct".to_string(),
            })
        );

        assert_eq!(
            parse_do_accept_action("<do type=\"accept\" href=\"\"><go href=\"#fallback\"/></do>")
                .expect("fallback go href should parse"),
            Some(CardTaskAction::Go {
                href: "#fallback".to_string(),
            })
        );

        assert_eq!(
            parse_do_accept_action("<do type=\"accept\"><prev/></do>")
                .expect("fallback prev should parse"),
            Some(CardTaskAction::Prev)
        );
        assert_eq!(
            parse_do_accept_action("<do type=\"accept\"><refresh/></do>")
                .expect("fallback refresh should parse"),
            Some(CardTaskAction::Refresh)
        );

        let malformed = parse_do_accept_action("<do type=\"accept\"")
            .expect_err("malformed do open tag must fail");
        assert!(malformed.contains("Malformed <do> opening tag"));

        let missing_close = parse_do_accept_action("<do type=\"accept\">")
            .expect_err("missing do close tag must fail");
        assert!(missing_close.contains("Missing closing </do> tag"));
    }

    #[test]
    fn helper_parse_onevent_action_exercises_non_matching_and_error_paths() {
        assert_eq!(
            parse_onevent_action(
                "<onevent type=\"onenterbackward\"><go href=\"#skip\"/></onevent>",
                "onenterforward"
            )
            .expect("non-matching onevent should parse"),
            None
        );

        assert_eq!(
            parse_onevent_action(
                "<onevent type=\"onenterforward\"><go href=\"#next\"/></onevent>",
                "onenterforward"
            )
            .expect("matching onevent should parse"),
            Some(CardTaskAction::Go {
                href: "#next".to_string(),
            })
        );

        assert_eq!(
            parse_onevent_action(
                "<onevent type=\"onenterbackward\"><go href=\"#prev\"/></onevent>",
                "onenterbackward"
            )
            .expect("matching backward onevent should parse"),
            Some(CardTaskAction::Go {
                href: "#prev".to_string(),
            })
        );

        assert_eq!(
            parse_onevent_action(
                "<onevent type=\"onenterforward\"><prev/></onevent>",
                "onenterforward"
            )
            .expect("prev task onevent should parse"),
            Some(CardTaskAction::Prev)
        );
        assert_eq!(
            parse_onevent_action(
                "<onevent type=\"onenterforward\"><refresh/></onevent>",
                "onenterforward"
            )
            .expect("refresh task onevent should parse"),
            Some(CardTaskAction::Refresh)
        );

        let malformed = parse_onevent_action("<onevent type=\"onenterforward\"", "onenterforward")
            .expect_err("malformed onevent open tag must fail");
        assert!(malformed.contains("Malformed <onevent> opening tag"));

        let missing_close =
            parse_onevent_action("<onevent type=\"onenterforward\">", "onenterforward")
                .expect_err("missing onevent close tag must fail");
        assert!(missing_close.contains("Missing closing </onevent> tag"));
    }

    #[test]
    fn helper_parse_card_nodes_reports_malformed_tags() {
        let malformed_br = parse_card_nodes("<br").expect_err("malformed br should fail");
        assert!(malformed_br.contains("Malformed <br> tag"));

        let malformed_p = parse_card_nodes("<p").expect_err("malformed p open tag should fail");
        assert!(malformed_p.contains("Malformed <p> opening tag"));

        let missing_p_close = parse_card_nodes("<p>text").expect_err("unclosed p should fail");
        assert!(missing_p_close.contains("Missing closing </p> tag"));

        let malformed_a =
            parse_card_nodes("<a href=\"#x\"").expect_err("malformed a open tag should fail");
        assert!(malformed_a.contains("Malformed <a> opening tag"));

        let missing_a_close =
            parse_card_nodes("<a href=\"#x\">X").expect_err("unclosed a should fail");
        assert!(missing_a_close.contains("Missing closing </a> tag"));

        let malformed_tag =
            parse_card_nodes("<foo").expect_err("malformed generic tag should fail");
        assert!(malformed_tag.contains("Malformed tag"));
    }

    #[test]
    fn helper_parse_inline_nodes_reports_malformed_tags() {
        let malformed_a =
            parse_inline_nodes("<a href=\"#x\"").expect_err("malformed inline a should fail");
        assert!(malformed_a.contains("Malformed inline <a> opening tag"));

        let missing_a_close =
            parse_inline_nodes("<a href=\"#x\">X").expect_err("unclosed inline a should fail");
        assert!(missing_a_close.contains("Missing closing inline </a> tag"));

        let malformed_br = parse_inline_nodes("<br").expect_err("malformed inline br should fail");
        assert!(malformed_br.contains("Malformed inline <br> tag"));

        let malformed_tag =
            parse_inline_nodes("<unknown").expect_err("malformed inline tag should fail");
        assert!(malformed_tag.contains("Malformed inline tag"));
    }
}
