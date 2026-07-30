# PRD: Waves Desktop Application Completion

Status: decision-ready discovery and implementation plan
Last updated: 2026-07-30
Implementation checkpoint: `origin/main` `eaf8fc0e`
Owner lane: `browser`, with explicit dependencies on `engine-wasm`, `transport-rust`, and the
public WAP lab program

## 1. Summary

Waves has a credible WAP/WML runtime, bounded transport/frame path, native shell and commands,
versioned application-state foundation, local examples, Favorites domain, and bounded engine debug
recorder. It does not yet provide the integrated organization, safe diagnostic projection,
phase-aware recovery, or WAP-specific inspection expected from a complete desktop application.

This plan turns Waves into a focused, single-session desktop WAP workbench. It prioritizes fast
entry into useful WAP content, safe favorites and application state, truthful recovery, native
desktop behavior, and a bounded WAP inspector without turning Waves into a modern HTML browser or
moving WML/WBXML behavior into the wrong layer.

This document is a product and implementation-planning authority. It does not activate proposed
work-item IDs or replace status in:

- `docs/waves/WORK_ITEMS.md`;
- `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`;
- `docs/waves/ENGINE_DEBUG_CONNECTOR_PLAN.md`;
- `docs/waves/PUBLIC_WAP_LAB_PRERELEASE_PLAN.md`; or
- `docs/waves/wap-1.2.1-compliance-program.json`.

When a proposed slice is authorized, adopt it into the owning ledger rather than tracking its
execution status here.

## 2. Contacts

| Contact                 | Role                         | Responsibility                                                                      |
| ----------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| Dylan Steele            | Product owner and maintainer | Product decisions, release scope, public-service authorization, supported platforms |
| Browser product owner   | To assign per slice          | Shell, application state, favorites, settings, commands, accessibility              |
| WaveNav engine owner    | To assign per slice          | Frame/input semantics, debug recorder, runtime parity                               |
| Lowband transport owner | To assign per slice          | Request lifecycle, phase metadata, cancellation, WBXML/raw-payload boundaries       |
| Public WAP lab owner    | To assign before exposure    | Service availability, security notice, publication gate, rollback                   |
| Release/QA owner        | To assign before pre-release | Packaging, signing, end-to-end matrix, support artifacts                            |

## 3. Background

### 3.1 Product opportunity

Waves should feel like a deliberate native WAP/WML application rather than an emulator harness or a
website inside a Tauri window. The central emulation surface should preserve period-constrained WML
behavior while the host chrome provides modern reliability, accessibility, organization, and
diagnostics.

The product opportunity is:

> Help WAP/WML implementers, evaluators, preservationists, and learners discover, revisit, test,
> and diagnose authentic WAP content from a dependable desktop application without making them
> reconstruct configuration or interpret raw engine state on every launch.

### 3.2 Why now

The foundations required for application-quality work now exist:

1. The Rust transport owns HTTP/WAP fetch, connectionless WSP, WBXML decode, error mapping, and
   request bounds.
2. The engine owns deterministic deck/card navigation, focus, form editing, timers, scripts, and
   the canonical frame/affordance contract.
3. The browser has a responsive shell, native menus, accessibility evidence, local examples,
   hybrid history, stable navigation coordination, and a collapsed diagnostic drawer.
4. A private first-party WAP preview deployment and deterministic origin exist, although public
   publication remains gated.
5. The debug connector contract is generated and bounded, although its recorder, host lifecycle,
   and UI remain unimplemented.

These foundations make it possible to add application features without inventing parallel WML or
transport behavior in the frontend.

### 3.3 Current-state inventory

| Capability       | Implemented at the 2026-07-30 checkpoint                                                                                                                                     | Gap                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Desktop identity | Tauri identity and native menus plus one shared application-command registry and versioned native application-state store                                                    | Production packaging/updater, integrated window restore, and user-facing import/export workflows                  |
| Browsing shell   | Back, Reload, location, Go/Stop lifecycle, Local/Network, route/profile readouts, Canvas handset stage, status, Welcome/Help, and local examples                             | Integrated Home/Favorites/Services Library, visible history, recent locations, and Preferences surface            |
| Runtime path     | Transport-first engine load, deterministic session state, bounded single-pass frame output, Canvas rendering, cancellable navigation, and atomic committed-frame publication | F2 pointer/scroll/softkey cutover and final legacy-path removal                                                   |
| History          | In-memory engine card history plus request-shaped host deck history                                                                                                          | Persistence, search, retention policy, and duplicate same-card preservation across deck replacement (`#450`)      |
| Diagnostics      | Existing host timeline/export plus bounded, masked engine-owned D0-02 event recorder and snapshots                                                                           | Safe export projection (`#506`), D0-03 host sessions, D0-04 Inspector consumption, filters, and controlled replay |
| Settings         | Versioned schema/store, native atomic backend, migration, reset/clear operations, and memory test adapter                                                                    | Integrated Preferences UI, complete window restore, and diagnostic/accessibility controls                         |
| Onboarding       | Welcome/Help, tutorial deck, and migration of the isolated launch preference into versioned application state                                                                | Broader task progress and contextual onboarding remain later work                                                 |
| Public services  | Private exact-host deployment, deterministic first-party origin, safe Favorites/service-catalog domain, and publication-state model                                          | Public authorization, guided entry, external verification, and desktop release gates remain open                  |

### 3.4 Current overlap and blockers

At the synchronized `eaf8fc0e` baseline:

- PRs `#502` and `#517` through `#528` are merged. The redesigned shell, canonical Canvas/frame
  path, cancellation, bounded render/IPC surfaces, Favorites domain, application state, native
  command registry, and engine debug recorder are the current integration baseline. The
  open/draft PR queue is empty at this checkpoint.
- Issue `#450` blocks persistent/searchable history because same-card entries can be lost across a
  deck boundary.
