# Host Sample (TypeScript)

This sample is a quick local testing harness for the WaveNav WASM engine (no Electron required).

It provides:

1. A browser canvas renderer
2. A selectable set of built-in example decks (including Openwave-era field sample)
3. An in-memory WML editor with optional live reload (never auto-saves files)
4. Keyboard + button key mapping (`ArrowUp`, `ArrowDown`, `Enter`)
5. Runtime state panel (`activeCardId`, focus index, metadata, external navigation intent)
6. Intent actions (`Clear Intent`, `Copy Intent URL`)
7. Per-example event tracker timeline for flow/actions during testing
8. Collapsible metadata/editor/event-log sections (state persists during page session)
9. Export current example event log to a text file for debugging artifacts

Example management:

- Store examples as standalone files in `engine-wasm/examples/source/*.wml`
- A build step generates `engine-wasm/examples/generated/examples.ts` for shared runtime loading
- For every new demoable engine feature, add a new example or update an existing one that exercises that feature.
- Each example must include a top metadata comment block with required keys:
  - `label`
  - `work-items` (comma-separated ids, optional if `spec-items` provided)
  - `spec-items` (comma-separated ids, optional if `work-items` provided)
  - `description`
  - `goal`
  - `testing-ac` (one or more checklist lines prefixed by `- `)

Metadata template:

```xml
<!--
label: Example Label
work-items: A2-02
spec-items: WML-R-007
description: What this demonstrates.
goal: What must be validated.
testing-ac:
- Step 1 to verify behavior.
- Step 2 to verify behavior.
-->
<wml>...</wml>
```

Executable story flows are optional companion files next to the canonical deck:

```text
engine-wasm/examples/source/basic.wml
engine-wasm/examples/source/basic.flow.json
```

The WML remains the only deck corpus. The existing manifest generator validates and merges the
companion into `examples.ts`. A version 1 companion contains:

- `example`: the generated example key (`basic`, `historyBackStack`, and so on)
- one or more lower-kebab-case `flows`
- exact `workItems` and `specItems` mappings; the union across flows must match the WML metadata
- an `initial` expectation and one or more action/expectation steps
- actions: `key` (`up`, `down`, `enter`), `back`, `tick` (`100` or `1000` ms), and
  `clear-intent`
- state assertions: `activeCardId`, `focusedLinkIndex`, `externalNavigationIntent`, and
  `nextCardVar`
- optional `traceKinds`, matched as an ordered subsequence of engine trace entries

Unknown example references/actions, malformed values, missing mappings, extra mappings, and stale
generated output fail deterministically:

```bash
pnpm --dir engine-wasm/host-sample run examples:check
pnpm --dir engine-wasm/host-sample run test:story:unit
```

## Executable stories

Build the WASM package once, install Playwright Chromium once, then run stories from the repository
root:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
cd ../..
pnpm --dir engine-wasm/host-sample exec playwright install chromium

pnpm test:story list
pnpm test:story WML-R-007
pnpm test:story A2-03
pnpm test:story all
```

The command generates/validates the shared manifest, builds the production host sample, reserves an
ephemeral localhost port, manages the Vite preview lifecycle, and drives the real WASM host through
Playwright. No manual server setup is required.

Every run writes a stable summary under
`engine-wasm/host-sample/test-results/story/<selector>/summary.json`. Failed flows also receive
`failure.png`, `trace.zip`, and structured `evidence.json` containing runtime snapshots, engine
trace entries, host events, and browser diagnostics. Override the root with
`WAVES_STORY_OUTPUT_DIR`.

Exit codes are `0` for pass/list, `1` for assertion failures, `2` for usage or environment errors,
and `3` when the requested ID has no executable coverage.

Main files:

- `host-sample/index.html`
- `host-sample/main.ts`
- `host-sample/renderer.ts`

## Host prerequisites

- WASM package built to `engine-wasm/pkg` first
- Node 20.19+ (or 22.12+) and pnpm
- Vite config must allow parent directory access (already configured in `host-sample/vite.config.ts`)

## Quickstart

1. Build wasm package:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
```

2. Start host harness:

```bash
cd engine-wasm/host-sample
pnpm install
pnpm run dev
```

Regenerate example manifest manually (normally automatic via `predev`/`prebuild`):

```bash
cd engine-wasm/host-sample
pnpm run examples:generate
```

All-in-one from repo root (rebuild wasm, then start host dev server):

```bash
make dev-wavenav-host
```

3. Open the URL printed by Vite (typically `http://localhost:5173`).
4. Pick an example from the dropdown (selection auto-loads).
5. Edit WML in textarea and click `Reload Deck`, or enable `Live reload`.
6. Use keyboard keys or Up/Down/Enter buttons to test focus and `#cardId` navigation.

## Notes

- This harness is intended for rapid engine regression testing.
- External deck fetch/navigation should be handled by the future transport-host integration loop.
- On GitHub Pages deploy, this app is published under `/simulator/`.
