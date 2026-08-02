use super::*;

#[test]
fn smoke_load_render_and_snapshot() {
    let mut engine = WmlEngine::new();
    let snapshot = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));

    let render = apply_render(&engine).expect("render should succeed");
    let contains_greeting = render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Text { text, .. } => text.contains("Hello from Waves"),
        _ => false,
    });
    assert!(
        contains_greeting,
        "render output should include greeting text"
    );

    let post = apply_engine_snapshot(&engine);
    assert_eq!(post.focused_link_index, 0);
}

#[test]
fn smoke_key_navigation_and_back_stack() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");

    let after_enter = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate");
    assert_eq!(after_enter.active_card_id.as_deref(), Some("next"));

    let after_back = apply_navigate_back(&mut engine);
    assert_eq!(after_back.active_card_id.as_deref(), Some("home"));
}

#[test]
fn advance_time_command_expires_timer_card_deterministically() {
    let mut engine = WmlEngine::new();
    let xml = r##"
    <wml>
      <card id="home">
        <p><a href="#timed">To timed</a></p>
      </card>
      <card id="timed">
        <onevent type="ontimer"><go href="#done"/></onevent>
        <timer value="2"/>
        <p>Timed</p>
      </card>
      <card id="done"><p>Done</p></card>
    </wml>
    "##;
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(xml),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate to timer card");

    let waiting = apply_engine_snapshot(&engine);
    assert_eq!(waiting.next_timer_wakeup_ms, Some(200));

    let snapshot = apply_advance_time_ms(&mut engine, AdvanceTimeRequest { delta_ms: 200 })
        .expect("advance should trigger ontimer");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("done"));
    assert_eq!(snapshot.next_timer_wakeup_ms, None);
}

#[test]
fn smoke_external_intent_set_and_clear() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(EXTERNAL_LINK_WML),
            base_url: "http://local.test/dir/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");

    apply_set_viewport_cols(&mut engine, super::SetViewportColsRequest { cols: 20 })
        .expect("valid viewport should be accepted");
    let after_enter = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should set external intent");
    assert_eq!(
        after_enter.external_navigation_intent.as_deref(),
        Some("http://local.test/dir/next.wml?foo=1")
    );
    assert_eq!(
        after_enter
            .external_navigation_request_policy
            .as_ref()
            .and_then(|policy| policy.referer_url.as_deref()),
        None
    );

    let after_clear = apply_clear_external_navigation_intent(&mut engine);
    assert_eq!(after_clear.external_navigation_intent, None);
    assert_eq!(after_clear.external_navigation_request_policy, None);
}

#[test]
fn snapshot_exposes_script_dialog_and_timer_requests() {
    let mut engine = WmlEngine::new();
    let script_deck = r##"
    <wml>
      <card id="home">
        <p><a href="script:effects.wmlsc#main">Run</a></p>
      </card>
    </wml>
    "##;
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(script_deck),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");

    let mut unit = Vec::new();
    unit.push(0x03);
    unit.push(5);
    unit.extend_from_slice(b"hello");
    unit.push(0x20);
    unit.push(0x05);
    unit.push(0x01); // alert(message)
    unit.push(0x01);
    unit.push(25);
    unit.push(0x03);
    unit.push(3);
    unit.extend_from_slice(b"otp");
    unit.push(0x20);
    unit.push(0x08);
    unit.push(0x02); // setTimer(delay, token)
    unit.push(0x00);
    engine.register_script_unit("effects.wmlsc".to_string(), unit);
    engine.register_script_entry_point("effects.wmlsc".to_string(), "main".to_string(), 0);

    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should invoke script");

    let snapshot = apply_engine_snapshot(&engine);
    assert_eq!(snapshot.last_script_dialog_requests.len(), 1);
    assert_eq!(snapshot.last_script_timer_requests.len(), 1);
    assert!(matches!(
        snapshot.last_script_dialog_requests[0],
        ScriptDialogRequestSnapshot::Alert { .. }
    ));
    assert!(matches!(
        snapshot.last_script_timer_requests[0],
        ScriptTimerRequestSnapshot::Schedule { .. }
    ));
}

