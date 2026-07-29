use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use lowband_transport_rust::{
    fetch_deck_in_process_with_options, is_sensitive_transport_field, redact_transport_url,
    FetchDeckRequest, FetchDeckResponse, FetchDestinationPolicy, FetchRequestPolicy,
    FetchTransportOptions, FetchTransportProfile, TRANSPORT_TRACE_ENV,
};
use serde_json::json;
use std::collections::HashMap;
use std::ffi::OsString;
use std::io::{self, Write};
use std::path::PathBuf;
use std::time::Instant;
use url::Url;

const HELP: &str = r#"wapcurl - inspect WAP/WML services with Lowband

Usage: wapcurl [OPTIONS] <URL>

Options:
  --profile <PROFILE>       auto, wap-net-core, or gateway-bridged [default: auto]
  --gateway <ENDPOINT>      Native host[:port]/wap:// endpoint, or bridge http(s) base
  --allow-private           Permit loopback/private destinations for controlled local tests
  -H, --header <H: V>       Add a request header supported by the Lowband fetch contract
  --timeout-ms <MS>         Whole-request timeout, including connect [100..30000; default: 5000]
  --retry <COUNT>           Additional attempts [0..2; default: 0]
  --request-id <ID>         Correlation identifier for trace output
  --raw                     Write original response bytes to stdout
  --hex                     Write a deterministic hex dump to stdout
  -o, --output <FILE>       Save original response bytes instead of printing the body
  --json                    Emit one machine-readable JSON response
  -v, --verbose             Emit redacted Lowband transport trace events to stderr
  -h, --help                Print help
  -V, --version             Print version

The default output is decoded WML inspection. Metadata is written to stderr in a stable field
order. Redirects are limited to 10, response bodies to 524288 bytes, and retries to 2. Native
wap:// requests use bounded connectionless WSP over WDP/UDP; no fallback is automatic.
"#;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Profile {
    Auto,
    WapNetCore,
    GatewayBridged,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum OutputMode {
    Inspect,
    Raw,
    Hex,
    Json,
}

#[derive(Debug, PartialEq, Eq)]
struct Config {
    url: String,
    profile: Profile,
    gateway: Option<String>,
    allow_private: bool,
    headers: HashMap<String, String>,
    timeout_ms: u64,
    retries: u8,
    request_id: Option<String>,
    output_mode: OutputMode,
    output_path: Option<PathBuf>,
    verbose: bool,
}

#[derive(Debug, PartialEq, Eq)]
enum ParseOutcome {
    Run(Config),
    Help,
    Version,
}

fn main() {
    let exit_code = match parse_args(std::env::args_os().skip(1)) {
        Ok(ParseOutcome::Help) => {
            print!("{HELP}");
            0
        }
        Ok(ParseOutcome::Version) => {
            println!("wapcurl {}", env!("CARGO_PKG_VERSION"));
            0
        }
        Ok(ParseOutcome::Run(config)) => run(config),
        Err(message) => {
            eprintln!("wapcurl: {message}");
            eprintln!("Try 'wapcurl --help' for usage.");
            2
        }
    };
    std::process::exit(exit_code);
}

