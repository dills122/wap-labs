use super::*;

fn request() -> FetchDeckRequest {
    FetchDeckRequest {
        url: "http://example.test/deck.wml".to_string(),
        method: Some("POST".to_string()),
        headers: None,
        timeout_ms: Some(500),
        retries: Some(0),
        request_id: Some("request-1".to_string()),
        request_policy: None,
    }
}

fn post_policy(fields: Vec<FetchRequestPostField>) -> FetchRequestPolicy {
    FetchRequestPolicy {
        destination_policy: None,
        cache_control: None,
        referer_url: None,
        post_context: None,
        request_intent: Some(FetchRequestIntent {
            method: FetchRequestMethod::Post,
            enctype: "application/x-www-form-urlencoded".to_string(),
            send_referer: false,
            accept_charset: Some("utf-8".to_string()),
            same_deck: false,
            post_fields: fields,
            source_content_type: None,
        }),
        ua_capability_profile: None,
    }
}

fn assert_secret_free(error: &impl std::fmt::Display, secret: &str) {
    assert!(!error.to_string().contains(secret));
}

#[test]
fn rejects_one_over_header_count_without_echoing_values() {
    let secret = "secret-header-value";
    let mut request = request();
    request.headers = Some(
        (0..=MAX_REQUEST_HEADER_COUNT)
            .map(|index| (format!("X-Test-{index}"), secret.to_string()))
            .collect(),
    );
    let error = validate_fetch_deck_request(&request).expect_err("one over must fail");
    assert_secret_free(&error, secret);
}

#[test]
fn rejects_one_over_aggregate_header_bytes_without_echoing_values() {
    let secret = "s".repeat(MAX_REQUEST_HEADER_BYTES);
    let mut request = request();
    request.headers = Some(HashMap::from([("x".to_string(), secret.clone())]));
    let error = validate_fetch_deck_request(&request).expect_err("one over must fail");
    assert_secret_free(&error, &secret);
}

#[test]
fn rejects_one_over_request_identifier_without_echoing_it() {
    let secret = "r".repeat(MAX_REQUEST_ID_BYTES + 1);
    let mut request = request();
    request.request_id = Some(secret.clone());
    let error = validate_fetch_deck_request(&request).expect_err("one over must fail");
    assert_secret_free(&error, &secret);
}

#[test]
fn rejects_one_over_request_method_without_echoing_it() {
    let secret = "m".repeat(super::super::MAX_REQUEST_METHOD_BYTES + 1);
    let mut request = request();
    request.method = Some(secret.clone());
    let error = validate_fetch_deck_request(&request).expect_err("one over must fail");
    assert_secret_free(&error, &secret);
}

#[test]
fn rejects_one_over_each_request_policy_metadata_field() {
    for field in [
        "referer",
        "post-content-type",
        "enctype",
        "accept-charset",
        "source-content-type",
    ] {
        let secret = "z".repeat(super::super::MAX_REQUEST_METADATA_BYTES + 1);
        let mut policy = post_policy(Vec::new());
        match field {
            "referer" => policy.referer_url = Some(secret.clone()),
            "post-content-type" => {
                policy.post_context = Some(FetchPostContext {
                    same_deck: None,
                    content_type: Some(secret.clone()),
                    payload: None,
                });
            }
            "enctype" => {
                policy.request_intent.as_mut().expect("intent").enctype = secret.clone();
            }
            "accept-charset" => {
                policy
                    .request_intent
                    .as_mut()
                    .expect("intent")
                    .accept_charset = Some(secret.clone());
            }
            "source-content-type" => {
                policy
                    .request_intent
                    .as_mut()
                    .expect("intent")
                    .source_content_type = Some(secret.clone());
            }
            _ => unreachable!(),
        }
        let mut request = request();
        request.request_policy = Some(policy);
        let error = validate_fetch_deck_request(&request)
            .expect_err(&format!("{field} one-over case should fail"));
        assert_secret_free(&error, &secret);
    }
}

#[test]
fn rejects_one_over_post_field_count() {
    let mut request = request();
    request.request_policy = Some(post_policy(
        (0..=MAX_POST_FIELD_COUNT)
            .map(|index| FetchRequestPostField {
                name: format!("field-{index}"),
                value: "value".to_string(),
            })
            .collect(),
    ));
    validate_fetch_deck_request(&request).expect_err("one over must fail");
}

#[test]
fn rejects_one_over_post_field_name_and_value_without_echoing_them() {
    for (name, value) in [
        ("n".repeat(MAX_POST_FIELD_NAME_BYTES + 1), "ok".to_string()),
        ("ok".to_string(), "v".repeat(MAX_POST_FIELD_VALUE_BYTES + 1)),
    ] {
        let mut request = request();
        request.request_policy = Some(post_policy(vec![FetchRequestPostField {
            name: name.clone(),
            value: value.clone(),
        }]));
        let error = validate_fetch_deck_request(&request).expect_err("one over must fail");
        assert_secret_free(&error, &name);
        assert_secret_free(&error, &value);
    }
}

#[test]
fn rejects_one_over_legacy_post_body_without_echoing_it() {
    let secret = "p".repeat(MAX_ENCODED_REQUEST_BODY_BYTES + 1);
    let mut request = request();
    request.request_policy = Some(FetchRequestPolicy {
        destination_policy: None,
        cache_control: None,
        referer_url: None,
        post_context: Some(FetchPostContext {
            same_deck: None,
            content_type: None,
            payload: Some(secret.clone()),
        }),
        request_intent: None,
        ua_capability_profile: None,
    });
    let error = validate_fetch_deck_request(&request).expect_err("one over must fail");
    assert_secret_free(&error, &secret);
}

#[test]
fn rejects_one_over_encoded_post_body_during_ingress_validation() {
    let secret = "s".repeat(MAX_POST_FIELD_VALUE_BYTES - 6);
    let mut request = request();
    request.request_policy = Some(post_policy(vec![
        FetchRequestPostField {
            name: String::new(),
            value: "a".repeat(MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: "b".repeat(MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: "c".repeat(MAX_POST_FIELD_VALUE_BYTES),
        },
        FetchRequestPostField {
            name: String::new(),
            value: secret.clone(),
        },
    ]));

    let error = validate_fetch_deck_request(&request).expect_err("one over must fail");
    assert_eq!(
        error.to_string(),
        format!("encoded request body exceeds the {MAX_ENCODED_REQUEST_BODY_BYTES}-byte limit")
    );
    assert_secret_free(&error, &secret);
}

#[test]
fn rejected_request_never_reaches_transport_executor() {
    let mut request = request();
    request.request_id = Some("x".repeat(MAX_REQUEST_ID_BYTES + 1));
    let response = fetch_deck_in_process(request);
    assert_eq!(response.final_url, "");
    assert_eq!(
        response.error.as_ref().map(|error| error.code.as_str()),
        Some("INVALID_REQUEST")
    );
    assert!(response
        .error
        .as_ref()
        .and_then(|error| error.details.as_ref())
        .is_none());
}
