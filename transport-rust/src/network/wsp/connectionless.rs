//! Connectionless (session-less) WSP framing used by the live native fetch path.
//!
//! The effective WAP-203 connectionless framing used over WDP/UDP — the one the
//! `wap-net-core` transport profile actually speaks to the gateway — prefixes
//! every selected PDU with a transaction id, length-prefixes the request URI and
//! header section with `uintvar` values, and encodes reply status as a single
//! assigned-number octet. The effective source order is WAP-203-WSP followed by
//! SINs 001, 003, and 005.
//!
//! The two framings are therefore not byte-compatible, which is why this module
//! exists instead of `native_fetch.rs` calling [`crate::network::wsp::pdu::encode_wsp_pdu`]
//! directly. What is shared is everything that is genuinely common: the assigned
//! number tables in [`crate::network::wsp::header_registry`] (PDU types, header
//! field names) and the header representation in
//! [`crate::network::wsp::header_block`] ([`WspHeaderBlock`] / `WspHeaderField`).
//! `native_fetch.rs` owns no wire-format code of its own.

use crate::network::wsp::header_block::{WspHeaderBlock, WspHeaderNameEncoding};
use crate::network::wsp::header_registry::{
    decode_pdu_type, decode_well_known_parameter, encode_header_field_name_on_page,
    encode_pdu_type, WspAssignedNumberPolicy, DEFAULT_HEADER_CODE_PAGE,
};
use crate::network::wsp::header_value::{
    encode_version_value as encode_wsp_version_value, WspVersionValue,
};

/// High bit marking a well-known (binary) WSP field name or short-integer value.
const WELL_KNOWN_MARKER: u8 = 0x80;
/// Largest value representable by the five-octet `uintvar` form (WAP-203-WSP
/// caps `uintvar` at 32 bits; 5 octets of 7 bits each provide 35 bits of
/// capacity, so the full 32-bit range fits).
const MAX_UINTVAR_VALUE: usize = 0xFFFF_FFFF;
/// Highest first octet still interpreted as a content-type short-length prefix.
const MAX_SHORT_LENGTH: u8 = 30;
/// WSP length-quote introducing a `uintvar` length.
const LENGTH_QUOTE: u8 = 31;
/// RFC 2045 quoted-string escape byte used by WSP token-text.
const TEXT_STRING_QUOTE: u8 = 0x7F;
/// Assigned-number name of the reply PDU this transport expects back.
const REPLY_PDU_TYPE_NAME: &str = "Reply";

/// Well-known media types this transport can encode/decode in short-integer form.
const WELL_KNOWN_MEDIA_TYPES: &[(u8, &str)] = &[
    (0x03, "text/plain"),
    (0x08, "text/vnd.wap.wml"),
    (0x14, "application/vnd.wap.wmlc"),
    (0x28, "text/xml"),
    (0x29, "application/xml"),
];

/// Header field names whose values may be compacted to a well-known media octet.
const MEDIA_VALUED_HEADER_NAMES: &[&str] = &["Accept", "Content-Type"];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspConnectionlessMethod {
    Get,
    Post,
}

impl WspConnectionlessMethod {
    pub(crate) fn from_http_method(method: &str) -> Option<Self> {
        match method {
            "GET" => Some(Self::Get),
            "POST" => Some(Self::Post),
            _ => None,
        }
    }
}

pub(crate) struct WspConnectionlessRequest<'a> {
    pub(crate) transaction_id: u8,
    pub(crate) method: WspConnectionlessMethod,
    pub(crate) uri: &'a str,
    pub(crate) headers: &'a WspHeaderBlock,
    pub(crate) content_type: Option<&'a str>,
    pub(crate) body: &'a [u8],
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct WspConnectionlessReply {
    pub(crate) status_code: u16,
    pub(crate) content_type: String,
    pub(crate) headers: Vec<u8>,
    pub(crate) body: Vec<u8>,
}

/// Effective WAP-203 connectionless PDU shapes selected by the Class C client
/// profile. Header bytes remain opaque here so WSP-801 can preserve their exact
/// order and contents without claiming the WSP-802 registry and encoding-version
/// closure.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspConnectionlessPdu {
    Get {
        transaction_id: u8,
        uri: String,
        headers: Vec<u8>,
    },
    Post {
        transaction_id: u8,
        uri: String,
        content_type: DecodedWspContentType,
        headers: Vec<u8>,
        body: Vec<u8>,
    },
    Reply {
        transaction_id: u8,
        status_code: u16,
        content_type: DecodedWspContentType,
        headers: Vec<u8>,
        body: Vec<u8>,
    },
}

impl WspConnectionlessPdu {
    pub fn transaction_id(&self) -> u8 {
        match self {
            Self::Get { transaction_id, .. }
            | Self::Post { transaction_id, .. }
            | Self::Reply { transaction_id, .. } => *transaction_id,
        }
    }
}

/// A decoded WSP Content-Type value plus the carrying-protocol charset metadata.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DecodedWspContentType {
    media_type: String,
    charset: Option<String>,
    consumed_bytes: usize,
    encoded: Vec<u8>,
}

impl DecodedWspContentType {
    fn new(
        media_type: String,
        charset: Option<String>,
        consumed_bytes: usize,
        encoded: Vec<u8>,
    ) -> Self {
        Self {
            media_type,
            charset,
            consumed_bytes,
            encoded,
        }
    }

    pub fn from_text(media_type: &str) -> Result<Self, WspConnectionlessEncodeError> {
        let media_type = media_type.trim();
        if media_type.is_empty() {
            return Err(WspConnectionlessEncodeError::MissingPostContentType);
        }
        let encoded = encode_content_type_field(Some(media_type))?;
        Ok(Self::new(
            media_type.to_string(),
            None,
            encoded.len(),
            encoded,
        ))
    }

    pub fn media_type(&self) -> &str {
        &self.media_type
    }

    pub fn charset(&self) -> Option<&str> {
        self.charset.as_deref()
    }

