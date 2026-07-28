use crate::{
    FetchCacheControlPolicy, FetchDestinationPolicy, FetchRequestPolicy, FetchUaCapabilityProfile,
};
use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr, ToSocketAddrs};
use url::{Host, Url};

pub(crate) fn resolve_fetch_destination_policy(
    request_policy: Option<&FetchRequestPolicy>,
) -> FetchDestinationPolicy {
    request_policy
        .and_then(|policy| policy.destination_policy.clone())
        .unwrap_or(FetchDestinationPolicy::PublicOnly)
}

/// Typed failure reason for destination validation and resolution.
///
/// Classification must never be re-derived by string-matching the rendered
/// message: `PolicyBlocked` is the only variant that maps to `INVALID_REQUEST`,
/// every other variant is a transport-level failure. The message text is kept
/// stable for logs and response payloads.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) enum FetchDestinationError {
    UnsupportedScheme(String),
    PolicyBlocked(String),
    Unresolvable(String),
}

impl FetchDestinationError {
    pub(crate) fn blocked_host(class: DestinationHostClass) -> Self {
        Self::PolicyBlocked(format!(
            "Destination blocked by fetch policy (public-only): {} host",
            class.label()
        ))
    }

    pub(crate) fn blocked_resolved_address(class: DestinationHostClass) -> Self {
        Self::PolicyBlocked(format!(
            "Destination blocked by fetch policy (public-only): resolved to {} address",
            class.label()
        ))
    }

    /// True when the failure is a policy decision (maps to `INVALID_REQUEST`)
    /// rather than a transport/resolution failure.
    pub(crate) fn is_policy_blocked(&self) -> bool {
        matches!(self, Self::PolicyBlocked(_))
    }
}

impl std::fmt::Display for FetchDestinationError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedScheme(scheme) => {
                write!(formatter, "Unsupported URL scheme: {scheme}")
            }
            Self::PolicyBlocked(message) | Self::Unresolvable(message) => {
                formatter.write_str(message)
            }
        }
    }
}

impl std::error::Error for FetchDestinationError {}

pub(crate) fn validate_fetch_destination(
    parsed_url: &Url,
    destination_policy: &FetchDestinationPolicy,
) -> Result<(), FetchDestinationError> {
    if !matches!(parsed_url.scheme(), "http" | "https" | "wap" | "waps") {
        return Err(FetchDestinationError::UnsupportedScheme(
            parsed_url.scheme().to_string(),
        ));
    }
    if matches!(destination_policy, FetchDestinationPolicy::AllowPrivate) {
        return Ok(());
    }

    match classify_destination_host(parsed_url) {
        None | Some(DestinationHostClass::Public) => Ok(()),
        Some(class) => Err(FetchDestinationError::blocked_host(class)),
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
            if let Some(mapped) = v6.to_ipv4_mapped() {
                return classify_ip(IpAddr::V4(mapped));
            }
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

pub(crate) fn resolve_fetch_destination_addresses(
    host: &str,
    port: u16,
    destination_policy: &FetchDestinationPolicy,
) -> Result<Vec<SocketAddr>, FetchDestinationError> {
    let addresses = (host, port)
        .to_socket_addrs()
        .map_err(|error| {
            FetchDestinationError::Unresolvable(format!(
                "failed to resolve destination {host}:{port}: {error}"
            ))
        })?
        .collect::<Vec<_>>();
    if addresses.is_empty() {
        return Err(FetchDestinationError::Unresolvable(format!(
            "failed to resolve destination {host}:{port}"
        )));
    }
    validate_resolved_destination_addresses(&addresses, destination_policy)?;
    Ok(addresses)
}

pub(crate) fn validate_resolved_destination_addresses(
    addresses: &[SocketAddr],
    destination_policy: &FetchDestinationPolicy,
) -> Result<(), FetchDestinationError> {
    if matches!(destination_policy, FetchDestinationPolicy::AllowPrivate) {
        return Ok(());
    }

    for address in addresses {
        let class = classify_ip(address.ip());
        if class != DestinationHostClass::Public {
            return Err(FetchDestinationError::blocked_resolved_address(class));
        }
    }
    Ok(())
}

/// Outcome of applying request policy to an outbound request.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct AppliedRequestPolicy {
    pub(crate) method: String,
    pub(crate) outbound_headers: HashMap<String, String>,
    pub(crate) suppressed_same_deck_post_context: bool,
    pub(crate) applied_ua_capability_profile: FetchUaCapabilityProfile,
}

pub(crate) fn apply_request_policy(
    method: String,
    mut outbound_headers: HashMap<String, String>,
    request_policy: Option<&FetchRequestPolicy>,
) -> AppliedRequestPolicy {
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

    AppliedRequestPolicy {
        method: normalized_method,
        outbound_headers,
        suppressed_same_deck_post_context,
        applied_ua_capability_profile,
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_fetch_destination_addresses_rejects_a_public_looking_host_that_resolves_private() {
        // A DNS-rebinding-style resolved answer: the host is an IP literal
        // here only to keep the test deterministic and offline (per
        // docs/agents/RUST_TRANSPORT_STEERING.md's no-external-network-in-
        // default-tests rule) -- `to_socket_addrs` on an IP literal doesn't
        // touch the network. `resolve_fetch_destination_addresses` classifies
        // whatever address the lookup actually returns, exactly as it would
        // for a hostname a DNS answer rebound to a private address.
        let error = resolve_fetch_destination_addresses(
            "10.0.0.1",
            80,
            &FetchDestinationPolicy::PublicOnly,
        )
        .expect_err("a resolved private address must be rejected under PublicOnly");

        assert!(error.is_policy_blocked());
        assert_eq!(
            error,
            FetchDestinationError::blocked_resolved_address(DestinationHostClass::Private)
        );
    }

    #[test]
    fn resolve_fetch_destination_addresses_allows_private_answer_under_allow_private() {
        let addresses = resolve_fetch_destination_addresses(
            "10.0.0.1",
            80,
            &FetchDestinationPolicy::AllowPrivate,
        )
        .expect("AllowPrivate must retain its documented behavior");
        assert_eq!(addresses, vec![SocketAddr::from(([10, 0, 0, 1], 80))]);
    }
}
