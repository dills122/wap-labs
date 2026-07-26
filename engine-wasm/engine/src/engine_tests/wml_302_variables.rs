use super::{render_snapshot_lines, WmlEngine};

#[test]
fn wml_302_text_and_link_targets_substitute_after_xml_parsing() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r##"
            <wml>
              <card id="home">
                <p>Cash $$ &#36;(Raw:noesc) $(Missing) Escape $(Raw:escape) Unescape $(Encoded:unesc) Cases $(Raw)/$(raw)</p>
                <a href="/find/$(Raw)">Go $(Raw:noesc)</a>
              </card>
            </wml>
            "##,
            "https://example.test/decks/home.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    assert!(engine.set_var("Raw".to_string(), "A B".to_string()));
    assert!(engine.set_var("Encoded".to_string(), "A%20B".to_string()));
    assert!(engine.set_var("raw".to_string(), "lower".to_string()));
    engine.set_viewport_cols(80);

    let lines = render_snapshot_lines(&engine);
    assert!(lines.iter().any(|line| line.contains("Cash $ A B")));
    assert!(lines
        .iter()
        .any(|line| line.contains("Escape A%20B Unescape A B Cases A B/lower")));
    assert!(lines
        .iter()
        .any(|line| line.contains("href=/find/A%20B:text=Go A B")));

    engine
        .handle_key("enter".to_string())
        .expect("ordinary link should activate");
    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("https://example.test/find/A%20B")
    );
    assert_eq!(engine.get_var("Raw".to_string()).as_deref(), Some("A B"));
    assert_eq!(
        engine.get_var("Encoded".to_string()).as_deref(),
        Some("A%20B")
    );
}

#[test]
fn wml_302_invalid_text_reference_rejects_load_atomically() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(r#"<wml><card id="stable"><p>Stable</p></card></wml>"#)
        .expect("baseline deck should load");
    assert!(engine.set_var("session".to_string(), "preserved".to_string()));

    engine
        .load_deck(r#"<wml><card id="bad"><p>Balance $10.00</p></card></wml>"#)
        .expect_err("invalid PCDATA reference must reject the deck");

    assert_eq!(engine.active_card_id().as_deref(), Ok("stable"));
    assert_eq!(
        engine.get_var("session".to_string()).as_deref(),
        Some("preserved")
    );
}

#[test]
fn wml_302_go_snapshots_setvars_and_target_before_ordered_assignment() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r##"
            <wml>
              <card id="home">
                <do type="accept">
                  <go href="next/$(Target)">
                    <setvar name="$(DestinationName)" value="$(Value)"/>
                    <setvar name="Value" value="new"/>
                    <setvar name="$(InvalidName)" value="ignored"/>
                  </go>
                </do>
              </card>
            </wml>
            "##,
            "https://example.test/decks/home.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    for (name, value) in [
        ("Target", "old path"),
        ("DestinationName", "Copied"),
        ("InvalidName", "9bad"),
        ("Value", "old"),
    ] {
        assert!(engine.set_var(name.to_string(), value.to_string()));
    }

    engine
        .handle_key("enter".to_string())
        .expect("accept task should execute");

    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("https://example.test/decks/next/old%20path")
    );
    assert_eq!(engine.get_var("Copied".to_string()).as_deref(), Some("old"));
    assert_eq!(engine.get_var("Value".to_string()).as_deref(), Some("new"));
    assert_eq!(engine.get_var("9bad".to_string()), None);
}

#[test]
fn wml_302_prev_applies_snapshot_after_history_target_before_entry_task() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r##"
            <wml>
              <card id="home"><a href="#middle">Middle</a></card>
              <card id="middle" onenterbackward="#$(Route)">
                <a href="#next">Next</a>
              </card>
              <card id="next">
                <do type="accept">
                  <prev><setvar name="Route" value="landed"/></prev>
                </do>
              </card>
              <card id="landed"><p>Assignments preceded backward entry.</p></card>
            </wml>
            "##,
        )
        .expect("deck should load");
    engine.handle_key("enter".to_string()).expect("go middle");
    engine.handle_key("enter".to_string()).expect("go next");
    engine.handle_key("enter".to_string()).expect("prev task");

    assert_eq!(engine.active_card_id().as_deref(), Ok("landed"));
    assert_eq!(
        engine.get_var("Route".to_string()).as_deref(),
        Some("landed")
    );
}

#[test]
fn wml_302_refresh_assigns_without_navigation_and_setvar_is_task_scoped() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml>
              <card id="home">
                <do type="accept">
                  <refresh><setvar name="Message" value="updated"/></refresh>
                </do>
                <p>Message: $(Message)</p>
              </card>
            </wml>
            "#,
        )
        .expect("deck should load");
    assert_eq!(engine.get_var("Message".to_string()), None);

    engine
        .handle_key("enter".to_string())
        .expect("refresh task");

    assert_eq!(engine.active_card_id().as_deref(), Ok("home"));
    assert_eq!(
        engine.get_var("Message".to_string()).as_deref(),
        Some("updated")
    );
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("Message: updated")));
}

#[test]
fn wml_302_link_target_uses_control_values_committed_before_task() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r##"
            <wml>
              <card id="home">
                <select name="choice"><option value="alpha">Alpha</option></select>
                <a href="#$(choice)">Follow committed choice</a>
              </card>
              <card id="alpha"><p>Committed choice won.</p></card>
              <card id="tampered"><p>Stale variable must not win.</p></card>
            </wml>
            "##,
        )
        .expect("deck should load");
    assert!(engine.set_var("choice".to_string(), "tampered".to_string()));
    engine.handle_key("down".to_string()).expect("focus link");
    engine
        .handle_key("enter".to_string())
        .expect("activate link");

    assert_eq!(engine.active_card_id().as_deref(), Ok("alpha"));
    assert_eq!(
        engine.get_var("choice".to_string()).as_deref(),
        Some("alpha")
    );
}

#[test]
fn wml_302_newcontext_and_task_failure_preserve_existing_atomicity() {
    let mut reset = WmlEngine::new();
    reset
        .load_deck(
            r##"
            <wml>
              <card id="home">
                <do type="accept"><go href="#fresh"><setvar name="Pending" value="set"/></go></do>
              </card>
              <card id="fresh" newcontext="true"><p>Fresh</p></card>
            </wml>
            "##,
        )
        .expect("deck should load");
    reset
        .handle_key("enter".to_string())
        .expect("go should succeed");
    assert_eq!(reset.active_card_id().as_deref(), Ok("fresh"));
    assert_eq!(reset.get_var("Pending".to_string()), None);

    let mut failed = WmlEngine::new();
    failed
        .load_deck(
            r##"
            <wml><card id="home">
              <do type="accept"><go href="#missing"><setvar name="Value" value="changed"/></go></do>
            </card></wml>
            "##,
        )
        .expect("deck should load");
    assert!(failed.set_var("Value".to_string(), "original".to_string()));
    failed
        .handle_key("enter".to_string())
        .expect_err("missing target should fail");
    assert_eq!(failed.active_card_id().as_deref(), Ok("home"));
    assert_eq!(
        failed.get_var("Value".to_string()).as_deref(),
        Some("original")
    );
}
