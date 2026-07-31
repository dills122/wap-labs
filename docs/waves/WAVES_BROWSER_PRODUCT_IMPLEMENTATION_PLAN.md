# Waves Browser Product Implementation Plan

Status: planning-ready
Last updated: 2026-07-30 (`origin/main` `6cf1682a`)
Design source: [Waves Desktop Product and Interaction Design](WAVES_DESKTOP_PRODUCT_DESIGN.md)

## Purpose

Turn the Waves desktop product direction into parallel-safe implementation slices while WAP/WML
Class C core work continues.

This plan coordinates existing authoritative plans. It does not duplicate their ticket state or
permit browser work to infer unfinished engine or transport behavior.

## Program Outcomes

1. Make the current browser feel like a handset emulator rather than a document viewer.
2. Preserve strict ownership of WML, rendering-layout, focus, navigation, and protocol behavior.
3. Improve startup feedback, loading truthfulness, failure recovery, accessibility, and diagnostics.
4. Build browser work in independently testable slices that do not block ongoing core work.
5. Land contract-dependent behavior only after its owning engine or transport gate is ready.

## Source Plans and Ownership

| Capability                                  | Authoritative plan or backlog                                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Class C sequence and adoption gates         | [WAP 1.2.1 planning baseline](WAP_1_2_1_PLANNING_BASELINE.md)                                                   |
| Frame, Canvas, hit regions, typed input     | [engine-host frame plan](ENGINE_HOST_FRAME_MIGRATION_PLAN.md) and [work items](ENGINE_HOST_FRAME_WORK_ITEMS.md) |
| Welcome, help, tours, tutorials             | [user onboarding plan](USER_ONBOARDING_EXPERIENCE_PLAN.md)                                                      |
| Read-only runtime observation               | [engine debug connector plan](ENGINE_DEBUG_CONNECTOR_PLAN.md)                                                   |
| Existing host usability follow-ups          | [usability and resilience backlog](USABILITY_RESILIENCE_BACKLOG.md)                                             |
| Historical profile evidence and provenance  | [historical browser profile source baseline](HISTORICAL_BROWSER_PROFILE_SOURCE_BASELINE.md)                     |
| Application completion discovery and slices | [desktop application completion PRD](PRD-WAVES-DESKTOP-APPLICATION-COMPLETION.md)                               |

When a slice starts, update the owning work-item ledger rather than creating a second status source in
this document.

## Non-Negotiable Guardrails

1. Browser code does not parse WML or WBXML, compute WML task precedence, lay out deck content, or
   perform engine history transitions.
2. Rendering dimensions and hit regions come from the engine frame; hosts do not measure HTML to
   decide runtime layout.
3. Transport cancellation, retry, timeout, and route metadata originate in `transport-rust` and flow
   through generated contracts.
4. Rust-exported types remain the source of truth for cross-language transport contracts.
5. Native and WASM engine behavior must remain equivalent.
6. Each stable host-visible engine behavior receives an executable story when deterministic.
7. Browser-only work must continue to function against the current adapter until its contract gate is
   available.

## Delivery Topology

```text
                         Class C core work
                     WML-2 -> WML-3 -> REN-4
                              |
                              v
Browser foundation ----> Frame/input contract ----> Handset integration
  |        |                       |                         |
  |        `-> onboarding          |                         `-> UI E2E evidence
  `-> host accessibility           `-> debug/persistence

Transport lifecycle --------> real cancel + phase metadata --^
```

Three execution lanes are intentional:

- **Lane A — start now:** browser-owned structure, visual system, host accessibility, and onboarding.
- **Lane B — coordinate with core:** engine frame, softkeys, Canvas, hit regions, and parity.
- **Lane C — coordinate with transport:** cancellation, phase metadata, request identity, and recovery.

## Phase 0: Adoption and Baseline

### WBP-00 Adopt the product plan

- `Lane`: coordination
- `Depends On`: none
- `Primary Files`: this plan, owning active ledgers

Build:

- confirm product owner acceptance of `Authentic Core, Modern Console`
- settle the initial reference-handset viewport and primary audience assumptions
- map adopted work into the current Class C graph before implementation begins
- capture current startup, navigation, and input latency on reference hardware
- preserve current screenshots as baseline evidence; do not treat them as target goldens

