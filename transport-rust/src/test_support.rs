use serde::de::DeserializeOwned;
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

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

/// Shared serialization lock for tests that mutate process environment
/// variables, per `docs/agents/RUST_TRANSPORT_STEERING.md` §12: such tests
/// must use a shared lock, restore prior values, and run serialized.
fn env_lock() -> &'static Mutex<()> {
    static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(()))
}

pub(crate) fn with_env_var_locked<T>(name: &str, value: &str, f: impl FnOnce() -> T) -> T {
    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous = std::env::var(name).ok();
    std::env::set_var(name, value);
    let out = f();
    if let Some(previous) = previous {
        std::env::set_var(name, previous);
    } else {
        std::env::remove_var(name);
    }
    out
}

pub(crate) fn with_env_removed_locked<T>(name: &str, f: impl FnOnce() -> T) -> T {
    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous = std::env::var(name).ok();
    std::env::remove_var(name);
    let out = f();
    if let Some(previous) = previous {
        std::env::set_var(name, previous);
    }
    out
}
