use super::*;

fn borrowed_state(state: &AppState) -> tauri::State<'_, AppState> {
    // `tauri::State<'_, T>` is a tuple wrapper around `&T`; tests can borrow it directly.
    unsafe { std::mem::transmute::<&AppState, tauri::State<'_, AppState>>(state) }
}

fn borrowed_fetch_state(state: &HostFetchState) -> tauri::State<'_, HostFetchState> {
    // `tauri::State<'_, T>` is a tuple wrapper around `&T`; tests can borrow it directly.
    unsafe { std::mem::transmute::<&HostFetchState, tauri::State<'_, HostFetchState>>(state) }
}

#[test]
fn tauri_command_wrappers_drive_managed_state_roundtrip() {
    let state = AppState::default();

    let loaded = super::super::engine_load_deck_context(
        borrowed_state(&state),
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
    .expect("load should succeed");
    assert_eq!(loaded.active_card_id.as_deref(), Some("home"));

    let rendered =
        super::super::engine_render(borrowed_state(&state)).expect("render should succeed");
    assert!(
        rendered.draw.iter().any(|cmd| match cmd {
            DrawCmd::Text { text, .. } => text.contains("Hello from Waves"),
            DrawCmd::Link { text, .. } => text.contains("Next"),
        }),
        "render output should include deck content"
    );

    let after_enter = super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate");
    assert_eq!(after_enter.active_card_id.as_deref(), Some("next"));

    let after_back =
        super::super::engine_navigate_back(borrowed_state(&state)).expect("back should succeed");
    assert_eq!(after_back.active_card_id.as_deref(), Some("home"));

    let snapshot =
        super::super::engine_snapshot(borrowed_state(&state)).expect("snapshot should succeed");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
}

#[test]
fn tauri_frame_command_wrappers_return_snapshot_and_render_together() {
    let state = AppState::default();

    let loaded = super::super::engine_load_deck_context_frame(
        borrowed_state(&state),
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
    .expect("frame load should succeed");
    assert_eq!(loaded.snapshot.active_card_id.as_deref(), Some("home"));
    assert_eq!(loaded.presentation.contract_version, 1);
    assert_eq!(loaded.presentation.card.id, "home");
    assert_eq!(loaded.presentation.frame_id.len(), 16);
    assert_eq!(
        loaded.presentation.focus.as_ref().map(|focus| focus.index),
        Some(0)
    );
    assert!(
        loaded.render.draw.iter().any(|cmd| match cmd {
            DrawCmd::Text { text, .. } => text.contains("Hello from Waves"),
            DrawCmd::Link { text, .. } => text.contains("Next"),
        }),
        "frame load render should include deck content"
    );

    let rendered = super::super::engine_render_frame(borrowed_state(&state))
        .expect("frame render should succeed");
    assert_eq!(rendered.snapshot.active_card_id.as_deref(), Some("home"));

    let after_enter = super::super::engine_handle_key_frame(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("frame enter should succeed");
    assert_eq!(after_enter.snapshot.active_card_id.as_deref(), Some("next"));

    let after_back = super::super::engine_navigate_back_frame(borrowed_state(&state))
        .expect("frame back should succeed");
    assert_eq!(after_back.snapshot.active_card_id.as_deref(), Some("home"));

    let typed_action = super::super::engine_handle_input_frame(
        borrowed_state(&state),
        HandleInputRequest {
            event: EngineInputEvent::ActivateAction {
                frame_id: after_back.presentation.frame_id,
                action_id: "focus:0".to_string(),
            },
        },
    )
    .expect("typed frame action should succeed");
    assert_eq!(
        typed_action.snapshot.active_card_id.as_deref(),
        Some("next")
    );
    assert_eq!(typed_action.presentation.card.id, "next");

    super::super::engine_navigate_back_frame(borrowed_state(&state))
        .expect("second frame back should succeed");

    let advanced = super::super::engine_advance_time_ms_frame(
        borrowed_state(&state),
        AdvanceTimeRequest { delta_ms: 50 },
    )
    .expect("frame advance should succeed");
    assert_eq!(advanced.snapshot.active_card_id.as_deref(), Some("home"));
}

#[test]
fn tauri_command_wrappers_cover_viewport_and_direct_navigation_paths() {
    let state = AppState::default();

    let loaded = super::super::engine_load_deck(
        borrowed_state(&state),
        LoadDeckRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
        },
    )
    .expect("load should succeed");
    assert_eq!(loaded.active_card_id.as_deref(), Some("home"));

    let resized = super::super::engine_set_viewport_cols(
        borrowed_state(&state),
        SetViewportColsRequest { cols: 10 },
    )
    .expect("viewport resize should succeed");
    assert_eq!(resized.active_card_id.as_deref(), Some("home"));

    let navigated = super::super::engine_navigate_to_card(
        borrowed_state(&state),
        NavigateToCardRequest {
            card_id: "next".to_string(),
        },
    )
    .expect("direct card navigation should succeed");
    assert_eq!(navigated.active_card_id.as_deref(), Some("next"));

    let snapshot =
        super::super::engine_snapshot(borrowed_state(&state)).expect("snapshot should succeed");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("next"));

    let frame = super::super::engine_navigate_to_card_frame(
        borrowed_state(&state),
        NavigateToCardRequest {
            card_id: "home".to_string(),
        },
    )
    .expect("direct frame navigation should succeed");
    assert_eq!(frame.snapshot.active_card_id.as_deref(), Some("home"));
    assert!(
        frame.render.draw.iter().any(|cmd| match cmd {
            DrawCmd::Text { text, .. } => text.contains("Hello from Waves"),
            DrawCmd::Link { text, .. } => text.contains("Next"),
        }),
        "frame navigation render should include deck content"
    );
}

#[test]
fn tauri_viewport_command_returns_typed_range_error_before_mutation() {
    let state = AppState::default();
    let error = super::super::engine_set_viewport_cols(
        borrowed_state(&state),
        SetViewportColsRequest {
            cols: (u32::MAX as usize) + 1,
        },
    )
    .expect_err("one-over-limit viewport should fail at the Tauri boundary");

    assert_eq!(
        error.code,
        crate::host_contract::HostCommandErrorCode::InvalidRequest
    );
    let snapshot = super::super::engine_snapshot(borrowed_state(&state))
        .expect("engine should remain available after rejection");
    assert_eq!(snapshot.active_card_id, None);

    super::super::engine_set_viewport_cols(
        borrowed_state(&state),
        SetViewportColsRequest { cols: 20 },
    )
    .expect("valid viewport should succeed after rejection");
}

#[test]
fn tauri_fetch_deck_command_executes_through_async_boundary() {
    let fetch_state = HostFetchState::default();
    let response = tauri::async_runtime::block_on(super::super::fetch_deck(
        borrowed_fetch_state(&fetch_state),
        FetchDeckRequest {
            url: "http://example.test".to_string(),
            method: Some("POST".to_string()),
            headers: None,
            timeout_ms: None,
            retries: None,
            request_id: Some("async-fetch-command".to_string()),
            request_policy: None,
        },
    ))
    .expect("fetch command should return its transport response");
    assert!(!response.ok);
    assert_eq!(
        response
            .error
            .as_ref()
            .and_then(|error| error.details.as_ref())
            .and_then(|details| details.get("requestId"))
            .and_then(|value| value.as_str()),
        Some("async-fetch-command")
    );
}

#[test]
fn host_fetch_admission_is_bounded_and_cancel_command_marks_active_work() {
    let state = HostFetchState::default();
    let active = state.register("navigation-1");

    assert!(
        super::super::cancel_fetch(borrowed_fetch_state(&state), "navigation-1".to_string())
            .expect("bounded cancellation identifier should be accepted")
    );
    assert!(active.cancellation.is_cancelled());
    assert!(
        !super::super::cancel_fetch(borrowed_fetch_state(&state), "missing".to_string())
            .expect("bounded cancellation identifier should be accepted")
    );

    let first = state
        .admission
        .clone()
        .try_acquire_owned()
        .expect("first fetch should be admitted");
    let second = state
        .admission
        .clone()
        .try_acquire_owned()
        .expect("replacement fetch should be admitted");
    assert!(state.admission.clone().try_acquire_owned().is_err());
    drop(first);
    assert!(state.admission.clone().try_acquire_owned().is_ok());
    drop(second);
}

#[test]
fn oversized_fetch_ingress_is_rejected_before_registration_or_spawn() {
    let state = HostFetchState::default();
    let secret = "s".repeat(lowband_transport_rust::MAX_REQUEST_HEADER_BYTES);
    let error = tauri::async_runtime::block_on(super::super::fetch_deck(
        borrowed_fetch_state(&state),
        FetchDeckRequest {
            url: "http://example.test/deck.wml".to_string(),
            method: None,
            headers: Some(std::collections::HashMap::from([(
                "x".to_string(),
                secret.clone(),
            )])),
            timeout_ms: None,
            retries: None,
            request_id: None,
            request_policy: None,
        },
    ))
    .expect_err("oversized headers must fail before host work");

    assert_eq!(
        error.code,
        crate::host_contract::HostCommandErrorCode::InvalidRequest
    );
    assert!(!error.message.contains(&secret));
    assert!(state.active().is_empty());
    assert_eq!(
        state.admission.available_permits(),
        super::super::MAX_CONCURRENT_HOST_FETCHES
    );
}

#[test]
fn oversized_encoded_body_is_rejected_before_registration_or_spawn() {
    let state = HostFetchState::default();
    let secret = "s".repeat(lowband_transport_rust::MAX_POST_FIELD_VALUE_BYTES - 6);
    let fields = [
        ("a", lowband_transport_rust::MAX_POST_FIELD_VALUE_BYTES),
        ("b", lowband_transport_rust::MAX_POST_FIELD_VALUE_BYTES),
        ("c", lowband_transport_rust::MAX_POST_FIELD_VALUE_BYTES),
    ]
    .into_iter()
    .map(
        |(value, count)| lowband_transport_rust::FetchRequestPostField {
            name: String::new(),
            value: value.repeat(count),
        },
    )
    .chain(std::iter::once(
        lowband_transport_rust::FetchRequestPostField {
            name: String::new(),
            value: secret.clone(),
        },
    ))
    .collect();
    let error = tauri::async_runtime::block_on(super::super::fetch_deck(
        borrowed_fetch_state(&state),
        FetchDeckRequest {
            url: "http://example.test/submit".to_string(),
            method: Some("POST".to_string()),
            headers: None,
            timeout_ms: None,
            retries: None,
            request_id: None,
            request_policy: Some(lowband_transport_rust::FetchRequestPolicy {
                destination_policy: None,
                cache_control: None,
                referer_url: None,
                post_context: None,
                request_intent: Some(lowband_transport_rust::FetchRequestIntent {
                    method: lowband_transport_rust::FetchRequestMethod::Post,
                    enctype: "application/x-www-form-urlencoded".to_string(),
                    send_referer: false,
                    accept_charset: Some("utf-8".to_string()),
                    same_deck: false,
                    post_fields: fields,
                    source_content_type: None,
                }),
                ua_capability_profile: None,
            }),
        },
    ))
    .expect_err("oversized encoded body must fail before host work");

    assert_eq!(
        error.code,
        crate::host_contract::HostCommandErrorCode::InvalidRequest
    );
    assert!(!error.message.contains(&secret));
    assert!(state.active().is_empty());
    assert_eq!(
        state.admission.available_permits(),
        super::super::MAX_CONCURRENT_HOST_FETCHES
    );
}

#[test]
fn correlation_id_one_over_limit_is_recoverable() {
    let state = HostFetchState::default();
    let oversized = "c".repeat(lowband_transport_rust::MAX_REQUEST_ID_BYTES + 1);
    let error = super::super::cancel_fetch(borrowed_fetch_state(&state), oversized.clone())
        .expect_err("one-over correlation identifier must fail");
    assert_eq!(
        error.code,
        crate::host_contract::HostCommandErrorCode::InvalidRequest
    );
    assert!(!error.message.contains(&oversized));

    let active = state.register("bounded-id");
    assert!(
        super::super::cancel_fetch(borrowed_fetch_state(&state), "bounded-id".to_string())
            .expect("command should remain usable")
    );
    assert!(active.cancellation.is_cancelled());
}

#[test]
fn card_id_and_edit_draft_one_over_limits_fail_before_engine_lock() {
    let state = AppState::default();
    let poison_result = std::panic::catch_unwind(|| {
        let _guard = state
            .engine
            .lock()
            .expect("engine lock should start healthy");
        panic!("poison engine lock for ordering test");
    });
    assert!(poison_result.is_err());

    let oversized_card = "c".repeat(crate::host_contract::MAX_HOST_CARD_ID_BYTES + 1);
    let card_error = super::super::engine_navigate_to_card(
        borrowed_state(&state),
        NavigateToCardRequest {
            card_id: oversized_card.clone(),
        },
    )
    .expect_err("one-over card id must fail");
    assert_eq!(
        card_error.code,
        crate::host_contract::HostCommandErrorCode::InvalidRequest
    );
    assert!(!card_error.message.contains(&oversized_card));

    let oversized_draft = "d".repeat(crate::host_contract::MAX_HOST_EDIT_DRAFT_BYTES + 1);
    let draft_error = super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: oversized_draft.clone(),
        },
    )
    .expect_err("one-over edit draft must fail");
    assert_eq!(
        draft_error.code,
        crate::host_contract::HostCommandErrorCode::InvalidRequest
    );
    assert!(!draft_error.message.contains(&oversized_draft));

    let mutex_error = super::super::engine_snapshot(borrowed_state(&state))
        .expect_err("first lock after poison must surface a typed error");
    assert_eq!(
        mutex_error.code,
        crate::host_contract::HostCommandErrorCode::MutexUnavailable
    );
    super::super::engine_snapshot(borrowed_state(&state))
        .expect("mutex recovery must leave later commands usable");
}

