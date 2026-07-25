# WAP 1.2.1 WBXML SCR Ledger

Version: v0.3
Status: effective SCR extracted; Class C applied; direct decoder evidence
partially closed

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
The three rows expand into 48 deduplicated clauses covering section 5 and its
subsections plus sections 6.3 and 6.4. The WML-203 direct-evidence tranche now
records 35 fixed-outcome fixtures citing 44 clauses and promotes 42 clauses to
`implemented`. Six remain `not-assessed`; all three parent rows stay
`partial`.

## Current implementation evidence

`transport-rust` owns the boundary, consistent with the repository
architecture:

- `map_success_payload_response` recognizes
  `application/vnd.wap.wmlc`;
- `decode_wmlc` invokes the built-in, pinned
  `lowband-wml13-wbxml/0.1.0` decoder;
- decoder output and element nesting are bounded;
- header order, WBXML 1.3 version and WML 1.3 public identifiers, multi-byte
  integers (including legal leading zero-valued groups), supported charset
  termination, string tables, tag/attribute parser states, page-zero WML
  tokens, global strings/entities/extensions, literal flags, PI and opaque
  structure, and malformed input have deterministic outcomes;
- every default and fixed attribute in the selected WML 1.3 DTD is
  reconstructed before textual handoff;
- original WBXML bytes and the WMLC media type are preserved on success;
- failures use the structured `WBXML_DECODE_FAILED` path.

Direct source-derived evidence is in
`transport-rust/tests/fixtures/transport/wbxml_wml13/conformance.json` and
`transport-rust/src/tests/wbxml_conformance.rs`. The former permissive sample
corpus now has fixed failure expectations under the pinned decoder and remains
robustness-only evidence.

The six unpromoted clauses are:

- `WBXML-CL-CHARSET-EXTERNAL-PRECEDENCE`: carrying-protocol precedence is not
  modeled;
- `WBXML-CL-CHARSET-UNREPRESENTABLE-NAME`: this is an encoder/tokeniser error
  condition, not yet direct decoder evidence;
- `WBXML-CL-TOKEN-CODE-PAGES`: the selected WML table implements page zero,
  while broader page-table support remains open;
- `WBXML-CL-BINARY-LITERAL-EQUIVALENCE`: representative pairs exist, but not
  an exhaustive pair for every assigned tag, attribute start, and attribute
  value;
- `WBXML-CL-EXTERNAL-TOKEN-TYPING` and
  `WBXML-CL-MIME-TOKEN-TYPING`: external/generic typing integration remains
  open.

The parent rows also retain broader limitations: externally supplied implied
attribute values, non-WML document families, and exhaustive token-pair
breadth. Generic `application/vnd.wap.wbxml` routing remains a separate WAE
gap.

## Server and encoder rows

The 12 `WBXML-S-*` rows cover binary-document structure, tokenisation,
processing instructions, comments/declarations, parsed and unparsed entities,
well-formedness, validation, default attributes, and literal attribute-name
encoding.

They are retained for source completeness and for a future independently
shippable encoder/gateway module. They are not selected by the current Class C
client claim and have not been implementation-audited in this pass.

## Remaining WBXML work

1. Add carrying-protocol charset precedence and external/MIME typing cases.
2. Decide whether non-page-zero document tables enter the selected client
   profile or remain an explicit unsupported-document outcome.
3. Exhaustively pair every assigned WML page-zero tag, attribute-start, and
   attribute-value token with its literal/string equivalent.
4. Extend engine structural parity beyond the focused canonical deck fixture.
5. Audit the 12 server/encoder rows only when that module profile is claimed.

Modern safety, streaming, performance, and diagnostics may improve the
implementation. They cannot replace these strict decode outcomes or turn an
unsupported token path into a silent success.

## Source handling

The WAP-192 PDFs, private text extractions, and temporary page images remain
outside Git pending redistribution approval. The repository stores only
source identities, hashes, normalized requirement mappings, and audit
evidence.
