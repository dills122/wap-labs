use crate::fetch_body::{read_response_body_limited, ReadBodyError};
use crate::fetch_policy::{
    apply_request_policy, resolve_fetch_destination_policy, validate_fetch_destination,
};
use crate::gateway::build_gateway_request;
use crate::request_meta::{log_transport_event, normalized_request_id};
use crate::responses::{
    invalid_request_response, map_success_payload_response, map_terminal_send_error,
    normalize_content_type, payload_too_large_response, transport_unavailable_response,
};
use crate::{FetchDeckRequest, FetchDeckResponse, MAX_RESPONSE_BODY_BYTES, MAX_URI_OCTETS};
use reqwest::blocking::Client;
use std::time::{Duration, Instant};
use url::Url;

pub(crate) fn fetch_deck_in_process_impl(request: FetchDeckRequest) -> FetchDeckResponse {
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

    let timeout_ms = timeout_ms.unwrap_or(5000).clamp(100, 30000);
    let request_url = url.clone();
    let attempts = retries.unwrap_or(1).clamp(0, 2) + 1;
    let client = match Client::builder()
        .timeout(Duration::from_millis(timeout_ms))
        .build()
    {
        Ok(client) => client,
        Err(err) => {
            log_transport_event(
                "transport.fetch.failure",
                request_id.as_deref(),
                &url,
                serde_json::json!({
                    "error": err.to_string(),
                    "phase": "client-build"
                }),
            );
            return transport_unavailable_response(
                request_url,
                err.to_string(),
                request_id.as_deref(),
            );
        }
    };
    let mut last_error = "Retries exhausted".to_string();
    let mut last_elapsed_ms = 0.0_f64;
    let mut last_is_timeout = false;

    for attempt in 1..=attempts {
        let start = Instant::now();
        let mut req = client.get(&upstream_url);
        for (key, value) in &outbound_headers {
            req = req.header(key, value);
        }

        match req.send() {
            Ok(mut resp) => {
                let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
                let status = resp.status().as_u16();
                let final_url = if is_wap_scheme {
                    url.clone()
                } else {
                    resp.url().to_string()
                };
                let content_type = normalize_content_type(
                    resp.headers()
                        .get("content-type")
                        .and_then(|v| v.to_str().ok()),
                );
                if let Some(content_len) = resp.content_length() {
                    if content_len > MAX_RESPONSE_BODY_BYTES as u64 {
                        let message = format!(
                            "payload exceeds {}-byte limit (content-length={content_len})",
                            MAX_RESPONSE_BODY_BYTES
                        );
                        log_transport_event(
                            "transport.fetch.failure",
                            request_id.as_deref(),
                            &url,
                            serde_json::json!({
                                "attempt": attempt,
                                "attempts": attempts,
                                "phase": "response-size-check",
                                "error": message
                            }),
                        );
                        return payload_too_large_response(
                            status,
                            final_url,
                            content_type,
                            MAX_RESPONSE_BODY_BYTES,
                            Some(content_len),
                            attempt,
                            elapsed_ms,
                            request_id.as_deref(),
                        );
                    }
                }

                let body = match read_response_body_limited(&mut resp, MAX_RESPONSE_BODY_BYTES) {
                    Ok(body) => body,
                    Err(ReadBodyError::ReadFailed(message)) => {
                        log_transport_event(
                            "transport.fetch.failure",
                            request_id.as_deref(),
                            &url,
                            serde_json::json!({
                                "attempt": attempt,
                                "attempts": attempts,
                                "phase": "response-read",
                                "error": message
                            }),
                        );
                        return transport_unavailable_response(
                            request_url.clone(),
                            message,
                            request_id.as_deref(),
                        );
                    }
                    Err(ReadBodyError::TooLarge { limit_bytes }) => {
                        let message = format!("payload exceeds {}-byte limit", limit_bytes);
                        log_transport_event(
                            "transport.fetch.failure",
                            request_id.as_deref(),
                            &url,
                            serde_json::json!({
                                "attempt": attempt,
                                "attempts": attempts,
                                "phase": "response-read",
                                "error": message
                            }),
                        );
                        return payload_too_large_response(
                            status,
                            final_url,
                            content_type,
                            limit_bytes,
                            None,
                            attempt,
                            elapsed_ms,
                            request_id.as_deref(),
                        );
                    }
                };
                log_transport_event(
                    "transport.fetch.success",
                    request_id.as_deref(),
                    &url,
                    serde_json::json!({
                        "attempt": attempt,
                        "attempts": attempts,
                        "status": status,
                        "upstreamUrl": upstream_url.as_str(),
                        "finalUrl": final_url.clone(),
                        "elapsedMs": elapsed_ms
                    }),
                );
                return map_success_payload_response(
                    status,
                    is_wap_scheme,
                    &url,
                    &upstream_url,
                    final_url,
                    content_type,
                    body.as_slice(),
                    attempt,
                    elapsed_ms,
                    request_id.as_deref(),
                );
            }
            Err(err) => {
                last_error = err.to_string();
                last_is_timeout = err.is_timeout();
                last_elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
                if attempt < attempts {
                    log_transport_event(
                        "transport.fetch.retry",
                        request_id.as_deref(),
                        &url,
                        serde_json::json!({
                            "attempt": attempt,
                            "nextAttempt": attempt + 1,
                            "attempts": attempts,
                            "isTimeout": last_is_timeout,
                            "error": last_error,
                            "elapsedMs": last_elapsed_ms
                        }),
                    );
                } else {
                    log_transport_event(
                        "transport.fetch.failure",
                        request_id.as_deref(),
                        &url,
                        serde_json::json!({
                            "attempt": attempt,
                            "attempts": attempts,
                            "isTimeout": last_is_timeout,
                            "error": last_error,
                            "elapsedMs": last_elapsed_ms
                        }),
                    );
                }
            }
        }
    }

    map_terminal_send_error(
        url,
        last_error,
        attempts,
        attempts,
        last_is_timeout,
        last_elapsed_ms,
        request_id.as_deref(),
    )
}