- Issues `#466` and `#467` affect trustworthy application error state and failure classification.
- Issue `#506` blocks safe diagnostic sharing, while `#504` follows it on the same
  presenter/history surface.

Independent streams retain their own responsibilities:

- the landed visual/shell baseline owns shell structure and presentation only;
- browser resilience owns lockup, failure containment, and current correctness issues;
- the WAP testing CLI owns batch execution, corpus traversal, scripting, and conformance reporting;
- the public-service stream owns deployment, service content, publication state, and rollback; and
- frame migration owns engine-rendered presentation, hit regions, and typed input semantics.

### 3.5 Product and architecture constraints

1. Waves is a WAP/WML browser and emulator, not a general modern browser.
2. The browser must not parse WBXML, resolve WML tasks, or create a second WML DOM/runtime.
3. The engine must not fetch network content.
4. The transport must not own user-interface state or rendering.
5. Browser-hosted WASM remains network-free.
6. The first pre-release remains one browsing session in one primary application window.
7. Public WAP service entry must remain disabled or clearly unavailable until publication gates
   authorize it.
8. Credentials, authorization headers, cookies, sensitive form values, and POST bodies are not
   ordinary application state.
9. Deterministic behavior and native/WASM parity outrank animation or decorative authenticity.
10. New feature breadth must not displace active P0/P1 compliance work without an explicit priority
    decision in the canonical sprint plan.

## 4. Objective

### 4.1 Objective statement

Make the first Waves desktop pre-release useful as a daily WAP testing and exploration tool while
preserving its protocol authenticity, retro-hybrid identity, deterministic runtime behavior, and
strict layer ownership.

### 4.2 Key results

1. A new user can open a working bundled deck and identify the navigation controls in under 60
   seconds without external documentation.
2. A returning user can reopen a favorite or recover a safe prior local/GET context within two
   actions after launch.
3. A technical user can identify the failing layer and export a sanitized support artifact in under
   two minutes for the representative timeout, content/decode, invalid-deck, and script-trap cases.
4. Every enabled browser-owned command is keyboard reachable, visibly focused, and produces the
   same application action as its menu/button equivalent.
5. Slow or failed navigation always shows a truthful phase or layer, preserves the last committed
   frame when safe, and offers at least one valid recovery action.
6. Corrupt, absent, or future-version application state never prevents the stable shell from
   appearing.
7. Automated canary-secret tests find no credentials, sensitive headers, POST bodies, password/PIN
   values, or raw content in default persisted/exported artifacts.
8. The browser continues to perform no WML parsing, navigation semantics, focus resolution, WBXML
   decode, or gateway protocol behavior.

### 4.3 Non-goals for the first pre-release

- modern HTML browsing;
- tabs or multiple concurrent engine sessions;
- cloud accounts or synchronized state;
- a remote or mutable debugger;
- a general automation/conformance runner in the UI;
- arbitrary third-party archive browsing;
- full device-profile catalog;
- automatic POST replay; and
- automatic updates before signing and update-channel ownership are mature.

## 5. Market segments

### 5.1 WAP/WML implementer or deck author

Job: load representative decks, inspect exact behavior, test forms/navigation/scripts, and explain
failures without switching between many ad hoc tools.

Needs:

- quick access to examples and first-party services;
- route/profile visibility;
- trustworthy diagnostics;
- repeatable favorites and safe state; and
- no browser-host interpretation that hides engine or transport behavior.

### 5.2 Emulator evaluator or protocol engineer

Job: compare native/WASM/runtime/transport outcomes and create actionable bug artifacts.

Needs:

- correlated bounded events;
- raw transport metadata and optional bytes;
- decoded source and runtime state kept in distinct views;
- deterministic export; and
- clear compatibility-profile and network-route identity.

### 5.3 Preservationist or researcher

Job: study period interaction patterns and evidence-backed handset behavior without confusing a
reference profile with a specific historical device.

Needs:

- authentic behavioral defaults;
- evidence-labeled device profiles later;
- safe first-party period-service demonstrations; and
- stable screenshots or diagnostic evidence.

### 5.4 Curious learner

Job: understand decks, cards, focus, forms, and the difference between Local and Network without
reading repository documentation first.

Needs:

- a clear Home experience;
- bundled tutorial decks;
- plain-language errors; and
- optional help that does not obstruct returning users.

### 5.5 Preview maintainer or support tester

Job: reproduce a tester report, distinguish client/service/network failures, and collect useful
evidence without receiving secrets.

Needs:

- versioned sanitized bundles;
- build/profile/route metadata;
- bounded logs and retention; and
- reproducible first-party scenarios.

## 6. Value propositions

| User need                           | Waves value                                                                                                            | Differentiation                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Reach authentic WAP content quickly | One Home surface for bundled examples, authorized first-party services, favorites, and safe recents                    | WAP-focused entry rather than a generic modern-browser new-tab page |
| Return to work safely               | Versioned settings, window state, favorites, and policy-limited session recovery                                       | Desktop continuity without automatically replaying unsafe requests  |
| Explain WML/WBXML behavior          | Network, bytes, decoded source, deck/card/frame, variables, timers, scripts, and errors remain distinct but correlated | A WAP-aware inspector rather than DOM-centric web DevTools          |
| Trust failures and recovery         | Stable phases, true cancellation, last-good-frame retention, layer-specific messages, safe next actions                | Product behavior mirrors the real transport/engine pipeline         |
| Use a native application            | Platform menus, shortcuts, Preferences, About/support actions, native import/export                                    | Native affordances backed by one command model, not web-only chrome |
| Preserve historical purpose         | Reference-handset behavior remains engine-owned; later named profiles require evidence                                 | Behavioral authenticity without pretending one handset defines WAP  |

## 7. Solution

### 7.1 Experience model and surface decision

