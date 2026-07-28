use crate::fetch_body::{read_response_body_limited, ReadBodyError};
use crate::fetch_policy::{
    resolve_fetch_destination_addresses, validate_fetch_destination, FetchDestinationError,
};
use crate::request_meta::{log_fetch_attempt_failure, log_transport_event};
use crate::responses::{
    invalid_request_response, map_success_payload_response, normalize_content_type,
    payload_too_large_response, transport_unavailable_response, FetchAttemptFailure,
    PayloadTooLargeParams, SuccessPayloadParams,
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

/// Carries a typed [`FetchDestinationError`] through `reqwest`'s boxed error
/// wrapping so the classification survives to `destination_policy_error`.
#[derive(Debug)]
struct DestinationPolicyError(FetchDestinationError);

impl fmt::Display for DestinationPolicyError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}", self.0)
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
                Err(error) if error.is_policy_blocked() => {
                    Err(Box::new(DestinationPolicyError(error))
                        as Box<dyn std::error::Error + Send + Sync>)
                }
                Err(error) => Err(Box::new(io::Error::other(error.to_string()))
                    as Box<dyn std::error::Error + Send + Sync>),
            }
        })
    }
}

fn http_client_builder(
    timeout_ms: u64,
    destination_policy: FetchDestinationPolicy,
) -> ClientBuilder {
    let redirect_destination_policy = destination_policy.clone();
    // reqwest enables system-proxy discovery (HTTP_PROXY/HTTPS_PROXY/etc.) by
    // default. When a proxy is in play, the proxy resolves the target host,
    // not PolicyDnsResolver below -- so a PublicOnly request to a
    // public-looking hostname can be silently routed to a private/loopback
    // address via ambient proxy configuration, bypassing the destination
    // check entirely. AllowPrivate (explicit dev/smoke opt-in, and the
    // operator-configured gateway-bridged WAP upstream) has no destination
    // check to bypass, so it's left alone.
    let disable_implicit_proxy = matches!(destination_policy, FetchDestinationPolicy::PublicOnly);
    let mut builder = Client::builder()
        .timeout(Duration::from_millis(timeout_ms))
        .dns_resolver(Arc::new(PolicyDnsResolver { destination_policy }))
        .redirect(Policy::custom(move |attempt| {
            if attempt.previous().len() >= MAX_HTTP_REDIRECTS {
                return attempt.error(io::Error::other("too many redirects"));
            }
            match validate_fetch_destination(attempt.url(), &redirect_destination_policy) {
                Ok(()) => attempt.follow(),
                Err(error) => attempt.error(DestinationPolicyError(error)),
            }
        }));
    if disable_implicit_proxy {
        builder = builder.no_proxy();
    }
    builder
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
    let mut failure = FetchAttemptFailure::default();

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
                let raw_content_type = resp
                    .headers()
                    .get("content-type")
                    .and_then(|value| value.to_str().ok())
                    .map(str::to_owned);
                let content_type = normalize_content_type(raw_content_type.as_deref());
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
                        return payload_too_large_response(PayloadTooLargeParams {
                            status,
                            final_url,
                            content_type,
                            limit_bytes: MAX_RESPONSE_BODY_BYTES,
                            actual_bytes: Some(content_len),
                            attempt,
                            elapsed_ms,
                            request_id: request_id.as_deref(),
                        });
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
                        return payload_too_large_response(PayloadTooLargeParams {
                            status,
                            final_url,
                            content_type,
                            limit_bytes,
                            actual_bytes: None,
                            attempt,
                            elapsed_ms,
                            request_id: request_id.as_deref(),
                        });
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
                return map_success_payload_response(SuccessPayloadParams {
                    status,
                    is_wap_scheme,
                    request_url: &url,
                    upstream_url: &upstream_url,
                    final_url,
                    content_type: raw_content_type.unwrap_or(content_type),
                    body: body.as_slice(),
                    attempt,
                    elapsed_ms,
                    request_id: request_id.as_deref(),
                });
            }
            Err(err) => {
                if let Some(policy_error) = destination_policy_error(&err) {
                    return invalid_request_response(
                        request_url.clone(),
                        policy_error.to_string(),
                        request_id.as_deref(),
                    );
                }
                failure.record(
                    err.to_string(),
                    err.is_timeout(),
                    start.elapsed().as_secs_f64() * 1000.0,
                );
                log_fetch_attempt_failure(
                    request_id.as_deref(),
                    &url,
                    attempt,
                    attempts,
                    failure.is_timeout(),
                    failure.message(),
                    failure.elapsed_ms(),
                );
            }
        }
    }

    failure.into_terminal_response(url, attempts, attempts, request_id.as_deref())
}

