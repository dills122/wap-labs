# Waves Spec Test Coverage Matrix

Version: v0.1  
Status: initial matrix

## Purpose

Map requirement groups to current or planned test assets so acceptance criteria stay executable and visible across projects.

Legend:

- `covered`: implemented and test path exists
- `partial`: some checks exist; more coverage required
- `planned`: no test yet, ticketed/planned

## Engine (`engine-wasm`)

| Requirement Group | Status | Current/Planned Test Location |
|---|---|---|
| `RQ-RMK-001` deck/card parse baseline | `covered` | Rust parser tests in `engine-wasm/engine/src/*` + host sample `basic.wml` |
| `RQ-RMK-003` fragment/history nav basics | `covered` | Rust engine tests cover fragment transitions + `navigateBack`, including `m1_02_handle_key_render_and_navigate_back_public_api_flow` and `m1_02_load_deck_and_load_deck_context_have_matching_runtime_behavior`; host sample examples `basic.wml`, `missing-fragment.wml`, `history-back-stack.wml` |
| `RQ-RMK-006` anchor shorthand behavior | `partial` | host sample `external-navigation-intent.wml`; deeper parser fixture coverage planned |
| `RQ-RMK-007` WBXML decode boundary ownership | `covered` | contract behavior via `loadDeckContext` metadata and docs, including native `m1_02_load_deck_context_public_api_sets_metadata_and_state` and wasm wrapper checks in `engine-wasm/engine/src/engine_wasm_bindings_tests.rs`; transport handoff checks planned in cross-project tests |
| `RQ-RMK-009` compatibility/robustness behavior | `partial` | host sample `parser-robustness.wml`; fixture harness baseline implemented in `A4-02`, broader corpus expansion remains planned |
| `RQ-WAE-016`, `RQ-WAE-017` history and back semantics | `partial` | engine `navigateBack` baseline + host sample `history-back-stack.wml`; browser integration scenarios remain planned |
| `RQ-WMLS-001..003` external-call/pragma/url invocation model | `partial` | Phase W fixtures + engine tests for `script:` link resolution and deferred invocation boundaries; access-control/pragma conformance follow-up tracked in `W0-08` + `W1-03` |
| `RQ-WMLS-004..006` function/local/conversion semantics | `partial` | engine WaveScript VM tests in `engine-wasm/engine/src/wavescript/vm.rs` + `vm_tests.rs` and invocation tests in `engine-wasm/engine/src/engine_tests.rs`; broader spec parity closure tracked in `W1-04` |
| `RQ-WMLS-008..010` bytecode format/verification/error model | `partial` | decoder structural gates in `engine-wasm/engine/src/wavescript/decoder.rs` (`decode_rejects_local_index_above_limit`, `decode_rejects_call_arity_above_limits`, `decode_rejects_host_call_arg_count_above_limit`, `decode_rejects_call_target_not_on_instruction_boundary`) plus VM boundary gate in `engine-wasm/engine/src/wavescript/vm_tests.rs` (`execute_from_pc_rejects_non_boundary_entry_point`); `W0-06` closure landed, with full header/pool verification depth still tracked in `W1-02` |
| `RQ-WMLS-011` WMLScript content-type routing | `planned` | Target files: `transport-rust/src/responses.rs`, `transport-rust/tests/fixtures/transport/`, `browser/src-tauri/src/lib.rs`; command: `cd transport-rust && cargo test --lib` then `cd browser/src-tauri && cargo test`; tracked in `W1-01` |
| `RQ-WMLS-017..022` WMLBrowser/dialog/timer/refresh semantics | `partial` | `engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs` + `wmlbrowser_tests.rs` and runtime effect tests in `engine-wasm/engine/src/engine_tests.rs`, including `m1_02_script_invocation_public_outcome_regression`, `wmlbrowser_get_current_card_returns_fragment_when_context_exists`, `wmlbrowser_get_current_card_returns_invalid_without_context`, and `wmlbrowser_new_context_clears_vars_and_history_and_prev_has_no_effect`; host/browser local example `examples/wmlbrowser-context-fidelity.wml` exercises `newContext/getCurrentCard`; remaining closure is centered on `refresh` optionality and dialog/timer breadth |
| WAP-191 section `11` text/layout semantics (`p`, `br`, `table`, `pre`, `img`) | `planned` | Target files: `engine-wasm/engine/src/render/flow_layout.rs`, `engine-wasm/engine/tests/fixtures/phase-a/`; command: `cd engine-wasm/engine && cargo test`; tickets `B5-02`, `B5-03`, `C5-01`, `C5-02` |
| WAP-191 section `12.5` inter-card process ordering (`go/prev/refresh/noop`) | `covered` | engine runtime + parser coverage in `engine-wasm/engine/src/engine_tests.rs` (`fixture_accept_*_trace_order_is_deterministic`, `enter_accept_noop_action_keeps_current_card_and_history`, `onenterforward_noop_keeps_deterministic_navigation_state`) and parser action tests in `engine-wasm/engine/src/parser/wml_parser/tests.rs`; browser host-flow assertions in `browser/frontend/src/app/navigation-state.test.ts` (`emits deterministic state-event order for host-history back fallback`, `keeps host history pointer stable when history-back transport load fails`, `replays host back using stored request method and request policy`, header-aware host history replay) plus Tauri host integration path `browser/src-tauri/src/lib.rs` (`tauri_apply_accept_noop_refresh_prev_and_error_paths_are_deterministic`) confirm deterministic forward/back/refresh/noop/error behavior and request-policy handoff evidence |
| WAP-191 section `15` conformance ID closure (`WML-01..75`) | `planned` | Target files: `docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md`, `engine-wasm/engine/tests/fixtures/`, `browser/src-tauri/tests/fixtures/`; command: `cd engine-wasm/engine && cargo test` and `node scripts/check-worklist-drift.mjs`; ticket `R0-01` |

