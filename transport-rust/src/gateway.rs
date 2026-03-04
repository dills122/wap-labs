use std::collections::HashMap;
use std::env;
use url::Url;

fn gateway_http_base() -> String {
    env::var("GATEWAY_HTTP_BASE").unwrap_or_else(|_| "http://localhost:13002".to_string())
}

pub(crate) fn build_gateway_request(
    original_url: &str,
    method: &str,
    headers: &HashMap<String, String>,
) -> Result<(String, HashMap<String, String>), String> {
    let parsed = Url::parse(original_url).map_err(|err| format!("invalid wap url: {err}"))?;
    if !matches!(parsed.scheme(), "wap" | "waps") {
        return Err(format!(
            "unsupported scheme for gateway bridge: {}",
            parsed.scheme()
        ));
    }
    if method != "GET" {
        return Err(format!(
            "WSP envelope only supports GET for MVP, got: {method}"
        ));
    }

    let base = Url::parse(&gateway_http_base())
        .map_err(|_| "GATEWAY_HTTP_BASE must be an absolute http(s) URL".to_string())?;
    if !matches!(base.scheme(), "http" | "https") || base.host_str().is_none() {
        return Err("GATEWAY_HTTP_BASE must be an absolute http(s) URL".to_string());
    }

    let mut request_url = base;
    request_url.set_path(parsed.path());
    request_url.set_query(parsed.query());

    let mut merged_headers = headers.clone();
    merged_headers
        .entry("X-Wap-Target-Url".to_string())
        .or_insert_with(|| original_url.to_string());

    Ok((request_url.to_string(), merged_headers))
}