fn parse_args(arguments: impl IntoIterator<Item = OsString>) -> Result<ParseOutcome, String> {
    let mut arguments = arguments.into_iter();
    let mut profile = Profile::Auto;
    let mut gateway = None;
    let mut allow_private = false;
    let mut headers = HashMap::new();
    let mut timeout_ms = 5_000;
    let mut retries = 0;
    let mut request_id = None;
    let mut output_mode = OutputMode::Inspect;
    let mut selected_output_mode = false;
    let mut output_path = None;
    let mut verbose = false;
    let mut url = None;

    while let Some(argument) = arguments.next() {
        let argument = argument
            .into_string()
            .map_err(|_| "arguments must be valid UTF-8".to_string())?;
        match argument.as_str() {
            "-h" | "--help" => return Ok(ParseOutcome::Help),
            "-V" | "--version" => return Ok(ParseOutcome::Version),
            "--allow-private" => allow_private = true,
            "-v" | "--verbose" => verbose = true,
            "--profile" => {
                profile = match next_value(&mut arguments, "--profile")?.as_str() {
                    "auto" => Profile::Auto,
                    "wap-net-core" => Profile::WapNetCore,
                    "gateway-bridged" => Profile::GatewayBridged,
                    value => return Err(format!("unsupported profile: {value}")),
                };
            }
            "--gateway" => gateway = Some(next_value(&mut arguments, "--gateway")?),
            "-H" | "--header" => {
                let header = next_value(&mut arguments, "--header")?;
                let (name, value) = parse_header(&header)?;
                headers.insert(name, value);
            }
            "--timeout-ms" => {
                let value = next_value(&mut arguments, "--timeout-ms")?;
                timeout_ms = value
                    .parse::<u64>()
                    .map_err(|_| "--timeout-ms must be an integer".to_string())?;
                if !(100..=30_000).contains(&timeout_ms) {
                    return Err("--timeout-ms must be between 100 and 30000".to_string());
                }
            }
            "--retry" => {
                let value = next_value(&mut arguments, "--retry")?;
                retries = value
                    .parse::<u8>()
                    .map_err(|_| "--retry must be an integer".to_string())?;
                if retries > 2 {
                    return Err("--retry must be between 0 and 2".to_string());
                }
            }
            "--request-id" => {
                let value = next_value(&mut arguments, "--request-id")?;
                if value.trim().is_empty() {
                    return Err("--request-id must not be empty".to_string());
                }
                request_id = Some(value);
            }
            "--raw" => {
                set_output_mode(&mut output_mode, &mut selected_output_mode, OutputMode::Raw)?
            }
            "--hex" => {
                set_output_mode(&mut output_mode, &mut selected_output_mode, OutputMode::Hex)?
            }
            "--json" => set_output_mode(
                &mut output_mode,
                &mut selected_output_mode,
                OutputMode::Json,
            )?,
            "-o" | "--output" => {
                if output_path.is_some() {
                    return Err("--output may be specified only once".to_string());
                }
                output_path = Some(PathBuf::from(next_value(&mut arguments, "--output")?));
            }
            "--" => {
                let value = next_value(&mut arguments, "--")?;
                if url.replace(value).is_some() || arguments.next().is_some() {
                    return Err("exactly one URL is required".to_string());
                }
                break;
            }
            value if value.starts_with('-') => return Err(format!("unknown option: {value}")),
            value => {
                if url.replace(value.to_string()).is_some() {
                    return Err("exactly one URL is required".to_string());
                }
            }
        }
    }

    if output_path.is_some() && selected_output_mode {
        return Err("--output cannot be combined with --raw, --hex, or --json".to_string());
    }
    let url = url.ok_or_else(|| "a URL is required".to_string())?;
    validate_request_url(&url)?;
    let scheme = Url::parse(&url)
        .map(|url| url.scheme().to_string())
        .unwrap_or_default();
    if gateway.is_some() && !matches!(scheme.as_str(), "wap" | "waps") {
        return Err("--gateway is only valid for wap:// or waps:// resource URLs".to_string());
    }

    Ok(ParseOutcome::Run(Config {
        url,
        profile,
        gateway,
        allow_private,
        headers,
        timeout_ms,
        retries,
        request_id,
        output_mode,
        output_path,
        verbose,
    }))
}

fn next_value(
    arguments: &mut impl Iterator<Item = OsString>,
    option: &str,
) -> Result<String, String> {
    arguments
        .next()
        .ok_or_else(|| format!("{option} requires a value"))?
        .into_string()
        .map_err(|_| format!("{option} value must be valid UTF-8"))
}

