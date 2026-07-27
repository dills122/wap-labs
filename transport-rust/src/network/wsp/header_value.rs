use crate::network::wsp::decoder::UnsupportedCodePageBehavior;
use crate::network::wsp::encoding_version::WspEncodingVersion;
use crate::network::wsp::header_registry::{
    decode_header_field_name_on_page, default_header_definition, header_code_page_class,
    WspAssignedNumberPolicy, WspHeaderCodePageClass, WspHeaderValueGrammar,
    DEFAULT_HEADER_CODE_PAGE, HEADER_CODE_PAGE_SHIFT,
};

const LENGTH_QUOTE: u8 = 0x1F;
const TEXT_STRING_QUOTE: u8 = 0x7F;
const WELL_KNOWN_MARKER: u8 = 0x80;
const MAX_UINTVAR_OCTETS: usize = 5;
const MAX_UINTVAR_VALUE: u64 = u32::MAX as u64;
const MAX_HEADER_FIELDS: usize = 4096;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum UnknownHeaderBehavior {
    Error,
    Preserve,
    Skip,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspHeaderSectionDecodePolicy<'a> {
    pub unknown_header: UnknownHeaderBehavior,
    pub unsupported_code_page: UnsupportedCodePageBehavior,
    pub negotiated_extension_pages: &'a [u8],
    pub peer_encoding_version: Option<WspEncodingVersion>,
}

