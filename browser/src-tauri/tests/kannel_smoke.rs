use lowband_transport_rust::{
    fetch_deck_in_process_with_profile, FetchCacheControlPolicy, FetchDeckRequest,
    FetchDestinationPolicy, FetchRequestIntent, FetchRequestMethod, FetchRequestPolicy,
    FetchRequestPostField, FetchTransportProfile,
};
use wavenav_engine::{DrawCmd, WmlEngine};

fn request(url: &str) -> FetchDeckRequest {
    FetchDeckRequest {
        url: url.to_string(),
        method: Some("GET".to_string()),
        headers: None,
        timeout_ms: Some(15000),
        retries: Some(1),
        request_id: None,
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: None,
            referer_url: None,
            post_context: None,
            request_intent: None,
            ua_capability_profile: None,
        }),
    }
}

fn post_request(url: &str, payload: &str) -> FetchDeckRequest {
    FetchDeckRequest {
        url: url.to_string(),
        method: Some("POST".to_string()),
        headers: None,
        timeout_ms: Some(15000),
        retries: Some(1),
        request_id: None,
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: Some(FetchCacheControlPolicy::NoCache),
            referer_url: Some(url.to_string()),
            post_context: None,
            request_intent: Some(FetchRequestIntent {
                method: FetchRequestMethod::Post,
                enctype: "application/x-www-form-urlencoded".to_string(),
                send_referer: true,
                accept_charset: Some("utf-8".to_string()),
                same_deck: false,
                post_fields: payload
                    .split('&')
                    .map(|pair| {
                        let (name, value) = pair
                            .split_once('=')
                            .expect("smoke form payload should contain name/value pairs");
                        FetchRequestPostField {
                            name: name.to_string(),
                            value: value.to_string(),
                        }
                    })
                    .collect(),
                source_content_type: Some("text/vnd.wap.wml; charset=utf-8".to_string()),
            }),
            ua_capability_profile: None,
        }),
    }
}

fn fetch_kannel_smoke_target() -> lowband_transport_rust::FetchDeckResponse {
    let target = std::env::var("WAP_SMOKE_URL").unwrap_or_else(|_| "wap://localhost/".to_string());
    let transport =
        fetch_deck_in_process_with_profile(request(&target), FetchTransportProfile::WapNetCore);
    assert!(
        transport.ok,
        "expected transport smoke fetch to succeed: {:?}",
        transport.error
    );
    transport
}

fn load_transport_response_into_engine(
    engine: &mut WmlEngine,
    transport: lowband_transport_rust::FetchDeckResponse,
) {
    let deck = transport
        .engine_deck_input
        .expect("engineDeckInput should be present");
    engine
        .load_deck_context(
            &deck.wml_xml,
            &deck.base_url,
            &deck.content_type,
            deck.raw_bytes_base64,
        )
        .expect("transport response should load into engine");
}

fn render_contains(engine: &WmlEngine, expected_text: &str) -> bool {
    let render = engine.render().expect("render should succeed");
    render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Text { text, .. } => text.contains(expected_text),
        DrawCmd::Link { text, .. } => text.contains(expected_text),
    })
}

fn unique_smoke_username(prefix: &str) -> String {
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("clock should be monotonic enough for test ids")
        .as_millis();
    format!("{prefix}{nonce}")
}