    pub fn consumed_bytes(&self) -> usize {
        self.consumed_bytes
    }

    pub fn encoded(&self) -> &[u8] {
        &self.encoded
    }

    fn as_mime_value(&self) -> String {
        match self.charset() {
            Some(charset) => format!("{}; charset={charset}", self.media_type()),
            None => self.media_type.clone(),
        }
    }
}

/// A decoded WSP text-string plus the number of raw input bytes it consumed.
///
/// The two values are deliberately not derivable from one another: a leading
/// [`TEXT_STRING_QUOTE`] byte is stripped from `text` but still counts toward
/// `consumed_bytes`, so quoted and unquoted strings of the same visible length
/// consume different amounts of input. Fields are private so a caller cannot
/// reconstruct a length from `text.len()` and get it wrong.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct DecodedWspText {
    text: String,
    consumed_bytes: usize,
}

impl DecodedWspText {
    fn new(text: String, consumed_bytes: usize) -> Self {
        Self {
            text,
            consumed_bytes,
        }
    }

    pub(crate) fn text(&self) -> &str {
        &self.text
    }

    pub(crate) fn consumed_bytes(&self) -> usize {
        self.consumed_bytes
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspConnectionlessEncodeError {
    UnassignedPduType(&'static str),
    ContentTypeContainsNul,
    MissingPostContentType,
    GetBodyNotAllowed,
    UriContainsNul,
    UnsupportedStatusCode(u16),
    LengthExceedsUintvarRange(usize),
}

impl std::fmt::Display for WspConnectionlessEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnassignedPduType(name) => write!(f, "unassigned WSP PDU type: {name}"),
            Self::ContentTypeContainsNul => {
                write!(f, "native WSP POST content type must not contain NUL bytes")
            }
            Self::MissingPostContentType => {
                write!(f, "native WSP POST requires a Content-Type field")
            }
            Self::GetBodyNotAllowed => {
                write!(f, "native WSP GET must not carry a request body")
            }
            Self::UriContainsNul => {
                write!(f, "native WSP request URI must not contain NUL bytes")
            }
            Self::UnsupportedStatusCode(status) => {
                write!(f, "unsupported native WSP HTTP status code: {status}")
            }
            Self::LengthExceedsUintvarRange(value) => {
                write!(f, "value too large for uintvar encoding: {value}")
            }
        }
    }
}

impl std::error::Error for WspConnectionlessEncodeError {}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspConnectionlessDecodeError {
    MissingTransactionId,
    TransactionIdMismatch { expected: u8, actual: u8 },
    MissingPduType,
    UnexpectedPduType(u8),
    MissingStatus,
    TruncatedUintvar,
    UintvarOverflow,
    TruncatedUri,
    UriContainsNul,
    InvalidUriUtf8(String),
    TruncatedHeaderSection,
    MissingContentType,
    TruncatedContentType,
    ContentTypeOverrunsHeaderSection,
    UnsupportedWellKnownMedia(u8),
    UnsupportedCharsetMibEnum(u8),
    TruncatedTextString,
    InvalidTextStringUtf8(String),
    UnsupportedStatusCode(u8),
}

impl std::fmt::Display for WspConnectionlessDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::MissingTransactionId => {
                write!(f, "truncated native WSP reply: missing transaction id")
            }
            Self::TransactionIdMismatch { expected, actual } => write!(
                f,
                "unexpected native WSP reply transaction id: expected {expected}, got {actual}"
            ),
            Self::MissingPduType => write!(f, "truncated native WSP reply: missing pdu type"),
            Self::UnexpectedPduType(code) => write!(
                f,
                "unexpected native WSP reply pdu type: expected 0x04, got 0x{code:02X}"
            ),
            Self::MissingStatus => write!(f, "truncated native WSP reply: missing status"),
            Self::TruncatedUintvar => write!(f, "truncated uintvar"),
            Self::UintvarOverflow => write!(f, "uintvar exceeds the 32-bit WSP range"),
            Self::TruncatedUri => write!(f, "truncated native WSP request URI"),
            Self::UriContainsNul => {
                write!(f, "native WSP request URI contains a forbidden NUL byte")
            }
            Self::InvalidUriUtf8(error) => {
                write!(f, "invalid utf-8 in native WSP request URI: {error}")
            }
            Self::TruncatedHeaderSection => {
                write!(f, "truncated native WSP reply: headers section incomplete")
            }
            Self::MissingContentType => {
                write!(f, "truncated native WSP reply: missing content type")
            }
            Self::TruncatedContentType => write!(
                f,
                "truncated native WSP reply: content type general form incomplete"
            ),
            Self::ContentTypeOverrunsHeaderSection => write!(
                f,
                "truncated native WSP reply: content type overruns header section"
            ),
            Self::UnsupportedWellKnownMedia(code) => {
                write!(f, "unsupported well-known media type: 0x{code:02X}")
            }
            Self::UnsupportedCharsetMibEnum(value) => {
                write!(f, "unsupported WSP charset MIBenum: {value}")
            }
            Self::TruncatedTextString => write!(f, "truncated native WSP text string"),
            Self::InvalidTextStringUtf8(error) => {
                write!(f, "invalid utf-8 in native WSP text string: {error}")
            }
            Self::UnsupportedStatusCode(status) => {
                write!(f, "unsupported native WSP status code: 0x{status:02X}")
            }
        }
    }
}

impl std::error::Error for WspConnectionlessDecodeError {}

