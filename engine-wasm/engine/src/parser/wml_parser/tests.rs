use super::{parse_wml, parse_xml_root, MAX_PARSE_TREE_DEPTH};
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
fn wml_203_canonical_wml13_doctype_and_decoded_wbxml_reach_equal_decks() {
    let text_wml = r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="main" newcontext="false" ordered="true"><p align="left">Hello</p></card></wml>"#;
    // Exact textual output of the `binary-basic-deck` WBXML conformance
    // fixture. The engine receives this text; it never parses the WBXML bytes.
    let decoded_wbxml = r#"<wml><card id="main" newcontext="false" ordered="true"><p align="left">Hello</p></card></wml>"#;

    let text_deck = parse_wml(text_wml).expect("canonical WML 1.3 text should parse");
    let decoded_deck = parse_wml(decoded_wbxml).expect("transport-decoded WBXML text should parse");
    assert_eq!(text_deck, decoded_deck);
}

#[test]
fn wml_203_alternate_doctype_ignores_unknown_markup_and_preserves_known_content() {
    let alternate = r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//VENDOR//DTD WML 1.3 PLUS//EN" "http://vendor.test/wml13-plus.dtd">
<wml>
  <card id="home">
    <p>Before <vendor:badge data-vendor="x"><b>known</b></vendor:badge> after</p>
  </card>
</wml>"#;

    let deck = parse_wml(alternate).expect("alternate DTD decks remain renderable");
    assert_eq!(deck.cards.len(), 1);
    match &deck.cards[0].nodes[0] {
        Node::Paragraph(items) => {
            assert!(items
                .iter()
                .any(|item| matches!(item, InlineNode::Text(text) if text.contains("known"))));
        }
        other => panic!("expected paragraph, got {other:?}"),
    }
}

#[test]
fn wml_203_rejects_mismatched_or_malformed_doctype_declarations_deterministically() {
    let wrong_root = r#"<?xml version="1.0"?>
<!DOCTYPE card PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml><card id="home"/></wml>"#;
    let wrong_root_error =
        parse_wml(wrong_root).expect_err("DOCTYPE root must describe the WML root");
    assert!(wrong_root_error.contains("DOCTYPE root"));

    let canonical_wrong_system = r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://vendor.test/not-wml13.dtd">
<wml><card id="home"/></wml>"#;
    let system_error = parse_wml(canonical_wrong_system)
        .expect_err("canonical public identifier must keep its canonical system identifier");
    assert!(system_error.contains("WML 1.3 system identifier"));
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
                    is_password,
                    max_length,
                    ..
                } if name == "UserName" && value == "AHMED" && !is_password
                    && max_length.is_none()
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
                    is_password,
                    max_length,
                    ..
                } if name == "Password" && value == "secret" && *is_password
                    && max_length.is_none()
            ));
        }
        _ => panic!("expected input paragraph"),
    }
}

#[test]
fn parses_input_maxlength_when_present() {
    let xml = r#"
        <wml>
          <card id="home">
            <input name="pin" value="1234" type="text" maxlength="4"/>
          </card>
        </wml>
        "#;

    let deck = parse_wml(xml).expect("deck should parse");
    match &deck.cards[0].nodes[0] {
        Node::Paragraph(items) => {
            assert!(matches!(
                &items[0],
                InlineNode::Input {
                    name,
                    value,
                    max_length,
                    ..
                } if name == "pin" && value == "1234" && *max_length == Some(4)
            ));
        }
        _ => panic!("expected input paragraph"),
    }
}

#[test]
fn wml_fx_input_structure_accepts_declared_attributes_and_zero_maxlength() {
    // WML-CL-INPUT-STRUCTURE / WAP-191_104-WML section 11.6.3.
    let xml = r#"
        <wml>
          <card id="home">
            <input
              name="pin"
              type="password"
              value=""
              format="NNNN"
              emptyok="false"
              size="4"
              maxlength="0"
              tabindex="1"
              title="PIN"
              accesskey="1"
              xml:lang="en-US"
              id="pin-field"
              class="credential"
            />
          </card>
        </wml>
        "#;

    let deck = parse_wml(xml).expect("source-declared input attributes should parse");
    assert!(matches!(
        &deck.cards[0].nodes[0],
        Node::Paragraph(items)
            if matches!(
                &items[0],
                InlineNode::Input {
                    name,
                    is_password: true,
                    max_length: Some(0),
                    ..
                } if name == "pin"
            )
    ));
}

