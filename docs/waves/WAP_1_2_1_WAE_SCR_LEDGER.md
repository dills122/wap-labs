# WAP 1.2.1 WAE SCR Ledger

Version: v0.1
Status: effective SCR extracted; Class C applied; nested-clause audit pending

## Purpose

Define the exact WAE feature-level obligations for the selected WAP 1.2.1
Class C data client and stop later WAP-236 requirements from silently
replacing the historical target.

The machine-readable authority is:

- `spec-processing/source-manifests/wap-1.2.1-wae-scr.json`

Validate it with:

```sh
node scripts/check-wap-wae-conformance-ledger.mjs
node scripts/check-wap-conformance-ledger.mjs
```

## Effective authority

The normative target is the approved WAP-190 chain in this order:

1. `WAP-190-WAESpec-20000329-a`
2. `WAP-190_101-WAESpec-20001213-a`
3. `WAP-190_102-WAESpec-20001213-a`
4. `WAP-190_103-WAESpec-20001213-a`
5. `WAP-190_104-WAE-Spec-20010731-a`

`WAP-190_104` section 4.3 supplies the resulting tracked-change SCR table in
the WAP-221 format. The extraction removes struck text, accepts added text,
normalizes corrected identifiers, and preserves explicit dependency
expressions.

The profile selection is:

- WAP-215 target: `CCR-CLASSC-C-001`
- selected feature group: `WAESpec:MCF`
- WAP-221 meaning: all mandatory client features in the specification SCR

WAP-236 is used only for an explicit successor delta. It is not normative for
strict WAP 1.2.1 behavior.

## Effective totals

| Scope | Count |
|---|---:|
| Active WAE SCR rows | 86 |
| Mandatory active rows, all actors | 25 |
| Optional active rows, all actors | 61 |
| Client rows | 51 |
| Server rows | 35 |
| Rows removed by the approved SIN chain | 22 |
| Class C-required client rows | 11 |
| Optional client rows outside `WAESpec:MCF` | 40 |
| Server rows outside the selected client profile | 35 |

Removed rows remain in a separate historical list. They are not active
requirements and cannot be accidentally counted toward current coverage.

## Selected Class C client rows

| SCR | Effective feature | Code status | Primary work lane |
|---|---|---|---|
| `WAESpec-C-002` | Basic HTTP 1.1 authentication | missing | `WAE-607` |
| `WAESpec-C-003` | `http:` URL scheme | implemented | `WAE-602`, `T0-06` |
| `WAESpec-C-005` | Character set / encoding characteristics | implemented | `WAE-602`, `T0-05`, `T0-06` |
| `WAESpec-C-006` | Language characteristics | implemented | `WAE-602`, `T0-05` |
| `WAESpec-C-007` | Media-type characteristics | implemented | `WAE-602`, `T0-05` |
| `WAESpec-C-015` | Wireless Markup Language | partial | `WML-201`, `WML-301`, `R0-01` |
| `WAESpec-C-016` | WMLScript | partial | `WMLS-501`, `WMLS-502`, `W1-02`, `W1-04` |
| `WAESpec-C-017` | WML user agent | partial | `WAE-601`, WML/WMLScript sprints |
| `WAESpec-C-019` | `application/vnd.wap.wbxml` | missing | `WAE-602`, `R0-08` |
| `WAESpec-C-020` | `application/vnd.wap.wmlc` | implemented | `WAE-602`, `T0-07`, `R0-08` |
| `WAESpec-C-021` | `application/vnd.wap.wmlscriptc` | missing | `WMLS-503`, `W1-01` |

The current selected-row audit is:

- implemented: 5
- partial: 3
- missing: 3
- direct code/test links: 8 of 11

These counts describe feature-level evidence only. They are not a WAE
compliance percentage. The selected rows now expand into 39 source-anchored
clauses with planned direct fixtures, but clause implementation evidence
remains `not-assessed`.

## Confirmed implementation evidence

The ledger links exact symbols, tests, and runnable commands for:

- HTTP URL acceptance and unsupported-scheme rejection;
- `Accept`, `Accept-Charset`, and `Accept-Language` WAP baseline policy;
- WMLC classification, WBXML decoding, and source-media preservation;
- WML deck loading and runtime composition;
- WMLScript bytecode execution and invocation.

The evidence is deliberately conservative:

- WSP header token registration does not satisfy Basic authentication;
- WMLC-specific decoding does not satisfy generic
  `application/vnd.wap.wbxml`;
- a VM that can execute registered script bytes does not satisfy
  `application/vnd.wap.wmlscriptc` network classification and handoff.

## Optional and server lanes

The remaining client rows cover optional WTA, Push, WBMP/graphics,
vCard/vCalendar, multipart, Channels, and Service Indication capabilities.
They stay capability-gated and do not expand the first release claim.

The 35 server rows are retained because the project may ship transport or
proxy modules independently. They are not selected by the Class C client
profile. Server/proxy implementation assessment belongs in the corresponding
module-profile pass rather than being mixed into browser coverage.

## WAP-236 successor delta

Every selected target row has a concept-level successor classification:

| Target concept | WAP-236 disposition |
|---|---|
| Basic authentication | preserved and renamed |
| HTTP URL scheme | preserved and renamed |
| Charset/encoding | expanded and split into I18N and capability rows |
| Language | reframed as optional capability advertising |
| Media type | split into mandatory handling and optional advertising |
| WML | expanded into XHTML/WML1 or WML2 profile choices and context continuity |
| WMLScript | split into execution and standard-library obligations |
| WML user agent | decomposed into markup, context, history, and BACK behavior |
| Generic WBXML media type | removed from the WAE SCR and delegated |
| WMLC media type | subsumed by the WML1 markup profile |
| WMLScriptC media type | subsumed by WMLScript execution/profile dependencies |

This delta supports three decisions:

1. A compatible clarification may strengthen implementation evidence.
2. A changed successor behavior cannot overwrite strict target-era behavior.
3. A successor-only feature must be an explicit capability or enhancement
   unless another selected WAP 1.2.1 family independently requires it.

For example, WAP-236 caching text does not establish the target caching
obligation. The selected `CacheMod:MCF` family does.

## Selected nested-clause slice

`CONF-003` now expands all 11 selected WAE rows into 39 deduplicated clauses.
The anchors cover the effective WAE base/SIN chain and the imported RFC 2396,
RFC 2616, and RFC 2617 authorities. WML and WMLScript rows delegate to their
own family ledgers; WAE retains the user-agent integration, HTTP URL,
authentication, negotiation, and media-routing requirements.

## Remaining WAE work

SCR and clause-level planning are complete, but WAE implementation evidence is
not fully closed.

1. Implement and test `WAE-607` Basic authentication.
2. Decide and implement generic WBXML media-type handling at the transport
   boundary.
3. Complete WMLScript text/bytecode content-type routing and host handoff.
4. Finish the optional WAP-237 media delta and capability declarations.
5. Reconcile target-era WAE clauses with active `RQ-WAE-*`, test coverage,
   and release evidence without using WAP-236 as target authority.

## Source handling

The WAP-190 PDFs, private text extractions, and temporary page images remain
outside Git pending redistribution approval. The repository stores only
source identities, hashes, normalized requirement mappings, and audit
evidence.
