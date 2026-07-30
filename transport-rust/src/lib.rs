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

pub(crate) const MAX_URI_OCTETS: usize = 1024;
pub(crate) const MAX_RESPONSE_BODY_BYTES: usize = 512 * 1024;
pub(crate) const FETCH_ERROR_CODE_PAYLOAD_TOO_LARGE: &str = "PAYLOAD_TOO_LARGE";
pub(crate) const FETCH_ERROR_CODE_CANCELLED: &str = "CANCELLED";

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
/// `http://` or `https://` base URL.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FetchTransportOptions {
    pub profile: FetchTransportProfile,
    pub gateway_endpoint: Option<String>,
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

#[cfg(test)]
mod tests;
