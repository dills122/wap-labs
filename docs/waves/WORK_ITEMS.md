# Waves Browser Work Items (Integration Track)
Purpose: execution board for Waves desktop browser integration work.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

Current mode: active execution. Completed and in-progress tickets are tracked below.

Archive:

- `docs/waves/WORK_ITEMS_ARCHIVE.md`

## Baseline Assumptions

These assumptions are active for this board and should not be re-litigated in each ticket:

1. `transport-rust/` gateway-bridged behavior is functionally validated via CLI probes.
2. protocol-native networking (`WDP -> WTP -> WSP`) remains the current high-risk implementation lane.
3. `engine-wasm/` runtime/rendering has reached a substantial milestone and remains integration-ready while networking core is completed.

Project-level priority remains multi-lane:

1. close committed runtime/compliance tickets already in-flight (`R0-*`, `W0-*`, `W1-*` scoped work)
2. execute protocol-native networking closure (`T0-19`, `T0-18`, `T0-20`, `T0-22`, `T0-21`)
3. defer broad feature expansion in any lane until these bedrock closures are stable

Networking is a top-tier lane, not a replacement for all other committed bedrock work.

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

- Master prioritized sprint plan: `docs/waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md`
- Engine execution board: `docs/wml-engine/work-items.md`
- Engine phased backlog: `docs/wml-engine/ticket-plan.md`
- Maintenance/debt board: `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- Transport planning/checklist: `transport-rust/README.md`
- Browser planning/checklist: `browser/README.md`

Canonical sprint priority rule:

1. `docs/waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md` is the single ordering authority when section-level "Next In Line" lists differ.
2. Section-level lists below are lane-local guidance and must not override master P0/P1 gating.

## Next In Line (Architecture Maintenance Sprint)

Next execution block is architecture hardening across all active libraries before additional feature expansion:

1. `M1-08` Split high-churn files into boundary modules (engine scope complete; browser/transport follow-ups remain).
2. `M1-09` Engine-host frame interface migration execution.
3. `M1-03` Engine API generator design/bootstrap (non-priority track in this sprint).

Reference board: `docs/waves/MAINTENANCE_WORK_ITEMS.md`.

## Next In Line (Networking Regroup Sprint - 2026-03-05)

Priority execution order for networking MVP closure:

1. `T0-19` WDP datagram trait + UDP mapping baseline.
2. `T0-18` WTP retransmission, duplicate handling, and NACK hold-off policy.
3. `T0-20` WSP registry/token completion and unknown-token behavior.
4. `T0-22` interop replay harness (`CONNECT`/`GET`/`REPLY` + retransmit/duplicate lanes).
5. `T0-21` WTLS phase boundary and minimal active lane (kept disabled by default).

Sprint policy:

1. Do not promote profile from `gateway-bridged` to `wap-net-core` before `T0-18..T0-22` gates are green.
2. Keep this lane capacity-bounded alongside committed runtime/compliance lanes; do not starve in-flight `R0-*`/`W0-*` closure tickets.
3. Defer non-bedrock feature expansion unless required to unblock committed lanes.

## Next In Line (Committed Bedrock Compliance Sprint - 2026-03-04)

Committed sprint sequence:

1. `T0-04` Cache/reload and `go` request-policy conformance follow-up.
2. `A5-01` History entry fidelity follow-up.
3. `R0-02` Inter-card navigation process-order conformance.
4. `R0-03` History/context fidelity completion.
5. `W0-06` Bytecode verification gates follow-up.
6. Stretch: `W1-02` Bytecode structural verification closure.

Execution plan and gates:

- `docs/waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md` (cross-lane canonical sprint priority plan)
- `docs/waves/SPRINT_PLAN_2026-03_BEDROCK_COMPLIANCE.md`

Sprint acceptance target:

- Each committed ticket has executable acceptance fixtures mapped in `docs/waves/SPEC_TEST_COVERAGE.md`.
- `docs/waves/WAVENAV_PLATFORM_COMPLIANCE_ANALYSIS.md` high-priority misses are reduced for history, request-policy, and bytecode verification semantics.

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

## Spec Change Protocol

When a PR changes spec interpretation, requirement mapping, or contract behavior, update all linked artifacts in the same PR:

1. traceability source:
- relevant `docs/waves/*TRACEABILITY*.md` requirement entries (`Spec`, `AC`, `Evidence`)
2. tests/fixtures:
- `docs/waves/SPEC_TEST_COVERAGE.md` row(s) with concrete file targets and command(s)
3. contract mapping:
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md` for impacted contract surfaces
4. requirement index:
- `docs/waves/REQUIREMENT_INDEX.md` owner/lane/status row(s)
5. coverage/meta dashboards:
- `docs/waves/SPEC_COVERAGE_DASHBOARD.md` if scope/status changes
6. source governance:
- `docs/waves/SOURCE_AUTHORITY_POLICY.md` and `docs/waves/OPEN_SPEC_QUESTIONS.md` when precedence or unresolved policy shifts

## Ticket Lifecycle Guardrail

- Completed (`done`) tickets remain immutable historical records.
- If a later compliance audit finds a gap in a completed area, add a new follow-up ticket that references the completed ticket in `Depends On` and notes.
- Do not rewrite ticket history by changing completed items back to active statuses.

## Initial Backlog (Prepared)

Historical kickoff tickets (`P0-*`) are archived in:

- `docs/waves/WORK_ITEMS_ARCHIVE.md`

## Phase B0-B3 (Archived)

Completed `B0` through `B3` tickets are archived in:

- `docs/waves/WORK_ITEMS_ARCHIVE.md`

## Phase T: Transport Contract Alignment (Prepared)

### T0-04 Cache/reload and `go` request-policy conformance follow-up

1. `Status`: `done`
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
- `cargo test --lib` (`transport-rust`) covers no-cache header mapping, same-deck POST suppression, and deterministic request-policy mapping.
- Browser navigation-state regression tests cover reload/external-intent request-policy propagation.
- `cargo test` (`browser/src-tauri`) covers snapshot exposure/clear semantics for external navigation request-policy metadata.
6. `Accept`:
- Transport behavior reflects runtime task metadata without host-side semantic drift.
7. `Spec`:
- `RQ-RMK-008`, `RQ-WAE-008`, `RQ-WAE-016`
8. `Notes`:
- Completed as additive follow-up linked to normalization baseline (`T0-02`).
- Landed transport request-policy contract (`cacheControl`, `refererUrl`, `postContext`) and runtime->host->transport external-intent metadata plumbing.

### T0-05 UA capability header conformance follow-up

1. `Status`: `done`
2. `Depends On`: `T0-01`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/transport.ts`
4. `Build`:
- Add profile-gated emission path for `Accept`, `Accept-Charset`, `Accept-Encoding`, and `Accept-Language`.
- Keep defaults deterministic and explicit when capability advertising is disabled.
5. `Tests`:
- `cargo test --lib` (`transport-rust`) covers:
  - `wap-baseline` profile capability header emission (`Accept`, `Accept-Charset`, `Accept-Encoding`, `Accept-Language`)
  - deterministic disabled profile behavior
  - deterministic caller-header override behavior for capability headers
- Browser transport request-policy wiring is typechecked via frontend contract consumers.
6. `Accept`:
- Capability advertisement behavior is explicit, test-backed, and contract-documented.
7. `Spec`:
- `RQ-WAE-013`, `RQ-WAE-001`
8. `Notes`:
- Added profile-gated UA capability contract field (`uaCapabilityProfile`) under transport request policy.
- Browser host now sends `wap-baseline` capability profile by default for network transport fetches.

### T0-06 URI length and charset boundary conformance follow-up

1. `Status`: `done`
2. `Depends On`: `T0-02`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/src/responses.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Add deterministic handling/tests for 1024-octet URI boundaries and UTF-8/UTF-16 encoding paths.
5. `Tests`:
- URI boundary coverage:
  - fixture `transport-rust/tests/fixtures/transport/uri_too_long_1025/`
  - unit tests for `1024`-octet accept and `>1024` reject path in `transport-rust/src/lib.rs`
- Charset boundary coverage:
  - mapped fixture `transport-rust/tests/fixtures/transport/utf16le_textual_wml_mapped/` for UTF-16LE decode success
  - mapped fixture `transport-rust/tests/fixtures/transport/utf16_odd_length_protocol_error_mapped/` for deterministic malformed UTF-16 `PROTOCOL_ERROR` mapping
  - unit tests in `transport-rust/src/responses.rs` cover UTF-16 decode success/error code path behavior directly
6. `Accept`:
- URI/encoding behavior meets WAE baseline and remains regression-protected.
7. `Spec`:
- `RQ-WAE-010`, `RQ-WAE-012`
8. `Notes`:
- Completed transport-scope URI/charset boundary conformance follow-up with deterministic URI length guardrails and fixture-backed UTF-16 decode success/error paths.

### T0-07 WBXML token/literal compatibility conformance follow-up

1. `Status`: `done`
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
3. `Owner`: `transport-rust`
4. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
5. `Build`:
- Add explicit responder-side TID decision policy and fixtures for cache/no-cache and duplicate-guarantee modes.
- Enforce initiator-side TID progression/rate guardrails relative to MPL assumptions for replay-window safety.
6. `Tests`:
- Fixture matrix for Table-6/7/8-like TID decisions and out-of-order invoke handling.
- Deterministic TID wrap/restart-window tests with trace assertions.
7. `Accept`:
- TID replay-window behavior is deterministic and explicitly profile-gated.
8. `Migration gates`:
- Done-1: responder/initiator TID replay policies are deterministic for table-driven fixture cases.
- Done-2: out-of-order and retransmission state transitions have deterministic terminal outcomes.
- Done-3: trace output includes transaction/timer state for replay decisions.
9. `Spec`:
- `RQ-TRN-007`, `RQ-TRN-016`

### T0-09 WSP connectionless primitive-profile conformance

1. `Status`: `todo`
2. `Depends On`: `T0-01`
3. `Owner`: `transport-rust`
4. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
5. `Build`:
- Make WSP mode selection explicit (`connection-oriented`, `connectionless`, or both) with deterministic primitive-usage gating.
- Implement/validate connectionless primitive occurrence matrix behavior and deterministic invalid-primitive handling.
6. `Tests`:
- Primitive occurrence fixtures for `S-Unit-MethodInvoke`, `S-Unit-MethodResult`, `S-Unit-Push`.
7. `Accept`:
- Connectionless mode policy is explicit and test-backed; invalid primitive paths are deterministic.
8. `Migration gates`:
- Done-1: mode switch behavior is driven by profile and emitted in request/response trace metadata.
- Done-2: req/ind-only matrix is enforced and fixture-asserted.
- Done-3: invalid primitive transitions are deterministically rejected before session side effects.
9. `Spec`:
- `RQ-TRN-010`, `RQ-TRN-012`, `RQ-TRN-017`

### T0-10 WSP assigned-number registry conformance fixtures

1. `Status`: `todo`
2. `Depends On`: `T0-05`, `T0-07`
3. `Owner`: `transport-rust`
4. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Add table-driven token-map fixtures for WSP PDU types, abort-reason codes, well-known parameters, and header-field names.
- Define deterministic handling policy for unassigned/unknown registry values.
6. `Tests`:
- Decode/encode round-trip fixtures anchored to assigned-number tables.
7. `Accept`:
- Assigned-number behavior is deterministic, profile-documented, and regression-guarded.
8. `Migration gates`:
- Done-1: registry decode/encode test suite exists and is fixture-backed.
- Done-2: unknown/unassigned value handling behavior is deterministic by profile.
- Done-3: no parser side-effect state is introduced by registry table lookup paths.
9. `Spec`:
- `RQ-TRN-014`, `RQ-TRN-018`

### T0-11 WSP capability-bound and negotiation-limit enforcement

1. `Status`: `todo`
2. `Depends On`: `T0-09`
3. `Owner`: `transport-rust`
4. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/tests/fixtures/transport/*`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
5. `Build`:
- Enforce min/intersection semantics for negotiated capabilities.
- Enforce negotiated SDU/message-size and outstanding-request bounds with deterministic abort/error surfacing.
6. `Tests`:
- Capability negotiation fixtures across client/server proposal mismatches and boundary exceed cases.
7. `Accept`:
- Capability negotiation and bounds behavior is deterministic and spec-linked.
8. `Migration gates`:
- Done-1: capability merge strategy is stable and documented in code-level comments or tests.
- Done-2: bound exceed/invalid capability fixtures are deterministic and mapped to clear error codes.
- Done-3: cap-limit behavior is tested under both connection-mode and connectionless profiles.
9. `Spec`:
- `RQ-TRN-013`, `RQ-TRN-019`

### T0-12 Wireless Profiled TCP compatibility profile declaration

1. `Status`: `todo`
2. `Depends On`: `T0-01`
3. `Owner`: `transport-rust`, `spec`
4. `Files`:
- `transport-rust/README.md`
- `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Declare explicit Waves TCP compatibility posture for profiled requirements (SACK/split/end-to-end/window-scale threshold behavior).
- Mark each requirement as implemented, delegated, or deferred for MVP with rationale.
6. `Tests`:
- Add compatibility-policy fixtures/checks that prevent silent drift in declared TCP posture.
7. `Accept`:
- TCP optimization baseline posture is explicit and traceable.
8. `Migration gates`:
- Done-1: `RQ-TRX-009` decision is explicitly categorized per behavior.
- Done-2: no code path depends on undeclared TCP behavior assumptions.
- Done-3: docs + ticket mapping for TCP posture is versioned and linked from `TECHNICAL_ARCHITECTURE`.
9. `Spec`:
- `RQ-TRX-009`

### T0-13 SMPP adaptation scope gate and fixture baseline

1. `Status`: `todo`
2. `Depends On`: `T0-01`
3. `Owner`: `transport-rust`, `docs`
4. `Files`:
- `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- `transport-rust/README.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Make a hard scope decision for `WAP-159` path (`in scope now` vs `deferred`).
- If in scope, define `data_sm` mapping fixtures and WCMP payload type handling checks.
- If deferred, document non-blocking rationale and explicit exclusion guardrails.
6. `Tests`:
- Add either adapter fixtures (in-scope) or explicit policy assertions (deferred).
7. `Accept`:
- SMPP adaptation status is unambiguous and regression-guarded.
8. `Migration gates`:
- Done-1: scope decision is documented as `in-scope` or `deferred` before implementation actions.
- Done-2: deferred paths are explicitly guarded against accidental dependency in `transport-rust`.
- Done-3: in-scope branch has end-to-end payload-type fixture path before any parser/code activation.
9. `Spec`:
- `RQ-TRX-010`

### T0-14 WAP networking profile decision record and migration gates

1. `Status`: `todo`
2. `Depends On`: `T0-09`, `T0-11`, `T0-12`, `T0-13`
3. `Owner`: `transport-rust`, `browser`, `engine`
4. `Files`:
- `docs/waves/TECHNICAL_ARCHITECTURE.md`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- `transport-rust/README.md`
5. `Build`:
- Publish an explicit profile decision for near-term and target-state transport:
  - current profile: gateway-bridged HTTP/WBXML normalization path
  - target profile: in-process WDP/WTP/WSP behavior lane and activation criteria
- Define non-negotiable boundary rules so engine/browser contracts stay stable across both profiles.
- Define migration gates that block profile promotion until required protocol fixtures pass.
6. `Tests`:
- Add profile-gate checks that assert declared mode/profile against fixture coverage state.
- Add one end-to-end fixture lane per declared profile to prevent drift in behavior expectations.
7. `Accept`:
- Networking architecture direction is explicit, versioned, and test-gated.
- Team can state exactly what is spec-compliant now versus planned for protocol-complete mode.
8. `Migration gates`:
- Done-1: a single canonical profile decision is written and linked to all transport docs.
- Done-2: profile-gate checks reference `T0-08..T0-13` completion criteria and required fixture coverage.
- Done-3: profile migration path has explicit rollback criteria tied to contract stability.
9. `Spec`:
- `RQ-TRN-001..019`, `RQ-TRX-001..010`

### T0-15 WAP caching model baseline and invalidation semantics

1. `Status`: `todo`
2. `Depends On`: `T0-04`, `R0-06`
3. `Owner`: `transport-rust`, `browser`
4. `Files`:
- `transport-rust/src/lib.rs`
- `browser/contracts/transport.ts`
- `browser/src-tauri/src/lib.rs`
- `docs/waves/WAE_SPEC_TRACEABILITY.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Implement a deterministic cache-policy baseline for deck/script/media retrieval and invalidation triggers.
- Ensure `cache-control=no-cache` and task-driven reload semantics route through one shared policy model.
6. `Tests`:
- Fixture matrix for cache hit, forced reload, stale invalidation, and request-policy override cases.
7. `Accept`:
- Cache behavior is explicit, deterministic, and verifiably aligned with the declared WAP profile.
8. `Migration gates`:
- Done-1: policy model is single-source and contract-exported across transport/browser layers.
- Done-2: cache hit/reload/invalidation fixture path is deterministic and repeatable.
- Done-3: profile switch does not alter cache semantics without explicit migration note.
9. `Spec`:
- `RQ-WAE-008`, `RQ-WAE-010`, `WML-29`, section `9.5.1`

### T0-16 Spec queue canonicalization and conflict resolution follow-up

1. `Status`: `todo`
2. `Depends On`: `T0-14`
3. `Owner`: `spec-processing`
4. `Files`:
- `spec-processing/new-source-material/`
- `spec-processing/source-material/WAP-259-WDP-20010614-a.pdf`
- `spec-processing/finalize-new-source-material.fish`
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`
- `docs/waves/SPEC_COVERAGE_DASHBOARD.md`
5. `Build`:
- Resolve `WAP-259-WDP-20010614-a.pdf` conflict variant left in queue and enforce deterministic case/variant policy.
- Document whether conflict variant is a replacement, supersedence candidate, or legacy duplicate.
6. `Tests`:
- `./spec-processing/finalize-new-source-material.fish --dry-run` reports zero unresolved conflicts for active transport spec IDs.
- `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md` contains one row per canonical transport/security spec ID.
7. `Accept`:
- Canonical corpus has one active source material path for each spec ID and the queue only contains unresolved non-canonical items.
8. `Migration gates`:
- Done-1: no transport spec ID has multiple active canonical variants in source-material.
- Done-2: conflict-resolution log is current and versioned with timestamped decision rationale.
- Done-3: ticket-dependent parser/automation paths resolve to canonical IDs.
9. `Spec`:
- `RQ-TRN-001`, `RQ-TRN-003`
10. `Notes`:
- Completed: new-source `WAP-259` variant was promoted after byte-comparison and manual archival of prior legacy source.
- Archive captured at:
  - `spec-processing/source-material/archive/WAP-259-WDP-20010614-a.legacy-v1.pdf`

### T0-17 Protocol-adjacent transport context sweep (deferred specs)

1. `Status`: `todo`
2. `Depends On`: `T0-14`, `T0-16`
3. `Owner`: `docs`, `transport`
4. `Files`:
- `docs/waves/OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md`
- `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/networking-implementation-checklist.md`
5. `Build`:
- Record explicit in-scope/out-of-scope policy for non-core transport-adjacent specs that can affect transport boundaries.
- Add one-line rationale for each deferred family in transport-adjacent docs (`WAP-204*`, `WAP-120*`, `WAP-213*`, related messaging-cache deltas).
- Keep this decision synchronized with `T0-14` profile gates.
6. `Tests`:
- checklist validation fixtures:
  - `WAP-204` and `WAP-120` remain deferred under documented rationale
  - no hidden protocol behavior dependency introduced in `transport-rust` without ticket and contract update
7. `Accept`:
- future transport scope changes are policy-driven, explicit, and reversible.
8. `Migration gates`:
- Done-1: adjacent scope deferrals are explicit with pass/fail rationale.
- Done-2: profile gates block adjacent-path promotion when deferral state is uncleared.
- Done-3: checklist asset exists and references this ticket as gate source.
9. `Spec`:
- `RQ-TRX-001..010` where applicable
- `RQ-TRN-001..019`
10. `Notes`:
- This ticket prevents accidental scope creep from remaining parsed networking adjacent specs.

### T0-18 WTP retransmission/NACK hold-off policy extraction and implementation

1. `Status`: `blocked`
2. `Depends On`: `T0-08`, `T0-14`
3. `Owner`: `transport-rust`, `docs`
4. `Files`:
- `transport-rust/src/network/wtp/state_machine.rs`
- `transport-rust/src/network/wtp/retransmission.rs`
- `transport-rust/src/network/wtp/duplicate_cache.rs`
- `docs/waves/wtp-state-machine.md`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Implement explicit WTP retransmission timer/counter behavior and bounded abort conditions.
- Implement deterministic NACK delay and retransmission hold-off policy for SAR-enabled profiles.
- Add a documented policy object for timer defaults and backoff strategy (profile-overridable).
6. `Tests`:
- Fixture set for timer expiry -> retransmit -> max-retry abort.
- Fixture set for duplicate invoke/result handling with cached terminal response behavior.
- Fixture set for NACK delay/hold-off suppressing redundant retransmissions.
7. `Accept`:
- WTP reliability policy is explicit, deterministic, and test-covered for core flows.
- `RQ-TRN-007`, `RQ-TRN-008`, and `RQ-TRN-016` map to concrete test artifacts.
8. `Migration gates`:
- Done-1: retransmission policy table is committed and linked from WTP docs.
- Done-2: duplicate handling fixtures pass for initiator and responder roles.
- Done-3: SAR-off and SAR-on profile behavior is explicitly gated and non-ambiguous.
9. `Spec`:
- `RQ-TRN-007`, `RQ-TRN-008`, `RQ-TRN-016`
10. `Notes`:
- Queue-ready; unblock when `T0-08` and `T0-14` are `done`.

### T0-19 WDP datagram trait + UDP port mapping baseline

1. `Status`: `blocked`
2. `Depends On`: `T0-14`, `T0-16`
3. `Owner`: `transport-rust`
4. `Files`:
- `transport-rust/src/network/wdp/transport_trait.rs`
- `transport-rust/src/network/wdp/datagram.rs`
- `transport-rust/src/network/wdp/udp_adapter.rs`
- `transport-rust/src/network/wdp/sar.rs`
- `docs/waves/networking-layer-definition.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Create protocol-native WDP datagram trait with strict `(src_port, dst_port, payload)` contract.
- Implement UDP adapter with deterministic behavior for active WAP service ports and error mapping.
- Define SAR handling contract boundary for deferred/non-UDP bearers without enabling them by default.
6. `Tests`:
- Port routing fixtures for `9200..9203` service behavior.
- Datagram malformed/truncation fixtures with deterministic errors.
- SAR reassembly fixtures in profile-enabled mode.
7. `Accept`:
- WDP trait and UDP baseline are live and do not leak gateway-only assumptions.
- Port mapping and error paths are fixture-backed and traceable.
8. `Migration gates`:
- Done-1: datagram trait is the only WTP/WSP ingress path in protocol-native mode.
- Done-2: port-mapping fixtures pass for declared profile modes.
- Done-3: SAR behavior is explicit (`off` by default) and guarded by profile flags.
9. `Spec`:
- `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003`, `RQ-TRN-004`
10. `Notes`:
- Queue-ready; unblock when `T0-14` and `T0-16` are `done`.

### T0-20 WSP header registry completion and unknown-token policy

1. `Status`: `blocked`
2. `Depends On`: `T0-10`, `T0-11`
3. `Owner`: `transport-rust`, `docs`
4. `Files`:
- `transport-rust/src/network/wsp/header_registry.rs`
- `transport-rust/src/network/wsp/encoder.rs`
- `transport-rust/src/network/wsp/decoder.rs`
- `docs/waves/wsp-pdu-reference.md`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Complete assigned-number header/token registry coverage used by active profile lanes.
- Implement deterministic unknown-token and unsupported-code-page behavior.
- Implement explicit fallback behavior for extension headers when page negotiation is unavailable.
6. `Tests`:
- Token roundtrip fixtures for core header set.
- Unknown token/page fixtures for strict and permissive policy modes.
- Code-page shift fixtures for multi-page header blocks.
- WBXML/token-stream fixture candidates from `docs/waves/WILEY_BOOK_CODE_EXAMPLES.md`: `WBK-FX-009`, `WBK-FX-010`.
7. `Accept`:
- WSP encoding/decoding behavior is table-driven and reproducible.
- Unknown token handling is documented, deterministic, and profile-aware.
8. `Migration gates`:
- Done-1: registry source of truth is versioned and linked to WSP docs.
- Done-2: unsupported encoding/page behavior has deterministic status output.
- Done-3: profile promotion is blocked when token fixture coverage is stale.
9. `Spec`:
- `RQ-TRN-014`, `RQ-TRN-018`
10. `Notes`:
- Queue-ready; unblock when `T0-10` and `T0-11` are `done`.

### T0-21 WTLS phase boundary and minimal handshake reliability lane

1. `Status`: `blocked`
2. `Depends On`: `T0-14`
3. `Owner`: `transport-rust`, `docs`
4. `Files`:
- `transport-rust/src/network/wtls/record.rs`
- `transport-rust/src/network/wtls/handshake.rs`
- `transport-rust/src/network/wtls/alerts.rs`
- `docs/waves/wtls-record-structure.md`
- `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Publish explicit phase boundary: no-op mode vs minimal active mode.
- Implement minimal record parsing and handshake retransmission/duplicate handling policy for active mode.
- Keep WTLS disabled by default until profile gate explicitly enables it.
6. `Tests`:
- Record parse/serialize fixture lane for active mode.
- Handshake retransmission and duplicate-message fixtures.
- No-op mode parity fixtures proving transport behavior stability when disabled.
7. `Accept`:
- WTLS scope is explicit, testable, and aligned with profile gates.
- Security-path behavior cannot activate implicitly.
8. `Migration gates`:
- Done-1: WTLS mode defaults and activation criteria are documented.
- Done-2: active-mode fixtures pass and map to security requirement IDs.
- Done-3: no-op mode remains deterministic and contract-compatible.
9. `Spec`:
- `RQ-SEC-004`, `RQ-SEC-005`
10. `Notes`:
- Queue-ready; unblock when `T0-14` is `done` and `T0-22` replay gates are stable.

### T0-22 Networking interop replay harness and golden event corpus

1. `Status`: `blocked`
2. `Depends On`: `T0-18`, `T0-19`, `T0-20`
3. `Owner`: `transport-rust`, `docs`
4. `Files`:
- `transport-rust/tests/network/interop/`
- `transport-rust/tests/interop_replay.rs`
- `docs/waves/networking-implementation-checklist.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `docs/waves/networking-migration-readiness-checklist.md`
5. `Build`:
- Add replay harness for `CONNECT`/`GET`/`REPLY` plus retransmit/duplicate transaction flows.
- Normalize replay output into deterministic protocol events for assertion.
- Gate profile promotion on replay-corpus pass status.
6. `Tests`:
- `connect_session_replay`
- `get_reply_replay`
- `retransmit_flow`
- `duplicate_tid_flow`
7. `Accept`:
- Interop behavior is fixture-backed beyond unit-only coverage.
- Migration gates can cite replay results as promotion evidence.
8. `Migration gates`:
- Done-1: replay corpus exists for all active profile paths.
- Done-2: retransmit/duplicate lanes are included in mandatory gating checks.
- Done-3: fixture updates require corresponding traceability/status updates.
9. `Spec`:
- `RQ-TRN-005..019`
10. `Notes`:
- Queue-ready; unblock when `T0-18`, `T0-19`, and `T0-20` are `done`.

### T0-23 External corpus ingestion spike (Kannel + Wireshark)

1. `Status`: `todo`
2. `Depends On`: `T0-16`
3. `Owner`: `docs`, `spec-processing`, `transport-rust`
4. `Files`:
- `docs/waves/networking-external-response-triage.md`
- `docs/waves/NETWORKING_GAP_MASTER.md`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `spec-processing/new-source-material/`
- `spec-processing/source-material/WAP.pdf`
- `spec-processing/source-material/vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf`
- `spec-processing/external-parsed/wap_emulator_spec_notes.md`
- `spec-processing/README.md`
5. `Build`:
- Ingest and catalog implementation-reference materials for:
  - Kannel networking sources (`wtp`, `wsp`, `wdp` lanes)
  - Wireshark dissectors (`packet-wtp`, `packet-wsp`, `packet-wdp`, `packet-wtls`)
- Classify local supplemental context sources (slides/tech-brief/LLM-parsed notes) as `heuristic` unless they are backed by canonical WAP/OMA section anchors.
- Produce a normalized source index with per-source trust class (`normative`, `interop-reference`, `heuristic`).
- Map extracted behaviors to existing `RQ-TRN-*` IDs without creating new transport requirements.
6. `Tests`:
- Deterministic source-index lint/check (file present + source class + mapped requirement IDs).
- Spot-check fixture that one behavior from each external source family maps to an existing local requirement.
7. `Accept`:
- External reference corpus is indexed and traceable without changing normative precedence.
- Each imported behavior note cites a local requirement and implementation target lane.
8. `Migration gates`:
- Done-1: source index exists and is versioned.
- Done-2: all imported notes are tagged `interop-reference` or `heuristic` unless backed by canonical WAP spec.
- Done-3: no `RQ-TRN-*` requirement is redefined by external source text.
9. `Spec`:
- `RQ-TRN-001..019`
10. `Notes`:
- Research spike only; non-blocking for protocol implementation unless it uncovers a contradiction with local normative anchors.

### T0-24 Networking PCAP corpus spike and replay fixture seed pack

1. `Status`: `todo`
2. `Depends On`: `T0-23`
3. `Owner`: `transport-rust`, `docs`
4. `Files`:
- `transport-rust/tests/network/interop/`
- `transport-rust/tests/interop_replay.rs`
- `docs/waves/networking-migration-readiness-checklist.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. `Build`:
- Build a curated PCAP seed corpus for:
  - `CONNECT` handshake path
  - `GET`/`REPLY` request-response
  - retransmit and duplicate transaction scenarios
- Define deterministic replay-fixture schema (`capture`, `expected events`, `expected transaction outcomes`).
- Document capture provenance and legal/reuse constraints.
6. `Tests`:
- Replay parser can consume seed fixtures and emit deterministic event traces.
- At least one fixture each for connect, get/reply, retransmit, duplicate flow classes.
7. `Accept`:
- PCAP seed corpus exists and is runnable via replay harness scaffolding.
- Fixture schema is stable and linked from transport/networking docs.
8. `Migration gates`:
- Done-1: seed corpus is committed with metadata and expected outputs.
- Done-2: replay harness stub validates schema and event ordering.
- Done-3: ticket `T0-22` references these fixtures as required baseline inputs.
9. `Spec`:
- `RQ-TRN-005..019`
10. `Notes`:
- Spike output is an enabling artifact for `T0-22`; it does not itself satisfy protocol-core implementation gates.

### T0-25 External conformance/vector source sweep spike

1. `Status`: `todo`
2. `Depends On`: `T0-23`
3. `Owner`: `docs`, `spec-processing`
4. `Files`:
- `docs/waves/NETWORKING_GAP_MASTER.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
5. `Build`:
- Identify publicly available WAP interoperability/conformance vectors that can be safely reused.
- Classify candidate vectors by usefulness for current lanes (`WDP`, `WTP`, `WSP`, `WTLS`) and profile compatibility (`gateway-bridged`, `wap-net-core`).
- Produce a recommended adoption list with effort/benefit estimates.
6. `Tests`:
- Checklist validation proving each recommended vector maps to at least one active ticket and one fixture target path.
7. `Accept`:
- Conformance/vector candidates are ranked and tied to current execution lanes.
- No adoption recommendation conflicts with current spec precedence or scope-defer rules.
8. `Migration gates`:
- Done-1: ranked vector adoption list exists.
- Done-2: each item maps to `T0-*` and `RQ-*` references.
- Done-3: explicit `adopt now` vs `defer` decisions are documented.
9. `Spec`:
- `RQ-TRN-001..019`, `RQ-SEC-004..005`
10. `Notes`:
- Research spike only; adoption decisions must remain profile-gated and additive.

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

### W0 Foundation (Archived)

Completed `W0-01` through `W0-04` are archived in:

- `docs/waves/WORK_ITEMS_ARCHIVE.md`

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

1. `Status`: `in-progress`
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

### W1-07 W1-06 closure split and acceptance finalization

1. `Status`: `todo`
2. `Depends On`: `W1-06`
3. `Files`:
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
- `engine-wasm/contracts/wml-engine.ts`
4. `Build`:
- Split remaining `W1-06` open work into explicit closure bullets (missing fixture classes, unresolved trap mappings, and host contract assertions).
- Define objective close criteria so `W1-06` can move from `in-progress` to `done` without ambiguity.
5. `Tests`:
- Coverage matrix update proving each remaining `W1-06` closure bullet maps to a deterministic fixture/test lane.
6. `Accept`:
- `W1-06` has a concrete closure checklist with no implicit scope remaining.
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

1. `Status`: `done`
2. `Depends On`: `A5-02`, `T0-04`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/runtime/*`
- `engine-wasm/engine/src/parser/wml_parser/actions.rs`
- `transport-rust/src/lib.rs`
- `browser/frontend/src/session-history.ts`
- `browser/frontend/src/app/navigation-state.ts`
- `browser/frontend/src/app/navigation-state.test.ts`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Implement and verify section `12.5` step-order behavior for `go`, `prev`, `noop`, `refresh`, including deterministic task-failure handling.
- Ensure request metadata handoff (method/postfield/headers) stays aligned between runtime and transport.
5. `Tests`:
- Cross-layer fixtures for forward/back/refresh/error paths with trace assertions.
- Seed fixture candidates from `docs/waves/WILEY_BOOK_CODE_EXAMPLES.md`: `WBK-FX-002`, `WBK-FX-003`, `WBK-FX-004`, `WBK-FX-005`, `WBK-FX-007`.
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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

### R0-10 Cross-layer acceptance fixture ledger

1. `Status`: `todo`
2. `Depends On`: `R0-02`, `R0-03`, `R0-06`, `W1-06`
3. `Files`:
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `docs/waves/WORK_ITEMS.md`
- `docs/wml-engine/work-items.md`
- `transport-rust/tests/fixtures/transport/*`
- `engine-wasm/engine/tests/fixtures/*`
- `browser/frontend/src/app/*.test.ts`
4. `Build`:
- Add a single ledger mapping active `R0`/`T0`/`W1` tickets to concrete fixture and test assets across engine, transport, and browser.
- Record explicit “implemented”, “partial”, and “missing” fixture lanes for each ticket acceptance criterion.
5. `Tests`:
- Manual consistency pass confirming every referenced fixture path exists and each mapped ticket has at least one deterministic test lane.
6. `Accept`:
- Ticket closure decisions can be made from one cross-layer fixture map without ad hoc test discovery.
7. `Spec`:
- Aggregated IDs from `WML-191`, `RQ-WAE-*`, `RQ-TRN-*`, and `RQ-WMLS-*` lanes linked by mapped tickets.

### R0-11 Deterministic cross-layer replay runner

1. `Status`: `todo`
2. `Depends On`: `R0-10`, `T0-04`, `R0-03`
3. `Files`:
- `transport-rust/tests/fixtures/transport/*`
- `engine-wasm/engine/tests/fixtures/*`
- `browser/frontend/src/app/navigation-state.test.ts`
- `browser/src-tauri/src/lib.rs`
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- Add a deterministic replay runner that executes representative `transport -> engine -> browser` flows from shared fixture inputs and validates timeline/frame/state outputs.
- Keep this runner behavior-focused (semantic drift guard), not just type/contract shape checks.
5. `Tests`:
- One replay lane for load->fragment nav->back.
- One replay lane for external intent follow + request-policy metadata.
6. `Accept`:
- Cross-layer behavioral regressions are detectable in one reproducible replay lane with stable fixture outputs.
7. `Spec`:
- `WML-07`, `WML-18`, `RQ-WAE-008`, `RQ-WAE-016`, `RQ-TRN-004`

## Phase S (Archived)

Completed `S0` and `S1` source-material audit tickets are archived in:

- `docs/waves/WORK_ITEMS_ARCHIVE.md`
