#![allow(dead_code)]

use crate::network::wsp::header_registry::is_negotiated_extension_page;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct WspEncodingVersion {
    pub major: u8,
    pub minor: u8,
}

impl WspEncodingVersion {
    pub const V1_2: Self = Self { major: 1, minor: 2 };
    pub const V1_3: Self = Self { major: 1, minor: 3 };
    pub const V1_4: Self = Self { major: 1, minor: 4 };
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspEncodingVersionPolicy {
    pub default_peer_version: WspEncodingVersion,
    pub default_extension_page_version: WspEncodingVersion,
    pub server_max_version: WspEncodingVersion,
}

impl Default for WspEncodingVersionPolicy {
    fn default() -> Self {
        Self {
            default_peer_version: WspEncodingVersion::V1_2,
            default_extension_page_version: WspEncodingVersion::V1_2,
            server_max_version: WspEncodingVersion::V1_4,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BinaryHeaderEncodingDecision {
    UseBinary,
    UseTextFallback,
    UnsupportedCodePage,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum IncomingBinaryHeaderStatus {
    Accepted,
    UnsupportedEncodingVersion,
    UnsupportedCodePage,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspEncodingVersionHeader {
    pub code_page: Option<u8>,
    pub version: Option<WspEncodingVersion>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspEncodingVersionErrorResponse {
    pub status_code: u16,
    pub supported_header: WspEncodingVersionHeader,
}

pub fn choose_response_encoding_version(
    request_version: Option<WspEncodingVersion>,
    policy: WspEncodingVersionPolicy,
) -> WspEncodingVersion {
    let requested = request_version.unwrap_or(policy.default_peer_version);
    requested.min(policy.server_max_version)
}

pub fn determine_outbound_header_encoding(
    header_name: &str,
    code_page: u8,
    recipient_version: Option<WspEncodingVersion>,
    negotiated_extension_pages: &[u8],
    policy: WspEncodingVersionPolicy,
) -> BinaryHeaderEncodingDecision {
    let recipient_version = recipient_version.unwrap_or(policy.default_peer_version);
    let minimum_version = minimum_binary_version_for_header(header_name, code_page, policy);

    if is_negotiated_extension_page(code_page) && !negotiated_extension_pages.contains(&code_page) {
        return BinaryHeaderEncodingDecision::UseTextFallback;
    }

    if minimum_version <= recipient_version {
        BinaryHeaderEncodingDecision::UseBinary
    } else if is_negotiated_extension_page(code_page) {
        BinaryHeaderEncodingDecision::UnsupportedCodePage
    } else {
        BinaryHeaderEncodingDecision::UseTextFallback
    }
}

pub fn incoming_binary_header_status(
    header_name: &str,
    code_page: u8,
    negotiated_version: Option<WspEncodingVersion>,
    negotiated_extension_pages: &[u8],
    policy: WspEncodingVersionPolicy,
) -> IncomingBinaryHeaderStatus {
    let peer_version = negotiated_version.unwrap_or(policy.default_peer_version);
    let minimum_version = minimum_binary_version_for_header(header_name, code_page, policy);

    if is_negotiated_extension_page(code_page) && !negotiated_extension_pages.contains(&code_page) {
        return IncomingBinaryHeaderStatus::UnsupportedCodePage;
    }

    if minimum_version <= peer_version {
        IncomingBinaryHeaderStatus::Accepted
    } else {
        IncomingBinaryHeaderStatus::UnsupportedEncodingVersion
    }
}

pub fn unsupported_binary_error_response(
    code_page: Option<u8>,
    policy: WspEncodingVersionPolicy,
) -> WspEncodingVersionErrorResponse {
    let supported_header =
        if let Some(code_page) = code_page.filter(|page| is_negotiated_extension_page(*page)) {
            WspEncodingVersionHeader {
                code_page: Some(code_page),
                version: None,
            }
        } else {
            WspEncodingVersionHeader {
                code_page: None,
                version: Some(policy.server_max_version),
            }
        };

    WspEncodingVersionErrorResponse {
        status_code: 400,
        supported_header,
    }
}

fn minimum_binary_version_for_header(
    header_name: &str,
    code_page: u8,
    policy: WspEncodingVersionPolicy,
) -> WspEncodingVersion {
    if is_negotiated_extension_page(code_page) {
        return policy.default_extension_page_version;
    }

    match header_name {
        "Profile" | "Profile-Diff" | "Profile-Warning-Deprecated" => WspEncodingVersion::V1_2,
        "Expect" | "TE" | "Trailer" | "Accept-Charset" | "Accept-Encoding" | "Cache-Control"
        | "Content-Range" | "X-Wap-Tod" | "Content-ID" | "Set-Cookie" | "Cookie"
        | "Encoding-Version" => WspEncodingVersion::V1_3,
        "Profile-Warning" | "Content-Disposition" | "X-WAP-Security" | "Cache-Control-1.4" => {
            WspEncodingVersion::V1_4
        }
        _ => WspEncodingVersion::V1_2,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chooses_response_version_by_capping_request_to_server_max() {
        let policy = WspEncodingVersionPolicy::default();
        assert_eq!(
            choose_response_encoding_version(Some(WspEncodingVersion::V1_3), policy),
            WspEncodingVersion::V1_3
        );
        assert_eq!(
            choose_response_encoding_version(
                Some(WspEncodingVersion { major: 2, minor: 0 }),
                policy
            ),
            WspEncodingVersion::V1_4
        );
        assert_eq!(
            choose_response_encoding_version(None, policy),
            WspEncodingVersion::V1_2
        );
    }

    #[test]
    fn outbound_header_encoding_falls_back_to_text_when_peer_version_is_too_low() {
        let decision = determine_outbound_header_encoding(
            "Encoding-Version",
            0x01,
            Some(WspEncodingVersion::V1_2),
            &[],
            WspEncodingVersionPolicy::default(),
        );
        assert_eq!(decision, BinaryHeaderEncodingDecision::UseTextFallback);
    }

    #[test]
    fn outbound_extension_header_requires_negotiated_page_for_binary_encoding() {
        let policy = WspEncodingVersionPolicy::default();
        assert_eq!(
            determine_outbound_header_encoding(
                "X-Wap-Ack",
                0x40,
                Some(WspEncodingVersion::V1_4),
                &[],
                policy,
            ),
            BinaryHeaderEncodingDecision::UseTextFallback
        );
        assert_eq!(
            determine_outbound_header_encoding(
                "X-Wap-Ack",
                0x40,
                Some(WspEncodingVersion::V1_4),
                &[0x40],
                policy,
            ),
            BinaryHeaderEncodingDecision::UseBinary
        );
    }

    #[test]
    fn incoming_binary_header_status_rejects_unsupported_version_or_page() {
        let policy = WspEncodingVersionPolicy::default();
        assert_eq!(
            incoming_binary_header_status(
                "Content-Disposition",
                0x01,
                Some(WspEncodingVersion::V1_3),
                &[],
                policy,
            ),
            IncomingBinaryHeaderStatus::UnsupportedEncodingVersion
        );
        assert_eq!(
            incoming_binary_header_status(
                "X-App-Trace",
                0x10,
                Some(WspEncodingVersion::V1_4),
                &[],
                policy,
            ),
            IncomingBinaryHeaderStatus::UnsupportedCodePage
        );
    }

    #[test]
    fn unsupported_binary_error_response_matches_spec_shape_for_page_and_version_failures() {
        let policy = WspEncodingVersionPolicy::default();

        let version_error = unsupported_binary_error_response(None, policy);
        assert_eq!(version_error.status_code, 400);
        assert_eq!(
            version_error.supported_header,
            WspEncodingVersionHeader {
                code_page: None,
                version: Some(WspEncodingVersion::V1_4),
            }
        );

        let page_error = unsupported_binary_error_response(Some(0x40), policy);
        assert_eq!(
            page_error.supported_header,
            WspEncodingVersionHeader {
                code_page: Some(0x40),
                version: None,
            }
        );
    }
}
