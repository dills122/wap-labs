# Networking Rewrite Context Pack (Upload-Once Package)

Use this file as the single-file context you upload to ChatGPT for targeted, file-level networking questions.

## Project Context
- Repository: WAP emulator stack (pre-alpha) with docs-driven implementation planning.
- Focus in this pass: clean-room WAP 1.x networking stack rewrite for browser/Waves runtime:
  - WDP -> WTP -> WSP, optional WTLS
- Canonical source PDFs live under `spec-processing/source-material/`.
- New parsing queue is `spec-processing/new-source-material/` and parsed temp output in `tmp/docling-new-source-material/`.
- Canonical cleaned markdown corpus is `spec-processing/source-material/parsed-markdown/docling-cleaned/`.

## Current Networking Plan Position
- We intentionally split implementation into profiles:
  - `gateway-bridged`: compatibility/translation-first path (WAP over existing gateway behavior)
  - `wap-net-core`: native protocol rewrite (WDP+WTP+WSP minimum)
  - `wap-net-ext`: additional extensions/advanced bearer/security paths
- Migration tickets around networking are tracked through `T0-08` to `T0-17`.
- Recent doc updates now reference this progression and parser-corpus checkpoints.

## Key Files to Know
- Networking spec definition: `docs/waves/networking-layer-definition.md`
- Implementation checklist: `docs/waves/networking-implementation-checklist.md`
- Readiness checklist: `docs/waves/networking-migration-readiness-checklist.md`
- Phase plan: `docs/waves/TRANSPORT_RUST_PHASE_PLAN.md`
- Traceability: `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`, `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- Protocol references:
  - `docs/waves/wtp-state-machine.md`
  - `docs/waves/wsp-pdu-reference.md`
  - `docs/waves/wtls-record-structure.md` (if WTLS work is pursued)
- Current gap register: `docs/waves/archive/networking/networking-gap-analysis.md`
- Parsing + promote workflow:
  - Scripts: `spec-processing/parse-new-source-material.fish`, `spec-processing/finalize-new-source-material.fish`
  - Networking Makefile: `spec-processing/Makefile.networking`
    - `make -C spec-processing -f Makefile.networking networking-ingest`
    - `make -C spec-processing -f Makefile.networking networking-verify`

## Current Understanding (What is in place)
- Spec corpus parsing and file movement flow exists and is stable.
- WSP/WTP/WDP architectural direction and traceability are documented.
- Network layer code is still largely in planned/prototyping/documentation state (not yet fully implemented in transport-rust).

## Primary Unknowns / Gaps (High priority)
1. WTP
   - Timer model, retransmission/backoff strategy
   - Duplicate transaction handling and RID/NACK behavior
   - Class 1 vs Class 2 state transitions and edge cases
2. WDP
   - Datagram transport contract semantics for loss/MTU/fragmentation
   - UDP mapping strategy and bearer-aware behavior
3. WSP
   - Full header token table + unknown token behavior
   - Connection-oriented and connectionless headers (interop-safe handling)
4. WTLS
   - Whether and how to implement phase-1 subset vs defer with hard boundary
5. Interop/regression
   - Capture-driven retransmit and CONNECT/GET/REPLY fixture tests not yet complete

## Commands / Checks Relevant to this Work
- Parse new PDFs:
  - `make -C spec-processing -f Makefile.networking networking-parse-only`
- Verify parsed artifacts before move:
  - `make -C spec-processing -f Makefile.networking networking-verify`
- Ingest queue to canonical source:
  - `make -C spec-processing -f Makefile.networking networking-ingest`
- Dry-run safe audit:
  - `make -C spec-processing -f Makefile.networking networking-dryrun`
- Promote only cleaned markdown:
  - `make -C spec-processing -f Makefile.networking networking-promote-only`

## Prompt to Reuse
“I uploaded this context file for our repo. Please do a strict, implementation-oriented networking gap audit for WDP/WTP/WSP/WTLS and return:

1) P0–P3 prioritized gaps,  
2) exact missing/ambiguous behaviors with section-level references from our spec set,  
3) concrete transport-rust implementation tasks (file/function level),  
4) validation tests required for each gap (especially retransmit, duplicate handling, and gateway interop).  

Prioritize correctness for CONNECT/GET/REPLY/WTP transaction behavior under packet loss.”

If needed, do a first-pass “minimum viable protocol core” and a second-pass “interop hardening” pass.
