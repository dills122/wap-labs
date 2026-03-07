use super::*;

#[test]
fn trace_entries_record_key_and_actions() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate");

    assert!(!engine.trace_entries.is_empty());
    assert!(
        engine.trace_entries.iter().any(|entry| entry.kind == "KEY"),
        "expected KEY trace entry"
    );
    assert!(
        engine
            .trace_entries
            .iter()
            .any(|entry| entry.kind == "ACTION_FRAGMENT"),
        "expected ACTION_FRAGMENT trace entry"
    );
}

#[test]
fn trace_entries_evict_oldest_when_capacity_exceeded() {
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
    engine.clear_trace_entries();

    for _ in 0..(MAX_TRACE_ENTRIES + 10) {
        engine
            .handle_key_internal("noop-key")
            .expect("unknown key should not fail");
    }

    let traces = engine.trace_entries();
    assert_eq!(traces.len(), MAX_TRACE_ENTRIES);
    assert_eq!(traces.first().expect("first trace").seq, 11);
    assert_eq!(
        traces.last().expect("last trace").seq,
        (MAX_TRACE_ENTRIES + 10) as u64
    );
    assert!(traces.iter().all(|entry| entry.kind == "KEY"));
}

#[test]
fn unknown_key_normalizes_focus_without_triggering_actions() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#one">One</a>
            <a href="#two">Two</a>
          </card>
          <card id="one"><p>One</p></card>
          <card id="two"><p>Two</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.focused_link_idx = 99;

    engine
        .handle_key_internal("noop-key")
        .expect("unknown key should be ignored without error");

    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_idx, 1);
    assert!(engine.external_navigation_intent().is_none());
    assert_trace_kinds_subsequence(&engine, &["KEY"]);
    assert!(
        engine.trace_entries().iter().all(|entry| {
            entry.kind != "ACTION_FRAGMENT"
                && entry.kind != "ACTION_SCRIPT"
                && entry.kind != "ACTION_EXTERNAL"
        }),
        "unknown key should not dispatch navigation actions"
    );
}

#[test]
fn trace_entries_include_script_error_taxonomy_for_non_fatal() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:nonfatal.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit(
        "nonfatal.wmlsc".to_string(),
        vec![0x03, 1, b'x', 0x01, 1, 0x02, 0x00],
    );

    engine
        .handle_key("enter".to_string())
        .expect("non-fatal script should not abort action handling");

    let script_ok = engine
        .trace_entries
        .iter()
        .find(|entry| entry.kind == "SCRIPT_OK")
        .expect("SCRIPT_OK trace should be present");
    assert_eq!(script_ok.script_ok, Some(true));
    assert_eq!(
        script_ok.script_error_class,
        Some(ScriptErrorClassLiteral::NonFatal)
    );
    assert_eq!(
        script_ok.script_error_category,
        Some(ScriptErrorCategoryLiteral::Computational)
    );
}

#[test]
fn trace_entries_include_script_error_taxonomy_for_fatal() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:fatal.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit("fatal.wmlsc".to_string(), vec![0xff]);

    let err = engine
        .handle_key_internal("enter")
        .expect_err("fatal decode error should abort action handling");
    assert!(err.contains("unsupported opcode"));

    let script_trap = engine
        .trace_entries
        .iter()
        .find(|entry| entry.kind == "SCRIPT_TRAP")
        .expect("SCRIPT_TRAP trace should be present");
    assert_eq!(script_trap.script_ok, Some(false));
    assert_eq!(
        script_trap.script_error_class,
        Some(ScriptErrorClassLiteral::Fatal)
    );
    assert_eq!(
        script_trap.script_error_category,
        Some(ScriptErrorCategoryLiteral::Integrity)
    );
}

#[test]
fn clear_trace_entries_resets_trace_state() {
    let mut engine = WmlEngine::new();
    engine.push_trace("TEST", "x".to_string());
    assert!(!engine.trace_entries.is_empty());

    engine.clear_trace_entries();
    assert!(engine.trace_entries.is_empty());
    assert_eq!(engine.next_trace_seq, 1);
}

