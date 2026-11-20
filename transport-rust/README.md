# transport-rust (Lowband Transport Library)

In-process Rust transport boundary used by the Waves browser host.

Lowband makes one POST attempt per fetch operation, even if a caller requests retries.
After a transport or response failure the origin may already have processed the submission; a
later explicit user action can submit it again. GET requests retain the configured retry policy.
This limit covers Lowband's own HTTP and connectionless WSP retry loops; HTTP redirects and
independent retries or side effects inside an intermediary gateway or origin are separate.

## `wapcurl` diagnostic CLI

`wapcurl` is a small curl-like developer probe built on the same Lowband fetch facade, WSP codec,
WBXML decoder, destination policy, retry bounds, and response-size limit as the desktop host.
Install it locally or run it from the repository:

```sh
cargo install --path transport-rust --bin wapcurl
cargo run --manifest-path transport-rust/Cargo.toml --bin wapcurl -- --help
```

Inspect decoded WML over direct HTTP:

```sh
wapcurl https://example.test/deck.wml
```

Use native connectionless WSP/WDP while keeping the resource URL separate from the gateway peer:

```sh
wapcurl \
  --profile wap-net-core \
  --gateway 159.89.254.0:9200 \
  wap://home.wap.shrimpworks.dev/
```

Inspect the original WMLC bytes or save them:

```sh
wapcurl --gateway 159.89.254.0:9200 --hex \
  wap://home.wap.shrimpworks.dev/examples/index.wml
wapcurl --gateway 159.89.254.0:9200 --raw \
  wap://interop.wap.shrimpworks.dev/ > response.wbxml
wapcurl --gateway 159.89.254.0:9200 --output response.wbxml \
  wap://interop.wap.shrimpworks.dev/
```

Use the explicit HTTP gateway bridge or a controlled local fixture:

```sh
wapcurl --profile gateway-bridged --gateway http://localhost:13002 \
  --allow-private wap://localhost/examples/index.wml
wapcurl --allow-private http://127.0.0.1:8080/fixture.wml
```

`--json` emits one object on stdout. `--verbose` emits redacted trace events on stderr. Header
values for authorization and cookies, URL credentials, and sensitive query parameters are
redacted from diagnostics by default.

The default is one attempt with a 5-second whole-request timeout. `--retry` is limited to `0..2`,
`--timeout-ms` to `100..30000`, HTTP redirects to 10, and bodies to 524,288 bytes. There is no
automatic native-to-bridge fallback.

Exit codes:

| Code | Meaning                                          |
| ---: | ------------------------------------------------ |
|    0 | Success                                          |
|    2 | CLI usage/configuration error                    |
|    3 | Invalid request or destination-policy rejection  |
|    4 | Request timeout                                  |
|    5 | Unreachable/unavailable transport                |
|    6 | Protocol/status failure                          |
|    7 | Unsupported content type or WBXML decode failure |
|    8 | Response exceeded the shared payload limit       |
|    9 | Local output/write failure                       |

### Opt-in public smoke

This live command is intentionally manual and bounded. It performs one request, has a 5-second
timeout, allows no retries, and expects the public service to return WML 1.3 WBXML (numeric public
identifier 10):

```sh
cargo run --manifest-path transport-rust/Cargo.toml --bin wapcurl -- \
  --gateway 159.89.254.0:9200 \
  --timeout-ms 5000 \
  --retry 0 \
  --hex \
  wap://home.wap.shrimpworks.dev/examples/index.wml
```

The public lab is unencrypted test infrastructure. Do not send real credentials, cookies, or
personal data. Ordinary tests use local fixtures and never depend on this service.

## Scope

- HTTP/HTTPS fetch transport
- `wap://`/`waps://` gateway bridging
- content-type normalization and WML payload mapping
- WBXML decode path (`application/vnd.wap.wmlc` -> textual WML)

## Request ingress limits

`FetchDeckRequest` is validated before network or gateway work. The Rust-owned limits are exported
to the generated browser transport contract as `FETCH_REQUEST_INGRESS_LIMITS`:

| Input | Limit |
| --- | ---: |
| Request or referring URL | 1,024 bytes |
| Request method | 16 bytes |
| Request/correlation ID | 128 bytes |
| Headers | 64 entries / 32,768 aggregate name-and-value bytes |
| POST fields | 128 entries |
| POST field name | 256 bytes |
| POST field value | 16,384 bytes |
| Encoded or legacy POST body | 65,536 bytes |
| POST metadata value | 1,024 bytes |

