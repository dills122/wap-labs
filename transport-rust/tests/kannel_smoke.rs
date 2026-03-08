mod kannel_support;

use kannel_support::{assert_engine_input_contains, request};
use lowband_transport_rust::{fetch_deck_in_process, FetchDeckResponse};

fn fetch_ok_response(url: &str) -> FetchDeckResponse {
    let response = fetch_deck_in_process(request(url));
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
