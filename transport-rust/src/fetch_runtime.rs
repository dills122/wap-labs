mod execution;

use crate::fetch_policy::{
    apply_request_policy, resolve_fetch_destination_policy, validate_fetch_destination,
};
use crate::gateway::build_gateway_request;
use crate::native_fetch::{execute_native_wap_get, should_use_native_wap_get, NativeFetchPlan};
use crate::request_meta::{log_transport_event, normalized_request_id};
use crate::responses::{invalid_request_response, transport_unavailable_response};
use crate::{FetchDeckRequest, FetchDeckResponse, FetchTransportProfile, MAX_URI_OCTETS};
use url::Url;

use self::execution::{execute_fetch, FetchExecutionPlan};

pub(crate) fn fetch_deck_in_process_impl(
    request: FetchDeckRequest,
    profile_override: Option<FetchTransportProfile>,
) -> FetchDeckResponse {
    let FetchDeckRequest {
        url,
        method,
        headers,
        timeout_ms,
        retries,
        request_id,
        request_policy,
    } = request;
    let request_id = normalized_request_id(request_id.as_deref()).map(str::to_string);
    let url_octets = url.len();
    if url_octets > MAX_URI_OCTETS {
        return invalid_request_response(
            url,
            format!(
                "URL exceeds {}-octet limit (got {} octets)",
                MAX_URI_OCTETS, url_octets
            ),
            request_id.as_deref(),
        );
    }

    let method = method
        .unwrap_or_else(|| "GET".to_string())
        .to_ascii_uppercase();
    let (
        method,
        mut outbound_headers,
        suppressed_same_deck_post_context,
        applied_ua_capability_profile,
    ) = apply_request_policy(method, headers.unwrap_or_default(), request_policy.as_ref());
    if method != "GET" {
        return invalid_request_response(
            url,
            format!("Unsupported method: {method}"),
            request_id.as_deref(),
        );
    }

    let parsed = match Url::parse(&url) {
        Ok(parsed) => parsed,
        Err(_) => {
            return invalid_request_response(
                url,
                "URL must include a scheme".to_string(),
                request_id.as_deref(),
            );
        }
    };
    let destination_policy = resolve_fetch_destination_policy(request_policy.as_ref());
    if let Err(message) = validate_fetch_destination(&parsed, &destination_policy) {
        return invalid_request_response(url, message, request_id.as_deref());
    }

    let attempts = retries.unwrap_or(1).clamp(0, 2) + 1;

    log_transport_event(
        "transport.fetch.start",
        request_id.as_deref(),
        &url,
        serde_json::json!({
            "method": method,
            "requestPolicy": request_policy,
            "destinationPolicy": destination_policy,
            "suppressedSameDeckPostContext": suppressed_same_deck_post_context,
            "uaCapabilityProfileApplied": applied_ua_capability_profile
        }),
    );

    if should_use_native_wap_get_for_profile(&parsed, &method, profile_override) {
        return execute_native_wap_get(NativeFetchPlan {
            request_url: url,
            outbound_headers,
            timeout_ms: timeout_ms.unwrap_or(5000).clamp(100, 30000),
            attempts,
            request_id,
        });
    }

    let is_wap_scheme = matches!(parsed.scheme(), "wap" | "waps");
    let mut upstream_url = url.clone();
    if let Some(id) = request_id.as_deref() {
        outbound_headers
            .entry("X-Request-Id".to_string())
            .or_insert_with(|| id.to_string());
    }

    if is_wap_scheme {
        match build_gateway_request(&url, &method, &outbound_headers) {
            Ok((gateway_url, headers)) => {
                upstream_url = gateway_url;
                outbound_headers = headers;
            }
            Err(err) => {
                log_transport_event(
                    "transport.fetch.failure",
                    request_id.as_deref(),
                    &url,
                    serde_json::json!({ "error": err, "phase": "gateway-request-build" }),
                );
                return transport_unavailable_response(url, err, request_id.as_deref());
            }
        }
    }

    execute_fetch(FetchExecutionPlan {
        url,
        upstream_url,
        outbound_headers,
        timeout_ms: timeout_ms.unwrap_or(5000).clamp(100, 30000),
        attempts,
        is_wap_scheme,
        request_id,
    })
}

fn should_use_native_wap_get_for_profile(
    parsed: &Url,
    method: &str,
    profile_override: Option<FetchTransportProfile>,
) -> bool {
    match profile_override {
        Some(FetchTransportProfile::WapNetCore) => {
            matches!(parsed.scheme(), "wap" | "waps") && method == "GET"
        }
        Some(FetchTransportProfile::GatewayBridged) => false,
        None => should_use_native_wap_get(parsed, method),
    }
}
