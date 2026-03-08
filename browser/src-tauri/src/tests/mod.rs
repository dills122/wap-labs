pub(super) use super::{fetch_deck, health};
pub(super) use crate::contract_types::{
    AdvanceTimeRequest, DrawCmd, EngineKey, HandleKeyRequest, LoadDeckContextRequest,
    LoadDeckRequest, NavigateToCardRequest, ScriptDialogRequestSnapshot,
    ScriptTimerRequestSnapshot, SetViewportColsRequest,
};
pub(super) use crate::engine_bridge::{
    apply_advance_time_ms, apply_clear_external_navigation_intent, apply_engine_snapshot,
    apply_handle_key, apply_load_deck, apply_load_deck_context, apply_navigate_back,
    apply_navigate_to_card, apply_render, apply_set_viewport_cols, command_engine_advance_time_ms,
    command_engine_clear_external_navigation_intent, command_engine_handle_key,
    command_engine_load_deck, command_engine_load_deck_context, command_engine_navigate_back,
    command_engine_navigate_to_card, command_engine_render, command_engine_set_viewport_cols,
    command_engine_snapshot, AppState,
};
pub(super) use crate::fetch_host::{
    default_fetch_destination_policy, default_fetch_transport_fallback,
    default_fetch_transport_profile, ensure_request_id, next_request_id,
    HostFetchTransportFallback, HostFetchTransportProfile,
};
pub(super) use crate::waves_config;
pub(super) use lowband_transport_rust::{
    EngineDeckInputPayload, FetchDeckRequest, FetchDeckResponse, FetchDestinationPolicy,
    FetchRequestPolicy, FetchTiming,
};
pub(super) use std::sync::{Mutex, OnceLock};
pub(super) use wavenav_engine::WmlEngine;

const BASIC_NAV_WML: &str = r##"
<wml>
  <card id="home">
    <p>Hello from Waves</p>
    <a href="#next">Next</a>
  </card>
  <card id="next">
    <p>Second card</p>
  </card>
</wml>
"##;

const EXTERNAL_LINK_WML: &str = r##"
<wml>
  <card id="home">
    <a href="next.wml?foo=1">Load External</a>
  </card>
</wml>
"##;

const FIXTURE_LOAD_NAV_EXTERNAL_WML: &str =
    include_str!("../../tests/fixtures/integration/load-nav-external.wml");
const TASK_ACTION_ORDER_WML: &str = r##"
<wml>
  <card id="home">
    <a href="#accept-go">Accept go</a>
    <a href="#accept-prev">Accept prev</a>
    <a href="#accept-refresh">Accept refresh</a>
    <a href="#accept-noop">Accept noop</a>
    <a href="#accept-broken">Accept broken</a>
  </card>
  <card id="accept-go">
    <do type="accept"><go href="#target"/></do>
    <p>Accept go.</p>
  </card>
  <card id="accept-prev">
    <do type="accept"><prev/></do>
    <p>Accept prev.</p>
  </card>
  <card id="accept-refresh">
    <do type="accept"><refresh/></do>
    <p>Accept refresh.</p>
  </card>
  <card id="accept-noop">
    <do type="accept"><noop/></do>
    <p>Accept noop.</p>
  </card>
  <card id="accept-broken">
    <do type="accept"><go href="#missing"/></do>
    <p>Accept broken.</p>
  </card>
  <card id="target">
    <p>Target.</p>
  </card>
</wml>
"##;

fn mock_fetch_ok(url: &str, content_type: &str, wml: &str) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: true,
        status: 200,
        final_url: url.to_string(),
        content_type: content_type.to_string(),
        wml: Some(wml.to_string()),
        error: None,
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: 1.0,
            decode: 0.0,
        },
        engine_deck_input: Some(EngineDeckInputPayload {
            wml_xml: wml.to_string(),
            base_url: url.to_string(),
            content_type: content_type.to_string(),
            raw_bytes_base64: None,
        }),
    }
}

fn env_lock() -> &'static Mutex<()> {
    static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(()))
}

fn with_env_var_locked<T>(name: &str, value: &str, f: impl FnOnce() -> T) -> T {
    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous = std::env::var(name).ok();
    std::env::set_var(name, value);
    let out = f();
    if let Some(old) = previous {
        std::env::set_var(name, old);
    } else {
        std::env::remove_var(name);
    }
    out
}

fn with_env_removed_locked<T>(name: &str, f: impl FnOnce() -> T) -> T {
    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous = std::env::var(name).ok();
    std::env::remove_var(name);
    let out = f();
    if let Some(old) = previous {
        std::env::set_var(name, old);
    }
    out
}

fn load_transport_response_into_engine(
    engine: &mut WmlEngine,
    transport: FetchDeckResponse,
) -> Result<super::EngineRuntimeSnapshot, String> {
    if !transport.ok {
        return Err("transport response is not ok".to_string());
    }
    let deck = transport
        .engine_deck_input
        .ok_or_else(|| "missing engineDeckInput".to_string())?;
    apply_load_deck_context(
        engine,
        LoadDeckContextRequest {
            wml_xml: deck.wml_xml,
            base_url: deck.base_url,
            content_type: deck.content_type,
            raw_bytes_base64: deck.raw_bytes_base64,
        },
    )
}

fn assert_render_contains(engine: &WmlEngine, expected_text: &str) {
    let render = apply_render(engine).expect("render should succeed");
    let contains = render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Text { text, .. } => text.contains(expected_text),
        DrawCmd::Link { text, .. } => text.contains(expected_text),
    });
    assert!(
        contains,
        "render output should contain expected text: {expected_text}"
    );
}

fn detail_string(response: &FetchDeckResponse, key: &str) -> Option<String> {
    response
        .error
        .as_ref()
        .and_then(|error| error.details.as_ref())
        .and_then(|details| details.get(key))
        .and_then(|value| value.as_str())
        .map(str::to_string)
}

fn assert_trace_kinds_subsequence(engine: &WmlEngine, expected: &[&str]) {
    let kinds: Vec<String> = engine
        .trace_entries()
        .into_iter()
        .map(|entry| entry.kind)
        .collect();
    let mut cursor = 0usize;
    for kind in kinds {
        if cursor < expected.len() && kind == expected[cursor] {
            cursor += 1;
        }
    }
    assert_eq!(
        cursor,
        expected.len(),
        "expected trace subsequence {:?} not found in {:?}",
        expected,
        engine
            .trace_entries()
            .iter()
            .map(|entry| entry.kind.as_str())
            .collect::<Vec<_>>()
    );
}

mod engine_flow;
mod engine_wrappers;
mod fetch_commands;
mod tauri_commands;