fn parse_header(header: &str) -> Result<(String, String), String> {
    let (name, value) = header
        .split_once(':')
        .ok_or_else(|| "headers must use 'Name: value' syntax".to_string())?;
    let name = name.trim();
    if name.is_empty()
        || !name
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"!#$%&'*+-.^_|~".contains(&byte))
    {
        return Err("header name contains invalid characters".to_string());
    }
    let value = value.trim();
    if value.contains(['\r', '\n']) {
        return Err("header values must not contain line breaks".to_string());
    }
    Ok((name.to_string(), value.to_string()))
}

fn set_output_mode(
    current: &mut OutputMode,
    selected: &mut bool,
    requested: OutputMode,
) -> Result<(), String> {
    if *selected {
        return Err("choose only one of --raw, --hex, or --json".to_string());
    }
    *current = requested;
    *selected = true;
    Ok(())
}

fn validate_request_url(value: &str) -> Result<(), String> {
    let parsed =
        Url::parse(value).map_err(|_| "URL must be absolute and include a scheme".to_string())?;
    if !matches!(parsed.scheme(), "http" | "https" | "wap" | "waps") {
        return Err(format!("unsupported URL scheme: {}", parsed.scheme()));
    }
    if parsed.host_str().is_none() {
        return Err("URL must include a host".to_string());
    }
    Ok(())
}

fn run(config: Config) -> i32 {
    let parsed = Url::parse(&config.url).expect("validated URL should parse");
    let profile = match config.profile {
        Profile::Auto if matches!(parsed.scheme(), "wap" | "waps") => {
            FetchTransportProfile::WapNetCore
        }
        Profile::Auto => FetchTransportProfile::GatewayBridged,
        Profile::WapNetCore => FetchTransportProfile::WapNetCore,
        Profile::GatewayBridged => FetchTransportProfile::GatewayBridged,
    };
    let gateway_endpoint =
        match normalize_gateway(config.gateway.as_deref(), profile, parsed.scheme()) {
            Ok(endpoint) => endpoint,
            Err(message) => {
                eprintln!("wapcurl: {message}");
                return 2;
            }
        };

    std::env::set_var(
        TRANSPORT_TRACE_ENV,
        if config.verbose { "on" } else { "off" },
    );
    if config.verbose {
        emit_cli_trace(&config, profile, gateway_endpoint.as_deref());
    }

    let request = FetchDeckRequest {
        url: config.url.clone(),
        method: Some("GET".to_string()),
        headers: (!config.headers.is_empty()).then_some(config.headers.clone()),
        timeout_ms: Some(config.timeout_ms),
        retries: Some(config.retries),
        request_id: config
            .request_id
            .clone()
            .or_else(|| Some("wapcurl-1".to_string())),
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(if config.allow_private {
                FetchDestinationPolicy::AllowPrivate
            } else {
                FetchDestinationPolicy::PublicOnly
            }),
            cache_control: None,
            referer_url: None,
            post_context: None,
            request_intent: None,
            ua_capability_profile: None,
        }),
    };
    let wall_start = Instant::now();
    let response = fetch_deck_in_process_with_options(
        request,
        FetchTransportOptions {
            profile,
            gateway_endpoint: gateway_endpoint.clone(),
        },
    );
    let wall_elapsed_ms = wall_start.elapsed().as_secs_f64() * 1000.0;
    let body = response_body_bytes(&response);
    let transport = transport_classification(parsed.scheme(), profile);
    let decode = decode_classification(&response);

    if config.output_mode == OutputMode::Json {
        if let Err(error) = write_json_response(
            &config,
            &response,
            body.as_deref(),
            wall_elapsed_ms,
            transport,
            decode,
            gateway_endpoint.as_deref(),
        ) {
            eprintln!("wapcurl: failed to write JSON output: {error}");
            return 9;
        }
    } else {
        write_metadata(
            &config,
            &response,
            body.as_deref(),
            wall_elapsed_ms,
            transport,
            decode,
            gateway_endpoint.as_deref(),
        );
        if response.ok {
            if let Err(error) = write_body(&config, &response, body.as_deref()) {
                eprintln!("wapcurl: failed to write response body: {error}");
                return 9;
            }
        }
    }

    exit_code_for_response(&response)
}