#[test]
fn host_context_metadata_one_over_limit_is_recoverable() {
    let state = AppState::default();
    for field in ["base", "referring", "navigation", "content-type"] {
        let limit = if field == "content-type" {
            crate::host_contract::MAX_HOST_CONTENT_TYPE_BYTES
        } else {
            crate::host_contract::MAX_HOST_CONTEXT_URL_BYTES
        };
        let oversized = "u".repeat(limit + 1);
        let mut request = LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        };
        match field {
            "base" => request.base_url = oversized.clone(),
            "referring" => request.referring_url = Some(oversized.clone()),
            "navigation" => request.navigation_url = Some(oversized.clone()),
            "content-type" => request.content_type = oversized.clone(),
            _ => unreachable!(),
        }
        let error = super::super::engine_load_deck_context(borrowed_state(&state), request)
            .expect_err("one-over context metadata must fail");
        assert_eq!(
            error.code,
            crate::host_contract::HostCommandErrorCode::InvalidRequest
        );
        assert!(!error.message.contains(&oversized));
    }

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/recovery.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("valid context must succeed after rejection");
}

#[test]
fn cancellable_host_fetch_stops_before_transport_work_when_pre_cancelled() {
    let cancellation = FetchCancellationToken::default();
    cancellation.cancel();
    let response = fetch_deck_cancellable(
        FetchDeckRequest {
            url: "http://example.test/hung.wml".to_string(),
            method: Some("GET".to_string()),
            headers: None,
            timeout_ms: Some(30_000),
            retries: Some(2),
            request_id: Some("cancelled-before-admission".to_string()),
            request_policy: None,
        },
        cancellation,
    );

    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|error| error.code.as_str()),
        Some("CANCELLED")
    );
}

