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

pub fn fetch_deck_in_process(request: FetchDeckRequest) -> FetchDeckResponse {
    let method = request
        .method
        .unwrap_or_else(|| "GET".to_string())
        .to_ascii_uppercase();
    if method != "GET" {
        return FetchDeckResponse {
            ok: false,
            status: 0,
            final_url: request.url,
            content_type: "text/plain".to_string(),
            wml: None,
            error: Some(FetchErrorInfo {
                code: "INVALID_REQUEST".to_string(),
                message: format!("Unsupported method: {method}"),
                details: None,
            }),
            timing_ms: FetchTiming {
                encode: 0.0,
                udp_rtt: 0.0,
                decode: 0.0,
            },
            engine_deck_input: None,
        };
    }

    let parsed = match Url::parse(&request.url) {
        Ok(parsed) => parsed,
        Err(_) => {
            return FetchDeckResponse {
                ok: false,
                status: 0,
                final_url: request.url,
                content_type: "text/plain".to_string(),
                wml: None,
                error: Some(FetchErrorInfo {
                    code: "INVALID_REQUEST".to_string(),
                    message: "URL must include a scheme".to_string(),
                    details: None,
                }),
                timing_ms: FetchTiming {
                    encode: 0.0,
                    udp_rtt: 0.0,
                    decode: 0.0,
                },
                engine_deck_input: None,
            };
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
                if status >= 400 {
                    return FetchDeckResponse {
                        ok: false,
                        status,
                        final_url: if is_wap_scheme {
                            request.url.clone()
                        } else {
                            upstream_url.clone()
                        },
                        content_type: "text/plain".to_string(),
                        wml: None,
                        error: Some(FetchErrorInfo {
                            code: "PROTOCOL_ERROR".to_string(),
                            message: format!("Upstream HTTP error: {status}"),
                            details: Some(serde_json::json!({
                                "body": String::from_utf8_lossy(&body).chars().take(300).collect::<String>(),
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

                let raw_b64 = BASE64.encode(&body);
                if content_type == "application/vnd.wap.wmlc" {
                    let decode_start = Instant::now();
                    match decode_wmlc(body.as_ref()) {
                        Ok(wml) => {
                            return FetchDeckResponse {
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
                            };
                        }
                        Err(err) => {
                            return FetchDeckResponse {
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
                            };
                        }
                    }
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

                let wml = String::from_utf8_lossy(&body).to_string();
                return FetchDeckResponse {
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
                };
            }
            Err(err) => {
                last_error = err.to_string();
                if attempt == attempts {
                    return FetchDeckResponse {
                        ok: false,
                        status: 0,
                        final_url: request.url.clone(),
                        content_type: "text/plain".to_string(),
                        wml: None,
                        error: Some(FetchErrorInfo {
                            code: if err.is_timeout() {
                                "GATEWAY_TIMEOUT".to_string()
                            } else {
                                "TRANSPORT_UNAVAILABLE".to_string()
                            },
                            message: last_error.clone(),
                            details: Some(serde_json::json!({
                                "attempts": attempts,
                                "lastAttempt": attempt
                            })),
                        }),
                        timing_ms: FetchTiming {
                            encode: 0.0,
                            udp_rtt: start.elapsed().as_secs_f64() * 1000.0,
                            decode: 0.0,
                        },
                        engine_deck_input: None,
                    };
                }
            }
        }
    }

    FetchDeckResponse {
        ok: false,
        status: 0,
        final_url: request.url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(FetchErrorInfo {
            code: "RETRIES_EXHAUSTED".to_string(),
            message: last_error,
            details: Some(serde_json::json!({ "attempts": attempts })),
        }),
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: 0.0,
            decode: 0.0,
        },
        engine_deck_input: None,
    }
}

#[cfg(test)]
mod tests {
    use super::{build_gateway_request, decode_wmlc_with_tool, normalize_content_type};
    use std::collections::HashMap;

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
    fn transport_decode_wmlc_missing_tool_returns_structured_error() {
        let err = decode_wmlc_with_tool(b"\x03\x01\x6a\x00", "__definitely_missing_wbxml2xml__")
            .expect_err("missing tool should fail");
        assert!(err.contains("WBXML decoder tool not available"));
    }
}