fn normalize_gateway(
    gateway: Option<&str>,
    profile: FetchTransportProfile,
    resource_scheme: &str,
) -> Result<Option<String>, String> {
    let Some(gateway) = gateway else {
        return Ok(None);
    };
    let normalized = match profile {
        FetchTransportProfile::WapNetCore if gateway.contains("://") => gateway.to_string(),
        FetchTransportProfile::WapNetCore => format!("{resource_scheme}://{gateway}"),
        FetchTransportProfile::GatewayBridged => gateway.to_string(),
    };
    let parsed =
        Url::parse(&normalized).map_err(|_| "--gateway endpoint is malformed".to_string())?;
    let valid_scheme = match profile {
        FetchTransportProfile::WapNetCore => matches!(parsed.scheme(), "wap" | "waps"),
        FetchTransportProfile::GatewayBridged => matches!(parsed.scheme(), "http" | "https"),
    };
    if !valid_scheme || parsed.host_str().is_none() {
        return Err(match profile {
            FetchTransportProfile::WapNetCore => {
                "native --gateway must be host[:port] or an absolute wap:// URL".to_string()
            }
            FetchTransportProfile::GatewayBridged => {
                "bridged --gateway must be an absolute http:// or https:// URL".to_string()
            }
        });
    }
    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err("--gateway must not contain credentials".to_string());
    }
    Ok(Some(normalized))
}

fn response_body_bytes(response: &FetchDeckResponse) -> Option<Vec<u8>> {
    let deck = response.engine_deck_input.as_ref()?;
    match deck.raw_bytes_base64.as_deref() {
        Some(encoded) => BASE64.decode(encoded).ok(),
        None => Some(deck.wml_xml.as_bytes().to_vec()),
    }
}

fn transport_classification(scheme: &str, profile: FetchTransportProfile) -> &'static str {
    if matches!(scheme, "http" | "https") {
        "http"
    } else {
        match profile {
            FetchTransportProfile::WapNetCore => "wsp-connectionless/wdp-udp",
            FetchTransportProfile::GatewayBridged => "gateway-bridged/http",
        }
    }
}

fn decode_classification(response: &FetchDeckResponse) -> &'static str {
    if response.content_type == "application/vnd.wap.wmlc" {
        if response.ok {
            "wbxml-to-wml"
        } else {
            "wbxml-error"
        }
    } else if response.ok {
        "text-wml"
    } else if response
        .error
        .as_ref()
        .is_some_and(|error| error.code == "UNSUPPORTED_CONTENT_TYPE")
    {
        "unsupported-content-type"
    } else {
        "not-decoded"
    }
}

fn write_metadata(
    config: &Config,
    response: &FetchDeckResponse,
    body: Option<&[u8]>,
    wall_elapsed_ms: f64,
    transport: &str,
    decode: &str,
    gateway_endpoint: Option<&str>,
) {
    eprintln!("requested-url: {}", redact_transport_url(&config.url));
    eprintln!("final-url: {}", redact_transport_url(&response.final_url));
    if let Some(endpoint) = gateway_endpoint {
        eprintln!("gateway: {}", redact_transport_url(endpoint));
    }
    eprintln!("status: {}", response.status);
    eprintln!(
        "outcome: {}",
        response
            .error
            .as_ref()
            .map(|error| error.code.as_str())
            .unwrap_or("success")
    );
    eprintln!("content-type: {}", response.content_type);
    eprintln!("bytes: {}", body.map_or(0, <[u8]>::len));
    eprintln!("elapsed-ms: {wall_elapsed_ms:.3}");
    eprintln!("transport: {transport}");
    eprintln!("decode: {decode}");
    if let Some(error) = response.error.as_ref() {
        eprintln!("error: {}", redact_text(&error.message, &config.url));
    }
}

