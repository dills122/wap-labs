# Waves Browser Work Items Archive

Purpose: preserve historical/completed tickets moved out of the active execution board.

This file is archival. New work should be added to `docs/waves/WORK_ITEMS.md` via new ticket IDs.

Active board:

- `docs/waves/WORK_ITEMS.md`

## Initial Backlog (Prepared)

Historical kickoff `P0` tickets are archived as completed:

- `P0-01` Repo bootstrap alignment for `browser/`
- `P0-02` Tauri shell command contract freeze
- `P0-03` Transport module lifecycle spec
- `P0-04` First end-to-end integration fixture definition

For reactivation, create additive follow-up tickets on `docs/waves/WORK_ITEMS.md`.


## Phase B0-B3 and Early Transport Foundation (Archived)

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


## Phase W0 Foundation (Archived)

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


## Phase S Deep Audit (Archived)

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