Use one primary application shell:

```text
Waves window
|-- Native menu and shared application commands
|-- Navigation/location controls
|-- Main handset stage
|-- Library surface
|   |-- Home
|   |-- Favorites
|   |-- Recent safe locations (later, after history policy)
|   `-- Bundled and authorized first-party services
|-- Preferences sheet/panel
|-- Status and recovery presentation
`-- Separate Inspector drawer
    |-- Network
    |-- Bytes
    |-- Source
    |-- Deck/Runtime
    |-- Events
    `-- Errors/Export
```

Surface choices:

1. Home, Favorites, bundled examples, and later safe recents belong in an integrated Library
   surface because they are ordinary browsing aids.
2. Preferences belongs in an integrated sheet or panel opened from the native application menu.
   The current frontend has no router, so a web-style settings route adds state complexity without
   product value.
3. Developer tools remain a separate top-level Inspector drawer so normal browsing never resembles
   a debug console. A detachable native Inspector window is a later option after host debug-session
   ownership is stable.
4. Do not create several Tauri windows in the first release. The current application owns one
   in-process engine and one frontend lifecycle; multiple windows would require new synchronization,
   focus, session, and stale-state policy.

### 7.2 Opportunity Solution Tree

```text
Outcome: Waves is a useful, trustworthy desktop WAP browser
|
|-- Opportunity: Reach meaningful content quickly
|   |-- Bundled example and first-party service Home
|   |-- Favorites with fragments and duplicate handling
|   |-- Recent safe locations
|   `-- Validate: first-deck and repeat-visit task timing
|
|-- Opportunity: Return without reconstructing the workspace
|   |-- Versioned preferences
|   |-- Window/display restoration
|   |-- Safe local/GET session restore
|   `-- Validate: restart, corrupted-state, and migration exercises
|
|-- Opportunity: Understand what a WAP deck and gateway did
|   |-- Network/response/hex/decoded-source inspector
|   |-- Deck/card/focus/variables/timers/script views
|   |-- Correlated bounded timeline
|   `-- Validate: diagnose seeded transport/runtime failures
|
|-- Opportunity: Recover confidently from failure
|   |-- True cancellation and truthful phases
|   |-- Last-good-frame retention
|   |-- Layer-specific recovery actions
|   `-- Validate: timeout/cancel/decode/trap fault injection
|
`-- Opportunity: Feel like a native desktop application
    |-- Shared commands and platform menus/shortcuts
    |-- Preferences and About/support actions
    |-- Native open/save for import/export
    `-- Validate: keyboard-only and platform-convention review
