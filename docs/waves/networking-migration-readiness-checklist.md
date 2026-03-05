# Networking Migration Readiness Checklist (T0-08..T0-17)

Status: draft
Owner: transport docs + protocol stack alignment

This checklist translates protocol rewrite gates into a deterministic promotion plan.

Execution mapping:

- Ticket-level gate states are recorded in `docs/waves/WORK_ITEMS.md` (`T0-08` through `T0-17`) in the `Migration gates` fields.

## Gate policy

Promotion from `bridge-first` to stronger protocol layers requires:

1. ticket owner signoff,
2. fixture coverage marked in `docs/waves/SPEC_TEST_COVERAGE.md`,
3. explicit profile gate annotation in `docs/waves/WORK_ITEMS.md`,
4. no contract drift in `browser/contracts/transport.ts` and `engine-wasm/contracts/wml-engine.ts`.

## Ticket-level done-done gates

### T0-08 (`Owner`: transport-rust)

- `Done-1`: replay-window/TID policy tables are implemented and deterministic under both duplicate/no-cache assumptions.
- `Done-2`: out-of-order invoke and timeout transitions are logged with deterministic terminal state.
- `Done-3`: fixtures in `transport-rust/tests/fixtures/transport/` cover at least one each of table-6/7/8-like decisions.

### T0-09 (`Owner`: transport-rust)

- `Done-1`: WSP mode is machine-enforced as CO-only/CL-only/both profile artifact.
- `Done-2`: connectionless matrix fixture rejects invalid req/ind primitive transitions.
- `Done-3`: profile test matrix updates gate any unsupported primitive behavior in CI-like check.

### T0-10 (`Owner`: transport-rust)

- `Done-1`: assigned-number registry fixture set includes PDU types, headers, and abort reasons.
- `Done-2`: unknown/unassigned token handling path is explicit and tested for both encode/decode.
- `Done-3`: regression fixture proves stable profile-dependent behavior.

### T0-11 (`Owner`: transport-rust)

- `Done-1`: negotiation-capability merge/intersection implemented as deterministic min-policy.
- `Done-2`: negotiated limit violations emit deterministic abort/error and are fixture-asserted.
- `Done-3`: cap-overrun fixture proves blocked request paths and trace tags.

### T0-12 (`Owner`: transport-rust, docs)

- `Done-1`: `RQ-TRX-009` posture is declared with a fixed implemented/delegated/deferred split.
- `Done-2`: compatibility-check artifact is versioned in docs and does not conflict with `T0-14` profile rules.
- `Done-3`: no uncoded TCP-optimization requirement enters transport implementation silently.

### T0-13 (`Owner`: transport-rust, docs)

- `Done-1`: one explicit decision is made (`in-scope` or `deferred`) for `WAP-159`.
- `Done-2`: if deferred, scope-guardrails are written into transport-adjacent docs with no code requirement.
- `Done-3`: if in-scope, `data_sm` mapping and WCMP payload validation fixtures exist.

### T0-14 (`Owner`: transport-rust, browser)

- `Done-1`: profile contract now includes near-term and target-state transport modes.
- `Done-2`: hard gate rules for profile promotion are linked to ticket IDs and fixture coverage.
- `Done-3`: migration lane order is mirrored in `docs/waves/networking-implementation-checklist.md` and `WORK_ITEMS.md`.

### T0-15 (`Owner`: transport-rust, browser)

- `Done-1`: cache policy includes shared request-policy path and deterministic override precedence.
- `Done-2`: fixture lane proves hit/miss/reload/invalidation behavior under `cache-control`.
- `Done-3`: profile transition tests show cache policy parity between profiles.

### T0-16 (`Owner`: spec-processing)

- `Done-1`: one canonical `WAP-259` variant exists in `spec-processing/source-material`.
- `Done-2`: `finalize-new-source-material.fish --dry-run` returns zero unresolved transport conflicts.
- `Done-3`: review ledger includes one current row per transport/security canonical ID.

### T0-17 (`Owner`: docs + transport)

- `Done-1`: non-core adjacencies (`WAP-204*`, `WAP-120*`, `WAP-213*`) remain explicitly deferred.
- `Done-2`: `TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md` and `OUT_OF_SCOPE...` are aligned on transport-adjacent deferrals.
- `Done-3`: migration profile promotion criteria references `T0-17` as scope-lock check.

## Cross-tile closure rule

`T0-17` must stay true before any adjacent-adjacent transport path is promoted in `T0-14`.
