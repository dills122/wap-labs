use super::*;
use std::time::Duration;

#[test]
fn transport_decode_wmlc_missing_tool_returns_structured_error() {
    let err = decode_wmlc_with_tool(b"\x03\x01\x6a\x00", "__definitely_missing_wbxml2xml__")
        .expect_err("missing tool should fail");
    assert!(err.contains("WBXML decoder tool not available"));
}

#[test]
fn transport_decode_wmlc_empty_payload_fails() {
    let err = decode_wmlc_with_tool(&[], "__unused_tool__")
        .expect_err("empty payload should fail before command invocation");
    assert!(err.contains("empty payload"));
}

#[test]
#[cfg(unix)]
fn transport_decode_wmlc_tool_nonzero_exit_fails() {
    let err = decode_wmlc_with_tool(b"\x03\x01\x6a\x00", "false").expect_err("false should fail");
    assert!(err.contains("WBXML decode failed"));
}

#[test]
#[cfg(unix)]
fn transport_decode_wmlc_success_with_fake_tool() {
    let script = write_fake_decoder_script("<wml><card id=\"ok\"/></wml>");
    let decoded = decode_wmlc_with_tool(b"\x03\x01\x6a\x00", script.to_string_lossy().as_ref())
        .expect("fake decoder should produce xml");
    assert!(decoded.contains("<wml>"));
}

#[test]
#[cfg(unix)]
fn transport_decode_wmlc_uses_subprocess_backend() {
    let script = write_fake_decoder_script("<wml><card id=\"isolated\"/></wml>");
    let decoded = with_env_var_locked("WBXML2XML_BIN", script.to_string_lossy().as_ref(), || {
        decode_wmlc(b"\x03\x01\x6a\x00")
    })
    .expect("configured subprocess decoder should be used");

    assert!(decoded.contains("isolated"));
}

#[test]
#[cfg(unix)]
fn transport_decode_wmlc_tool_timeout_is_bounded() {
    let script =
        write_decoder_script("#!/bin/sh\nsleep 2\nout=\"$2\"\nprintf '%s' '<wml/>' > \"$out\"\n");
    let error = decode_wmlc_with_tool_limits(
        b"\x03\x01\x6a\x00",
        script.to_string_lossy().as_ref(),
        Duration::from_millis(50),
        1024,
    )
    .expect_err("decoder exceeding its deadline must fail");

    assert!(error.contains("timed out"));
}

#[test]
#[cfg(unix)]
fn transport_decode_wmlc_tool_output_is_bounded() {
    let script = write_fake_decoder_script("<wml><card>oversized</card></wml>");
    let error = decode_wmlc_with_tool_limits(
        b"\x03\x01\x6a\x00",
        script.to_string_lossy().as_ref(),
        Duration::from_secs(1),
        16,
    )
    .expect_err("oversized decoder output must fail");

    assert!(error.contains("output exceeds"));
}

#[test]
fn transport_decoder_rejects_relative_executable_paths() {
    let error = resolve_wbxml_decoder_path("./wbxml2xml")
        .expect_err("relative executable path must not be trusted");
    assert!(error.contains("absolute"));
}

#[test]
fn transport_wbxml2xml_bin_uses_default_when_env_missing() {
    let value = with_env_removed_locked("WBXML2XML_BIN", wbxml2xml_bin);
    assert_eq!(value, "wbxml2xml");
}

#[test]
fn transport_wbxml2xml_bin_uses_env_override() {
    let value = with_env_var_locked("WBXML2XML_BIN", "/tmp/custom-wbxml2xml", wbxml2xml_bin);
    assert_eq!(value, "/tmp/custom-wbxml2xml");
}

