# Waves Native End-to-End Harness Plan

Status: accepted; implementation-ready
Last updated: 2026-08-24
Owner: browser + transport-rust + gateway/WML origin + CI
Related tracking: [Transport E2E Readiness Scorecard](TRANSPORT_E2E_READINESS_SCORECARD.md)
Decision research: [Waves Native E2E Harness Decision Research](WAVES_NATIVE_E2E_HARNESS_RESEARCH.md)

## Purpose

Turn the existing Linux native Tauri/Kannel pilot into a reliable automated test harness for the
assembled Waves desktop application.

The primary near-term outcome is:

> Any regression where a user can see valid form values but the native Waves stack submits stale or
> missing values must fail an automated test before merge.

The harness must exercise the real application boundary rather than replace the native engine or
transport with test doubles. It complements the faster unit, contract, engine, and ordinary-browser
story suites; it does not replace them.

## Current Stack and Evidence

Versions detected from the repository at plan adoption:

- Tauri `2.11.5`
- Wry `0.55.1`
- `@tauri-apps/api` `2.11.1`
- Selenium `4.46.0`
- CI-pinned `tauri-driver` `2.0.6`

The current native pilot is implemented by:

- [`browser/frontend/scripts/native-tauri-kannel-e2e.mjs`](../../browser/frontend/scripts/native-tauri-kannel-e2e.mjs)
- [`scripts/native-tauri-kannel-e2e.sh`](../../scripts/native-tauri-kannel-e2e.sh)
- [`.github/workflows/native-tauri-kannel-e2e.yml`](../../.github/workflows/native-tauri-kannel-e2e.yml)

It crosses the following production boundaries:

```text
Selenium / WebDriver
        |
        v
native Waves WebView
        |
        v
production frontend/controller
        |
        v
generated Tauri invoke client
        |
        v
Rust host + native WaveNav engine
        |
        v
Lowband Rust transport
        |
        v
Kannel -> Go WML origin
        |
        v
response deck -> Canvas render + accessible text projection
```

Existing coverage includes native startup, gateway deck rendering, card and external navigation,
static examples, input/select rendering, a duplicate-request bound, invalid-URL failure, and
recovery. It does not submit the native login or registration forms.

## Research Basis

The implementation strategy is based on current primary documentation:

1. Tauri recommends WebdriverIO with `@wdio/tauri-service` for new cross-platform desktop testing,
   including an embedded WebDriver provider for Linux, Windows, and macOS. It also explicitly
   supports driving `tauri-driver` directly with Selenium for custom Windows/Linux harnesses.
   - <https://v2.tauri.app/develop/tests/webdriver/>
   - <https://webdriver.io/docs/desktop-testing/tauri/>
2. Tauri's embedded WebDriver and richer WDIO capabilities require test instrumentation. Official
   guidance says those plugins must not ship in production and documents conditional registration
   or explicit Cargo features.
   - <https://webdriver.io/docs/desktop-testing/tauri/plugin-setup/>
3. Selenium recommends short independent scenarios, a fresh WebDriver for each test, and explicit
   condition-based waits. It warns that long end-to-end scripts are slower, harder to diagnose, and
   more vulnerable to timing races.
   - <https://www.selenium.dev/documentation/test_practices/overview/>
   - <https://www.selenium.dev/documentation/test_practices/encouraged/fresh_browser_per_test/>
   - <https://www.selenium.dev/documentation/test_practices/encouraged/test_independency/>
   - <https://www.selenium.dev/documentation/webdriver/waits/>
4. Selenium does not recommend using WebDriver as a performance-measurement tool because process
   startup, services, environment, and driver instrumentation introduce uncontrolled variation.
   - <https://www.selenium.dev/documentation/test_practices/discouraged/performance_testing/>
5. Tauri treats an application binary build and platform bundling as distinct operations. The
   current Waves configuration has bundling disabled, and the pilot explicitly uses `--no-bundle`.
   - <https://v2.tauri.app/distribute/>
6. The DOM dispatch algorithm and WebDriver Execute Script command support a deterministic
   same-task event burst through production handlers. This lets the harness enqueue the final
   character and submission before promise continuations can settle.
   - <https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent>
   - <https://w3c.github.io/webdriver/#execute-script>
7. Docker Compose project names isolate generated resources, but explicit container names and fixed
   published ports remain global collision points. Tauri's Linux data/config/cache bases honor XDG
   locations, enabling scenario-specific native state.
   - <https://docs.docker.com/compose/how-tos/project-name/>
   - <https://docs.docker.com/reference/compose-file/services/#container_name>
   - <https://v2.tauri.app/reference/javascript/api/namespacepath/#appdatadir>
8. GitHub warns that path-filtered workflows can leave required checks pending. The required signal
   must therefore come from an always-present final gate job.
   - <https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks#handling-skipped-but-required-checks>

### Research decision

Do not block urgent authentication coverage on a WebDriver framework migration.

1. Harden the working Selenium/`tauri-driver` Linux lane first.
2. Express scenarios through a narrow Waves-facing driver API so the scenario intent is portable.
3. Evaluate Tauri's embedded WebdriverIO provider in a separate cross-platform spike after the
   Linux critical suite is stable and required.
4. Adopt the embedded provider only if platform reach and diagnostics justify the additional
   test-only dependencies and application instrumentation.
5. Land isolation, deterministic race injection, fail-closed artifact publication, and correlated
   origin oracles before authentication scenarios.

There is a minor official-documentation ambiguity to resolve in the spike: the Tauri overview calls
the richer WDIO plugin optional depending on requirements, while the WebdriverIO plugin setup page
describes it as required for service features. The spike must determine and document the minimum
plugin set rather than enabling both by assumption.

## Test Architecture

### Three testing rings

