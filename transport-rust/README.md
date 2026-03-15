# transport-rust (Lowband Transport Library)

In-process Rust transport boundary used by the Waves browser host.

## Scope

- HTTP/HTTPS fetch transport
- `wap://`/`waps://` gateway bridging
- content-type normalization and WML payload mapping
- WBXML decode path (`application/vnd.wap.wmlc` -> textual WML)

## Engine Handoff Normalization Guarantees (`T0-02`)

When `FetchDeckResponse.ok === true`, `engineDeckInput` is present and follows these rules:

1. `engineDeckInput.wmlXml`
- textual WML payload passed to the engine
- for textual WML responses: exact body bytes interpreted as UTF-8-lossy string
- for WBXML responses: decoder output WML string

2. `engineDeckInput.baseUrl`
- equals `FetchDeckResponse.finalUrl`
- for proxied `wap://`/`waps://` requests, this remains the original WAP URL presented to host/engine

3. `engineDeckInput.contentType`
- equals normalized `FetchDeckResponse.contentType`
- for WBXML decode success, this remains `application/vnd.wap.wmlc` (source media type is preserved as metadata)

4. `engineDeckInput.rawBytesBase64` (optional by contract, currently populated on success)
- base64 of original response payload bytes before decode/transform
- textual WML: raw textual bytes encoded as base64
- WBXML: raw WBXML bytes encoded as base64

When `FetchDeckResponse.ok === false`:

- `engineDeckInput` is `None`
- `wml` is `None`

## Error Mapping Notes

- `UNSUPPORTED_CONTENT_TYPE`: unsupported upstream content-type for deck handoff
- `WBXML_DECODE_FAILED`: WBXML payload could not be decoded
- `PROTOCOL_ERROR`: upstream HTTP `status >= 400`
- `PAYLOAD_TOO_LARGE`: payload exceeded the explicit transport/engine handoff limit
- `TRANSPORT_UNAVAILABLE` / `GATEWAY_TIMEOUT`: request/send/timeout path failures

## Error Trigger Matrix (`T0-03`)

| Error Code | Deterministic Trigger |
|---|---|
| `INVALID_REQUEST` | Local request validation fails before transport send (unsupported method, invalid URL) |
| `PROTOCOL_ERROR` | Upstream HTTP response status is `>= 400` |
| `UNSUPPORTED_CONTENT_TYPE` | Upstream success (`2xx`) but normalized content-type is not WML/WBXML-supported |
| `WBXML_DECODE_FAILED` | Upstream success with `application/vnd.wap.wmlc` but decode pipeline fails |
| `PAYLOAD_TOO_LARGE` | Response/deck body exceeds explicit guardrail limits before successful handoff |
| `GATEWAY_TIMEOUT` | Terminal send/read failure where timeout classification is true |
| `TRANSPORT_UNAVAILABLE` | Terminal send/read/client/gateway path failure not classified as timeout |

## Validation

- Unit tests in `src/lib.rs` cover normalization and mapping behavior.
- Integration fixtures in `tests/fixtures/transport/` cover fixture-driven mapping expectations.

## Next implementation slice

1. Support the active cross-lane runtime fidelity work without reopening completed transport lanes.
2. Keep residual `M1-08` transport cleanup opportunistic only if a new hotspot emerges.
3. Keep `T0-07`, broader conformance fixtures, and `M1-03` as follow-on work rather than current priority drivers.

## Current checklist (planning/execution)

- [x] Freeze transport normalization guarantees for engine handoff (`T0-02`)
- [x] Freeze deterministic transport error trigger matrix (`T0-03`)
- [x] Decompose transport internals into clearer module boundaries (`M1-04`)
- [x] Add CI guardrails for contract drift checks (`M1-06`)
- [ ] Split high-churn transport file responsibilities without behavior changes (`M1-08`)
- [x] Add explicit payload-size guardrails with deterministic oversized rejection (`M1-16`)
- [x] Add cache/reload request-policy conformance plumbing (`T0-04`)
- [x] Add deterministic WTP replay-window fixtures (`T0-08`)
- [x] Add UA capability header conformance path (`T0-05`)
- [x] Add URI-length and charset boundary conformance fixtures (`T0-06`)
- [ ] Add WBXML token/literal compatibility conformance fixtures (`T0-07`)
- [x] Add WSP assigned-number registry fixture lane (`T0-10`)
- [x] Add WSP capability negotiation/bounds fixture lane (`T0-11`)
- [x] Declare Wireless Profiled TCP posture with fixture-backed drift guard (`T0-12`)
- [x] Add SMPP adaptation scope decision guardrail (`T0-13`, deferred posture)
- [x] Add networking profile decision record + machine-checkable promotion gates (`T0-14`)
