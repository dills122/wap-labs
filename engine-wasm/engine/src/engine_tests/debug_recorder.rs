use super::*;
use crate::{
    EngineDebugErrorCode, EngineDebugEventKind, EngineDebugEventPayload,
    EngineDebugPostfieldResolutionSource, EngineDebugRedactionReason, EngineDebugValue,
    ENGINE_DEBUG_EVENT_BUFFER_CAPACITY, ENGINE_DEBUG_MAX_TEXT_BYTES,
};

const DEBUG_FLOW: &str = r##"
<wml>
  <card id="home">
    <input name="user"/>
    <a href="#next">Next</a>
  </card>
  <card id="next">
    <timer name="tick" value="1"/>
    <p>Next</p>
  </card>
</wml>
"##;

fn run_debug_flow() -> WmlEngine {
    let mut engine = WmlEngine::new();
    engine.set_debug_recording_enabled(true);
    engine.load_deck(DEBUG_FLOW).expect("deck should load");
    assert!(engine
        .begin_focused_input_edit()
        .expect("input edit should start"));
    assert!(engine.set_focused_input_edit_draft("alice".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("input edit should commit"));
    engine
        .handle_key("down".to_string())
        .expect("focus should move");
    engine
        .handle_key("enter".to_string())
        .expect("link should navigate");
    engine
        .advance_time_ms(100)
        .expect("timer should deterministically fire");
    engine
}

#[test]
fn debug_event_order_and_logical_time_are_deterministic() {
    let first = run_debug_flow();
    let second = run_debug_flow();
    let first_batch = first
        .poll_debug_events("0", 256)
        .expect("events should poll");
    let second_batch = second
        .poll_debug_events("0", 256)
        .expect("events should poll");

    assert_eq!(
        serde_json::to_value(&first_batch.events).unwrap(),
        serde_json::to_value(&second_batch.events).unwrap()
    );
    assert_eq!(
        first_batch
            .events
            .iter()
            .map(|event| &event.kind)
            .collect::<Vec<_>>(),
        [
            &EngineDebugEventKind::DeckLoad,
            &EngineDebugEventKind::CardEnter,
            &EngineDebugEventKind::InputEditStart,
            &EngineDebugEventKind::InputEditDraft,
            &EngineDebugEventKind::InputEditCommit,
            &EngineDebugEventKind::FocusChange,
            &EngineDebugEventKind::NavigationIntent,
            &EngineDebugEventKind::CardExit,
            &EngineDebugEventKind::FocusChange,
            &EngineDebugEventKind::CardEnter,
            &EngineDebugEventKind::TimerSchedule,
            &EngineDebugEventKind::TimerFire,
        ]
    );
    assert_eq!(
        first_batch
            .events
            .iter()
            .map(|event| event.seq.as_str())
            .collect::<Vec<_>>(),
        (1..=12).map(|seq| seq.to_string()).collect::<Vec<_>>()
    );
    assert!(first_batch.events[..11]
        .iter()
        .all(|event| event.monotonic_time_ms == 0));
    assert_eq!(first_batch.events[11].monotonic_time_ms, 100);
    assert_eq!(first.debug_event_cursor().as_deref(), Ok("12"));
}

#[test]
fn public_recorder_drops_oldest_and_reports_cursor_gap_exactly() {
    let mut engine = WmlEngine::new();
    engine.set_debug_recording_enabled(true);
    engine
        .load_deck("<wml><card id=\"home\"><input name=\"field\"/></card></wml>")
        .expect("deck should load");
    assert!(engine
        .begin_focused_input_edit()
        .expect("input edit should start"));
    for index in 0..ENGINE_DEBUG_EVENT_BUFFER_CAPACITY + 2 {
        assert!(engine.set_focused_input_edit_draft(index.to_string()));
    }

    let batch = engine
        .poll_debug_events("0", 256)
        .expect("old cursor should resume at retained window");
    assert_eq!(batch.dropped_count, 5);
    assert_eq!(
        batch.events.first().map(|event| event.seq.as_str()),
        Some("6")
    );
    assert_eq!(batch.events.len(), 256);
    assert!(batch.has_more);
    let snapshot = engine.debug_snapshot().expect("snapshot should succeed");
    assert_eq!(snapshot.buffer.dropped_count, 5);
    assert_eq!(snapshot.buffer.oldest_seq.as_deref(), Some("6"));
    assert_eq!(snapshot.buffer.latest_seq.as_deref(), Some("2053"));
}

#[test]
fn secrets_are_masked_before_events_and_snapshots_enter_debug_dtos() {
    const CANARY: &str = "D0_02_SECRET_CANARY_7f4a";
    let mut engine = WmlEngine::new();
    engine.set_debug_recording_enabled(true);
    engine
        .load_deck_context(
            r##"
            <wml><card id="login">
              <do type="accept"><go href="/submit?token=D0_02_SECRET_CANARY_7f4a" method="post">
                <postfield name="account" value="$(account)"/>
                <postfield name="$(account)" value="visible"/>
                <setvar name="copied" value="$(account)"/>
                <setvar name="$(account)" value="derived"/>
              </go></do>
              <input name="account" type="password"/>
            </card></wml>
            "##,
            "https://user:D0_02_SECRET_CANARY_7f4a@example.test/login.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("secret fixture should load");
    assert!(engine
        .begin_focused_input_edit()
        .expect("password edit should start"));
    assert!(engine.set_focused_input_edit_draft(CANARY.to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("password edit should commit"));
    assert!(engine.set_var("authToken".to_string(), CANARY.to_string()));
    assert!(engine.set_var(
        "oversized".to_string(),
        "x".repeat(ENGINE_DEBUG_MAX_TEXT_BYTES as usize + 1)
    ));
    engine
        .handle_key("enter".to_string())
        .expect("accept action should resolve external request");
    assert!(engine
        .begin_focused_input_edit()
        .expect("password edit should restart"));
    assert!(engine.set_focused_input_edit_draft(CANARY.to_string()));

    let events = engine
        .poll_debug_events("0", 256)
        .expect("events should poll");
    let snapshot = engine.debug_snapshot().expect("snapshot should succeed");
    let serialized_events = serde_json::to_string(&events).unwrap();
    let serialized_snapshot = serde_json::to_string(&snapshot).unwrap();
    assert!(!serialized_events.contains(CANARY));
    assert!(!serialized_snapshot.contains(CANARY));

    let account = snapshot
        .runtime_vars
        .iter()
        .find(|entry| entry.name == "account")
        .expect("account variable should be present");
    assert_eq!(
        account.value,
        EngineDebugValue::Masked {
            reason: EngineDebugRedactionReason::PasswordInput
        }
    );
    let copied = snapshot
        .runtime_vars
        .iter()
        .find(|entry| entry.name == "copied")
        .expect("derived variable should be present");
    assert!(matches!(copied.value, EngineDebugValue::Masked { .. }));
    let token = snapshot
        .runtime_vars
        .iter()
        .find(|entry| entry.name == "authToken")
        .expect("sensitive-name variable should be present");
    assert_eq!(
        token.value,
        EngineDebugValue::Masked {
            reason: EngineDebugRedactionReason::SensitiveName
        }
    );
    let oversized = snapshot
        .runtime_vars
        .iter()
        .find(|entry| entry.name == "oversized")
        .expect("oversized variable should be present");
    assert_eq!(
        oversized.value,
        EngineDebugValue::Omitted {
            reason: EngineDebugRedactionReason::BoundedOutput
        }
    );
    assert!(matches!(
        snapshot.base_url,
        EngineDebugValue::Masked {
            reason: EngineDebugRedactionReason::CredentialBearingUrl
        }
    ));
    let pending = snapshot
        .pending_external_navigation
        .expect("external navigation should be pending");
    assert!(matches!(
        pending.target,
        EngineDebugValue::Masked {
            reason: EngineDebugRedactionReason::CredentialBearingUrl
        }
    ));
    assert!(matches!(
        pending.post_body,
        Some(EngineDebugValue::Masked {
            reason: EngineDebugRedactionReason::TransportSecret
        })
    ));
    let postfield_event = events
        .events
        .iter()
        .find_map(|event| match &event.payload {
            EngineDebugEventPayload::PostfieldResolve { fields } => Some(fields),
            _ => None,
        })
        .expect("postfield event should be present");
    assert_eq!(
        postfield_event[0].source,
        EngineDebugPostfieldResolutionSource::Variable
    );
    assert!(matches!(
        postfield_event[0].value,
        EngineDebugValue::Masked { .. }
    ));
    assert_eq!(postfield_event[1].name, "<masked>");
}

#[test]
fn snapshots_sort_and_bound_runtime_variables() {
    let mut engine = WmlEngine::new();
    engine.set_debug_recording_enabled(true);
    for index in (0..257).rev() {
        assert!(engine.set_var(format!("value{index:03}"), index.to_string()));
    }

    let snapshot = engine.debug_snapshot().expect("snapshot should succeed");
    assert_eq!(snapshot.runtime_vars.len(), 256);
    assert_eq!(snapshot.runtime_vars_summary.total_count, 257);
    assert_eq!(snapshot.runtime_vars_summary.returned_count, 256);
    assert!(snapshot.runtime_vars_summary.truncated);
    assert_eq!(snapshot.runtime_vars[0].name, "value000");
    assert_eq!(snapshot.runtime_vars[255].name, "value255");
}

#[test]
fn cancel_script_trap_and_timer_cancel_boundaries_emit_without_secret_detail() {
    const CANARY: &str = "D0_02_SCRIPT_SECRET_CANARY";
    let mut engine = WmlEngine::new();
    engine.set_debug_recording_enabled(true);
    engine
        .load_deck(
            r##"<wml>
              <card id="home">
                <timer name="session" value="10"/>
                <input name="field"/>
                <a href="#next">Next</a>
              </card>
              <card id="next"><p>Next</p></card>
            </wml>"##,
        )
        .expect("deck should load");
    assert!(engine
        .begin_focused_input_edit()
        .expect("input edit should start"));
    assert!(engine.cancel_focused_input_edit());
    let outcome = engine.execute_script_ref_function(
        format!("https://user:{CANARY}@example.test/unit.wmlsc"),
        CANARY.to_string(),
    );
    assert!(!outcome.ok);
    engine
        .handle_key("down".to_string())
        .expect("focus should move to link");
    engine
        .handle_key("enter".to_string())
        .expect("link should navigate and cancel the timer");

    let events = engine
        .poll_debug_events("0", 256)
        .expect("events should poll");
    for expected in [
        EngineDebugEventKind::InputEditCancel,
        EngineDebugEventKind::ScriptInvoke,
        EngineDebugEventKind::ScriptTrap,
        EngineDebugEventKind::TimerCancel,
    ] {
        assert!(
            events.events.iter().any(|event| event.kind == expected),
            "missing {expected:?} boundary"
        );
    }
    assert!(!serde_json::to_string(&events).unwrap().contains(CANARY));
}

#[test]
fn disabled_debug_source_is_inert_and_unavailable() {
    let mut baseline = WmlEngine::new();
    let mut disabled = WmlEngine::new();
    disabled.set_debug_recording_enabled(false);
    for engine in [&mut baseline, &mut disabled] {
        engine.load_deck(DEBUG_FLOW).expect("deck should load");
        engine
            .handle_key("down".to_string())
            .expect("focus should move");
        engine
            .handle_key("enter".to_string())
            .expect("link should navigate");
    }

    assert_eq!(
        render_snapshot_lines(&baseline),
        render_snapshot_lines(&disabled)
    );
    assert_eq!(baseline.active_card_id(), disabled.active_card_id());
    assert_eq!(baseline.focused_link_index(), disabled.focused_link_index());
    assert_eq!(
        serde_json::to_value(baseline.trace_entries()).unwrap(),
        serde_json::to_value(disabled.trace_entries()).unwrap()
    );
    let error = disabled
        .poll_debug_events("0", 1)
        .expect_err("disabled recorder should be unavailable");
    assert_eq!(error.code, EngineDebugErrorCode::DebugSourceUnavailable);
    assert!(error.retryable);
}

#[test]
fn recorder_activation_is_idempotent_and_reactivation_starts_fresh() {
    let mut engine = WmlEngine::new();
    assert!(!engine.debug_recording_enabled());
    engine.set_debug_recording_enabled(true);
    engine
        .load_deck("<wml><card id=\"home\"><p>Home</p></card></wml>")
        .expect("deck should load");
    assert_eq!(engine.debug_event_cursor().as_deref(), Ok("2"));

    engine.set_debug_recording_enabled(true);
    assert_eq!(engine.debug_event_cursor().as_deref(), Ok("2"));
    engine.set_debug_recording_enabled(false);
    assert!(!engine.debug_recording_enabled());
    assert_eq!(
        engine
            .debug_event_cursor()
            .expect_err("disabled recorder should be unavailable")
            .code,
        EngineDebugErrorCode::DebugSourceUnavailable
    );

    engine.set_debug_recording_enabled(true);
    assert_eq!(engine.debug_event_cursor().as_deref(), Ok("0"));
}