Accept:

- product direction and unresolved decisions have named owners
- each implementation slice points to its authoritative ledger and compliance dependencies
- baseline performance measurements are reproducible

## Phase 1: Browser Foundation — Can Start While Core Continues

These slices must preserve the existing engine and transport contracts. They may establish adapters
and placeholders, but must not hard-code future softkey or frame semantics.

### WBP-01 Shell component and layout foundation

- `Lane`: A
- `Depends On`: `WBP-00`
- `Likely Files`:

- `browser/frontend/src/app/browser-shell-template.ts`
- new leaf components under `browser/frontend/src/components/`
- `browser/frontend/src/styles.css`
- browser presenter/controller tests

Build:

- decompose the shell into navigation toolbar, handset stage, utility rail, phase bar, and developer
  drawer components
- retain the current presenter and engine output inside the handset-stage adapter
- make the utility rail collapsible and move diagnostics out of the primary visual hierarchy
- support narrow-window rail collapse without changing engine viewport behavior
- add stable DOM landmarks and test selectors before visual migration

Accept:

- all existing navigation and story flows behave identically
- no WML semantics move into components
- current viewport presenter can be replaced later without another shell restructuring
- the window remains usable at the configured minimum size

### WBP-02 Host visual system and reference-handset scaffold

- `Lane`: A
- `Depends On`: `WBP-01`
- `Likely Files`:

- `browser/frontend/src/styles.css`
- shared component style modules
- theme and copy modules

Build:

- expand semantic tokens for desktop stage, handset housing, LCD, focus, status, and diagnostics
- create the neutral reference-handset housing around the existing viewport adapter
- implement integer display scaling and reduced-motion handling
- retain existing focus and render behavior until the frame migration lands
- keep a potential Win95 host theme additive rather than authoritative

Accept:

- the current engine output is visually contained by a handset-stage boundary
- display scaling never changes engine rows, columns, focus, or line wrapping
- host high-contrast and reduced-motion modes remain legible
- colors and motion are defined through shared semantic tokens

### WBP-02A Native host-chrome default

- `Lane`: A, additive presentation follow-up
- `Status`: done
- `Depends On`: completed `WBP-01`, completed `WBP-02`
- `Likely Files`:

- browser shell leaf templates and shared host styles
- lightweight host panel primitives
- Tauri window background metadata
- shell and rendered-accessibility tests

Build:

- make the native Tauri title bar the only application-window frame
- remove the vendored Win95 stylesheet and faux-window/control classes from the default cascade
  while retaining the vendor material for a possible later optional treatment
- use compact system typography and restrained platform-like surfaces for host chrome
- preserve the neutral Class C handset housing, deterministic LCD typography, inverse-video WML
  focus, IDs, bindings, tab order, and current adapter controls

Accept:

- address/source/route/profile chrome reads as desktop browser chrome, not as a second desktop
  window
- handset and LCD remain primary while utility, status, help, and developer surfaces are quieter
- default/minimum windows, 200 percent zoom, collapsed utility rail, focus visibility, 24 CSS-pixel
  targets, reduced motion, landmarks, live announcements, and horizontal reflow remain covered
- no frame/input, navigation, route, transport, or engine semantics change; dynamic affordances
  remain `WBP-06` scope

### WBP-03 Navigation-toolbar information architecture

- `Lane`: A
- `Depends On`: `WBP-01`
- `Likely Files`:

- shell and toolbar components
- `browser/frontend/src/app/browser-controller.ts`
- `browser/frontend/src/app/waves-copy.ts`

Build:

- consolidate Back, location, Go, Reload, source, and route into one compact toolbar
- preserve existing commands and navigation ordering
- expose route/profile labels as read-only when their runtime choices are not yet configurable
- reserve Go/Stop switching for the cancellable transport slice; do not label stale-result
  suppression as cancellation

Accept:

- Local and Network behavior remains unchanged
- keyboard focus order is stable and complete
- source, route, and compatibility profile are distinguishable concepts
- no unavailable feature is presented as functional

### WBP-04 Start, help, and tutorial minimum slice

