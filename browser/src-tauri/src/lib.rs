use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FetchDeckRequest {
    url: String,
    method: Option<String>,
    timeout_ms: Option<u64>,
    retries: Option<u8>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FetchDeckResponse {
    ok: bool,
    status: u16,
    final_url: String,
    content_type: String,
    wml: Option<String>,
    error: Option<String>,
}

#[tauri::command]
fn health() -> String {
    "wavenav-host-tauri-skeleton".to_string()
}

#[tauri::command]
fn fetch_deck(request: FetchDeckRequest) -> FetchDeckResponse {
    // Skeleton behavior only. Transport-python integration will be wired in the first vertical slice.
    FetchDeckResponse {
        ok: false,
        status: 501,
        final_url: request.url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some("fetch_deck not implemented; integrate transport-python HTTP client".to_string()),
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![health, fetch_deck])
        .run(tauri::generate_context!())
        .expect("error while running WaveNav Tauri host");
}