| Ring                     | Real boundaries                                                                         | Intended frequency       |
| ------------------------ | --------------------------------------------------------------------------------------- | ------------------------ |
| Ordinary-browser stories | Production Waves shell/controller plus real WASM engine and deterministic host fixtures | Every relevant PR        |
| Native runtime E2E       | Actual Tauri binary, native engine, Lowband transport, Kannel, and WML origin           | Relevant PRs and nightly |
| Packaged artifact smoke  | Platform application bundle/installer, first launch, and essential navigation           | Scheduled and release    |

Native E2E remains a deliberately small critical suite. Broad permutations stay in faster engine,
controller, adapter, contract, and story tests.

### Native scenario boundary

```text
Native scenarios
      |
      v
WavesDriver interface
  - launch
  - openUrl
  - pressSoftkey
  - pressKeyboardKey
  - typeText
  - typeFinalCharacterAndSubmitInOneTask
  - waitForDeck
  - readStatus
  - captureEvidence
      |
      +-- Selenium + tauri-driver provider    (first implementation)
      |
      `-- WebdriverIO embedded provider       (later research spike)
```

Driver/page objects own selectors and interaction mechanics. Scenarios own assertions. The public
test API uses product language such as `openWapUrl`, `pressSelect`, and `waitForDeckText`; it does not
expose engine command IDs to scenario authors.

### Oracle hierarchy

Use the narrowest externally observable oracle that proves the behavior:

1. User-visible deck text through the production accessible-text projection.
2. User-visible status tone/message and sanitized current origin/path; query strings and fragments
   never enter assertions or retained evidence.
3. Sanitized, bounded action-correlation counts at the controlled WML origin.
4. Sanitized production checkpoints for UI, controller/IPC/engine, correlated origin receipt, and
   response rendering.
5. Screenshots as supporting evidence, never as the only functional assertion.

Do not install the ordinary-browser story observation bridge into the production app. Do not record
authentication request bodies. The harness promises localization to observable boundary groups; it
does not claim per-layer transport/gateway precision without supporting telemetry.

## Scope

### In scope

- compiled Waves desktop application
- production frontend entry and controller/presenter behavior
- generated Tauri invoke bridge
- native Rust engine behavior
- real Lowband transport
- real Kannel and Go WML-origin composition
- WML form editing, commit, POST, response, and render
- keyboard and physical softkey input paths
- navigation, history, failures, and recovery
- deterministic evidence and CI routing
- Linux first, followed by a macOS/Windows feasibility spike
- packaged artifact smoke after product bundling is activated

### Out of scope for the first build-out

- external public WAP sites
- pixel-perfect screenshot regression
- load or performance assertions through WebDriver
- every WML/WSP conformance permutation
- behavioral retries that turn a failure into a pass
- parallel native execution before state isolation is proven
- production exposure of WebDriver, global test APIs, or test-only Tauri permissions

## Non-Negotiable Guardrails

1. Native E2E must use the production transport adapter and real Kannel path.
2. Test fixtures that model origin behavior live in the WML-origin layer, not in the engine or
   frontend.
3. Browser code does not parse WML/WBXML or reproduce engine navigation semantics.
4. Stable engine/runtime behavior continues to receive native/WASM parity tests and executable
   stories where deterministic; native E2E only proves assembly and user-critical journeys.
5. Secrets—including PINs, setup bodies, issued session IDs, Kannel admin/status credentials, and
   WebDriver session handles—never enter retained artifacts or GitHub Actions stdout/stderr.
6. A test-only Tauri plugin, capability, or WebDriver listener must be impossible to include in an
   ordinary production build.
7. Cleanup may only stop processes and containers created by the current test run.
8. Fixed sleeps are not valid behavioral synchronization.
9. A product assertion is never retried automatically.
10. Raw runtime evidence is never an upload target; CI uploads only a separately constructed,
    allowlisted safe directory.
11. Authentication screenshots, page source, DOM snapshots, video, unstructured logs, and traces
    are forbidden from the first secret creation/keystroke until either no session was issued or the
    issued session is invalidated, and the current retained state is proven free of bearer URLs.

## Phase 0: Adoption and Baseline

### NE2E-00 Adopt the plan and capture the pilot baseline

- `Depends On`: none
- `Likely Files`:
  - this plan
  - `docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md`
  - `docs/waves/WORK_ITEMS.md`
  - `docs/ci/CI_SETUP.md`
  - `docs/ci/REQUIRED_CHECKS.md`
  - ignored native E2E evidence directories

Build:

- record the current native-pilot runtime and outcome over repeated unchanged-revision CI runs
- preserve a representative success and deliberate-failure artifact bundle
- classify current failure modes as product, harness, or environment
- confirm the existing production boundary description against the host and transport contracts
- synchronize active CI guidance and `A5-08` with this plan immediately; describe the current broad
  product path filter truthfully while retaining the pilot's advisory/not-required status
- name the repository administrator acting as CI owner as the only role authorized to change the
  live ruleset, and require that role to read back the resulting required-context list

Accept:

- current runtime, flake observations, and scope gaps are recorded
- the readiness scorecard points to this plan for the move from pilot to required gate
- `A5-08`, `CI_SETUP.md`, and `REQUIRED_CHECKS.md` no longer prescribe the superseded four-run,
  unsafe artifact, or pilot-only path scope
- baseline collection does not change production behavior

Verify:

- workflow-dispatch evidence can be reproduced from a pinned revision
- an intentionally failed run retains enough data to identify the last completed boundary

## Phase 1: Safe, Modular Harness Foundation

### NE2E-01 Isolate the native environment

- `Depends On`: `NE2E-00`
- `Estimated Size`: medium
- `Likely Files`:
  - `scripts/native-tauri-kannel-e2e.sh`
  - `docker-compose.yml` or a dedicated native-E2E Compose overlay
  - `transport-rust/src/lib.rs`
  - `browser/src-tauri/src/fetch_host.rs`
  - `browser/src-tauri/src/waves_config.rs`
  - transport and host routing tests
  - `scripts/tests/native-tauri-kannel-e2e-script.test.mjs`

Build:

- allocate a unique Compose project identity for each run
- remove fixed `container_name` values from the E2E-resolved Compose stack
- bind every published TCP and UDP port to loopback and allocate or parameterize it per run
- discover assigned host ports from Compose runtime state instead of assuming defaults
- add a contract-first run-scoped physical gateway endpoint from the native host to Lowband
  `FetchTransportOptions`, including the cancellable fetch path, while preserving the user-visible
  logical `wap://localhost/...` resource URL and Kannel request URI
