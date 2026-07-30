//! Authoritative metadata for the browser-owned Tauri command boundary.
//!
//! Keep command wrappers small and explicit in `lib.rs`. This descriptor owns only the IPC
//! inventory and TypeScript-facing names/types; it does not generate command business logic.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TypeSource {
    Primitive,
    ApplicationState,
    Engine,
    Host,
    Transport,
}

impl TypeSource {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Primitive => "primitive",
            Self::ApplicationState => "applicationState",
            Self::Engine => "engine",
            Self::Host => "host",
            Self::Transport => "transport",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct CommandType {
    pub name: &'static str,
    pub source: TypeSource,
}

impl CommandType {
    pub const fn primitive(name: &'static str) -> Self {
        Self {
            name,
            source: TypeSource::Primitive,
        }
    }

    pub const fn engine(name: &'static str) -> Self {
        Self {
            name,
            source: TypeSource::Engine,
        }
    }

    pub const fn application_state(name: &'static str) -> Self {
        Self {
            name,
            source: TypeSource::ApplicationState,
        }
    }

    pub const fn host(name: &'static str) -> Self {
        Self {
            name,
            source: TypeSource::Host,
        }
    }

    pub const fn transport(name: &'static str) -> Self {
        Self {
            name,
            source: TypeSource::Transport,
        }
    }
}

pub const HOST_COMMAND_ERROR_TYPE: CommandType = CommandType::host("HostCommandError");

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct CommandParameter {
    pub name: &'static str,
    pub ty: CommandType,
}

impl CommandParameter {
    pub const fn new(name: &'static str, ty: CommandType) -> Self {
        Self { name, ty }
    }
}

#[derive(Clone, Copy, Debug, Hash, PartialEq, Eq)]
pub enum ClientFacade {
    Engine,
    Transport,
}

impl ClientFacade {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Engine => "engine",
            Self::Transport => "transport",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct FacadeMethod {
    pub facade: ClientFacade,
    pub method: &'static str,
}

impl FacadeMethod {
    pub const fn engine(method: &'static str) -> Self {
        Self {
            facade: ClientFacade::Engine,
            method,
        }
    }

