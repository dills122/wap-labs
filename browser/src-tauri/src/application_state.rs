use std::collections::HashSet;
use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use serde::{Deserialize, Serialize};
use ts_rs::TS;
use url::Url;

pub const APPLICATION_STATE_SCHEMA_VERSION: u32 = 1;
pub const APPLICATION_STATE_FILE_NAME: &str = "application-state-v1.json";
pub const MAX_APPLICATION_STATE_BYTES: u64 = 1_048_576;
pub const MAX_SAFE_SESSION_URL_BYTES: usize = 4 * 1024;
pub const MAX_SAFE_SESSION_EXAMPLE_ID_BYTES: usize = 256;
pub const MAX_SAFE_SESSION_FRAGMENT_BYTES: usize = 256;
pub const APPLICATION_STATE_ALLOWED_NETWORK_SCHEMES: &[&str] = &["http", "https", "wap", "waps"];
pub const APPLICATION_STATE_SENSITIVE_QUERY_KEYS: &[&str] = &[
    "access_token",
    "apikey",
    "api_key",
    "auth",
    "key",
    "password",
    "passwd",
    "pin",
    "secret",
    "session",
    "sessionid",
    "token",
];

pub const APPLICATION_STATE_SAFE_KEYS: &[&str] = &[
    "schemaVersion",
    "settings",
    "onboarding",
    "favorites",
    "windowState",
    "safeSession",
    "diagnosticPreferences",
    "displayScalePercent",
    "theme",
    "highContrast",
    "reducedMotion",
    "defaultRunMode",
    "startBehavior",
    "developerMode",
    "timelineRetention",
    "safeSessionRestore",
    "showWelcomeOnLaunch",
    "completedFirstDeckTour",
    "entries",
    "id",
    "title",
    "target",
    "createdAt",
    "updatedAt",
    "profileId",
    "kind",
    "url",
    "canonicalUrl",
    "exampleId",
    "fragment",
    "bounds",
    "maximized",
    "monitorId",
    "x",
    "y",
    "width",
    "height",
    "timeoutMs",
    "retryLimit",
    "maxResponseBytes",
    "constrainedNetwork",
    "routeOverride",
    "recoveryPending",
    "session",
];

