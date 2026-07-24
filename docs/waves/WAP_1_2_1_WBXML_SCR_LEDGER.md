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
| `WBXML-C-010` | Encoding default attribute values | missing | `WML-203`, `R0-08` |
| `WBXML-C-011` | Binary/literal token equivalence for tags and attributes | missing | `WML-203`, `R0-08`, historical `T0-07` linkage |

The selected-row audit is:

- implemented: 0
- partial: 1
- missing: 2
- direct normative WBXML tests: 0
- boundary tests: 1

These are feature-level evidence counts, not a WBXML compliance percentage.
The first `CONF-003` slice expands the three rows into 48 deduplicated clauses
covering section 5 and its subsections plus sections 6.3 and 6.4. Every clause
has a section hash, owner/work mapping, and planned direct fixture; none is
treated as implemented evidence yet.

## Current implementation evidence

`transport-rust` owns the boundary, consistent with the repository
architecture:

- `map_success_payload_response` recognizes
  `application/vnd.wap.wmlc`;
- `decode_wmlc_with_tool_limits` invokes an external `wbxml2xml` process;
- execution time and decoded output are bounded;
- original WBXML bytes and the WMLC media type are preserved on success;
- failures use the structured `WBXML_DECODE_FAILED` path.

That is useful integration and isolation evidence, but not direct WBXML 1.3
conformance evidence:

- the repository does not implement a WBXML parser;
- no decoder binary or version is pinned in the resource tree;
- success tests use a fake script that ignores the binary input;
- all 15 unvetted corpus fixtures allow either success or structured failure;
- generic `application/vnd.wap.wbxml` routing is separately missing in the WAE
  ledger;
- no test proves section 6.3 default-attribute behavior;
- no test proves binary/literal equivalence for tags, attribute names, and
  attribute values.

For those reasons `WBXML-C-001` is partial, while `WBXML-C-010` and
`WBXML-C-011` remain missing.

## Server and encoder rows

The 12 `WBXML-S-*` rows cover binary-document structure, tokenisation,
processing instructions, comments/declarations, parsed and unparsed entities,
well-formedness, validation, default attributes, and literal attribute-name
encoding.

They are retained for source completeness and for a future independently
shippable encoder/gateway module. They are not selected by the current Class C
client claim and have not been implementation-audited in this pass.

## Remaining WBXML work

1. Implement and review the 48 planned source-derived direct fixtures.
2. Choose and pin a decoder implementation or implement the decoder in
   `transport-rust`; record version, supported code pages, and failure policy.
3. Replace permissive/fake success evidence with source-derived fixtures for
   the header, multi-byte integers, string table, code-page switching, global
   tokens, entities, opaque data, extensions, literals, and malformed input.
4. Prove `WBXML-C-010` default-attribute behavior and `WBXML-C-011`
   binary/literal equivalence directly.
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