```

### 7.3 Product-trio idea set

#### Product Manager perspective

1. Curated WAP Home combining bundled examples, authorized public-lab services, favorites, and safe
   recent locations.
2. Safe favorites with fragments, duplicate resolution, versioned import/export, and explicit
   invalid-entry handling.
3. Safe workspace continuity: settings, window state, and local/GET-only restore after exit or
   crash.
4. WAP diagnostic bundles that make tester reports reproducible without manual log collection.
5. Truthful navigation lifecycle with cancellation, phases, last-good-state retention, and
   actionable recovery.
6. Profile-aware preferences that distinguish ordinary application choices from protocol-changing
   diagnostic overrides.

#### Product Designer perspective

1. An integrated Library for Home, Favorites, safe Recents, and bundled examples that never appears
   inside the LCD.
2. A separate Inspector with Network, Bytes, Source, Runtime, Events, and Errors views.
3. A compact Preferences surface with Basic, Accessibility, Network, and Developer groups.
4. Layer-specific recovery presentation that preserves the handset and offers Retry, Details,
   Change Route, or Return.
5. A discoverable shortcut reference and native menu structure before a command palette.
6. An optional accessible reading panel derived from the engine frame outside the emulation
   surface.

#### Software Engineer perspective

1. Versioned host-managed application state with migration, corruption recovery, atomic writes,
   and browser/test adapters.
2. A safe persistence projection that excludes secrets, POST bodies, sensitive headers, and raw
   diagnostic content.
3. The engine-owned bounded debug recorder already designed by `D0-01`.
4. Stable request identity, phases, and cancellation across Rust, generated contracts, Tauri, and
   navigation state.
5. Shared command IDs used by native menus, frontend controls, and keyboard shortcuts.
6. A typed service catalog containing availability, safety notice, required profile, and
   publication state.
7. A sanitized `.waves-session.json` format usable by the Inspector and future WAP testing CLI.

### 7.4 Prioritized feature set

Scoring uses strategic alignment 30 percent, expected impact 30 percent, feasibility 20 percent,
and differentiation 20 percent. Each input is rated from 1 to 5.

| Rank | Idea                                         | Alignment | Impact | Feasibility | Differentiation | Weighted score |
| ---: | -------------------------------------------- | --------: | -----: | ----------: | --------------: | -------------: |
|    1 | WAP Home and safe Favorites                  |         5 |      5 |           4 |               4 |            4.6 |
|    2 | WAP Inspector and safe diagnostic bundle     |         5 |      5 |           2 |               5 |            4.4 |
|    3 | Truthful fetch lifecycle and recovery        |         5 |      5 |           3 |               4 |            4.4 |
|    4 | Durable settings and safe workspace recovery |         5 |      5 |           3 |               3 |            4.2 |
|    5 | Native command surface                       |         4 |      4 |           4 |               3 |            3.8 |

Implementation order differs from value rank because application state, transport, and debug
contracts are prerequisites.

### 7.5 WAP Home and safe Favorites

#### Value

Give Waves an immediately useful launch purpose and let users return to a precise card or deck
without rebuilding context.

#### Version 1 behavior

1. Use a flat, searchable list. Defer folders and tags until real collections show a need.
2. Store a user title and target. Network URLs retain meaningful fragments.
3. Support `wap:`, `waps:`, `http:`, `https:`, and typed product-owned local-example targets.
4. Detect duplicates by canonical target plus any future explicit profile binding. Offer Replace,
   Keep Both, or Cancel rather than silently discarding either record.
5. Keep invalid or unsupported imported records in a quarantined state with an explanation. Never
   navigate them automatically.
6. Use versioned JSON import/export first. Generic browser bookmark formats are later work because
   they cannot preserve WAP-specific metadata reliably.
7. Store URL/title only by default. Reserve an optional `profileId` field for later evidence-backed
   device profiles, but do not expose it while only the Class C reference exists.
8. Never store headers, cookies, authorization, POST context, gateway credentials, form values, or
   runtime variables in a favorite.
9. First-party public services remain disabled/unavailable until the public-lab publication gate
   enables them.

#### Assumptions

- Target users revisit a small number of decks often enough for favorites to matter.
- Flat search is adequate for the first 20 to 50 records.
- Bundled and first-party entry provides more initial value than generic open-web discovery.

#### Validation

Test three tasks with five to eight target users: open a bundled deck, save the active card, and
return to it after restart. At least 80 percent should finish without external help.

### 7.6 WAP Inspector and diagnostic bundle

#### Value

Provide the product's strongest differentiation: a WAP-aware explanation surface instead of a
DOM-centric web inspector or a raw JSON dump.

#### Inspector views

1. `Network`: URL, method, resource target, gateway/route, selected profile, attempts, stable phase
   timings, response metadata, byte size, and correlation ID.
2. `Bytes`: bounded hex view derived from raw bytes supplied by the transport. The frontend does not
   parse WBXML.
3. `Source`: read-only WML already decoded by the transport.
4. `Deck`: engine-provided deck/card/frame metadata, active card, focus, selection, logical
   affordances, and Back availability.
5. `Runtime`: engine-masked variables, pending external intent, timers, form edit state, and script
   status.
6. `Events`: correlated host, transport, engine, script, and render events with filters and bounded
   retention.
7. `Errors`: stable layer/category, related request/card, last completed phase, and safe recovery.
8. `Export`: versioned sanitized bundle. Raw bytes, decoded source, arbitrary response content, and
   form values are excluded by default.

#### Retention and performance

- Engine debug collection remains disabled and inert until local policy and an attached Inspector
  session enable it.
- Poll only while the Inspector is open.
- Preserve the `D0-01` fixed-capacity, drop-oldest, cursor-based model.
- Bound host/transport evidence by event count and byte budget; never retain unlimited response
  bodies.
- Inspector open/close and poll cadence must not change runtime event order or state.

#### Redaction

- Engine values are masked before entering debug DTOs.
- Transport/host headers and bodies are sanitized before entering an export DTO.
- Frontend masking is a defense-in-depth presentation step, not the primary security boundary.
- Raw/source inclusion requires an explicit per-export opt-in and warning because arbitrary content
  cannot be reliably made non-sensitive automatically.

#### Replay

Replay is a later, fixture-backed feature. It must not send arbitrary network traffic, replay POST
bodies, or bypass normal engine/transport contracts. The WAP testing CLI may consume the same
capture schema but retains batch/conformance execution ownership.

#### Validation

Seed timeout, unsupported content, WBXML decode, invalid WML, and script-trap cases. Target users
should identify the correct failing layer in under two minutes without terminal access.

### 7.7 Truthful fetch lifecycle and recovery

Implement the existing `WBP-10` and `WBP-11` contracts rather than creating competing tickets.

Required behavior:

1. A stable request identity and deterministic cancel/completion race.
2. Truthful Preparing, Connecting, Gateway, Decode, Deck, and Card phases where supported by the
   owning layer.
3. Go changes to Stop only when the underlying request is actually cancellable.
4. The previous committed frame remains visible during a new load and recoverable failure.
5. Errors identify the failing layer and correlation ID without injecting a fake WML card.
6. Every error offers a valid action such as Retry, Change Route, Details, or Return.
7. A stale/cancelled response cannot alter engine, history, status, diagnostics, or persisted state.

Validation uses fault injection at connect, gateway, WBXML decode, engine load, and script execution
boundaries. Users should choose an accurate recovery action in at least 90 percent of cases.

### 7.8 Durable settings and safe workspace recovery

#### Versioned application state

Use one application-state envelope behind a host-capability interface:

```text
schemaVersion
settings
onboarding
favorites
windowState
safeSession
diagnosticPreferences
```

The frontend depends on an `ApplicationStateStore` interface. Native Tauri uses a host-managed
application-data backend; ordinary-browser stories/tests use a memory adapter or a deliberately
scoped browser adapter. Backend selection between an official Tauri store facility and a small
repository-owned atomic host adapter remains an implementation decision, but the schema and safety
contract must not depend on the backend.

#### Persisted settings

- display scale;
- host theme/high contrast/reduced motion;
- default Local/Network mode and Home/start behavior;
- developer mode and bounded retention preferences;
- safe-session restore preference;
- window bounds validated against available monitors;
- favorites; and
- onboarding state.

#### Safe session

Safe automatic restoration is limited to:

- a product-owned local example plus fragment/card target; or
- a committed GET location without credentials or sensitive headers.

Never persist/replay:

- POST bodies or POST history for automatic restoration;
- credentials, cookies, authorization, password/PIN values, or secret query values;
- an in-flight request;
- raw WML/WBXML diagnostic content; or
- arbitrary gateway credentials.

A crash marker distinguishes ordinary startup from recovery. The shell paints before storage,
decoder preflight, or network checks finish. Corrupt/unknown state offers a safe reset and preserves
the bad artifact only when that can be done without exposing secrets.

#### Diagnostic overrides

Timeout, retry, size, route, and constrained-network controls belong in an Advanced/Diagnostic
section with bounded values and a visible override indicator. They must not silently redefine the
selected compatibility profile.

### 7.9 Native command surface

Define stable command IDs and route native menu actions, browser controls, and keyboard shortcuts
through the same application handlers.

Recommended command groups:

- `File`: Home/Library, Import Favorites, Export Favorites, Export Diagnostic Bundle, Close/Quit;
- `Edit`: native text-editing roles;
- `View`: Reload, Library, Inspector, display scale, Reset View;
- `History`: Back, later safe Recents, Clear History;
- `Preferences`: platform-appropriate Preferences/Settings command;
- `Help`: Help, Shortcut Reference, Check for Updates placeholder, About.

Recommended shortcuts include platform-appropriate forms of location focus, reload, add favorite,
Preferences, Library, and Inspector. Shortcut routing must not steal text-entry or focused WML edit
input.

Do not add a command palette until the final command count or usability evidence shows that menus
and shortcuts are insufficient.

### 7.10 Privacy and security requirements

1. Serialization uses allowlisted safe DTOs; it never serializes a live session object graph by
   default.
2. `Authorization`, `Proxy-Authorization`, `Cookie`, `Set-Cookie`, credential-bearing URL userinfo,
   and sensitive query keys are removed before persistence/export.
3. POST payloads, request-intent postfields, form drafts, variables derived from masked inputs, and
   password/PIN values are excluded or masked at the owning boundary.
4. History, favorites, diagnostics, settings, and safe session use separate schemas and retention
   controls. Clearing one does not ambiguously clear or preserve the others.
5. Reset-to-defaults explains what it will clear and does not silently delete imported/exported
   files.
6. Gateway resource URI and gateway endpoint remain distinct concepts.
7. The public-lab UI states that the preview is unencrypted, WTLS is unsupported, and users must
   not enter real credentials or personal data.
8. No feature broadens the transport destination policy or creates an arbitrary WAP-to-web proxy.

The existing timeline export stores complete host session snapshots, while host history can contain
headers and request policy including POST context. Sanitizing this path is a prerequisite for
persisted history or expanded diagnostic export.

### 7.11 Accessibility requirements

- Preserve complete keyboard access and visible focus.
- Native menu, button, and shortcut forms of one command produce equivalent action results.
- Library, Preferences, recovery, and Inspector surfaces maintain WCAG 2.2 AA host-chrome goals.
- Status, failure, card change, recovery, import result, and reset result use the single live
  announcement path without duplicate announcements.
- Minimum target sizing, reduced motion, high contrast, default/minimum window evidence, and 200
  percent zoom/reflow remain covered.
- Display scale changes pixels only. Engine-owned viewport/layout remains authoritative.
- A future accessible reading panel derives from the canonical engine frame and stable actions; it
  does not independently interpret WML.

### 7.12 Assumptions to validate

1. Technical evaluators remain the primary launch segment.
2. Users revisit enough locations to justify Favorites before full visible history.
3. Flat Favorites search is sufficient for the first release.
4. URL/title-only favorites are sufficient while only the Class C reference profile ships.
5. Local automatic restore plus a network-restore prompt is safer and understandable.
6. Users value an integrated Inspector more than an external debugger or richer CLI-only flow.
7. Polling while open meets Inspector performance needs.
8. Native menus and shortcuts provide enough command discovery without a palette.
9. Public first-party services will be authorized and reachable in time for the desktop pre-release.
10. A host-managed application-data store can satisfy atomicity, migration, and testability without
    introducing a broad framework.

## 8. Release and implementation plan

### 8.1 Entry gates

Before feature UI begins:

1. Use the merged PR `#502` shell as the integration baseline; do not fork a competing root shell.
2. Keep one shell integration owner for root template, controller, copy, and global-style edits.
3. Sequence around `#450`, `#466`, and `#467`; `#434` is resolved by PR `#518`.
4. Do not persist visible history until the request/history identity problem in `#450` is fixed.
5. Do not expand diagnostic export until the safe projection/redaction boundary is implemented.
6. Respect the canonical sprint plan's P0/P1 WAP implementation priority and WIP limits.

