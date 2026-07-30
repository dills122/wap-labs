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
    engine.set_viewport_cols(80).expect("valid viewport");

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

#[test]
fn wml_302_exponential_timer_refresh_doubling_fails_deterministically_without_partial_commit() {
    // M1-46 / #446: a repeating ontimer refresh doubling a variable through
    // itself ($(x)$(x)) must fail before it can grow into a large
    // allocation, and a failed refresh must not partially apply.
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><a href="#loop">Start</a></card>
          <card id="loop">
            <onevent type="ontimer"><refresh><setvar name="x" value="$(x)$(x)"/></refresh></onevent>
            <timer value="1"/>
            <p>Doubling</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    assert!(engine.set_var("x".to_string(), "a".to_string()));
    engine
        .handle_key("enter".to_string())
        .expect("loop card should open and start the timer");
    assert!(engine.next_timer_wakeup_ms().is_some());

    let mut failure = None;
    let mut last_ok_len = 1usize;
    for _ in 0..30 {
        match engine.advance_time_ms(100) {
            Ok(()) => {
                last_ok_len = engine
                    .get_var("x".to_string())
                    .map(|value| value.len())
                    .unwrap_or(last_ok_len);
            }
            Err(err) => {
                failure = Some(err);
                break;
            }
        }
    }
    let error = failure.expect(
        "exponential doubling must fail deterministically before completing 30 refresh cycles",
    );
    assert!(
        error.contains("byte"),
        "error should be the stable substitution/aggregate budget message, got: {error}"
    );
    assert_eq!(
        engine.get_var("x".to_string()).map(|value| value.len()),
        Some(last_ok_len),
        "a failed refresh must not partially commit the doubled value"
    );
    assert_eq!(engine.active_card_id().as_deref(), Ok("loop"));
}

#[test]
fn wml_302_single_pass_amplification_below_input_limit_fails_deterministically() {
    // Below any single deck/value-size limit individually, but many
    // substitutions of a moderately-sized variable in one attribute can
    // still amplify past the substitution-output bound in one evaluation.
    let mut engine = WmlEngine::new();
    let repeated_refs = "$(a)".repeat(2_000); // 2,000 * 40 bytes = 80,000 > 64 KiB bound
    let xml = format!(
        r##"<wml><card id="home">
              <do type="accept"><refresh><setvar name="out" value="{repeated_refs}"/></refresh></do>
              <p>Home</p>
            </card></wml>"##
    );
    engine.load_deck(&xml).expect("deck should load");
    assert!(engine.set_var("a".to_string(), "x".repeat(40)));

    let error = engine.handle_key("enter".to_string()).expect_err(
        "single-pass amplification must fail deterministically before large allocation",
    );
    assert!(
        error.contains("byte"),
        "error should be the stable substitution budget message, got: {error}"
    );
    assert_eq!(
        engine.get_var("out".to_string()),
        None,
        "the failed setvar must not partially commit"
    );
    assert_eq!(engine.active_card_id().as_deref(), Ok("home"));
}