/// Encodes a connectionless WSP `Get`/`Post` request onto the wire.
pub(crate) fn encode_connectionless_request(
    request: &WspConnectionlessRequest<'_>,
) -> Result<Vec<u8>, WspConnectionlessEncodeError> {
    if request.uri.as_bytes().contains(&0x00) {
        return Err(WspConnectionlessEncodeError::UriContainsNul);
    }
    if request.method == WspConnectionlessMethod::Get && !request.body.is_empty() {
        return Err(WspConnectionlessEncodeError::GetBodyNotAllowed);
    }
    let encoded_headers = encode_connectionless_header_block(request.headers);
    let pdu = match request.method {
        WspConnectionlessMethod::Get => WspConnectionlessPdu::Get {
            transaction_id: request.transaction_id,
            uri: request.uri.to_string(),
            headers: encoded_headers,
        },
        WspConnectionlessMethod::Post => WspConnectionlessPdu::Post {
            transaction_id: request.transaction_id,
            uri: request.uri.to_string(),
            content_type: DecodedWspContentType::from_text(
                request
                    .content_type
                    .ok_or(WspConnectionlessEncodeError::MissingPostContentType)?,
            )?,
            headers: encoded_headers,
            body: request.body.to_vec(),
        },
    };
    encode_connectionless_pdu(&pdu)
}

/// Encodes one selected WAP-203 connectionless PDU. Each call produces exactly
/// one WSP service-data unit; no connectionless session state is consulted.
pub fn encode_connectionless_pdu(
    pdu: &WspConnectionlessPdu,
) -> Result<Vec<u8>, WspConnectionlessEncodeError> {
    let (transaction_id, pdu_name, uri, content_type, headers, body, status_code) = match pdu {
        WspConnectionlessPdu::Get {
            transaction_id,
            uri,
            headers,
        } => (
            *transaction_id,
            "Get",
            Some(uri),
            None,
            headers,
            &[][..],
            None,
        ),
        WspConnectionlessPdu::Post {
            transaction_id,
            uri,
            content_type,
            headers,
            body,
        } => (
            *transaction_id,
            "Post",
            Some(uri),
            Some(content_type),
            headers,
            body.as_slice(),
            None,
        ),
        WspConnectionlessPdu::Reply {
            transaction_id,
            status_code,
            content_type,
            headers,
            body,
        } => (
            *transaction_id,
            REPLY_PDU_TYPE_NAME,
            None,
            Some(content_type),
            headers,
            body.as_slice(),
            Some(*status_code),
        ),
    };
    let pdu_type = encode_pdu_type(pdu_name)
        .ok_or(WspConnectionlessEncodeError::UnassignedPduType(pdu_name))?;
    let mut wire = Vec::new();
    wire.push(transaction_id);
    wire.push(pdu_type);

    if let Some(uri) = uri {
        if uri.as_bytes().contains(&0x00) {
            return Err(WspConnectionlessEncodeError::UriContainsNul);
        }
        wire.extend_from_slice(&encode_uintvar(uri.len())?);
        if content_type.is_some() {
            let header_length = content_type
                .map(|value| value.encoded().len())
                .unwrap_or_default()
                .checked_add(headers.len())
                .ok_or(WspConnectionlessEncodeError::LengthExceedsUintvarRange(
                    usize::MAX,
                ))?;
            wire.extend_from_slice(&encode_uintvar(header_length)?);
        }
        wire.extend_from_slice(uri.as_bytes());
    }

    if let Some(status_code) = status_code {
        wire.push(encode_wsp_status_code(status_code)?);
        let header_length = content_type
            .map(|value| value.encoded().len())
            .unwrap_or_default()
            .checked_add(headers.len())
            .ok_or(WspConnectionlessEncodeError::LengthExceedsUintvarRange(
                usize::MAX,
            ))?;
        wire.extend_from_slice(&encode_uintvar(header_length)?);
    }
    if let Some(content_type) = content_type {
        wire.extend_from_slice(content_type.encoded());
    }
    wire.extend_from_slice(headers);
    wire.extend_from_slice(body);
    Ok(wire)
}

/// Decodes one selected WAP-203 connectionless PDU while preserving optional
/// header bytes exactly for the later WSP-802 header closure.
pub fn decode_connectionless_pdu(
    payload: &[u8],
) -> Result<WspConnectionlessPdu, WspConnectionlessDecodeError> {
    let Some((&transaction_id, body)) = payload.split_first() else {
        return Err(WspConnectionlessDecodeError::MissingTransactionId);
    };
    let Some((&pdu_type, body)) = body.split_first() else {
        return Err(WspConnectionlessDecodeError::MissingPduType);
    };
    let decoded_pdu_type = decode_pdu_type(pdu_type, WspAssignedNumberPolicy::STRICT)
        .ok()
        .flatten()
        .ok_or(WspConnectionlessDecodeError::UnexpectedPduType(pdu_type))?;

    match decoded_pdu_type {
        "Get" => {
            let (uri, headers) = decode_request_uri(body)?;
            Ok(WspConnectionlessPdu::Get {
                transaction_id,
                uri,
                headers: headers.to_vec(),
            })
        }
        "Post" => {
            let (uri_len, body) = decode_uintvar(body)?;
            let (headers_len, body) = decode_uintvar(body)?;
            let total_prefix = uri_len
                .checked_add(headers_len)
                .ok_or(WspConnectionlessDecodeError::TruncatedHeaderSection)?;
            if body.len() < total_prefix {
                return Err(if body.len() < uri_len {
                    WspConnectionlessDecodeError::TruncatedUri
                } else {
                    WspConnectionlessDecodeError::TruncatedHeaderSection
                });
            }
            let uri = decode_uri(&body[..uri_len])?;
            let header_section = &body[uri_len..total_prefix];
            let content_type = decode_content_type_value(header_section)?;
            let headers =
                headers_after_content_type(header_section, content_type.consumed_bytes())?.to_vec();
            Ok(WspConnectionlessPdu::Post {
                transaction_id,
                uri,
                content_type,
                headers,
                body: body[total_prefix..].to_vec(),
            })
        }
        REPLY_PDU_TYPE_NAME => {
            let Some((&status, body)) = body.split_first() else {
                return Err(WspConnectionlessDecodeError::MissingStatus);
            };
            let (headers_len, body) = decode_uintvar(body)?;
            if body.len() < headers_len {
                return Err(WspConnectionlessDecodeError::TruncatedHeaderSection);
            }
            let (header_section, data) = body.split_at(headers_len);
            let content_type = decode_content_type_value(header_section)?;
            let headers =
                headers_after_content_type(header_section, content_type.consumed_bytes())?.to_vec();
            Ok(WspConnectionlessPdu::Reply {
                transaction_id,
                status_code: decode_wsp_status_code(status)?,
                content_type,
                headers,
                body: data.to_vec(),
            })
        }
        _ => Err(WspConnectionlessDecodeError::UnexpectedPduType(pdu_type)),
    }
}