- write a runner-owned manifest that binds the Compose project ID, discovered loopback gateway
  endpoint, and expected origin instance ID; the host launcher accepts routing only from that
  validated manifest and not from a free-form scenario value
- do not claim UDP endpoint authentication: add a run-scoped origin instance marker and fail on any
  correlated response from the wrong stack, making cross-contamination detectable
- fail closed on malformed, missing, non-loopback, or manifest-mismatched gateway configuration;
  do not expose the physical endpoint as a frontend engine/transport command
- allocate both the `tauri-driver` intermediary port and native WebDriver port per run
- isolate `XDG_DATA_HOME`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, and WebDriver/application profile
  state under a scenario-specific directory
- keep all created process/container identifiers in the cleanup manifest
- scope log collection and teardown to the current E2E project

Accept:

- cleanup cannot stop an ordinary developer Compose stack
- stale application or WebDriver state cannot affect a subsequent scenario
- two E2E stacks and the ordinary developer stack can coexist without container, network, TCP, or
  UDP collisions
- each native host is configured for its manifest-bound Kannel endpoint, proves the expected origin
  instance on correlated responses, and continues to display the canonical logical WAP URL
- interrupts clean up WebDriver, the app process, and owned containers
- cleanup reports a failure if an owned process or container remains

Verify:

- keep the ordinary stack running while two concurrent E2E environments start independently
- stop one E2E environment and prove the other E2E and developer environments remain healthy
- deliberately swap the two manifest-bound endpoints and prove the origin-instance mismatch fails
  the run; do not claim the host can make another loopback UDP socket unreachable
- prove the logical request URI never acquires the physical UDP port
- run two scenarios sequentially and prove app/profile state does not cross the boundary
- cover invalid configuration and cleanup target selection with Node tests
- run `pnpm --dir browser run contracts:check` if the exported Rust transport surface changes

### NE2E-02 Split runner responsibilities

- `Depends On`: `NE2E-01`
- `Estimated Size`: medium
- `Likely Files`:
  - `browser/frontend/scripts/native-tauri-kannel-e2e.mjs`
  - new modules under `browser/frontend/e2e/native/`
  - `browser/frontend/package.json`

Target shape:

```text
browser/frontend/e2e/native/
  config.mjs
  environment.mjs
  waits.mjs
  evidence.mjs
  waves-driver.mjs
  selenium-provider.mjs
  scenarios/
```

Build:

- retain the existing script as a compatibility entrypoint during extraction
- add `--list`, `--suite <name>`, and `--scenario <id>` selection
- start a fresh application/WebDriver session per scenario
- report scenario identity, duration, last observation, and cleanup result independently
- preserve the current smoke assertions as separate scenarios

Accept:

- one scenario failure does not prevent unrelated scenarios from producing results
- unknown selectors fail as configuration errors
- process cleanup occurs after pass, failure, timeout, and interruption
- existing native pilot behavior remains covered

Verify:

- unit tests cover selection, configuration validation, safe artifact paths, and cleanup
- the extracted smoke suite passes through the existing Make target

### NE2E-03 Establish the Waves interaction API

- `Depends On`: `NE2E-02`
- `Estimated Size`: small
- `Likely Files`:
  - `browser/frontend/e2e/native/waves-driver.mjs`
  - `browser/frontend/e2e/native/selenium-provider.mjs`
  - driver unit tests

Initial operations:

- `launchWaves`
- `dismissWelcome`
- `openWapUrl`
- `focusViewport`
- `pressSoftkey`
- `pressKeyboardKey`
- `typeText`
- `typeFinalCharacterAndSubmitInOneTask`
- `waitForDeckText`
- `waitForStatus`
- `readSanitizedAddress`

Accept:

- scenario files contain no raw CSS selectors
- selector changes are localized to the provider/page layer
- assertions stay in scenario files
- operations model user intent rather than engine implementation details
- provider methods and assertion errors expose only address origin/path; full query/fragment values
  remain inside non-retained live interaction code
- the race primitive uses one WebDriver Execute Script call to synchronously dispatch the final
  character keydown and then Enter or the real Select button click through production handlers
- ordinary keyboard and physical-click smoke operations remain separate from the deterministic
  synthetic event-burst primitive

Verify:

- a provider test proves both events are invoked synchronously and in order from one script call
- a native sensitivity check uses a disposable mutant where Select bypasses
  `KeyboardIntentRouter.handleButtonKey` serialization: the exact race scenario must fail on the
  mutant, then pass on a clean baseline rebuild
- mutation evidence records base revision, exact patch, patch and binary SHA-256 values, expected
  failure, and restored-baseline success; no production test hook is introduced

### NE2E-04 Replace behavioral sleeps with observable waits

- `Depends On`: `NE2E-02`
- `Estimated Size`: small
- `Likely Files`:
  - `browser/frontend/e2e/native/waits.mjs`
  - native scenarios

Build:

- remove the fixed two-second request-count observation delay
- wait for boot phase, deck text, sanitized address origin/path, status, or metric changes
- for exactly-once actions, wait until the correlated count reaches one and stays one through a
  configured retry-horizon quiescence window
- define separate startup, navigation, interaction, and shutdown timeout classes
- retain short polling only inside explicit condition waits and bounded process cleanup

Accept:

- no fixed behavioral sleep remains
- implicit and explicit WebDriver waits are not mixed
- timeout errors identify the expected and last observed states
- the quiescence window covers the production transport's complete timeout/retry horizon plus a
  bounded scheduling margin; a test locks the E2E constants to the production configuration

### Foundation checkpoint

- existing smoke scenarios pass 20 consecutive no-rerun executions on one unchanged revision
- a failing scenario does not suppress evidence from completed scenarios
- the local developer stack survives E2E failure and cleanup
- two E2E stacks coexist and tear down independently while the developer stack remains healthy
- swapped gateway manifests fail through origin-instance mismatch detection
- the suite contains no fixed behavioral sleep

## Phase 2: Authentication Critical Path

### NE2E-05 Add fail-closed evidence, secure test data, and correlated origin oracles

- `Depends On`: `NE2E-03`, `NE2E-04`
- `Estimated Size`: medium
- `Likely Files`:
  - `browser/frontend/e2e/native/evidence.mjs`
  - `browser/frontend/e2e/native/test-data.mjs`
  - `browser/frontend/e2e/native/origin-metrics.mjs`
  - `wml-server/internal/origin/app.go`
  - `.github/workflows/native-tauri-kannel-e2e.yml`
  - evidence unit tests

Build:

- generate a unique username for every scenario and run
- keep PIN values in process memory only
- treat every issued session ID as a secret canary from creation through invalidation
- treat Kannel admin/status credentials as whole-run secrets from process startup through teardown;
  parse and redact status URLs before any timeout or cleanup message
- treat WebDriver session handles as ephemeral control capabilities: keep them in provider memory,
  never retain or echo them, and destroy them during owned-session cleanup
- write all runtime output to a non-uploaded owned `raw/` directory
- after sanitization succeeds, copy only explicit safe filenames into a separate `safe-upload/`
  directory; reject symlinks and paths that resolve outside `raw/`
- configure the always-running CI upload step to target only the exact
  `run.*/waves-e2e-*/*/safe-upload/*` layout with `if-no-files-found: error`
- before upload, validate one exact mode-specific manifest: the complete normal safe bundle, the
  single static sanitizer-failure bundle, or the single static pre-scenario infrastructure-failure
  bundle; reject missing, extra, symlinked, path-escaping, or digest-mismatched entries
- validate the normal manifest, its entries, and `result.json` against exact bounded schemas and
  fixed assertion/checkpoint/failure-class allowlists; require canonical JSON bytes and never trust
  self-described manifest fields
- on a scan failure, delete raw evidence and emit only a static failure manifest that never includes
  the matched value, an excerpt, a request body, or page source
- prohibit screenshots, page source, DOM snapshots, video, traces, and unstructured runtime logs
  between the first secret creation/keystroke and confirmation that no session was issued or that
  the issued session was invalidated
- capture child-process output without forwarding it to workflow stdout/stderr; console messages in
  the secret interval are static/schema-only and cannot interpolate request, assertion, address, or
  child-process values
- apply redacted/non-interpolating console rules for infrastructure credentials and WebDriver handles
  for the entire run, including startup, readiness timeout, interruption, and teardown
- strip query strings and fragments from every retained address and checkpoint
- create a bounded non-secret action ID for each form action and preserve it from the controlled
  origin's GET form URL into the POST action
- enable action-correlation behavior only for the owned E2E origin through an explicit test-fixture
  mode; the ordinary origin rejects or ignores the parameter without exposing per-action state
- expose bounded per-action phase/count data with strict token validation, retention caps, and
  run-scoped expiry; never associate the action ID with form fields
- assign a fresh action ID to every POST attempt; in fixture mode a validation response advances a
  strictly validated bounded attempt suffix in the next rendered form action, so a failed attempt
  and its corrected retry each have an independent exactly-once count
- capture global metric snapshots only as secondary context
- explicitly omit form bodies and credentials from evidence

Accept:

- accounts never collide between scenarios
- registration/login outcomes are proven by visible response decks and metric deltas
- exactly-once outcomes are proven by a correlated POST count of one that remains stable through the
  configured retry-horizon quiescence window
- the PIN does not appear in JSON, HTML, driver output, Tauri output, Compose logs, or environment
  reports
- no issued session ID or address query/fragment appears in retained files or workflow console output
- no Kannel credential or WebDriver session handle appears in retained files or workflow console
  output across the complete process lifecycle
- a deliberately written canary makes the artifact scanner fail
- a scan failure cannot cause any raw artifact to be uploaded
- an authentication failure produces no retained visual or DOM artifact from the credential-entry
  interval
- authentication failure evidence is limited to a schema-only allowlist of assertions, counters,
  a maximum of 16 fixed-enum boundary checkpoints, a fixed failure class, environment metadata,
  and cleanup outcome; “sanitized logs” are not an allowed evidence class
- authentication scenarios emit the ordered checkpoints `engine-ready`, `deck-ready`,
  `form-ready`, `ui-dispatched`, `response-rendered`, `origin-confirmed`, and (for login)
  `session-invalidated`; the runner maps the last completed checkpoint to a fixed class for the next
  boundary that failed

Verify:

- malicious fixtures cover PIN/session plaintext, URL/JSON/HTML encodings, filenames, symlinks,
  traversal attempts, assertion/error interpolation, child-process output, workflow-console output,
  and a screenshot-policy violation
- workflow tests prove the upload action has no path to `raw/`, including on cancellation and
  sanitizer failure
- safe-bundle tests prove partial, extra, symlinked, and digest-mismatched bundles fail before upload;
  `if-no-files-found: error` is only a secondary empty-path guard
- origin tests prove invalid/oversized IDs are rejected, cardinality is bounded, and two concurrent
  actions have independent counts
- origin tests prove validation responses advance to a fresh attempt ID and every attempt is counted
  independently

### NE2E-06 Register with deterministic and ordinary keyboard submission

