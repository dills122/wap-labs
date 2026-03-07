use serde::de::DeserializeOwned;
use std::fs;
use std::path::PathBuf;

pub(crate) fn load_json_fixture<T>(segments: &[&str]) -> T
where
    T: DeserializeOwned,
{
    let fixture_path = fixture_path(segments);
    let raw = fs::read_to_string(&fixture_path)
        .unwrap_or_else(|_| panic!("failed reading {}", fixture_path.display()));
    serde_json::from_str(&raw)
        .unwrap_or_else(|error| panic!("failed parsing {}: {error}", fixture_path.display()))
}

fn fixture_path(segments: &[&str]) -> PathBuf {
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    for segment in segments {
        path.push(segment);
    }
    path
}
