# Host Sample (TypeScript)

This sample is a quick local testing harness for the WaveNav WASM engine (no Electron required).

It provides:

1. A browser canvas renderer
2. A WML textarea so you can hot-reload decks
3. Keyboard mapping (`ArrowUp`, `ArrowDown`, `Enter`)

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

3. Open the URL printed by Vite (typically `http://localhost:5173`).
4. Edit WML in textarea and click `Reload Deck`.
5. Use keyboard keys to test focus and `#cardId` navigation.

## Notes

- This harness is intended for rapid engine regression testing.
- External deck fetch/navigation should be handled by the future transport-host integration loop.