- `Scenario IDs`: `AUTH-NATIVE-001A` deterministic race, `AUTH-NATIVE-001B` ordinary keyboard
- `Priority`: P0
- `Depends On`: `NE2E-05`
- `Estimated Size`: small

Preconditions:

- fresh native app/WebDriver session
- unique username
- healthy gateway and WML origin

Actions:

1. Open `wap://localhost/register`.
2. Enter the username.
3. Move focus to PIN.
4. Enter all but the final PIN digit.
5. For `001A`, in one WebDriver Execute Script call, synchronously dispatch the final digit keydown
   followed by keyboard Enter through the production `window` handler.
6. In a fresh independent scenario/account for `001B`, enter the complete PIN, wait for the visible
   masked state, focus the viewport, and submit with ordinary WebDriver `sendKeys(ENTER)`.

Accept:

- PIN is rendered as masked text
- `Registration OK` renders with the expected username
- `register_success_total` increases by exactly one as a secondary aggregate check
- the scenario's correlated POST count reaches one and remains one through the configured
  retry-horizon quiescence
  window
- no missing-fields error appears
- the secret canary scan passes
- `001A` proves adverse queue ordering; `001B` proves the normal WebDriver keyboard routing path

This is the direct native regression for the original stale/missing-form-value failure.

### NE2E-07 Login with deterministic and physical Select submission

- `Scenario IDs`: `AUTH-NATIVE-002A` deterministic race, `AUTH-NATIVE-002B` physical interaction
- `Priority`: P0
- `Depends On`: `NE2E-05`
- `Estimated Size`: small

Preconditions:

- POST the unique account directly to the controlled origin's existing registration handler over
  loopback, without logging the body, before taking the login baseline
- launch a fresh native app/WebDriver session

Actions:

1. Open `wap://localhost/login`.
2. Enter the username and PIN.
3. For `002A`, in one WebDriver Execute Script call, synchronously dispatch the final digit keydown
   and invoke the real Select button's production click handler.
4. In a fresh independent scenario/account for `002B`, enter the complete PIN, wait for the visible
   masked state, and activate Select with the provider's ordinary WebDriver click operation.

Accept:

- `Login OK` renders with the expected username
- `login_success_total` increases by exactly one as a secondary aggregate check
- `login_failure_total` does not change
- the scenario's correlated login POST count reaches one and remains one through the measured
  quiescence window
- the protected portal action is usable
- the secret canary scan passes
- `002A` proves adverse queue ordering; `002B` proves the normal physical-button automation path

Keep the issued session ID only in live provider memory. Before retaining any success visual
evidence, navigate through Logout, then prove the old session is rejected with a non-echoing live
request to the controlled origin's existing portal handler (or a bounded internal per-session
oracle). Only after that invalidation proof may the scenario navigate to a credential-free canonical
deck whose current address has no query or fragment. The portal/session interval is asserted only
through non-retained live observations and schema-only counters/checkpoints; the portal deck itself
visibly contains the session ID and must never be captured or echoed.

### NE2E-08 Add the full register-to-login journey

- `Scenario ID`: `AUTH-NATIVE-003`
- `Priority`: P1 initially
- `Depends On`: `NE2E-06`, `NE2E-07`
- `Estimated Size`: small

Build:

- register through the UI
- follow the response-deck login action
- verify intended username prefill/context behavior
- enter the PIN, authenticate, and open the protected portal
- verify the portal live without retaining its bearer-bearing deck, then log out, return to a
  canonical credential-free deck, and only then permit visual/unstructured success evidence

Accept:

- the complete journey succeeds through the native UI
- registration and login metrics each increase once
- the portal identifies the authenticated user
- the old session is rejected after Logout before retained visual/unstructured evidence resumes
- the scenario remains independent of all other scenarios

This longer journey supplements rather than replaces the short independent P0 authentication tests.

### NE2E-09 Add authentication validation and recovery

- `Priority`: P1
- `Depends On`: `NE2E-06`, `NE2E-07`
- `Estimated Size`: medium

Scenarios:

- username present with missing PIN
- PIN present with missing username
- invalid PIN format
- incorrect login PIN
- duplicate username
- failed login followed by successful retry
- registration validation failure followed by successful correction
- username preservation and PIN handling after validation failures

Accept:

- each scenario asserts the exact visible error class/message
- every POST attempt receives a fresh correlated action ID and reaches exactly one receipt;
  corrected retries never reuse the failed attempt's ID
- recovery succeeds without restarting the shared gateway/origin environment
- sensitive input behavior matches the documented engine/browser security contract

### Authentication checkpoint

- keyboard Enter and physical Select both submit complete form state through the real native stack
- the recorded Select-serialization mutant makes the exact native race scenario fail, and the clean
  baseline rebuild makes it pass
- all authentication artifacts pass the secret scan
- sanitizer failure proves raw evidence cannot reach artifact upload
- P0 authentication scenarios are short and independent

## Phase 3: Broader Native Critical Flows

### Required P0 suite

| ID                 | Scenario                                              | Primary boundary                               |
| ------------------ | ----------------------------------------------------- | ---------------------------------------------- |
| `BOOT-NATIVE-001`  | Cold launch reaches network-ready state               | package/runtime -> frontend -> native engine   |
| `TRN-NATIVE-001`   | Gateway home deck renders                             | transport -> Kannel -> WML origin              |
| `AUTH-NATIVE-001A` | Registration with same-task final character + Enter   | UI -> controller/IPC/engine -> correlated POST |
| `AUTH-NATIVE-001B` | Registration with ordinary WebDriver Enter            | physical keyboard routing -> correlated POST   |
| `AUTH-NATIVE-002A` | Login with same-task final character + Select handler | UI -> controller/IPC/engine -> correlated POST |
| `AUTH-NATIVE-002B` | Login with ordinary WebDriver Select click            | physical interaction -> session                |
| `NAV-NATIVE-001`   | Card/link/back/reload flow                            | UI -> engine history                           |
| `ERR-NATIVE-001`   | Invalid URL shows an error and recovers               | adapter error propagation                      |
| `REQ-NATIVE-001`   | One navigation action produces one origin request     | duplicate-request prevention                   |

