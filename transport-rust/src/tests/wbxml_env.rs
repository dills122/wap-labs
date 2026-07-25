use super::*;

#[test]
fn transport_decode_wmlc_empty_payload_fails() {
    let error = decode_wmlc(&[]).expect_err("empty payload should fail");
    assert!(error.contains("empty payload"));
}

#[test]
fn transport_decode_wmlc_uses_pinned_native_backend() {
    let decoded =
        decode_wmlc(b"\x03\x0a\x6a\x00\x3f").expect("built-in decoder should decode WMLC");
    assert_eq!(decoded, "<wml/>");
}

#[test]
fn transport_preflight_wbxml_decoder_identity_is_pinned() {
    assert_eq!(
        preflight_wbxml_decoder().ok().as_deref(),
        Some("lowband-wml13-wbxml/0.2.0")
    );
}

#[test]
fn transport_wbxml_sample_corpus_has_deterministic_native_results() {
    let sample_paths = wbxml_sample_paths();
    let expectations = wbxml_fixture_expectations();
    assert!(
        !sample_paths.is_empty(),
        "expected wbxml_samples fixtures to be present"
    );
    assert_eq!(
        sample_paths.len(),
        expectations.len(),
        "fixtures.toml entries should match wbxml sample count"
    );

    for sample in sample_paths {
        let file_name = sample
            .file_name()
            .and_then(|name| name.to_str())
            .expect("sample filename should be utf-8");
        let expected = expectations
            .get(file_name)
            .unwrap_or_else(|| panic!("missing fixtures.toml entry for {file_name}"));
        let bytes = fs::read(&sample).expect("wbxml sample should be readable");
        let first = decode_wmlc(&bytes);
        let second = decode_wmlc(&bytes);
        assert_eq!(
            first,
            second,
            "native decode result should repeat for {}",
            sample.display()
        );
        match first {
            Ok(xml) => {
                assert!(
                    !xml.trim().is_empty(),
                    "decoded XML should be non-empty for {}",
                    sample.display()
                );
                if expected == "failure" {
                    panic!(
                        "expected failure per fixtures.toml but decode succeeded for {}",
                        sample.display()
                    );
                }
            }
            Err(error) => {
                assert!(
                    error.starts_with("WBXML decode failed:"),
                    "decode failure should be structured for {}: {error}",
                    sample.display()
                );
                if expected == "success" {
                    panic!(
                        "expected success per fixtures.toml but decode failed for {}: {error}",
                        sample.display()
                    );
                }
            }
        }
    }
}
