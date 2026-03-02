# WML 1.1 Engine Support Plan (MVP)

Status: earlier draft. Superseded by `docs/wml-engine/source-material-review.md`, `docs/wml-engine/requirements-matrix.md`, and `docs/wml-engine/ticket-plan.md`.

## Purpose

Implement a WML 1.1 runtime that parses decks/cards and renders constrained viewport output with deck/card navigation semantics.

## Transport -> WASM normalized handoff

The transport layer must normalize either WML media type:

- `text/vnd.wap.wml`
- `application/vnd.wap.wmlc` (WBXML tokenized form)

into a single engine input shape:

```json
{
  "wmlXml": "<wml>...</wml>",
  "baseUrl": "http://example.com/index.wml",
  "contentType": "text/vnd.wap.wml",
  "rawBytesBase64": "..."
}
```

Required fields:

- `wmlXml`
- `baseUrl`
- `contentType`

Optional field:

- `rawBytesBase64` (debug/fidelity path)

## DTD-aligned parser target

WML 1.1 root model to target:

- `<wml>` with `(head?, template?, card+)`

Card model baseline for runtime evolution:

- `<card>` containing paragraph/task/event structures

MVP parser accepts:

- `<wml>`
- `<card id="...">`
- `<p>`
- `<br/>`
- `<a href="...">`

## Runtime model

Maintain:

- Deck (cards keyed by `id`)
- Active card
- Focusable links and focused index
- Navigation history stack

## Navigation rules

MVP:

- `href="#cardId"` -> in-deck card switch
- external/relative `href` -> host-handled navigation request (current Rust MVP keeps this as host responsibility)

v2+:

- `<do>` tasks: `go | prev | noop | refresh`
- `<go href="...">` with `postfield|setvar`
- variable substitution across text/attributes

## Layout rules (MVP)

- fixed viewport columns
- vertical flow
- text wrapping
- focused link highlight
- one card rendered at a time

## Success criteria

- wasm module loads in host
- first card renders
- focused link changes with up/down
- enter navigates `#cardId`
- render list updates deterministically