fn headers_after_content_type(
    header_section: &[u8],
    content_type_bytes: usize,
) -> Result<&[u8], WspConnectionlessDecodeError> {
    header_section
        .get(content_type_bytes..)
        .ok_or(WspConnectionlessDecodeError::ContentTypeOverrunsHeaderSection)
}

fn decode_request_uri(input: &[u8]) -> Result<(String, &[u8]), WspConnectionlessDecodeError> {
    let (uri_len, body) = decode_uintvar(input)?;
    if body.len() < uri_len {
        return Err(WspConnectionlessDecodeError::TruncatedUri);
    }
    Ok((decode_uri(&body[..uri_len])?, &body[uri_len..]))
}

fn decode_uri(uri: &[u8]) -> Result<String, WspConnectionlessDecodeError> {
    if uri.contains(&0x00) {
        return Err(WspConnectionlessDecodeError::UriContainsNul);
    }
    String::from_utf8(uri.to_vec())
        .map_err(|error| WspConnectionlessDecodeError::InvalidUriUtf8(error.to_string()))
}

/// Decodes a connectionless WSP `Reply` PDU addressed to `expected_transaction_id`.
///
/// Only the content type is lifted out of the header section; the remaining
/// header bytes are intentionally left unparsed, because the gateway encodes
/// them with value forms this fetch path does not need and must not fail on.
pub(crate) fn decode_connectionless_reply(
    expected_transaction_id: u8,
    payload: &[u8],
) -> Result<WspConnectionlessReply, WspConnectionlessDecodeError> {
    if let Some(pdu_type) = payload.get(1).copied() {
        if decode_pdu_type(pdu_type, WspAssignedNumberPolicy::STRICT)
            .ok()
            .flatten()
            != Some(REPLY_PDU_TYPE_NAME)
        {
            return Err(WspConnectionlessDecodeError::UnexpectedPduType(pdu_type));
        }
    }
    let pdu = decode_connectionless_pdu(payload)?;
    let transaction_id = pdu.transaction_id();
    if transaction_id != expected_transaction_id {
        return Err(WspConnectionlessDecodeError::TransactionIdMismatch {
            expected: expected_transaction_id,
            actual: transaction_id,
        });
    }
    match pdu {
        WspConnectionlessPdu::Reply {
            status_code,
            content_type,
            headers,
            body,
            ..
        } => Ok(WspConnectionlessReply {
            status_code,
            content_type: content_type.as_mime_value(),
            headers,
            body,
        }),
        _ => Err(WspConnectionlessDecodeError::UnexpectedPduType(
            payload.get(1).copied().unwrap_or_default(),
        )),
    }
}

/// Encodes a header block in the binary connectionless form.
///
/// Field names registered on the default code page are emitted as well-known
/// octets from [`crate::network::wsp::header_registry`]; anything else falls
/// back to the text form. Media-typed values are compacted to well-known media
/// octets when possible.
fn encode_connectionless_header_block(block: &WspHeaderBlock) -> Vec<u8> {
    let mut out = Vec::new();
    for header in &block.headers {
        let page = match header.name_encoding {
            WspHeaderNameEncoding::Binary { page } => page,
            WspHeaderNameEncoding::Text => DEFAULT_HEADER_CODE_PAGE,
        };
        match encode_header_field_name_on_page(&header.name, page)
            .filter(|_| page == DEFAULT_HEADER_CODE_PAGE)
        {
            Some(code) => out.push(WELL_KNOWN_MARKER | code),
            None => {
                out.extend_from_slice(header.name.as_bytes());
                out.push(0x00);
            }
        }

        let media_code = MEDIA_VALUED_HEADER_NAMES
            .iter()
            .any(|name| name.eq_ignore_ascii_case(&header.name))
            .then(|| well_known_media_code(&header.value))
            .flatten();
        match media_code {
            Some(code) => out.push(WELL_KNOWN_MARKER | code),
            None if header.name.eq_ignore_ascii_case("Encoding-Version") => {
                match encode_version_value(&header.value) {
                    Some(version) => out.extend_from_slice(&version),
                    None => {
                        out.extend_from_slice(header.value.as_bytes());
                        out.push(0x00);
                    }
                }
            }
            None => {
                out.extend_from_slice(header.value.as_bytes());
                out.push(0x00);
            }
        }
    }
    out
}

fn encode_version_value(value: &str) -> Option<Vec<u8>> {
    let (major, minor) = value.trim().split_once('.')?;
    let major = major.parse::<u8>().ok()?;
    let minor = minor.parse::<u8>().ok()?;
    encode_wsp_version_value(WspVersionValue {
        major,
        minor: Some(minor),
    })
    .ok()
}

/// Encodes the `ContentType` field that precedes a `Post` header section.
fn encode_content_type_field(
    content_type: Option<&str>,
) -> Result<Vec<u8>, WspConnectionlessEncodeError> {
    let Some(content_type) = content_type
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(Vec::new());
    };

    if content_type.as_bytes().contains(&0x00) {
        return Err(WspConnectionlessEncodeError::ContentTypeContainsNul);
    }
    let mut out = Vec::with_capacity(content_type.len() + 1);
    out.extend_from_slice(content_type.as_bytes());
    out.push(0x00);
    Ok(out)
}

