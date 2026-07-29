use serde_json::Value;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::process::{Command, Output};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

const WML: &[u8] =
    br#"<?xml version="1.0"?><!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd"><wml><card id="home"/></wml>"#;

fn response(status: &str, content_type: &str, body: &[u8]) -> Vec<u8> {
    let mut response = format!(
        "HTTP/1.1 {status}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    )
    .into_bytes();
    response.extend_from_slice(body);
    response
}

fn serve_once(
    response: Vec<u8>,
    delay: Duration,
) -> (String, mpsc::Receiver<String>, thread::JoinHandle<()>) {
    let listener = TcpListener::bind("127.0.0.1:0").expect("fixture listener should bind");
    let address = listener
        .local_addr()
        .expect("fixture listener should have an address");
    let (request_tx, request_rx) = mpsc::channel();
    let handle = thread::spawn(move || {
        let (mut stream, _) = listener
            .accept()
            .expect("fixture should accept one request");
        stream
            .set_read_timeout(Some(Duration::from_secs(2)))
            .expect("read timeout should apply");
        let mut request = Vec::new();
        let mut buffer = [0u8; 1024];
        loop {
            match stream.read(&mut buffer) {
                Ok(0) => break,
                Ok(count) => {
                    request.extend_from_slice(&buffer[..count]);
                    if request.windows(4).any(|window| window == b"\r\n\r\n") {
                        break;
                    }
                }
                Err(error)
                    if matches!(
                        error.kind(),
                        std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut
                    ) =>
                {
                    break;
                }
                Err(error) => panic!("fixture request read failed: {error}"),
            }
        }
        let _ = request_tx.send(String::from_utf8_lossy(&request).into_owned());
        thread::sleep(delay);
        let _ = stream.write_all(&response);
    });
    (format!("http://{address}"), request_rx, handle)
}

fn run(arguments: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_wapcurl"))
        .args(arguments)
        .output()
        .expect("wapcurl should run")
}

fn assert_success(output: &Output) {
    assert!(
        output.status.success(),
        "expected success, status={:?}\nstdout={}\nstderr={}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn help_describes_bounded_curl_like_workflow() {
    let output = run(&["--help"]);
    assert_success(&output);
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Usage: wapcurl [OPTIONS] <URL>"));
    assert!(stdout.contains("--gateway <ENDPOINT>"));
    assert!(stdout.contains("--retry <COUNT>"));
    assert!(stdout.contains("--raw"));
    assert!(stdout.contains("--hex"));
    assert!(stdout.contains("--json"));
    assert!(stdout.contains("Redirects are limited to 10"));
}

#[test]
fn raw_hex_json_and_file_outputs_preserve_fixture_bytes() {
    let (base, _, handle) = serve_once(response("200 OK", "text/vnd.wap.wml", WML), Duration::ZERO);
    let output = run(&["--allow-private", "--raw", &format!("{base}/deck.wml")]);
    handle.join().expect("fixture should stop");
    assert_success(&output);
    assert_eq!(output.stdout, WML);
    assert!(String::from_utf8_lossy(&output.stderr).contains("decode: text-wml"));

    let (base, _, handle) = serve_once(response("200 OK", "text/vnd.wap.wml", WML), Duration::ZERO);
    let output = run(&["--allow-private", "--hex", &format!("{base}/deck.wml")]);
    handle.join().expect("fixture should stop");
    assert_success(&output);
    let hex = String::from_utf8_lossy(&output.stdout);
    assert!(hex.starts_with("00000000  3c 3f 78 6d"));
    assert!(hex.contains("|<?xml version=\"1|"));

    let (base, _, handle) = serve_once(response("200 OK", "text/vnd.wap.wml", WML), Duration::ZERO);
    let output = run(&["--allow-private", "--json", &format!("{base}/deck.wml")]);
    handle.join().expect("fixture should stop");
    assert_success(&output);
    assert!(
        output.stderr.is_empty(),
        "JSON mode should keep stderr clean"
    );
    let json: Value = serde_json::from_slice(&output.stdout).expect("JSON output should parse");
    assert_eq!(json["ok"], true);
    assert_eq!(json["byteCount"], WML.len());
    assert_eq!(json["decode"], "text-wml");
    assert_eq!(json["transport"], "http");

    let directory = tempfile::tempdir().expect("temp directory should create");
    let output_path = directory.path().join("deck.wml");
    let (base, _, handle) = serve_once(response("200 OK", "text/vnd.wap.wml", WML), Duration::ZERO);
    let output = Command::new(env!("CARGO_BIN_EXE_wapcurl"))
        .arg("--allow-private")
        .arg("--output")
        .arg(&output_path)
        .arg(format!("{base}/deck.wml"))
        .output()
        .expect("wapcurl should run");
    handle.join().expect("fixture should stop");
    assert_success(&output);
    assert!(output.stdout.is_empty());
    assert_eq!(
        std::fs::read(output_path).expect("saved output should read"),
        WML
    );
}

#[test]
fn request_headers_are_supported_and_verbose_trace_redacts_secrets() {
    let (base, request, handle) =
        serve_once(response("200 OK", "text/vnd.wap.wml", WML), Duration::ZERO);
    let target = format!("{base}/deck.wml?pin=1234&card=home");
    let output = run(&[
        "--allow-private",
        "--json",
        "--verbose",
        "--header",
        "X-Wap-Test: enabled",
        "--header",
        "Authorization: Bearer do-not-print",
        "--header",
        "Cookie: sid=also-secret",
        &target,
    ]);
    handle.join().expect("fixture should stop");
    assert_success(&output);
    let observed = request.recv().expect("request should be observed");
    assert!(observed.contains("x-wap-test: enabled"));
    assert!(observed.contains("authorization: Bearer do-not-print"));
    assert!(observed.contains("cookie: sid=also-secret"));

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    for secret in ["1234", "do-not-print", "also-secret"] {
        assert!(!stdout.contains(secret), "stdout leaked {secret}");
        assert!(!stderr.contains(secret), "stderr leaked {secret}");
    }
    assert!(stderr.contains("\"Authorization\":\"<redacted>\""));
    assert!(stderr.contains("\"Cookie\":\"<redacted>\""));
}

#[test]
fn public_identifier_four_has_specific_wml13_diagnostic_and_recovers_next_run() {
    let public_id_four = [0x03, 0x04, 0x6a, 0x00, 0x3f];
    let (gateway, _, handle) = serve_once(
        response("200 OK", "application/vnd.wap.wmlc", &public_id_four),
        Duration::ZERO,
    );
    let output = run(&[
        "--profile",
        "gateway-bridged",
        "--gateway",
        &gateway,
        "--allow-private",
        "wap://home.wap.shrimpworks.dev/examples/index.wml",
    ]);
    handle.join().expect("fixture should stop");
    assert_eq!(output.status.code(), Some(7));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(stderr.contains("outcome: WBXML_DECODE_FAILED"));
    assert!(
        stderr.contains("unsupported numeric public identifier 4; expected WML 1.3 identifier 10")
    );
    assert!(stderr.contains("decode: wbxml-error"));

    let (base, _, handle) = serve_once(response("200 OK", "text/vnd.wap.wml", WML), Duration::ZERO);
    let recovery = run(&["--allow-private", &format!("{base}/healthy.wml")]);
    handle.join().expect("fixture should stop");
    assert_success(&recovery);
    assert!(String::from_utf8_lossy(&recovery.stdout).contains("<card id=\"home\"/>"));
}

#[test]
fn malformed_wbxml_size_limit_timeout_policy_and_unreachable_host_have_exit_codes() {
    let (gateway, _, handle) = serve_once(
        response("200 OK", "application/vnd.wap.wmlc", &[0x03, 0x80]),
        Duration::ZERO,
    );
    let malformed = run(&[
        "--profile",
        "gateway-bridged",
        "--gateway",
        &gateway,
        "--allow-private",
        "wap://interop.wap.shrimpworks.dev/truncated",
    ]);
    handle.join().expect("fixture should stop");
    assert_eq!(malformed.status.code(), Some(7));
    assert!(String::from_utf8_lossy(&malformed.stderr).contains("truncated public identifier"));

    let (base, _, handle) = serve_once(
        response("200 OK", "application/json", br#"{\"not\":\"wml\"}"#),
        Duration::ZERO,
    );
    let unsupported = run(&["--allow-private", &format!("{base}/not-wml")]);
    handle.join().expect("fixture should stop");
    assert_eq!(unsupported.status.code(), Some(7));
    assert!(String::from_utf8_lossy(&unsupported.stderr).contains("UNSUPPORTED_CONTENT_TYPE"));

    let oversized_length = 524_289;
    let oversized_response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/vnd.wap.wml\r\nContent-Length: {oversized_length}\r\nConnection: close\r\n\r\n"
    )
    .into_bytes();
    let (base, _, handle) = serve_once(oversized_response, Duration::ZERO);
    let oversized = run(&["--allow-private", &format!("{base}/large.wml")]);
    handle.join().expect("fixture should stop");
    assert_eq!(oversized.status.code(), Some(8));
    assert!(String::from_utf8_lossy(&oversized.stderr).contains("PAYLOAD_TOO_LARGE"));

    let (base, _, handle) = serve_once(
        response("200 OK", "text/vnd.wap.wml", WML),
        Duration::from_millis(300),
    );
    let timed_out = run(&[
        "--allow-private",
        "--timeout-ms",
        "100",
        &format!("{base}/slow.wml"),
    ]);
    handle.join().expect("fixture should stop");
    assert_eq!(timed_out.status.code(), Some(4));
    assert!(String::from_utf8_lossy(&timed_out.stderr).contains("GATEWAY_TIMEOUT"));

    let policy = run(&["http://127.0.0.1:9/private.wml"]);
    assert_eq!(policy.status.code(), Some(3));
    assert!(String::from_utf8_lossy(&policy.stderr).contains("INVALID_REQUEST"));

    let unreachable = run(&[
        "--allow-private",
        "--timeout-ms",
        "100",
        "http://127.0.0.1:9/unreachable.wml",
    ]);
    assert_eq!(unreachable.status.code(), Some(5));
    assert!(String::from_utf8_lossy(&unreachable.stderr).contains("TRANSPORT_UNAVAILABLE"));
}
