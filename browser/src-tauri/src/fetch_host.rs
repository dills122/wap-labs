use crate::waves_config;
use lowband_transport_rust::{
    fetch_deck_in_process, FetchDeckRequest, FetchDeckResponse, FetchDestinationPolicy,
    FetchRequestPolicy,
};
use std::sync::atomic::{AtomicU64, Ordering};

pub fn fetch_deck(mut request: FetchDeckRequest) -> FetchDeckResponse {
    ensure_request_id(&mut request);
    apply_default_destination_policy(&mut request);
    fetch_deck_in_process(request)
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