- `Lane`: A
- `Depends On`: `WBP-01`; owning onboarding tickets
- `Likely Files`:

- browser start/help components
- `engine-wasm/examples/source/` for distinct new tutorial examples
- adjacent executable `*.flow.json` stories

Build:

- implement the minimum Welcome Home surface
- link to bundled examples, network setup, control help, and troubleshooting
- ship one replayable keypad/softkey tutorial using product-owned local content
- keep product help outside the WML framebuffer except for intentional tutorial decks

Accept:

- a fresh user can reach a working local deck without network setup
- help is skippable and accessible after onboarding
- tutorial-deck behavior is covered by an executable story
- local content uses the ordinary engine path

### WBP-05 Host accessibility baseline

- `Lane`: A
- `Depends On`: `WBP-01`
- `Likely Files`:

- browser components and styles
- keyboard and controller tests
- accessibility test configuration

Build:

- establish landmarks, names, descriptions, live regions, focus treatment, and target sizes for host
  chrome
- verify complete keyboard operation of toolbar, rail, help, recovery, and developer drawer
- add reduced-motion and 200 percent zoom coverage
- document the future semantic frame adapter without interpreting current draw commands as WML DOM

Accept:

- automated checks find no critical host-chrome accessibility violations
- all browser-owned actions are keyboard reachable with visible focus
- loading and error status changes are announced once
- the work does not create a second runtime representation of deck semantics

### Phase 1 integration gate

Run:

- browser frontend unit tests
- browser frontend build
- contract drift check
- all existing Waves-targeted executable stories
- keyboard-only smoke pass at minimum and default window sizes

The Phase 1 result may still use the current renderer and fixed navigation controls internally. Its
purpose is to make later engine integration localized, not to simulate unfinished semantics.

## Phase 2: Contract Spine — Coordinate with Core

The [engine-host frame work items](ENGINE_HOST_FRAME_WORK_ITEMS.md) remain authoritative. Extend their
contract scope, if adopted, to carry the product data needed by the handset:

- logical viewport and compatibility-profile identity
- card/deck display metadata
- stable hit regions and action identifiers
- engine-owned input affordances and softkey labels
- Back/history availability needed for host presentation
- typed softkey, key, pointer, wheel, and editor input events

### WBP-06 Frame and affordance contract coordination

- `Lane`: B
- `Status`: done
- `Depends On`: WML task/softkey semantics ready for exposure; frame F0 work
- `Conflicts With`: debug connector contract edits

Accept:

- the contract contains no browser-specific layout fields
- Rust/native and WASM shapes remain aligned
- compatibility wrappers preserve current hosts
- golden parity tests cover frame commands, focus, affordances, and input traces

Delivered boundary:

- engine-owned, versioned, content-identified presentation frames with ordered rows/segments,
  focus/selection state, logical affordances, and Back availability
- frame-bound typed key/action dispatch across native Rust, WASM, and Tauri adapters
- additive compatibility with `render()`/`handleKey()` and a separate unchanged `EngineDebug*`
  namespace
- no Canvas/CSS cutover, hit-region/pointer/scroll expansion, vendor-specific softkey placement, or
  WBP-02B Handheld Focus View

### WBP-07 Canvas handset renderer integration

- `Status`: in progress; F1 host cutover is complete, while the remaining WBP-07 performance gate
  and broader WBP-08/WBP-09 integration are not inferred complete
- `Lane`: B
- `Depends On`: `WBP-02`, `WBP-06`, frame F1
- `Likely Files`:

- handset-stage renderer component
- browser presenter and controller
- browser renderer tests

Build:

- replace HTML line injection with the approved frame renderer
- render title, content, focus, and softkey regions from the frame
- preserve the previous committed frame during navigation
- coalesce redundant paints without changing engine event ordering

Accept:

- deck content is no longer rendered with `innerHTML`
- native and WASM frame fixtures produce equivalent visible output
- host text measurement does not affect wrapping or hit targets
- closed diagnostics add less than five percent to p95 input/render latency

### WBP-08 Typed input and pointer assistance

- `Lane`: B
- `Depends On`: `WBP-06`, frame F2
- `Likely Files`:

- browser input adapter and keyboard routing
- handset controls
- engine hit-region and input tests owned by frame work items

