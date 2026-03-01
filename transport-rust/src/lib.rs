use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::process::Command;
use std::time::{Duration, Instant};
use tempfile::tempdir;
use url::Url;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchDeckRequest {
    pub url: String,
    pub method: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    pub timeout_ms: Option<u64>,
    pub retries: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchTiming {
    pub encode: f64,
    pub udp_rtt: f64,
    pub decode: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchErrorInfo {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineDeckInputPayload {
    pub wml_xml: String,
    pub base_url: String,
    pub content_type: String,
    pub raw_bytes_base64: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchDeckResponse {
    pub ok: bool,
    pub status: u16,
    pub final_url: String,
    pub content_type: String,
    pub wml: Option<String>,
    pub error: Option<FetchErrorInfo>,
    pub timing_ms: FetchTiming,
    pub engine_deck_input: Option<EngineDeckInputPayload>,
}

fn transport_unavailable_response(url: String, message: String) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status: 0,
        final_url: url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(FetchErrorInfo {
            code: "TRANSPORT_UNAVAILABLE".to_string(),
            message,
            details: None,
        }),
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: 0.0,
            decode: 0.0,
        },
        engine_deck_input: None,
    }
}

fn invalid_request_response(url: String, message: String) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status: 0,
        final_url: url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(FetchErrorInfo {
            code: "INVALID_REQUEST".to_string(),
            message,
            details: None,
        }),
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: 0.0,
            decode: 0.0,
        },
        engine_deck_input: None,
    }
}

fn normalize_content_type(content_type: Option<&str>) -> String {
    content_type
        .and_then(|value| value.split(';').next())
        .map(|value| value.trim().to_ascii_lowercase())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "application/octet-stream".to_string())
}

fn is_supported_wml_content_type(content_type: &str) -> bool {
    matches!(
        content_type,
        "text/vnd.wap.wml"
            | "application/vnd.wap.wml+xml"
            | "text/xml"
            | "application/xml"
            | "text/plain"
    )
}

fn wbxml2xml_bin() -> String {
    env::var("WBXML2XML_BIN").unwrap_or_else(|_| "wbxml2xml".to_string())
}

fn decode_wmlc_with_tool(payload: &[u8], tool: &str) -> Result<String, String> {
    if payload.is_empty() {
        return Err("WBXML decode failed: empty payload".to_string());
    }

    let tmp_dir = tempdir().map_err(|err| format!("WBXML decode failed: temp dir: {err}"))?;
    let input_path = tmp_dir.path().join("input.wmlc");
    let output_path = tmp_dir.path().join("output.xml");
    fs::write(&input_path, payload)
        .map_err(|err| format!("WBXML decode failed: write input: {err}"))?;

    let proc = Command::new(tool)
        .arg("-o")
        .arg(&output_path)
        .arg(&input_path)
        .output()
        .map_err(|_| {
            format!("WBXML decoder tool not available: {tool}. Install libwbxml/wbxml2xml.")
        })?;
    if !proc.status.success() {
        let stderr = String::from_utf8_lossy(&proc.stderr);
        let first = stderr
            .lines()
            .next()
            .unwrap_or("decoder returned non-zero status");
        return Err(format!("WBXML decode failed: {first}"));
    }

    let xml = fs::read_to_string(&output_path)
        .map_err(|err| format!("WBXML decode failed: read output: {err}"))?;
    let trimmed = xml.trim().to_string();
    if trimmed.is_empty() {
        return Err("WBXML decode failed: decoder returned empty output".to_string());
    }
    Ok(trimmed)
}

fn decode_wmlc(payload: &[u8]) -> Result<String, String> {
    decode_wmlc_with_tool(payload, &wbxml2xml_bin())
}

fn gateway_http_base() -> String {
    env::var("GATEWAY_HTTP_BASE").unwrap_or_else(|_| "http://127.0.0.1:13002".to_string())
}