#[test]
fn wml_fx_input_structure_rejects_invalid_syntax_deterministically() {
    // WML-CL-INPUT-STRUCTURE / WAP-191_104-WML section 11.6.3 and DTD.
    let cases = [
        (
            r#"<input type="text"/>"#,
            "Invalid <input>: missing required 'name' attribute",
        ),
        (
            r#"<input name="has space"/>"#,
            "Invalid <input>: attribute 'name' must be an XML NMTOKEN",
        ),
        (
            r#"<input name="pin" type="number"/>"#,
            "Invalid <input>: attribute 'type' must be 'text' or 'password'",
        ),
        (
            r#"<input name="pin" emptyok="yes"/>"#,
            "Invalid <input>: attribute 'emptyok' must be 'true' or 'false'",
        ),
        (
            r#"<input name="pin" maxlength="-1"/>"#,
            "Invalid <input>: attribute 'maxlength' must contain decimal digits",
        ),
        (
            r#"<input name="pin" maxlength="4294967296"/>"#,
            "Invalid <input>: attribute 'maxlength' exceeds supported range",
        ),
        (
            r#"<input name="pin" zeta="1" alpha="2"/>"#,
            "Invalid <input>: unexpected attribute 'alpha'",
        ),
        (
            r#"<input name="pin">content</input>"#,
            "Invalid <input>: element must be empty",
        ),
    ];

    for (control, expected) in cases {
        let xml = format!("<wml><card id=\"home\">{control}</card></wml>");
        assert_eq!(parse_wml(&xml).expect_err(control), expected);
    }
}

#[test]
fn wml_fx_select_structure_accepts_declared_control_grammar() {
    // WML-CL-SELECT-STRUCTURE and WML-C-41 option grammar,
    // WAP-191_104-WML sections 11.6.2.1-11.6.2.2.
    let xml = r##"
        <wml>
          <card id="home">
            <select
              name="choice"
              iname="choice-index"
              value="alpha"
              ivalue="1"
              multiple="false"
              tabindex="0"
              title="Choice"
              xml:lang="en-US"
              id="choice-field"
              class="menu"
            >
              <option
                value="alpha"
                title="Alpha"
                onpick="#picked"
                xml:lang="en"
                id="alpha-option"
                class="first"
              ></option>
            </select>
          </card>
        </wml>
        "##;

    let deck = parse_wml(xml).expect("source-declared select and option syntax should parse");
    assert!(matches!(
        &deck.cards[0].nodes[0],
        Node::Paragraph(items)
            if matches!(
                &items[0],
                InlineNode::Select { name, options, .. }
                    if name.as_deref() == Some("choice")
                        && options.len() == 1
                        && options[0].label.is_empty()
                        && options[0].value == "alpha"
            )
    ));
}

