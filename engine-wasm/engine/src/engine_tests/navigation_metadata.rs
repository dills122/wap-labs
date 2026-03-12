use super::*;

#[test]
fn enter_navigates_to_fragment_card() {
    let mut engine = WmlEngine::new();
    engine.load_deck(SAMPLE).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should succeed");

    assert_eq!(
        engine.active_card_id().expect("active card should exist"),
        "next"
    );
}

#[test]
fn load_deck_returns_structured_error_for_invalid_root() {
    let mut engine = WmlEngine::new();
    let msg = engine
        .load_deck("<card id=\"home\"><p>Hello</p></card>")
        .expect_err("missing wml root must fail");
    assert!(msg.contains("<wml>"), "unexpected error message: {msg}");
}

#[test]
fn load_deck_rejects_excessive_nested_markup_depth() {
    let mut engine = WmlEngine::new();
    let depth = 200usize;
    let wrappers = "<x>".repeat(depth);
    let closes = "</x>".repeat(depth);
    let xml = format!("<wml><card id=\"home\">{wrappers}<p>deep</p>{closes}</card></wml>");

    let err = engine
        .load_deck(&xml)
        .expect_err("excessive nesting must fail deterministically");
    assert!(
        err.contains("Parse limit exceeded: nesting depth"),
        "unexpected error message: {err}"
    );
}

#[test]
fn load_deck_accepts_unknown_tags() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <experimental>
            <ignored/>
          </experimental>
          <card id="home">
            <p>Hello</p>
          </card>
        </wml>
        "#;

    engine
        .load_deck(xml)
        .expect("unknown tags should be ignored, not rejected");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}

#[test]
fn down_enter_fragment_navigation_resets_focus() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
            <a href="#third">Third</a>
          </card>
          <card id="next">
            <p>Second</p>
          </card>
          <card id="third">
            <p>Third</p>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("down".to_string())
        .expect("down should succeed");
    assert_eq!(engine.focused_link_index(), 1);
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate");

    assert_eq!(engine.active_card_id().expect("active card"), "third");
    assert_eq!(engine.focused_link_index(), 0);
}

#[test]
fn enter_normalizes_out_of_range_focus_for_external_link_cards() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="http://example.test/one.wml">One</a>
            <a href="http://example.test/two.wml">Two</a>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine.focused_link_idx = 99;

    engine
        .handle_key_internal("enter")
        .expect("enter should resolve focused external link");

    assert_eq!(engine.focused_link_idx, 1);
    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://example.test/two.wml".to_string())
    );
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("focused=true:href=http://example.test/two.wml:text=Two")));
}

#[test]
fn missing_fragment_returns_error_and_preserves_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#missing">Broken</a>
          </card>
          <card id="next">
            <p>Second</p>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    let err = engine
        .handle_key_internal("enter")
        .expect_err("missing fragment should return error");
    assert!(
        err.contains("Card id not found"),
        "unexpected error message: {err}"
    );
    assert_eq!(engine.active_card_idx, 0);
    assert_eq!(engine.focused_link_idx, 0);
    assert!(engine.nav_stack.is_empty());
}

#[test]
fn field_example_01_loads_and_fragment_navigation_works() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIELD_EXAMPLE_01)
        .expect("field fixture should load");
    assert_eq!(engine.active_card_id().expect("active card"), "main");

    engine
        .handle_key("enter".to_string())
        .expect("enter should move to #content");
    assert_eq!(engine.active_card_id().expect("active card"), "content");
    assert_eq!(engine.external_navigation_intent(), None);
}

#[test]
fn enter_on_external_link_sets_intent_without_mutating_card() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="next.wml?foo=1">Load</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;

    engine
        .load_deck_context(
            xml,
            "http://local.test/dir/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");

    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://local.test/dir/next.wml?foo=1".to_string())
    );
    assert!(engine.nav_stack.is_empty());
}

#[test]
fn clear_external_navigation_intent_removes_intent() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="https://example.org/path">Load</a>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");
    assert_eq!(
        engine.external_navigation_intent(),
        Some("https://example.org/path".to_string())
    );

    engine.clear_external_navigation_intent();
    assert_eq!(engine.external_navigation_intent(), None);
}

#[test]
fn enter_on_focused_input_does_not_trigger_navigation_intent() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: AHMED]")));

    engine
        .handle_key("enter".to_string())
        .expect("input enter should be handled");
    assert_eq!(engine.external_navigation_intent(), None);
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}

