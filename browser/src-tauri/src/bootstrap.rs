#[cfg(not(test))]
use crate::application_commands::{
    self, ApplicationCommandGroup, NativeMenuPlatform, APPLICATION_COMMAND_EVENT,
};
#[cfg(not(test))]
use crate::engine_bridge::AppState;
#[cfg(not(test))]
use crate::waves_config;
#[cfg(not(test))]
use crate::HostFetchState;
#[cfg(not(test))]
use lowband_transport_rust::preflight_wbxml_decoder;
#[cfg(not(test))]
use tauri::menu::{
    AboutMetadataBuilder, Menu, MenuBuilder, MenuItemBuilder, Submenu, SubmenuBuilder,
};
#[cfg(not(test))]
use tauri::Emitter;

#[cfg(not(test))]
macro_rules! handler_from_command_contract {
    ($(
        $command:ident => {
            client: $client:literal,
            parameter: $parameter:expr,
            response: $response:expr,
            facade: $facade:expr
        };
    )*) => {
        tauri::generate_handler![$(crate::$command),*]
    };
}

#[cfg(not(test))]
fn preflight_wbxml_decoder_available() -> Result<(), String> {
    let backend = preflight_wbxml_decoder()?;
    println!("WBXML decoder backend: {backend}");
    Ok(())
}

#[cfg(not(test))]
fn emit_application_command<R: tauri::Runtime>(app: &tauri::AppHandle<R>, id: &str) -> bool {
    let Some(request) = application_commands::native_menu_request(id) else {
        return application_commands::command_by_id(id).is_some();
    };
    if let Err(error) = app.emit_to(
        waves_config::MAIN_WINDOW_LABEL,
        APPLICATION_COMMAND_EVENT,
        request,
    ) {
        eprintln!(
            "failed to emit application command `{}`: {error}",
            request.command_id
        );
    }
    true
}

#[cfg(not(test))]
fn build_command_submenu<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    group: ApplicationCommandGroup,
) -> tauri::Result<Submenu<R>> {
    let mut submenu = SubmenuBuilder::new(app, group.label());
    for projected in application_commands::project_application_commands(&[])
        .filter(|projected| projected.command.group == group)
    {
        // Shortcuts stay in the generated frontend bridge so focused DOM/WML editing can reject
        // them before execution. Native OS accelerators would bypass that focus-aware boundary.
        let item = MenuItemBuilder::with_id(projected.command.id, projected.command.label)
            .enabled(projected.enabled)
            .build(app)?;
        submenu = submenu.item(&item);
    }
    if group == ApplicationCommandGroup::File {
        submenu = submenu.separator().close_window();
        #[cfg(not(target_os = "macos"))]
        {
            submenu = submenu.separator().quit();
        }
    }
    submenu.build()
}

#[cfg(all(not(test), target_os = "macos"))]
const fn native_menu_platform() -> NativeMenuPlatform {
    NativeMenuPlatform::Macos
}

#[cfg(all(not(test), not(target_os = "macos")))]
const fn native_menu_platform() -> NativeMenuPlatform {
    NativeMenuPlatform::Linux
}

#[cfg(not(test))]
fn build_app_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let about_metadata = AboutMetadataBuilder::new()
        .name(Some(waves_config::APP_NAME))
        .version(Some(env!("CARGO_PKG_VERSION")))
        .short_version(Some(waves_config::APP_SHORT_VERSION))
        .comments(Some(waves_config::APP_ABOUT_COMMENTS))
        .copyright(Some(waves_config::APP_COPYRIGHT))
        .build();

    let mut menu = MenuBuilder::new(app);

    let native_groups = application_commands::native_menu_groups(native_menu_platform());
    let help_command =
        application_commands::projected_command_by_id(application_commands::COMMAND_HELP, &[])
            .expect("help command must be registered");
    let help_command =
        MenuItemBuilder::with_id(help_command.command.id, help_command.command.label)
            .enabled(help_command.enabled)
            .build(app)?;

    #[cfg(target_os = "macos")]
    {
        let preferences_item = application_commands::projected_command_by_id(
            application_commands::COMMAND_PREFERENCES,
            &[],
        )
        .expect("preferences command must be registered");
        let preferences_item =
            MenuItemBuilder::with_id(preferences_item.command.id, preferences_item.command.label)
                .enabled(preferences_item.enabled)
                .build(app)?;
        menu = menu.item(
            &SubmenuBuilder::new(app, waves_config::APP_NAME)
                .about(Some(about_metadata.clone()))
                .separator()
                .item(&preferences_item)
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

    for group in native_groups.iter().copied() {
        if group == ApplicationCommandGroup::Help {
            continue;
        }
        let submenu = build_command_submenu(app, group)?;
        menu = menu.item(&submenu);
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
        );

    if native_groups.contains(&ApplicationCommandGroup::Help) {
        menu = menu.item(
            &SubmenuBuilder::new(app, waves_config::MENU_HELP_LABEL)
                .item(&help_command)
                .separator()
                .item(
                    &MenuItemBuilder::with_id(
                        waves_config::MENU_CHECK_FOR_UPDATES_ID,
                        waves_config::MENU_CHECK_FOR_UPDATES_LABEL,
                    )
                    .enabled(false)
                    .build(app)?,
                )
                .separator()
                .about(Some(about_metadata))
                .build()?,
        );
    }

    menu.build()
}

#[cfg(not(test))]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(AppState::from_local_config())
        .manage(HostFetchState::default())
        .menu(build_app_menu)
        .on_menu_event(|app, event| {
            emit_application_command(app, event.id().as_ref());
        })
        .setup(|_| {
            preflight_wbxml_decoder_available()?;
            Ok(())
        })
        .invoke_handler(crate::command_contract::with_tauri_commands!(
            handler_from_command_contract
        ))
        .build(tauri::generate_context!())
        .expect(waves_config::RUN_ERROR_CONTEXT);
    app.run(|app_handle, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            if let Err(error) = crate::mark_application_state_clean_exit(app_handle) {
                eprintln!("failed to mark application state cleanly closed: {error}");
            }
        }
    });
}
