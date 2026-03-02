use lowband_transport_rust::{fetch_deck_in_process, FetchDeckRequest};
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use toml::Value;

#[derive(Debug, Deserialize)]
struct FixtureMeta {
    name: String,
    description: String,
    mode: Option<String>,
    work_items: Vec<String>,
    spec_items: Vec<String>,
    testing_ac: Vec<String>,
    env: Option<HashMap<String, String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedResponse {
    ok: bool,
    status: u16,
    final_url: Option<String>,
    content_type: Option<String>,
    error_code: Option<String>,
}

fn fixture_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("transport")
}

fn fixture_dirs(root: &Path) -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = fs::read_dir(root)
        .expect("transport fixture root should be readable")
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.is_dir())
        .collect();
    dirs.sort();
    dirs
}

fn parse_meta(path: &Path) -> FixtureMeta {
    let raw = fs::read_to_string(path).expect("meta.toml should be readable");
    let doc: Value = raw.parse().expect("meta.toml should parse");
    let table = doc
        .as_table()
        .expect("fixture meta root should be a TOML table")
        .clone();
    table
        .try_into()
        .expect("fixture meta should match expected schema")
}

fn with_env_vars<T>(env_map: Option<&HashMap<String, String>>, f: impl FnOnce() -> T) -> T {
    let mut previous = Vec::new();
    if let Some(vars) = env_map {
        for (name, value) in vars {
            previous.push((name.clone(), std::env::var(name).ok()));
            std::env::set_var(name, value);
        }
    }

    let out = f();

    for (name, prior) in previous {
        if let Some(value) = prior {
            std::env::set_var(name, value);
        } else {
            std::env::remove_var(name);
        }
    }
    out
}

#[test]
fn transport_fixture_harness_executes_curated_scenarios() {
    let root = fixture_root();
    assert!(
        root.is_dir(),
        "fixture root should exist: {}",
        root.display()
    );

    let fixtures = fixture_dirs(&root);
    assert!(
        !fixtures.is_empty(),
        "expected at least one transport fixture"
    );

    for fixture in fixtures {
        let name = fixture
            .file_name()
            .and_then(|value| value.to_str())
            .expect("fixture directory name should be valid utf-8");

        let meta = parse_meta(&fixture.join("meta.toml"));
        assert!(
            !meta.name.trim().is_empty(),
            "fixture {} requires a non-empty name",
            name
        );
        assert!(
            !meta.description.trim().is_empty(),
            "fixture {} requires a non-empty description",
            name
        );
        assert!(
            !meta.work_items.is_empty(),
            "fixture {} should map to at least one work item",
            name
        );
        assert!(
            !meta.spec_items.is_empty(),
            "fixture {} should map to at least one spec item",
            name
        );
        assert!(
            !meta.testing_ac.is_empty(),
            "fixture {} should include testing acceptance criteria",
            name
        );

        let mode = meta.mode.as_deref().unwrap_or("fetch");
        if mode != "fetch" {
            continue;
        }

        let request: FetchDeckRequest = serde_json::from_slice(
            &fs::read(fixture.join("request.json")).expect("request.json should be readable"),
        )
        .expect("request.json should parse");
        let expected: ExpectedResponse = serde_json::from_slice(
            &fs::read(fixture.join("expected.json")).expect("expected.json should be readable"),
        )
        .expect("expected.json should parse");

        let response = with_env_vars(meta.env.as_ref(), || fetch_deck_in_process(request));
        assert_eq!(
            response.ok, expected.ok,
            "fixture {} expected ok={}, got ok={}",
            name, expected.ok, response.ok
        );
        assert_eq!(
            response.status, expected.status,
            "fixture {} expected status={}, got status={}",
            name, expected.status, response.status
        );
        if let Some(final_url) = expected.final_url.as_deref() {
            assert_eq!(
                response.final_url, final_url,
                "fixture {} final_url mismatch",
                name
            );
        }
        if let Some(content_type) = expected.content_type.as_deref() {
            assert_eq!(
                response.content_type, content_type,
                "fixture {} content_type mismatch",
                name
            );
        }
        if let Some(error_code) = expected.error_code.as_deref() {
            assert_eq!(
                response.error.as_ref().map(|error| error.code.as_str()),
                Some(error_code),
                "fixture {} error code mismatch",
                name
            );
        }
    }
}