pub(crate) fn encode_uintvar(value: usize) -> Result<Vec<u8>, WspConnectionlessEncodeError> {
    if value > MAX_UINTVAR_VALUE {
        return Err(WspConnectionlessEncodeError::LengthExceedsUintvarRange(
            value,
        ));
    }
    let mut groups = [0u8; 5];
    let mut cursor = groups.len();
    let mut remaining = value;
    loop {
        cursor -= 1;
        groups[cursor] = (remaining & 0x7F) as u8;
        remaining >>= 7;
        if remaining == 0 {
            break;
        }
    }
    let mut out = groups[cursor..].to_vec();
    // Continuation bit is set on every octet except the final one.
    for index in 0..out.len().saturating_sub(1) {
        out[index] |= WELL_KNOWN_MARKER;
    }
    Ok(out)
}

pub(crate) fn decode_uintvar(input: &[u8]) -> Result<(usize, &[u8]), WspConnectionlessDecodeError> {
    let mut value = 0u64;
    for (index, byte) in input.iter().copied().enumerate().take(5) {
        value = (value << 7) | u64::from(byte & 0x7F);
        if value > u64::from(u32::MAX) {
            return Err(WspConnectionlessDecodeError::UintvarOverflow);
        }
        if byte & WELL_KNOWN_MARKER == 0 {
            return Ok((value as usize, &input[index + 1..]));
        }
    }
    Err(WspConnectionlessDecodeError::TruncatedUintvar)
}

pub fn decode_content_type_value(
    input: &[u8],
) -> Result<DecodedWspContentType, WspConnectionlessDecodeError> {
    let Some((&first, _)) = input.split_first() else {
        return Err(WspConnectionlessDecodeError::MissingContentType);
    };
    if first & WELL_KNOWN_MARKER != 0 {
        let code = first & 0x7F;
        let media = well_known_media_name(code).ok_or(
            WspConnectionlessDecodeError::UnsupportedWellKnownMedia(code),
        )?;
        return Ok(DecodedWspContentType::new(
            media.to_string(),
            None,
            1,
            input[..1].to_vec(),
        ));
    }
    if first <= LENGTH_QUOTE {
        let (length, prefix_length) = if first <= MAX_SHORT_LENGTH {
            (usize::from(first), 1)
        } else {
            let (length, remaining) = decode_uintvar(&input[1..])?;
            let encoded_length_bytes = input[1..].len() - remaining.len();
            (length, 1 + encoded_length_bytes)
        };
        if input.len() < prefix_length + length {
            return Err(WspConnectionlessDecodeError::TruncatedContentType);
        }
        let encoded = &input[prefix_length..prefix_length + length];
        let (media_type, media_length) = decode_content_type_media(encoded)?;
        let charset = decode_content_type_charset(&encoded[media_length..])?;
        return Ok(DecodedWspContentType::new(
            media_type,
            charset,
            prefix_length + length,
            input[..prefix_length + length].to_vec(),
        ));
    }
    let media = decode_text_string(input)?;
    Ok(DecodedWspContentType::new(
        media.text().to_string(),
        None,
        media.consumed_bytes(),
        input[..media.consumed_bytes()].to_vec(),
    ))
}

fn decode_content_type_media(
    input: &[u8],
) -> Result<(String, usize), WspConnectionlessDecodeError> {
    let Some(first) = input.first().copied() else {
        return Err(WspConnectionlessDecodeError::MissingContentType);
    };
    if first & WELL_KNOWN_MARKER != 0 {
        let code = first & 0x7F;
        let media = well_known_media_name(code).ok_or(
            WspConnectionlessDecodeError::UnsupportedWellKnownMedia(code),
        )?;
        return Ok((media.to_string(), 1));
    }
    let media = decode_text_string(input)?;
    Ok((media.text().to_string(), media.consumed_bytes()))
}

fn decode_content_type_charset(
    parameters: &[u8],
) -> Result<Option<String>, WspConnectionlessDecodeError> {
    let Some(first) = parameters.first().copied() else {
        return Ok(None);
    };
    if first & WELL_KNOWN_MARKER == 0 {
        return Ok(None);
    }
    let parameter_code = first & 0x7F;
    let parameter =
        decode_well_known_parameter(parameter_code, WspAssignedNumberPolicy::STRICT).ok();
    if parameter.flatten() != Some("Charset") {
        return Ok(None);
    }
    let Some(value) = parameters.get(1).copied() else {
        return Err(WspConnectionlessDecodeError::TruncatedContentType);
    };
    if value & WELL_KNOWN_MARKER != 0 {
        let mib_enum = value & 0x7F;
        let charset = match mib_enum {
            3 => "us-ascii",
            4 => "iso-8859-1",
            106 => "utf-8",
            _ => {
                return Err(WspConnectionlessDecodeError::UnsupportedCharsetMibEnum(
                    mib_enum,
                ))
            }
        };
        return Ok(Some(charset.to_string()));
    }
    decode_text_string(&parameters[1..]).map(|text| Some(text.text().to_string()))
}

/// Decodes a NUL-terminated WSP text-string.
///
/// A leading [`TEXT_STRING_QUOTE`] byte is stripped from the returned text but
/// still counted in [`DecodedWspText::consumed_bytes`].
pub(crate) fn decode_text_string(
    input: &[u8],
) -> Result<DecodedWspText, WspConnectionlessDecodeError> {
    let terminator = input
        .iter()
        .position(|byte| *byte == 0x00)
        .ok_or(WspConnectionlessDecodeError::TruncatedTextString)?;
    let content = if input.first().copied() == Some(TEXT_STRING_QUOTE) {
        &input[1..terminator]
    } else {
        &input[..terminator]
    };
    let text = String::from_utf8(content.to_vec())
        .map_err(|error| WspConnectionlessDecodeError::InvalidTextStringUtf8(error.to_string()))?;
    Ok(DecodedWspText::new(text, terminator + 1))
}

