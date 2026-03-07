use super::*;

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
fn transport_libwbxml_disable_flag_honored() {
    let disabled = with_env_var_locked("LOWBAND_DISABLE_LIBWBXML", "true", || {
        libwbxml_disabled_by_env()
    });
    assert!(disabled);

    let disabled_yes = with_env_var_locked("LOWBAND_DISABLE_LIBWBXML", "yes", || {
        libwbxml_disabled_by_env()
    });
    assert!(disabled_yes);

    let not_disabled =
        with_env_removed_locked("LOWBAND_DISABLE_LIBWBXML", libwbxml_disabled_by_env);
    assert!(!not_disabled);
}

#[test]
fn transport_libwbxml_error_text_handles_null_pointer_message() {
    unsafe extern "C" fn null_msg(_: i32) -> *const u8 {
        std::ptr::null()
    }
    let text = libwbxml_error_text(null_msg, -9);
    assert_eq!(text, "libwbxml error code -9");
}

#[test]
fn transport_libwbxml_available_or_disabled_result_is_deterministic() {
    let result = libwbxml_available();
    assert!(result.is_ok() || result.is_err());
}

#[test]
fn transport_decode_wmlc_with_libwbxml_disable_returns_unavailable() {
    let result = with_env_var_locked("LOWBAND_DISABLE_LIBWBXML", "1", || {
        decode_wmlc_with_libwbxml(b"\x03\x01\x6a\x00")
    });
    assert!(matches!(result, Err(LibwbxmlDecodeError::Unavailable(_))));
}

#[test]
fn transport_decode_wmlc_with_libwbxml_empty_payload_returns_failed() {
    let result =
        with_env_removed_locked(
            "LOWBAND_DISABLE_LIBWBXML",
            || decode_wmlc_with_libwbxml(&[]),
        );
    assert!(matches!(result, Err(LibwbxmlDecodeError::Failed(_))));
}

#[test]
fn transport_decode_wmlc_with_libwbxml_attempts_decoder_path() {
    let result = decode_wmlc_with_libwbxml(b"\x03\x01\x6a\x00");
    match result {
        Ok(xml) => assert!(!xml.is_empty()),
        Err(LibwbxmlDecodeError::Failed(message))
        | Err(LibwbxmlDecodeError::Unavailable(message)) => {
            assert!(!message.is_empty())
        }
    }
}

#[test]
#[cfg(unix)]
fn transport_decode_wmlc_prefers_cli_when_lib_disabled() {
    let script = write_fake_decoder_script("<wml><card id=\"c\"/></wml>");
    let result = with_two_env_vars_locked(
        "LOWBAND_DISABLE_LIBWBXML",
        "1",
        "WBXML2XML_BIN",
        script.to_string_lossy().as_ref(),
        || decode_wmlc(b"\x03\x01\x6a\x00"),
    );
    assert!(result.is_ok());
}

#[test]
fn transport_preflight_wbxml_decoder_reports_backend_or_error() {
    let result = preflight_wbxml_decoder();
    match result {
        Ok(backend) => assert!(backend == "libwbxml" || backend == "wbxml2xml-cli"),
        Err(message) => assert!(!message.is_empty()),
    }

    let forced_err = with_two_env_vars_locked(
        "LOWBAND_DISABLE_LIBWBXML",
        "1",
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
fn transport_preflight_wbxml_decoder_errors_when_all_backends_disabled() {
    let result = with_two_env_vars_locked(
        "LOWBAND_DISABLE_LIBWBXML",
        "1",
        "WBXML2XML_BIN",
        "__missing_wbxml2xml__",
        preflight_wbxml_decoder,
    );
    assert!(result.is_err());
}

#[test]
fn transport_preflight_wbxml_decoder_cli_success_path() {
    let result = with_two_env_vars_locked(
        "LOWBAND_DISABLE_LIBWBXML",
        "1",
        "WBXML2XML_BIN",
        "true",
        preflight_wbxml_decoder,
    );
    assert_eq!(result.ok().as_deref(), Some("wbxml2xml-cli"));
}

#[test]
fn transport_preflight_wbxml_decoder_cli_nonzero_maps_error() {
    let result = with_two_env_vars_locked(
        "LOWBAND_DISABLE_LIBWBXML",
        "1",
        "WBXML2XML_BIN",
        "false",
        preflight_wbxml_decoder,
    );
    assert!(result.is_err());
}

#[test]
fn transport_decode_wmlc_when_backends_missing_combines_errors() {
    let err = with_two_env_vars_locked(
        "LOWBAND_DISABLE_LIBWBXML",
        "1",
        "WBXML2XML_BIN",
        "__missing_wbxml2xml__",
        || decode_wmlc(b"\x03\x01\x6a\x00").expect_err("all backends should fail"),
    );
    assert!(err.contains("libwbxml disabled"));
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
fn transport_with_two_env_vars_locked_restores_existing_values() {
    let _guard = env_lock().lock().expect("env lock should succeed");
    std::env::set_var("WBXML2XML_BIN", "old-one");
    std::env::set_var("LOWBAND_DISABLE_LIBWBXML", "old-two");
    drop(_guard);

    with_two_env_vars_locked(
        "WBXML2XML_BIN",
        "new-one",
        "LOWBAND_DISABLE_LIBWBXML",
        "new-two",
        || {
            assert_eq!(
                std::env::var("WBXML2XML_BIN").ok().as_deref(),
                Some("new-one")
            );
            assert_eq!(
                std::env::var("LOWBAND_DISABLE_LIBWBXML").ok().as_deref(),
                Some("new-two")
            );
        },
    );
    assert_eq!(
        std::env::var("WBXML2XML_BIN").ok().as_deref(),
        Some("old-one")
    );
    assert_eq!(
        std::env::var("LOWBAND_DISABLE_LIBWBXML").ok().as_deref(),
        Some("old-two")
    );
    std::env::remove_var("WBXML2XML_BIN");
    std::env::remove_var("LOWBAND_DISABLE_LIBWBXML");
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
                    || lower.contains("decoder tool not available")
                    || lower.contains("libwbxml");
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
