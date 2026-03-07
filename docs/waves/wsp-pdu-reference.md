# WSP PDU Reference

Status: `ACTIVE`
Date: `2026-03-04`

Protocol reference for transport implementation and deterministic encoding/decoding.

Source grounding:
- `spec-processing/source-material/WAP-230-WSP-20010705-a.pdf`
- `spec-processing/source-material/OMA-WAP-TS-WSP-V1_0-20020920-C.pdf`

## 1) Service modes and directionality

- Connection-mode WSP is session oriented and relies on WTP.
- Connectionless WSP is request/reply over datagrams and relies on WDP.
- A configured profile must define active mode(s) and gate illegal operations.

## 2) Core PDU identifiers

- `Connect` (`0x01`)
- `ConnectReply` (`0x02`)
- `Disconnect` (`0x05`)
- `Push` (`0x06`)
- `ConfirmedPush` (`0x07`)
- `Get` method PDU region (`0x40` – `0x4f`)
- `Post` method PDU region (`0x60` – `0x7f`)
- `DataFragment` (`0x80`)

## 3) Abort and status code subset

- `PROTOERR` `0xE0` — protocol/state error
- `DISCONNECT` `0xE1` — session disconnected
- `SUSPEND` `0xE2` / `RESUME` `0xE3`
- `USERRFS` / `USERPND` / `USERDCR` / `USERDCU` — push-specific outcomes

## 4) PDU shape

```text
WspPdu {
  pdu_type,
  transaction_id,
  session_id,
  headers,
  content_type,
  body,
  protocol_options,
  capability_state,
}
```

Important: parsers are pure and should return structured types with all offset/remaining length available for layered validation.

## 5) Header and token model

- WSP uses tokenized headers/parameters with assigned-number tables (Tables 34/35/38/39 in OMA WSP 1.0).
- Header and content-type encoding should follow the specified `uintvar` and assignment strategies.
- Header code page `1` is the default page at the start of each header block.
- Header code page shifts use the explicit sequence `0x7F <page>`.
- Default transport policy in this repo is strict: unknown tokens and unsupported extension pages reject deterministically.
- Optional header-lenient profile may ignore unsupported extension-page tokens and fall back to textual header encoding for extension headers.
- If the peer omits `Encoding-version`, assume binary support is `1.2` or lower.
- If a header requires a higher binary encoding version than the negotiated peer version, send it in text form.
- If a received binary header uses an unsupported encoding version or unsupported extension page, the deterministic transport status output is `400` with an `Encoding-version` response header describing supported versions; for unsupported extension pages, the response omits the version value for that page.

Required codec contract:

- `decode_wsp_pdu(input: &[u8]) -> DecodeResult<WspPdu>`
- `encode_wsp_pdu(pdu: &WspPdu) -> Vec<u8>`
- `validate_wsp_pdu(pdu: &WspPdu) -> Result<(), ValidationError>`
- `encode_header(field, value) -> bytes`
- `decode_header(bytes) -> field/value`
- `validate_header(field, value) -> Result<(), Error>`

Current transport-rust baseline for this lane:

- `transport-rust/src/network/wsp/header_block.rs` provides the immediate pure header-block decode/encode surface used to apply header token, code-page, and `Encoding-version` policy before full PDU framing is implemented.

## 6) Connection-mode behavior (typical)

1. `S-Connect.request`
2. `S-Connect.indication/reply`
3. `Method Get/Post request`
4. `Method reply`
5. `S-Disconnect` on shutdown

On disconnect:
- abort pending transactions,
- invalidate pending confirmations,
- prevent further stateful operations until reconnect or profile reset.

## 7) Connectionless behavior (typical)

1. method GET/POST request
2. optional server request body (`Reply`)
3. no stateful transaction service primitives at WSP service interface
4. no connect/disconnect service states

## 8) Session/service primitives from spec matrix

- Capability negotiation is performed during session setup.
- Session headers and protocol headers carry through to service users.
- Push is unsolicited from peer and can be non-confirmed or confirmed based on feature bits.

## 9) Immediate parser/output contract for this codebase

Use this shape for transport-facing decode/encode tests:

```rust
pub enum WspPdu {
    Connect(WspConnectPdu),
    ConnectReply(WspConnectReplyPdu),
    Disconnect(WspDisconnectPdu),
    MethodGet(WspMethodGetPdu),
    MethodPost(WspMethodPostPdu),
    Reply(WspReplyPdu),
    Push(WspPushPdu),
    ConfirmedPush(WspPushPdu),
    DataFragment(WspDataFragmentPdu),
}
```

## 10) Deferred (spec-accurate completion)

- complete confirmed-push timing and delayed-ack policy,
- full appendix-C race-condition handling for incomplete state transitions.
