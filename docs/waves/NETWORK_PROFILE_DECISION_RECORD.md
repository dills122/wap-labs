# Network Profile Decision Record

Status: active  
Owner: transport-rust + browser + engine  
Ticket: `T0-14`

## Canonical decision

1. Active runtime profile: `gateway-bridged`.
2. Target runtime profile: `wap-net-core`.
3. `wap-net-core` promotion is blocked until required migration gates are complete.

## Profile definitions

### `gateway-bridged` (active)

- Transport uses configured gateway HTTP/WBXML path.
- Native `WDP/WTP/WSP` protocol stack is not the active ingress path.
- Host/runtime contracts remain stable and deterministic under this mode.

Fixture lane:

- `transport-rust/tests/kannel_smoke.rs`
- `transport-rust/tests/fixture_harness.rs`
- `docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md`

### `wap-net-core` (target, gated)

- Transport ingress is native `WDP -> WTP -> WSP`.
- Profile activation requires protocol-core fixture evidence and replay-gate evidence.
- Activation must not alter browser/engine contracts without explicit contract update tickets.

Fixture lane:

- `transport-rust/src/wsp_registry.rs` (assigned-number policy fixtures)
- `transport-rust/src/wsp_capability.rs` (capability-bound fixtures)
- `transport-rust/tests/network/interop/` (promotion replay lane; tracked by `T0-22` and `T0-24`)

## Promotion gates

Promotion from `gateway-bridged` to `wap-net-core` requires all of:

1. `T0-17` scope lock is `done`.
2. `T0-18`, `T0-19`, `T0-20`, `T0-22`, and `T0-24` are `done` with fixture evidence.
3. `T0-21` security boundary posture is explicit and default-safe.
4. Contract stability checks stay green for:
   - `browser/contracts/transport.ts`
   - `engine-wasm/contracts/wml-engine.ts`
5. Local Kannel E2E readiness remains explicit and tracked in:
   - `docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md`

## Rollback criteria

If profile activation introduces deterministic regressions or contract drift, rollback to `gateway-bridged` is mandatory when any of the following occur:

1. Replay harness (`T0-22`/`T0-24`) fails for `CONNECT`/`GET`/`REPLY` or retransmit/duplicate lanes.
2. Contract checks fail for browser/engine boundary payloads.
3. Cross-layer fixture regressions appear in transport/runtime hostflow evidence.

Rollback action:

1. Revert active profile selection to `gateway-bridged`.
2. Preserve failing fixture artifacts in the associated `T0-*` ticket notes.
3. Re-open promotion only with new explicit remediation tickets.

## Operational tracking

Use [docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md](/Users/dsteele/repos/wap-labs/docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md) to track how close Waves is to:

1. `transport-rust` -> local Kannel -> local WML server E2E smoke
2. browser/host -> transport -> local Kannel -> local WML server E2E smoke