fn build_gateway_request(
    original_url: &str,
    method: &str,
    headers: &HashMap<String, String>,
) -> Result<(String, HashMap<String, String>), String> {
    let parsed = Url::parse(original_url).map_err(|err| format!("invalid wap url: {err}"))?;
    if !matches!(parsed.scheme(), "wap" | "waps") {
        return Err(format!(
            "unsupported scheme for gateway bridge: {}",
            parsed.scheme()
        ));
    }
    if method != "GET" {
        return Err(format!(
            "WSP envelope only supports GET for MVP, got: {method}"
        ));
    }

    let base = Url::parse(&gateway_http_base())
        .map_err(|_| "GATEWAY_HTTP_BASE must be an absolute http(s) URL".to_string())?;
    if !matches!(base.scheme(), "http" | "https") || base.host_str().is_none() {
        return Err("GATEWAY_HTTP_BASE must be an absolute http(s) URL".to_string());
    }

    let mut request_url = base;
    request_url.set_path(parsed.path());
    request_url.set_query(parsed.query());

    let mut merged_headers = headers.clone();
    if let Some(host) = parsed.host_str() {
        let host_value = if let Some(port) = parsed.port() {
            format!("{host}:{port}")
        } else {
            host.to_string()
        };
        merged_headers
            .entry("Host".to_string())
            .or_insert(host_value);
    }
    merged_headers
        .entry("X-Wap-Target-Url".to_string())
        .or_insert_with(|| original_url.to_string());

    Ok((request_url.to_string(), merged_headers))
}

fn map_success_payload_response(
    status: u16,
    is_wap_scheme: bool,
    request_url: &str,
    upstream_url: &str,
    final_url: String,
    content_type: String,
    body: &[u8],
    attempt: u8,
    elapsed_ms: f64,
) -> FetchDeckResponse {
    if status >= 400 {
        return FetchDeckResponse {
            ok: false,
            status,
            final_url: if is_wap_scheme {
                request_url.to_string()
            } else {
                upstream_url.to_string()
            },
            content_type: "text/plain".to_string(),
            wml: None,
            error: Some(FetchErrorInfo {
                code: "PROTOCOL_ERROR".to_string(),
                message: format!("Upstream HTTP error: {status}"),
                details: Some(serde_json::json!({
                    "body": String::from_utf8_lossy(body).chars().take(300).collect::<String>(),
                    "attempt": attempt
                })),
            }),
            timing_ms: FetchTiming {
                encode: 0.0,
                udp_rtt: elapsed_ms,
                decode: 0.0,
            },
            engine_deck_input: None,
        };
    }

    let raw_b64 = BASE64.encode(body);
    if content_type == "application/vnd.wap.wmlc" {
        let decode_start = Instant::now();
        return match decode_wmlc(body) {
            Ok(wml) => FetchDeckResponse {
                ok: true,
                status,
                final_url: final_url.clone(),
                content_type: content_type.clone(),
                wml: Some(wml.clone()),
                error: None,
                timing_ms: FetchTiming {
                    encode: 0.0,
                    udp_rtt: elapsed_ms,
                    decode: decode_start.elapsed().as_secs_f64() * 1000.0,
                },
                engine_deck_input: Some(EngineDeckInputPayload {
                    wml_xml: wml,
                    base_url: final_url,
                    content_type,
                    raw_bytes_base64: Some(raw_b64),
                }),
            },
            Err(err) => FetchDeckResponse {
                ok: false,
                status,
                final_url,
                content_type,
                wml: None,
                error: Some(FetchErrorInfo {
                    code: "WBXML_DECODE_FAILED".to_string(),
                    message: err,
                    details: Some(serde_json::json!({ "attempt": attempt })),
                }),
                timing_ms: FetchTiming {
                    encode: 0.0,
                    udp_rtt: elapsed_ms,
                    decode: 0.0,
                },
                engine_deck_input: None,
            },
        };
    }

    if !is_supported_wml_content_type(&content_type) {
        return FetchDeckResponse {
            ok: false,
            status,
            final_url,
            content_type: content_type.clone(),
            wml: None,
            error: Some(FetchErrorInfo {
                code: "UNSUPPORTED_CONTENT_TYPE".to_string(),
                message: format!("Unsupported content type: {content_type}"),
                details: Some(serde_json::json!({ "attempt": attempt })),
            }),
            timing_ms: FetchTiming {
                encode: 0.0,
                udp_rtt: elapsed_ms,
                decode: 0.0,
            },
            engine_deck_input: None,
        };
    }

    let wml = String::from_utf8_lossy(body).to_string();
    FetchDeckResponse {
        ok: true,
        status,
        final_url: final_url.clone(),
        content_type: content_type.clone(),
        wml: Some(wml.clone()),
        error: None,
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: elapsed_ms,
            decode: 0.0,
        },
        engine_deck_input: Some(EngineDeckInputPayload {
            wml_xml: wml,
            base_url: final_url,
            content_type,
            raw_bytes_base64: Some(raw_b64),
        }),
    }
}

