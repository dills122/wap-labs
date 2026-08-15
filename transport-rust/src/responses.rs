use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use encoding_rs::SHIFT_JIS;
use mime::{Mime, CHARSET};
use std::char::decode_utf16;
use std::time::Instant;

use crate::request_meta::details_with_request_id;
use crate::wbxml::decode_wml_wbxml_for_content_type;
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
    if matches!(
        content_type.as_str(),
        "application/vnd.wap.wmlc" | "application/vnd.wap.wbxml"
    ) {
        let decode_start = Instant::now();
        return match decode_wml_wbxml_for_content_type(body, &raw_content_type) {
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

    let wml = match decode_textual_wml_payload(body, &raw_content_type) {
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

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum TextEncoding {
    Ascii,
    Latin1,
    ShiftJis,
    Utf8,
    Utf16Le,
    Utf16Be,
}

impl TextEncoding {
    fn from_label(label: &str) -> Result<Self, String> {
        match label.trim().to_ascii_lowercase().as_str() {
            "us-ascii" | "ascii" => Ok(Self::Ascii),
            "iso-8859-1" | "latin1" | "latin-1" => Ok(Self::Latin1),
            "shift_jis" | "shift-jis" | "sjis" | "windows-31j" => Ok(Self::ShiftJis),
            "utf-8" | "utf8" => Ok(Self::Utf8),
            "utf-16le" => Ok(Self::Utf16Le),
            "utf-16be" => Ok(Self::Utf16Be),
            "utf-16" => Err(
                "Unsupported textual WML charset \"utf-16\" without byte-order information"
                    .to_string(),
            ),
            _ => Err(format!("Unsupported textual WML charset {label:?}")),
        }
    }

    fn decode(self, bytes: &[u8]) -> Result<String, String> {
        match self {
            Self::Ascii => {
                if bytes.iter().any(|byte| !byte.is_ascii()) {
                    return Err("Invalid US-ASCII textual WML payload".to_string());
                }
                String::from_utf8(bytes.to_vec())
                    .map_err(|error| format!("Invalid US-ASCII textual WML payload: {error}"))
            }
            Self::Latin1 => Ok(bytes.iter().map(|byte| char::from(*byte)).collect()),
            Self::ShiftJis => SHIFT_JIS
                .decode_without_bom_handling_and_without_replacement(bytes)
                .map(|decoded| decoded.into_owned())
                .ok_or_else(|| "Invalid Shift_JIS textual WML payload".to_string()),
            Self::Utf8 => std::str::from_utf8(bytes)
                .map(str::to_string)
                .map_err(|error| format!("Invalid UTF-8 textual WML payload: {error}")),
            Self::Utf16Le => decode_utf16_payload(bytes, true),
            Self::Utf16Be => decode_utf16_payload(bytes, false),
        }
    }
}

fn decode_textual_wml_payload(body: &[u8], content_type: &str) -> Result<String, String> {
    let (bom_encoding, bom_length) = if body.starts_with(&[0xef, 0xbb, 0xbf]) {
        (Some(TextEncoding::Utf8), 3)
    } else if body.starts_with(&[0xff, 0xfe]) {
        (Some(TextEncoding::Utf16Le), 2)
    } else if body.starts_with(&[0xfe, 0xff]) {
        (Some(TextEncoding::Utf16Be), 2)
    } else {
        (None, 0)
    };

    let sniffed_utf16 = if body.starts_with(&[0x00, b'<', 0x00, b'?']) {
        Some(TextEncoding::Utf16Be)
    } else if body.starts_with(&[b'<', 0x00, b'?', 0x00]) {
        Some(TextEncoding::Utf16Le)
    } else {
        None
    };
    let byte_order = bom_encoding.or(sniffed_utf16);
    let external_encoding = content_type
        .parse::<Mime>()
        .ok()
        .and_then(|media_type| {
            media_type
                .get_param(CHARSET)
                .map(|value| resolve_text_encoding(value.as_str(), byte_order))
        })
        .transpose()?;

    if let (Some(external), Some(bom)) = (external_encoding, bom_encoding) {
        if external != bom {
            return Err(format!(
                "Textual WML charset conflict: carrying protocol selects {external:?}, byte-order mark selects {bom:?}"
            ));
        }
    }

    let declared_encoding = xml_declared_encoding(body)
        .map(|label| resolve_text_encoding(label, byte_order))
        .transpose()?;
    let encoding = bom_encoding
        .or(external_encoding)
        .or(sniffed_utf16)
        .or(declared_encoding)
        .unwrap_or(TextEncoding::Utf8);

    encoding.decode(&body[bom_length..])
}

fn resolve_text_encoding(
    label: &str,
    byte_order: Option<TextEncoding>,
) -> Result<TextEncoding, String> {
    if label.trim().eq_ignore_ascii_case("utf-16") {
        return byte_order.ok_or_else(|| {
            "Unsupported textual WML charset \"utf-16\" without byte-order information".to_string()
        });
    }
    TextEncoding::from_label(label)
}

fn xml_declared_encoding(body: &[u8]) -> Option<&str> {
    if body.starts_with(&[0x00, b'<', 0x00, b'?'])
        || body.starts_with(&[b'<', 0x00, b'?', 0x00])
        || !body.starts_with(b"<?xml")
    {
        return None;
    }
    let end = body.windows(2).position(|window| window == b"?>")? + 2;
    let declaration = std::str::from_utf8(&body[..end]).ok()?;
    find_xml_declaration_attribute(declaration, "encoding")
}

fn find_xml_declaration_attribute<'a>(declaration: &'a str, name: &str) -> Option<&'a str> {
    let mut remainder = declaration.strip_prefix("<?xml")?;
    loop {
        remainder = remainder.trim_start();
        if remainder.starts_with("?>") {
            return None;
        }
        let name_end = remainder
            .find(|character: char| character.is_ascii_whitespace() || character == '=')?;
        let candidate = &remainder[..name_end];
        remainder = remainder[name_end..].trim_start();
        if !remainder.starts_with('=') {
            return None;
        }
        remainder = remainder[1..].trim_start();
        let quote = remainder.chars().next()?;
        if !matches!(quote, '\'' | '"') {
            return None;
        }
        remainder = &remainder[quote.len_utf8()..];
        let value_end = remainder.find(quote)?;
        let value = &remainder[..value_end];
        if candidate.eq_ignore_ascii_case(name) {
            return Some(value);
        }
        remainder = &remainder[value_end + quote.len_utf8()..];
    }
}

fn decode_utf16_payload(bytes: &[u8], little_endian: bool) -> Result<String, String> {
    if !bytes.len().is_multiple_of(2) {
        return Err("Invalid UTF-16 payload: odd byte length".to_string());
    }
    let units = bytes.as_chunks::<2>().0.iter().map(|chunk| {
        if little_endian {
            u16::from_le_bytes(*chunk)
        } else {
            u16::from_be_bytes(*chunk)
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
