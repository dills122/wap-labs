# WAP 1.2.1 Selected Normative-Clause Ledger

Version: v0.10
Status: `CONF-003` complete; direct evidence is incrementally assessed

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

Regeneration requires the hash-locked private WAP and imported RFC text
extractions:

```sh
node spec-processing/scripts/generate-wap-selected-normative-clauses.mjs \
  --wml-text /absolute/path/WAP-191_104-WML-20010718-a.txt \
  --wbxml-text /absolute/path/WAP-192-WBXML-20010725-a.txt \
  --wbxml-sin-text /absolute/path/WAP-192_105-WBXML-20011015-a.txt \
  --wae-text /absolute/path/WAP-190-WAESpec-20000329-a.txt \
  --wae-sin-101-text /absolute/path/WAP-190_101-WAESpec-20001213-a.txt \
  --wae-sin-103-text /absolute/path/WAP-190_103-WAESpec-20001213-a.txt \
  --caching-text /absolute/path/WAP-120-WAPCachingMod-20010413-a.txt \
  --wcmp-text /absolute/path/WAP-202-WCMP-20010624-a.txt \
  --wsp-text /absolute/path/WAP-203-WSP-20000504-a.txt \
  --wsp-sin-001-text /absolute/path/WAP-203_001-WSP-20000620-a.txt \
  --wdp-text /absolute/path/WAP-200-WDP-20000219-a.txt \
  --wmlscript-text /absolute/path/WAP-193_101-WMLScript-20010928-a.txt \
  --wmlscript-libraries-text /absolute/path/WAP-194-WMLScriptLibraries-20000925-a.txt \
  --rfc-768-text /absolute/path/rfc768.txt \
  --rfc-791-text /absolute/path/rfc791.txt \
  --rfc-792-text /absolute/path/rfc792.txt \
  --rfc-2396-text /absolute/path/rfc2396.txt \
  --rfc-2616-text /absolute/path/rfc2616.txt \
  --rfc-2617-text /absolute/path/rfc2617.txt \
  --recorded-on YYYY-MM-DD
```

The generator refuses release or external text whose SHA-256 differs from its
ingestion lock.

## Current slices

The current artifact covers all 198 selected Class C parent rows:

| Family | Selected parents | Deduplicated clauses |
|---|---:|---:|
| WML | 39 | 175 |
| WAE | 11 | 39 |
| WBXML | 3 | 47 |
| Caching | 5 | 68 |
| WCMP | 2 | 9 |
| WSP | 8 | 57 |
| WDP | 9 | 49 |
| WMLScript | 41 | 107 |
| WMLScript Libraries | 80 | 211 |
| **Total** | **198** | **762** |

The 762 clauses are classified as 722 required, 29 recommended, and 11
permitted behaviors. Shared behaviors map to multiple SCR parents instead of
being copied. Examples include task variable sequencing, template/card event
shadowing, Basic-authentication protection spaces, HTTP URL defaults,
capability negotiation, WAE media routing, cache age/validation/history
behavior, image fallback, WBXML literal-name processing, and WDP/UDP/IPv4
datagram boundaries.

Each clause records:

- effective source document and section;
- a normalized section hash;
- explicit force classification, including WML implicit-MUST rules;
- a short project-authored obligation synopsis;
- every selected SCR parent;
- inherited owner layers, requirements, parent implementation status, and
  baseline work items;
- any explicit slice-scoped `directWorkItems` additions adopted from the same
  authoritative clause without widening its SCR parents;
- one planned or implemented source-derived direct fixture.

A planned fixture is not test evidence. An implemented fixture must name its
fixture path, test path, and command, and clause implementation status changes
only after that direct evidence is reviewed. The current ledger records 317
implemented clauses with reviewed direct evidence and keeps 445 clauses
`not-assessed`. The WML-203 slice contributes 47 implemented WBXML clauses and
21 implemented WML clauses covering alternate-DTD behavior, the mandatory
text prologue, and selected DTD structures; WML-204 adds 23 implemented WML
clauses, WML-205 adds three implemented error-policy clauses, WSP-801 adds 35
implemented connectionless PDU/primitive clauses, WML-C-24 adds the
inline line-break clause, and WML-202 adds 30 root/head/access, template,
task-shadowing, card-context, and newcontext clauses. WML-302 and WML-303 add
their reviewed variable/substitution and action/event evidence; shared clauses
across these completed slices are deduplicated in the ledger totals. WML-305
adds its 10 reviewed timer-lifecycle clauses, WML-301 adds 13 reviewed
context, request-shaped history, fragment-selection, process-order, and card-table-boundary clauses,
R0-06/WSP-805 adds ten reviewed WML-304 request-serialization clauses, WML-309 adds
three reviewed frame-affordance presentation clauses, and the additive WMLS-501 verifier tranche
adds 15 reviewed library-index and stack-dataflow clauses. The
validator allowlists the 14-clause
`TRN-702` direct-work-item overlay so a broad parent-row mapping cannot
silently substitute for slice adoption.

The generated WML graph has 225 directly mapped clause nodes. That projection
count describes planning relationships and is not the 317-clause assessed
evidence count.

WML-201 directly maps all 175 selected WML clauses for family ownership and
retrieval. That mapping is not fixture evidence: clause assessment remains
unchanged, and the canonical 76-row SCR ledger now distinguishes 33 rows
with direct code/test links from 14 mapped mandatory gaps and 29 optional
rows that have not been assessed.

## Redistribution boundary

The committed ledger contains no source paragraphs, page images, PDFs, or
full-text derivatives. It retains only public locators, cryptographic hashes,
and project-authored summaries. The recovered corpus remains outside Git.

The validator limits synopsis size and rejects fields intended to carry
verbatim source text.

## `CONF-003` closure

No selected family or parent row remains unexpanded. `CONF-003` is complete at
the planning level; clause statuses advance independently when source-derived
fixture and direct code/test evidence are reviewed. Implemented WDP, WCMP,
WML, and WBXML clauses retain their explicit fixture evidence. WTP is added
only if connection-oriented WSP becomes a claimed profile.
