use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use libc::c_void;
use libloading::Library;
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
    pub request_id: Option<String>,
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

fn normalized_request_id(value: Option<&str>) -> Option<&str> {
    value.and_then(|raw| {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    })
}

fn details_with_request_id(
    request_id: Option<&str>,
    details: Option<serde_json::Value>,
) -> Option<serde_json::Value> {
    let request_id = normalized_request_id(request_id)?;
    match details {
        Some(serde_json::Value::Object(mut map)) => {
            map.insert(
                "requestId".to_string(),
                serde_json::Value::String(request_id.to_string()),
            );
            Some(serde_json::Value::Object(map))
        }
        Some(other) => Some(other),
        None => Some(serde_json::json!({ "requestId": request_id })),
    }
}

fn log_transport_event(
    event: &str,
    request_id: Option<&str>,
    request_url: &str,
    payload: serde_json::Value,
) {
    let mut entry = serde_json::Map::new();
    entry.insert(
        "event".to_string(),
        serde_json::Value::String(event.to_string()),
    );
    entry.insert(
        "requestUrl".to_string(),
        serde_json::Value::String(request_url.to_string()),
    );
    if let Some(id) = normalized_request_id(request_id) {
        entry.insert(
            "requestId".to_string(),
            serde_json::Value::String(id.to_string()),
        );
    }
    entry.insert("payload".to_string(), payload);
    println!("{}", serde_json::Value::Object(entry));
}

fn transport_unavailable_response(
    url: String,
    message: String,
    request_id: Option<&str>,
) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status: 0,
        final_url: url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(FetchErrorInfo {
            code: "TRANSPORT_UNAVAILABLE".to_string(),
            message,
            details: details_with_request_id(request_id, None),
        }),
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: 0.0,
            decode: 0.0,
        },
        engine_deck_input: None,
    }
}