#[test]
fn snapshot_exposes_script_error_class_and_category() {
    // WAP-193_101 12.3.1.7 classifies the VM's Stack/type bytecode-integrity
    // traps as Fatal, not Non-fatal (see `classify_vm_trap` in
    // engine-wasm/engine/src/engine_script_types.rs), so no VM opcode
    // currently produces a reachable non-fatal outcome. This exercises the
    // `ok`/`none` taxonomy the snapshot actually carries for a successful
    // script, alongside the fatal case below.
    let mut engine = WmlEngine::new();
    let script_deck = r##"
    <wml>
      <card id="home">
        <p>
          <a href="script:ok.wmlsc#main">Run ok</a>
          <a href="script:fatal.wmlsc#main">Run fatal</a>
        </p>
      </card>
    </wml>
    "##;
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(script_deck),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");

    engine.register_script_unit("ok.wmlsc".to_string(), vec![0x01, 4, 0x01, 8, 0x02, 0x00]);
    engine.register_script_unit("fatal.wmlsc".to_string(), vec![0xff]);
    engine.register_script_entry_point("ok.wmlsc".to_string(), "main".to_string(), 0);
    engine.register_script_entry_point("fatal.wmlsc".to_string(), "main".to_string(), 0);

    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("successful script should not abort");

    let ok_snapshot = apply_engine_snapshot(&engine);
    assert_eq!(ok_snapshot.last_script_execution_ok, Some(true));
    assert_eq!(
        ok_snapshot.last_script_execution_error_class.as_deref(),
        Some("none")
    );
    assert_eq!(
        ok_snapshot.last_script_execution_error_category.as_deref(),
        Some("none")
    );

    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("focus should move to second link");
    let err = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect_err("fatal script should abort key handling");
    assert!(err.contains("unsupported opcode"));

    let fatal_snapshot = apply_engine_snapshot(&engine);
    assert_eq!(fatal_snapshot.last_script_execution_ok, Some(false));
    assert_eq!(
        fatal_snapshot.last_script_execution_error_class.as_deref(),
        Some("fatal")
    );
    assert_eq!(
        fatal_snapshot
            .last_script_execution_error_category
            .as_deref(),
        Some("integrity")
    );
}

#[test]
fn browser_flow_http_fetch_then_engine_load_succeeds() {
    let wml = r#"<wml><card id="home"><p>HTTP Fetch Deck</p></card></wml>"#;
    let response = mock_fetch_ok("http://example.test/index.wml", "text/vnd.wap.wml", wml);

    let mut engine = WmlEngine::new();
    let snapshot = load_transport_response_into_engine(&mut engine, response)
        .expect("engine loadDeckContext should succeed");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
    assert_render_contains(&engine, "HTTP Fetch Deck");
}

#[test]
fn browser_flow_wap_fetch_then_engine_load_succeeds() {
    let wml = r#"<wml><card id="wap"><p>WAP Fetch Deck</p></card></wml>"#;
    let response = mock_fetch_ok(
        "wap://example.test/start.wml?src=wap",
        "text/vnd.wap.wml",
        wml,
    );
    assert_eq!(response.final_url, "wap://example.test/start.wml?src=wap");

    let mut engine = WmlEngine::new();
    load_transport_response_into_engine(&mut engine, response)
        .expect("engine loadDeckContext should succeed");
    assert_render_contains(&engine, "WAP Fetch Deck");
}

#[test]
fn browser_e2e_fetch_load_render_sequence_renders_expected_content() {
    let wml = r##"
    <wml>
      <card id="home">
        <p>Transport-to-engine pipeline <a href="#next">Next</a></p>
      </card>
      <card id="next"><p>Second</p></card>
    </wml>
    "##;
    let transport = mock_fetch_ok("http://example.test/deck.wml", "text/vnd.wap.wml", wml);
    assert!(transport.ok, "transport fetch should succeed");

    let mut engine = WmlEngine::new();
    let snapshot = load_transport_response_into_engine(&mut engine, transport)
        .expect("loadDeckContext should succeed");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
    assert_render_contains(&engine, "pipeline");
}

