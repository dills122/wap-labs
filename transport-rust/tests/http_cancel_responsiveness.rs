use lowband_transport_rust::{
    fetch_deck_in_process_with_options_cancellable, FetchCancellationToken, FetchDeckRequest,
    FetchDestinationPolicy, FetchRequestPolicy, FetchTransportOptions, FetchTransportProfile,
};
use std::{
    io::{Read, Write},
    net::{Shutdown, TcpListener},
    sync::mpsc,
    thread,
    time::{Duration, Instant},
};

#[derive(Clone, Copy)]
enum Stall {
    Headers,
    Body,
}

fn cancellation_during(stall: Stall) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    listener.set_nonblocking(true).unwrap();
    let url = format!("http://{}/slow.wml", listener.local_addr().unwrap());
    let (ready_tx, ready_rx) = mpsc::channel();
    let (release_tx, release_rx) = mpsc::channel();
    let server = thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(3);
        let mut stream = loop {
            match listener.accept() {
                Ok((stream, _)) => break stream,
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                    if Instant::now() >= deadline {
                        return;
                    }
                    thread::sleep(Duration::from_millis(5));
                }
                Err(error) => panic!("accept failed: {error}"),
            }
        };
        stream.set_nonblocking(false).unwrap();
        stream
            .set_read_timeout(Some(Duration::from_secs(2)))
            .unwrap();
        let mut request = Vec::new();
        let mut buf = [0; 1024];
        while !request.windows(4).any(|bytes| bytes == b"\r\n\r\n") {
            match stream.read(&mut buf) {
                Ok(0) | Err(_) => return,
                Ok(count) => request.extend_from_slice(&buf[..count]),
            }
        }
        if matches!(stall, Stall::Body) {
            stream.write_all(b"HTTP/1.1 200 OK\r\nContent-Type: text/vnd.wap.wml\r\nContent-Length: 100\r\nConnection: close\r\n\r\n<").unwrap();
            stream.flush().unwrap();
        }
        let _ = ready_tx.send(());
        let _ = release_rx.recv_timeout(Duration::from_secs(4));
        let _ = stream.shutdown(Shutdown::Both);
    });

    let token = FetchCancellationToken::default();
    let fetch_token = token.clone();
    let (result_tx, result_rx) = mpsc::channel();
    let fetch = thread::spawn(move || {
        let response = fetch_deck_in_process_with_options_cancellable(
            FetchDeckRequest {
                url,
                method: Some("GET".into()),
                headers: None,
                timeout_ms: Some(5000),
                retries: Some(0),
                request_id: Some("http-cancel-test".into()),
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
                gateway_endpoint: None,
                expected_origin_instance_id: None,
            },
            fetch_token,
        );
        let _ = result_tx.send(response);
    });
    let ready = ready_rx.recv_timeout(Duration::from_secs(3));
    if ready.is_ok() && matches!(stall, Stall::Body) {
        // Give the client time to consume the partial body and enter its next read.
        thread::sleep(Duration::from_millis(150));
    }
    let start = Instant::now();
    token.cancel();
    let result = result_rx.recv_timeout(Duration::from_millis(500));
    let elapsed = start.elapsed();
    let _ = release_tx.send(());
    server.join().unwrap();
    fetch.join().unwrap();
    assert!(ready.is_ok(), "origin never observed the request");
    let response =
        result.unwrap_or_else(|_| panic!("HTTP cancellation did not finish within {elapsed:?}"));
    assert_eq!(response.error.unwrap().code, "CANCELLED");
}

#[test]
fn cancelling_while_waiting_for_http_headers_releases_the_fetch_promptly() {
    cancellation_during(Stall::Headers);
}

#[test]
fn cancelling_while_reading_a_partial_http_body_releases_the_fetch_promptly() {
    cancellation_during(Stall::Body);
}