fn invalid_request_response(
    url: String,
    message: String,
    request_id: Option<&str>,
) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status: 0,
        final_url: url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(FetchErrorInfo {
            code: "INVALID_REQUEST".to_string(),
            message,
            details: details_with_request_id(request_id, None),
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

#[derive(Debug)]
enum LibwbxmlDecodeError {
    Unavailable(String),
    Failed(String),
}

fn libwbxml_candidates() -> &'static [&'static str] {
    #[cfg(target_os = "macos")]
    {
        &[
            "libwbxml2.dylib",
            "/opt/homebrew/lib/libwbxml2.dylib",
            "/usr/local/lib/libwbxml2.dylib",
        ]
    }
    #[cfg(target_os = "linux")]
    {
        &["libwbxml2.so.1", "libwbxml2.so"]
    }
    #[cfg(target_os = "windows")]
    {
        &["libwbxml2.dll"]
    }
}

fn libwbxml_disabled_by_env() -> bool {
    matches!(
        env::var("LOWBAND_DISABLE_LIBWBXML")
            .ok()
            .map(|value| value.to_ascii_lowercase())
            .as_deref(),
        Some("1" | "true" | "yes")
    )
}

fn libwbxml_available() -> Result<(), String> {
    if libwbxml_disabled_by_env() {
        return Err("libwbxml disabled by LOWBAND_DISABLE_LIBWBXML".to_string());
    }
    let mut last_err = String::new();
    for candidate in libwbxml_candidates() {
        // SAFETY: Loading a dynamic library by path does not invoke symbols.
        match unsafe { Library::new(candidate) } {
            Ok(lib) => {
                // SAFETY: Symbol signatures come directly from libwbxml headers.
                unsafe {
                    let create = lib
                        .get::<unsafe extern "C" fn(*mut *mut c_void) -> i32>(
                            b"wbxml_conv_wbxml2xml_create\0",
                        )
                        .map_err(|err| {
                            format!("missing wbxml_conv_wbxml2xml_create in {candidate}: {err}")
                        })?;
                    let destroy = lib
                        .get::<unsafe extern "C" fn(*mut c_void)>(b"wbxml_conv_wbxml2xml_destroy\0")
                        .map_err(|err| {
                            format!("missing wbxml_conv_wbxml2xml_destroy in {candidate}: {err}")
                        })?;
                    let mut conv: *mut c_void = std::ptr::null_mut();
                    let create_rc = create(&mut conv);
                    if create_rc != 0 || conv.is_null() {
                        return Err(format!(
                            "libwbxml converter init failed in {candidate} (code {create_rc})"
                        ));
                    }
                    destroy(conv);
                }
                return Ok(());
            }
            Err(err) => {
                last_err = format!("{candidate}: {err}");
            }
        }
    }
    Err(format!(
        "libwbxml shared library not available ({last_err})"
    ))
}

fn libwbxml_error_text(errors_string: unsafe extern "C" fn(i32) -> *const u8, code: i32) -> String {
    // SAFETY: libwbxml returns a static null-terminated error string or null.
    let ptr = unsafe { errors_string(code) };
    if ptr.is_null() {
        return format!("libwbxml error code {code}");
    }
    // SAFETY: Pointer is expected to be valid C string from libwbxml.
    unsafe { std::ffi::CStr::from_ptr(ptr as *const i8) }
        .to_string_lossy()
        .into_owned()
}

fn decode_wmlc_with_libwbxml(payload: &[u8]) -> Result<String, LibwbxmlDecodeError> {
    if libwbxml_disabled_by_env() {
        return Err(LibwbxmlDecodeError::Unavailable(
            "libwbxml disabled by LOWBAND_DISABLE_LIBWBXML".to_string(),
        ));
    }
    if payload.is_empty() {
        return Err(LibwbxmlDecodeError::Failed(
            "WBXML decode failed: empty payload".to_string(),
        ));
    }

    let mut last_load_err = String::new();
    for candidate in libwbxml_candidates() {
        // SAFETY: Loading a dynamic library by path does not invoke symbols.
        let lib = match unsafe { Library::new(candidate) } {
            Ok(lib) => lib,
            Err(err) => {
                last_load_err = format!("{candidate}: {err}");
                continue;
            }
        };

        // SAFETY: Symbol signatures come directly from libwbxml headers.
        let result = unsafe {
            let create = lib
                .get::<unsafe extern "C" fn(*mut *mut c_void) -> i32>(
                    b"wbxml_conv_wbxml2xml_create\0",
                )
                .map_err(|err| {
                    LibwbxmlDecodeError::Failed(format!(
                        "libwbxml missing create symbol in {candidate}: {err}"
                    ))
                })?;
            let run =
                    lib.get::<unsafe extern "C" fn(
                        *mut c_void,
                        *mut u8,
                        u32,
                        *mut *mut u8,
                        *mut u32,
                    ) -> i32>(b"wbxml_conv_wbxml2xml_run\0")
                        .map_err(|err| {
                            LibwbxmlDecodeError::Failed(format!(
                                "libwbxml missing run symbol in {candidate}: {err}"
                            ))
                        })?;
            let destroy = lib
                .get::<unsafe extern "C" fn(*mut c_void)>(b"wbxml_conv_wbxml2xml_destroy\0")
                .map_err(|err| {
                    LibwbxmlDecodeError::Failed(format!(
                        "libwbxml missing destroy symbol in {candidate}: {err}"
                    ))
                })?;
            let errors_string = lib
                .get::<unsafe extern "C" fn(i32) -> *const u8>(b"wbxml_errors_string\0")
                .map_err(|err| {
                    LibwbxmlDecodeError::Failed(format!(
                        "libwbxml missing errors symbol in {candidate}: {err}"
                    ))
                })?;

            let mut conv: *mut c_void = std::ptr::null_mut();
            let create_rc = create(&mut conv);
            if create_rc != 0 || conv.is_null() {
                return Err(LibwbxmlDecodeError::Failed(format!(
                    "WBXML decode failed: {}",
                    libwbxml_error_text(*errors_string, create_rc)
                )));
            }

            let mut xml_ptr: *mut u8 = std::ptr::null_mut();
            let mut xml_len: u32 = 0;
            let run_rc = run(
                conv,
                payload.as_ptr() as *mut u8,
                payload.len() as u32,
                &mut xml_ptr,
                &mut xml_len,
            );
            destroy(conv);

            if run_rc != 0 {
                return Err(LibwbxmlDecodeError::Failed(format!(
                    "WBXML decode failed: {}",
                    libwbxml_error_text(*errors_string, run_rc)
                )));
            }
            if xml_ptr.is_null() || xml_len == 0 {
                return Err(LibwbxmlDecodeError::Failed(
                    "WBXML decode failed: decoder returned empty output".to_string(),
                ));
            }

            let xml_slice = std::slice::from_raw_parts(xml_ptr, xml_len as usize);
            let xml_text = String::from_utf8_lossy(xml_slice).trim().to_string();
            libc::free(xml_ptr as *mut c_void);

            if xml_text.is_empty() {
                return Err(LibwbxmlDecodeError::Failed(
                    "WBXML decode failed: decoder returned empty output".to_string(),
                ));
            }
            Ok(xml_text)
        };
        return result;
    }

    Err(LibwbxmlDecodeError::Unavailable(format!(
        "libwbxml shared library not available ({last_load_err})"
    )))
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
    match decode_wmlc_with_libwbxml(payload) {
        Ok(xml) => Ok(xml),
        Err(LibwbxmlDecodeError::Failed(err)) => Err(err),
        Err(LibwbxmlDecodeError::Unavailable(lib_err)) => {
            match decode_wmlc_with_tool(payload, &wbxml2xml_bin()) {
                Ok(xml) => Ok(xml),
                Err(tool_err) => Err(format!("{lib_err}; {tool_err}")),
            }
        }
    }
}

pub fn preflight_wbxml_decoder() -> Result<String, String> {
    if libwbxml_available().is_ok() {
        return Ok("libwbxml".to_string());
    }

    let tool = wbxml2xml_bin();
    let output = Command::new(&tool)
        .arg("--version")
        .output()
        .map_err(|_| {
            format!(
                "WBXML decoder unavailable. Neither libwbxml shared library nor `{tool}` is accessible."
            )
        })?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let reason = stderr.lines().next().unwrap_or("non-zero exit");
        return Err(format!(
            "WBXML decoder preflight failed at `{tool}`: {reason}"
        ));
    }
    Ok("wbxml2xml-cli".to_string())
}