#[test]
fn transport_preflight_wbxml_decoder_reports_backend_or_error() {
    let result = preflight_wbxml_decoder();
    match result {
        Ok(backend) => assert_eq!(backend, "wbxml2xml-cli-isolated"),
        Err(message) => assert!(!message.is_empty()),
    }

    let forced_err = with_env_var_locked(
        "WBXML2XML_BIN",
        "__missing_wbxml2xml__",
        preflight_wbxml_decoder,
    );
    match forced_err {
        Ok(backend) => panic!("expected error backend, got {backend}"),
        Err(message) => assert!(!message.is_empty()),
    }
}

#[test]
fn transport_preflight_wbxml_decoder_errors_when_cli_is_missing() {
    let result = with_env_var_locked(
        "WBXML2XML_BIN",
        "__missing_wbxml2xml__",
        preflight_wbxml_decoder,
    );
    assert!(result.is_err());
}

#[test]
fn transport_preflight_wbxml_decoder_cli_success_path() {
    let result = with_env_var_locked("WBXML2XML_BIN", "true", preflight_wbxml_decoder);
    assert_eq!(result.ok().as_deref(), Some("wbxml2xml-cli-isolated"));
}

#[test]
fn transport_preflight_wbxml_decoder_cli_nonzero_maps_error() {
    let result = with_env_var_locked("WBXML2XML_BIN", "false", preflight_wbxml_decoder);
    assert!(result.is_err());
}

#[test]
fn transport_decode_wmlc_when_cli_is_missing_returns_structured_error() {
    let err = with_env_var_locked("WBXML2XML_BIN", "__missing_wbxml2xml__", || {
        decode_wmlc(b"\x03\x01\x6a\x00").expect_err("missing decoder should fail")
    });
    assert!(err.contains("WBXML decoder tool not available"));
}

#[test]
fn transport_with_env_var_locked_restores_existing_value() {
    const TEST_ENV: &str = "WAP_TEST_WBXML2XML_BIN_RESTORE";
    let _guard = env_lock().lock().expect("env lock should succeed");
    std::env::set_var(TEST_ENV, "old-value");
    drop(_guard);

    with_env_var_locked(TEST_ENV, "new-value", || {
        assert_eq!(std::env::var(TEST_ENV).ok().as_deref(), Some("new-value"));
    });
    assert_eq!(std::env::var(TEST_ENV).ok().as_deref(), Some("old-value"));
    std::env::remove_var(TEST_ENV);
}

#[test]
fn transport_with_env_removed_locked_restores_existing_value() {
    const TEST_ENV: &str = "WAP_TEST_DISABLE_LIBWBXML_RESTORE";
    let _guard = env_lock().lock().expect("env lock should succeed");
    std::env::set_var(TEST_ENV, "old-value");
    drop(_guard);

    with_env_removed_locked(TEST_ENV, || {
        assert!(std::env::var(TEST_ENV).is_err());
    });
    assert_eq!(std::env::var(TEST_ENV).ok().as_deref(), Some("old-value"));
    std::env::remove_var(TEST_ENV);
}

#[test]
fn transport_wbxml_sample_corpus_decodes_or_fails_structured() {
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
        let result = decode_wmlc(&bytes);
        match result {
            Ok(xml) => {
                let trimmed = xml.trim();
                assert!(
                    !trimmed.is_empty(),
                    "decoded XML should be non-empty for {}",
                    sample.display()
                );
                assert!(
                    trimmed.starts_with('<'),
                    "decoded XML should look like markup for {}",
                    sample.display()
                );
                if expected == "failure" {
                    panic!(
                        "expected failure per fixtures.toml but decode succeeded for {}",
                        sample.display()
                    );
                }
            }
            Err(message) => {
                let lower = message.to_ascii_lowercase();
                let looks_structured = lower.contains("wbxml decode failed")
                    || lower.contains("decoder tool not available");
                assert!(
                    looks_structured,
                    "decode failure should be structured for {}: {}",
                    sample.display(),
                    message
                );
                if expected == "success" {
                    panic!(
                        "expected success per fixtures.toml but decode failed for {}: {}",
                        sample.display(),
                        message
                    );
                }
            }
        }
    }
}
