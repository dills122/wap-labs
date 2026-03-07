pub use crate::network::wsp::header_registry::{
    WspAssignedNumberError, WspAssignedNumberKind, WspAssignedNumberPolicy,
};
use crate::network::wsp::{
    decode_abort_reason as decode_abort_reason_impl, decode_header_field_name_on_page,
    decode_header_field_name_stream, decode_pdu_type as decode_pdu_type_impl,
    decode_well_known_parameter as decode_well_known_parameter_impl,
    encode_abort_reason as encode_abort_reason_impl, encode_header_field_name,
    encode_header_field_name_on_page, encode_pdu_type as encode_pdu_type_impl,
    encode_well_known_parameter as encode_well_known_parameter_impl, DecodedHeaderField,
    HeaderEncodePolicy, HeaderStreamDecodePolicy, WspHeaderEncodeError, WspHeaderStreamDecodeError,
    DEFAULT_HEADER_CODE_PAGE,
};

pub fn decode_header_field_name(
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    decode_header_field_name_on_page(DEFAULT_HEADER_CODE_PAGE, code, policy)
}

pub fn encode_header_field_name_token(name: &str) -> Option<u8> {
    encode_header_field_name_on_page(name, DEFAULT_HEADER_CODE_PAGE)
}

pub fn encode_header_field_name_bytes(
    name: &str,
    policy: HeaderEncodePolicy,
) -> Result<Vec<u8>, WspHeaderEncodeError> {
    encode_header_field_name(name, policy)
}

pub fn decode_header_field_name_bytes(
    input: &[u8],
    policy: HeaderStreamDecodePolicy,
) -> Result<Vec<DecodedHeaderField>, WspHeaderStreamDecodeError> {
    decode_header_field_name_stream(input, policy)
}

pub fn encode_pdu_type_name(name: &str) -> Option<u8> {
    encode_pdu_type(name)
}

pub fn encode_abort_reason_name(name: &str) -> Option<u8> {
    encode_abort_reason(name)
}

pub fn encode_well_known_parameter_name(name: &str) -> Option<u8> {
    encode_well_known_parameter(name)
}

pub fn decode_pdu_type_name(
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    decode_pdu_type_impl(code, policy)
}

pub fn decode_abort_reason_name(
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    decode_abort_reason_impl(code, policy)
}

pub fn decode_well_known_parameter_name(
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    decode_well_known_parameter_impl(code, policy)
}

pub fn encode_pdu_type(name: &str) -> Option<u8> {
    encode_pdu_type_impl(name)
}

pub fn encode_abort_reason(name: &str) -> Option<u8> {
    encode_abort_reason_impl(name)
}