#[test]
fn browser_fixture_load_navigate_and_external_intent_flow_is_deterministic() {
    let transport = mock_fetch_ok(
        "http://example.test/fixtures/load-nav-external.wml",
        "text/vnd.wap.wml",
        FIXTURE_LOAD_NAV_EXTERNAL_WML,
    );
    let mut engine = WmlEngine::new();
    let loaded = load_transport_response_into_engine(&mut engine, transport)
        .expect("fixture loadDeckContext should succeed");
    assert_eq!(loaded.active_card_id.as_deref(), Some("home"));
    assert_eq!(loaded.focused_link_index, 0);
    assert_render_contains(&engine, "Fixture Home");

    let after_fragment = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter on first link should navigate to fragment card");
    assert_eq!(after_fragment.active_card_id.as_deref(), Some("menu"));
    assert_eq!(after_fragment.external_navigation_intent, None);
    assert_render_contains(&engine, "Fixture Menu");

    let after_back = apply_navigate_back(&mut engine);
    assert_eq!(after_back.active_card_id.as_deref(), Some("home"));
    assert_eq!(after_back.focused_link_index, 0);

    let after_down = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should advance focus to external link");
    assert_eq!(after_down.active_card_id.as_deref(), Some("home"));
    assert_eq!(after_down.focused_link_index, 1);
    assert_eq!(after_down.external_navigation_intent, None);

    let after_external = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter on second link should emit external intent");
    assert_eq!(after_external.active_card_id.as_deref(), Some("home"));
    assert_eq!(after_external.focused_link_index, 1);
    assert_eq!(
        after_external.external_navigation_intent.as_deref(),
        Some("http://example.test/fixtures/news.wml?src=fixture")
    );
    assert_eq!(
        after_external
            .external_navigation_request_policy
            .as_ref()
            .and_then(|policy| policy.referer_url.as_deref()),
        None
    );

    let after_clear = apply_clear_external_navigation_intent(&mut engine);
    assert_eq!(after_clear.external_navigation_intent, None);
    assert_eq!(after_clear.external_navigation_request_policy, None);

    let repeat_snapshot = apply_engine_snapshot(&engine);
    assert_eq!(repeat_snapshot.active_card_id.as_deref(), Some("home"));
    assert_eq!(repeat_snapshot.focused_link_index, 1);
    assert_eq!(repeat_snapshot.external_navigation_intent, None);
    assert_eq!(repeat_snapshot.external_navigation_request_policy, None);
}

#[test]
fn wml_301_adapter_preserves_context_and_fragment_for_forward_deck_load() {
    let mut engine = WmlEngine::new();
    let source = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(r#"<wml><card id="source"><p>Source</p></card></wml>"#),
            base_url: "http://example.test/source.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: Some("http://example.test/source.wml".to_string()),
            navigation_kind: Some(DeckNavigationKind::Independent),
        },
    )
    .expect("source should load");
    assert!(engine.set_var("token".to_string(), "kept".to_string()));

    let destination = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(
                r#"<wml><card id="fallback"><p>Fallback</p></card><card id="target"><p>Target</p></card></wml>"#,
            ),
            base_url: "http://example.test/destination.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: Some("http://example.test/source.wml".to_string()),
            navigation_url: Some("http://example.test/destination.wml#target".to_string()),
            navigation_kind: Some(DeckNavigationKind::Forward),
        },
    )
    .expect("forward destination should load");

    assert_eq!(destination.active_card_id.as_deref(), Some("target"));
    assert_eq!(
        destination.browser_context_epoch,
        source.browser_context_epoch
    );
    assert_eq!(engine.get_var("token".to_string()).as_deref(), Some("kept"));
}

#[test]
fn wml_301_adapter_projects_duplicate_same_card_history_pushes() {
    let mut engine = WmlEngine::new();
    let initial = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(
                r##"<wml><card id="a"><p><a href="#a">Again</a></p></card></wml>"##,
            ),
            base_url: "http://example.test/a.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("same-card fixture should load");
    assert_eq!(initial.history_push_sequence, Some(0));

    let duplicate = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("same-card key access should succeed");
    assert_eq!(duplicate.active_card_id.as_deref(), Some("a"));
    assert_eq!(duplicate.history_push_sequence, Some(1));
}
