# WAP 1.2.1 WBXML SCR Ledger

Version: v0.4
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
The three rows expand into 47 client-applicable deduplicated clauses covering
section 5 and its subsections plus sections 6.3 and 6.4. The WML-203
direct-evidence tranche records 42 fixed-outcome fixtures citing all 47
selected clauses and promotes all 47 to `implemented`. All three feature-level
parent rows stay `partial` because their broader document-family limitations
remain.

## Current implementation evidence

`transport-rust` owns the boundary, consistent with the repository
architecture:

- `map_success_payload_response` recognizes
  `application/vnd.wap.wmlc`;
- `decode_wmlc` invokes the built-in, pinned
  `lowband-wml13-wbxml/0.3.0` decoder;
- WML token-table selection is keyed by the carrying MIME media type, and
  carrying-protocol charset metadata takes precedence over the WBXML header;
- decoder output and element nesting are bounded;
- header order, WBXML 1.3 version and WML 1.3 public identifiers, multi-byte
  integers (including legal leading zero-valued groups), supported charset
  termination, string tables, tag/attribute parser states, page-zero WML
  tokens, global strings/entities/extensions across unassigned pages, literal
  flags, PI and opaque structure, and malformed input have deterministic
  outcomes;
- the typed token registry accepts the full one-octet page index independently
  for tag and attribute spaces, resolves assigned page zero, rejects
  unassigned pages 1 through 254, and rejects unregistered
  implementation-specific page 255 deterministically;
- every default and fixed attribute in the selected WML 1.3 DTD is
  reconstructed before textual handoff;
- every assigned WML page-zero tag, attribute-start, and attribute-value token
  has a generated binary/literal equivalence pair;
- original WBXML bytes and the WMLC media type are preserved on success;
- failures use the structured `WBXML_DECODE_FAILED` path.

Direct source-derived evidence is in
`transport-rust/tests/fixtures/transport/wbxml_wml13/conformance.json` and
`transport-rust/src/tests/wbxml_conformance.rs`. The former permissive sample
corpus now has fixed failure expectations under the pinned decoder and remains
robustness-only evidence.

Cross-layer evidence is in the schema-v2
`transport-rust/tests/network/interop/wdp_cdpd_ipv4_seed.json` case
`selected_cdpd_wbxml_unitdata_round_trip` and
`wml_203_reconstructed_wdp_sdu_matches_text_engine_behavior`. The test
reconstructs the opaque WDP delivery payload, assigns the WMLC media type only
at the fetch boundary, and compares native engine state/rendering with the
paired canonical text deck. `pnpm test:story WML-203` exercises that paired
text deck through the WASM engine boundary; it does not move WBXML decoding
into the simulator.

There are no unpromoted selected client clauses. The source sentence tracked as
`WBXML-CL-CHARSET-UNREPRESENTABLE-NAME` explicitly terminates tokenisation and
therefore belongs to the unselected server/encoder profile under
`WBXML-S-001`; it is preserved there as `not-assessed`, not counted as decoder
evidence. `WBXML-CL-TOKEN-CODE-PAGES` is direct-evidence-backed by the bounded
registry and fixed outcomes; this does not claim token tables that WML 1.3
does not assign.

The parent rows also retain broader limitations: externally supplied implied
attribute values and non-WML document families. Generic
`application/vnd.wap.wbxml` routing remains a separate WAE
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

1. Extend engine structural parity beyond the focused canonical deck fixture.
2. Add generic `application/vnd.wap.wbxml` routing and non-WML token-table
   registries only if those document-family profiles enter selected scope.
3. Extend default-attribute reconstruction beyond WML 1.3 only if another
   version or document-type profile is selected.
4. Audit the 12 server/encoder rows, including unrepresentable-name
   tokenisation, only when that independently shippable profile is claimed.

Modern safety, streaming, performance, and diagnostics may improve the
implementation. They cannot replace these strict decode outcomes or turn an
unsupported token path into a silent success.

## Source handling

The WAP-192 PDFs, private text extractions, and temporary page images remain
outside Git pending redistribution approval. The repository stores only
source identities, hashes, normalized requirement mappings, and audit
evidence.
