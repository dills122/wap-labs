use std::io::{self, Write};

use serde::{Deserialize, Serialize};

use super::render_list::RenderList;

pub const ENGINE_FRAME_CONTRACT_VERSION: u16 = 1;
pub const ENGINE_FRAME_PROFILE_ID: &str = "class-c-reference";
pub const ENGINE_VIEWPORT_MIN_COLS: u32 = 1;
pub const ENGINE_VIEWPORT_MAX_COLS: u32 = u32::MAX;
pub const ENGINE_MAX_LAYOUT_ROWS: usize = 4_096;
pub const ENGINE_MAX_LAYOUT_SEGMENTS: usize = 4_096;
pub const ENGINE_MAX_DRAW_COMMANDS: usize = 4_096;
pub const ENGINE_MAX_SERIALIZED_RENDER_BYTES: usize = 2 * 1024 * 1024;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineRenderResource {
    LayoutRows,
    LayoutSegments,
    DrawCommands,
    SerializedBytes,
}

impl EngineRenderResource {
    fn label(self) -> &'static str {
        match self {
            Self::LayoutRows => "layout rows",
            Self::LayoutSegments => "layout segments",
            Self::DrawCommands => "draw commands",
            Self::SerializedBytes => "serialized render bytes",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum EngineRenderError {
    ResourceLimit {
        resource: EngineRenderResource,
        limit: usize,
        observed: usize,
        message: String,
    },
    EngineFailure {
        message: String,
    },
}

impl EngineRenderError {
    pub(crate) fn resource_limit(
        resource: EngineRenderResource,
        limit: usize,
        observed: usize,
    ) -> Self {
        Self::ResourceLimit {
            resource,
            limit,
            observed,
            message: format!(
                "Engine render exceeds the {} limit of {} (observed {})",
                resource.label(),
                limit,
                observed
            ),
        }
    }

    pub(crate) fn engine_failure(message: impl Into<String>) -> Self {
        Self::EngineFailure {
            message: message.into(),
        }
    }
}

impl std::fmt::Display for EngineRenderError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ResourceLimit { message, .. } | Self::EngineFailure { message } => {
                formatter.write_str(message)
            }
        }
    }
}

impl From<String> for EngineRenderError {
    fn from(message: String) -> Self {
        Self::engine_failure(message)
    }
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct EngineRenderLimits {
    pub rows: usize,
    pub segments: usize,
    pub draw_commands: usize,
    pub serialized_bytes: usize,
}

impl Default for EngineRenderLimits {
    fn default() -> Self {
        Self {
            rows: ENGINE_MAX_LAYOUT_ROWS,
            segments: ENGINE_MAX_LAYOUT_SEGMENTS,
            draw_commands: ENGINE_MAX_DRAW_COMMANDS,
            serialized_bytes: ENGINE_MAX_SERIALIZED_RENDER_BYTES,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct EngineRenderOutput {
    pub render: RenderList,
    pub presentation: EnginePresentationFrame,
}

impl EngineRenderOutput {
    pub(crate) fn enforce_serialized_limit(&self, limit: usize) -> Result<(), EngineRenderError> {
        let mut writer = BoundedCountingWriter::new(limit);
        match serde_json::to_writer(&mut writer, self) {
            Ok(()) => Ok(()),
            Err(_) if writer.exceeded => Err(EngineRenderError::resource_limit(
                EngineRenderResource::SerializedBytes,
                limit,
                writer.written,
            )),
            Err(error) => Err(EngineRenderError::engine_failure(format!(
                "Engine render serialization failed: {error}"
            ))),
        }
    }
}

#[cfg(feature = "contract-codegen")]
pub fn engine_render_limits_typescript_contract() -> String {
    format!(
        concat!(
            "export const ENGINE_RENDER_LIMITS = {{\n",
            "  maxLayoutRows: {},\n",
            "  maxLayoutSegments: {},\n",
            "  maxDrawCommands: {},\n",
            "  maxSerializedBytes: {},\n",
            "}} as const;\n"
        ),
        ENGINE_MAX_LAYOUT_ROWS,
        ENGINE_MAX_LAYOUT_SEGMENTS,
        ENGINE_MAX_DRAW_COMMANDS,
        ENGINE_MAX_SERIALIZED_RENDER_BYTES
    )
}

struct BoundedCountingWriter {
    limit: usize,
    written: usize,
    exceeded: bool,
}

impl BoundedCountingWriter {
    fn new(limit: usize) -> Self {
        Self {
            limit,
            written: 0,
            exceeded: false,
        }
    }
}

impl Write for BoundedCountingWriter {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        let remaining = self.limit.saturating_sub(self.written);
        if bytes.len() > remaining {
            self.written = self.limit.saturating_add(1);
            self.exceeded = true;
            return Err(io::Error::other(
                "engine render serialization limit exceeded",
            ));
        }
        self.written += bytes.len();
        Ok(bytes.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

#[derive(Default)]
struct ContentIdentityWriter {
    hash: u64,
}

impl ContentIdentityWriter {
    fn new() -> Self {
        Self {
            hash: 0xcbf29ce484222325,
        }
    }
}

impl Write for ContentIdentityWriter {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        for byte in bytes {
            self.hash = (self.hash ^ u64::from(*byte)).wrapping_mul(0x100000001b3);
        }
        Ok(bytes.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum EngineViewportError {
    InvalidViewport {
        #[serde(rename = "requestedCols")]
        requested_cols: String,
        #[serde(rename = "minCols")]
        min_cols: u32,
        #[serde(rename = "maxCols")]
        max_cols: u32,
        message: String,
    },
}

impl EngineViewportError {
    pub fn invalid(requested_cols: impl ToString) -> Self {
        Self::InvalidViewport {
            requested_cols: requested_cols.to_string(),
            min_cols: ENGINE_VIEWPORT_MIN_COLS,
            max_cols: ENGINE_VIEWPORT_MAX_COLS,
            message: format!(
                "Viewport columns must be an integer from {} through {}",
                ENGINE_VIEWPORT_MIN_COLS, ENGINE_VIEWPORT_MAX_COLS
            ),
        }
    }
}

impl std::fmt::Display for EngineViewportError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidViewport { message, .. } => formatter.write_str(message),
        }
    }
}

#[cfg(feature = "contract-codegen")]
pub fn engine_viewport_typescript_contract() -> String {
    format!(
        concat!(
            "export const ENGINE_VIEWPORT_RANGE = {{\n",
            "  minCols: {},\n",
            "  maxCols: {},\n",
            "}} as const;\n"
        ),
        ENGINE_VIEWPORT_MIN_COLS, ENGINE_VIEWPORT_MAX_COLS
    )
}

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
        let mut writer = ContentIdentityWriter::new();
        serde_json::to_writer(&mut writer, self)
            .map_err(|_| "Engine frame identity serialization failed".to_string())?;
        self.frame_id = format!("{:016x}", writer.hash);
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
