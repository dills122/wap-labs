use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use ts_rs::TS;

mod fetch_body;
mod fetch_policy;
mod fetch_runtime;
mod gateway;
mod native_fetch;
pub mod network;
mod request_meta;
mod request_serialization;
mod responses;
pub mod smpp_profile;
pub mod tcp_profile;
#[cfg(test)]
mod test_support;
mod wbxml;
mod wbxml_decoder;
pub mod wsp_capability;
pub mod wsp_connectionless_primitive_profile;
pub mod wsp_registry;
#[cfg(test)]
mod wtp_replay_window;

use fetch_runtime::fetch_deck_in_process_impl;
pub use request_meta::{is_sensitive_transport_field, redact_transport_url, TRANSPORT_TRACE_ENV};
pub use wbxml::preflight_wbxml_decoder;

pub const MAX_URI_OCTETS: usize = 1024;
pub const MAX_REQUEST_HEADER_COUNT: usize = 64;
pub const MAX_REQUEST_HEADER_BYTES: usize = 32 * 1024;
pub const MAX_REQUEST_ID_BYTES: usize = 128;
pub const MAX_REQUEST_METHOD_BYTES: usize = 16;
pub const MAX_POST_FIELD_COUNT: usize = 128;
pub const MAX_POST_FIELD_NAME_BYTES: usize = 256;
pub const MAX_POST_FIELD_VALUE_BYTES: usize = 16 * 1024;
pub const MAX_ENCODED_REQUEST_BODY_BYTES: usize = 64 * 1024;
pub const MAX_REQUEST_METADATA_BYTES: usize = 1024;
pub(crate) const MAX_RESPONSE_BODY_BYTES: usize = 512 * 1024;
pub(crate) const FETCH_ERROR_CODE_PAYLOAD_TOO_LARGE: &str = "PAYLOAD_TOO_LARGE";
pub(crate) const FETCH_ERROR_CODE_CANCELLED: &str = "CANCELLED";

#[derive(Clone, Copy, Debug, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchRequestIngressLimits {
    pub uri_bytes: u32,
    pub header_count: u32,
    pub header_bytes: u32,
    pub request_id_bytes: u32,
    pub method_bytes: u32,
    pub post_field_count: u32,
    pub post_field_name_bytes: u32,
    pub post_field_value_bytes: u32,
    pub encoded_body_bytes: u32,
    pub metadata_bytes: u32,
}

pub const FETCH_REQUEST_INGRESS_LIMITS: FetchRequestIngressLimits = FetchRequestIngressLimits {
    uri_bytes: MAX_URI_OCTETS as u32,
    header_count: MAX_REQUEST_HEADER_COUNT as u32,
    header_bytes: MAX_REQUEST_HEADER_BYTES as u32,
    request_id_bytes: MAX_REQUEST_ID_BYTES as u32,
    method_bytes: MAX_REQUEST_METHOD_BYTES as u32,
    post_field_count: MAX_POST_FIELD_COUNT as u32,
    post_field_name_bytes: MAX_POST_FIELD_NAME_BYTES as u32,
    post_field_value_bytes: MAX_POST_FIELD_VALUE_BYTES as u32,
    encoded_body_bytes: MAX_ENCODED_REQUEST_BODY_BYTES as u32,
    metadata_bytes: MAX_REQUEST_METADATA_BYTES as u32,
};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FetchRequestValidationError {
    field: &'static str,
    limit: usize,
    unit: &'static str,
}

impl FetchRequestValidationError {
    fn new(field: &'static str, limit: usize, unit: &'static str) -> Self {
        Self { field, limit, unit }
    }
}

impl std::fmt::Display for FetchRequestValidationError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            formatter,
            "{} exceeds the {}-{} limit",
            self.field, self.limit, self.unit
        )
    }
}

impl std::error::Error for FetchRequestValidationError {}

/// Cooperative cancellation shared with host adapters.
///
/// Blocking socket calls still obey their configured timeout, but cancellation
/// is observed before another attempt/fallback and before a completed response
/// is decoded or committed by the caller.
#[derive(Clone, Debug, Default)]
pub struct FetchCancellationToken {
    cancelled: Arc<AtomicBool>,
}

impl FetchCancellationToken {
    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::Release);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::Acquire)
    }
}

