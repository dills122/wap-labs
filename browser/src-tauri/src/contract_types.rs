use serde::{Deserialize, Serialize};
use ts_rs::TS;
use wavenav_engine as engine;

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
pub struct NavigateToCardRequest {
    pub card_id: String,
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct SetViewportColsRequest {
    pub cols: usize,
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct AdvanceTimeRequest {
    pub delta_ms: u32,
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
}

#[derive(Clone, Debug, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct EngineRuntimeSnapshot {
    #[ts(optional)]
    pub active_card_id: Option<String>,
    pub focused_link_index: usize,
    pub base_url: String,
    pub content_type: String,
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
