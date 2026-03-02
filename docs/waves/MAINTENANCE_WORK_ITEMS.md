# Waves Maintenance Work Items

Purpose: track maintenance, quality, and technical-debt work that should be folded into normal delivery.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

## How To Use

1. Keep items scoped and testable.
2. Link each item to concrete files and acceptance checks.
3. Prefer pairing one maintenance item with each feature/contract ticket when feasible.

## Current Queue

### M0-01 Parser tag-boundary hardening (`<prev/>` false-positive)

1. `Status`: `done`
2. `Files`:
- `engine-wasm/engine/src/parser/wml_parser.rs`
3. `Build`:
- Enforce strict tag-boundary checks so `<prev/>` is not parsed as `<p...>`.
4. `Tests`:
- Regression test for `<do type="prev"><prev/></do>` parsing.
5. `Accept`:
- WML with `<prev/>` parses and renders without `Missing closing </p> tag`.

### M0-02 Browser keyboard handler guardrails

1. `Status`: `done`
2. `Files`:
- `browser/frontend/src/main.ts`
3. `Build`:
- Ensure global key bindings do not fire while typing in text-entry fields.
4. `Tests`:
- Manual keyboard checks in address bar and dev raw WML textarea.
5. `Accept`:
- `ArrowUp/ArrowDown/Enter/Backspace` only drive runtime when focus is outside text-entry controls.

### M0-03 Hybrid back behavior across deck boundaries

1. `Status`: `done`
2. `Files`:
- `browser/frontend/src/main.ts`
- `browser/frontend/src/session-history.ts`
3. `Build`:
- Back should use engine card history first, then host URL history fallback with card restore metadata.
4. `Tests`:
- Manual flow: `home -> menu -> /login -> back` restores `menu`.
5. `Accept`:
- Browser back behavior is deterministic for mixed in-deck and cross-deck navigation.

### M0-04 Frontend history/session logic extraction

1. `Status`: `done`
2. `Files`:
- `browser/frontend/src/session-history.ts`
- `browser/frontend/src/main.ts`
3. `Build`:
- Move stack operations into a dedicated helper module.
4. `Tests`:
- Build/type check via `pnpm --dir browser/frontend build`.
5. `Accept`:
- History mutations are centralized and no longer hand-coded inline.

### M0-05 Browser regression automation for keyboard/back

1. `Status`: `todo`
2. `Files`:
- `browser/frontend/src/*`
- `docs/waves/SPEC_TEST_COVERAGE.md`
3. `Build`:
- Add automated checks for keyboard navigation + hybrid back behavior.
4. `Tests`:
- Deterministic scripted assertions for focused-link movement, fragment back, and host-history back restore.
5. `Accept`:
- CI catches regressions in browser keyboard/back interaction semantics.

### M0-06 Documentation drift guardrails

1. `Status`: `todo`
2. `Files`:
- `browser/README.md`
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
3. `Build`:
- Add lightweight checklist to keep board status and README checklist synchronized.
4. `Tests`:
- Manual docs consistency pass as part of maintenance PR template.
5. `Accept`:
- No stale “next slice” or checklist entries after implementation merges.
