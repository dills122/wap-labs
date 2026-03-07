use crate::fetch_body::{read_response_body_limited, ReadBodyError};
use crate::request_meta::log_transport_event;
use crate::responses::{
    map_success_payload_response, map_terminal_send_error, normalize_content_type,
    payload_too_large_response, transport_unavailable_response,
};
use crate::{FetchDeckResponse, MAX_RESPONSE_BODY_BYTES};
use reqwest::blocking::Client;
use std::collections::HashMap;
use std::time::{Duration, Instant};

pub(super) struct FetchExecutionPlan {
    pub(super) url: String,
    pub(super) upstream_url: String,
    pub(super) outbound_headers: HashMap<String, String>,
    pub(super) timeout_ms: u64,
    pub(super) attempts: u8,
    pub(super) is_wap_scheme: bool,
    pub(super) request_id: Option<String>,
}

pub(super) fn execute_fetch(plan: FetchExecutionPlan) -> FetchDeckResponse {
    let FetchExecutionPlan {
        url,
        upstream_url,
        outbound_headers,
        timeout_ms,
        attempts,
        is_wap_scheme,
        request_id,
    } = plan;
    let request_url = url.clone();
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
