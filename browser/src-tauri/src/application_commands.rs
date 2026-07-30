//! Canonical browser-owned application command metadata.
//!
//! This registry is the single cross-language source of truth for stable command IDs, labels,
//! native menu groups, default enablement, and platform shortcut mappings. The contract generator
//! projects it into TypeScript for the frontend dispatcher and shortcut reference.

use serde::Serialize;

pub const APPLICATION_COMMAND_EVENT: &str = "waves://application-command";

pub const COMMAND_FOCUS_LOCATION: &str = "app.focus-location";
pub const COMMAND_RELOAD: &str = "app.reload";
pub const COMMAND_ADD_FAVORITE: &str = "app.add-favorite";
pub const COMMAND_LIBRARY: &str = "app.library";
pub const COMMAND_PREFERENCES: &str = "app.preferences";
pub const COMMAND_INSPECTOR: &str = "app.inspector";
pub const COMMAND_HELP: &str = "app.help";
pub const COMMAND_IMPORT_FAVORITES: &str = "app.import-favorites";
pub const COMMAND_EXPORT_FAVORITES: &str = "app.export-favorites";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ApplicationCommandGroup {
    File,
    Favorites,
    View,
    Preferences,
    Help,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NativeMenuPlatform {
    Macos,
    Linux,
}

const MACOS_MENU_GROUPS: &[ApplicationCommandGroup] = &[
    ApplicationCommandGroup::File,
    ApplicationCommandGroup::Favorites,
    ApplicationCommandGroup::View,
    ApplicationCommandGroup::Help,
];
const LINUX_MENU_GROUPS: &[ApplicationCommandGroup] = &[
    ApplicationCommandGroup::File,
    ApplicationCommandGroup::Favorites,
    ApplicationCommandGroup::View,
    ApplicationCommandGroup::Preferences,
    ApplicationCommandGroup::Help,
];

pub const fn native_menu_groups(
    platform: NativeMenuPlatform,
) -> &'static [ApplicationCommandGroup] {
    match platform {
        NativeMenuPlatform::Macos => MACOS_MENU_GROUPS,
        NativeMenuPlatform::Linux => LINUX_MENU_GROUPS,
    }
}

