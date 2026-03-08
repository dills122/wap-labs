use crate::waves_config;
use lowband_transport_rust::{
    fetch_deck_in_process, fetch_deck_in_process_with_profile, FetchDeckRequest, FetchDeckResponse,
    FetchDestinationPolicy, FetchRequestPolicy, FetchTransportProfile,
};
use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HostFetchTransportProfile {
    Auto,
    GatewayBridged,
    WapNetCore,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HostFetchTransportFallback {
    Disabled,
    GatewayBridged,
}

pub fn fetch_deck(mut request: FetchDeckRequest) -> FetchDeckResponse {
    ensure_request_id(&mut request);
    apply_default_destination_policy(&mut request);
    fetch_deck_with_transport_executor(request, |request, profile| match profile {
        Some(profile) => fetch_deck_in_process_with_profile(request, profile),
        None => fetch_deck_in_process(request),
    })
}

pub(crate) fn next_request_id() -> String {
    static REQUEST_SEQUENCE: AtomicU64 = AtomicU64::new(1);
    let seq = REQUEST_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    format!("{}{seq}", waves_config::FETCH_REQUEST_ID_PREFIX)
}

pub fn ensure_request_id(request: &mut FetchDeckRequest) {
    let keep_existing = request
        .request_id
        .as_ref()
        .map(|value| !value.trim().is_empty())
        .unwrap_or(false);
    if !keep_existing {
        request.request_id = Some(next_request_id());
    }
}

pub fn default_fetch_destination_policy() -> FetchDestinationPolicy {
    let configured = std::env::var(waves_config::FETCH_DESTINATION_POLICY_ENV)
        .unwrap_or_else(|_| waves_config::FETCH_DESTINATION_POLICY_DEFAULT.to_string());
    match configured.trim().to_ascii_lowercase().as_str() {
        waves_config::FETCH_DESTINATION_POLICY_ALLOW_PRIVATE => {
            FetchDestinationPolicy::AllowPrivate
        }
        _ => FetchDestinationPolicy::PublicOnly,
    }
}

pub fn default_fetch_transport_profile() -> HostFetchTransportProfile {
    let configured = std::env::var(waves_config::FETCH_TRANSPORT_PROFILE_ENV)
        .unwrap_or_else(|_| waves_config::FETCH_TRANSPORT_PROFILE_AUTO.to_string());
    match configured.trim().to_ascii_lowercase().as_str() {
        waves_config::FETCH_TRANSPORT_PROFILE_GATEWAY_BRIDGED => {
            HostFetchTransportProfile::GatewayBridged
        }
        waves_config::FETCH_TRANSPORT_PROFILE_WAP_NET_CORE => HostFetchTransportProfile::WapNetCore,
        _ => HostFetchTransportProfile::Auto,
    }
}

pub fn default_fetch_transport_fallback() -> HostFetchTransportFallback {
    let configured = std::env::var(waves_config::FETCH_TRANSPORT_FALLBACK_ENV)
        .unwrap_or_else(|_| waves_config::FETCH_TRANSPORT_FALLBACK_DISABLED.to_string());
    match configured.trim().to_ascii_lowercase().as_str() {
        waves_config::FETCH_TRANSPORT_FALLBACK_GATEWAY_BRIDGED => {
            HostFetchTransportFallback::GatewayBridged
        }
        _ => HostFetchTransportFallback::Disabled,
    }
}

pub fn apply_default_destination_policy(request: &mut FetchDeckRequest) {
    let default_policy = default_fetch_destination_policy();
    match request.request_policy.as_mut() {
        Some(policy) => {
            if policy.destination_policy.is_none() {
                policy.destination_policy = Some(default_policy);
            }
        }
        None => {
            request.request_policy = Some(FetchRequestPolicy {
                destination_policy: Some(default_policy),
                cache_control: None,
                referer_url: None,
                post_context: None,
                ua_capability_profile: None,
            });
        }
    }
}

pub(crate) fn fetch_deck_with_transport_executor(
    request: FetchDeckRequest,
    fetch_impl: impl Fn(FetchDeckRequest, Option<FetchTransportProfile>) -> FetchDeckResponse,
) -> FetchDeckResponse {
    let profile = default_fetch_transport_profile();
    let fallback = default_fetch_transport_fallback();
    let profile_override = resolve_transport_profile_override(profile, &request.url);
    let response = fetch_impl(request.clone(), profile_override);
    if should_retry_with_gateway_fallback(&request, &response, profile, fallback) {
        return fetch_impl(request, Some(FetchTransportProfile::GatewayBridged));
    }
    response
}

pub(crate) fn resolve_transport_profile_override(
    profile: HostFetchTransportProfile,
    url: &str,
) -> Option<FetchTransportProfile> {
    match profile {
        HostFetchTransportProfile::Auto => {
            has_wap_scheme(url).then_some(FetchTransportProfile::WapNetCore)
        }
        HostFetchTransportProfile::GatewayBridged => Some(FetchTransportProfile::GatewayBridged),
        HostFetchTransportProfile::WapNetCore => Some(FetchTransportProfile::WapNetCore),
    }
}

fn should_retry_with_gateway_fallback(
    request: &FetchDeckRequest,
    response: &FetchDeckResponse,
    profile: HostFetchTransportProfile,
    fallback: HostFetchTransportFallback,
) -> bool {
    if profile != HostFetchTransportProfile::WapNetCore
        || fallback != HostFetchTransportFallback::GatewayBridged
        || response.ok
    {
        return false;
    }

    let method = request
        .method
        .as_deref()
        .unwrap_or("GET")
        .trim()
        .eq_ignore_ascii_case("GET");
    if !method {
        return false;
    }

    let is_wap_scheme = has_wap_scheme(&request.url);
    if !is_wap_scheme {
        return false;
    }

    matches!(
        response.error.as_ref().map(|error| error.code.as_str()),
        Some("TRANSPORT_UNAVAILABLE" | "GATEWAY_TIMEOUT")
    )
}

fn has_wap_scheme(url: &str) -> bool {
    let Some((scheme, _)) = url.split_once(':') else {
        return false;
    };
    matches!(scheme.trim().to_ascii_lowercase().as_str(), "wap" | "waps")
}
