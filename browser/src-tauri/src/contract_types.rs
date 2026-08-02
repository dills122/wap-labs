use serde::{Deserialize, Serialize};
use ts_rs::TS;
use wavenav_engine as engine;

pub use engine::{
    EngineAffordance, EngineAffordanceSource, EngineCardDisplayMetadata, EngineControlAssociation,
    EngineDebugBufferSnapshot, EngineDebugCapabilities, EngineDebugCloseSessionOutcome,
    EngineDebugCloseSessionRequest, EngineDebugCloseSessionResult, EngineDebugCollectionSummary,
    EngineDebugError, EngineDebugErrorCode, EngineDebugEvent, EngineDebugEventBatch,
    EngineDebugEventKind, EngineDebugEventPayload, EngineDebugExternalNavigationSnapshot,
    EngineDebugMaskingPolicy, EngineDebugNamedValue, EngineDebugOpenSessionOutcome,
    EngineDebugOpenSessionRequest, EngineDebugPollEventsOutcome, EngineDebugPollEventsRequest,
    EngineDebugPostfieldResolution, EngineDebugPostfieldResolutionSource,
    EngineDebugRedactionReason, EngineDebugSession, EngineDebugSnapshot,
    EngineDebugSnapshotOutcome, EngineDebugSnapshotRequest, EngineDebugTimerSnapshot,
    EngineDebugTimestampKind, EngineDebugValue, EngineDeckDisplayMetadata, EngineFocusState,
    EngineFocusTargetKind, EngineFrameRow, EngineFrameSegment, EngineHitRegion, EngineInputEvent,
    EngineInputKey, EnginePresentationFrame, EngineRenderError, EngineRenderResource,
    EngineSelectionState, EngineViewport, EngineViewportError,
};

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct LoadDeckRequest {
    pub wml_xml: String,
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct LoadDeckContextRequest {
    pub wml_xml: String,
    pub base_url: String,
    pub content_type: String,
    #[serde(default)]
    #[ts(optional)]
    pub raw_bytes_base64: Option<String>,
    #[serde(default)]
    #[ts(optional)]
    pub referring_url: Option<String>,
    #[serde(default)]
    #[ts(optional)]
    pub navigation_url: Option<String>,
    #[serde(default)]
    #[ts(optional)]
    pub navigation_kind: Option<DeckNavigationKind>,
}

impl LoadDeckContextRequest {
    pub fn validate_host_ingress(&self) -> Result<(), crate::host_contract::HostCommandError> {
        crate::host_contract::validate_context_url(&self.base_url, "Deck base URL")?;
        crate::host_contract::validate_content_type(&self.content_type)?;
        if let Some(referring_url) = self.referring_url.as_deref() {
            crate::host_contract::validate_context_url(referring_url, "Referring URL")?;
        }
        if let Some(navigation_url) = self.navigation_url.as_deref() {
            crate::host_contract::validate_context_url(navigation_url, "Navigation URL")?;
        }
        Ok(())
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
pub enum DeckNavigationKind {
    #[default]
    Independent,
    Forward,
    Backward,
    Reload,
}

impl From<DeckNavigationKind> for engine::DeckNavigationKind {
    fn from(value: DeckNavigationKind) -> Self {
        match value {
            DeckNavigationKind::Independent => Self::Independent,
            DeckNavigationKind::Forward => Self::Forward,
            DeckNavigationKind::Backward => Self::Backward,
            DeckNavigationKind::Reload => Self::Reload,
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum EngineKey {
    Up,
    Down,
    Enter,
}

impl EngineKey {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Up => "up",
            Self::Down => "down",
            Self::Enter => "enter",
        }
    }
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct HandleKeyRequest {
    pub key: EngineKey,
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct HandleInputRequest {
    pub event: EngineInputEvent,
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct NavigateToCardRequest {
    pub card_id: String,
}

impl NavigateToCardRequest {
    pub fn validate_host_ingress(&self) -> Result<(), crate::host_contract::HostCommandError> {
        crate::host_contract::validate_card_id(&self.card_id)
    }
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct SetViewportColsRequest {
    pub cols: usize,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, TS)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum EngineCommandError {
    InvalidViewport {
        #[serde(rename = "requestedCols")]
        requested_cols: String,
        #[serde(rename = "minCols")]
        min_cols: u32,
        #[serde(rename = "maxCols")]
        max_cols: u32,
        message: String,
    },
    EngineStateUnavailable {
        message: String,
    },
}

impl From<engine::EngineViewportError> for EngineCommandError {
    fn from(error: engine::EngineViewportError) -> Self {
        match error {
            engine::EngineViewportError::InvalidViewport {
                requested_cols,
                min_cols,
                max_cols,
                message,
            } => Self::InvalidViewport {
                requested_cols,
                min_cols,
                max_cols,
                message,
            },
        }
    }
}

impl From<EngineCommandError> for crate::host_contract::HostCommandError {
    fn from(error: EngineCommandError) -> Self {
        match error {
            EngineCommandError::InvalidViewport { message, .. } => Self::invalid_request(message),
            EngineCommandError::EngineStateUnavailable { .. } => Self::mutex_unavailable(),
        }
    }
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct AdvanceTimeRequest {
    pub delta_ms: u32,
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct SetFocusedInputEditDraftRequest {
    pub value: String,
}

impl SetFocusedInputEditDraftRequest {
    pub fn validate_host_ingress(&self) -> Result<(), crate::host_contract::HostCommandError> {
        crate::host_contract::validate_edit_draft(&self.value)
    }
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct MoveFocusedSelectEditRequest {
    pub delta: i32,
}

#[derive(Clone, Debug, Serialize, TS)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ScriptDialogRequestSnapshot {
    Alert {
        message: String,
    },
    Confirm {
        message: String,
    },
    Prompt {
        message: String,
        #[serde(rename = "defaultValue")]
        #[ts(optional)]
        default_value: Option<String>,
    },
}

#[derive(Clone, Debug, Serialize, TS)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ScriptTimerRequestSnapshot {
    Schedule {
        #[serde(rename = "delayMs")]
        delay_ms: u32,
        #[ts(optional)]
        token: Option<String>,
    },
    Cancel {
        token: String,
    },
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
pub enum ExternalNavigationCacheControlPolicySnapshot {
    Default,
    NoCache,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum ExternalNavigationMethodSnapshot {
    Get,
    Post,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct ExternalNavigationPostFieldSnapshot {
    pub name: String,
    pub value: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct ExternalNavigationRequestIntentSnapshot {
    pub method: ExternalNavigationMethodSnapshot,
    pub enctype: String,
    pub send_referer: bool,
    #[ts(optional)]
    pub accept_charset: Option<String>,
    pub same_deck: bool,
    pub post_fields: Vec<ExternalNavigationPostFieldSnapshot>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct ExternalNavigationPostContextSnapshot {
    #[ts(optional)]
    pub same_deck: Option<bool>,
    #[ts(optional)]
    pub content_type: Option<String>,
    #[ts(optional)]
    pub payload: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct ExternalNavigationRequestPolicySnapshot {
    #[ts(optional)]
    pub cache_control: Option<ExternalNavigationCacheControlPolicySnapshot>,
    #[ts(optional)]
    pub referer_url: Option<String>,
    #[ts(optional)]
    pub post_context: Option<ExternalNavigationPostContextSnapshot>,
    #[ts(optional)]
    pub request_intent: Option<ExternalNavigationRequestIntentSnapshot>,
}

#[derive(Clone, Debug, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct EngineRuntimeSnapshot {
    #[ts(optional)]
    pub active_card_id: Option<String>,
    pub focused_link_index: usize,
    #[ts(optional)]
    pub next_timer_wakeup_ms: Option<u32>,
    #[ts(optional)]
    pub focused_input_edit_name: Option<String>,
    #[ts(optional)]
    pub focused_input_edit_value: Option<String>,
    #[ts(optional)]
    pub focused_select_edit_name: Option<String>,
    #[ts(optional)]
    pub focused_select_edit_value: Option<String>,
    pub base_url: String,
    pub content_type: String,
    #[ts(optional)]
    pub browser_context_epoch: Option<u32>,
    #[ts(optional)]
    pub history_push_sequence: Option<u32>,
    #[ts(optional)]
    pub deck_language: Option<String>,
    #[ts(optional)]
    pub active_card_language: Option<String>,
    pub last_back_navigation_handled: bool,
    #[ts(optional)]
    pub external_navigation_intent: Option<String>,
    #[ts(optional)]
    pub external_navigation_request_policy: Option<ExternalNavigationRequestPolicySnapshot>,
    #[ts(optional)]
    pub last_script_execution_ok: Option<bool>,
    #[ts(optional)]
    pub last_script_execution_trap: Option<String>,
    #[ts(optional)]
    pub last_script_execution_error_class: Option<String>,
    #[ts(optional)]
    pub last_script_execution_error_category: Option<String>,
    #[ts(optional)]
    pub last_script_requires_refresh: Option<bool>,
    pub last_script_dialog_requests: Vec<ScriptDialogRequestSnapshot>,
    pub last_script_timer_requests: Vec<ScriptTimerRequestSnapshot>,
}

#[derive(Clone, Debug, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct EngineFrame {
    pub snapshot: EngineRuntimeSnapshot,
    pub render: RenderList,
    pub presentation: EnginePresentationFrame,
}

impl From<engine::ScriptNavigationRequestPolicyLiteral>
    for ExternalNavigationRequestPolicySnapshot
{
    fn from(value: engine::ScriptNavigationRequestPolicyLiteral) -> Self {
        Self {
            cache_control: value
                .cache_control
                .map(ExternalNavigationCacheControlPolicySnapshot::from),
            referer_url: value.referer_url,
            post_context: value
                .post_context
                .map(ExternalNavigationPostContextSnapshot::from),
            request_intent: value
                .request_intent
                .map(ExternalNavigationRequestIntentSnapshot::from),
        }
    }
}

impl From<engine::ScriptNavigationCacheControlPolicyLiteral>
    for ExternalNavigationCacheControlPolicySnapshot
{
    fn from(value: engine::ScriptNavigationCacheControlPolicyLiteral) -> Self {
        match value {
            engine::ScriptNavigationCacheControlPolicyLiteral::Default => Self::Default,
            engine::ScriptNavigationCacheControlPolicyLiteral::NoCache => Self::NoCache,
        }
    }
}

impl From<engine::ScriptNavigationPostContextLiteral> for ExternalNavigationPostContextSnapshot {
    fn from(value: engine::ScriptNavigationPostContextLiteral) -> Self {
        Self {
            same_deck: value.same_deck,
            content_type: value.content_type,
            payload: value.payload,
        }
    }
}

impl From<engine::ScriptNavigationRequestIntentLiteral>
    for ExternalNavigationRequestIntentSnapshot
{
    fn from(value: engine::ScriptNavigationRequestIntentLiteral) -> Self {
        Self {
            method: ExternalNavigationMethodSnapshot::from(value.method),
            enctype: value.enctype,
            send_referer: value.send_referer,
            accept_charset: value.accept_charset,
            same_deck: value.same_deck,
            post_fields: value
                .post_fields
                .into_iter()
                .map(ExternalNavigationPostFieldSnapshot::from)
                .collect(),
        }
    }
}

impl From<engine::ScriptNavigationMethodLiteral> for ExternalNavigationMethodSnapshot {
    fn from(value: engine::ScriptNavigationMethodLiteral) -> Self {
        match value {
            engine::ScriptNavigationMethodLiteral::Get => Self::Get,
            engine::ScriptNavigationMethodLiteral::Post => Self::Post,
        }
    }
}

impl From<engine::ScriptNavigationPostFieldLiteral> for ExternalNavigationPostFieldSnapshot {
    fn from(value: engine::ScriptNavigationPostFieldLiteral) -> Self {
        Self {
            name: value.name,
            value: value.value,
        }
    }
}

#[derive(Clone, Debug, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct RenderList {
    pub draw: Vec<DrawCmd>,
}

#[derive(Clone, Debug, Serialize, TS)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum DrawCmd {
    Text {
        x: u32,
        y: u32,
        text: String,
    },
    Link {
        x: u32,
        y: u32,
        text: String,
        focused: bool,
        href: String,
    },
}

impl From<engine::RenderList> for RenderList {
    fn from(value: engine::RenderList) -> Self {
        Self {
            draw: value.draw.into_iter().map(DrawCmd::from).collect(),
        }
    }
}

impl From<engine::DrawCmd> for DrawCmd {
    fn from(value: engine::DrawCmd) -> Self {
        match value {
            engine::DrawCmd::Text { x, y, text } => Self::Text { x, y, text },
            engine::DrawCmd::Link {
                x,
                y,
                text,
                focused,
                href,
            } => Self::Link {
                x,
                y,
                text,
                focused,
                href,
            },
        }
    }
}
