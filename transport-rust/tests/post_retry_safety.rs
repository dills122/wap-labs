use lowband_transport_rust::{
    fetch_deck_in_process, fetch_deck_in_process_cancellable, fetch_deck_in_process_with_options,
    FetchCancellationToken, FetchDeckRequest, FetchDestinationPolicy, FetchPostContext,
    FetchRequestIntent, FetchRequestMethod, FetchRequestPolicy, FetchRequestPostField,
    FetchTransportOptions, FetchTransportProfile,
};
use std::{
    io::Read,
    net::{TcpListener, UdpSocket},
    sync::mpsc,
    thread,
    time::{Duration, Instant},
};

fn request(url: String, method: &str) -> FetchDeckRequest {
    FetchDeckRequest {
        url,
        method: Some(method.into()),
        headers: None,
        timeout_ms: Some(150),
        retries: Some(1),
        request_id: Some("post-retry-safety".into()),
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: None,
            referer_url: None,
            post_context: (method == "POST").then(|| FetchPostContext {
                same_deck: None,
                content_type: Some("application/x-www-form-urlencoded".into()),
                payload: Some("field=value".into()),
            }),
            request_intent: None,
            ua_capability_profile: None,
        }),
    }
}

#[test]
fn cancelled_http_post_is_not_automatically_replayed() {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    listener.set_nonblocking(true).unwrap();
    let url = format!("http://{}/submit", listener.local_addr().unwrap());
    let (received_tx, received_rx) = mpsc::channel();
    let server = thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(2);
        let mut streams = Vec::new();
        while Instant::now() < deadline {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    stream.set_nonblocking(false).unwrap();
                    stream
                        .set_read_timeout(Some(Duration::from_millis(500)))
                        .unwrap();
                    let mut bytes = [0; 4096];
                    let n = stream.read(&mut bytes).unwrap();
                    assert!(bytes[..n].starts_with(b"POST "));
                    streams.push(stream);
                    if streams.len() == 1 {
                        let _ = received_tx.send(());
                    }
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(5))
                }
                Err(e) => panic!("accept failed: {e}"),
            }
        }
        streams.len()
    });
    let mut fetch = request(url, "POST");
    fetch.timeout_ms = Some(5000);
    fetch.retries = Some(2);
    let token = FetchCancellationToken::default();
    let fetch_token = token.clone();
    let worker = thread::spawn(move || fetch_deck_in_process_cancellable(fetch, fetch_token));
    let received = received_rx.recv_timeout(Duration::from_secs(1));
    token.cancel();
    let response = worker.join().unwrap();
    let count = server.join().unwrap();
    assert!(received.is_ok(), "POST must reach the controlled origin");
    assert_eq!(response.error.unwrap().code, "CANCELLED");
    assert_eq!(
        count, 1,
        "cancelled POST must not be automatically replayed"
    );
}

fn use_typed_post(fetch: &mut FetchDeckRequest) {
    fetch.method = Some("GET".into());
    let policy = fetch.request_policy.as_mut().unwrap();
    policy.post_context = None;
    policy.request_intent = Some(FetchRequestIntent {
        method: FetchRequestMethod::Post,
        enctype: "application/x-www-form-urlencoded".into(),
        send_referer: false,
        accept_charset: None,
        same_deck: false,
        post_fields: vec![FetchRequestPostField {
            name: "field".into(),
            value: "value".into(),
        }],
        source_content_type: None,
    });
}

fn observe_http(method: &str, typed_post: bool) -> (usize, String) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let url = format!("http://{}/submit", listener.local_addr().unwrap());
    listener.set_nonblocking(true).unwrap();
    let server = thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_millis(800);
        let mut methods = Vec::new();
        while Instant::now() < deadline {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    stream.set_nonblocking(false).unwrap();
                    stream
                        .set_read_timeout(Some(Duration::from_millis(200)))
                        .unwrap();
                    let mut bytes = [0; 4096];
                    let n = stream.read(&mut bytes).unwrap();
                    methods.push(
                        String::from_utf8_lossy(&bytes[..n])
                            .split_whitespace()
                            .next()
                            .unwrap()
                            .to_owned(),
                    );
                    thread::spawn(move || {
                        thread::sleep(Duration::from_millis(400));
                        drop(stream);
                    });
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(5))
                }
                Err(e) => panic!("accept failed: {e}"),
            }
        }
        methods
    });
    let mut fetch = request(url, method);
    if typed_post {
        use_typed_post(&mut fetch);
    }
    let response = fetch_deck_in_process(fetch);
    let observed = server.join().unwrap();
    assert!(observed.iter().all(|value| value == method));
    (observed.len(), response.error.unwrap().code)
}

#[test]
fn timed_out_http_post_is_not_automatically_replayed() {
    let (count, error) = observe_http("POST", false);
    assert_eq!(error, "GATEWAY_TIMEOUT");
    assert_eq!(
        count, 1,
        "a timed-out POST must not be automatically sent again"
    );
}

