# Networking Layer Definition (WAP 1.x)

Date: `2026-03-04`
Owner: `transport-rust / browser / engine-wasm integration`

This is the practical build definition for networking layer work in Waves.

## 1) What to build

Build in explicit layers with profile-gated behavior:

- `WDP`: address/port-capable datagram transport and adaptor profile.
- `WCMP`: selected error and diagnostic message structures.
- `WSP`: connectionless methods and headers for the strict profile; session,
  capability negotiation, and Push only when explicitly claimed.
- `WTP`: conditional transaction semantics for connection-oriented WSP.
- `WTLS`: security façade with explicit phase plan (phase A shim, phase B full implementation).

Transport profile scope for this document is the strict
WDP/WCMP/connectionless-WSP path plus explicit gates for optional modules.

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

1. Effective `WAP-200` sequence: strict WDP source and SCR authority.
2. `WAP-202`: strict WCMP source and SCR authority.
3. Effective `WAP-203` sequence: strict WSP source and SCR authority.
4. Effective `WAP-201` sequence: conditional WTP authority only when
   connection-oriented WSP is claimed.
5. `WAP-259`, `WAP-224`, `WAP-230`, and OMA corrections: successor
   delta/context evidence only.
6. `WAP-261/WAP-199`: WTLS placeholder and roadmap (security path).

## 5) Build order with acceptance gates

- The three exact transport ledgers must stay valid before parser or profile
  contract shifts.
- `WDP` transport abstractions and UDP implementation with validated port mapping.
- `WCMP` selected message structures and deterministic error rules.
- `WSP` connectionless GET/POST/REPLY codec and selected header baseline.
- Browser integration surface contract verification (`transport.ts`).
- Conditional WTP and connection-oriented WSP only after an extension-profile
  claim activates them.
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

- the eight selected WSP connectionless rows and source-derived
  GET/POST/REPLY encodings,
- the five selected WCMP message rows,
- `WDP` UDP receive/send roundtrip with `9200`/`9201`/`9202`/`9203` mapping,
- transport profile gating for `connectionless_only`, conditional
  `connection_mode`, `wtls_optional`, and `push_enabled`.