pub fn encode_well_known_parameter(name: &str) -> Option<u8> {
    encode_well_known_parameter_impl(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wsp::decoder::UnsupportedCodePageBehavior;
    use crate::network::wsp::header_registry::HEADER_CODE_PAGE_SHIFT;
    use serde::Deserialize;
    use std::fs;
    use std::path::PathBuf;

    #[derive(Debug, Deserialize)]
    struct RegistryFixture {
        pdu_types: Vec<RegistryEntry>,
        abort_reasons: Vec<RegistryEntry>,
        well_known_parameters: Vec<RegistryEntry>,
        header_field_names: Vec<RegistryEntry>,
        unknown_cases: Vec<UnknownCase>,
        #[serde(rename = "code_page_cases")]
        code_page_cases: Vec<CodePageCase>,
    }

    #[derive(Debug, Deserialize)]
    struct RegistryEntry {
        code: u8,
        name: String,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct UnknownCase {
        category: String,
        code: u8,
        policy: String,
        expected: String,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct CodePageCase {
        name: String,
        input: Vec<u8>,
        policy: String,
        expected: Vec<String>,
    }

    fn load_fixture() -> RegistryFixture {
        let fixture_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join("transport")
            .join("wsp_assigned_number_registry_mapped")
            .join("registry_fixture.json");
        let raw = fs::read_to_string(&fixture_path)
            .unwrap_or_else(|_| panic!("failed reading {}", fixture_path.display()));
        serde_json::from_str(&raw)
            .unwrap_or_else(|_| panic!("failed parsing {}", fixture_path.display()))
    }

    fn decode_for_category(
        category: &str,
        code: u8,
        policy: WspAssignedNumberPolicy,
    ) -> Result<Option<&'static str>, WspAssignedNumberError> {
        match category {
            "pduType" => decode_pdu_type_name(code, policy),
            "abortReason" => decode_abort_reason_name(code, policy),
            "wellKnownParameter" => decode_well_known_parameter_name(code, policy),
            "headerFieldName" => decode_header_field_name(code, policy),
            other => panic!("unsupported category: {other}"),
        }
    }

    fn encode_for_category(category: &str, name: &str) -> Option<u8> {
        match category {
            "pduType" => encode_pdu_type_name(name),
            "abortReason" => encode_abort_reason_name(name),
            "wellKnownParameter" => encode_well_known_parameter_name(name),
            "headerFieldName" => encode_header_field_name_token(name),
            other => panic!("unsupported category: {other}"),
        }
    }

    fn assert_roundtrip(entries: &[RegistryEntry], category: &str) {
        for entry in entries {
            let decoded =
                decode_for_category(category, entry.code, WspAssignedNumberPolicy::STRICT)
                    .expect("known assigned number should decode");
            assert_eq!(decoded, Some(entry.name.as_str()));
            assert_eq!(encode_for_category(category, &entry.name), Some(entry.code));
        }
    }

    fn decode_policy(name: &str) -> HeaderStreamDecodePolicy {
        match name {
            "strict" => HeaderStreamDecodePolicy::STRICT,
            "header-lenient" => HeaderStreamDecodePolicy::HEADER_LENIENT,
            other => panic!("unsupported policy: {other}"),
        }
    }

    #[test]
    fn wsp_assigned_number_fixture_roundtrips_across_registry_groups() {
        let fixture = load_fixture();
        assert_roundtrip(&fixture.pdu_types, "pduType");
        assert_roundtrip(&fixture.abort_reasons, "abortReason");
        assert_roundtrip(&fixture.well_known_parameters, "wellKnownParameter");
        assert_roundtrip(&fixture.header_field_names, "headerFieldName");
    }

    #[test]
    fn wsp_assigned_number_unknown_behavior_is_profile_deterministic() {
        let fixture = load_fixture();
        for case in &fixture.unknown_cases {
            let policy = match case.policy.as_str() {
                "strict" => WspAssignedNumberPolicy::STRICT,
                "header-lenient" => WspAssignedNumberPolicy::HEADER_LENIENT,
                other => panic!("unsupported policy: {other}"),
            };
            let result = decode_for_category(&case.category, case.code, policy);
            match case.expected.as_str() {
                "error" => assert!(result.is_err(), "expected error for {:?}", case),
                "ignored" => assert_eq!(result.expect("expected ignore"), None),
                other => panic!("unsupported expected outcome: {other}"),
            }
        }
    }

    #[test]
    fn wsp_header_code_page_behavior_is_profile_deterministic() {
        let fixture = load_fixture();
        for case in &fixture.code_page_cases {
            let decoded = decode_header_field_name_bytes(&case.input, decode_policy(&case.policy))
                .unwrap_or_else(|error| panic!("case '{}' failed: {error}", case.name));
            let names: Vec<String> = decoded
                .iter()
                .map(|header| header.name.to_string())
                .collect();
            assert_eq!(names, case.expected, "case '{}' failed", case.name);
        }
    }

    #[test]
    fn wsp_assigned_number_lookups_are_pure_and_repeatable() {
        let first = decode_pdu_type_name(0x01, WspAssignedNumberPolicy::STRICT).unwrap_or(None);
        let second = decode_pdu_type_name(0x01, WspAssignedNumberPolicy::STRICT).unwrap_or(None);
        assert_eq!(first, second);
        assert_eq!(first, Some("Connect"));
    }

    #[test]
    fn wsp_header_bytes_encoder_uses_shift_for_known_extension_pages() {
        let encoded =
            encode_header_field_name_bytes("X-Wap-Ack", HeaderEncodePolicy::STRICT_BINARY)
                .expect("known extension headers should encode");
        assert_eq!(encoded, vec![HEADER_CODE_PAGE_SHIFT, 0x40, 0x10]);
    }

    #[test]
    fn wsp_header_bytes_encoder_falls_back_to_text_in_lenient_mode() {
        let encoded =
            encode_header_field_name_bytes("X-App-Trace", HeaderEncodePolicy::TEXT_FALLBACK)
                .expect("lenient profile should use text");
        assert_eq!(encoded, b"X-App-Trace\0".to_vec());
        assert_eq!(
            UnsupportedCodePageBehavior::IgnoreExtensionHeaders,
            HeaderStreamDecodePolicy::HEADER_LENIENT.unsupported_code_page
        );
    }
}