### Nightly P1 suite

- full register-to-login portal journey
- wrong PIN and successful retry
- duplicate registration
- input/select preference behavior
- fragment and external navigation
- keyboard/softkey parity
- transport failure with fallback disabled
- malformed or unsupported WML response
- navigation cancellation
- gateway unavailable and subsequent recovery
- application restart with isolated state
- repeated immediate-submit stress sequence

### NE2E-10 Add deterministic failure fixtures

- `Depends On`: authentication checkpoint
- `Estimated Size`: medium
- `Likely Files`:
  - bounded fixtures/routes under `wml-server/internal/origin/`
  - WML-origin tests
  - native failure scenarios

Build:

- add only the minimum fixtures required for slow/cancellable, malformed, and unsupported responses
- expose fixtures through the existing allow-listed WML lab routing model
- keep fallback disabled so the native transport result is unambiguous

Accept:

- fault behavior originates at the controlled origin/gateway boundary
- no fetch behavior or fault simulation enters the engine
- each failure produces a visible error and a proven recovery action
- fixtures are bounded, deterministic, and unit-tested

## Phase 4: Evidence, Flake, and Maintenance Discipline

### NE2E-11 Standardize evidence bundles

- `Depends On`: foundation checkpoint
- `Estimated Size`: small

Every scenario writes a structured manifest containing:

- schema version
- scenario and suite IDs
- result and duration
- operating system and architecture
- Tauri, driver, Node, and Rust versions
- active transport profile, fallback, and destination policy
- assertions
- sanitized metrics before/after
- last observed UI state
- cleanup outcome

Artifact policy:

- runtime tools write only to a non-uploaded owned `raw/` directory
- after sanitization, construct `safe-upload/` from an explicit filename allowlist
- validate the exact expected mode-specific filename/digest manifest before upload: complete normal
  bundle, single static sanitizer-failure bundle, or single static pre-scenario
  infrastructure-failure bundle, with no missing, extra, symlinked, escaping, or digest-mismatched
  entry
- treat synthesis of the infrastructure-failure bundle as a nonzero run outcome; a failure-only
  bundle can never satisfy the native job
- always retain safe environment metadata, assertion manifest, duration, boundary checkpoints, and
  cleanup report
- retain one final screenshot on success only after any issued session is invalidated and the
  current canonical deck/address is proven free of credentials, session IDs, queries, and fragments
- outside the authentication secret-entry interval, a failure may retain sanitized screenshot, page
  source, driver logs, Tauri stdout/stderr, Kannel logs, origin logs, Compose status, metrics, and
  last observation
- during an authentication/session interval, retain no screenshot, page source, DOM snapshot,
  video, trace, or unstructured runtime log; retain only the schema-only authentication evidence
  allowlist defined by `NE2E-05`
- never retain authentication bodies or raw sensitive runtime state
- upload only `safe-upload/`; sanitizer failure removes raw evidence and publishes a static safe
  failure manifest without the matched secret or excerpt
- child-process output remains captured without console forwarding during the authentication/session
  interval, and workflow console messages are static and non-interpolating

### NE2E-12 Enforce the flake policy

- `Depends On`: `NE2E-11`
- `Estimated Size`: small

Policy:

- no automatic behavioral retries
- bounded retry is allowed only for service/driver readiness
- a flaky test is a defect, not a pass
- quarantined scenarios require an owner, reason, issue, and expiry date
- quarantined scenarios cannot satisfy a required gate
- require 20 consecutive, no-rerun executions on one unchanged revision
- independently require four consecutive scheduled, no-rerun successes over at least 21 elapsed days
- neither evidence sample substitutes for the other

Operational targets, not application performance assertions:

- Linux P0 native suite: less than 15 minutes at CI P95
- Linux nightly suite: less than 35 minutes
- unclassified infrastructure failure rate below 2 percent before the lane becomes required
- one failure artifact bundle is sufficient for boundary-level triage

## Phase 5: Cross-Platform WebDriver Research Spike

Start only after the Linux authentication suite is stable and required.

### NE2E-13 Prototype Tauri's embedded WebDriver provider

- `Depends On`: Linux P0 promotion
- `Estimated Size`: medium
- `Likely Files`:
  - `browser/src-tauri/Cargo.toml`
  - `browser/src-tauri/src/lib.rs`
  - a test-only Tauri capability/configuration
  - WebdriverIO configuration/provider modules
  - CI matrix workflow changes

Build:

- add testing plugins as optional dependencies behind an explicit Cargo feature such as
  `native-e2e-driver`
- register testing plugins only under that feature
- reuse the Waves-facing scenario intent where practical
- do not use command mocking in the native full-stack suite
- run one cold-start and one authentication scenario on Linux, macOS, and Windows

Accept:

- the same user-visible behavior passes on all three platforms
- the ordinary release dependency graph excludes testing plugins
- a release binary exposes no WebDriver listener or test permission
- production global Tauri/API exposure is not broadened
- platform logs and cleanup evidence are complete
- security review finds no path for accidental test instrumentation in production

### NE2E-14 Make the driver adoption decision

Adopt the embedded provider when all of the following are true:

- it runs the same critical scenarios on all three operating systems
- it does not weaken production capabilities
- its CI flake rate is no worse than the Linux Selenium lane
- it materially improves diagnostics or platform reach
- scenario intent does not require a broad rewrite

Otherwise:

- retain Selenium/`tauri-driver` as the authoritative Linux/Windows lane
- use the embedded provider only for macOS smoke if its isolation is acceptable
- document the decision and re-evaluation trigger

