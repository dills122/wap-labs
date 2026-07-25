# WAP 1.2.1 WBXML SCR Ledger

Version: v0.2
Status: effective SCR extracted; Class C applied; selected nested clauses
planned

## Purpose

Define the exact WBXML 1.3 feature-level obligations for the selected WAP
1.2.1 Class C data client and distinguish a WBXML-capable browser from a host
that merely invokes an unverified decoder executable.

The machine-readable authority is:

- `spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json`
- `spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json`

Validate it with:

```sh
node scripts/check-wap-wbxml-conformance-ledger.mjs
node scripts/check-wap-selected-normative-clauses.mjs
node scripts/check-wap-conformance-ledger.mjs
```

## Effective authority

The normative target is:

1. `WAP-192-WBXML-20010725-a`, WBXML 1.3
2. `WAP-192_105-WBXML-20011015-a`, applied afterward

The approved SIN says the July 2001 SCR was not in the appropriate format and
that part of `WAP-192.101` had not been rolled into the updated specification.
Its corrected section 9 table supplies the effective actor-specific
`WBXML-S-*` and `WBXML-C-*` rows. Tracked-change inspection also resolves the
effective wording for processor instructions and removed XML metadata.

The profile selection is:

- WAP-215 target: `CCR-CLASSC-C-001`
- selected feature group: `WBXML:MCF`
- WAP-221 meaning: all mandatory client features in the specification SCR

## Effective totals

| Scope | Count |
|---|---:|
| Active WBXML SCR rows | 15 |
| Mandatory rows, all actors | 11 |
| Optional rows, all actors | 4 |
| Client/decoder rows | 3 |
| Server/document/encoder rows | 12 |
| Class C-required client rows | 3 |
| Rows outside the selected client profile | 12 |

There are no optional client rows in the corrected table.

## Selected Class C client rows

| SCR | Effective feature | Code status | Primary work lane |
|---|---|---|---|
| `WBXML-C-001` | Binary XML Structure | partial | `WML-203`, `R0-08`, historical `T0-07` linkage |
| `WBXML-C-010` | Encoding default attribute values | partial | `WML-203`, `R0-08` |
| `WBXML-C-011` | Binary/literal token equivalence for tags and attributes | partial | `WML-203`, `R0-08`, historical `T0-07` linkage |

The selected-row audit is:

- implemented: 0
- partial: 3
- missing: 0
- direct normative WBXML tests: 3
- boundary-only tests: 0

These are feature-level evidence counts, not a WBXML compliance percentage.
The first `CONF-003` slice expands the three rows into 48 deduplicated clauses
covering section 5 and its subsections plus sections 6.3 and 6.4. Every clause
has a section hash, owner/work mapping, and planned direct fixture. This
baseline links direct parent-row tests but conservatively leaves individual
clause implementation status unassessed until the full 48-fixture inventory
is reviewed.

## Current implementation evidence

`transport-rust` owns the boundary, consistent with the repository
architecture:

- `map_success_payload_response` recognizes
  `application/vnd.wap.wmlc`;
- `decode_wmlc` invokes the built-in, pinned
  `lowband-wml13-wbxml/0.1.0` decoder;
- decoder output and element nesting are bounded;
- header order, multi-byte integers, WML 1.3 public identifiers, supported
  charsets, string tables, tag/attribute parser states, page-zero WML tokens,
  global strings/entities/extensions, literal names, and malformed input have
  deterministic outcomes;
- WML 1.3 DTD default/fixed attributes are reconstructed before textual
  handoff;
- original WBXML bytes and the WMLC media type are preserved on success;
- failures use the structured `WBXML_DECODE_FAILED` path.

Direct source-derived evidence is in
`transport-rust/tests/fixtures/transport/wbxml_wml13/conformance.json` and
`transport-rust/src/tests/wbxml_conformance.rs`. The former permissive sample
corpus now has fixed failure expectations under the pinned decoder and remains
robustness-only evidence.

The selected rows remain partial because:

- generic `application/vnd.wap.wbxml` routing is separately missing in the WAE
  ledger;
- charset-dependent termination beyond US-ASCII, ISO-8859-1, and UTF-8 plus
  external charset-precedence policy remain open;
- processing-instruction, application-defined opaque/extension behavior, and
  exhaustive per-token pair fixtures remain open;
- section 6.3 externally supplied implied values and version breadth beyond
  the selected WML 1.3 DTD remain open.

## Server and encoder rows

The 12 `WBXML-S-*` rows cover binary-document structure, tokenisation,
processing instructions, comments/declarations, parsed and unparsed entities,
well-formedness, validation, default attributes, and literal attribute-name
encoding.

They are retained for source completeness and for a future independently
shippable encoder/gateway module. They are not selected by the current Class C
client claim and have not been implementation-audited in this pass.

## Remaining WBXML work

1. Expand the bounded corpus to one reviewed direct fixture per selected
   nested clause and update clause-level evidence only after that review.
2. Add charset-dependent termination and carrying-protocol charset precedence
   cases.
3. Add processing-instruction and WML application-defined extension breadth;
   retain explicit unsupported outcomes for opaque data without a WML mapping.
4. Exhaustively pair every assigned WML page-zero tag, attribute-start, and
   attribute-value token with its literal/string equivalent.
5. Add text-WML/WMLC deck-model parity fixtures without moving decoding into
   `engine-wasm` or the browser adapter.
6. Audit the 12 server/encoder rows only when that module profile is claimed.

Modern safety, streaming, performance, and diagnostics may improve the
implementation. They cannot replace these strict decode outcomes or turn an
unsupported token path into a silent success.

## Source handling

The WAP-192 PDFs, private text extractions, and temporary page images remain
outside Git pending redistribution approval. The repository stores only
source identities, hashes, normalized requirement mappings, and audit
evidence.
