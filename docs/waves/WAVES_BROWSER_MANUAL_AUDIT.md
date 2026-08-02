# Waves Browser Functionality and Manual Audit

Status: active pre-alpha test guide

Audit baseline: `origin/main` at `74432d27` on 2026-08-02

Purpose: make exploratory browser testing reproducible and turn each genuine oddity into a small,
well-owned work item. This guide audits active product behavior only; archived plans and historical
snapshots are not normative.

## Know which build you are testing

Always record the exact commit and any stacked pull requests. The 2026-08-02 baseline and pending
desktop work differ materially:

| Surface                                                                        | Current `main`                                           | Pending change                                                  |
| ------------------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------- |
| Native shell, address bar, Local/Network modes, Welcome/Help, handset viewport | available                                                | retained                                                        |
| Engine-owned frame, Canvas renderer, click regions                             | available                                                | retained                                                        |
| Back/Reload/Go and request-shaped history                                      | available, including typed POST replay                   | native replay evidence remains                                  |
| Long-deck movement                                                             | deterministic viewport scrolling available               | native scrolling evidence remains                               |
| Keyboard, buttons, pointer, and softkey routing                                | split legacy/F2 paths                                    | `#543` unifies engine input routing                             |
| Loading and recovery                                                           | basic loading/error state                                | `#544` adds phase-aware presentation and recovery actions       |
| Library, Favorites, Preferences                                                | state/model foundation exists; menu entries are disabled | `#545` enables integrated surfaces and safe import/export/reset |
| Inspector, bounded timeline, safe capture export                               | available                                                | retained                                                        |
| Crash marker and safe-session recovery offer                                   | not implemented (`WBP-12`)                               | no pending PR                                                   |
| `.waves-session.json` import/replay and 1,000-step memory gate                 | not implemented (`WBP-13`)                               | no pending PR                                                   |
| Signed/notarized packaged build and packaged VoiceOver result                  | not available                                            | no pending PR                                                   |

An observation against a stacked or locally modified build must not be filed as a `main` regression.

## Test record header

Start every session with this block. One header can cover several findings from the same run.

```text
Build commit:
Additional PRs/changes:
Launch kind: Tauri dev | debug binary | packaged app | browser story
OS and version:
CPU architecture:
Display size/scaling:
Window size and app zoom:
State: clean | existing | deliberately corrupt
Run mode: Local | Network
Target URL or local example:
Transport profile and fallback:
Gateway/origin setup:
Developer mode/debug policy:
```

For network runs, note whether the route is the controlled local Kannel stack, a published
first-party service, or another endpoint. Never describe a local fixture as a real-gateway result.

## Recommended audit tour

Run the short core tour first. Continue into the focused sections when the core is stable. A result
is `pass`, `oddity`, `blocked`, or `not-applicable`; `blocked` must name the prerequisite.

### 1. Startup and shell

- Launch with clean state. The shell should paint before any network result and remain operable if
  gateway preflight fails.
- Confirm native title/menu identity, minimum/default window usability, and absence of a second
  faux application frame.
- Open and close Welcome/Help. Try Tour, Local examples, and Connect to a WAP server.
- Switch Local/Network modes repeatedly. The visible source, route, profile, and available primary
  action must stay truthful.
- Exercise address focus, Reload, Inspector, and Help through both visible controls and platform
  shortcuts. Focused host text fields must retain ordinary typing/editing shortcuts.

### 2. Local WML runtime

- Load `Your First Deck`; traverse it with viewport focus, Up/Down/Enter, and visible handset
  buttons.
- Load `Basic`; follow a fragment link, an external intent, and Back until history is empty.
- Load `F2-01 Deterministic Click Input`; compare pointer activation with keyboard activation.
- Load `Wrap Stress`; traverse all focusable content with wheel/trackpad and long jumps, and watch
  for clipping, stale focus, or content that cannot be brought into view.
- Load text/select form examples. Test edit, cancel, commit, empty values, maxlength, password
  concealment, and submission intent.
- Load timer and script examples. Confirm timers do not interleave visibly with an in-flight input
  action and recoverable script failures do not crash or silently navigate.

### 3. Controlled gateway path

Use the same local stack as `make smoke-native-tauri-kannel-ui` when practical.

- Load `wap://localhost/`, enter the menu, and open the static example.
- Load Pocket Portal and follow its fragment directory link.
- Load Preferences and Interop examples; confirm content type, final address, route, and active card
  in Developer Tools.
- Repeat one navigation and watch origin metrics for duplicate requests.
- Exercise GET, form-urlencoded POST, and Back. Confirm Back replays the typed POST identity and
  never changes method/body semantics.
- Return to a known-good deck after every injected failure.

### 4. Navigation, input, and scrolling

- Compare each action through physical keyboard, visible handset button, pointer hit region, and
  dynamic softkey where applicable. Outcomes should agree; input source must not change engine
  semantics.
- Test focused host controls separately from the WML viewport. Arrow, Enter, Backspace, text,
  modifier, and composition input must reach the correct owner.
- Test same-card duplicates, repeated fragments, cross-deck Back, failed Back loads, Reload, and
  Back at the beginning of history.
- On current `main`, test wheel/trackpad, keyboard traversal, wrapped links, top/bottom clamping,
  stale frame clicks, empty-space clicks, and input/select controls at scrolled positions. With
  `#543` present, repeat activation through keyboard, buttons, and pointer to verify unified routing.

