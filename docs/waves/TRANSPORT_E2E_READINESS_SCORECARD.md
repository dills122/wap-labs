# Transport E2E Readiness Scorecard

Status: active tracking metric  
Date: 2026-03-06  
Owner: transport-rust + browser + gateway docs

## Purpose

Track how close Waves is to a reliable end-to-end test path against:

1. local Kannel gateway
2. local WML/WAP server behind Kannel
3. either:
   - `transport-rust` directly, or
   - browser host flow through `fetchDeck`

This scorecard is not a protocol-conformance replacement. It is a practical execution-readiness metric for local and CI-like E2E validation.

## Scoring model

Each gate is scored as:

- `1.0`: implemented and usable as a repeatable signal
- `0.5`: partially present, but not yet strong enough to rely on as a gate
- `0.0`: absent

Two roll-up scores are tracked:

1. `transport-to-kannel`: `transport-rust` -> local Kannel -> local WML server
2. `browser-to-kannel`: browser/host -> transport -> local Kannel -> local WML server

Maximum score per lane: `8.0`

## Current score

### Transport-to-Kannel

Score: `5.5 / 8.0` (`69%`)

### Browser-to-Kannel

Score: `3.5 / 8.0` (`44%`)

## Gate table

| Gate | Description | Transport-to-Kannel | Browser-to-Kannel | Evidence |
| --- | --- | --- | --- | --- |
| `G1` | Local Kannel + WML stack boots reliably with one command | `1.0` | `1.0` | `make up`, `make status`, [docs/wap-test-environment/README.md](/Users/dsteele/repos/wap-labs/docs/wap-test-environment/README.md) |
| `G2` | Real transport request can fetch through local Kannel | `1.0` | `0.5` | [transport-rust/tests/kannel_smoke.rs](/Users/dsteele/repos/wap-labs/transport-rust/tests/kannel_smoke.rs), `make smoke-transport-wap` |
| `G3` | Assertions validate deck identity and normalized engine input, not just HTTP success | `0.5` | `0.0` | [transport-rust/tests/kannel_smoke.rs](/Users/dsteele/repos/wap-labs/transport-rust/tests/kannel_smoke.rs) currently checks `ok/status/content-type/base_url/<wml>` only |
| `G4` | At least one multi-step real gateway scenario exists (redirect/login/session/navigation) | `0.0` | `0.0` | local environment supports it, but no promoted deterministic test currently asserts it |
| `G5` | One-command runnable smoke exists for local and CI-like use | `1.0` | `0.5` | `make smoke-transport-wap`, manual workflow in [docs/ci/CI_SETUP.md](/Users/dsteele/repos/wap-labs/docs/ci/CI_SETUP.md) |
| `G6` | Failure diagnostics are preserved automatically (gateway/server/test logs) | `0.5` | `0.5` | GitHub workflow docs mention log dump on failure, but local test artifacts are not yet normalized |
| `G7` | Browser path runs against real Kannel via host transport rather than mocks | `0.0` | `0.5` | browser transport contract exists, but no canonical real-gateway browser E2E test is promoted |
| `G8` | Browser/render assertions validate visible WML outcome from real gateway-served deck | `0.0` | `0.5` | browser smoke coverage exists internally, but not yet against local Kannel as a standard gate |

## Interpretation

### What the score means now

1. `transport-rust` is close to having a credible local Kannel smoke gate.
2. browser-level real-gateway E2E is not close enough yet to treat as a dependable regression signal.
3. protocol-core replay readiness (`T0-22`) is ahead of real gateway/browser E2E readiness.

### What this score does not mean

1. it does not mean `wap-net-core` is ready to replace `gateway-bridged`
2. it does not prove full WSP/WTP/WDP conformance
3. it does not guarantee emulator/browser UX correctness

## Current evidence base

### Existing strengths

1. active profile is explicitly still `gateway-bridged` in [docs/waves/NETWORK_PROFILE_DECISION_RECORD.md](/Users/dsteele/repos/wap-labs/docs/waves/NETWORK_PROFILE_DECISION_RECORD.md)
2. local Kannel + WML stack is documented and runnable in [docs/wap-test-environment/README.md](/Users/dsteele/repos/wap-labs/docs/wap-test-environment/README.md)
3. transport-specific smoke path exists:
   - [transport-rust/tests/kannel_smoke.rs](/Users/dsteele/repos/wap-labs/transport-rust/tests/kannel_smoke.rs)
   - `make smoke-transport-wap`
4. on-demand CI smoke workflow exists in [docs/ci/CI_SETUP.md](/Users/dsteele/repos/wap-labs/docs/ci/CI_SETUP.md)
5. protocol-native replay harness exists in [transport-rust/tests/interop_replay.rs](/Users/dsteele/repos/wap-labs/transport-rust/tests/interop_replay.rs)

### Main gaps

1. the transport smoke test is still ignored/manual rather than a default deterministic gate
2. smoke assertions are too shallow for confidence in deck identity and end-to-end flow correctness
3. no promoted multi-step Kannel-backed scenario is currently asserted
4. no canonical browser -> host -> transport -> Kannel -> WML server E2E test is currently tracked as a required gate
5. failure artifacts are not yet normalized into one standard local test output/report path

## Recommended next threshold targets

### Threshold A: credible transport E2E smoke (`>= 7.0 / 8.0`)

Required moves:

1. strengthen [transport-rust/tests/kannel_smoke.rs](/Users/dsteele/repos/wap-labs/transport-rust/tests/kannel_smoke.rs) to assert expected deck/card markers
2. add one multi-step Kannel-backed scenario from the local WML app
3. normalize local failure logging so Kannel and WML server evidence is preserved automatically

### Threshold B: credible browser E2E smoke (`>= 6.5 / 8.0`)

Required moves:

1. add a browser/host E2E path that uses real `fetchDeck` against local Kannel
2. assert rendered card content and at least one navigation transition
3. keep the browser E2E lane independent from protocol-core replay fixtures

## Suggested follow-up ticket

Suggested ticket:

- `T0-26` Local Kannel E2E readiness gate

Suggested scope:

1. promote transport smoke from manual-only signal to tracked gate
2. add one deterministic multi-step Kannel-backed fixture path
3. add one browser-driven real-gateway smoke
4. update this scorecard as part of the acceptance criteria

## Update policy

When transport/gateway/browser integration changes materially, update:

1. this scorecard
2. [docs/waves/NETWORK_PROFILE_DECISION_RECORD.md](/Users/dsteele/repos/wap-labs/docs/waves/NETWORK_PROFILE_DECISION_RECORD.md)
3. [docs/waves/networking-implementation-checklist.md](/Users/dsteele/repos/wap-labs/docs/waves/networking-implementation-checklist.md) if promotion gates or execution posture change