fn gateway_http_base() -> String {
    env::var("GATEWAY_HTTP_BASE").unwrap_or_else(|_| "http://localhost:13002".to_string())
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
    // Do not override Host by default for the gateway bridge.
    // Kannel map-url matching is keyed on the gateway authority/path, and
    // forcing Host to the original WAP target can break route resolution.
    merged_headers
        .entry("X-Wap-Target-Url".to_string())
        .or_insert_with(|| original_url.to_string());

    Ok((request_url.to_string(), merged_headers))
}

#[allow(clippy::too_many_arguments)]
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
    request_id: Option<&str>,
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
                details: details_with_request_id(
                    request_id,
                    Some(serde_json::json!({
                        "body": String::from_utf8_lossy(body).chars().take(300).collect::<String>(),
                        "attempt": attempt
                    })),
                ),
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
                    details: details_with_request_id(
                        request_id,
                        Some(serde_json::json!({ "attempt": attempt })),
                    ),
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
                details: details_with_request_id(
                    request_id,
                    Some(serde_json::json!({ "attempt": attempt })),
                ),
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
    request_id: Option<&str>,
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
            details: details_with_request_id(
                request_id,
                Some(serde_json::json!({
                    "attempts": attempts,
                    "lastAttempt": attempt
                })),
            ),
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
    let FetchDeckRequest {
        url,
        method,
        headers,
        timeout_ms,
        retries,
        request_id,
    } = request;
    let request_id = normalized_request_id(request_id.as_deref()).map(str::to_string);

    let method = method
        .unwrap_or_else(|| "GET".to_string())
        .to_ascii_uppercase();
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

    log_transport_event(
        "transport.fetch.start",
        request_id.as_deref(),
        &url,
        serde_json::json!({ "method": method }),
    );

    let is_wap_scheme = matches!(parsed.scheme(), "wap" | "waps");
    let mut upstream_url = url.clone();
    let mut outbound_headers = headers.unwrap_or_default();
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
            Ok(resp) => {
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
                let body = match resp.bytes() {
                    Ok(body) => body,
                    Err(err) => {
                        let message = format!("transport read failed: {err}");
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
                    body.as_ref(),
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

#[cfg(test)]
mod tests {
    use super::{
        build_gateway_request, decode_wmlc, decode_wmlc_with_libwbxml, decode_wmlc_with_tool,
        details_with_request_id, fetch_deck_in_process, invalid_request_response,
        is_supported_wml_content_type, libwbxml_available, libwbxml_disabled_by_env,
        libwbxml_error_text, log_transport_event, map_success_payload_response,
        map_terminal_send_error, normalize_content_type, normalized_request_id,
        preflight_wbxml_decoder, wbxml2xml_bin, FetchDeckRequest, LibwbxmlDecodeError,
    };
    use crate::BASE64;
    use base64::Engine as _;
    use serde::Deserialize;
    use std::collections::HashMap;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::{Mutex, OnceLock};
    use toml::Value;

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
        body: String,
        attempt: u8,
        elapsed_ms: f64,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct FixtureExpected {
        ok: bool,
        status: u16,
        final_url: String,
        content_type: String,
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
        let response = map_success_payload_response(
            input.status,
            input.is_wap_scheme,
            &input.request_url,
            &input.upstream_url,
            input.final_url,
            input.content_type,
            input.body.as_bytes(),
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
        let response = map_success_payload_response(
            input.status,
            input.is_wap_scheme,
            &input.request_url,
            &input.upstream_url,
            input.final_url,
            input.content_type,
            input.body.as_bytes(),
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
