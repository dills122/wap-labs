# transport-python

Browser-side transport appliance for WAP networking.

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
