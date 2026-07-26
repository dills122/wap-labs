use lowband_transport_rust::network::wdp::{TDUnitdataIndication, WdpAddress};
use lowband_transport_rust::network::wsp::connectionless::{
    decode_connectionless_pdu, decode_wsp_status_code, encode_connectionless_pdu,
    encode_wsp_status_code, DecodedWspContentType, WspConnectionlessDecodeError,
    WspConnectionlessEncodeError, WspConnectionlessMethod, WspConnectionlessPdu,
};
use lowband_transport_rust::wsp_connectionless_primitive_profile::{
    decide_wsp_primitive, dispatch_unitdata_event, primitive_request_to_unitdata,
    unitdata_indication_to_primitive, WspConnectionlessDispatch, WspConnectionlessEndpoint,
    WspConnectionlessPrimitive, WspConnectionlessUnitdataEvent, WspEndpointRole,
    WspMethodInvokePrimitive, WspMethodResultPrimitive, WspOutOfBandParameters,
    WspPrimitiveDecision, WspPrimitiveDirection, WspPrimitiveMappingError, WspServicePrimitive,
    WspUnitdataProvider,
};
use serde::Deserialize;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Fixture {
    schema_version: u8,
    work_item: String,
    profile: String,
    effective_sequence: Vec<String>,
    source_documents: Vec<SourceDocument>,
    selected_rows: Vec<String>,
    clause_ids: Vec<String>,
    pdu_cases: Vec<PduCase>,
    status_assignments: Vec<(u8, u16)>,
    allowed_primitive_matrix: Vec<PrimitiveCase>,
    rejected_primitive: String,
    unitdata: UnitdataFixture,
    decode_errors: Vec<DecodeErrorCase>,
}

