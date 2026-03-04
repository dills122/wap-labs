use libc::c_void;
use libloading::Library;
use std::env;
use std::fs;
use std::process::Command;
use tempfile::tempdir;

pub(crate) fn wbxml2xml_bin() -> String {
    env::var("WBXML2XML_BIN").unwrap_or_else(|_| "wbxml2xml".to_string())
}

#[derive(Debug)]
pub(crate) enum LibwbxmlDecodeError {
    Unavailable(String),
    Failed(String),
}

fn libwbxml_candidates() -> &'static [&'static str] {
    #[cfg(target_os = "macos")]
    {
        &[
            "libwbxml2.dylib",
            "/opt/homebrew/lib/libwbxml2.dylib",
            "/usr/local/lib/libwbxml2.dylib",
        ]
    }
    #[cfg(target_os = "linux")]
    {
        &["libwbxml2.so.1", "libwbxml2.so"]
    }
    #[cfg(target_os = "windows")]
    {
        &["libwbxml2.dll"]
    }
}

pub(crate) fn libwbxml_disabled_by_env() -> bool {
    matches!(
        env::var("LOWBAND_DISABLE_LIBWBXML")
            .ok()
            .map(|value| value.to_ascii_lowercase())
            .as_deref(),
        Some("1" | "true" | "yes")
    )
}

pub(crate) fn libwbxml_available() -> Result<(), String> {
    if libwbxml_disabled_by_env() {
        return Err("libwbxml disabled by LOWBAND_DISABLE_LIBWBXML".to_string());
    }
    let mut last_err = String::new();
    for candidate in libwbxml_candidates() {
        match unsafe { Library::new(candidate) } {
            Ok(lib) => {
                unsafe {
                    let create = lib
                        .get::<unsafe extern "C" fn(*mut *mut c_void) -> i32>(
                            b"wbxml_conv_wbxml2xml_create\0",
                        )
                        .map_err(|err| {
                            format!("missing wbxml_conv_wbxml2xml_create in {candidate}: {err}")
                        })?;
                    let destroy = lib
                        .get::<unsafe extern "C" fn(*mut c_void)>(b"wbxml_conv_wbxml2xml_destroy\0")
                        .map_err(|err| {
                            format!("missing wbxml_conv_wbxml2xml_destroy in {candidate}: {err}")
                        })?;
                    let mut conv: *mut c_void = std::ptr::null_mut();
                    let create_rc = create(&mut conv);
                    if create_rc != 0 || conv.is_null() {
                        return Err(format!(
                            "libwbxml converter init failed in {candidate} (code {create_rc})"
                        ));
                    }
                    destroy(conv);
                }
                return Ok(());
            }
            Err(err) => {
                last_err = format!("{candidate}: {err}");
            }
        }
    }
    Err(format!(
        "libwbxml shared library not available ({last_err})"
    ))
}

pub(crate) fn libwbxml_error_text(
    errors_string: unsafe extern "C" fn(i32) -> *const u8,
    code: i32,
) -> String {
    let ptr = unsafe { errors_string(code) };
    if ptr.is_null() {
        return format!("libwbxml error code {code}");
    }
    unsafe { std::ffi::CStr::from_ptr(ptr as *const i8) }
        .to_string_lossy()
        .into_owned()
}

