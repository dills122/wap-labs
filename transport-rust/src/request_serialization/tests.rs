use super::*;
use crate::{FetchCacheControlPolicy, FetchRequestPolicy};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SerializationFixture {
    schema_version: u32,
    cases: Vec<SerializationCase>,
    invalid_cases: Vec<InvalidSerializationCase>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SerializationCase {
    name: String,
    url: String,
    #[serde(default)]
    referer_url: Option<String>,
    #[serde(default)]
    no_cache: bool,
    intent: FetchRequestIntent,
    expected: ExpectedSerialization,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedSerialization {
    method: String,
    url: String,
    body_bytes: Option<Vec<u8>>,
    #[serde(default)]
    body_text: Option<String>,
    content_type: Option<String>,
    referer: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct InvalidSerializationCase {
    name: String,
    method: FetchRequestMethod,
    enctype: String,
    send_referer: bool,
    accept_charset: Option<String>,
    expected_error: String,
}

fn policy(intent: FetchRequestIntent) -> FetchRequestPolicy {
    FetchRequestPolicy {
        destination_policy: None,
        cache_control: None,
        referer_url: None,
        post_context: None,
        request_intent: Some(intent),
        ua_capability_profile: None,
    }
}

fn intent(method: FetchRequestMethod) -> FetchRequestIntent {
    FetchRequestIntent {
        method,
        enctype: FORM_URLENCODED.to_string(),
        send_referer: false,
        accept_charset: Some("utf-8".to_string()),
        same_deck: false,
        post_fields: vec![
            FetchRequestPostField {
                name: "first field".to_string(),
                value: "one&two".to_string(),
            },
            FetchRequestPostField {
                name: "city".to_string(),
                value: "Montréal".to_string(),
            },
        ],
        source_content_type: Some("text/vnd.wap.wml; charset=iso-8859-1".to_string()),
    }
}

#[test]
fn mapped_fixture_is_byte_exact_and_rejects_invalid_combinations() {
    let fixture: SerializationFixture = serde_json::from_str(include_str!(
        "../../tests/fixtures/transport/wml_request_serialization_mapped/request_fixture.json"
    ))
    .expect("request serialization fixture should parse");
    assert_eq!(fixture.schema_version, 1);

    for case in fixture.cases {
        let mut request_policy = policy(case.intent);
        request_policy.referer_url = case.referer_url;
        if case.no_cache {
            request_policy.cache_control = Some(FetchCacheControlPolicy::NoCache);
        }
        let mut headers = HashMap::new();
        if case.no_cache {
            headers.insert("Cache-Control".to_string(), "no-cache".to_string());
        }
        let serialized =
            serialize_fetch_request(&case.url, "GET".to_string(), headers, Some(&request_policy))
                .unwrap_or_else(|error| panic!("{} should serialize: {error}", case.name));

        assert_eq!(
            serialized.method, case.expected.method,
            "{} method",
            case.name
        );
        assert_eq!(serialized.url, case.expected.url, "{} URL", case.name);
        let expected_body = case
            .expected
            .body_text
            .map(String::into_bytes)
            .or(case.expected.body_bytes);
        assert_eq!(serialized.body, expected_body, "{} body", case.name);
        assert_eq!(
            serialized.content_type, case.expected.content_type,
            "{} Content-Type",
            case.name
        );
        assert_eq!(
            serialized.headers.get("Referer").cloned(),
            case.expected.referer,
            "{} Referer",
            case.name
        );
    }

    for case in fixture.invalid_cases {
        let request_intent = FetchRequestIntent {
            method: case.method,
            enctype: case.enctype,
            send_referer: case.send_referer,
            accept_charset: case.accept_charset,
            same_deck: false,
            post_fields: vec![],
            source_content_type: None,
        };
        assert_eq!(
            serialize_fetch_request(
                "https://example.test/submit",
                "GET".to_string(),
                HashMap::new(),
                Some(&policy(request_intent)),
            ),
            Err(case.expected_error),
            "{}",
            case.name
        );
    }
}

#[test]
fn get_serialization_merges_query_in_order_with_byte_exact_escaping() {
    let policy = policy(intent(FetchRequestMethod::Get));
    let serialized = serialize_fetch_request(
        "https://example.test/search?existing=1",
        "GET".to_string(),
        HashMap::new(),
        Some(&policy),
    )
    .expect("GET intent should serialize");

    assert_eq!(serialized.method, "GET");
    assert_eq!(
        serialized.url,
        "https://example.test/search?existing=1&first+field=one%26two&city=Montr%C3%A9al"
    );
    assert_eq!(serialized.body, None);
    assert_eq!(serialized.content_type, None);
}

#[test]
fn post_serialization_builds_exact_body_content_type_referer_and_no_cache() {
    let mut request_intent = intent(FetchRequestMethod::Post);
    request_intent.send_referer = true;
    let mut policy = policy(request_intent);
    policy.referer_url = Some("https://example.test/forms/login.wml#card".to_string());
    policy.cache_control = Some(FetchCacheControlPolicy::NoCache);
    let mut headers = HashMap::from([("Cache-Control".to_string(), "no-cache".to_string())]);

    let serialized = serialize_fetch_request(
        "https://example.test/forms/submit",
        "GET".to_string(),
        std::mem::take(&mut headers),
        Some(&policy),
    )
    .expect("POST intent should serialize");

    assert_eq!(serialized.method, "POST");
    assert_eq!(serialized.url, "https://example.test/forms/submit");
    assert_eq!(
        serialized.body.as_deref(),
        Some(&b"first+field=one%26two&city=Montr%C3%A9al"[..])
    );
    assert_eq!(
        serialized.content_type.as_deref(),
        Some("application/x-www-form-urlencoded; charset=utf-8")
    );
    assert_eq!(
        serialized.headers.get("Content-Type").map(String::as_str),
        Some("application/x-www-form-urlencoded; charset=utf-8")
    );
    assert_eq!(
        serialized.headers.get("Referer").map(String::as_str),
        Some("login.wml")
    );
}

#[test]
fn unspecified_accept_charset_falls_back_to_referring_deck_encoding() {
    let mut request_intent = intent(FetchRequestMethod::Post);
    request_intent.accept_charset = Some("unknown".to_string());
    request_intent.post_fields = vec![FetchRequestPostField {
        name: "city".to_string(),
        value: "Montréal".to_string(),
    }];
    let policy = policy(request_intent);

    let serialized = serialize_fetch_request(
        "https://example.test/submit",
        "GET".to_string(),
        HashMap::new(),
        Some(&policy),
    )
    .expect("deck charset fallback should serialize");

    assert_eq!(serialized.body.as_deref(), Some(&b"city=Montr%E9al"[..]));
    assert_eq!(
        serialized.content_type.as_deref(),
        Some("application/x-www-form-urlencoded; charset=iso-8859-1")
    );
}

#[test]
fn malformed_or_unsupported_combinations_fail_without_partial_output() {
    let mut get_multipart = intent(FetchRequestMethod::Get);
    get_multipart.enctype = MULTIPART_FORM_DATA.to_string();
    assert_eq!(
        serialize_fetch_request(
            "https://example.test/submit",
            "GET".to_string(),
            HashMap::new(),
            Some(&policy(get_multipart)),
        ),
        Err("GET does not support multipart/form-data".to_string())
    );

    let mut unsupported_charset = intent(FetchRequestMethod::Post);
    unsupported_charset.accept_charset = Some("x-not-a-real-charset".to_string());
    assert_eq!(
        serialize_fetch_request(
            "https://example.test/submit",
            "GET".to_string(),
            HashMap::new(),
            Some(&policy(unsupported_charset)),
        ),
        Err("Unsupported accept-charset list: x-not-a-real-charset".to_string())
    );

    let mut missing_referer = intent(FetchRequestMethod::Post);
    missing_referer.send_referer = true;
    assert_eq!(
        serialize_fetch_request(
            "https://example.test/submit",
            "GET".to_string(),
            HashMap::new(),
            Some(&policy(missing_referer)),
        ),
        Err("sendreferer requires a referring deck URL".to_string())
    );

    let mut unrepresentable_latin1 = intent(FetchRequestMethod::Post);
    unrepresentable_latin1.accept_charset = Some("iso-8859-1".to_string());
    unrepresentable_latin1.post_fields = vec![FetchRequestPostField {
        name: "currency".to_string(),
        value: "€".to_string(),
    }];
    assert_eq!(
        serialize_fetch_request(
            "https://example.test/submit",
            "GET".to_string(),
            HashMap::new(),
            Some(&policy(unrepresentable_latin1)),
        ),
        Err("Value cannot be represented in submission charset iso-8859-1".to_string())
    );
}

#[test]
fn multipart_post_builds_deterministic_typed_parts() {
    let mut post = intent(FetchRequestMethod::Post);
    post.enctype = MULTIPART_FORM_DATA.to_string();
    let serialized = serialize_fetch_request(
        "https://example.test/submit",
        "GET".to_string(),
        HashMap::new(),
        Some(&policy(post)),
    )
    .expect("multipart declaration should build typed parts");

    assert_eq!(
        serialized.content_type.as_deref(),
        Some("multipart/form-data; boundary=waves-wml-304-0")
    );
    assert_eq!(
        serialized.body.as_deref(),
        Some(
            concat!(
                "--waves-wml-304-0\r\n",
                "Content-Disposition: form-data; name=\"first field\"\r\n",
                "Content-Type: text/plain\r\n",
                "\r\n",
                "one&two\r\n",
                "--waves-wml-304-0\r\n",
                "Content-Disposition: form-data; name=\"city\"\r\n",
                "Content-Type: text/plain; charset=utf-8\r\n",
                "\r\n",
                "Montréal\r\n",
                "--waves-wml-304-0--\r\n"
            )
            .as_bytes()
        )
    );
}

#[test]
fn multipart_names_are_escaped_and_boundaries_do_not_collide_with_content() {
    let mut post = intent(FetchRequestMethod::Post);
    post.enctype = MULTIPART_FORM_DATA.to_string();
    post.post_fields = vec![FetchRequestPostField {
        name: "quoted\"\\name".to_string(),
        value: "contains waves-wml-304-0 safely".to_string(),
    }];

    let serialized = serialize_fetch_request(
        "https://example.test/submit",
        "GET".to_string(),
        HashMap::new(),
        Some(&policy(post)),
    )
    .expect("multipart headers and boundary should be safe");

    assert_eq!(
        serialized.content_type.as_deref(),
        Some("multipart/form-data; boundary=waves-wml-304-1")
    );
    let body = String::from_utf8(serialized.body.expect("multipart body")).expect("UTF-8 body");
    assert!(body.contains("name=\"quoted\\\"\\\\name\""));
    assert!(body.ends_with("--waves-wml-304-1--\r\n"));
}

#[test]
fn multipart_rejects_header_injection_and_counts_framing_toward_the_body_limit() {
    let mut injected = intent(FetchRequestMethod::Post);
    injected.enctype = MULTIPART_FORM_DATA.to_string();
    injected.post_fields = vec![FetchRequestPostField {
        name: "unsafe\r\nX-Injected: true".to_string(),
        value: "value".to_string(),
    }];
    assert_eq!(
        serialize_fetch_request(
            "https://example.test/submit",
            "GET".to_string(),
            HashMap::new(),
            Some(&policy(injected)),
        ),
        Err("Multipart field name contains an unsupported line break".to_string())
    );

    let mut oversized = intent(FetchRequestMethod::Post);
    oversized.enctype = MULTIPART_FORM_DATA.to_string();
    oversized.post_fields = (0..4)
        .map(|index| FetchRequestPostField {
            name: format!("field-{index}"),
            value: "x".repeat(crate::MAX_POST_FIELD_VALUE_BYTES),
        })
        .collect();
    let request_policy = policy(oversized);
    assert!(encoded_request_body_exceeds_limit(Some(&request_policy)));
    assert_eq!(
        serialize_fetch_request(
            "https://example.test/submit",
            "GET".to_string(),
            HashMap::new(),
            Some(&request_policy),
        ),
        Err(encoded_body_limit_error())
    );
}

#[test]
fn encoded_post_body_accepts_limit_and_rejects_one_over() {
    let mut at_limit = intent(FetchRequestMethod::Post);
    at_limit.post_fields = vec![
        FetchRequestPostField {
            name: String::new(),
            value: "a".repeat(crate::MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: "b".repeat(crate::MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: "c".repeat(crate::MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: "d".repeat(crate::MAX_POST_FIELD_VALUE_BYTES - 7),
        },
    ];
    let serialized = serialize_fetch_request(
        "https://example.test/submit",
        "GET".to_string(),
        HashMap::new(),
        Some(&policy(at_limit)),
    )
    .expect("encoded body at the limit should succeed");
    assert_eq!(
        serialized.body.as_ref().map(Vec::len),
        Some(MAX_ENCODED_REQUEST_BODY_BYTES)
    );

    let mut one_over = intent(FetchRequestMethod::Post);
    one_over.post_fields = vec![
        FetchRequestPostField {
            name: String::new(),
            value: "a".repeat(crate::MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: "b".repeat(crate::MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: "c".repeat(crate::MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: "s".repeat(crate::MAX_POST_FIELD_VALUE_BYTES - 6),
        },
    ];
    let error = serialize_fetch_request(
        "https://example.test/submit",
        "GET".to_string(),
        HashMap::new(),
        Some(&policy(one_over)),
    )
    .expect_err("encoded body one over the limit must fail");
    assert_eq!(
        error,
        format!("encoded request body exceeds the {MAX_ENCODED_REQUEST_BODY_BYTES}-byte limit")
    );
    assert!(!error.contains(&"s".repeat(128)));
}

#[test]
fn legacy_post_body_rejects_one_over_before_copying() {
    let secret = "p".repeat(MAX_ENCODED_REQUEST_BODY_BYTES + 1);
    let request_policy = FetchRequestPolicy {
        destination_policy: None,
        cache_control: None,
        referer_url: None,
        post_context: Some(crate::FetchPostContext {
            same_deck: None,
            content_type: None,
            payload: Some(secret.clone()),
        }),
        request_intent: None,
        ua_capability_profile: None,
    };
    let error = serialize_fetch_request(
        "https://example.test/submit",
        "POST".to_string(),
        HashMap::new(),
        Some(&request_policy),
    )
    .expect_err("legacy body one over the limit must fail");
    assert!(!error.contains(&secret));
}
