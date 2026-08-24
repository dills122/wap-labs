use serde::Deserialize;
use std::net::IpAddr;
use std::path::Path;
use std::sync::OnceLock;
use url::Url;

const MAX_ID_BYTES: usize = 63;
const MAX_MANIFEST_BYTES: u64 = 4096;
static FETCH_ROUTING_MANIFEST: OnceLock<Option<FetchRoutingManifest>> = OnceLock::new();

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FetchRoutingManifest {
    schema_version: u8,
    pub(crate) run_id: String,
    pub(crate) compose_project: String,
    pub(crate) gateway_endpoint: String,
    pub(crate) expected_origin_instance_id: String,
}

pub(crate) fn parse_fetch_routing_manifest(source: &str) -> Result<FetchRoutingManifest, String> {
    let manifest: FetchRoutingManifest = serde_json::from_str(source)
        .map_err(|error| format!("invalid routing manifest JSON: {error}"))?;
    if manifest.schema_version != 1 {
        return Err("routing manifest schemaVersion must be 1".to_string());
    }
    validate_id(&manifest.run_id, "runId")?;
    validate_id(&manifest.compose_project, "composeProject")?;
    if manifest.compose_project != manifest.run_id {
        return Err("routing manifest composeProject must match runId".to_string());
    }
    validate_id(
        &manifest.expected_origin_instance_id,
        "expectedOriginInstanceId",
    )?;
    validate_gateway_endpoint(&manifest.gateway_endpoint)?;
    Ok(manifest)
}

#[cfg_attr(test, allow(dead_code))]
pub(crate) fn initialize_fetch_routing_manifest() -> Result<(), String> {
    let configured = std::env::var(crate::waves_config::FETCH_ROUTING_MANIFEST_ENV).ok();
    let manifest = configured
        .map(|configured| load_fetch_routing_manifest(Path::new(&configured)))
        .transpose()?;
    FETCH_ROUTING_MANIFEST
        .set(manifest)
        .map_err(|_| "fetch routing manifest was initialized more than once".to_string())
}

pub(crate) fn configured_gateway_endpoint() -> Option<&'static str> {
    FETCH_ROUTING_MANIFEST
        .get()
        .and_then(Option::as_ref)
        .map(|manifest| manifest.gateway_endpoint.as_str())
}

pub(crate) fn load_fetch_routing_manifest(path: &Path) -> Result<FetchRoutingManifest, String> {
    if !path.is_absolute() {
        return Err("fetch routing manifest path must be absolute".to_string());
    }
    let metadata = std::fs::symlink_metadata(path)
        .map_err(|_| "fetch routing manifest is missing or unreadable".to_string())?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err("fetch routing manifest must be a regular non-symlink file".to_string());
    }
    if metadata.len() > MAX_MANIFEST_BYTES {
        return Err("fetch routing manifest exceeds 4096 bytes".to_string());
    }
    let source = std::fs::read_to_string(path)
        .map_err(|_| "fetch routing manifest is missing or unreadable".to_string())?;
    parse_fetch_routing_manifest(&source)
}

fn validate_id(value: &str, field: &str) -> Result<(), String> {
    let valid_length = !value.is_empty() && value.len() <= MAX_ID_BYTES;
    let valid_edges = value
        .as_bytes()
        .first()
        .is_some_and(u8::is_ascii_alphanumeric)
        && value
            .as_bytes()
            .last()
            .is_some_and(u8::is_ascii_alphanumeric);
    let valid_chars = value
        .bytes()
        .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-');
    if valid_length && valid_edges && valid_chars {
        Ok(())
    } else {
        Err(format!(
            "routing manifest {field} must be a bounded lowercase ASCII identifier"
        ))
    }
}

fn validate_gateway_endpoint(value: &str) -> Result<(), String> {
    let endpoint = Url::parse(value)
        .map_err(|_| "routing manifest gatewayEndpoint must be an absolute URL".to_string())?;
    if endpoint.scheme() != "wap" {
        return Err("routing manifest gatewayEndpoint must use wap://".to_string());
    }
    if !endpoint.username().is_empty() || endpoint.password().is_some() {
        return Err("routing manifest gatewayEndpoint must not contain credentials".to_string());
    }
    if !matches!(endpoint.path(), "" | "/")
        || endpoint.query().is_some()
        || endpoint.fragment().is_some()
    {
        return Err(
            "routing manifest gatewayEndpoint may contain only host and explicit port".to_string(),
        );
    }
    if endpoint.port().is_none() {
        return Err("routing manifest gatewayEndpoint must contain an explicit port".to_string());
    }
    let address = endpoint
        .host_str()
        .and_then(|host| host.parse::<IpAddr>().ok())
        .ok_or_else(|| {
            "routing manifest gatewayEndpoint must use an IP loopback host".to_string()
        })?;
    if address.is_loopback() {
        Ok(())
    } else {
        Err("routing manifest gatewayEndpoint must use an IP loopback host".to_string())
    }
}
