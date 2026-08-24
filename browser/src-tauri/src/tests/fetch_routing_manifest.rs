use super::super::fetch_routing_manifest::{
    load_fetch_routing_manifest, parse_fetch_routing_manifest,
};
use std::fs;

const VALID: &str = r#"{
  "schemaVersion": 1,
  "runId": "waves-e2e-run-7",
  "composeProject": "waves-e2e-run-7",
  "gatewayEndpoint": "wap://127.0.0.1:49152",
  "expectedOriginInstanceId": "origin-run-7"
}"#;

#[test]
fn routing_manifest_accepts_one_exact_loopback_binding() {
    let manifest = parse_fetch_routing_manifest(VALID).expect("valid manifest should parse");

    assert_eq!(manifest.run_id, "waves-e2e-run-7");
    assert_eq!(manifest.compose_project, "waves-e2e-run-7");
    assert_eq!(manifest.gateway_endpoint, "wap://127.0.0.1:49152");
    assert_eq!(manifest.expected_origin_instance_id, "origin-run-7");
}

#[test]
fn routing_manifest_rejects_unknown_fields_and_project_mismatch() {
    let extra = VALID.replace("\n}", ",\n  \"scenarioGateway\": \"wap://127.0.0.1:9\"\n}");
    assert!(parse_fetch_routing_manifest(&extra)
        .expect_err("unknown field must fail")
        .contains("unknown field"));

    let mismatched = VALID.replace(
        "\"composeProject\": \"waves-e2e-run-7\"",
        "\"composeProject\": \"waves-e2e-run-8\"",
    );
    assert_eq!(
        parse_fetch_routing_manifest(&mismatched).expect_err("mismatch must fail"),
        "routing manifest composeProject must match runId"
    );
}

#[test]
fn routing_manifest_rejects_non_loopback_or_ambiguous_endpoints() {
    for endpoint in [
        "wap://0.0.0.0:49152",
        "wap://localhost:49152",
        "http://127.0.0.1:49152",
        "wap://127.0.0.1",
        "wap://127.0.0.1:49152/path",
        "wap://127.0.0.1:49152?port=9",
    ] {
        let source = VALID.replace("wap://127.0.0.1:49152", endpoint);
        assert!(
            parse_fetch_routing_manifest(&source).is_err(),
            "endpoint {endpoint} must fail"
        );
    }
}

#[test]
fn routing_manifest_rejects_unbounded_or_unsafe_ids() {
    for invalid in ["", "UPPER", "../escape", "a_underscore", &"a".repeat(64)] {
        let source = VALID.replace("origin-run-7", invalid);
        assert!(
            parse_fetch_routing_manifest(&source).is_err(),
            "origin id {invalid:?} must fail"
        );
    }
}

#[test]
fn routing_manifest_loader_requires_an_absolute_bounded_regular_file() {
    assert_eq!(
        load_fetch_routing_manifest(std::path::Path::new("relative.json"))
            .expect_err("relative path must fail"),
        "fetch routing manifest path must be absolute"
    );

    let directory = std::env::temp_dir().join(format!(
        "waves-routing-manifest-{}-{}",
        std::process::id(),
        std::thread::current().name().unwrap_or("test")
    ));
    fs::create_dir_all(&directory).expect("create manifest test directory");
    let valid_path = directory.join("routing.json");
    fs::write(&valid_path, VALID).expect("write valid manifest");
    assert!(load_fetch_routing_manifest(&valid_path).is_ok());

    let oversized_path = directory.join("oversized.json");
    fs::write(&oversized_path, "x".repeat(4097)).expect("write oversized manifest");
    assert_eq!(
        load_fetch_routing_manifest(&oversized_path).expect_err("oversized file must fail"),
        "fetch routing manifest exceeds 4096 bytes"
    );

    fs::remove_dir_all(directory).expect("remove manifest test directory");
}
