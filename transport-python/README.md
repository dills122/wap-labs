# Lowband (transport-python)

Lowband is the browser-side transport appliance for WAP networking.

## Responsibilities

- Encode WSP requests (MVP: `GET`)
- Send/receive UDP datagrams to Kannel gateway
- Decode WSP responses
- Decode WBXML (`application/vnd.wap.wmlc`) to WML XML
- Normalize output to a stable local HTTP API

## API contract

- Spec: `transport-python/api/openapi.yaml`
- Endpoint: `POST /fetch`
- Response always includes timing metrics and content metadata

## Engine handoff contract

The service should normalize upstream WML/WMLC into a single payload model for the WASM engine:

- `wmlXml` -> from `response.wml`
- `baseUrl` -> from `response.finalUrl`
- `contentType` -> from `response.contentType`
- `rawBytesBase64` -> from `response.raw.bytesBase64` (optional)

This keeps the renderer runtime independent of transport/WBXML details.

## Suggested implementation modules

- `transport/wsp_codec.py`
- `transport/udp_client.py`
- `transport/wbxml_decoder.py`
- `transport/service.py`
- `transport/logging.py`

## Runtime config

- `GATEWAY_HOST` (default `127.0.0.1`)
- `GATEWAY_PORT` (default `9201`)
- `TRANSPORT_BIND` (default `127.0.0.1`)
- `TRANSPORT_PORT` (default `8765`)

## Local run (first vertical slice)

From `transport-python/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python service.py
```

Service endpoints:

- `GET /health`
- `POST /fetch`

Smoke check (repo root):

```bash
make smoke-transport
```

Smoke script notes:

- Self-provisions `transport-python/.venv` if missing.
- Installs `requirements.txt` in that venv before running the check.

## Planning + Traceability

- Cross-project board: `docs/waves/WORK_ITEMS.md` (Phase `T`)
- Contract mapping: `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- Test coverage matrix: `docs/waves/SPEC_TEST_COVERAGE.md`
- Transport requirements:
  - `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
  - `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`

## Current checklist (planning)

- [x] OpenAPI-generated browser contract guardrail added (`pnpm run check:transport-contract`, CI + Makefile)
- [ ] Deterministic normalization to engine deck input payload
- [ ] Error taxonomy alignment for timeout/retry/protocol/decode conditions
- [ ] Integration tests for WML and WBXML decode paths