#[allow(clippy::too_many_arguments)]
fn write_json_response(
    config: &Config,
    response: &FetchDeckResponse,
    body: Option<&[u8]>,
    wall_elapsed_ms: f64,
    transport: &str,
    decode: &str,
    gateway_endpoint: Option<&str>,
) -> io::Result<()> {
    let value = json!({
        "requestedUrl": redact_transport_url(&config.url),
        "finalUrl": redact_transport_url(&response.final_url),
        "gateway": gateway_endpoint.map(redact_transport_url),
        "ok": response.ok,
        "status": response.status,
        "outcome": response.error.as_ref().map(|error| error.code.as_str()).unwrap_or("success"),
        "contentType": response.content_type,
        "byteCount": body.map_or(0, <[u8]>::len),
        "elapsedMs": (wall_elapsed_ms * 1000.0).round() / 1000.0,
        "transport": transport,
        "decode": decode,
        "wml": response.wml,
        "rawBytesBase64": body.map(|bytes| BASE64.encode(bytes)),
        "error": response.error.as_ref().map(|error| json!({
            "code": error.code,
            "message": redact_text(&error.message, &config.url),
        })),
    });
    let mut stdout = io::stdout().lock();
    serde_json::to_writer(&mut stdout, &value)?;
    stdout.write_all(b"\n")
}

fn write_body(
    config: &Config,
    response: &FetchDeckResponse,
    body: Option<&[u8]>,
) -> io::Result<()> {
    if let Some(path) = config.output_path.as_ref() {
        let bytes = body.ok_or_else(|| io::Error::other("raw response bytes are unavailable"))?;
        return std::fs::write(path, bytes);
    }

    let mut stdout = io::stdout().lock();
    match config.output_mode {
        OutputMode::Inspect => {
            let wml = response
                .wml
                .as_deref()
                .ok_or_else(|| io::Error::other("decoded WML is unavailable"))?;
            stdout.write_all(wml.as_bytes())?;
            if !wml.ends_with('\n') {
                stdout.write_all(b"\n")?;
            }
            Ok(())
        }
        OutputMode::Raw => stdout
            .write_all(body.ok_or_else(|| io::Error::other("raw response bytes are unavailable"))?),
        OutputMode::Hex => {
            let bytes =
                body.ok_or_else(|| io::Error::other("raw response bytes are unavailable"))?;
            stdout.write_all(hex_dump(bytes).as_bytes())
        }
        OutputMode::Json => unreachable!("JSON output is handled separately"),
    }
}

fn hex_dump(bytes: &[u8]) -> String {
    let mut output = String::new();
    for (line, chunk) in bytes.chunks(16).enumerate() {
        use std::fmt::Write as _;
        let _ = write!(output, "{:08x}  ", line * 16);
        for index in 0..16 {
            if let Some(byte) = chunk.get(index) {
                let _ = write!(output, "{byte:02x} ");
            } else {
                output.push_str("   ");
            }
            if index == 7 {
                output.push(' ');
            }
        }
        output.push_str(" |");
        for byte in chunk {
            output.push(if byte.is_ascii_graphic() || *byte == b' ' {
                char::from(*byte)
            } else {
                '.'
            });
        }
        output.push_str("|\n");
    }
    output
}

fn emit_cli_trace(config: &Config, profile: FetchTransportProfile, gateway_endpoint: Option<&str>) {
    let headers = config
        .headers
        .iter()
        .map(|(name, value)| {
            let value = if is_sensitive_transport_field(&name.to_ascii_lowercase()) {
                "<redacted>"
            } else {
                value
            };
            (name, value)
        })
        .collect::<std::collections::BTreeMap<_, _>>();
    eprintln!(
        "{}",
        json!({
            "event": "wapcurl.request",
            "requestUrl": redact_transport_url(&config.url),
            "profile": match profile {
                FetchTransportProfile::WapNetCore => "wap-net-core",
                FetchTransportProfile::GatewayBridged => "gateway-bridged",
            },
            "gateway": gateway_endpoint.map(redact_transport_url),
            "timeoutMs": config.timeout_ms,
            "attempts": config.retries + 1,
            "headers": headers,
        })
    );
}