Build:

- route keyboard, handset buttons, wheel, and pointer through typed engine input
- render dynamic softkey labels and disabled state from engine output
- resolve pointer activation through stable engine hit regions
- add an explicit pointer-assistance preference if product validation requires it

Accept:

- all input paths for the same action produce equivalent runtime traces
- the browser never follows rendered links directly
- softkey labels and precedence come only from the engine
- rapid input and timer activity remain deterministically ordered

### WBP-09 Semantic frame accessibility adapter

- `Lane`: B
- `Depends On`: `WBP-06`, `WBP-07`
- `Conflicts With`: frame contract changes until WBP-06 stabilizes

Build:

- expose the current card, text, focus, and actions to assistive technology from frame metadata
- return activation to the engine using stable action identifiers
- offer an optional external reading view without changing engine state

Accept:

- screen-reader and visual render derive from one engine frame
- activation through the semantic adapter matches physical-control traces
- no independent DOM navigation or task implementation exists

## Phase 3: Transport Lifecycle and Recovery — Coordinate with Transport

### WBP-10 Cancellable fetch lifecycle

- `Status`: in progress; cancellation/admission is complete in PR `#521`, while phase metadata and
  the WBP-11 presentation handoff remain
- `Lane`: C
- `Depends On`: owning transport/WSP slice
- `Likely Files`:

- exported request/response types in `transport-rust/src/lib.rs`
- transport runtime cancellation handling
- generated browser transport contracts
- `browser/src-tauri/src/fetch_host.rs`
- `browser/frontend/src/app/navigation-state.ts`

Build:

- return stable request identity plus attempt, route, and phase metadata
- add explicit cancellation keyed to request identity or an equivalent scoped token
- retain generation invalidation as a stale-result guard
- define deterministic completion-vs-cancel race behavior

Accept:

- Stop aborts the active operation rather than only hiding its result
- a stale or cancelled response cannot mutate engine, history, status, or persisted state
- cancel is acknowledged within 500 milliseconds on reference local test paths
- generated contracts pass drift checks

### WBP-11 Phase-aware loading and recovery presentation

- `Lane`: C with browser integration
- `Depends On`: `WBP-03`, `WBP-10`

Build:

- show stable Preparing, Connecting, Gateway, Decode, Deck, and Card phases
- switch Go to Stop only when the request is cancellable
- keep the previous committed frame visible
- provide categorized Retry, Change route, Details, and Return actions

Accept:

- initial feedback appears within 100 milliseconds
- delayed visual progress appears by 200 milliseconds for slow operations
- every transport error includes a layer/category, correlation ID, and safe recovery action
- no browser-authored error card is injected into the engine

### WBP-12 Persistence and crash recovery

- `Lane`: C/browser
- `Depends On`: stable host history identity; `WBP-11`
- `Likely Files`:

- new versioned persistence modules under `browser/`
- Tauri setup and window-state integration
- browser session/history modules

Build:

- persist settings, window state, bookmarks, and the last committed safe session
- write a crash marker and offer recovery on next launch
- restore local and safe GET sessions by policy
- require confirmation for any non-idempotent replay and never persist secrets in diagnostic exports

Accept:

- corrupted or unknown persistence versions degrade to a safe reset
- startup can display before persistence and network preflight complete
- POST bodies and credentials are never automatically replayed
- safe-session recovery is offered within two seconds after the shell appears

## Phase 4: Diagnostics and Deterministic Evidence

### WBP-13 Integrated debug timeline and sanitized replay

- `Lane`: B + C after contract stabilization
- `Depends On`: debug connector plan, `WBP-06`, `WBP-10`
- `Conflicts With`: engine/Tauri contract edits

Build:

- correlate host, transport, engine, script, and render events
- bound event storage and defer presentation while the drawer is closed
- export a versioned, sanitized `.waves-session.json` capture
- import captures into a controlled fixture-backed replay path

Accept:

- opening or closing tools does not change runtime ordering
- credentials and sensitive form values are redacted by default
- a capture can reproduce the same committed frames and input trace
- a 1,000-step replay completes without crash or unbounded memory growth

### WBP-14 Complete desktop-path evidence