Limit failures identify only the bounded field and limit; request values are never included in the
error text. Form serialization checks the encoded aggregate incrementally before appending it.

The runtime decoder is built into this crate and pinned as
`lowband-wml13-wbxml/0.3.0`; it does not require a sidecar binary or FFI
dependency. WBXML parsing remains transport-owned, and the engine receives
only normalized textual WML plus the original bytes as metadata.

The native connectionless WSP profile advertises `Encoding-Version: 1.3` as a compact
version-value. The local Kannel image carries a narrow connectionless-path patch so Kannel accepts
that spec-valid short-integer value and carries the device request header into WML compilation,
just as it does for a session-bound request. The decoder remains strict about the selected WBXML
1.3 envelope and WML 1.3 public ID.

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
- uses the normalized source type for textual WML
- uses `application/vnd.wap.wmlc` for decoded WML 1.3 WBXML. For generic WBXML,
  `FetchDeckResponse.contentType` retains the source MIME type.

4. `engineDeckInput.rawBytesBase64` (optional by contract, currently populated on success)
- base64 of original response payload bytes before decode/transform
- textual WML: raw textual bytes encoded as base64
- WBXML: raw WBXML bytes encoded as base64

When `FetchDeckResponse.ok === false`:

- `engineDeckInput` is `None`
- `wml` is `None`

### Textual WML decoding

Lowband decodes textual response bytes before handing Unicode text to the native
or WASM engine. An explicit MIME `charset` takes priority over the XML encoding
declaration. A conflicting BOM fails the response. With no MIME charset,
Lowband uses the BOM and checks any declaration for consistency, or uses the
initial XML declaration and defaults to UTF-8 when absent. In-deck `meta`
elements are document content and do not select a decoder.

