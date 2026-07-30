# Engine Debug Connector Plan

Status: D0-01 and D0-02 done; host and consumer implementation deferred to D0-03 and D0-04
Owner lane: `engine-wasm` + `browser`

Related reference:

- `docs/waves/ENGINE_DEBUG_CONNECTOR_RESEARCH.md`

## Purpose

Define an attachable, read-only debug connector for the running WML engine so a host-integrated
debugger or external local tool can observe bounded runtime state and event flow without mutating
core engine behavior.

This is a diagnostics surface, not a transport/runtime control plane. D0-01 defines contracts and
ownership only. It does not add runtime event emission, storage, polling behavior, Tauri commands,
or UI.

## D0-01 Decisions

1. The engine owns debug event/snapshot DTOs and, in D0-02, the recorder and sanitization boundary.
2. The browser host owns enablement policy, opaque process-local sessions, lifecycle, and, in
   D0-03, IPC commands.
3. The debugger consumer owns presentation and polling cadence only; it never masks raw data after
   the fact or controls runtime semantics.
4. The connector is disabled by default in every profile. A local host policy must enable it before
   `openDebugSession`; the open request contains no enable or unmask override.
5. MVP supports one concurrent host-owned session. Multi-session support is a future additive
   capability change.
6. Polling is the only MVP delivery model. There is no push channel or network-listening debugger.
7. Event order is defined only by decimal-string `seq`. `monotonicTimeMs` is runtime-logical,
   monotonic time for operator context and is never a correctness or ordering key. No wall-clock
   timestamp crosses the contract.
8. Sensitive unmasking is unsupported. Masking happens before values enter debug DTOs.
9. All lifecycle operations return typed success/failure unions. Debug failures are non-fatal and
   must not mutate WML state, navigation, focus, script state, timers, or render output.

## Canonical Contract Sources

The cross-language source of truth is Rust:

- `engine-wasm/engine/src/engine_debug_contract.rs`: shared event, snapshot, lifecycle, failure,
  boundedness, and redaction DTOs plus the generated connector interface
- `engine-wasm/engine/src/contract_codegen.rs`: engine TypeScript projection
- `browser/src-tauri/src/contract_types.rs`: browser-host projection of the shared Rust DTOs
- `browser/src-tauri/src/bin/generate_contracts.rs`: browser TypeScript projection

Generated consumers are:

- `engine-wasm/contracts/generated/runtime-dtos.ts`
- `browser/contracts/generated/engine-host.ts`
- `browser/contracts/engine.ts`

`engine-wasm/contracts/wml-engine.ts` re-exports the generated DTOs and exposes the connector as a
separate host-owned interface. It is intentionally not part of `WmlEngineCommon`; D0-01 does not
promise native/WASM runtime methods or session behavior.

## Additive Debug Connector Surface

```ts
openDebugSession(request) -> EngineDebugOpenSessionOutcome
pollDebugEvents(request) -> EngineDebugPollEventsOutcome
getDebugSnapshot(request) -> EngineDebugSnapshotOutcome
closeDebugSession(request) -> EngineDebugCloseSessionOutcome
```

Request sequencing:

1. `openDebugSession({ protocolVersion: 1 })` returns an opaque `sessionId`, initial cursor, and
   capabilities when local policy is enabled.
2. `pollDebugEvents({ sessionId, cursor, maxEvents })` returns a bounded batch and next cursor.
3. `getDebugSnapshot({ sessionId })` returns a sanitized bounded point-in-time view correlated by
   `capturedSeq`.
4. `closeDebugSession({ sessionId })` releases the host session. Close is idempotent: a session
   already closed by the same host returns success with `closed: false`.

Session identifiers and cursors are opaque strings, process-local, non-persistent, and invalid
after host restart. Decimal sequence strings preserve exact ordering across JavaScript and Rust
without exceeding JavaScript's safe-integer range.

## Boundedness Baseline

The generated `ENGINE_DEBUG_CONTRACT_BASELINE` pins the D0 defaults:

| Limit | Value |
| --- | ---: |
| Protocol version | `1` |
| Enabled by default | `false` |
| Concurrent sessions | `1` |
| Engine event capacity | `2048` |
| Default events per poll | `100` |
| Maximum events per poll | `256` |
| Snapshot runtime variables | `256` |
| Snapshot timers | `64` |
| Text value bytes | `4096` |

D0-02 must use fixed-capacity drop-oldest storage. A cursor older than the retained window is not a
fatal error: polling resumes at the oldest retained event and reports the exact unavailable count
in `droppedCount`. Malformed, foreign-process, or forward cursors fail with `INVALID_CURSOR`.

Snapshot collections report `totalCount`, `returnedCount`, and `truncated`. Runtime variables are
ordered by variable name; timers remain in deterministic runtime scheduling order; postfields
remain in request order. Values exceeding `maxTextBytes` use the non-value-bearing `omitted` shape
with `bounded-output`, rather than returning a partial secret.

## Event Model

Every `EngineDebugEvent` contains:

1. `seq`: decimal monotonic sequence and sole ordering key
2. `kind`: stable event-kind literal
3. `monotonicTimeMs`: runtime-logical monotonic time
4. optional `cardId`
5. typed `payload`

Initial kinds:

1. `deck.load`
2. `card.enter`
3. `card.exit`
4. `focus.change`
5. `input.edit.start`
6. `input.edit.draft`
7. `input.edit.commit`
8. `input.edit.cancel`
9. `action.accept`
10. `action.external`
11. `nav.intent`
12. `postfield.resolve`
13. `script.invoke`
14. `script.trap`
15. `timer.schedule`
16. `timer.fire`
17. `timer.cancel`