#[test]
fn phase_a_basic_two_card_fixture_snapshot_and_navigation() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_BASIC_TWO_CARD)
        .expect("fixture should load");
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Welcome".to_string(),
            "link:0:1:focused=true:href=#next:text=Go next".to_string(),
        ]
    );

    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Second card".to_string(),
            "link:0:1:focused=true:href=#home:text=Back home".to_string(),
        ]
    );
}

#[test]
fn phase_a_mixed_inline_text_links_fixture_preserves_source_order() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_MIXED_INLINE_TEXT_LINKS)
        .expect("fixture should load");

    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Hello".to_string(),
            "link:0:1:focused=true:href=#next:text=Next".to_string(),
            "text:0:2:and".to_string(),
            "link:0:3:focused=false:href=#final:text=Final".to_string(),
        ]
    );

    engine
        .handle_key("down".to_string())
        .expect("down should move focus to second link");
    assert_eq!(engine.focused_link_index(), 1);
}

#[test]
fn phase_a_link_wrap_fixture_snapshots_widths_and_focus_stability() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_LINK_WRAP)
        .expect("fixture should load");

    engine.set_viewport_cols(16);
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:abcdefghijklmnop".to_string(),
            "text:0:1:qrstuvwx".to_string(),
            "link:0:2:focused=true:href=#one:text=abcdefghijklmnop".to_string(),
            "link:0:3:focused=true:href=#one:text=qrstuvwx".to_string(),
            "link:0:4:focused=false:href=#two:text=short".to_string(),
        ]
    );

    engine.set_viewport_cols(20);
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:abcdefghijklmnopqrst".to_string(),
            "text:0:1:uvwx".to_string(),
            "link:0:2:focused=true:href=#one:text=abcdefghijklmnopqrst".to_string(),
            "link:0:3:focused=true:href=#one:text=uvwx".to_string(),
            "link:0:4:focused=false:href=#two:text=short".to_string(),
        ]
    );

    engine.set_viewport_cols(24);
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:abcdefghijklmnopqrstuvwx".to_string(),
            "link:0:1:focused=true:href=#one:text=abcdefghijklmnopqrstuvwx".to_string(),
            "link:0:2:focused=false:href=#two:text=short".to_string(),
        ]
    );

    engine.set_viewport_cols(8);
    engine
        .handle_key("down".to_string())
        .expect("down should move focus to second logical link");
    assert_eq!(engine.focused_link_index(), 1);
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:abcdefgh".to_string(),
            "text:0:1:ijklmnop".to_string(),
            "text:0:2:qrstuvwx".to_string(),
            "link:0:3:focused=false:href=#one:text=abcdefgh".to_string(),
            "link:0:4:focused=false:href=#one:text=ijklmnop".to_string(),
            "link:0:5:focused=false:href=#one:text=qrstuvwx".to_string(),
            "link:0:6:focused=true:href=#two:text=short".to_string(),
        ]
    );
}

#[test]
fn phase_a_missing_fragment_fixture_keeps_runtime_state_stable() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_MISSING_FRAGMENT)
        .expect("fixture should load");
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Missing fragment".to_string(),
            "text:0:1:check".to_string(),
            "link:0:2:focused=true:href=#missing:text=Broken".to_string(),
        ]
    );

    let err = engine
        .handle_key_internal("enter")
        .expect_err("missing fragment must return error");
    assert!(
        err.contains("Card id not found"),
        "unexpected missing fragment error: {err}"
    );
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);
}

#[test]
fn m1_02_load_deck_context_public_api_sets_metadata_and_state() {
    let mut engine = WmlEngine::new();

    engine
        .load_deck_context(
            SAMPLE,
            "http://example.test/decks/start.wml",
            "application/vnd.wap.xhtml+xml",
            Some("AAECAw==".to_string()),
        )
        .expect("loadDeckContext should succeed");

    assert_eq!(engine.base_url(), "http://example.test/decks/start.wml");
    assert_eq!(engine.content_type(), "application/vnd.wap.xhtml+xml");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);

    let trace = engine.trace_entries();
    assert!(!trace.is_empty(), "trace should contain LOAD_DECK entry");
    assert_eq!(trace[0].kind, "LOAD_DECK");
}

