#![allow(dead_code)]

use crate::network::wsp::header_block::{
    decode_header_block, encode_header_block, WspHeaderBlock, WspHeaderBlockDecodeError,
    WspHeaderBlockDecodePolicy, WspHeaderBlockEncodeError, WspHeaderBlockEncodePolicy,
};
use crate::network::wsp::header_registry::{
    decode_pdu_type, encode_pdu_type, WspAssignedNumberPolicy,
};

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
    MethodGet(WspMethodGetPdu),
    MethodPost(WspMethodPostPdu),
    Reply(WspReplyPdu),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspPduDecodeError {
    UnsupportedPduType(u8),
    Truncated,
    InvalidUtf8,
    HeaderBlock(WspHeaderBlockDecodeError),
}

impl std::fmt::Display for WspPduDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedPduType(code) => write!(f, "unsupported WSP PDU type: 0x{code:02X}"),
            Self::Truncated => write!(f, "truncated WSP PDU"),
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wsp::encoding_version::WspEncodingVersion;
    use crate::network::wsp::header_block::{
        WspHeaderBlock, WspHeaderBlockDecodePolicy, WspHeaderBlockEncodePolicy, WspHeaderField,
        WspHeaderNameEncoding,
    };

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

    #[test]
    fn decode_rejects_unsupported_pdu_type() {
        let error = decode_wsp_pdu(&[0x01], WspHeaderBlockDecodePolicy::STRICT)
            .expect_err("connect is not yet implemented");
        assert_eq!(error, WspPduDecodeError::UnsupportedPduType(0x01));
    }

    #[test]
    fn post_decode_rejects_truncated_header_block_length() {
        let encoded = vec![0x60, b'/', 0x00, 10, 0x11, b't', b'e', b'x', b't', 0x00];
        let error = decode_wsp_pdu(&encoded, WspHeaderBlockDecodePolicy::STRICT)
            .expect_err("truncated post should fail");
        assert_eq!(error, WspPduDecodeError::Truncated);
    }
}