#[test]
fn wml_fx_select_structure_rejects_invalid_syntax_deterministically() {
    // WML-CL-SELECT-STRUCTURE and WML-C-41 option grammar,
    // WAP-191_104-WML sections 11.6.2.1-11.6.2.2 and DTD.
    let cases = [
        (
            r#"<select name="choice"></select>"#,
            "Invalid <select>: expected one or more <option> or <optgroup> children",
        ),
        (
            r#"<select name="choice"><p>wrong</p></select>"#,
            "Invalid <select>: unexpected child <p>",
        ),
        (
            r#"<select name="choice" multiple="yes"><option>A</option></select>"#,
            "Invalid <select>: attribute 'multiple' must be 'true' or 'false'",
        ),
        (
            r#"<select name="choice" tabindex="1.5"><option>A</option></select>"#,
            "Invalid <select>: attribute 'tabindex' must contain decimal digits",
        ),
        (
            r#"<select name="choice" selected="true"><option>A</option></select>"#,
            "Invalid <select>: unexpected attribute 'selected'",
        ),
        (
            r#"<select name="choice"><option selected="true">A</option></select>"#,
            "Invalid <option>: unexpected attribute 'selected'",
        ),
        (
            r#"<select name="choice"><option><b>A</b></option></select>"#,
            "Invalid <option>: unexpected child <b>",
        ),
        (
            r#"<select name="choice">text<option>A</option></select>"#,
            "Invalid <select>: text content is not allowed",
        ),
        (
            r#"<option value="orphan">Orphan</option>"#,
            "Invalid <option>: must be contained by <select> or <optgroup>",
        ),
    ];

    for (control, expected) in cases {
        let xml = format!("<wml><card id=\"home\">{control}</card></wml>");
        assert_eq!(parse_wml(&xml).expect_err(control), expected);
    }
}

#[test]
fn wml_fx_select_structure_flattens_nested_optgroups_in_document_order() {
    // WML-CL-SELECT-STRUCTURE and the WML 1.3 DTD declarations for select,
    // optgroup, option, and fieldset.
    let xml = r#"
        <wml>
          <card id="home">
            <fieldset title="Grouped choices" xml:lang="en" id="grouped" class="controls">
              <select name="choice">
                <optgroup title="Primary">
                  <option value="alpha">Alpha</option>
                  <optgroup title="Secondary">
                    <option value="beta">Beta</option>
                  </optgroup>
                </optgroup>
              </select>
            </fieldset>
          </card>
        </wml>
        "#;

    let deck = parse_wml(xml).expect("nested declared control grammar should parse");
    assert!(matches!(
        &deck.cards[0].nodes[0],
        Node::Paragraph(items)
            if matches!(
                &items[0],
                InlineNode::Select { options, .. }
                    if options.iter().map(|option| option.value.as_str()).collect::<Vec<_>>()
                        == vec!["alpha", "beta"]
            )
    ));
}