pub(crate) fn decode_wmlc_with_libwbxml(payload: &[u8]) -> Result<String, LibwbxmlDecodeError> {
    if libwbxml_disabled_by_env() {
        return Err(LibwbxmlDecodeError::Unavailable(
            "libwbxml disabled by LOWBAND_DISABLE_LIBWBXML".to_string(),
        ));
    }
    if payload.is_empty() {
        return Err(LibwbxmlDecodeError::Failed(
            "WBXML decode failed: empty payload".to_string(),
        ));
    }

    let mut last_load_err = String::new();
    for candidate in libwbxml_candidates() {
        let lib = match unsafe { Library::new(candidate) } {
            Ok(lib) => lib,
            Err(err) => {
                last_load_err = format!("{candidate}: {err}");
                continue;
            }
        };

        let result = unsafe {
            let create = lib
                .get::<unsafe extern "C" fn(*mut *mut c_void) -> i32>(
                    b"wbxml_conv_wbxml2xml_create\0",
                )
                .map_err(|err| {
                    LibwbxmlDecodeError::Failed(format!(
                        "libwbxml missing create symbol in {candidate}: {err}"
                    ))
                })?;
            let run = lib
                .get::<unsafe extern "C" fn(*mut c_void, *mut u8, u32, *mut *mut u8, *mut u32) -> i32>(
                    b"wbxml_conv_wbxml2xml_run\0",
                )
                .map_err(|err| {
                    LibwbxmlDecodeError::Failed(format!(
                        "libwbxml missing run symbol in {candidate}: {err}"
                    ))
                })?;
            let destroy = lib
                .get::<unsafe extern "C" fn(*mut c_void)>(b"wbxml_conv_wbxml2xml_destroy\0")
                .map_err(|err| {
                    LibwbxmlDecodeError::Failed(format!(
                        "libwbxml missing destroy symbol in {candidate}: {err}"
                    ))
                })?;
            let errors_string = lib
                .get::<unsafe extern "C" fn(i32) -> *const u8>(b"wbxml_errors_string\0")
                .map_err(|err| {
                    LibwbxmlDecodeError::Failed(format!(
                        "libwbxml missing errors symbol in {candidate}: {err}"
                    ))
                })?;

            let mut conv: *mut c_void = std::ptr::null_mut();
            let create_rc = create(&mut conv);
            if create_rc != 0 || conv.is_null() {
                return Err(LibwbxmlDecodeError::Failed(format!(
                    "WBXML decode failed: {}",
                    libwbxml_error_text(*errors_string, create_rc)
                )));
            }

            let mut xml_ptr: *mut u8 = std::ptr::null_mut();
            let mut xml_len: u32 = 0;
            let run_rc = run(
                conv,
                payload.as_ptr() as *mut u8,
                payload.len() as u32,
                &mut xml_ptr,
                &mut xml_len,
            );
            destroy(conv);

            if run_rc != 0 {
                return Err(LibwbxmlDecodeError::Failed(format!(
                    "WBXML decode failed: {}",
                    libwbxml_error_text(*errors_string, run_rc)
                )));
            }
            if xml_ptr.is_null() || xml_len == 0 {
                return Err(LibwbxmlDecodeError::Failed(
                    "WBXML decode failed: decoder returned empty output".to_string(),
                ));
            }

            let xml_slice = std::slice::from_raw_parts(xml_ptr, xml_len as usize);
            let xml_text = String::from_utf8_lossy(xml_slice).trim().to_string();
            libc::free(xml_ptr as *mut c_void);

            if xml_text.is_empty() {
                return Err(LibwbxmlDecodeError::Failed(
                    "WBXML decode failed: decoder returned empty output".to_string(),
                ));
            }
            Ok(xml_text)
        };
        return result;
    }

    Err(LibwbxmlDecodeError::Unavailable(format!(
        "libwbxml shared library not available ({last_load_err})"
    )))
}

pub(crate) fn decode_wmlc_with_tool(payload: &[u8], tool: &str) -> Result<String, String> {
    if payload.is_empty() {
        return Err("WBXML decode failed: empty payload".to_string());
    }

    let tmp_dir = tempdir().map_err(|err| format!("WBXML decode failed: temp dir: {err}"))?;
    let input_path = tmp_dir.path().join("input.wmlc");
    let output_path = tmp_dir.path().join("output.xml");
    fs::write(&input_path, payload)
        .map_err(|err| format!("WBXML decode failed: write input: {err}"))?;

    let proc = Command::new(tool)
        .arg("-o")
        .arg(&output_path)
        .arg(&input_path)
        .output()
        .map_err(|_| {
            format!("WBXML decoder tool not available: {tool}. Install libwbxml/wbxml2xml.")
        })?;
    if !proc.status.success() {
        let stderr = String::from_utf8_lossy(&proc.stderr);
        let first = stderr
            .lines()
            .next()
            .unwrap_or("decoder returned non-zero status");
        return Err(format!("WBXML decode failed: {first}"));
    }

    let xml = fs::read_to_string(&output_path)
        .map_err(|err| format!("WBXML decode failed: read output: {err}"))?;
    let trimmed = xml.trim().to_string();
    if trimmed.is_empty() {
        return Err("WBXML decode failed: decoder returned empty output".to_string());
    }
    Ok(trimmed)
}

pub(crate) fn decode_wmlc(payload: &[u8]) -> Result<String, String> {
    match decode_wmlc_with_libwbxml(payload) {
        Ok(xml) => Ok(xml),
        Err(LibwbxmlDecodeError::Failed(err)) => Err(err),
        Err(LibwbxmlDecodeError::Unavailable(lib_err)) => {
            match decode_wmlc_with_tool(payload, &wbxml2xml_bin()) {
                Ok(xml) => Ok(xml),
                Err(tool_err) => Err(format!("{lib_err}; {tool_err}")),
            }
        }
    }
}

pub fn preflight_wbxml_decoder() -> Result<String, String> {
    if libwbxml_available().is_ok() {
        return Ok("libwbxml".to_string());
    }

    let tool = wbxml2xml_bin();
    let output = Command::new(&tool)
        .arg("--version")
        .output()
        .map_err(|_| {
            format!(
                "WBXML decoder unavailable. Neither libwbxml shared library nor `{tool}` is accessible."
            )
        })?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let reason = stderr.lines().next().unwrap_or("non-zero exit");
        return Err(format!(
            "WBXML decoder preflight failed at `{tool}`: {reason}"
        ));
    }
    Ok("wbxml2xml-cli".to_string())
}