fn destination_policy_error(error: &reqwest::Error) -> Option<FetchDestinationError> {
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
    use crate::fetch_policy::DestinationHostClass;
    use crate::test_support::with_env_var_locked;
    use std::io::{Read, Write};
    use std::net::TcpListener;
    use std::thread;

    fn read_http_request_headers(stream: &mut impl Read) {
        const MAX_TEST_REQUEST_HEADER_BYTES: usize = 8 * 1024;

        let mut request = [0_u8; MAX_TEST_REQUEST_HEADER_BYTES];
        let mut request_len = 0;
        while !request[..request_len]
            .windows(4)
            .any(|window| window == b"\r\n\r\n")
        {
            assert!(
                request_len < request.len(),
                "redirect test request headers must stay bounded"
            );
            let read = stream
                .read(&mut request[request_len..])
                .expect("read redirect request");
            assert!(read > 0, "redirect request must contain complete headers");
            request_len += read;
        }
    }

    #[test]
    fn http_client_rejects_private_dns_answer() {
        let client = http_client_builder(1_000, FetchDestinationPolicy::PublicOnly)
            .build()
            .expect("build DNS policy test client");
        let error = client
            .get("http://localhost:9/private")
            .send()
            .expect_err("private DNS answer must be rejected");

        let policy_error =
            destination_policy_error(&error).expect("policy error should survive reqwest wrapping");
        assert!(
            policy_error.is_policy_blocked(),
            "classification must come from the error type, not its message text"
        );
        let message = policy_error.to_string();
        assert!(message.contains("public-only"));
        assert!(message.contains("loopback"));
    }

    #[test]
    fn http_client_rejects_redirect_to_private_destination() {
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind redirect test server");
        let listener_address = listener.local_addr().expect("read redirect server address");
        let server = thread::spawn(move || {
            let (mut stream, _) = listener.accept().expect("accept redirect request");
            // Linux may reset a TCP connection closed with unread request bytes, racing the
            // response and masking the intended reqwest redirect-policy error with an I/O error.
            // Consume the complete GET request before writing and closing the fixture response.
            read_http_request_headers(&mut stream);
            stream
                .write_all(
                    b"HTTP/1.1 302 Found\r\nLocation: http://127.0.0.1:9/private\r\nContent-Length: 0\r\nConnection: close\r\n\r\n",
                )
                .expect("write redirect response");
        });

        let client = http_client_builder(1_000, FetchDestinationPolicy::PublicOnly)
            .resolve("public.test", listener_address)
            .build()
            .expect("build redirect test client");
        let error = client
            .get(format!("http://public.test:{}/", listener_address.port()))
            .send()
            .expect_err("private redirect must be rejected");
        server.join().expect("redirect test server should exit");

        let policy_error =
            destination_policy_error(&error).expect("policy error should survive reqwest wrapping");
        assert!(
            policy_error.is_policy_blocked(),
            "classification must come from the error type, not its message text"
        );
        assert_eq!(
            policy_error,
            FetchDestinationError::blocked_host(DestinationHostClass::Loopback),
            "the redirect target must retain its typed loopback policy classification"
        );
        let message = policy_error.to_string();
        assert!(message.contains("public-only"));
        assert!(message.contains("loopback"));
    }

    #[test]
    fn public_only_client_ignores_ambient_system_proxy_env_vars() {
        // reqwest enables system-proxy discovery by default: if HTTP_PROXY
        // were honored here, the request below would be routed to
        // `fake_proxy` (which resolves the destination itself, bypassing
        // PolicyDnsResolver) instead of connecting directly to
        // `direct_server`. Bound both sides so a regression fails fast
        // instead of hanging: the client's own 1s timeout bounds the
        // request, and `direct_server`'s accept loop is bounded to slightly
        // longer than that.
        let direct_listener = TcpListener::bind("127.0.0.1:0").expect("bind direct test server");
        let direct_address = direct_listener
            .local_addr()
            .expect("read direct server address");
        let direct_server = thread::spawn(move || -> bool {
            direct_listener
                .set_nonblocking(true)
                .expect("direct listener should support nonblocking mode");
            let deadline = Instant::now() + Duration::from_millis(1_500);
            loop {
                match direct_listener.accept() {
                    Ok((mut stream, _)) => {
                        stream
                            .set_nonblocking(false)
                            .expect("accepted stream should support blocking mode");
                        read_http_request_headers(&mut stream);
                        stream
                            .write_all(
                                b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok",
                            )
                            .expect("write direct response");
                        return true;
                    }
                    Err(error) if error.kind() == io::ErrorKind::WouldBlock => {
                        if Instant::now() >= deadline {
                            return false;
                        }
                        thread::sleep(Duration::from_millis(10));
                    }
                    Err(error) => panic!("unexpected direct listener error: {error}"),
                }
            }
        });

        let fake_proxy = TcpListener::bind("127.0.0.1:0").expect("bind fake proxy listener");
        let fake_proxy_address = fake_proxy.local_addr().expect("read fake proxy address");
        fake_proxy
            .set_nonblocking(true)
            .expect("fake proxy listener should support nonblocking mode");

        let response = with_env_var_locked(
            "HTTP_PROXY",
            &format!("http://{fake_proxy_address}"),
            || {
                let client = http_client_builder(1_000, FetchDestinationPolicy::PublicOnly)
                    .resolve("public.test", direct_address)
                    .build()
                    .expect("build proxy-env test client");
                client
                    .get(format!("http://public.test:{}/", direct_address.port()))
                    .send()
            },
        );

        let reached_direct_server = direct_server
            .join()
            .expect("direct server thread should not panic");

        match fake_proxy.accept() {
            Err(error) if error.kind() == io::ErrorKind::WouldBlock => {}
            Ok(_) => panic!(
                "PublicOnly client must not route through the ambient HTTP_PROXY environment variable"
            ),
            Err(error) => panic!("unexpected fake proxy listener error: {error}"),
        }

        assert!(
            reached_direct_server,
            "PublicOnly client must reach the destination directly, not through the ambient proxy"
        );
        let response = response.expect("direct request should succeed");
        assert_eq!(response.status(), 200);
    }
}
