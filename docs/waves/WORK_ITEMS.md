# Waves Browser Work Items (Integration Track)

Purpose: execution board for Waves desktop browser integration work.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

Current mode: active execution. Completed and in-progress tickets are tracked below.

## Baseline Assumptions

These assumptions are active for this board and should not be re-litigated in each ticket:

1. `transport-rust/` networking behavior is already functionally validated via CLI probes.
2. `engine-wasm/` runtime/rendering has reached a substantial milestone and is ready for full browser integration.

This board therefore prioritizes host/browser integration, UX shell behavior, and runtime/transport orchestration over low-level parser/transport re-validation.

## Architecture standards gate

For WaveScript VM/runtime tickets, enforce these implementation standards (derived from Chromium/WebKit/WHATWG/Wasm architecture references documented in `docs/waves/WAVESCRIPT_VM_ARCHITECTURE.md`):

1. VM/interpreter semantics must remain in `engine-wasm`.
2. Host code must only implement side-effect capabilities (dialogs, timer wake/tick, script fetch on miss).
3. Bytecode verification gates must run before execution.
4. Execution must be bounded (steps, stack, call depth, growth limits).
5. Script/runtime failures must trap deterministically without host/runtime crashes.
6. Navigation/refresh effects from script must apply at deterministic post-invocation boundaries.

## Scope

Primary implementation target:

- `browser/` (Tauri host app)

Integrated dependencies:

- `engine-wasm/` (runtime + wasm contract)
- `transport-rust/` (in-process transport boundary)

Project planning links:

