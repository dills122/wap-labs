pub const APP_NAME: &str = "Waves Browser";
pub const APP_SHORT_VERSION: &str = "1.x";
pub const APP_TAGLINE: &str = "WAP/WML based browser 1.x";
pub const APP_ABOUT_COMMENTS: &str = "A WAP/WML based browser 1.x";
pub const APP_COPYRIGHT: &str = "Copyright (c) 2026 WaveNav";

pub const MENU_CHECK_FOR_UPDATES_ID: &str = "check-for-updates";
pub const MENU_CHECK_FOR_UPDATES_LABEL: &str = "Check for Updates (Coming Soon)";
pub const MENU_FILE_LABEL: &str = "File";
pub const MENU_EDIT_LABEL: &str = "Edit";
pub const MENU_WINDOW_LABEL: &str = "Window";
pub const MENU_HELP_LABEL: &str = "Help";
pub const EVENT_UPDATER_CHECK_REQUESTED: &str = "waves://updater/check-requested";
pub const LOG_UPDATER_CHECK_REQUESTED: &str =
    "Check for Updates requested (hook ready, updater not yet implemented)";
pub const LOG_UPDATER_EVENT_EMIT_FAILED: &str = "failed to emit updater check event";

pub const FETCH_REQUEST_ID_PREFIX: &str = "waves-fetch-";
pub const FETCH_DESTINATION_POLICY_ENV: &str = "WAVES_FETCH_DESTINATION_POLICY";
pub const FETCH_DESTINATION_POLICY_DEFAULT: &str = "public-only";
pub const FETCH_DESTINATION_POLICY_ALLOW_PRIVATE: &str = "allow-private";
pub const HEALTH_RESPONSE: &str = "wavenav-host-tauri-native-engine";
pub const RUN_ERROR_CONTEXT: &str = "error while running Waves Tauri host";