fn map_terminal_send_error(
    request_url: String,
    last_error: String,
    attempts: u8,
    attempt: u8,
    is_timeout: bool,
    elapsed_ms: f64,
) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status: 0,
        final_url: request_url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(FetchErrorInfo {
            code: if is_timeout {
                "GATEWAY_TIMEOUT".to_string()
            } else {
                "TRANSPORT_UNAVAILABLE".to_string()
            },
            message: last_error,
            details: Some(serde_json::json!({
                "attempts": attempts,
                "lastAttempt": attempt
            })),
        }),
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: elapsed_ms,
            decode: 0.0,
        },
        engine_deck_input: None,
    }
}

pub fn fetch_deck_in_process(request: FetchDeckRequest) -> FetchDeckResponse {
    let method = request
        .method
        .unwrap_or_else(|| "GET".to_string())
        .to_ascii_uppercase();
    if method != "GET" {
        return invalid_request_response(request.url, format!("Unsupported method: {method}"));
    }

    let parsed = match Url::parse(&request.url) {
        Ok(parsed) => parsed,
        Err(_) => {
            return invalid_request_response(request.url, "URL must include a scheme".to_string());
        }
    };

    let is_wap_scheme = matches!(parsed.scheme(), "wap" | "waps");
    let mut upstream_url = request.url.clone();
    let mut outbound_headers = request.headers.unwrap_or_default();

    if is_wap_scheme {
        match build_gateway_request(&request.url, &method, &outbound_headers) {
            Ok((gateway_url, headers)) => {
                upstream_url = gateway_url;
                outbound_headers = headers;
            }
            Err(err) => return transport_unavailable_response(request.url, err),
        }
    }

    let timeout_ms = request.timeout_ms.unwrap_or(5000).clamp(100, 30000);
    let request_url = request.url.clone();
    let attempts = request.retries.unwrap_or(1).clamp(0, 2) + 1;
    let client = match Client::builder()
        .timeout(Duration::from_millis(timeout_ms))
        .build()
    {
        Ok(client) => client,
        Err(err) => return transport_unavailable_response(request_url, err.to_string()),
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
            Ok(resp) => {
                let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
                let status = resp.status().as_u16();
                let final_url = if is_wap_scheme {
                    request.url.clone()
                } else {
                    resp.url().to_string()
                };
                let content_type = normalize_content_type(
                    resp.headers()
                        .get("content-type")
                        .and_then(|v| v.to_str().ok()),
                );
                let body = match resp.bytes() {
                    Ok(body) => body,
                    Err(err) => {
                        return transport_unavailable_response(
                            request_url.clone(),
                            format!("transport read failed: {err}"),
                        );
                    }
                };
                return map_success_payload_response(
                    status,
                    is_wap_scheme,
                    &request.url,
                    &upstream_url,
                    final_url,
                    content_type,
                    body.as_ref(),
                    attempt,
                    elapsed_ms,
                );
            }
            Err(err) => {
                last_error = err.to_string();
                last_is_timeout = err.is_timeout();
                last_elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
            }
        }
    }

    map_terminal_send_error(
        request.url,
        last_error,
        attempts,
        attempts,
        last_is_timeout,
        last_elapsed_ms,
    )
}

