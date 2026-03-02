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
| `RQ-RMK-003` fragment/history nav basics | `covered` | Rust engine tests cover fragment transitions + `navigateBack`; host sample examples `basic.wml`, `missing-fragment.wml`, `history-back-stack.wml` |
| `RQ-RMK-006` anchor shorthand behavior | `partial` | host sample `external-navigation-intent.wml`; deeper parser fixture coverage planned |
| `RQ-RMK-007` WBXML decode boundary ownership | `covered` | contract behavior via `loadDeckContext` metadata and docs; transport handoff checks planned in cross-project tests |
| `RQ-RMK-009` compatibility/robustness behavior | `partial` | host sample `parser-robustness.wml`; expanded fixture corpus planned (`A4-02`) |
| `RQ-WAE-016`, `RQ-WAE-017` history and back semantics | `partial` | engine `navigateBack` baseline + host sample `history-back-stack.wml`; browser integration scenarios remain planned |

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

## Transport (`transport-python`)

| Requirement Group | Status | Current/Planned Test Location |
|---|---|---|
| `RQ-TRN-001..004` WDP service + UDP + addressing + error policy | `partial` | transport-rust unit tests + fixture harness scenarios under `transport-rust/tests/fixtures/transport/` |
| `RQ-TRN-005..009` WTP semantics and SIN overlays | `planned` | protocol-level tests/fuzz fixtures (planned) |
| `RQ-TRN-010..015` WSP/session/method/capability behavior | `partial` | transport-rust request validation/gateway mapping tests + fixture harness |
| `RQ-TRX-006..008` WCMP handling | `planned` | adapter/protocol tests (planned) |

## Browser host (`browser`)

| Requirement Group | Status | Current/Planned Test Location |
|---|---|---|
| Transport contract integration (`fetchDeck`) | `partial` | browser host Rust tests in `browser/src-tauri/src/lib.rs` + transport-rust unit/integration tests |
| URL load state transitions | `partial` | browser frontend transport-first URL flow + session-state transitions in `browser/frontend/src/main.ts` |
| Engine render handoff | `partial` | browser host integration-style test `browser_e2e_fetch_load_render_sequence_renders_expected_content` |
| Input model determinism | `partial` | host key-sequence checks in `browser/src-tauri/src/lib.rs` (`smoke_key_navigation_and_back_stack`) |
| External intent handoff loop | `partial` | runtime intent emission/clear tests in host Rust + frontend follow-loop implementation in `browser/frontend/src/main.ts` |
| Event timeline/export artifacts | `planned` | `B3-02` debug export checks |

## Cross-project checklist (immediate)

1. Create a minimal contract parity check between:
   - `transport-python/api/openapi.yaml`
   - `browser/contracts/transport.ts`
2. Add a CI check that verifies example metadata (`work-items`, `spec-items`, `testing-ac`) for each host-sample fixture.
3. Add engine fixture test harness expansion (`A4-02`) and map fixture IDs back to `RQ-RMK-*` groups.
