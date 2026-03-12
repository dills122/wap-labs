# Engine Debug Connector Plan

Status: planning-ready
Owner lane: `engine-wasm` + `browser`

## Purpose

Define an attachable debug connector for the running WML engine so a host-integrated debugger or external tool can observe runtime state and event flow without mutating core engine behavior.

This is a diagnostics surface, not a transport/runtime control plane.

## Goals

1. Provide a deterministic, structured event stream from engine runtime boundaries.
2. Support attach/detach and cursor-based event polling from host or external tooling.
3. Expose a stable debug snapshot surface for state inspection and replay triage.
4. Preserve strict layer boundaries:
- engine runtime emits events and snapshots
- host brokers access and IPC
- debugger UI/tool remains out-of-process from engine runtime logic

## Non-Goals (MVP)

1. Remote code execution/control over engine internals.
2. Live mutation commands that bypass normal host input/navigation APIs.
3. Production telemetry pipeline replacement.
4. Protocol/network introspection beyond existing host/transport logs.

## Boundary and Ownership

1. `engine-wasm/engine`:
- event emission points
- in-memory ring buffer
- snapshot generation
- redaction markers for sensitive fields

2. `engine-wasm/contracts/wml-engine.ts`:
- canonical debug contract types
- additive APIs only

3. `browser/src-tauri` and `browser/contracts/*`:
- command bridge for open/poll/close
- debugger consumer compatibility

4. `browser/frontend`:
- optional first-party debug panel consumer

## Proposed Debug Contract Surface (Additive)

`openDebugSession(options) -> { sessionId, cursor }`

`pollDebugEvents({ sessionId, cursor, maxEvents }) -> { events, nextCursor, droppedCount }`

`getDebugSnapshot({ sessionId }) -> EngineDebugSnapshot`

`closeDebugSession({ sessionId }) -> { closed: boolean }`

MVP posture is read-only.

## Event Model (MVP)

All events should include:

1. `seq` (monotonic per engine process)
2. `kind` (stable string enum)
3. `tsMs` (runtime monotonic timestamp)
4. `cardId` (optional)
5. `payload` (small typed object)

Initial event kinds:

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

## Snapshot Model (MVP)

`EngineDebugSnapshot` should include:

1. active card id
2. focused link index
3. focused input edit name/value (redacted policy applied)
4. runtime vars (redacted policy applied)
5. pending external navigation intent/request policy
6. timer state summary
7. trace cursor metadata (`oldestSeq`, `latestSeq`, `droppedCount`)

## Safety and Redaction

1. Debug connector disabled by default outside development profiles.
2. Sensitive fields (for example `pin`, password inputs) masked unless explicit local override is enabled.
3. Events must not expose raw transport credentials or secrets.
4. Session handles are process-local and non-persistent.

## Performance Constraints

1. Fixed-size ring buffer with drop-oldest semantics.
2. No blocking I/O in engine event emission path.
3. Event payloads must remain compact and deterministic.
4. Debug path must be additive and must not alter runtime ordering or navigation semantics.

## Rollout Phases

1. Phase D0-01: contract and architecture definition.
2. Phase D0-02: engine ring buffer + event/snapshot emission.
3. Phase D0-03: tauri host bridge + contract generation wiring.
4. Phase D0-04: first-party consumer panel and capture/export workflow.

## Acceptance Criteria (Program)

1. A running host can attach and poll events without runtime behavior change.
2. Event stream captures input/edit/submit boundaries needed for form-debug triage.
3. Snapshot + event cursor supports deterministic bug replay investigation.
4. Sensitive values are masked by default and policy-tested.

## Open Questions

1. Should event timestamps be monotonic only, or include wall-clock projection?
2. Should session model support multiple concurrent consumers in MVP?
3. What is the default ring-buffer size cap for dev mode vs CI mode?
4. Should `postfield.resolve` include resolution source (`var|draft|card|fallback`) for each field?
