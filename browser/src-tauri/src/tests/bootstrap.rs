use crate::bootstrap::{bundled_wbxml_resource_relpath, bundled_wbxml_resource_relpath_for_os};

// CI (.github/workflows/ci.yml, `browser-shell` job) runs `cargo llvm-cov`
// for this crate on `ubuntu-latest`, so linux is the platform branch that
// actually executes in this repo's continuous integration today.
#[test]
fn bundled_wbxml_resource_relpath_for_os_covers_ci_platform_linux() {
    assert_eq!(
        bundled_wbxml_resource_relpath_for_os("linux"),
        "wbxml/linux/wbxml2xml"
    );
}

#[test]
fn bundled_wbxml_resource_relpath_for_os_covers_macos() {
    assert_eq!(
        bundled_wbxml_resource_relpath_for_os("macos"),
        "wbxml/macos/wbxml2xml"
    );
}

#[test]
fn bundled_wbxml_resource_relpath_for_os_covers_windows() {
    assert_eq!(
        bundled_wbxml_resource_relpath_for_os("windows"),
        "wbxml/windows/wbxml2xml.exe"
    );
}

#[test]
fn bundled_wbxml_resource_relpath_for_os_rejects_unsupported_platform() {
    let result = std::panic::catch_unwind(|| bundled_wbxml_resource_relpath_for_os("plan9"));
    assert!(
        result.is_err(),
        "unsupported platform names must not resolve to a resource path"
    );
}

// All returned paths must live under the `wbxml/` resource prefix bundled
// by Tauri (see `tauri.conf.json` resource config) and must be non-empty,
// relative (no leading slash) so `BaseDirectory::Resource` resolution
// behaves the same way across platforms.
#[test]
fn bundled_wbxml_resource_relpath_for_os_paths_share_expected_shape() {
    for os in ["linux", "macos", "windows"] {
        let path = bundled_wbxml_resource_relpath_for_os(os);
        assert!(
            path.starts_with("wbxml/"),
            "resource path for {os} should live under wbxml/: {path}"
        );
        assert!(
            !path.starts_with('/'),
            "resource path for {os} must be relative: {path}"
        );
    }
}

// Exercises the real (non-parameterized) entry point that
// `configure_bundled_wbxml_decoder` calls in production, proving it
// delegates to the pure, per-platform logic above for whatever platform
// this test binary was actually compiled for.
#[test]
fn bundled_wbxml_resource_relpath_matches_current_target_os() {
    assert_eq!(
        bundled_wbxml_resource_relpath(),
        bundled_wbxml_resource_relpath_for_os(std::env::consts::OS)
    );
}