### 8.2 Phase A: pre-release essentials

1. F1 primary frame rendering and deterministic navigation publication are complete in PRs
   `#519`, `#520`, and `#526`.
2. Cancellable/admission-controlled navigation is complete in PR `#521`; `WBP-11` phases and
   recovery presentation remain.
3. Versioned application state is complete in PR `#522`; safe projection, integrated settings,
   window restore, and local/GET-safe recovery remain.
4. The safe Favorites/service-catalog domain is complete in PR `#517`; WAP Home/Library UI remains.
5. Sanitize the existing timeline export and provide a minimal support bundle.
6. Shared native commands and platform shortcuts are complete in PR `#523`.
7. Complete public-lab desktop profile/resource separation and guided safety messaging only after
   its publication dependencies authorize them.
8. Complete the packaged desktop success/failure matrix, signing, checksums, and install guidance.

### 8.3 Phase B: next application-quality increment

- complete `D0-03` and `D0-04` on the landed D0-02 recorder for the WAP Inspector;
- add visible searchable history with explicit retention after `#450`;
- complete Favorites import/export UX;
- add broader Developer/Diagnostic preferences and redaction controls;
- add the semantic frame accessibility adapter and optional reading view; and
- promote native frontend E2E only after the scorecard's four-run/21-day gate passes.

### 8.4 Phase C: later differentiators

- evidence-backed Nokia 7110 and one selected Openwave handset/browser profile;
- controlled fixture-backed diagnostic import/replay;
- screenshot/frame export with profile/build metadata;
- optional detachable Inspector window;
- constrained-network simulation presets;
- safe first-party synthetic period-service gallery; and
- narrowly justified per-site compatibility policy without credentials or general web permissions.

### 8.5 Explicitly deferred or rejected