#[test]
fn m1_02_handle_key_render_and_navigate_back_public_api_flow() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_BASIC_TWO_CARD)
        .expect("fixture should load");

    let initial_render = engine.render().expect("initial render");
    assert_eq!(initial_render.draw.len(), 2);
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);

    engine
        .handle_key("enter".to_string())
        .expect("enter should follow fragment");
    let after_enter_render = engine.render().expect("render after enter");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert!(!after_enter_render.draw.is_empty());

    assert!(engine.navigate_back(), "navigateBack should pop history");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);
    assert!(
        !engine.navigate_back(),
        "navigateBack should be false when empty"
    );
}

#[test]
fn m1_02_script_invocation_public_outcome_regression() {
    let mut engine = WmlEngine::new();
    engine.load_deck(SAMPLE).expect("sample deck should load");
    engine.register_script_unit("noop.wmlsc".to_string(), vec![0x00]);

    let invocation = engine
        .invoke_script_ref("noop.wmlsc".to_string())
        .expect("invokeScriptRef should succeed");
    assert_eq!(
        invocation.navigation_intent,
        ScriptNavigationIntentLiteral::None
    );
    assert!(!invocation.requires_refresh);
    assert_eq!(invocation.result, ScriptValueLiteral::String(String::new()));

    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
    assert_eq!(
        engine.last_script_execution_error_class(),
        Some("none".to_string())
    );
    assert_eq!(
        engine.last_script_execution_error_category(),
        Some("none".to_string())
    );
}

#[test]
fn m1_02_load_deck_and_load_deck_context_have_matching_runtime_behavior() {
    let mut engine_compat = WmlEngine::new();
    let mut engine_context = WmlEngine::new();

    engine_compat
        .load_deck(FIXTURE_MIXED_INLINE_TEXT_LINKS)
        .expect("loadDeck path should succeed");
    engine_context
        .load_deck_context(
            FIXTURE_MIXED_INLINE_TEXT_LINKS,
            "http://example.test/fixture.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("loadDeckContext path should succeed");

    assert_eq!(
        render_snapshot_lines(&engine_compat),
        render_snapshot_lines(&engine_context)
    );
    assert_eq!(
        engine_compat.active_card_id().expect("active card"),
        engine_context.active_card_id().expect("active card")
    );
    assert_eq!(
        engine_compat.focused_link_index(),
        engine_context.focused_link_index()
    );

    engine_compat
        .handle_key("down".to_string())
        .expect("down should move focus in compat path");
    engine_context
        .handle_key("down".to_string())
        .expect("down should move focus in context path");
    assert_eq!(
        render_snapshot_lines(&engine_compat),
        render_snapshot_lines(&engine_context)
    );
    assert_eq!(
        engine_compat.focused_link_index(),
        engine_context.focused_link_index()
    );

    engine_compat
        .handle_key("enter".to_string())
        .expect("enter should navigate in compat path");
    engine_context
        .handle_key("enter".to_string())
        .expect("enter should navigate in context path");
    assert_eq!(
        engine_compat.active_card_id().expect("active card"),
        engine_context.active_card_id().expect("active card")
    );
    assert_eq!(
        render_snapshot_lines(&engine_compat),
        render_snapshot_lines(&engine_context)
    );

    assert_eq!(
        engine_compat.navigate_back(),
        engine_context.navigate_back()
    );
    assert_eq!(
        engine_compat.active_card_id().expect("active card"),
        engine_context.active_card_id().expect("active card")
    );
    assert_eq!(
        render_snapshot_lines(&engine_compat),
        render_snapshot_lines(&engine_context)
    );
}

#[test]
fn m1_02_invoke_script_ref_missing_unit_has_stable_error_surface() {
    let mut engine = WmlEngine::new();
    engine.load_deck(SAMPLE).expect("sample deck should load");

    let err = engine
        .invoke_script_ref("missing.wmlsc".to_string())
        .expect_err("missing unit should return invocation error");
    assert!(
        err.contains("script unit not registered"),
        "unexpected invocation error: {err}"
    );

    assert_eq!(engine.last_script_execution_ok(), Some(false));
    assert_eq!(
        engine.last_script_execution_error_class(),
        Some("fatal".to_string())
    );
    assert_eq!(
        engine.last_script_execution_error_category(),
        Some("host-binding".to_string())
    );
    assert!(engine
        .last_script_execution_trap()
        .expect("trap should be present")
        .contains("script unit not registered"));
}
