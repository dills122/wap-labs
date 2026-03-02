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
- `TRANSPORT_UNAVAILABLE` / `GATEWAY_TIMEOUT`: request/send/timeout path failures

## Error Trigger Matrix (`T0-03`)

| Error Code | Deterministic Trigger |
|---|---|
| `INVALID_REQUEST` | Local request validation fails before transport send (unsupported method, invalid URL) |
| `PROTOCOL_ERROR` | Upstream HTTP response status is `>= 400` |
| `UNSUPPORTED_CONTENT_TYPE` | Upstream success (`2xx`) but normalized content-type is not WML/WBXML-supported |
| `WBXML_DECODE_FAILED` | Upstream success with `application/vnd.wap.wmlc` but decode pipeline fails |
| `GATEWAY_TIMEOUT` | Terminal send/read failure where timeout classification is true |
| `TRANSPORT_UNAVAILABLE` | Terminal send/read/client/gateway path failure not classified as timeout |

## Validation

- Unit tests in `src/lib.rs` cover normalization and mapping behavior.
- Integration fixtures in `tests/fixtures/transport/` cover fixture-driven mapping expectations.
