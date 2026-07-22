use crate::fetch_body::{read_response_body_limited, ReadBodyError};
use crate::fetch_policy::{resolve_fetch_destination_addresses, validate_fetch_destination};
use crate::request_meta::log_transport_event;
use crate::responses::{
    invalid_request_response, map_success_payload_response, map_terminal_send_error,
    normalize_content_type, payload_too_large_response, transport_unavailable_response,
};
use crate::{FetchDeckResponse, FetchDestinationPolicy, MAX_RESPONSE_BODY_BYTES};
use reqwest::blocking::{Client, ClientBuilder};
use reqwest::dns::{Addrs, Name, Resolve, Resolving};
use reqwest::redirect::Policy;
use std::collections::HashMap;
use std::fmt;
use std::io;
use std::sync::Arc;
use std::time::{Duration, Instant};

const MAX_HTTP_REDIRECTS: usize = 10;

pub(super) struct FetchExecutionPlan {
    pub(super) url: String,
    pub(super) upstream_url: String,
    pub(super) outbound_headers: HashMap<String, String>,
    pub(super) timeout_ms: u64,
    pub(super) attempts: u8,
    pub(super) is_wap_scheme: bool,
    pub(super) request_id: Option<String>,
    pub(super) destination_policy: FetchDestinationPolicy,
}

#[derive(Debug)]
struct DestinationPolicyError(String);

impl fmt::Display for DestinationPolicyError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.0)
    }
}

impl std::error::Error for DestinationPolicyError {}

#[derive(Clone)]
struct PolicyDnsResolver {
    destination_policy: FetchDestinationPolicy,
}

impl Resolve for PolicyDnsResolver {
    fn resolve(&self, name: Name) -> Resolving {
        let host = name.as_str().to_string();
        let destination_policy = self.destination_policy.clone();
        Box::pin(async move {
            match resolve_fetch_destination_addresses(&host, 0, &destination_policy) {
                Ok(addresses) => Ok(Box::new(addresses.into_iter()) as Addrs),
                Err(message) if message.starts_with("Destination blocked by fetch policy") => {
                    Err(Box::new(DestinationPolicyError(message))
                        as Box<dyn std::error::Error + Send + Sync>)
                }
                Err(message) => {
                    Err(Box::new(io::Error::other(message))
                        as Box<dyn std::error::Error + Send + Sync>)
                }
            }
        })
    }
}

fn http_client_builder(
    timeout_ms: u64,
    destination_policy: FetchDestinationPolicy,
) -> ClientBuilder {
    let redirect_destination_policy = destination_policy.clone();
    Client::builder()
        .timeout(Duration::from_millis(timeout_ms))
        .dns_resolver(Arc::new(PolicyDnsResolver { destination_policy }))
        .redirect(Policy::custom(move |attempt| {
            if attempt.previous().len() >= MAX_HTTP_REDIRECTS {
                return attempt.error(io::Error::other("too many redirects"));
            }
            match validate_fetch_destination(attempt.url(), &redirect_destination_policy) {
                Ok(()) => attempt.follow(),
                Err(message) => attempt.error(DestinationPolicyError(message)),
            }
        }))
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
        destination_policy,
    } = plan;
    let request_url = url.clone();
    let client = match http_client_builder(timeout_ms, destination_policy).build() {
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
                if let Some(message) = destination_policy_error(&err) {
                    return invalid_request_response(
                        request_url.clone(),
                        message,
                        request_id.as_deref(),
                    );
                }
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

fn destination_policy_error(error: &reqwest::Error) -> Option<String> {
    let mut current: Option<&(dyn std::error::Error + 'static)> = Some(error);
    while let Some(cause) = current {
        if let Some(policy_error) = cause.downcast_ref::<DestinationPolicyError>() {
            return Some(policy_error.0.clone());
        }
        current = cause.source();
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::net::TcpListener;
    use std::thread;

    #[test]
    fn http_client_rejects_private_dns_answer() {
        let client = http_client_builder(1_000, FetchDestinationPolicy::PublicOnly)
            .no_proxy()
            .build()
            .expect("build DNS policy test client");
        let error = client
            .get("http://localhost:9/private")
            .send()
            .expect_err("private DNS answer must be rejected");

        let message =
            destination_policy_error(&error).expect("policy error should survive reqwest wrapping");
        assert!(message.contains("public-only"));
        assert!(message.contains("loopback"));
    }

    #[test]
    fn http_client_rejects_redirect_to_private_destination() {
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind redirect test server");
        let listener_address = listener.local_addr().expect("read redirect server address");
        let server = thread::spawn(move || {
            let (mut stream, _) = listener.accept().expect("accept redirect request");
            stream
                .write_all(
                    b"HTTP/1.1 302 Found\r\nLocation: http://127.0.0.1:9/private\r\nContent-Length: 0\r\nConnection: close\r\n\r\n",
                )
                .expect("write redirect response");
        });

        let client = http_client_builder(1_000, FetchDestinationPolicy::PublicOnly)
            .no_proxy()
            .resolve("public.test", listener_address)
            .build()
            .expect("build redirect test client");
        let error = client
            .get(format!("http://public.test:{}/", listener_address.port()))
            .send()
            .expect_err("private redirect must be rejected");
        server.join().expect("redirect test server should exit");

        let message =
            destination_policy_error(&error).expect("policy error should survive reqwest wrapping");
        assert!(message.contains("public-only"));
        assert!(message.contains("loopback"));
    }
}
