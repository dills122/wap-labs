# WAP 1.2.1 Class C Transport SCR Ledgers

Version: v0.1
Status: effective SCRs extracted; connectionless Class C path applied

## Purpose

Define the exact WDP, WCMP, and WSP source obligations needed by the selected
WAP 1.2.1 Class C data client, while keeping connection-oriented WSP and WTP
as an explicit conditional capability.

The machine-readable authorities are:

- `spec-processing/source-manifests/wap-1.2.1-wdp-scr.json`
- `spec-processing/source-manifests/wap-1.2.1-wcmp-scr.json`
- `spec-processing/source-manifests/wap-1.2.1-wsp-scr.json`

Validate them with:

```sh
node scripts/check-wap-transport-conformance-ledgers.mjs
node scripts/check-wap-conformance-ledger.mjs
```

## Effective authority

| Family | Effective sequence | Effective SCR table |
|---|---|---|
| WDP | WAP-200 + SINs 001, 002, 003, 004, 005 | WAP-200_005 Appendix E |
| WCMP | WAP-202 rolled-up approved baseline | WAP-202 Appendix A |
| WSP | WAP-203 + SINs 001, 003, 005 | WAP-203_003 Appendix D, corrected by SIN 005 |

WSP SIN 005 inserts the missing `AND` in the `WSP-CO-C-012` dependency:
`WTP:MCF AND WTP-C-013`. The ledger applies this correction even though the
connection-oriented path is not selected for the initial Class C profile.

## Source totals

| Family | Rows | Mandatory | Optional | Client | Server |
|---|---:|---:|---:|---:|---:|
| WDP | 146 | 14 | 132 | 71 | 75 |
| WCMP | 62 | 2 | 60 | 31 | 31 |
| WSP | 109 | 39 | 70 | 56 | 53 |
| **Total** | **317** | **55** | **262** | **158** | **159** |

Every row preserves its exact identifier, actor, source order, M/O status, and
dependency expression. Server, optional, alternate-bearer, and
connection-oriented rows remain source-complete even when they are outside the
initial client path.

## Selected Class C transport path

WAP-215 selects `WDP:MCF`, `WCMP:MCF`, and `WSP:MCF`. The top-level SCR
dependencies require concrete choices. The initial strict profile resolves
them as follows:

1. WDP uses the CDPD WDP-over-UDP/IP alternative (`WDP-CT-C-002`) with IPv4
   addressing (`WDP-NA-C-003`).
2. WCMP uses the general WCMP message-structure alternative
   (`WCMP-SP-C-002`) rather than delegating the requirement to host ICMP.
3. WSP uses the connectionless alternative (`WSP-CL-C-001`), which depends on
   WDP and does not activate WTP.

This produces 22 selected-path rows:

| Family | Selected path | Current audit | Direct normative tests |
|---|---:|---|---:|
| WDP | 9 | 0 implemented / 9 partial / 0 missing | 0 |
| WCMP | 5 | 0 implemented / 0 partial / 5 missing | 0 |
| WSP | 8 | 0 implemented / 8 partial / 0 missing | 0 |
| **Total** | **22** | **0 implemented / 17 partial / 5 missing** | **0** |

The two optional WDP rows and four optional WCMP/WSP root-dependency rows are
required by the selected alternatives. Their source `O` status is preserved;
the project profile makes them strict for this path.

## Implementation alignment

### WDP

The Rust transport has a useful WDP-shaped foundation:

- `WdpDatagram` carries source/destination address, ports, and payload;
- `DatagramTransport` exposes send/receive operations;
- `UdpDatagramTransport` binds the datagram model to IPv4/IPv6 UDP;
- known WAP service ports `9200..9203` are represented;
- payload bounds and a segmentation/reassembly policy surface exist.

All nine selected rows remain partial. The code has no machine-declared CDPD
strict profile, no source-derived `T-DUnitdata` vectors, and no proof that its
address/port/error semantics cover the effective WAP-200 clauses.

