# Waves Contract Requirements Mapping

Version: v0.1  
Status: initial mapping complete

## Purpose

Map contract surfaces to requirement IDs so implementation work in each project can be planned and validated against spec-derived requirements.

## Contract files

- `engine-wasm/contracts/wml-engine.ts`
- `transport-python/api/openapi.yaml`
- `browser/contracts/transport.ts`

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

## Transport API mapping (`transport-python/api/openapi.yaml`)

| Contract Surface | Requirement IDs |
|---|---|
| `POST /fetch` request/response boundary | `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003` |
| `FetchRequest.url` absolute URI | `RQ-WAE-010`, `RQ-ARC-002` (if client-id headers added later) |
| `FetchRequest.method=GET` | `RQ-TRX-001` |
| `FetchRequest.timeoutMs`, `retries` | `RQ-TRN-007`, `RQ-TRN-011`, `RQ-TRN-012` |
| `FetchResponse.finalUrl` | `RQ-WAE-010`, `RQ-TRN-012` |
| `FetchResponse.contentType` | `RQ-WAE-001`, `RQ-WAE-003`, `RQ-WMLS-011` |
| `FetchResponse.wml` normalized output | `RQ-RMK-007`, `RQ-WAE-005` |
| `FetchResponse.raw.bytesBase64` | `RQ-RMK-007`, `RQ-TRX-010` (gateway adaptation debug) |
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
| `HostSessionState` runtime fields | `RQ-RMK-003`, `RQ-WAE-016`, `RQ-WAE-017` |
| `HostSessionState.externalNavigationIntent` | `RQ-WAE-010`, `RQ-RMK-003` |

## Known gaps to schedule

1. Ensure `TRANSPORT_UNAVAILABLE` appears in `transport-python/api/openapi.yaml` `ErrorInfo.code` enum for parity with `browser/contracts/transport.ts`.
2. Add explicit contract field for engine/runtime error taxonomy once finalized (planned quality ticket).
3. Define WMLScript fetch/bytecode unit contract extension before WMLScript runtime execution work starts.
