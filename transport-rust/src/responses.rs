use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use std::char::decode_utf16;
use std::time::Instant;

use crate::request_meta::details_with_request_id;
use crate::wbxml::decode_wmlc;
use crate::{EngineDeckInputPayload, FetchDeckResponse, FetchErrorInfo, FetchTiming};

const MAX_MAPPED_PAYLOAD_BYTES: usize = 512 * 1024;

pub(crate) fn transport_unavailable_response(
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

pub(crate) fn invalid_request_response(
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

#[allow(clippy::too_many_arguments)]
pub(crate) fn payload_too_large_response(
    status: u16,
    final_url: String,
    content_type: String,
    limit_bytes: usize,
    actual_bytes: Option<u64>,
    attempt: u8,
    elapsed_ms: f64,
    request_id: Option<&str>,
) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status,
        final_url,
        content_type,
        wml: None,
        error: Some(FetchErrorInfo {
            code: "PROTOCOL_ERROR".to_string(),
            message: match actual_bytes {
                Some(actual) => {
                    format!("Payload exceeds {limit_bytes}-byte limit (got {actual} bytes)")
                }
                None => format!("Payload exceeds {limit_bytes}-byte limit"),
            },
            details: details_with_request_id(
                request_id,
                Some(serde_json::json!({
                    "attempt": attempt,
                    "limitBytes": limit_bytes,
                    "actualBytes": actual_bytes
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

pub(crate) fn normalize_content_type(content_type: Option<&str>) -> String {
    content_type
        .and_then(|value| value.split(';').next())
        .map(|value| value.trim().to_ascii_lowercase())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "application/octet-stream".to_string())
}

pub(crate) fn is_supported_wml_content_type(content_type: &str) -> bool {
    matches!(
        content_type,
        "text/vnd.wap.wml"
            | "application/vnd.wap.wml+xml"
            | "text/xml"
            | "application/xml"
            | "text/plain"
    )
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn map_success_payload_response(
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
    if body.len() > MAX_MAPPED_PAYLOAD_BYTES {
        return FetchDeckResponse {
            ok: false,
            status,
            final_url,
            content_type,
            wml: None,
            error: Some(FetchErrorInfo {
                code: "PROTOCOL_ERROR".to_string(),
                message: format!(
                    "Payload exceeds {}-byte limit (got {} bytes)",
                    MAX_MAPPED_PAYLOAD_BYTES,
                    body.len()
                ),
                details: details_with_request_id(
                    request_id,
                    Some(serde_json::json!({
                        "attempt": attempt,
                        "limitBytes": MAX_MAPPED_PAYLOAD_BYTES,
                        "actualBytes": body.len()
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

    let wml = match decode_textual_wml_payload(body) {
        Ok(wml) => wml,
        Err(message) => {
            return FetchDeckResponse {
                ok: false,
                status,
                final_url,
                content_type,
                wml: None,
                error: Some(FetchErrorInfo {
                    code: "PROTOCOL_ERROR".to_string(),
                    message,
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
    };
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

fn decode_textual_wml_payload(body: &[u8]) -> Result<String, String> {
    if body.starts_with(&[0xFF, 0xFE]) {
        return decode_utf16_payload(&body[2..], true);
    }
    if body.starts_with(&[0xFE, 0xFF]) {
        return decode_utf16_payload(&body[2..], false);
    }
    Ok(String::from_utf8_lossy(body).to_string())
}

fn decode_utf16_payload(bytes: &[u8], little_endian: bool) -> Result<String, String> {
    if !bytes.len().is_multiple_of(2) {
        return Err("Invalid UTF-16 payload: odd byte length".to_string());
    }
    let units = bytes.chunks_exact(2).map(|chunk| {
        if little_endian {
            u16::from_le_bytes([chunk[0], chunk[1]])
        } else {
            u16::from_be_bytes([chunk[0], chunk[1]])
        }
    });
    let mut out = String::new();
    for decoded in decode_utf16(units) {
        match decoded {
            Ok(ch) => out.push(ch),
            Err(_) => return Err("Invalid UTF-16 payload: unpaired surrogate".to_string()),
        }
    }
    Ok(out)
}

pub(crate) fn map_terminal_send_error(
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
