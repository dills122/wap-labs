# Host Sample (TypeScript)

This sample shows the minimum host loop for the WASM engine:

1. Initialize wasm module
2. Create `WmlEngine`
3. `loadDeck(xml)`
4. `render()` and paint draw commands to canvas
5. Map keyboard input to `handleKey('up' | 'down' | 'enter')`

Source: `host-sample/renderer.ts`

## Host prerequisites

- WASM package built to `engine-wasm/pkg` first
- A web/Electron renderer bundle that can import ESM wasm-pack output
- Canvas element available in DOM

## Minimal integration order

1. Build wasm package:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
```

2. In renderer code, call `bootWmlEngine(canvas, xml)`.
3. Ensure keyboard events are passed through the focused window.
4. Confirm `ArrowUp`, `ArrowDown`, `Enter` map to `up`, `down`, `enter`.

## Notes

- The sample handles only in-deck `#cardId` navigation in the engine.
- External deck fetch/navigation should be handled by the host transport layer.