`postfield.resolve` records fields in request order and identifies each resolution source as
`variable`, `draft`, `card`, or `fallback`. An event is valid only when `kind` matches the payload
variant. D0-02 must reject mismatched construction internally rather than publish ambiguous data.

## Snapshot Model

`EngineDebugSnapshot` is a bounded explanation surface, not a memory dump. It includes:

1. protocol version and captured sequence
2. active card id and focused link index
3. focused input edit name and sanitized value
4. deterministically ordered runtime variables and collection summary
5. sanitized pending external navigation target/request fields
6. bounded timer summaries and collection summary
7. event-buffer oldest/latest sequence, capacity, and cumulative dropped count
8. viewport columns, sanitized base URL, and content type

No snapshot field grants mutation capability or implies a stable internal storage layout.

## Sensitive Data and Redaction

`EngineDebugValue` is a discriminated union:

- `visible`: carries a bounded value
- `masked`: carries only a reason, never the original value
- `omitted`: carries only a reason, never the original or truncated value

The D0-02 sanitization implementation must apply, at minimum:

1. `password` input types -> `password-input`
2. case-insensitive sensitive names such as `pin`, `pass`, `passwd`, `password`, `secret`,
   `token`, `credential`, and `auth` -> `sensitive-name`
3. variables derived from masked fields -> the same masked classification
4. URLs containing user information or credential-bearing query material ->
   `credential-bearing-url`
5. transport authorization/cookie/credential material -> `transport-secret` or complete omission
6. policy-hidden or oversized values -> `policy` or `bounded-output`

Raw transport credentials and cookies are not valid engine debug inputs and must never enter the
engine recorder. Frontend-only masking is insufficient and forbidden as the primary control.

## Failure Semantics

All errors use stable `EngineDebugErrorCode`, a deterministic non-sensitive message, and
`retryable`:

| Code | Meaning | Retryable |
| --- | --- | --- |
| `DEBUG_DISABLED` | Local host policy has not enabled the connector | `false` until policy changes |
| `UNSUPPORTED_PROTOCOL_VERSION` | Requested version is not `1` | `false` |
| `SESSION_LIMIT_REACHED` | The single MVP session is already open | `true` after close |
| `SESSION_NOT_FOUND` | Poll/snapshot session is absent or expired | `false`; reopen |
| `INVALID_CURSOR` | Cursor is malformed, foreign, or ahead of the source | `false`; reopen/snapshot |
| `INVALID_REQUEST` | Bounds or request fields are invalid | `false` until corrected |
| `DEBUG_SOURCE_UNAVAILABLE` | Recorder/source cannot currently serve data | `true` |
| `INTERNAL_ERROR` | Sanitized implementation failure | `true` |

An unknown or already-closed session on `closeDebugSession` is the idempotent success
`{ closed: false }`; `SESSION_NOT_FOUND` applies to poll and snapshot operations. Implementations
must not include raw internal errors, WML values, URLs, credentials, or panic payloads in messages.

## Runtime and Host Determinism

1. When disabled or unattached, the recorder is inert and cannot change runtime allocation order,
   navigation ordering, render output, or timing semantics.
2. D0-02 instrumentation runs synchronously at existing deterministic runtime boundaries and does
   no blocking I/O.
3. D0-03 controls recorder activation through the host policy/session lifecycle; the engine still
   owns event ordering and snapshot construction.
4. Consumer polling rate never changes event sequence or runtime behavior.
5. Closing or losing a consumer cannot fail, pause, or back-pressure the WML runtime.

## Delivery Sequence and WBP-06/F0 Gate

1. `D0-01` lands the additive `EngineDebug*` namespace and generated projections first.
2. `WBP-06` remains planning-ready and inactive. Once D0-01 is merged and active planning/status
   authorities record the gate, a separately authorized lane may start `F0-01`.
3. `F0-01` owns frame/input types and must not rename, fold into, or reuse `EngineDebug*` DTOs.
   Debug snapshots may reference future frame identifiers only through a later additive contract.
4. `D0-02` implements the engine recorder/sanitizer against this baseline without session or UI
   ownership.
5. `D0-03` implements host policy, open/poll/snapshot/close commands, and engine activation glue.
6. `D0-04` implements an optional first-party consumer and capture/export workflow.

This sequence removes the contract-file collision that blocked WBP-06/F0, but does not itself
activate WBP-06 or implement F0.

## Delivery Status and Deferred Work

### D0-02 (implemented)

- Runtime emission points cover the contract event families at existing deterministic boundaries.
- The engine-owned source uses fixed-capacity drop-oldest storage with decimal sequence/cursor and
  exact retained-window drop accounting.
- Snapshot construction bounds and orders variables/timers and reports collection/buffer summaries.
- Password inputs, sensitive names and derivations, credential-bearing URLs, transport material,
  and oversized values are masked or omitted before entering debug DTOs.
- Recorder activation/deactivation hooks remain separate from D0-03 host policy and sessions.
- Native and WASM tests cover event/snapshot parity, ordering, overflow, and secret canaries.

### D0-03

- local configuration/profile enablement
- host session ids and one-session enforcement
- Tauri commands and permission/capability changes
- request validation and typed failure mapping
- engine recorder activation wiring

### D0-04 and later

- browser debug panel, polling schedule, filtering, and JSON export
- external local tool bridge
- optional multi-session capability
- any remote transport, if separately designed and security-reviewed

Mutable debugger commands, raw secret access, runtime control bypasses, and a network-listening
inspector remain outside the MVP.