#[test]
fn tauri_command_wrappers_handle_external_intent_and_timer_paths() {
    let state = AppState::default();

    super::super::engine_load_deck_context(
        borrowed_state(&state),
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
    .expect("load should succeed");
    let after_enter = super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should set external intent");
    assert_eq!(
        after_enter.external_navigation_intent.as_deref(),
        Some("http://local.test/dir/next.wml?foo=1")
    );

    let after_clear = super::super::engine_clear_external_navigation_intent(borrowed_state(&state))
        .expect("clear should succeed");
    assert_eq!(after_clear.external_navigation_intent, None);

    let after_enter_frame = super::super::engine_handle_key_frame(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("frame enter should set external intent");
    assert_eq!(
        after_enter_frame
            .snapshot
            .external_navigation_intent
            .as_deref(),
        Some("http://local.test/dir/next.wml?foo=1")
    );

    let after_clear_frame =
        super::super::engine_clear_external_navigation_intent_frame(borrowed_state(&state))
            .expect("frame clear should succeed");
    assert_eq!(after_clear_frame.snapshot.external_navigation_intent, None);

    let timer_state = AppState::default();
    let xml = r##"
    <wml>
      <card id="home">
        <p><a href="#timed">To timed</a></p>
      </card>
      <card id="timed">
        <onevent type="ontimer"><go href="#done"/></onevent>
        <timer value="1"/>
        <p>Timed</p>
      </card>
      <card id="done"><p>Done</p></card>
    </wml>
    "##;
    super::super::engine_load_deck_context(
        borrowed_state(&timer_state),
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
    .expect("load should succeed");
    super::super::engine_handle_key(
        borrowed_state(&timer_state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate to timed card");
    let advanced = super::super::engine_advance_time_ms(
        borrowed_state(&timer_state),
        AdvanceTimeRequest { delta_ms: 100 },
    )
    .expect("advance should succeed");
    assert_eq!(advanced.active_card_id.as_deref(), Some("done"));
}

#[test]
fn tauri_command_wrappers_surface_oversized_load_deck_context_errors() {
    let state = AppState::default();
    let oversized_xml = format!(
        "<wml><card id=\"home\"><p>{}</p></card></wml>",
        "a".repeat((512 * 1024) + 1)
    );

    let xml_error = super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: oversized_xml,
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect_err("oversized xml should fail");
    assert_eq!(
        xml_error.code,
        crate::host_contract::HostCommandErrorCode::EngineFailure
    );

    let raw_error = super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "application/vnd.wap.wmlc".to_string(),
            raw_bytes_base64: Some("A".repeat((1024 * 1024) + 1)),
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect_err("oversized raw payload should fail");
    assert_eq!(
        raw_error.code,
        crate::host_contract::HostCommandErrorCode::EngineFailure
    );
}

#[test]
fn tauri_command_wrappers_handle_focused_input_edit_commands() {
    let state = AppState::default();
    let wml = r##"
    <wml>
      <card id="home">
        <p><input name="UserName" value="AHMED" type="text"/></p>
      </card>
    </wml>
    "##;

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(wml),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("load should succeed");

    let begin = super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin focused input edit should succeed");
    assert_eq!(begin.focused_input_edit_name.as_deref(), Some("UserName"));
    assert_eq!(begin.focused_input_edit_value.as_deref(), Some("AHMED"));

    let drafted = super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "BOB".to_string(),
        },
    )
    .expect("set focused input draft should succeed");
    assert_eq!(drafted.focused_input_edit_value.as_deref(), Some("BOB"));
    let render =
        super::super::engine_render(borrowed_state(&state)).expect("render should succeed");
    assert!(render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Link { text, href, .. } => {
            href == "input:UserName" && text.contains("[UserName: BOB]")
        }
        _ => false,
    }));

    let committed = super::super::engine_commit_focused_input_edit(borrowed_state(&state))
        .expect("commit focused input edit should succeed");
    assert_eq!(committed.focused_input_edit_name, None);
    assert_eq!(committed.focused_input_edit_value, None);

    let begin_again = super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin focused input edit should succeed");
    assert_eq!(begin_again.focused_input_edit_value.as_deref(), Some("BOB"));
    let cancelled = super::super::engine_cancel_focused_input_edit(borrowed_state(&state))
        .expect("cancel focused input edit should succeed");
    assert_eq!(cancelled.focused_input_edit_name, None);
}

#[test]
fn tauri_frame_command_wrappers_handle_focused_input_edit_commands() {
    let state = AppState::default();
    let wml = r##"
    <wml>
      <card id="home">
        <p><input name="UserName" value="AHMED" type="text"/></p>
      </card>
    </wml>
    "##;

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(wml),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("load should succeed");

    let begin = super::super::engine_begin_focused_input_edit_frame(borrowed_state(&state))
        .expect("frame begin focused input edit should succeed");
    assert_eq!(
        begin.snapshot.focused_input_edit_name.as_deref(),
        Some("UserName")
    );

    let drafted = super::super::engine_set_focused_input_edit_draft_frame(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "BOB".to_string(),
        },
    )
    .expect("frame set focused input draft should succeed");
    assert_eq!(
        drafted.snapshot.focused_input_edit_value.as_deref(),
        Some("BOB")
    );
    assert!(drafted.render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Link { text, href, .. } =>
            href == "input:UserName" && text.contains("[UserName: BOB]"),
        _ => false,
    }));

    let committed = super::super::engine_commit_focused_input_edit_frame(borrowed_state(&state))
        .expect("frame commit focused input edit should succeed");
    assert_eq!(committed.snapshot.focused_input_edit_name, None);

    let cancelled = super::super::engine_cancel_focused_input_edit_frame(borrowed_state(&state))
        .expect("frame cancel focused input edit should succeed");
    assert_eq!(cancelled.snapshot.focused_input_edit_name, None);
}

