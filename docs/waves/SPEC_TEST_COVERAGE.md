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
| `RQ-WMLS-008..010` bytecode format/verification/error model | `partial` | decoder bounds + VM trap tests in `engine-wasm/engine/src/wavescript/decoder.rs` and `vm.rs`; structural verification gate closure tracked in `W0-06` + `W1-02` |
| `RQ-WMLS-011` WMLScript content-type routing | `planned` | transport/host contract and fixture closure tracked in `W1-01` |
| `RQ-WMLS-017..022` WMLBrowser/dialog/timer/refresh semantics | `partial` | `engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs` + `wmlbrowser_tests.rs` and runtime effect tests in `engine-wasm/engine/src/engine_tests.rs`, including `m1_02_script_invocation_public_outcome_regression` and `m1_02_invoke_script_ref_missing_unit_has_stable_error_surface`; `newContext/getCurrentCard/refresh` closure tracked in `W0-07` |
| WAP-191 section `11` text/layout semantics (`p`, `br`, `table`, `pre`, `img`) | `planned` | `docs/wml-engine/work-items.md` follow-ups `B5-02`, `B5-03`, `C5-01`, `C5-02` |
| WAP-191 section `12.5` inter-card process ordering (`go/prev/refresh/noop`) | `planned` | `A5-02` + Waves integration ticket `R0-02` |
| WAP-191 section `15` conformance ID closure (`WML-01..75`) | `planned` | Waves ticket `R0-01` (matrix + CI gate) |

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

## Transport (`transport-rust`)

| Requirement Group | Status | Current/Planned Test Location |
|---|---|---|
| `RQ-TRN-001..004` WDP service + UDP + addressing + error policy | `partial` | transport-rust unit tests + fixture harness scenarios under `transport-rust/tests/fixtures/transport/` |
| `RQ-TRN-005..009` WTP semantics and SIN overlays | `planned` | protocol-level retransmission/abort/SAR fixtures; follow-ups tracked in `T0-08` and existing WTP lanes |
| `RQ-TRN-010..015` WSP/session/method/capability behavior | `partial` | transport-rust request validation/gateway mapping tests + fixture harness |
| `RQ-TRN-016` WTP TID window/MPL discipline | `planned` | deterministic replay-window and TID-rate fixtures tracked in `T0-08` |
| `RQ-TRN-017` WSP connectionless primitive profile | `planned` | primitive occurrence matrix fixtures tracked in `T0-09` |
| `RQ-TRN-018` WSP assigned-number registry fidelity | `planned` | table-driven token map fixtures tracked in `T0-10` |
| `RQ-TRN-019` WSP capability-bounds enforcement | `planned` | capability negotiation and bound-exceed fixtures tracked in `T0-11` |
| `RQ-TRX-006..008` WCMP handling | `planned` | adapter/protocol tests (planned) |
| `RQ-TRX-009` Wireless Profiled TCP optimization baseline | `planned` | profile declaration + compatibility fixture lane tracked in `T0-12` |
| `RQ-TRX-010` WDP/WCMP over SMPP adaptation profile | `planned` | explicit scope decision + adapter fixture lane tracked in `T0-13` |
| WAP networking profile decision and migration gates | `planned` | architecture decision + profile-gate fixture lane tracked in `T0-14` |
| WAP-191 request-policy + post metadata plumbing (`go/postfield/cache-control`) | `planned` | `T0-04`, `R0-06` |
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
| Access-control, low-memory, unknown-DTD host policy paths (`12.1`-`12.4`) | `planned` | `R0-07` |

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
