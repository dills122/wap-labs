use super::*;

#[test]
fn smoke_load_render_and_snapshot() {
    let mut engine = WmlEngine::new();
    let snapshot = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
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
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
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
        <a href="#timed">To timed</a>
      </card>
      <card id="timed">
        <timer value="2"/>
        <onevent type="ontimer"><go href="#done"/></onevent>
        <p>Timed</p>
      </card>
      <card id="done"><p>Done</p></card>
    </wml>
    "##;
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: xml.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
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

    let snapshot = apply_advance_time_ms(&mut engine, AdvanceTimeRequest { delta_ms: 200 })
        .expect("advance should trigger ontimer");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("done"));
}

#[test]
fn smoke_external_intent_set_and_clear() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: EXTERNAL_LINK_WML.to_string(),
            base_url: "http://local.test/dir/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("deck should load");

    apply_set_viewport_cols(&mut engine, super::SetViewportColsRequest { cols: 20 });
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
        Some("http://local.test/dir/start.wml")
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
        <a href="script:effects.wmlsc#main">Run</a>
      </card>
    </wml>
    "##;
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: script_deck.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
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
    let mut engine = WmlEngine::new();
    let script_deck = r##"
    <wml>
      <card id="home">
        <a href="script:nonfatal.wmlsc#main">Run non-fatal</a>
        <a href="script:fatal.wmlsc#main">Run fatal</a>
      </card>
    </wml>
    "##;
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: script_deck.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("deck should load");

    engine.register_script_unit(
        "nonfatal.wmlsc".to_string(),
        vec![0x03, 1, b'x', 0x01, 1, 0x02, 0x00],
    );
    engine.register_script_unit("fatal.wmlsc".to_string(), vec![0xff]);

    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("non-fatal script should not abort");

    let nonfatal_snapshot = apply_engine_snapshot(&engine);
    assert_eq!(nonfatal_snapshot.last_script_execution_ok, Some(true));
    assert_eq!(
        nonfatal_snapshot
            .last_script_execution_error_class
            .as_deref(),
        Some("non-fatal")
    );
    assert_eq!(
        nonfatal_snapshot
            .last_script_execution_error_category
            .as_deref(),
        Some("computational")
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
        <p>Transport-to-engine pipeline</p>
        <a href="#next">Next</a>
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
        Some("http://example.test/fixtures/load-nav-external.wml")
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
