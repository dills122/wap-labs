# Transport E2E Readiness Scorecard

Status: active tracking metric  
Date: 2026-08-24

Owner: transport-rust + browser + gateway docs

## Purpose

Track how close Waves is to a reliable end-to-end test path against:

1. local Kannel gateway
2. local WML/WAP server behind Kannel
3. either:
   - `transport-rust` directly, or
   - browser host flow through `fetchDeck`
4. production Tauri frontend controls through the native host/engine and transport boundary

This scorecard is not a protocol-conformance replacement. It is a practical execution-readiness metric for local and CI-like E2E validation.

## Scoring model

Each gate is scored as:

- `1.0`: implemented and usable as a repeatable signal
- `0.5`: partially present, but not yet strong enough to rely on as a gate
- `0.0`: absent

Two roll-up scores are tracked:

1. `transport-to-kannel`: `transport-rust` -> local Kannel -> local WML server
2. `browser-to-kannel`: browser/host -> transport -> local Kannel -> local WML server

Applicable gates:

1. `transport-to-kannel`: `G1..G6` (`6.0` max)
2. `browser-to-kannel`: `G1..G9` (`9.0` max)

## Current score

### Transport-to-Kannel

Score: `6.0 / 6.0` (`100%`)

### Browser-to-Kannel

Score: `8.5 / 9.0` (`94%`)

## Gate table

| Gate | Description | Transport-to-Kannel | Browser-to-Kannel | Evidence |
| --- | --- | --- | --- | --- |
| `G1` | Local Kannel + WML stack boots reliably with one command | `1.0` | `1.0` | `make up`, `make status`, [docs/wap-test-environment/README.md](../../docs/wap-test-environment/README.md) |
| `G2` | Real transport request can fetch through local Kannel | `1.0` | `1.0` | [transport-rust/tests/kannel_smoke.rs](../../transport-rust/tests/kannel_smoke.rs), [browser/src-tauri/src/tests/fetch_commands.rs](../../browser/src-tauri/src/tests/fetch_commands.rs), `make smoke-transport-wap`; native-mode smoke now forces `wap-net-core` rather than relying on ambient bridge defaults |
| `G3` | Assertions validate deck identity and normalized engine input, not just HTTP success | `1.0` | `1.0` | transport smoke asserts deck/card markers for root + login decks; browser host smokes assert engine load, card identity, render markers, and navigation outcome |
| `G4` | At least one multi-step real gateway scenario exists (redirect/login/session/navigation) | `1.0` | `1.0` | native Kannel smoke now covers register -> login success flow at transport, host, and browser-engine levels |
| `G5` | One-command runnable smoke exists for local and CI-like use | `1.0` | `1.0` | `make smoke-transport-wap` now runs native-only transport, host, and browser-render smoke checks |
| `G6` | Failure diagnostics are preserved automatically (gateway/server/test logs) | `1.0` | `1.0` | [scripts/transport-wap-smoke.sh](../../scripts/transport-wap-smoke.sh) now writes status/log artifacts into a temp directory and prints the path on success/failure |
| `G7` | Browser path runs against real Kannel via host transport rather than mocks | `n/a` | `1.0` | ignored host-native smoke in [browser/src-tauri/src/tests/fetch_commands.rs](../../browser/src-tauri/src/tests/fetch_commands.rs) forces `wap-net-core` and disabled fallback |
| `G8` | Browser/render assertions validate visible WML outcome from real gateway-served deck | `n/a` | `1.0` | browser host smokes validate real Kannel-backed render output for the root deck and the navigated menu card via native fetch in [browser/src-tauri/tests/kannel_smoke.rs](../../browser/src-tauri/tests/kannel_smoke.rs) |
| `G9` | Production Tauri frontend is driven through native IPC/transport to visible Kannel results | `n/a` | `0.5` | the Linux suite now implements run/scenario isolation, dynamic driver and Compose ports, manifest-bound gateway routing with origin identity, exact safe-upload bundles, and four independent native authentication regressions. Local origin-only concurrency/action-oracle evidence passed; `G9` remains `0.5` until the authoritative Linux native runs, mutation sensitivity, both stability samples, and ruleset promotion complete |

## Interpretation

### What the score means now

1. `transport-rust` now has a credible native Kannel smoke gate for both baseline `GET` decks and constrained WML form `POST`.
2. browser-level real-gateway E2E is credible at the host/engine layer for root/menu navigation and register/login form submission.
3. a runnable native UI pilot now drives visible production frontend controls across Tauri IPC and
   the real native Kannel path for startup, home render, menu navigation, failure, and recovery.
4. protocol-core replay readiness (`T0-22`) still exceeds end-user browser realism, but live ingress evidence now matches the active profile posture for the constrained MVP lane.

### What this score does not mean

