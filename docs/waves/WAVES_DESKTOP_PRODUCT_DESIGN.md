# Waves Desktop Product and Interaction Design

Status: planning-ready
Last updated: 2026-07-26
Owner lane: `browser` with contract dependencies on `engine-wasm` and `transport-rust`

## Purpose

Define the product and interaction direction for the Waves desktop browser while the WAP 1.2.1 /
WML 1.3 Class C compliance program continues.

This document describes the intended user experience and assigns ownership at layer boundaries. It
does not replace the normative compliance manifests, the engine-host frame migration plan, the
onboarding plan, or their work-item ledgers.

## Product Decision

Waves will use an **Authentic Core, Modern Console** model:

1. The central emulation surface behaves like a constrained period WAP handset.
2. The surrounding desktop chrome uses modern interaction patterns where they improve reliability,
   accessibility, discoverability, diagnostics, and recovery.
3. WML behavior remains engine-owned. The browser host adapts input and presents output; it does not
   create a second DOM-based WML runtime.
4. The initial handset is a neutral `Class C Reference` profile. Evidence-backed Nokia, Ericsson,
   Openwave, and other overlays are later profiles, not aliases for generic WAP behavior.

This direction deliberately rejects two extremes:

- a large retro desktop document viewer in which handset interaction is incidental
- a visually exact replica of one handset presented as universal Class C behavior

## Relationship to Active Programs

Implementation remains subordinate to:

- [WAP 1.2.1 planning baseline](WAP_1_2_1_PLANNING_BASELINE.md)
- [engine-host frame migration plan](ENGINE_HOST_FRAME_MIGRATION_PLAN.md)
- [engine-host frame work items](ENGINE_HOST_FRAME_WORK_ITEMS.md)
- [user onboarding experience plan](USER_ONBOARDING_EXPERIENCE_PLAN.md)
- [engine debug connector plan](ENGINE_DEBUG_CONNECTOR_PLAN.md)
- [usability and resilience backlog](USABILITY_RESILIENCE_BACKLOG.md)
- [historical browser profile source baseline](HISTORICAL_BROWSER_PROFILE_SOURCE_BASELINE.md)

Browser-only presentation work may proceed while core work continues when it preserves the current
contracts and does not infer or hard-code future WML semantics. Contract-dependent capabilities must
wait for their owning engine or transport slice.

## Current Experience Assessment

### Foundations to preserve

The existing Waves browser already has useful product foundations:

- transport-first Local and Network loading
- deterministic engine-owned focus, editing, script invocation, and card navigation
- hybrid Back behavior across engine card history and host deck history
- serialized input processing to prevent timer/input reordering
- startup, loading, success, and categorized error presentation
- host request correlation and a collapsed developer drawer
- executable examples for navigation, forms, history, timers, scripts, and rollback
- centralized copy and a growing semantic design-token set

### Experience gaps

The current shell presents a large white, monospace `Deck View` with fixed `Up`, `Select`, and `Down`
buttons. The result reads more like a retro desktop utility than a handset browser. The largest gaps
are:

1. The viewport does not communicate a constrained handset display or period interaction rhythm.
2. Fixed controls do not expose WML task precedence or dynamic softkey labels.
3. The Local/Network selector occupies a second address-like row instead of expressing source and
   route compactly.
4. Diagnostics occupy substantial permanent space even during ordinary browsing.
5. Pointer activation is not routed through engine-owned hit regions.
6. History, bookmarks, settings, persistence, crash recovery, and complete help surfaces are not yet
   product-complete.
7. Browser-side cancellation suppresses stale results but does not abort an in-flight transport
   request.
8. Complete frontend automation through Tauri, Kannel, transport, and the engine is still a coverage
   gap.

## Historical Evidence and Its Product Implications

