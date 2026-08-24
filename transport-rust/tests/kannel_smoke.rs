mod kannel_support;

use kannel_support::{
    assert_engine_input_contains, assert_wbxml_13_response, post_request, request,
};
use lowband_transport_rust::{
    fetch_deck_in_process_with_options, fetch_deck_in_process_with_profile, FetchDeckResponse,
    FetchTransportOptions, FetchTransportProfile,
};
use std::time::{SystemTime, UNIX_EPOCH};

fn fetch_ok_response(url: &str) -> FetchDeckResponse {
    let response =
        fetch_deck_in_process_with_profile(request(url), FetchTransportProfile::WapNetCore);
    assert!(
        response.ok,
        "expected ok=true for target={url}, got error={:?} status={} contentType={}",
        response.error, response.status, response.content_type
    );
    assert!(
        response.status >= 200 && response.status < 400,
        "expected success HTTP status for {url}, got: {}",
        response.status
    );
    assert_eq!(response.final_url, url);
    assert!(
        matches!(
            response.content_type.as_str(),
            "text/vnd.wap.wml"
                | "application/vnd.wap.wmlc"
                | "application/vnd.wap.wml+xml"
                | "text/xml"
                | "application/xml"
        ),
        "unexpected content type for {url}: {}",
        response.content_type
    );
    response
}

fn fetch_ok_post_response(url: &str, payload: &str) -> FetchDeckResponse {
    let response = fetch_deck_in_process_with_profile(
        post_request(url, payload),
        FetchTransportProfile::WapNetCore,
    );
    assert!(
        response.ok,
        "expected ok=true for POST target={url}, got error={:?} status={} contentType={}",
        response.error, response.status, response.content_type
    );
    response
}

fn unique_username(prefix: &str) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock should be monotonic enough for test ids")
        .as_millis();
    format!("{prefix}{nonce}")
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_wap_home_smoke_normalizes_expected_root_deck() {
    let target = std::env::var("WAP_SMOKE_URL").unwrap_or_else(|_| "wap://localhost/".to_string());
    let response = fetch_ok_response(&target);
    assert_engine_input_contains(
        &response,
        &target,
        &[
            "card id=\"home\"",
            "title=\"WAP Lab\"",
            "Local WAP training environment.",
            "href=\"#menu\"",
        ],
    );
}