| Candidate                              | Decision                         | Reason                                                                    |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Tabs/multiple sessions                 | Defer                            | Single-session lifecycle, persistence, and Inspector must stabilize first |
| Modern HTML browsing                   | Reject                           | Conflicts with product purpose and architecture                           |
| Favorites folders/tags                 | Defer                            | Flat search should be validated before adding organization cost           |
| Cloud sync/accounts                    | Reject for pre-release           | Privacy, infrastructure, and product value are unproven                   |
| Command palette                        | Defer                            | Native menus and shortcuts should be tested first                         |
| Auto-update                            | Defer                            | Signing and update-channel ownership are not mature                       |
| Remote/mutable debugger                | Reject for MVP                   | Adds security and determinism risk; D0 is intentionally read-only/local   |
| Browser-side WBXML/WML semantics       | Reject                           | Violates layer ownership                                                  |
| UI conformance runner/crawler          | Reject                           | Duplicates the WAP testing CLI                                            |
| Third-party archive browser/open proxy | Reject without separate decision | Rights, abuse, authenticity, and security risks                           |
| Automatic POST/session replay          | Reject                           | Unsafe and non-idempotent                                                 |
| JSON-stored gateway credentials        | Reject                           | Secrets require a separately designed OS credential boundary              |

### 8.6 First parallel-safe implementation batch

Checkpoint at `eaf8fc0e`: `APP-STATE-01` (`#522`), `APP-FAV-01` (`#517`), `APP-CMD-01`
(`#523`), and D0-02 (`#524`) are implemented. `APP-PRIV-01` is the remaining Wave A security
boundary; `APP-SHELL-01` remains sequenced after it because both integrate shared browser state and
presentation. The table is retained as the ownership map for completed and remaining slices.

| Slice                                              | Initial owner               | Sequence | Main output                                                                        | High-conflict surfaces                                            |
| -------------------------------------------------- | --------------------------- | -------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `APP-STATE-01` Versioned desktop state             | browser/Tauri state owner   | Wave A   | Schema, store interface/backend, migration, reset, test adapter                    | Tauri command/capability files if host commands are used          |
| `APP-PRIV-01` Safe-state/export projection         | browser security owner      | Wave A   | Allowlisted persistence/export DTOs and canary-secret tests                        | Timeline/session integration; avoid active navigation error fixes |
| `APP-FAV-01` Favorites/service-catalog domain      | browser product-model owner | Wave A   | Favorite model, target validation, duplicates, import/export, publication metadata | New leaf modules; public catalog ownership                        |
| `APP-CMD-01` Shared application commands           | native-shell owner          | Wave A   | Stable command IDs, enabled state, menu/shortcut bridge                            | `bootstrap.rs`, menu constants, later shell handlers              |
| Existing `D0-02` debug recorder                    | engine owner                | Wave A   | Bounded engine events/snapshots and source masking                                 | Sequence with `#434`; engine boundary/runtime files               |
| `APP-SHELL-01` Library and Preferences integration | one shell integrator        | Wave B   | User-facing Home/Favorites/Preferences and command integration                     | Merged `#502` shell, copy, styles, and controller                 |

```text
Merged #502 shell baseline ------------------------------------+
APP-STATE-01 ------------------+                               |
APP-PRIV-01 -------------------+--> APP-SHELL-01 <--------------+
APP-FAV-01 --------------------+
APP-CMD-01 --------------------+

D0-02 --> D0-03 --> D0-04 (Phase B Inspector)
#450  --> persisted/searchable history (Phase B)
WBP-10 --> WBP-11 --> safe-session integration and release matrix
```

### 8.7 Ticket-ready first-batch slices

#### APP-STATE-01 Versioned desktop application state

1. `Owner`: `browser`, Tauri host boundary.
2. `Depends On`: the merged shell only for migration of its Welcome preference, not for core schema work.
3. `Build`:
   - define schema version 1 and `ApplicationStateStore`;
   - implement a native app-data backend with atomic replacement and a memory/test adapter;
   - persist settings, onboarding, favorites, window state, safe session, and diagnostic preferences
     only through typed safe DTOs;
   - migrate the isolated `waves.showWelcomeOnLaunch` value when present;
   - handle absent, corrupt, and future versions without delaying shell paint;
   - provide reset-to-defaults and component-specific clear operations.
4. `Accept`:
   - clean install, restart, v1 migration, corrupt file, future version, interrupted write, and
     removed-monitor fixtures pass;
   - no failed read prevents startup;
   - safe state contains no history request headers, POST context, raw payload, or runtime values;
   - browser stories remain deterministic through the test adapter.
5. `Risk`: storage backend choice could leak into frontend types or introduce non-atomic writes.
6. `Validation`: migration/corruption matrix plus ten repeated write/restart cycles.
7. `Suggested branch`: `codex/app-state-v1`.
8. `Suggested PR title`: `feat(browser): add versioned safe application state`.

#### APP-PRIV-01 Safe-state and diagnostic-export projection

1. `Owner`: browser security/application-state boundary.
2. `Depends On`: none for serializer design; integration precedes persisted history or new export.
3. `Build`:
   - replace whole live-session serialization with allowlisted persistence/export DTOs;
   - redact sensitive headers, URL userinfo, credential-like query fields, POST payloads/postfields,
     password/PIN values, and masked-variable derivations;
   - exclude raw bytes, decoded WML, response bodies, and arbitrary error internals by default;
   - define a versioned minimal support-bundle schema with build/profile/route/correlation metadata;
   - keep optional raw/source inclusion behind explicit per-export consent and size bounds.
4. `Accept`:
   - canary secrets inserted into every relevant live structure are absent from serialized text;
   - exports remain useful for at least timeout, decode, invalid-deck, and script-trap cases;
   - existing timeline chronology validation remains green;
   - frontend-only masking is not the sole boundary for engine or transport secrets.
