# WaveNav Engine (engine-wasm)

Rust + WebAssembly WML runtime engine (MVP).

## Objective

Run the WaveNav WML deck/card runtime in the Electron renderer and emit a host-consumable render list.

## Full Environment Setup

This section is the expected setup for a clean machine.

### 1) System prerequisites

- `git`
- `node` 20.19+ (or 22.12+) and `npm`
- Rust toolchain (`rustup`, `rustc`, `cargo`)
- `wasm-pack`

### 2) Install prerequisites

macOS (Homebrew):

```bash
brew install node rustup-init wasm-pack
rustup-init -y
source "$HOME/.cargo/env"
```

Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y curl build-essential pkg-config libssl-dev nodejs npm
curl https://sh.rustup.rs -sSf | sh -s -- -y
source "$HOME/.cargo/env"
cargo install wasm-pack
```

### 3) Verify toolchain

```bash
node --version
npm --version
rustc --version
cargo --version
wasm-pack --version
```

### 4) Build WASM package

From repo root:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
```

Expected output directory:

- `engine-wasm/pkg/`

### 5) Run Rust tests

```bash
cd engine-wasm/engine
cargo test
```

### 6) Consume from host app

- Import generated package from `engine-wasm/pkg`
- Use API contract in `engine-wasm/contracts/wml-engine.ts`
- See host loop sample in `engine-wasm/host-sample/renderer.ts`

### 7) Quick local harness (no Electron)

```bash
cd engine-wasm/host-sample
npm install
npm run dev
```

Then open the printed local URL and use the in-browser tester.

## Rust module layout

- `engine/src/lib.rs`
- `engine/src/parser/wml_parser.rs`
- `engine/src/runtime/deck.rs`
- `engine/src/runtime/card.rs`
- `engine/src/runtime/node.rs`
- `engine/src/layout/flow_layout.rs`
- `engine/src/nav/focus.rs`
- `engine/src/render/render_list.rs`

## MVP support

Supported elements:

- `<wml>`
- `<card id="...">`
- `<p>`
- `<br/>`
- `<a href="...">`
- `#cardId` navigation

Ignored in MVP:

- `<input>`, `<select>`, timers, images, tables

Partially supported (phase W0 baseline):

- Script href execution for registered `.wmlsc` units
- `WMLBrowser` subset: `getVar`, `setVar`, `go`, `prev`
- Deferred post-invocation navigation application (`go`/`prev`)

## WASM API

- `loadDeck(xml: string)`
- `loadDeckContext(wmlXml: string, baseUrl: string, contentType: string, rawBytesBase64?: string)`
- `render(): RenderList`
- `handleKey(key: 'up' | 'down' | 'enter')`
- `navigateToCard(id: string)`

Additional helpers:

- `setViewportCols(cols: number)`
- `activeCardId()`
- `focusedLinkIndex()`
- `baseUrl()`
- `contentType()`
- `externalNavigationIntent()`
- `clearExternalNavigationIntent()`
- `getVar(name: string)`
- `setVar(name: string, value: string)`

Type contract:

- `engine-wasm/contracts/wml-engine.ts`
- `docs/wml-engine/requirements-matrix.md`
- `docs/wml-engine/ticket-plan.md`
- `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`

## Current checklist (planning/execution)

- [x] Complete Phase A todos in `docs/wml-engine/work-items.md` (`A2-03`, `A3-01`, `A3-02`, `A4-01`, `A4-02`)
- [ ] Keep engine contract and transport/browser mapping synced
- [ ] Expand fixture corpus to cover pending `RQ-RMK-*` and `RQ-WAE-*` groups

## Troubleshooting

- Compile error around `href="#..."` in Rust tests: use raw string delimiters `r##"..."##` in fixtures that contain `"#`.
- `wasm-pack: command not found`: install with `cargo install wasm-pack` and reopen shell.
- `No such file or directory: ../pkg`: ensure command is run from `engine-wasm/engine`.
