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

- Store examples as standalone files in `host-sample/examples/*.wml`
- A build step generates `host-sample/.generated/examples.ts` for fast runtime loading
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

Main files:

- `host-sample/index.html`
- `host-sample/main.ts`
- `host-sample/renderer.ts`

## Host prerequisites

- WASM package built to `engine-wasm/pkg` first
- Node 20.19+ (or 22.12+) and npm
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
npm install
npm run dev
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
4. Pick an example and click `Load Example`.
5. Edit WML in textarea and click `Reload Deck`, or enable `Live reload`.
6. Use keyboard keys or Up/Down/Enter buttons to test focus and `#cardId` navigation.

## Notes

- This harness is intended for rapid engine regression testing.
- External deck fetch/navigation should be handled by the future transport-host integration loop.
