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
