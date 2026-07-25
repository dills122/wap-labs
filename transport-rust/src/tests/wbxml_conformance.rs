use super::*;
use crate::wbxml::decode_wbxml_for_content_type;
use crate::wbxml_decoder::{decode_wml13, WML13_DECODER_ID};
use std::collections::HashSet;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConformanceCorpus {
    decoder: String,
    source_documents: Vec<String>,
    implemented_clauses: Vec<String>,
    page_zero_token_equivalence: PageZeroTokenEquivalence,
    fixtures: Vec<ConformanceFixture>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PageZeroTokenEquivalence {
    tags: Vec<TagToken>,
    attribute_starts: Vec<AttributeStartToken>,
    attribute_values: Vec<AttributeValueToken>,
}

#[derive(Debug, Deserialize)]
struct TagToken {
    token: u8,
    name: String,
}

#[derive(Debug, Deserialize)]
struct AttributeStartToken {
    token: u8,
    name: String,
    prefix: String,
}

#[derive(Debug, Deserialize)]
struct AttributeValueToken {
    token: u8,
    value: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConformanceFixture {
    id: String,
    scr: Vec<String>,
    clauses: Vec<String>,
    source_sections: Vec<String>,
    content_type: Option<String>,
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
        let bytes = decode_hex(&fixture.bytes_hex);
        let result = match fixture.content_type.as_deref() {
            Some(content_type) => decode_wbxml_for_content_type(&bytes, content_type),
            None => decode_wml13(&bytes, 64 * 1024),
        };
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

fn page_zero_document(string_table: &[u8], body: &[u8]) -> Vec<u8> {
    assert!(
        string_table.len() < 0x80,
        "test string tables must use a one-octet length"
    );
    let mut document = vec![0x03, 0x0a, 0x6a, string_table.len() as u8];
    document.extend_from_slice(string_table);
    document.extend_from_slice(body);
    document
}

fn inline_string(value: &str) -> Vec<u8> {
    let mut encoded = vec![0x03];
    encoded.extend_from_slice(value.as_bytes());
    encoded.push(0x00);
    encoded
}

fn assert_equivalent_pair(label: &str, binary: &[u8], literal: &[u8]) -> String {
    let binary_xml = decode_wml13(binary, 64 * 1024)
        .unwrap_or_else(|error| panic!("{label} binary form should decode: {error}"));
    let literal_xml = decode_wml13(literal, 64 * 1024)
        .unwrap_or_else(|error| panic!("{label} literal form should decode: {error}"));
    assert_eq!(
        binary_xml, literal_xml,
        "{label} binary and literal forms must be equivalent"
    );
    binary_xml
}

#[test]
fn transport_wbxml_page_zero_binary_literal_equivalence_is_exhaustive() {
    let corpus = load_conformance_corpus();
    let matrix = corpus.page_zero_token_equivalence;
    assert_eq!(matrix.tags.len(), 36, "assigned WML page-zero tag count");
    assert_eq!(
        matrix.attribute_starts.len(),
        85,
        "assigned WML page-zero attribute-start count"
    );
    assert_eq!(
        matrix.attribute_values.len(),
        27,
        "assigned WML page-zero attribute-value count"
    );
    assert_eq!(
        matrix.tags.len() + matrix.attribute_starts.len() + matrix.attribute_values.len(),
        148,
        "every assigned WML page-zero token must have an equivalence pair"
    );

    let mut tag_tokens = HashSet::new();
    for assignment in matrix.tags {
        assert!(
            tag_tokens.insert(assignment.token),
            "duplicate tag token 0x{:02x}",
            assignment.token
        );
        let binary = page_zero_document(&[], &[assignment.token]);
        let mut table = assignment.name.as_bytes().to_vec();
        table.push(0x00);
        let literal = page_zero_document(&table, &[0x04, 0x00]);
        let xml = assert_equivalent_pair(
            &format!("tag 0x{:02x} {}", assignment.token, assignment.name),
            &binary,
            &literal,
        );
        assert!(xml.starts_with(&format!("<{}", assignment.name)));
    }

    let mut attribute_start_tokens = HashSet::new();
    for assignment in matrix.attribute_starts {
        assert!(
            attribute_start_tokens.insert(assignment.token),
            "duplicate attribute-start token 0x{:02x}",
            assignment.token
        );
        let binary = page_zero_document(&[], &[0xbf, assignment.token, 0x01]);
        let mut table = assignment.name.as_bytes().to_vec();
        table.push(0x00);
        let mut literal_body = vec![0xbf, 0x04, 0x00];
        if !assignment.prefix.is_empty() {
            literal_body.extend_from_slice(&inline_string(&assignment.prefix));
        }
        literal_body.push(0x01);
        let literal = page_zero_document(&table, &literal_body);
        let xml = assert_equivalent_pair(
            &format!(
                "attribute start 0x{:02x} {}",
                assignment.token, assignment.name
            ),
            &binary,
            &literal,
        );
        assert!(xml.contains(&format!(" {}=\"{}\"", assignment.name, assignment.prefix)));
    }

    let mut attribute_value_tokens = HashSet::new();
    for assignment in matrix.attribute_values {
        assert!(
            attribute_value_tokens.insert(assignment.token),
            "duplicate attribute-value token 0x{:02x}",
            assignment.token
        );
        let binary = page_zero_document(&[], &[0xbf, 0x55, assignment.token, 0x01]);
        let mut literal_body = vec![0xbf, 0x55];
        literal_body.extend_from_slice(&inline_string(&assignment.value));
        literal_body.push(0x01);
        let literal = page_zero_document(&[], &literal_body);
        let xml = assert_equivalent_pair(
            &format!(
                "attribute value 0x{:02x} {}",
                assignment.token, assignment.value
            ),
            &binary,
            &literal,
        );
        assert!(xml.contains(&format!(" id=\"{}\"", assignment.value)));
    }
}

#[test]
fn transport_wbxml_section_5_direct_clause_inventory_is_fixed_outcome_backed() {
    let corpus = load_conformance_corpus();
    let fixture_clauses: HashSet<_> = corpus
        .fixtures
        .iter()
        .flat_map(|fixture| fixture.clauses.iter().map(String::as_str))
        .collect();

    assert_eq!(
        corpus.implemented_clauses.len(),
        47,
        "the reviewed WML-203 tranche must remain explicit"
    );
    for clause in &corpus.implemented_clauses {
        assert!(
            fixture_clauses.contains(clause.as_str()),
            "{clause} must remain linked to at least one fixed-outcome fixture"
        );
    }
    let encoder_only = "WBXML-CL-CHARSET-UNREPRESENTABLE-NAME";
    assert!(
        !corpus
            .implemented_clauses
            .iter()
            .any(|clause| clause == encoder_only)
            && !fixture_clauses.contains(encoder_only),
        "{encoder_only} must remain outside the selected client corpus"
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
