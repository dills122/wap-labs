use serde::{Deserialize, Serialize};

pub const ENGINE_FRAME_CONTRACT_VERSION: u16 = 1;
pub const ENGINE_FRAME_PROFILE_ID: &str = "class-c-reference";

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EnginePresentationFrame {
    pub contract_version: u16,
    pub frame_id: String,
    pub profile_id: String,
    pub viewport: EngineViewport,
    pub deck: EngineDeckDisplayMetadata,
    pub card: EngineCardDisplayMetadata,
    pub rows: Vec<EngineFrameRow>,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub focus: Option<EngineFocusState>,
    pub selection: EngineSelectionState,
    pub affordances: Vec<EngineAffordance>,
    pub back_available: bool,
}

impl EnginePresentationFrame {
    pub(crate) fn assign_content_identity(&mut self) -> Result<(), String> {
        self.frame_id.clear();
        let bytes = serde_json::to_vec(self)
            .map_err(|_| "Engine frame identity serialization failed".to_string())?;
        let hash = bytes.iter().fold(0xcbf29ce484222325_u64, |hash, byte| {
            (hash ^ u64::from(*byte)).wrapping_mul(0x100000001b3)
        });
        self.frame_id = format!("{hash:016x}");
        Ok(())
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineViewport {
    pub cols: u32,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDeckDisplayMetadata {
    pub base_url: String,
    pub content_type: String,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub language: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineCardDisplayMetadata {
    pub id: String,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub language: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineFrameRow {
    pub index: u32,
    pub segments: Vec<EngineFrameSegment>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum EngineFrameSegment {
    Text {
        x: u32,
        text: String,
    },
    Focusable {
        x: u32,
        text: String,
        #[serde(rename = "focusId")]
        focus_id: String,
        #[serde(rename = "targetKind")]
        target_kind: EngineFocusTargetKind,
        focused: bool,
    },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineFocusTargetKind {
    Link,
    Input,
    Select,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineFocusState {
    pub index: u32,
    pub focus_id: String,
    pub target_kind: EngineFocusTargetKind,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum EngineSelectionState {
    None,
    Input {
        #[serde(rename = "controlId")]
        control_id: String,
        name: String,
        editing: bool,
    },
    Select {
        #[serde(rename = "controlId")]
        control_id: String,
        editing: bool,
        #[cfg_attr(feature = "contract-codegen", ts(optional))]
        value: Option<String>,
    },
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineAffordance {
    pub action_id: String,
    pub label: String,
    pub enabled: bool,
    pub source: EngineAffordanceSource,
    pub control: EngineControlAssociation,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub do_name: Option<String>,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub do_type: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineAffordanceSource {
    FocusedLink,
    FocusedInput,
    FocusedSelect,
    CardDo,
    TemplateDo,
    History,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineControlAssociation {
    Primary,
    Task,
    Back,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "lowercase")]
pub enum EngineInputKey {
    Up,
    Down,
    Enter,
}

impl EngineInputKey {
    pub(crate) fn as_str(self) -> &'static str {
        match self {
            Self::Up => "up",
            Self::Down => "down",
            Self::Enter => "enter",
        }
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum EngineInputEvent {
    Key {
        key: EngineInputKey,
    },
    ActivateAction {
        #[serde(rename = "frameId")]
        frame_id: String,
        #[serde(rename = "actionId")]
        action_id: String,
    },
}
