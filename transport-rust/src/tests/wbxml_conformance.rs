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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HistoricalCharsetFixture {
    id: String,
    mib_enum: u8,
    bytes_hex: String,
    content_type: Option<String>,
    expected_text: Option<String>,
    expected_error_contains: Option<String>,
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
        .as_chunks::<2>()
        .0
        .iter()
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
            Some(content_type) => {
                decode_wbxml_for_content_type(&bytes, content_type).map(|document| document.xml)
            }
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
fn transport_wml_307_generic_wbxml_fixtures() {
    #[derive(Deserialize)]
    struct Corpus {
        cases: Vec<Fixture>,
    }

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Fixture {
        id: String,
        content_type: String,
        bytes_hex: String,
        expected_xml: Option<String>,
        kind: Option<String>,
        expected_card_language: Option<String>,
        expected_error_contains: Option<String>,
        expected_fetch_error: Option<String>,
        wsp_media_octet: Option<u8>,
    }

    let corpus: Corpus = read_json_fixture("wbxml_generic", "cases.json");
    for case in corpus.cases {
        let bytes = decode_hex(&case.bytes_hex);
        let (content_type, bytes) = match case.wsp_media_octet {
            Some(octet) => {
                let mut reply = vec![1, 4, 0x20, 1, octet];
                reply.extend_from_slice(&bytes);
                let reply =
                    crate::network::wsp::connectionless::decode_connectionless_reply(1, &reply)
                        .expect("compact WSP reply should decode");
                assert_eq!(reply.content_type, case.content_type, "{}", case.id);
                (reply.content_type, reply.body)
            }
            None => (case.content_type, bytes),
        };
        let decoded = decode_wbxml_for_content_type(&bytes, &content_type);
        let url = "http://example.test/generic.wbxml";
        let response = map_success_payload_response(SuccessPayloadParams {
            status: 200,
            is_wap_scheme: false,
            request_url: url,
            upstream_url: url,
            final_url: url.to_owned(),
            content_type,
            body: &bytes,
            attempt: 1,
            elapsed_ms: 0.0,
            request_id: None,
        });
        match (case.expected_xml, case.kind, case.expected_error_contains) {
            (Some(expected_xml), Some(kind), None) => {
                let decoded = decoded.unwrap_or_else(|error| panic!("{}: {error}", case.id));
                let expected_kind = match kind.as_str() {
                    "wml" => crate::WbxmlDocumentKind::Wml13,
                    "si" => crate::WbxmlDocumentKind::ServiceIndication10,
                    "sl" => crate::WbxmlDocumentKind::ServiceLoading10,
                    "co" => crate::WbxmlDocumentKind::CacheOperation10,
                    "channel" => crate::WbxmlDocumentKind::Channel12,
                    _ => panic!("unexpected fixture document kind: {kind}"),
                };
                assert_eq!(decoded.xml, expected_xml, "{}", case.id);
                assert_eq!(decoded.kind, expected_kind, "{}", case.id);
                match expected_kind {
                    crate::WbxmlDocumentKind::Wml13 => {
                        assert!(response.ok, "{}: {:?}", case.id, response.error);
                        assert_eq!(response.content_type, "application/vnd.wap.wbxml");
                        let input = response.engine_deck_input.expect("WML engine input");
                        assert_eq!(input.content_type, "application/vnd.wap.wmlc");
                        assert_eq!(input.wml_xml, expected_xml);
                        let mut engine = wavenav_engine::WmlEngine::new();
                        engine
                            .load_deck_context(
                                &input.wml_xml,
                                &input.base_url,
                                &input.content_type,
                                input.raw_bytes_base64,
                            )
                            .expect("generic WBXML WML should load as a normalized deck");
                        assert_eq!(
                            engine.active_card_language(),
                            case.expected_card_language,
                            "{}",
                            case.id
                        );
                        assert!(engine.render().expect("WML should render").draw.iter().any(|cmd| matches!(cmd, wavenav_engine::DrawCmd::Text { text, .. } if text == "Hello")));
                    }
                    _ => {
                        assert!(
                            !response.ok
                                && response.wml.is_none()
                                && response.engine_deck_input.is_none(),
                            "{}",
                            case.id
                        );
                        assert_eq!(
                            response.error.expect("non-WML must stay in transport").code,
                            "UNSUPPORTED_CONTENT_TYPE"
                        );
                    }
                }
            }
            (None, None, Some(expected)) => {
                let error = decoded.expect_err(&case.id);
                assert!(error.contains(&expected), "{}: {error}", case.id);
                assert!(
                    !response.ok && response.wml.is_none() && response.engine_deck_input.is_none(),
                    "{}",
                    case.id
                );
                assert_eq!(
                    response.error.expect("failed vocabulary route").code,
                    case.expected_fetch_error
                        .as_deref()
                        .unwrap_or("WBXML_DECODE_FAILED"),
                    "{}",
                    case.id
                );
            }
            _ => panic!("{} must specify one expected outcome", case.id),
        }
    }
}

#[test]
fn transport_wbxml_wml_307_historical_charset_fixtures() {
    #[derive(Deserialize)]
    struct Corpus {
        cases: Vec<HistoricalCharsetFixture>,
    }

    let corpus: Corpus = serde_json::from_str(include_str!(
        "../../tests/fixtures/transport/wbxml_wml13/wml-307-charsets.json"
    ))
    .expect("historical charset fixture corpus should parse");
    assert!(!corpus.cases.is_empty());

    for fixture in corpus.cases {
        let bytes = decode_hex(&fixture.bytes_hex);
        assert_eq!(
            &bytes[..3],
            &[0x03, 0x0a, fixture.mib_enum],
            "{}",
            fixture.id
        );
        let result = match fixture.content_type.as_deref() {
            Some(content_type) => {
                decode_wbxml_for_content_type(&bytes, content_type).map(|document| document.xml)
            }
            None => decode_wml13(&bytes, 64 * 1024),
        };
        match (fixture.expected_text, fixture.expected_error_contains) {
            (Some(text), None) => {
                let xml = result.unwrap_or_else(|error| panic!("{}: {error}", fixture.id));
                assert_eq!(
                    xml,
                    format!("<wml><card newcontext=\"false\" ordered=\"true\"><p align=\"left\">{text}</p></card></wml>"),
                    "{}",
                    fixture.id
                );
            }
            (None, Some(expected)) => {
                let error = result.expect_err(&fixture.id);
                assert!(error.contains(&expected), "{}: {error}", fixture.id);
            }
            _ => panic!("{} must specify one expected outcome", fixture.id),
        }
    }
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
