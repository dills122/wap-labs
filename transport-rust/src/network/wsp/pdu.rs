#![allow(dead_code)]

use crate::network::wsp::header_block::{
    decode_header_block, encode_header_block, WspHeaderBlock, WspHeaderBlockDecodeError,
    WspHeaderBlockDecodePolicy, WspHeaderBlockEncodeError, WspHeaderBlockEncodePolicy,
};
use crate::network::wsp::header_registry::{
    decode_pdu_type, encode_pdu_type, WspAssignedNumberPolicy,
};
use crate::wsp_capability::{NegotiatedWspCapabilities, WspCapabilityProposal, WspMode};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspConnectPdu {
    pub version_major: u8,
    pub version_minor: u8,
    pub capabilities: WspCapabilityProposal,
    pub headers: WspHeaderBlock,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspConnectReplyPdu {
    pub version_major: u8,
    pub version_minor: u8,
    pub session_id: u16,
    pub negotiated_capabilities: NegotiatedWspCapabilities,
    pub headers: WspHeaderBlock,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspMethodGetPdu {
    pub uri: String,
    pub headers: WspHeaderBlock,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspMethodPostPdu {
    pub uri: String,
    pub headers: WspHeaderBlock,
    pub body: Vec<u8>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspReplyPdu {
    pub status_code: u16,
    pub headers: WspHeaderBlock,
    pub body: Vec<u8>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspPdu {
    Connect(WspConnectPdu),
    ConnectReply(WspConnectReplyPdu),
    MethodGet(WspMethodGetPdu),
    MethodPost(WspMethodPostPdu),
    Reply(WspReplyPdu),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspPduDecodeError {
    UnsupportedPduType(u8),
    Truncated,
    TrailingBytes,
    InvalidUtf8,
    HeaderBlock(WspHeaderBlockDecodeError),
}

impl std::fmt::Display for WspPduDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedPduType(code) => write!(f, "unsupported WSP PDU type: 0x{code:02X}"),
            Self::Truncated => write!(f, "truncated WSP PDU"),
            Self::TrailingBytes => write!(f, "unexpected trailing bytes in WSP PDU"),
            Self::InvalidUtf8 => write!(f, "invalid UTF-8 in WSP textual field"),
            Self::HeaderBlock(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for WspPduDecodeError {}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspPduEncodeError {
    UnsupportedPduShape,
    HeaderBlock(WspHeaderBlockEncodeError),
}

impl std::fmt::Display for WspPduEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedPduShape => write!(f, "unsupported WSP PDU shape"),
            Self::HeaderBlock(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for WspPduEncodeError {}

pub fn decode_wsp_pdu(
    input: &[u8],
    header_policy: WspHeaderBlockDecodePolicy,
) -> Result<WspPdu, WspPduDecodeError> {
    let Some((&pdu_type, rest)) = input.split_first() else {
        return Err(WspPduDecodeError::Truncated);
    };

    let decoded_type = decode_pdu_type(pdu_type, WspAssignedNumberPolicy::STRICT)
        .map_err(|_| WspPduDecodeError::UnsupportedPduType(pdu_type))?
        .ok_or(WspPduDecodeError::UnsupportedPduType(pdu_type))?;

    match decoded_type {
        "Connect" => {
            if rest.len() < 13 {
                return Err(WspPduDecodeError::Truncated);
            }
            let version_major = rest[0];
            let version_minor = rest[1];
            let capabilities = decode_capability_proposal(&rest[2..12]);
            let (header_bytes, remaining) = split_length_prefixed_block(&rest[12..])?;
            reject_trailing_bytes(remaining)?;
            let headers = decode_header_block(header_bytes, header_policy)
                .map_err(WspPduDecodeError::HeaderBlock)?;
            Ok(WspPdu::Connect(WspConnectPdu {
                version_major,
                version_minor,
                capabilities,
                headers,
            }))
        }
        "ConnectReply" => {
            if rest.len() < 15 {
                return Err(WspPduDecodeError::Truncated);
            }
            let version_major = rest[0];
            let version_minor = rest[1];
            let session_id = u16::from_be_bytes([rest[2], rest[3]]);
            let negotiated_capabilities =
                decode_negotiated_capabilities(WspMode::ConnectionOriented, &rest[4..14]);
            let (header_bytes, remaining) = split_length_prefixed_block(&rest[14..])?;
            reject_trailing_bytes(remaining)?;
            let headers = decode_header_block(header_bytes, header_policy)
                .map_err(WspPduDecodeError::HeaderBlock)?;
            Ok(WspPdu::ConnectReply(WspConnectReplyPdu {
                version_major,
                version_minor,
                session_id,
                negotiated_capabilities,
                headers,
            }))
        }
        "Get" => {
            let (uri, header_bytes) = split_c_string(rest)?;
            let headers = decode_header_block(header_bytes, header_policy)
                .map_err(WspPduDecodeError::HeaderBlock)?;
            Ok(WspPdu::MethodGet(WspMethodGetPdu { uri, headers }))
        }
        "Post" => {
            let (uri, remainder) = split_c_string(rest)?;
            let (header_bytes, body) = split_length_prefixed_block(remainder)?;
            let headers = decode_header_block(header_bytes, header_policy)
                .map_err(WspPduDecodeError::HeaderBlock)?;
            Ok(WspPdu::MethodPost(WspMethodPostPdu {
                uri,
                headers,
                body: body.to_vec(),
            }))
        }
        "Reply" => {
            if rest.len() < 2 {
                return Err(WspPduDecodeError::Truncated);
            }
            let status_code = u16::from_be_bytes([rest[0], rest[1]]);
            let (header_bytes, body) = split_length_prefixed_block(&rest[2..])?;
            let headers = decode_header_block(header_bytes, header_policy)
                .map_err(WspPduDecodeError::HeaderBlock)?;
            Ok(WspPdu::Reply(WspReplyPdu {
                status_code,
                headers,
                body: body.to_vec(),
            }))
        }
        _ => Err(WspPduDecodeError::UnsupportedPduType(pdu_type)),
    }
}

pub fn encode_wsp_pdu(
    pdu: &WspPdu,
    header_policy: WspHeaderBlockEncodePolicy,
) -> Result<Vec<u8>, WspPduEncodeError> {
    match pdu {
        WspPdu::Connect(connect) => {
            let headers = encode_header_block(&connect.headers, header_policy)
                .map_err(WspPduEncodeError::HeaderBlock)?;
            let mut out =
                vec![encode_pdu_type("Connect").ok_or(WspPduEncodeError::UnsupportedPduShape)?];
            out.push(connect.version_major);
            out.push(connect.version_minor);
            out.extend_from_slice(&encode_capability_proposal(connect.capabilities));
            out.push(
                u8::try_from(headers.len()).map_err(|_| WspPduEncodeError::UnsupportedPduShape)?,
            );
            out.extend_from_slice(&headers);
            Ok(out)
        }
        WspPdu::ConnectReply(reply) => {
            let headers = encode_header_block(&reply.headers, header_policy)
                .map_err(WspPduEncodeError::HeaderBlock)?;
            let mut out =
                vec![encode_pdu_type("ConnectReply")
                    .ok_or(WspPduEncodeError::UnsupportedPduShape)?];
            out.push(reply.version_major);
            out.push(reply.version_minor);
            out.extend_from_slice(&reply.session_id.to_be_bytes());
            out.extend_from_slice(&encode_negotiated_capabilities(
                reply.negotiated_capabilities,
            ));
            out.push(
                u8::try_from(headers.len()).map_err(|_| WspPduEncodeError::UnsupportedPduShape)?,
            );
            out.extend_from_slice(&headers);
            Ok(out)
        }
        WspPdu::MethodGet(get) => {
            let mut out =
                vec![encode_pdu_type("Get").ok_or(WspPduEncodeError::UnsupportedPduShape)?];
            out.extend_from_slice(get.uri.as_bytes());
            out.push(0x00);
            out.extend_from_slice(
                &encode_header_block(&get.headers, header_policy)
                    .map_err(WspPduEncodeError::HeaderBlock)?,
            );
            Ok(out)
        }
        WspPdu::MethodPost(post) => {
            let headers = encode_header_block(&post.headers, header_policy)
                .map_err(WspPduEncodeError::HeaderBlock)?;
            let mut out =
                vec![encode_pdu_type("Post").ok_or(WspPduEncodeError::UnsupportedPduShape)?];
            out.extend_from_slice(post.uri.as_bytes());
            out.push(0x00);
            out.push(
                u8::try_from(headers.len()).map_err(|_| WspPduEncodeError::UnsupportedPduShape)?,
            );
            out.extend_from_slice(&headers);
            out.extend_from_slice(&post.body);
            Ok(out)
        }
        WspPdu::Reply(reply) => {
            let headers = encode_header_block(&reply.headers, header_policy)
                .map_err(WspPduEncodeError::HeaderBlock)?;
            let mut out =
                vec![encode_pdu_type("Reply").ok_or(WspPduEncodeError::UnsupportedPduShape)?];
            out.extend_from_slice(&reply.status_code.to_be_bytes());
            out.push(
                u8::try_from(headers.len()).map_err(|_| WspPduEncodeError::UnsupportedPduShape)?,
            );
            out.extend_from_slice(&headers);
            out.extend_from_slice(&reply.body);
            Ok(out)
        }
    }
}

fn split_c_string(input: &[u8]) -> Result<(String, &[u8]), WspPduDecodeError> {
    let Some(nul_index) = input.iter().position(|byte| *byte == 0x00) else {
        return Err(WspPduDecodeError::Truncated);
    };
    let text =
        std::str::from_utf8(&input[..nul_index]).map_err(|_| WspPduDecodeError::InvalidUtf8)?;
    Ok((text.to_string(), &input[nul_index + 1..]))
}

fn split_length_prefixed_block(input: &[u8]) -> Result<(&[u8], &[u8]), WspPduDecodeError> {
    let Some((&length, rest)) = input.split_first() else {
        return Err(WspPduDecodeError::Truncated);
    };
    let length = usize::from(length);
    if rest.len() < length {
        return Err(WspPduDecodeError::Truncated);
    }
    Ok(rest.split_at(length))
}

fn reject_trailing_bytes(input: &[u8]) -> Result<(), WspPduDecodeError> {
    if input.is_empty() {
        Ok(())
    } else {
        Err(WspPduDecodeError::TrailingBytes)
    }
}

fn encode_option_u32(value: Option<u32>) -> [u8; 4] {
    value.unwrap_or(0).to_be_bytes()
}

fn decode_option_u32(bytes: &[u8]) -> Option<u32> {
    let value = u32::from_be_bytes(bytes.try_into().expect("u32 field length"));
    (value != 0).then_some(value)
}

fn encode_option_u16(value: Option<u16>) -> [u8; 2] {
    value.unwrap_or(0).to_be_bytes()
}

fn decode_option_u16(bytes: &[u8]) -> Option<u16> {
    let value = u16::from_be_bytes(bytes.try_into().expect("u16 field length"));
    (value != 0).then_some(value)
}

fn encode_capability_proposal(proposal: WspCapabilityProposal) -> [u8; 10] {
    let mut out = [0u8; 10];
    out[0..4].copy_from_slice(&encode_option_u32(proposal.client_message_size));
    out[4..8].copy_from_slice(&encode_option_u32(proposal.server_message_size));
    out[8..10].copy_from_slice(&encode_option_u16(proposal.max_outstanding_requests));
    out
}

fn decode_capability_proposal(bytes: &[u8]) -> WspCapabilityProposal {
    WspCapabilityProposal {
        client_message_size: decode_option_u32(&bytes[0..4]),
        server_message_size: decode_option_u32(&bytes[4..8]),
        max_outstanding_requests: decode_option_u16(&bytes[8..10]),
    }
}

fn encode_negotiated_capabilities(negotiated: NegotiatedWspCapabilities) -> [u8; 10] {
    let mut out = [0u8; 10];
    out[0..4].copy_from_slice(&encode_option_u32(negotiated.client_message_size));
    out[4..8].copy_from_slice(&encode_option_u32(negotiated.server_message_size));
    out[8..10].copy_from_slice(&encode_option_u16(negotiated.max_outstanding_requests));
    out
}

fn decode_negotiated_capabilities(mode: WspMode, bytes: &[u8]) -> NegotiatedWspCapabilities {
    NegotiatedWspCapabilities {
        mode,
        client_message_size: decode_option_u32(&bytes[0..4]),
        server_message_size: decode_option_u32(&bytes[4..8]),
        max_outstanding_requests: decode_option_u16(&bytes[8..10]),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wsp::decoder::UnsupportedCodePageBehavior;
    use crate::network::wsp::encoder::HeaderEncodePolicy;
    use crate::network::wsp::encoding_version::WspEncodingVersion;
    use crate::network::wsp::header_block::{
        WspHeaderBlock, WspHeaderBlockDecodePolicy, WspHeaderBlockEncodePolicy, WspHeaderField,
        WspHeaderNameEncoding,
    };
    use serde::Deserialize;
    use std::fs;
    use std::path::PathBuf;

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct PduFixture {
        success_cases: Vec<PduSuccessCase>,
        error_cases: Vec<PduErrorCase>,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct PduSuccessCase {
        name: String,
        encoded: Vec<u8>,
        decode_policy: String,
        encode_policy: String,
        expected: PduFixtureValue,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct PduErrorCase {
        name: String,
        encoded: Vec<u8>,
        decode_policy: String,
        expected_error: String,
        unsupported_pdu_type: Option<u8>,
    }

    #[derive(Debug, Deserialize)]
    #[serde(tag = "kind", rename_all = "camelCase")]
    enum PduFixtureValue {
        MethodGet {
            uri: String,
            headers: Vec<HeaderFixtureValue>,
        },
        MethodPost {
            uri: String,
            headers: Vec<HeaderFixtureValue>,
            body: Vec<u8>,
        },
        Reply {
            status_code: u16,
            headers: Vec<HeaderFixtureValue>,
            body: Vec<u8>,
        },
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct HeaderFixtureValue {
        name: String,
        value: String,
        encoding: HeaderEncodingFixtureValue,
    }

    #[derive(Debug, Deserialize)]
    #[serde(tag = "kind", rename_all = "camelCase")]
    enum HeaderEncodingFixtureValue {
        Binary { page: u8 },
        Text,
    }

    fn load_fixture() -> PduFixture {
        let fixture_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join("transport")
            .join("wsp_pdu_baseline_mapped")
            .join("pdu_fixture.json");
        let raw = fs::read_to_string(&fixture_path)
            .unwrap_or_else(|_| panic!("failed reading {}", fixture_path.display()));
        serde_json::from_str(&raw)
            .unwrap_or_else(|error| panic!("failed parsing {}: {error}", fixture_path.display()))
    }

    fn decode_policy(name: &str) -> WspHeaderBlockDecodePolicy {
        match name {
            "strict" => WspHeaderBlockDecodePolicy::STRICT,
            "strict-v14" => WspHeaderBlockDecodePolicy {
                negotiated_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderBlockDecodePolicy::STRICT
            },
            other => panic!("unsupported decode policy: {other}"),
        }
    }

    fn encode_policy(name: &str) -> WspHeaderBlockEncodePolicy {
        match name {
            "strict" => WspHeaderBlockEncodePolicy::STRICT,
            "strict-v14" => WspHeaderBlockEncodePolicy {
                recipient_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderBlockEncodePolicy::STRICT
            },
            "text-fallback" => WspHeaderBlockEncodePolicy {
                header_name_policy: HeaderEncodePolicy {
                    binary_encoding: true,
                    unsupported_code_page: UnsupportedCodePageBehavior::IgnoreExtensionHeaders,
                },
                ..WspHeaderBlockEncodePolicy::STRICT
            },
            other => panic!("unsupported encode policy: {other}"),
        }
    }

    fn fixture_headers(headers: Vec<HeaderFixtureValue>) -> WspHeaderBlock {
        let mut out = WspHeaderBlock::default();
        for header in headers {
            let name_encoding = match header.encoding {
                HeaderEncodingFixtureValue::Binary { page } => {
                    WspHeaderNameEncoding::Binary { page }
                }
                HeaderEncodingFixtureValue::Text => WspHeaderNameEncoding::Text,
            };
            let field = WspHeaderField {
                name: header.name,
                value: header.value,
                name_encoding,
            };
            if field.name.eq_ignore_ascii_case("Encoding-Version") {
                out.encoding_version_headers.extend(
                    crate::network::wsp::header_block::parse_encoding_version_header_value(
                        &field.value,
                    ),
                );
            }
            out.headers.push(field);
        }
        out
    }

    fn fixture_pdu(value: PduFixtureValue) -> WspPdu {
        match value {
            PduFixtureValue::MethodGet { uri, headers } => WspPdu::MethodGet(WspMethodGetPdu {
                uri,
                headers: fixture_headers(headers),
            }),
            PduFixtureValue::MethodPost { uri, headers, body } => {
                WspPdu::MethodPost(WspMethodPostPdu {
                    uri,
                    headers: fixture_headers(headers),
                    body,
                })
            }
            PduFixtureValue::Reply {
                status_code,
                headers,
                body,
            } => WspPdu::Reply(WspReplyPdu {
                status_code,
                headers: fixture_headers(headers),
                body,
            }),
        }
    }

    fn content_type_header_block() -> WspHeaderBlock {
        WspHeaderBlock {
            headers: vec![WspHeaderField {
                name: "Content-Type".to_string(),
                value: "text/vnd.wap.wml".to_string(),
                name_encoding: WspHeaderNameEncoding::Binary { page: 0x01 },
            }],
            encoding_version_headers: Vec::new(),
        }
    }

    #[test]
    fn pdu_fixture_roundtrips_success_cases() {
        let fixture = load_fixture();
        for case in fixture.success_cases {
            let expected = fixture_pdu(case.expected);
            let decoded = decode_wsp_pdu(&case.encoded, decode_policy(&case.decode_policy))
                .unwrap_or_else(|error| panic!("case '{}' decode failed: {error}", case.name));
            assert_eq!(decoded, expected, "case '{}' decode mismatch", case.name);

            let encoded = encode_wsp_pdu(&expected, encode_policy(&case.encode_policy))
                .unwrap_or_else(|error| panic!("case '{}' encode failed: {error}", case.name));
            assert_eq!(
                encoded, case.encoded,
                "case '{}' encode mismatch",
                case.name
            );
        }
    }

    #[test]
    fn pdu_fixture_reports_declared_decode_failures() {
        let fixture = load_fixture();
        for case in fixture.error_cases {
            let error = decode_wsp_pdu(&case.encoded, decode_policy(&case.decode_policy))
                .expect_err(&format!("case '{}' should fail", case.name));
            match case.expected_error.as_str() {
                "unsupported-pdu-type" => assert_eq!(
                    error,
                    WspPduDecodeError::UnsupportedPduType(
                        case.unsupported_pdu_type
                            .expect("unsupported-pdu-type cases require a code")
                    ),
                    "case '{}' mismatch",
                    case.name
                ),
                "truncated" => {
                    assert_eq!(
                        error,
                        WspPduDecodeError::Truncated,
                        "case '{}' mismatch",
                        case.name
                    )
                }
                "trailing-bytes" => {
                    assert_eq!(
                        error,
                        WspPduDecodeError::TrailingBytes,
                        "case '{}' mismatch",
                        case.name
                    )
                }
                other => panic!("unsupported expected error: {other}"),
            }
        }
    }

    #[test]
    fn connect_rejects_trailing_bytes_after_header_block() {
        let error = decode_wsp_pdu(
            &[1, 1, 4, 0, 0, 8, 0, 0, 0, 8, 0, 0, 2, 0, 0xAA],
            WspHeaderBlockDecodePolicy::STRICT,
        )
        .expect_err("connect should reject trailing bytes");

        assert_eq!(error, WspPduDecodeError::TrailingBytes);
    }

    #[test]
    fn connect_reply_rejects_trailing_bytes_after_header_block() {
        let error = decode_wsp_pdu(
            &[2, 1, 4, 0, 7, 0, 0, 8, 0, 0, 0, 8, 0, 0, 2, 0, 0xAA],
            WspHeaderBlockDecodePolicy::STRICT,
        )
        .expect_err("connect reply should reject trailing bytes");

        assert_eq!(error, WspPduDecodeError::TrailingBytes);
    }

    #[test]
    fn method_get_roundtrips_through_minimal_pdu_codec() {
        let pdu = WspPdu::MethodGet(WspMethodGetPdu {
            uri: "/deck.wml".to_string(),
            headers: content_type_header_block(),
        });

        let encoded = encode_wsp_pdu(&pdu, WspHeaderBlockEncodePolicy::STRICT)
            .expect("encode should succeed");
        let decoded = decode_wsp_pdu(
            &encoded,
            WspHeaderBlockDecodePolicy {
                negotiated_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderBlockDecodePolicy::STRICT
            },
        )
        .expect("decode should succeed");

        assert_eq!(decoded, pdu);
    }

    #[test]
    fn reply_roundtrips_status_headers_and_body() {
        let pdu = WspPdu::Reply(WspReplyPdu {
            status_code: 200,
            headers: content_type_header_block(),
            body: b"<wml/>".to_vec(),
        });

        let encoded = encode_wsp_pdu(&pdu, WspHeaderBlockEncodePolicy::STRICT)
            .expect("encode should succeed");
        let decoded = decode_wsp_pdu(
            &encoded,
            WspHeaderBlockDecodePolicy {
                negotiated_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderBlockDecodePolicy::STRICT
            },
        )
        .expect("decode should succeed");

        assert_eq!(decoded, pdu);
    }
}
