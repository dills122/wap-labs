use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

mod fetch_body;
mod fetch_policy;
mod fetch_runtime;
mod gateway;
mod native_fetch;
pub mod network;
mod request_meta;
mod responses;
pub mod smpp_profile;
pub mod tcp_profile;
#[cfg(test)]
mod test_support;
mod wbxml;
pub mod wsp_capability;
#[cfg(test)]
mod wsp_connectionless_primitive_profile;
pub mod wsp_registry;
#[cfg(test)]
mod wtp_replay_window;

use fetch_runtime::fetch_deck_in_process_impl;
pub use wbxml::preflight_wbxml_decoder;

pub(crate) const MAX_URI_OCTETS: usize = 1024;
pub(crate) const MAX_RESPONSE_BODY_BYTES: usize = 512 * 1024;

#[derive(Debug, Deserialize, TS)]
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
        type = "\"INVALID_REQUEST\" | \"GATEWAY_TIMEOUT\" | \"UNSUPPORTED_CONTENT_TYPE\" | \"WBXML_DECODE_FAILED\" | \"PROTOCOL_ERROR\" | \"TRANSPORT_UNAVAILABLE\""
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
    fetch_deck_in_process_impl(request)
}

#[cfg(test)]
mod tests;