## Host sample (`engine-wasm/host-sample`)

| Coverage Focus | Status | Example / Verification |
|---|---|---|
| Basic card navigation | `covered` | `examples/basic.wml` |
| History back-stack baseline | `covered` | `examples/history-back-stack.wml` + Back control in host harness |
| Missing-fragment error path | `covered` | `examples/missing-fragment.wml` |
| External navigation intent | `covered` | `examples/external-navigation-intent.wml` |
| Field/openwave realism baseline | `partial` | `examples/field-openwave-2011-navigation.wml` |
| Wrap/layout stress | `covered` | `examples/wrap-stress.wml` |
| Parser robustness | `covered` | `examples/parser-robustness.wml` |
| WMLBrowser context reset/current-card semantics | `covered` | `examples/wmlbrowser-context-fidelity.wml` (`newContext` + `getCurrentCard`) |

## Transport (`transport-rust`)

| Requirement Group | Status | Current/Planned Test Location |
|---|---|---|
| `RQ-TRN-001..004` WDP service + UDP + addressing + error policy | `partial` | transport-rust unit tests + fixture harness scenarios under `transport-rust/tests/fixtures/transport/` |
| `RQ-TRN-005..009` WTP semantics and SIN overlays | `partial` | WTP policy/state unit coverage is in `transport-rust/src/network/wtp/`; replay promotion baseline now includes schema-versioned retransmission and duplicate-TID seed corpus coverage in `transport-rust/tests/interop_replay.rs` with corpus files under `transport-rust/tests/network/interop/` (`retransmission_seed.json`, `duplicate_tid_seed.json`); command: `cd transport-rust && cargo test --lib && cargo test --test interop_replay`; follow-ups tracked in `T0-18`, with replay promotion baseline closed in `T0-22` and seed corpus formalized in `T0-24` |
| `RQ-TRN-010..015` WSP/session/method/capability behavior | `partial` | transport-rust request validation/gateway mapping tests plus pure WSP header-block/PDU/session coverage in `transport-rust/src/network/wsp/header_block.rs`, `transport-rust/src/network/wsp/pdu.rs`, and `transport-rust/src/network/wsp/session.rs` with fixture corpora `transport-rust/tests/fixtures/transport/wsp_pdu_baseline_mapped/pdu_fixture.json` and `transport-rust/tests/fixtures/transport/wsp_session_method_baseline_mapped/session_fixture.json`; replay promotion baseline now includes schema-versioned `Connect`/`ConnectReply` and `GET`/`REPLY` seed corpus replay in `transport-rust/tests/interop_replay.rs` + `transport-rust/tests/network/interop/connect_session_seed.json` and `transport-rust/tests/network/interop/get_reply_seed.json`; command: `cd transport-rust && cargo test --lib && cargo test --test interop_replay` |
| `RQ-TRN-018..019` WSP assigned-number + capability-bound behavior (new alignment pass) | `partial` | Assigned-number, code-page, and encoding-version policy coverage is in `transport-rust/src/network/wsp/header_registry.rs`, `transport-rust/src/network/wsp/decoder.rs`, `transport-rust/src/network/wsp/encoder.rs`, `transport-rust/src/network/wsp/encoding_version.rs`, and compatibility wrapper `transport-rust/src/wsp_registry.rs` with fixture corpus `transport-rust/tests/fixtures/transport/wsp_assigned_number_registry_mapped/registry_fixture.json`; capability-bound enforcement remains pending in `T0-11`; command: `cd transport-rust && cargo test --lib` |
| `RQ-TRN-016` WTP TID window/MPL discipline | `partial` | Target files: `transport-rust/src/wtp_replay_window.rs`, `transport-rust/tests/fixtures/transport/wtp_tid_replay_window_mapped/`; command: `cd transport-rust && cargo test --lib wtp_tid_replay_window_fixture_matrix`; ticket `T0-08`, `T0-18` |
| `RQ-TRN-017` WSP connectionless primitive profile | `covered` | Fixture matrix is in `transport-rust/src/wsp_connectionless_primitive_profile.rs` and `transport-rust/tests/fixtures/transport/wsp_connectionless_primitive_profile_mapped/`; command: `cd transport-rust && cargo test --lib`; ticket `T0-09` |
| `RQ-TRN-018` WSP assigned-number registry fidelity | `partial` | Deterministic decode/encode + unknown-policy + code-page-shift tests landed in `transport-rust/src/network/wsp/` and `transport-rust/tests/fixtures/transport/wsp_assigned_number_registry_mapped/`; broader protocol-path integration remains planned under `T0-22`; command: `cd transport-rust && cargo test --lib` |
| `RQ-TRN-014` WSP encoding-version and header encoding rules | `partial` | Deterministic encoding-version negotiation, text fallback, unsupported binary status output, and immediate header-block/PDU/session decode-encode coverage are in `transport-rust/src/network/wsp/encoding_version.rs`, `transport-rust/src/network/wsp/header_block.rs`, `transport-rust/src/network/wsp/pdu.rs`, `transport-rust/src/network/wsp/session.rs`, `transport-rust/src/network/wsp/decoder.rs`, and `transport-rust/src/network/wsp/encoder.rs`; command: `cd transport-rust && cargo test --lib` |
| `RQ-TRN-019` WSP capability-bounds enforcement | `planned` | Target files: `transport-rust/src/network/wsp/`, `transport-rust/tests/network/interop/`; command: `cd transport-rust && cargo test --lib`; ticket `T0-11` |
| `RQ-SEC-004`, `RQ-SEC-005` WTLS posture and security delegation behavior | `planned` | Target files: `transport-rust/src/network/wtls/`, `docs/waves/wtls-record-structure.md`; command: `cd transport-rust && cargo test --lib`; follow-up `T0-21` |
| `RQ-WAE-010` URI handling baseline | `partial` | `transport-rust` request-validation tests in `src/lib.rs` plus fixture `tests/fixtures/transport/uri_too_long_1025` (1024-octet boundary coverage landed; transport-profile routing assertions pending) |
| `RQ-WAE-012` i18n baseline (UTF-8/UTF-16 + deterministic decode errors) | `partial` | textual payload decode tests in `transport-rust/src/responses.rs` plus mapped fixtures `utf16le_textual_wml_mapped` and `utf16_odd_length_protocol_error_mapped`; script-path parity remains pending |
| `RQ-TRX-006..008` WCMP handling | `planned` | Target files: `transport-rust/src/network/wcmp/`, `transport-rust/tests/network/interop/`; command: `cd transport-rust && cargo test --lib`; tracked in transport-adjacent lane |
| `RQ-TRX-009` Wireless Profiled TCP optimization baseline | `partial` | Policy declaration + drift check landed in `transport-rust/src/tcp_profile.rs` with fixture `transport-rust/tests/fixtures/transport/wireless_profiled_tcp_policy_mapped/policy_fixture.json`; command: `cd transport-rust && cargo test --lib tcp_profile::tests::wireless_profiled_tcp_posture_matches_declared_policy_fixture`; ticket `T0-12` |
| `RQ-TRX-010` WDP/WCMP over SMPP adaptation profile | `partial` | Deferred scope declaration + guardrail fixture landed in `transport-rust/src/smpp_profile.rs` and `transport-rust/tests/fixtures/transport/smpp_adaptation_scope_mapped/scope_fixture.json`; command: `cd transport-rust && cargo test --lib smpp_profile::tests::smpp_adaptation_scope_matches_declared_fixture`; ticket `T0-13` |
| WAP networking profile decision and migration gates | `covered` | Canonical profile decision record at `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` with machine-checkable gate assertions in `scripts/check-networking-profile-gates.mjs` and config `docs/waves/network-profile-gates.json`; command: `node scripts/check-networking-profile-gates.mjs`; ticket `T0-14` |
| WAP-191 request-policy + post metadata plumbing (`go/postfield/cache-control`) | `covered` | request-policy mapping tests in `transport-rust/src/lib.rs` + browser host external-intent request-policy propagation tests (`T0-04`, `R0-06`) |
| WAP-191 encoder/validation fixture lane (`14.x`, `15.2-15.4`) | `planned` | `T0-07`, `R0-08` |

