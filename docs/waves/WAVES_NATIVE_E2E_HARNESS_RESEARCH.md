# Waves Native E2E Harness Decision Research

Status: accepted decision record; implementation-ready
Date: 2026-08-24
Decision owner: browser + WML origin + CI
Repository revision: `21e869cf84838883f1201f8a645777413ac437d5`

## Decision Question

What is the smallest reliable design that makes native Waves authentication regressions fail
before merge while keeping credentials out of CI artifacts, keeping test runs isolated, and
producing actionable boundary evidence?

This research is intentionally bounded to six disputed decisions in the native E2E plan:

1. deterministic reproduction of the final-character/submission race
2. fail-closed authentication evidence
3. Compose and native application state isolation
4. independent account setup
5. exactly-once and boundary-localization oracles
6. promotion into an enforceable GitHub required check

Cross-platform provider selection and packaged-application testing remain separate later spikes.

## Method and Source Hierarchy

The source order was:

1. current Waves implementation, tests, workflow, and resolved Compose configuration
2. normative web specifications
3. official Tauri, Docker, GitHub Actions, and Selenium documentation
4. inference only where the first three do not prescribe a project-specific design

Facts, repository observations, inferences, and unknowns are labeled explicitly below.

## Repository Experiments

Environment: macOS development checkout, Node/pnpm dependencies already installed; Compose was
resolved but services were not started.

### Spike A: production queue coverage

Command:

```sh
pnpm --dir browser/frontend exec vitest run \
  src/app/browser-controller.behavior.test.ts \
  -t "waits for a pending input draft before a Select button submits the form"
```

Result: pass; one selected test passed and 43 tests were skipped in 1.11 seconds.

Observation: the existing controller test already proves that a Select click cannot overtake a
deliberately unresolved input-draft IPC. The native E2E gap is therefore deterministic production
event injection and assembly coverage, not another controller-only assertion.

### Spike B: current runner guard tests

Command:

```sh
node --test scripts/tests/native-tauri-kannel-e2e-script.test.mjs
```

Result: pass; 3 of 3 tests passed.

Observation: current script tests protect configuration and dependency-provenance behavior, but do
not yet prove resource ownership, concurrent Compose isolation, safe artifact publication, or
scenario-level native state freshness.

### Spike C: Compose project-name isolation

Command:

```sh
docker compose -p waves_e2e_a config
```

Result: configuration resolved successfully.

Observation: the network became `waves_e2e_a_default`, but the resolved services retained fixed
container names `wml-server` and `wap-gateway` and fixed published TCP/UDP ports `3000`, `3001`,
`13000`, `13002`, `9200`, and `9201`. A unique Compose project name alone cannot permit safe
coexistence with the developer stack or another E2E run.

## Findings and Decisions

### D1: Reproduce adverse ordering in one WebDriver script task

Facts:

- The DOM `dispatchEvent()` algorithm dispatches the event and invokes its listeners before the
  call returns; synthetic events are explicitly part of the DOM model. See the
  [WHATWG DOM Standard](https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent).
