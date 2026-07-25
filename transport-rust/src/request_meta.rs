use serde_json::{Map, Value};

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
    let mut entry = Map::new();
    entry.insert("event".to_string(), Value::String(event.to_string()));
    entry.insert(
        "requestUrl".to_string(),
        Value::String(request_url.to_string()),
    );
    if let Some(id) = normalized_request_id(request_id) {
        entry.insert("requestId".to_string(), Value::String(id.to_string()));
    }
    entry.insert("payload".to_string(), payload);
    println!("{}", Value::Object(entry));
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