## Phase 6: Packaged Artifact Smoke

The current Tauri configuration has `bundle.active: false`, and the native pilot builds with
`--no-bundle`. Package smoke therefore starts only after product/release work activates a supported
bundle target.

### NE2E-15 Add platform package smoke

- `Depends On`: product bundling decision, stable native P0 suite
- `Estimated Size`: medium per platform

Initial scenarios:

- platform bundle/installer is structurally valid
- application installs, mounts, or launches from the packaged location
- production frontend assets load under the release CSP
- network mode loads the gateway deck
- one navigation succeeds
- application exits cleanly
- test plugins, test permissions, and observation surfaces are absent

Run package smoke in isolated scheduled/release workers against the exact artifacts intended for
publication. Do not make installer mutation part of ordinary developer-machine tests.

## CI Rollout

### Stage 1: Advisory always-present Linux lane

- trigger the workflow for every pull request and classify whether relevant paths changed
- conditionally run the expensive Ubuntu native job only for relevant changes
- publish one always-present advisory gate result for both relevant and irrelevant changes
- land this workflow shape in harness-foundation PR 1; do not wait for required-check promotion
- run foundation and authentication scenarios without blocking merge
- collect 20 consecutive unchanged-revision runs and four scheduled successes over at least 21 days
- classify every failure

### Stage 2: Required Linux P0 lane

Trigger on changes to:

- browser frontend source and native host
- browser/engine/transport contracts
- native engine runtime
- Lowband transport
- Kannel configuration
- WML origin
- native E2E harness and workflow

All P0 scenarios must pass. No quarantined scenario counts toward the gate.

Workflow shape:

1. an always-running classifier determines whether native E2E-relevant paths changed
2. the native P0 job runs only when relevant
   - scheduled and manual events always classify as relevant and force native execution
3. a final `native-waves-e2e-gate` job uses `if: always()` and checks classifier/native outcomes
4. irrelevant changes produce a successful final gate with an explicit skip reason
5. only the published `Native Waves E2E Gate` check from the `native-waves-e2e-gate` YAML job is
   configured as required; the workflow itself has no top-level path filter

Before the context becomes required, the same final job runs as an advisory signal. Its tested truth
table is:

| Event/classification    | Native job               | Final gate                              |
| ----------------------- | ------------------------ | --------------------------------------- |
| relevant pull request   | must run                 | mirrors pass/fail/cancel/missing        |
| irrelevant pull request | skipped by job condition | success with explicit irrelevant reason |
| schedule or manual      | must run                 | mirrors pass/fail/cancel/missing        |
| classifier failure      | does not run             | failure                                 |

### Stage 3: Nightly Linux regression

- run all P0 and P1 scenarios
- include repeated race-sensitive authentication submission
- retain trend data for duration and failure classification

### Stage 4: Weekly platform matrix

After `NE2E-14`:

- Ubuntu: full P0/P1 suite
- Windows: P0 smoke
- macOS: P0 smoke
- matrix `fail-fast` remains disabled so every platform produces evidence

### Stage 5: Release artifact matrix

- run package smoke against the exact unsigned/signed artifacts appropriate to the release stage
- signing/notarization and installer verification remain release responsibilities, not native runtime
  test concerns

## Entry and Exit Criteria

### Entry criteria for implementation

- current unit, contract, story, native-host, engine, and transport suites are green
- the native pilot succeeds from a pinned main revision
- current success and intentional-failure evidence is preserved
- this plan and its security/production-instrumentation guardrails are accepted

### Exit criteria for the first major milestone

- registration and login succeed through the actual native stack
- keyboard Enter and physical Select submission are covered independently
- final-character/immediate-submit behavior is automated
- every native scenario starts with isolated application and WebDriver state
- no fixed behavioral sleeps remain
- no native scenario depends on another scenario
- the complete `NE2E-05` whole-lifecycle secret taxonomy—including PINs, setup bodies, issued session
  IDs, Kannel admin/status credentials, and WebDriver session handles—plus address queries/fragments
  and secret-bearing unstructured logs is absent from retained artifacts and workflow console output
- two E2E stacks and the developer stack coexist; each host uses its manifest-bound physical gateway,
  detects an origin-instance mismatch, and displays the canonical logical WAP URL
- the P0 suite passes 20 consecutive no-rerun executions on one unchanged revision
- four consecutive scheduled runs pass without reruns over at least 21 elapsed days
- a stale/missing-form-value mutation causes the suite to fail
- Linux P0 exposes an always-present required gate that conditionally runs the expensive suite for
  relevant paths and succeeds explicitly for verified irrelevant changes
- failure evidence retains the bounded fixed-enum checkpoint trail and identifies the next failed
  boundary as startup, UI dispatch, response rendering, origin confirmation, session lifecycle,
  scenario finalization, or cleanup without retaining exception text

## Risks and Mitigations

| Risk                                                               | Impact | Mitigation                                                                                                                                              |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native UI tests become slow or flaky                               | High   | short independent scenarios, fresh driver/app session, explicit waits, no behavioral retries                                                            |
| Harness cleanup stops developer services                           | High   | unique Compose project, owned-resource manifest, cleanup guardrail tests                                                                                |
| Authentication/session secrets leak into files or workflow console | High   | PIN/SID canaries, captured-not-echoed child output, schema-only interval evidence, invalidation before visuals, fail-closed safe upload                 |
| Test-only WebDriver plugin ships                                   | High   | optional Cargo feature, separate capability/config, dependency and release-binary absence checks                                                        |
| Framework migration delays critical auth coverage                  | High   | harden existing Selenium lane first; evaluate WDIO separately                                                                                           |
| Driver-specific details leak into scenarios                        | Medium | narrow Waves-facing driver API and centralized selectors                                                                                                |
| One long journey masks multiple failures                           | Medium | one reason per scenario; long journey remains supplemental P1                                                                                           |
| Fixed names, WebDriver ports, or gateway endpoints collide         | High   | no E2E `container_name`, unique project, both driver ports and TCP/UDP bindings per run, manifest-bound routing plus origin-instance mismatch detection |
| Required check remains pending on irrelevant PRs                   | High   | no workflow-level path filter; always-present classifier and final gate job                                                                             |
| Global metrics hide delayed duplicates                             | High   | bounded action correlation plus configured retry-horizon stability window                                                                               |
| Screenshots become brittle assertions                              | Medium | semantic visible-text/status/metric oracles; screenshots are supporting evidence                                                                        |
| Native suite duplicates engine conformance tests                   | Medium | native suite proves assembly and critical journeys only                                                                                                 |
| Cross-platform WebViews differ                                     | Medium | shared scenario intent, platform-specific provider mechanics, weekly matrix before release gating                                                       |

