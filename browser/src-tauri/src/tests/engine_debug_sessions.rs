use super::*;

fn borrowed_state(state: &AppState) -> tauri::State<'_, AppState> {
    // `tauri::State<'_, T>` is a tuple wrapper around `&T`; tests can borrow it directly.
    unsafe { std::mem::transmute::<&AppState, tauri::State<'_, AppState>>(state) }
}

fn enabled_state() -> AppState {
    AppState::with_debug_policy_enabled(true)
}

fn open(state: &AppState) -> wavenav_engine::EngineDebugSession {
    match super::super::engine_debug_open_session(
        borrowed_state(state),
        EngineDebugOpenSessionRequest {
            protocol_version: 1,
        },
    ) {
        EngineDebugOpenSessionOutcome::Success { session } => session,
        EngineDebugOpenSessionOutcome::Failure { error } => {
            panic!("debug session should open: {error:?}")
        }
    }
}

#[test]
fn debug_policy_is_default_disabled_and_requires_explicit_local_enablement() {
    let disabled = AppState::default();
    let outcome = super::super::engine_debug_open_session(
        borrowed_state(&disabled),
        EngineDebugOpenSessionRequest {
            protocol_version: 1,
        },
    );

    let EngineDebugOpenSessionOutcome::Failure { error } = outcome else {
        panic!("default policy must reject debug sessions");
    };
    assert_eq!(error.code, EngineDebugErrorCode::DebugDisabled);
    assert_eq!(
        error.message,
        "engine debug connector is disabled by host policy"
    );
    assert!(!error.retryable);
    assert!(!disabled
        .engine
        .lock()
        .expect("engine lock should remain available")
        .debug_recording_enabled());

    for value in ["enabled", "ENABLED", "1", "true", "invalid", ""] {
        let expected = value == "enabled";
        assert_eq!(
            crate::engine_bridge::EngineDebugPolicy::from_config_value(Some(value)).is_enabled(),
            expected,
            "only the explicit local enabled value may activate debug sessions"
        );
    }

    with_env_removed_locked(waves_config::ENGINE_DEBUG_POLICY_ENV, || {
        assert!(!AppState::from_local_config().debug_policy.is_enabled());
    });
    with_env_var_locked(
        waves_config::ENGINE_DEBUG_POLICY_ENV,
        waves_config::ENGINE_DEBUG_POLICY_ENABLED,
        || assert!(AppState::from_local_config().debug_policy.is_enabled()),
    );
}

#[test]
fn debug_session_lifecycle_activates_polls_snapshots_and_deactivates_recorder() {
    let state = enabled_state();
    let session = open(&state);
    assert_eq!(session.cursor, "0");
    assert_eq!(session.capabilities.protocol_version, 1);
    assert_eq!(session.capabilities.session_limit, 1);
    assert_eq!(session.capabilities.max_events_per_poll, 256);
    assert!(state
        .engine
        .lock()
        .expect("engine lock should be available")
        .debug_recording_enabled());

    super::super::engine_load_deck(
        borrowed_state(&state),
        LoadDeckRequest {
            wml_xml: canonical_text_wml(
                "<wml><card id=\"home\"><p><input name=\"field\"/></p></card></wml>",
            ),
        },
    )
    .expect("deck should load while recording");

    let polled = super::super::engine_debug_poll_events(
        borrowed_state(&state),
        EngineDebugPollEventsRequest {
            session_id: session.session_id.clone(),
            cursor: session.cursor.clone(),
            max_events: 100,
        },
    );
    let EngineDebugPollEventsOutcome::Success { batch } = polled else {
        panic!("debug events should poll");
    };
    assert_eq!(batch.events.len(), 2);
    assert_eq!(batch.next_cursor, "2");
    assert_eq!(batch.dropped_count, 0);
    assert!(!batch.has_more);

    let snapshot = super::super::engine_debug_get_snapshot(
        borrowed_state(&state),
        EngineDebugSnapshotRequest {
            session_id: session.session_id.clone(),
        },
    );
    let EngineDebugSnapshotOutcome::Success { snapshot } = snapshot else {
        panic!("debug snapshot should succeed");
    };
    assert_eq!(snapshot.captured_seq, "2");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));

    let closed = super::super::engine_debug_close_session(
        borrowed_state(&state),
        EngineDebugCloseSessionRequest {
            session_id: session.session_id.clone(),
        },
    );
    assert_eq!(
        closed,
        EngineDebugCloseSessionOutcome::Success {
            result: wavenav_engine::EngineDebugCloseSessionResult { closed: true }
        }
    );
    assert!(!state
        .engine
        .lock()
        .expect("engine lock should remain available")
        .debug_recording_enabled());

    let closed_again = super::super::engine_debug_close_session(
        borrowed_state(&state),
        EngineDebugCloseSessionRequest {
            session_id: session.session_id,
        },
    );
    assert_eq!(
        closed_again,
        EngineDebugCloseSessionOutcome::Success {
            result: wavenav_engine::EngineDebugCloseSessionResult { closed: false }
        }
    );
}