pub fn decode_wsp_status_code(status: u8) -> Result<u16, WspConnectionlessDecodeError> {
    match status {
        0x10 => Ok(100),
        0x11 => Ok(101),
        0x20..=0x26 => Ok(200 + u16::from(status - 0x20)),
        0x30..=0x37 => Ok(300 + u16::from(status - 0x30)),
        0x40..=0x51 => Ok(400 + u16::from(status - 0x40)),
        0x60..=0x65 => Ok(500 + u16::from(status - 0x60)),
        _ => Err(WspConnectionlessDecodeError::UnsupportedStatusCode(status)),
    }
}

pub fn encode_wsp_status_code(status: u16) -> Result<u8, WspConnectionlessEncodeError> {
    match status {
        100..=101 => Ok(0x10 + (status - 100) as u8),
        200..=206 => Ok(0x20 + (status - 200) as u8),
        300..=307 => Ok(0x30 + (status - 300) as u8),
        400..=417 => Ok(0x40 + (status - 400) as u8),
        500..=505 => Ok(0x60 + (status - 500) as u8),
        _ => Err(WspConnectionlessEncodeError::UnsupportedStatusCode(status)),
    }
}

fn well_known_media_name(code: u8) -> Option<&'static str> {
    WELL_KNOWN_MEDIA_TYPES
        .iter()
        .find(|(entry_code, _)| *entry_code == code)
        .map(|(_, name)| *name)
}