#[test]
fn tauri_command_wrappers_handle_focused_select_edit_commands() {
    let state = AppState::default();
    let wml = r##"
    <wml>
      <card id="home">
        <p>
          <select name="Country" title="Country">
            <option value="Jordan">Jordan</option>
            <option value="France">France</option>
            <option value="Germany">Germany</option>
          </select>
        </p>
      </card>
    </wml>
    "##;

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(wml),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("load should succeed");

    let begin = super::super::engine_begin_focused_select_edit(borrowed_state(&state))
        .expect("begin focused select edit should succeed");
    assert_eq!(begin.focused_select_edit_name.as_deref(), Some("Country"));
    assert_eq!(begin.focused_select_edit_value.as_deref(), Some("Jordan"));

    let moved = super::super::engine_move_focused_select_edit(
        borrowed_state(&state),
        MoveFocusedSelectEditRequest { delta: 1 },
    )
    .expect("move focused select edit should succeed");
    assert_eq!(moved.focused_select_edit_value.as_deref(), Some("France"));
    let render =
        super::super::engine_render(borrowed_state(&state)).expect("render should succeed");
    assert!(render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Link { text, href, .. } => href == "select:Country" && text.contains("France"),
        _ => false,
    }));

    let committed = super::super::engine_commit_focused_select_edit(borrowed_state(&state))
        .expect("commit focused select edit should succeed");
    assert_eq!(committed.focused_select_edit_name, None);
    let begin_again = super::super::engine_begin_focused_select_edit(borrowed_state(&state))
        .expect("begin focused select edit should succeed");
    assert_eq!(
        begin_again.focused_select_edit_value.as_deref(),
        Some("France")
    );
    let cancelled = super::super::engine_cancel_focused_select_edit(borrowed_state(&state))
        .expect("cancel focused select edit should succeed");
    assert_eq!(cancelled.focused_select_edit_name, None);
}

