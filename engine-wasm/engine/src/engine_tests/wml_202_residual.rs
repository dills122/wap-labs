use super::*;

const STABLE_DECK: &str = r#"
<wml xml:lang="en">
  <card id="stable"><p>Stable</p></card>
</wml>
"#;

#[test]
fn wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules() {
    let cases = [
        (
            r#"<wml><head><access/></head><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "https://service.example.test/source.wml",
            true,
        ),
        (
            r#"<wml><head><access/></head><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "https://other.example.test/source.wml",
            false,
        ),
        (
            r#"<wml><head><access domain="" path=""/></head><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "https://unrelated.test/elsewhere.wml",
            true,
        ),
        (
            r#"<wml><head><access domain="example.test" path="/allowed"/></head><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "https://WWW.EXAMPLE.TEST/allowed/child.wml",
            true,
        ),
        (
            r#"<wml><head><access domain="example.test" path="/allowed"/></head><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "https://notexample.test/allowed/child.wml",
            false,
        ),
        (
            r#"<wml><head><access domain="example.test" path="/allowed"/></head><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "https://example.test/allowed-extra/child.wml",
            false,
        ),
        (
            r#"<wml><head><access domain="example.test" path="relative"/></head><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "https://example.test/app/relative/child.wml",
            true,
        ),
        (
            r#"<wml><head><access domain="example.test" path="/Allowed"/></head><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "https://example.test/allowed/child.wml",
            false,
        ),
    ];

    for (xml, destination, referring, allowed) in cases {
        let mut engine = WmlEngine::new();
        let result = engine.load_deck_context_with_referring_url(
            xml,
            destination,
            "text/vnd.wap.wml",
            None,
            Some(referring),
        );
        assert_eq!(
            result.is_ok(),
            allowed,
            "destination={destination} referring={referring}"
        );
    }

    let mut unrestricted = WmlEngine::new();
    unrestricted
        .load_deck_context_with_referring_url(
            r#"<wml><card id="home"><p>Home</p></card></wml>"#,
            "https://service.example.test/app/deck.wml",
            "text/vnd.wap.wml",
            None,
            Some("https://unrelated.test/elsewhere.wml"),
        )
        .expect("an absent access element allows any referring deck");
}

#[test]
fn wml_202_access_denial_is_atomic_and_publishes_a_deterministic_error() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context_with_referring_url(
            STABLE_DECK,
            "https://stable.test/deck.wml",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect("stable deck should load");
    engine.set_var("token".to_string(), "preserved".to_string());

    let error = engine
        .load_deck_context_with_referring_url(
            r#"<wml><head><access domain="trusted.test"/></head><card id="blocked"><p>Blocked</p></card></wml>"#,
            "https://service.test/blocked.wml",
            "text/vnd.wap.wml",
            None,
            Some("https://attacker.test/source.wml"),
        )
        .expect_err("mismatched referrer must be denied");

    assert_eq!(error, "Deck access denied for referring URI");
    assert_eq!(engine.active_card_id().as_deref(), Ok("stable"));
    assert_eq!(engine.base_url(), "https://stable.test/deck.wml");
    assert_eq!(
        engine.get_var("token".to_string()).as_deref(),
        Some("preserved")
    );
}

#[test]
fn wml_202_root_language_and_card_language_are_exposed_with_inheritance() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"<wml xml:lang="en-US"><card id="home"><p>Home</p></card><card id="fr" xml:lang="fr"><p>FR</p></card></wml>"#,
        )
        .expect("language metadata deck should load");

    assert_eq!(engine.deck_language().as_deref(), Some("en-US"));
    assert_eq!(engine.active_card_language().as_deref(), Some("en-US"));
    engine
        .navigate_to_card("fr".to_string())
        .expect("direct navigation should succeed");
    assert_eq!(engine.active_card_language().as_deref(), Some("fr"));
}

#[test]
fn wml_202_newcontext_resets_vars_history_and_private_entry_state_only_for_go() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r##"<wml><card id="home"><p><a href="#reset">Reset</a></p></card><card id="reset" newcontext="true"><p>Reset</p></card></wml>"##,
        )
        .expect("newcontext deck should load");
    engine.set_var("secret".to_string(), "value".to_string());
    engine
        .handle_key("enter".to_string())
        .expect("go navigation should succeed");

    assert_eq!(engine.active_card_id().as_deref(), Ok("reset"));
    assert_eq!(engine.get_var("secret".to_string()), None);
    assert!(!engine.navigate_back(), "newcontext must clear go history");
    assert_eq!(engine.focused_link_index(), 0);

    let mut direct = WmlEngine::new();
    direct
        .load_deck(
            r##"<wml><card id="home"><p>Home</p></card><card id="reset" newcontext="true"><p>Reset</p></card></wml>"##,
        )
        .expect("direct-navigation deck should load");
    direct.set_var("secret".to_string(), "value".to_string());
    direct
        .navigate_to_card("reset".to_string())
        .expect("direct navigation should succeed");

    assert_eq!(
        direct.get_var("secret".to_string()).as_deref(),
        Some("value")
    );
    assert!(
        direct.navigate_back(),
        "newcontext is not applied outside a go task"
    );
}

#[test]
fn wml_202_newcontext_entry_failure_restores_the_previous_browser_context() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r##"<wml>
              <card id="home"><p><a href="#reset">Reset</a></p></card>
              <card id="reset" newcontext="true">
                <onevent type="onenterforward"><go href="script:missing.wmlsc#main"/></onevent>
                <p>Reset</p>
              </card>
            </wml>"##,
        )
        .expect("newcontext rollback deck should load");
    engine.set_var("secret".to_string(), "preserved".to_string());

    let error = engine
        .handle_key("enter".to_string())
        .expect_err("failed entry task must reject navigation");

    assert!(error.contains("not registered"));
    assert_eq!(engine.active_card_id().as_deref(), Ok("home"));
    assert_eq!(
        engine.get_var("secret".to_string()).as_deref(),
        Some("preserved")
    );
    assert!(
        !engine.navigate_back(),
        "failed navigation must not create history"
    );
}

#[test]
fn wml_202_card_content_order_is_preserved_in_render_output() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"<wml><card id="home" ordered="false"><p>First</p><p>Second</p><p>Third</p></card></wml>"#,
        )
        .expect("ordered card content should load");

    let texts = engine
        .render()
        .expect("render should succeed")
        .draw
        .into_iter()
        .filter_map(|command| match command {
            DrawCmd::Text { text, .. } => Some(text),
            DrawCmd::Link { .. } => None,
        })
        .collect::<Vec<_>>();
    assert_eq!(texts, ["First", "Second", "Third"]);
}