- `Lane`: integration
- `Depends On`: MVP slices above; relevant `INT-9` work

Build:

- extend Waves browser stories for softkeys, pointer parity, loading, cancellation, history, failure,
  and recovery
- automate representative flows through Tauri, Kannel, transport, WASM engine, and renderer
- add startup, interaction-latency, memory-bound, keyboard, zoom, and screen-reader smoke evidence

Accept:

- local fixture stories and real-gateway UI runs are clearly distinguished
- native and WASM parity evidence is green for critical frame/input flows
- the complete path covers at least one success, timeout, cancellation, invalid deck, script trap, and
  crash-recovery case
- evidence is mapped back to the owning work item and compliance requirement

## Phase 5: Device Profiles — Later

### WBP-15 Nokia 7110 profile

- `Depends On`: stable Class C reference profile, compatibility registry, completed frame/input path
- `Research status`: planning-ready from the locked historical evidence; implementation-blocked by
  the declared runtime dependencies

Plan only from the two concordant Nokia publications locked in the historical source baseline. Cover
viewport metrics, typography, focus, roller behavior, softkey mapping, exact Options ordering,
editors, history, and documented limitations with profile-specific fixtures and goldens. Preserve
device-specific timer cadence, firmware/version coverage, and reproducible failure behavior as
explicit evidence gaps until primary material or physical-device traces close them.

Accept planning readiness only when every behavior maps to a cited primary source or an explicit gap;
do not infer missing behavior from neutral Class C or another Nokia handset. Implementation remains
blocked on the declared runtime dependencies.

### WBP-16 Openwave 4.x handset target and evidence lock

- `Depends On`: `WBP-15` evidence method; no runtime dependency because this is research-only
- `Research status`: ready to start as an evidence-lock task; no named Openwave profile is authorized

Select one representative shipping handset and exact Phone.com/Openwave browser release. Pair the
recovered browser-family style guide with that manufacturer's user/developer guide, then resolve
viewport and typography, focus controls, physical softkey placement, overflow-menu ordering,
editor modes, Back/history, timers, and documented failures. Record hashes, provenance, conflicts,
availability, and redistribution constraints while keeping restricted payloads outside Git.

Accept only an evidence-locked planning candidate. Do not add a generic `Openwave` profile, implement
runtime behavior, or use the 5.0 graphical guide to fill 4.x/OEM gaps. Ericsson and Motorola remain
source-recovery candidates until comparable primary evidence exists.

## Proposed Delivery Order

1. Product adoption and baseline measurement (`WBP-00`).
2. Shell component foundation (`WBP-01`).
3. Run visual system, navigation toolbar, onboarding, and host accessibility in parallel
   (`WBP-02` through `WBP-05`) with one shell-integration owner.
4. Land the engine frame and affordance contract (`WBP-06`) through its existing F0 gate.
5. Run Canvas/input/accessibility integration (`WBP-07` through `WBP-09`).
6. Land transport cancellation and phase metadata (`WBP-10`).
7. Integrate loading, recovery, and persistence (`WBP-11`, `WBP-12`).
8. Land diagnostics/replay after both contract surfaces stabilize (`WBP-13`).
9. Close MVP with complete-path evidence (`WBP-14`).
10. Begin named compatibility profiles only after Class C reference behavior is stable (`WBP-15`);
    conduct the additive Openwave target/source lock independently as research (`WBP-16`).

## Parallel Ownership and Conflict Controls

| Work                       | Safe parallel owner                          | High-conflict files or surfaces                                       |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| Shell structure            | Browser UI integrator                        | shell template, controller, global styles                             |
| Theme and handset scaffold | Browser visual owner after shell seams exist | global tokens and handset component                                   |
| Onboarding content         | Browser/docs owner                           | start-shell integration; example manifest generation                  |
| Host accessibility         | Browser accessibility owner                  | shared component templates and focus styles                           |
| Frame contract             | Engine-contract owner                        | engine contract, generated host types, Tauri engine adapter           |
| Canvas/input               | Renderer owner after frame contract          | presenter, controller, keyboard/input adapter                         |
| Transport cancellation     | Transport-contract owner                     | Rust exports, generated transport types, fetch host, navigation state |
| Persistence                | Browser/Tauri owner after history identity   | bootstrap/session modules and settings UI                             |
| Debug connector            | Diagnostics owner after contracts stabilize  | engine contract, Tauri adapter, developer drawer                      |
| End-to-end evidence        | Test owner                                   | shared story manifest and test harness configuration                  |

