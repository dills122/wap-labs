use std::collections::{HashMap, VecDeque};

use crate::{
    EngineDebugBufferSnapshot, EngineDebugError, EngineDebugErrorCode, EngineDebugEvent,
    EngineDebugEventBatch, EngineDebugEventPayload, EngineDebugRedactionReason, EngineDebugValue,
    ENGINE_DEBUG_EVENT_BUFFER_CAPACITY, ENGINE_DEBUG_MAX_EVENTS_PER_POLL,
    ENGINE_DEBUG_MAX_TEXT_BYTES,
};

#[derive(Clone, Debug)]
pub(crate) struct EngineDebugRecorder {
    events: VecDeque<EngineDebugEvent>,
    capacity: usize,
    next_seq: u64,
    dropped_count: u32,
    monotonic_time_ms: u32,
    masked_variables: HashMap<String, EngineDebugRedactionReason>,
}

impl EngineDebugRecorder {
    pub(crate) fn new() -> Self {
        Self::with_capacity(ENGINE_DEBUG_EVENT_BUFFER_CAPACITY as usize)
    }

    fn with_capacity(capacity: usize) -> Self {
        Self {
            events: VecDeque::with_capacity(capacity),
            capacity,
            next_seq: 1,
            dropped_count: 0,
            monotonic_time_ms: 0,
            masked_variables: HashMap::new(),
        }
    }

    pub(crate) fn record(&mut self, card_id: Option<String>, payload: EngineDebugEventPayload) {
        if self.capacity == 0 {
            return;
        }
        if self.events.len() == self.capacity {
            self.events.pop_front();
            self.dropped_count = self.dropped_count.saturating_add(1);
        }
        let kind = payload.kind();
        let event = EngineDebugEvent {
            seq: self.next_seq.to_string(),
            kind,
            monotonic_time_ms: self.monotonic_time_ms,
            card_id,
            payload,
        };
        debug_assert!(event.has_matching_kind());
        self.events.push_back(event);
        self.next_seq = self.next_seq.saturating_add(1);
    }

    pub(crate) fn advance_time(&mut self, delta_ms: u32) {
        self.monotonic_time_ms = self.monotonic_time_ms.saturating_add(delta_ms);
    }

    pub(crate) fn cursor(&self) -> String {
        self.latest_seq().unwrap_or(0).to_string()
    }

    pub(crate) fn poll(
        &self,
        cursor: &str,
        max_events: u16,
    ) -> Result<EngineDebugEventBatch, EngineDebugError> {
        if max_events == 0 || max_events > ENGINE_DEBUG_MAX_EVENTS_PER_POLL {
            return Err(debug_error(
                EngineDebugErrorCode::InvalidRequest,
                "debug event poll bounds are invalid",
            ));
        }
        let Some(cursor_seq) = parse_cursor(cursor) else {
            return Err(debug_error(
                EngineDebugErrorCode::InvalidCursor,
                "debug event cursor is invalid",
            ));
        };
        let latest_seq = self.latest_seq().unwrap_or(0);
        if cursor_seq > latest_seq {
            return Err(debug_error(
                EngineDebugErrorCode::InvalidCursor,
                "debug event cursor is invalid",
            ));
        }

        let oldest_seq = self.oldest_seq().unwrap_or(cursor_seq.saturating_add(1));
        let requested_seq = cursor_seq.saturating_add(1);
        let first_seq = requested_seq.max(oldest_seq);
        let dropped_count =
            u32::try_from(oldest_seq.saturating_sub(requested_seq)).unwrap_or(u32::MAX);
        let events: Vec<_> = self
            .events
            .iter()
            .filter(|event| parse_event_seq(event) >= first_seq)
            .take(max_events as usize)
            .cloned()
            .collect();
        let next_cursor = events
            .last()
            .map(|event| event.seq.clone())
            .unwrap_or_else(|| cursor.to_string());
        let next_seq = parse_cursor(&next_cursor).unwrap_or(cursor_seq);

        Ok(EngineDebugEventBatch {
            events,
            next_cursor,
            dropped_count,
            has_more: next_seq < latest_seq,
        })
    }