impl ApplicationCommandGroup {
    pub const fn label(self) -> &'static str {
        match self {
            Self::File => "File",
            Self::Favorites => "Favorites",
            Self::View => "View",
            Self::Preferences => "Preferences",
            Self::Help => "Help",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ShortcutModifier {
    Alt,
    Control,
    Meta,
    Shift,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationShortcut {
    pub key: &'static str,
    pub modifiers: &'static [ShortcutModifier],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformShortcuts {
    pub macos: Option<ApplicationShortcut>,
    pub linux: Option<ApplicationShortcut>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationCommandDescriptor {
    pub id: &'static str,
    pub label: &'static str,
    pub group: ApplicationCommandGroup,
    pub default_enabled: bool,
    pub shortcuts: PlatformShortcuts,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ApplicationCommandEnablement<'a> {
    pub id: &'a str,
    pub enabled: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProjectedApplicationCommand {
    pub command: &'static ApplicationCommandDescriptor,
    pub enabled: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeApplicationCommandRequest {
    pub command_id: &'static str,
    pub source: &'static str,
}

const META: &[ShortcutModifier] = &[ShortcutModifier::Meta];
const META_ALT: &[ShortcutModifier] = &[ShortcutModifier::Meta, ShortcutModifier::Alt];
const META_SHIFT: &[ShortcutModifier] = &[ShortcutModifier::Meta, ShortcutModifier::Shift];
const CONTROL: &[ShortcutModifier] = &[ShortcutModifier::Control];
const CONTROL_SHIFT: &[ShortcutModifier] = &[ShortcutModifier::Control, ShortcutModifier::Shift];
const NO_MODIFIERS: &[ShortcutModifier] = &[];

const fn shortcut(
    key: &'static str,
    modifiers: &'static [ShortcutModifier],
) -> ApplicationShortcut {
    ApplicationShortcut { key, modifiers }
}

const fn platform_shortcuts(
    macos: Option<ApplicationShortcut>,
    linux: Option<ApplicationShortcut>,
) -> PlatformShortcuts {
    PlatformShortcuts { macos, linux }
}

pub const APPLICATION_COMMANDS: &[ApplicationCommandDescriptor] = &[
    ApplicationCommandDescriptor {
        id: COMMAND_FOCUS_LOCATION,
        label: "Focus Location",
        group: ApplicationCommandGroup::View,
        default_enabled: true,
        shortcuts: platform_shortcuts(Some(shortcut("l", META)), Some(shortcut("l", CONTROL))),
    },
    ApplicationCommandDescriptor {
        id: COMMAND_RELOAD,
        label: "Reload",
        group: ApplicationCommandGroup::View,
        default_enabled: true,
        shortcuts: platform_shortcuts(Some(shortcut("r", META)), Some(shortcut("r", CONTROL))),
    },
    ApplicationCommandDescriptor {
        id: COMMAND_ADD_FAVORITE,
        label: "Add Favorite",
        group: ApplicationCommandGroup::Favorites,
        default_enabled: false,
        shortcuts: platform_shortcuts(Some(shortcut("d", META)), Some(shortcut("d", CONTROL))),
    },
    ApplicationCommandDescriptor {
        id: COMMAND_LIBRARY,
        label: "Library",
        group: ApplicationCommandGroup::File,
        default_enabled: false,
        shortcuts: platform_shortcuts(
            Some(shortcut("b", META_SHIFT)),
            Some(shortcut("b", CONTROL_SHIFT)),
        ),
    },
    ApplicationCommandDescriptor {
        id: COMMAND_PREFERENCES,
        label: "Preferences…",
        group: ApplicationCommandGroup::Preferences,
        default_enabled: false,
        shortcuts: platform_shortcuts(Some(shortcut(",", META)), Some(shortcut(",", CONTROL))),
    },
    ApplicationCommandDescriptor {
        id: COMMAND_INSPECTOR,
        label: "Inspector",
        group: ApplicationCommandGroup::View,
        default_enabled: true,
        shortcuts: platform_shortcuts(
            Some(shortcut("i", META_ALT)),
            Some(shortcut("i", CONTROL_SHIFT)),
        ),
    },
    ApplicationCommandDescriptor {
        id: COMMAND_HELP,
        label: "Waves Help",
        group: ApplicationCommandGroup::Help,
        default_enabled: true,
        shortcuts: platform_shortcuts(
            Some(shortcut("/", META_SHIFT)),
            Some(shortcut("F1", NO_MODIFIERS)),
        ),
    },
    ApplicationCommandDescriptor {
        id: COMMAND_IMPORT_FAVORITES,
        label: "Import Favorites…",
        group: ApplicationCommandGroup::File,
        default_enabled: false,
        shortcuts: platform_shortcuts(None, None),
    },
    ApplicationCommandDescriptor {
        id: COMMAND_EXPORT_FAVORITES,
        label: "Export Favorites…",
        group: ApplicationCommandGroup::File,
        default_enabled: false,
        shortcuts: platform_shortcuts(None, None),
    },
];

pub fn command_by_id(id: &str) -> Option<&'static ApplicationCommandDescriptor> {
    APPLICATION_COMMANDS.iter().find(|command| command.id == id)
}

pub fn project_application_commands<'a>(
    overrides: &'a [ApplicationCommandEnablement<'a>],
) -> impl Iterator<Item = ProjectedApplicationCommand> + 'a {
    APPLICATION_COMMANDS.iter().map(|command| {
        let enabled = overrides
            .iter()
            .rev()
            .find(|override_value| override_value.id == command.id)
            .map_or(command.default_enabled, |override_value| {
                override_value.enabled
            });
        ProjectedApplicationCommand { command, enabled }
    })
}

pub fn projected_command_by_id(
    id: &str,
    overrides: &[ApplicationCommandEnablement<'_>],
) -> Option<ProjectedApplicationCommand> {
    project_application_commands(overrides).find(|projected| projected.command.id == id)
}

pub fn enabled_command_by_id(id: &str) -> Option<&'static ApplicationCommandDescriptor> {
    projected_command_by_id(id, &[]).and_then(|projected| {
        if projected.enabled {
            Some(projected.command)
        } else {
            None
        }
    })
}

pub fn native_menu_request(id: &str) -> Option<NativeApplicationCommandRequest> {
    enabled_command_by_id(id).map(|command| NativeApplicationCommandRequest {
        command_id: command.id,
        source: "native-menu",
    })
}

pub fn commands_in_group(
    group: ApplicationCommandGroup,
) -> impl Iterator<Item = &'static ApplicationCommandDescriptor> {
    APPLICATION_COMMANDS
        .iter()
        .filter(move |command| command.group == group)
}

pub fn render_typescript_registry() -> Result<String, serde_json::Error> {
    let registry = serde_json::to_string_pretty(APPLICATION_COMMANDS)?;
    let event_name = serde_json::to_string(APPLICATION_COMMAND_EVENT)?;
    Ok(format!(
        "// AUTO-GENERATED FILE. DO NOT EDIT.\n\
// Generated by: cargo run --bin generate_contracts\n\
// Source: browser/src-tauri/src/application_commands.rs\n\n\
export const APPLICATION_COMMANDS = {registry} as const;\n\n\
export const APPLICATION_COMMAND_EVENT = {event_name} as const;\n\n\
export type ApplicationCommand = (typeof APPLICATION_COMMANDS)[number];\n\
export type ApplicationCommandId = ApplicationCommand['id'];\n\
export type ApplicationCommandGroup = ApplicationCommand['group'];\n\
export type ApplicationCommandPlatform = keyof ApplicationCommand['shortcuts'];\n\
export type ApplicationShortcut = NonNullable<ApplicationCommand['shortcuts'][ApplicationCommandPlatform]>;\n\n\
export interface NativeApplicationCommandRequest {{\n\
  commandId: ApplicationCommandId;\n\
  source: 'native-menu';\n\
}}\n"
    ))
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;

    #[test]
    fn registry_has_unique_stable_ids_and_requested_commands() {
        let ids = APPLICATION_COMMANDS
            .iter()
            .map(|command| command.id)
            .collect::<HashSet<_>>();

        assert_eq!(ids.len(), APPLICATION_COMMANDS.len());
        for expected in [
            COMMAND_FOCUS_LOCATION,
            COMMAND_RELOAD,
            COMMAND_ADD_FAVORITE,
            COMMAND_LIBRARY,
            COMMAND_PREFERENCES,
            COMMAND_INSPECTOR,
            COMMAND_HELP,
            COMMAND_IMPORT_FAVORITES,
            COMMAND_EXPORT_FAVORITES,
        ] {
            assert!(ids.contains(expected), "missing command {expected}");
        }
    }

    #[test]
    fn unavailable_application_surfaces_are_disabled() {
        for id in [
            COMMAND_ADD_FAVORITE,
            COMMAND_LIBRARY,
            COMMAND_PREFERENCES,
            COMMAND_IMPORT_FAVORITES,
            COMMAND_EXPORT_FAVORITES,
        ] {
            assert!(
                !command_by_id(id)
                    .expect("registered command")
                    .default_enabled
            );
        }
    }

    #[test]
    fn native_dispatch_rejects_disabled_and_unknown_commands() {
        assert_eq!(
            native_menu_request(COMMAND_RELOAD),
            Some(NativeApplicationCommandRequest {
                command_id: COMMAND_RELOAD,
                source: "native-menu",
            })
        );
        assert!(native_menu_request(COMMAND_LIBRARY).is_none());
        assert!(native_menu_request("app.unknown").is_none());
    }

    #[test]
    fn enablement_projection_applies_explicit_overrides_without_mutating_the_registry() {
        let overrides = [
            ApplicationCommandEnablement {
                id: COMMAND_RELOAD,
                enabled: false,
            },
            ApplicationCommandEnablement {
                id: COMMAND_LIBRARY,
                enabled: true,
            },
        ];
        assert!(
            !projected_command_by_id(COMMAND_RELOAD, &overrides)
                .expect("reload projection")
                .enabled
        );
        assert!(
            projected_command_by_id(COMMAND_LIBRARY, &overrides)
                .expect("library projection")
                .enabled
        );
        assert!(
            command_by_id(COMMAND_RELOAD)
                .expect("reload descriptor")
                .default_enabled
        );
        assert!(
            !command_by_id(COMMAND_LIBRARY)
                .expect("library descriptor")
                .default_enabled
        );
    }

    #[test]
    fn macos_and_linux_shortcuts_follow_platform_conventions() {
        let focus = command_by_id(COMMAND_FOCUS_LOCATION).expect("focus command");
        assert_eq!(focus.shortcuts.macos, Some(shortcut("l", META)));
        assert_eq!(focus.shortcuts.linux, Some(shortcut("l", CONTROL)));

        let inspector = command_by_id(COMMAND_INSPECTOR).expect("inspector command");
        assert_eq!(inspector.shortcuts.macos, Some(shortcut("i", META_ALT)));
        assert_eq!(
            inspector.shortcuts.linux,
            Some(shortcut("i", CONTROL_SHIFT))
        );

        let help = command_by_id(COMMAND_HELP).expect("help command");
        assert_eq!(help.shortcuts.linux, Some(shortcut("F1", NO_MODIFIERS)));
    }

    #[test]
    fn native_platform_menu_projection_keeps_linux_file_and_preferences_visible() {
        let linux = native_menu_groups(NativeMenuPlatform::Linux);
        assert!(linux.contains(&ApplicationCommandGroup::File));
        assert!(linux.contains(&ApplicationCommandGroup::Preferences));

        let macos = native_menu_groups(NativeMenuPlatform::Macos);
        assert!(macos.contains(&ApplicationCommandGroup::File));
        assert!(!macos.contains(&ApplicationCommandGroup::Preferences));
        assert!(commands_in_group(ApplicationCommandGroup::Preferences)
            .any(|command| command.id == COMMAND_PREFERENCES));
    }

    #[test]
    fn generated_typescript_is_derived_from_the_registry() {
        let output = render_typescript_registry().expect("registry renders");
        for command in APPLICATION_COMMANDS {
            assert!(output.contains(command.id));
            assert!(output.contains(command.label));
        }
        assert!(output.contains("export type ApplicationCommandId"));
        assert!(output.contains(APPLICATION_COMMAND_EVENT));
        assert!(output.contains("interface NativeApplicationCommandRequest"));
    }
}
