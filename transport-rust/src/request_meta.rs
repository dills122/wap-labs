use serde_json::{Map, Value};
use url::Url;

pub const TRANSPORT_TRACE_ENV: &str = "LOWBAND_TRANSPORT_TRACE";

pub(crate) fn normalized_request_id(value: Option<&str>) -> Option<&str> {
    value.and_then(|raw| {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    })
}

pub(crate) fn details_with_request_id(
    request_id: Option<&str>,
    details: Option<Value>,
) -> Option<Value> {
    let request_id = normalized_request_id(request_id)?;
    match details {
        Some(Value::Object(mut map)) => {
            map.insert(
                "requestId".to_string(),
                Value::String(request_id.to_string()),
            );
            Some(Value::Object(map))
        }
        Some(other) => Some(other),
        None => Some(serde_json::json!({ "requestId": request_id })),
    }
}

pub(crate) fn log_transport_event(
    event: &str,
    request_id: Option<&str>,
    request_url: &str,
    payload: Value,
) {
    if !transport_trace_enabled() {
        return;
    }
    let redacted_request_url = redact_transport_url(request_url);
    let payload = redact_event_value(payload, request_url, &redacted_request_url);
    let mut entry = Map::new();
    entry.insert("event".to_string(), Value::String(event.to_string()));
    entry.insert(
        "requestUrl".to_string(),
        Value::String(redacted_request_url),
    );
    if let Some(id) = normalized_request_id(request_id) {
        entry.insert("requestId".to_string(), Value::String(id.to_string()));
    }
    entry.insert("payload".to_string(), payload);
    eprintln!("{}", Value::Object(entry));
}

fn transport_trace_enabled() -> bool {
    !matches!(
        std::env::var(TRANSPORT_TRACE_ENV)
            .unwrap_or_else(|_| "on".to_string())
            .trim()
            .to_ascii_lowercase()
            .as_str(),
        "0" | "false" | "off"
    )
}

fn redact_event_value(value: Value, request_url: &str, redacted_request_url: &str) -> Value {
    match value {
        Value::Object(map) => Value::Object(
            map.into_iter()
                .map(|(key, value)| {
                    let lowered = key.to_ascii_lowercase();
                    let value = if is_sensitive_transport_field(&lowered) {
                        Value::String("<redacted>".to_string())
                    } else if lowered.contains("url") {
                        match value {
                            Value::String(url) => Value::String(redact_transport_url(&url)),
                            other => redact_event_value(other, request_url, redacted_request_url),
                        }
                    } else {
                        redact_event_value(value, request_url, redacted_request_url)
                    };
                    (key, value)
                })
                .collect(),
        ),
        Value::Array(values) => Value::Array(
            values
                .into_iter()
                .map(|value| redact_event_value(value, request_url, redacted_request_url))
                .collect(),
        ),
        Value::String(text) if !request_url.is_empty() && text.contains(request_url) => {
            Value::String(text.replace(request_url, redacted_request_url))
        }
        other => other,
    }
}

/// Redacts userinfo and known secret-bearing query values for diagnostics.
pub fn redact_transport_url(value: &str) -> String {
    let Ok(mut parsed) = Url::parse(value) else {
        return "<invalid-url>".to_string();
    };
    if !parsed.username().is_empty() {
        let _ = parsed.set_username("<redacted>");
    }
    if parsed.password().is_some() {
        let _ = parsed.set_password(Some("<redacted>"));
    }
    if parsed.query().is_some() {
        let pairs = parsed
            .query_pairs()
            .map(|(name, value)| {
                let value = if is_sensitive_transport_field(&name.to_ascii_lowercase()) {
                    "<redacted>".to_string()
                } else {
                    value.into_owned()
                };
                (name.into_owned(), value)
            })
            .collect::<Vec<_>>();
        parsed.query_pairs_mut().clear().extend_pairs(pairs);
    }
    parsed.to_string()
}

/// Returns whether a normalized field/header/query name is secret-bearing by default.
pub fn is_sensitive_transport_field(name: &str) -> bool {
    matches!(
        name,
        "authorization"
            | "cookie"
            | "credentials"
            | "password"
            | "passwd"
            | "pin"
            | "proxy-authorization"
            | "secret"
            | "session"
            | "sid"
            | "token"
    ) || name.ends_with("_key")
        || name.ends_with("-key")
        || name.ends_with("_token")
        || name.ends_with("-token")
}

/// Emits the retry-or-failure event for a consumed fetch attempt.
///
/// Attempts before the last one are logged as retries (carrying the next
/// attempt number); the final attempt is logged as a failure.
pub(crate) fn log_fetch_attempt_failure(
    request_id: Option<&str>,
    request_url: &str,
    attempt: u8,
    attempts: u8,
    is_timeout: bool,
    error: &str,
    elapsed_ms: f64,
) {
    if attempt < attempts {
        log_transport_event(
            "transport.fetch.retry",
            request_id,
            request_url,
            serde_json::json!({
                "attempt": attempt,
                "nextAttempt": attempt + 1,
                "attempts": attempts,
                "isTimeout": is_timeout,
                "error": error,
                "elapsedMs": elapsed_ms
            }),
        );
    } else {
        log_transport_event(
            "transport.fetch.failure",
            request_id,
            request_url,
            serde_json::json!({
                "attempt": attempt,
                "attempts": attempts,
                "isTimeout": is_timeout,
                "error": error,
                "elapsedMs": elapsed_ms
            }),
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trace_url_redacts_credentials_and_sensitive_query_values() {
        let redacted = redact_transport_url(
            "wap://alice:secret@example.test/path?card=home&pin=1234&session=abcdef",
        );
        assert!(!redacted.contains("alice"));
        assert!(!redacted.contains("secret"));
        assert!(!redacted.contains("1234"));
        assert!(!redacted.contains("abcdef"));
        assert!(redacted.contains("card=home"));
        assert!(redacted.contains("pin=%3Credacted%3E"));
    }

    #[test]
    fn trace_payload_redacts_header_like_secret_fields() {
        let value = redact_event_value(
            serde_json::json!({
                "Authorization": "Bearer do-not-print",
                "nested": { "cookie": "sid=secret", "status": 200 }
            }),
            "wap://example.test/",
            "wap://example.test/",
        );
        assert_eq!(value["Authorization"], "<redacted>");
        assert_eq!(value["nested"]["cookie"], "<redacted>");
        assert_eq!(value["nested"]["status"], 200);
    }
}
