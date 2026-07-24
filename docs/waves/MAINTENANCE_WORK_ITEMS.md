# Waves Maintenance Work Items

Purpose: track maintenance, quality, and technical-debt work that should be folded into normal delivery.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

## How To Use

1. Keep items scoped and testable.
2. Link each item to concrete files and acceptance checks.
3. Prefer pairing one maintenance item with each feature/contract ticket when feasible.

## Current Queue

Completed maintenance tickets are archived in:

- `docs/waves/MAINTENANCE_WORK_ITEMS_ARCHIVE.md`

### M1-00 Architecture hardening sprint (next in line)

1. `Status`: `in-progress`
2. `Scope`:
- `browser/`
- `engine-wasm/`
- `transport-rust/`
3. `Build`:
- Execute remaining `M1-*` items as the active maintenance sprint before new feature expansion.
4. `Accept`:
- Sprint checklist and status are reflected in:
- `docs/waves/WORK_ITEMS.md`
- `browser/README.md`
- `engine-wasm/README.md`
- `transport-rust/README.md`
5. `Notes`:
- Active execution is currently anchored to `docs/waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md`.
- `M1-14`, `M1-15`, and the first `M1-16`/browser responsiveness slices landed in `#109` and `#110`.
- Keep residual `M1-08` cleanup opportunistic while committed compliance tickets execute.

### M1-14 Browser host boundary hardening (CSP + DOM injection sinks)

1. `Status`: `done`
2. `Priority`: `P0`
3. `Files`:
- `browser/src-tauri/tauri.conf.json`
- `browser/frontend/src/app/browser-shell-template.ts`
- `browser/frontend/src/app/defaults.ts`
- `browser/frontend/src/main.ts`
4. `Build`:
- Replace permissive renderer hardening posture (`csp: null`) with explicit CSP suitable for the Tauri-hosted app shell.
- Remove/contain HTML string interpolation paths for boot URL rendering (`innerHTML` bootstrap template path).
- Keep startup URL normalization deterministic and safe for attribute/DOM insertion.
5. `Tests`:
- `pnpm --dir browser/frontend test`
- `pnpm --dir browser/frontend build`
- `cd browser/src-tauri && cargo test`
6. `Accept`:
- Renderer does not rely on disabled CSP.
- Boot URL flow does not allow unescaped HTML insertion surfaces in shell bootstrap.
- Existing browser shell behavior remains intact in local and network modes.
7. `Notes`:
- Security audit follow-up for high-severity host boundary risk.
- Landed explicit production and development CSP policies in Tauri config (`csp` + `devCsp`) instead of permissive/null posture.
- Boot URL assignment path is contained to post-mount input property assignment (no runtime URL interpolation into shell HTML template strings).

### M1-15 Engine parser recursion guardrails (untrusted deck DoS hardening)

1. `Status`: `done`
2. `Priority`: `P0`
3. `Files`:
- `engine-wasm/engine/src/parser/wml_parser/actions.rs`
- `engine-wasm/engine/src/parser/wml_parser/nodes.rs`
- `engine-wasm/engine/src/parser/wml_parser/mod.rs`
- `engine-wasm/engine/src/engine_tests.rs`
4. `Build`:
- Add bounded recursion/depth and node-count guardrails in parser tree walks for card/action/node traversal.
- Ensure maliciously deep nested markup fails deterministically with recoverable parse errors (no runtime crash/stack overflow).
5. `Tests`:
- `cd engine-wasm/engine && cargo test`
- Add regression fixtures/tests for deeply nested WML payload rejection behavior.
6. `Accept`:
- Engine rejects pathological nesting with deterministic error surface.
- No process crash or panic path from crafted deep deck structures.
7. `Notes`:
- Security audit follow-up for high-severity parser crash/DoS risk.
- Parser traversal now enforces explicit nesting-depth and visited-node budgets with deterministic
  error surfaces (`Parse limit exceeded: ...`) across action, card-node, inline-node, and text-extraction walks.
- Added parser-level and engine-level regression tests for depth and node-budget exhaustion paths.

### M1-16 Transport/engine payload size guardrails (memory pressure hardening)

