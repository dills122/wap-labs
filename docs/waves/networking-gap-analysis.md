# Networking Gap Analysis (WAP 1.x rewrite)

## Status (as of 2026-03-05)

This document captures gaps between current spec evidence and implementation-readiness for the networking rewrite. It is focused on execution risk so we can continue with a high-confidence build.

## Critical gaps (P0/P1)

| Priority | Gap | Evidence / Source | Impact | Required work |
| --- | --- | --- | --- | --- |
| P0 | WTP transaction reliability engine is not fully implemented | Spec docs (`wsp/wtp/wdp` traceability exists, but no transport crate implementation mapping) | Lost/reordered transactions, unstable request-response behavior under lossy links | Implement `TransactionManager`, state machine, retransmission/backoff, duplicate suppression, ACK/NACK handling, and idempotency checks in `transport-rust` |
| P0 | WDP transport abstraction lacks explicit behavior contract | `WDPDatagram` model is planned, but no enforced constraints/adapter semantics for loss/truncation/port validation | WTP retries and sequence assumptions are untestable without controlled transport behavior | Define `DatagramTransport` contract + trait-level tests for failure cases; implement UDP baseline with deterministic behavior boundaries |
| P1 | WSP header-token mapping incomplete for practical decode/encode | `wsp-pdu-reference.md` is in-progress and needs full token coverage | Encoding/decoding divergence from gateway behavior; non-compliant PDU negotiation | Complete header token tables + encoder/decoder fallback and unknown-token handling |
| P1 | WTLS story is optional/deferred without explicit boundary | Notes exist, but production-safe secure transport path missing | Hard stop for HTTPS-style secure gateway scenarios; hard-to-debug interoperability gaps | Decide and document minimum supported security mode: (a) no WTLS and hard-fail, or (b) minimal WTLS record/handshake shim |
| P1 | Gateway interoperability test matrix is not complete | Traceability exists, but no cross-component replay corpus | Parser and transport changes can pass unit tests while failing real gateway sessions | Add capture/replay fixtures (gateway↔emulator) and golden-session tests for CONNECT/GET/REPLY and retransmit flows |

## Medium gaps (P2/P3)

| Priority | Gap | Evidence / Source | Impact | Required work |
| --- | --- | --- | --- | --- |
| P2 | Contract edges between WSP/WTP/WDP traits are not fully typed | Current planning docs use conceptual modules but little trait/API hardening | Cross-layer leakage and hidden behavior assumptions across Rust and host boundaries | Add strict trait boundaries and typed error enums per layer with explicit ownership/error ownership boundaries |
| P2 | Parser output drift control is partially socialized | `tmp/docling-new-source-material` parsing now exists, but no promotion-safe diff policy in docs workflows | Risk of silently replacing canonical cleaned outputs with low-quality re-parses | Add a gated cleanup review checkpoint and diff report before promoting any new cleaned markdown to canonical corpus |
| P2 | Versioned behavior for deprecated/overlapping specs is weak | Multiple WAP/WTP/WTLS revision files exist; migration order tracked but not fully codified in implementation gates | Conflicting behavior if old/new variants accidentally mixed | Add explicit variant-policy matrix (e.g., WAP-224/WTP revision precedence and WTLS version handling) |
| P2 | Coverage mapping from spec-parsed artifacts to implemented modules is not 1:1 | Work items and spec traces are broad; implementation ownership mapping is still implicit | Hard to measure readiness for migration tickets | Introduce implementation status table: `not-started / in-progress / blocked / implemented` per module |

## Gap closure plan (next 4 milestones)

1. **Milestone N1 – Reliable transaction core**
   - Lock WDP contract first
   - Implement WTP state machine + retransmission timers
   - Add deterministic UDP failure simulators

2. **Milestone N2 – WSP transport-facing integration**
   - Finalize header token tables and wire encoder/decoder fuzz tests
   - Add PDU-level roundtrip tests for common browser flows

3. **Milestone N3 – Interop and safety**
   - Add captured fixture replay against known gateway behaviors
   - Add malformed/edge-case tests for duplicated, reordered, and dropped packets

4. **Milestone N4 – Security decision**
   - Either codify no-WTLS posture with explicit hard-fail behavior, or implement minimal WTLS record+handshake subset with explicit scope and limitations

## Action list to execute now

- [ ] Add a transport API contract spec in `transport-rust` and map it to scripts
- [ ] Bind `networking-implementation-checklist.md` acceptance criteria to concrete test files
- [ ] Add parse-verification gate step in the new-source-material ingestion flow:
  - parsed artifacts in `tmp/docling-new-source-material/core/*.cleaned.md`
  - canonical source copy only after explicit diff review
- [ ] Add a WSP/WTP/WDP status matrix to one docs hub (`WORK_ITEMS.md` or dedicated migration tracker)

## Owners / target area

- `transport-rust/` implementation modules: protocol engineering
- `spec-processing/` ingestion quality and promotion workflows
- `docs/waves/` governance and traceability alignment
- Integration layer (`browser` / `engine-wasm`): contract touchpoints once networking APIs stabilize

## Search prompt draft for follow-up research

Use this prompt directly with ChatGPT to continue source mining:

> We need the remaining missing technical details for a WAP 1.x networking rewrite. Please perform a focused scan against our existing local corpus and identify exact missing specs/gaps for WDP, WTP, WSP, and WTLS implementation. In particular, extract: (1) definitive WTP transaction state machine details (timeouts, retry intervals, duplicate handling, ACK/NACK behavior), (2) WDP bearer adaptation requirements for UDP-like datagram behavior and port mapping, (3) WSP header token tables and unsupported/optional header edge cases, (4) WTLS minimal record/handshake subset if we choose to implement phase-1, and (5) any known interoperability behavior from gateway captures or Wireshark dissectors for CONNECT/GET/REPLY + retransmits. Return a gap-to-source map with file-level references and prioritized implementation decisions.