### 5. Loading, cancellation, and recovery

This section is partial until `#544` merges and the controlled fault routes exist.

- Start a slow request. The previous committed frame should remain visible and feedback should be
  immediate; delayed phase presentation should not flicker on fast loads.
- Confirm Go changes to Stop only while cancellation is real. Cancel and verify no late response
  mutates frame, history, status, or persisted state.
- Exercise invalid address, timeout, transport failure, decode failure, invalid deck, script trap,
  and a successful retry. Record the visible phase/category, correlation ID, offered recovery
  actions, and whether the last good frame survived.
- Try a second navigation while one is active. Only the current generation may commit.

### 6. Library and Preferences

This section applies only when `#545` is present.

- Open Library from menu and shortcut. Load a bundled example and add/open/remove a Favorite.
- Import valid, duplicate, malformed, sensitive, and over-limit favorite sets. Unsafe entries must
  be quarantined or rejected without replacing safe data. Exported data must contain no secrets.
- Confirm unpublished Services are visibly disabled and explain why.
- Change launch behavior, display scale, high contrast, reduced motion, developer mode, timeline
  retention, and safe restore policy. Relaunch and confirm only the documented safe values persist.
- Exercise component clears and the two-step full reset. Cancel once, then confirm; the current
  committed deck should remain visible and unsafe sessions must not replay.

Do not file missing safe-session crash recovery as an APP-SHELL regression; it remains `WBP-12`.

### 7. Developer Tools and diagnostics

- Toggle the docked Inspector and open its separate window. Opening, closing, or changing tabs must
  not change runtime ordering, focus, navigation, or timer behavior.
- Exercise Overview, Transport, Runtime, Inspector, Timeline, and Source panels. Arrow/Home/End tab
  navigation and focus return should be predictable.
- Run Health, Render, Snapshot, clear intent, clear/export timeline, raw WML load, and the
  default-disabled engine debug session boundary.
- Export a safe capture after a seeded failure. Inspect it before attaching: credentials, cookies,
  sensitive query values, POST bodies, password values, and raw secrets must be absent.
- Record cursor gaps, retention behavior, window/docked synchronization, and any mismatch between
  visible state and diagnostic state.

### 8. Accessibility and resilience

- Traverse the whole shell with Tab/Shift+Tab at default and minimum windows. Every enabled control
  must be reachable, visible, and have an obvious focus indicator.
- Repeat at effective 200 percent zoom, high contrast, and reduced motion. Check horizontal
  overflow, clipped controls, target size, and whether the LCD remains usable by vertical scroll.
- Confirm loading, failure, and toast-only events use one announcement channel and do not duplicate
  spoken/status output.
- Resize aggressively during navigation and while Developer Tools are open. No panic, blank shell,
  lost current frame, or unbounded layout loop is acceptable.
- Packaged VoiceOver behavior remains `blocked`, not `pass`, until packaging exists and the manual
  procedure in `WAVES_BROWSER_ACCESSIBILITY_EVIDENCE.md` is recorded.

## Capture an oddity

Prefer one observable problem per report. Combine symptoms only when the same short reproduction
proves they are one failure.

```text
Title: [Browser] <specific observed failure>

Build/environment:
Starting state:
Target deck/URL:

Steps:
1.
2.
3.

Expected:
Actual:
Reproduction: always | intermittent (<rate>) | once
Regression: yes (<known-good>) | no | unknown

Visible phase/category/correlation ID:
Last good frame preserved: yes | no | not applicable
Likely layer: shell | browser state | engine/runtime | transport/gateway | evidence harness | unknown

Attachments:
Privacy check completed: yes | no
```

Use the repository's **Browser oddity** issue form when filing directly in GitHub.

### Severity guide

| Priority | Use when                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `P0`     | crash/data loss, secret exposure, unsafe automatic replay, or a release-blocking security failure                                          |
| `P1`     | core load/navigation/input path is blocked, content/history is silently wrong, cancellation commits stale state, or recovery is impossible |
| `P2`     | important behavior is degraded but a reliable workaround exists, including accessibility failures on a supported path                      |
| `P3`     | localized polish, wording, discoverability, or low-impact visual inconsistency                                                             |

### Ownership hints

- Shell/menu/Library/Preferences/accessibility presentation: `browser/frontend` or Tauri shell.
- WML navigation, focus, input, script, timer, frame, or render semantics: `engine-wasm`.
- WBXML, request serialization, timeout, retry, destination policy, or protocol behavior:
  `transport-rust`/gateway.
- Only assign a layer when evidence distinguishes it. `unknown` is better than an incorrect
  cross-layer ticket.

## Known gaps that are not fresh oddities

Do not open duplicates for these without a narrower new symptom:

- WBP-14 native timeout, cancellation, invalid-deck, and script-trap evidence;
- WBP-12 crash marker and safe-session recovery offer;
- WBP-13 sanitized session import/replay and bounded 1,000-step replay;
- packaged signing/notarization and packaged screen-reader evidence;
- history search/safe recents, multi-window browsing, and named handset profiles; and
- the explicit WTP/compliance mapping gaps recorded by the canonical compliance program.

The current WBP-14 audit is tracked separately in `WBP_14_DESKTOP_PATH_EVIDENCE.md` and should be
updated as evidence lands rather than reinterpreted from manual notes.