- WebDriver's Execute Script command executes a supplied JavaScript function in the current
  browsing context. See the [W3C WebDriver specification](https://w3c.github.io/webdriver/#execute-script).
- Waves registers the production keyboard handler on `window`; the final character and Enter both
  enter the unified queue through that handler. The Select button enters the same queue through the
  production click handler.

Inference: one synchronous Execute Script call can dispatch the final character keydown and then,
without yielding, dispatch Enter or invoke the real Select button's `click()` method. No promise
continuation can settle between those two synchronous calls, so this deterministically creates the
adverse ordering that two separate WebDriver commands cannot guarantee.

Decision:

- implement a provider primitive named `typeFinalCharacterAndSubmitInOneTask`
- use it for the race-regression scenarios through the real production event handlers
- retain separate ordinary WebDriver keyboard and physical-click scenarios as user-realism smoke
- do not add a production delay or test hook

Mutation proof:

1. build a disposable mutant that changes `KeyboardIntentRouter.handleButtonKey` from queued
   execution to direct `applyEngineKey`, matching the pre-fix overtaking behavior
2. record the base revision, exact patch, patch SHA-256, binary SHA-256, and scenario ID
3. require the exact native race scenario to fail with missing/stale form state
4. discard the mutant checkout, rebuild the baseline, and require the same scenario to pass

This is a one-time harness-sensitivity gate and a repeatable release of the mutation recipe, not a
mutation performed in ordinary PR CI.

### D2: Publish only a constructed safe artifact directory

Facts:

- The current native workflow uploads the entire raw result directory under `if: always()`.
- GitHub's official upload action supports failing when its allowlisted path is missing through
  `if-no-files-found: error`. See
  [`actions/upload-artifact`](https://github.com/actions/upload-artifact#customization-if-no-files-are-found).
- A plaintext scan cannot detect a secret rendered into a screenshot.

Decision:

- write runtime output to a non-uploaded `raw/` directory
- construct a separate `safe-upload/` directory from an explicit filename allowlist only after
  sanitization succeeds
- point the always-running upload step only at `safe-upload/` and set
  `if-no-files-found: error`
- validate an exact mode-specific filename and digest manifest before upload—either the complete
  normal safe bundle or the single static scanner-failure bundle; reject missing, extra, symlinked,
  escaping, or digest-mismatched entries (`if-no-files-found` only protects the empty-path case)
- on scan failure, delete the raw credential-bearing evidence before upload and emit only a static
  scanner-failure manifest that contains no matched value, file excerpt, request body, or page source
- never copy symlinks or files that resolve outside the owned raw directory

Authentication secret and output policy:

- treat PINs, setup bodies, every issued session ID, Kannel admin/status credentials, and WebDriver
  session handles as secret/control-capability canaries
- capture no screenshot, page source, DOM snapshot, video, browser trace, or unstructured log from
  the first secret creation/keystroke until either no session was issued or the issued session is
  invalidated and the retained current state contains no bearer URL
- strip query strings and fragments from all retained addresses and checkpoints
- capture child output without forwarding it to GitHub Actions stdout/stderr; console output during
  the secret/session interval is static and schema-only
- apply credential/handle redaction and non-interpolation from process startup through teardown,
  including readiness timeouts and cleanup; WebDriver handles remain provider-memory-only
- on authentication failure, retain only a schema allowlist of structured assertions, counters,
  boundary checkpoints, environment metadata, and cleanup results
- permit a success screenshot only after logout/session invalidation and navigation to a canonical
  credential-free deck/address; the portal visibly renders its session ID and is never captured
- prove logout invalidation by keeping the SID only in live memory and checking that the existing
  portal handler rejects it before visual or unstructured evidence resumes

The safe-publisher and its malicious-fixture tests must land before any authentication scenario.

### D3: Isolate global services per run and app state per scenario

Facts:

- Docker documents project names as an environment-isolation mechanism, but explicit
  `container_name` values remain custom global names and inhibit scaling. Docker also supports
  ephemeral host ports by omitting the host-port value. See
  [Compose project names](https://docs.docker.com/compose/how-tos/project-name/),
  [Compose services](https://docs.docker.com/reference/compose-file/services/#container_name), and
  [port publishing](https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/).
- Tauri resolves application data below the platform data directory; on Linux the data, config,
  and cache bases honor the XDG locations. See Tauri's
  [path API](https://v2.tauri.app/reference/javascript/api/namespacepath/#appdatadir).

Repository observations:

- the native host currently calls Lowband's profile-only fetch functions, which construct
  `FetchTransportOptions` with `gateway_endpoint: None`; the cancellable API has no options variant
- Lowband then derives the physical UDP peer from the logical WAP resource URL, so placing a random
  gateway port in that URL also changes the logical Kannel request URI
- the current runner fixes the tauri-driver intermediary at `127.0.0.1:4444`; tauri-driver 2.0.6
  separately configures its intermediary and native-driver ports

Decision:

- use a unique Compose project per run
- remove `container_name` from the E2E-resolved stack
- bind every published TCP and UDP port to loopback and allocate/parameterize it per run
- discover assigned ports from resolved/runtime Compose state rather than assuming defaults
- wire a run-scoped physical gateway endpoint through the native host into Lowband
  `FetchTransportOptions`, including cancellable fetches, without changing the logical WAP URL or
  Kannel request URI
- allocate both the `tauri-driver` intermediary and native WebDriver ports per run
- bind project ID, discovered endpoint, and expected origin instance ID in a runner-owned manifest;
  the launcher validates the manifest and correlated responses must identify the expected origin
- treat cross-stack UDP reachability as detectable contamination, not authenticated endpoint
  ownership: a deliberate endpoint swap must fail on origin-instance mismatch
- create fresh `XDG_DATA_HOME`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, and WebDriver/application
  profile directories for every scenario
- keep gateway/origin services per run, while keeping app/WebDriver state per scenario
- teardown only resources selected by the owned project ID and cleanup manifest

Acceptance requires two E2E stacks running concurrently while an ordinary developer stack remains
healthy, each native host using its manifest-bound physical gateway and validating its expected
origin instance, a deliberate endpoint swap failing through origin-instance mismatch, and each E2E
stack tearing down independently.

### D4: Seed login through the controlled origin's existing public registration behavior

Observation: the controlled Go origin already exposes registration and login handlers and their
sanitized counters.

Decision:

- create a unique account by POSTing directly to the controlled origin's existing registration
  handler over loopback before the login scenario's metric baseline
- send no setup request through Waves, because the login scenario is intended to isolate login
- never log or retain the setup body
- assert setup success before launching the scenario and destroy the run-scoped origin with the run

This avoids a privileged seeding API and cross-scenario dependency. It does not replace the separate
full register-to-login UI journey.

### D5: Add a bounded, non-secret action correlation oracle

Observation: global metric deltas can show one increment, but they cannot distinguish a delayed
duplicate from unrelated traffic and cannot localize a failure across the full native path.

Decision:

- add an opt-in test-fixture action ID to the controlled origin URL, using a random non-secret token
  with a strict bounded alphabet and length
- enable correlation only under an explicit E2E fixture mode on the owned loopback origin; ordinary
  origin execution must not expose per-action state
- preserve that token in the rendered form action so the POST carries it through Waves, transport,
  Kannel, and the origin
- give every POST attempt a fresh token; validation responses advance a bounded attempt suffix in
  the next rendered form, so failure and correction each have independent exactly-once oracles
- expose only bounded per-action request phase/count data; never associate it with form fields
- cap retained IDs and expire them with the run so the fixture cannot become an unbounded metrics
  label or production telemetry surface
- record sanitized checkpoints for these observable boundary groups:
  1. UI event dispatched
  2. controller/IPC/engine action accepted, using existing sanitized production diagnostics
  3. correlated origin POST observed through the real transport/gateway path
  4. response deck rendered

Exactly once means the correlated POST count reaches `1`, the expected response renders, and the
count remains `1` through a bounded quiescence window that is longer than the observed request and
response timeout envelope. The implementation spike must measure that envelope and record the
chosen window; an arbitrary two-second sleep is not acceptable.

This localizes failures to observable boundary groups. It deliberately does not promise to
distinguish transport from Kannel internally unless a later need justifies an additional sanitized
gateway checkpoint.

### D6: Use an always-present required gate and two independent promotion samples

Facts:

- GitHub documents that a workflow skipped by path filtering can leave an associated required check
  pending and block merging. A conditionally skipped job, by contrast, reports success; an
  `always()` dependent job can report a final result. See
  [GitHub required-check troubleshooting](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks#handling-skipped-but-required-checks).

Decision:

- remove top-level path filtering from the required workflow
- run an always-present change-classification job
- run native E2E conditionally for relevant changes
- expose one final `native-waves-e2e-gate` job with `if: always()` that succeeds for verified
  irrelevant changes and otherwise mirrors the E2E outcome
- make only that final job a required check
- preserve scheduled and manual execution and force those event types to run native E2E
- land the same always-present result matrix in advisory mode with the harness foundation, before
  authentication scenario PRs and before promotion sampling; required status is a later settings step

Promotion requires both:

1. 20 consecutive, no-rerun executions against one unchanged revision for concentrated flake
   detection; and
2. four consecutive scheduled, no-rerun successes over at least 21 elapsed days for runner and
   ecosystem variation.

Engineering may be completed in a focused week, but required-check promotion cannot occur before
the 21-day evidence window closes.

Promotion is delivered in a distinct post-observation PR/settings step that synchronizes
`docs/ci/REQUIRED_CHECKS.md`, `docs/ci/CI_SETUP.md`, the workflow/check name, and the repository
ruleset. The live migration must be exercised on both a relevant and irrelevant PR.

Active `A5-08`, `docs/ci/CI_SETUP.md`, and `docs/ci/REQUIRED_CHECKS.md` are synchronized at plan
adoption so implementers cannot follow the superseded four-run, unsafe-artifact, or pilot-only path
description. Only the repository administrator acting as CI owner may change and read back the live
required-context ruleset.

## Remaining Unknowns and Stop Conditions

The following questions are intentionally deferred to implementation spikes:

- the smallest quiescence window supported by measured request/response timing
- whether existing sanitized timeline export is sufficient for the controller/IPC/engine checkpoint
  or needs a narrower evidence projection
- the exact Compose overlay shape that supports dynamic TCP and UDP discovery most cleanly

Stop and record a new decision if any spike requires production credential logging, a privileged
seeding endpoint, a test-only native command in ordinary builds, or engine/transport responsibility
leakage. Those outcomes violate the plan's guardrails rather than merely changing implementation
details.

## Consequences

- Authentication coverage moves later than the basic runner extraction because artifact safety,
  host/transport endpoint isolation, deterministic event injection, and correlation must land first.
- Failure evidence becomes safer but intentionally less visual during authentication failures.
- Boundary diagnosis is truthful at four observable groups instead of claiming per-layer precision
  that current telemetry cannot support.
- Required-check promotion takes at least 21 elapsed days even if implementation finishes earlier.
