use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Read;
use std::net::IpAddr;
use std::time::{Duration, Instant};
use ts_rs::TS;
use url::{Host, Url};

mod gateway;
mod request_meta;
mod responses;
pub mod smpp_profile;
pub mod tcp_profile;
mod wbxml;
pub mod wsp_capability;
pub mod wsp_registry;

use gateway::build_gateway_request;
use request_meta::{log_transport_event, normalized_request_id};
use responses::{
    invalid_request_response, map_success_payload_response, map_terminal_send_error,
    normalize_content_type, payload_too_large_response, transport_unavailable_response,
};
pub use wbxml::preflight_wbxml_decoder;
const MAX_URI_OCTETS: usize = 1024;
const MAX_RESPONSE_BODY_BYTES: usize = 512 * 1024;

#[derive(Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchDeckRequest {
    pub url: String,
    #[ts(optional)]
    pub method: Option<String>,
    #[ts(optional)]
    pub headers: Option<HashMap<String, String>>,
    #[ts(type = "number", optional)]
    pub timeout_ms: Option<u64>,
    #[ts(optional)]
    pub retries: Option<u8>,
    #[ts(optional)]
    pub request_id: Option<String>,
    #[ts(optional)]
    pub request_policy: Option<FetchRequestPolicy>,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum FetchCacheControlPolicy {
    Default,
    NoCache,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FetchPostContext {
    #[ts(optional)]
    pub same_deck: Option<bool>,
    #[ts(optional)]
    pub content_type: Option<String>,
    #[ts(optional)]
    pub payload: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FetchRequestPolicy {
    #[ts(optional)]
    pub destination_policy: Option<FetchDestinationPolicy>,
    #[ts(optional)]
    pub cache_control: Option<FetchCacheControlPolicy>,
    #[ts(optional)]
    pub referer_url: Option<String>,
    #[ts(optional)]
    pub post_context: Option<FetchPostContext>,
    #[ts(optional)]
    pub ua_capability_profile: Option<FetchUaCapabilityProfile>,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum FetchUaCapabilityProfile {
    Disabled,
    WapBaseline,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum FetchDestinationPolicy {
    PublicOnly,
    AllowPrivate,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchTiming {
    pub encode: f64,
    pub udp_rtt: f64,
    pub decode: f64,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchErrorInfo {
    #[ts(
        type = "\"INVALID_REQUEST\" | \"GATEWAY_TIMEOUT\" | \"UNSUPPORTED_CONTENT_TYPE\" | \"WBXML_DECODE_FAILED\" | \"PROTOCOL_ERROR\" | \"TRANSPORT_UNAVAILABLE\""
    )]
    pub code: String,
    pub message: String,
    #[ts(type = "Record<string, unknown>", optional)]
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct EngineDeckInputPayload {
    pub wml_xml: String,
    pub base_url: String,
    pub content_type: String,
    #[ts(optional)]
    pub raw_bytes_base64: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchDeckResponse {
    pub ok: bool,
    pub status: u16,
    pub final_url: String,
    pub content_type: String,
    #[ts(optional)]
    pub wml: Option<String>,
    #[ts(optional)]
    pub error: Option<FetchErrorInfo>,
    pub timing_ms: FetchTiming,
    #[ts(optional)]
    pub engine_deck_input: Option<EngineDeckInputPayload>,
}

pub fn fetch_deck_in_process(request: FetchDeckRequest) -> FetchDeckResponse {
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

fn resolve_fetch_destination_policy(
    request_policy: Option<&FetchRequestPolicy>,
) -> FetchDestinationPolicy {
    request_policy
        .and_then(|policy| policy.destination_policy.clone())
        .unwrap_or(FetchDestinationPolicy::PublicOnly)
}

fn validate_fetch_destination(
    parsed_url: &Url,
    destination_policy: &FetchDestinationPolicy,
) -> Result<(), String> {
    if !matches!(parsed_url.scheme(), "http" | "https" | "wap" | "waps") {
        return Err(format!("Unsupported URL scheme: {}", parsed_url.scheme()));
    }
    if matches!(destination_policy, FetchDestinationPolicy::AllowPrivate) {
        return Ok(());
    }

    match classify_destination_host(parsed_url) {
        None | Some(DestinationHostClass::Public) => Ok(()),
        Some(class) => Err(format!(
            "Destination blocked by fetch policy (public-only): {} host",
            class.label()
        )),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DestinationHostClass {
    Public,
    Loopback,
    Private,
    LinkLocal,
    Unspecified,
    Multicast,
}

impl DestinationHostClass {
    fn label(self) -> &'static str {
        match self {
            DestinationHostClass::Public => "public",
            DestinationHostClass::Loopback => "loopback",
            DestinationHostClass::Private => "private",
            DestinationHostClass::LinkLocal => "link-local",
            DestinationHostClass::Unspecified => "unspecified",
            DestinationHostClass::Multicast => "multicast",
        }
    }
}

fn classify_destination_host(parsed_url: &Url) -> Option<DestinationHostClass> {
    match parsed_url.host()? {
        Host::Domain(domain) => {
            let normalized = domain.trim().trim_end_matches('.').to_ascii_lowercase();
            if normalized == "localhost" || normalized.ends_with(".localhost") {
                Some(DestinationHostClass::Loopback)
            } else {
                Some(DestinationHostClass::Public)
            }
        }
        Host::Ipv4(ip) => Some(classify_ip(IpAddr::V4(ip))),
        Host::Ipv6(ip) => Some(classify_ip(IpAddr::V6(ip))),
    }
}

fn classify_ip(ip: IpAddr) -> DestinationHostClass {
    match ip {
        IpAddr::V4(v4) => {
            if v4.is_loopback() {
                DestinationHostClass::Loopback
            } else if v4.is_private() {
                DestinationHostClass::Private
            } else if v4.is_link_local() {
                DestinationHostClass::LinkLocal
            } else if v4.is_unspecified() {
                DestinationHostClass::Unspecified
            } else if v4.is_multicast() {
                DestinationHostClass::Multicast
            } else {
                DestinationHostClass::Public
            }
        }
        IpAddr::V6(v6) => {
            if v6.is_loopback() {
                DestinationHostClass::Loopback
            } else if v6.is_unique_local() {
                DestinationHostClass::Private
            } else if v6.is_unicast_link_local() {
                DestinationHostClass::LinkLocal
            } else if v6.is_unspecified() {
                DestinationHostClass::Unspecified
            } else if v6.is_multicast() {
                DestinationHostClass::Multicast
            } else {
                DestinationHostClass::Public
            }
        }
    }
}

enum ReadBodyError {
    ReadFailed(String),
    TooLarge { limit_bytes: usize },
}

fn read_response_body_limited(
    response: &mut reqwest::blocking::Response,
    max_bytes: usize,
) -> Result<Vec<u8>, ReadBodyError> {
    let mut body = Vec::new();
    let mut reader = response.take((max_bytes as u64).saturating_add(1));
    reader
        .read_to_end(&mut body)
        .map_err(|err| ReadBodyError::ReadFailed(format!("transport read failed: {err}")))?;
    if body.len() > max_bytes {
        return Err(ReadBodyError::TooLarge {
            limit_bytes: max_bytes,
        });
    }
    Ok(body)
}

fn apply_request_policy(
    method: String,
    mut outbound_headers: HashMap<String, String>,
    request_policy: Option<&FetchRequestPolicy>,
) -> (
    String,
    HashMap<String, String>,
    bool,
    FetchUaCapabilityProfile,
) {
    let mut normalized_method = method;
    let mut suppressed_same_deck_post_context = false;
    let mut applied_ua_capability_profile = FetchUaCapabilityProfile::Disabled;

    if let Some(policy) = request_policy {
        let ua_profile = policy
            .ua_capability_profile
            .clone()
            .unwrap_or(FetchUaCapabilityProfile::Disabled);
        applied_ua_capability_profile = ua_profile.clone();
        apply_ua_capability_headers(&mut outbound_headers, &ua_profile);

        if matches!(policy.cache_control, Some(FetchCacheControlPolicy::NoCache)) {
            outbound_headers.insert("Cache-Control".to_string(), "no-cache".to_string());
            outbound_headers.insert("Pragma".to_string(), "no-cache".to_string());
        }

        if let Some(referer) = policy
            .referer_url
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        {
            outbound_headers.insert("Referer".to_string(), referer.to_string());
        }

        if normalized_method == "POST" {
            let same_deck = policy
                .post_context
                .as_ref()
                .and_then(|post| post.same_deck)
                .unwrap_or(false);
            let no_cache = matches!(policy.cache_control, Some(FetchCacheControlPolicy::NoCache));
            if same_deck && !no_cache {
                normalized_method = "GET".to_string();
                suppressed_same_deck_post_context = true;
            }
        }
    }

    (
        normalized_method,
        outbound_headers,
        suppressed_same_deck_post_context,
        applied_ua_capability_profile,
    )
}

fn apply_ua_capability_headers(
    outbound_headers: &mut HashMap<String, String>,
    profile: &FetchUaCapabilityProfile,
) {
    match profile {
        FetchUaCapabilityProfile::Disabled => {}
        FetchUaCapabilityProfile::WapBaseline => {
            outbound_headers
                .entry("Accept".to_string())
                .or_insert_with(|| {
                    "text/vnd.wap.wml, application/vnd.wap.wmlc, image/vnd.wap.wbmp; level=0"
                        .to_string()
                });
            outbound_headers
                .entry("Accept-Charset".to_string())
                .or_insert_with(|| "utf-8, us-ascii;q=0.8".to_string());
            outbound_headers
                .entry("Accept-Encoding".to_string())
                .or_insert_with(|| "identity".to_string());
            outbound_headers
                .entry("Accept-Language".to_string())
                .or_insert_with(|| "en".to_string());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        apply_request_policy, classify_destination_host, classify_ip, fetch_deck_in_process,
        preflight_wbxml_decoder, resolve_fetch_destination_policy, validate_fetch_destination,
        DestinationHostClass, FetchCacheControlPolicy, FetchDeckRequest, FetchDestinationPolicy,
        FetchPostContext, FetchRequestPolicy, FetchUaCapabilityProfile, MAX_RESPONSE_BODY_BYTES,
        MAX_URI_OCTETS,
    };
    use crate::gateway::build_gateway_request;
    use crate::request_meta::{
        details_with_request_id, log_transport_event, normalized_request_id,
    };
    use crate::responses::{
        invalid_request_response, is_supported_wml_content_type, map_success_payload_response,
        map_terminal_send_error, normalize_content_type, payload_too_large_response,
    };
    use crate::wbxml::{
        decode_wmlc, decode_wmlc_with_libwbxml, decode_wmlc_with_tool, libwbxml_available,
        libwbxml_disabled_by_env, libwbxml_error_text, wbxml2xml_bin, LibwbxmlDecodeError,
    };
    use base64::engine::general_purpose::STANDARD as BASE64;
    use base64::Engine as _;
    use serde::Deserialize;
    use std::collections::HashMap;
    use std::fs;
    use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};
    use std::path::PathBuf;
    use std::sync::{Mutex, OnceLock};
    use toml::Value;
    use url::Url;

    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    fn basic_request(url: String) -> FetchDeckRequest {
        FetchDeckRequest {
            url,
            method: None,
            headers: None,
            timeout_ms: Some(500),
            retries: Some(0),
            request_id: None,
            request_policy: None,
        }
    }

    fn request_policy_with_destination(
        destination_policy: FetchDestinationPolicy,
    ) -> FetchRequestPolicy {
        FetchRequestPolicy {
            destination_policy: Some(destination_policy),
            cache_control: None,
            referer_url: None,
            post_context: None,
            ua_capability_profile: None,
        }
    }

    fn detail_string(response: &super::FetchDeckResponse, key: &str) -> Option<String> {
        response
            .error
            .as_ref()
            .and_then(|error| error.details.as_ref())
            .and_then(|details| details.get(key))
            .and_then(|value| value.as_str())
            .map(str::to_string)
    }

    fn with_env_var_locked<T>(name: &str, value: &str, f: impl FnOnce() -> T) -> T {
        let _env_guard = env_lock().lock().expect("env lock should succeed");
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
        let _env_guard = env_lock().lock().expect("env lock should succeed");
        let previous = std::env::var(name).ok();
        std::env::remove_var(name);
        let out = f();
        if let Some(old) = previous {
            std::env::set_var(name, old);
        }
        out
    }

    fn with_two_env_vars_locked<T>(
        first_name: &str,
        first_value: &str,
        second_name: &str,
        second_value: &str,
        f: impl FnOnce() -> T,
    ) -> T {
        let _env_guard = env_lock().lock().expect("env lock should succeed");
        let first_prev = std::env::var(first_name).ok();
        let second_prev = std::env::var(second_name).ok();
        std::env::set_var(first_name, first_value);
        std::env::set_var(second_name, second_value);
        let out = f();
        if let Some(old) = first_prev {
            std::env::set_var(first_name, old);
        } else {
            std::env::remove_var(first_name);
        }
        if let Some(old) = second_prev {
            std::env::set_var(second_name, old);
        } else {
            std::env::remove_var(second_name);
        }
        out
    }

    #[cfg(unix)]
    fn write_fake_decoder_script(xml: &str) -> PathBuf {
        use std::os::unix::fs::PermissionsExt;
        let script = format!(
            "#!/bin/sh\nif [ \"$1\" != \"-o\" ]; then exit 2; fi\nout=\"$2\"\nprintf '%s' '{}' > \"$out\"\n",
            xml
        );
        let dir = tempfile::tempdir().expect("tempdir should create");
        let path = dir.path().join("fake-wbxml2xml.sh");
        fs::write(&path, script).expect("fake decoder script should write");
        let mut perms = fs::metadata(&path)
            .expect("fake decoder metadata should exist")
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&path, perms).expect("fake decoder should become executable");
        let keep = path.clone();
        std::mem::forget(dir);
        keep
    }

    fn wbxml_sample_paths() -> Vec<PathBuf> {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("wbxml_samples");
        if !root.is_dir() {
            return Vec::new();
        }

        let mut paths: Vec<PathBuf> = fs::read_dir(root)
            .expect("wbxml_samples directory should be readable")
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.extension().and_then(|ext| ext.to_str()) == Some("wbxml"))
            .collect();
        paths.sort();
        paths
    }

    fn wbxml_fixture_expectations() -> HashMap<String, String> {
        let manifest_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("wbxml_samples")
            .join("fixtures.toml");
        let raw =
            fs::read_to_string(&manifest_path).expect("fixtures.toml should exist and be readable");
        let doc: Value = raw.parse().expect("fixtures.toml should parse");
        let fixtures = doc
            .get("fixtures")
            .and_then(Value::as_array)
            .expect("fixtures.toml should contain [[fixtures]] entries");

        let mut out = HashMap::new();
        for fixture in fixtures {
            let file = fixture
                .get("file")
                .and_then(Value::as_str)
                .expect("fixture file should be a string");
            let expected = fixture
                .get("expected")
                .and_then(Value::as_str)
                .expect("fixture expected should be a string");
            out.insert(file.to_string(), expected.to_string());
        }
        out
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct FixtureMapInput {
        status: u16,
        is_wap_scheme: bool,
        request_url: String,
        upstream_url: String,
        final_url: String,
        content_type: String,
        body: Option<String>,
        body_base64: Option<String>,
        attempt: u8,
        elapsed_ms: f64,
    }

    impl FixtureMapInput {
        fn body_bytes(&self) -> Vec<u8> {
            if let Some(encoded) = self.body_base64.as_deref() {
                return BASE64.decode(encoded).unwrap_or_else(|_| {
                    panic!("fixture bodyBase64 should decode for {}", self.final_url)
                });
            }
            if let Some(body) = self.body.as_deref() {
                return body.as_bytes().to_vec();
            }
            panic!(
                "fixture must provide either body or bodyBase64 for {}",
                self.final_url
            );
        }
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct FixtureExpected {
        ok: bool,
        status: u16,
        final_url: String,
        content_type: String,
        wml: Option<String>,
        error_code: Option<String>,
    }

    fn transport_fixture_path(name: &str, file: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join("transport")
            .join(name)
            .join(file)
    }

    fn read_json_fixture<T: for<'de> Deserialize<'de>>(name: &str, file: &str) -> T {
        let path = transport_fixture_path(name, file);
        let raw = fs::read(&path).unwrap_or_else(|_| panic!("failed reading {}", path.display()));
        serde_json::from_slice(&raw)
            .unwrap_or_else(|_| panic!("failed parsing fixture {}", path.display()))
    }

    #[test]
    fn transport_normalize_content_type_handles_charset_and_empty() {
        assert_eq!(
            normalize_content_type(Some("text/vnd.wap.wml; charset=utf-8")),
            "text/vnd.wap.wml"
        );
        assert_eq!(normalize_content_type(Some("")), "application/octet-stream");
        assert_eq!(normalize_content_type(None), "application/octet-stream");
    }

    #[test]
    fn transport_normalized_request_id_trims_and_rejects_blank() {
        assert_eq!(normalized_request_id(Some(" req-1 ")), Some("req-1"));
        assert_eq!(normalized_request_id(Some("   ")), None);
        assert_eq!(normalized_request_id(None), None);
    }

    #[test]
    fn transport_details_with_request_id_merges_object_details() {
        let merged =
            details_with_request_id(Some("req-merge"), Some(serde_json::json!({ "attempt": 2 })))
                .expect("details should exist");
        assert_eq!(
            merged.get("requestId").and_then(|value| value.as_str()),
            Some("req-merge")
        );
        assert_eq!(
            merged.get("attempt").and_then(|value| value.as_u64()),
            Some(2)
        );
    }

    #[test]
    fn transport_details_with_request_id_keeps_non_object_details_and_handles_blank() {
        let passthrough = details_with_request_id(Some("req-raw"), Some(serde_json::json!("raw")))
            .expect("details should exist");
        assert_eq!(passthrough.as_str(), Some("raw"));

        let blank_id = details_with_request_id(Some("   "), Some(serde_json::json!({ "a": 1 })));
        assert!(blank_id.is_none());
    }

    #[test]
    fn transport_log_event_accepts_blank_or_missing_request_id() {
        log_transport_event(
            "transport.test",
            None,
            "http://example.test",
            serde_json::json!({ "ok": true }),
        );
        log_transport_event(
            "transport.test",
            Some("   "),
            "http://example.test",
            serde_json::json!({ "ok": true }),
        );
    }

    #[test]
    fn transport_build_gateway_request_maps_wap_url_and_headers() {
        let headers = HashMap::new();
        let result = build_gateway_request("wap://example.test/home.wml?x=1", "GET", &headers)
            .expect("gateway mapping should succeed");
        let (gateway_url, mapped_headers) = result;
        assert_eq!(gateway_url, "http://localhost:13002/home.wml?x=1");
        assert!(
            !mapped_headers.contains_key("Host"),
            "transport should not inject Host header for gateway mapping"
        );
        assert_eq!(
            mapped_headers.get("X-Wap-Target-Url"),
            Some(&"wap://example.test/home.wml?x=1".to_string())
        );
    }

    #[test]
    fn transport_build_gateway_request_handles_root_path() {
        let headers = HashMap::new();
        let (gateway_url, _) = build_gateway_request("wap://example.test", "GET", &headers)
            .expect("gateway root mapping should succeed");
        assert_eq!(gateway_url, "http://localhost:13002/");
    }

    #[test]
    fn transport_build_gateway_request_rejects_non_wap_scheme() {
        let headers = HashMap::new();
        let err = build_gateway_request("http://example.test/home.wml", "GET", &headers)
            .expect_err("non-wap scheme should be rejected");
        assert!(err.contains("unsupported scheme"));
    }

    #[test]
    fn transport_build_gateway_request_rejects_non_get_method() {
        let headers = HashMap::new();
        let err = build_gateway_request("wap://example.test/home.wml", "POST", &headers)
            .expect_err("non-GET method should be rejected");
        assert!(err.contains("only supports GET"));
    }

    #[test]
    fn transport_build_gateway_request_keeps_target_in_x_wap_target_url_when_port_present() {
        let headers = HashMap::new();
        let (_, mapped_headers) =
            build_gateway_request("wap://example.test:9200/home.wml", "GET", &headers)
                .expect("gateway mapping with explicit target port should succeed");
        assert_eq!(
            mapped_headers.get("X-Wap-Target-Url").map(String::as_str),
            Some("wap://example.test:9200/home.wml")
        );
    }

    #[test]
    fn transport_build_gateway_request_keeps_existing_host_header() {
        let mut headers = HashMap::new();
        headers.insert("Host".to_string(), "custom.host".to_string());
        let (_, mapped_headers) =
            build_gateway_request("wap://example.test/home.wml", "GET", &headers)
                .expect("gateway mapping should succeed");
        assert_eq!(
            mapped_headers.get("Host").map(String::as_str),
            Some("custom.host")
        );
    }

    #[test]
    fn apply_request_policy_adds_no_cache_headers_and_referer() {
        let mut headers = HashMap::new();
        headers.insert("X-Test".to_string(), "yes".to_string());
        let policy = FetchRequestPolicy {
            destination_policy: None,
            cache_control: Some(FetchCacheControlPolicy::NoCache),
            referer_url: Some("http://example.test/home.wml".to_string()),
            post_context: None,
            ua_capability_profile: None,
        };

        let (method, mapped_headers, suppressed, ua_profile) =
            apply_request_policy("GET".to_string(), headers, Some(&policy));
        assert_eq!(method, "GET");
        assert!(!suppressed);
        assert_eq!(ua_profile, FetchUaCapabilityProfile::Disabled);
        assert_eq!(
            mapped_headers.get("Cache-Control").map(String::as_str),
            Some("no-cache")
        );
        assert_eq!(
            mapped_headers.get("Pragma").map(String::as_str),
            Some("no-cache")
        );
        assert_eq!(
            mapped_headers.get("Referer").map(String::as_str),
            Some("http://example.test/home.wml")
        );
        assert_eq!(
            mapped_headers.get("X-Test").map(String::as_str),
            Some("yes")
        );
    }

    #[test]
    fn apply_request_policy_suppresses_same_deck_post_without_no_cache() {
        let policy = FetchRequestPolicy {
            destination_policy: None,
            cache_control: Some(FetchCacheControlPolicy::Default),
            referer_url: None,
            post_context: Some(FetchPostContext {
                same_deck: Some(true),
                content_type: Some("application/x-www-form-urlencoded".to_string()),
                payload: Some("a=1".to_string()),
            }),
            ua_capability_profile: None,
        };
        let (method, _mapped_headers, suppressed, ua_profile) =
            apply_request_policy("POST".to_string(), HashMap::new(), Some(&policy));
        assert_eq!(method, "GET");
        assert!(suppressed);
        assert_eq!(ua_profile, FetchUaCapabilityProfile::Disabled);
    }

    #[test]
    fn apply_request_policy_keeps_post_when_no_cache_is_set() {
        let policy = FetchRequestPolicy {
            destination_policy: None,
            cache_control: Some(FetchCacheControlPolicy::NoCache),
            referer_url: None,
            post_context: Some(FetchPostContext {
                same_deck: Some(true),
                content_type: Some("application/x-www-form-urlencoded".to_string()),
                payload: Some("a=1".to_string()),
            }),
            ua_capability_profile: None,
        };
        let (method, mapped_headers, suppressed, ua_profile) =
            apply_request_policy("POST".to_string(), HashMap::new(), Some(&policy));
        assert_eq!(method, "POST");
        assert!(!suppressed);
        assert_eq!(ua_profile, FetchUaCapabilityProfile::Disabled);
        assert_eq!(
            mapped_headers.get("Cache-Control").map(String::as_str),
            Some("no-cache")
        );
    }

    #[test]
    fn apply_request_policy_wap_baseline_profile_adds_capability_headers() {
        let policy = FetchRequestPolicy {
            destination_policy: None,
            cache_control: None,
            referer_url: None,
            post_context: None,
            ua_capability_profile: Some(FetchUaCapabilityProfile::WapBaseline),
        };
        let (method, mapped_headers, suppressed, ua_profile) =
            apply_request_policy("GET".to_string(), HashMap::new(), Some(&policy));
        assert_eq!(method, "GET");
        assert!(!suppressed);
        assert_eq!(ua_profile, FetchUaCapabilityProfile::WapBaseline);
        assert_eq!(
            mapped_headers.get("Accept").map(String::as_str),
            Some("text/vnd.wap.wml, application/vnd.wap.wmlc, image/vnd.wap.wbmp; level=0")
        );
        assert_eq!(
            mapped_headers.get("Accept-Charset").map(String::as_str),
            Some("utf-8, us-ascii;q=0.8")
        );
        assert_eq!(
            mapped_headers.get("Accept-Encoding").map(String::as_str),
            Some("identity")
        );
        assert_eq!(
            mapped_headers.get("Accept-Language").map(String::as_str),
            Some("en")
        );
    }

    #[test]
    fn apply_request_policy_wap_baseline_profile_keeps_existing_capability_headers() {
        let mut headers = HashMap::new();
        headers.insert("Accept-Language".to_string(), "fr-ca".to_string());
        let policy = FetchRequestPolicy {
            destination_policy: None,
            cache_control: None,
            referer_url: None,
            post_context: None,
            ua_capability_profile: Some(FetchUaCapabilityProfile::WapBaseline),
        };
        let (_method, mapped_headers, _suppressed, _ua_profile) =
            apply_request_policy("GET".to_string(), headers, Some(&policy));
        assert_eq!(
            mapped_headers.get("Accept-Language").map(String::as_str),
            Some("fr-ca")
        );
    }

    #[test]
    fn apply_request_policy_disabled_profile_does_not_add_capability_headers() {
        let policy = FetchRequestPolicy {
            destination_policy: None,
            cache_control: None,
            referer_url: None,
            post_context: None,
            ua_capability_profile: Some(FetchUaCapabilityProfile::Disabled),
        };
        let (_method, mapped_headers, _suppressed, ua_profile) =
            apply_request_policy("GET".to_string(), HashMap::new(), Some(&policy));
        assert_eq!(ua_profile, FetchUaCapabilityProfile::Disabled);
        assert!(!mapped_headers.contains_key("Accept"));
        assert!(!mapped_headers.contains_key("Accept-Charset"));
        assert!(!mapped_headers.contains_key("Accept-Encoding"));
        assert!(!mapped_headers.contains_key("Accept-Language"));
    }

    #[test]
    fn transport_decode_wmlc_missing_tool_returns_structured_error() {
        let err = decode_wmlc_with_tool(b"\x03\x01\x6a\x00", "__definitely_missing_wbxml2xml__")
            .expect_err("missing tool should fail");
        assert!(err.contains("WBXML decoder tool not available"));
    }

    #[test]
    fn transport_decode_wmlc_empty_payload_fails() {
        let err = decode_wmlc_with_tool(&[], "__unused_tool__")
            .expect_err("empty payload should fail before command invocation");
        assert!(err.contains("empty payload"));
    }

    #[test]
    #[cfg(unix)]
    fn transport_decode_wmlc_tool_nonzero_exit_fails() {
        let err =
            decode_wmlc_with_tool(b"\x03\x01\x6a\x00", "false").expect_err("false should fail");
        assert!(err.contains("WBXML decode failed"));
    }

    #[test]
    #[cfg(unix)]
    fn transport_decode_wmlc_success_with_fake_tool() {
        let script = write_fake_decoder_script("<wml><card id=\"ok\"/></wml>");
        let decoded = decode_wmlc_with_tool(b"\x03\x01\x6a\x00", script.to_string_lossy().as_ref())
            .expect("fake decoder should produce xml");
        assert!(decoded.contains("<wml>"));
    }

    #[test]
    fn transport_wbxml2xml_bin_uses_default_when_env_missing() {
        let value = with_env_removed_locked("WBXML2XML_BIN", wbxml2xml_bin);
        assert_eq!(value, "wbxml2xml");
    }

    #[test]
    fn transport_wbxml2xml_bin_uses_env_override() {
        let value = with_env_var_locked("WBXML2XML_BIN", "/tmp/custom-wbxml2xml", wbxml2xml_bin);
        assert_eq!(value, "/tmp/custom-wbxml2xml");
    }

    #[test]
    fn transport_libwbxml_disable_flag_honored() {
        let disabled = with_env_var_locked("LOWBAND_DISABLE_LIBWBXML", "true", || {
            libwbxml_disabled_by_env()
        });
        assert!(disabled);

        let disabled_yes = with_env_var_locked("LOWBAND_DISABLE_LIBWBXML", "yes", || {
            libwbxml_disabled_by_env()
        });
        assert!(disabled_yes);

        let not_disabled =
            with_env_removed_locked("LOWBAND_DISABLE_LIBWBXML", libwbxml_disabled_by_env);
        assert!(!not_disabled);
    }

    #[test]
    fn transport_libwbxml_error_text_handles_null_pointer_message() {
        unsafe extern "C" fn null_msg(_: i32) -> *const u8 {
            std::ptr::null()
        }
        let text = libwbxml_error_text(null_msg, -9);
        assert_eq!(text, "libwbxml error code -9");
    }

    #[test]
    fn transport_libwbxml_available_or_disabled_result_is_deterministic() {
        let result = libwbxml_available();
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn transport_decode_wmlc_with_libwbxml_disable_returns_unavailable() {
        let result = with_env_var_locked("LOWBAND_DISABLE_LIBWBXML", "1", || {
            decode_wmlc_with_libwbxml(b"\x03\x01\x6a\x00")
        });
        assert!(matches!(result, Err(LibwbxmlDecodeError::Unavailable(_))));
    }

    #[test]
    fn transport_decode_wmlc_with_libwbxml_empty_payload_returns_failed() {
        let result =
            with_env_removed_locked(
                "LOWBAND_DISABLE_LIBWBXML",
                || decode_wmlc_with_libwbxml(&[]),
            );
        assert!(matches!(result, Err(LibwbxmlDecodeError::Failed(_))));
    }

    #[test]
    fn transport_decode_wmlc_with_libwbxml_attempts_decoder_path() {
        let result = decode_wmlc_with_libwbxml(b"\x03\x01\x6a\x00");
        match result {
            Ok(xml) => assert!(!xml.is_empty()),
            Err(LibwbxmlDecodeError::Failed(message))
            | Err(LibwbxmlDecodeError::Unavailable(message)) => {
                assert!(!message.is_empty())
            }
        }
    }

    #[test]
    #[cfg(unix)]
    fn transport_decode_wmlc_prefers_cli_when_lib_disabled() {
        let script = write_fake_decoder_script("<wml><card id=\"c\"/></wml>");
        let result = with_two_env_vars_locked(
            "LOWBAND_DISABLE_LIBWBXML",
            "1",
            "WBXML2XML_BIN",
            script.to_string_lossy().as_ref(),
            || decode_wmlc(b"\x03\x01\x6a\x00"),
        );
        assert!(result.is_ok());
    }

    #[test]
    fn transport_preflight_wbxml_decoder_reports_backend_or_error() {
        let result = preflight_wbxml_decoder();
        match result {
            Ok(backend) => assert!(backend == "libwbxml" || backend == "wbxml2xml-cli"),
            Err(message) => assert!(!message.is_empty()),
        }

        let forced_err = with_two_env_vars_locked(
            "LOWBAND_DISABLE_LIBWBXML",
            "1",
            "WBXML2XML_BIN",
            "__missing_wbxml2xml__",
            preflight_wbxml_decoder,
        );
        match forced_err {
            Ok(backend) => panic!("expected error backend, got {backend}"),
            Err(message) => assert!(!message.is_empty()),
        }
    }

    #[test]
    fn transport_preflight_wbxml_decoder_errors_when_all_backends_disabled() {
        let result = with_two_env_vars_locked(
            "LOWBAND_DISABLE_LIBWBXML",
            "1",
            "WBXML2XML_BIN",
            "__missing_wbxml2xml__",
            preflight_wbxml_decoder,
        );
        assert!(result.is_err());
    }

    #[test]
    fn transport_preflight_wbxml_decoder_cli_success_path() {
        let result = with_two_env_vars_locked(
            "LOWBAND_DISABLE_LIBWBXML",
            "1",
            "WBXML2XML_BIN",
            "true",
            preflight_wbxml_decoder,
        );
        assert_eq!(result.ok().as_deref(), Some("wbxml2xml-cli"));
    }

    #[test]
    fn transport_preflight_wbxml_decoder_cli_nonzero_maps_error() {
        let result = with_two_env_vars_locked(
            "LOWBAND_DISABLE_LIBWBXML",
            "1",
            "WBXML2XML_BIN",
            "false",
            preflight_wbxml_decoder,
        );
        assert!(result.is_err());
    }

    #[test]
    fn transport_decode_wmlc_when_backends_missing_combines_errors() {
        let err = with_two_env_vars_locked(
            "LOWBAND_DISABLE_LIBWBXML",
            "1",
            "WBXML2XML_BIN",
            "__missing_wbxml2xml__",
            || decode_wmlc(b"\x03\x01\x6a\x00").expect_err("all backends should fail"),
        );
        assert!(err.contains("libwbxml disabled"));
        assert!(err.contains("WBXML decoder tool not available"));
    }

    #[test]
    fn transport_with_env_var_locked_restores_existing_value() {
        let _guard = env_lock().lock().expect("env lock should succeed");
        std::env::set_var("WBXML2XML_BIN", "old-value");
        drop(_guard);

        with_env_var_locked("WBXML2XML_BIN", "new-value", || {
            assert_eq!(
                std::env::var("WBXML2XML_BIN").ok().as_deref(),
                Some("new-value")
            );
        });
        assert_eq!(
            std::env::var("WBXML2XML_BIN").ok().as_deref(),
            Some("old-value")
        );
        std::env::remove_var("WBXML2XML_BIN");
    }

    #[test]
    fn transport_with_env_removed_locked_restores_existing_value() {
        let _guard = env_lock().lock().expect("env lock should succeed");
        std::env::set_var("LOWBAND_DISABLE_LIBWBXML", "old-value");
        drop(_guard);

        with_env_removed_locked("LOWBAND_DISABLE_LIBWBXML", || {
            assert!(std::env::var("LOWBAND_DISABLE_LIBWBXML").is_err());
        });
        assert_eq!(
            std::env::var("LOWBAND_DISABLE_LIBWBXML").ok().as_deref(),
            Some("old-value")
        );
        std::env::remove_var("LOWBAND_DISABLE_LIBWBXML");
    }

    #[test]
    fn transport_with_two_env_vars_locked_restores_existing_values() {
        let _guard = env_lock().lock().expect("env lock should succeed");
        std::env::set_var("WBXML2XML_BIN", "old-one");
        std::env::set_var("LOWBAND_DISABLE_LIBWBXML", "old-two");
        drop(_guard);

        with_two_env_vars_locked(
            "WBXML2XML_BIN",
            "new-one",
            "LOWBAND_DISABLE_LIBWBXML",
            "new-two",
            || {
                assert_eq!(
                    std::env::var("WBXML2XML_BIN").ok().as_deref(),
                    Some("new-one")
                );
                assert_eq!(
                    std::env::var("LOWBAND_DISABLE_LIBWBXML").ok().as_deref(),
                    Some("new-two")
                );
            },
        );
        assert_eq!(
            std::env::var("WBXML2XML_BIN").ok().as_deref(),
            Some("old-one")
        );
        assert_eq!(
            std::env::var("LOWBAND_DISABLE_LIBWBXML").ok().as_deref(),
            Some("old-two")
        );
        std::env::remove_var("WBXML2XML_BIN");
        std::env::remove_var("LOWBAND_DISABLE_LIBWBXML");
    }

    #[test]
    fn transport_wbxml_sample_corpus_decodes_or_fails_structured() {
        let sample_paths = wbxml_sample_paths();
        let expectations = wbxml_fixture_expectations();
        assert!(
            !sample_paths.is_empty(),
            "expected wbxml_samples fixtures to be present"
        );
        assert_eq!(
            sample_paths.len(),
            expectations.len(),
            "fixtures.toml entries should match wbxml sample count"
        );

        for sample in sample_paths {
            let file_name = sample
                .file_name()
                .and_then(|name| name.to_str())
                .expect("sample filename should be utf-8");
            let expected = expectations
                .get(file_name)
                .unwrap_or_else(|| panic!("missing fixtures.toml entry for {file_name}"));
            let bytes = fs::read(&sample).expect("wbxml sample should be readable");
            let result = decode_wmlc(&bytes);
            match result {
                Ok(xml) => {
                    let trimmed = xml.trim();
                    assert!(
                        !trimmed.is_empty(),
                        "decoded XML should be non-empty for {}",
                        sample.display()
                    );
                    assert!(
                        trimmed.starts_with('<'),
                        "decoded XML should look like markup for {}",
                        sample.display()
                    );
                    if expected == "failure" {
                        panic!(
                            "expected failure per fixtures.toml but decode succeeded for {}",
                            sample.display()
                        );
                    }
                }
                Err(message) => {
                    let lower = message.to_ascii_lowercase();
                    let looks_structured = lower.contains("wbxml decode failed")
                        || lower.contains("decoder tool not available")
                        || lower.contains("libwbxml");
                    assert!(
                        looks_structured,
                        "decode failure should be structured for {}: {}",
                        sample.display(),
                        message
                    );
                    if expected == "success" {
                        panic!(
                            "expected success per fixtures.toml but decode failed for {}: {}",
                            sample.display(),
                            message
                        );
                    }
                }
            }
        }
    }

    #[test]
    fn transport_supported_content_type_matrix() {
        assert!(is_supported_wml_content_type("text/vnd.wap.wml"));
        assert!(is_supported_wml_content_type("application/vnd.wap.wml+xml"));
        assert!(!is_supported_wml_content_type("application/json"));
    }

    #[test]
    fn transport_fetch_invalid_method_maps_invalid_request() {
        let response = fetch_deck_in_process(FetchDeckRequest {
            method: Some("POST".to_string()),
            request_id: Some("req-invalid-method".to_string()),
            ..basic_request("http://example.test".to_string())
        });
        assert!(!response.ok);
        assert_eq!(response.status, 0);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-invalid-method")
        );
    }

    #[test]
    fn transport_fetch_invalid_url_maps_invalid_request() {
        let response = fetch_deck_in_process(FetchDeckRequest {
            request_id: Some("req-invalid-url".to_string()),
            ..basic_request("example.test/no-scheme".to_string())
        });
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST")
        );
        assert_eq!(
            response.error.as_ref().map(|err| err.message.as_str()),
            Some("URL must include a scheme")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-invalid-url")
        );
    }

    #[test]
    fn transport_fetch_rejects_url_longer_than_1024_octets() {
        let long_path = "a".repeat(MAX_URI_OCTETS + 1);
        let long_url = format!("http://example.test/{long_path}");
        let response = fetch_deck_in_process(FetchDeckRequest {
            request_id: Some("req-uri-too-long".to_string()),
            ..basic_request(long_url.clone())
        });
        assert!(!response.ok);
        assert_eq!(response.status, 0);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST")
        );
        assert_eq!(response.final_url, long_url);
        assert!(response
            .error
            .as_ref()
            .map(|err| err.message.contains("1024-octet limit"))
            .unwrap_or(false));
    }

    #[test]
    fn transport_fetch_accepts_url_at_1024_octet_boundary() {
        let prefix = "http://example.test/";
        let fill = "a".repeat(MAX_URI_OCTETS - prefix.len());
        let url = format!("{prefix}{fill}");
        assert_eq!(url.len(), MAX_URI_OCTETS);
        let response = fetch_deck_in_process(FetchDeckRequest {
            request_id: Some("req-uri-limit".to_string()),
            ..basic_request(url)
        });
        assert_ne!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST"),
            "1024-octet URL should not fail local URI-length validation"
        );
    }

    #[test]
    fn transport_map_success_payload_http_success_builds_engine_deck_input() {
        let base = "http://example.test/index.wml".to_string();
        let body = b"<wml><card id=\"home\"><p>ok</p></card></wml>";
        let response = map_success_payload_response(
            200,
            false,
            &base,
            &base,
            base.clone(),
            "text/vnd.wap.wml".to_string(),
            body,
            1,
            3.5,
            None,
        );
        assert!(response.ok);
        assert_eq!(response.status, 200);
        assert_eq!(response.content_type, "text/vnd.wap.wml");
        assert!(response.engine_deck_input.is_some());
        let deck = response
            .engine_deck_input
            .as_ref()
            .expect("engine deck input should be present");
        assert_eq!(deck.base_url, "http://example.test/index.wml");
        assert_eq!(deck.content_type, response.content_type);
        assert_eq!(
            response.wml.as_deref(),
            Some(deck.wml_xml.as_str()),
            "wml and engineDeckInput.wmlXml should be identical"
        );
        assert_eq!(
            deck.raw_bytes_base64.as_deref(),
            Some(BASE64.encode(body).as_str()),
            "raw bytes should preserve original payload bytes as base64"
        );
    }

    #[test]
    fn transport_map_success_payload_rejects_oversized_body() {
        let base = "http://example.test/index.wml".to_string();
        let body = vec![b'a'; MAX_RESPONSE_BODY_BYTES + 1];
        let response = map_success_payload_response(
            200,
            false,
            &base,
            &base,
            base.clone(),
            "text/vnd.wap.wml".to_string(),
            body.as_slice(),
            1,
            3.5,
            Some("req-oversized-body"),
        );

        assert!(!response.ok);
        assert_eq!(response.status, 200);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("PROTOCOL_ERROR")
        );
        assert!(response
            .error
            .as_ref()
            .map(|err| err.message.contains("Payload exceeds"))
            .unwrap_or(false));
        assert!(response.engine_deck_input.is_none());
    }

    #[test]
    fn transport_map_success_payload_accepts_body_at_limit() {
        let base = "http://example.test/index.wml".to_string();
        let body = vec![b'a'; MAX_RESPONSE_BODY_BYTES];
        let response = map_success_payload_response(
            200,
            false,
            &base,
            &base,
            base.clone(),
            "text/vnd.wap.wml".to_string(),
            body.as_slice(),
            1,
            3.5,
            Some("req-body-at-limit"),
        );

        assert!(response.ok, "body at hard limit should map successfully");
        assert_eq!(response.status, 200);
        assert!(response.error.is_none());
        assert!(response.engine_deck_input.is_some());
        let deck = response
            .engine_deck_input
            .expect("engine deck input should be present at boundary");
        assert_eq!(deck.wml_xml.len(), MAX_RESPONSE_BODY_BYTES);
        assert_eq!(
            deck.raw_bytes_base64.as_deref(),
            Some(BASE64.encode(body).as_str())
        );
    }

    #[test]
    fn transport_map_success_payload_utf16le_textual_wml_maps_ok() {
        let base = "http://example.test/index.wml".to_string();
        let utf16le_body: Vec<u8> = vec![
            0xFF, 0xFE, b'<', 0x00, b'w', 0x00, b'm', 0x00, b'l', 0x00, b'>', 0x00, b'<', 0x00,
            b'/', 0x00, b'w', 0x00, b'm', 0x00, b'l', 0x00, b'>', 0x00,
        ];
        let response = map_success_payload_response(
            200,
            false,
            &base,
            &base,
            base.clone(),
            "text/vnd.wap.wml".to_string(),
            &utf16le_body,
            1,
            3.5,
            None,
        );
        assert!(response.ok);
        assert_eq!(response.wml.as_deref(), Some("<wml></wml>"));
    }

    #[test]
    fn transport_map_success_payload_utf16_odd_length_maps_protocol_error() {
        let base = "http://example.test/index.wml".to_string();
        let invalid_utf16_body: Vec<u8> = vec![0xFF, 0xFE, b'<', 0x00, b'w'];
        let response = map_success_payload_response(
            200,
            false,
            &base,
            &base,
            base.clone(),
            "text/vnd.wap.wml".to_string(),
            &invalid_utf16_body,
            1,
            3.5,
            Some("req-utf16-invalid"),
        );
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("PROTOCOL_ERROR")
        );
        assert_eq!(
            response.error.as_ref().map(|err| err.message.as_str()),
            Some("Invalid UTF-16 payload: odd byte length")
        );
    }

    #[test]
    fn transport_map_success_payload_http_error_maps_protocol_error() {
        let response = map_success_payload_response(
            502,
            false,
            "http://request.example",
            "http://upstream.example",
            "http://request.example".to_string(),
            "text/plain".to_string(),
            b"upstream fail",
            2,
            9.1,
            Some("req-protocol"),
        );
        assert!(!response.ok);
        assert_eq!(response.status, 502);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("PROTOCOL_ERROR")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-protocol")
        );
    }

    #[test]
    fn transport_map_success_payload_unsupported_content_type_maps_error() {
        let response = map_success_payload_response(
            200,
            false,
            "http://request.example",
            "http://upstream.example",
            "http://request.example".to_string(),
            "application/json".to_string(),
            br#"{"ok":true}"#,
            1,
            2.0,
            Some("req-content"),
        );
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("UNSUPPORTED_CONTENT_TYPE")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-content")
        );
    }

    #[test]
    fn transport_fixture_mapped_unsupported_content_type() {
        let input: FixtureMapInput =
            read_json_fixture("unsupported_content_type_mapped", "map_input.json");
        let expected: FixtureExpected =
            read_json_fixture("unsupported_content_type_mapped", "expected.json");
        let body = input.body_bytes();
        let response = map_success_payload_response(
            input.status,
            input.is_wap_scheme,
            &input.request_url,
            &input.upstream_url,
            input.final_url,
            input.content_type,
            &body,
            input.attempt,
            input.elapsed_ms,
            None,
        );
        assert_eq!(response.ok, expected.ok);
        assert_eq!(response.status, expected.status);
        assert_eq!(response.final_url, expected.final_url);
        assert_eq!(response.content_type, expected.content_type);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            expected.error_code.as_deref()
        );
        if let Some(expected_wml) = expected.wml.as_deref() {
            assert_eq!(response.wml.as_deref(), Some(expected_wml));
        }
    }

    #[test]
    fn transport_map_success_payload_wmlc_decode_failure_maps_error() {
        let response = with_env_var_locked("WBXML2XML_BIN", "__missing_decoder__", || {
            map_success_payload_response(
                200,
                false,
                "http://request.example",
                "http://upstream.example",
                "http://request.example".to_string(),
                "application/vnd.wap.wmlc".to_string(),
                b"\x03\x01\x6a\x00",
                1,
                2.0,
                Some("req-wbxml"),
            )
        });
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("WBXML_DECODE_FAILED")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-wbxml")
        );
    }

    #[test]
    #[cfg(unix)]
    fn transport_map_success_payload_wmlc_decode_success_maps_ok() {
        let script = write_fake_decoder_script("<wml><card id=\"d\"/></wml>");
        let body = b"\x03\x01\x6a\x00";
        let response = with_two_env_vars_locked(
            "LOWBAND_DISABLE_LIBWBXML",
            "1",
            "WBXML2XML_BIN",
            script.to_string_lossy().as_ref(),
            || {
                map_success_payload_response(
                    200,
                    false,
                    "http://request.example",
                    "http://upstream.example",
                    "http://request.example".to_string(),
                    "application/vnd.wap.wmlc".to_string(),
                    body,
                    1,
                    2.0,
                    None,
                )
            },
        );
        assert!(response.ok);
        assert_eq!(response.status, 200);
        let deck = response
            .engine_deck_input
            .as_ref()
            .expect("engine deck input should be present");
        assert_eq!(deck.base_url, "http://request.example");
        assert_eq!(deck.content_type, "application/vnd.wap.wmlc");
        assert_eq!(
            response.wml.as_deref(),
            Some(deck.wml_xml.as_str()),
            "decoded wml should be mirrored into engineDeckInput.wmlXml"
        );
        assert_eq!(
            deck.raw_bytes_base64.as_deref(),
            Some(BASE64.encode(body).as_str()),
            "decoded success should preserve original wbxml bytes"
        );
    }

    #[test]
    fn transport_map_success_payload_wap_protocol_error_uses_original_url() {
        let response = map_success_payload_response(
            500,
            true,
            "wap://example.test/start.wml",
            "http://gateway.local/start.wml",
            "wap://example.test/start.wml".to_string(),
            "text/plain".to_string(),
            b"bad gateway",
            1,
            4.0,
            None,
        );
        assert!(!response.ok);
        assert_eq!(response.final_url, "wap://example.test/start.wml");
    }

    #[test]
    fn transport_fixture_mapped_protocol_error_5xx() {
        let input: FixtureMapInput =
            read_json_fixture("protocol_error_5xx_mapped", "map_input.json");
        let expected: FixtureExpected =
            read_json_fixture("protocol_error_5xx_mapped", "expected.json");
        let body = input.body_bytes();
        let response = map_success_payload_response(
            input.status,
            input.is_wap_scheme,
            &input.request_url,
            &input.upstream_url,
            input.final_url,
            input.content_type,
            &body,
            input.attempt,
            input.elapsed_ms,
            None,
        );
        assert_eq!(response.ok, expected.ok);
        assert_eq!(response.status, expected.status);
        assert_eq!(response.final_url, expected.final_url);
        assert_eq!(response.content_type, expected.content_type);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            expected.error_code.as_deref()
        );
        if let Some(expected_wml) = expected.wml.as_deref() {
            assert_eq!(response.wml.as_deref(), Some(expected_wml));
        }
    }

    #[test]
    fn transport_fixture_mapped_utf16le_textual_wml_ok() {
        let input: FixtureMapInput =
            read_json_fixture("utf16le_textual_wml_mapped", "map_input.json");
        let expected: FixtureExpected =
            read_json_fixture("utf16le_textual_wml_mapped", "expected.json");
        let body = input.body_bytes();
        let response = map_success_payload_response(
            input.status,
            input.is_wap_scheme,
            &input.request_url,
            &input.upstream_url,
            input.final_url,
            input.content_type,
            &body,
            input.attempt,
            input.elapsed_ms,
            None,
        );
        assert_eq!(response.ok, expected.ok);
        assert_eq!(response.status, expected.status);
        assert_eq!(response.final_url, expected.final_url);
        assert_eq!(response.content_type, expected.content_type);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            expected.error_code.as_deref()
        );
        if let Some(expected_wml) = expected.wml.as_deref() {
            assert_eq!(response.wml.as_deref(), Some(expected_wml));
        }
    }

    #[test]
    fn transport_fixture_mapped_utf16_odd_length_protocol_error() {
        let input: FixtureMapInput =
            read_json_fixture("utf16_odd_length_protocol_error_mapped", "map_input.json");
        let expected: FixtureExpected =
            read_json_fixture("utf16_odd_length_protocol_error_mapped", "expected.json");
        let body = input.body_bytes();
        let response = map_success_payload_response(
            input.status,
            input.is_wap_scheme,
            &input.request_url,
            &input.upstream_url,
            input.final_url,
            input.content_type,
            &body,
            input.attempt,
            input.elapsed_ms,
            None,
        );
        assert_eq!(response.ok, expected.ok);
        assert_eq!(response.status, expected.status);
        assert_eq!(response.final_url, expected.final_url);
        assert_eq!(response.content_type, expected.content_type);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            expected.error_code.as_deref()
        );
        if let Some(expected_wml) = expected.wml.as_deref() {
            assert_eq!(response.wml.as_deref(), Some(expected_wml));
        }
    }

    #[test]
    fn transport_map_terminal_send_error_maps_timeout_code() {
        let response = map_terminal_send_error(
            "http://example.test".to_string(),
            "timed out".to_string(),
            3,
            3,
            true,
            123.0,
            Some("req-timeout"),
        );
        assert!(!response.ok);
        assert_eq!(response.status, 0);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("GATEWAY_TIMEOUT")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-timeout")
        );
    }

    #[test]
    fn transport_map_terminal_send_error_maps_transport_unavailable_code() {
        let response = map_terminal_send_error(
            "http://example.test".to_string(),
            "connection refused".to_string(),
            2,
            2,
            false,
            10.0,
            Some("req-unavailable"),
        );
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("TRANSPORT_UNAVAILABLE")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-unavailable")
        );
    }

    #[test]
    fn transport_fetch_wap_invalid_gateway_base_maps_transport_unavailable() {
        let response = with_env_var_locked("GATEWAY_HTTP_BASE", "not-a-url", || {
            fetch_deck_in_process(basic_request("wap://example.test/home.wml".to_string()))
        });
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("TRANSPORT_UNAVAILABLE")
        );
    }

    #[test]
    fn transport_fetch_http_unreachable_returns_terminal_transport_error() {
        let response = fetch_deck_in_process(FetchDeckRequest {
            retries: Some(2),
            timeout_ms: Some(100),
            request_id: Some("req-retry-http".to_string()),
            request_policy: Some(request_policy_with_destination(
                FetchDestinationPolicy::AllowPrivate,
            )),
            ..basic_request("http://127.0.0.1:9/unreachable.wml".to_string())
        });
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("TRANSPORT_UNAVAILABLE")
        );
        let attempts = response
            .error
            .as_ref()
            .and_then(|err| err.details.as_ref())
            .and_then(|details| details.get("attempts"))
            .and_then(|value| value.as_u64());
        assert_eq!(attempts, Some(3));
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-retry-http")
        );
    }

    #[test]
    fn transport_fetch_wap_with_valid_gateway_base_keeps_final_url_on_terminal_error() {
        let response = with_env_var_locked("GATEWAY_HTTP_BASE", "http://127.0.0.1:9", || {
            fetch_deck_in_process(FetchDeckRequest {
                retries: Some(0),
                timeout_ms: Some(100),
                request_id: Some("req-retry-wap".to_string()),
                request_policy: Some(request_policy_with_destination(
                    FetchDestinationPolicy::AllowPrivate,
                )),
                ..basic_request("wap://example.test/path.wml?x=1".to_string())
            })
        });
        assert!(!response.ok);
        assert_eq!(response.final_url, "wap://example.test/path.wml?x=1");
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("TRANSPORT_UNAVAILABLE")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-retry-wap")
        );
    }

    #[test]
    fn transport_destination_policy_defaults_to_public_only() {
        let resolved = resolve_fetch_destination_policy(None);
        assert_eq!(resolved, FetchDestinationPolicy::PublicOnly);
    }

    #[test]
    fn transport_destination_policy_rejects_loopback_without_override() {
        let parsed = Url::parse("http://127.0.0.1:8080/deck.wml").expect("url should parse");
        let err = validate_fetch_destination(&parsed, &FetchDestinationPolicy::PublicOnly)
            .expect_err("loopback destination should be blocked");
        assert!(err.contains("public-only"));
        assert!(err.contains("loopback"));
    }

    #[test]
    fn transport_destination_policy_rejects_private_without_override() {
        let parsed = Url::parse("http://10.0.0.8/deck.wml").expect("url should parse");
        let err = validate_fetch_destination(&parsed, &FetchDestinationPolicy::PublicOnly)
            .expect_err("private destination should be blocked");
        assert!(err.contains("private"));
    }

    #[test]
    fn transport_destination_policy_allows_private_with_override() {
        let parsed = Url::parse("http://10.0.0.8/deck.wml").expect("url should parse");
        validate_fetch_destination(&parsed, &FetchDestinationPolicy::AllowPrivate)
            .expect("allow-private should permit private targets");
    }

    #[test]
    fn transport_destination_policy_rejects_unsupported_scheme() {
        let parsed = Url::parse("ftp://example.test/deck.wml").expect("url should parse");
        let err = validate_fetch_destination(&parsed, &FetchDestinationPolicy::PublicOnly)
            .expect_err("unsupported scheme should be rejected");
        assert!(err.contains("Unsupported URL scheme"));
    }

    #[test]
    fn transport_destination_policy_rejects_localhost_domains_without_override() {
        let parsed = Url::parse("http://api.localhost/deck.wml").expect("url should parse");
        let err = validate_fetch_destination(&parsed, &FetchDestinationPolicy::PublicOnly)
            .expect_err("localhost domain should be blocked");
        assert!(err.contains("loopback"));
    }

    #[test]
    fn transport_classify_destination_host_returns_none_when_host_missing() {
        let parsed = Url::parse("mailto:ops@example.test").expect("url should parse");
        assert_eq!(classify_destination_host(&parsed), None);
    }

    #[test]
    fn transport_classify_destination_host_classifies_domain_and_ipv6() {
        let parsed_public = Url::parse("https://example.test/deck.wml").expect("url should parse");
        assert_eq!(
            classify_destination_host(&parsed_public),
            Some(DestinationHostClass::Public)
        );

        let parsed_loopback = Url::parse("https://[::1]/deck.wml").expect("ipv6 url should parse");
        assert_eq!(
            classify_destination_host(&parsed_loopback),
            Some(DestinationHostClass::Loopback)
        );
    }

    #[test]
    fn transport_classify_ip_covers_blocked_destination_classes() {
        assert_eq!(
            classify_ip(IpAddr::V4(Ipv4Addr::UNSPECIFIED)),
            DestinationHostClass::Unspecified
        );
        assert_eq!(
            classify_ip(IpAddr::V4(Ipv4Addr::new(169, 254, 10, 10))),
            DestinationHostClass::LinkLocal
        );
        assert_eq!(
            classify_ip(IpAddr::V4(Ipv4Addr::new(224, 0, 0, 1))),
            DestinationHostClass::Multicast
        );
        assert_eq!(
            classify_ip(IpAddr::V6(Ipv6Addr::UNSPECIFIED)),
            DestinationHostClass::Unspecified
        );
        assert_eq!(
            classify_ip(IpAddr::V6(Ipv6Addr::new(0xfe80, 0, 0, 0, 0, 0, 0, 1))),
            DestinationHostClass::LinkLocal
        );
        assert_eq!(
            classify_ip(IpAddr::V6(Ipv6Addr::new(0xff02, 0, 0, 0, 0, 0, 0, 1))),
            DestinationHostClass::Multicast
        );
    }

    #[test]
    fn transport_fetch_blocks_loopback_when_policy_not_overridden() {
        let response = fetch_deck_in_process(FetchDeckRequest {
            request_id: Some("req-loopback-blocked".to_string()),
            ..basic_request("http://127.0.0.1:9/unreachable.wml".to_string())
        });
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST")
        );
        let message = response
            .error
            .as_ref()
            .map(|error| error.message.clone())
            .unwrap_or_default();
        assert!(message.contains("public-only"));
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-loopback-blocked")
        );
    }

    #[test]
    fn transport_invalid_request_response_helper() {
        let response = invalid_request_response(
            "http://example.test".to_string(),
            "bad input".to_string(),
            Some("req-helper"),
        );
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-helper")
        );
    }

    #[test]
    fn transport_payload_too_large_response_with_known_actual_bytes() {
        let response = payload_too_large_response(
            200,
            "http://example.test/deck.wml".to_string(),
            "text/vnd.wap.wml".to_string(),
            512 * 1024,
            Some(700_000),
            1,
            5.0,
            Some("req-too-large"),
        );
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|error| error.code.as_str()),
            Some("PROTOCOL_ERROR")
        );
        let message = response
            .error
            .as_ref()
            .map(|error| error.message.as_str())
            .unwrap_or_default();
        assert!(message.contains("got 700000 bytes"));
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-too-large")
        );
    }

    #[test]
    fn transport_payload_too_large_response_without_actual_bytes() {
        let response = payload_too_large_response(
            200,
            "http://example.test/deck.wml".to_string(),
            "text/vnd.wap.wml".to_string(),
            512 * 1024,
            None,
            2,
            9.0,
            None,
        );
        assert!(!response.ok);
        let message = response
            .error
            .as_ref()
            .map(|error| error.message.as_str())
            .unwrap_or_default();
        assert_eq!(message, "Payload exceeds 524288-byte limit");
    }

    #[test]
    fn transport_error_code_trigger_matrix_is_deterministic() {
        struct Case {
            name: &'static str,
            response: super::FetchDeckResponse,
            expected_code: &'static str,
        }

        let cases = vec![
            Case {
                name: "invalid-request-method",
                response: invalid_request_response(
                    "http://example.test".to_string(),
                    "Unsupported method: POST".to_string(),
                    None,
                ),
                expected_code: "INVALID_REQUEST",
            },
            Case {
                name: "protocol-error-5xx",
                response: map_success_payload_response(
                    502,
                    false,
                    "http://request.example",
                    "http://upstream.example",
                    "http://request.example".to_string(),
                    "text/plain".to_string(),
                    b"upstream fail",
                    1,
                    1.0,
                    None,
                ),
                expected_code: "PROTOCOL_ERROR",
            },
            Case {
                name: "unsupported-content-type",
                response: map_success_payload_response(
                    200,
                    false,
                    "http://request.example",
                    "http://upstream.example",
                    "http://request.example".to_string(),
                    "application/json".to_string(),
                    br#"{"ok":true}"#,
                    1,
                    1.0,
                    None,
                ),
                expected_code: "UNSUPPORTED_CONTENT_TYPE",
            },
            Case {
                name: "terminal-timeout",
                response: map_terminal_send_error(
                    "http://example.test".to_string(),
                    "timeout".to_string(),
                    2,
                    2,
                    true,
                    5.0,
                    None,
                ),
                expected_code: "GATEWAY_TIMEOUT",
            },
            Case {
                name: "terminal-transport-unavailable",
                response: map_terminal_send_error(
                    "http://example.test".to_string(),
                    "connection refused".to_string(),
                    2,
                    2,
                    false,
                    5.0,
                    None,
                ),
                expected_code: "TRANSPORT_UNAVAILABLE",
            },
        ];

        for case in cases {
            let code = case
                .response
                .error
                .as_ref()
                .map(|err| err.code.as_str())
                .unwrap_or("<missing>");
            assert_eq!(code, case.expected_code, "case '{}' failed", case.name);
        }
    }
}