1. it does not prove `wap-net-core` is ready for full browser/UI parity or future `wap-net-ext` promotion
2. it does not prove full WSP/WTP/WDP conformance
3. it does not guarantee emulator/browser UX correctness
4. it proves constrained connectionless form `POST`, but it does not prove full connection-oriented WSP/WTP session support
5. it does not yet make full native UI automation a required or product-change pull-request gate

## Current evidence base

### Existing strengths

1. active profile is explicitly `wap-net-core`, with `gateway-bridged` retained as rollback posture, in [docs/waves/NETWORK_PROFILE_DECISION_RECORD.md](../../docs/waves/NETWORK_PROFILE_DECISION_RECORD.md)
2. local Kannel + WML stack is documented and runnable in [docs/wap-test-environment/README.md](../../docs/wap-test-environment/README.md)
3. transport-specific native smoke path exists:
   - [transport-rust/tests/kannel_smoke.rs](../../transport-rust/tests/kannel_smoke.rs)
   - `make smoke-transport-wap`
4. path-scoped pull-request/manual transport smoke and scheduled/manual native Tauri UI workflows
   exist in [docs/ci/CI_SETUP.md](../../docs/ci/CI_SETUP.md)
5. protocol-native replay harness exists in [transport-rust/tests/interop_replay.rs](../../transport-rust/tests/interop_replay.rs)

### Main gaps

1. the underlying live Kannel Rust tests remain ignored outside the provisioned smoke workflows
2. native frontend UI automation runs for relevant product paths plus scheduled/manual runs while
   Linux runner stability is measured; required-check promotion and authentication coverage remain
   deferred
3. non-ASCII charset-sensitive form submission is still not a proven smoke path

## Recommended next threshold targets

### Threshold A: credible transport E2E smoke (`>= 5.0 / 6.0`)

Required moves:

1. met

### Threshold B: credible browser E2E smoke (`>= 6.5 / 8.0`)

Current status: `met`

Required moves:

1. met

### Threshold C: promotable native frontend E2E (`G9 = 1.0`)

Current status: `implemented advisory suite; promotion evidence pending`

Promote the native workflow additively to an always-present required pull-request signal only when:

1. 20 consecutive no-rerun P0 executions succeed on one unchanged revision
2. independently, four consecutive scheduled runs succeed on `ubuntu-latest` without reruns over at
   least 21 elapsed days
3. each qualifying run publishes only a constructed allowlisted safe artifact directory; raw
   runtime evidence is never an upload target, and sanitizer failure publishes no credential-bearing
   screenshot, page source, trace, or log excerpt; an exact filename/digest manifest rejects partial
   or extra bundles; PINs, setup bodies, issued session IDs, Kannel admin/status credentials,
   WebDriver handles, and workflow console output are covered by the secret policy
4. concurrent-isolation evidence proves two E2E stacks can coexist with the developer stack and tear
   down independently, with run-scoped WebDriver ports and manifest-bound physical gateway routing
   while the logical WAP URL remains unchanged; a swapped endpoint fails through origin-instance
   mismatch detection
5. deterministic native registration and login race scenarios pass, while the recorded
   Select-serialization mutant makes the exact regression scenario fail
6. the required workflow has no top-level path filter: an always-present classifier conditionally
   runs native E2E and a final `if: always()` gate reports success for verified irrelevant changes or
   the native result for relevant changes; scheduled/manual events force native execution
7. the follow-up preserves scheduled/manual triggers, read-only permissions, explicit
   `allow-private` test-boundary opt-in, `wap-net-core`, and disabled fallback

The implementation and evidence design are specified in
[Waves Native End-to-End Harness Plan](WAVES_NATIVE_E2E_HARNESS_PLAN.md) and the retained
[decision research](WAVES_NATIVE_E2E_HARNESS_RESEARCH.md).

## Suggested follow-up ticket

Suggested ticket:

- `A5-08` native Tauri/Kannel E2E harness and PR-signal promotion

Suggested scope:

1. run the implemented Linux P0 suite and complete the same-task Select mutation-sensitivity proof
2. evaluate both the 20-run concentrated sample and four-run/21-day scheduled sample without
   weakening any transport or artifact-safety policy
3. revalidate the foundation's always-present classifier/native/final-gate truth table, then promote
   only its stable final context to required status
4. synchronize `docs/ci/REQUIRED_CHECKS.md`, `docs/ci/CI_SETUP.md`, and the repository ruleset in a
   dedicated owner-approved promotion step
5. raise `G9` to `1.0` only after the promoted workflow itself succeeds on a qualifying relevant PR

## Update policy

When transport/gateway/browser integration changes materially, update:

1. this scorecard
2. [docs/waves/NETWORK_PROFILE_DECISION_RECORD.md](../../docs/waves/NETWORK_PROFILE_DECISION_RECORD.md)
3. [docs/waves/networking-implementation-checklist.md](../../docs/waves/networking-implementation-checklist.md) if promotion gates or execution posture change
