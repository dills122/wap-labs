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
2. WCMP uses RFC 792 ICMP for the CDPD/IP bearer (`WCMP-SP-C-001`) as
   required by WAP-202 section 5.3. General WCMP (`WCMP-SP-C-002`) remains an
   explicitly selected non-IP bearer capability only.
3. WSP uses the connectionless alternative (`WSP-CL-C-001`), which depends on
   WDP and does not activate WTP.

This produces 19 selected-path rows:

| Family | Selected path | Current audit | Direct normative tests |
|---|---:|---|---:|
| WDP | 9 | 9 implemented / 0 partial / 0 missing | 9 |
| WCMP | 2 | 2 implemented / 0 partial / 0 missing | 2 |
| WSP | 8 | 6 implemented / 2 partial / 0 missing | 7 |
| **Total** | **19** | **17 implemented / 2 partial / 0 missing** | **18** |

The two optional WDP rows and three optional WCMP/WSP root-dependency rows are
required by the selected alternatives. Their source `O` status is preserved;
the project profile makes them strict for this path.

## Implementation alignment

### WDP

The Rust transport now carries direct evidence for the selected CDPD/IPv4
WDP path:

- `TDUnitdataRequest` and `TDUnitdataIndication` preserve the selected source
  and destination IPv4 addresses, ports, and user data;
- `CdpdIpv4Profile` declares bearer value `0x0D`, IPv4 addresses, UDP
  protocol number `17`, and connectionless WSP port `9200`;
- the complete Appendix B registry is represented for ports `2805`, `2923`,
  `2948`, `2949`, and `9200..9207`;
- the bounded IPv4/UDP codec verifies header layout, lengths, IPv4 and UDP
  checksums, odd-octet checksum padding, TTL, protocol, and address identity;
- explicit send policy covers the 576-octet IPv4 baseline, larger-destination
  assurance, DF/path-MTU rejection, and UDP checksum omission.

All nine selected rows and their 49 source-anchored WAP-200, RFC 768, and
RFC 791 clauses link to the direct fixture at
`transport-rust/tests/fixtures/transport/wdp_cdpd_ipv4_mapped/wdp_fixture.json`.
The stateless codec continues to reject raw IPv4 fragments with their
reassembly key, preserving the TRN-701 adaptation boundary.

TRN-702 adopts the narrow nine-clause subset governing content transparency,
UDP/IPv4 length bounds, the 576-octet receive baseline, larger-send assurance,
DF handling, and IPv4 fragmentation/reassembly location and identity. The
bounded `Ipv4Reassembler` collects whole/out-of-order/duplicate fragments at
the destination-IP module below WDP, rejects malformed/overlap/oversize input
without truncating WDP unit data, and expires incomplete assemblies using
simulated ticks. Direct replay evidence is in
`transport-rust/tests/fixtures/transport/wdp_constrained_payload_mapped/reassembly_fixture.json`.
No WDP segmentation header is introduced.

TRN-706 now adds a selected-profile WDP-only golden replay tranche at
`transport-rust/tests/network/interop/wdp_cdpd_ipv4_seed.json`. Eleven WDP
clauses directly map byte-exact codec round trip, the 576-octet IPv4 boundary,
IPv4 checksum and UDP-length rejection, idempotent duplicate fragments, and
lower-IP reassembly completion. Schema-v2 accepted and reassembled events now
assert the complete delivered WDP datagram, including exact opaque SDU bytes,
rather than only delivery lengths. Incomplete assembly expiry uses
deterministic simulated ticks as a bounded implementation policy; no exact WAP
timer value is inferred. The declared WTP family remains an explicit
conditional mapping gap owned by additive `TRN-704`/`TRN-705` follow-ups, so
this tranche does not activate connection-oriented WSP/WTP or complete
TRN-706.

### WCMP

`transport-rust/src/network/wcmp/` now owns the selected RFC 792 ICMPv4
codec, profile selection, and explicit ICMP-to-WDP error mapping. The focused
fixture at
`transport-rust/tests/fixtures/transport/wcmp_cdpd_icmp_profile/icmp_fixture.json`
proves type 3 code 3 port-unreachable, type 3 code 4 fragmentation-needed with
DF and Next-Hop MTU 576, and type 8/type 0 echo request/reply handling.

The selected path contains `WCMP-C-001` and `WCMP-SP-C-001`; their nine
source-anchored clauses are directly fixture-backed. The pre-existing general
WCMP types `51`, `60`, `178`, and `179` and their deterministic fixtures remain
implemented through `WdpControlProfile::GeneralWcmpNonIp`. They cannot be
emitted or consumed through `WdpControlProfile::CdpdIpv4Strict` and therefore
do not satisfy or leak into the selected CDPD/IPv4 claim.

Additional generation, processing, endpoint, and diagnostic rows remain
optional capabilities until selected.

### TRN-707 successor-delta evidence

The transport-specific successor audit preserves `CONF-007` as completed
history and adds nine direct comparison clauses under `TRN-707`:

- WDP service/primitive invariants compare effective WAP-200 clauses with
  WAP-259 sections 4.1, 4.2, and 5.3.2;
- the CDPD UDP/IP profile, connectionless WSP port `9200`, and bearer
  assignment `0x0D` compare with WAP-259 sections 4.3, 4.4.3, 6.2, and
  Appendices B/C;
