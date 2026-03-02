# Gateway Parity Plan (Kannel Baseline -> Embedded Transport)

Purpose: make the eventual swap from Kannel to embedded `transport-rust` a conformance exercise, not a rewrite.

Scope here is WAP 1.x only.

## Principles

- Freeze host-facing behavior at `browser/contracts/transport.ts`.
- Treat Kannel as baseline oracle while transport behavior is being locked.
- Compare normalized transport outputs, not raw implementation internals.
- Keep fixtures deterministic and replayable locally and in CI.

## Phase Gates

1. `P0` core parity: current browser demo flows behave the same on both backends.
2. `P1` edge parity: retries, timeout, content-type and decode failure mapping are stable.
3. `P2` hardening parity: constrained payload and session-related edge cases are stable.

## P0/P1 Scenario Matrix

Each row should become at least one fixture scenario.

| ID | Priority | Scenario | Input Shape | Expected Parity |
|---|---|---|---|---|
| `GP-01` | P0 | Basic WML deck fetch success | `wap://host/path.wml` GET | `ok=true`, same `status`, `finalUrl`, `contentType`, non-empty `engineDeckInput.wmlXml` |
| `GP-02` | P0 | Root deck fetch | `wap://host` GET | Same URL normalization and success mapping |
| `GP-03` | P0 | Query-string preservation | `wap://host/path.wml?x=1&y=2` | Same `finalUrl` and response payload semantics |
| `GP-04` | P0 | Protocol error mapping | Upstream HTTP `>=400` | `PROTOCOL_ERROR` with deterministic `status` and `finalUrl` |
| `GP-05` | P0 | Unsupported content type mapping | Upstream `2xx` non-WML type | `UNSUPPORTED_CONTENT_TYPE` mapping parity |
| `GP-06` | P0 | WBXML decode success | `application/vnd.wap.wmlc` valid payload | Same decoded `wml`, `engineDeckInput.contentType`, and raw-byte presence |
| `GP-07` | P0 | WBXML decode failure | Corrupt/invalid WBXML payload | `WBXML_DECODE_FAILED` mapping parity |
| `GP-08` | P1 | Invalid request method | method `POST` | `INVALID_REQUEST` parity |
| `GP-09` | P1 | Invalid URL | malformed URL input | `INVALID_REQUEST` parity |
| `GP-10` | P1 | Gateway unreachable timeout | unreachable gateway with timeout | `GATEWAY_TIMEOUT` parity |
| `GP-11` | P1 | Gateway unavailable non-timeout | bad gateway base / connect failure | `TRANSPORT_UNAVAILABLE` parity |
| `GP-12` | P1 | Retry exhaustion | retries > 0 against unreachable target | Stable final error code and deterministic status |

## P2 Add-Ons (after core parity is green)

- URI length and charset boundary cases.
- WSP/WTP retry and timer edge behavior.
- Header normalization and capability/header pass-through consistency.
- Constrained payload behavior and segmented-response handling.

## Fixture Format

Use a parity fixture layout that mirrors existing transport fixture ergonomics:

```text
gateway-kannel/parity-fixtures/<scenario-id>/
  meta.toml
  request.json
  expected.transport.json
  expected.kannel.json
  notes.md                # optional
```

### `meta.toml`

Required:

- `id`: stable scenario ID (for example `GP-01`)
- `name`
- `description`
- `priority`: `P0`/`P1`/`P2`
- `work_items`: one or more IDs
- `spec_items`: one or more requirement IDs
- `testing_ac`: checklist strings
- `mode`: `parity-fetch` (reserved for future harness)

Optional:

- `[env.transport]` and `[env.kannel]` for backend-specific env overrides.

### `request.json`

Match `FetchRequest` in `browser/contracts/transport.ts`:

- `url` (required)
- `method` (`GET` only currently)
- `headers` (optional)
- `timeoutMs` (optional)
- `retries` (optional)
- `requestId` (optional)

### `expected.*.json`

Use normalized host-level expectations:

- `ok`
- `status`
- `finalUrl`
- `contentType`
- `errorCode` (if failure)
- `wmlHash` (optional, preferred over full body for brittle decks)
- `requiresRawBytes` (`true`/`false`, optional)

## CI Strategy

1. Keep existing transport fixture harness as-is.
2. Add a dedicated parity runner later that executes the same `request.json` against:
   - Kannel-backed path
   - embedded/in-process transport path
3. Fail parity job on:
   - mismatched error code/status/final URL/content type
   - mismatched `wmlHash` when declared

## Implementation Order

1. Implement `GP-01` through `GP-04`.
2. Add WBXML pair `GP-06` and `GP-07`.
3. Add request validation and network failure cases (`GP-08` to `GP-12`).
4. Gate merges on full `P0` parity before beginning embedded gateway migration.