1. `Status`: `done`
2. `Priority`: `P1`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/src/responses.rs`
- `engine-wasm/engine/src/engine_public_api.rs`
- `browser/contracts/transport.ts`
4. `Build`:
- Enforce explicit response-body/deck-size limits before decode/parse.
- Keep error mapping deterministic when payload limits are exceeded.
- Avoid unnecessary memory amplification for oversized payload paths.
5. `Tests`:
- `make test-rust-transport`
- `cd engine-wasm/engine && cargo test`
- Add fixture coverage for over-limit payload rejection.
6. `Accept`:
- Oversized responses/decks are rejected with stable transport/engine error surfaces.
- Normal-size WML/WBXML paths remain unchanged.
7. `Notes`:
- Security audit follow-up for medium-severity resource exhaustion risk.
- Landed transport-side explicit `PAYLOAD_TOO_LARGE` classification and host contract regeneration in `#109`.
- Added host/engine oversized deck boundary coverage in Tauri and WASM tests in `#109`.
- Current baseline rejects oversized payloads deterministically before decode/parse escalation in the active transport/engine/browser handoff path.

### M1-17 Network fetch destination policy guardrails (SSRF/probing reduction)

1. `Status`: `done`
2. `Priority`: `P1`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/transport.ts`
- `docs/waves/TECHNICAL_ARCHITECTURE.md`
4. `Build`:
- Define explicit destination policy for `fetch_deck` host command (default-safe behavior + documented override for developer workflows).
- Keep policy consistent with WAP/WML navigation expectations and existing transport contract boundaries.
5. `Tests`:
- `make test-rust-transport`
- `cd browser/src-tauri && cargo test`
- Add policy-path tests for blocked/allowed destination classes.
6. `Accept`:
- Host fetch path has documented/tested destination constraints appropriate for desktop host threat model.
- External-intent navigation remains deterministic under policy decisions.
7. `Notes`:
- Security audit follow-up for medium-severity SSRF/internal probing exposure if renderer compromise occurs.

### M1-18 `network::wsp` codec is dead code relative to the live native fetch path (2026-07-23)

1. `Status`: `todo`
2. `Priority`: `P2`
3. `Files`:
- `transport-rust/src/network/wsp/pdu.rs`
- `transport-rust/src/network/wsp/header_block.rs`
- `transport-rust/src/network/wsp/header_registry.rs`
- `transport-rust/src/network/wsp/encoding_version.rs`
- `transport-rust/src/network/wsp/session.rs`
- `transport-rust/src/network/wsp/decoder.rs`
- `transport-rust/src/network/wsp/encoder.rs`
- `transport-rust/src/wsp_registry.rs`
- `transport-rust/src/wsp_capability.rs`
- `transport-rust/src/native_fetch.rs`
- `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md`
- `docs/waves/TRANSPORT_RUST_PHASE_PLAN.md`
- `docs/waves/WORK_ITEMS.md` (`T0-20`, `T0-27`)
4. `Finding`:
- `transport-rust/src/network/wsp/*` (~2,700 lines across `pdu.rs`, `header_block.rs`, `header_registry.rs`, `encoding_version.rs`, `session.rs`, `decoder.rs`, `encoder.rs`) is a well-structured, bounds-checked, fixture-tested WSP/PDU codec. It is **dead code on the live fetch path**: `grep` confirms nothing outside its own `#[cfg(test)]` modules calls into it except `wsp_registry.rs` (thin re-export wrapper) and `wsp_capability.rs` (consumed by `network::wsp::session`/`pdu`, not the reverse) — and neither `wsp_registry::*` nor `wsp_capability::*` has any caller outside their own test modules either. The chain is self-contained and never reaches production code.
- The actual production native-transport fetch path (`transport-rust/src/native_fetch.rs`, `encode_connectionless_request` / `decode_connectionless_wsp_reply` / `decode_content_type_value` / `decode_text_string` / `decode_uintvar` / `encode_uintvar`, roughly lines 335-600) hand-rolls its own minimal uintvar/content-type/header/PDU parsing from scratch and does not import `crate::network::wsp` at all.
5. `Why the split exists` (evidence, not guesswork):
- `network::wsp::*` landed 2026-03-06 in `#77` (`feat(wsp): add header registry and code-page policy baseline`, closing ticket `T0-20`) and `#78` (`test(transport): add get reply interop replay baseline`).
- `native_fetch.rs` landed the very next day, 2026-03-07, in `#89` ("Native WSP Fetch", closing ticket `T0-27`, "Native connectionless WSP GET fetch path").
- `T0-27`'s own written plan in `docs/waves/WORK_ITEMS.md` explicitly directs: *"Reuse existing WDP adapter and WSP codec/session modules rather than introducing browser-side protocol logic"*, and lists the new file's intended path as `transport-rust/src/network/native_fetch.rs` (nested under `network/`, alongside `wdp/` and `wsp/`).
- What actually shipped is `transport-rust/src/native_fetch.rs` (top level, **not** nested under `network/`). It does reuse `crate::network::wdp` as directed, but it never imports `crate::network::wsp` and instead reimplements the WSP wire codec from scratch. `T0-27` was nonetheless marked `done`.
- No commit message, PR description, or doc found anywhere in `docs/waves/` explains or acknowledges this divergence from the ticket's own stated plan. This reads as **unplanned implementation drift** (the WSP codec module and the fetch executor were built one day apart by the same author but never actually wired together), not a deliberate "reference implementation for later" design — there is no ADR-style note asserting that as intent. Say so plainly rather than inventing a rationale.
- Compounding the confusion: `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` names `wap-net-core` (which the doc defines as the `network::wsp`-based in-process `WDP -> WTP -> WSP` stack) the "active implementation target profile" and lists `wsp_registry.rs`/`wsp_capability.rs` as its fixture lane; `docs/waves/TRANSPORT_RUST_PHASE_PLAN.md` labels `wap-net-core` "(current)". Both are accurate about profile *intent* but easy to misread as "this is what runs" — the byte-level codec actually executing on the native fetch path today is the hand-rolled one in `native_fetch.rs`, not `network::wsp`.
6. `Decision` (repo owner, 2026-07-23):
- Do not delete `network::wsp::*` — it is wanted for future use and is the spec-conformant target implementation.
- Do not wire it into `native_fetch.rs` in the near term — too large a change to fold into an unrelated pass; treat as a dedicated follow-up.
- A short doc comment now sits above `native_fetch.rs`'s hand-rolled encode/decode section pointing back at this entry so the split isn't a landmine for the next person who finds two WSP parsers and doesn't know which one is real.
7. `Recommendation`:
- Open a dedicated follow-up ticket ("wire `network::wsp` into `native_fetch.rs`") to replace the hand-rolled `encode_connectionless_request`/`decode_connectionless_wsp_reply`/`decode_content_type_value`/`decode_text_string`/`decode_uintvar` functions with calls into `network::wsp::{encoder,decoder,pdu,header_block}`, preserving the existing `FetchDeckResponse` mapping and `TRANSPORT_PROFILE_WAP_NET_CORE` gating behavior. This should close the gap between the documented `wap-net-core` profile and what the profile actually executes.
- Until that lands, treat `network::wsp::*` test coverage as spec-conformance regression coverage only, not evidence about the live fetch path's correctness.
8. `Accept` (for the follow-up ticket, not this entry):
- `native_fetch.rs`'s WSP wire encode/decode calls into `network::wsp` instead of duplicating parsing logic.
- `cargo test` stays green for `transport-rust`; native fetch behavior is unchanged for existing passing fixtures/smokes.
- `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` / `TRANSPORT_RUST_PHASE_PLAN.md` updated to reflect that `wap-net-core` is genuinely live end-to-end, not just profile-gated.

### M1-03 Engine API generator design and bootstrap (non-priority)

1. `Status`: `todo`
2. `Files`:
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/engine.ts`
- `scripts/` (new generator entrypoint)
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
3. `Build`:
- Add a generator path that can emit TypeScript engine API/types/facade scaffolding from engine-owned source metadata.
- Keep this item as non-priority within the sprint (design/prototype unless explicitly promoted).
4. `Tests`:
- Generator dry-run in CI or local script check.
5. `Accept`:
- Manual engine API sync burden is reduced with a documented generate path and prototype output.

### M1-08 Split high-churn files into boundary modules

1. `Status`: `in-progress`
2. `Files`:
- `engine-wasm/engine/src/lib.rs` (done)
- `engine-wasm/engine/src/engine_runtime_internal.rs` + `engine_runtime_internal/*` (done)
- `engine-wasm/engine/src/parser/wml_parser/*` (done)
- `browser/frontend/src/main.ts` (done)
- `browser/src-tauri/src/lib.rs` + `browser/src-tauri/src/engine_bridge/*` + `browser/src-tauri/src/tests/*` (baseline split done)
- `transport-rust/src/lib.rs` + `transport-rust/src/fetch_runtime/*` + `transport-rust/src/tests/*` (baseline split done)
3. `Build`:
- Move code into boundary modules (`api`, `state`, `actions`, `mapping`, `ui`) without broad behavior changes.
4. `Tests`:
- Existing project test/build commands remain green.
5. `Accept`:
- High-churn files are reduced and responsibilities are easier to review.
6. `Notes`:
- Engine-side decomposition has landed and merged.
- Browser and transport boundary decomposition baselines have landed.
- Browser-side follow-up landed additional probe/timer/focused-edit coordinators in `#109`.
- Remaining scope is residual opportunistic cleanup only if new hot files emerge or a boundary proves unstable under feature work; do not let this preempt active compliance/runtime tickets.

### M1-09 Engine-host frame interface migration execution

1. `Status`: `todo`
2. `Files`:
- `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`
- `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/src-tauri/src/contract_types.rs`
- `browser/contracts/generated/engine-host.ts`
3. `Build`:
- Execute the `F0-F4` migration program to move active hosts onto structured frame/input contracts.
- Keep migration additive and parity-gated until legacy path retirement.
4. `Tests`:
- `cd engine-wasm/engine && cargo test`
- `cd browser/src-tauri && cargo test`
- `pnpm --dir browser/frontend test`
- `pnpm --dir browser/frontend build`
5. `Accept`:
- Active host paths use `EngineFrame` + `EngineInputEvent`.
- Contract and coverage docs are updated in the same migration PRs.

### M1-10 Engine contract parity guardrail hardening

1. `Status`: `done`
2. `Files`:
- `browser/scripts/generate-contract-wrappers.mjs`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/engine.ts`
- `browser/contracts/generated/engine-host.ts`
- `.github/workflows/ci.yml`
3. `Build`:
- Keep engine contract wrappers generated from generated host-contract exports, not manual sync.
- Enforce drift through deterministic codegen checks in CI (`contracts:check`) and keep wrapper alias surfaces explicit.
4. `Tests`:
- `pnpm --dir browser run contracts:check`
- repo-hygiene CI lane remains green.
5. `Accept`:
- Contract-surface drift across engine canonical, generated host contract, and browser wrapper aliases is blocked for covered contract types.
6. `Notes`:
- Parity-script lane retired in favor of generator-owned wrappers plus codegen drift checks.
- Guardrail now enforced through `contracts:check` in repo hygiene and browser-shell CI lanes.

### M1-11 Browser contract-wrapper codegen alignment

1. `Status`: `done`
2. `Files`:
- `browser/contracts/engine.ts`
- `browser/contracts/transport.ts`
- `browser/contracts/generated/*`
- `browser/src-tauri/src/bin/generate_contracts.rs`
- `browser/scripts/generate-contract-wrappers.mjs`
3. `Build`:
- Make browser wrapper contracts thin generated aliases/adapters with no duplicate hand-authored shape definitions.
- Ensure wrapper drift checks fail if wrapper outputs diverge from generated source contracts.
4. `Tests`:
- `pnpm --dir browser/frontend exec tsc --noEmit`
- `pnpm --dir browser run contracts:check` in repo hygiene lane.
5. `Accept`:
- Browser contract wrappers no longer require manual shape synchronization beyond intentional adapter aliases.
6. `Notes`:
- Contract wrapper generation now emits `browser/contracts/engine.ts` and `browser/contracts/transport.ts` from `browser/scripts/generate-contract-wrappers.mjs`.
- App-specific transport session/history types moved to `browser/contracts/transport-app.ts` to keep generated wrappers contract-focused.
- Wrapper generation now runs through `browser/scripts/generate-contract-wrappers.mjs` with AST-derived export sets from generated contract files (no static wrapper blobs in Rust).
- CI drift enforcement for wrappers/contracts uses `pnpm --dir browser run contracts:check`.

### M1-12 Engine/transport error taxonomy artifact generation

1. `Status`: `done`
2. `Files`:
- `browser/contracts/generated/engine-host.ts`
- `browser/contracts/generated/transport-host.ts`
- `browser/contracts/engine.ts`
- `browser/contracts/transport.ts`
- `browser/scripts/generate-contract-wrappers.mjs`
- `docs/waves/SPEC_TEST_COVERAGE.md`
3. `Build`:
- Keep transport and engine error-taxonomy surfaces sourced from generated contracts and wrapper aliases.
- Avoid parallel manual error-union definitions outside generated/wrapper contract modules.
4. `Tests`:
- `pnpm --dir browser run contracts:check`
- Browser/frontend typecheck validates alias consumer compatibility.
5. `Accept`:
- Error-code/class/category surfaces are generated and parity-checked instead of manually synchronized.
6. `Notes`:
- Standalone taxonomy fixture/check lane retired.
- Taxonomy drift control now relies on generated contract source + wrapper codegen drift checks.
- Transport and engine consumer surfaces use generated contract exports/aliases rather than duplicated manual unions.

### M1-13 Contract schema fixture generation and validation lane

1. `Status`: `done`
2. `Files`:
- `browser/contracts/generated/*`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/engine.ts`
- `browser/contracts/transport.ts`
- `browser/scripts/generate-contract-wrappers.mjs`
- `.github/workflows/ci.yml`
3. `Build`:
- Keep wrapper contract generation deterministic and derived from generated contract modules.
- Keep CI focused on codegen drift checks and compile-time consumer validation rather than additional parallel parity scripts.
4. `Tests`:
- `pnpm --dir browser run contracts:check`
- `pnpm --dir browser/frontend exec tsc --noEmit`
5. `Accept`:
- Contract drift checks are codegen-driven and resilient to formatting/ordering changes.
6. `Notes`:
- AST-driven wrapper generation landed in `browser/scripts/generate-contract-wrappers.mjs`.
- Standalone parity-schema fixtures/scripts retired in favor of codegen-first drift checks.

### M0-07 Historical backlog pruning pass

1. `Status`: `todo`
2. `Files`:
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/WORK_ITEMS_ARCHIVE.md` (new)
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- `README.md`
3. `Build`:
- Move pre-implementation kickoff/planning-only ticket groups that are no longer actionable into a dedicated archive file (`docs/waves/WORK_ITEMS_ARCHIVE.md`), not inline in active boards.
- Keep active queues focused on executable work items only.
4. `Tests`:
- Manual consistency pass for active-vs-archive file boundaries, status markers, and README references.
5. `Accept`:
- Active boards only contain actionable work; historical tickets remain preserved in archive file with traceable IDs.

### M0-08 Cross-board status sync cadence

1. `Status`: `todo`
2. `Files`:
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/WORK_ITEMS_ARCHIVE.md`
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- `browser/README.md`
- `engine-wasm/README.md`
- `transport-rust/README.md`
- `README.md`
3. `Build`:
- Define and document a standing rule: when a ticket status changes, update corresponding board and README “next slice/checklist/snapshot” pointers in the same PR.
- Keep updates additive and deterministic across layers.
4. `Tests`:
- Manual PR checklist verification against one representative ticket transition.
5. `Accept`:
- Status transitions no longer leave board/readme mismatches after merge.

### M0-09 Board file-reference hygiene sweep

1. `Status`: `todo`
2. `Files`:
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/WORK_ITEMS_ARCHIVE.md`
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- `docs/wml-engine/work-items.md`
- `engine-wasm/README.md`
- `browser/README.md`
- `transport-rust/README.md`
3. `Build`:
- Run a docs reference sweep to replace stale file paths and module names after refactors (for example parser/module splits).
- Ensure file references in tickets remain specific enough to guide implementation but avoid dead-path drift.
4. `Tests`:
- Manual path-existence pass for referenced file paths in active and archive boards.
5. `Accept`:
- Board/readme file references resolve to existing paths or clearly intentional globs; no known dead file paths remain.

### M0-10 Archive index and movement policy

1. `Status`: `todo`
2. `Files`:
- `docs/README.md`
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/WORK_ITEMS_ARCHIVE.md`
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
3. `Build`:
- Add a short “active vs archive” index entry in docs navigation and define when tickets move into archive files.
- Document that archived tickets are historical and reactivation requires new follow-up IDs on active boards.
4. `Tests`:
- Manual docs navigation pass from `docs/README.md` to active and archive boards.
5. `Accept`:
- Contributors can quickly locate active vs archived work boards and follow one consistent archival rule.
