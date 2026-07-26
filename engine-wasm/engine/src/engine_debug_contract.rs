use serde::{Deserialize, Serialize};

/// Shared TypeScript projection for the host-owned debug session broker.
///
/// The engine exposes the DTOs used by this interface, but does not implement
/// session lifecycle. D0-03 wires these methods at the browser host boundary.
#[cfg(any(feature = "contract-codegen", test))]
pub const ENGINE_DEBUG_CONNECTOR_TS_INTERFACE: &str = r#"export interface EngineDebugConnector {
  openDebugSession(request: EngineDebugOpenSessionRequest): Promise<EngineDebugOpenSessionOutcome>;
  pollDebugEvents(request: EngineDebugPollEventsRequest): Promise<EngineDebugPollEventsOutcome>;
  getDebugSnapshot(request: EngineDebugSnapshotRequest): Promise<EngineDebugSnapshotOutcome>;
  closeDebugSession(request: EngineDebugCloseSessionRequest): Promise<EngineDebugCloseSessionOutcome>;
}
"#;

pub const ENGINE_DEBUG_PROTOCOL_VERSION: u16 = 1;
pub const ENGINE_DEBUG_SESSION_LIMIT: u16 = 1;
pub const ENGINE_DEBUG_EVENT_BUFFER_CAPACITY: u32 = 2_048;
pub const ENGINE_DEBUG_DEFAULT_MAX_EVENTS_PER_POLL: u16 = 100;
pub const ENGINE_DEBUG_MAX_EVENTS_PER_POLL: u16 = 256;
pub const ENGINE_DEBUG_MAX_SNAPSHOT_VARIABLES: u16 = 256;
pub const ENGINE_DEBUG_MAX_SNAPSHOT_TIMERS: u16 = 64;
pub const ENGINE_DEBUG_MAX_TEXT_BYTES: u32 = 4_096;

#[cfg(any(feature = "contract-codegen", test))]
pub fn engine_debug_typescript_contract() -> String {
    format!(
        r#"export const ENGINE_DEBUG_CONTRACT_BASELINE = {{
  protocolVersion: {ENGINE_DEBUG_PROTOCOL_VERSION},
  enabledByDefault: false,
  sessionLimit: {ENGINE_DEBUG_SESSION_LIMIT},
  eventBufferCapacity: {ENGINE_DEBUG_EVENT_BUFFER_CAPACITY},
  defaultMaxEventsPerPoll: {ENGINE_DEBUG_DEFAULT_MAX_EVENTS_PER_POLL},
  maxEventsPerPoll: {ENGINE_DEBUG_MAX_EVENTS_PER_POLL},
  maxSnapshotVariables: {ENGINE_DEBUG_MAX_SNAPSHOT_VARIABLES},
  maxSnapshotTimers: {ENGINE_DEBUG_MAX_SNAPSHOT_TIMERS},
  maxTextBytes: {ENGINE_DEBUG_MAX_TEXT_BYTES},
  maskingPolicy: "required",
  timestampKind: "monotonic",
  supportsSensitiveUnmasking: false
}} as const;