#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
pub enum HostThemePreference {
    #[default]
    System,
    Light,
    Dark,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
pub enum DefaultRunModePreference {
    #[default]
    Local,
    Network,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
pub enum StartBehaviorPreference {
    #[default]
    Home,
    SafeSession,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ApplicationSettingsV1 {
    pub display_scale_percent: u16,
    pub theme: HostThemePreference,
    pub high_contrast: bool,
    pub reduced_motion: bool,
    pub default_run_mode: DefaultRunModePreference,
    pub start_behavior: StartBehaviorPreference,
    pub developer_mode: bool,
    pub timeline_retention: u32,
    pub safe_session_restore: bool,
}

impl Default for ApplicationSettingsV1 {
    fn default() -> Self {
        Self {
            display_scale_percent: 100,
            theme: HostThemePreference::System,
            high_contrast: false,
            reduced_motion: false,
            default_run_mode: DefaultRunModePreference::Local,
            start_behavior: StartBehaviorPreference::Home,
            developer_mode: false,
            timeline_retention: 200,
            safe_session_restore: false,
        }
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OnboardingStateV1 {
    pub show_welcome_on_launch: bool,
    pub completed_first_deck_tour: bool,
}

impl Default for OnboardingStateV1 {
    fn default() -> Self {
        Self {
            show_welcome_on_launch: true,
            completed_first_deck_tour: false,
        }
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum PersistedFavoriteTargetV1 {
    Network {
        url: String,
        #[serde(rename = "canonicalUrl")]
        canonical_url: String,
    },
    LocalExample {
        #[serde(rename = "exampleId")]
        example_id: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        fragment: Option<String>,
    },
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PersistedFavoriteV1 {
    pub id: String,
    pub title: String,
    pub target: PersistedFavoriteTargetV1,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub profile_id: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FavoritesStateV1 {
    pub entries: Vec<PersistedFavoriteV1>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WindowBoundsV1 {
    pub monitor_id: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WindowStateV1 {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub bounds: Option<WindowBoundsV1>,
    pub maximized: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum SafeSessionV1 {
    LocalExample {
        #[serde(rename = "exampleId")]
        example_id: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        fragment: Option<String>,
    },
    NetworkGet {
        url: String,
    },
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SafeSessionStateV1 {
    pub recovery_pending: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub session: Option<SafeSessionV1>,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
pub enum DiagnosticRouteOverrideV1 {
    Direct,
    Gateway,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DiagnosticPreferencesV1 {
    pub timeout_ms: u32,
    pub retry_limit: u8,
    pub max_response_bytes: u32,
    pub constrained_network: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub route_override: Option<DiagnosticRouteOverrideV1>,
}

impl Default for DiagnosticPreferencesV1 {
    fn default() -> Self {
        Self {
            timeout_ms: 10_000,
            retry_limit: 1,
            max_response_bytes: 1_048_576,
            constrained_network: false,
            route_override: None,
        }
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ApplicationStateV1 {
    pub schema_version: u32,
    pub settings: ApplicationSettingsV1,
    pub onboarding: OnboardingStateV1,
    pub favorites: FavoritesStateV1,
    pub window_state: WindowStateV1,
    pub safe_session: SafeSessionStateV1,
    pub diagnostic_preferences: DiagnosticPreferencesV1,
}

impl Default for ApplicationStateV1 {
    fn default() -> Self {
        Self {
            schema_version: APPLICATION_STATE_SCHEMA_VERSION,
            settings: ApplicationSettingsV1::default(),
            onboarding: OnboardingStateV1::default(),
            favorites: FavoritesStateV1::default(),
            window_state: WindowStateV1::default(),
            safe_session: SafeSessionStateV1::default(),
            diagnostic_preferences: DiagnosticPreferencesV1::default(),
        }
    }
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
pub enum ApplicationStateLoadStatus {
    Loaded,
    DefaultedAbsent,
    DefaultedCorrupt,
    DefaultedFutureVersion,
    DefaultedReadFailed,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ApplicationStateLoadResult {
    pub state: ApplicationStateV1,
    pub status: ApplicationStateLoadStatus,
    pub write_allowed: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub future_schema_version: Option<u32>,
    pub removed_monitor_window_state: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SaveApplicationStateRequest {
    pub state: ApplicationStateV1,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
pub enum ApplicationStateComponent {
    Settings,
    Onboarding,
    Favorites,
    WindowState,
    SafeSession,
    DiagnosticPreferences,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClearApplicationStateComponentRequest {
    pub component: ApplicationStateComponent,
}

enum ReadState {
    Absent,
    Loaded(ApplicationStateV1),
    Corrupt,
    Future(u32),
}

#[derive(Clone, Debug)]
pub struct AtomicApplicationStateBackend {
    path: PathBuf,
}

impl AtomicApplicationStateBackend {
    pub fn new(app_data_dir: impl AsRef<Path>) -> Self {
        Self {
            path: app_data_dir.as_ref().join(APPLICATION_STATE_FILE_NAME),
        }
    }

    #[cfg(test)]
    fn path(&self) -> &Path {
        &self.path
    }

    pub fn load(&self, available_monitor_ids: &[String]) -> ApplicationStateLoadResult {
        match self.read_state() {
            Ok(ReadState::Loaded(mut state)) => {
                let removed_monitor_window_state =
                    normalize_state(&mut state, available_monitor_ids);
                ApplicationStateLoadResult {
                    state,
                    status: ApplicationStateLoadStatus::Loaded,
                    write_allowed: true,
                    future_schema_version: None,
                    removed_monitor_window_state,
                }
            }
            Ok(ReadState::Absent) => {
                default_load_result(ApplicationStateLoadStatus::DefaultedAbsent, true)
            }
            Ok(ReadState::Corrupt) => {
                default_load_result(ApplicationStateLoadStatus::DefaultedCorrupt, false)
            }
            Ok(ReadState::Future(version)) => ApplicationStateLoadResult {
                state: ApplicationStateV1::default(),
                status: ApplicationStateLoadStatus::DefaultedFutureVersion,
                write_allowed: false,
                future_schema_version: Some(version),
                removed_monitor_window_state: false,
            },
            Err(_) => default_load_result(ApplicationStateLoadStatus::DefaultedReadFailed, false),
        }
    }

    pub fn save(
        &self,
        mut state: ApplicationStateV1,
        available_monitor_ids: &[String],
    ) -> Result<ApplicationStateV1, String> {
        if state.schema_version != APPLICATION_STATE_SCHEMA_VERSION {
            return Err("application-state-schema-version-mismatch".to_string());
        }
        match self.read_state() {
            Ok(ReadState::Absent | ReadState::Loaded(_)) => {}
            Ok(ReadState::Corrupt) => {
                return Err("application-state-corrupt-write-blocked".to_string())
            }
            Ok(ReadState::Future(_)) => {
                return Err("application-state-future-version-write-blocked".to_string())
            }
            Err(error) => {
                return Err(format!(
                    "application-state-read-before-write-failed: {}",
                    error.kind()
                ))
            }
        }
        normalize_state(&mut state, available_monitor_ids);
        self.atomic_write(&state)
            .map_err(|error| format!("application-state-write-failed: {}", error.kind()))?;
        Ok(state)
    }

    pub fn reset(&self) -> Result<ApplicationStateV1, String> {
        let state = ApplicationStateV1::default();
        self.atomic_write(&state)
            .map_err(|error| format!("application-state-reset-failed: {}", error.kind()))?;
        Ok(state)
    }

    pub fn clear_component(
        &self,
        component: ApplicationStateComponent,
        available_monitor_ids: &[String],
    ) -> Result<ApplicationStateV1, String> {
        let mut state = match self.read_state() {
            Ok(ReadState::Absent | ReadState::Corrupt) => ApplicationStateV1::default(),
            Ok(ReadState::Loaded(state)) => state,
            Ok(ReadState::Future(_)) => {
                return Err("application-state-future-version-write-blocked".to_string())
            }
            Err(error) => {
                return Err(format!(
                    "application-state-read-before-clear-failed: {}",
                    error.kind()
                ))
            }
        };

        match component {
            ApplicationStateComponent::Settings => {
                state.settings = ApplicationSettingsV1::default()
            }
            ApplicationStateComponent::Onboarding => {
                state.onboarding = OnboardingStateV1::default()
            }
            ApplicationStateComponent::Favorites => state.favorites = FavoritesStateV1::default(),
            ApplicationStateComponent::WindowState => state.window_state = WindowStateV1::default(),
            ApplicationStateComponent::SafeSession => {
                state.safe_session = SafeSessionStateV1::default()
            }
            ApplicationStateComponent::DiagnosticPreferences => {
                state.diagnostic_preferences = DiagnosticPreferencesV1::default()
            }
        }

        normalize_state(&mut state, available_monitor_ids);
        self.atomic_write(&state)
            .map_err(|error| format!("application-state-clear-failed: {}", error.kind()))?;
        Ok(state)
    }

    /// Marks an ordinary host shutdown without replacing unreadable, corrupt, or future state.
    /// A process crash cannot reach this boundary, leaving `recovery_pending` set for next launch.
    pub fn mark_clean_exit(&self) -> Result<(), String> {
        let mut state = match self.read_state() {
            Ok(ReadState::Loaded(state)) => state,
            Ok(ReadState::Absent | ReadState::Corrupt | ReadState::Future(_)) => return Ok(()),
            Err(error) => {
                return Err(format!(
                    "application-state-read-before-clean-exit-failed: {}",
                    error.kind()
                ))
            }
        };
        if !state.safe_session.recovery_pending {
            return Ok(());
        }
        state.safe_session.recovery_pending = false;
        self.atomic_write(&state)
            .map_err(|error| format!("application-state-clean-exit-failed: {}", error.kind()))
    }

    fn read_state(&self) -> io::Result<ReadState> {
        let metadata = match fs::metadata(&self.path) {
            Ok(metadata) => metadata,
            Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(ReadState::Absent),
            Err(error) => return Err(error),
        };
        if metadata.len() > MAX_APPLICATION_STATE_BYTES {
            return Ok(ReadState::Corrupt);
        }

        let bytes = fs::read(&self.path)?;
        let value: serde_json::Value = match serde_json::from_slice(&bytes) {
            Ok(value) => value,
            Err(_) => return Ok(ReadState::Corrupt),
        };
        let Some(version) = value
            .get("schemaVersion")
            .and_then(serde_json::Value::as_u64)
        else {
            return Ok(ReadState::Corrupt);
        };
        let Ok(version) = u32::try_from(version) else {
            return Ok(ReadState::Corrupt);
        };
        if version > APPLICATION_STATE_SCHEMA_VERSION {
            return Ok(ReadState::Future(version));
        }
        if version != APPLICATION_STATE_SCHEMA_VERSION {
            return Ok(ReadState::Corrupt);
        }

        match serde_json::from_value(value) {
            Ok(state) => Ok(ReadState::Loaded(state)),
            Err(_) => Ok(ReadState::Corrupt),
        }
    }

    fn atomic_write(&self, state: &ApplicationStateV1) -> io::Result<()> {
        self.atomic_write_before_replace(state, || Ok(()))
    }

    fn atomic_write_before_replace(
        &self,
        state: &ApplicationStateV1,
        before_replace: impl FnOnce() -> io::Result<()>,
    ) -> io::Result<()> {
        let bytes = serde_json::to_vec_pretty(state).map_err(io::Error::other)?;
        if bytes.len() as u64 > MAX_APPLICATION_STATE_BYTES {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "application state exceeds the bounded file size",
            ));
        }

        let parent = self.path.parent().ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                "application state path has no parent",
            )
        })?;
        fs::create_dir_all(parent)?;
        let temporary_path = temporary_path_for(&self.path);
        let write_result = (|| {
            let mut temporary = OpenOptions::new()
                .create_new(true)
                .write(true)
                .open(&temporary_path)?;
            temporary.write_all(&bytes)?;
            temporary.write_all(b"\n")?;
            temporary.sync_all()?;
            drop(temporary);
            before_replace()?;
            fs::rename(&temporary_path, &self.path)?;
            sync_directory(parent)
        })();

        if write_result.is_err() {
            let _ = fs::remove_file(&temporary_path);
        }
        write_result
    }
}

fn default_load_result(
    status: ApplicationStateLoadStatus,
    write_allowed: bool,
) -> ApplicationStateLoadResult {
    ApplicationStateLoadResult {
        state: ApplicationStateV1::default(),
        status,
        write_allowed,
        future_schema_version: None,
        removed_monitor_window_state: false,
    }
}

fn normalize_state(state: &mut ApplicationStateV1, available_monitor_ids: &[String]) -> bool {
    state.schema_version = APPLICATION_STATE_SCHEMA_VERSION;
    state.settings.display_scale_percent = state.settings.display_scale_percent.clamp(50, 200);
    state.settings.timeline_retention = state.settings.timeline_retention.min(1_000);
    state.diagnostic_preferences.timeout_ms = state
        .diagnostic_preferences
        .timeout_ms
        .clamp(1_000, 120_000);
    state.diagnostic_preferences.retry_limit = state.diagnostic_preferences.retry_limit.min(5);
    state.diagnostic_preferences.max_response_bytes = state
        .diagnostic_preferences
        .max_response_bytes
        .clamp(1_024, 5_242_880);
    state.favorites.entries.truncate(1_000);
    state
        .favorites
        .entries
        .retain_mut(sanitize_persisted_favorite);

    if state
        .safe_session
        .session
        .as_ref()
        .is_some_and(|safe_session| !safe_session_is_valid(safe_session))
    {
        state.safe_session = SafeSessionStateV1::default();
    }
    if state.safe_session.session.is_none() {
        state.safe_session.recovery_pending = false;
    }

    let available: HashSet<&str> = available_monitor_ids.iter().map(String::as_str).collect();
    let removed_monitor = state
        .window_state
        .bounds
        .as_ref()
        .is_some_and(|bounds| !available.contains(bounds.monitor_id.as_str()));
    if removed_monitor {
        state.window_state = WindowStateV1::default();
    }
    removed_monitor
}

fn safe_session_is_valid(session: &SafeSessionV1) -> bool {
    match session {
        SafeSessionV1::LocalExample {
            example_id,
            fragment,
        } => {
            let example_valid = !example_id.is_empty()
                && example_id.len() <= MAX_SAFE_SESSION_EXAMPLE_ID_BYTES
                && example_id.chars().all(|character| {
                    character.is_ascii_alphanumeric() || ".-_".contains(character)
                });
            let fragment_valid = fragment.as_ref().is_none_or(|value| {
                value.len() <= MAX_SAFE_SESSION_FRAGMENT_BYTES
                    && value.starts_with('#')
                    && !value.chars().any(|character| character.is_ascii_control())
            });
            example_valid && fragment_valid
        }
        SafeSessionV1::NetworkGet { url } => safe_network_get_url(url),
    }
}

fn safe_network_get_url(value: &str) -> bool {
    if value.len() > MAX_SAFE_SESSION_URL_BYTES {
        return false;
    }
    let Ok(url) = Url::parse(value) else {
        return false;
    };
    if !APPLICATION_STATE_ALLOWED_NETWORK_SCHEMES.contains(&url.scheme())
        || !url.username().is_empty()
        || url.password().is_some()
        || url.host_str().is_none()
    {
        return false;
    }
    !url.query_pairs()
        .any(|(key, _)| is_sensitive_query_key(&key))
}

fn sanitize_persisted_favorite(favorite: &mut PersistedFavoriteV1) -> bool {
    match &mut favorite.target {
        PersistedFavoriteTargetV1::Network { url, canonical_url } => {
            let Some(sanitized) = sanitized_network_url(url) else {
                return false;
            };
            *url = sanitized.clone();
            *canonical_url = sanitized;
            true
        }
        PersistedFavoriteTargetV1::LocalExample {
            example_id,
            fragment,
        } => safe_session_is_valid(&SafeSessionV1::LocalExample {
            example_id: example_id.clone(),
            fragment: fragment.clone(),
        }),
    }
}

fn sanitized_network_url(value: &str) -> Option<String> {
    let mut url = Url::parse(value).ok()?;
    if !APPLICATION_STATE_ALLOWED_NETWORK_SCHEMES.contains(&url.scheme())
        || url.host_str().is_none()
    {
        return None;
    }
    url.set_username("").ok()?;
    url.set_password(None).ok()?;
    let retained_query: Vec<(String, String)> = url
        .query_pairs()
        .filter(|(key, _)| !is_sensitive_query_key(key))
        .map(|(key, value)| (key.into_owned(), value.into_owned()))
        .collect();
    if url.query().is_some() {
        url.set_query(None);
        if !retained_query.is_empty() {
            url.query_pairs_mut().extend_pairs(retained_query);
        }
    }
    Some(url.to_string())
}

fn is_sensitive_query_key(key: &str) -> bool {
    let key = key.to_ascii_lowercase();
    APPLICATION_STATE_SENSITIVE_QUERY_KEYS.contains(&key.as_str())
}

fn temporary_path_for(path: &Path) -> PathBuf {
    static NEXT_TEMPORARY_ID: AtomicU64 = AtomicU64::new(1);
    let id = NEXT_TEMPORARY_ID.fetch_add(1, Ordering::Relaxed);
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(APPLICATION_STATE_FILE_NAME);
    path.with_file_name(format!(".{file_name}.{}.{id}.tmp", std::process::id()))
}

#[cfg(unix)]
fn sync_directory(path: &Path) -> io::Result<()> {
    File::open(path)?.sync_all()
}

#[cfg(not(unix))]
fn sync_directory(_path: &Path) -> io::Result<()> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct TestDirectory(PathBuf);

    impl TestDirectory {
        fn new(name: &str) -> Self {
            let suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("test clock should be after the Unix epoch")
                .as_nanos();
            let path = std::env::temp_dir().join(format!(
                "waves-app-state-{name}-{}-{suffix}",
                std::process::id()
            ));
            fs::create_dir_all(&path).expect("test app-data directory should be created");
            Self(path)
        }
    }

    impl Drop for TestDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn monitors() -> Vec<String> {
        vec!["primary".to_string(), "secondary".to_string()]
    }

    fn state_with_changes() -> ApplicationStateV1 {
        let mut state = ApplicationStateV1::default();
        state.settings.display_scale_percent = 125;
        state.onboarding.show_welcome_on_launch = false;
        state.safe_session = SafeSessionStateV1 {
            recovery_pending: true,
            session: Some(SafeSessionV1::LocalExample {
                example_id: "yourFirstDeck".to_string(),
                fragment: Some("#next".to_string()),
            }),
        };
        state.window_state.bounds = Some(WindowBoundsV1 {
            monitor_id: "secondary".to_string(),
            x: 40,
            y: 60,
            width: 900,
            height: 700,
        });
        state.favorites.entries.push(PersistedFavoriteV1 {
            id: "favorite-1".to_string(),
            title: "First deck".to_string(),
            target: PersistedFavoriteTargetV1::LocalExample {
                example_id: "yourFirstDeck".to_string(),
                fragment: Some("#next".to_string()),
            },
            created_at: "2026-07-30T00:00:00Z".to_string(),
            updated_at: "2026-07-30T00:00:00Z".to_string(),
            profile_id: None,
        });
        state.diagnostic_preferences.timeout_ms = 20_000;
        state
    }

    #[test]
    fn clean_install_defaults_without_creating_a_file() {
        let directory = TestDirectory::new("clean");
        let backend = AtomicApplicationStateBackend::new(&directory.0);

        let result = backend.load(&monitors());

        assert_eq!(result.status, ApplicationStateLoadStatus::DefaultedAbsent);
        assert_eq!(result.state, ApplicationStateV1::default());
        assert!(result.write_allowed);
        assert!(!backend.path().exists());
    }

    #[test]
    fn v1_state_survives_restart() {
        let directory = TestDirectory::new("restart");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        let expected = backend
            .save(state_with_changes(), &monitors())
            .expect("state should save");

        let restarted = AtomicApplicationStateBackend::new(&directory.0).load(&monitors());

        assert_eq!(restarted.status, ApplicationStateLoadStatus::Loaded);
        assert_eq!(restarted.state, expected);
    }

    #[test]
    fn corrupt_and_future_versions_default_safely() {
        let directory = TestDirectory::new("versions");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        fs::write(backend.path(), b"not-json").expect("corrupt fixture should write");
        let corrupt = backend.load(&monitors());
        assert_eq!(corrupt.status, ApplicationStateLoadStatus::DefaultedCorrupt);
        assert!(!corrupt.write_allowed);
        assert_eq!(
            backend.save(ApplicationStateV1::default(), &monitors()),
            Err("application-state-corrupt-write-blocked".to_string())
        );

        fs::write(backend.path(), br#"{"schemaVersion":99,"future":true}"#)
            .expect("future fixture should write");
        let future = backend.load(&monitors());
        assert_eq!(
            future.status,
            ApplicationStateLoadStatus::DefaultedFutureVersion
        );
        assert_eq!(future.future_schema_version, Some(99));
        assert!(!future.write_allowed);
        assert_eq!(
            backend.save(ApplicationStateV1::default(), &monitors()),
            Err("application-state-future-version-write-blocked".to_string())
        );
        let reset = backend
            .reset()
            .expect("explicit reset should replace future state");
        assert_eq!(backend.load(&monitors()).state, reset);
    }

    #[test]
    fn interrupted_temporary_write_never_replaces_committed_state() {
        let directory = TestDirectory::new("interrupted");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        let expected = backend
            .save(state_with_changes(), &monitors())
            .expect("state should save");
        fs::write(
            directory
                .0
                .join(".application-state-v1.json.interrupted.tmp"),
            b"partial",
        )
        .expect("interrupted fixture should write");

        assert_eq!(backend.load(&monitors()).state, expected);
    }

    #[test]
    fn failed_replace_preserves_the_last_committed_state_atomically() {
        let directory = TestDirectory::new("failed-replace");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        let expected = backend
            .save(state_with_changes(), &monitors())
            .expect("initial state should save");
        let mut replacement = expected.clone();
        replacement.settings.display_scale_percent = 150;

        let error = backend
            .atomic_write_before_replace(&replacement, || {
                Err(io::Error::other("injected-before-replace-failure"))
            })
            .expect_err("injected failure should abort replacement");

        assert_eq!(error.kind(), io::ErrorKind::Other);
        assert_eq!(backend.load(&monitors()).state, expected);
        assert_eq!(
            fs::read_dir(&directory.0)
                .expect("state directory should remain readable")
                .filter_map(Result::ok)
                .filter(|entry| entry.file_name().to_string_lossy().ends_with(".tmp"))
                .count(),
            0
        );
    }

    #[test]
    fn removed_monitor_clears_only_window_state() {
        let directory = TestDirectory::new("monitor");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        backend
            .save(state_with_changes(), &monitors())
            .expect("state should save");

        let result = backend.load(&["primary".to_string()]);

        assert!(result.removed_monitor_window_state);
        assert_eq!(result.state.window_state, WindowStateV1::default());
        assert_eq!(result.state.settings.display_scale_percent, 125);
        assert!(!result.state.onboarding.show_welcome_on_launch);
    }

    #[test]
    fn repeated_write_restart_cycles_are_deterministic() {
        let directory = TestDirectory::new("cycles");
        let mut expected = ApplicationStateV1::default();

        for cycle in 0..10 {
            expected.settings.display_scale_percent = 100 + cycle;
            let backend = AtomicApplicationStateBackend::new(&directory.0);
            expected = backend
                .save(expected, &monitors())
                .expect("cycle should save");
            let restarted = AtomicApplicationStateBackend::new(&directory.0).load(&monitors());
            assert_eq!(restarted.state, expected, "restart cycle {cycle}");
        }
    }

    #[test]
    fn unsafe_safe_sessions_are_removed_before_persistence() {
        let directory = TestDirectory::new("safe-session");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        for url in [
            "https://user:password@example.test/deck.wml",
            "https://example.test/deck.wml?token=secret",
            "file:///tmp/deck.wml",
        ] {
            let state = ApplicationStateV1 {
                safe_session: SafeSessionStateV1 {
                    recovery_pending: true,
                    session: Some(SafeSessionV1::NetworkGet {
                        url: url.to_string(),
                    }),
                },
                ..ApplicationStateV1::default()
            };
            let saved = backend.save(state, &monitors()).expect("state should save");
            assert_eq!(saved.safe_session, SafeSessionStateV1::default());
        }
    }

    #[test]
    fn safe_session_bounds_remove_oversized_recovery_material() {
        let directory = TestDirectory::new("safe-session-bounds");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        for session in [
            SafeSessionV1::NetworkGet {
                url: format!(
                    "https://example.test/{}",
                    "a".repeat(MAX_SAFE_SESSION_URL_BYTES)
                ),
            },
            SafeSessionV1::LocalExample {
                example_id: "a".repeat(MAX_SAFE_SESSION_EXAMPLE_ID_BYTES + 1),
                fragment: None,
            },
            SafeSessionV1::LocalExample {
                example_id: "basic".to_string(),
                fragment: Some(format!("#{}", "a".repeat(MAX_SAFE_SESSION_FRAGMENT_BYTES))),
            },
        ] {
            let state = ApplicationStateV1 {
                safe_session: SafeSessionStateV1 {
                    recovery_pending: true,
                    session: Some(session),
                },
                ..ApplicationStateV1::default()
            };
            let saved = backend.save(state, &monitors()).expect("state should save");
            assert_eq!(saved.safe_session, SafeSessionStateV1::default());
        }
    }

    #[test]
    fn clean_exit_clears_only_the_crash_marker_and_survives_restart() {
        let directory = TestDirectory::new("clean-exit");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        let expected = backend
            .save(state_with_changes(), &monitors())
            .expect("running state should save");
        assert!(expected.safe_session.recovery_pending);

        backend
            .mark_clean_exit()
            .expect("ordinary shutdown should clear the marker");
        let restarted = backend.load(&monitors()).state;

        assert!(!restarted.safe_session.recovery_pending);
        assert_eq!(
            restarted.safe_session.session,
            expected.safe_session.session
        );
        assert_eq!(restarted.settings, expected.settings);
        assert_eq!(restarted.favorites, expected.favorites);
    }

    #[test]
    fn favorite_urls_are_sanitized_before_persistence() {
        let directory = TestDirectory::new("favorite-sanitization");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        let mut state = ApplicationStateV1::default();
        state.favorites.entries.push(PersistedFavoriteV1 {
            id: "favorite-1".to_string(),
            title: "Safe favorite".to_string(),
            target: PersistedFavoriteTargetV1::Network {
                url: "https://user:password@example.test/deck.wml?view=compact&token=canary#card"
                    .to_string(),
                canonical_url:
                    "https://user:password@example.test/deck.wml?view=compact&token=canary#card"
                        .to_string(),
            },
            created_at: "2026-07-30T00:00:00Z".to_string(),
            updated_at: "2026-07-30T00:00:00Z".to_string(),
            profile_id: None,
        });

        let saved = backend.save(state, &monitors()).expect("state should save");
        let serialized = serde_json::to_string(&saved).expect("state should serialize");

        assert!(serialized.contains("view=compact"));
        assert!(serialized.contains("#card"));
        assert!(!serialized.contains("user"));
        assert!(!serialized.contains("password"));
        assert!(!serialized.contains("canary"));
        assert!(!serialized.contains("token"));
    }

    #[test]
    fn unknown_live_session_fields_make_a_state_file_corrupt() {
        let directory = TestDirectory::new("allowlist");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        let mut value = serde_json::to_value(ApplicationStateV1::default())
            .expect("default state should serialize");
        value
            .as_object_mut()
            .expect("state should be an object")
            .insert(
                "history".to_string(),
                serde_json::json!({"headers": {"Authorization": "canary"}}),
            );
        fs::write(
            backend.path(),
            serde_json::to_vec(&value).expect("fixture should serialize"),
        )
        .expect("fixture should write");

        assert_eq!(
            backend.load(&monitors()).status,
            ApplicationStateLoadStatus::DefaultedCorrupt
        );
    }

    #[test]
    fn component_clear_and_reset_are_explicit() {
        let directory = TestDirectory::new("clear-reset");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        backend
            .save(state_with_changes(), &monitors())
            .expect("state should save");

        let cleared = backend
            .clear_component(ApplicationStateComponent::SafeSession, &monitors())
            .expect("component should clear");
        assert_eq!(cleared.safe_session, SafeSessionStateV1::default());
        assert_eq!(cleared.settings.display_scale_percent, 125);

        let reset = backend.reset().expect("state should reset");
        assert_eq!(reset, ApplicationStateV1::default());
        assert_eq!(backend.load(&monitors()).state, reset);
    }

    #[test]
    fn every_component_has_an_independent_clear_operation() {
        let directory = TestDirectory::new("component-clear-matrix");
        let backend = AtomicApplicationStateBackend::new(&directory.0);
        for component in [
            ApplicationStateComponent::Settings,
            ApplicationStateComponent::Onboarding,
            ApplicationStateComponent::Favorites,
            ApplicationStateComponent::WindowState,
            ApplicationStateComponent::SafeSession,
            ApplicationStateComponent::DiagnosticPreferences,
        ] {
            backend
                .reset()
                .expect("state should reset before each clear fixture");
            backend
                .save(state_with_changes(), &monitors())
                .expect("changed state should save");
            let cleared = backend
                .clear_component(component, &monitors())
                .expect("component should clear");
            match component {
                ApplicationStateComponent::Settings => {
                    assert_eq!(cleared.settings, ApplicationSettingsV1::default())
                }
                ApplicationStateComponent::Onboarding => {
                    assert_eq!(cleared.onboarding, OnboardingStateV1::default())
                }
                ApplicationStateComponent::Favorites => {
                    assert_eq!(cleared.favorites, FavoritesStateV1::default())
                }
                ApplicationStateComponent::WindowState => {
                    assert_eq!(cleared.window_state, WindowStateV1::default())
                }
                ApplicationStateComponent::SafeSession => {
                    assert_eq!(cleared.safe_session, SafeSessionStateV1::default())
                }
                ApplicationStateComponent::DiagnosticPreferences => assert_eq!(
                    cleared.diagnostic_preferences,
                    DiagnosticPreferencesV1::default()
                ),
            }
            if component != ApplicationStateComponent::Onboarding {
                assert!(!cleared.onboarding.show_welcome_on_launch);
            }
        }
    }
}