#[test]
fn wml_fx_grouped_control_structure_rejects_invalid_syntax_deterministically() {
    let cases = [
        (
            r#"<select name="choice"><optgroup title="Empty"></optgroup></select>"#,
            "Invalid <optgroup>: expected one or more <option> or <optgroup> children",
        ),
        (
            r#"<select name="choice"><optgroup><p>wrong</p></optgroup></select>"#,
            "Invalid <optgroup>: unexpected child <p>",
        ),
        (
            r#"<fieldset title="Group" unexpected="true"><input name="value"/></fieldset>"#,
            "Invalid <fieldset>: unexpected attribute 'unexpected'",
        ),
        (
            r#"<optgroup><option>Orphan</option></optgroup>"#,
            "Invalid <optgroup>: must be contained by <select> or <optgroup>",
        ),
    ];

    for (control, expected) in cases {
        let xml = format!("<wml><card id=\"home\">{control}</card></wml>");
        assert_eq!(parse_wml(&xml).expect_err(control), expected);
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

// The tests below previously drove a second, string-scanning WML parser that
// existed only under `#[cfg(test)]` and duplicated the production XML-tree
// parser. That legacy scanner has been deleted; each test now asserts the same
// observable behavior through the real `parse_wml` path.

fn deck_with_card_body(body: &str) -> String {
    format!("<wml><card id=\"home\">{body}</card></wml>")
}

fn accept_action_for(control: &str) -> Result<Option<CardTaskAction>, String> {
    let xml = deck_with_card_body(&format!("<do type=\"accept\">{control}</do>"));
    parse_wml(&xml).map(|deck| deck.cards[0].accept_action.clone())
}

fn onenterforward_action_for(control: &str) -> Result<Option<CardTaskAction>, String> {
    let xml = deck_with_card_body(&format!(
        "<onevent type=\"onenterforward\">{control}</onevent>"
    ));
    parse_wml(&xml).map(|deck| deck.cards[0].onenterforward_action.clone())
}

fn card_nodes_for(body: &str) -> Result<Vec<Node>, String> {
    parse_wml(&deck_with_card_body(body)).map(|deck| deck.cards[0].nodes.clone())
}

fn paragraph_items_for(body: &str) -> Vec<InlineNode> {
    let nodes = card_nodes_for(&format!("<p>{body}</p>")).expect("paragraph should parse");
    match nodes.into_iter().next() {
        Some(Node::Paragraph(items)) => items,
        other => panic!("expected a leading paragraph, got: {other:?}"),
    }
}

#[test]
fn parse_wml_rejects_malformed_and_unclosed_root_markup() {
    let malformed = parse_wml("<wml ").expect_err("malformed <wml> opening tag must fail");
    assert!(
        malformed.contains("Malformed XML"),
        "unexpected error: {malformed}"
    );

    let missing_close =
        parse_wml("<wml><card id=\"x\"></card>").expect_err("missing </wml> must fail");
    assert!(
        missing_close.contains("unclosed tag"),
        "unexpected error: {missing_close}"
    );
}

#[test]
fn parses_go_prev_refresh_and_noop_accept_tasks() {
    assert_eq!(
        accept_action_for("<go href=\"#ok\"/>").expect("go should parse"),
        Some(go_action("#ok"))
    );
    assert_eq!(
        accept_action_for("<prev/>").expect("prev should parse"),
        Some(CardTaskAction::Prev)
    );
    assert_eq!(
        accept_action_for("<refresh/>").expect("refresh should parse"),
        Some(CardTaskAction::Refresh)
    );
    assert_eq!(
        accept_action_for("<noop/>").expect("noop should parse"),
        Some(CardTaskAction::Noop)
    );

    // A <go> without an href does not claim the task; the next task wins.
    assert_eq!(
        accept_action_for("<go/><prev/>").expect("empty go should fall through"),
        Some(CardTaskAction::Prev)
    );
    assert_eq!(
        accept_action_for("<go/><refresh/>").expect("empty go should fall through to refresh"),
        Some(CardTaskAction::Refresh)
    );

    let malformed_go =
        accept_action_for("<go href=\"#broken\"").expect_err("malformed go must fail");
    assert!(
        malformed_go.contains("Malformed XML"),
        "unexpected error: {malformed_go}"
    );
}

#[test]
fn preserves_go_post_method_and_postfields() {
    assert_eq!(
        accept_action_for(
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
fn parses_do_accept_direct_href_and_nested_task_fallbacks() {
    let direct = parse_wml(&deck_with_card_body(
        "<do type=\"accept\" href=\"#direct\"></do>",
    ))
    .expect("direct href should parse");
    assert_eq!(direct.cards[0].accept_action, Some(go_action("#direct")));

    let fallback = parse_wml(&deck_with_card_body(
        "<do type=\"accept\" href=\"\"><go href=\"#fallback\"/></do>",
    ))
    .expect("empty href should fall back to the nested task");
    assert_eq!(
        fallback.cards[0].accept_action,
        Some(go_action("#fallback"))
    );

    for (control, expected) in [
        ("<prev/>", CardTaskAction::Prev),
        ("<refresh/>", CardTaskAction::Refresh),
        ("<noop/>", CardTaskAction::Noop),
    ] {
        assert_eq!(
            accept_action_for(control).expect("nested task fallback should parse"),
            Some(expected),
            "unexpected accept action for {control}"
        );
    }

    let missing_close = parse_wml(&deck_with_card_body("<do type=\"accept\">"))
        .expect_err("unclosed <do> must fail");
    assert!(
        missing_close.contains("Malformed XML"),
        "unexpected error: {missing_close}"
    );
}

#[test]
fn parses_onevent_actions_and_ignores_non_matching_event_types() {
    let deck = parse_wml(&deck_with_card_body(
        "<onevent type=\"onenterbackward\"><go href=\"#skip\"/></onevent>",
    ))
    .expect("non-matching onevent should parse");
    assert_eq!(deck.cards[0].onenterforward_action, None);
    assert_eq!(
        deck.cards[0].onenterbackward_action,
        Some(go_action("#skip"))
    );

    assert_eq!(
        onenterforward_action_for("<go href=\"#next\"/>").expect("matching onevent should parse"),
        Some(go_action("#next"))
    );

    for (control, expected) in [
        ("<prev/>", CardTaskAction::Prev),
        ("<refresh/>", CardTaskAction::Refresh),
        ("<noop/>", CardTaskAction::Noop),
    ] {
        assert_eq!(
            onenterforward_action_for(control).expect("onevent task should parse"),
            Some(expected),
            "unexpected onenterforward action for {control}"
        );
    }

    let missing_close = parse_wml(&deck_with_card_body("<onevent type=\"onenterforward\">"))
        .expect_err("unclosed <onevent> must fail");
    assert!(
        missing_close.contains("Malformed XML"),
        "unexpected error: {missing_close}"
    );
}

#[test]
fn parses_timer_value_and_ignores_invalid_or_missing_timers() {
    let deck =
        parse_wml(&deck_with_card_body("<timer value=\"10\"/>")).expect("timer should parse");
    assert_eq!(deck.cards[0].timer_value_ds, Some(10));

    let deck = parse_wml(&deck_with_card_body("<timer value=\"x\"/>"))
        .expect("invalid timer value should be ignored");
    assert_eq!(deck.cards[0].timer_value_ds, None);

    let deck = parse_wml(&deck_with_card_body("<p>No timer</p>"))
        .expect("deck without a timer should parse");
    assert_eq!(deck.cards[0].timer_value_ds, None);

    let malformed = parse_wml(&deck_with_card_body("<timer value=\"3\""))
        .expect_err("malformed <timer> must fail");
    assert!(
        malformed.contains("Malformed XML"),
        "unexpected error: {malformed}"
    );
}

#[test]
fn parse_wml_rejects_malformed_card_level_markup() {
    for control in [
        "<br",
        "<p",
        "<p>text",
        "<a href=\"#x\"",
        "<a href=\"#x\">X",
        "<foo",
    ] {
        let err = parse_wml(&deck_with_card_body(control))
            .expect_err("malformed card-level markup must fail");
        assert!(
            err.contains("Malformed XML"),
            "unexpected error for {control}: {err}"
        );
    }
}

#[test]
fn parse_wml_rejects_malformed_inline_markup() {
    for control in ["<a href=\"#x\"", "<a href=\"#x\">X", "<br", "<unknown"] {
        let err = parse_wml(&deck_with_card_body(&format!("<p>{control}</p>")))
            .expect_err("malformed inline markup must fail");
        assert!(
            err.contains("Malformed XML"),
            "unexpected error for {control}: {err}"
        );
    }
}

#[test]
fn parses_mixed_card_level_content_paths() {
    let nodes = card_nodes_for(
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
fn parses_mixed_inline_text_links_break_and_unknown_wrappers() {
    let items = paragraph_items_for(
        r##"pre <a href="#a">A</a> mid <br/> <span>wrapped</span> <a href="">skip</a> post"##,
    );

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

// Regression coverage for the recursive-Drop stack overflow bug: `parse_xml_root`
// builds the raw `XmlElement`/`XmlNode` tree with an iterative, `Vec`-based stack
// (no recursion in the parse loop itself), but previously enforced no nesting-depth
// limit while doing so. A deeply-nested-but-well-formed tag tree would be fully
// built before the later semantic-walker depth check (`parse_card_actions`,
// `parse_card_nodes_xml`) ever ran, and dropping that tree via the
// compiler-derived recursive `Drop` impl would overflow the stack regardless of
// that later error path. These tests exercise `parse_xml_root` directly to prove
// the budget is now enforced *during* tree construction, so a tree deeper than
// `MAX_PARSE_TREE_DEPTH` is never fully built (or dropped) in the first place.

#[test]
fn xml_tree_build_bails_out_well_past_the_parse_tree_depth_budget() {
    // Nested far past MAX_PARSE_TREE_DEPTH (128). If the depth budget were
    // only enforced after the full tree was built (the pre-fix behavior),
    // this would build (and then recursively drop) a tree ~40x deeper than
    // the budget instead of failing fast.
    let depth = MAX_PARSE_TREE_DEPTH * 40;
    let mut xml = String::from("<wml>");
    xml.push_str(&"<a>".repeat(depth));
    xml.push_str("deep");
    xml.push_str(&"</a>".repeat(depth));
    xml.push_str("</wml>");

    let err = parse_xml_root(&xml)
        .expect_err("nesting well past the depth budget must fail, not build the full tree");
    assert!(
        err.contains("Parse limit exceeded: nesting depth"),
        "unexpected error message: {err}"
    );
}

#[test]
fn xml_tree_build_allows_depth_at_the_budget_and_rejects_one_level_more() {
    // Total open-element stack depth includes the `<wml>` root itself, so
    // `at_limit` nested `<a>` wrappers under `<wml>` reach exactly
    // `MAX_PARSE_TREE_DEPTH` simultaneously-open elements.
    let at_limit = MAX_PARSE_TREE_DEPTH - 1;

    let mut ok_xml = String::from("<wml>");
    ok_xml.push_str(&"<a>".repeat(at_limit));
    ok_xml.push('x');
    ok_xml.push_str(&"</a>".repeat(at_limit));
    ok_xml.push_str("</wml>");
    parse_xml_root(&ok_xml).expect("nesting exactly at the depth budget must still be accepted");

    let mut over_xml = String::from("<wml>");
    over_xml.push_str(&"<a>".repeat(at_limit + 1));
    over_xml.push('x');
    over_xml.push_str(&"</a>".repeat(at_limit + 1));
    over_xml.push_str("</wml>");
    let err = parse_xml_root(&over_xml)
        .expect_err("nesting one level past the depth budget must be rejected");
    assert!(
        err.contains("Parse limit exceeded: nesting depth"),
        "unexpected error message: {err}"
    );
}

#[test]
fn parse_wml_populates_deck_access_control_from_head() {
    let xml = r#"
        <wml>
          <head><access domain="wapforum.org" path="/cbb"/></head>
          <card id="home"><p>Hi</p></card>
        </wml>
        "#;

    let deck = parse_wml(xml).expect("deck should parse");
    let access_control = deck
        .access_control
        .expect("deck should carry parsed access control");
    assert_eq!(access_control.domain.as_deref(), Some("wapforum.org"));
    assert_eq!(access_control.path.as_deref(), Some("/cbb"));
    assert_eq!(deck.cards.len(), 1, "head must not be mistaken for a card");
}

#[test]
fn parse_wml_deck_without_head_has_no_access_control() {
    let xml = r#"<wml><card id="home"><p>Hi</p></card></wml>"#;

    let deck = parse_wml(xml).expect("deck should parse");
    assert_eq!(deck.access_control, None);
}

#[test]
fn parse_wml_propagates_duplicate_access_element_error() {
    let xml = r#"
        <wml>
          <head>
            <access domain="a.com"/>
            <access domain="b.com"/>
          </head>
          <card id="home"><p>Hi</p></card>
        </wml>
        "#;

    let err = parse_wml(xml).expect_err("duplicate <access> must be rejected");
    assert!(
        err.contains("more than one <access>"),
        "unexpected error message: {err}"
    );
}

#[test]
fn parse_wml_honors_only_first_head_when_deck_has_more_than_one() {
    let xml = r#"
        <wml>
          <head><access domain="first.com"/></head>
          <head><access domain="second.com"/></head>
          <card id="home"><p>Hi</p></card>
        </wml>
        "#;

    let deck = parse_wml(xml).expect("deck should parse");
    let access_control = deck
        .access_control
        .expect("access control should be present");
    assert_eq!(access_control.domain.as_deref(), Some("first.com"));
}
