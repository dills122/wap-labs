# Engine Debug Connector Research Notes

Status: reference
Owner lane: `engine-wasm` + `browser`
Last reviewed: `2026-03-14`

## Purpose

Capture external debugger architecture patterns relevant to Waves so D0 implementation work can borrow proven ideas instead of inventing a bespoke inspection model from scratch.

This document complements, but does not replace, `docs/waves/ENGINE_DEBUG_CONNECTOR_PLAN.md`.

## Current Waves Baseline

Current local architecture already provides some useful starting points:

1. Tauri host owns a single in-process `WmlEngine` instance behind `Mutex<WmlEngine>`.
2. Host commands already expose deterministic read-only runtime snapshots after each command.
3. Engine already has lightweight trace capture for harness/debug workflows.
4. Existing trace support is useful scaffolding, but it is not yet an attachable debugger protocol.

Relevant files:

- `browser/src-tauri/src/engine_bridge/engine_adapter.rs`
- `browser/src-tauri/src/contract_types.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `engine-wasm/engine/src/engine_runtime_internal/trace.rs`

## Research Goal

Identify debugger and inspector designs from mature systems that resemble Waves in at least one key way:

1. embedded runtime inspected through a host process
2. structured event/state inspection
3. attachable sessions or targets
4. optional first-party UI layered on top of a protocol or bridge

## Reviewed Systems

### 1. Chrome DevTools Protocol (CDP)

References:

- <https://chromedevtools.github.io/devtools-protocol/>
- <https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/public/devtools_protocol/README.md>

Why it matters:

1. CDP is a strong reference for typed command/event protocols over a host boundary.
2. It separates runtime instrumentation from the inspector frontend.
3. It treats attach, enable, and target/session concepts as explicit protocol elements.

Patterns worth borrowing:

1. group debugging features into additive typed surfaces instead of one catch-all blob
2. use stable string identifiers and event names
3. require explicit client opt-in before streaming heavier event traffic
4. keep commands/events protocol-oriented rather than UI-oriented

Notable caution:

1. CDP is much broader than Waves needs; copying its domain sprawl would be counterproductive.

### 2. Firefox Remote Debugging Protocol (RDP)

Reference:

- <https://firefox-source-docs.mozilla.org/devtools/backend/protocol.html>

Why it matters:

1. RDP shows a clean attachable lifecycle with explicit actor ownership and teardown.
2. It models request/reply and notification traffic cleanly.
3. It is a good example of inspection over a brokered runtime boundary.

Patterns worth borrowing:

1. make resource/session lifetime explicit
2. allow read-only notifications without making the runtime depend on an always-live client
3. keep parent/child ownership clear between broker and inspected runtime

Notable caution:

1. Actor-model machinery would be excessive for the first Waves implementation.

### 3. VS Code Debug Adapter Protocol (DAP)

References:

- <https://microsoft.github.io/debug-adapter-protocol/>
- <https://code.visualstudio.com/api/extension-guides/debugger-extension>

Why it matters:

1. DAP is the clearest precedent for separating debugger UI from runtime-specific debugging logic.
2. The adapter sits between generic tooling and the actual runtime/debugger.
3. It proves the value of a host-owned translation layer.

Patterns worth borrowing:

1. keep the host bridge as an adapter, not as the runtime itself
2. keep the frontend consumer reusable by depending on typed host contracts
3. advertise capabilities up front so clients can adapt to partial support

Notable caution:

1. DAP assumes a richer command model than Waves needs in MVP; Waves should stay read-only.

### 4. Node Inspector

Reference:

- <https://nodejs.org/en/learn/getting-started/debugging>

Why it matters:

1. Node is a strong precedent for local attach, session URLs/ids, and secure-by-default warnings.
2. It treats debugger access as privileged.

Patterns worth borrowing:

1. default to local-only debugging surfaces
2. disable or omit the connector outside development profiles by default
3. make attachability a deliberate act, not ambient behavior

Notable caution:

1. Waves should avoid exposing a network-listening inspector in MVP.

### 5. WebKit Remote Inspection

Reference:

- <https://webkit.org/web-inspector/enabling-web-inspector/>

Why it matters:

1. WebKit shows how an embedded runtime can remain inspectable without mixing inspector logic into app UI logic.
2. It reinforces the value of a host-managed inspection surface for embedded contexts.

Patterns worth borrowing:

1. make the runtime inspectable through a host boundary
2. preserve runtime semantics even when inspection is attached
3. keep the inspector out of the core execution path

### 6. Redux DevTools / Remote Redux DevTools

References:

- <https://github.com/reduxjs/redux-devtools>
- <https://github.com/zalmoxisus/remote-redux-devtools>

Why it matters:

1. It is a practical example of structured state/action history, export, replay-oriented artifacts, and an optional remote monitor.
2. It is closer to Waves than a full debugger when thinking about timeline inspection and bug triage.

Patterns worth borrowing:

1. keep event history structured and exportable
2. support an in-app first-party monitor first
3. treat remote monitoring as optional and additive

Notable caution:

1. Waves is runtime inspection, not just state history; event payloads still need runtime-specific design.

## Repeated Patterns Across Mature Systems

These themes appeared consistently across the systems above:

1. Separate runtime semantics from debugger transport and UI.
2. Model debugging as attachable sessions or targets.
3. Use structured, typed events and snapshots instead of free-form logs.
4. Gate heavier inspection behind explicit attach/enable.
5. Keep debugging additive and non-disruptive to normal runtime behavior.
6. Prefer local/dev-only exposure for privileged debugging surfaces.
7. Use stable string ids and event names.
8. Preserve determinism even if the debugger is disconnected, slow, or absent.

## Recommended Waves Architecture

Based on repo constraints and the systems reviewed above, Waves should use a three-layer debug connector:

### Layer 1: Engine-owned recorder

Location:

- `engine-wasm/engine`

Responsibilities:

1. deterministic event emission at runtime boundaries
2. fixed-size ring buffer with drop-oldest behavior
3. monotonic sequence numbering
4. read-only debug snapshot generation
5. sensitive-field masking before data leaves engine-owned structures

Non-responsibilities:

1. no host IPC
2. no session bookkeeping
3. no UI-specific formatting

### Layer 2: Host-owned session broker

Location:

- `browser/src-tauri`
- `browser/contracts/*`

Responsibilities:

1. debug session open/close lifecycle
2. local policy gating and dev-mode enablement
3. command validation and error handling
4. mapping engine debug types to generated Rust/TypeScript contracts
5. optional later expansion to external tooling surfaces

Non-responsibilities:

1. no reinterpretation of engine runtime semantics
2. no mutation/debugger control plane in MVP

### Layer 3: Consumer UI/tooling

Location:

- `browser/frontend`
- possible later external tool bridge

Responsibilities:

1. polling recent events
2. rendering timeline and snapshot views
3. export-to-JSON capture flow
4. filtering/search/presets

Non-responsibilities:

1. no direct runtime mutation
2. no source of truth for masking or sequencing

## Recommended MVP Contract Style

The current plan direction is correct. The preferred additive surface is:

1. `openDebugSession(options) -> { sessionId, cursor, capabilities }`
2. `pollDebugEvents({ sessionId, cursor, maxEvents }) -> { events, nextCursor, droppedCount }`
3. `getDebugSnapshot({ sessionId }) -> EngineDebugSnapshot`
4. `closeDebugSession({ sessionId }) -> { closed: boolean }`

Recommended notes:

1. `sessionId` should be host-owned, process-local, and opaque
2. engine should expose cursor-based polling primitives, but should not own per-client sessions
3. `capabilities` should be explicit so clients can adapt safely

Suggested initial capabilities:

1. `supportsSnapshots: true`
2. `supportsPolling: true`
3. `masking: "masked"`
4. `supportsUnmaskSensitive: false`

## Polling vs Push

Recommendation: use polling for MVP.

Why:

1. simpler host/runtime integration
2. easier deterministic testing
3. avoids background event pump complexity in Tauri
4. works for both native host integration and future WASM-boundary use
5. failure in the consumer does not pressure the engine execution path

Suggested behavior:

1. consumer polls only while debug panel/tool is open
2. host or UI can use a bounded interval such as `100-250ms`
3. event delivery remains best-effort within the ring-buffer window

## Event Ordering and Time

Recommendation:

1. `seq` is the primary ordering key
2. `tsMs` is useful for operator context, but not for correctness
3. snapshots and replay-oriented tooling should trust `seq`, not wall clock

Reasoning:

1. deterministic runtime ordering is more important than wall-clock precision
2. monotonic sequence values are stable across local triage and tests

## Session Ownership

Recommendation:

1. host owns sessions
2. engine owns event history and snapshot generation

Why:

1. the engine currently models one running runtime, not a debugger multiplexer
2. host-managed sessions make future multi-client support additive
3. this preserves clean boundaries between runtime semantics and IPC/lifecycle concerns

## Sensitive Data Policy

Recommendation:

1. mask sensitive values at the engine boundary
2. keep local unmasking off by default
3. avoid exposing raw transport credentials or secrets in events or snapshots

Suggested sensitive-field heuristics for MVP:

1. password-type inputs
2. field names including `pin`, `passwd`, `password`
3. runtime vars derived from masked fields

Reasoning:

1. frontend-only masking is too easy to bypass accidentally
2. engine-side masking gives consistent behavior across all consumers

## Recommended Event Set for Waves MVP

The event list in the current plan remains sound:

1. `deck.load`
2. `card.enter`
3. `card.exit`
4. `focus.change`
5. `input.edit.start`
6. `input.edit.draft`
7. `input.edit.commit`
8. `input.edit.cancel`
9. `action.accept`
10. `action.external`
11. `nav.intent`
12. `postfield.resolve`
13. `script.invoke`
14. `script.trap`
15. `timer.schedule`
16. `timer.fire`
17. `timer.cancel`

Strong recommendation:

1. `postfield.resolve` should include resolution source per field:
   - `var`
   - `draft`
   - `card`
   - `fallback`

This is the single highest-value event detail for form-submit triage.

## Recommended Snapshot Contents

The snapshot should cover enough state to explain the latest behavior without requiring a full memory dump.

Recommended MVP snapshot:

1. active card id
2. focused link index
3. focused input edit name/value with masking applied
4. runtime vars with masking applied
5. active card form-state summary
6. pending external navigation intent
7. pending external navigation request policy including post context
8. timer state summary
9. debug buffer metadata: `oldestSeq`, `latestSeq`, `droppedCount`
10. viewport cols
11. base URL
12. content type

## Relationship to Existing `traceEntries()`

Current trace support is useful, but it should not become the long-term debug connector contract.

Recommended stance:

1. treat `traceEntries()` as legacy harness/debug support
2. reuse trace learnings and some emission points where practical
3. move D0 work onto typed events/snapshots rather than extending string-detail traces indefinitely

Reasoning:

1. traces are useful for humans, but weak as a stable contract
2. typed events will age better for host/frontend/test consumers

## Recommended MVP Delivery Strategy

The best first usable setup is:

1. engine-owned ring buffer and snapshot builder
2. Tauri-host debug session commands
3. Waves first-party debug panel
4. JSON export for bug artifacts

Do not start with:

1. remote networked debugger transport
2. mutable debugger commands
3. full external IDE/tool integration

Reasoning:

1. the in-app panel is the fastest path to real debugging value
2. it exercises the right contracts without forcing protocol or security complexity too early
3. external tooling can be added later on the same host-backed API

## Proposed Reference Model for Waves

If Waves borrows selectively from mature systems, the best blend is:

1. CDP for protocol shape and typed event surfaces
2. DAP for layered architecture and host-adapter thinking
3. Firefox RDP for attach/detach lifecycle clarity
4. Node inspector and WebKit for dev-only/local safety posture
5. Redux DevTools for timeline/export workflow ideas

This mix fits Waves better than copying any single ecosystem whole.

## Guidance for D0 Work Items

### D0-01 Contract and architecture baseline

Focus:

1. additive contract types only
2. explicit session lifecycle
3. capabilities and masking policy
4. no runtime event emission yet

### D0-02 Engine event stream and snapshot emitter

Focus:

1. fixed-size event ring buffer
2. deterministic event ordering and drop accounting
3. engine-side masking
4. no host/UI concerns in engine implementation

### D0-03 Host bridge integration

Focus:

1. Tauri commands for open/poll/snapshot/close
2. deterministic error handling
3. contract generation for frontend clients

### D0-04 Browser debug panel

Focus:

1. optional read-only panel
2. bounded polling while visible
3. export-to-JSON bug artifact workflow

## Decisions Recommended Before Implementation

These should be settled in D0-01 before code lands:

1. event timestamps: monotonic only vs monotonic plus optional wall-clock projection
2. default ring-buffer size in dev and CI contexts
3. whether MVP supports more than one concurrent session
4. exact masking heuristics for WML input names/types
5. exact `postfield.resolve` payload schema

## Bottom Line

The strongest proven pattern for Waves is:

1. engine-owned recorder
2. host-owned sessions
3. read-only polling contract
4. engine-side masking
5. first-party Waves panel first
6. external debugger/tool bridge later, reusing the same host-backed API

That gives Waves a practical runtime debugger without violating current layer boundaries or overcommitting to a remote-debug protocol too early.
