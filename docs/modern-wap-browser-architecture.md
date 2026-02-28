# Modern WAP Browser Track

This document defines a parallel implementation track for a faithful WAP 1.x browser environment while preserving the current lab stack.

## Target Components

- `gateway-kannel/`: gateway runtime and config strategy (WSP/WDP to HTTP/HTTPS)
- `transport-python/`: Lowband local WSP/WBXML appliance with a stable HTTP API
- `electron-app/`: desktop harness and developer tooling UI
- `engine-wasm/`: WaveNav WML deck/card runtime, layout, and input semantics

The existing local stack remains valid:

- `docker/kannel/`
- `wml-server/`

## Layer Contracts

1. Electron talks only to transport HTTP API (no UDP in UI process).
2. Electron talks to the WaveNav WASM engine through in-process function contracts.
3. WASM engine does not know about gateway internals.
4. Transport service owns WSP transaction IDs, retries, and WBXML decode.

Normalized handoff from transport to engine:

- `wmlXml` (decoded XML text)
- `baseUrl` (final URL post-redirect)
- `contentType` (for fidelity/debug logging)
- `rawBytesBase64` (optional, debug path)

## MVP Behavior

- Connectionless WSP over UDP (`9201`), no WTLS.
- `POST /fetch` returns decoded WML XML on success.
- WML engine supports:
  - `<wml>`, `<card>`, `<p>`, `<br/>`
  - `<a href>` navigation
  - `#cardId` intra-deck navigation
  - directional focus (up/down) and activate/select
- Renderer host paints a render list into a constrained viewport.

## Suggested Build Order

1. Implement Lowband (`transport-python`) API and CLI probe (`wap-fetch`).
2. Implement WaveNav engine (`engine-wasm`) parser/runtime for MVP tags.
3. Build `electron-app` shell for URL entry, softkeys, and deck inspector.
4. Wire end-to-end navigation loop.

## Compatibility Notes

- Prefer `application/vnd.wap.wmlc` and `text/vnd.wap.wml` handling first.
- Preserve `finalUrl` after redirects from gateway-origin flow.
- Keep contracts backward-compatible once consumed by Electron.
