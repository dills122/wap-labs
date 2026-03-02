# Source Material Review (Canonical Local PDFs)

Reviewed directly from canonical local files under `spec-processing/source-material/`.

## Files Reviewed for WASM Engine

- `WAP-191-WML-20000219-a.pdf`
- `WAP-191_102-WML-20001213-a.pdf` (SIN)
- `WAP-191_104-WML-20010718-a.pdf`
- `WAP-191_105-WML-20020212-a.pdf` (SIN)
- `WAP-192-WBXML-20010725-a.pdf`
- `WAP-192_105-WBXML-20011015-a.pdf` (SIN)

Ignored for engine scope:

- `WAP-196-ClientID-20010409-a.pdf`

## Normalized Conclusions for Engine Team

## 1) Core deck/card grammar to implement first

From WML DTD lineage (`WAP-191` and retained in `WAP-191_104`):

- Deck root: `<wml (head?, template?, card+)>`
- Card model: `<card (onevent*, timer?, (do | p | pre)*)>`
- Task model: `%task = go | prev | noop | refresh`
- `do` and `onevent` both contain `%task`

## 2) Card-level semantics that affect rendering/runtime

- `card@newcontext` default `false`.
- `card@ordered` default `true`.
- `card@ordered="false"` is only a layout/navigation hint, not strict rendering law.
- Card `id` is fragment-addressable (`#cardId`).

## 3) Navigation/task semantics that affect runtime state machine

`go`:

- Supports `href`, `method=(post|get)`, `enctype`, `accept-charset`, `cache-control`, `sendreferer`.
- Performs history push semantics.
- Postfields may be ignored for same-deck target unless `cache-control="no-cache"`.

`prev`:

- History pop semantics with optional `setvar` side effects.

`refresh`:

- Applies setvar/state updates and re-renders current card context.

`noop`:

- Valid task with no action.

## 4) Event/timer model to phase in after MVP

Intrinsic events include at least:

- `onenterforward`
- `onenterbackward`
- `ontimer`

Timer semantics (`timer` element):

- One timer per card.
- Starts on card entry, stops on exit.
- `value` units: tenths of a second.
- Non-positive/non-integral behavior has explicit ignore/disable rules.
- Timer expiration triggers `ontimer`.

## 5) Variable substitution rules (critical for correctness)

- Variables allowed in `#PCDATA`, `%vdata`, `%HREF` contexts.
- Undefined variable -> empty string substitution.
- Substitution occurs after XML parsing.
- Conversion modes exist and must be applied by context.

## 6) `<a>` semantics for MVP link handling

- `<a>` is shorthand for `<anchor><go href="..."></go></anchor>` without setvar.
- Nested `<a>` is invalid.

## 7) WBXML relevance for current architecture boundary

From WBXML docs (`WAP-192*`):

- WBXML is binary XML token stream with headers (version/publicid/charset/string-table).
- Uses code pages and global tokens (`SWITCH_PAGE`, `END`, `STR_I`, `STR_T`, `OPAQUE`, etc.).
- External typing system associates XML document types with token values.

Engine implication for current architecture:

- Keep WBXML decode outside WASM runtime for now (transport layer), then feed textual WML into engine.

## 8) SIN impact observed in reviewed corpus

- `WAP-191_105` clarifies `go` post + `enctype` + charset behavior, including multipart guidance.
- `WAP-192_105` primarily corrects/consolidates WBXML conformance references.

## 9) Practical rule for implementation decisions

When older and newer WML docs differ:

1. Prefer `WAP-191_105` clarifications when present.
2. Use `WAP-191_104` as broad baseline structure/semantics text.
3. Fall back to `WAP-191` for historical wording only when needed.