#[derive(Clone, Debug, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchDeckRequest {
    pub url: String,
    #[ts(optional)]
    pub method: Option<String>,
    #[ts(optional)]
    pub headers: Option<HashMap<String, String>>,
    #[ts(type = "number", optional)]
    pub timeout_ms: Option<u64>,
    #[ts(optional)]
    pub retries: Option<u8>,
    #[ts(optional)]
    pub request_id: Option<String>,
    #[ts(optional)]
    pub request_policy: Option<FetchRequestPolicy>,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum FetchCacheControlPolicy {
    Default,
    NoCache,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FetchPostContext {
    #[ts(optional)]
    pub same_deck: Option<bool>,
    #[ts(optional)]
    pub content_type: Option<String>,
    #[ts(optional)]
    pub payload: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FetchRequestMethod {
    Get,
    Post,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FetchRequestPostField {
    pub name: String,
    pub value: String,
}

/// Engine-authored WML request semantics consumed by the transport serializer.
///
/// The engine owns only the ordered semantic intent. The browser supplies the
/// referring deck content type as opaque source context; transport chooses the
/// submission charset, escapes fields, and constructs the wire request.
#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FetchRequestIntent {
    pub method: FetchRequestMethod,
    pub enctype: String,
    pub send_referer: bool,
    #[ts(optional)]
    pub accept_charset: Option<String>,
    pub same_deck: bool,
    pub post_fields: Vec<FetchRequestPostField>,
    #[ts(optional)]
    pub source_content_type: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FetchRequestPolicy {
    #[ts(optional)]
    pub destination_policy: Option<FetchDestinationPolicy>,
    #[ts(optional)]
    pub cache_control: Option<FetchCacheControlPolicy>,
    #[ts(optional)]
    pub referer_url: Option<String>,
    #[ts(optional)]
    pub post_context: Option<FetchPostContext>,
    #[ts(optional)]
    pub request_intent: Option<FetchRequestIntent>,
    #[ts(optional)]
    pub ua_capability_profile: Option<FetchUaCapabilityProfile>,
}

fn validate_optional_bytes(
    value: Option<&str>,
    field: &'static str,
    limit: usize,
) -> Result<(), FetchRequestValidationError> {
    if value.is_some_and(|value| value.len() > limit) {
        return Err(FetchRequestValidationError::new(field, limit, "byte"));
    }
    Ok(())
}

pub fn validate_fetch_deck_request(
    request: &FetchDeckRequest,
) -> Result<(), FetchRequestValidationError> {
    validate_optional_bytes(Some(&request.url), "request URL", MAX_URI_OCTETS)?;
    validate_optional_bytes(
        request.method.as_deref(),
        "request method",
        MAX_REQUEST_METHOD_BYTES,
    )?;
    validate_optional_bytes(
        request.request_id.as_deref(),
        "request identifier",
        MAX_REQUEST_ID_BYTES,
    )?;

    if let Some(headers) = request.headers.as_ref() {
        if headers.len() > MAX_REQUEST_HEADER_COUNT {
            return Err(FetchRequestValidationError::new(
                "request header count",
                MAX_REQUEST_HEADER_COUNT,
                "entry",
            ));
        }
        let mut total = 0usize;
        for (name, value) in headers {
            total = total
                .checked_add(name.len())
                .and_then(|sum| sum.checked_add(value.len()))
                .ok_or_else(|| {
                    FetchRequestValidationError::new(
                        "request header bytes",
                        MAX_REQUEST_HEADER_BYTES,
                        "byte",
                    )
                })?;
            if total > MAX_REQUEST_HEADER_BYTES {
                return Err(FetchRequestValidationError::new(
                    "request header bytes",
                    MAX_REQUEST_HEADER_BYTES,
                    "byte",
                ));
            }
        }
    }

    let Some(policy) = request.request_policy.as_ref() else {
        return Ok(());
    };
    validate_optional_bytes(
        policy.referer_url.as_deref(),
        "referring URL",
        MAX_URI_OCTETS,
    )?;
    if let Some(post_context) = policy.post_context.as_ref() {
        validate_optional_bytes(
            post_context.content_type.as_deref(),
            "POST content type",
            MAX_REQUEST_METADATA_BYTES,
        )?;
        validate_optional_bytes(
            post_context.payload.as_deref(),
            "legacy POST body",
            MAX_ENCODED_REQUEST_BODY_BYTES,
        )?;
    }
    if let Some(intent) = policy.request_intent.as_ref() {
        validate_optional_bytes(
            Some(&intent.enctype),
            "POST enctype",
            MAX_REQUEST_METADATA_BYTES,
        )?;
        validate_optional_bytes(
            intent.accept_charset.as_deref(),
            "POST accept-charset",
            MAX_REQUEST_METADATA_BYTES,
        )?;
        validate_optional_bytes(
            intent.source_content_type.as_deref(),
            "source content type",
            MAX_REQUEST_METADATA_BYTES,
        )?;
        if intent.post_fields.len() > MAX_POST_FIELD_COUNT {
            return Err(FetchRequestValidationError::new(
                "POST field count",
                MAX_POST_FIELD_COUNT,
                "entry",
            ));
        }
        for field in &intent.post_fields {
            validate_optional_bytes(
                Some(&field.name),
                "POST field name",
                MAX_POST_FIELD_NAME_BYTES,
            )?;
            validate_optional_bytes(
                Some(&field.value),
                "POST field value",
                MAX_POST_FIELD_VALUE_BYTES,
            )?;
        }
        if request_serialization::encoded_request_body_exceeds_limit(Some(policy)) {
            return Err(FetchRequestValidationError::new(
                "encoded request body",
                MAX_ENCODED_REQUEST_BODY_BYTES,
                "byte",
            ));
        }
    }
    Ok(())
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum FetchUaCapabilityProfile {
    Disabled,
    WapBaseline,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum FetchDestinationPolicy {
    PublicOnly,
    AllowPrivate,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FetchTransportProfile {
    GatewayBridged,
    WapNetCore,
}

/// Rust-only routing options for Lowband clients such as the diagnostic CLI.
///
/// `gateway_endpoint` is deliberately separate from [`FetchDeckRequest::url`]: the request URL
/// identifies the WAP resource, while the endpoint identifies the selected proxy/gateway peer.
/// Native WAP endpoints use `wap://host[:port]`; gateway-bridged endpoints use an absolute
/// `http://` or `https://` base URL. An explicit native endpoint may use a non-standard host-side
/// port (for example, an exact loopback container mapping); the UDP adapter permits only that
/// resolved peer, while resource URLs without an override remain restricted to WDP service ports.
/// When `expected_origin_instance_id` is present, native WAP replies must carry exactly one matching
/// `X-Waves-Origin-Instance` response header.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FetchTransportOptions {
    pub profile: FetchTransportProfile,
    pub gateway_endpoint: Option<String>,
    pub expected_origin_instance_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchTiming {
    pub encode: f64,
    pub udp_rtt: f64,
    pub decode: f64,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchErrorInfo {
    #[ts(
        type = "\"INVALID_REQUEST\" | \"GATEWAY_TIMEOUT\" | \"UNSUPPORTED_CONTENT_TYPE\" | \"WBXML_DECODE_FAILED\" | \"PROTOCOL_ERROR\" | \"PAYLOAD_TOO_LARGE\" | \"TRANSPORT_UNAVAILABLE\" | \"CANCELLED\""
    )]
    pub code: String,
    pub message: String,
    #[ts(type = "Record<string, unknown>", optional)]
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct EngineDeckInputPayload {
    pub wml_xml: String,
    pub base_url: String,
    pub content_type: String,
    #[ts(optional)]
    pub raw_bytes_base64: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct FetchDeckResponse {
    pub ok: bool,
    pub status: u16,
    pub final_url: String,
    pub content_type: String,
    #[ts(optional)]
    pub wml: Option<String>,
    #[ts(optional)]
    pub error: Option<FetchErrorInfo>,
    pub timing_ms: FetchTiming,
    #[ts(optional)]
    pub engine_deck_input: Option<EngineDeckInputPayload>,
}

pub fn fetch_deck_in_process(request: FetchDeckRequest) -> FetchDeckResponse {
    fetch_deck_in_process_impl(request, None, None)
}

pub fn fetch_deck_in_process_cancellable(
    request: FetchDeckRequest,
    cancellation: FetchCancellationToken,
) -> FetchDeckResponse {
    fetch_deck_in_process_impl(request, None, Some(cancellation))
}

pub fn cancelled_fetch_response(url: String, request_id: Option<&str>) -> FetchDeckResponse {
    responses::cancelled_response(url, request_id)
}

pub fn fetch_deck_in_process_with_profile(
    request: FetchDeckRequest,
    profile: FetchTransportProfile,
) -> FetchDeckResponse {
    fetch_deck_in_process_impl(
        request,
        Some(FetchTransportOptions {
            profile,
            gateway_endpoint: None,
            expected_origin_instance_id: None,
        }),
        None,
    )
}

pub fn fetch_deck_in_process_with_profile_cancellable(
    request: FetchDeckRequest,
    profile: FetchTransportProfile,
    cancellation: FetchCancellationToken,
) -> FetchDeckResponse {
    fetch_deck_in_process_impl(
        request,
        Some(FetchTransportOptions {
            profile,
            gateway_endpoint: None,
            expected_origin_instance_id: None,
        }),
        Some(cancellation),
    )
}

/// Fetches a deck with an explicit transport profile and optional gateway endpoint.
pub fn fetch_deck_in_process_with_options(
    request: FetchDeckRequest,
    options: FetchTransportOptions,
) -> FetchDeckResponse {
    fetch_deck_in_process_impl(request, Some(options), None)
}

/// Fetches a deck with explicit routing options and cooperative cancellation.
pub fn fetch_deck_in_process_with_options_cancellable(
    request: FetchDeckRequest,
    options: FetchTransportOptions,
    cancellation: FetchCancellationToken,
) -> FetchDeckResponse {
    fetch_deck_in_process_impl(request, Some(options), Some(cancellation))
}

#[cfg(test)]
mod tests;