#[test]
fn debug_session_enforces_protocol_and_single_session_limit() {
    let state = enabled_state();
    let unsupported = super::super::engine_debug_open_session(
        borrowed_state(&state),
        EngineDebugOpenSessionRequest {
            protocol_version: 2,
        },
    );
    let EngineDebugOpenSessionOutcome::Failure { error } = unsupported else {
        panic!("unsupported protocol must fail");
    };
    assert_eq!(error.code, EngineDebugErrorCode::UnsupportedProtocolVersion);
    assert!(!error.retryable);

    let session = open(&state);
    let second = super::super::engine_debug_open_session(
        borrowed_state(&state),
        EngineDebugOpenSessionRequest {
            protocol_version: 1,
        },
    );
    let EngineDebugOpenSessionOutcome::Failure { error } = second else {
        panic!("second concurrent session must fail");
    };
    assert_eq!(error.code, EngineDebugErrorCode::SessionLimitReached);
    assert!(error.retryable);

    let _ = super::super::engine_debug_close_session(
        borrowed_state(&state),
        EngineDebugCloseSessionRequest {
            session_id: session.session_id,
        },
    );
}

#[test]
fn debug_poll_preserves_cursor_gaps_and_sanitizes_invalid_cursor_errors() {
    const CANARY: &str = "pin=super-secret-debug-cursor";
    let state = enabled_state();
    let session = open(&state);
    {
        let mut engine = state
            .engine
            .lock()
            .expect("engine lock should be available");
        engine
            .load_deck(&canonical_text_wml(
                "<wml><card id=\"home\"><p><input name=\"field\"/></p></card></wml>",
            ))
            .expect("deck should load");
        engine
            .begin_focused_input_edit()
            .expect("input edit should start");
        for index in 0..=wavenav_engine::ENGINE_DEBUG_EVENT_BUFFER_CAPACITY {
            engine.set_focused_input_edit_draft(index.to_string());
        }
    }

    let gap = super::super::engine_debug_poll_events(
        borrowed_state(&state),
        EngineDebugPollEventsRequest {
            session_id: session.session_id.clone(),
            cursor: "0".to_string(),
            max_events: 256,
        },
    );
    let EngineDebugPollEventsOutcome::Success { batch } = gap else {
        panic!("old cursor should resume at retained window");
    };
    assert_eq!(batch.dropped_count, 4);
    assert_eq!(
        batch.events.first().map(|event| event.seq.as_str()),
        Some("5")
    );
    assert_eq!(batch.events.len(), 256);
    assert!(batch.has_more);

    let invalid = super::super::engine_debug_poll_events(
        borrowed_state(&state),
        EngineDebugPollEventsRequest {
            session_id: session.session_id,
            cursor: CANARY.to_string(),
            max_events: 1,
        },
    );
    let EngineDebugPollEventsOutcome::Failure { error } = invalid else {
        panic!("malformed cursor must fail");
    };
    assert_eq!(error.code, EngineDebugErrorCode::InvalidCursor);
    assert_eq!(error.message, "debug event cursor is invalid");
    assert!(!error.message.contains(CANARY));
}