impl WspHeaderSectionDecodePolicy<'static> {
    pub const STRICT: Self = Self {
        unknown_header: UnknownHeaderBehavior::Error,
        unsupported_code_page: UnsupportedCodePageBehavior::Error,
        negotiated_extension_pages: &[],
        peer_encoding_version: None,
    };

    pub const PRESERVE_UNKNOWN: Self = Self {
        unknown_header: UnknownHeaderBehavior::Preserve,
        unsupported_code_page: UnsupportedCodePageBehavior::IgnoreExtensionHeaders,
        negotiated_extension_pages: &[],
        peer_encoding_version: None,
    };
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DecodedWspHeaderName {
    WellKnown {
        page: u8,
        code: u8,
        name: &'static str,
    },
    Application(String),
    Unknown {
        page: u8,
        code: u8,
    },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspHeaderValueForm {
    LengthDelimited,
    TextString,
    ShortInteger,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WspRawHeaderValue {
    pub encoded: Vec<u8>,
    pub form: WspHeaderValueForm,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspVersionValue {
    pub major: u8,
    pub minor: Option<u8>,
}

impl From<WspEncodingVersion> for WspVersionValue {
    fn from(version: WspEncodingVersion) -> Self {
        Self {
            major: version.major,
            minor: Some(version.minor),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DecodedWspEncodingVersion {
    pub code_page: Option<u8>,
    pub version: Option<WspVersionValue>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DecodedWspHeaderValue {
    Raw(WspRawHeaderValue),
    EncodingVersion {
        raw: WspRawHeaderValue,
        decoded: DecodedWspEncodingVersion,
    },
    ExpectContinue,
    ExpectExpression(WspRawHeaderValue),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DecodedWspHeader {
    pub name: DecodedWspHeaderName,
    pub grammar: Option<WspHeaderValueGrammar>,
    pub value: DecodedWspHeaderValue,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspHeaderSectionDecodeError {
    TooManyHeaders,
    TruncatedShiftSequence,
    UnsupportedCodePage(u8),
    UnnegotiatedApplicationCodePage(u8),
    TruncatedHeaderName,
    InvalidHeaderName,
    UnknownHeaderToken {
        page: u8,
        code: u8,
    },
    UnsupportedHeaderEncodingVersion {
        name: &'static str,
        required: WspEncodingVersion,
        actual: WspEncodingVersion,
    },
    TruncatedHeaderValue,
    InvalidUintvar,
    ValueLengthOverflow,
    BinaryValueForTextHeader,
    InvalidExpectEncoding,
    InvalidEncodingVersion,
}

impl std::fmt::Display for WspHeaderSectionDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TooManyHeaders => write!(f, "WSP header section exceeds the field limit"),
            Self::TruncatedShiftSequence => write!(f, "truncated WSP header code-page shift"),
            Self::UnsupportedCodePage(page) => {
                write!(f, "unsupported WSP header code page: 0x{page:02X}")
            }
            Self::UnnegotiatedApplicationCodePage(page) => write!(
                f,
                "unnegotiated WSP application header code page: 0x{page:02X}"
            ),
            Self::TruncatedHeaderName => write!(f, "truncated WSP text header name"),
            Self::InvalidHeaderName => write!(f, "invalid WSP text header name"),
            Self::UnknownHeaderToken { page, code } => write!(
                f,
                "unknown WSP header token 0x{code:02X} on code page 0x{page:02X}"
            ),
            Self::UnsupportedHeaderEncodingVersion {
                name,
                required,
                actual,
            } => write!(
                f,
                "WSP header {name} requires encoding version {}.{}, peer has {}.{}",
                required.major, required.minor, actual.major, actual.minor
            ),
            Self::TruncatedHeaderValue => write!(f, "truncated WSP header value"),
            Self::InvalidUintvar => write!(f, "invalid WSP uintvar"),
            Self::ValueLengthOverflow => write!(f, "WSP value-length exceeds input bounds"),
            Self::BinaryValueForTextHeader => {
                write!(f, "text-encoded WSP header has a binary field value")
            }
            Self::InvalidExpectEncoding => write!(
                f,
                "WSP Expect expression is missing the SIN 001 value-length wrapper"
            ),
            Self::InvalidEncodingVersion => write!(f, "invalid WSP Encoding-Version value"),
        }
    }
}

impl std::error::Error for WspHeaderSectionDecodeError {}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspHeaderValueEncodeError {
    ValueTooLong(usize),
    InvalidVersion,
    InvalidExpectExpression,
}

impl std::fmt::Display for WspHeaderValueEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ValueTooLong(length) => {
                write!(f, "WSP value is too long for uintvar encoding: {length}")
            }
            Self::InvalidVersion => write!(f, "invalid WSP version value"),
            Self::InvalidExpectExpression => write!(f, "invalid WSP Expect expression"),
        }
    }
}

impl std::error::Error for WspHeaderValueEncodeError {}

pub fn decode_header_section(
    input: &[u8],
    policy: WspHeaderSectionDecodePolicy<'_>,
) -> Result<Vec<DecodedWspHeader>, WspHeaderSectionDecodeError> {
    let mut headers = Vec::new();
    let mut cursor = 0usize;
    let mut current_page = DEFAULT_HEADER_CODE_PAGE;

    while cursor < input.len() {
        if headers.len() >= MAX_HEADER_FIELDS {
            return Err(WspHeaderSectionDecodeError::TooManyHeaders);
        }

        let first = input[cursor];
        if first == HEADER_CODE_PAGE_SHIFT {
            current_page = input
                .get(cursor + 1)
                .copied()
                .ok_or(WspHeaderSectionDecodeError::TruncatedShiftSequence)?;
            cursor += 2;
            validate_code_page(current_page, policy)?;
            continue;
        }
        if (0x01..=0x1F).contains(&first) {
            current_page = first;
            cursor += 1;
            validate_code_page(current_page, policy)?;
            continue;
        }

        let (name, grammar, skip, text_name) = if first & WELL_KNOWN_MARKER != 0 {
            cursor += 1;
            let code = first & 0x7F;
            decode_binary_name(current_page, code, policy)?
        } else {
            let (name, consumed) = decode_token_text(&input[cursor..])?;
            cursor = cursor
                .checked_add(consumed)
                .ok_or(WspHeaderSectionDecodeError::ValueLengthOverflow)?;
            (
                DecodedWspHeaderName::Application(name),
                Some(WspHeaderValueGrammar::ApplicationSpecific),
                false,
                true,
            )
        };

        let (raw, consumed) = decode_raw_value(&input[cursor..])?;
        cursor = cursor
            .checked_add(consumed)
            .ok_or(WspHeaderSectionDecodeError::ValueLengthOverflow)?;

        if text_name && raw.form != WspHeaderValueForm::TextString {
            return Err(WspHeaderSectionDecodeError::BinaryValueForTextHeader);
        }
        if skip {
            continue;
        }

        let value = match grammar {
            Some(WspHeaderValueGrammar::EncodingVersion) => {
                let decoded = decode_encoding_version_value(&raw)?;
                DecodedWspHeaderValue::EncodingVersion { raw, decoded }
            }
            Some(WspHeaderValueGrammar::ExpectSin001) => match raw.form {
                WspHeaderValueForm::ShortInteger if raw.encoded == [0x80] => {
                    DecodedWspHeaderValue::ExpectContinue
                }
                WspHeaderValueForm::LengthDelimited => DecodedWspHeaderValue::ExpectExpression(raw),
                _ => return Err(WspHeaderSectionDecodeError::InvalidExpectEncoding),
            },
            _ => DecodedWspHeaderValue::Raw(raw),
        };

        headers.push(DecodedWspHeader {
            name,
            grammar,
            value,
        });
    }

    Ok(headers)
}

fn validate_code_page(
    page: u8,
    policy: WspHeaderSectionDecodePolicy<'_>,
) -> Result<(), WspHeaderSectionDecodeError> {
    match header_code_page_class(page) {
        WspHeaderCodePageClass::Default => Ok(()),
        WspHeaderCodePageClass::Application
            if policy.negotiated_extension_pages.contains(&page) =>
        {
            Ok(())
        }
        WspHeaderCodePageClass::Application
            if matches!(
                policy.unsupported_code_page,
                UnsupportedCodePageBehavior::IgnoreExtensionHeaders
            ) =>
        {
            Ok(())
        }
        WspHeaderCodePageClass::Application => {
            Err(WspHeaderSectionDecodeError::UnnegotiatedApplicationCodePage(page))
        }
        WspHeaderCodePageClass::WapReserved | WspHeaderCodePageClass::FutureReserved => {
            Err(WspHeaderSectionDecodeError::UnsupportedCodePage(page))
        }
    }
}

fn decode_binary_name(
    page: u8,
    code: u8,
    policy: WspHeaderSectionDecodePolicy<'_>,
) -> Result<
    (
        DecodedWspHeaderName,
        Option<WspHeaderValueGrammar>,
        bool,
        bool,
    ),
    WspHeaderSectionDecodeError,
> {
    if page == DEFAULT_HEADER_CODE_PAGE {
        if let Some(definition) = default_header_definition(code) {
            let actual = policy
                .peer_encoding_version
                .unwrap_or(WspEncodingVersion::V1_2);
            if definition.minimum_version > actual {
                return Err(
                    WspHeaderSectionDecodeError::UnsupportedHeaderEncodingVersion {
                        name: definition.name,
                        required: definition.minimum_version,
                        actual,
                    },
                );
            }
            return Ok((
                DecodedWspHeaderName::WellKnown {
                    page,
                    code,
                    name: definition.name,
                },
                Some(definition.grammar),
                false,
                false,
            ));
        }
    } else if let Ok(Some(name)) =
        decode_header_field_name_on_page(page, code, WspAssignedNumberPolicy::HEADER_LENIENT)
    {
        return Ok((
            DecodedWspHeaderName::WellKnown { page, code, name },
            Some(WspHeaderValueGrammar::ApplicationSpecific),
            false,
            false,
        ));
    }

    match policy.unknown_header {
        UnknownHeaderBehavior::Error => {
            Err(WspHeaderSectionDecodeError::UnknownHeaderToken { page, code })
        }
        UnknownHeaderBehavior::Preserve => Ok((
            DecodedWspHeaderName::Unknown { page, code },
            None,
            false,
            false,
        )),
        UnknownHeaderBehavior::Skip => Ok((
            DecodedWspHeaderName::Unknown { page, code },
            None,
            true,
            false,
        )),
    }
}

fn decode_token_text(input: &[u8]) -> Result<(String, usize), WspHeaderSectionDecodeError> {
    let terminator = input
        .iter()
        .position(|byte| *byte == 0)
        .ok_or(WspHeaderSectionDecodeError::TruncatedHeaderName)?;
    let bytes = &input[..terminator];
    if bytes.is_empty()
        || bytes
            .iter()
            .any(|byte| *byte < 0x20 || *byte >= TEXT_STRING_QUOTE)
    {
        return Err(WspHeaderSectionDecodeError::InvalidHeaderName);
    }
    let name =
        std::str::from_utf8(bytes).map_err(|_| WspHeaderSectionDecodeError::InvalidHeaderName)?;
    Ok((name.to_string(), terminator + 1))
}

pub fn decode_raw_value(
    input: &[u8],
) -> Result<(WspRawHeaderValue, usize), WspHeaderSectionDecodeError> {
    let first = input
        .first()
        .copied()
        .ok_or(WspHeaderSectionDecodeError::TruncatedHeaderValue)?;
    let (form, consumed) = match first {
        0x00..=0x1E => {
            let length = usize::from(first);
            let consumed = 1usize
                .checked_add(length)
                .ok_or(WspHeaderSectionDecodeError::ValueLengthOverflow)?;
            if input.len() < consumed {
                return Err(WspHeaderSectionDecodeError::TruncatedHeaderValue);
            }
            (WspHeaderValueForm::LengthDelimited, consumed)
        }
        LENGTH_QUOTE => {
            let (length, length_octets) = decode_uintvar(&input[1..])?;
            let prefix = 1usize
                .checked_add(length_octets)
                .ok_or(WspHeaderSectionDecodeError::ValueLengthOverflow)?;
            let consumed = prefix
                .checked_add(length)
                .ok_or(WspHeaderSectionDecodeError::ValueLengthOverflow)?;
            if input.len() < consumed {
                return Err(WspHeaderSectionDecodeError::TruncatedHeaderValue);
            }
            (WspHeaderValueForm::LengthDelimited, consumed)
        }
        0x20..=0x7F => {
            let terminator = input
                .iter()
                .position(|byte| *byte == 0)
                .ok_or(WspHeaderSectionDecodeError::TruncatedHeaderValue)?;
            (WspHeaderValueForm::TextString, terminator + 1)
        }
        _ => (WspHeaderValueForm::ShortInteger, 1),
    };

    Ok((
        WspRawHeaderValue {
            encoded: input[..consumed].to_vec(),
            form,
        },
        consumed,
    ))
}

pub fn encode_value_length(length: usize) -> Result<Vec<u8>, WspHeaderValueEncodeError> {
    if length <= 30 {
        return Ok(vec![length as u8]);
    }
    let mut encoded = vec![LENGTH_QUOTE];
    encoded.extend_from_slice(&encode_uintvar(length)?);
    Ok(encoded)
}

pub fn encode_version_value(
    version: WspVersionValue,
) -> Result<Vec<u8>, WspHeaderValueEncodeError> {
    let minor = version.minor.unwrap_or(0x0F);
    if (1..=7).contains(&version.major) && minor <= 0x0F {
        return Ok(vec![WELL_KNOWN_MARKER | (version.major << 4) | minor]);
    }
    let Some(minor) = version.minor else {
        return Err(WspHeaderValueEncodeError::InvalidVersion);
    };
    Ok(format!("{}.{}\0", version.major, minor).into_bytes())
}

pub fn encode_encoding_version_value(
    value: DecodedWspEncodingVersion,
) -> Result<Vec<u8>, WspHeaderValueEncodeError> {
    match (value.code_page, value.version) {
        (None, Some(version)) => encode_version_value(version),
        (Some(code_page), version) if code_page <= 0x7F => {
            let mut payload = vec![WELL_KNOWN_MARKER | code_page];
            if let Some(version) = version {
                payload.extend_from_slice(&encode_version_value(version)?);
            }
            let mut encoded = encode_value_length(payload.len())?;
            encoded.extend_from_slice(&payload);
            Ok(encoded)
        }
        _ => Err(WspHeaderValueEncodeError::InvalidVersion),
    }
}

pub fn encode_expect_value(value: &str) -> Result<Vec<u8>, WspHeaderValueEncodeError> {
    if value.eq_ignore_ascii_case("100-continue") {
        return Ok(vec![0x80]);
    }

    let (variable, expression) = value
        .split_once('=')
        .ok_or(WspHeaderValueEncodeError::InvalidExpectExpression)?;
    if !is_token(variable) || !is_token(expression) {
        return Err(WspHeaderValueEncodeError::InvalidExpectExpression);
    }
    let mut payload = variable.as_bytes().to_vec();
    payload.push(0);
    payload.extend_from_slice(expression.as_bytes());
    payload.push(0);
    let mut encoded = encode_value_length(payload.len())?;
    encoded.extend_from_slice(&payload);
    Ok(encoded)
}

fn is_token(value: &str) -> bool {
    !value.is_empty()
        && value.bytes().all(|byte| {
            byte.is_ascii_graphic()
                && !matches!(
                    byte,
                    b'(' | b')'
                        | b'<'
                        | b'>'
                        | b'@'
                        | b','
                        | b';'
                        | b':'
                        | b'\\'
                        | b'"'
                        | b'/'
                        | b'['
                        | b']'
                        | b'?'
                        | b'='
                        | b'{'
                        | b'}'
                )
        })
}

fn decode_encoding_version_value(
    raw: &WspRawHeaderValue,
) -> Result<DecodedWspEncodingVersion, WspHeaderSectionDecodeError> {
    match raw.form {
        WspHeaderValueForm::ShortInteger => Ok(DecodedWspEncodingVersion {
            code_page: None,
            version: Some(decode_version_value(&raw.encoded)?),
        }),
        WspHeaderValueForm::TextString => {
            let text = decode_text_value(&raw.encoded)?;
            Ok(DecodedWspEncodingVersion {
                code_page: None,
                version: Some(parse_text_version(text)?),
            })
        }
        WspHeaderValueForm::LengthDelimited => {
            let payload = length_delimited_payload(&raw.encoded)?;
            let code_page = payload
                .first()
                .copied()
                .filter(|byte| byte & WELL_KNOWN_MARKER != 0)
                .map(|byte| byte & 0x7F)
                .ok_or(WspHeaderSectionDecodeError::InvalidEncodingVersion)?;
            let version = if payload.len() == 1 {
                None
            } else {
                Some(decode_version_value(&payload[1..])?)
            };
            Ok(DecodedWspEncodingVersion {
                code_page: Some(code_page),
                version,
            })
        }
    }
}

fn decode_version_value(input: &[u8]) -> Result<WspVersionValue, WspHeaderSectionDecodeError> {
    let first = input
        .first()
        .copied()
        .ok_or(WspHeaderSectionDecodeError::InvalidEncodingVersion)?;
    if first & WELL_KNOWN_MARKER != 0 {
        if input.len() != 1 {
            return Err(WspHeaderSectionDecodeError::InvalidEncodingVersion);
        }
        let value = first & 0x7F;
        let major = value >> 4;
        let minor = value & 0x0F;
        if major == 0 {
            return Err(WspHeaderSectionDecodeError::InvalidEncodingVersion);
        }
        return Ok(WspVersionValue {
            major,
            minor: (minor != 0x0F).then_some(minor),
        });
    }
    let text = decode_text_value(input)?;
    parse_text_version(text)
}

fn parse_text_version(text: &str) -> Result<WspVersionValue, WspHeaderSectionDecodeError> {
    let (major, minor) = text
        .split_once('.')
        .ok_or(WspHeaderSectionDecodeError::InvalidEncodingVersion)?;
    if major.is_empty()
        || minor.is_empty()
        || !major.bytes().all(|byte| byte.is_ascii_digit())
        || !minor.bytes().all(|byte| byte.is_ascii_digit())
    {
        return Err(WspHeaderSectionDecodeError::InvalidEncodingVersion);
    }
    Ok(WspVersionValue {
        major: major
            .parse()
            .map_err(|_| WspHeaderSectionDecodeError::InvalidEncodingVersion)?,
        minor: Some(
            minor
                .parse()
                .map_err(|_| WspHeaderSectionDecodeError::InvalidEncodingVersion)?,
        ),
    })
}

fn decode_text_value(input: &[u8]) -> Result<&str, WspHeaderSectionDecodeError> {
    let terminator = input
        .iter()
        .position(|byte| *byte == 0)
        .ok_or(WspHeaderSectionDecodeError::InvalidEncodingVersion)?;
    if terminator + 1 != input.len() {
        return Err(WspHeaderSectionDecodeError::InvalidEncodingVersion);
    }
    let start = usize::from(input.first().copied() == Some(TEXT_STRING_QUOTE));
    std::str::from_utf8(&input[start..terminator])
        .map_err(|_| WspHeaderSectionDecodeError::InvalidEncodingVersion)
}

fn length_delimited_payload(encoded: &[u8]) -> Result<&[u8], WspHeaderSectionDecodeError> {
    let first = encoded
        .first()
        .copied()
        .ok_or(WspHeaderSectionDecodeError::InvalidEncodingVersion)?;
    let (length, prefix) = if first <= 30 {
        (usize::from(first), 1)
    } else if first == LENGTH_QUOTE {
        let (length, octets) = decode_uintvar(&encoded[1..])?;
        (length, octets + 1)
    } else {
        return Err(WspHeaderSectionDecodeError::InvalidEncodingVersion);
    };
    let end = prefix
        .checked_add(length)
        .ok_or(WspHeaderSectionDecodeError::ValueLengthOverflow)?;
    if end != encoded.len() {
        return Err(WspHeaderSectionDecodeError::InvalidEncodingVersion);
    }
    Ok(&encoded[prefix..end])
}

fn decode_uintvar(input: &[u8]) -> Result<(usize, usize), WspHeaderSectionDecodeError> {
    let mut value = 0u64;
    for (index, byte) in input.iter().copied().take(MAX_UINTVAR_OCTETS).enumerate() {
        value = (value << 7) | u64::from(byte & 0x7F);
        if value > MAX_UINTVAR_VALUE {
            return Err(WspHeaderSectionDecodeError::InvalidUintvar);
        }
        if byte & WELL_KNOWN_MARKER == 0 {
            return Ok((value as usize, index + 1));
        }
    }
    Err(WspHeaderSectionDecodeError::InvalidUintvar)
}

fn encode_uintvar(value: usize) -> Result<Vec<u8>, WspHeaderValueEncodeError> {
    if value > u32::MAX as usize {
        return Err(WspHeaderValueEncodeError::ValueTooLong(value));
    }
    let mut groups = [0u8; MAX_UINTVAR_OCTETS];
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
    let mut encoded = groups[cursor..].to_vec();
    let continuation_octets = encoded.len().saturating_sub(1);
    for byte in encoded.iter_mut().take(continuation_octets) {
        *byte |= WELL_KNOWN_MARKER;
    }
    Ok(encoded)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn value_length_forms_roundtrip_boundaries() {
        for length in [0usize, 1, 30, 31, 127, 128, 16_384] {
            let prefix = encode_value_length(length).expect("length should encode");
            let mut encoded = prefix;
            encoded.resize(encoded.len() + length, 0xAA);
            let (decoded, consumed) = decode_raw_value(&encoded).expect("value should decode");
            assert_eq!(decoded.form, WspHeaderValueForm::LengthDelimited);
            assert_eq!(consumed, encoded.len());
            assert_eq!(decoded.encoded, encoded);
        }
    }

    #[test]
    fn encoding_version_forms_roundtrip() {
        let cases = [
            DecodedWspEncodingVersion {
                code_page: None,
                version: Some(WspEncodingVersion::V1_3.into()),
            },
            DecodedWspEncodingVersion {
                code_page: Some(0x10),
                version: Some(WspEncodingVersion::V1_4.into()),
            },
            DecodedWspEncodingVersion {
                code_page: Some(0x40),
                version: None,
            },
        ];
        for expected in cases {
            let encoded = encode_encoding_version_value(expected).expect("version should encode");
            let (raw, consumed) = decode_raw_value(&encoded).expect("value should frame");
            assert_eq!(consumed, encoded.len());
            assert_eq!(decode_encoding_version_value(&raw), Ok(expected));
        }
    }

    #[test]
    fn expect_expression_uses_sin_length_wrapper() {
        assert_eq!(encode_expect_value("100-continue"), Ok(vec![0x80]));
        assert_eq!(
            encode_expect_value("x-feature=enabled"),
            Ok(vec![
                18, b'x', b'-', b'f', b'e', b'a', b't', b'u', b'r', b'e', 0, b'e', b'n', b'a',
                b'b', b'l', b'e', b'd', 0
            ])
        );
    }

    #[test]
    fn header_decoder_applies_encoding_version_and_expect_grammars() {
        let headers = decode_header_section(
            &[0xB8, 0x80, 0xC3, 0x93],
            WspHeaderSectionDecodePolicy {
                peer_encoding_version: Some(WspEncodingVersion::V1_3),
                ..WspHeaderSectionDecodePolicy::STRICT
            },
        )
        .expect("assigned values should decode");
        assert_eq!(headers[0].value, DecodedWspHeaderValue::ExpectContinue);
        assert_eq!(
            headers[1].value,
            DecodedWspHeaderValue::EncodingVersion {
                raw: WspRawHeaderValue {
                    encoded: vec![0x93],
                    form: WspHeaderValueForm::ShortInteger,
                },
                decoded: DecodedWspEncodingVersion {
                    code_page: None,
                    version: Some(WspVersionValue {
                        major: 1,
                        minor: Some(3),
                    }),
                },
            }
        );
    }

    #[test]
    fn header_decoder_rejects_superseded_unwrapped_expect_expression() {
        let error = decode_header_section(
            &[
                0xB8, b'x', b'-', b'f', b'e', b'a', b't', b'u', b'r', b'e', 0,
            ],
            WspHeaderSectionDecodePolicy {
                peer_encoding_version: Some(WspEncodingVersion::V1_3),
                ..WspHeaderSectionDecodePolicy::STRICT
            },
        )
        .expect_err("SIN 001 requires value-length");
        assert_eq!(error, WspHeaderSectionDecodeError::InvalidExpectEncoding);
    }

    #[test]
    fn encoding_version_extension_page_identity_roundtrips_in_header_section() {
        let value = DecodedWspEncodingVersion {
            code_page: Some(0x40),
            version: Some(WspEncodingVersion::V1_4.into()),
        };
        let mut section = vec![0xC3];
        section.extend_from_slice(&encode_encoding_version_value(value).expect("encode"));
        let headers = decode_header_section(
            &section,
            WspHeaderSectionDecodePolicy {
                peer_encoding_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderSectionDecodePolicy::STRICT
            },
        )
        .expect("decode");
        assert!(matches!(
            &headers[0].value,
            DecodedWspHeaderValue::EncodingVersion { decoded, .. } if *decoded == value
        ));
    }
}