Rules:

1. One owner integrates edits to the shell template, root controller, copy, and global stylesheet.
2. Frame and debug-connector contract changes are sequenced, not merged concurrently.
3. Transport cancellation does not overlap another generated transport-contract migration.
4. Distinct example and flow files are parallel-safe; manifest generation has one owner.
5. Work rebases on core behavior rather than adding browser fallbacks for missing semantics.

## MVP Exit Criteria

The browser-side uplift is MVP-complete when:

1. The main experience is recognizably a reference handset within restrained modern desktop chrome.
2. Dynamic softkeys, focus, layout, and pointer targets are engine-owned.
3. The Tauri viewport consumes the canonical frame path without HTML line injection.
4. Local and network navigation show truthful phases and support real cancellation.
5. The previous committed deck survives recoverable failure.
6. Safe state, settings, bookmarks, and window position restore predictably.
7. Browser chrome and the semantic frame adapter satisfy the accessibility acceptance checks.
8. Diagnostics are correlated, bounded, sanitized, and replayable without controlling the runtime.
9. Native/WASM parity, browser stories, and real Tauri/Kannel evidence are green.
10. No browser code has assumed responsibility assigned to the engine or transport layers.

## Current Phase 1 Checkpoint and Next Authorization Gate

`WBP-00` through `WBP-05` are implemented on current `main`: `#348` carries the adoption/baseline
and shell-integration evidence, while `#344`, `#346`, `#347`, and `#356` carry the visual,
toolbar, onboarding, and host-accessibility slices. The original integration seams remain useful
maintenance history, not an initial task batch.

The additive `WBP-05A` checkpoint gap is closed. Navigation loading and failure changes now use one
shell-owned live-announcement channel while visual status/recovery surfaces remain available.
Production-built Chromium evidence covers full axe, 200 percent zoom/reflow, focus visibility,
target geometry, and contrast at both configured window sizes. The accepted artifacts and explicit
packaged macOS VoiceOver manual-only smoke are recorded in
`WAVES_BROWSER_ACCESSIBILITY_EVIDENCE.md`; `WBP-05` remains completed history.

The canonical compliance program records `WML-2`, engine-internal WML-302
variable/substitution semantics, and engine-owned WML-303 task/BACK/softkey precedence as `done`;
WML-302 made no host-contract edit, and D0-01 settled the additive `EngineDebug*` namespace and
merge sequence. WBP-06 and F0-01 through F0-03 close the canonical frame/input contract, additive
APIs, host projection, WML-309 presentation clauses, and CI drift gates without renaming or folding
debug DTOs into frame/input types. F1-01 through F1-03 now complete the host-sample and Canvas
renderer cutover plus deterministic committed-frame navigation publication. F2 pointer/scroll and
softkey input remain dependency-ordered follow-ups.

`WBP-02A` is complete as the additive, browser-only native-host-chrome follow-up. It did not reopen
the completed `WBP-01`/`WBP-02` history or itself activate `WBP-06`; the later F0 contract tranche
closed WBP-06 independently.

The July 28-30 hardening pass is also landed without changing the product-phase status. Focused-input
Backspace, timer re-arming, gateway fallback, terminal external intents, failed frame commands,
cancellable navigation, bounded single-pass render output, and bounded typed host ingress have
direct regression coverage. Those fixes preserve completed Phase 1 tickets and do not by
themselves claim WBP-07 through WBP-14 complete.

The redesigned shell/Developer Tools workspace, pre-release marketing refresh, versioned
application-state foundation, Favorites domain, native command registry, safe diagnostic
projection, and D0-02/D0-03 debug source/host bridge are merged. The D0-04 branch adds read-only
Inspector consumption with bounded safe capture without taking the parallel RSL-07 presenter or
F2-01 engine-input surfaces. Issue `#450`, `WBP-11`, and `APP-SHELL-01` follow on shared history,
presenter, and shell surfaces.