fn redact_text(text: &str, request_url: &str) -> String {
    text.replace(request_url, &redact_transport_url(request_url))
}

fn exit_code_for_response(response: &FetchDeckResponse) -> i32 {
    match response.error.as_ref().map(|error| error.code.as_str()) {
        None => 0,
        Some("INVALID_REQUEST") => 3,
        Some("GATEWAY_TIMEOUT") => 4,
        Some("TRANSPORT_UNAVAILABLE") => 5,
        Some("PROTOCOL_ERROR") => 6,
        Some("UNSUPPORTED_CONTENT_TYPE" | "WBXML_DECODE_FAILED") => 7,
        Some("PAYLOAD_TOO_LARGE") => 8,
        Some(_) => 6,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(values: &[&str]) -> Result<ParseOutcome, String> {
        parse_args(values.iter().map(OsString::from))
    }

    #[test]
    fn help_is_available_without_a_url() {
        assert_eq!(parse(&["--help"]), Ok(ParseOutcome::Help));
    }

    #[test]
    fn parser_accepts_curl_like_request_options() {
        let ParseOutcome::Run(config) = parse(&[
            "--profile",
            "wap-net-core",
            "--gateway",
            "159.89.254.0:9200",
            "--timeout-ms",
            "750",
            "--retry",
            "1",
            "-H",
            "Accept: application/vnd.wap.wmlc",
            "--hex",
            "wap://home.wap.shrimpworks.dev/",
        ])
        .expect("arguments should parse") else {
            panic!("expected runnable config");
        };
        assert_eq!(config.profile, Profile::WapNetCore);
        assert_eq!(config.gateway.as_deref(), Some("159.89.254.0:9200"));
        assert_eq!(config.timeout_ms, 750);
        assert_eq!(config.retries, 1);
        assert_eq!(config.output_mode, OutputMode::Hex);
        assert_eq!(
            config.headers.get("Accept").map(String::as_str),
            Some("application/vnd.wap.wmlc")
        );
    }

    #[test]
    fn parser_rejects_retry_storms_and_conflicting_outputs() {
        assert!(parse(&["--retry", "3", "wap://example.test/"])
            .expect_err("retry count should be bounded")
            .contains("between 0 and 2"));
        assert!(parse(&["--raw", "--hex", "wap://example.test/"])
            .expect_err("outputs should conflict")
            .contains("choose only one"));
    }

    #[test]
    fn parser_rejects_malformed_urls_and_header_injection() {
        assert!(parse(&["example.test"]).is_err());
        assert!(parse(&["-H", "X-Test: ok\r\nInjected: yes", "wap://example.test/"]).is_err());
    }

    #[test]
    fn native_gateway_host_port_is_normalized_separately_from_resource_url() {
        assert_eq!(
            normalize_gateway(
                Some("159.89.254.0:9200"),
                FetchTransportProfile::WapNetCore,
                "wap"
            )
            .expect("gateway should normalize")
            .as_deref(),
            Some("wap://159.89.254.0:9200")
        );
    }

    #[test]
    fn hex_dump_is_stable_and_safe_for_binary_data() {
        assert_eq!(
            hex_dump(&[0x03, 0x0a, 0x00, b'A']),
            "00000000  03 0a 00 41                                       |...A|\n"
        );
    }

    #[test]
    fn redaction_hides_credentials_cookies_and_query_secrets() {
        let url = redact_transport_url("wap://alice:secret@example.test/?pin=1234&card=home");
        assert!(!url.contains("alice"));
        assert!(!url.contains("secret"));
        assert!(!url.contains("1234"));
        assert!(url.contains("card=home"));
        assert!(is_sensitive_transport_field("authorization"));
        assert!(is_sensitive_transport_field("cookie"));
    }
}
