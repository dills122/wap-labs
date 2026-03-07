# Networking External Response Triage

Date: 2026-03-05  
Scope: Normalize external assistant responses into actionable, spec-safe inputs for Waves networking rewrite.

## Use This Document For

- fast ingestion of externally suggested WAP details
- separating high-confidence implementation guidance from unverified claims
- preventing drift from canonical repo spec set and traceability docs

## Canonical Baseline (repo)

- WTP: `WAP-224` + `OMA-WAP-224_002`
- WDP: `WAP-259`
- WSP: `WAP-230` + `OMA-WAP-TS-WSP-V1_0`
- WTLS: `WAP-199` + `WAP-261*`

## Adopt Now (high confidence, aligned with local docs)

1. WTP must implement bounded retransmission, duplicate handling, TID window discipline, and abort behavior.
2. WTP SAR lane needs explicit NACK delay and retransmit hold-off policy once SAR is enabled.
3. WDP must expose a strict datagram contract with source/destination ports and deterministic error paths.
4. WSP needs table-driven header/token registry plus explicit unknown-token behavior.
5. Interop requires capture/replay fixtures for `CONNECT`/`GET`/`REPLY` and retransmit flows.

These align with:
- [NETWORKING_GAP_MASTER.md](/Users/dsteele/repos/wap-labs/docs/waves/NETWORKING_GAP_MASTER.md)

## Needs Verification Before Adoption (medium confidence)

1. Proposed concrete timer defaults (`3s`, `5s`, `30s`) should not be treated as normative without local corpus confirmation.
2. Any explicit header token numeric examples from external text must be validated against `WAP-230` tables used in local cleaned corpus.
3. WTLS phase strategy is directionally correct but message-level behavior should be lifted from `WAP-199`/`WAP-261*` before coding.
4. SMS/USSD bearer specifics are useful for future lanes but remain deferred for current UDP-first profile.

## Reject / Correct (avoid spec drift)

1. `WAP-203` as WSP primary reference in external text:
- For this repo, WSP baseline is `WAP-230` (+ OMA WSP 1.0 clarifications).  
- Do not replace local precedence with `WAP-203` in implementation planning.

2. Any claim that provides exact “historical default” constants without local source anchor:
- Treat as heuristic, not requirements.

3. Any TLS-modern substitution guidance (`TLS_AES_* via proxy`) as direct WTLS implementation target:
- Keep this out of protocol-core rewrite scope unless explicitly added as gateway bridge policy.

## Actionable Conversions

1. Convert external ideas into ticket-ready tasks only when they map to:
- one `RQ-TRN-*` requirement
- one `T0-*` migration gate
- one concrete `transport-rust` module target
- one fixture/test artifact

2. For each adopted item, require:
- internal file anchor
- local cleaned spec anchor
- acceptance test case name

## Immediate Next Extracts (from local corpus)

1. WTP:
- retransmission timer/counter fields
- duplicate/NACK/hold-off clauses
- TID window edge conditions

2. WSP:
- header code-page shifts
- Table 34/35/38/39 token assignments
- unsupported encoding and unknown token behavior

3. WDP:
- SAR field layout and ref-number constraints
- bearer adaptation constraints that affect UDP-first design

4. WTLS:
- minimum record parse fields and alert handling for phase-1 boundary definition

## Status

External responses are useful and mostly aligned at a planning level.  
Implementation must continue to anchor on the repo’s canonical spec set and ticketed traceability path.

## Indexed source follow-up

Current external/supplemental source indexing lives in:

- [docs/waves/NETWORKING_EXTERNAL_SOURCE_INDEX.md](/Users/dsteele/repos/wap-labs/docs/waves/NETWORKING_EXTERNAL_SOURCE_INDEX.md)
- [spec-processing/external-source-index.json](/Users/dsteele/repos/wap-labs/spec-processing/external-source-index.json)

Validation command:

```bash
node scripts/check-networking-source-index.mjs
```
