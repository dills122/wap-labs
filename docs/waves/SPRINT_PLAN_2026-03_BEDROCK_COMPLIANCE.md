# Bedrock Compliance Sprint Plan (March 2026)

Purpose: execute a realistic, dependency-aware sprint that closes the highest-impact compliance gaps without reopening settled architecture work.

## Sprint Window

- Target start: `2026-03-04`
- Target duration: `~1 sprint` (focused implementation window)

## Sprint Goal

Reduce high-priority WML/WAE/WMLScript compliance risk by closing request-policy/history/process-order and bytecode verification bedrock tickets.

## In Scope (Committed)

1. `T0-04` Cache/reload and `go` request-policy conformance follow-up.
2. `A5-01` History entry fidelity follow-up.
3. `R0-02` Inter-card navigation process-order conformance.
4. `R0-03` History/context fidelity completion.
5. `W0-06` Bytecode verification gates follow-up.

Stretch (only if all committed tickets are stable):

1. `W1-02` Bytecode structural verification (header/pools/indexes/jumps).

## Dependency Order (Execution Sequence)

1. `T0-04`
2. `A5-01`
3. `R0-02`
4. `R0-03`
5. `W0-06`
6. `W1-02` (stretch)

Rationale:

- `R0-02` and `R0-03` both depend on request/history shape fidelity (`T0-04`, `A5-01`).
- `W1-02` depends on `W0-06` baseline verification gates.

## Out of Scope (This Sprint)

1. Full frame migration program (`F0-F4`) via `M1-09`.
2. Broad parser/render semantic expansion tickets (`B5-*`, `C5-*`) beyond direct dependencies above.
3. WAP networking profile-decision bundle (`T0-09..T0-14`) unless blocker-level clarification is required.

## Work Breakdown (PR-Sized)

1. PR-1 (`T0-04`): request-policy transport contract plumbing (`cache-control`, referer policy, post context).
2. PR-2 (`A5-01`): runtime/browser history-entry schema expansion and deterministic restore behavior.
3. PR-3 (`R0-02`, `R0-03`): process-order + context fidelity fixtures and runtime/host alignment.
4. PR-4 (`W0-06`): bytecode structural verification gates and malformed fixture matrix.
5. PR-5 (`W1-02`, stretch): strict verification closure + trap-class conformance mapping.

## Acceptance Gates (Sprint-Level)

1. Each committed ticket has executable fixture/test coverage mapped in `docs/waves/SPEC_TEST_COVERAGE.md`.
2. `pnpm --dir browser run contracts:check` passes after every contract-impacting change.
3. `node scripts/check-worklist-drift.mjs` remains green after status/pointer updates.
4. No `done` ticket is reopened; additive follow-up tickets remain the mechanism for closure deltas.

## Operational Rules

1. Keep changes layered:
- engine semantics in `engine-wasm/`
- transport request execution in `transport-rust/`
- host/session wiring in `browser/`

2. Keep scope strict:
- no broad refactor bundles
- no non-sprint feature expansion

3. Keep PRs additive and traceable:
- update ticket status, tests, and docs in the same PR
- include requirement/spec IDs in ticket closure notes

## Cross-Board Sync Requirements

When ticket status changes in this sprint, update in the same PR:

1. `docs/waves/WORK_ITEMS.md`
2. `docs/wml-engine/work-items.md` (if engine ticket touched)
3. `browser/README.md`, `engine-wasm/README.md`, `transport-rust/README.md` next-slice/checklist pointers
