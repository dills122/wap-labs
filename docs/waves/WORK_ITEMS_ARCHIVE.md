# Waves Browser Work Items Archive

Purpose: preserve historical/planning tickets moved out of the active execution board.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

Archive policy:

- Entries here are historical context and should not be treated as active queue items.
- If a historical area needs renewed work, create a new follow-up ticket on the active board (`docs/waves/WORK_ITEMS.md`) and link back to the archived ID.

## Initial Backlog (Prepared)

These were the first tickets prepared before Waves browser implementation started.

### P0-01 Repo bootstrap alignment for `browser/`

1. `Status`: `done`
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
7. `Notes`:
- Historical kickoff item completed; follow-on implementation landed under `B0`/`B1` host integration phases.

### P0-02 Tauri shell command contract freeze

1. `Status`: `done`
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
7. `Notes`:
- Historical kickoff item completed; command/contract baseline now maintained via generated contract artifacts and parity checks.

### P0-03 Transport module lifecycle spec

1. `Status`: `done`
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
7. `Notes`:
- Historical kickoff item completed; transport lifecycle behavior is now exercised in active browser/transport integration lanes.

### P0-04 First end-to-end integration fixture definition

1. `Status`: `done`
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
7. `Notes`:
- Historical kickoff item completed; browser integration fixtures and regression lanes are now tracked in `B3-*` and maintenance tickets.
