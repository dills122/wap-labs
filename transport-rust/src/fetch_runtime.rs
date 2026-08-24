mod execution;

use crate::fetch_policy::{
    apply_request_policy, resolve_fetch_destination_policy, validate_fetch_destination,
};
use crate::gateway::build_gateway_request_with_endpoint;
use crate::native_fetch::{
    execute_native_wap_request, should_use_native_wap_request, NativeFetchPlan,
};
use crate::request_meta::{log_transport_event, normalized_request_id};
use crate::request_serialization::serialize_fetch_request;
use crate::responses::{
    cancelled_response, invalid_request_response, transport_unavailable_response,
};
use crate::{
    FetchCancellationToken, FetchDeckRequest, FetchDeckResponse, FetchDestinationPolicy,
    FetchRequestPolicy, FetchTransportOptions, FetchTransportProfile, MAX_URI_OCTETS,
};
use url::Url;

use self::execution::{execute_fetch, FetchExecutionPlan};

pub(crate) fn fetch_deck_in_process_impl(
    request: FetchDeckRequest,
    transport_options: Option<FetchTransportOptions>,
    cancellation: Option<FetchCancellationToken>,
) -> FetchDeckResponse {
    if let Err(error) = crate::validate_fetch_deck_request(&request) {
        return invalid_request_response(String::new(), error.to_string(), None);
    }
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
    if cancellation
        .as_ref()
        .is_some_and(FetchCancellationToken::is_cancelled)
    {
        return cancelled_response(url, request_id.as_deref());
    }
    let method = method
        .unwrap_or_else(|| "GET".to_string())
        .to_ascii_uppercase();
    let applied_policy =
        apply_request_policy(method, headers.unwrap_or_default(), request_policy.as_ref());
    let suppressed_same_deck_post_context = applied_policy.suppressed_same_deck_post_context;
    let applied_ua_capability_profile = applied_policy.applied_ua_capability_profile;
    let serialized = match serialize_fetch_request(
        &url,
        applied_policy.method,
        applied_policy.outbound_headers,
        request_policy.as_ref(),
    ) {
        Ok(serialized) => serialized,
        Err(error) => return invalid_request_response(url, error, request_id.as_deref()),
    };
    let url = serialized.url;
    let method = serialized.method;
    let mut outbound_headers = serialized.headers;
    let request_body = serialized.body;
    let request_content_type = serialized.content_type;
    if !matches!(method.as_str(), "GET" | "POST") {
        return invalid_request_response(
            url,
            format!("Unsupported method: {method}"),
            request_id.as_deref(),
        );
    }
    if method == "POST" && request_body.is_none() {
        return invalid_request_response(
            url,
            "POST requests require a serialized request body".to_string(),
            request_id.as_deref(),
        );
    }

    let serialized_url_octets = url.len();
    if serialized_url_octets > MAX_URI_OCTETS {
        return invalid_request_response(
            url,
            format!(
                "URL exceeds {}-octet limit after request serialization (got {} octets)",
                MAX_URI_OCTETS, serialized_url_octets
            ),
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
    if let Err(error) = validate_fetch_destination(&parsed, &destination_policy) {
        return invalid_request_response(url, error.to_string(), request_id.as_deref());
    }

    let attempts = retries.unwrap_or(1).clamp(0, 2) + 1;

    log_transport_event(
        "transport.fetch.start",
        request_id.as_deref(),
        &url,
        serde_json::json!({
            "method": method,
            "requestPolicy": redacted_request_policy_for_log(request_policy.as_ref()),
            "destinationPolicy": destination_policy,
            "suppressedSameDeckPostContext": suppressed_same_deck_post_context,
            "uaCapabilityProfileApplied": applied_ua_capability_profile
        }),
    );

    let profile_override = transport_options.as_ref().map(|options| options.profile);
    let gateway_endpoint = transport_options
        .as_ref()
        .and_then(|options| options.gateway_endpoint.clone());
    let expected_origin_instance_id = transport_options
        .as_ref()
        .and_then(|options| options.expected_origin_instance_id.clone());

    if should_use_native_wap_request_for_profile(&parsed, &method, profile_override) {
        return execute_native_wap_request(NativeFetchPlan {
            request_url: url,
            gateway_endpoint,
            expected_origin_instance_id,
            method,
            outbound_headers,
            post_body: request_body,
            post_content_type: request_content_type,
            timeout_ms: timeout_ms.unwrap_or(5000).clamp(100, 30000),
            attempts,
            request_id,
            destination_policy,
            cancellation,
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
        match build_gateway_request_with_endpoint(
            &url,
            &method,
            &outbound_headers,
            gateway_endpoint.as_deref(),
        ) {
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
        method,
        outbound_headers,
        request_body,
        timeout_ms: timeout_ms.unwrap_or(5000).clamp(100, 30000),
        attempts,
        is_wap_scheme,
        request_id,
        destination_policy: if is_wap_scheme {
            // The gateway URL is operator configuration, not a renderer-selected
            // destination. The original WAP URL was validated above.
            FetchDestinationPolicy::AllowPrivate
        } else {
            destination_policy
        },
        cancellation,
    })
}

fn should_use_native_wap_request_for_profile(
    parsed: &Url,
    method: &str,
    profile_override: Option<FetchTransportProfile>,
) -> bool {
    match profile_override {
        Some(FetchTransportProfile::WapNetCore) => {
            matches!(parsed.scheme(), "wap" | "waps") && matches!(method, "GET" | "POST")
        }
        Some(FetchTransportProfile::GatewayBridged) => false,
        None => should_use_native_wap_request(parsed, method),
    }
}

/// Builds an explicit, allowlisted view of `FetchRequestPolicy` for transport logging.
///
/// `post_context.payload` carries the raw POST body (e.g. WML login form fields such as a
/// PIN), so it must never be serialized into the log verbatim -- only its presence/length is
/// reported. Fields are named individually (rather than serializing `FetchRequestPolicy`
/// directly and stripping a key) so a future secret-bearing field added to the struct doesn't
/// silently leak into logs by default.
fn redacted_request_policy_for_log(
    request_policy: Option<&FetchRequestPolicy>,
) -> serde_json::Value {
    let Some(policy) = request_policy else {
        return serde_json::Value::Null;
    };
    serde_json::json!({
        "destinationPolicy": policy.destination_policy,
        "cacheControl": policy.cache_control,
        "hasRefererUrl": policy.referer_url.is_some(),
        "postContext": policy.post_context.as_ref().map(|post_context| serde_json::json!({
            "sameDeck": post_context.same_deck,
            "contentType": post_context.content_type,
            "hasPayload": post_context.payload.is_some(),
            "payloadLen": post_context.payload.as_ref().map(|payload| payload.len()),
        })),
        "requestIntent": policy.request_intent.as_ref().map(|intent| serde_json::json!({
            "method": intent.method,
            "enctype": intent.enctype,
            "sendReferer": intent.send_referer,
            "acceptCharset": intent.accept_charset,
            "sameDeck": intent.same_deck,
            "postFieldCount": intent.post_fields.len(),
            "hasSourceContentType": intent.source_content_type.is_some(),
        })),
        "uaCapabilityProfile": policy.ua_capability_profile,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        FetchCacheControlPolicy, FetchDestinationPolicy, FetchPostContext, FetchRequestPolicy,
    };

    #[test]
    fn native_profile_override_accepts_wap_get_and_post_only() {
        let wap = Url::parse("wap://localhost/login").expect("url should parse");
        let http = Url::parse("http://localhost/login").expect("url should parse");

        assert!(should_use_native_wap_request_for_profile(
            &wap,
            "GET",
            Some(FetchTransportProfile::WapNetCore)
        ));
        assert!(should_use_native_wap_request_for_profile(
            &wap,
            "POST",
            Some(FetchTransportProfile::WapNetCore)
        ));
        assert!(!should_use_native_wap_request_for_profile(
            &wap,
            "HEAD",
            Some(FetchTransportProfile::WapNetCore)
        ));
        assert!(!should_use_native_wap_request_for_profile(
            &http,
            "GET",
            Some(FetchTransportProfile::WapNetCore)
        ));
        assert!(!should_use_native_wap_request_for_profile(
            &wap,
            "GET",
            Some(FetchTransportProfile::GatewayBridged)
        ));
    }

    #[test]
    fn legacy_post_context_defaults_form_content_type_when_payload_present() {
        let request_policy = FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: Some(FetchCacheControlPolicy::NoCache),
            referer_url: Some("wap://localhost/login".to_string()),
            post_context: Some(FetchPostContext {
                same_deck: Some(false),
                content_type: None,
                payload: Some("username=alice&pin=1234".to_string()),
            }),
            request_intent: None,
            ua_capability_profile: None,
        };

        let serialized = serialize_fetch_request(
            "wap://localhost/login",
            "POST".to_string(),
            std::collections::HashMap::new(),
            Some(&request_policy),
        )
        .expect("legacy request should serialize");

        assert_eq!(serialized.body, Some(b"username=alice&pin=1234".to_vec()));
        assert_eq!(
            serialized.content_type.as_deref(),
            Some("application/x-www-form-urlencoded")
        );
    }

    #[test]
    fn legacy_post_context_returns_none_when_payload_missing() {
        let request_policy = FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: None,
            referer_url: None,
            post_context: Some(FetchPostContext {
                same_deck: Some(false),
                content_type: Some("application/x-www-form-urlencoded".to_string()),
                payload: None,
            }),
            request_intent: None,
            ua_capability_profile: None,
        };

        let serialized = serialize_fetch_request(
            "wap://localhost/login",
            "POST".to_string(),
            std::collections::HashMap::new(),
            Some(&request_policy),
        )
        .expect("legacy request should serialize");

        assert_eq!(serialized.body, None);
        assert_eq!(
            serialized.content_type.as_deref(),
            Some("application/x-www-form-urlencoded")
        );
    }
}