    pub(crate) fn buffer_snapshot(&self) -> EngineDebugBufferSnapshot {
        EngineDebugBufferSnapshot {
            oldest_seq: self.oldest_seq().map(|seq| seq.to_string()),
            latest_seq: self.latest_seq().map(|seq| seq.to_string()),
            dropped_count: self.dropped_count,
            capacity: self.capacity as u32,
        }
    }

    pub(crate) fn mark_variable(&mut self, name: String, reason: EngineDebugRedactionReason) {
        self.masked_variables
            .entry(name)
            .and_modify(|current| {
                if redaction_priority(&reason) < redaction_priority(current) {
                    *current = reason.clone();
                }
            })
            .or_insert(reason);
    }

    pub(crate) fn variable_reason(&self, name: &str) -> Option<EngineDebugRedactionReason> {
        self.masked_variables.get(name).cloned()
    }

    pub(crate) fn clear_variable_marks(&mut self) {
        self.masked_variables.clear();
    }

    fn oldest_seq(&self) -> Option<u64> {
        self.events.front().map(parse_event_seq)
    }

    fn latest_seq(&self) -> Option<u64> {
        self.events.back().map(parse_event_seq)
    }
}

pub(crate) fn redaction_priority(reason: &EngineDebugRedactionReason) -> u8 {
    match reason {
        EngineDebugRedactionReason::PasswordInput => 0,
        EngineDebugRedactionReason::SensitiveName => 1,
        EngineDebugRedactionReason::CredentialBearingUrl => 2,
        EngineDebugRedactionReason::TransportSecret => 3,
        EngineDebugRedactionReason::Policy => 4,
        EngineDebugRedactionReason::BoundedOutput => 5,
    }
}

fn parse_event_seq(event: &EngineDebugEvent) -> u64 {
    event
        .seq
        .parse()
        .expect("recorder-created decimal sequence must parse")
}

fn parse_cursor(cursor: &str) -> Option<u64> {
    let parsed = cursor.parse::<u64>().ok()?;
    (parsed.to_string() == cursor).then_some(parsed)
}

pub(crate) fn debug_error(code: EngineDebugErrorCode, message: &str) -> EngineDebugError {
    let retryable = matches!(
        code,
        EngineDebugErrorCode::SessionLimitReached
            | EngineDebugErrorCode::DebugSourceUnavailable
            | EngineDebugErrorCode::InternalError
    );
    EngineDebugError {
        code,
        message: message.to_string(),
        retryable,
    }
}

pub(crate) fn sanitize_text(
    value: &str,
    reason: Option<EngineDebugRedactionReason>,
) -> EngineDebugValue {
    if let Some(reason) = reason {
        return EngineDebugValue::Masked { reason };
    }
    if value.len() > ENGINE_DEBUG_MAX_TEXT_BYTES as usize {
        return EngineDebugValue::Omitted {
            reason: EngineDebugRedactionReason::BoundedOutput,
        };
    }
    EngineDebugValue::Visible {
        value: value.to_string(),
    }
}

pub(crate) fn sanitize_url(value: &str) -> EngineDebugValue {
    if url_contains_credentials(value) {
        return EngineDebugValue::Masked {
            reason: EngineDebugRedactionReason::CredentialBearingUrl,
        };
    }
    sanitize_text(value, None)
}

pub(crate) fn is_sensitive_name(name: &str) -> bool {
    const SENSITIVE: &[&str] = &[
        "pin",
        "pass",
        "passwd",
        "password",
        "secret",
        "token",
        "credential",
        "auth",
    ];

    let tokens = name_tokens(name);
    if tokens
        .iter()
        .any(|token| SENSITIVE.contains(&token.as_str()))
    {
        return true;
    }

    let collapsed = tokens.concat();
    collapsed.starts_with("pass")
        || collapsed.starts_with("auth")
        || collapsed.ends_with("auth")
        || ["passwd", "password", "secret", "token", "credential"]
            .iter()
            .any(|needle| collapsed.contains(needle))
}