## Browser host (`browser`)

| Requirement Group | Status | Current/Planned Test Location |
|---|---|---|
| Transport contract integration (`fetchDeck`) | `partial` | browser host Rust tests in `browser/src-tauri/src/lib.rs` + transport-rust unit/integration tests + explicit normalization guarantees in `transport-rust/README.md` |
| URL load state transitions | `partial` | browser frontend transport-first URL flow + session-state transitions in `browser/frontend/src/main.ts` and host-session stack helpers in `browser/frontend/src/session-history.ts` |
| Engine render handoff | `partial` | browser host integration-style tests `browser_e2e_fetch_load_render_sequence_renders_expected_content` and `browser_fixture_load_navigate_and_external_intent_flow_is_deterministic` |
| Input model determinism | `partial` | host key-sequence checks in `browser/src-tauri/src/lib.rs` (`smoke_key_navigation_and_back_stack`) + browser global key handling in `browser/frontend/src/main.ts` |
| External intent handoff loop | `partial` | runtime intent emission/clear tests in host Rust + fixture flow `browser_fixture_load_navigate_and_external_intent_flow_is_deterministic` + frontend follow-loop implementation in `browser/frontend/src/main.ts` |
| Event timeline/export artifacts | `partial` | frontend timeline/export implementation + export-time chronology validation in `browser/frontend/src/main.ts`; automated regression checks still pending |
| Access-control, low-memory, unknown-DTD host policy paths (`12.1`-`12.4`) | `planned` | Target files: `browser/src-tauri/src/lib.rs`, `browser/src-tauri/tests/fixtures/integration/`, `engine-wasm/engine/src/runtime/`; command: `cd browser/src-tauri && cargo test` then `cd engine-wasm/engine && cargo test`; ticket `R0-07` |

Transport error taxonomy progress:

- table-driven deterministic trigger checks in `transport-rust/src/lib.rs` (`transport_error_code_trigger_matrix_is_deterministic`)
- documented trigger matrix in `transport-rust/README.md`

## Cross-project checklist (current)

1. [x] Create a minimal contract parity check between:
   - `transport-rust` request/response model tests
   - `browser/contracts/transport.ts`
2. [ ] Add a CI check that verifies example metadata (`work-items`, `spec-items`, `testing-ac`) for each host-sample fixture.
3. [x] Add engine fixture test harness expansion (`A4-02`) and map fixture IDs back to `RQ-RMK-*` groups.
4. [ ] Add `WML-01..75` mandatory/optional coverage index tied to implemented tests and policy gates (`R0-01`).
