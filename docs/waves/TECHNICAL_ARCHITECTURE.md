# Waves Technical Architecture

Version: v0.1
Status: Canonical direction document

## Project Overview

Waves is a modern desktop WAP 1.0 browser emulator designed to execute WML decks with a native Rust runtime.

Core goals:

- deterministic WML runtime behavior
- host/runtime separation
- phased transport rewrite from Python to Rust
- fidelity with historical WAP browser behavior

## Design Philosophy

Waves is an embeddable WAP runtime, not a DOM renderer.

Execution correctness is independent from:

- network transport
- latency/retries
- session negotiation

## External Architecture Alignment

Waves architecture is intentionally aligned with modern browser engine split patterns:

- content/runtime semantics live in the engine runtime layer
- host/browser shell brokers external capabilities and UI side effects
- execution isolates failures via runtime error boundaries

Guidance references:

- Chromium process model and site isolation:
  - https://chromium.googlesource.com/chromium/src/+/main/docs/process_model_and_site_isolation.md
  - https://www.chromium.org/developers/design-documents/site-isolation/
- WebKit2 architecture:
  - https://docs.webkit.org/Deep%20Dive/Architecture/WebKit2.html
- WHATWG event loop + navigation model:
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loops
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html
- WebAssembly security model:
  - https://webassembly.org/docs/security/

## System Architecture

### 1) Runtime Core (Rust)

Responsibilities:

- WML parsing
- deck/card model
- navigation stack
- softkey bindings
- variable context
- event dispatch (`onenter`, `ontimer`)
- layout model
- runtime lifecycle

Representative boundary:

```rust
fn load_deck(input: &[u8]) -> DeckHandle;
fn navigate(handle: DeckHandle, action: NavAction);
fn render(handle: DeckHandle) -> RenderTree;
```

### 2) WASM Runtime/Renderer

Built with `wasm-bindgen` / `wasm-pack`.

Runs in:

- Tauri webview host
- local browser harness (`engine-wasm/host-sample`)
- future embedded/web hosts

Responsibilities:

- runtime deck/card execution
- deterministic layout and focus behavior
- render tree/list generation

### 3) Host Shell (Tauri)

Repository path: `browser/`

Responsibilities:

- windowing and input
- host process lifecycle
- transport sidecar process management
- IPC bridge from UI to transport/runtime boundaries

## Transport Strategy

### Current state

Transport is handled by Python (`transport-python/`) as a sidecar layer.

Current Python responsibilities:

- UDP/WDP transport
- WTP transaction behavior
- WSP session framing
- WBXML decoding
- gateway integration

Reasoning:

- isolate runtime correctness from network nondeterminism
- de-risk early runtime work

### Sidecar integration model

Tauri host manages the Python process and exchanges JSON messages.

Request example:

```json
{
  "action": "fetchDeck",
  "url": "wap://example.com/login.wml"
}
```

Response example:

```json
{
  "status": 200,
  "contentType": "text/vnd.wap.wml",
  "body": "<wml>...</wml>"
}
```

## Incremental Protocol Rewrite Plan

### Phase 1

Move to Rust:

- WBXML decode

Python remains:

- UDP
- WTP
- WSP session

### Phase 2

Move to Rust:

- WSP header parsing

Python remains:

- UDP
- WTP retransmission

### Phase 3

Move to Rust:

- WSP session management

### Phase 4

Move to Rust:

- WTP retransmission logic

### Phase 5

Move to Rust:

- UDP/WDP transport

Final state:

- Rust owns UDP + WTP + WSP + WBXML + WML runtime
- Python transport is removed

## Renderer Correctness Gate (Before Transport Rewrite)

Do not start transport rewrite phases until deterministic runtime execution is proven with fixtures.

Minimum gate:

- 20+ offline fixture decks
- multi-card navigation
- `<do>` softkey behavior
- timer-driven `<onevent>`
- `<setvar>` behavior
- forward/back stack behavior

Execution targets for gate:

- Tauri host (WASM runtime)
- browser harness (`engine-wasm/host-sample`)

## WTLS Strategy

Initial plan:

- simulate handshake semantics internally
- pass decrypted WSP payloads to runtime
- use modern TLS at bridge boundaries where needed

WTLS modernization is deferred until transport parity is achieved.

## Future Targets

Because runtime is Rust-native, future host targets may include:

- Android (JNI)
- iOS (UniFFI/Swift interop)
- CLI runtime
- WASM PWA host
- headless simulation/test harnesses

## Initial Roadmap (Planning)

- Tauri bootstrap: ~1 day
- WASM runtime MVP: ~2–3 weeks
- fixture suite expansion: ~3–5 days
- Python sidecar IPC wiring: ~3–5 days
- Rust WBXML decode: ~1 week
- Rust WSP parse: ~1–2 weeks

## Repository Mapping

- Runtime/WASM: `engine-wasm/`
- Host shell (Tauri): `browser/`
- Transport sidecar: `transport-python/`
- Architecture docs: `docs/`

## Summary

Waves is runtime-first.

- deterministic WML execution comes before protocol rewrite
- host shell remains replaceable
- transport migration proceeds in bounded phases