#[derive(Debug, Deserialize)]
struct SourceDocument {
    id: String,
    sections: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PduCase {
    name: String,
    kind: String,
    transaction_id: u8,
    uri: Option<String>,
    content_type: Option<String>,
    headers: Vec<u8>,
    body: Vec<u8>,
    status_code: Option<u16>,
    encoded: Vec<u8>,
}

#[derive(Debug, Deserialize)]
struct PrimitiveCase {
    role: String,
    primitive: String,
    direction: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UnitdataFixture {
    client: EndpointFixture,
    server: EndpointFixture,
    providers: Vec<String>,
    out_of_band: OutOfBandFixture,
}

#[derive(Debug, Deserialize)]
struct EndpointFixture {
    address: [u8; 4],
    port: u16,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OutOfBandFixture {
    maximum_receive_unit: u32,
    persistent_headers: bool,
}

#[derive(Debug, Deserialize)]
struct DecodeErrorCase {
    name: String,
    encoded: Vec<u8>,
    expected: String,
}

fn fixture() -> Fixture {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures/transport/wsp_connectionless_matrix/matrix_fixture.json");
    serde_json::from_str(&fs::read_to_string(path).expect("fixture should be readable"))
        .expect("fixture should parse")
}

fn role(value: &str) -> WspEndpointRole {
    match value {
        "client" => WspEndpointRole::Client,
        "server" => WspEndpointRole::Server,
        other => panic!("unknown role {other}"),
    }
}

fn primitive(value: &str) -> WspServicePrimitive {
    match value {
        "methodInvoke" => WspServicePrimitive::MethodInvoke,
        "methodResult" => WspServicePrimitive::MethodResult,
        "push" => WspServicePrimitive::Push,
        other => panic!("unknown primitive {other}"),
    }
}

fn direction(value: &str) -> WspPrimitiveDirection {
    match value {
        "req" => WspPrimitiveDirection::Req,
        "ind" => WspPrimitiveDirection::Ind,
        "res" => WspPrimitiveDirection::Res,
        "cnf" => WspPrimitiveDirection::Cnf,
        other => panic!("unknown direction {other}"),
    }
}

fn provider(value: &str) -> WspUnitdataProvider {
    match value {
        "wdp" => WspUnitdataProvider::Wdp,
        "securitySap" => WspUnitdataProvider::SecuritySap,
        other => panic!("unknown provider {other}"),
    }
}

fn endpoint(value: &EndpointFixture) -> WspConnectionlessEndpoint {
    WspConnectionlessEndpoint {
        address: WdpAddress::ipv4(value.address),
        port: value.port,
    }
}

#[test]
fn wsp_801_fixture_is_bound_to_the_effective_selected_clause_set() {
    let fixture = fixture();
    assert_eq!(fixture.schema_version, 1);
    assert_eq!(fixture.work_item, "WSP-801");
    assert_eq!(fixture.profile, "strict-class-c-connectionless");
    assert_eq!(
        fixture.effective_sequence,
        [
            "WAP-203-WSP",
            "WAP-203_001-WSP",
            "WAP-203_003-WSP",
            "WAP-203_005-WSP"
        ]
    );
    assert_eq!(fixture.source_documents.len(), 4);
    assert!(fixture
        .source_documents
        .iter()
        .any(|source| source.id == "WAP-203-WSP" && source.sections.contains(&"7.2".to_string())));
    assert_eq!(fixture.selected_rows.len(), 7);
    assert_eq!(fixture.clause_ids.len(), 35);
    assert_eq!(
        fixture.clause_ids.iter().collect::<HashSet<_>>().len(),
        35,
        "direct clause identities must be unique"
    );
    assert!(!fixture.selected_rows.contains(&"WSP-CL-C-020".to_string()));
    assert!(fixture
        .clause_ids
        .contains(&"WSP-CL-UNITDATA-DIRECT-MAPPING".to_string()));
    assert!(fixture
        .clause_ids
        .contains(&"WSP-CL-REPLY-STATUS-ASSIGNMENT".to_string()));
}

#[test]
fn source_linked_get_post_and_reply_pdus_are_byte_exact_roundtrips() {
    for case in fixture().pdu_cases {
        let decoded = decode_connectionless_pdu(&case.encoded)
            .unwrap_or_else(|error| panic!("case '{}' failed to decode: {error}", case.name));
        assert_eq!(
            decoded.transaction_id(),
            case.transaction_id,
            "{}",
            case.name
        );
        match &decoded {
            WspConnectionlessPdu::Get { uri, headers, .. } => {
                assert_eq!(case.kind, "get");
                assert_eq!(Some(uri), case.uri.as_ref());
                assert_eq!(headers, &case.headers);
                assert!(case.content_type.is_none());
                assert!(case.body.is_empty());
                assert!(case.status_code.is_none());
            }
            WspConnectionlessPdu::Post {
                uri,
                content_type,
                headers,
                body,
                ..
            } => {
                assert_eq!(case.kind, "post");
                assert_eq!(Some(uri), case.uri.as_ref());
                assert_eq!(
                    Some(content_type.media_type()),
                    case.content_type.as_deref()
                );
                assert_eq!(headers, &case.headers);
                assert_eq!(body, &case.body);
                assert!(case.status_code.is_none());
            }
            WspConnectionlessPdu::Reply {
                status_code,
                content_type,
                headers,
                body,
                ..
            } => {
                assert_eq!(case.kind, "reply");
                assert!(case.uri.is_none());
                assert_eq!(
                    Some(content_type.media_type()),
                    case.content_type.as_deref()
                );
                assert_eq!(headers, &case.headers);
                assert_eq!(body, &case.body);
                assert_eq!(Some(*status_code), case.status_code);
            }
        }
        assert_eq!(
            encode_connectionless_pdu(&decoded).expect("decoded PDU should re-encode"),
            case.encoded,
            "case '{}' did not preserve exact bytes",
            case.name
        );
    }
}

#[test]
fn every_effective_reply_status_assignment_roundtrips() {
    let fixture = fixture();
    assert_eq!(fixture.status_assignments.len(), 41);
    for (wire, http) in fixture.status_assignments {
        assert_eq!(decode_wsp_status_code(wire), Ok(http));
        assert_eq!(encode_wsp_status_code(http), Ok(wire));
    }
    for status in [0u8, 18, 39, 56, 82, 95, 102, 255] {
        assert!(matches!(
            decode_wsp_status_code(status),
            Err(WspConnectionlessDecodeError::UnsupportedStatusCode(value)) if value == status
        ));
    }
    for status in [0u16, 99, 102, 199, 207, 299, 308, 399, 418, 499, 506, 999] {
        assert_eq!(
            encode_wsp_status_code(status),
            Err(WspConnectionlessEncodeError::UnsupportedStatusCode(status))
        );
    }
}

#[test]
fn endpoint_role_matrix_is_exhaustive_and_stateless() {
    let fixture = fixture();
    let allowed = fixture
        .allowed_primitive_matrix
        .iter()
        .map(|case| {
            (
                role(&case.role),
                primitive(&case.primitive),
                direction(&case.direction),
            )
        })
        .collect::<HashSet<_>>();
    let roles = [WspEndpointRole::Client, WspEndpointRole::Server];
    let primitives = [
        WspServicePrimitive::MethodInvoke,
        WspServicePrimitive::MethodResult,
        primitive(&fixture.rejected_primitive),
    ];
    let directions = [
        WspPrimitiveDirection::Req,
        WspPrimitiveDirection::Ind,
        WspPrimitiveDirection::Res,
        WspPrimitiveDirection::Cnf,
    ];

    for role in roles {
        for primitive in primitives {
            for direction in directions {
                let (decision, trace) = decide_wsp_primitive(role, primitive, direction);
                let expected = if primitive == WspServicePrimitive::Push {
                    WspPrimitiveDecision::RejectPrimitive
                } else if allowed.contains(&(role, primitive, direction)) {
                    WspPrimitiveDecision::Accept
                } else {
                    WspPrimitiveDecision::RejectDirection
                };
                assert_eq!(decision, expected, "{role:?}/{primitive:?}/{direction:?}");
                assert_eq!(trace.decision, decision);
            }
        }
    }
}

#[test]
fn primitives_map_one_to_one_through_both_unitdata_saps() {
    let fixture = fixture();
    let get_case = fixture
        .pdu_cases
        .iter()
        .find(|case| case.kind == "get")
        .expect("GET case");
    let reply_case = fixture
        .pdu_cases
        .iter()
        .find(|case| case.kind == "reply")
        .expect("Reply case");
    let client = endpoint(&fixture.unitdata.client);
    let server = endpoint(&fixture.unitdata.server);
    let out_of_band = WspOutOfBandParameters {
        maximum_receive_unit: Some(fixture.unitdata.out_of_band.maximum_receive_unit),
        persistent_headers: fixture.unitdata.out_of_band.persistent_headers,
    };
    let invoke = WspConnectionlessPrimitive::MethodInvoke(WspMethodInvokePrimitive {
        direction: WspPrimitiveDirection::Req,
        server: server.clone(),
        client: client.clone(),
        transaction_id: get_case.transaction_id,
        method: WspConnectionlessMethod::Get,
        uri: get_case.uri.clone().expect("GET URI"),
        content_type: None,
        headers: get_case.headers.clone(),
        body: Vec::new(),
    });
    let reply_pdu = decode_connectionless_pdu(&reply_case.encoded).expect("Reply PDU");
    let WspConnectionlessPdu::Reply {
        transaction_id,
        status_code,
        content_type,
        headers,
        body,
    } = reply_pdu
    else {
        panic!("expected Reply PDU")
    };
    let result = WspConnectionlessPrimitive::MethodResult(WspMethodResultPrimitive {
        direction: WspPrimitiveDirection::Req,
        client: client.clone(),
        server: server.clone(),
        transaction_id,
        status_code,
        content_type,
        headers,
        body,
    });

    let mut request_payloads = Vec::new();
    for provider_name in &fixture.unitdata.providers {
        let provider = provider(provider_name);
        let request =
            primitive_request_to_unitdata(WspEndpointRole::Client, provider, out_of_band, &invoke)
                .expect("client request should map");
        assert_eq!(request.provider, provider);
        assert_eq!(request.out_of_band, out_of_band);
        assert_eq!(request.request.source_address, client.address);
        assert_eq!(request.request.source_port, client.port);
        assert_eq!(request.request.destination_address, server.address);
        assert_eq!(request.request.destination_port, server.port);
        assert_eq!(request.request.user_data, get_case.encoded);
        request_payloads.push(request.request.user_data.clone());

        let indication = TDUnitdataIndication {
            source_address: client.address.clone(),
            source_port: client.port,
            destination_address: Some(server.address.clone()),
            destination_port: Some(server.port),
            user_data: request.request.user_data,
        };
        let dispatched = dispatch_unitdata_event(
            WspEndpointRole::Server,
            WspConnectionlessUnitdataEvent::Indication {
                provider,
                indication,
            },
        )
        .expect("server should receive method indication");
        let WspConnectionlessDispatch::Primitive {
            provider: delivered_provider,
            primitive: delivered,
        } = dispatched
        else {
            panic!("expected primitive dispatch")
        };
        assert_eq!(delivered_provider, provider);
        assert_eq!(
            *delivered,
            WspConnectionlessPrimitive::MethodInvoke(WspMethodInvokePrimitive {
                direction: WspPrimitiveDirection::Ind,
                ..match invoke.clone() {
                    WspConnectionlessPrimitive::MethodInvoke(value) => value,
                    WspConnectionlessPrimitive::MethodResult(_) => unreachable!(),
                }
            })
        );

        let response =
            primitive_request_to_unitdata(WspEndpointRole::Server, provider, out_of_band, &result)
                .expect("server result should map");
        assert_eq!(response.request.user_data, reply_case.encoded);
        let response_indication = TDUnitdataIndication {
            source_address: server.address.clone(),
            source_port: server.port,
            destination_address: Some(client.address.clone()),
            destination_port: Some(client.port),
            user_data: response.request.user_data,
        };
        let delivered_result =
            unitdata_indication_to_primitive(WspEndpointRole::Client, response_indication)
                .expect("client should receive result indication");
        let WspConnectionlessPrimitive::MethodResult(delivered_result) = delivered_result else {
            panic!("expected method result")
        };
        assert_eq!(delivered_result.direction, WspPrimitiveDirection::Ind);
        assert_eq!(delivered_result.transaction_id, transaction_id);
        assert_eq!(delivered_result.status_code, status_code);

        assert_eq!(
            dispatch_unitdata_event(
                WspEndpointRole::Client,
                WspConnectionlessUnitdataEvent::TransportError { provider }
            ),
            Ok(WspConnectionlessDispatch::IgnoredTransportError { provider })
        );
    }
    assert_eq!(request_payloads[0], request_payloads[1]);
}

#[test]
fn malformed_frames_and_illegal_method_shapes_fail_deterministically() {
    for case in fixture().decode_errors {
        let error = decode_connectionless_pdu(&case.encoded)
            .expect_err(&format!("case '{}' should fail", case.name));
        let matches = match case.expected.as_str() {
            "missing-transaction-id" => error == WspConnectionlessDecodeError::MissingTransactionId,
            "missing-pdu-type" => error == WspConnectionlessDecodeError::MissingPduType,
            "truncated-uri" => error == WspConnectionlessDecodeError::TruncatedUri,
            "uri-contains-nul" => error == WspConnectionlessDecodeError::UriContainsNul,
            "missing-content-type" => error == WspConnectionlessDecodeError::MissingContentType,
            "truncated-header-section" => {
                error == WspConnectionlessDecodeError::TruncatedHeaderSection
            }
            "unsupported-status" => matches!(
                error,
                WspConnectionlessDecodeError::UnsupportedStatusCode(18)
            ),
            "uintvar-overflow" => error == WspConnectionlessDecodeError::UintvarOverflow,
            other => panic!("unknown expected error {other}"),
        };
        assert!(matches, "case '{}' produced {error:?}", case.name);
    }

    let client = WspConnectionlessEndpoint {
        address: WdpAddress::ipv4([192, 0, 2, 10]),
        port: 49152,
    };
    let server = WspConnectionlessEndpoint {
        address: WdpAddress::ipv4([192, 0, 2, 20]),
        port: 9200,
    };
    for (uri, body, expected) in [
        (
            "/deck.wml",
            b"forbidden".as_slice(),
            WspConnectionlessEncodeError::GetBodyNotAllowed,
        ),
        (
            "/bad\0uri",
            b"".as_slice(),
            WspConnectionlessEncodeError::UriContainsNul,
        ),
    ] {
        let primitive = WspConnectionlessPrimitive::MethodInvoke(WspMethodInvokePrimitive {
            direction: WspPrimitiveDirection::Req,
            server: server.clone(),
            client: client.clone(),
            transaction_id: 1,
            method: WspConnectionlessMethod::Get,
            uri: uri.to_string(),
            content_type: None,
            headers: Vec::new(),
            body: body.to_vec(),
        });
        assert_eq!(
            primitive_request_to_unitdata(
                WspEndpointRole::Client,
                WspUnitdataProvider::Wdp,
                WspOutOfBandParameters::default(),
                &primitive,
            ),
            Err(WspPrimitiveMappingError::Encode(expected))
        );
    }

    let post_without_content_type =
        WspConnectionlessPrimitive::MethodInvoke(WspMethodInvokePrimitive {
            direction: WspPrimitiveDirection::Req,
            server,
            client,
            transaction_id: 2,
            method: WspConnectionlessMethod::Post,
            uri: "/submit".to_string(),
            content_type: None,
            headers: Vec::new(),
            body: b"a=1".to_vec(),
        });
    assert_eq!(
        primitive_request_to_unitdata(
            WspEndpointRole::Client,
            WspUnitdataProvider::Wdp,
            WspOutOfBandParameters::default(),
            &post_without_content_type,
        ),
        Err(WspPrimitiveMappingError::Encode(
            WspConnectionlessEncodeError::MissingPostContentType
        ))
    );
}

#[test]
fn bounded_codec_properties_preserve_tid_lengths_headers_and_bodies() {
    let uri_lengths = [0usize, 1, 2, 31, 32, 127, 128, 255, 1024, 16_383];
    let header_lengths = [0usize, 1, 2, 31, 127, 128, 255];
    for (index, uri_len) in uri_lengths.into_iter().enumerate() {
        let uri = "u".repeat(uri_len);
        let headers = (0..header_lengths[index % header_lengths.len()])
            .map(|offset| ((offset * 37 + index) & 0xff) as u8)
            .collect::<Vec<_>>();
        let pdu = WspConnectionlessPdu::Get {
            transaction_id: (index * 29) as u8,
            uri,
            headers,
        };
        let encoded = encode_connectionless_pdu(&pdu).expect("GET property input should encode");
        assert_eq!(
            decode_connectionless_pdu(&encoded).expect("GET property input should decode"),
            pdu
        );
    }

    for seed in 0u8..=255 {
        let body = (0..usize::from(seed % 31))
            .map(|offset| seed.wrapping_add(offset as u8))
            .collect::<Vec<_>>();
        let pdu = WspConnectionlessPdu::Post {
            transaction_id: seed,
            uri: format!("/submit/{seed}"),
            content_type: DecodedWspContentType::from_text("text/plain")
                .expect("content type should encode"),
            headers: vec![0x80, seed],
            body,
        };
        let encoded = encode_connectionless_pdu(&pdu).expect("POST property input should encode");
        assert_eq!(
            decode_connectionless_pdu(&encoded).expect("POST property input should decode"),
            pdu
        );
    }
}