{ENGINE_DEBUG_CONNECTOR_TS_INTERFACE}"#
    )
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineDebugMaskingPolicy {
    Required,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineDebugTimestampKind {
    Monotonic,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineDebugRedactionReason {
    PasswordInput,
    SensitiveName,
    CredentialBearingUrl,
    TransportSecret,
    Policy,
    BoundedOutput,
}

/// A value crossing the debug boundary.
///
/// Masked and omitted variants deliberately have no value-bearing field, so a
/// consumer cannot accidentally recover sensitive data from a nominally
/// redacted shape.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(tag = "state", rename_all = "kebab-case")]
pub enum EngineDebugValue {
    Visible { value: String },
    Masked { reason: EngineDebugRedactionReason },
    Omitted { reason: EngineDebugRedactionReason },
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugNamedValue {
    pub name: String,
    pub value: EngineDebugValue,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineDebugPostfieldResolutionSource {
    Variable,
    Draft,
    Card,
    Fallback,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugPostfieldResolution {
    pub name: String,
    pub value: EngineDebugValue,
    pub source: EngineDebugPostfieldResolutionSource,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum EngineDebugEventKind {
    #[serde(rename = "deck.load")]
    DeckLoad,
    #[serde(rename = "card.enter")]
    CardEnter,
    #[serde(rename = "card.exit")]
    CardExit,
    #[serde(rename = "focus.change")]
    FocusChange,
    #[serde(rename = "input.edit.start")]
    InputEditStart,
    #[serde(rename = "input.edit.draft")]
    InputEditDraft,
    #[serde(rename = "input.edit.commit")]
    InputEditCommit,
    #[serde(rename = "input.edit.cancel")]
    InputEditCancel,
    #[serde(rename = "action.accept")]
    ActionAccept,
    #[serde(rename = "action.external")]
    ActionExternal,
    #[serde(rename = "nav.intent")]
    NavigationIntent,
    #[serde(rename = "postfield.resolve")]
    PostfieldResolve,
    #[serde(rename = "script.invoke")]
    ScriptInvoke,
    #[serde(rename = "script.trap")]
    ScriptTrap,
    #[serde(rename = "timer.schedule")]
    TimerSchedule,
    #[serde(rename = "timer.fire")]
    TimerFire,
    #[serde(rename = "timer.cancel")]
    TimerCancel,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(
    tag = "type",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum EngineDebugEventPayload {
    DeckLoad {
        base_url: EngineDebugValue,
        content_type: String,
        card_count: u32,
    },
    CardEnter,
    CardExit,
    FocusChange {
        #[cfg_attr(feature = "contract-codegen", ts(optional))]
        previous_index: Option<u32>,
        #[cfg_attr(feature = "contract-codegen", ts(optional))]
        current_index: Option<u32>,
    },
    InputEditStart {
        name: String,
    },
    InputEditDraft {
        name: String,
        value: EngineDebugValue,
    },
    InputEditCommit {
        name: String,
        value: EngineDebugValue,
    },
    InputEditCancel {
        name: String,
    },
    ActionAccept {
        action_type: String,
        #[cfg_attr(feature = "contract-codegen", ts(optional))]
        name: Option<String>,
    },
    ActionExternal {
        target: EngineDebugValue,
    },
    NavigationIntent {
        target: EngineDebugValue,
    },
    PostfieldResolve {
        fields: Vec<EngineDebugPostfieldResolution>,
    },
    ScriptInvoke {
        source: EngineDebugValue,
        function_name: String,
    },
    ScriptTrap {
        source: EngineDebugValue,
        function_name: String,
        detail: EngineDebugValue,
    },
    TimerSchedule {
        delay_ms: u32,
        token: EngineDebugValue,
    },
    TimerFire {
        token: EngineDebugValue,
    },
    TimerCancel {
        token: EngineDebugValue,
    },
}

impl EngineDebugEventPayload {
    pub fn kind(&self) -> EngineDebugEventKind {
        match self {
            Self::DeckLoad { .. } => EngineDebugEventKind::DeckLoad,
            Self::CardEnter => EngineDebugEventKind::CardEnter,
            Self::CardExit => EngineDebugEventKind::CardExit,
            Self::FocusChange { .. } => EngineDebugEventKind::FocusChange,
            Self::InputEditStart { .. } => EngineDebugEventKind::InputEditStart,
            Self::InputEditDraft { .. } => EngineDebugEventKind::InputEditDraft,
            Self::InputEditCommit { .. } => EngineDebugEventKind::InputEditCommit,
            Self::InputEditCancel { .. } => EngineDebugEventKind::InputEditCancel,
            Self::ActionAccept { .. } => EngineDebugEventKind::ActionAccept,
            Self::ActionExternal { .. } => EngineDebugEventKind::ActionExternal,
            Self::NavigationIntent { .. } => EngineDebugEventKind::NavigationIntent,
            Self::PostfieldResolve { .. } => EngineDebugEventKind::PostfieldResolve,
            Self::ScriptInvoke { .. } => EngineDebugEventKind::ScriptInvoke,
            Self::ScriptTrap { .. } => EngineDebugEventKind::ScriptTrap,
            Self::TimerSchedule { .. } => EngineDebugEventKind::TimerSchedule,
            Self::TimerFire { .. } => EngineDebugEventKind::TimerFire,
            Self::TimerCancel { .. } => EngineDebugEventKind::TimerCancel,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugEvent {
    pub seq: String,
    pub kind: EngineDebugEventKind,
    pub monotonic_time_ms: u32,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub card_id: Option<String>,
    pub payload: EngineDebugEventPayload,
}

impl EngineDebugEvent {
    pub fn has_matching_kind(&self) -> bool {
        self.kind == self.payload.kind()
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugBufferSnapshot {
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub oldest_seq: Option<String>,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub latest_seq: Option<String>,
    pub dropped_count: u32,
    pub capacity: u32,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugCollectionSummary {
    pub total_count: u32,
    pub returned_count: u32,
    pub truncated: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugTimerSnapshot {
    pub remaining_ms: u32,
    pub token: EngineDebugValue,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugExternalNavigationSnapshot {
    pub target: EngineDebugValue,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub method: Option<String>,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub referer_url: Option<EngineDebugValue>,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub post_body: Option<EngineDebugValue>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugSnapshot {
    pub protocol_version: u16,
    pub captured_seq: String,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub active_card_id: Option<String>,
    pub focused_link_index: u32,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub focused_input_edit: Option<EngineDebugNamedValue>,
    pub runtime_vars: Vec<EngineDebugNamedValue>,
    pub runtime_vars_summary: EngineDebugCollectionSummary,
    #[cfg_attr(feature = "contract-codegen", ts(optional))]
    pub pending_external_navigation: Option<EngineDebugExternalNavigationSnapshot>,
    pub timers: Vec<EngineDebugTimerSnapshot>,
    pub timers_summary: EngineDebugCollectionSummary,
    pub buffer: EngineDebugBufferSnapshot,
    pub viewport_cols: u32,
    pub base_url: EngineDebugValue,
    pub content_type: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugCapabilities {
    pub protocol_version: u16,
    pub supports_polling: bool,
    pub supports_snapshots: bool,
    pub supports_sensitive_unmasking: bool,
    pub masking_policy: EngineDebugMaskingPolicy,
    pub timestamp_kind: EngineDebugTimestampKind,
    pub session_limit: u16,
    pub event_buffer_capacity: u32,
    pub default_max_events_per_poll: u16,
    pub max_events_per_poll: u16,
    pub max_snapshot_variables: u16,
    pub max_snapshot_timers: u16,
    pub max_text_bytes: u32,
}

impl EngineDebugCapabilities {
    pub fn d0_baseline() -> Self {
        Self {
            protocol_version: ENGINE_DEBUG_PROTOCOL_VERSION,
            supports_polling: true,
            supports_snapshots: true,
            supports_sensitive_unmasking: false,
            masking_policy: EngineDebugMaskingPolicy::Required,
            timestamp_kind: EngineDebugTimestampKind::Monotonic,
            session_limit: ENGINE_DEBUG_SESSION_LIMIT,
            event_buffer_capacity: ENGINE_DEBUG_EVENT_BUFFER_CAPACITY,
            default_max_events_per_poll: ENGINE_DEBUG_DEFAULT_MAX_EVENTS_PER_POLL,
            max_events_per_poll: ENGINE_DEBUG_MAX_EVENTS_PER_POLL,
            max_snapshot_variables: ENGINE_DEBUG_MAX_SNAPSHOT_VARIABLES,
            max_snapshot_timers: ENGINE_DEBUG_MAX_SNAPSHOT_TIMERS,
            max_text_bytes: ENGINE_DEBUG_MAX_TEXT_BYTES,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugOpenSessionRequest {
    pub protocol_version: u16,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugSession {
    pub session_id: String,
    pub cursor: String,
    pub capabilities: EngineDebugCapabilities,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugPollEventsRequest {
    pub session_id: String,
    pub cursor: String,
    pub max_events: u16,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugEventBatch {
    pub events: Vec<EngineDebugEvent>,
    pub next_cursor: String,
    pub dropped_count: u32,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugSnapshotRequest {
    pub session_id: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugCloseSessionRequest {
    pub session_id: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugCloseSessionResult {
    pub closed: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
pub enum EngineDebugErrorCode {
    #[serde(rename = "DEBUG_DISABLED")]
    DebugDisabled,
    #[serde(rename = "UNSUPPORTED_PROTOCOL_VERSION")]
    UnsupportedProtocolVersion,
    #[serde(rename = "SESSION_LIMIT_REACHED")]
    SessionLimitReached,
    #[serde(rename = "SESSION_NOT_FOUND")]
    SessionNotFound,
    #[serde(rename = "INVALID_CURSOR")]
    InvalidCursor,
    #[serde(rename = "INVALID_REQUEST")]
    InvalidRequest,
    #[serde(rename = "DEBUG_SOURCE_UNAVAILABLE")]
    DebugSourceUnavailable,
    #[serde(rename = "INTERNAL_ERROR")]
    InternalError,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct EngineDebugError {
    pub code: EngineDebugErrorCode,
    pub message: String,
    pub retryable: bool,
}

macro_rules! debug_outcome {
    ($name:ident, $success:ty, $field:ident) => {
        #[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
        #[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
        #[serde(tag = "status", rename_all = "kebab-case")]
        pub enum $name {
            Success { $field: $success },
            Failure { error: EngineDebugError },
        }
    };
}

debug_outcome!(EngineDebugOpenSessionOutcome, EngineDebugSession, session);
debug_outcome!(EngineDebugPollEventsOutcome, EngineDebugEventBatch, batch);
debug_outcome!(
    EngineDebugSnapshotOutcome,
    Box<EngineDebugSnapshot>,
    snapshot
);
debug_outcome!(
    EngineDebugCloseSessionOutcome,
    EngineDebugCloseSessionResult,
    result
);

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn masked_and_omitted_values_cannot_serialize_sensitive_content() {
        let masked = EngineDebugValue::Masked {
            reason: EngineDebugRedactionReason::PasswordInput,
        };
        let omitted = EngineDebugValue::Omitted {
            reason: EngineDebugRedactionReason::TransportSecret,
        };

        assert_eq!(
            serde_json::to_value(masked).expect("masked value should serialize"),
            json!({ "state": "masked", "reason": "password-input" })
        );
        assert_eq!(
            serde_json::to_value(omitted).expect("omitted value should serialize"),
            json!({ "state": "omitted", "reason": "transport-secret" })
        );
    }

    #[test]
    fn event_kind_and_payload_shape_have_an_explicit_determinism_guard() {
        let event = EngineDebugEvent {
            seq: "42".to_string(),
            kind: EngineDebugEventKind::InputEditDraft,
            monotonic_time_ms: 75,
            card_id: Some("login".to_string()),
            payload: EngineDebugEventPayload::InputEditDraft {
                name: "pin".to_string(),
                value: EngineDebugValue::Masked {
                    reason: EngineDebugRedactionReason::SensitiveName,
                },
            },
        };

        assert!(event.has_matching_kind());
        assert_eq!(
            serde_json::to_value(event).expect("event should serialize"),
            json!({
                "seq": "42",
                "kind": "input.edit.draft",
                "monotonicTimeMs": 75,
                "cardId": "login",
                "payload": {
                    "type": "input-edit-draft",
                    "name": "pin",
                    "value": { "state": "masked", "reason": "sensitive-name" }
                }
            })
        );
    }

    #[test]
    fn mismatched_event_kind_is_rejected_by_the_contract_guard() {
        let event = EngineDebugEvent {
            seq: "9".to_string(),
            kind: EngineDebugEventKind::TimerFire,
            monotonic_time_ms: 10,
            card_id: None,
            payload: EngineDebugEventPayload::TimerCancel {
                token: EngineDebugValue::Visible {
                    value: "timer-1".to_string(),
                },
            },
        };

        assert!(!event.has_matching_kind());
    }

    #[test]
    fn d0_capabilities_pin_default_disabled_bounded_masked_contract() {
        let capabilities = EngineDebugCapabilities::d0_baseline();

        assert_eq!(capabilities.protocol_version, 1);
        assert_eq!(capabilities.session_limit, 1);
        assert_eq!(capabilities.event_buffer_capacity, 2_048);
        assert_eq!(capabilities.default_max_events_per_poll, 100);
        assert_eq!(capabilities.max_events_per_poll, 256);
        assert_eq!(capabilities.max_snapshot_variables, 256);
        assert_eq!(capabilities.max_snapshot_timers, 64);
        assert_eq!(capabilities.max_text_bytes, 4_096);
        assert_eq!(
            capabilities.masking_policy,
            EngineDebugMaskingPolicy::Required
        );
        assert_eq!(
            capabilities.timestamp_kind,
            EngineDebugTimestampKind::Monotonic
        );
        assert!(!capabilities.supports_sensitive_unmasking);

        let typescript = engine_debug_typescript_contract();
        assert!(typescript.contains("enabledByDefault: false"));
        assert!(typescript.contains("maxEventsPerPoll: 256"));
        assert!(typescript.contains("supportsSensitiveUnmasking: false"));
    }

    #[test]
    fn lifecycle_failures_have_a_stable_non_detail_shape() {
        let outcome = EngineDebugOpenSessionOutcome::Failure {
            error: EngineDebugError {
                code: EngineDebugErrorCode::DebugDisabled,
                message: "debug connector is disabled".to_string(),
                retryable: false,
            },
        };

        assert_eq!(
            serde_json::to_value(outcome).expect("failure outcome should serialize"),
            json!({
                "status": "failure",
                "error": {
                    "code": "DEBUG_DISABLED",
                    "message": "debug connector is disabled",
                    "retryable": false
                }
            })
        );
    }
}