fn well_known_media_code(media: &str) -> Option<u8> {
    WELL_KNOWN_MEDIA_TYPES
        .iter()
        .find(|(_, name)| name.eq_ignore_ascii_case(media))
        .map(|(code, _)| *code)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wsp::header_block::WspHeaderField;

    const TRANSACTION_ID: u8 = 1;

    fn accept_block(media: &str) -> WspHeaderBlock {
        WspHeaderBlock {
            headers: vec![WspHeaderField {
                name: "Accept".to_string(),
                value: media.to_string(),
                name_encoding: WspHeaderNameEncoding::Binary {
                    page: DEFAULT_HEADER_CODE_PAGE,
                },
            }],
            encoding_version_headers: Vec::new(),
        }
    }

    fn reply_wire(transaction_id: u8, status: u8, content_type: u8, body: &[u8]) -> Vec<u8> {
        let headers_len = encode_uintvar(1).expect("single-octet content type should encode");
        let mut wire = vec![transaction_id, 0x04, status];
        wire.extend_from_slice(&headers_len);
        wire.push(content_type | WELL_KNOWN_MARKER);
        wire.extend_from_slice(body);
        wire
    }

    #[test]
    fn get_request_uses_transaction_id_pdu_type_and_uintvar_uri_length() {
        let block = accept_block("application/vnd.wap.wmlc");
        let encoded = encode_connectionless_request(&WspConnectionlessRequest {
            transaction_id: TRANSACTION_ID,
            method: WspConnectionlessMethod::Get,
            uri: "http://localhost:13002/",
            headers: &block,
            content_type: None,
            body: &[],
        })
        .expect("request should encode");

        assert_eq!(encoded.first().copied(), Some(TRANSACTION_ID));
        assert_eq!(encoded.get(1).copied(), Some(0x40));
        let (uri_len, rest) = decode_uintvar(&encoded[2..]).expect("uri len should decode");
        assert_eq!(
            std::str::from_utf8(&rest[..uri_len]).expect("uri should decode"),
            "http://localhost:13002/"
        );
        assert_eq!(&rest[uri_len..], &[0x80, 0x94]);
    }

    #[test]
    fn get_request_encodes_wml_accept_as_well_known_media_octet() {
        let block = accept_block("text/vnd.wap.wml");
        let encoded = encode_connectionless_request(&WspConnectionlessRequest {
            transaction_id: TRANSACTION_ID,
            method: WspConnectionlessMethod::Get,
            uri: "/",
            headers: &block,
            content_type: None,
            body: &[],
        })
        .expect("request should encode");

        assert_eq!(&encoded[encoded.len() - 2..], &[0x80, 0x88]);
    }

    #[test]
    fn get_request_encodes_wbxml_version_as_compact_version_value() {
        let block = WspHeaderBlock {
            headers: vec![WspHeaderField {
                name: "Encoding-Version".to_string(),
                value: "1.3".to_string(),
                name_encoding: WspHeaderNameEncoding::Binary {
                    page: DEFAULT_HEADER_CODE_PAGE,
                },
            }],
            encoding_version_headers: Vec::new(),
        };
        let encoded = encode_connectionless_request(&WspConnectionlessRequest {
            transaction_id: TRANSACTION_ID,
            method: WspConnectionlessMethod::Get,
            uri: "/",
            headers: &block,
            content_type: None,
            body: &[],
        })
        .expect("request should encode");

        assert_eq!(&encoded[encoded.len() - 2..], &[0xc3, 0x93]);
    }

    #[test]
    fn post_request_encodes_content_type_header_block_and_body() {
        let block = accept_block("text/vnd.wap.wml");
        let encoded = encode_connectionless_request(&WspConnectionlessRequest {
            transaction_id: TRANSACTION_ID,
            method: WspConnectionlessMethod::Post,
            uri: "http://localhost:13002/login",
            headers: &block,
            content_type: Some("application/x-www-form-urlencoded"),
            body: b"username=alice&pin=0000",
        })
        .expect("post request should encode");

        assert_eq!(encoded.get(1).copied(), Some(0x60));
        let (uri_len, remainder) = decode_uintvar(&encoded[2..]).expect("uri len should decode");
        let (headers_len, remainder) =
            decode_uintvar(remainder).expect("headers len should decode");
        assert_eq!(
            std::str::from_utf8(&remainder[..uri_len]).expect("uri should decode"),
            "http://localhost:13002/login"
        );
        let remainder = &remainder[uri_len..];
        assert_eq!(headers_len, 36);
        assert_eq!(
            &remainder[..headers_len],
            &[
                b'a', b'p', b'p', b'l', b'i', b'c', b'a', b't', b'i', b'o', b'n', b'/', b'x', b'-',
                b'w', b'w', b'w', b'-', b'f', b'o', b'r', b'm', b'-', b'u', b'r', b'l', b'e', b'n',
                b'c', b'o', b'd', b'e', b'd', 0x00, 0x80, 0x88,
            ]
        );
        assert_eq!(&remainder[headers_len..], b"username=alice&pin=0000");
    }

    #[test]
    fn post_content_type_rejects_nul_bytes() {
        let block = WspHeaderBlock::default();
        let error = encode_connectionless_request(&WspConnectionlessRequest {
            transaction_id: TRANSACTION_ID,
            method: WspConnectionlessMethod::Post,
            uri: "/",
            headers: &block,
            content_type: Some("text/plain\0oops"),
            body: &[],
        })
        .expect_err("content type with NUL should fail");

        assert_eq!(error, WspConnectionlessEncodeError::ContentTypeContainsNul);
        assert!(error.to_string().contains("must not contain NUL bytes"));
    }

    #[test]
    fn uintvar_roundtrips_multi_octet_values_with_canonical_continuation_bits() {
        // Only the non-final octets carry the continuation bit; a trailing octet
        // with 0x80 set would make a peer swallow the byte that follows the
        // length field.
        for value in [0usize, 1, 127, 128, 200, 16_383, 16_384, MAX_UINTVAR_VALUE] {
            let encoded = encode_uintvar(value).expect("value should encode");
            assert_eq!(
                encoded.last().copied().map(|byte| byte & 0x80),
                Some(0),
                "final uintvar octet must not set the continuation bit for {value}"
            );
            let mut wire = encoded.clone();
            wire.push(0xAA);
            let (decoded, rest) = decode_uintvar(&wire).expect("value should decode");
            assert_eq!(decoded, value);
            assert_eq!(rest, &[0xAA], "decode must stop at the final octet");
        }
        assert_eq!(
            encode_uintvar(200).expect("200 should encode"),
            [0x81, 0x48]
        );
    }

    #[test]
    fn uintvar_rejects_values_outside_the_encodable_range() {
        let error = encode_uintvar(MAX_UINTVAR_VALUE + 1).expect_err("value should be rejected");
        assert_eq!(
            error,
            WspConnectionlessEncodeError::LengthExceedsUintvarRange(MAX_UINTVAR_VALUE + 1)
        );
    }

    #[test]
    fn decode_uintvar_rejects_unterminated_sequences() {
        let error = decode_uintvar(&[0x80, 0x80, 0x80, 0x80, 0x80])
            .expect_err("uintvar should be rejected");
        assert_eq!(error, WspConnectionlessDecodeError::TruncatedUintvar);
    }

    #[test]
    fn decode_content_type_value_extension_media_matches_len_plus_one() {
        // Unquoted extension-media text-string: no leading 0x7F is stripped, so the
        // consumed byte count legitimately equals `text.len() + 1` (the string
        // bytes plus the terminating NUL).
        let input = b"text/html\x00";

        let decoded = decode_content_type_value(input).expect("value should decode");

        assert_eq!(decoded.media_type(), "text/html");
        assert_eq!(decoded.consumed_bytes(), decoded.media_type().len() + 1);
        assert_eq!(decoded.consumed_bytes(), input.len());
    }

    #[test]
    fn decode_content_type_value_quoted_extension_media_counts_quote_byte() {
        // Quoted extension-media text-string (leading 0x7F escape byte, per WSP
        // token-text quoting): the quote byte is stripped from the text but must
        // still be counted as consumed, so `text.len() + 1` undercounts by one.
        let input = b"\x7Ftext/html\x00";

        let decoded = decode_content_type_value(input).expect("value should decode");

        assert_eq!(decoded.media_type(), "text/html");
        assert_eq!(
            decoded.consumed_bytes(),
            input.len(),
            "quoted content type must count the leading 0x7F byte as consumed"
        );
        assert_ne!(
            decoded.consumed_bytes(),
            decoded.media_type().len() + 1,
            "regression guard: consumed length must not be derived from text.len() + 1 \
             when the value was quoted"
        );
    }

    #[test]
    fn decode_content_type_value_maps_well_known_media_octets() {
        let decoded = decode_content_type_value(&[0x94]).expect("well-known media should decode");
        assert_eq!(decoded.media_type(), "application/vnd.wap.wmlc");
        assert_eq!(decoded.charset(), None);
        assert_eq!(decoded.consumed_bytes(), 1);

        let error = decode_content_type_value(&[0xFF]).expect_err("unknown media should fail");
        assert_eq!(
            error,
            WspConnectionlessDecodeError::UnsupportedWellKnownMedia(0x7F)
        );
    }

    #[test]
    fn decode_content_type_value_preserves_general_form_charset() {
        let decoded = decode_content_type_value(&[0x03, 0x94, 0x81, 0x84])
            .expect("well-known WMLC with ISO-8859-1 should decode");

        assert_eq!(decoded.media_type(), "application/vnd.wap.wmlc");
        assert_eq!(decoded.charset(), Some("iso-8859-1"));
        assert_eq!(decoded.consumed_bytes(), 4);
    }

    #[test]
    fn content_type_header_boundary_rejects_an_overrun() {
        let header_section = [0x94, 0x80];

        assert_eq!(
            headers_after_content_type(&header_section, header_section.len()),
            Ok(&[][..])
        );
        assert_eq!(
            headers_after_content_type(&header_section, header_section.len() + 1),
            Err(WspConnectionlessDecodeError::ContentTypeOverrunsHeaderSection)
        );
    }

    #[test]
    fn post_and_reply_reject_content_type_beyond_declared_header_section() {
        // The short-length Content-Type declares two value octets, but the
        // carrying Post/Reply header section declares room for only the length
        // octet. Bytes after that boundary are body data and must not be used to
        // complete Content-Type or reached by unchecked slicing.
        let post = [TRANSACTION_ID, 0x60, 0x01, 0x01, b'/', 0x02, b'x', b'y'];
        let reply = [TRANSACTION_ID, 0x04, 0x20, 0x01, 0x02, b'x', b'y'];

        for wire in [&post[..], &reply[..]] {
            assert_eq!(
                decode_connectionless_pdu(wire),
                Err(WspConnectionlessDecodeError::TruncatedContentType)
            );
        }
    }

    #[test]
    fn post_and_reply_header_length_inputs_never_panic() {
        for declared_length in 0u8..=8 {
            for actual_length in 0u8..=8 {
                for first_content_type_byte in 0u8..=u8::MAX {
                    let mut post = vec![TRANSACTION_ID, 0x60, 0x00, declared_length];
                    post.extend(std::iter::repeat_n(
                        first_content_type_byte,
                        usize::from(actual_length),
                    ));
                    let _ = decode_connectionless_pdu(&post);

                    let mut reply = vec![TRANSACTION_ID, 0x04, 0x20, declared_length];
                    reply.extend(std::iter::repeat_n(
                        first_content_type_byte,
                        usize::from(actual_length),
                    ));
                    let _ = decode_connectionless_pdu(&reply);
                }
            }
        }
    }

    #[test]
    fn reply_rejects_transaction_id_mismatch() {
        let encoded = reply_wire(9, 0x20, 0x08, &[]);

        let error = decode_connectionless_reply(TRANSACTION_ID, &encoded)
            .expect_err("transaction-id mismatch should fail");

        assert_eq!(
            error,
            WspConnectionlessDecodeError::TransactionIdMismatch {
                expected: TRANSACTION_ID,
                actual: 9,
            }
        );
        assert!(error
            .to_string()
            .contains("unexpected native WSP reply transaction id"));
    }

    #[test]
    fn reply_rejects_non_reply_pdu_types() {
        let mut encoded = reply_wire(TRANSACTION_ID, 0x20, 0x08, &[]);
        encoded[1] = 0x40;

        let error = decode_connectionless_reply(TRANSACTION_ID, &encoded)
            .expect_err("a Get PDU is not a valid reply");

        assert_eq!(error, WspConnectionlessDecodeError::UnexpectedPduType(0x40));
    }

    #[test]
    fn reply_decodes_status_content_type_and_body() {
        let encoded = reply_wire(TRANSACTION_ID, 0x20, 0x08, b"<wml/>");

        let reply =
            decode_connectionless_reply(TRANSACTION_ID, &encoded).expect("reply should decode");

        assert_eq!(reply.status_code, 200);
        assert_eq!(reply.content_type, "text/vnd.wap.wml");
        assert_eq!(reply.body, b"<wml/>".to_vec());
    }

    #[test]
    fn reply_decodes_quoted_extension_media_content_type() {
        // Exercises the `consumed_bytes > header_section.len()` sanity check with
        // a quoted extension-media content type.
        let content_type = b"\x7Ftext/html\x00";
        let headers_len = encode_uintvar(content_type.len()).expect("headers len should encode");
        let mut wire = vec![TRANSACTION_ID, 0x04, 0x20];
        wire.extend_from_slice(&headers_len);
        wire.extend_from_slice(content_type);

        let reply = decode_connectionless_reply(TRANSACTION_ID, &wire)
            .expect("quoted content type reply should decode");

        assert_eq!(reply.content_type, "text/html");
        assert_eq!(reply.status_code, 200);
        assert!(reply.body.is_empty());
    }

    #[test]
    fn reply_preserves_general_form_content_type_charset() {
        let content_type = [0x03, 0x94, 0x81, 0x84];
        let body = b"\x03\x0a\x6a\x00\x3f";
        let headers_len = encode_uintvar(content_type.len()).expect("headers len should encode");
        let mut wire = vec![TRANSACTION_ID, 0x04, 0x20];
        wire.extend_from_slice(&headers_len);
        wire.extend_from_slice(&content_type);
        wire.extend_from_slice(body);

        let reply = decode_connectionless_reply(TRANSACTION_ID, &wire)
            .expect("general-form content type reply should decode");

        assert_eq!(
            reply.content_type,
            "application/vnd.wap.wmlc; charset=iso-8859-1"
        );
        assert_eq!(reply.body, body);
    }

    #[test]
    fn reply_rejects_truncated_frames() {
        assert_eq!(
            decode_connectionless_reply(TRANSACTION_ID, &[]).expect_err("empty payload"),
            WspConnectionlessDecodeError::MissingTransactionId
        );
        assert_eq!(
            decode_connectionless_reply(TRANSACTION_ID, &[TRANSACTION_ID])
                .expect_err("missing pdu type"),
            WspConnectionlessDecodeError::MissingPduType
        );
        assert_eq!(
            decode_connectionless_reply(TRANSACTION_ID, &[TRANSACTION_ID, 0x04])
                .expect_err("missing status"),
            WspConnectionlessDecodeError::MissingStatus
        );
        assert_eq!(
            decode_connectionless_reply(TRANSACTION_ID, &[TRANSACTION_ID, 0x04, 0x20, 0x05])
                .expect_err("short header section"),
            WspConnectionlessDecodeError::TruncatedHeaderSection
        );
    }

    #[test]
    fn status_code_mapping_covers_each_assigned_class() {
        assert_eq!(decode_wsp_status_code(0x10), Ok(100));
        assert_eq!(decode_wsp_status_code(0x11), Ok(101));
        assert_eq!(decode_wsp_status_code(0x20), Ok(200));
        assert_eq!(decode_wsp_status_code(0x26), Ok(206));
        assert_eq!(decode_wsp_status_code(0x30), Ok(300));
        assert_eq!(decode_wsp_status_code(0x37), Ok(307));
        assert_eq!(decode_wsp_status_code(0x40), Ok(400));
        assert_eq!(decode_wsp_status_code(0x51), Ok(417));
        assert_eq!(decode_wsp_status_code(0x60), Ok(500));
        assert_eq!(decode_wsp_status_code(0x65), Ok(505));
        assert_eq!(
            decode_wsp_status_code(0x00),
            Err(WspConnectionlessDecodeError::UnsupportedStatusCode(0x00))
        );
    }
}