The WML 1.3 specification defines decks, cards, tasks, history, and user-agent behavior while leaving
substantial presentation flexibility. Cards can occupy one or several physical screens, and the
representation of card-level actions is user-agent dependent. Strict WML behavior therefore does not
imply one canonical handset skin. See the [OMA WML 1.3 specification](https://www.openmobilealliance.org/tech/affiliates/wap/wap-191-wml-20000219-a.pdf).

The Nokia 7110 is a useful later profile: its 96 by 65 display, small proportional font, inverse-video
focus, left `Options` and right `Back` softkeys, and roller-based movement create a recognizable WAP
interaction model. Those are Nokia-specific observations rather than generic Class C requirements.
Two recovered Nokia publications now support detailed profile planning; see the
[historical browser profile source baseline](HISTORICAL_BROWSER_PROFILE_SOURCE_BASELINE.md).

Phone.com/Openwave's recovered browser-vendor guidance defines a logical primary action, secondary
options access, and fixed Back behavior, but it also documents broad OEM variation and conflicts on
physical left/right placement. A generic browser-family skin would therefore overstate the evidence;
one shipped handset and browser release must be selected before an Openwave profile is named.

Ericsson's R320 exposed a different keypad and service-menu rhythm. Its browser Options menu includes
content-dependent actions plus fixed actions such as Suspend, Reload, Add bookmark, and Exit, while
Resume is reached later from the phone's WAP Services menu. The distinction reinforces the need for
base behavior plus explicit device overlays rather than an inferred cross-OEM menu.

Kannel distinguishes operational states such as Running, Suspended, Isolated, Full, and Shutdown.
These are useful host diagnostics but are not handset-content states and must remain outside the WML
framebuffer. See the [Kannel User's Guide](https://www.kannel.org/download/kannel-userguide-snapshot/userguide.html).

## Product Principles

1. **The deck is not a web page.** Use deck, card, task, softkey, and gateway terminology where those
   concepts are accurate.
2. **The LCD is an emulation boundary.** Browser status, help, and diagnostics never masquerade as WML
   content.
3. **Authenticity is behavioral first.** Focus order, softkey precedence, editors, history, timing,
   wrapping, and failure behavior matter more than a decorative handset skin.
4. **Modern assistance is explicit.** Pointer acceleration, accessible reading, replay, and recovery
   are host facilities whose actions still route through engine contracts.
5. **Strictness is visible.** The active compatibility profile and network route are always
   identifiable without dominating the browsing surface.
6. **Last good state is valuable.** Loading and recoverable failure keep the last committed deck
   visible whenever possible.
7. **Diagnostics observe rather than control.** Inspection must not change runtime ordering or state.
8. **Determinism outranks animation.** Visual polish must not introduce host-timing-dependent layout
   or input behavior.

## Information Architecture

```text
Waves window
|-- Native menu and window controls
|-- Navigation toolbar
|   |-- Back
|   |-- Location
|   |-- Go / Stop
|   |-- Reload
|   |-- Compatibility profile
|   `-- Source / route
|-- Workspace
|   |-- Handset stage
|   |   |-- LCD header and content
|   |   |-- Engine-owned softkey strip
|   |   `-- Host input controls
|   `-- Collapsible utility rail
|       |-- Session
|       |-- History
|       |-- Bookmarks
|       `-- Help
|-- Navigation phase and recovery bar
`-- Collapsible developer drawer
    |-- Network
    |-- Runtime
    |-- Timeline
    `-- Replay
```

On narrower windows, the utility rail becomes an overlay or drawer. The logical handset viewport does
not reflow to arbitrary desktop width; the selected profile controls its rows, columns, and logical
metrics. Hosts may scale the completed frame in deterministic integer steps.

## Visual Language

### Handset stage

- restrained warm-silver or graphite housing
- low-saturation green, blue, or gray monochrome LCD palette
- deterministic engine-measured period typography
- inverse-video focus and limited underlining
- dedicated card-title and softkey regions when supplied by the active profile
- integer display scaling and generous desktop-stage breathing room
- optional pixel-grid or LCD-persistence effect, disabled by reduced-motion preferences

### Supporting chrome

- compact, contemporary spacing and typography
- one accent color for selection and connection progress
- semantic colors for success, warning, and failure
- subdued panels that do not compete with the handset
- platform-native menus and familiar Back, Reload, Go/Stop, disclosure, and search patterns

The existing Win95 treatment may survive as a selectable host theme later, but it is not the product's
semantic model and must not determine engine behavior.

## Interaction Model

### Navigation toolbar

- `Back` consumes engine card history before host deck history.
- `Location` accepts complete URLs, including card fragments.
- `Go` becomes `Stop` only while work is genuinely cancellable.
- `Reload` repeats the current request according to WML and transport policy.
- `Profile` selects a documented engine compatibility profile.
- `Source / route` distinguishes local fixtures from real transport and the configured transport
  route.
- Tabs and multiple concurrent browsing sessions are out of MVP scope.

Address suggestions, history search, and bookmarks are host-owned conveniences. Selecting one starts
a normal navigation request; it does not bypass transport or engine semantics.

### Handset input

The engine frame should eventually expose an input-affordance model containing at least:

- stable action identifier
- slot or physical control association
- label
- enabled state
- action source, such as focused link, card `do`, template action, editor, or profile-native action

The host renders those affordances and returns typed input events. It does not derive softkey meaning
from rendered text or HTML elements.

Keyboard, on-screen controls, and pointer activation are alternative host inputs to the same engine
action. Pointer clicks resolve through engine-owned hit regions. A click must not directly follow a
DOM anchor.

### Forms and editors

Profile-specific modal text and selection editors remain engine behavior. A host-native accessible
editor may be used as an adapter only when it preserves engine-owned begin, edit, commit, and cancel
semantics.

### History and bookmarks

- Engine history owns card-level WML semantics.
- Host history owns committed deck navigations and their request identity.
- Bookmark titles come from engine card/deck metadata; locations retain fragments.
- Restoring a session may offer local or GET navigation automatically.
- POST bodies, credentials, and security-sensitive headers are never replayed automatically.

## State Model

### Startup

1. Paint the native window and stable handset shell.
2. Initialize local engine and settings.
3. Run decoder and gateway preflight in the background.
4. Enable network actions as their dependencies become ready.

### Navigation

Use stable, truthful phases outside the LCD:

```text
Preparing -> Connecting -> Gateway exchange -> Decoding -> Loading deck -> Opening card
```

Keep the previous committed deck visible while a new deck loads. Delay transient progress treatment
briefly so instant local loads do not flash, but show status text immediately.

### Failure and recovery

Errors use a short category and an actionable recovery:

- Gateway timeout: Retry, Change route, Details
- Unsupported content: Details, Open help
- Deck invalid: Details, Return to previous deck
- Script stopped: Return to card, Details
- Runtime reset: Restore safe session, Start fresh

The host shows correlation ID, route, attempt, and last completed phase in Details. It does not inject
an artificial WML error card into the emulation surface.

## Accessibility Model

The desktop chrome targets WCAG 2.2 AA. The rendered handset needs a synchronized semantic projection
derived from the same engine frame and stable action identifiers as the visual renderer. It is an
accessibility adapter, not an independent DOM interpretation of WML.

Required behavior includes:

- complete keyboard operation
- visible, unobscured focus
- live announcements for navigation, card changes, failures, and recovery
- reduced-motion support
- minimum 24 by 24 CSS-pixel targets, with larger primary handset controls
- 200 percent host zoom without loss of controls
- screen-reader access to the current card, focus, available actions, and navigation state
- optional accessible reading panel outside the emulation surface

Reference: [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Diagnostics and Replay

The collapsed developer drawer should provide:

1. `Network`: URL, method, route, attempts, timings, content type, and payload size.
2. `Runtime`: deck/card identity, history depth, focus, editor, timer, and script state.
3. `Timeline`: correlated transport, engine, and host events.
4. `Replay`: export, import, and replay a bounded sanitized session against controlled fixtures.

The connector remains read-only and non-blocking. Exports omit credentials, authorization headers,
cookies, secrets, and sensitive form values by default. Chrome's preserved request log and Recorder
provide useful interaction references, provided their web-page assumptions are not copied into the
WML surface: [Network panel reference](https://developer.chrome.com/docs/devtools/network/reference)
and [Recorder](https://developer.chrome.com/docs/devtools/recorder).

## Settings

### MVP

- compatibility profile
- handset display scale
- source and network route
- gateway location where applicable
- reduced motion
- high-contrast host theme
- safe-session restore preference

### Next

- host text scale
- history and diagnostic retention
- capture redaction controls
- explicit constrained-network simulation presets

Settings that alter protocol results or timeout policy must be marked as diagnostic overrides. They
must not silently redefine the selected strict compatibility profile.

## Product Acceptance Targets

The implementation plan owns delivery gates. Product-level targets are:

1. A newcomer can load a bundled deck and identify Back, Select, and the two softkey regions in less
   than 60 seconds without external documentation.
2. A technical user can identify the active route, copy a correlation ID, and export a sanitized
   replay in less than two minutes.
3. Keyboard, on-screen button, and pointer activation of the same action produce equivalent engine
   traces.
4. Failures preserve the last committed deck and always offer a safe next action.
5. The browser never performs WML navigation, task resolution, focus movement, line wrapping, WBXML
   decoding, or gateway protocol behavior on behalf of the owning core layer.

## Adopted Initial Baseline Decisions

The `WBP-00` baseline adopts the following working decisions, with measurements and rationale in
[Waves Browser WBP-00/WBP-01 Baseline](WAVES_BROWSER_BASELINE.md):

1. Primary launch audience: WAP/WML implementers and emulator evaluators. Preservationists and
   learners are secondary audiences whose onboarding assumptions remain subject to `WBP-04`
   validation.
2. Initial `Class C Reference` viewport: neutral, non-vendor, and 20 engine-owned logical columns.
   A fixed row count and device metrics wait for the `WBP-06` frame/profile contract rather than
   being inferred by the browser.
3. Performance reference: the recorded Apple M1 Max/macOS browser-WASM local path. It is a
   reproducible comparison baseline, not a release budget or network-performance claim.
4. Toolbar information architecture: source remains configurable, while route and compatibility
   profile remain visible, read-only facts until their runtime choices genuinely exist.

## Open Product Decisions

1. `WBP-08` owner: whether pointer assistance defaults on or is selected during first-run setup.
2. `WBP-12`/`WBP-13` owners: persistence and redaction policy for form fields and diagnostic
   captures.
3. `WBP-15` owner: apply the historical source baseline's provenance and coverage thresholds before
   naming and shipping a device-specific profile.

## Evidence Gaps

- Primary Phone.com/Openwave browser guides and Nokia 7110 interaction guides are recovered for
  private research; device-specific Openwave physical controls, byte-verified Ericsson R320
  developer material, Motorola application guidance, firmware defects, and redistribution
  permissions remain open.
- Current stories do not provide broad automated coverage of the complete Tauri UI path.
- Dynamic softkey order, menu overflow, modal form editing, and pointer acceleration need focused
  prototypes and user testing.
- Network, gateway, startup-recovery, and packaged-Tauri budgets still need measurement; the
  deterministic local browser/WASM comparison baseline is established.
- The primary technical-audience assumption is adopted for launch planning; `WBP-04` still needs to
  validate newcomer and learner onboarding.
