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

1. `Status`: `todo`
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
- `browser/frontend/src/main.ts`
- `browser/src-tauri/src/lib.rs`
- `transport-rust/src/lib.rs`
3. `Build`:
- Move code into boundary modules (`api`, `state`, `actions`, `mapping`, `ui`) without broad behavior changes.
4. `Tests`:
- Existing project test/build commands remain green.
5. `Accept`:
- High-churn files are reduced and responsibilities are easier to review.
6. `Notes`:
- Engine-side decomposition has landed and merged.
- Remaining M1-08 scope is browser + transport boundary decomposition.

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