5. `Risk`: over-redaction can make reports useless; under-redaction exposes tester data.
6. `Validation`: automated secret-canary suite plus review of five representative bundles.
7. `Suggested branch`: `codex/browser-state-redaction`.
8. `Suggested PR title`: `fix(browser): sanitize persisted and exported state`.

#### APP-FAV-01 Favorites and first-party service-catalog domain

1. `Owner`: browser product-model boundary.
2. `Depends On`: `APP-STATE-01` for persistence integration; domain work may start in parallel.
3. `Build`:
   - define favorite IDs, titles, typed targets, creation/update metadata, validation state, and a
     reserved optional profile identity;
   - retain URL fragments and type local examples separately from network URLs;
   - implement canonical duplicate detection and Replace/Keep Both/Cancel outcomes;
   - implement versioned JSON import/export with invalid-record quarantine;
   - define a typed first-party service catalog with publication state, security notice, required
     route/profile, and owner-provided availability;
   - keep folders/tags and generic browser formats out of v1.
4. `Accept`:
   - valid WAP/HTTP targets round-trip without losing fragments;
   - unsafe schemes, blank targets, credential-bearing URLs, malformed imports, and future schema
     versions fail safely;
   - duplicates are never silently dropped;
   - disabled/unpublished services cannot initiate navigation.
5. `Risk`: URL normalization can change WAP resource identity or erase meaningful fragments.
6. `Validation`: property-style normalization/round-trip tests plus a 50-record import fixture.
7. `Suggested branch`: `codex/wap-favorites-model`.
8. `Suggested PR title`: `feat(browser): define safe WAP favorites and service catalog`.

#### APP-CMD-01 Shared native application command registry

1. `Owner`: browser native-shell boundary.
2. `Depends On`: stable command names; visual integration uses the merged `#502` shell baseline.
3. `Build`:
   - define stable command IDs and enabled/disabled projection;
   - route native menu events, keyboard shortcuts, and frontend controls to the same handlers;
   - cover location focus, reload, add favorite, Library, Preferences, Inspector, Help, import, and
     export without advertising unavailable commands as functional;
   - preserve native text-editing roles and focused WML/host input behavior;
   - add a shortcut reference derived from the command registry.
4. `Accept`:
   - every enabled menu item and shortcut invokes the same observable action path as its button;
   - disabled commands cannot execute and communicate their state accessibly;
   - macOS and Linux mappings follow platform conventions;
   - no shortcut intercepts focused input/select/textarea editing incorrectly.
5. `Risk`: duplicated command logic or shortcut collisions create nondeterministic input behavior.
6. `Validation`: keyboard-only command matrix on macOS and Linux plus unit tests for enabled state.
7. `Suggested branch`: `codex/native-command-registry`.
8. `Suggested PR title`: `feat(browser): unify native menu and application commands`.

#### D0-02 Engine event stream and snapshot emitter

Use the existing ticket and contract unchanged.

1. `Owner`: `engine-wasm`.
2. `Depends On`: completed `D0-01`; sequence with issue `#434` where engine boundary files overlap.
3. `Build`: fixed-capacity drop-oldest ring buffer, deterministic sequence/cursor/drop accounting,
   declared event emission, bounded snapshot, and source-level masking.
4. `Accept`:
   - disabled/unattached execution is inert;
   - native/WASM event/snapshot parity passes;
   - consumer poll rate cannot affect runtime order;
   - masked/omitted values never carry original or truncated secrets.
5. `Validation`: ordering, overflow, cursor recovery, masking, and no-debug performance tests.
6. `Suggested branch`: `codex/d0-02-debug-recorder`.
7. `Suggested PR title`: `feat(engine): implement bounded debug recorder`.

#### APP-SHELL-01 Integrated Library and Preferences

1. `Owner`: one browser shell integrator.
2. `Depends On`: merged shell baseline, `APP-STATE-01`, `APP-PRIV-01`, `APP-FAV-01`, and `APP-CMD-01`.
3. `Build`:
   - add the integrated Home/Favorites/Services Library;
   - add Preferences for launch behavior, display scale, accessibility, safe restore, developer
     mode, and retention;
   - wire add/remove/open/import/export/reset through shared commands;
   - preserve normal navigation, route/profile truthfulness, and all existing shell landmarks;
   - keep Inspector integration out of this slice.
4. `Accept`:
   - users can open a bundled example, add/open/remove a favorite, import/export favorites, change
     a preference, and reset safely using keyboard only;
   - default/minimum windows and 200 percent zoom remain usable without overlap or horizontal
     scrolling;
   - announcements occur once;
   - no setting silently changes engine semantics or transport policy;
   - unpublished public services remain disabled with accurate explanation.
5. `Risk`: shared-shell edits collide with the merged shell/Developer Tools baseline or D0-04
   Inspector UI.
6. `Validation`: rendered accessibility audit, task-based usability check, and all Waves stories.
7. `Suggested branch`: `codex/wap-library-preferences`.
8. `Suggested PR title`: `feat(browser): add integrated favorites and preferences`.

### 8.8 Parallel ownership and conflict controls

| Stream                 | Owns                                                                       | Must not duplicate                                             | Main interface                               |
| ---------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Visual refinement      | Shell layout, visual hierarchy, tokens, responsive treatment               | Bookmarks/settings models, engine behavior, transport behavior | Stable shell insertion points and IDs        |
| Resilience/lockup      | Blocking paths, panic containment, state/error correctness                 | Feature breadth or visual redesign                             | Typed failure and lifecycle behavior         |
| WAP testing CLI        | Batch/corpus/conformance execution, scripting, report generation           | In-app interactive browsing/inspection UX                      | Sanitized capture schema and stable case IDs |
| Public services        | Deployment, routes, content, publication state, safety evidence            | Browser storage/navigation semantics                           | Typed service catalog/availability manifest  |
| Frame migration        | Frame rendering, hit regions, typed input, semantic adapter                | Host bookmarks/settings/commands                               | Generated engine frame/input contract        |
| Application completion | Favorites, settings, commands, safe state, Library, Inspector presentation | WML/WBXML/network semantics                                    | Host capabilities and generated contracts    |