- the selected ICMP-backed WCMP profile remains governed by WAP-202 section
  5.3 because WAP-259 section 4.2.2 delegates WCMP behavior rather than
  redefining it.

The WDP comparisons are compatible with the existing target-era fixtures.
TRN-708 closes the WCMP mismatch exposed by the comparison: WAP-202 section
5.3 assigns CDPD and other IP bearers to ICMP, and the strict profile now
selects that path. TRN-710 maps the completed TRN-703 WAP-202 sections
5.1/5.2/5.5 general-WCMP capability for non-IP use. Sections 5.4.1-.7 bearer
encapsulations and WAP-159 SMPP adaptation remain unimplemented and deferred;
TRN-703/T0-17 remain canonical history and are not reopened.

This is not a whole-document equivalence finding: WAP-259 predates the final
WAP-200_005 overlay, and only the mapped observable assumptions are
classified.

WTP remains a direct-family mapping gap and is not activated. A future
connection-oriented WSP claim must adopt the effective WAP-201/SIN clauses
and audit WAP-224 separately.

### WSP

The Rust transport now has a single canonical connectionless codec with
transaction-ID-prefixed GET, POST, and Reply layouts, exact selected PDU and
status assignments, URI/body constraints, and byte-preserving optional
headers. A stateless primitive adapter enforces client/server role legality and
maps each request directly to one WDP or security-SAP Unitdata operation.

The source-linked `wsp_connectionless_matrix` fixture directly assesses all 35
WSP-801 clauses and seven selected parents. Six selected rows are implemented;
`WSP-CL-C-003` remains partial because WSP-801 closes only its integer-order and
Content-Type framing seams, while `WSP-CL-C-020` remains wholly within WSP-802.
Generic header registry, Encoding-Version, code-page, and unknown/fallback
closure therefore remains explicit follow-on work.

`CONF-003` retains 57 WSP clauses overall. The WSP-801 evidence does not
activate connection-oriented WSP or WTP, and it does not claim the parent
WSP-8 sprint complete before WAE-6.

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

## Source boundary exposed by the bearer choice

RFC 768 and RFC 791 are already backed by hash-locked primary text artifacts.
The CDPD citation `TIAEIA-732` is authority-locked to the historical
December 1997 `TIA/EIA/IS-732` multi-part set with an explicit
licensed-payload, metadata-only acquisition state.

Current TIA distribution records expose the historical
`TIA/EIA/IS-732-*` lineage through licensed ANSI/TIA/EIA-732 parts; for
example, the official store record for
[ANSI/TIA/EIA-732-100](https://store.accuristech.com/standards/tia-ansi-tia-eia-732-100?product_id=2591772)
identifies `TIA/EIA/IS-732-100` as its historical version. The exact WAP-200
citation remains family-wide. The catalog identifies
[ANSI/TIA/EIA-732-311](https://store.accuristech.com/standards/tia-ansi-tia-eia-732-311?product_id=2592308)
as the transport/network lower-layer subprofile and 732-312 as its subnetwork
companion, but WAP-200 does not narrow its citation to either part.

Appendix E classifies bracketed citations as informative, so the licensed
family payload is not treated as an implicit normative-clause import. The
selected bearer declaration still requires WAP-200/RFC 768/RFC 791 behavior
and direct evidence; source normalization does not over-credit the current UDP
adapter.

## Work closure

- `TRN-701` / `T0-19`: complete for the nine selected WDP rows, CDPD/IPv4
  capability declaration, and source-derived datagram fixtures.
- `TRN-702`: complete for the adopted nine-clause constrained-payload subset,
  deterministic lower-IPv4 reassembly policy, and direct simulated replay
  evidence; additional bearers remain unclaimed.
- `TRN-703` / `T0-17`: complete for the capability-gated five-row general-WCMP
  core; it is not selected CDPD/IPv4 evidence.
- `TRN-706`: in progress; the eleven-clause selected WDP replay boundary is
  directly evidenced through exact schema-v2 delivery assertions, while the
  conditional WTP family and full timeout/abort corpus remain open under
  additive `TRN-704`/`TRN-705` follow-ups.
- `TRN-707`: in progress; the nine-clause WDP/WCMP successor comparison is
  complete and compatible after TRN-708, while the conditional WTP mapping
  remains explicit.
- `TRN-708`: complete; the strict CDPD/IPv4 profile selects WAP-202 section
  5.3 ICMPv4 and the completed general-WCMP branch is explicit non-IP only.
- `TRN-710`: complete for direct evidence mapping of the supported WAP-202
  sections 5.1/5.2/5.5 general-WCMP capability; sections 5.4.1-.7 and
  WAP-159 SMPP adaptation remain deferred, and TRN-703 is not reopened.
- `WSP-801`: complete for the 35-clause connectionless PDU, primitive, method,
  transaction, status, URI/body, and exact-byte matrix.
- `WSP-802`, `WSP-804`, `WSP-805`: retain generic header/encoding-version
  closure and browser GET/POST ingress without widening the WTP boundary.
- `SRC-005`: complete; preserve the normalized `TIAEIA-732` dependency and
  licensed-access boundary.
- `CONF-003`: promote direct normative fixtures for the completed WDP, WCMP,
  and connectionless WSP clause extractions; the two WMLScript families
  remain to be extracted.

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
