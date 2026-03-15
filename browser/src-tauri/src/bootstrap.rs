use crate::engine_bridge::AppState;
use crate::waves_config;
use lowband_transport_rust::preflight_wbxml_decoder;
use tauri::menu::{AboutMetadataBuilder, Menu, MenuBuilder, SubmenuBuilder};
use tauri::path::BaseDirectory;
use tauri::Emitter;
use tauri::Manager;

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
            crate::health,
            crate::fetch_deck,
            crate::engine_load_deck,
            crate::engine_load_deck_context,
            crate::engine_load_deck_context_frame,
            crate::engine_render,
            crate::engine_render_frame,
            crate::engine_handle_key,
            crate::engine_handle_key_frame,
            crate::engine_navigate_to_card,
            crate::engine_navigate_to_card_frame,
            crate::engine_navigate_back,
            crate::engine_navigate_back_frame,
            crate::engine_set_viewport_cols,
            crate::engine_advance_time_ms,
            crate::engine_advance_time_ms_frame,
            crate::engine_snapshot,
            crate::engine_clear_external_navigation_intent,
            crate::engine_clear_external_navigation_intent_frame,
            crate::engine_begin_focused_input_edit,
            crate::engine_begin_focused_input_edit_frame,
            crate::engine_set_focused_input_edit_draft,
            crate::engine_set_focused_input_edit_draft_frame,
            crate::engine_commit_focused_input_edit,
            crate::engine_commit_focused_input_edit_frame,
            crate::engine_cancel_focused_input_edit,
            crate::engine_cancel_focused_input_edit_frame,
            crate::engine_begin_focused_select_edit,
            crate::engine_begin_focused_select_edit_frame,
            crate::engine_move_focused_select_edit,
            crate::engine_move_focused_select_edit_frame,
            crate::engine_commit_focused_select_edit,
            crate::engine_commit_focused_select_edit_frame,
            crate::engine_cancel_focused_select_edit,
            crate::engine_cancel_focused_select_edit_frame
        ])
        .run(tauri::generate_context!())
        .expect(waves_config::RUN_ERROR_CONTEXT);
}
