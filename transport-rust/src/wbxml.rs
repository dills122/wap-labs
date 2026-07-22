use std::env;
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus, Stdio};
use std::thread;
use std::time::{Duration, Instant};
use tempfile::tempdir;

const WBXML_DECODE_TIMEOUT: Duration = Duration::from_secs(5);
const MAX_DECODED_WBXML_BYTES: usize = 2 * 1024 * 1024;
const CHILD_POLL_INTERVAL: Duration = Duration::from_millis(10);

pub(crate) fn wbxml2xml_bin() -> String {
    env::var("WBXML2XML_BIN").unwrap_or_else(|_| "wbxml2xml".to_string())
}

pub(crate) fn resolve_wbxml_decoder_path(tool: &str) -> Result<PathBuf, String> {
    let configured = Path::new(tool);
    if configured.is_absolute() {
        return validate_decoder_executable(configured);
    }
    if configured.components().count() != 1 {
        return Err(format!(
            "WBXML decoder path must be absolute when it contains path components: {tool}"
        ));
    }

    let path = env::var_os("PATH").ok_or_else(|| {
        format!("WBXML decoder tool not available: {tool}. PATH is not configured.")
    })?;
    for directory in env::split_paths(&path).filter(|directory| directory.is_absolute()) {
        let candidate = directory.join(tool);
        if let Ok(resolved) = validate_decoder_executable(&candidate) {
            return Ok(resolved);
        }

        #[cfg(windows)]
        if candidate.extension().is_none() {
            let candidate = directory.join(format!("{tool}.exe"));
            if let Ok(resolved) = validate_decoder_executable(&candidate) {
                return Ok(resolved);
            }
        }
    }

    Err(format!(
        "WBXML decoder tool not available: {tool}. Install libwbxml/wbxml2xml."
    ))
}

fn validate_decoder_executable(path: &Path) -> Result<PathBuf, String> {
    let canonical = path.canonicalize().map_err(|_| {
        format!(
            "WBXML decoder tool not available: {}. Install libwbxml/wbxml2xml.",
            path.display()
        )
    })?;
    let metadata = fs::metadata(&canonical).map_err(|error| {
        format!(
            "WBXML decoder metadata unavailable at {}: {error}",
            canonical.display()
        )
    })?;
    if !metadata.is_file() {
        return Err(format!(
            "WBXML decoder path is not a file: {}",
            canonical.display()
        ));
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if metadata.permissions().mode() & 0o111 == 0 {
            return Err(format!(
                "WBXML decoder is not executable: {}",
                canonical.display()
            ));
        }
    }

    Ok(canonical)
}

pub(crate) fn decode_wmlc_with_tool(payload: &[u8], tool: &str) -> Result<String, String> {
    decode_wmlc_with_tool_limits(payload, tool, WBXML_DECODE_TIMEOUT, MAX_DECODED_WBXML_BYTES)
}

pub(crate) fn decode_wmlc_with_tool_limits(
    payload: &[u8],
    tool: &str,
    timeout: Duration,
    max_output_bytes: usize,
) -> Result<String, String> {
    if payload.is_empty() {
        return Err("WBXML decode failed: empty payload".to_string());
    }

    let decoder = resolve_wbxml_decoder_path(tool)?;
    let tmp_dir = tempdir().map_err(|error| format!("WBXML decode failed: temp dir: {error}"))?;
    let input_path = tmp_dir.path().join("input.wmlc");
    let output_path = tmp_dir.path().join("output.xml");
    fs::write(&input_path, payload)
        .map_err(|error| format!("WBXML decode failed: write input: {error}"))?;

    let mut child = Command::new(&decoder)
        .arg("-o")
        .arg(&output_path)
        .arg(&input_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| {
            format!(
                "WBXML decoder tool not available: {} ({error})",
                decoder.display()
            )
        })?;
    let status = wait_for_child(&mut child, timeout)?;
    if !status.success() {
        return Err(format!(
            "WBXML decode failed: decoder returned non-zero status ({status})"
        ));
    }

    read_decoder_output(&output_path, max_output_bytes)
}

fn wait_for_child(child: &mut Child, timeout: Duration) -> Result<ExitStatus, String> {
    let started = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => return Ok(status),
            Ok(None) if started.elapsed() < timeout => thread::sleep(CHILD_POLL_INTERVAL),
            Ok(None) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(format!(
                    "WBXML decode failed: decoder timed out after {} ms",
                    timeout.as_millis()
                ));
            }
            Err(error) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(format!("WBXML decode failed: wait for decoder: {error}"));
            }
        }
    }
}

fn read_decoder_output(path: &Path, max_output_bytes: usize) -> Result<String, String> {
    let metadata =
        fs::metadata(path).map_err(|error| format!("WBXML decode failed: read output: {error}"))?;
    if metadata.len() > max_output_bytes as u64 {
        return Err(format!(
            "WBXML decode failed: output exceeds {max_output_bytes}-byte limit"
        ));
    }

    let mut bytes = Vec::with_capacity(metadata.len() as usize);
    File::open(path)
        .map_err(|error| format!("WBXML decode failed: read output: {error}"))?
        .take(max_output_bytes as u64 + 1)
        .read_to_end(&mut bytes)
        .map_err(|error| format!("WBXML decode failed: read output: {error}"))?;
    if bytes.len() > max_output_bytes {
        return Err(format!(
            "WBXML decode failed: output exceeds {max_output_bytes}-byte limit"
        ));
    }

    let xml = String::from_utf8(bytes)
        .map_err(|error| format!("WBXML decode failed: output is not UTF-8: {error}"))?;
    let trimmed = xml.trim().to_string();
    if trimmed.is_empty() {
        return Err("WBXML decode failed: decoder returned empty output".to_string());
    }
    Ok(trimmed)
}

pub(crate) fn decode_wmlc(payload: &[u8]) -> Result<String, String> {
    decode_wmlc_with_tool(payload, &wbxml2xml_bin())
}

pub fn preflight_wbxml_decoder() -> Result<String, String> {
    let configured = wbxml2xml_bin();
    let decoder = resolve_wbxml_decoder_path(&configured).map_err(|error| {
        format!("WBXML decoder unavailable. No isolated wbxml2xml CLI is accessible: {error}")
    })?;
    let mut child = Command::new(&decoder)
        .arg("--version")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| {
            format!(
                "WBXML decoder preflight failed at {}: {error}",
                decoder.display()
            )
        })?;
    let status = wait_for_child(&mut child, WBXML_DECODE_TIMEOUT)?;
    if !status.success() {
        return Err(format!(
            "WBXML decoder preflight failed at {}: {status}",
            decoder.display()
        ));
    }
    Ok("wbxml2xml-cli-isolated".to_string())
}