#[cfg(test)]
mod tests {
    use super::{
        build_gateway_request, decode_wmlc_with_tool, fetch_deck_in_process,
        invalid_request_response, is_supported_wml_content_type, map_success_payload_response,
        map_terminal_send_error, normalize_content_type, FetchDeckRequest,
    };
    use std::collections::HashMap;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::{Mutex, OnceLock};

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
        }
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
    fn transport_build_gateway_request_maps_wap_url_and_headers() {
        let headers = HashMap::new();
        let result = build_gateway_request("wap://example.test/home.wml?x=1", "GET", &headers)
            .expect("gateway mapping should succeed");
        let (gateway_url, mapped_headers) = result;
        assert_eq!(gateway_url, "http://127.0.0.1:13002/home.wml?x=1");
        assert_eq!(
            mapped_headers.get("Host"),
            Some(&"example.test".to_string())
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
        assert_eq!(gateway_url, "http://127.0.0.1:13002/");
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
    fn transport_build_gateway_request_includes_target_port_in_host_header() {
        let headers = HashMap::new();
        let (_, mapped_headers) =
            build_gateway_request("wap://example.test:9200/home.wml", "GET", &headers)
                .expect("gateway mapping with explicit target port should succeed");
        assert_eq!(
            mapped_headers.get("Host").map(String::as_str),
            Some("example.test:9200")
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
    fn transport_supported_content_type_matrix() {
        assert!(is_supported_wml_content_type("text/vnd.wap.wml"));
        assert!(is_supported_wml_content_type("application/vnd.wap.wml+xml"));
        assert!(!is_supported_wml_content_type("application/json"));
    }

    #[test]
    fn transport_fetch_invalid_method_maps_invalid_request() {
        let response = fetch_deck_in_process(FetchDeckRequest {
            method: Some("POST".to_string()),
            ..basic_request("http://example.test".to_string())
        });
        assert!(!response.ok);
        assert_eq!(response.status, 0);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST")
        );
    }

    #[test]
    fn transport_fetch_invalid_url_maps_invalid_request() {
        let response = fetch_deck_in_process(basic_request("example.test/no-scheme".to_string()));
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST")
        );
        assert_eq!(
            response.error.as_ref().map(|err| err.message.as_str()),
            Some("URL must include a scheme")
        );
    }

    #[test]
    fn transport_map_success_payload_http_success_builds_engine_deck_input() {
        let base = "http://example.test/index.wml".to_string();
        let response = map_success_payload_response(
            200,
            false,
            &base,
            &base,
            base.clone(),
            "text/vnd.wap.wml".to_string(),
            b"<wml><card id=\"home\"><p>ok</p></card></wml>",
            1,
            3.5,
        );
        assert!(response.ok);
        assert_eq!(response.status, 200);
        assert_eq!(response.content_type, "text/vnd.wap.wml");
        assert!(response.engine_deck_input.is_some());
        assert_eq!(
            response
                .engine_deck_input
                .as_ref()
                .map(|deck| deck.base_url.as_str()),
            Some("http://example.test/index.wml")
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
        );
        assert!(!response.ok);
        assert_eq!(response.status, 502);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("PROTOCOL_ERROR")
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
        );
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("UNSUPPORTED_CONTENT_TYPE")
        );
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
            )
        });
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("WBXML_DECODE_FAILED")
        );
    }

    #[test]
    #[cfg(unix)]
    fn transport_map_success_payload_wmlc_decode_success_maps_ok() {
        let script = write_fake_decoder_script("<wml><card id=\"d\"/></wml>");
        let response =
            with_env_var_locked("WBXML2XML_BIN", script.to_string_lossy().as_ref(), || {
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
                )
            });
        assert!(response.ok);
        assert_eq!(response.status, 200);
        assert_eq!(
            response
                .engine_deck_input
                .as_ref()
                .and_then(|deck| deck.raw_bytes_base64.as_ref())
                .is_some(),
            true
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
        );
        assert!(!response.ok);
        assert_eq!(response.final_url, "wap://example.test/start.wml");
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
        );
        assert!(!response.ok);
        assert_eq!(response.status, 0);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("GATEWAY_TIMEOUT")
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
        );
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("TRANSPORT_UNAVAILABLE")
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
    }

    #[test]
    fn transport_fetch_wap_with_valid_gateway_base_keeps_final_url_on_terminal_error() {
        let response = with_env_var_locked("GATEWAY_HTTP_BASE", "http://127.0.0.1:9", || {
            fetch_deck_in_process(FetchDeckRequest {
                retries: Some(0),
                timeout_ms: Some(100),
                ..basic_request("wap://example.test/path.wml?x=1".to_string())
            })
        });
        assert!(!response.ok);
        assert_eq!(response.final_url, "wap://example.test/path.wml?x=1");
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("TRANSPORT_UNAVAILABLE")
        );
    }

    #[test]
    fn transport_invalid_request_response_helper() {
        let response =
            invalid_request_response("http://example.test".to_string(), "bad input".to_string());
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|err| err.code.as_str()),
            Some("INVALID_REQUEST")
        );
    }
}