This policy applies XML detection to unlabeled WML responses and preserves
the existing UTF-8 default for that path. The historical WML registration
refers to the XML media type principles in RFC 2376, which also specifies a
US-ASCII default for its own `text/xml` media type.
[WML media type registration](https://www.iana.org/assignments/media-types/text/vnd.wap.wml) · [RFC 2376 §3.1](https://www.rfc-editor.org/rfc/rfc2376#section-3.1) · [XML 1.0 §4.3.3](https://www.w3.org/TR/1998/REC-xml-19980210#charencoding)

Supported labels cover UTF-8, UTF-16 with a BOM, explicit UTF-16LE and
UTF-16BE, US-ASCII, and ISO-8859-1. Malformed bytes and unsupported labels fail
without inserting replacement characters. The handoff preserves the original bytes for
diagnostics alongside the losslessly decoded document. Native and WASM WaveNav
apply XML 1.0 character validation while parsing that text.

### WBXML document routing

`decode_wbxml_for_content_type` decodes WBXML 1.3 to XML and returns the
selected page-zero vocabulary. The format-specific MIME type requires a
matching public identifier. Generic `application/vnd.wap.wbxml` uses the
document's public identifier directly.

| Vocabulary | Format-specific MIME type | Public ID forms |
| --- | --- | --- |
| WML 1.3 | `application/vnd.wap.wmlc` | Numeric `0x0A` or literal |
| Service Indication 1.0 | `application/vnd.wap.sic` | Numeric `0x05` or literal |
| Service Loading 1.0 | `application/vnd.wap.slc` | Numeric `0x06` or literal |
| Cache Operation 1.0 | `application/vnd.wap.coc` | Numeric `0x07` or literal |
| Channel 1.2 | `application/vnd.wap.channelc` | Literal only |

Channel MIME version `1.2` may be explicit or omitted. Numeric identifier
`0x08` belongs to Channel 1.1 and fails decoding.
WBXML strings reject XML 1.0-forbidden characters. Attribute whitespace is
serialized as character references so XML attribute normalization preserves it.

WML 1.3 can enter the deck engine through either WBXML MIME route. SI 1.0
decoding covers its page-zero tokens, literal forms, action default, and
applicable href-derived `si-id`. OPAQUE values for `created` and `si-expires` on
`indication` decode to UTC timestamps. The decoder restores omitted time pairs
as zeros, accepts explicitly encoded zeros, and rejects invalid packed digits,
calendar dates, times, and truncated payloads. SL defaults to
`action="execute-low"` and Channel defaults to `useraccessible="false"`. CO
declares no attribute defaults. Channel's optional attributes stay absent
when omitted. The deck fetch reports valid non-WML documents as unsupported
content. The decoder API returns their XML without applying document actions.

## Error Mapping Notes

- `UNSUPPORTED_CONTENT_TYPE`: unsupported upstream content-type for deck handoff
- `WBXML_DECODE_FAILED`: WBXML payload could not be decoded
- `PROTOCOL_ERROR`: upstream HTTP `status >= 400` or textual WML decoding failed
- `PAYLOAD_TOO_LARGE`: payload exceeded the explicit transport/engine handoff limit
- `TRANSPORT_UNAVAILABLE` / `GATEWAY_TIMEOUT`: request/send/timeout path failures

## Error Trigger Matrix (`T0-03`)

| Error Code | Deterministic Trigger |
|---|---|
| `INVALID_REQUEST` | Local request validation fails before transport send (unsupported method, invalid URL) |
| `PROTOCOL_ERROR` | Upstream HTTP response status is `>= 400`, or textual WML bytes and encoding metadata could not be decoded |
| `UNSUPPORTED_CONTENT_TYPE` | Upstream success (`2xx`) but normalized content-type is not WML/WBXML-supported |
| `WBXML_DECODE_FAILED` | Upstream success with `application/vnd.wap.wmlc` but decode pipeline fails |
| `PAYLOAD_TOO_LARGE` | Response/deck body exceeds explicit guardrail limits before successful handoff |
| `GATEWAY_TIMEOUT` | Terminal send/read failure where timeout classification is true |
| `TRANSPORT_UNAVAILABLE` | Terminal send/read/client/gateway path failure not classified as timeout |

## Validation

- Unit tests in `src/lib.rs` cover normalization and mapping behavior.
- Integration fixtures in `tests/fixtures/transport/` cover fixture-driven mapping expectations.
- Source-derived WML 1.3 WBXML fixtures live in
  `tests/fixtures/transport/wbxml_wml13/conformance.json` and run through the
  exact `transport_wbxml_*` tests. The corpus contains 42 fixed outcomes,
  an exhaustive 36-tag/85-attribute-start/27-attribute-value page-zero
  equivalence matrix, deterministic full-range tag/attribute page handling,
  and a reviewed 47-clause selected-client implementation inventory; the SCR
  parent rows remain partial where broader document-family evidence is open.

## Next implementation slice

1. Preserve the schema-v2 WDP delivery -> fetch/WBXML decode -> native engine
   parity evidence and its paired `WML-203` WASM story while broader DTD and
   document-family gates remain open.
2. Keep the completed selected-WDP replay boundary for `TRN-706` distinct from
   the work item's conditional WTP family gap.
3. Keep the completed WSP-801 connectionless matrix distinct from WSP-802's
   header registry, Encoding-Version, code-page, and unknown/fallback closure;
   keep WTP inactive unless connection-oriented WSP is explicitly claimed, and
   retain `M1-03` as a non-priority follow-up.

## Current checklist (planning/execution)

- [x] Freeze transport normalization guarantees for engine handoff (`T0-02`)
- [x] Freeze deterministic transport error trigger matrix (`T0-03`)
- [x] Decompose transport internals into clearer module boundaries (`M1-04`)
- [x] Add CI guardrails for contract drift checks (`M1-06`)
- [x] Split high-churn transport file responsibilities without behavior changes (`M1-08`)
- [x] Add explicit payload-size guardrails with deterministic oversized rejection (`M1-16`)
- [x] Add cache/reload request-policy conformance plumbing (`T0-04`)
- [x] Add deterministic WTP replay-window fixtures (`T0-08`)
- [x] Add UA capability header conformance path (`T0-05`)
- [x] Add URI-length and charset boundary conformance fixtures (`T0-06`)
- [ ] Complete WBXML token/literal compatibility conformance (`T0-07` /
  `R0-08`; pinned decoder and all 47 selected client clauses are directly
  evidenced; additional vocabularies and the unselected server/encoder profile
  remain open)
- [x] Add WSP assigned-number registry fixture lane (`T0-10`)
- [x] Add WSP capability negotiation/bounds fixture lane (`T0-11`)
- [x] Declare Wireless Profiled TCP posture with fixture-backed drift guard (`T0-12`)
- [x] Add SMPP adaptation scope decision guardrail (`T0-13`, deferred posture)
- [x] Add networking profile decision record + machine-checkable promotion gates (`T0-14`)

For cancellable native WDP fetches, receive polling observes cancellation without waiting for the
full gateway timeout. Direct HTTP sends and body reads also observe cancellation promptly. The
configured attempt deadline and retry policy remain in force. Operating-system DNS lookups cannot be
interrupted once started; a separate process-wide limit keeps any surviving lookup work bounded.
