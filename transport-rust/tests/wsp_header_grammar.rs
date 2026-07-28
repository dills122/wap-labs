use lowband_transport_rust::network::wsp::header_registry::{
    default_header_definition, default_header_definitions, header_code_page_class,
    WspHeaderCodePageClass, WspHeaderValueGrammar,
};
use lowband_transport_rust::network::wsp::{
    decode_header_section, decode_raw_value, encode_header_block, encode_value_length,
    parse_encoding_version_header_value, DecodedWspHeaderName, UnknownHeaderBehavior,
    WspEncodingVersion, WspEncodingVersionHeader, WspHeaderBlock, WspHeaderBlockEncodeError,
    WspHeaderBlockEncodePolicy, WspHeaderField, WspHeaderNameEncoding,
    WspHeaderSectionDecodePolicy, WspHeaderValueEncodeError, WspHeaderValueForm,
};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Fixture {
    schema_version: u8,
    work_item: String,
    effective_sequence: Vec<String>,
    default_header_count: usize,
    default_header_first_code: u8,
    default_header_last_code: u8,
    deprecated_codes: Vec<u8>,
    version_boundaries: Vec<VersionBoundary>,
    encoding_version_text_cases: Vec<EncodingVersionTextCase>,
    header_sections: Vec<HeaderSectionCase>,
}

