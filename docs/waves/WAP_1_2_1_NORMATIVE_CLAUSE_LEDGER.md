# WAP 1.2.1 Selected Normative-Clause Ledger

Version: v0.3
Status: `CONF-003` in progress; WML, WAE, WBXML, and caching slices complete

## Purpose

The family SCR ledgers identify which features the selected WAP-215 Class C
client must implement. This ledger expands those selected features into
independently testable normative clauses without committing recovered source
text.

Machine-readable authority:

- `spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json`

Validation:

```sh
node scripts/check-wap-selected-normative-clauses.mjs
node scripts/check-wap-conformance-ledger.mjs
```

Regeneration requires the hash-locked private WML, WAE, WBXML, and imported
RFC text extractions:

```sh
node spec-processing/scripts/generate-wap-selected-normative-clauses.mjs \
  --wml-text /absolute/path/WAP-191_104-WML-20010718-a.txt \
  --wbxml-text /absolute/path/WAP-192-WBXML-20010725-a.txt \
  --wbxml-sin-text /absolute/path/WAP-192_105-WBXML-20011015-a.txt \
  --wae-text /absolute/path/WAP-190-WAESpec-20000329-a.txt \
  --wae-sin-101-text /absolute/path/WAP-190_101-WAESpec-20001213-a.txt \
  --wae-sin-103-text /absolute/path/WAP-190_103-WAESpec-20001213-a.txt \
  --caching-text /absolute/path/WAP-120-WAPCachingMod-20010413-a.txt \
  --rfc-2396-text /absolute/path/rfc2396.txt \
  --rfc-2616-text /absolute/path/rfc2616.txt \
  --rfc-2617-text /absolute/path/rfc2617.txt \
  --recorded-on YYYY-MM-DD
```

The generator refuses release or external text whose SHA-256 differs from its
ingestion lock.

## Current slices

The current artifact covers 58 of the 201 selected Class C parent rows:

| Family | Selected parents | Deduplicated clauses |
|---|---:|---:|
| WML | 39 | 174 |
| WAE | 11 | 39 |
| WBXML | 3 | 48 |
| Caching | 5 | 68 |
| **Total** | **58** | **329** |

The 329 clauses are classified as 300 required, 21 recommended, and eight
permitted behaviors. Shared behaviors map to multiple SCR parents instead of
being copied. Examples include task variable sequencing, template/card event
shadowing, Basic-authentication protection spaces, HTTP URL defaults,
capability negotiation, WAE media routing, cache age/validation/history
behavior, image fallback, and WBXML literal-name processing.

Each clause records:

- effective source document and section;
- a normalized section hash;
- explicit force classification, including WML implicit-MUST rules;
- a short project-authored obligation synopsis;
- every selected SCR parent;
- inherited owner layers, work items, requirements, and parent implementation
  status;
- one planned source-derived direct fixture.

The fixture plan is not test evidence. Clause implementation status remains
`not-assessed` until the planned fixture and direct code/test evidence are
reviewed.

## Redistribution boundary

The committed ledger contains no source paragraphs, page images, PDFs, or
full-text derivatives. It retains only public locators, cryptographic hashes,
and project-authored summaries. The recovered corpus remains outside Git.

The validator limits synopsis size and rejects fields intended to carry
verbatim source text.

## Remaining `CONF-003` slices

The remaining 143 selected parents are:

- WMLScript: 41;
- WMLScript Libraries: 80;
- WDP: 9;
- WCMP: 5;
- WSP: 8.

`CONF-003` remains open until all nine selected families and all 201 parent
rows are represented. WTP is added only if connection-oriented WSP becomes a
claimed profile.
