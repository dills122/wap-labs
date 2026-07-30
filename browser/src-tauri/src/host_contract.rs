use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub const MAX_HOST_CARD_ID_BYTES: usize = 256;
pub const MAX_HOST_EDIT_DRAFT_BYTES: usize = 64 * 1024;
pub const MAX_HOST_CONTEXT_URL_BYTES: usize = 4 * 1024;
pub const MAX_HOST_CONTENT_TYPE_BYTES: usize = 1024;

#[derive(Clone, Copy, Debug, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct HostIngressLimits {
    pub correlation_id_bytes: u32,
    pub card_id_bytes: u32,
    pub edit_draft_bytes: u32,
    pub context_url_bytes: u32,
    pub content_type_bytes: u32,
}

pub const HOST_INGRESS_LIMITS: HostIngressLimits = HostIngressLimits {
    correlation_id_bytes: lowband_transport_rust::MAX_REQUEST_ID_BYTES as u32,
    card_id_bytes: MAX_HOST_CARD_ID_BYTES as u32,
    edit_draft_bytes: MAX_HOST_EDIT_DRAFT_BYTES as u32,
    context_url_bytes: MAX_HOST_CONTEXT_URL_BYTES as u32,
    content_type_bytes: MAX_HOST_CONTENT_TYPE_BYTES as u32,
};

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum HostCommandErrorCode {
    InvalidRequest,
    Cancelled,
    TaskSpawnFailed,
    TaskJoinFailed,
    MutexUnavailable,
    EngineResourceLimit,
    EngineFailure,
    HostFailure,
    MalformedResponse,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct HostCommandError {
    pub code: HostCommandErrorCode,
    pub message: String,
    pub recoverable: bool,
}

impl HostCommandError {
    pub fn invalid_request(message: impl Into<String>) -> Self {
        Self {
            code: HostCommandErrorCode::InvalidRequest,
            message: message.into(),
            recoverable: true,
        }
    }

    pub fn task_spawn_failed() -> Self {
        Self {
            code: HostCommandErrorCode::TaskSpawnFailed,
            message: "Host task could not be admitted.".to_string(),
            recoverable: true,
        }
    }

    pub fn task_join_failed() -> Self {
        Self {
            code: HostCommandErrorCode::TaskJoinFailed,
            message: "Host task did not complete.".to_string(),
            recoverable: true,
        }
    }

    pub fn mutex_unavailable() -> Self {
        Self {
            code: HostCommandErrorCode::MutexUnavailable,
            message: "Engine state was temporarily unavailable.".to_string(),
            recoverable: true,
        }
    }

    pub fn engine_failure(_message: String) -> Self {
        Self {
            code: HostCommandErrorCode::EngineFailure,
            message: "Engine command failed.".to_string(),
            recoverable: true,
        }
    }

    pub fn engine_resource_limit() -> Self {
        Self {
            code: HostCommandErrorCode::EngineResourceLimit,
            message: "Engine resource limit reached.".to_string(),
            recoverable: true,
        }
    }
}

impl From<String> for HostCommandError {
    fn from(message: String) -> Self {
        Self::engine_failure(message)
    }
}

impl std::fmt::Display for HostCommandError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.message)
    }
}

impl std::error::Error for HostCommandError {}

fn validate_bytes(value: &str, field: &'static str, limit: usize) -> Result<(), HostCommandError> {
    if value.len() > limit {
        return Err(HostCommandError::invalid_request(format!(
            "{field} exceeds the {limit}-byte limit."
        )));
    }
    Ok(())
}

pub fn validate_correlation_id(value: &str) -> Result<(), HostCommandError> {
    validate_bytes(
        value,
        "Correlation identifier",
        lowband_transport_rust::MAX_REQUEST_ID_BYTES,
    )
}

pub fn validate_card_id(value: &str) -> Result<(), HostCommandError> {
    validate_bytes(value, "Card identifier", MAX_HOST_CARD_ID_BYTES)
}

pub fn validate_edit_draft(value: &str) -> Result<(), HostCommandError> {
    validate_bytes(value, "Edit draft", MAX_HOST_EDIT_DRAFT_BYTES)
}

pub fn validate_context_url(value: &str, field: &'static str) -> Result<(), HostCommandError> {
    validate_bytes(value, field, MAX_HOST_CONTEXT_URL_BYTES)
}

pub fn validate_content_type(value: &str) -> Result<(), HostCommandError> {
    validate_bytes(value, "Deck content type", MAX_HOST_CONTENT_TYPE_BYTES)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn host_error_taxonomy_is_stable_and_secret_free() {
        let errors = [
            HostCommandError::invalid_request("Invalid request."),
            HostCommandError {
                code: HostCommandErrorCode::Cancelled,
                message: "Host command was cancelled.".to_string(),
                recoverable: true,
            },
            HostCommandError::task_spawn_failed(),
            HostCommandError::task_join_failed(),
            HostCommandError::mutex_unavailable(),
            HostCommandError::engine_resource_limit(),
            HostCommandError::engine_failure("secret-engine-input".to_string()),
            HostCommandError {
                code: HostCommandErrorCode::HostFailure,
                message: "Host command failed.".to_string(),
                recoverable: true,
            },
            HostCommandError {
                code: HostCommandErrorCode::MalformedResponse,
                message: "Host response was malformed.".to_string(),
                recoverable: true,
            },
        ];
        let serialized = serde_json::to_string(&errors).expect("errors should serialize");
        for code in [
            "INVALID_REQUEST",
            "CANCELLED",
            "TASK_SPAWN_FAILED",
            "TASK_JOIN_FAILED",
            "MUTEX_UNAVAILABLE",
            "ENGINE_RESOURCE_LIMIT",
            "ENGINE_FAILURE",
            "HOST_FAILURE",
            "MALFORMED_RESPONSE",
        ] {
            assert!(serialized.contains(code));
        }
        assert!(!serialized.contains("secret-engine-input"));
    }
}