#[test]
#[ignore = "runs against an isolated Kannel dev stack with an owned routing manifest"]
fn kannel_wap_owned_origin_identity_smoke() {
    let target = std::env::var("WAP_SMOKE_URL").unwrap_or_else(|_| "wap://localhost/".to_string());
    let gateway_endpoint =
        std::env::var("WAP_GATEWAY_ENDPOINT").expect("WAP_GATEWAY_ENDPOINT must be configured");
    let expected_origin_instance_id =
        std::env::var("WML_ORIGIN_INSTANCE_ID").expect("WML_ORIGIN_INSTANCE_ID must be configured");
    let response = fetch_deck_in_process_with_options(
        request(&target),
        FetchTransportOptions {
            profile: FetchTransportProfile::WapNetCore,
            gateway_endpoint: Some(gateway_endpoint),
            expected_origin_instance_id: Some(expected_origin_instance_id),
        },
    );
    assert!(
        response.ok,
        "owned native WAP response failed: error={:?}",
        response.error
    );
    assert_engine_input_contains(
        &response,
        &target,
        &["card id=\"home\"", "Local WAP training environment."],
    );
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_wap_examples_smoke_normalizes_wml13_decks() {
    let cases = [
        (
            "WAP_SMOKE_EXAMPLE_URL",
            "wap://localhost/examples/index.wml",
            [
                "card id=\"welcome\"",
                "title=\"Static Demo\"",
                "href=\"#nav\"",
            ],
        ),
        (
            "WAP_SMOKE_PORTAL_EXAMPLE_URL",
            "wap://localhost/examples/pocket-portal.wml",
            [
                "card id=\"portal\"",
                "title=\"Pocket Portal\"",
                "Local Services",
            ],
        ),
        (
            "WAP_SMOKE_PREFERENCES_EXAMPLE_URL",
            "wap://localhost/examples/preferences.wml",
            [
                "card id=\"preferences\"",
                "title=\"Local Preferences\"",
                "select name=\"layout\"",
            ],
        ),
        (
            "WAP_SMOKE_INTEROP_EXAMPLE_URL",
            "wap://localhost/examples/interop-check.wml",
            [
                "card id=\"wire-check\"",
                "title=\"Interop Wire Check\"",
                "W13-A",
            ],
        ),
    ];

    for (environment, default_url, markers) in cases {
        let target = std::env::var(environment).unwrap_or_else(|_| default_url.to_string());
        let response = fetch_ok_response(&target);
        assert_wbxml_13_response(&response);
        assert_engine_input_contains(&response, &target, &markers);
    }
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_wap_multi_deck_smoke_fetches_root_and_login_decks() {
    let root_url =
        std::env::var("WAP_SMOKE_URL").unwrap_or_else(|_| "wap://localhost/".to_string());
    let login_url = std::env::var("WAP_SMOKE_LOGIN_URL")
        .unwrap_or_else(|_| "wap://localhost/login".to_string());

    let root = fetch_ok_response(&root_url);
    assert_engine_input_contains(
        &root,
        &root_url,
        &[
            "card id=\"menu\"",
            "title=\"Main Menu\"",
            "href=\"/login\"",
            "href=\"/register\"",
        ],
    );

    let login = fetch_ok_response(&login_url);
    assert_engine_input_contains(
        &login,
        &login_url,
        &[
            "card id=\"login\"",
            "title=\"Login\"",
            "Enter username and PIN.",
            "<postfield name=\"username\"",
            "<postfield name=\"pin\"",
            "method=\"post\"",
        ],
    );
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_wap_post_smoke_registers_and_logs_in_user() {
    let register_url = std::env::var("WAP_SMOKE_REGISTER_URL")
        .unwrap_or_else(|_| "wap://localhost/register".to_string());
    let login_url = std::env::var("WAP_SMOKE_LOGIN_URL")
        .unwrap_or_else(|_| "wap://localhost/login".to_string());
    let username = unique_username("smoke");
    let register_payload = format!("username={username}&pin=1234");
    let login_payload = format!("username={username}&pin=1234");

    let register = fetch_ok_post_response(&register_url, &register_payload);
    assert_engine_input_contains(
        &register,
        &register_url,
        &[
            "card id=\"register-ok\"",
            "title=\"Registration OK\"",
            "Continue to login",
        ],
    );
    assert!(
        register
            .engine_deck_input
            .as_ref()
            .expect("register response should include engine input")
            .wml_xml
            .contains(&format!("User {username} created.")),
        "expected registration confirmation to mention created username"
    );

    let login = fetch_ok_post_response(&login_url, &login_payload);
    assert_engine_input_contains(
        &login,
        &login_url,
        &[
            "card id=\"login-ok\"",
            "title=\"Login OK\"",
            "Open Portal",
            "href=\"/portal?sid=",
        ],
    );
    assert!(
        login
            .engine_deck_input
            .as_ref()
            .expect("login response should include engine input")
            .wml_xml
            .contains(&format!("Authenticated as {username}.")),
        "expected login confirmation to mention authenticated username"
    );
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_wap_unapproved_origin_is_not_proxied() {
    let denied_url = std::env::var("WAP_SMOKE_DENIED_URL")
        .unwrap_or_else(|_| "wap://127.0.0.1:9200/".to_string());
    let response =
        fetch_deck_in_process_with_profile(request(&denied_url), FetchTransportProfile::WapNetCore);
    assert!(
        !response.ok,
        "unapproved WAP origin unexpectedly succeeded: target={denied_url} status={} contentType={}",
        response.status, response.content_type
    );
    assert!(
        response.status >= 400 || response.error.is_some(),
        "unapproved WAP origin did not return an explicit failure: target={denied_url}"
    );
}
