# Waves Contract Requirements Mapping

Version: v0.1  
Status: initial mapping complete

## Purpose

Map contract surfaces to requirement IDs so implementation work in each project can be planned and validated against spec-derived requirements.

## Contract files

- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/transport.ts`
- `transport-rust/src/lib.rs` (public transport request/response/error models)

## Engine contract mapping (`engine-wasm/contracts/wml-engine.ts`)

| Contract Surface | Requirement IDs |
|---|---|
| `WmlDeckInput.wmlXml` | `RQ-RMK-001`, `RQ-RMK-007`, `RQ-WAE-001` |
| `WmlDeckInput.baseUrl` | `RQ-WAE-010`, `RQ-RMK-003` |
| `WmlDeckInput.contentType` | `RQ-WAE-001`, `RQ-WMLS-011` |
| `WmlDeckInput.rawBytesBase64` | `RQ-RMK-007`, `RQ-WAE-005` |
| `loadDeck(xml)` compatibility path | `RQ-RMK-001`, `RQ-RMK-007` |
| `loadDeckContext(...)` | `RQ-RMK-001`, `RQ-RMK-007`, `RQ-WAE-001` |
| `render()` / `RenderList` | `RQ-RMK-001`, `RQ-RMK-009` |
| `handleKey('up'|'down'|'enter')` | `RQ-RMK-003`, `RQ-WAE-017` |
| `navigateToCard(id)` | `RQ-RMK-003` |
| `activeCardId()` | `RQ-RMK-003` |
| `focusedLinkIndex()` | `RQ-RMK-006` |
| `externalNavigationIntent()` | `RQ-RMK-003`, `RQ-WAE-010` |
| `clearExternalNavigationIntent()` | `RQ-RMK-003` |
| `ScriptInvocationContext` (`callSite`, `cardId`, `sourceHref`) | `RQ-WMLS-001`, `RQ-WMLS-003`, `RQ-WAE-003` |
| `ScriptInvocationRef.context` | `RQ-WMLS-001`, `RQ-WMLS-003` |
| `ScriptPostInvocationEffects.navigationIntent` | `RQ-WMLS-017`, `RQ-WMLS-021` |
| `ScriptPostInvocationEffects.requiresRefresh` | `RQ-WMLS-018`, `RQ-WMLS-022` |
| `ScriptInvocationOutcome.effects` | `RQ-WMLS-017`, `RQ-WMLS-018`, `RQ-WMLS-021`, `RQ-WMLS-022` |
| `ScriptExecutionOutcome.effects` | `RQ-WMLS-017`, `RQ-WMLS-018`, `RQ-WMLS-021`, `RQ-WMLS-022` |
| `ScriptHostCapabilities` side-effect-only host adapters | `RQ-WMLS-003`, `RQ-WAE-003` |

## Transport mapping (`transport-rust/src/lib.rs`)

| Contract Surface | Requirement IDs |
|---|---|
| `fetch_deck` request/response boundary | `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003` |
| `FetchRequest.url` absolute URI | `RQ-WAE-010`, `RQ-ARC-002` (if client-id headers added later) |
| `FetchRequest.method=GET` | `RQ-TRX-001` |
| `FetchRequest.timeoutMs`, `retries` | `RQ-TRN-007`, `RQ-TRN-011`, `RQ-TRN-012` |
| `FetchResponse.finalUrl` | `RQ-WAE-010`, `RQ-TRN-012` |
| `FetchResponse.contentType` | `RQ-WAE-001`, `RQ-WAE-003`, `RQ-WMLS-011` |
| `FetchResponse.wml` normalized output | `RQ-RMK-007`, `RQ-WAE-005` |
| `FetchResponse.raw.bytesBase64` | `RQ-RMK-007`, `RQ-TRX-010` (gateway adaptation diagnostics) |
| `FetchResponse.error.code` taxonomy | `RQ-TRN-004`, `RQ-TRN-007`, `RQ-TRX-006`, `RQ-TRX-007` |
| `FetchResponse.timingMs` | `RQ-TRN-007`, `RQ-TRN-011` |
| `FetchResponse.engineDeckInput` | `RQ-RMK-007`, `RQ-WAE-001` |

## Browser transport mapping (`browser/contracts/transport.ts`)

| Contract Surface | Requirement IDs |
|---|---|
| `FetchRequest` shape | `RQ-TRX-001`, `RQ-TRN-010`, `RQ-WAE-010` |
| `FetchResponse.ok/status/finalUrl/contentType` | `RQ-TRN-012`, `RQ-WAE-001` |
| `FetchResponse.wml/raw` | `RQ-RMK-007`, `RQ-WAE-005` |
| `FetchResponse.error.code` values | `RQ-TRN-004`, `RQ-TRN-007`, `RQ-TRX-006`, `RQ-TRX-007` |
| `timingMs` structure | `RQ-TRN-007`, `RQ-TRN-011` |
| `TransportClient.fetchDeck` behavior | `RQ-TRN-001..015`, `RQ-TRX-001..010` (profile-dependent) |
| `HostSessionState` runtime fields (including `navigationStatus`) | `RQ-RMK-003`, `RQ-WAE-016`, `RQ-WAE-017` |
| `HostSessionState.externalNavigationIntent` | `RQ-WAE-010`, `RQ-RMK-003` |
| `HostSessionState.navigationSource` | `RQ-WAE-010`, `RQ-TRN-012` |
| `HostSessionState.history` / `historyIndex` | `RQ-WAE-016`, `RQ-WAE-017`, `RQ-RMK-003` |
| `HostHistoryEntry.url` / `activeCardId` | `RQ-WAE-016`, `RQ-WAE-017`, `RQ-RMK-003` |

Deterministic transport error trigger mapping:

- `INVALID_REQUEST`: request rejected before transport send (`method`, URL validation)
- `PROTOCOL_ERROR`: upstream HTTP status `>= 400`
- `UNSUPPORTED_CONTENT_TYPE`: upstream success but unsupported normalized content type
- `WBXML_DECODE_FAILED`: WBXML payload decode failure
- `GATEWAY_TIMEOUT`: terminal timeout-classified send/read failure
- `TRANSPORT_UNAVAILABLE`: terminal non-timeout send/read/client/gateway failure

Sync rule:

- Source of truth is the Rust transport model + Tauri command payloads.
- `browser/contracts/transport.ts` must remain aligned with `transport-rust` response semantics and command wiring in `browser/src-tauri`.

## Known gaps to schedule

1. Add explicit contract field for engine/runtime error taxonomy once finalized (planned quality ticket).
2. Expand script host capability coverage into concrete host wiring after W0-03 VM baseline lands.
