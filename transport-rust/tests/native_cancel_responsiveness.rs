use lowband_transport_rust::{
    fetch_deck_in_process_with_options_cancellable, FetchCancellationToken, FetchDeckRequest,
    FetchDestinationPolicy, FetchRequestPolicy, FetchTransportOptions, FetchTransportProfile,
};
use std::{
    net::UdpSocket,
    sync::mpsc,
    thread,
    time::{Duration, Instant},
};

#[test]
fn cancelling_a_silent_gateway_releases_the_native_fetch_promptly() {
    let gateway = UdpSocket::bind("127.0.0.1:0").unwrap();
    gateway
        .set_read_timeout(Some(Duration::from_secs(2)))
        .unwrap();
    let address = gateway.local_addr().unwrap();
    let (sent, received) = mpsc::channel();
    let server = thread::spawn(move || {
        let mut bytes = [0; 4096];
        gateway.recv_from(&mut bytes).unwrap();
        sent.send(()).unwrap();
    });
    let token = FetchCancellationToken::default();
    let fetch_token = token.clone();
    let fetch = thread::spawn(move || {
        fetch_deck_in_process_with_options_cancellable(
            FetchDeckRequest {
                url: "wap://localhost/slow.wml".into(),
                method: Some("GET".into()),
                headers: None,
                timeout_ms: Some(5000),
                retries: Some(1),
                request_id: Some("cancel-probe".into()),
                request_policy: Some(FetchRequestPolicy {
                    destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
                    cache_control: None,
                    referer_url: None,
                    post_context: None,
                    request_intent: None,
                    ua_capability_profile: None,
                }),
            },
            FetchTransportOptions {
                profile: FetchTransportProfile::WapNetCore,
                gateway_endpoint: Some(format!("wap://{address}")),
                expected_origin_instance_id: None,
            },
            fetch_token,
        )
    });
    received.recv_timeout(Duration::from_secs(2)).unwrap();
    let start = Instant::now();
    token.cancel();
    let response = fetch.join().unwrap();
    assert_eq!(response.error.unwrap().code, "CANCELLED");
    assert!(
        start.elapsed() < Duration::from_millis(500),
        "cancellation took {:?}",
        start.elapsed()
    );
    server.join().unwrap();
}

#[test]
fn cancellable_receive_preserves_the_configured_attempt_timeout() {
    let gateway = UdpSocket::bind("127.0.0.1:0").unwrap();
    let address = gateway.local_addr().unwrap();
    let start = Instant::now();
    let response = fetch_deck_in_process_with_options_cancellable(
        FetchDeckRequest {
            url: "wap://localhost/slow.wml".into(),
            method: Some("GET".into()),
            headers: None,
            timeout_ms: Some(350),
            retries: Some(0),
            request_id: Some("timeout-probe".into()),
            request_policy: Some(FetchRequestPolicy {
                destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
                cache_control: None,
                referer_url: None,
                post_context: None,
                request_intent: None,
                ua_capability_profile: None,
            }),
        },
        FetchTransportOptions {
            profile: FetchTransportProfile::WapNetCore,
            gateway_endpoint: Some(format!("wap://{address}")),
            expected_origin_instance_id: None,
        },
        FetchCancellationToken::default(),
    );
    assert_eq!(response.error.unwrap().code, "GATEWAY_TIMEOUT");
    assert!(
        start.elapsed() >= Duration::from_millis(300),
        "a polling interval must not become an early timeout"
    );
    assert!(
        start.elapsed() < Duration::from_secs(2),
        "configured timeout must remain bounded"
    );
    drop(gateway);
}
