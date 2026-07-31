use super::engine_adapter::AppState;
use crate::contract_types::{
    EngineDebugCapabilities, EngineDebugCloseSessionOutcome, EngineDebugCloseSessionRequest,
    EngineDebugCloseSessionResult, EngineDebugError, EngineDebugErrorCode,
    EngineDebugOpenSessionOutcome, EngineDebugOpenSessionRequest, EngineDebugPollEventsOutcome,
    EngineDebugPollEventsRequest, EngineDebugSession, EngineDebugSnapshotOutcome,
    EngineDebugSnapshotRequest,
};
use std::sync::{MutexGuard, PoisonError};
use uuid::Uuid;
use wavenav_engine::{WmlEngine, ENGINE_DEBUG_PROTOCOL_VERSION};

const DEBUG_DISABLED_MESSAGE: &str = "engine debug connector is disabled by host policy";
const UNSUPPORTED_PROTOCOL_MESSAGE: &str = "engine debug protocol version is unsupported";
const SESSION_LIMIT_MESSAGE: &str = "engine debug session limit was reached";
const SESSION_NOT_FOUND_MESSAGE: &str = "engine debug session was not found";
const INTERNAL_ERROR_MESSAGE: &str = "engine debug host state is unavailable";

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum EngineDebugPolicy {
    Enabled,
    #[default]
    Disabled,
}

impl EngineDebugPolicy {
    pub fn from_local_config() -> Self {
        let configured = std::env::var(crate::waves_config::ENGINE_DEBUG_POLICY_ENV).ok();
        Self::from_config_value(configured.as_deref())
    }

    pub fn from_config_value(value: Option<&str>) -> Self {
        match value {
            Some(crate::waves_config::ENGINE_DEBUG_POLICY_ENABLED) => Self::Enabled,
            _ => Self::Disabled,
        }
    }

    pub fn is_enabled(self) -> bool {
        self == Self::Enabled
    }

    #[cfg(test)]
    pub(crate) fn from_enabled(enabled: bool) -> Self {
        if enabled {
            Self::Enabled
        } else {
            Self::Disabled
        }
    }
}

#[derive(Debug, Default)]
pub(crate) struct EngineDebugHostState {
    active_session_id: Option<String>,
}

fn failure(code: EngineDebugErrorCode, message: &'static str) -> EngineDebugError {
    EngineDebugError::new(code, message)
}

fn internal_failure<T>(_error: PoisonError<T>) -> EngineDebugError {
    failure(EngineDebugErrorCode::InternalError, INTERNAL_ERROR_MESSAGE)
}

fn lock_host(state: &AppState) -> Result<MutexGuard<'_, EngineDebugHostState>, EngineDebugError> {
    state.debug_host.lock().map_err(|error| {
        state.debug_host.clear_poison();
        internal_failure(error)
    })
}

fn lock_engine(state: &AppState) -> Result<MutexGuard<'_, WmlEngine>, EngineDebugError> {
    state.engine.lock().map_err(|error| {
        state.engine.clear_poison();
        internal_failure(error)
    })
}

fn require_session<'a>(
    host: &'a EngineDebugHostState,
    session_id: &str,
) -> Result<&'a str, EngineDebugError> {
    match host.active_session_id.as_deref() {
        Some(active) if active == session_id => Ok(active),
        _ => Err(failure(
            EngineDebugErrorCode::SessionNotFound,
            SESSION_NOT_FOUND_MESSAGE,
        )),
    }
}

