# Transport Rust Phase Plan

Status: active implementation roadmap for `transport-rust/`

## Goal

Incrementally evolve the in-process Rust transport from gateway-backed HTTP bridging to native protocol handling without leaking runtime/render concerns into transport.

Transport boundary ends at normalized deck payload and optional XML event stream handoff.

## Current Baseline

- `transport-rust` is integrated in browser host (`browser/src-tauri`).
- The browser's default `auto` profile selects the in-process `wap-net-core`
  path for `wap://`/`waps://`; an explicit `gateway-bridged` profile remains
  available as a fallback/comparison path.
- Native GET/POST ingress is available under `wap-net-core`, but the live path
  is constrained connectionless WSP over WDP/UDP and does not yet call the
  fixture-tested `network::wsp`/`network::wtp` modules.
- `waps://` currently selects port 9202 but does not apply WTLS or any other
  protection. Pre-alpha development/interoperability profiles may keep this
  path available with an unavoidable no-WTLS warning and false protection
  state; release profiles must fail closed.
- WBXML decode currently uses external `wbxml2xml` executable invocation.
- Retry/timeout/error mapping and coverage gate are active in Rust CI.

Profile modes in use:

1. `gateway-bridged` (legacy): terminal path enters through configured gateway and remains available as rollback posture.
2. `wap-net-core` (current): in-process WDP/UDP -> connectionless WSP with
   deterministic profile gating; WTP is not activated by the strict profile.
3. `wap-net-ext` (future): additional bearers, connection-oriented WSP/WTP,
   Push, and advanced sessions after explicit migration approval.

Current profile decision point:

1. protocol migration stays behind explicit profile gates and feature flags.
2. transport contracts (`browser/contracts/transport.ts` and engine handoff paths) remain the compatibility boundary during all migration stages.

## Phase A (Complete): Isolated WBXML decode

Objective:

- Decode untrusted WBXML without exposing the host process to native decoder faults.

Scope:

- Invoke a trusted, absolute `wbxml2xml` executable as an isolated subprocess.
- Bound decoder execution time and decoded XML output.
- Preserve existing error taxonomy (`WBXML_DECODE_FAILED`, etc.).
- Keep all decode logic in `transport-rust` (no browser/runtime decode).

Non-goals:

- No WSP/WTP parser rewrite yet.
- No WTLS session implementation.
- No runtime/render changes.

Definition of done:

- `fetch_deck` behavior unchanged for callers.
- No untrusted WBXML reaches native decoder code in the host process.
- Transport tests cover success, failure, timeout, output-limit, and executable-path branches.

## Phase B: Streaming XML event boundary after decode

Status: optional + low priority while protocol-stack lanes are incomplete.

Objective:

- Support low-memory, deck-scoped processing from decoded XML stream.

Scope:

- Introduce streaming parser layer (preferred: `quick-xml`; `xml-rs` acceptable if constrained).
- Add bounded parsing/memory guardrails and deterministic failure mapping.
- Keep engine-facing contract stable unless explicitly versioned.

## Phase C: Native connectionless WSP/WDP path

Status: active protocol lane.

Objective:

- Add direct binary protocol path while retaining gateway-backed mode.

Scope:

- Close exact WAP-200 and WAP-203 selected rows for WDP and connectionless
  WSP framing/headers.
- Add the selected WAP-202 WCMP core.
- Introduce transport mode flags and clear fallback strategy.
- Keep browser API stable (`fetch_deck` contract first).
- Keep connection-oriented WSP/WTP as a separately gated extension.

## Phase D: WTLS and security profile expansion (deferred)

Status: deferred until transport protocol gates close.

Objective:

- Add exact historical encrypted-session support only after protocol parity gates close.
- Keep direct modern TLS, WAP-261 WTLS compatibility, plain WAP, and any future DTLS route as
  explicit profiles with no automatic downgrade.
- ASN.1/WTLS certificate handling is subject to a dedicated design and dependency review.
- Legacy cipher/profile handling remains behind an additive Cargo capability and an explicit
  runtime gateway allowlist.
- Follow
  `docs/architecture/wtls-modernization-research.md` and
  `docs/architecture/decisions/0002-separate-modern-security-from-wtls-compatibility.md`.

Immediate safety prerequisite, outside the deferred crypto implementation:

- report the current development/interoperability `waps://` route as unprotected and emit an
  unavoidable no-WTLS warning;
- block credentials and sensitive submissions on that route by default;
- prohibit the insecure testing exception in release profiles.

## Migration lane for this repo: protocol-aligned execution stack

1. `T0-08`: WTP retransmission and replay behavior
2. `T0-09`: WSP connectionless primitive enforcement
3. `T0-10`: WSP assigned-number fidelity
4. `T0-11`: WSP capability negotiation and bounds
5. `T0-12`: TCP capability profile declaration
6. `T0-13`: SMPP adaptation scope decision
7. `T0-14`: transport profile decision and promotion gates
8. `T0-16`: source queue/variant canonicalization lock
9. `T0-17`: transport-adjacent scope sweep
10. `T0-18`: WTP retransmission/NACK hold-off policy implementation
11. `T0-19`: WDP datagram trait + UDP mapping baseline
12. `T0-20`: WSP registry/unknown-token policy completion
13. `T0-21`: WTLS phase boundary and minimal reliability lane
14. `T0-22`: interop replay harness and golden event corpus

## Regrouped networking priority order (`2026-03-05`)

1. `T0-19` WDP datagram trait + UDP mapping baseline
2. `T0-18` WTP retransmission/duplicate/NACK hold-off behavior
3. `T0-20` WSP registry/token and unknown-codepage handling
4. `T0-22` interop replay harness and golden event corpus
5. `T0-21` WTLS phase boundary/minimal lane (default disabled)

## Notes

- `Phase D` does not run forward until profile gates close and explicit security-profile scope is settled in `T0-14` and `T0-21`.
- `WTLS-00` insecure-test labeling and release gating are not blocked on Phase D and should land
  with the native browser foundation.
- Completed `T0-*` implementation lanes are provisional evidence. Exact
  strict-profile closure is tracked by `TRN-701`, `TRN-703`, and
  `WSP-801`/`802`/`804`/`805`.

## Dependency Guidance

Recommended now:

- No native WBXML FFI dependency; package or install the isolated `wbxml2xml` decoder.

Recommended later by phase:

- Phase B: streaming XML parser crate.
- Phase C: binary parser/fsm crate(s), likely `nom`.
- Phase D: WTLS certificate/trust and legacy crypto providers, feature-gated and independently
  reviewed. Dependency selection follows the frozen WAP-261 client profile; do not choose a
  general crypto stack before that matrix exists.

## Guardrails

- Transport must not own rendering, runtime navigation, or WMLScript execution.
- Engine must not own network transport or WBXML decode.
- Contract updates (`browser/contracts/transport.ts`) must accompany behavior changes.

## Tracking

- Update related execution items in `docs/waves/WORK_ITEMS.md`.
- Keep CI gates in sync with transport scope (`fmt`, `test`, `coverage`).
- Track local Kannel/browser E2E execution readiness in `docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md`.