    pub const fn transport(method: &'static str) -> Self {
        Self {
            facade: ClientFacade::Transport,
            method,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TauriCommandDescriptor {
    pub command: &'static str,
    pub client_method: &'static str,
    pub parameter: Option<CommandParameter>,
    pub response: CommandType,
    pub facade_method: Option<FacadeMethod>,
}

macro_rules! with_tauri_commands {
    ($callback:ident) => {
        $callback! {
            health => {
                client: "health",
                parameter: None,
                response: CommandType::primitive("string"),
                facade: None
            };
            application_state_load => {
                client: "applicationStateLoad",
                parameter: None,
                response: CommandType::application_state("ApplicationStateLoadResult"),
                facade: None
            };
            application_state_save => {
                client: "applicationStateSave",
                parameter: Some(CommandParameter::new("request", CommandType::application_state("SaveApplicationStateRequest"))),
                response: CommandType::application_state("ApplicationStateV1"),
                facade: None
            };
            application_state_reset => {
                client: "applicationStateReset",
                parameter: None,
                response: CommandType::application_state("ApplicationStateV1"),
                facade: None
            };
            application_state_clear_component => {
                client: "applicationStateClearComponent",
                parameter: Some(CommandParameter::new("request", CommandType::application_state("ClearApplicationStateComponentRequest"))),
                response: CommandType::application_state("ApplicationStateV1"),
                facade: None
            };
            fetch_deck => {
                client: "fetchDeck",
                parameter: Some(CommandParameter::new("request", CommandType::transport("FetchDeckRequest"))),
                response: CommandType::transport("FetchDeckResponse"),
                facade: Some(FacadeMethod::transport("fetchDeck"))
            };
            cancel_fetch => {
                client: "cancelFetch",
                parameter: Some(CommandParameter::new("requestId", CommandType::primitive("string"))),
                response: CommandType::primitive("boolean"),
                facade: Some(FacadeMethod::transport("cancelFetch"))
            };
            engine_load_deck => {
                client: "engineLoadDeck",
                parameter: Some(CommandParameter::new("request", CommandType::engine("LoadDeckRequest"))),
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("loadDeck"))
            };
            engine_load_deck_context => {
                client: "engineLoadDeckContext",
                parameter: Some(CommandParameter::new("request", CommandType::engine("LoadDeckContextRequest"))),
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("loadDeckContext"))
            };
            engine_load_deck_context_frame => {
                client: "engineLoadDeckContextFrame",
                parameter: Some(CommandParameter::new("request", CommandType::engine("LoadDeckContextRequest"))),
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("loadDeckContextFrame"))
            };
            engine_render => {
                client: "engineRender",
                parameter: None,
                response: CommandType::engine("RenderList"),
                facade: Some(FacadeMethod::engine("render"))
            };
            engine_render_frame => {
                client: "engineRenderFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("renderFrame"))
            };
            engine_handle_key => {
                client: "engineHandleKey",
                parameter: Some(CommandParameter::new("request", CommandType::engine("HandleKeyRequest"))),
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("handleKey"))
            };
            engine_handle_key_frame => {
                client: "engineHandleKeyFrame",
                parameter: Some(CommandParameter::new("request", CommandType::engine("HandleKeyRequest"))),
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("handleKeyFrame"))
            };
            engine_handle_input_frame => {
                client: "engineHandleInputFrame",
                parameter: Some(CommandParameter::new("request", CommandType::engine("HandleInputRequest"))),
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("handleInputFrame"))
            };
            engine_navigate_to_card => {
                client: "engineNavigateToCard",
                parameter: Some(CommandParameter::new("request", CommandType::engine("NavigateToCardRequest"))),
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("navigateToCard"))
            };
            engine_navigate_to_card_frame => {
                client: "engineNavigateToCardFrame",
                parameter: Some(CommandParameter::new("request", CommandType::engine("NavigateToCardRequest"))),
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("navigateToCardFrame"))
            };
            engine_navigate_back => {
                client: "engineNavigateBack",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("navigateBack"))
            };
            engine_navigate_back_frame => {
                client: "engineNavigateBackFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("navigateBackFrame"))
            };
            engine_set_viewport_cols => {
                client: "engineSetViewportCols",
                parameter: Some(CommandParameter::new("request", CommandType::engine("SetViewportColsRequest"))),
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("setViewportCols"))
            };
            engine_advance_time_ms => {
                client: "engineAdvanceTimeMs",
                parameter: Some(CommandParameter::new("request", CommandType::engine("AdvanceTimeRequest"))),
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("advanceTimeMs"))
            };
            engine_advance_time_ms_frame => {
                client: "engineAdvanceTimeMsFrame",
                parameter: Some(CommandParameter::new("request", CommandType::engine("AdvanceTimeRequest"))),
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("advanceTimeMsFrame"))
            };
            engine_snapshot => {
                client: "engineSnapshot",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("snapshot"))
            };
            engine_clear_external_navigation_intent => {
                client: "engineClearExternalNavigationIntent",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("clearExternalNavigationIntent"))
            };
            engine_clear_external_navigation_intent_frame => {
                client: "engineClearExternalNavigationIntentFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("clearExternalNavigationIntentFrame"))
            };
            engine_begin_focused_input_edit => {
                client: "engineBeginFocusedInputEdit",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("beginFocusedInputEdit"))
            };
            engine_begin_focused_input_edit_frame => {
                client: "engineBeginFocusedInputEditFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("beginFocusedInputEditFrame"))
            };
            engine_set_focused_input_edit_draft => {
                client: "engineSetFocusedInputEditDraft",
                parameter: Some(CommandParameter::new("request", CommandType::engine("SetFocusedInputEditDraftRequest"))),
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("setFocusedInputEditDraft"))
            };
            engine_set_focused_input_edit_draft_frame => {
                client: "engineSetFocusedInputEditDraftFrame",
                parameter: Some(CommandParameter::new("request", CommandType::engine("SetFocusedInputEditDraftRequest"))),
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("setFocusedInputEditDraftFrame"))
            };
            engine_commit_focused_input_edit => {
                client: "engineCommitFocusedInputEdit",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("commitFocusedInputEdit"))
            };
            engine_commit_focused_input_edit_frame => {
                client: "engineCommitFocusedInputEditFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("commitFocusedInputEditFrame"))
            };
            engine_cancel_focused_input_edit => {
                client: "engineCancelFocusedInputEdit",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("cancelFocusedInputEdit"))
            };
            engine_cancel_focused_input_edit_frame => {
                client: "engineCancelFocusedInputEditFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("cancelFocusedInputEditFrame"))
            };
            engine_begin_focused_select_edit => {
                client: "engineBeginFocusedSelectEdit",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("beginFocusedSelectEdit"))
            };
            engine_begin_focused_select_edit_frame => {
                client: "engineBeginFocusedSelectEditFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("beginFocusedSelectEditFrame"))
            };
            engine_move_focused_select_edit => {
                client: "engineMoveFocusedSelectEdit",
                parameter: Some(CommandParameter::new("request", CommandType::engine("MoveFocusedSelectEditRequest"))),
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("moveFocusedSelectEdit"))
            };
            engine_move_focused_select_edit_frame => {
                client: "engineMoveFocusedSelectEditFrame",
                parameter: Some(CommandParameter::new("request", CommandType::engine("MoveFocusedSelectEditRequest"))),
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("moveFocusedSelectEditFrame"))
            };
            engine_commit_focused_select_edit => {
                client: "engineCommitFocusedSelectEdit",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("commitFocusedSelectEdit"))
            };
            engine_commit_focused_select_edit_frame => {
                client: "engineCommitFocusedSelectEditFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("commitFocusedSelectEditFrame"))
            };
            engine_cancel_focused_select_edit => {
                client: "engineCancelFocusedSelectEdit",
                parameter: None,
                response: CommandType::engine("EngineRuntimeSnapshot"),
                facade: Some(FacadeMethod::engine("cancelFocusedSelectEdit"))
            };
            engine_cancel_focused_select_edit_frame => {
                client: "engineCancelFocusedSelectEditFrame",
                parameter: None,
                response: CommandType::engine("EngineFrame"),
                facade: Some(FacadeMethod::engine("cancelFocusedSelectEditFrame"))
            };
        }
    };
}

