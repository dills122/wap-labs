use crate::network::wsp::decoder::UnsupportedCodePageBehavior;
use crate::network::wsp::header_registry::{
    encode_header_field_name_on_page, resolve_header_field_page, DEFAULT_HEADER_CODE_PAGE,
    HEADER_CODE_PAGE_SHIFT,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct HeaderEncodePolicy {
    pub binary_encoding: bool,
    pub unsupported_code_page: UnsupportedCodePageBehavior,
}

impl HeaderEncodePolicy {
    pub const STRICT_BINARY: Self = Self {
        binary_encoding: true,
        unsupported_code_page: UnsupportedCodePageBehavior::Error,
    };

    pub const TEXT_FALLBACK: Self = Self {
        binary_encoding: true,
        unsupported_code_page: UnsupportedCodePageBehavior::IgnoreExtensionHeaders,
    };
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspHeaderEncodeError {
    UnsupportedCodePage(u8),
    UnregisteredHeaderName(String),
}

impl std::fmt::Display for WspHeaderEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedCodePage(page) => {
                write!(f, "unsupported header code page: 0x{page:02X}")
            }
            Self::UnregisteredHeaderName(name) => {
                write!(f, "unregistered header field name: {name}")
            }
        }
    }
}

impl std::error::Error for WspHeaderEncodeError {}

pub fn encode_header_field_name(
    name: &str,
    policy: HeaderEncodePolicy,
) -> Result<Vec<u8>, WspHeaderEncodeError> {
    let page = resolve_header_field_page(name).unwrap_or(DEFAULT_HEADER_CODE_PAGE);

    if !policy.binary_encoding {
        return Ok(encode_text_header(name));
    }

    if let Some(token) = encode_header_field_name_on_page(name, page) {
        if page == DEFAULT_HEADER_CODE_PAGE {
            return Ok(vec![token]);
        }

        if matches!(
            policy.unsupported_code_page,
            UnsupportedCodePageBehavior::IgnoreExtensionHeaders
        ) {
            return Ok(encode_text_header(name));
        }

        return Ok(vec![HEADER_CODE_PAGE_SHIFT, page, token]);
    }

    if resolve_header_field_page(name).is_some() {
        return Err(WspHeaderEncodeError::UnsupportedCodePage(page));
    }

    if matches!(
        policy.unsupported_code_page,
        UnsupportedCodePageBehavior::IgnoreExtensionHeaders
    ) {
        return Ok(encode_text_header(name));
    }

    Err(WspHeaderEncodeError::UnregisteredHeaderName(
        name.to_string(),
    ))
}

fn encode_text_header(name: &str) -> Vec<u8> {
    let mut out = name.as_bytes().to_vec();
    out.push(0x00);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_default_page_headers_as_single_octet() {
        let encoded = encode_header_field_name("Content-Type", HeaderEncodePolicy::STRICT_BINARY)
            .expect("default page headers should encode");
        assert_eq!(encoded, vec![0x11]);
    }

    #[test]
    fn encodes_extension_page_headers_with_shift_sequence() {
        let encoded = encode_header_field_name("X-Wap-Ack", HeaderEncodePolicy::STRICT_BINARY)
            .expect("extension headers should encode");
        assert_eq!(encoded, vec![HEADER_CODE_PAGE_SHIFT, 0x40, 0x10]);
    }

    #[test]
    fn lenient_policy_falls_back_to_text_for_extension_headers() {
        let encoded = encode_header_field_name("X-App-Trace", HeaderEncodePolicy::TEXT_FALLBACK)
            .expect("text fallback should be allowed");
        assert_eq!(encoded, b"X-App-Trace\0".to_vec());
    }

    #[test]
    fn strict_policy_rejects_unregistered_headers() {
        let error = encode_header_field_name("X-Unknown", HeaderEncodePolicy::STRICT_BINARY)
            .expect_err("strict encoding should reject unknown names");
        assert_eq!(
            error,
            WspHeaderEncodeError::UnregisteredHeaderName("X-Unknown".to_string())
        );
    }
}
