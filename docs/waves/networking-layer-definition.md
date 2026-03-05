# Networking Layer Definition (WAP 1.x)

Date: `2026-03-04`
Owner: `transport-rust / browser / engine-wasm integration`

This is the practical build definition for networking layer work in Waves.

## 1) What to build

Build in explicit layers with profile-gated behavior:

- `WDP`: address/port-capable datagram transport and adaptor profile.
- `WTP`: transaction semantics (class 0/1/2), retransmission, duplicate handling, abort semantics.
- `WSP`: session and connectionless methods, headers, capability negotiation, push.
- `WTLS`: security façade with explicit phase plan (phase A shim, phase B full implementation).

## 2) What must not be built here

- WML parsing and rendering.
- Browser input handling and host-window semantics.
- Runtime rendering state ownership.

Those remain in `engine-wasm` and `browser` as per contract boundaries.

## 3) Contract alignment checklist

- Parser outputs are pure value types (`WspPdu`, `WtpPdu`, `WdpDatagram`, `WtlsRecord`).
- No global mutable parser state.
- Deterministic traces for state transitions and timers.
- Feature flags must preserve API compatibility.

## 4) Protocol definitions in priority order

1. `WAP-259` (WDP): transport profile/ports/quadruplets and segmentation model.
2. `WAP-224` + `OMA-WAP-224_002`: transaction classes, retransmission, duplicate, TID behavior, SAR overlays.
3. `WAP-230` + `OMA-WAP-TS-WSP`: session modes, method/push/reply semantics, capabilities, header tables.
4. `WAP-261/WAP-199`: WTLS placeholder and roadmap (security path).

## 5) Build order with acceptance gates

- `WDP` transport abstractions and UDP implementation with validated port mapping.
- `WTP` class-1/class-2 state machines with bounded timers and deterministic duplicates.
- `WSP` connection-mode and connectionless codec/state baseline plus capability store.
- Browser integration surface contract verification (`transport.ts`).
- Optional WTLS shim enablement.

## 6) Open questions closed by design

- WSP mode profile should be explicit and persisted in runtime profile config.
- WSP session is tied to peer quadruplet and aborted on disconnect/suspend.
- Push is allowed only when profile advertises facility.
- SAR/ESAR remain optional and disabled unless explicitly enabled.

## 7) Mapping to existing work-items

- `T0-08` WTP retransmission/TID/window.
- `T0-09` WSP connectionless matrix.
- `T0-10` assigned-number registry fixtures.
- `T0-11` capability bounds enforcement.
- `T0-14` profile decision gates.

## 8) Recommended next step

Create golden fixtures for:

- `WSP` PDU encode/decode for connect/disconnect/get/reply/push,
- `WTP` class-2 completion and abort traces,
- `WDP` UDP receive/send roundtrip with `9200`/`9201`/`9202`/`9203` mapping,
- transport profile gating for `connectionless_only`, `connection_mode`, `wtls_optional`, `push_enabled`.