// Required to make the macro_rules! macro path-addressable as
// `crate::command_contract::with_tauri_commands!` from bootstrap.rs; the
// lint can't see that cross-module macro-path usage from this re-export.
#[allow(unused_imports)]
pub(crate) use with_tauri_commands;

macro_rules! define_descriptors {
    ($(
        $command:ident => {
            client: $client:literal,
            parameter: $parameter:expr,
            response: $response:expr,
            facade: $facade:expr
        };
    )*) => {
        pub const TAURI_COMMANDS: &[TauriCommandDescriptor] = &[
            $(TauriCommandDescriptor {
                command: stringify!($command),
                client_method: $client,
                parameter: $parameter,
                response: $response,
                facade_method: $facade,
            },)*
        ];

        pub const TAURI_COMMAND_NAMES: &[&str] = &[$(stringify!($command),)*];
    };
}

with_tauri_commands!(define_descriptors);

pub fn render_host_permission() -> String {
    let mut output = String::from(
        "# AUTO-GENERATED FILE. DO NOT EDIT.\n\
# Generated by: cargo run --bin generate_contracts\n\
# Source: src/command_contract.rs\n\n\
[[permission]]\n\
identifier = \"waves-host-commands\"\n\
description = \"Allows the browser frontend to invoke the complete generated Waves host command contract.\"\n\
commands.allow = [\n",
    );
    for command in TAURI_COMMANDS {
        output.push_str(&format!("  \"{}\",\n", command.command));
    }
    output.push_str("]\n");
    output
}

pub fn render_default_capability() -> String {
    String::from(
        r#"{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "AUTO-GENERATED by cargo run --bin generate_contracts from src/command_contract.rs; grants the main window the generated Waves host command contract.",
  "windows": ["main"],
  "permissions": ["core:default", "waves-host-commands"]
}
"#,
    )
}

pub fn validate_generated_policy(permission: &str, capability: &str) -> Result<(), String> {
    if permission != render_host_permission() {
        return Err("generated host permission is stale or incomplete".to_string());
    }
    if capability != render_default_capability() {
        return Err("generated default capability is stale or incomplete".to_string());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;

    #[test]
    fn command_descriptor_names_are_unique_and_typed() {
        let mut commands = HashSet::new();
        let mut client_methods = HashSet::new();
        let mut facade_methods = HashSet::new();

        for descriptor in TAURI_COMMANDS {
            assert!(commands.insert(descriptor.command));
            assert!(client_methods.insert(descriptor.client_method));
            assert!(!descriptor.response.name.is_empty());
            if let Some(parameter) = descriptor.parameter {
                assert!(!parameter.name.is_empty());
                assert!(!parameter.ty.name.is_empty());
            }
            if let Some(facade) = descriptor.facade_method {
                assert!(facade_methods.insert((facade.facade, facade.method)));
            }
        }
    }

    #[test]
    fn committed_permission_and_capability_match_the_descriptor() {
        validate_generated_policy(
            include_str!("../permissions/waves-host.toml"),
            include_str!("../capabilities/default.json"),
        )
        .expect("generated Tauri permission and capability must match the descriptor");
    }

    #[test]
    fn generated_policy_validation_rejects_an_omitted_command() {
        let stale_permission = render_host_permission().replace("  \"engine_snapshot\",\n", "");
        let error = validate_generated_policy(&stale_permission, &render_default_capability())
            .expect_err("omitting one command must fail policy validation");

        assert_eq!(error, "generated host permission is stale or incomplete");
    }
}