pub fn command_engine_debug_open_session(
    state: &AppState,
    request: EngineDebugOpenSessionRequest,
) -> EngineDebugOpenSessionOutcome {
    if !state.debug_policy.is_enabled() {
        return EngineDebugOpenSessionOutcome::Failure {
            error: failure(EngineDebugErrorCode::DebugDisabled, DEBUG_DISABLED_MESSAGE),
        };
    }
    if request.protocol_version != ENGINE_DEBUG_PROTOCOL_VERSION {
        return EngineDebugOpenSessionOutcome::Failure {
            error: failure(
                EngineDebugErrorCode::UnsupportedProtocolVersion,
                UNSUPPORTED_PROTOCOL_MESSAGE,
            ),
        };
    }

    let mut host = match lock_host(state) {
        Ok(host) => host,
        Err(error) => return EngineDebugOpenSessionOutcome::Failure { error },
    };
    if host.active_session_id.is_some() {
        return EngineDebugOpenSessionOutcome::Failure {
            error: failure(
                EngineDebugErrorCode::SessionLimitReached,
                SESSION_LIMIT_MESSAGE,
            ),
        };
    }

    let mut engine = match lock_engine(state) {
        Ok(engine) => engine,
        Err(error) => return EngineDebugOpenSessionOutcome::Failure { error },
    };
    engine.set_debug_recording_enabled(true);
    let cursor = match engine.debug_event_cursor() {
        Ok(cursor) => cursor,
        Err(error) => {
            engine.set_debug_recording_enabled(false);
            return EngineDebugOpenSessionOutcome::Failure { error };
        }
    };
    let session_id = Uuid::new_v4().to_string();
    host.active_session_id = Some(session_id.clone());

    EngineDebugOpenSessionOutcome::Success {
        session: EngineDebugSession {
            session_id,
            cursor,
            capabilities: EngineDebugCapabilities::d0_baseline(),
        },
    }
}

pub fn command_engine_debug_poll_events(
    state: &AppState,
    request: EngineDebugPollEventsRequest,
) -> EngineDebugPollEventsOutcome {
    let host = match lock_host(state) {
        Ok(host) => host,
        Err(error) => return EngineDebugPollEventsOutcome::Failure { error },
    };
    if let Err(error) = require_session(&host, &request.session_id) {
        return EngineDebugPollEventsOutcome::Failure { error };
    }
    let engine = match lock_engine(state) {
        Ok(engine) => engine,
        Err(error) => return EngineDebugPollEventsOutcome::Failure { error },
    };
    match engine.poll_debug_events(&request.cursor, request.max_events) {
        Ok(batch) => EngineDebugPollEventsOutcome::Success { batch },
        Err(error) => EngineDebugPollEventsOutcome::Failure { error },
    }
}

pub fn command_engine_debug_get_snapshot(
    state: &AppState,
    request: EngineDebugSnapshotRequest,
) -> EngineDebugSnapshotOutcome {
    let host = match lock_host(state) {
        Ok(host) => host,
        Err(error) => return EngineDebugSnapshotOutcome::Failure { error },
    };
    if let Err(error) = require_session(&host, &request.session_id) {
        return EngineDebugSnapshotOutcome::Failure { error };
    }
    let engine = match lock_engine(state) {
        Ok(engine) => engine,
        Err(error) => return EngineDebugSnapshotOutcome::Failure { error },
    };
    match engine.debug_snapshot() {
        Ok(snapshot) => EngineDebugSnapshotOutcome::Success {
            snapshot: Box::new(snapshot),
        },
        Err(error) => EngineDebugSnapshotOutcome::Failure { error },
    }
}

pub fn command_engine_debug_close_session(
    state: &AppState,
    request: EngineDebugCloseSessionRequest,
) -> EngineDebugCloseSessionOutcome {
    let mut host = match lock_host(state) {
        Ok(host) => host,
        Err(error) => return EngineDebugCloseSessionOutcome::Failure { error },
    };
    if require_session(&host, &request.session_id).is_err() {
        return EngineDebugCloseSessionOutcome::Success {
            result: EngineDebugCloseSessionResult { closed: false },
        };
    }
    let mut engine = match lock_engine(state) {
        Ok(engine) => engine,
        Err(error) => return EngineDebugCloseSessionOutcome::Failure { error },
    };
    engine.set_debug_recording_enabled(false);
    host.active_session_id = None;
    EngineDebugCloseSessionOutcome::Success {
        result: EngineDebugCloseSessionResult { closed: true },
    }
}