#[test]
fn tauri_frame_command_wrappers_handle_focused_select_edit_commands() {
    let state = AppState::default();
    let wml = r##"
    <wml>
      <card id="home">
        <p>
          <select name="Country" title="Country">
            <option value="Jordan">Jordan</option>
            <option value="France">France</option>
            <option value="Germany">Germany</option>
          </select>
        </p>
      </card>
    </wml>
    "##;

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(wml),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("load should succeed");

    let begin = super::super::engine_begin_focused_select_edit_frame(borrowed_state(&state))
        .expect("frame begin focused select edit should succeed");
    assert_eq!(
        begin.snapshot.focused_select_edit_name.as_deref(),
        Some("Country")
    );

    let moved = super::super::engine_move_focused_select_edit_frame(
        borrowed_state(&state),
        MoveFocusedSelectEditRequest { delta: 1 },
    )
    .expect("frame move focused select edit should succeed");
    assert_eq!(
        moved.snapshot.focused_select_edit_value.as_deref(),
        Some("France")
    );
    assert!(moved.render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Link { text, href, .. } => href == "select:Country" && text.contains("France"),
        _ => false,
    }));

    let committed = super::super::engine_commit_focused_select_edit_frame(borrowed_state(&state))
        .expect("frame commit focused select edit should succeed");
    assert_eq!(committed.snapshot.focused_select_edit_name, None);

    let cancelled = super::super::engine_cancel_focused_select_edit_frame(borrowed_state(&state))
        .expect("frame cancel focused select edit should succeed");
    assert_eq!(cancelled.snapshot.focused_select_edit_name, None);
}