#[derive(Debug, Deserialize)]
struct VersionBoundary {
    code: u8,
    name: String,
    major: u8,
    minor: u8,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EncodingVersionTextCase {
    name: String,
    input: String,
    expected_code_page: Option<u8>,
    expected_version: Option<ExpectedVersion>,
    expected_encoded: Option<Vec<u8>>,
}

#[derive(Debug, Deserialize)]
struct ExpectedVersion {
    major: u8,
    minor: u8,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HeaderSectionCase {
    name: String,
    encoded: Vec<u8>,
    peer_minor: u8,
    negotiated_pages: Vec<u8>,
    unknown_policy: String,
    expected_names: Vec<String>,
}

fn fixture() -> Fixture {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures/transport/wsp_header_grammar_mapped/header_fixture.json");
    serde_json::from_str(&fs::read_to_string(path).expect("fixture should be readable"))
        .expect("fixture should parse")
}

#[test]
fn effective_default_header_registry_is_complete_and_versioned() {
    let fixture = fixture();
    assert_eq!(fixture.schema_version, 1);
    assert_eq!(fixture.work_item, "WSP-802");
    assert_eq!(
        fixture.effective_sequence,
        [
            "WAP-203-WSP",
            "WAP-203_001-WSP",
            "WAP-203_003-WSP",
            "WAP-203_005-WSP",
        ]
    );

    let definitions = default_header_definitions();
    assert_eq!(definitions.len(), fixture.default_header_count);
    assert_eq!(
        definitions.first().map(|entry| entry.code),
        Some(fixture.default_header_first_code)
    );
    assert_eq!(
        definitions.last().map(|entry| entry.code),
        Some(fixture.default_header_last_code)
    );
    for (expected_code, definition) in (0u8..=67).zip(definitions) {
        assert_eq!(definition.code, expected_code);
        assert_ne!(
            definition.grammar,
            WspHeaderValueGrammar::ApplicationSpecific
        );
    }
    let deprecated: Vec<u8> = definitions
        .iter()
        .filter(|entry| entry.deprecated)
        .map(|entry| entry.code)
        .collect();
    assert_eq!(deprecated, fixture.deprecated_codes);

    for expected in fixture.version_boundaries {
        let definition = default_header_definition(expected.code).expect("assigned header");
        assert_eq!(definition.name, expected.name);
        assert_eq!(
            definition.minimum_version,
            WspEncodingVersion {
                major: expected.major,
                minor: expected.minor,
            }
        );
    }
    assert!(default_header_definition(68).is_none());
}

#[test]
fn mapped_header_sections_decode_with_explicit_unknown_policy() {
    for case in fixture().header_sections {
        let unknown_header = match case.unknown_policy.as_str() {
            "error" => UnknownHeaderBehavior::Error,
            "preserve" => UnknownHeaderBehavior::Preserve,
            "skip" => UnknownHeaderBehavior::Skip,
            other => panic!("unknown policy {other}"),
        };
        let decoded = decode_header_section(
            &case.encoded,
            WspHeaderSectionDecodePolicy {
                unknown_header,
                unsupported_code_page:
                    lowband_transport_rust::network::wsp::decoder::UnsupportedCodePageBehavior::Error,
                negotiated_extension_pages: &case.negotiated_pages,
                peer_encoding_version: Some(WspEncodingVersion {
                    major: 1,
                    minor: case.peer_minor,
                }),
            },
        )
        .unwrap_or_else(|error| panic!("case '{}' failed: {error}", case.name));
        let names: Vec<String> = decoded
            .iter()
            .map(|header| match &header.name {
                DecodedWspHeaderName::WellKnown { name, .. } => (*name).to_string(),
                DecodedWspHeaderName::Application(name) => name.clone(),
                DecodedWspHeaderName::Unknown { page, code } => {
                    format!("unknown:{page:02X}:{code:02X}")
                }
            })
            .collect();
        assert_eq!(names, case.expected_names, "case '{}' failed", case.name);
    }
}

#[test]
fn value_length_boundary_space_roundtrips_without_panics() {
    for length in 0usize..=512 {
        let mut encoded = encode_value_length(length).expect("bounded length should encode");
        encoded.resize(encoded.len() + length, 0xAA);
        let (decoded, consumed) = decode_raw_value(&encoded).expect("encoded value should decode");
        assert_eq!(decoded.form, WspHeaderValueForm::LengthDelimited);
        assert_eq!(decoded.encoded, encoded);
        assert_eq!(consumed, encoded.len());
    }
}

#[test]
fn encoding_version_text_parser_accepts_only_complete_defined_forms() {
    for case in fixture().encoding_version_text_cases {
        let expected = case
            .expected_encoded
            .as_ref()
            .map(|_| WspEncodingVersionHeader {
                code_page: case.expected_code_page,
                version: case.expected_version.map(|version| WspEncodingVersion {
                    major: version.major,
                    minor: version.minor,
                }),
            });

        assert_eq!(
            parse_encoding_version_header_value(&case.input),
            expected,
            "case '{}' failed",
            case.name
        );
    }
}

#[test]
fn encoding_version_text_encoding_is_byte_exact_or_rejected() {
    for case in fixture().encoding_version_text_cases {
        let block = WspHeaderBlock {
            headers: vec![WspHeaderField {
                name: "Encoding-Version".to_string(),
                value: case.input.clone(),
                name_encoding: WspHeaderNameEncoding::Binary { page: 1 },
            }],
            encoding_version_headers: Vec::new(),
        };
        let result = encode_header_block(
            &block,
            WspHeaderBlockEncodePolicy {
                recipient_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderBlockEncodePolicy::STRICT
            },
        );

        match case.expected_encoded {
            Some(expected) => assert_eq!(result, Ok(expected), "case '{}' failed", case.name),
            None => assert_eq!(
                result,
                Err(WspHeaderBlockEncodeError::HeaderValue(
                    WspHeaderValueEncodeError::InvalidVersion,
                )),
                "case '{}' failed",
                case.name
            ),
        }
    }
}

#[test]
fn code_page_ranges_match_the_assigned_registry_contract() {
    assert_eq!(header_code_page_class(1), WspHeaderCodePageClass::Default);
    for page in 2..=15 {
        assert_eq!(
            header_code_page_class(page),
            WspHeaderCodePageClass::WapReserved
        );
    }
    for page in 16..=127 {
        assert_eq!(
            header_code_page_class(page),
            WspHeaderCodePageClass::Application
        );
    }
    for page in [0, 128, 255] {
        assert_eq!(
            header_code_page_class(page),
            WspHeaderCodePageClass::FutureReserved
        );
    }
}
