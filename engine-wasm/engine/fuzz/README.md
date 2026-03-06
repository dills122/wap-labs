# engine-wasm fuzzing

This directory contains cargo-fuzz targets for the WML engine crate.

## Setup

```bash
rustup install nightly
cargo +nightly install cargo-fuzz
```

From `engine-wasm/engine`:

```bash
cargo +nightly fuzz init
```

The initialization step creates expected `fuzz/` scaffolding, but this repo already includes
a curated target and corpus at `engine-wasm/engine/fuzz/`.

## Run the WML deck target

```bash
cd engine-wasm/engine
cargo +nightly fuzz run engine_wml_fuzzer
```

To replay a crash:

```bash
cargo +nightly fuzz run engine_wml_fuzzer fuzz/artifacts/engine_wml_fuzzer/crash-<hash>
```

Seeds are stored under:

- `fuzz/corpus/engine_wml_fuzzer/basic.wml`
- `fuzz/corpus/engine_wml_fuzzer/two_cards.wml`
- `fuzz/corpus/engine_wml_fuzzer/malformed_unclosed.wml`

## Target behavior

- Loads fuzzed input as WML XML with `load_deck_context`.
- Performs render, navigation-key, and timer operations.
- Verifies core runtime paths remain panic-free under invalid or malformed decks.
