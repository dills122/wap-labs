use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use std::char::decode_utf16;
use std::time::Instant;

use crate::request_meta::details_with_request_id;
use crate::wbxml::decode_wbxml_for_content_type;
use crate::{
    EngineDeckInputPayload, FetchDeckResponse, FetchErrorInfo, FetchTiming,
    FETCH_ERROR_CODE_CANCELLED, FETCH_ERROR_CODE_PAYLOAD_TOO_LARGE, MAX_RESPONSE_BODY_BYTES,
};

/// Builds the shared shape of every failed `FetchDeckResponse`.
///
/// Every error path differs only in status, final URL, content type, error info
/// and round-trip timing; `ok`, `wml`, `engine_deck_input` and the encode/decode
/// timings are invariant across all of them.
fn error_response(
    status: u16,
    final_url: String,
    content_type: String,
    error: FetchErrorInfo,
    elapsed_ms: f64,
) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status,
        final_url,
        content_type,
        wml: None,
        error: Some(error),
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: elapsed_ms,
            decode: 0.0,
        },
        engine_deck_input: None,
    }
}

pub(crate) fn cancelled_response(url: String, request_id: Option<&str>) -> FetchDeckResponse {
    error_response(
        0,
        url,
        "text/plain".to_string(),
        FetchErrorInfo {
            code: FETCH_ERROR_CODE_CANCELLED.to_string(),
            message: "Fetch was cancelled".to_string(),
            details: details_with_request_id(request_id, None),
        },
        0.0,
    )
}

pub(crate) fn transport_unavailable_response(
    url: String,
    message: String,
    request_id: Option<&str>,
) -> FetchDeckResponse {
    error_response(
        0,
        url,
        "text/plain".to_string(),
        FetchErrorInfo {
            code: "TRANSPORT_UNAVAILABLE".to_string(),
            message,
            details: details_with_request_id(request_id, None),
        },
        0.0,
    )
}

pub(crate) fn invalid_request_response(
    url: String,
    message: String,
    request_id: Option<&str>,
) -> FetchDeckResponse {
    error_response(
        0,
        url,
        "text/plain".to_string(),
        FetchErrorInfo {
            code: "INVALID_REQUEST".to_string(),
            message,
            details: details_with_request_id(request_id, None),
        },
        0.0,
    )
}

/// Inputs for [`payload_too_large_response`].
pub(crate) struct PayloadTooLargeParams<'a> {
    pub(crate) status: u16,
    pub(crate) final_url: String,
    pub(crate) content_type: String,
    pub(crate) limit_bytes: usize,
    pub(crate) actual_bytes: Option<u64>,
    pub(crate) attempt: u8,
    pub(crate) elapsed_ms: f64,
    pub(crate) request_id: Option<&'a str>,
}

pub(crate) fn payload_too_large_response(params: PayloadTooLargeParams<'_>) -> FetchDeckResponse {
    let PayloadTooLargeParams {
        status,
        final_url,
        content_type,
        limit_bytes,
        actual_bytes,
        attempt,
        elapsed_ms,
        request_id,
    } = params;
    error_response(
        status,
        final_url,
        content_type,
        FetchErrorInfo {
            code: FETCH_ERROR_CODE_PAYLOAD_TOO_LARGE.to_string(),
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
        },
        elapsed_ms,
    )
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

/// Inputs for [`map_success_payload_response`].
pub(crate) struct SuccessPayloadParams<'a> {
    pub(crate) status: u16,
    pub(crate) is_wap_scheme: bool,
    pub(crate) request_url: &'a str,
    pub(crate) upstream_url: &'a str,
    pub(crate) final_url: String,
    pub(crate) content_type: String,
    pub(crate) body: &'a [u8],
    pub(crate) attempt: u8,
    pub(crate) elapsed_ms: f64,
    pub(crate) request_id: Option<&'a str>,
}

