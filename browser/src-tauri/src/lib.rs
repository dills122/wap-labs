use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::process::{Child, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{Manager, State};
use wavenav_engine::{RenderList, WmlEngine};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FetchDeckRequest {
    url: String,
    method: Option<String>,
    headers: Option<HashMap<String, String>>,
    timeout_ms: Option<u64>,
    retries: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FetchTiming {
    encode: f64,
    udp_rtt: f64,
    decode: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FetchErrorInfo {
    code: String,
    message: String,
    details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EngineDeckInputPayload {
    wml_xml: String,
    base_url: String,
    content_type: String,
    raw_bytes_base64: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FetchDeckResponse {
    ok: bool,
    status: u16,
    final_url: String,
    content_type: String,
    wml: Option<String>,
    error: Option<FetchErrorInfo>,
    timing_ms: FetchTiming,
    engine_deck_input: Option<EngineDeckInputPayload>,
}

struct AppState {
    engine: Mutex<WmlEngine>,
    transport_api_base: String,
    transport_sidecar: Mutex<Option<Child>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            engine: Mutex::new(WmlEngine::new()),
            transport_api_base: transport_api_base(),
            transport_sidecar: Mutex::new(None),
        }
    }
}

impl Drop for AppState {
    fn drop(&mut self) {
        if let Ok(mut child_slot) = self.transport_sidecar.lock() {
            if let Some(mut child) = child_slot.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoadDeckRequest {
    wml_xml: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoadDeckContextRequest {
    wml_xml: String,
    base_url: String,
    content_type: String,
    raw_bytes_base64: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HandleKeyRequest {
    key: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NavigateToCardRequest {
    card_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SetViewportColsRequest {
    cols: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct EngineRuntimeSnapshot {
    active_card_id: Option<String>,
    focused_link_index: usize,
    base_url: String,
    content_type: String,
    external_navigation_intent: Option<String>,
    last_script_execution_ok: Option<bool>,
    last_script_execution_trap: Option<String>,
    last_script_requires_refresh: Option<bool>,
}

fn snapshot(engine: &WmlEngine) -> EngineRuntimeSnapshot {
    EngineRuntimeSnapshot {
        active_card_id: engine.active_card_id().ok(),
        focused_link_index: engine.focused_link_index(),
        base_url: engine.base_url(),
        content_type: engine.content_type(),
        external_navigation_intent: engine.external_navigation_intent(),
        last_script_execution_ok: engine.last_script_execution_ok(),
        last_script_execution_trap: engine.last_script_execution_trap(),
        last_script_requires_refresh: engine.last_script_requires_refresh(),
    }
}

fn apply_load_deck(
    engine: &mut WmlEngine,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.load_deck(&request.wml_xml)?;
    Ok(snapshot(engine))
}

fn apply_load_deck_context(
    engine: &mut WmlEngine,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.load_deck_context(
        &request.wml_xml,
        &request.base_url,
        &request.content_type,
        request.raw_bytes_base64,
    )?;
    Ok(snapshot(engine))
}

fn apply_render(engine: &WmlEngine) -> Result<RenderList, String> {
    engine.render()
}

fn apply_handle_key(
    engine: &mut WmlEngine,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.handle_key(request.key)?;
    Ok(snapshot(engine))
}

fn apply_navigate_to_card(
    engine: &mut WmlEngine,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.navigate_to_card(request.card_id)?;
    Ok(snapshot(engine))
}

fn apply_navigate_back(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.navigate_back();
    snapshot(engine)
}

fn apply_set_viewport_cols(
    engine: &mut WmlEngine,
    request: SetViewportColsRequest,
) -> EngineRuntimeSnapshot {
    engine.set_viewport_cols(request.cols);
    snapshot(engine)
}

fn apply_engine_snapshot(engine: &WmlEngine) -> EngineRuntimeSnapshot {
    snapshot(engine)
}

fn apply_clear_external_navigation_intent(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.clear_external_navigation_intent();
    snapshot(engine)
}

fn lock_engine<'a>(
    state: &'a State<AppState>,
) -> Result<std::sync::MutexGuard<'a, WmlEngine>, String> {
    state
        .engine
        .lock()
        .map_err(|_| "engine state lock poisoned".to_string())
}

#[tauri::command]
fn health() -> String {
    "wavenav-host-tauri-native-engine".to_string()
}

fn transport_api_base() -> String {
    env::var("TRANSPORT_API_BASE").unwrap_or_else(|_| "http://127.0.0.1:8765".to_string())
}

fn transport_sidecar_autostart_enabled() -> bool {
    !matches!(
        env::var("TRANSPORT_SIDECAR_AUTOSTART")
            .unwrap_or_else(|_| "1".to_string())
            .to_ascii_lowercase()
            .as_str(),
        "0" | "false" | "no"
    )
}

fn transport_python_bin(service_path: &Path) -> String {
    if let Ok(explicit) = env::var("PYTHON_BIN") {
        return explicit;
    }

    if let Some(service_dir) = service_path.parent() {
        let venv_python = service_dir.join(".venv").join("bin").join("python");
        if venv_python.is_file() {
            return venv_python.to_string_lossy().to_string();
        }
    }

    "python3".to_string()
}

fn transport_bootstrap_python_bin() -> String {
    env::var("PYTHON_BOOTSTRAP_BIN").unwrap_or_else(|_| "python3".to_string())
}

fn transport_sidecar_auto_provision_enabled() -> bool {
    !matches!(
        env::var("TRANSPORT_SIDECAR_AUTO_PROVISION")
            .unwrap_or_else(|_| "1".to_string())
            .to_ascii_lowercase()
            .as_str(),
        "0" | "false" | "no"
    )
}

fn transport_venv_python(service_path: &Path) -> Option<PathBuf> {
    service_path
        .parent()
        .map(|dir| dir.join(".venv").join("bin").join("python"))
}

fn has_fastapi(python_bin: &str) -> Result<bool, String> {
    let output = Command::new(python_bin)
        .arg("-c")
        .arg("import fastapi")
        .output()
        .map_err(|err| format!("failed to execute python binary `{python_bin}`: {err}"))?;
    Ok(output.status.success())
}

fn install_transport_requirements(python_bin: &str, service_path: &Path) -> Result<(), String> {
    let service_dir = service_working_dir(service_path)?;
    let requirements = service_dir.join("requirements.txt");
    if !requirements.is_file() {
        return Err(format!(
            "transport requirements file not found: {}",
            requirements.display()
        ));
    }

    let output = Command::new(python_bin)
        .arg("-m")
        .arg("pip")
        .arg("install")
        .arg("-r")
        .arg("requirements.txt")
        .current_dir(service_dir)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .output()
        .map_err(|err| format!("failed to run pip install for transport sidecar: {err}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!(
            "pip install -r requirements.txt failed for transport sidecar using `{python_bin}`: {stderr}"
        ));
    }

    Ok(())
}

fn ensure_transport_python_env(service_path: &Path) -> Result<String, String> {
    if let Ok(explicit) = env::var("PYTHON_BIN") {
        if has_fastapi(&explicit)? {
            return Ok(explicit);
        }
        return Err(format!(
            "PYTHON_BIN is set to `{explicit}` but fastapi is unavailable in that environment"
        ));
    }

    if let Some(venv_python) = transport_venv_python(service_path) {
        let venv_python_text = venv_python.to_string_lossy().to_string();
        if venv_python.is_file() {
            if has_fastapi(&venv_python_text)? {
                return Ok(venv_python_text);
            }
            if !transport_sidecar_auto_provision_enabled() {
                return Err(format!(
                    "transport python env missing fastapi in `{}` and auto-provision is disabled",
                    venv_python_text
                ));
            }
            install_transport_requirements(&venv_python_text, service_path)?;
            if has_fastapi(&venv_python_text)? {
                return Ok(venv_python_text);
            }
            return Err("fastapi import still failing after transport pip install".to_string());
        }

        if !transport_sidecar_auto_provision_enabled() {
            return Err(
                "transport sidecar .venv is missing and auto-provision is disabled".to_string(),
            );
        }
        let bootstrap_python = transport_bootstrap_python_bin();
        let service_dir = service_working_dir(service_path)?;
        let venv_create = Command::new(&bootstrap_python)
            .arg("-m")
            .arg("venv")
            .arg(".venv")
            .current_dir(service_dir)
            .output()
            .map_err(|err| {
                format!("failed to create transport .venv with `{bootstrap_python}`: {err}")
            })?;
        if !venv_create.status.success() {
            return Err(format!(
                "failed creating transport .venv using `{bootstrap_python}`"
            ));
        }

        install_transport_requirements(&venv_python_text, service_path)?;
        if has_fastapi(&venv_python_text)? {
            return Ok(venv_python_text);
        }
    }

    let fallback = transport_python_bin(service_path);
    if has_fastapi(&fallback)? {
        return Ok(fallback);
    }
    Err(format!(
        "unable to provision transport python env automatically. Try setting PYTHON_BIN to a python with fastapi available"
    ))
}

fn find_transport_service_path() -> Result<PathBuf, String> {
    if let Ok(explicit) = env::var("TRANSPORT_SERVICE_PATH") {
        let path = PathBuf::from(explicit);
        if path.is_file() {
            return Ok(path);
        }
    }

    let mut roots = Vec::new();
    roots.push(PathBuf::from(env!("CARGO_MANIFEST_DIR")));
    if let Ok(cwd) = env::current_dir() {
        roots.push(cwd);
    }

    for root in roots {
        let mut cursor = Some(root.as_path());
        while let Some(dir) = cursor {
            let candidate = dir.join("transport-python").join("service.py");
            if candidate.is_file() {
                return Ok(candidate);
            }
            cursor = dir.parent();
        }
    }

    Err("unable to locate transport-python/service.py; set TRANSPORT_SERVICE_PATH".to_string())
}

fn check_transport_health(api_base: &str) -> bool {
    let health_url = format!("{api_base}/health");
    match Command::new("curl")
        .arg("-sS")
        .arg("--max-time")
        .arg("1")
        .arg(health_url)
        .output()
    {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout.contains("lowband-transport-python")
        }
        _ => false,
    }
}

fn wait_for_transport_health(api_base: &str, child: &mut Child) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_secs(8);
    while Instant::now() < deadline {
        if let Ok(Some(status)) = child.try_wait() {
            return Err(format!(
                "transport sidecar exited early with status: {status}"
            ));
        }
        if check_transport_health(api_base) {
            return Ok(());
        }
        thread::sleep(Duration::from_millis(200));
    }
    Err("transport sidecar health check timed out".to_string())
}

fn service_working_dir(service_path: &Path) -> Result<&Path, String> {
    service_path
        .parent()
        .ok_or_else(|| "invalid transport service path: missing parent directory".to_string())
}

fn start_transport_sidecar(state: &State<AppState>) -> Result<(), String> {
    if !transport_sidecar_autostart_enabled() {
        return Ok(());
    }
    if check_transport_health(&state.transport_api_base) {
        return Ok(());
    }

    let mut slot = state
        .transport_sidecar
        .lock()
        .map_err(|_| "transport sidecar lock poisoned".to_string())?;
    if slot.is_some() {
        return Ok(());
    }

    let service_path = find_transport_service_path()?;
    let python = ensure_transport_python_env(&service_path)?;

    let mut child = Command::new(python)
        .arg("service.py")
        .current_dir(service_working_dir(&service_path)?)
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|err| format!("failed to start transport sidecar: {err}"))?;

    if let Err(err) = wait_for_transport_health(&state.transport_api_base, &mut child) {
        let _ = child.kill();
        let _ = child.wait();
        return Err(err);
    }

    *slot = Some(child);
    Ok(())
}

fn transport_unavailable_response(url: String, message: String) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status: 0,
        final_url: url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(FetchErrorInfo {
            code: "TRANSPORT_UNAVAILABLE".to_string(),
            message,
            details: None,
        }),
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: 0.0,
            decode: 0.0,
        },
        engine_deck_input: None,
    }
}

#[tauri::command]
fn fetch_deck(state: State<AppState>, request: FetchDeckRequest) -> FetchDeckResponse {
    // First vertical slice: forward request to transport-python sidecar `/fetch`.
    // Fallback responses keep the host contract deterministic when sidecar is down.
    let base = state.transport_api_base.clone();
    let endpoint = format!("{base}/fetch");
    let timeout_ms = request.timeout_ms.unwrap_or(5000).clamp(100, 30000);
    let request_url = request.url.clone();
    let payload = serde_json::json!({
        "url": request.url,
        "method": request.method.unwrap_or_else(|| "GET".to_string()),
        "headers": request.headers.unwrap_or_default(),
        "timeoutMs": timeout_ms,
        "retries": request.retries.unwrap_or(1).clamp(0, 2),
    });
    let payload_text = payload.to_string();
    let timeout_seconds = (timeout_ms as f64 / 1000.0).max(0.1).to_string();
    let command = Command::new("curl")
        .arg("-sS")
        .arg("-X")
        .arg("POST")
        .arg(endpoint)
        .arg("-H")
        .arg("Content-Type: application/json")
        .arg("--max-time")
        .arg(timeout_seconds)
        .arg("--data")
        .arg(payload_text)
        .output();

    let output = match command {
        Ok(output) => output,
        Err(err) => {
            return transport_unavailable_response(
                request_url,
                format!("failed to execute curl for transport sidecar: {err}"),
            );
        }
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return transport_unavailable_response(
            request_url,
            format!("transport request failed: {stderr}"),
        );
    }

    match serde_json::from_slice::<FetchDeckResponse>(&output.stdout) {
        Ok(decoded) => decoded,
        Err(err) => transport_unavailable_response(
            request_url,
            format!("invalid transport response payload: {err}"),
        ),
    }
}

#[tauri::command]
fn engine_load_deck(
    state: State<AppState>,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    apply_load_deck(&mut engine, request)
}

#[tauri::command]
fn engine_load_deck_context(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    apply_load_deck_context(&mut engine, request)
}

#[tauri::command]
fn engine_render(state: State<AppState>) -> Result<RenderList, String> {
    let engine = lock_engine(&state)?;
    apply_render(&engine)
}

#[tauri::command]
fn engine_handle_key(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    apply_handle_key(&mut engine, request)
}

#[tauri::command]
fn engine_navigate_to_card(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    apply_navigate_to_card(&mut engine, request)
}

#[tauri::command]
fn engine_navigate_back(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    Ok(apply_navigate_back(&mut engine))
}

#[tauri::command]
fn engine_set_viewport_cols(
    state: State<AppState>,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    Ok(apply_set_viewport_cols(&mut engine, request))
}

#[tauri::command]
fn engine_snapshot(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    let engine = lock_engine(&state)?;
    Ok(apply_engine_snapshot(&engine))
}

#[tauri::command]
fn engine_clear_external_navigation_intent(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    Ok(apply_clear_external_navigation_intent(&mut engine))
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .setup(|app| {
            let state = app.state::<AppState>();
            if let Err(err) = start_transport_sidecar(&state) {
                eprintln!("[waves] transport sidecar startup warning: {err}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            health,
            fetch_deck,
            engine_load_deck,
            engine_load_deck_context,
            engine_render,
            engine_handle_key,
            engine_navigate_to_card,
            engine_navigate_back,
            engine_set_viewport_cols,
            engine_snapshot,
            engine_clear_external_navigation_intent
        ])
        .run(tauri::generate_context!())
        .expect("error while running Waves Tauri host");
}

#[cfg(test)]
mod tests {
    use super::{
        apply_clear_external_navigation_intent, apply_engine_snapshot, apply_handle_key,
        apply_load_deck_context, apply_navigate_back, apply_render, apply_set_viewport_cols,
        HandleKeyRequest, LoadDeckContextRequest,
    };
    use wavenav_engine::{DrawCmd, WmlEngine};

    const BASIC_NAV_WML: &str = r##"
    <wml>
      <card id="home">
        <p>Hello from Waves</p>
        <a href="#next">Next</a>
      </card>
      <card id="next">
        <p>Second card</p>
      </card>
    </wml>
    "##;

    const EXTERNAL_LINK_WML: &str = r##"
    <wml>
      <card id="home">
        <a href="next.wml?foo=1">Load External</a>
      </card>
    </wml>
    "##;

    #[test]
    fn smoke_load_render_and_snapshot() {
        let mut engine = WmlEngine::new();
        let snapshot = apply_load_deck_context(
            &mut engine,
            LoadDeckContextRequest {
                wml_xml: BASIC_NAV_WML.to_string(),
                base_url: "http://local.test/start.wml".to_string(),
                content_type: "text/vnd.wap.wml".to_string(),
                raw_bytes_base64: None,
            },
        )
        .expect("deck should load");
        assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));

        let render = apply_render(&engine).expect("render should succeed");
        let contains_greeting = render.draw.iter().any(|cmd| match cmd {
            DrawCmd::Text { text, .. } => text.contains("Hello from Waves"),
            _ => false,
        });
        assert!(
            contains_greeting,
            "render output should include greeting text"
        );

        let post = apply_engine_snapshot(&engine);
        assert_eq!(post.focused_link_index, 0);
    }

    #[test]
    fn smoke_key_navigation_and_back_stack() {
        let mut engine = WmlEngine::new();
        apply_load_deck_context(
            &mut engine,
            LoadDeckContextRequest {
                wml_xml: BASIC_NAV_WML.to_string(),
                base_url: "http://local.test/start.wml".to_string(),
                content_type: "text/vnd.wap.wml".to_string(),
                raw_bytes_base64: None,
            },
        )
        .expect("deck should load");

        let after_enter = apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: "enter".to_string(),
            },
        )
        .expect("enter should navigate");
        assert_eq!(after_enter.active_card_id.as_deref(), Some("next"));

        let after_back = apply_navigate_back(&mut engine);
        assert_eq!(after_back.active_card_id.as_deref(), Some("home"));
    }

    #[test]
    fn smoke_external_intent_set_and_clear() {
        let mut engine = WmlEngine::new();
        apply_load_deck_context(
            &mut engine,
            LoadDeckContextRequest {
                wml_xml: EXTERNAL_LINK_WML.to_string(),
                base_url: "http://local.test/dir/start.wml".to_string(),
                content_type: "text/vnd.wap.wml".to_string(),
                raw_bytes_base64: None,
            },
        )
        .expect("deck should load");

        apply_set_viewport_cols(&mut engine, super::SetViewportColsRequest { cols: 20 });
        let after_enter = apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: "enter".to_string(),
            },
        )
        .expect("enter should set external intent");
        assert_eq!(
            after_enter.external_navigation_intent.as_deref(),
            Some("http://local.test/dir/next.wml?foo=1")
        );

        let after_clear = apply_clear_external_navigation_intent(&mut engine);
        assert_eq!(after_clear.external_navigation_intent, None);
    }
}
