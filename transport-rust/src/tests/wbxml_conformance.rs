use super::*;
use crate::wbxml_decoder::{decode_wml13, WML13_DECODER_ID};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConformanceCorpus {
    decoder: String,
    source_documents: Vec<String>,
    fixtures: Vec<ConformanceFixture>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConformanceFixture {
    id: String,
    scr: Vec<String>,
    clauses: Vec<String>,
    source_sections: Vec<String>,
    bytes_hex: String,
    expected_xml: Option<String>,
    expected_error_contains: Option<String>,
    equivalent_group: Option<String>,
}

fn load_conformance_corpus() -> ConformanceCorpus {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures/transport/wbxml_wml13/conformance.json");
    let bytes = fs::read(path).expect("WBXML conformance corpus should be readable");
    serde_json::from_slice(&bytes).expect("WBXML conformance corpus should parse")
}

fn decode_hex(value: &str) -> Vec<u8> {
    let compact: String = value
        .chars()
        .filter(|character| !character.is_whitespace())
        .collect();
    assert_eq!(
        compact.len() % 2,
        0,
        "fixture hex must contain complete octets"
    );
    compact
        .as_bytes()
        .chunks_exact(2)
        .map(|pair| {
            let text = std::str::from_utf8(pair).expect("hex pair should be UTF-8");
            u8::from_str_radix(text, 16).expect("fixture should contain hexadecimal octets")
        })
        .collect()
}

fn run_scr_fixtures(scr: &str) -> HashMap<String, String> {
    let corpus = load_conformance_corpus();
    assert_eq!(corpus.decoder, WML13_DECODER_ID);
    assert_eq!(
        corpus.source_documents,
        ["WAP-192-WBXML", "WAP-191_104-WML"]
    );

    let fixtures: Vec<_> = corpus
        .fixtures
        .iter()
        .filter(|fixture| fixture.scr.iter().any(|candidate| candidate == scr))
        .collect();
    assert!(!fixtures.is_empty(), "{scr} must have direct fixtures");

    let mut equivalent_outputs = HashMap::new();
    for fixture in fixtures {
        assert!(
            !fixture.clauses.is_empty(),
            "{} must cite selected clause IDs",
            fixture.id
        );
        assert!(
            !fixture.source_sections.is_empty(),
            "{} must cite source sections",
            fixture.id
        );
        let result = decode_wml13(&decode_hex(&fixture.bytes_hex), 64 * 1024);
        match (&fixture.expected_xml, &fixture.expected_error_contains) {
            (Some(expected_xml), None) => {
                let xml = result.unwrap_or_else(|error| {
                    panic!("{} should decode successfully: {error}", fixture.id)
                });
                assert_eq!(&xml, expected_xml, "{} decoded XML drift", fixture.id);
                if let Some(group) = &fixture.equivalent_group {
                    if let Some(previous) = equivalent_outputs.insert(group.clone(), xml.clone()) {
                        assert_eq!(
                            xml, previous,
                            "{} must match equivalent fixture group {group}",
                            fixture.id
                        );
                    }
                }
            }
            (None, Some(expected_error)) => {
                let error = result.expect_err(&format!("{} should fail", fixture.id));
                assert!(
                    error.contains(expected_error),
                    "{} error {error:?} must contain {expected_error:?}",
                    fixture.id
                );
            }
            _ => panic!(
                "{} must define exactly one deterministic expected outcome",
                fixture.id
            ),
        }
    }
    equivalent_outputs
}

#[test]
fn transport_wbxml_c_001_binary_structure_fixtures() {
    run_scr_fixtures("WBXML-C-001");
}

#[test]
fn transport_wbxml_c_010_default_attribute_fixtures() {
    run_scr_fixtures("WBXML-C-010");
}

#[test]
fn transport_wbxml_c_011_binary_literal_equivalence_fixtures() {
    let groups = run_scr_fixtures("WBXML-C-011");
    assert!(
        groups.contains_key("basic-deck"),
        "binary/literal equivalence group must execute"
    );
    assert!(
        groups.contains_key("attribute-fragments"),
        "binary/literal attribute-fragment equivalence group must execute"
    );
}

#[test]
fn transport_wbxml_native_decoder_enforces_output_and_nesting_bounds() {
    let output_error =
        decode_wml13(b"\x03\x0a\x6a\x00\x3f", 5).expect_err("output limit must apply");
    assert!(output_error.contains("output exceeds 5-byte limit"));

    let mut deeply_nested = b"\x03\x0a\x6a\x00\x7f".to_vec();
    deeply_nested.extend(std::iter::repeat_n(0x60, 129));
    let nesting_error =
        decode_wml13(&deeply_nested, 64 * 1024).expect_err("nesting limit must apply");
    assert!(nesting_error.contains("element nesting exceeds 128-level limit"));
}
