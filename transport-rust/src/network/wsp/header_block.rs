#![allow(dead_code)]

use crate::network::wsp::decoder::{
    HeaderStreamDecodePolicy, UnsupportedCodePageBehavior, WspHeaderStreamDecodeError,
};
use crate::network::wsp::encoder::{HeaderEncodePolicy, WspHeaderEncodeError};
use crate::network::wsp::encoding_version::{
    determine_outbound_header_encoding, incoming_binary_header_status,
    unsupported_binary_error_response, BinaryHeaderEncodingDecision, IncomingBinaryHeaderStatus,
    WspEncodingVersion, WspEncodingVersionErrorResponse, WspEncodingVersionHeader,
    WspEncodingVersionPolicy,
};
use crate::network::wsp::header_registry::{DEFAULT_HEADER_CODE_PAGE, HEADER_CODE_PAGE_SHIFT};
use crate::network::wsp::{decode_header_field_name_on_page, encode_header_field_name};

const TEXT_HEADER_NAME_PREFIX: u8 = 0x7E;

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
        }
    }
}

impl std::error::Error for WspHeaderBlockDecodeError {}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspHeaderBlockEncodeError {
    HeaderName(WspHeaderEncodeError),
}

impl std::fmt::Display for WspHeaderBlockEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::HeaderName(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for WspHeaderBlockEncodeError {}

pub fn decode_header_block(
    input: &[u8],
    policy: WspHeaderBlockDecodePolicy,
) -> Result<WspHeaderBlock, WspHeaderBlockDecodeError> {
    let mut block = WspHeaderBlock::default();
    let mut cursor = 0usize;
    let mut current_page = DEFAULT_HEADER_CODE_PAGE;

    while cursor < input.len() {
        let name_encoding = if input[cursor] == TEXT_HEADER_NAME_PREFIX {
            cursor += 1;
            let name = read_c_string(input, &mut cursor)
                .ok_or(WspHeaderBlockDecodeError::TruncatedTextHeaderName)?;
            WspHeaderField {
                name,
                value: String::new(),
                name_encoding: WspHeaderNameEncoding::Text,
            }
        } else {
            if input[cursor] == HEADER_CODE_PAGE_SHIFT {
                let Some(next_page) = input.get(cursor + 1).copied() else {
                    return Err(WspHeaderBlockDecodeError::HeaderName(
                        WspHeaderStreamDecodeError::TruncatedShiftSequence,
                    ));
                };
                current_page = next_page;
                cursor += 2;
            }

            let Some(code) = input.get(cursor).copied() else {
                return Err(WspHeaderBlockDecodeError::TruncatedHeaderValue);
            };
            cursor += 1;

            let name = decode_header_field_name_on_page(
                current_page,
                code,
                policy.header_stream.assigned_numbers,
            )
            .map_err(|error| {
                WspHeaderBlockDecodeError::HeaderName(
                    WspHeaderStreamDecodeError::UnknownAssignedNumber(error),
                )
            })?
            .ok_or({
                WspHeaderBlockDecodeError::HeaderName(
                    WspHeaderStreamDecodeError::UnsupportedCodePage(current_page),
                )
            })?;

            let status = incoming_binary_header_status(
                name,
                current_page,
                policy.negotiated_version,
                policy.negotiated_extension_pages,
                policy.encoding_version,
            );
            match status {
                IncomingBinaryHeaderStatus::Accepted => {}
                IncomingBinaryHeaderStatus::UnsupportedEncodingVersion => {
                    return Err(WspHeaderBlockDecodeError::UnsupportedBinaryEncoding(
                        unsupported_binary_error_response(None, policy.encoding_version),
                    ));
                }
                IncomingBinaryHeaderStatus::UnsupportedCodePage => {
                    return Err(WspHeaderBlockDecodeError::UnsupportedBinaryEncoding(
                        unsupported_binary_error_response(
                            Some(current_page),
                            policy.encoding_version,
                        ),
                    ));
                }
            }

            WspHeaderField {
                name: name.to_string(),
                value: String::new(),
                name_encoding: WspHeaderNameEncoding::Binary { page: current_page },
            }
        };

        let value = read_c_string(input, &mut cursor)
            .ok_or(WspHeaderBlockDecodeError::TruncatedHeaderValue)?;

        let mut field = name_encoding;
        field.value = value;
        if field.name.eq_ignore_ascii_case("Encoding-Version") {
            if let Some(header) = parse_encoding_version_header_value(&field.value) {
                block.encoding_version_headers.push(header);
            }
        }
        block.headers.push(field);
    }

    Ok(block)
}

pub fn encode_header_block(
    block: &WspHeaderBlock,
    policy: WspHeaderBlockEncodePolicy,
) -> Result<Vec<u8>, WspHeaderBlockEncodeError> {
    let mut out = Vec::new();

    for header in &block.headers {
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
            }
            BinaryHeaderEncodingDecision::UseTextFallback
            | BinaryHeaderEncodingDecision::UnsupportedCodePage => {
                out.push(TEXT_HEADER_NAME_PREFIX);
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

fn read_c_string(input: &[u8], cursor: &mut usize) -> Option<String> {
    let start = *cursor;
    let nul_index = input.get(start..)?.iter().position(|byte| *byte == 0x00)?;
    let end = start + nul_index;
    *cursor = end + 1;
    Some(String::from_utf8_lossy(&input[start..end]).to_string())
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

    #[test]
    fn decodes_binary_header_block_and_collects_encoding_version_headers() {
        let input = [
            0x11, b't', b'e', b'x', b't', b'/', b'v', b'n', b'd', b'.', b'w', b'a', b'p', b'.',
            b'w', b'm', b'l', 0x00, 0x43, b'1', b'.', b'3', 0x00,
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
        let input = [
            0x45, b'a', b't', b't', b'a', b'c', b'h', b';', b'f', b'i', b'l', b'e', 0x00,
        ];
        let error = decode_header_block(
            &input,
            WspHeaderBlockDecodePolicy {
                negotiated_version: Some(WspEncodingVersion::V1_3),
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
        let input = [HEADER_CODE_PAGE_SHIFT, 0x40, 0x10, b'1', 0x00];
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
                name: "Content-Disposition".to_string(),
                value: "attachment".to_string(),
                name_encoding: WspHeaderNameEncoding::Binary {
                    page: DEFAULT_HEADER_CODE_PAGE,
                },
            }],
            encoding_version_headers: Vec::new(),
        };

        let encoded = encode_header_block(
            &block,
            WspHeaderBlockEncodePolicy {
                recipient_version: Some(WspEncodingVersion::V1_3),
                ..WspHeaderBlockEncodePolicy::STRICT
            },
        )
        .expect("encode");

        assert_eq!(encoded, b"~Content-Disposition\0attachment\0".to_vec());
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
}