#[test]
fn tauri_command_wrappers_submit_two_input_post_payload_after_edit_flow() {
    let state = AppState::default();
    let wml = r##"
    <wml>
      <card id="login">
        <do type="accept">
          <go method="post" href="/login">
            <postfield name="username" value="$(username)"/>
            <postfield name="pin" value="$(pin)"/>
          </go>
        </do>
        <p>User: <input name="username" value="" type="text"/></p>
        <p>PIN: <input name="pin" value="" type="password"/></p>
      </card>
    </wml>
    "##;

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(wml),
            base_url: "wap://localhost/login".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("load should succeed");

    super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin username edit should succeed");
    super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "usern1220".to_string(),
        },
    )
    .expect("username draft should succeed");
    super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down key should commit username and move focus");

    super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin pin edit should succeed");
    super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "1220".to_string(),
        },
    )
    .expect("pin draft should succeed");
    super::super::engine_commit_focused_input_edit(borrowed_state(&state))
        .expect("pin commit should succeed");

    let submitted = super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should execute accept action");
    let policy = submitted
        .external_navigation_request_policy
        .expect("submit should emit external navigation request policy");
    let post_context = policy
        .post_context
        .expect("submit should include post context");
    assert_eq!(
        post_context.payload.as_deref(),
        Some("username=usern1220&pin=1220")
    );
}

