# electron-app

Desktop host and UI harness for the WAP browser runtime.

## Responsibilities

- URL bar and navigation controls
- Device profile selection
- Softkey and directional key mapping
- Debug panels (network log, deck inspector)
- Canvas rendering target for engine draw commands

## Contracts

- Transport API types: `electron-app/contracts/transport.ts`
- WASM engine runtime contract: `engine-wasm/contracts/wml-engine.ts`

Electron should not implement WSP/WBXML logic directly.
