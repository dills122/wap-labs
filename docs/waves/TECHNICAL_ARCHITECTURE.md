# Waves Technical Architecture

Version: v0.2
Status: Canonical direction document

## Project Overview

Waves is a modern desktop WAP 1.0 browser emulator designed to execute WML decks with a native Rust runtime.

Core goals:

- deterministic WML runtime behavior
- host/runtime separation
- protocol fidelity through an in-process Rust transport stack
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

### 2) Runtime Targets

Built as a shared Rust runtime with target-specific adapters.

Targets:

- native Rust embedding (preferred for Tauri backend integration)
- WASM (`wasm-bindgen` / `wasm-pack`) for browser/webview hosts
- local browser harness (`engine-wasm/host-sample`)

Responsibilities:

- runtime deck/card execution
- deterministic layout and focus behavior
- render tree/list generation

### 3) Host Shell (Tauri)

Repository path: `browser/`

Responsibilities:

- windowing and input
- host process lifecycle
- transport request lifecycle management
- IPC bridge from UI to transport/runtime boundaries
- native runtime embedding path (when host chooses direct Rust integration)

## Transport Strategy

### Current state

Transport is handled by Rust (`transport-rust/`) as an in-process library invoked by Tauri commands.

Current transport responsibilities:

- HTTP and WAP fetch orchestration
- WSP/session framing and transport-protocol state
- WBXML decode/normalization
- gateway adaptation and error taxonomy mapping
- deterministic request correlation/logging metadata

Current protocol stack posture:

1. default profile: `gateway-bridged` (HTTP/WAP stack entry via configured gateway)
2. protocol profile: `wap-net-core` is the near-term target and is feature-gated behind completion of transport milestones
3. security profile: `wtls=noop|bridge` in current codepath, with transition decision tracked by `T0-14`

Supported profile classes:

1. `gateway-bridged`: terminal path enters via configured HTTP gateway and bypasses native WSP/WTP execution.
2. `wap-net-core`: native `WDP -> WTP -> WSP` path with mandatory CO-method support (`Get`/`Post`/`Reply`) and deterministic transaction state.
3. `wap-net-ext`: future extension mode enabling CL and optional advanced session/push features after explicit gate decisions.

Transport profile decision rules:

1. all transport behavior must be deterministic under a named profile
2. all profile promotions are gated by completed protocol fixtures and ticket chain
3. request/response contract to browser and engine must remain stable across profile changes
4. profile moves require `docs/waves/networking-migration-readiness-checklist.md` gate completion for the relevant `T0-08..T0-17` items
5. protocol-native promotion requires `T0-18..T0-22` closure for WDP/WTP/WSP core and interop replay evidence

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

## Protocol Evolution Plan

- Keep transport-rust as the single transport implementation.
- Expand protocol coverage incrementally behind tests and fixture-based checks.
- Preserve strict boundary ownership: transport handles network/protocol/decode, engine handles runtime/rendering.
- Current networking-lane regroup priority order is `T0-19 -> T0-18 -> T0-20 -> T0-22 -> T0-21`, with migration dependencies tracked in `T0-08..T0-17`.
- Future transport profiles should update both this plan and `docs/waves/networking-implementation-checklist.md` before feature introduction.

## Source handling path for transport specs

Spec-processing flow used by networking work:

1. New files are staged in `spec-processing/new-source-material/`.
2. Parsed markdown output for review appears in `tmp/docling-new-source-material/`.
3. `T0-16`/`T0-17` enforce canonicalization, conflict resolution, and deferment policy.
4. Canonical PDFs for implementation are then sourced from `spec-processing/source-material/`.

## Renderer Correctness Gate

Do not expand protocol complexity until deterministic runtime execution is proven with fixtures.

Minimum gate:

- 20+ offline fixture decks
- multi-card navigation
- `<do>` softkey behavior
- timer-driven `<onevent>`
- `<setvar>` behavior
- forward/back stack behavior

Execution targets for gate:

- Tauri host (native runtime or WASM adapter)
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
- Rust WBXML decode: ~1 week
- Rust WSP parse: ~1–2 weeks

## Repository Mapping

- Runtime/WASM: `engine-wasm/`
- Host shell (Tauri): `browser/`
- Transport library: `transport-rust/`
- Architecture docs: `docs/`

## Summary

Waves is runtime-first.

- deterministic WML execution comes before protocol rewrite
- host shell remains replaceable
- transport capability expansion proceeds in bounded phases
