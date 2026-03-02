# Transport Fixture Corpus

Purpose: fixture-driven transport regression scenarios with explicit acceptance criteria metadata.

## Fixture layout

Each scenario folder contains:

- `meta.toml`
- `request.json`
- `expected.json`

Example:

```text
tests/fixtures/transport/invalid_method/
  meta.toml
  request.json
  expected.json
```

## `meta.toml` contract

Required fields:

- `name`: short scenario name
- `description`: scenario intent
- `work_items`: one or more backlog IDs (`T0-02`, `T0-03`, etc.)
- `spec_items`: one or more requirement IDs (`RQ-TRN-*`, `RQ-TRX-*`)
- `testing_ac`: checklist strings for deterministic acceptance
- optional `mode`:
  - `fetch` (default): execute via `fetch_deck_in_process`
  - `mapped`: scenario is executed in `src/lib.rs` unit tests using mapper helpers

Optional fields:

- `[env]` table for scenario-local environment overrides (restored after run)

## Runner

The harness lives in `transport-rust/tests/fixture_harness.rs` and validates:

1. Metadata completeness (`work_items`, `spec_items`, `testing_ac`)
2. Request execution through `fetch_deck_in_process` for `mode=fetch`
3. Core response expectations from `expected.json`
