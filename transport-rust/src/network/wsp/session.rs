#![allow(dead_code)]

use crate::network::wsp::header_block::{WspHeaderBlockDecodePolicy, WspHeaderBlockEncodePolicy};
use crate::network::wsp::pdu::{
    decode_wsp_pdu, encode_wsp_pdu, WspConnectPdu, WspConnectReplyPdu, WspPdu, WspPduDecodeError,
    WspPduEncodeError,
};
use crate::network::wsp::WspHeaderBlock;
use crate::wsp_capability::{NegotiatedWspCapabilities, WspCapabilityProposal};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspSessionMode {
    Connectionless,
    ConnectionOriented,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspMethod {
    Get,
    Post,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspMethodRequest {
    pub mode: WspSessionMode,
    pub method: WspMethod,
    pub uri: String,
    pub headers: WspHeaderBlock,
    pub body: Vec<u8>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspMethodResult {
    pub mode: WspSessionMode,
    pub status_code: u16,
    pub headers: WspHeaderBlock,
    pub body: Vec<u8>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspConnectRequest {
    pub mode: WspSessionMode,
    pub version_major: u8,
    pub version_minor: u8,
    pub capabilities: WspCapabilityProposal,
    pub headers: WspHeaderBlock,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspConnectReply {
    pub mode: WspSessionMode,
    pub version_major: u8,
    pub version_minor: u8,
    pub session_id: u16,
    pub negotiated_capabilities: NegotiatedWspCapabilities,
    pub headers: WspHeaderBlock,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspSessionEvent {
    ConnectRequest(WspConnectRequest),
    ConnectReply(WspConnectReply),
    MethodRequest(WspMethodRequest),
    MethodResult(WspMethodResult),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspSessionEventDecodeError {
    Pdu(WspPduDecodeError),
    InvalidPduForMode {
        mode: WspSessionMode,
        pdu_type: &'static str,
    },
}

impl std::fmt::Display for WspSessionEventDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Pdu(error) => write!(f, "{error}"),
            Self::InvalidPduForMode { mode, pdu_type } => {
                write!(f, "{pdu_type} is not valid for {mode}")
            }
        }
    }
}

impl std::error::Error for WspSessionEventDecodeError {}

impl std::fmt::Display for WspSessionMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Connectionless => write!(f, "connectionless mode"),
            Self::ConnectionOriented => write!(f, "connection-oriented mode"),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspSessionEventEncodeError {
    UnsupportedMethodShape,
    Pdu(WspPduEncodeError),
}

impl std::fmt::Display for WspSessionEventEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedMethodShape => write!(f, "unsupported WSP method event shape"),
            Self::Pdu(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for WspSessionEventEncodeError {}

pub fn decode_wsp_session_event(
    input: &[u8],
    mode: WspSessionMode,
    header_policy: WspHeaderBlockDecodePolicy,
) -> Result<WspSessionEvent, WspSessionEventDecodeError> {
    let pdu = decode_wsp_pdu(input, header_policy).map_err(WspSessionEventDecodeError::Pdu)?;
    validate_pdu_for_mode(mode, &pdu)?;
    Ok(classify_wsp_pdu(mode, pdu))
}

pub fn encode_wsp_session_event(
    event: &WspSessionEvent,
    header_policy: WspHeaderBlockEncodePolicy,
) -> Result<Vec<u8>, WspSessionEventEncodeError> {
    let pdu = match event {
        WspSessionEvent::ConnectRequest(connect) => WspPdu::Connect(WspConnectPdu {
            version_major: connect.version_major,
            version_minor: connect.version_minor,
            capabilities: connect.capabilities,
            headers: connect.headers.clone(),
        }),
        WspSessionEvent::ConnectReply(reply) => WspPdu::ConnectReply(WspConnectReplyPdu {
            version_major: reply.version_major,
            version_minor: reply.version_minor,
            session_id: reply.session_id,
            negotiated_capabilities: reply.negotiated_capabilities,
            headers: reply.headers.clone(),
        }),
        WspSessionEvent::MethodRequest(request) => match request.method {
            WspMethod::Get if request.body.is_empty() => {
                WspPdu::MethodGet(crate::network::wsp::WspMethodGetPdu {
                    uri: request.uri.clone(),
                    headers: request.headers.clone(),
                })
            }
            WspMethod::Post => WspPdu::MethodPost(crate::network::wsp::WspMethodPostPdu {
                uri: request.uri.clone(),
                headers: request.headers.clone(),
                body: request.body.clone(),
            }),
            WspMethod::Get => return Err(WspSessionEventEncodeError::UnsupportedMethodShape),
        },
        WspSessionEvent::MethodResult(result) => WspPdu::Reply(crate::network::wsp::WspReplyPdu {
            status_code: result.status_code,
            headers: result.headers.clone(),
            body: result.body.clone(),
        }),
    };

    encode_wsp_pdu(&pdu, header_policy).map_err(WspSessionEventEncodeError::Pdu)
}

pub fn classify_wsp_pdu(mode: WspSessionMode, pdu: WspPdu) -> WspSessionEvent {
    match pdu {
        WspPdu::Connect(connect) => WspSessionEvent::ConnectRequest(WspConnectRequest {
            mode,
            version_major: connect.version_major,
            version_minor: connect.version_minor,
            capabilities: connect.capabilities,
            headers: connect.headers,
        }),
        WspPdu::ConnectReply(reply) => WspSessionEvent::ConnectReply(WspConnectReply {
            mode,
            version_major: reply.version_major,
            version_minor: reply.version_minor,
            session_id: reply.session_id,
            negotiated_capabilities: reply.negotiated_capabilities,
            headers: reply.headers,
        }),
        WspPdu::MethodGet(get) => WspSessionEvent::MethodRequest(WspMethodRequest {
            mode,
            method: WspMethod::Get,
            uri: get.uri,
            headers: get.headers,
            body: Vec::new(),
        }),
        WspPdu::MethodPost(post) => WspSessionEvent::MethodRequest(WspMethodRequest {
            mode,
            method: WspMethod::Post,
            uri: post.uri,
            headers: post.headers,
            body: post.body,
        }),
        WspPdu::Reply(reply) => WspSessionEvent::MethodResult(WspMethodResult {
            mode,
            status_code: reply.status_code,
            headers: reply.headers,
            body: reply.body,
        }),
    }
}

fn validate_pdu_for_mode(
    mode: WspSessionMode,
    pdu: &WspPdu,
) -> Result<(), WspSessionEventDecodeError> {
    let pdu_type = match pdu {
        WspPdu::Connect(_) => "Connect",
        WspPdu::ConnectReply(_) => "ConnectReply",
        WspPdu::MethodGet(_) => "Get",
        WspPdu::MethodPost(_) => "Post",
        WspPdu::Reply(_) => "Reply",
    };

    let valid = matches!(
        (mode, pdu),
        (
            WspSessionMode::Connectionless,
            WspPdu::MethodGet(_) | WspPdu::MethodPost(_) | WspPdu::Reply(_)
        ) | (WspSessionMode::ConnectionOriented, _)
    );

    if valid {
        Ok(())
    } else {
        Err(WspSessionEventDecodeError::InvalidPduForMode { mode, pdu_type })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wsp::decoder::UnsupportedCodePageBehavior;
    use crate::network::wsp::encoder::HeaderEncodePolicy;
    use crate::network::wsp::encoding_version::WspEncodingVersion;
    use crate::network::wsp::{
        WspHeaderBlock, WspHeaderBlockDecodePolicy, WspHeaderBlockEncodePolicy, WspHeaderField,
        WspHeaderNameEncoding,
    };
    use serde::Deserialize;
    use std::fs;
    use std::path::PathBuf;

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct SessionFixture {
        success_cases: Vec<SessionSuccessCase>,
        error_cases: Vec<SessionErrorCase>,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct SessionSuccessCase {
        name: String,
        encoded: Vec<u8>,
        mode: String,
        decode_policy: String,
        encode_policy: String,
        expected: SessionFixtureValue,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct SessionErrorCase {
        name: String,
        encoded: Vec<u8>,
        mode: String,
        decode_policy: String,
        expected_error: String,
    }

    #[derive(Debug, Deserialize)]
    #[serde(tag = "kind", rename_all = "camelCase")]
    enum SessionFixtureValue {
        MethodRequest {
            method: String,
            uri: String,
            headers: Vec<HeaderFixtureValue>,
            body: Vec<u8>,
        },
        MethodResult {
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

    fn load_fixture() -> SessionFixture {
        let fixture_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join("transport")
            .join("wsp_session_method_baseline_mapped")
            .join("session_fixture.json");
        let raw = fs::read_to_string(&fixture_path)
            .unwrap_or_else(|_| panic!("failed reading {}", fixture_path.display()));
        serde_json::from_str(&raw)
            .unwrap_or_else(|error| panic!("failed parsing {}: {error}", fixture_path.display()))
    }

    fn mode(name: &str) -> WspSessionMode {
        match name {
            "connectionless" => WspSessionMode::Connectionless,
            "connection-oriented" => WspSessionMode::ConnectionOriented,
            other => panic!("unsupported mode: {other}"),
        }
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
            let field = WspHeaderField {
                name: header.name,
                value: header.value,
                name_encoding: match header.encoding {
                    HeaderEncodingFixtureValue::Binary { page } => {
                        WspHeaderNameEncoding::Binary { page }
                    }
                    HeaderEncodingFixtureValue::Text => WspHeaderNameEncoding::Text,
                },
            };
            if field.name.eq_ignore_ascii_case("Encoding-Version") {
                out.encoding_version_headers.extend(
                    crate::network::wsp::parse_encoding_version_header_value(&field.value),
                );
            }
            out.headers.push(field);
        }
        out
    }

    fn fixture_event(mode: WspSessionMode, value: SessionFixtureValue) -> WspSessionEvent {
        match value {
            SessionFixtureValue::MethodRequest {
                method,
                uri,
                headers,
                body,
            } => WspSessionEvent::MethodRequest(WspMethodRequest {
                mode,
                method: match method.as_str() {
                    "get" => WspMethod::Get,
                    "post" => WspMethod::Post,
                    other => panic!("unsupported method: {other}"),
                },
                uri,
                headers: fixture_headers(headers),
                body,
            }),
            SessionFixtureValue::MethodResult {
                status_code,
                headers,
                body,
            } => WspSessionEvent::MethodResult(WspMethodResult {
                mode,
                status_code,
                headers: fixture_headers(headers),
                body,
            }),
        }
    }

    #[test]
    fn session_fixture_roundtrips_success_cases() {
        let fixture = load_fixture();
        for case in fixture.success_cases {
            let mode = mode(&case.mode);
            let expected = fixture_event(mode, case.expected);
            let decoded =
                decode_wsp_session_event(&case.encoded, mode, decode_policy(&case.decode_policy))
                    .unwrap_or_else(|error| panic!("case '{}' decode failed: {error}", case.name));
            assert_eq!(decoded, expected, "case '{}' decode mismatch", case.name);

            let encoded = encode_wsp_session_event(&expected, encode_policy(&case.encode_policy))
                .unwrap_or_else(|error| panic!("case '{}' encode failed: {error}", case.name));
            assert_eq!(
                encoded, case.encoded,
                "case '{}' encode mismatch",
                case.name
            );
        }
    }

    #[test]
    fn session_fixture_reports_declared_decode_failures() {
        let fixture = load_fixture();
        for case in fixture.error_cases {
            let error = decode_wsp_session_event(
                &case.encoded,
                mode(&case.mode),
                decode_policy(&case.decode_policy),
            )
            .expect_err(&format!("case '{}' should fail", case.name));
            match case.expected_error.as_str() {
                "unsupported-pdu-type" => assert_eq!(
                    error,
                    WspSessionEventDecodeError::Pdu(WspPduDecodeError::UnsupportedPduType(
                        case.encoded[0]
                    )),
                    "case '{}' mismatch",
                    case.name
                ),
                "truncated" => assert_eq!(
                    error,
                    WspSessionEventDecodeError::Pdu(WspPduDecodeError::Truncated),
                    "case '{}' mismatch",
                    case.name
                ),
                other => panic!("unsupported expected error: {other}"),
            }
        }
    }

    #[test]
    fn rejects_connect_request_for_connectionless_mode() {
        let error = decode_wsp_session_event(
            &[1, 1, 4, 0, 0, 8, 0, 0, 0, 8, 0, 0, 2, 0],
            WspSessionMode::Connectionless,
            WspHeaderBlockDecodePolicy::STRICT,
        )
        .expect_err("connect should be rejected for connectionless mode");

        assert_eq!(
            error,
            WspSessionEventDecodeError::InvalidPduForMode {
                mode: WspSessionMode::Connectionless,
                pdu_type: "Connect",
            }
        );
    }

    #[test]
    fn accepts_reply_for_connectionless_mode() {
        let decoded = decode_wsp_session_event(
            &[4, 0, 200, 5, 67, 49, 46, 52, 0, 60, 119, 109, 108, 47, 62],
            WspSessionMode::Connectionless,
            WspHeaderBlockDecodePolicy {
                negotiated_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderBlockDecodePolicy::STRICT
            },
        )
        .expect("reply should remain valid for connectionless mode");

        assert!(matches!(decoded, WspSessionEvent::MethodResult(_)));
    }

    #[test]
    fn classifies_reply_into_method_result_for_connection_oriented_mode() {
        let event = classify_wsp_pdu(
            WspSessionMode::ConnectionOriented,
            WspPdu::Reply(crate::network::wsp::WspReplyPdu {
                status_code: 200,
                headers: WspHeaderBlock::default(),
                body: b"ok".to_vec(),
            }),
        );

        assert_eq!(
            event,
            WspSessionEvent::MethodResult(WspMethodResult {
                mode: WspSessionMode::ConnectionOriented,
                status_code: 200,
                headers: WspHeaderBlock::default(),
                body: b"ok".to_vec(),
            })
        );
    }
}
