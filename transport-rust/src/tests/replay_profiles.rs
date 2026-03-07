use super::*;

#[test]
fn transport_wtp_tid_replay_window_fixture_matrix() {
    let fixture: WtpReplayPolicyFixture =
        read_json_fixture("wtp_tid_replay_window_mapped", "replay_policy_fixture.json");

    let _ = &fixture.responder_policy;
    for case in fixture.responder_cases {
        let (decision, _trace) = decide_responder_tid(
            &case.policy.into_policy(),
            &case.state.into_state(),
            case.incoming_tid,
        );
        assert_eq!(
            decision,
            expect_responder_tid_decision(case.expected.as_str()),
            "responder case '{}' failed",
            case.name
        );
    }

    let initiator_policy = fixture.initiator_policy;
    for case in fixture.initiator_cases {
        let matcher = expect_initiator_tid_decision(case.expected.as_str());
        let (decision, _trace) = decide_initiator_tid(
            &initiator_policy,
            &case.state.into_state(),
            case.incoming_tid,
        );
        assert!(matcher(decision), "initiator case '{}' failed", case.name);
    }
}

#[test]
fn transport_wtp_retransmission_policy_fixture_matrix() {
    let fixture: WtpRetransmissionFixture = read_json_fixture(
        "wtp_retransmission_policy_mapped",
        "retransmission_policy_fixture.json",
    );

    for case in fixture.max_retries_test_cases {
        run_retransmission_fixture_case(&case);
    }
    for case in fixture.linear_backoff_test_cases {
        run_retransmission_fixture_case(&case);
    }
    for case in fixture.nack_holdoff_test_cases {
        run_retransmission_fixture_case(&case);
    }
}

#[test]
fn transport_wtp_duplicate_cache_policy_fixture_matrix() {
    let fixture: WtpDuplicateCacheFixture = read_json_fixture(
        "wtp_duplicate_cache_policy_mapped",
        "duplicate_cache_policy_fixture.json",
    );
    for case in fixture.cases {
        run_duplicate_cache_fixture_case(&case);
    }
}

#[test]
fn transport_wsp_connectionless_primitive_profile_fixture_matrix() {
    let fixture: WspPrimitiveProfileFixture = read_json_fixture(
        "wsp_connectionless_primitive_profile_mapped",
        "primitive_profile_fixture.json",
    );

    for scenario in fixture.scenarios {
        let mode = parse_wsp_primitive_profile_mode(&scenario.policy.mode);
        let profile = WspPrimitiveProfile {
            mode,
            push_allowed: scenario.policy.push_allowed,
        };
        for case in scenario.cases {
            let state = WspPrimitiveState {
                awaiting_result: case.state.awaiting_result,
            };
            let expected_decision = expect_wsp_primitive_decision(case.expected.as_str());
            let primitive = parse_primitive(&case.primitive);
            let direction = parse_direction(&case.direction);
            let (decision, next_state, _trace) =
                decide_wsp_primitive_transition(&profile, &state, primitive, direction);
            assert_eq!(
                decision, expected_decision,
                "scenario '{}' case '{}' failed",
                scenario.name, case.name
            );
            assert_eq!(
                next_state,
                WspPrimitiveState {
                    awaiting_result: case.expected_awaiting_result
                },
                "scenario '{}' case '{}' expected next state mismatch",
                scenario.name,
                case.name
            );
            let _trace_fields = _trace.decision;
        }
    }
}
