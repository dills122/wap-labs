# WSP PDU Reference (Draft)

Status: `DRAFT` (source-grounding in progress)
Date: `2026-03-04`

This is a working reference index for WSP PDU support in the rewrite.
Field formats below are placeholders where definitive encoding details are still being confirmed from primary specs.

Source grounding:
- `spec-processing/source-material/WAP-230-WSP-20010705-a.pdf`
- `spec-processing/source-material/OMA-WAP-TS-WSP-V1_0-20020920-C.pdf`

## 1) Message classes

| PDU | Transport role | Transport expectation | Draft status |
| --- | -------------- | -------------------- | ------------ |
| CONNECT | Session setup | Start/refresh session state | In progress |
| DISCONNECT | Session teardown | Release state and resources | In progress |
| GET | Request (safe/idempotent) | Usually maps to deck fetch/GET resource | In progress |
| POST | Request (entity upload) | Browser-originated data / form submit | In progress |
| REPLY | Response | Server response to prior request | In progress |
| PUSH | Asynchronous server-to-client request-like event | Browser notification path | In progress |

## 2) WSP packet envelope shape

```text
WspPdu
  - pdu_type: enum
  - tid/session_id: optional
  - headers: TokenizedHeader[]
  - content-type / headers payload
  - application-data: bytes
```

## 3) Header model

WSP uses compact header tokens instead of raw header strings for common fields.

### Core example set (draft)

- Content-Type
- Content-Length
- User-Agent
- Host
- X-WAP-Session
- Content-Encoding
- Accept
- Location
- Cache-Control

### Header codec contract (target)

- `encode_header(field, value) -> bytes`
- `decode_header(bytes) -> field/value`
- `validate_header(field, value) -> Result<(), Error>`

## 4) Parsing contract

Each parser function must be:

- Stateless
- Side-effect free
- Deterministic
- Explicit on consumed bytes vs remaining bytes

Recommended API shape:

- `decode_wsp_pdu(input: &[u8]) -> DecodeResult<WspPdu>`
- `encode_wsp_pdu(pdu: &WspPdu) -> Vec<u8>`
- `validate_wsp_pdu(pdu: &WspPdu) -> Result<(), ValidationError>`

## 5) WSP event sequence (MVP)

### Request path

1. Build WSP request PDU (GET/POST)
2. Hand to WTP as invoke class 2 where reliability needed
3. Await reply event and parse REPLY

### Push path

1. WDP receives packet
2. WTP decodes invoke/notification variant
3. WSP decodes PUSH
4. Browser event sink receives push payload

## 6) Known implementation placeholders

- Exact binary wire opcodes/tokens
- Segmentation and continuation rules
- Session header variants and extended fields
- Capability negotiation flags and error response mapping

These are intentionally left as TODO until primary specs are fully reconciled against Wireshark/Kannel behavior.