### WCMP

WCMP is absent from `transport-rust`. There is no codec, message-type model,
generation/processing policy, or echo/error fixture. All five selected-path
rows are missing.

The selected general-WCMP path requires:

- `WCMP-C-001`
- `WCMP-SP-C-002`
- destination-unreachable message structure (`WCMP-GEN-C-001`)
- message-too-big structure (`WCMP-GEN-C-003`)
- echo-reply structure (`WCMP-GEN-C-006`)

`CONF-003` now expands these five rows into 28 source-anchored clauses with
planned direct fixtures. Clause implementation remains `not-assessed`; all
five parent rows remain missing until the codec, safety behavior, and message
fixtures exist.

Additional generation, processing, endpoint, and diagnostic rows remain
optional capabilities until selected.

### WSP

The Rust transport has native connectionless GET/POST/REPLY encoding, WSP
session/mode types, header-block handling, encoding-version policy, fixture
matrices, and a WDP/UDP fetch path. These are substantial architectural and
behavioral evidence.

All eight selected rows remain partial because the current tables and fixtures
were developed primarily from successor-era WSP material and project-authored
synthetic cases. Exact WAP-203 base/SIN assigned numbers, header rules, status
codes, primitive semantics, malformed cases, and end-to-end vectors remain
open.

## WTP boundary

The initial strict profile does not select connection-oriented WSP.
Connection-oriented client rows remain
`conditional-on-connection-oriented-wsp-and-wtp`. Claiming that capability
must:

1. activate `WSP-CO-C-001` and its dependency closure;
2. activate `WTP:MCF`;
3. complete a separate effective WTP SCR ledger;
4. pass WSP/WTP session, transaction, retransmission, abort, and timing
   evidence.

The presence of partial WTP code cannot silently widen the release claim.

## Source gap exposed by the bearer choice

RFC 768 and RFC 791 are already backed by hash-locked primary text artifacts.
The CDPD citation `TIAEIA-732` is still an open external-source label.

Current TIA distribution records expose the historical
`TIA/EIA/IS-732-*` lineage through licensed ANSI/TIA/EIA-732 parts; for
example, the official store record for
[ANSI/TIA/EIA-732-100](https://store.accuristech.com/standards/tia-ansi-tia-eia-732-100?product_id=2591772)
identifies `TIA/EIA/IS-732-100` as its historical version. The exact WAP-200
citation scope, required part(s), metadata, and license/access route still need
normalization before the CDPD source chain is complete.

This is a source-completeness blocker for the selected bearer profile, not a
reason to over-credit the current UDP adapter.

## Work closure

- `TRN-701` / `T0-19`: close all nine selected WDP rows, the CDPD/IPv4
  capability declaration, and source-derived datagram fixtures.
- `TRN-703` / `T0-17`: implement and test the five-row WCMP core, then
  capability-gate optional WCMP breadth.
- `WSP-801`, `WSP-802`, `WSP-804`, `WSP-805`: close the eight-row
  connectionless WSP path, exact WAP-203 registries, and browser GET/POST
  ingress.
- `SRC-005`: normalize the `TIAEIA-732` external dependency record.
- `CONF-003`: finish WDP/WSP nested clauses and promote direct normative
  fixtures; the WCMP extraction is complete.

## Enhancement policy

Async I/O, modern socket APIs, better tracing, congestion controls, bounded
buffers, pluggable bearer adapters, and richer diagnostics are welcome.
Strict mode must retain the selected WDP/WCMP/WSP observable behavior.

Additional bearers, connection-oriented WSP/WTP, secure ports, Push, offline
transport, and modern HTTP/TLS bridges are capability-declared modules. They
cannot replace or waive the 22-row strict connectionless path.

## Source handling

Recovered WAP PDFs and private text extractions remain outside Git. The
repository stores source identities, hashes, normalized obligations,
dependency choices, implementation evidence, and work mappings only.