#[test]
fn timed_out_http_get_retains_configured_retry() {
    let (count, error) = observe_http("GET", false);
    assert_eq!(error, "GATEWAY_TIMEOUT");
    assert_eq!(count, 2, "safe GET requests retain the configured retry");
}

#[test]
fn typed_post_intent_cannot_inherit_get_retries() {
    let (count, error) = observe_http("POST", true);
    assert_eq!(error, "GATEWAY_TIMEOUT");
    assert_eq!(
        count, 1,
        "serialized POST intent must use the POST retry policy"
    );
}

#[test]
fn timed_out_connectionless_wsp_post_is_sent_only_once() {
    let gateway = UdpSocket::bind("127.0.0.1:0").unwrap();
    gateway
        .set_read_timeout(Some(Duration::from_millis(700)))
        .unwrap();
    let address = gateway.local_addr().unwrap();
    let server = thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_millis(700);
        let mut count = 0;
        let mut bytes = [0; 4096];
        while Instant::now() < deadline {
            match gateway.recv_from(&mut bytes) {
                Ok(_) => count += 1,
                Err(e)
                    if matches!(
                        e.kind(),
                        std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut
                    ) =>
                {
                    break
                }
                Err(e) => panic!("gateway receive failed: {e}"),
            }
        }
        count
    });
    let response = fetch_deck_in_process_with_options(
        request("wap://localhost/submit".into(), "POST"),
        FetchTransportOptions {
            profile: FetchTransportProfile::WapNetCore,
            gateway_endpoint: Some(format!("wap://{address}")),
            expected_origin_instance_id: None,
        },
    );
    assert_eq!(response.error.unwrap().code, "GATEWAY_TIMEOUT");
    assert_eq!(
        server.join().unwrap(),
        1,
        "a timed-out WSP POST must not be retransmitted"
    );
}

#[test]
#[ignore = "requires the isolated native E2E Kannel and fixture-enabled origin"]
fn kannel_timed_out_post_reaches_the_origin_only_once() {
    let gateway = std::env::var("WAP_GATEWAY_ENDPOINT").expect("owned gateway endpoint required");
    let origin = std::env::var("WML_INTERNAL_BASE").expect("owned origin endpoint required");
    let instance = std::env::var("WML_ORIGIN_INSTANCE_ID").expect("origin instance ID required");
    let action_id = "post-retry-native-a1";
    let mut warmup = request("wap://localhost/".into(), "GET");
    warmup.timeout_ms = Some(5000);
    let warmup_response = fetch_deck_in_process_with_options(
        warmup,
        FetchTransportOptions {
            profile: FetchTransportProfile::WapNetCore,
            gateway_endpoint: Some(gateway.clone()),
            expected_origin_instance_id: Some(instance.clone()),
        },
    );
    assert!(
        warmup_response.ok,
        "gateway warm-up failed: {:?}",
        warmup_response.error
    );
    let mut post = request(
        format!("wap://localhost/e2e/submission/{action_id}/slow.wml"),
        "POST",
    );
    use_typed_post(&mut post);
    post.timeout_ms = Some(2000);
    let response = fetch_deck_in_process_with_options(
        post,
        FetchTransportOptions {
            profile: FetchTransportProfile::WapNetCore,
            gateway_endpoint: Some(gateway.clone()),
            expected_origin_instance_id: Some(instance.clone()),
        },
    );
    assert!(!response.ok);
    assert_eq!(response.error.unwrap().code, "GATEWAY_TIMEOUT");
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .unwrap();
    let deadline = Instant::now() + Duration::from_secs(4);
    let oracle = format!("{origin}/e2e/actions/{action_id}");
    loop {
        let res = client.get(&oracle).send().unwrap();
        assert!(
            res.status().is_success(),
            "POST must reach the controlled origin; oracle returned {}",
            res.status()
        );
        assert_eq!(
            res.headers().get("x-waves-origin-instance").unwrap(),
            instance.as_str()
        );
        let value: serde_json::Value = serde_json::from_str(&res.text().unwrap()).unwrap();
        assert_eq!(value["actionId"], action_id);
        assert_eq!(value["kind"], "navigation");
        assert_eq!(
            value["count"], 1,
            "the origin must observe only one submission throughout the retry horizon"
        );
        if Instant::now() >= deadline {
            break;
        }
        thread::sleep(Duration::from_millis(100));
    }
    let mut recovery = request("wap://localhost/".into(), "GET");
    recovery.timeout_ms = Some(5000);
    let response = fetch_deck_in_process_with_options(
        recovery,
        FetchTransportOptions {
            profile: FetchTransportProfile::WapNetCore,
            gateway_endpoint: Some(gateway),
            expected_origin_instance_id: Some(instance),
        },
    );
    assert!(
        response.ok,
        "a valid deck must load after the timeout: {:?}",
        response.error
    );
}