- Engine execution board: `docs/wml-engine/work-items.md`
- Engine phased backlog: `docs/wml-engine/ticket-plan.md`
- Maintenance/debt board: `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- Transport planning/checklist: `transport-rust/README.md`
- Browser planning/checklist: `browser/README.md`

## Next In Line (Architecture Maintenance Sprint)

Next execution block is architecture hardening across all active libraries before additional feature expansion:

1. `M1-01` Contract-source unification in browser host/frontend.
2. `M1-02` Engine native/wasm parity regression suite for critical flows.
3. `M1-04` Transport module decomposition and mapping isolation.
4. `M1-05` Browser frontend navigation state-machine test automation.
5. `M1-06` CI guardrails for contract drift and worklist drift.
6. `M1-07` Parser robustness hardening without feature-scope expansion.
7. `M1-08` Split high-churn files into boundary modules.
8. `M1-03` Engine API generator design/bootstrap (non-priority track in this sprint).

Reference board: `docs/waves/MAINTENANCE_WORK_ITEMS.md`.

## Next In Line (Bedrock Compliance Sprint Candidate - 2026-03-02)

This sprint slice prioritizes bedrock conformance closure over feature breadth:

1. `W1-02` Bytecode structural verification (header/pools/indexes/jumps).
2. `W1-06` Fatal vs non-fatal script error taxonomy and `invalid` result semantics.
3. `R0-03` History/context fidelity completion (request-shape history entries).
4. `R0-06` Transport/request-policy and postfield plumbing (`cache-control`, `sendreferer`, postfield flow).
5. `T0-15` WAP caching model baseline and invalidation semantics.
6. `R0-09` BACK key hard-availability and `do type=prev` precedence conformance.

Sprint acceptance target:

- All six tickets have executable acceptance fixtures mapped in `docs/waves/SPEC_TEST_COVERAGE.md`.
- `docs/waves/WAVENAV_PLATFORM_COMPLIANCE_ANALYSIS.md` high-priority misses are reduced for history, cache, and script error semantics.

## Frame Interface Migration Program (Planning-Ready)

This migration track defines the engine-host rendering/input boundary transition from legacy render calls to structured frame/input contracts.

Authoritative docs:

- `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`
- `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`

Execution policy:

1. Run migration tickets as additive boundary changes first (`F0`), then renderer/input cutover (`F1-F4`).
2. Preserve native/wasm parity and deterministic runtime behavior at each phase gate.
3. Keep migration scope limited to interface and rendering boundary unless explicitly expanded.

## Kickoff Guardrail (Historical)

This board was prepared before implementation kickoff. Keep ticket statuses current as execution continues.

## Ticket Template

1. `ID`: stable id (`B0-01`, `B1-02`, etc.)
2. `Status`
3. `Depends On`
4. `Files`
5. `Build`
6. `Tests`
7. `Accept`
8. `Spec`: requirement IDs + section refs/SCR IDs from relevant `docs/waves/*TRACEABILITY*.md` docs

## Ticket Lifecycle Guardrail

- Completed (`done`) tickets remain immutable historical records.
- If a later compliance audit finds a gap in a completed area, add a new follow-up ticket that references the completed ticket in `Depends On` and notes.
- Do not rewrite ticket history by changing completed items back to active statuses.

## Initial Backlog (Prepared)

These were the first tickets prepared before Waves browser implementation started.

### P0-01 Repo bootstrap alignment for `browser/`

1. `Status`: `in-progress`
2. `Depends On`: none
3. `Files`:
- `browser/README.md`
- `browser/package.json`
- `docs/waves/WORK_ITEMS.md`
4. `Build`:
- Ensure naming and scripts reflect Waves browser app conventions.
- Confirm local runbook commands are documented.
5. `Tests`:
- Manual doc sanity pass and script command dry-run.
6. `Accept`:
- `browser/` onboarding docs are coherent and match repository conventions.

### P0-02 Tauri shell command contract freeze

1. `Status`: `todo`
2. `Depends On`: `P0-01`
3. `Files`:
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/transport.ts`
4. `Build`:
- Finalize initial command signatures (`health`, `fetch_deck` payload shape).
- Align Rust command payload naming with TypeScript contract naming.
5. `Tests`:
- Type checks for frontend imports.
- Rust compile-only sanity for command signatures.
6. `Accept`:
- Host command boundary is stable enough for integration work.

### P0-03 Transport module lifecycle spec

1. `Status`: `todo`
2. `Depends On`: `P0-02`
3. `Files`:
- `browser/src-tauri/src/*`
- `docs/waves/TECHNICAL_ARCHITECTURE.md`
4. `Build`:
- Define transport initialization/retry/reset policy and failure handling states.
- Document expected transport health and timeout policy.
5. `Tests`:
- Simulated transport unavailable scenario runbook.
6. `Accept`:
- Transport lifecycle behavior is documented and implementable without ambiguity.

### P0-04 First end-to-end integration fixture definition

1. `Status`: `todo`
2. `Depends On`: `P0-03`
3. `Files`:
- `docs/waves/*`
- `engine-wasm/host-sample/examples/*` (reference fixtures only)
4. `Build`:
- Define first browser integration scenario set (load, fragment nav, external nav intent).
- Record expected host state checkpoints for each scenario.
5. `Tests`:
- Checklist definitions only (no code execution yet).
6. `Accept`:
- Browser integration AC is written before code work starts.

## Phase B0: Host Skeleton Stabilization

### B0-01 Finalize Tauri host skeleton boot path

1. `Status`: `done`
2. `Depends On`: none
3. `Files`:
- `browser/src-tauri/src/lib.rs`
- `browser/src-tauri/tauri.conf.json`
- `browser/frontend/src/*`
4. `Build`:
- Ensure host boots with deterministic health/status command wiring.
- Validate frontend<->Tauri invoke path with one placeholder command.
5. `Tests`:
- Smoke boot test (`tauri dev`) without transport dependency.
6. `Accept`:
- Host opens and returns deterministic health string.

### B0-02 Host contract parity and session model scaffold

1. `Status`: `done`
2. `Depends On`: `B0-01`
3. `Files`:
- `browser/contracts/transport.ts`
- `browser/README.md`
4. `Build`:
- Freeze minimal host session state contract for URL/focus/card/error visibility.
5. `Tests`:
- Type-level contract checks in host frontend build.
6. `Accept`:
- Contract reflects required state for integration tickets.

## Phase B1: Transport + Engine Vertical Slice

### B1-01 Tauri command: fetch deck via Rust transport

1. `Status`: `done`
2. `Depends On`: `B0-01`, `B0-02`
3. `Files`:
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/transport.ts`
4. `Build`:
- Implement `fetch_deck` command calling in-process `transport-rust`.
- Return normalized payload (`wml`, `finalUrl`, `contentType`, error mapping).
5. `Tests`:
- Integration test against mocked or local transport endpoint/fixture.
6. `Accept`:
- Valid URL fetch yields deterministic payload without host crash.

### B1-02 Browser UI: URL load flow and status/error surfaces

1. `Status`: `done`
2. `Depends On`: `B1-01`
3. `Files`:
- `browser/frontend/src/*`
4. `Build`:
- Add URL input + load action.
- Show loading, success, and error states.
5. `Tests`:
- UI flow checks for success and transport error path.
6. `Accept`:
- User can load a deck URL and see deterministic status transitions.

### B1-03 Wire fetched deck into wasm runtime

1. `Status`: `done`
2. `Depends On`: `B1-02`
3. `Files`:
- `browser/frontend/src/*`
- `engine-wasm/contracts/wml-engine.ts`
4. `Build`:
- Feed fetched WML to engine via `loadDeckContext`.
- Render runtime output in host viewport.
5. `Tests`:
- End-to-end sample deck load and first-card render check.
6. `Accept`:
- Browser host renders first card from fetched deck.

## Phase B2: Browser Interaction Model

### B2-01 Input model bridge (directional + enter + softkey placeholders)

1. `Status`: `done`
2. `Depends On`: `B1-03`
3. `Files`:
- `browser/frontend/src/*`
4. `Build`:
- Map keyboard/softkey controls to runtime actions deterministically.
5. `Tests`:
- Key-sequence integration checks using known fixtures.
6. `Accept`:
- Focus/navigation in host matches runtime expectations.

### B2-02 External intent handoff and host-level navigation policy

1. `Status`: `done`
2. `Depends On`: `B2-01`
3. `Files`:
- `browser/frontend/src/*`
- `engine-wasm/contracts/wml-engine.ts`
4. `Build`:
- Consume `externalNavigationIntent` and perform host-driven fetch transition flow.
5. `Tests`:
- External link flow test ensuring active card behavior and next fetch behavior are deterministic.
6. `Accept`:
- External href path operates through host transport loop.

## Phase B3: Determinism & Regression Harness

### B3-01 Browser-side integration fixtures

1. `Status`: `done`
2. `Depends On`: `B2-02`
3. `Files`:
- `browser/frontend/src/*`
- `docs/waves/*`
4. `Build`:
- Add repeatable integration fixture suite for load->navigate->render flows.
5. `Tests`:
- Snapshot or structured state assertions per fixture scenario.
6. `Accept`:
- Browser integration regressions are detectable in CI.

### B3-02 Event timeline/debug export parity

1. `Status`: `done`
2. `Depends On`: `B3-01`
3. `Files`:
- `browser/frontend/src/*`
4. `Build`:
- Add deterministic event timeline and export path comparable to host-sample quality.
5. `Tests`:
- Validate export payload contains action/state chronology.
6. `Accept`:
- Debug artifacts can be attached for integration bug triage.

## Phase T: Transport Contract Alignment (Prepared)

### T0-01 Transport model and browser contract parity

1. `Status`: `done`
2. `Depends On`: `B0-02`, `S0-05`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/contracts/transport.ts`
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
4. `Build`:
- Align browser transport types with transport-rust request/response/error models.
- Enforce contract drift checks through unit/integration tests and docs parity.
5. `Tests`:
- Add schema/contract parity validation step in CI or script.
6. `Accept`:
- No drift between transport-rust model semantics and browser transport contract for shared fields.
7. `Spec`:
- `RQ-TRN-001..015`, `RQ-TRX-001..010`, `RQ-WAE-001`, `RQ-WAE-010`

### T0-02 Transport normalization guarantees for engine handoff

1. `Status`: `done`
2. `Depends On`: `T0-01`
3. `Files`:
- `transport-rust/src/lib.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/transport.ts`
- `browser/frontend/src/session-history.ts`
- `transport-rust/README.md`
4. `Build`:
- Freeze normalization guarantees (`wmlXml`, `baseUrl`, `contentType`, optional raw bytes) and failure semantics.
5. `Tests`:
- Integration tests for WML, WBXML->WML decode path, and unsupported-content failures.
6. `Accept`:
- Engine handoff payload is deterministic and contract-documented.
7. `Spec`:
- `RQ-RMK-007`, `RQ-WAE-001`, `RQ-WAE-005`, `RQ-TRN-004`

### T0-03 Protocol error taxonomy alignment

1. `Status`: `done`
2. `Depends On`: `T0-01`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/contracts/transport.ts`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Align error classification and mapping for timeout/retry/protocol/decode paths.
5. `Tests`:
- Table-driven transport error mapping tests.
6. `Accept`:
- Each error code has deterministic trigger conditions and host-facing semantics.
7. `Spec`:
- `RQ-TRN-007`, `RQ-TRN-011`, `RQ-TRN-012`, `RQ-TRX-006`, `RQ-TRX-007`

### T0-04 Cache/reload and `go` request-policy conformance follow-up

1. `Status`: `todo`
2. `Depends On`: `T0-02`, `A5-02`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/contracts/transport.ts`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/src-tauri/src/lib.rs`
4. `Build`:
- Add request-policy plumbing for WML task metadata (`cache-control`, method/post context, referer policy).
- Ensure `cache-control=no-cache` reload intent reaches transport deterministically.
5. `Tests`:
- Fixture tests for no-cache reload, same-deck suppression behavior, and deterministic request metadata mapping.
6. `Accept`:
- Transport behavior reflects runtime task metadata without host-side semantic drift.
7. `Spec`:
- `RQ-RMK-008`, `RQ-WAE-008`, `RQ-WAE-016`
8. `Notes`:
- Additive follow-up linked to completed normalization baseline (`T0-02`).

### T0-05 UA capability header conformance follow-up

1. `Status`: `todo`
2. `Depends On`: `T0-01`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/transport.ts`
4. `Build`:
- Add profile-gated emission path for `Accept`, `Accept-Charset`, `Accept-Encoding`, and `Accept-Language`.
- Keep defaults deterministic and explicit when capability advertising is disabled.
5. `Tests`:
- Integration tests asserting emitted headers and deterministic fallback behavior.
6. `Accept`:
- Capability advertisement behavior is explicit, test-backed, and contract-documented.
7. `Spec`:
- `RQ-WAE-013`, `RQ-WAE-001`

### T0-06 URI length and charset boundary conformance follow-up

1. `Status`: `todo`
2. `Depends On`: `T0-02`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Add deterministic handling/tests for 1024-octet URI boundaries and UTF-8/UTF-16 encoding paths.
5. `Tests`:
- Boundary fixtures for URI length, UTF-16 decode success, and deterministic encoding failure mapping.
6. `Accept`:
- URI/encoding behavior meets WAE baseline and remains regression-protected.
7. `Spec`:
- `RQ-WAE-010`, `RQ-WAE-012`

### T0-07 WBXML token/literal compatibility conformance follow-up

1. `Status`: `todo`
2. `Depends On`: `T0-02`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
4. `Build`:
- Add compatibility checks covering WBXML literal-vs-token decoding paths and section-6.1 tokenisation expectations at boundary level.
5. `Tests`:
- Fixture matrix for literal token values, binary token values, and deterministic decode failure classification.
6. `Accept`:
- WBXML boundary behavior is conformance-backed beyond decode happy-path checks.
7. `Spec`:
- `RQ-RMK-007`, `RQ-WAE-005`

### T0-08 WTP TID/MPL replay-window conformance follow-up

1. `Status`: `todo`
2. `Depends On`: `T0-03`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
4. `Build`:
- Add explicit responder-side TID decision policy and fixtures for cache/no-cache and duplicate-guarantee modes.
- Enforce initiator-side TID progression/rate guardrails relative to MPL assumptions for replay-window safety.
5. `Tests`:
- Fixture matrix for Table-6/7/8-like TID decisions and out-of-order invoke handling.
- Deterministic TID wrap/restart-window tests with trace assertions.
6. `Accept`:
- TID replay-window behavior is deterministic and explicitly profile-gated.
7. `Spec`:
- `RQ-TRN-007`, `RQ-TRN-016`

### T0-09 WSP connectionless primitive-profile conformance

1. `Status`: `todo`
2. `Depends On`: `T0-01`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
4. `Build`:
- Make WSP mode selection explicit (`connection-oriented`, `connectionless`, or both) with deterministic primitive-usage gating.
- Implement/validate connectionless primitive occurrence matrix behavior and deterministic invalid-primitive handling.
5. `Tests`:
- Primitive occurrence fixtures for `S-Unit-MethodInvoke`, `S-Unit-MethodResult`, `S-Unit-Push`.
6. `Accept`:
- Connectionless mode policy is explicit and test-backed; invalid primitive paths are deterministic.
7. `Spec`:
- `RQ-TRN-010`, `RQ-TRN-012`, `RQ-TRN-017`

### T0-10 WSP assigned-number registry conformance fixtures

1. `Status`: `todo`
2. `Depends On`: `T0-05`, `T0-07`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Add table-driven token-map fixtures for WSP PDU types, abort-reason codes, well-known parameters, and header-field names.
- Define deterministic handling policy for unassigned/unknown registry values.
5. `Tests`:
- Decode/encode round-trip fixtures anchored to assigned-number tables.
6. `Accept`:
- Assigned-number behavior is deterministic, profile-documented, and regression-guarded.
7. `Spec`:
- `RQ-TRN-014`, `RQ-TRN-018`

### T0-11 WSP capability-bound and negotiation-limit enforcement

1. `Status`: `todo`
2. `Depends On`: `T0-09`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
4. `Build`:
- Enforce min/intersection semantics for negotiated capabilities.
- Enforce negotiated SDU/message-size and outstanding-request bounds with deterministic abort/error surfacing.
5. `Tests`:
- Capability negotiation fixtures across client/server proposal mismatches and boundary exceed cases.
6. `Accept`:
- Capability negotiation and bounds behavior is deterministic and spec-linked.
7. `Spec`:
- `RQ-TRN-013`, `RQ-TRN-019`

### T0-12 Wireless Profiled TCP compatibility profile declaration

1. `Status`: `todo`
2. `Depends On`: `T0-01`
3. `Files`:
- `transport-rust/README.md`
- `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Declare explicit Waves TCP compatibility posture for profiled requirements (SACK/split/end-to-end/window-scale threshold behavior).
- Mark each requirement as implemented, delegated, or deferred for MVP with rationale.
5. `Tests`:
- Add compatibility-policy fixtures/checks that prevent silent drift in declared TCP posture.
6. `Accept`:
- TCP optimization baseline posture is explicit and traceable.
7. `Spec`:
- `RQ-TRX-009`

### T0-13 SMPP adaptation scope gate and fixture baseline

1. `Status`: `todo`
2. `Depends On`: `T0-01`
3. `Files`:
- `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- `transport-rust/README.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Make a hard scope decision for `WAP-159` path (`in scope now` vs `deferred`).
- If in scope, define `data_sm` mapping fixtures and WCMP payload type handling checks.
- If deferred, document non-blocking rationale and explicit exclusion guardrails.
5. `Tests`:
- Add either adapter fixtures (in-scope) or explicit policy assertions (deferred).
6. `Accept`:
- SMPP adaptation status is unambiguous and regression-guarded.
7. `Spec`:
- `RQ-TRX-010`

### T0-14 WAP networking profile decision record and migration gates

1. `Status`: `todo`
2. `Depends On`: `T0-09`, `T0-11`, `T0-12`, `T0-13`
3. `Files`:
- `docs/waves/TECHNICAL_ARCHITECTURE.md`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- `transport-rust/README.md`
4. `Build`:
- Publish an explicit profile decision for near-term and target-state transport:
  - current profile: gateway-bridged HTTP/WBXML normalization path
  - target profile: in-process WDP/WTP/WSP behavior lane and activation criteria
- Define non-negotiable boundary rules so engine/browser contracts stay stable across both profiles.
- Define migration gates that block profile promotion until required protocol fixtures pass.
5. `Tests`:
- Add profile-gate checks that assert declared mode/profile against fixture coverage state.
- Add one end-to-end fixture lane per declared profile to prevent drift in behavior expectations.
6. `Accept`:
- Networking architecture direction is explicit, versioned, and test-gated.
- Team can state exactly what is spec-compliant now versus planned for protocol-complete mode.
7. `Spec`:
- `RQ-TRN-001..019`, `RQ-TRX-001..010`

### T0-15 WAP caching model baseline and invalidation semantics

1. `Status`: `todo`
2. `Depends On`: `T0-04`, `R0-06`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/contracts/transport.ts`
- `browser/src-tauri/src/lib.rs`
- `docs/waves/WAE_SPEC_TRACEABILITY.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Implement a deterministic cache-policy baseline for deck/script/media retrieval and invalidation triggers.
- Ensure `cache-control=no-cache` and task-driven reload semantics route through one shared policy model.
5. `Tests`:
- Fixture matrix for cache hit, forced reload, stale invalidation, and request-policy override cases.
6. `Accept`:
- Cache behavior is explicit, deterministic, and verifiably aligned with the declared WAP profile.
7. `Spec`:
- `RQ-WAE-008`, `RQ-WAE-010`, `WML-29`, section `9.5.1`

## Phase W: WMLScript Runtime and VM (Active)

Reference architecture:

- `docs/waves/WAVESCRIPT_VM_ARCHITECTURE.md`
- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`

Compliance target for this lane:

- Drive Waves toward `~90-95%` practical WMLScript/WMLSL conformance for in-scope runtime behavior.
- Prioritize bedrock compliance closure before breadth-library expansion:
  - external-call/pragma/url invocation correctness
  - bytecode structure verification gates
  - deterministic function/local/conversion/error semantics
  - script content-type routing/handoff correctness

### W0-01 WMLScript integration contract and action model

1. `Status`: `done`
2. `Depends On`: host-sample integration kickoff
3. `Files`:
- `engine-wasm/contracts/wml-engine.ts`
- `docs/waves/WAVESCRIPT_VM_ARCHITECTURE.md`
4. `Build`:
- Define call-site contract from deck actions/events to script invocation model.
- Keep VM/interpreter ownership in `engine-wasm` and keep host behavior to side effects only (dialogs/timer wake/fetch-on-miss).
- Set refresh baseline to deferred semantics first; immediate-refresh behavior remains optional/feature-gated.
5. `Tests`:
- Contract-level fixture definitions only.
- Host-sample fixture list for softkey and event-driven invocation paths.
6. `Accept`:
- Script action model is explicit and implementation-ready.
7. `Spec`:
- `RQ-WMLS-001`, `RQ-WMLS-003`, `RQ-WMLS-017`, `RQ-WMLS-018`, `RQ-WMLS-021`, `RQ-WMLS-022`, `RQ-WAE-003`
8. `AC`:
- Script call-site metadata is representable without host-specific assumptions.
- Navigation intent shape supports last-call-wins defer behavior.
- Refresh behavior policy is explicitly documented as deferred baseline.
9. `Architecture Compliance`:
- [x] VM/interpreter logic remains in `engine-wasm` only.
- [x] Host-facing shape only defines side-effect capabilities (no host-defined script semantics).
- [x] Navigation/refresh outcomes are defined as post-invocation runtime effects.

### W0-02 Bytecode loader + decoder skeleton

1. `Status`: `done`
2. `Depends On`: `W0-01`
3. `Files`:
- `engine-wasm/engine/src/wavescript/decoder.rs`
- `engine-wasm/engine/src/wavescript/mod.rs`
4. `Build`:
- Introduce deterministic decoder entry point and resource bounds.
- Provide stable skeleton error taxonomy for empty/oversized-unit failures.
5. `Tests`:
- Valid/invalid unit parse tests.
- Decoder boundary tests for empty and max-size gates.
6. `Accept`:
- Decoder skeleton accepts bounded units and rejects malformed inputs safely.
7. `Spec`:
- `RQ-WMLS-008`, `RQ-WMLS-009`, `RQ-WMLS-010`
8. `AC`:
- Empty units fail deterministically.
- Oversized units fail before allocation/execute paths.
- Valid bounded units are preserved for VM handoff.
9. `Architecture Compliance`:
- [x] Decoder verification runs before VM execution entry.
- [x] Decoder enforces bounded resource constraints.
- [x] Decoder failures return deterministic trap/error variants.

### W0-03 VM core baseline (stack/call/return/limits)

1. `Status`: `done`
2. `Depends On`: `W0-02`
3. `Files`:
- `engine-wasm/engine/src/wavescript/vm.rs`
- `engine-wasm/engine/src/wavescript/value.rs`
4. `Build`:
- Implement bounded VM loop with traps and execution limits.
5. `Tests`:
- Instruction step/call-depth/stack-bound tests.
6. `Accept`:
- VM executes minimal bytecode path deterministically with bounded resources.
7. `Spec`:
- `RQ-WMLS-004`, `RQ-WMLS-005`, `RQ-WMLS-006`, `RQ-WMLS-010`
8. `Architecture Compliance`:
- [x] VM loop enforces instruction/call-depth/stack bounds.
- [x] VM traps are recoverable runtime errors (no panic/host crash).
- [x] Return path preserves deterministic result typing.

### W0-04 `WMLBrowser` var + navigation subset

1. `Status`: `done`
2. `Depends On`: `W0-03`
3. `Files`:
- `engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs`
- `engine-wasm/engine/src/runtime/events.rs`
4. `Build`:
- Add `getVar`, `setVar`, `go`, `prev`, and explicit refresh-behavior decision (`refresh` API or equivalent runtime invalidation signal).
5. `Tests`:
- Softkey/event-driven script invocation integration fixtures, including `go/go`, `go/prev`, and `prev/prev` compatibility profiling.
6. `Accept`:
- Script can mutate vars, trigger deterministic navigation intent, and apply card refresh behavior consistently after variable updates.
7. `Spec`:
- `RQ-WMLS-017`, `RQ-WMLS-018`, `RQ-WMLS-021`
8. `Architecture Compliance`:
- [x] `WMLBrowser` state mutation remains in engine runtime state.
- [x] Host is not responsible for navigation decision logic.
- [x] Deferred navigation/refresh application boundary is explicit and test-covered.

### W0-05 Timer/dialog integration baseline

1. `Status`: `in-progress`
2. `Depends On`: `W0-04`
3. `Files`:
- `engine-wasm/engine/src/wavescript/stdlib/dialogs.rs`
- `engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs`
- `engine-wasm/engine/src/runtime/events.rs`
- `engine-wasm/engine/src/lib.rs`
- `browser/contracts/engine.ts`
- `browser/frontend/src/main.ts`
- `browser/src-tauri/src/*`
4. `Build`:
- Add timer/event plumbing and dialog hostcall path.
5. `Tests`:
- `ontimer` and dialog invocation trace tests.
6. `Accept`:
- Timer-triggered script flow works with deterministic host/runtime behavior.
7. `Spec`:
- `RQ-WMLS-022`, `RQ-WAE-016`, `RQ-WAE-017`
8. `Architecture Compliance`:
- [ ] Dialog/timer features are host capability calls only.
- [ ] Timer semantics remain runtime-owned and deterministic.
- [ ] Host integration cannot bypass runtime error/trap handling model.

### W0-06 Bytecode verification gates follow-up

1. `Status`: `todo`
2. `Depends On`: `W0-02`
3. `Files`:
- `engine-wasm/engine/src/wavescript/decoder.rs`
- `engine-wasm/engine/src/wavescript/vm.rs`
- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
4. `Build`:
- Implement structural verification gates (header/pools/index/jump-target validity) before VM execution.
5. `Tests`:
- Verification-failure fixtures for malformed pools, invalid branch targets, and out-of-range references.
6. `Accept`:
- Decoder rejects structurally invalid units before interpreter execution begins.
7. `Spec`:
- `RQ-WMLS-008`, `RQ-WMLS-009`, `RQ-WMLS-010`
8. `Notes`:
- Additive compliance follow-up to completed decoder skeleton (`W0-02`).

### W0-07 `newContext` + `getCurrentCard` semantics follow-up

1. `Status`: `todo`
2. `Depends On`: `W0-04`
3. `Files`:
- `engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs`
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/contracts/wml-engine.ts`
4. `Build`:
- Implement `WMLBrowser.newContext` and `WMLBrowser.getCurrentCard` behavior per spec.
- Ensure interaction with pending `go`/`prev` requests is deterministic and spec-aligned.
5. `Tests`:
- Invocation fixtures for context reset semantics and current-card URL formatting (relative vs absolute).
6. `Accept`:
- Missing context APIs are present and behaviorally aligned with WMLScript library semantics.
7. `Spec`:
- `RQ-WMLS-019`, `RQ-WMLS-020`
8. `Notes`:
- Additive compliance follow-up to completed var/nav subset (`W0-04`).

### W0-08 External function access-control conformance follow-up

1. `Status`: `todo`
2. `Depends On`: `W0-01`, `W0-04`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/wavescript/*`
- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
4. `Build`:
- Enforce external-call constraints (`extern` visibility, access pragma checks, deterministic call failure categories).
5. `Tests`:
- Resolver fixtures for allowed/denied domain/path calls and non-extern function rejection.
6. `Accept`:
- External script invocation semantics include conformance access checks before execution.
7. `Spec`:
- `RQ-WMLS-001`, `RQ-WMLS-002`, `RQ-WMLS-003`

## Phase W1: Bedrock Compliance Closure (Priority Lane)

### W1-01 Script content-type routing and ownership boundaries

1. `Status`: `todo`
2. `Depends On`: `W0-01`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/contracts/transport.ts`
- `browser/src-tauri/src/lib.rs`
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
4. `Build`:
- Add explicit transport/host handling policy for:
  - `text/vnd.wap.wmlscript`
  - `application/vnd.wap.wmlscriptc`
- Keep boundary ownership explicit: transport classification + runtime execution handoff; no host-side script semantic execution.
5. `Tests`:
- Fixture matrix for both content types and deterministic unsupported/error mappings.
6. `Accept`:
- Script media types are routed deterministically and reflected in contract/docs.
7. `Spec`:
- `RQ-WMLS-011`

### W1-02 Bytecode structural verification (header/pools/indexes/jumps)

1. `Status`: `todo`
2. `Depends On`: `W0-06`
3. `Files`:
- `engine-wasm/engine/src/wavescript/decoder.rs`
- `engine-wasm/engine/src/wavescript/vm.rs`
- `engine-wasm/engine/src/lib.rs`
4. `Build`:
- Implement pre-execution verification gates for bytecode structure and references.
- Keep trap taxonomy deterministic and host-safe.
5. `Tests`:
- Malformed fixture set covering invalid section sizes, pool references, function boundaries, and jump targets.
6. `Accept`:
- Invalid bytecode fails before execution, with deterministic trap class.
7. `Spec`:
- `RQ-WMLS-008`, `RQ-WMLS-009`, `RQ-WMLS-010`

### W1-03 Extern/pragma/access-control conformance

1. `Status`: `todo`
2. `Depends On`: `W0-08`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/wavescript/*`
- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
4. `Build`:
- Enforce `extern` visibility and pragma-based external access control (`use url`, `use access`, `use meta`) for external invocation paths.
5. `Tests`:
- Allowed/denied call fixtures and non-extern rejection fixtures with deterministic outcomes.
6. `Accept`:
- External invocation behavior is policy-complete and spec-linked.
7. `Spec`:
- `RQ-WMLS-001`, `RQ-WMLS-002`, `RQ-WMLS-003`

### W1-04 Function/local/return and conversion semantics parity closure

1. `Status`: `todo`
2. `Depends On`: `W0-03`
3. `Files`:
- `engine-wasm/engine/src/wavescript/vm.rs`
- `engine-wasm/engine/src/wavescript/value.rs`
- `engine-wasm/engine/src/wavescript/stdlib/*`
4. `Build`:
- Close gaps against spec semantics for arity, pass-by-value, implicit return value, local initialization, and conversion behavior.
5. `Tests`:
- Deterministic conformance fixtures mapped to requirement IDs in `docs/waves/SPEC_TEST_COVERAGE.md`.
6. `Accept`:
- Function/call/conversion semantics are deterministic and spec-aligned for mandatory coverage scope.
7. `Spec`:
- `RQ-WMLS-004`, `RQ-WMLS-005`, `RQ-WMLS-006`

### W1-05 SCR conformance matrix and CI guardrail for WMLScript lane

1. `Status`: `todo`
2. `Depends On`: `W1-02`, `W1-03`, `W1-04`
3. `Files`:
- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `.github/workflows/*`
4. `Build`:
- Add machine-checkable mapping for mandatory SCRs (`WMLS-C-*`, `WMLSSL-*`) to implemented tests/status.
- Fail CI when mandatory SCRs are unmapped or regress to untracked.
5. `Tests`:
- CI dry-run with one intentionally unmapped mandatory SCR.
6. `Accept`:
- Bedrock WMLScript compliance cannot silently drift.
7. `Spec`:
- `RQ-WMLS-001..022` (mandatory subsets first)

### W1-06 Fatal/non-fatal script error taxonomy closure

1. `Status`: `todo`
2. `Depends On`: `W1-02`, `W1-04`
3. `Files`:
- `engine-wasm/engine/src/wavescript/vm.rs`
- `engine-wasm/engine/src/wavescript/value.rs`
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
4. `Build`:
- Implement explicit fatal vs non-fatal execution error classes and map non-fatal computational failures to `invalid` semantics.
- Keep host contract deterministic: invocation-abort vs recoverable-result outcomes must be machine-checkable.
 - Progress (`2026-03-02`): added structured execution `error_class` + `error_category` + `invocation_aborted` contract fields, non-fatal mapping for computational `TypeError` and `StackUnderflow` traps to `invalid`, preserved deferred side-effects for non-fatal outcomes, added fatal-abort recovery coverage, and enforced explicit `VmTrap` class/category matrix tests across all current variants.
5. `Tests`:
- Conformance fixtures for arithmetic/conversion/runtime-error classes with expected fatal/non-fatal outcomes.
- Integration fixtures proving host/runtime liveness after fatal script invocation failure.
6. `Accept`:
- Error handling behavior aligns with chapter `12` taxonomy and no longer relies on generic trap collapsing.
7. `Spec`:
- `RQ-WMLS-006`, `RQ-WMLS-010`

## Phase R: WAP-191 Full-Stack Conformance Completion

Reference:

- `docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md`
- `spec-processing/source-material/parsed-markdown/WAP-191-WML-20000219-a.cleaned.md`

### R0-01 WML-191 conformance matrix and CI gate

1. `Status`: `todo`
2. `Depends On`: `S0-14`
3. `Files`:
- `docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- `.github/workflows/*`
4. `Build`:
- Create a machine-checkable WML-191 conformance matrix (`WML-01..WML-75`) with status + test mapping.
- Add CI guardrail that fails when mandatory items are unmapped.
5. `Tests`:
- CI dry-run with one intentionally unmapped mandatory ID.
6. `Accept`:
- Mandatory WML IDs cannot silently regress to unmapped/untracked state.
7. `Spec`:
- `WAP-191` section `15.1` through `15.4`

### R0-02 Inter-card navigation process-order conformance

1. `Status`: `todo`
2. `Depends On`: `A5-02`, `T0-04`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/runtime/*`
- `transport-rust/src/lib.rs`
- `browser/frontend/src/session-history.ts`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Implement and verify section `12.5` step-order behavior for `go`, `prev`, `noop`, `refresh`, including deterministic task-failure handling.
- Ensure request metadata handoff (method/postfield/headers) stays aligned between runtime and transport.
5. `Tests`:
- Cross-layer fixtures for forward/back/refresh/error paths with trace assertions.
6. `Accept`:
- Runtime and host behavior match documented WML process ordering for covered flows.
7. `Spec`:
- `WML-18`, section `9.5`, section `12.5`

### R0-03 History/context fidelity completion

1. `Status`: `todo`
2. `Depends On`: `A5-01`, `B2-02`
3. `Files`:
- `engine-wasm/engine/src/runtime/*`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/transport.ts`
- `browser/frontend/src/session-history.ts`
4. `Build`:
- Expand history entries to include request identity fields needed by WML history semantics.
- Complete `newcontext` and context-reset behavior across runtime and browser history integration.
5. `Tests`:
- Deterministic back-stack fixtures with repeated URLs, mixed transitions, and context resets.
6. `Accept`:
- History and context behavior is deterministic and conforms to section `9.2` + `10.2`.
7. `Spec`:
- `WML-07`, `WML-10`, `WML-11`, `WML-13`

### R0-04 Parser semantic completeness for structure/task/form elements

1. `Status`: `todo`
2. `Depends On`: `M1-07`
3. `Files`:
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/src/runtime/*`
- `engine-wasm/engine/tests/fixtures/*`
- `docs/wml-engine/work-items.md`
4. `Build`:
- Complete parser/runtime coverage for `head/template/access/meta`, `do/onevent`, `select/option/optgroup/input/fieldset`, `timer`, and associated validity constraints.
- Keep deterministic failure behavior for invalid bindings/conflicts.
5. `Tests`:
- Fixture matrix for element parse/validation and runtime effects.
6. `Accept`:
- Core WML element families in section `11` are represented or explicitly profile-gated.
7. `Spec`:
- `WML-21`, `WML-25`, `WML-26`, `WML-33`, `WML-34`, `WML-39`, `WML-40`, `WML-41`, `WML-43`, `WML-47`, `WML-48`, `WML-52`, `WML-53`, `WML-66`, `WML-67`, `WML-69`

### R0-05 Renderer semantics completion (`11.8`/`11.9`)

1. `Status`: `todo`
2. `Depends On`: `B5-02`, `B5-03`, `C5-01`, `C5-02`
3. `Files`:
- `engine-wasm/engine/src/layout/*`
- `engine-wasm/engine/src/render/*`
- `engine-wasm/engine/tests/fixtures/*`
4. `Build`:
- Close remaining text/paragraph/table/pre/image semantic gaps and maintain deterministic render output.
- Preserve logical focus semantics under wrap and inline break behavior.
5. `Tests`:
- Snapshot and semantic fixtures across viewport widths and mixed markup.
6. `Accept`:
- Renderer behavior aligns with section `11.8` and `11.9` requirements for implemented profiles.
7. `Spec`:
- `WML-24`, `WML-32`, `WML-36`, `WML-46`, `WML-49`, `WML-50`, `WML-54..59`, `WML-68`, `WML-73`, `WML-75`

### R0-06 Transport/request-policy and postfield plumbing

1. `Status`: `todo`
2. `Depends On`: `T0-04`, `R0-02`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/contracts/transport.ts`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/src-tauri/src/lib.rs`
4. `Build`:
- Add runtime-to-transport request-policy channel for task metadata (`cache-control`, referer policy, postfield payload context).
- Preserve boundary ownership: transport executes requests, runtime defines semantic intent.
5. `Tests`:
- End-to-end request-shape fixtures for form submit and refresh/no-cache scenarios.
6. `Accept`:
- Request metadata semantics are deterministic and traceable to runtime task state.
7. `Spec`:
- `WML-29`, `WML-37`, `WML-52`, section `9.5.1`, section `12.5`

### R0-07 Browser policy path: access control, low-memory, unknown-DTD behavior

1. `Status`: `todo`
2. `Depends On`: `R0-04`
3. `Files`:
- `browser/frontend/src/*`
- `browser/src-tauri/src/*`
- `engine-wasm/contracts/wml-engine.ts`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Implement policy-consistent handling for deck access-control metadata, low-memory behavior toggles, and unknown-DTD handling strategy.
- Keep enforcement at host boundary where required by architecture constraints.
5. `Tests`:
- Policy fixtures and integration tests for allow/deny paths and deterministic error/reporting behavior.
6. `Accept`:
- Browser host has explicit, test-backed policy behavior for sections `12.1`-`12.4`.
7. `Spec`:
- `WML-14`, `WML-15`, `WML-16`, `WML-17`

### R0-08 WML encoder/validation tooling and WBXML conformance fixtures

1. `Status`: `todo`
2. `Depends On`: `T0-07`
3. `Files`:
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
4. `Build`:
- Add tooling/fixtures that validate WML token table expectations, XML well-formed/validation gates, and server/client conformance constraints.
- Keep ownership explicit where behavior is authoring/tooling vs runtime-execution.
5. `Tests`:
- Fixture matrix for valid/invalid tokenization and decode compatibility classes.
6. `Accept`:
- Section `14` and `15.2/15.3/15.4` obligations are concretely represented in testable artifacts.
7. `Spec`:
- `WML-60`, `WML-61`, `WML-62`, `WML-63`, `WML-64`, `WML-65`, `WML-70`

### R0-09 BACK key hard-availability and `do type=prev` precedence

1. `Status`: `todo`
2. `Depends On`: `R0-02`, `R0-03`
3. `Files`:
- `engine-wasm/engine/src/runtime/*`
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `browser/frontend/src/*`
- `browser/contracts/transport.ts`
- `docs/waves/WAE_SPEC_TRACEABILITY.md`
4. `Build`:
- Guarantee BACK is always user-accessible and maps to deterministic history pop semantics.
- Implement WML1 override behavior where first-in-document-order `do type="prev"` takes precedence for BACK behavior.
5. `Tests`:
- Fixture set for BACK availability, stack-pop behavior, and `do type=prev` precedence with conflicting bindings.
6. `Accept`:
- BACK semantics are always available and precedence rules are deterministic across runtime + host UI paths.
7. `Spec`:
- `RQ-WAE-017`, section `9.2`, section `9.7`

## Phase S: Source-Material Deep Audit (Prepared)

Reference:

- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`

### S0-01 WAE semantic extraction and traceability

1. `Status`: `done`
2. `Depends On`: none
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `spec-processing/source-material/WAP-236-WAESpec-20020207-a.pdf`
- `spec-processing/source-material/WAP-237-WAEMT-20010515-a.pdf`
4. `Build`:
- Extract normative runtime/browser semantic requirements used by Waves engine and host integration.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- WAE requirement matrix exists with section-linked AC.
7. `Spec`:
- `WAP-236`, `WAP-237`

### S0-02 Transport protocol traceability for rewrite phases

1. `Status`: `done`
2. `Depends On`: `S0-01`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `spec-processing/source-material/WAP-230-WSP-20010705-a.pdf`
- `spec-processing/source-material/WAP-224-WTP-20010710-a.pdf`
- `spec-processing/source-material/OMA-WAP-224_002-WTP-SIN-20020827-a.PDF`
- `spec-processing/source-material/WAP-259-WDP-20010614-a.pdf`
4. `Build`:
- Build requirement matrix for protocol behavior needed in Rust migration phases 2-5.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- Transport traceability doc exists with mandatory/optional split and phase mapping.
7. `Spec`:
- `WAP-230`, `WAP-224`, `OMA-WAP-224_002`, `WAP-259`

### S0-03 Coverage dashboard and gap register

1. `Status`: `done`
2. `Depends On`: `S0-02`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `docs/README.md`
- `docs/waves/SPEC_COVERAGE_DASHBOARD.md`
4. `Build`:
- Add a single dashboard page linking all traceability docs and listing uncovered requirements.
5. `Tests`:
- Documentation consistency check.
6. `Accept`:
- Team can identify coverage and gaps in one place.
7. `Spec`:
- Aggregated references from all in-scope Waves traceability docs.

### S0-04 Security boundary traceability (WTLS/TLS/E2E)

1. `Status`: `done`
2. `Depends On`: `S0-03`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `spec-processing/source-material/WAP-261-WTLS-20010406-a.pdf`
- `spec-processing/source-material/WAP-261_100-WTLS-20010926-a.pdf`
- `spec-processing/source-material/WAP-261_101-WTLS-20011027-a.pdf`
- `spec-processing/source-material/WAP-261_102-WTLS-20011027-a.pdf`
- `spec-processing/source-material/WAP-219-TLS-20010411-a.pdf`
- `spec-processing/source-material/WAP-219_100-TLS-20011029-a.pdf`
- `spec-processing/source-material/WAP-187-TransportE2ESec-20010628-a.pdf`
- `spec-processing/source-material/WAP-187_101-TransportE2ESec-20011009-a.pdf`
4. `Build`:
- Build requirements + AC matrix for security semantics and map to Waves simulation policy.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- Security boundary requirements are explicit and mapped to current/future implementation stance.
7. `Spec`:
- `WAP-261*`, `WAP-219*`, `WAP-187*`

### S0-05 Contract mapping from spec requirements

1. `Status`: `done`
2. `Depends On`: `S0-04`
3. `Files`:
- `engine-wasm/contracts/wml-engine.ts`
- `transport-rust/src/lib.rs`
- `browser/contracts/transport.ts`
- `docs/waves/*TRACEABILITY*.md`
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
4. `Build`:
- Map every implemented and planned contract field/behavior to spec requirement IDs.
5. `Tests`:
- Documentation consistency check.
6. `Accept`:
- Contract surfaces are traceable to spec IDs and uncovered contract gaps are listed.
7. `Spec`:
- Aggregated IDs from transport/WAE/WMLScript/security traceability docs.

### S0-06 Transport-adjacent spec extraction (HTTP/TCP/HTTPSM/WCMP)

1. `Status`: `done`
2. `Depends On`: `S0-03`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `spec-processing/source-material/WAP-229-HTTP-20010329-a.pdf`
- `spec-processing/source-material/WAP-229_001-HTTP-20011031-a.pdf`
- `spec-processing/source-material/WAP-223-HTTPSM-20001213-a.pdf`
- `spec-processing/source-material/WAP-223_101-HTTPSM-20010928-a.pdf`
- `spec-processing/source-material/WAP-225-TCP-20010331-a.pdf`
- `spec-processing/source-material/WAP-202-WCMP-20010624-a.pdf`
- `spec-processing/source-material/WAP-159-WDPWCMPAdapt-20010713-a.pdf`
4. `Build`:
- Build requirements + AC matrix for transport-adjacent interoperability and gateway adaptation boundaries.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- Transport-adjacent requirements are explicitly captured with section-linked references and SIN precedence.
7. `Spec`:
- `WAP-229*`, `WAP-223*`, `WAP-225`, `WAP-202`, `WAP-159`

### S0-07 Runtime-markup extraction (WML/WBXML lineage)

1. `Status`: `done`
2. `Depends On`: `S0-03`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `spec-processing/source-material/WAP-191-WML-20000219-a.pdf`
- `spec-processing/source-material/WAP-191_102-WML-20001213-a.pdf`
- `spec-processing/source-material/WAP-191_104-WML-20010718-a.pdf`
- `spec-processing/source-material/WAP-191_105-WML-20020212-a.pdf`
- `spec-processing/source-material/WAP-192-WBXML-20010725-a.pdf`
- `spec-processing/source-material/WAP-192_105-WBXML-20011015-a.pdf`
4. `Build`:
- Build requirements + AC matrix for deterministic WML deck/card semantics and WBXML boundary ownership.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- Runtime-markup requirements are captured with explicit precedence notes and section-linked references.
7. `Spec`:
- `WAP-191*`, `WAP-192*`

### S0-08 Security PKI/WIM extraction

1. `Status`: `done`
2. `Depends On`: `S0-04`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `spec-processing/source-material/WAP-211-WAPCert-20010522-a.pdf`
- `spec-processing/source-material/WAP-211_104-WAPCert-20010928-a.pdf`
- `spec-processing/source-material/OMA-WAP-211_105-WAPCert-SIN-20020520-a.pdf`
- `spec-processing/source-material/WAP-217-WPKI-20010424-a.pdf`
- `spec-processing/source-material/WAP-217_103-WPKI-20011102-a.pdf`
- `spec-processing/source-material/OMA-WAP-217_105-WPKI-SIN-20020816-a.pdf`
- `spec-processing/source-material/WAP-260-WIM-20010712-a.pdf`
- `spec-processing/source-material/OMA-WAP-260_100-WIM-SIN-20010725-a.pdf`
- `spec-processing/source-material/OMA-WAP-260_101-WIM-SIN-20020107-a.pdf`
4. `Build`:
- Build requirements + AC matrix for WAP certificate, trust-distribution, and WIM profile boundaries.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- PKI/WIM requirements and defer/enable boundaries are explicit and section-linked.
7. `Spec`:
- `WAP-211*`, `WAP-217*`, `WAP-260*`, `OMA-WAP-211_105`, `OMA-WAP-217_105`, `OMA-WAP-260_100`, `OMA-WAP-260_101`

### S0-09 Architecture-context extraction

1. `Status`: `done`
2. `Depends On`: `S0-03`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `spec-processing/source-material/WAP-210-WAPArch-20010712-a.pdf`
- `spec-processing/source-material/WAP-196-ClientID-20010409-a.pdf`
- `spec-processing/source-material/WAP-188-WAPGenFormats-20010710-a.pdf`
4. `Build`:
- Capture architecture-context constraints that influence conformance framing and contract semantics.
5. `Tests`:
- Documentation consistency check.
6. `Accept`:
- Architecture-context constraints are documented and scoped as context vs direct runtime requirements.
7. `Spec`:
- `WAP-210`, `WAP-196`, `WAP-188`

### S0-10 Deferred capability extraction (WMLScript Crypto + UAProf)

1. `Status`: `done`
2. `Depends On`: `S0-03`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `spec-processing/source-material/WAP-161-WMLScriptCrypto-20010620-a.pdf`
- `spec-processing/source-material/WAP-161_101-WMLScriptCrypto-20010730-a.pdf`
- `spec-processing/source-material/WAP-248-UAProf-20011020-a.pdf`
4. `Build`:
- Extract requirements and convert them into explicit defer decisions with future AC triggers.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- Deferred capabilities are tracked as reviewed, with concrete future implementation gates.
7. `Spec`:
- `WAP-161*`, `WAP-248`

### S0-11 Runtime-markup lineage consolidation tail

1. `Status`: `done`
2. `Depends On`: `S0-07`
3. `Files`:
- `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
- `spec-processing/source-material/WAP-238-WML-20010911-a.pdf`
- `spec-processing/source-material/spec-wml-19990616.pdf`
4. `Build`:
- Consolidate remaining WML lineage documents into runtime-markup precedence and compatibility notes.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- Runtime-markup family no longer has unresolved in-scope catalog-only files.
7. `Spec`:
- `WAP-238`, `spec-wml-19990616`

### S0-12 Out-of-scope domain extraction sweep

1. `Status`: `done`
2. `Depends On`: `S0-03`
3. `Files`:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`
- `docs/waves/OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md`
- `spec-processing/source-material/WAP-120-WAPCachingMod-20010413-a.pdf`
- `spec-processing/source-material/WAP-167*.pdf`
- `spec-processing/source-material/WAP-168*.pdf`
- `spec-processing/source-material/WAP-175*.pdf`
- `spec-processing/source-material/WAP-182*.pdf`
- `spec-processing/source-material/WAP-183*.pdf`
- `spec-processing/source-material/WAP-184*.pdf`
- `spec-processing/source-material/WAP-185*.pdf`
- `spec-processing/source-material/WAP-186*.pdf`
- `spec-processing/source-material/WAP-204*.pdf`
- `spec-processing/source-material/WAP-205*.pdf`
- `spec-processing/source-material/WAP-206*.pdf`
- `spec-processing/source-material/WAP-209*.pdf`
- `spec-processing/source-material/WAP-213*.pdf`
- `spec-processing/source-material/WAP-227*.pdf`
- `spec-processing/source-material/WAP-228*.pdf`
- `spec-processing/source-material/WAP-231*.pdf`
- `spec-processing/source-material/WAP-234*.pdf`
- `spec-processing/source-material/WAP-235*.pdf`
- `spec-processing/source-material/WAP-239*.pdf`
- `spec-processing/source-material/WAP-244*.pdf`
- `spec-processing/source-material/WAP-247*.pdf`
- `spec-processing/source-material/WAP-249*.pdf`
- `spec-processing/source-material/WAP-250*.pdf`
- `spec-processing/source-material/WAP-251*.pdf`
- `spec-processing/source-material/WAP-255*.pdf`
- `spec-processing/source-material/WAP-266*.pdf`
- `spec-processing/source-material/WAP-268*.pdf`
- `spec-processing/source-material/WAP-269*.pdf`
- `spec-processing/source-material/WAP-270*.pdf`
- `spec-processing/source-material/WAP-277*.pdf`
4. `Build`:
- Extract normative obligations for remaining out-of-scope families and convert to explicit defer posture + future activation AC.
5. `Tests`:
- AC checklist only (planning stage).
6. `Accept`:
- Canonical source-material ledger has no `catalog-reviewed` entries remaining.
7. `Spec`:
- Aggregated out-of-scope families listed above.

### S0-13 AC-to-test coverage matrix

1. `Status`: `done`
2. `Depends On`: `S0-05`
3. `Files`:
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `docs/wml-engine/test-strategy.md`
- `docs/waves/WORK_ITEMS.md`
4. `Build`:
- Map requirement groups to current and planned test assets across engine, host sample, transport, and browser.
5. `Tests`:
- Documentation consistency check.
6. `Accept`:
- Coverage matrix exists with explicit `covered`/`partial`/`planned` status and immediate cross-project checklist.
7. `Spec`:
- Aggregated requirement groups from `docs/waves/*TRACEABILITY*.md`.

### S0-14 Project plan synchronization sweep

1. `Status`: `done`
2. `Depends On`: `S0-05`, `S0-13`
3. `Files`:
- `docs/wml-engine/work-items.md`
- `docs/wml-engine/ticket-plan.md`
- `docs/wml-engine/requirements-matrix.md`
- `docs/wml-engine/test-strategy.md`
- `engine-wasm/README.md`
- `transport-rust/README.md`
- `browser/README.md`
- `docs/browser-emulator/README.md`
4. `Build`:
- Integrate traceability + checklist direction directly into existing project/library planning docs.
5. `Tests`:
- Documentation consistency check.
6. `Accept`:
- Engine/browser/transport plans all reference current Waves traceability, contract mapping, and test coverage artifacts.
7. `Spec`:
- Aggregated requirement groups from `docs/waves/*TRACEABILITY*.md`.

## Phase S1: Spec-Processing Quality and Trace Governance (Low Priority)

### S1-01 Table-fidelity manual spot-check lane for ambiguous captions

1. `Status`: `done`
2. `Depends On`: `S0-14`
3. `Files`:
- `tmp/docling-rerun-remaining/cleanup-report.txt`
- `tmp/docling-rerun-remaining/core/WAP-191_104-WML-20010718-a.md`
- `tmp/docling-rerun-remaining/core/WAP-191_104-WML-20010718-a.cleaned.md`
- `docs/waves/DOCLING_RERUN_REMAINING_DELTA_REPORT_2026-03-02.md`
4. `Build`:
- Perform manual PDF-grounded review for captions flagged as non-normalized by automated cleanup detection.
- Confirm whether each flagged caption is true table loss vs mixed prose region and document final disposition.
5. `Tests`:
- Spot-check checklist against source PDF and cleaned markdown output.
6. `Accept`:
- Every flagged ambiguous table caption has explicit final status (`normalized`, `intentionally prose`, `needs follow-up extraction`).
7. `Spec`:
- `WAP-191_104` (`Table 1` spot-check from rerun cleanup report).
8. `Notes`:
- Manual spot-check confirms `Table 1. Pre-defined DO types` content is present as a normalized markdown table, with caption placement causing the detector false-positive.

### S1-02 Markdown cleaner hardening for heavy TOC/legal-noise specs

1. `Status`: `done`
2. `Depends On`: `S1-01`
3. `Files`:
- `spec-processing/parse-pdf-remaining.fish`
- `spec-processing/parse-pdf.fish`
- `spec-processing/scripts/docling-profile.fish`
- `spec-processing/scripts/promote-docling-cleaned.fish`
- `spec-processing/README.md`
4. `Build`:
- Reduce residual noise in cleaned outputs for long legal/TOC-heavy documents while preserving technical meaning.
- Freeze deterministic cleaner rules so repeated runs produce stable output deltas.
5. `Tests`:
- Manual rerun using shared Docling profile and compare stable output inventory.
6. `Accept`:
- Cleaner output is stable and significantly reduces non-technical boilerplate drift in flagged-heavy docs.
7. `Spec`:
- Cross-cutting documentation fidelity lane (applies to all in-scope spec families).
8. `Notes`:
- Shared deterministic Docling profile was centralized and parse scripts now use that single profile source.

### S1-03 Extraction quality gate for parser-noise regressions

1. `Status`: `done`
2. `Depends On`: `S1-02`
3. `Files`:
- `docs/waves/SPEC_COVERAGE_DASHBOARD.md`
- `spec-processing/scripts/check-docling-cleaned-quality.sh`
- `docs/waves/DOCLING_CLEANED_QUALITY_REPORT_2026-03-02.md`
4. `Build`:
- Add lightweight quality gate checks for cleaned-spec artifacts (e.g., extreme TOC noise density, unresolved table-caption ambiguity count, malformed markdown table ratios).
- Keep thresholds advisory-first as a manual script lane (no CI integration).
5. `Tests`:
- Manual dry-run via quality script in advisory mode and strict mode.
6. `Accept`:
- Extraction quality regressions are visible and cannot silently accumulate.
7. `Spec`:
- Traceability-quality governance for all spec-derived requirement artifacts.
8. `Notes`:
- Explicitly kept out of CI per project preference; checks run manually.

### S1-04 Source-to-clean provenance manifest and reproducibility trail

1. `Status`: `done`
2. `Depends On`: `S1-02`
3. `Files`:
- `spec-processing/scripts/generate-docling-provenance.sh`
- `docs/waves/SOURCE_CLEAN_PROVENANCE_MANIFEST.md`
- `docs/waves/provenance/docling-provenance-2026-03-02.csv`
- `spec-processing/README.md`
4. `Build`:
- Record source-to-clean provenance metadata (source path, cleaned path, line deltas, table-caption outcomes, run date/profile).
- Keep manifest append-only so audit history remains visible across reruns.
5. `Tests`:
- Manifest consistency check against current cleaned-file inventory.
6. `Accept`:
- Team can reconstruct when and how any cleaned spec artifact was produced and validated.
7. `Spec`:
- Documentation governance lane for reproducible spec extraction and auditability.
8. `Notes`:
- Provenance snapshot generated for `2026-03-02` with per-file CSV and aggregate manifest totals.

### S1-05 Promote validated cleaned rerun artifacts into canonical parsed corpus

1. `Status`: `done`
2. `Depends On`: `S1-01`, `S1-02`
3. `Files`:
- `tmp/docling-rerun/core/*.cleaned.md`
- `tmp/docling-rerun/ext/*.cleaned.md`
- `tmp/docling-rerun-remaining/core/*.cleaned.md`
- `tmp/docling-rerun-remaining/ext/*.cleaned.md`
- `spec-processing/source-material/parsed-markdown/docling-cleaned/`
- `spec-processing/scripts/promote-docling-cleaned.fish`
- `docs/waves/DOCLING_RERUN_BASE_DELTA_REPORT_2026-03-02.md`
- `docs/waves/DOCLING_RERUN_REMAINING_DELTA_REPORT_2026-03-02.md`
4. `Build`:
- Promote validated cleaned outputs from both temporary rerun waves into canonical parsed-markdown storage used by long-term analysis workflows.
- Preserve source-file naming lineage to avoid ambiguity across multiple extraction passes.
5. `Tests`:
- Inventory check that every promoted canonical file has exactly one source markdown parent and one cleanup report entry.
6. `Accept`:
- Cleaned artifacts used by planning/compliance analysis are durable and no longer depend on temporary directories.
7. `Spec`:
- Cross-cutting source-fidelity governance for all in-scope spec families.
8. `Notes`:
- Canonical cleaned corpus currently contains `48` finalized `.cleaned.md` artifacts.

### S1-06 Canonical source-reference path normalization across traceability docs

1. `Status`: `done`
2. `Depends On`: `S1-04`
3. `Files`:
- `docs/waves/*TRACEABILITY*.md`
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`
- `docs/waves/WAVESCRIPT_VM_ARCHITECTURE.md`
- `docs/waves/WAVENAV_PLATFORM_COMPLIANCE_ANALYSIS.md`
4. `Build`:
- Normalize source references to canonical root-level `spec-processing/source-material/*.pdf` paths (except when a mirror path is explicitly intentional and labeled).
- Remove inconsistent mirror-folder references that can cause provenance drift in audits.
5. `Tests`:
- Lint/check script that flags non-canonical source-material paths in traceability docs unless explicitly allowlisted.
6. `Accept`:
- Traceability docs consistently resolve to canonical source files, reducing audit ambiguity.
7. `Spec`:
- Source-material governance rule from `SOURCE_MATERIAL_MASTER_AUDIT` canonical-source policy.
8. `Notes`:
- Canonical-path normalization completed across active Waves traceability/compliance docs on `2026-03-02`.