fn edit_auth_form_and_build_payload(url: &str, username: &str, pin: &str) -> String {
    let transport =
        fetch_deck_in_process_with_profile(request(url), FetchTransportProfile::WapNetCore);
    assert!(
        transport.ok,
        "expected public auth form fetch to succeed: {:?}",
        transport.error
    );

    let mut engine = WmlEngine::new();
    load_transport_response_into_engine(&mut engine, transport);
    assert!(engine
        .begin_focused_input_edit()
        .expect("username edit should begin"));
    assert!(engine.set_focused_input_edit_draft(username.to_string()));
    engine
        .handle_key("down".to_string())
        .expect("username should commit and focus should move to PIN");
    assert!(engine
        .begin_focused_input_edit()
        .expect("PIN edit should begin"));
    assert!(engine.set_focused_input_edit_draft(pin.to_string()));
    assert!(
        render_contains(&engine, "****"),
        "password render should conceal the PIN during editing"
    );
    assert!(
        !render_contains(&engine, pin),
        "password render exposed the edited PIN"
    );
    assert!(engine
        .commit_focused_input_edit()
        .expect("PIN edit should commit"));
    assert!(
        render_contains(&engine, "****"),
        "password render should conceal the committed PIN"
    );
    assert!(
        !render_contains(&engine, pin),
        "password render exposed the committed PIN"
    );
    if engine.get_var("pin".to_string()).as_deref() != Some(pin) {
        panic!("engine did not preserve the actual PIN variable");
    }

    engine
        .handle_key("enter".to_string())
        .expect("accept action should submit the auth form");
    engine
        .external_navigation_request_policy()
        .and_then(|policy| policy.post_context)
        .and_then(|post_context| post_context.payload)
        .expect("auth form should produce a POST payload")
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_fetch_deck_smoke_loads_into_engine() {
    let mut engine = WmlEngine::new();
    load_transport_response_into_engine(&mut engine, fetch_kannel_smoke_target());
    let active = engine.active_card_id().expect("active card should exist");
    assert!(matches!(active.as_str(), "home" | "welcome" | "login"));
    assert!(render_contains(&engine, "Open Menu"));
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_fetch_deck_smoke_navigates_into_menu_card() {
    let mut engine = WmlEngine::new();
    load_transport_response_into_engine(&mut engine, fetch_kannel_smoke_target());
    assert_eq!(engine.active_card_id().as_deref(), Ok("home"));
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate into menu card");
    assert_eq!(engine.active_card_id().as_deref(), Ok("menu"));
    assert!(render_contains(&engine, "1. Login"));
    assert!(render_contains(&engine, "2. Register"));
    assert!(render_contains(&engine, "3. About Stack"));
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_fetch_deck_smoke_renders_public_examples() {
    let cases = [
        (
            "WAP_SMOKE_EXAMPLE_URL",
            "wap://localhost/examples/index.wml",
            "welcome",
            "This is a static WML",
        ),
        (
            "WAP_SMOKE_PORTAL_EXAMPLE_URL",
            "wap://localhost/examples/pocket-portal.wml",
            "portal",
            "first-party",
        ),
        (
            "WAP_SMOKE_PREFERENCES_EXAMPLE_URL",
            "wap://localhost/examples/preferences.wml",
            "preferences",
            "made-up",
        ),
        (
            "WAP_SMOKE_INTEROP_EXAMPLE_URL",
            "wap://localhost/examples/interop-check.wml",
            "wire-check",
            "W13-A",
        ),
    ];

    for (environment, default_url, active_card, marker) in cases {
        let target = std::env::var(environment).unwrap_or_else(|_| default_url.to_string());
        let transport =
            fetch_deck_in_process_with_profile(request(&target), FetchTransportProfile::WapNetCore);
        assert!(
            transport.ok,
            "expected example fetch to succeed for {target}: {:?}",
            transport.error
        );
        assert_eq!(transport.content_type, "application/vnd.wap.wmlc");

        let mut engine = WmlEngine::new();
        load_transport_response_into_engine(&mut engine, transport);
        assert_eq!(engine.active_card_id().as_deref(), Ok(active_card));
        assert!(
            render_contains(&engine, marker),
            "rendered example {target} omitted {marker:?}"
        );
    }

    let preferences_url = std::env::var("WAP_SMOKE_PREFERENCES_EXAMPLE_URL")
        .unwrap_or_else(|_| "wap://localhost/examples/preferences.wml".to_string());
    let preferences = fetch_deck_in_process_with_profile(
        request(&preferences_url),
        FetchTransportProfile::WapNetCore,
    );
    let mut engine = WmlEngine::new();
    load_transport_response_into_engine(&mut engine, preferences);
    assert_eq!(
        engine.get_var("alias".to_string()).as_deref(),
        Some("GUEST")
    );
    assert_eq!(
        engine.get_var("layout".to_string()).as_deref(),
        Some("compact")
    );
    assert!(engine
        .begin_focused_input_edit()
        .expect("alias edit should begin"));
    assert!(engine.set_focused_input_edit_draft("SCOUT".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("alias edit should commit"));
    engine
        .handle_key("down".to_string())
        .expect("focus should move from alias to layout");
    assert!(engine
        .begin_focused_select_edit()
        .expect("layout edit should begin"));
    assert!(engine.move_focused_select_edit(1));
    assert!(engine
        .commit_focused_select_edit()
        .expect("layout edit should commit"));
    engine
        .handle_key("down".to_string())
        .expect("focus should move from layout to review link");
    engine
        .handle_key("enter".to_string())
        .expect("review link should open the local saved card");
    assert_eq!(engine.active_card_id().as_deref(), Ok("saved"));
    assert!(render_contains(&engine, "SCOUT"));
    assert!(render_contains(&engine, "roomy"));
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_public_auth_forms_conceal_pin_and_submit_actual_value() {
    let register_url = std::env::var("WAP_SMOKE_REGISTER_URL")
        .unwrap_or_else(|_| "wap://localhost/register".to_string());
    let login_url = std::env::var("WAP_SMOKE_LOGIN_URL")
        .unwrap_or_else(|_| "wap://localhost/login".to_string());
    let username = unique_smoke_username("enginesmoke");
    let pin = "1274";

    let register_payload = edit_auth_form_and_build_payload(&register_url, &username, pin);
    if register_payload != format!("username={username}&pin={pin}") {
        panic!("registration form POST did not retain the actual PIN");
    }

    let register = fetch_deck_in_process_with_profile(
        post_request(&register_url, &register_payload),
        FetchTransportProfile::WapNetCore,
    );
    assert!(
        register.ok,
        "expected native register POST to succeed: {:?}",
        register.error
    );

    let login_payload = edit_auth_form_and_build_payload(&login_url, &username, pin);
    if login_payload != register_payload {
        panic!("login form POST did not retain the actual PIN");
    }

    let login = fetch_deck_in_process_with_profile(
        post_request(&login_url, &login_payload),
        FetchTransportProfile::WapNetCore,
    );
    assert!(
        login.ok,
        "expected native login POST to succeed: {:?}",
        login.error
    );

    let mut engine = WmlEngine::new();
    let login_deck = login
        .engine_deck_input
        .as_ref()
        .expect("login engineDeckInput should be present");
    assert!(login_deck
        .wml_xml
        .contains(&format!("Authenticated as {username}.")));
    load_transport_response_into_engine(&mut engine, login);
    assert_eq!(engine.active_card_id().as_deref(), Ok("login-ok"));
    assert!(render_contains(&engine, "Portal"));
}