## Delivery and PR Slices

### PR 1: Harness foundation

- `Suggested Branch`: `codex/native-waves-e2e-foundation`
- `Suggested PR Title`: `test(browser): harden the native Waves E2E harness`
- `Suggested Commit`: `test(browser): modularize native Waves E2E`
- `Scope`: `NE2E-00` through `NE2E-05`, including fail-closed artifact publication, deterministic
  same-task event injection, correlated origin oracles, contract-first host/transport gateway
  routing, both run-scoped WebDriver ports, and concurrent isolation proof
- `Workflow prerequisite`: remove trigger-level `paths`, add the always-present advisory
  classifier/native/final-gate truth table, and include `browser/frontend/e2e/native/**` in its
  relevant-path classifier before PR 2 can land

### PR 2: Authentication critical flows

- `Suggested Branch`: `codex/native-waves-e2e-auth`
- `Suggested PR Title`: `test(browser): cover native registration and login flows`
- `Suggested Commit`: `test(browser): add native auth regression coverage`
- `Scope`: `NE2E-06` through `NE2E-09`; authentication scenarios cannot land before PR 1's safety
  and isolation acceptance tests pass

### PR 3: Failure and recovery suite

- `Suggested Branch`: `codex/native-waves-e2e-recovery`
- `Suggested PR Title`: `test(browser): expand native transport and recovery coverage`
- `Suggested Commit`: `test(browser): add native failure recovery scenarios`
- `Scope`: `NE2E-10` through `NE2E-12`

### PR 4: Cross-platform driver spike

- `Suggested Branch`: `codex/native-waves-e2e-cross-platform`
- `Suggested PR Title`: `test(browser): evaluate embedded cross-platform Tauri WebDriver`
- `Suggested Commit`: `test(browser): prototype cross-platform Tauri automation`
- `Scope`: `NE2E-13` and `NE2E-14`

### PR 5: Package smoke

- `Suggested Branch`: `codex/waves-package-smoke`
- `Suggested PR Title`: `test(browser): verify packaged Waves application artifacts`
- `Suggested Commit`: `test(browser): add packaged application smoke tests`
- `Scope`: `NE2E-15`

### Promotion PR: Required-check migration after observation

- `Suggested Branch`: `codex/native-waves-e2e-promotion`
- `Suggested PR Title`: `ci(browser): promote the native Waves E2E gate`
- `Suggested Commit`: `ci(browser): require the native Waves E2E gate`
- `Depends On`: both promotion evidence samples, an approved ruleset/settings change window, and a
  qualifying relevant PR run
- `Scope`:
  - preserve and revalidate PR 1's classifier/native/final-gate result matrix
  - confirm scheduled and manual events still force native execution
  - update `docs/ci/REQUIRED_CHECKS.md`, `docs/ci/CI_SETUP.md`, this plan, and the readiness scorecard
  - add the published `Native Waves E2E Gate` check from the `native-waves-e2e-gate` YAML job to the
    repository ruleset/branch-protection required contexts only after the workflow is present on the
    default branch
  - validate the live migration on one relevant and one irrelevant PR so neither can be stranded in
    Pending and relevant native failures remain blocking

Repository settings are an explicit owner-approved delivery step; the implementation PR alone does
not authorize or complete that external-state change. This promotion can follow PR 2/3 once its
observation gates close; it does not depend on the later cross-platform or package-smoke PRs.

## Estimated Delivery

These are engineering-order estimates, not calendar commitments:

| Milestone                                                      | Estimated focused effort                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| Safe modular Linux harness, correlation, and artifact controls | 3-5 days                                                    |
| Native registration/login critical path                        | 2-3 days                                                    |
| Failure/recovery expansion and evidence hardening              | 3-5 days                                                    |
| Cross-platform embedded-driver spike                           | 3-5 days                                                    |
| Package smoke                                                  | several days per selected platform after bundling is active |
| Required-check promotion                                       | 1-2 days after the minimum 21-day observation window        |

The foundation and authentication implementation is roughly one to two focused engineering weeks.
Required-check promotion has a separate minimum 21-day observation window and cannot be promised in
the implementation week. Cross-platform and packaged artifact coverage should be delivered
incrementally after the Linux gate proves reliable.

## Recommended Start Order

1. Adopt and baseline `NE2E-00`.
2. Land and concurrently verify isolation before adding scenarios (`NE2E-01`).
3. Modularize and add deterministic same-task injection (`NE2E-02` through `NE2E-04`).
4. Land fail-closed safe publication and correlated origin oracles (`NE2E-05`).
5. Land the two independent native auth regressions (`NE2E-06`, `NE2E-07`).
6. Add the supplemental journey and recovery cases (`NE2E-08`, `NE2E-09`).
7. Promote Linux P0 only after the mutation gate, 20-run unchanged-revision sample, and four
   scheduled successes over at least 21 days all pass.
8. Expand deterministic failures and nightly coverage.
9. Run the cross-platform spike and record the provider decision.
10. Add package smoke only after product bundling is activated.