pub(crate) fn map_success_payload_response(params: SuccessPayloadParams<'_>) -> FetchDeckResponse {
    let SuccessPayloadParams {
        status,
        is_wap_scheme,
        request_url,
        upstream_url,
        final_url,
        content_type: raw_content_type,
        body,
        attempt,
        elapsed_ms,
        request_id,
    } = params;
    let content_type = normalize_content_type(Some(&raw_content_type));

    if body.len() > MAX_RESPONSE_BODY_BYTES {
        return payload_too_large_response(PayloadTooLargeParams {
            status,
            final_url,
            content_type,
            limit_bytes: MAX_RESPONSE_BODY_BYTES,
            actual_bytes: Some(body.len() as u64),
            attempt,
            elapsed_ms,
            request_id,
        });
    }

    if status >= 400 {
        return error_response(
            status,
            if is_wap_scheme {
                request_url.to_string()
            } else {
                upstream_url.to_string()
            },
            "text/plain".to_string(),
            FetchErrorInfo {
                code: "PROTOCOL_ERROR".to_string(),
                message: format!("Upstream HTTP error: {status}"),
                details: details_with_request_id(
                    request_id,
                    Some(serde_json::json!({
                        "body": String::from_utf8_lossy(body).chars().take(300).collect::<String>(),
                        "attempt": attempt
                    })),
                ),
            },
            elapsed_ms,
        );
    }

    let raw_b64 = BASE64.encode(body);
    if content_type == "application/vnd.wap.wmlc" {
        let decode_start = Instant::now();
        return match decode_wbxml_for_content_type(body, &raw_content_type) {
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
            Err(err) => error_response(
                status,
                final_url,
                content_type,
                FetchErrorInfo {
                    code: "WBXML_DECODE_FAILED".to_string(),
                    message: err,
                    details: details_with_request_id(
                        request_id,
                        Some(serde_json::json!({ "attempt": attempt })),
                    ),
                },
                elapsed_ms,
            ),
        };
    }

    if !is_supported_wml_content_type(&content_type) {
        return error_response(
            status,
            final_url,
            content_type.clone(),
            FetchErrorInfo {
                code: "UNSUPPORTED_CONTENT_TYPE".to_string(),
                message: format!("Unsupported content type: {content_type}"),
                details: details_with_request_id(
                    request_id,
                    Some(serde_json::json!({ "attempt": attempt })),
                ),
            },
            elapsed_ms,
        );
    }

    let wml = match decode_textual_wml_payload(body) {
        Ok(wml) => wml,
        Err(message) => {
            return error_response(
                status,
                final_url,
                content_type,
                FetchErrorInfo {
                    code: "PROTOCOL_ERROR".to_string(),
                    message,
                    details: details_with_request_id(
                        request_id,
                        Some(serde_json::json!({ "attempt": attempt })),
                    ),
                },
                elapsed_ms,
            );
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
    error_response(
        0,
        request_url,
        "text/plain".to_string(),
        FetchErrorInfo {
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
        },
        elapsed_ms,
    )
}

/// Last-failure accumulator shared by the HTTP and native transport retry loops.
///
/// Both loops previously carried three parallel `last_*` locals and re-derived
/// the same terminal-response mapping. The actual send/receive mechanics stay
/// with each transport; only this bookkeeping is shared.
pub(crate) struct FetchAttemptFailure {
    message: String,
    is_timeout: bool,
    elapsed_ms: f64,
}

impl Default for FetchAttemptFailure {
    fn default() -> Self {
        Self {
            message: "Retries exhausted".to_string(),
            is_timeout: false,
            elapsed_ms: 0.0,
        }
    }
}

impl FetchAttemptFailure {
    pub(crate) fn record(&mut self, message: String, is_timeout: bool, elapsed_ms: f64) {
        self.message = message;
        self.is_timeout = is_timeout;
        self.elapsed_ms = elapsed_ms;
    }

    pub(crate) fn message(&self) -> &str {
        &self.message
    }

    pub(crate) fn is_timeout(&self) -> bool {
        self.is_timeout
    }

    pub(crate) fn elapsed_ms(&self) -> f64 {
        self.elapsed_ms
    }

    /// Maps the recorded failure to the terminal `FetchDeckResponse` returned
    /// once every attempt has been consumed.
    pub(crate) fn into_terminal_response(
        self,
        request_url: String,
        attempts: u8,
        last_attempt: u8,
        request_id: Option<&str>,
    ) -> FetchDeckResponse {
        map_terminal_send_error(
            request_url,
            self.message,
            attempts,
            last_attempt,
            self.is_timeout,
            self.elapsed_ms,
            request_id,
        )
    }
}
