# Networking Gap-to-Source Map (Local-Corpus Focused)

Generated from local repository docs and curated spec corpus references (not raw PDF body dumps).

## 1) Evidence inventory (corpus + parser outputs)

- Core transport spec set:
  - `spec-processing/source-material/WAP-259-WDP-20010614-a.pdf`
  - `spec-processing/source-material/WAP-224-WTP-20010710-a.pdf`
  - `spec-processing/source-material/OMA-WAP-224_002-WTP-SIN-20020827-a.PDF`
  - `spec-processing/source-material/WAP-230-WSP-20010705-a.pdf`
  - `spec-processing/source-material/OMA-WAP-TS-WSP-V1_0-20020920-C.pdf`
  - `spec-processing/source-material/WAP-199-WTLS-20000218-a.pdf`
  - `spec-processing/source-material/WAP-261-*.pdf`
- Canonical parsed markdown for those specs:
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-259-WDP-20010614-a.cleaned.md`
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-224-WTP-20010710-a.cleaned.md`
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/OMA-WAP-224_002-WTP-SIN-20020827-a.cleaned.md`
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-230-WSP-20010705-a.cleaned.md`
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/OMA-WAP-TS-WSP-V1_0-20020920-C.cleaned.md`
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-199-WTLS-20000218-a.cleaned.md`
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-261_100-WTLS-20010926-a.cleaned.md`
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-261_101-WTLS-20011027-a.cleaned.md`
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-261_102-WTLS-20011027-a.cleaned.md`

## 2) Current local gap map by category

### A) WTP: timers, retries, duplicates, ACK/NACK

| Status | Gap | Internal evidence |
| --- | --- | --- |
| Covered | Transaction classes and state intent are defined | [docs/waves/wtp-state-machine.md](docs/waves/wtp-state-machine.md), [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md RQ-TRN-006..007](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [docs/waves/networking-implementation-checklist.md](docs/waves/networking-implementation-checklist.md) |
| Covered | TID window and replay requirements are explicitly named as P0 requirements | [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md RQ-TRN-016](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [docs/waves/networking-migration-readiness-checklist.md T0-08](docs/waves/networking-migration-readiness-checklist.md) |
| Missing | Concrete timer values/initial/backoff policy implementation constants are not in code-level docs yet | No explicit section in `transport-rust` docs currently ties to `WTP` timer constants |
| Missing | Duplicate transaction cache retention strategy (window duration / storage policy) is not concretized in implementation docs | No persistence/retention policy appears in transport-rust docs |
| Ambiguous | WTP NACK-delay and retransmit hold-off details are noted conceptually but unresolved into config/API | `docs/waves/archive/networking/networking-gap-analysis.md` and `TRANSPORT_SPEC_TRACEABILITY.md` reference behavior without concrete policy defaults |

### B) WDP: datagram contract, ports, bearer/SAR

| Status | Gap | Internal evidence |
| --- | --- | --- |
| Covered | Port model, UDP-over-IP requirement, and requirement references are documented | [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md RQ-TRN-001..004](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [docs/waves/wap-stack-overview.md](docs/waves/wap-stack-overview.md) |
| Covered | Parser pipeline includes new-source-material and tmp canonicalized parsing checkpoints | [spec-processing/README.md](spec-processing/README.md), [spec-processing/Makefile.networking](spec-processing/Makefile.networking), [docs/waves/networking-layer-definition.md](docs/waves/networking-layer-definition.md) |
| Missing | No documented `WdpDatagramTransport` trait implementation and error taxonomy inside `transport-rust` | `transport-rust/README.md` currently describes gateway HTTP fetch behavior, not WDP |
| Missing | SAR generation/consumption behavior for WDP bearer-specific framing is only declared as optional, not implemented | [docs/waves/networking-layer-definition.md](docs/waves/networking-layer-definition.md), [docs/waves/archive/networking/networking-gap-analysis.md](docs/waves/archive/networking/networking-gap-analysis.md) |
| Ambiguous | MTU/fragmentation thresholds are not pinned to concrete values | Referenced conceptually in [docs/waves/networking-layer-definition.md], but no numeric policy |

### C) WSP: header tokens and edge behavior

| Status | Gap | Internal evidence |
| --- | --- | --- |
| Covered | Core PDU shapes, session modes, and header-token intent are documented | [docs/waves/wsp-pdu-reference.md](docs/waves/wsp-pdu-reference.md), [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md RQ-TRN-010..019](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md) |
| Covered | Unknown/unassigned token handling is required behavior in traceability | [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md RQ-TRN-018](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [docs/waves/networking-implementation-checklist.md T0-10](docs/waves/networking-implementation-checklist.md) |
| Missing | Full header-code-page token tables/fixture completion not linked to implementation tests yet | `docs/waves/archive/networking/networking-gap-analysis.md` marks this P1; no concrete registry file exists in `transport-rust` |
| Missing | Code-page rejection/fallback policy is required (`unsupported encoding`) but not implemented in transport modules | Same as above; no corresponding module in source files |
| Ambiguous | Confirmed push timing/late-ack nuances are deferred and untested | `docs/waves/wsp-pdu-reference.md` marks confirmed-push timing as deferred |

### D) WTLS: phase-0 path and phase-1 uplift

| Status | Gap | Internal evidence |
| --- | --- | --- |
| Covered | Layer contract and phase split (noop -> handshake) is documented | [docs/waves/wtls-record-structure.md](docs/waves/wtls-record-structure.md), [docs/waves/networking-layer-definition.md](docs/waves/networking-layer-definition.md) |
| Covered | WTLS scope is optional with explicit no-op posture | same |
| Missing | Actual record field-level parsing/serialization code is absent | No `wtls` module in `transport-rust` file tree |
| Missing | Cipher negotiation/handshake policy and alert/error mapping are not wired | No concrete mapping in transport code |

### E) Interop / regression fixtures (CONNECT/GET/REPLY + retransmit)

| Status | Gap | Internal evidence |
| --- | --- | --- |
| Covered | Acceptance requires fixture coverage before migration gate promotion | [docs/waves/networking-migration-readiness-checklist.md](docs/waves/networking-migration-readiness-checklist.md), [docs/waves/SPEC_TEST_COVERAGE.md](docs/waves/SPEC_TEST_COVERAGE.md), [docs/waves/archive/networking/networking-gap-analysis.md](docs/waves/archive/networking/networking-gap-analysis.md) |
| Missing | No local PCAP-driven fixture suite yet for WSP/WTP retransmit behavior | No file path under `docs/waves` currently lists capture fixtures |
| Missing | No golden decode/encode corpus for WSP CONNECT/GET/REPLY end-to-end against captures | No explicit file references to Wireshark-diff fixtures in repo |

## 3) Implementation alignment check (what is missing in transport-rust today)

- Current `transport-rust` scope is still gateway/HTTP-focused:
  - `transport-rust/README.md`
  - `transport-rust/src/lib.rs`
  - request/fixture structure references protocol handoff, not WDP/WTP/WSP codecs
- There is currently no directory/module split for:
  - `wdp/`, `wtp/`, `wsp/`, `wtls/` in Rust source
- Therefore, all transport-network PDU behavior is effectively at design/doc level, not encoded yet.

## 4) Recommended next files to produce from this gap map

- `transport-rust/src/network/` (or equivalent): `wdp.rs`, `wtp.rs`, `wsp.rs`, `wtls.rs`
- `transport-rust/src/network/traits.rs`: `DatagramTransport`, `TidPolicy`, `RetransmissionPolicy`
- `transport-rust/tests/fixtures/transport/network/`:
  - pdu roundtrip fixtures
  - WTP duplicate/retransmit fixtures
  - WSP token/unknown-header fixtures
  - gateway replay capture replay fixture format

## 5) Reusable prompt for follow-up deep scan (paste to ChatGPT)

I uploaded our local networking docs + spec-corpus pointers. Please produce a strict missing-spec map with this format:

1) Priority gap (P0-P3)
2) exact internal file references proving it
3) exact external spec anchors to consult (section/table/requirement)
4) concrete transport-rust implementation target (file/function/class)
5) first test fixture to add

Focus on WTP timers/dupes, WDP transport contract, WSP token tables, and WTLS phase-1 minimum.
