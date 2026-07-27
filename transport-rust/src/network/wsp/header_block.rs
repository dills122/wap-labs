use crate::network::wsp::decoder::{
    HeaderStreamDecodePolicy, UnsupportedCodePageBehavior, WspHeaderStreamDecodeError,
};
use crate::network::wsp::encode_header_field_name;
use crate::network::wsp::encoder::{HeaderEncodePolicy, WspHeaderEncodeError};
use crate::network::wsp::encoding_version::{
    determine_outbound_header_encoding, unsupported_binary_error_response,
    BinaryHeaderEncodingDecision, WspEncodingVersion, WspEncodingVersionErrorResponse,
    WspEncodingVersionHeader, WspEncodingVersionPolicy,
};
use crate::network::wsp::header_registry::DEFAULT_HEADER_CODE_PAGE;
use crate::network::wsp::header_value::{
    decode_header_section, encode_encoding_version_value, encode_expect_value,
    DecodedWspEncodingVersion, DecodedWspHeaderName, DecodedWspHeaderValue, UnknownHeaderBehavior,
    WspHeaderSectionDecodeError, WspHeaderSectionDecodePolicy, WspHeaderValueEncodeError,
    WspHeaderValueForm, WspRawHeaderValue, WspVersionValue,
};

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspHeaderNameEncoding {
    Binary { page: u8 },
    Text,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspHeaderField {
    pub name: String,
    pub value: String,
    pub name_encoding: WspHeaderNameEncoding,
}

#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct WspHeaderBlock {
    pub headers: Vec<WspHeaderField>,
    pub encoding_version_headers: Vec<WspEncodingVersionHeader>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspHeaderBlockDecodePolicy {
    pub header_stream: HeaderStreamDecodePolicy,
    pub encoding_version: WspEncodingVersionPolicy,
    pub negotiated_version: Option<WspEncodingVersion>,
    pub negotiated_extension_pages: &'static [u8],
}

impl WspHeaderBlockDecodePolicy {
    pub const STRICT: Self = Self {
        header_stream: HeaderStreamDecodePolicy::STRICT,
        encoding_version: WspEncodingVersionPolicy {
            default_peer_version: WspEncodingVersion::V1_2,
            default_extension_page_version: WspEncodingVersion::V1_2,
            server_max_version: WspEncodingVersion::V1_4,
        },
        negotiated_version: None,
        negotiated_extension_pages: &[],
    };
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspHeaderBlockEncodePolicy {
    pub header_name_policy: HeaderEncodePolicy,
    pub encoding_version: WspEncodingVersionPolicy,
    pub recipient_version: Option<WspEncodingVersion>,
    pub negotiated_extension_pages: &'static [u8],
}

impl WspHeaderBlockEncodePolicy {
    pub const STRICT: Self = Self {
        header_name_policy: HeaderEncodePolicy {
            binary_encoding: true,
            unsupported_code_page: UnsupportedCodePageBehavior::Error,
        },
        encoding_version: WspEncodingVersionPolicy {
            default_peer_version: WspEncodingVersion::V1_2,
            default_extension_page_version: WspEncodingVersion::V1_2,
            server_max_version: WspEncodingVersion::V1_4,
        },
        recipient_version: None,
        negotiated_extension_pages: &[],
    };
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspHeaderBlockDecodeError {
    HeaderName(WspHeaderStreamDecodeError),
    TruncatedTextHeaderName,
    TruncatedHeaderValue,
    UnsupportedBinaryEncoding(WspEncodingVersionErrorResponse),
    HeaderSection(WspHeaderSectionDecodeError),
}

impl std::fmt::Display for WspHeaderBlockDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::HeaderName(error) => write!(f, "{error}"),
            Self::TruncatedTextHeaderName => write!(f, "truncated text header name"),
            Self::TruncatedHeaderValue => write!(f, "truncated header value"),
            Self::UnsupportedBinaryEncoding(response) => {
                write!(
                    f,
                    "unsupported binary encoding (status {})",
                    response.status_code
                )
            }
            Self::HeaderSection(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for WspHeaderBlockDecodeError {}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspHeaderBlockEncodeError {
    HeaderName(WspHeaderEncodeError),
    HeaderValue(WspHeaderValueEncodeError),
}

impl std::fmt::Display for WspHeaderBlockEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::HeaderName(error) => write!(f, "{error}"),
            Self::HeaderValue(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for WspHeaderBlockEncodeError {}

/// Expands comma-list fields into ordered repeated WSP fields before binary
/// encoding. Quoted commas remain inside their original field value.
pub fn expand_comma_list_headers(block: &WspHeaderBlock) -> WspHeaderBlock {
    let mut expanded = WspHeaderBlock::default();
    for header in &block.headers {
        if is_comma_list_header(&header.name) {
            for value in split_http_comma_list(&header.value) {
                expanded.headers.push(WspHeaderField {
                    name: header.name.clone(),
                    value,
                    name_encoding: header.name_encoding.clone(),
                });
            }
        } else {
            expanded.headers.push(header.clone());
        }
    }
    expanded.encoding_version_headers = block.encoding_version_headers.clone();
    expanded
}

/// Adds the hop-by-hop Encoding-Version fields required for a connectionless
/// header set. Existing Encoding-Version fields are replaced to avoid stale or
/// forwarded peer advertisements.
pub fn prepare_connectionless_header_block(
    block: &WspHeaderBlock,
    sender_version: WspEncodingVersion,
    extension_pages: &[u8],
) -> WspHeaderBlock {
    let expanded = expand_comma_list_headers(block);
    let mut prepared = WspHeaderBlock::default();
    prepared.headers.extend(
        expanded
            .headers
            .into_iter()
            .filter(|header| !header.name.eq_ignore_ascii_case("Encoding-Version")),
    );
    push_encoding_version_field(&mut prepared, None, Some(sender_version));
    let mut pages = extension_pages.to_vec();
    pages.sort_unstable();
    pages.dedup();
    for page in pages
        .into_iter()
        .filter(|page| crate::network::wsp::header_registry::is_negotiated_extension_page(*page))
    {
        push_encoding_version_field(&mut prepared, Some(page), Some(sender_version));
    }
    prepared
}

/// Removes Encoding-Version before forwarding application headers across the
/// next hop.
pub fn strip_hop_by_hop_encoding_version(block: &WspHeaderBlock) -> WspHeaderBlock {
    WspHeaderBlock {
        headers: block
            .headers
            .iter()
            .filter(|header| !header.name.eq_ignore_ascii_case("Encoding-Version"))
            .cloned()
            .collect(),
        encoding_version_headers: Vec::new(),
    }
}

/// Selects the compatible default-page version returned with a 400 response.
pub fn retry_recipient_version_after_unsupported_encoding(
    response: WspEncodingVersionErrorResponse,
    policy: WspEncodingVersionPolicy,
) -> WspEncodingVersion {
    match response.supported_header {
        WspEncodingVersionHeader {
            code_page: None,
            version: Some(version),
        } => version.min(policy.server_max_version),
        _ => policy.default_peer_version,
    }
}

pub fn extension_page_is_accepted_for_retry(
    page: u8,
    response: WspEncodingVersionErrorResponse,
) -> bool {
    response.supported_header.code_page != Some(page)
}

fn push_encoding_version_field(
    block: &mut WspHeaderBlock,
    code_page: Option<u8>,
    version: Option<WspEncodingVersion>,
) {
    let value = WspEncodingVersionHeader { code_page, version };
    block.headers.push(WspHeaderField {
        name: "Encoding-Version".to_string(),
        value: format_encoding_version_header_value(value),
        name_encoding: WspHeaderNameEncoding::Binary {
            page: DEFAULT_HEADER_CODE_PAGE,
        },
    });
    block.encoding_version_headers.push(value);
}

fn is_comma_list_header(name: &str) -> bool {
    [
        "Accept",
        "Accept-Charset",
        "Accept-Encoding",
        "Accept-Language",
        "Cache-Control",
        "Connection",
        "Content-Encoding",
        "Content-Language",
        "Pragma",
        "Public",
        "TE",
        "Trailer",
        "Transfer-Encoding",
        "Upgrade",
        "Vary",
        "Via",
        "Warning",
    ]
    .iter()
    .any(|candidate| candidate.eq_ignore_ascii_case(name))
}

fn split_http_comma_list(value: &str) -> Vec<String> {
    let mut values = Vec::new();
    let mut start = 0usize;
    let mut quoted = false;
    let mut escaped = false;
    for (index, character) in value.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        match character {
            '\\' if quoted => escaped = true,
            '"' => quoted = !quoted,
            ',' if !quoted => {
                let item = value[start..index].trim();
                if !item.is_empty() {
                    values.push(item.to_string());
                }
                start = index + character.len_utf8();
            }
            _ => {}
        }
    }
    let item = value[start..].trim();
    if !item.is_empty() {
        values.push(item.to_string());
    }
    if values.is_empty() {
        values.push(String::new());
    }
    values
}

pub fn decode_header_block(
    input: &[u8],
    policy: WspHeaderBlockDecodePolicy,
) -> Result<WspHeaderBlock, WspHeaderBlockDecodeError> {
    let unknown_header = if policy.header_stream.assigned_numbers
        == crate::network::wsp::header_registry::WspAssignedNumberPolicy::STRICT
    {
        UnknownHeaderBehavior::Error
    } else {
        UnknownHeaderBehavior::Skip
    };
    let decoded =
        decode_header_section(
            input,
            WspHeaderSectionDecodePolicy {
                unknown_header,
                unsupported_code_page: policy.header_stream.unsupported_code_page,
                negotiated_extension_pages: policy.negotiated_extension_pages,
                peer_encoding_version: policy
                    .negotiated_version
                    .or(Some(policy.encoding_version.default_peer_version)),
            },
        )
        .map_err(|error| match error {
            WspHeaderSectionDecodeError::UnsupportedHeaderEncodingVersion { .. } => {
                WspHeaderBlockDecodeError::UnsupportedBinaryEncoding(
                    unsupported_binary_error_response(None, policy.encoding_version),
                )
            }
            WspHeaderSectionDecodeError::UnnegotiatedApplicationCodePage(page) => {
                WspHeaderBlockDecodeError::UnsupportedBinaryEncoding(
                    unsupported_binary_error_response(Some(page), policy.encoding_version),
                )
            }
            other => WspHeaderBlockDecodeError::HeaderSection(other),
        })?;

    let mut block = WspHeaderBlock::default();
    for header in decoded {
        let (name, name_encoding) = match header.name {
            DecodedWspHeaderName::WellKnown { page, name, .. } => {
                (name.to_string(), WspHeaderNameEncoding::Binary { page })
            }
            DecodedWspHeaderName::Application(name) => (name, WspHeaderNameEncoding::Text),
            DecodedWspHeaderName::Unknown { .. } => continue,
        };
        let (value, mut encoding_version) = display_decoded_value(header.value);
        if encoding_version.is_none() && name.eq_ignore_ascii_case("Encoding-Version") {
            encoding_version = parse_encoding_version_header_value(&value);
        }
        if let Some(encoding_version) = encoding_version {
            block.encoding_version_headers.push(encoding_version);
        }
        block.headers.push(WspHeaderField {
            name,
            value,
            name_encoding,
        });
    }
    Ok(block)
}

pub fn encode_header_block(
    block: &WspHeaderBlock,
    policy: WspHeaderBlockEncodePolicy,
) -> Result<Vec<u8>, WspHeaderBlockEncodeError> {
    let mut out = Vec::new();

    for header in &block.headers {
        if matches!(header.name_encoding, WspHeaderNameEncoding::Text) {
            out.extend_from_slice(header.name.as_bytes());
            out.push(0x00);
            out.extend_from_slice(header.value.as_bytes());
            out.push(0x00);
            continue;
        }

        let page = match header.name_encoding {
            WspHeaderNameEncoding::Binary { page } => page,
            WspHeaderNameEncoding::Text => DEFAULT_HEADER_CODE_PAGE,
        };
        let decision = determine_outbound_header_encoding(
            &header.name,
            page,
            policy.recipient_version,
            policy.negotiated_extension_pages,
            policy.encoding_version,
        );

        match decision {
            BinaryHeaderEncodingDecision::UseBinary => {
                let encoded = encode_header_field_name(&header.name, policy.header_name_policy)
                    .map_err(WspHeaderBlockEncodeError::HeaderName)?;
                out.extend_from_slice(&encoded);
                if header.name.eq_ignore_ascii_case("Encoding-Version") {
                    let value = parse_encoding_version_header_value(&header.value)
                        .ok_or(WspHeaderValueEncodeError::InvalidVersion)
                        .and_then(|value| {
                            encode_encoding_version_value(DecodedWspEncodingVersion {
                                code_page: value.code_page,
                                version: value.version.map(WspVersionValue::from),
                            })
                        })
                        .map_err(WspHeaderBlockEncodeError::HeaderValue)?;
                    out.extend_from_slice(&value);
                    continue;
                }
                if header.name.eq_ignore_ascii_case("Expect") {
                    let value = encode_expect_value(&header.value)
                        .map_err(WspHeaderBlockEncodeError::HeaderValue)?;
                    out.extend_from_slice(&value);
                    continue;
                }
            }
            BinaryHeaderEncodingDecision::UseTextFallback
            | BinaryHeaderEncodingDecision::UnsupportedCodePage => {
                out.extend_from_slice(header.name.as_bytes());
                out.push(0x00);
            }
        }

        out.extend_from_slice(header.value.as_bytes());
        out.push(0x00);
    }

    Ok(out)
}

pub fn parse_encoding_version_header_value(input: &str) -> Option<WspEncodingVersionHeader> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return None;
    }

    let mut parts = trimmed.split_whitespace();
    let first = parts.next()?;
    let second = parts.next();
    if parts.next().is_some() {
        return None;
    }

    if let Some(version) = second.and_then(parse_version) {
        let code_page = u8::from_str_radix(first, 16).ok()?;
        return Some(WspEncodingVersionHeader {
            code_page: Some(code_page),
            version: Some(version),
        });
    }

    if let Some(version) = parse_version(first) {
        return Some(WspEncodingVersionHeader {
            code_page: None,
            version: Some(version),
        });
    }

    Some(WspEncodingVersionHeader {
        code_page: u8::from_str_radix(first, 16).ok(),
        version: None,
    })
}

pub fn format_encoding_version_header_value(header: WspEncodingVersionHeader) -> String {
    match (header.code_page, header.version) {
        (Some(code_page), Some(version)) => {
            format!("{code_page:02X} {}.{}", version.major, version.minor)
        }
        (Some(code_page), None) => format!("{code_page:02X}"),
        (None, Some(version)) => format!("{}.{}", version.major, version.minor),
        (None, None) => String::new(),
    }
}

fn display_decoded_value(
    value: DecodedWspHeaderValue,
) -> (String, Option<WspEncodingVersionHeader>) {
    match value {
        DecodedWspHeaderValue::Raw(raw) => (display_raw_value(&raw), None),
        DecodedWspHeaderValue::EncodingVersion { decoded, .. } => {
            let header = WspEncodingVersionHeader {
                code_page: decoded.code_page,
                version: decoded.version.and_then(|version| {
                    version.minor.map(|minor| WspEncodingVersion {
                        major: version.major,
                        minor,
                    })
                }),
            };
            (format_encoding_version_header_value(header), Some(header))
        }
        DecodedWspHeaderValue::ExpectContinue => ("100-continue".to_string(), None),
        DecodedWspHeaderValue::ExpectExpression(raw) => {
            let payload = length_payload(&raw.encoded);
            let mut parts = payload.split(|byte| *byte == 0);
            let variable = parts.next().unwrap_or_default();
            let expression = parts.next().unwrap_or_default();
            (
                format!(
                    "{}={}",
                    String::from_utf8_lossy(variable),
                    String::from_utf8_lossy(expression)
                ),
                None,
            )
        }
    }
}

fn display_raw_value(raw: &WspRawHeaderValue) -> String {
    match raw.form {
        WspHeaderValueForm::TextString => {
            let start = usize::from(raw.encoded.first() == Some(&0x7F));
            let end = raw.encoded.len().saturating_sub(1);
            String::from_utf8_lossy(&raw.encoded[start..end]).to_string()
        }
        WspHeaderValueForm::ShortInteger => raw
            .encoded
            .first()
            .map(|byte| format!("{}", byte & 0x7F))
            .unwrap_or_default(),
        WspHeaderValueForm::LengthDelimited => {
            String::from_utf8_lossy(length_payload(&raw.encoded)).to_string()
        }
    }
}

fn length_payload(encoded: &[u8]) -> &[u8] {
    match encoded.first().copied() {
        Some(0x00..=0x1E) => &encoded[1..],
        Some(0x1F) => {
            let prefix = encoded[1..]
                .iter()
                .position(|byte| byte & 0x80 == 0)
                .map_or(encoded.len(), |index| index + 2);
            &encoded[prefix..]
        }
        _ => encoded,
    }
}

fn parse_version(input: &str) -> Option<WspEncodingVersion> {
    let (major, minor) = input.split_once('.')?;
    Some(WspEncodingVersion {
        major: major.parse().ok()?,
        minor: minor.parse().ok()?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wsp::header_registry::HEADER_CODE_PAGE_SHIFT;

    #[test]
    fn decodes_binary_header_block_and_collects_encoding_version_headers() {
        let input = [
            0x91, b't', b'e', b'x', b't', b'/', b'v', b'n', b'd', b'.', b'w', b'a', b'p', b'.',
            b'w', b'm', b'l', 0x00, 0xC3, 0x93,
        ];
        let block = decode_header_block(
            &input,
            WspHeaderBlockDecodePolicy {
                negotiated_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderBlockDecodePolicy::STRICT
            },
        )
        .expect("decode");

        assert_eq!(block.headers.len(), 2);
        assert_eq!(block.headers[0].name, "Content-Type");
        assert_eq!(block.headers[0].value, "text/vnd.wap.wml");
        assert_eq!(
            block.encoding_version_headers,
            vec![WspEncodingVersionHeader {
                code_page: None,
                version: Some(WspEncodingVersion::V1_3),
            }]
        );
    }

    #[test]
    fn decode_rejects_binary_headers_that_exceed_negotiated_version() {
        let input = [0xB8, 0x80];
        let error = decode_header_block(
            &input,
            WspHeaderBlockDecodePolicy {
                negotiated_version: Some(WspEncodingVersion::V1_2),
                ..WspHeaderBlockDecodePolicy::STRICT
            },
        )
        .expect_err("header should fail");

        assert_eq!(
            error,
            WspHeaderBlockDecodeError::UnsupportedBinaryEncoding(WspEncodingVersionErrorResponse {
                status_code: 400,
                supported_header: WspEncodingVersionHeader {
                    code_page: None,
                    version: Some(WspEncodingVersion::V1_4),
                },
            })
        );
    }

    #[test]
    fn decode_rejects_binary_headers_on_unnegotiated_extension_pages() {
        let input = [HEADER_CODE_PAGE_SHIFT, 0x40, 0x90, b'1', 0x00];
        let error = decode_header_block(&input, WspHeaderBlockDecodePolicy::STRICT)
            .expect_err("extension page should fail");

        assert_eq!(
            error,
            WspHeaderBlockDecodeError::UnsupportedBinaryEncoding(WspEncodingVersionErrorResponse {
                status_code: 400,
                supported_header: WspEncodingVersionHeader {
                    code_page: Some(0x40),
                    version: None,
                },
            })
        );
    }

    #[test]
    fn encode_falls_back_to_text_header_name_when_peer_cannot_accept_binary_form() {
        let block = WspHeaderBlock {
            headers: vec![WspHeaderField {
                name: "Expect".to_string(),
                value: "100-continue".to_string(),
                name_encoding: WspHeaderNameEncoding::Binary {
                    page: DEFAULT_HEADER_CODE_PAGE,
                },
            }],
            encoding_version_headers: Vec::new(),
        };

        let encoded = encode_header_block(
            &block,
            WspHeaderBlockEncodePolicy {
                recipient_version: Some(WspEncodingVersion::V1_2),
                ..WspHeaderBlockEncodePolicy::STRICT
            },
        )
        .expect("encode");

        assert_eq!(encoded, b"Expect\x00100-continue\0".to_vec());
    }

    #[test]
    fn encode_preserves_explicit_text_header_name_marker() {
        let block = WspHeaderBlock {
            headers: vec![WspHeaderField {
                name: "X-App-Trace".to_string(),
                value: "trace-1".to_string(),
                name_encoding: WspHeaderNameEncoding::Text,
            }],
            encoding_version_headers: Vec::new(),
        };

        let encoded =
            encode_header_block(&block, WspHeaderBlockEncodePolicy::STRICT).expect("encode");

        assert_eq!(encoded, b"X-App-Trace\0trace-1\0".to_vec());
    }

    #[test]
    fn encoding_version_header_value_roundtrips_text_formats() {
        let default_header = WspEncodingVersionHeader {
            code_page: None,
            version: Some(WspEncodingVersion::V1_3),
        };
        assert_eq!(
            parse_encoding_version_header_value("1.3"),
            Some(default_header)
        );
        assert_eq!(format_encoding_version_header_value(default_header), "1.3");

        let page_header = WspEncodingVersionHeader {
            code_page: Some(0x40),
            version: None,
        };
        assert_eq!(parse_encoding_version_header_value("40"), Some(page_header));
        assert_eq!(format_encoding_version_header_value(page_header), "40");
    }

    #[test]
    fn prepares_connectionless_headers_with_versions_and_ordered_list_expansion() {
        let input = WspHeaderBlock {
            headers: vec![
                WspHeaderField {
                    name: "Encoding-Version".to_string(),
                    value: "1.2".to_string(),
                    name_encoding: WspHeaderNameEncoding::Binary { page: 1 },
                },
                WspHeaderField {
                    name: "Accept".to_string(),
                    value: "text/plain, application/\"x,y\"".to_string(),
                    name_encoding: WspHeaderNameEncoding::Binary { page: 1 },
                },
            ],
            encoding_version_headers: Vec::new(),
        };

        let prepared =
            prepare_connectionless_header_block(&input, WspEncodingVersion::V1_4, &[0x40, 0x40]);
        let values: Vec<_> = prepared
            .headers
            .iter()
            .map(|header| (header.name.as_str(), header.value.as_str()))
            .collect();
        assert_eq!(
            values,
            vec![
                ("Accept", "text/plain"),
                ("Accept", "application/\"x,y\""),
                ("Encoding-Version", "1.4"),
                ("Encoding-Version", "40 1.4"),
            ]
        );
    }

    #[test]
    fn strips_encoding_version_at_the_hop_boundary() {
        let prepared = prepare_connectionless_header_block(
            &WspHeaderBlock {
                headers: vec![WspHeaderField {
                    name: "User-Agent".to_string(),
                    value: "WaveNav".to_string(),
                    name_encoding: WspHeaderNameEncoding::Binary { page: 1 },
                }],
                encoding_version_headers: Vec::new(),
            },
            WspEncodingVersion::V1_3,
            &[],
        );
        let forwarded = strip_hop_by_hop_encoding_version(&prepared);
        assert_eq!(forwarded.headers.len(), 1);
        assert_eq!(forwarded.headers[0].name, "User-Agent");
        assert!(forwarded.encoding_version_headers.is_empty());
    }

    #[test]
    fn unsupported_encoding_response_drives_text_compatible_retry_policy() {
        let response = WspEncodingVersionErrorResponse {
            status_code: 400,
            supported_header: WspEncodingVersionHeader {
                code_page: None,
                version: Some(WspEncodingVersion::V1_2),
            },
        };
        assert_eq!(
            retry_recipient_version_after_unsupported_encoding(
                response,
                WspEncodingVersionPolicy::default()
            ),
            WspEncodingVersion::V1_2
        );
        assert_eq!(
            determine_outbound_header_encoding(
                "Expect",
                DEFAULT_HEADER_CODE_PAGE,
                Some(WspEncodingVersion::V1_2),
                &[],
                WspEncodingVersionPolicy::default(),
            ),
            BinaryHeaderEncodingDecision::UseTextFallback
        );
    }
}