#[test]
fn focused_input_edit_commit_updates_render_and_runtime_var() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should start input edit");
    assert_eq!(
        engine.focused_input_edit_name(),
        Some("UserName".to_string())
    );
    assert_eq!(engine.focused_input_edit_value(), Some("AHMED".to_string()));

    assert!(engine.set_focused_input_edit_draft("BOB".to_string()));
    let pending_lines = render_snapshot_lines(&engine);
    assert!(pending_lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: BOB]")));

    assert!(engine
        .commit_focused_input_edit()
        .expect("commit should succeed"));
    assert_eq!(engine.focused_input_edit_name(), None);
    assert_eq!(
        engine.get_var("UserName".to_string()),
        Some("BOB".to_string())
    );
    let committed_lines = render_snapshot_lines(&engine);
    assert!(committed_lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: BOB]")));
}

#[test]
fn focused_input_edit_cancel_keeps_original_value() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_input_edit()
        .expect("begin edit should return result");
    assert!(engine.set_focused_input_edit_draft("BOB".to_string()));
    assert!(engine.cancel_focused_input_edit());
    assert_eq!(engine.focused_input_edit_name(), None);
    assert_eq!(engine.get_var("UserName".to_string()), None);
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: AHMED]")));
}

#[test]
fn focused_input_edit_draft_respects_input_maxlength() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="pin" value="" type="text" maxlength="4"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_input_edit()
        .expect("begin edit should return result");
    assert!(engine.set_focused_input_edit_draft("123456".to_string()));
    assert_eq!(engine.focused_input_edit_value(), Some("1234".to_string()));
}

#[test]
fn external_navigation_query_only_uses_base_document() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="?q=1">Query</a>
          </card>
        </wml>
        "##;

    engine
        .load_deck_context(
            xml,
            "http://local.test/dir/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://local.test/dir/start.wml?q=1".to_string())
    );
}

#[test]
fn external_navigation_parent_segment_resolves() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="../next.wml">Parent</a>
          </card>
        </wml>
        "##;

    engine
        .load_deck_context(
            xml,
            "http://local.test/dir/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://local.test/next.wml".to_string())
    );
}

#[test]
fn external_navigation_scheme_relative_inherits_base_scheme() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="//cdn.example.org/deck.wml">CDN</a>
          </card>
        </wml>
        "##;

    engine
        .load_deck_context(
            xml,
            "http://local.test/dir/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://cdn.example.org/deck.wml".to_string())
    );
}

#[test]
fn load_deck_sets_default_metadata_values() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
        )
        .expect("deck should load");

    assert_eq!(engine.base_url(), "");
    assert_eq!(engine.content_type(), "text/vnd.wap.wml");
}

#[test]
fn load_deck_context_overrides_metadata_values() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
            "http://local.test/path/start.wml",
            "application/vnd.wap.wmlc",
            Some("AQID".to_string()),
        )
        .expect("deck should load");

    assert_eq!(engine.base_url(), "http://local.test/path/start.wml");
    assert_eq!(engine.content_type(), "application/vnd.wap.wmlc");
}

#[test]
fn load_deck_context_rejects_oversized_wml_payload() {
    let mut engine = WmlEngine::new();
    let inner = "a".repeat(MAX_DECK_WML_XML_BYTES + 1);
    let xml = format!("<wml><card id=\"home\"><p>{inner}</p></card></wml>");

    let err = engine
        .load_deck_context(
            &xml,
            "http://local.test/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect_err("oversized deck should be rejected");
    assert!(
        err.contains("Deck payload exceeds"),
        "unexpected error message: {err}"
    );
}

#[test]
fn load_deck_context_rejects_oversized_raw_payload() {
    let mut engine = WmlEngine::new();
    let raw = "A".repeat(MAX_DECK_RAW_BYTES_BASE64_BYTES + 1);

    let err = engine
        .load_deck_context(
            "<wml><card id=\"home\"><p>ok</p></card></wml>",
            "http://local.test/start.wml",
            "application/vnd.wap.wmlc",
            Some(raw),
        )
        .expect_err("oversized raw payload should be rejected");
    assert!(
        err.contains("Raw deck payload exceeds"),
        "unexpected error message: {err}"
    );
}

#[test]
fn load_deck_compat_path_resets_metadata_to_defaults() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#;
    engine
        .load_deck_context(
            xml,
            "http://local.test/path/start.wml",
            "application/vnd.wap.wmlc",
            Some("AQID".to_string()),
        )
        .expect("deck should load");
    assert_eq!(engine.base_url(), "http://local.test/path/start.wml");
    assert_eq!(engine.content_type(), "application/vnd.wap.wmlc");

    engine
        .load_deck(xml)
        .expect("loadDeck should remain functional");
    assert_eq!(engine.base_url(), "");
    assert_eq!(engine.content_type(), "text/vnd.wap.wml");
}
