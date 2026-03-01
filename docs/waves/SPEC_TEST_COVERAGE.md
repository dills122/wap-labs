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
| `RQ-TRN-001..004` WDP service + UDP + addressing + error policy | `planned` | transport unit/integration test suite (to be added in transport-python implementation phase) |
| `RQ-TRN-005..009` WTP semantics and SIN overlays | `planned` | protocol-level tests/fuzz fixtures (planned) |
| `RQ-TRN-010..015` WSP/session/method/capability behavior | `planned` | parser/session integration tests (planned) |
| `RQ-TRX-006..008` WCMP handling | `planned` | adapter/protocol tests (planned) |

## Browser host (`browser`)

| Requirement Group | Status | Current/Planned Test Location |
|---|---|---|
| Transport contract integration (`fetchDeck`) | `planned` | `B1-01` integration test path |
| URL load state transitions | `planned` | `B1-02` UI flow checks |
| Engine render handoff | `planned` | `B1-03` e2e smoke |
| Input model determinism | `planned` | `B2-01` key-sequence checks |
| External intent handoff loop | `planned` | `B2-02` integration scenario |
| Event timeline/export artifacts | `planned` | `B3-02` debug export checks |

## Cross-project checklist (immediate)

1. Create a minimal contract parity check between:
   - `transport-python/api/openapi.yaml`
   - `browser/contracts/transport.ts`
2. Add a CI check that verifies example metadata (`work-items`, `spec-items`, `testing-ac`) for each host-sample fixture.
3. Add engine fixture test harness expansion (`A4-02`) and map fixture IDs back to `RQ-RMK-*` groups.