fn name_tokens(name: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut previous_was_lower_or_digit = false;
    for character in name.chars() {
        if !character.is_ascii_alphanumeric() {
            if !current.is_empty() {
                tokens.push(std::mem::take(&mut current));
            }
            previous_was_lower_or_digit = false;
            continue;
        }
        if character.is_ascii_uppercase() && previous_was_lower_or_digit && !current.is_empty() {
            tokens.push(std::mem::take(&mut current));
        }
        current.push(character.to_ascii_lowercase());
        previous_was_lower_or_digit = character.is_ascii_lowercase() || character.is_ascii_digit();
    }
    if !current.is_empty() {
        tokens.push(current);
    }
    tokens
}

fn url_contains_credentials(value: &str) -> bool {
    if let Ok(parsed) = url::Url::parse(value) {
        if !parsed.username().is_empty() || parsed.password().is_some() {
            return true;
        }
        if parsed
            .query_pairs()
            .any(|(name, _)| sensitive_query_name(name.as_ref()))
        {
            return true;
        }
    }

    value
        .split_once('?')
        .map(|(_, query)| {
            url::form_urlencoded::parse(query.as_bytes())
                .any(|(name, _)| sensitive_query_name(name.as_ref()))
        })
        .unwrap_or(false)
}

fn sensitive_query_name(name: &str) -> bool {
    is_sensitive_name(name)
        || matches!(
            name.to_ascii_lowercase().as_str(),
            "api_key"
                | "apikey"
                | "access_key"
                | "signature"
                | "sig"
                | "sessionid"
                | "session_id"
                | "jwt"
                | "cookie"
        )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn payload(index: usize) -> EngineDebugEventPayload {
        EngineDebugEventPayload::InputEditDraft {
            name: "field".to_string(),
            value: EngineDebugValue::Visible {
                value: index.to_string(),
            },
        }
    }

    #[test]
    fn fixed_capacity_poll_resumes_at_oldest_and_reports_exact_gap() {
        let mut recorder = EngineDebugRecorder::with_capacity(3);
        for index in 0..5 {
            recorder.record(None, payload(index));
        }

        let batch = recorder.poll("0", 3).expect("old cursor should resume");
        assert_eq!(
            batch
                .events
                .iter()
                .map(|event| event.seq.as_str())
                .collect::<Vec<_>>(),
            ["3", "4", "5"]
        );
        assert_eq!(batch.dropped_count, 2);
        assert_eq!(batch.next_cursor, "5");
        assert!(!batch.has_more);
        assert_eq!(recorder.buffer_snapshot().dropped_count, 2);
    }

    #[test]
    fn polling_is_bounded_and_rejects_malformed_or_forward_cursors() {
        let mut recorder = EngineDebugRecorder::with_capacity(4);
        recorder.record(None, payload(1));
        recorder.record(None, payload(2));

        let first = recorder.poll("0", 1).expect("first page should poll");
        assert_eq!(first.events.len(), 1);
        assert_eq!(first.next_cursor, "1");
        assert!(first.has_more);

        for cursor in ["", "01", " 1", "3"] {
            assert_eq!(
                recorder.poll(cursor, 1).expect_err("cursor must fail").code,
                EngineDebugErrorCode::InvalidCursor
            );
        }
        assert_eq!(
            recorder
                .poll("0", 0)
                .expect_err("zero bound must fail")
                .code,
            EngineDebugErrorCode::InvalidRequest
        );
    }

    #[test]
    fn sanitizer_masks_sensitive_names_urls_and_oversized_values() {
        for name in [
            "PIN",
            "user_password",
            "authToken",
            "clientCredential",
            "passcode",
        ] {
            assert!(is_sensitive_name(name), "{name} should be sensitive");
        }
        assert!(!is_sensitive_name("shipping"));
        assert!(!is_sensitive_name("compassion"));
        assert!(matches!(
            sanitize_url("https://user:canary@example.test/path"),
            EngineDebugValue::Masked {
                reason: EngineDebugRedactionReason::CredentialBearingUrl
            }
        ));
        assert!(matches!(
            sanitize_url("/submit?access_token=canary"),
            EngineDebugValue::Masked {
                reason: EngineDebugRedactionReason::CredentialBearingUrl
            }
        ));
        assert!(matches!(
            sanitize_text(&"x".repeat(ENGINE_DEBUG_MAX_TEXT_BYTES as usize + 1), None),
            EngineDebugValue::Omitted {
                reason: EngineDebugRedactionReason::BoundedOutput
            }
        ));
    }
}
