use crate::network::wsp::header_registry::{
    decode_header_field_name_on_page, header_code_page_name, is_negotiated_extension_page,
    WspAssignedNumberError, WspAssignedNumberPolicy, DEFAULT_HEADER_CODE_PAGE,
    HEADER_CODE_PAGE_SHIFT,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum UnsupportedCodePageBehavior {
    Error,
    IgnoreExtensionHeaders,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct HeaderStreamDecodePolicy {
    pub assigned_numbers: WspAssignedNumberPolicy,
    pub unsupported_code_page: UnsupportedCodePageBehavior,
}

impl HeaderStreamDecodePolicy {
    pub const STRICT: Self = Self {
        assigned_numbers: WspAssignedNumberPolicy::STRICT,
        unsupported_code_page: UnsupportedCodePageBehavior::Error,
    };

    pub const HEADER_LENIENT: Self = Self {
        assigned_numbers: WspAssignedNumberPolicy::HEADER_LENIENT,
        unsupported_code_page: UnsupportedCodePageBehavior::IgnoreExtensionHeaders,
    };
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DecodedHeaderField {
    pub page: u8,
    pub name: &'static str,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WspHeaderStreamDecodeError {
    TruncatedShiftSequence,
    UnsupportedCodePage(u8),
    UnknownAssignedNumber(WspAssignedNumberError),
}

impl std::fmt::Display for WspHeaderStreamDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TruncatedShiftSequence => write!(f, "truncated header code page shift"),
            Self::UnsupportedCodePage(page) => {
                write!(f, "unsupported header code page: 0x{page:02X}")
            }
            Self::UnknownAssignedNumber(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for WspHeaderStreamDecodeError {}

pub fn decode_header_field_name_stream(
    input: &[u8],
    policy: HeaderStreamDecodePolicy,
) -> Result<Vec<DecodedHeaderField>, WspHeaderStreamDecodeError> {
    let mut decoded = Vec::new();
    let mut current_page = DEFAULT_HEADER_CODE_PAGE;
    let mut skip_extension_tokens = false;
    let mut cursor = 0usize;

    while cursor < input.len() {
        let byte = input[cursor];
        cursor += 1;

        if byte == HEADER_CODE_PAGE_SHIFT {
            let Some(next_page) = input.get(cursor).copied() else {
                return Err(WspHeaderStreamDecodeError::TruncatedShiftSequence);
            };
            cursor += 1;

            if header_code_page_name(next_page).is_some() {
                current_page = next_page;
                skip_extension_tokens = false;
                continue;
            }

            if is_negotiated_extension_page(next_page)
                && matches!(
                    policy.unsupported_code_page,
                    UnsupportedCodePageBehavior::IgnoreExtensionHeaders
                )
            {
                current_page = next_page;
                skip_extension_tokens = true;
                continue;
            }

            return Err(WspHeaderStreamDecodeError::UnsupportedCodePage(next_page));
        }

        if skip_extension_tokens {
            continue;
        }

        let name = decode_header_field_name_on_page(current_page, byte, policy.assigned_numbers)
            .map_err(WspHeaderStreamDecodeError::UnknownAssignedNumber)?;
        if let Some(name) = name {
            decoded.push(DecodedHeaderField {
                page: current_page,
                name,
            });
        }
    }

    Ok(decoded)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wsp::header_registry::HEADER_CODE_PAGE_SHIFT;

    #[test]
    fn decodes_default_page_headers_without_shift() {
        let decoded =
            decode_header_field_name_stream(&[0x00, 0x11, 0x24], HeaderStreamDecodePolicy::STRICT)
                .expect("default page should decode");

        assert_eq!(
            decoded,
            vec![
                DecodedHeaderField {
                    page: 0x01,
                    name: "Accept",
                },
                DecodedHeaderField {
                    page: 0x01,
                    name: "Content-Type",
                },
                DecodedHeaderField {
                    page: 0x01,
                    name: "Referer",
                },
            ]
        );
    }

    #[test]
    fn decodes_shifted_extension_page_headers_when_page_is_known() {
        let decoded = decode_header_field_name_stream(
            &[HEADER_CODE_PAGE_SHIFT, 0x40, 0x10, 0x11],
            HeaderStreamDecodePolicy::STRICT,
        )
        .expect("known extension page should decode");

        assert_eq!(
            decoded,
            vec![
                DecodedHeaderField {
                    page: 0x40,
                    name: "X-Wap-Ack",
                },
                DecodedHeaderField {
                    page: 0x40,
                    name: "X-Wap-Ack-Id",
                },
            ]
        );
    }

    #[test]
    fn strict_policy_rejects_unsupported_extension_page() {
        let error = decode_header_field_name_stream(
            &[HEADER_CODE_PAGE_SHIFT, 0x41, 0x10],
            HeaderStreamDecodePolicy::STRICT,
        )
        .expect_err("unknown page should fail");

        assert_eq!(error, WspHeaderStreamDecodeError::UnsupportedCodePage(0x41));
    }

    #[test]
    fn lenient_policy_ignores_tokens_on_unsupported_extension_page_until_next_shift() {
        let decoded = decode_header_field_name_stream(
            &[
                HEADER_CODE_PAGE_SHIFT,
                0x41,
                0x10,
                0x11,
                HEADER_CODE_PAGE_SHIFT,
                0x01,
                0x29,
            ],
            HeaderStreamDecodePolicy::HEADER_LENIENT,
        )
        .expect("lenient page fallback should decode");

        assert_eq!(
            decoded,
            vec![DecodedHeaderField {
                page: 0x01,
                name: "User-Agent",
            }]
        );
    }

    #[test]
    fn rejects_truncated_shift_sequence() {
        let error = decode_header_field_name_stream(
            &[HEADER_CODE_PAGE_SHIFT],
            HeaderStreamDecodePolicy::STRICT,
        )
        .expect_err("truncated shifts should fail");

        assert_eq!(error, WspHeaderStreamDecodeError::TruncatedShiftSequence);
    }
}