#[test]
fn debug_poll_validates_bounds_and_absent_sessions_with_typed_errors() {
    let state = enabled_state();
    let session = open(&state);
    for max_events in [0, 257] {
        let outcome = super::super::engine_debug_poll_events(
            borrowed_state(&state),
            EngineDebugPollEventsRequest {
                session_id: session.session_id.clone(),
                cursor: session.cursor.clone(),
                max_events,
            },
        );
        let EngineDebugPollEventsOutcome::Failure { error } = outcome else {
            panic!("invalid poll bound must fail");
        };
        assert_eq!(error.code, EngineDebugErrorCode::InvalidRequest);
        assert!(!error.retryable);
    }

    let absent = super::super::engine_debug_get_snapshot(
        borrowed_state(&state),
        EngineDebugSnapshotRequest {
            session_id: "foreign-process-session".to_string(),
        },
    );
    let EngineDebugSnapshotOutcome::Failure { error } = absent else {
        panic!("foreign session must fail");
    };
    assert_eq!(error.code, EngineDebugErrorCode::SessionNotFound);
    assert_eq!(error.message, "engine debug session was not found");
}

#[test]
fn debug_host_internal_failures_are_typed_sanitized_and_recoverable() {
    const CANARY: &str = "D0_03_INTERNAL_SECRET_CANARY";
    let state = enabled_state();
    let session = open(&state);
    let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _engine = state
            .engine
            .lock()
            .expect("engine lock should be available");
        panic!("{CANARY}");
    }));

    let failed = super::super::engine_debug_poll_events(
        borrowed_state(&state),
        EngineDebugPollEventsRequest {
            session_id: session.session_id.clone(),
            cursor: session.cursor.clone(),
            max_events: 1,
        },
    );
    let EngineDebugPollEventsOutcome::Failure { error } = failed else {
        panic!("poisoned engine state must return a typed debug failure");
    };
    assert_eq!(error.code, EngineDebugErrorCode::InternalError);
    assert_eq!(error.message, "engine debug host state is unavailable");
    assert!(error.retryable);
    assert!(!error.message.contains(CANARY));

    let recovered = super::super::engine_debug_poll_events(
        borrowed_state(&state),
        EngineDebugPollEventsRequest {
            session_id: session.session_id,
            cursor: session.cursor,
            max_events: 1,
        },
    );
    assert!(matches!(
        recovered,
        EngineDebugPollEventsOutcome::Success { .. }
    ));
}

#[test]
fn debug_close_reopen_rotates_identity_and_old_close_cannot_end_new_session() {
    let state = enabled_state();
    let first = open(&state);
    let first_close = super::super::engine_debug_close_session(
        borrowed_state(&state),
        EngineDebugCloseSessionRequest {
            session_id: first.session_id.clone(),
        },
    );
    assert!(matches!(
        first_close,
        EngineDebugCloseSessionOutcome::Success {
            result: wavenav_engine::EngineDebugCloseSessionResult { closed: true }
        }
    ));

    let second = open(&state);
    assert_ne!(second.session_id, first.session_id);
    assert_eq!(second.cursor, "0");

    let stale_close = super::super::engine_debug_close_session(
        borrowed_state(&state),
        EngineDebugCloseSessionRequest {
            session_id: first.session_id,
        },
    );
    assert!(matches!(
        stale_close,
        EngineDebugCloseSessionOutcome::Success {
            result: wavenav_engine::EngineDebugCloseSessionResult { closed: false }
        }
    ));

    let current = super::super::engine_debug_get_snapshot(
        borrowed_state(&state),
        EngineDebugSnapshotRequest {
            session_id: second.session_id,
        },
    );
    assert!(matches!(
        current,
        EngineDebugSnapshotOutcome::Success { .. }
    ));
}
