pub mod contract_types;
pub mod waves_config;

mod engine_bridge;
mod fetch_host;
#[cfg(test)]
mod kannel_smoke;

use contract_types::{
    AdvanceTimeRequest, EngineRuntimeSnapshot, HandleKeyRequest, LoadDeckContextRequest,
    LoadDeckRequest, NavigateToCardRequest, RenderList, SetViewportColsRequest,
};
use engine_bridge::{
    command_engine_advance_time_ms, command_engine_clear_external_navigation_intent,
    command_engine_handle_key, command_engine_load_deck, command_engine_load_deck_context,
    command_engine_navigate_back, command_engine_navigate_to_card, command_engine_render,
    command_engine_set_viewport_cols, command_engine_snapshot, AppState,
};
use fetch_host::fetch_deck as host_fetch_deck;
use lowband_transport_rust::{preflight_wbxml_decoder, FetchDeckRequest, FetchDeckResponse};
use tauri::menu::{AboutMetadataBuilder, Menu, MenuBuilder, SubmenuBuilder};
use tauri::path::BaseDirectory;
use tauri::Emitter;
use tauri::Manager;
use tauri::State;

#[tauri::command]
fn health() -> String {
    waves_config::HEALTH_RESPONSE.to_string()
}

fn bundled_wbxml_resource_relpath() -> &'static str {
    #[cfg(target_os = "macos")]
    {
        "wbxml/macos/wbxml2xml"
    }
    #[cfg(target_os = "linux")]
    {
        "wbxml/linux/wbxml2xml"
    }
    #[cfg(target_os = "windows")]
    {
        "wbxml/windows/wbxml2xml.exe"
    }
}

fn configure_bundled_wbxml_decoder(app: &tauri::AppHandle) -> Result<(), String> {
    let resource_path = app
        .path()
        .resolve(bundled_wbxml_resource_relpath(), BaseDirectory::Resource)
        .map_err(|err| format!("failed resolving wbxml resource path: {err}"))?;
    if !resource_path.is_file() {
        return Ok(());
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&resource_path)
            .map_err(|err| format!("failed reading wbxml binary metadata: {err}"))?
            .permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&resource_path, perms)
            .map_err(|err| format!("failed making wbxml binary executable: {err}"))?;
    }

    std::env::set_var("WBXML2XML_BIN", &resource_path);
    Ok(())
}

fn preflight_wbxml_decoder_available() -> Result<(), String> {
    let backend = preflight_wbxml_decoder()?;
    println!("WBXML decoder backend: {backend}");
    Ok(())
}

#[tauri::command]
fn fetch_deck(request: FetchDeckRequest) -> FetchDeckResponse {
    host_fetch_deck(request)
}

fn handle_check_for_updates_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Err(error) = app.emit(
        waves_config::EVENT_UPDATER_CHECK_REQUESTED,
        serde_json::json!({
            "source": "menu",
            "placeholder": true
        }),
    ) {
        eprintln!("{}: {error}", waves_config::LOG_UPDATER_EVENT_EMIT_FAILED);
    }
    println!("{}", waves_config::LOG_UPDATER_CHECK_REQUESTED);
}

fn build_app_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let about_metadata = AboutMetadataBuilder::new()
        .name(Some(waves_config::APP_NAME))
        .version(Some(env!("CARGO_PKG_VERSION")))
        .short_version(Some(waves_config::APP_SHORT_VERSION))
        .comments(Some(waves_config::APP_ABOUT_COMMENTS))
        .copyright(Some(waves_config::APP_COPYRIGHT))
        .build();

    let mut menu = MenuBuilder::new(app);

    #[cfg(target_os = "macos")]
    {
        menu = menu.item(
            &SubmenuBuilder::new(app, waves_config::APP_NAME)
                .about(Some(about_metadata.clone()))
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?,
        );
    }

    #[cfg(not(any(
        target_os = "linux",
        target_os = "dragonfly",
        target_os = "freebsd",
        target_os = "netbsd",
        target_os = "openbsd"
    )))]
    {
        menu = menu.item(
            &SubmenuBuilder::new(app, waves_config::MENU_FILE_LABEL)
                .close_window()
                .separator()
                .quit()
                .build()?,
        );
    }

    menu = menu
        .item(
            &SubmenuBuilder::new(app, waves_config::MENU_EDIT_LABEL)
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .separator()
                .select_all()
                .build()?,
        )
        .item(
            &SubmenuBuilder::new(app, waves_config::MENU_WINDOW_LABEL)
                .minimize()
                .maximize()
                .separator()
                .close_window()
                .build()?,
        )
        .item(
            &SubmenuBuilder::new(app, waves_config::MENU_HELP_LABEL)
                .text(
                    waves_config::MENU_CHECK_FOR_UPDATES_ID,
                    waves_config::MENU_CHECK_FOR_UPDATES_LABEL,
                )
                .separator()
                .about(Some(about_metadata))
                .build()?,
        );

    menu.build()
}

#[tauri::command]
fn engine_load_deck(
    state: State<AppState>,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_load_deck(state.inner(), request)
}

#[tauri::command]
fn engine_load_deck_context(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_load_deck_context(state.inner(), request)
}

#[tauri::command]
fn engine_render(state: State<AppState>) -> Result<RenderList, String> {
    command_engine_render(state.inner())
}

#[tauri::command]
fn engine_handle_key(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_handle_key(state.inner(), request)
}

#[tauri::command]
fn engine_navigate_to_card(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_navigate_to_card(state.inner(), request)
}

#[tauri::command]
fn engine_navigate_back(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_navigate_back(state.inner())
}

#[tauri::command]
fn engine_set_viewport_cols(
    state: State<AppState>,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_set_viewport_cols(state.inner(), request)
}

#[tauri::command]
fn engine_advance_time_ms(
    state: State<AppState>,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_advance_time_ms(state.inner(), request)
}

#[tauri::command]
fn engine_snapshot(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_snapshot(state.inner())
}

#[tauri::command]
fn engine_clear_external_navigation_intent(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_clear_external_navigation_intent(state.inner())
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .menu(build_app_menu)
        .on_menu_event(|app, event| {
            if event.id() == waves_config::MENU_CHECK_FOR_UPDATES_ID {
                handle_check_for_updates_menu(app);
            }
        })
        .setup(|app| {
            configure_bundled_wbxml_decoder(app.handle())?;
            preflight_wbxml_decoder_available()?;
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
            engine_advance_time_ms,
            engine_snapshot,
            engine_clear_external_navigation_intent
        ])
        .run(tauri::generate_context!())
        .expect(waves_config::RUN_ERROR_CONTEXT);
}

#[cfg(test)]
mod tests;
