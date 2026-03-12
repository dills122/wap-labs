use super::{
    extract_wml_body, parse_card_nodes, parse_do_accept_action, parse_first_task_action,
    parse_inline_nodes, parse_onevent_action, parse_timer_value_ds, parse_wml,
};
use crate::runtime::card::{CardPostField, CardTaskAction};
use crate::runtime::node::{InlineNode, Node};

fn go_action(href: &str) -> CardTaskAction {
    CardTaskAction::Go {
        href: href.to_string(),
        method: None,
        post_fields: Vec::new(),
    }
}

fn post_go_action(href: &str, fields: &[(&str, &str)]) -> CardTaskAction {
    CardTaskAction::Go {
        href: href.to_string(),
        method: Some("POST".to_string()),
        post_fields: fields
            .iter()
            .map(|(name, value)| CardPostField {
                name: (*name).to_string(),
                value: (*value).to_string(),
            })
            .collect(),
    }
}

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
fn parses_text_and_password_inputs_into_inline_nodes() {
    let xml = r#"
        <wml>
          <card id="home">
            <p>User <input name="UserName" value="AHMED" type="text"/></p>
            <input name="Password" value="secret" type="password"/>
          </card>
        </wml>
        "#;

    let deck = parse_wml(xml).expect("deck should parse");
    match &deck.cards[0].nodes[0] {
        Node::Paragraph(items) => {
            assert!(matches!(&items[0], InlineNode::Text(t) if t == "User"));
            assert!(matches!(
                &items[1],
                InlineNode::Input {
                    name,
                    value,
                    is_password
                } if name == "UserName" && value == "AHMED" && !is_password
            ));
        }
        _ => panic!("expected paragraph"),
    }

    match &deck.cards[0].nodes[1] {
        Node::Paragraph(items) => {
            assert!(matches!(
                &items[0],
                InlineNode::Input {
                    name,
                    value,
                    is_password
                } if name == "Password" && value == "secret" && *is_password
            ));
        }
        _ => panic!("expected input paragraph"),
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
            <onevent type="ontimer">
              <go href="#timer"/>
            </onevent>
            <timer value="0"/>
            <p>Home</p>
          </card>
          <card id="next"><p>Next</p></card>
          <card id="back"><p>Back</p></card>
          <card id="timer"><p>Timer</p></card>
        </wml>
        "##;

    let deck = parse_wml(xml).expect("deck should parse");
    assert_eq!(
        deck.cards[0].accept_action,
        Some(go_action("script:calc.wmlsc#main"))
    );
    assert_eq!(
        deck.cards[0].onenterforward_action,
        Some(go_action("#next"))
    );
    assert_eq!(
        deck.cards[0].onenterbackward_action,
        Some(go_action("#back"))
    );
    assert_eq!(deck.cards[0].ontimer_action, Some(go_action("#timer")));
    assert_eq!(deck.cards[0].timer_value_ds, Some(0));
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

    let missing_close =
        extract_wml_body("<wml><card id=\"x\"></card>").expect_err("missing wml close must fail");
    assert!(missing_close.contains("Missing closing </wml> root element"));
}

#[test]
fn helper_parse_first_task_action_handles_go_prev_and_malformed() {
    assert_eq!(
        parse_first_task_action("<go href=\"#ok\"/>").expect("go should parse"),
        Some(go_action("#ok"))
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
        parse_first_task_action("<noop/>").expect("noop should parse"),
        Some(CardTaskAction::Noop)
    );
    let malformed_go =
        parse_first_task_action("<go href=\"#broken\"").expect_err("malformed go must fail");
    assert!(malformed_go.contains("Malformed <go> tag"));
}

#[test]
fn helper_parse_first_task_action_preserves_post_method_and_postfields() {
    assert_eq!(
        parse_first_task_action(
            "<go method=\"post\" href=\"/login\"><postfield name=\"username\" value=\"$(alias)\"/><postfield name=\"pin\" value=\"0000\"/></go>"
        )
        .expect("post go should parse"),
        Some(post_go_action(
            "/login",
            &[("username", "$(alias)"), ("pin", "0000")]
        ))
    );
}

#[test]
fn helper_parse_do_accept_action_exercises_direct_and_error_paths() {
    assert_eq!(
        parse_do_accept_action("<do type=\"accept\" href=\"#direct\"></do>")
            .expect("direct href should parse"),
        Some(go_action("#direct"))
    );

    assert_eq!(
        parse_do_accept_action("<do type=\"accept\" href=\"\"><go href=\"#fallback\"/></do>")
            .expect("fallback go href should parse"),
        Some(go_action("#fallback"))
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
    assert_eq!(
        parse_do_accept_action("<do type=\"accept\"><noop/></do>")
            .expect("fallback noop should parse"),
        Some(CardTaskAction::Noop)
    );

    let malformed =
        parse_do_accept_action("<do type=\"accept\"").expect_err("malformed do open tag must fail");
    assert!(malformed.contains("Malformed <do> opening tag"));

    let missing_close =
        parse_do_accept_action("<do type=\"accept\">").expect_err("missing do close tag must fail");
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
        Some(go_action("#next"))
    );

    assert_eq!(
        parse_onevent_action(
            "<onevent type=\"onenterbackward\"><go href=\"#prev\"/></onevent>",
            "onenterbackward"
        )
        .expect("matching backward onevent should parse"),
        Some(go_action("#prev"))
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
    assert_eq!(
        parse_onevent_action(
            "<onevent type=\"onenterforward\"><noop/></onevent>",
            "onenterforward"
        )
        .expect("noop task onevent should parse"),
        Some(CardTaskAction::Noop)
    );

    let malformed = parse_onevent_action("<onevent type=\"onenterforward\"", "onenterforward")
        .expect_err("malformed onevent open tag must fail");
    assert!(malformed.contains("Malformed <onevent> opening tag"));

    let missing_close = parse_onevent_action("<onevent type=\"onenterforward\">", "onenterforward")
        .expect_err("missing onevent close tag must fail");
    assert!(missing_close.contains("Missing closing </onevent> tag"));
}

#[test]
fn helper_parse_timer_value_ds_handles_valid_invalid_and_malformed() {
    assert_eq!(
        parse_timer_value_ds("<timer value=\"10\"/>").expect("timer should parse"),
        Some(10)
    );
    assert_eq!(
        parse_timer_value_ds("<timer value=\"x\"/>").expect("invalid timer should be ignored"),
        None
    );
    assert_eq!(
        parse_timer_value_ds("<p>No timer</p>").expect("missing timer should parse"),
        None
    );
    let malformed =
        parse_timer_value_ds("<timer value=\"3\"").expect_err("malformed timer tag should fail");
    assert!(malformed.contains("Malformed <timer> tag"));
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

    let missing_a_close = parse_card_nodes("<a href=\"#x\">X").expect_err("unclosed a should fail");
    assert!(missing_a_close.contains("Missing closing </a> tag"));

    let malformed_tag = parse_card_nodes("<foo").expect_err("malformed generic tag should fail");
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

#[test]
fn helper_parse_card_nodes_parses_mixed_content_paths() {
    let nodes = parse_card_nodes(
        r##"lead<br/><p>one <a href="#a">A</a><br/>two <span>three</span></p><a href="#next"></a><a>NoHref</a><unknown attr="x">drop</unknown>tail"##,
    )
    .expect("mixed card nodes should parse");

    assert!(matches!(
        &nodes[0],
        Node::Paragraph(items) if matches!(&items[0], InlineNode::Text(t) if t == "lead")
    ));
    assert!(matches!(&nodes[1], Node::Break));
    assert!(matches!(&nodes[2], Node::Paragraph(_)));
    assert!(matches!(
        &nodes[3],
        Node::Paragraph(items)
            if matches!(
                &items[0],
                InlineNode::Link { text, href } if text == "#next" && href == "#next"
            )
    ));
    assert!(
        nodes.iter().any(|node| matches!(
            node,
            Node::Paragraph(items) if matches!(&items[0], InlineNode::Text(t) if t == "tail")
        )),
        "expected trailing tail paragraph in parsed nodes: {nodes:?}"
    );
}

#[test]
fn helper_parse_inline_nodes_parses_text_links_break_and_unknown_wrappers() {
    let items = parse_inline_nodes(
        r##"pre <a href="#a">A</a> mid <br/> <span>wrapped</span> <a href="">skip</a> post"##,
    )
    .expect("mixed inline nodes should parse");

    assert!(matches!(&items[0], InlineNode::Text(t) if t == "pre"));
    assert!(matches!(
        &items[1],
        InlineNode::Link { text, href } if text == "A" && href == "#a"
    ));
    assert!(matches!(&items[2], InlineNode::Text(t) if t == "mid"));
    assert!(matches!(&items[3], InlineNode::Text(t) if t == " "));
    assert!(matches!(&items[4], InlineNode::Text(t) if t == "wrapped"));
    assert!(matches!(&items[5], InlineNode::Text(t) if t == "post"));
}

#[test]
fn parse_wml_reports_xml_root_and_structure_errors() {
    let text_outside_root = parse_wml("oops<wml><card id=\"x\"/></wml>")
        .expect_err("text outside root should fail parse");
    assert!(text_outside_root.contains("text outside root"));

    let multiple_roots = parse_wml("<wml><card id=\"a\"/></wml><wml><card id=\"b\"/></wml>")
        .expect_err("multiple roots should fail parse");
    assert!(multiple_roots.contains("multiple root elements"));

    let unexpected_close = parse_wml("</wml>").expect_err("unexpected close should fail parse");
    assert!(
        unexpected_close.contains("Malformed XML"),
        "unexpected close should report malformed xml, got: {unexpected_close}"
    );
}

#[test]
fn parses_cdata_and_named_entity_refs() {
    let xml = r##"
        <wml>
          <card id="home"><p><![CDATA[raw <keep>]]> &apos;ok&apos;</p></card>
        </wml>
    "##;

    let deck = parse_wml(xml).expect("cdata/entity deck should parse");
    match &deck.cards[0].nodes[0] {
        Node::Paragraph(items) => {
            assert!(matches!(
                &items[0],
                InlineNode::Text(t) if t == "raw <keep> 'ok'"
            ));
        }
        _ => panic!("expected paragraph"),
    }
}

#[test]
fn rejects_excessive_nested_markup_depth() {
    let depth = 200usize;
    let wrappers = "<x>".repeat(depth);
    let closes = "</x>".repeat(depth);
    let xml = format!("<wml><card id=\"home\">{wrappers}<p>deep</p>{closes}</card></wml>");

    let err = parse_wml(&xml).expect_err("excessive nesting must fail deterministically");
    assert!(
        err.contains("Parse limit exceeded: nesting depth"),
        "unexpected error: {err}"
    );
}

#[test]
fn rejects_excessive_node_budget() {
    let nodes = "<x/>".repeat(50_005);
    let xml = format!("<wml><card id=\"home\">{nodes}</card></wml>");

    let err = parse_wml(&xml).expect_err("excessive node budget must fail deterministically");
    assert!(
        err.contains("Parse limit exceeded: node budget"),
        "unexpected error: {err}"
    );
}