#[test]
fn tauri_command_wrappers_submit_uses_name_fallback_for_empty_templates() {
    let state = AppState::default();
    let wml = r##"
    <wml>
      <card id="login">
        <do type="accept">
          <go method="post" href="/login">
            <postfield name="username" value=""/>
            <postfield name="pin" value=""/>
          </go>
        </do>
        <p>User: <input name="username" value="" type="text"/></p>
        <p>PIN: <input name="pin" value="" type="password"/></p>
      </card>
    </wml>
    "##;

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(wml),
            base_url: "wap://localhost/login".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("load should succeed");

    super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin username edit should succeed");
    super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "tester".to_string(),
        },
    )
    .expect("username draft should succeed");
    super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down key should commit username and move focus");

    super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin pin edit should succeed");
    super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "1220".to_string(),
        },
    )
    .expect("pin draft should succeed");
    let submitted = super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should execute accept action");
    let policy = submitted
        .external_navigation_request_policy
        .expect("submit should emit external navigation request policy");
    let post_context = policy
        .post_context
        .expect("submit should include post context");
    assert_eq!(
        post_context.payload.as_deref(),
        Some("username=tester&pin=1220")
    );
}

#[test]
fn wml_304_tauri_snapshot_preserves_engine_request_intent() {
    let state = AppState::default();
    let wml = r##"
    <wml><card id="home"><do type="accept"><go href="/submit" method="post"
      sendreferer="true" cache-control="no-cache" accept-charset="utf-8">
      <postfield name="first" value="1"/><postfield name="second" value="2"/>
    </go></do></card></wml>
    "##;
    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(wml),
            base_url: "https://example.test/deck.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("load should succeed");

    let submitted = super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should execute accept action");
    let policy = submitted
        .external_navigation_request_policy
        .expect("submit should emit a request policy");
    let intent = policy
        .request_intent
        .expect("native host snapshot should preserve request intent");
    assert!(matches!(
        intent.method,
        crate::contract_types::ExternalNavigationMethodSnapshot::Post
    ));
    assert_eq!(intent.enctype, "application/x-www-form-urlencoded");
    assert!(intent.send_referer);
    assert_eq!(intent.accept_charset.as_deref(), Some("utf-8"));
    assert_eq!(
        intent
            .post_fields
            .iter()
            .map(|field| field.name.as_str())
            .collect::<Vec<_>>(),
        ["first", "second"]
    );
}
