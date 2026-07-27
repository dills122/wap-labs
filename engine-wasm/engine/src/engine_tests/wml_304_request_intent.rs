use serde_json::json;

use super::*;
use crate::{
    ScriptNavigationCacheControlPolicyLiteral, ScriptNavigationMethodLiteral,
    ScriptNavigationRequestPolicyLiteral,
};

fn activate_accept(engine: &mut WmlEngine) {
    engine
        .handle_key("enter".to_string())
        .expect("accept action should execute");
}

#[test]
fn wml_304_get_intent_preserves_order_without_claiming_query_merge() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r##"
            <wml>
              <card id="home">
                <do type="accept">
                  <go href="search?existing=1">
                    <postfield name="first" value="$(One)"/>
                    <postfield name="second" value="two"/>
                  </go>
                </do>
              </card>
            </wml>
            "##,
            "https://example.test/decks/home.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    assert!(engine.set_var("One".to_string(), "one".to_string()));

    activate_accept(&mut engine);

    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("https://example.test/decks/search?existing=1")
    );
    let policy = engine
        .external_navigation_request_policy()
        .expect("go should publish a request policy");
    assert_eq!(policy.cache_control, None);
    assert_eq!(policy.referer_url, None);
    assert_eq!(policy.post_context, None);
    let intent = policy
        .request_intent
        .expect("go should publish its bounded request intent");
    assert_eq!(intent.method, ScriptNavigationMethodLiteral::Get);
    assert_eq!(intent.enctype, "application/x-www-form-urlencoded");
    assert!(!intent.send_referer);
    assert_eq!(intent.accept_charset, None);
    assert!(!intent.same_deck);
    assert_eq!(
        intent
            .post_fields
            .iter()
            .map(|field| (field.name.as_str(), field.value.as_str()))
            .collect::<Vec<_>>(),
        [("first", "one"), ("second", "two")]
    );
}

#[test]
fn wml_304_post_intent_carries_request_attributes_without_constructing_multipart() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r##"
            <wml>
              <card id="home">
                <do type="accept">
                  <go href="/deck.wml#next" method="post" sendreferer="true"
                      cache-control="no-cache" enctype="multipart/form-data"
                      accept-charset="utf-8 iso-8859-1">
                    <postfield name="alpha" value="A"/>
                    <postfield name="beta" value="B"/>
                  </go>
                </do>
              </card>
              <card id="next"/>
            </wml>
            "##,
            "https://example.test/deck.wml#home",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");

    activate_accept(&mut engine);

    assert_eq!(engine.active_card_id().expect("active card"), "home");
    let policy = engine
        .external_navigation_request_policy()
        .expect("post go should publish a request policy");
    assert_eq!(
        policy.cache_control,
        Some(ScriptNavigationCacheControlPolicyLiteral::NoCache)
    );
    assert_eq!(
        policy.referer_url.as_deref(),
        Some("https://example.test/deck.wml#home")
    );
    assert_eq!(
        policy.post_context, None,
        "multipart construction remains a transport residual"
    );
    let intent = policy.request_intent.expect("request intent");
    assert_eq!(intent.method, ScriptNavigationMethodLiteral::Post);
    assert_eq!(intent.enctype, "multipart/form-data");
    assert!(intent.send_referer);
    assert_eq!(intent.accept_charset.as_deref(), Some("utf-8 iso-8859-1"));
    assert!(intent.same_deck);
    assert_eq!(intent.post_fields[0].name, "alpha");
    assert_eq!(intent.post_fields[1].name, "beta");
}

#[test]
fn wml_304_same_deck_postfields_are_suppressed_unless_no_cache_requests_reload() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r##"
            <wml>
              <card id="home">
                <do type="accept">
                  <go href="#next" method="post">
                    <postfield name="ignored" value="yes"/>
                  </go>
                </do>
              </card>
              <card id="next">
                <do type="accept"><go href="#home" cache-control="no-cache"/></do>
              </card>
            </wml>
            "##,
            "https://example.test/deck.wml#home",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");

    activate_accept(&mut engine);
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(engine.external_navigation_request_policy(), None);

    activate_accept(&mut engine);
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("https://example.test/deck.wml#home")
    );
    let intent = engine
        .external_navigation_request_policy()
        .and_then(|policy| policy.request_intent)
        .expect("no-cache fragment should request a same-deck reload");
    assert!(intent.same_deck);
}

#[test]
fn wml_304_native_request_policy_serialization_is_stable() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r##"<wml><card id="home"><do type="accept"><go href="/submit" method="post"
              sendreferer="true" accept-charset="utf-8"><postfield name="x" value="1"/></go>
              </do></card></wml>"##,
            "https://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    activate_accept(&mut engine);

    let policy: ScriptNavigationRequestPolicyLiteral = engine
        .external_navigation_request_policy()
        .expect("request policy");
    assert_eq!(
        serde_json::to_value(policy).expect("native request policy should serialize"),
        json!({
            "cacheControl": null,
            "refererUrl": "https://example.test/deck.wml",
            "postContext": {
                "sameDeck": false,
                "contentType": "application/x-www-form-urlencoded",
                "payload": "x=1"
            },
            "requestIntent": {
                "method": "post",
                "enctype": "application/x-www-form-urlencoded",
                "sendReferer": true,
                "acceptCharset": "utf-8",
                "sameDeck": false,
                "postFields": [{ "name": "x", "value": "1" }]
            }
        })
    );
}
