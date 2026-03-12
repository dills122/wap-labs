use crate::{
    FetchCacheControlPolicy, FetchDestinationPolicy, FetchRequestPolicy, FetchUaCapabilityProfile,
};
use std::collections::HashMap;
use std::net::IpAddr;
use url::{Host, Url};

pub(crate) fn resolve_fetch_destination_policy(
    request_policy: Option<&FetchRequestPolicy>,
) -> FetchDestinationPolicy {
    request_policy
        .and_then(|policy| policy.destination_policy.clone())
        .unwrap_or(FetchDestinationPolicy::PublicOnly)
}

pub(crate) fn validate_fetch_destination(
    parsed_url: &Url,
    destination_policy: &FetchDestinationPolicy,
) -> Result<(), String> {
    if !matches!(parsed_url.scheme(), "http" | "https" | "wap" | "waps") {
        return Err(format!("Unsupported URL scheme: {}", parsed_url.scheme()));
    }
    if matches!(destination_policy, FetchDestinationPolicy::AllowPrivate) {
        return Ok(());
    }

    match classify_destination_host(parsed_url) {
        None | Some(DestinationHostClass::Public) => Ok(()),
        Some(class) => Err(format!(
            "Destination blocked by fetch policy (public-only): {} host",
            class.label()
        )),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum DestinationHostClass {
    Public,
    Loopback,
    Private,
    LinkLocal,
    Unspecified,
    Multicast,
}

impl DestinationHostClass {
    fn label(self) -> &'static str {
        match self {
            DestinationHostClass::Public => "public",
            DestinationHostClass::Loopback => "loopback",
            DestinationHostClass::Private => "private",
            DestinationHostClass::LinkLocal => "link-local",
            DestinationHostClass::Unspecified => "unspecified",
            DestinationHostClass::Multicast => "multicast",
        }
    }
}

pub(crate) fn classify_destination_host(parsed_url: &Url) -> Option<DestinationHostClass> {
    match parsed_url.host()? {
        Host::Domain(domain) => {
            let normalized = domain.trim().trim_end_matches('.').to_ascii_lowercase();
            if normalized == "localhost" || normalized.ends_with(".localhost") {
                Some(DestinationHostClass::Loopback)
            } else {
                Some(DestinationHostClass::Public)
            }
        }
        Host::Ipv4(ip) => Some(classify_ip(IpAddr::V4(ip))),
        Host::Ipv6(ip) => Some(classify_ip(IpAddr::V6(ip))),
    }
}

pub(crate) fn classify_ip(ip: IpAddr) -> DestinationHostClass {
    match ip {
        IpAddr::V4(v4) => {
            if v4.is_loopback() {
                DestinationHostClass::Loopback
            } else if v4.is_private() {
                DestinationHostClass::Private
            } else if v4.is_link_local() {
                DestinationHostClass::LinkLocal
            } else if v4.is_unspecified() {
                DestinationHostClass::Unspecified
            } else if v4.is_multicast() {
                DestinationHostClass::Multicast
            } else {
                DestinationHostClass::Public
            }
        }
        IpAddr::V6(v6) => {
            if v6.is_loopback() {
                DestinationHostClass::Loopback
            } else if v6.is_unique_local() {
                DestinationHostClass::Private
            } else if v6.is_unicast_link_local() {
                DestinationHostClass::LinkLocal
            } else if v6.is_unspecified() {
                DestinationHostClass::Unspecified
            } else if v6.is_multicast() {
                DestinationHostClass::Multicast
            } else {
                DestinationHostClass::Public
            }
        }
    }
}

pub(crate) fn apply_request_policy(
    method: String,
    mut outbound_headers: HashMap<String, String>,
    request_policy: Option<&FetchRequestPolicy>,
) -> (
    String,
    HashMap<String, String>,
    bool,
    FetchUaCapabilityProfile,
) {
    let mut normalized_method = method;
    let mut suppressed_same_deck_post_context = false;
    let mut applied_ua_capability_profile = FetchUaCapabilityProfile::Disabled;

    if let Some(policy) = request_policy {
        let ua_profile = policy
            .ua_capability_profile
            .clone()
            .unwrap_or(FetchUaCapabilityProfile::Disabled);
        applied_ua_capability_profile = ua_profile.clone();
        apply_ua_capability_headers(&mut outbound_headers, &ua_profile);

        if matches!(policy.cache_control, Some(FetchCacheControlPolicy::NoCache)) {
            outbound_headers.insert("Cache-Control".to_string(), "no-cache".to_string());
            outbound_headers.insert("Pragma".to_string(), "no-cache".to_string());
        }

        if let Some(referer) = policy
            .referer_url
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        {
            outbound_headers.insert("Referer".to_string(), referer.to_string());
        }

        if normalized_method == "POST" {
            let (same_deck, has_payload) = policy
                .post_context
                .as_ref()
                .map(|post| {
                    let payload = post
                        .payload
                        .as_deref()
                        .map(str::trim)
                        .filter(|value| !value.is_empty());
                    (post.same_deck.unwrap_or(false), payload.is_some())
                })
                .unwrap_or((false, false));
            let no_cache = matches!(policy.cache_control, Some(FetchCacheControlPolicy::NoCache));
            if same_deck && !no_cache && !has_payload {
                normalized_method = "GET".to_string();
                suppressed_same_deck_post_context = true;
            }
        }
    }

    (
        normalized_method,
        outbound_headers,
        suppressed_same_deck_post_context,
        applied_ua_capability_profile,
    )
}

fn apply_ua_capability_headers(
    outbound_headers: &mut HashMap<String, String>,
    profile: &FetchUaCapabilityProfile,
) {
    match profile {
        FetchUaCapabilityProfile::Disabled => {}
        FetchUaCapabilityProfile::WapBaseline => {
            outbound_headers
                .entry("Accept".to_string())
                .or_insert_with(|| {
                    "text/vnd.wap.wml, application/vnd.wap.wmlc, image/vnd.wap.wbmp; level=0"
                        .to_string()
                });
            outbound_headers
                .entry("Accept-Charset".to_string())
                .or_insert_with(|| "utf-8, us-ascii;q=0.8".to_string());
            outbound_headers
                .entry("Accept-Encoding".to_string())
                .or_insert_with(|| "identity".to_string());
            outbound_headers
                .entry("Accept-Language".to_string())
                .or_insert_with(|| "en".to_string());
        }
    }
}