Rules:

1. One owner integrates root shell, controller, copy, and global styles.
2. Frame and debug contract changes are sequenced; generated artifacts have one owner per migration.
3. Persistence never serializes live transport/engine structures directly.
4. Distinct domain modules and engine recorder work may proceed against the stable merged shell baseline.
5. The service catalog consumes deployment-owned status rather than inferring availability.
6. CLI and Inspector share artifacts, not control flow or feature ownership.

### 8.9 Release exit criteria

The desktop application-completion pre-release is ready when:

1. The primary viewport uses the canonical engine frame path without deck-content HTML injection.
2. Local and supported network navigation show truthful progress, real cancellation, and safe
   recovery.
3. The shell paints and remains usable with absent, corrupt, or future-version application state.
4. Settings, window state, onboarding, Favorites, and safe local/GET session recovery behave
   predictably.
5. Public-service entries appear only under an authorized, tested publication state with explicit
   unencrypted/no-real-credentials messaging.
6. Browser-owned commands work through native menus, keyboard, and visible controls without
   stealing WML edit input.
7. Default support artifacts are bounded and pass the secret-canary suite.
8. Host chrome remains keyboard accessible and passes the declared rendered accessibility checks.
9. The packaged app passes representative bundled, public GET, supported POST, timeout, decode,
   invalid-deck, script-trap, cancellation, and recovery flows.
10. No feature crosses engine, transport, browser, or public-service ownership boundaries.

### 8.10 Decisions to resolve with the product owner

| ID           | Decision                                     | Recommended default                                                                                                                      | Why it remains open                                                                      |
| ------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `DEC-APP-01` | Native persistence backend                   | Host-managed app-data store behind `ApplicationStateStore`; choose official Tauri store vs. small atomic host adapter in a bounded spike | Atomicity, migration control, dependency policy, and browser-test parity need comparison |
| `DEC-APP-02` | Safe restore default                         | Restore local content automatically; prompt before restoring a network GET after crash                                                   | Balances continuity with unexpected network activity/privacy                             |
| `DEC-APP-03` | Persistent history in first pre-release      | Do not persist full history; ship Favorites plus safe last session first                                                                 | `#450` remains open and history carries sensitive request identity                       |
| `DEC-APP-04` | Bookmark profile context                     | Reserve optional `profileId` in schema but do not expose it until a second profile exists                                                | Avoids premature UI while preserving migration room                                      |
| `DEC-APP-05` | Public service visibility before publication | Show only bundled content by default; optionally show disabled “Preview unavailable” entries                                             | The public deployment is private and publication-gated                                   |
| `DEC-APP-06` | Engine debug enablement                      | Disabled by default; enable only while local Developer mode and Inspector session are active                                             | Preserves determinism, performance, and privacy                                          |
| `DEC-APP-07` | Raw/source diagnostic export                 | Excluded by default; explicit one-export opt-in with warning and byte bound                                                              | Arbitrary content cannot be reliably sanitized                                           |
| `DEC-APP-08` | First supported desktop platforms            | Owner must select before packaging work                                                                                                  | Signing, notarization, QA matrix, and menu conventions depend on it                      |
| `DEC-APP-09` | Command palette                              | Do not build until menu/shortcut usability shows a gap                                                                                   | Current command volume does not justify another interaction model                        |
| `DEC-APP-10` | Favorites folders/tags                       | Flat list and search first                                                                                                               | Need evidence from real collections before adding organization complexity                |

### 8.11 Evidence reviewed

Active documents:

- `AGENTS.md`;
- `docs/agents/AGENT_STANDARDS.md`;
- `docs/waves/WAVES_DESKTOP_PRODUCT_DESIGN.md`;
- `docs/waves/WAVES_BROWSER_PRODUCT_IMPLEMENTATION_PLAN.md`;
- `docs/waves/WAVES_BROWSER_BASELINE.md`;
- `docs/waves/PUBLIC_WAP_LAB_PRERELEASE_PLAN.md`;
- `docs/waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md`;
- `docs/waves/WAP_1_2_1_PLANNING_BASELINE.md`;
- `docs/waves/WORK_ITEMS.md`;
- `docs/waves/USABILITY_RESILIENCE_BACKLOG.md`;
- `docs/waves/USER_ONBOARDING_EXPERIENCE_PLAN.md`;
- `docs/waves/ENGINE_DEBUG_CONNECTOR_PLAN.md`;
- `docs/waves/ENGINE_DEBUG_CONNECTOR_RESEARCH.md`;
- `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`;
- `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`;
- `docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md`;
- `docs/waves/ARCHIVAL_WAP_SERVICE_INCORPORATION_PLAN.md`;
- `docs/waves/TECHNICAL_ARCHITECTURE.md`;
- `docs/browser-emulator/TAURI_PROFESSIONAL_POLISH_EXPLORATION.md`; and
- `browser/README.md`.

Code and contracts:

- browser frontend bootstrap/application, shell and leaf templates, controller, presenter,
  navigation state, history, timeline, defaults/config, examples, keyboard routing, command/event
  bindings, scale control, styles/tokens, and package manifest;
- Tauri bootstrap, command adapters, configuration, Cargo manifest, capabilities, and generated
  command inventory;
- transport app/generated contracts, generated engine frame/debug DTOs, generated Tauri client,
  and `engine-wasm/contracts/wml-engine.ts`; and
- merged PR `#502` shell and Welcome-preference implementation.

Archive folders and date-stamped historical snapshots were excluded as normative sources.
