# TRN-7 AI Context Pack

> Generated from the WAP 1.2.1 knowledge graph slice. Canonical manifests remain authoritative.

## Retrieval contract

- Target: `TRN-7`
- Release/profile: WAP 1.2.1, WML 1.3, `CCR-CLASSC-C-001`
- Compatibility floor: `strict-historical-observable-behavior`
- Selection rule: include the target sprint, its direct dependency/downstream neighbors, all target work items, and only normative clauses explicitly mapped to those work items.
- Safety rule: absence from this pack does not mean a requirement is optional, implemented, or out of scope.
- Enhancement rule: additive behavior may extend strict behavior but may not replace a selected historical obligation.

## Graph summary

- Nodes: 176
- Edges: 548
- Selected work items: 8
- Direct SCR rows: 0
- Direct normative clauses: 91
- Work items without direct clause mappings: 3
- Work items with unmapped declared normative families: 3

## Execution target

### TRN-7: WDP, WCMP, and conditional WTP Class C transport core

- Status: `in-progress`
- Goal: Complete the historical datagram and transaction mechanics required beneath WSP.
- Depends on: `CONF-1`
- Direct downstream sprints: `INT-9`, `WSP-8`

Exit gates:

- The nine-row selected WDP path and two-row selected ICMP-backed WCMP path have executable evidence; the completed five-row general-WCMP branch remains capability-gated for non-IP bearers.
- WTP evidence is required only when connection-oriented WSP is claimed.
- Timing tests are deterministic and do not require live networks.
- WAP 2.0 transport deltas are explicit.

## Work items

### TRN-701: Effective WDP service, addressing, port, and bearer profile

- Status: `done`
- Owner layers: `transport-rust`, `qa`
- Source families: `wdp`, `wdp-wcmp-adaptation`
- Existing tickets: `T0-19`
- Direct SCR rows: 0
- Direct normative clauses: 49

Outputs:

- Effective WDP service, addressing, port, and bearer profile
- spec-processing/source-manifests/wap-1.2.1-wdp-scr.json

Acceptance:

- All nine selected CDPD/IPv4 WDP path rows map to implementation evidence or corrective work; the normalized informative TIAEIA-732 dependency retains its licensed-payload metadata-only boundary.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml`
- `node scripts/check-wap-transport-conformance-ledgers.mjs`

### TRN-702: WDP constrained-payload and segmentation/reassembly policy

- Status: `done`
- Owner layers: `transport-rust`, `qa`
- Source families: `wdp`
- Existing tickets: `T0-19`
- Direct SCR rows: 0
- Direct normative clauses: 9

Outputs:

- WDP constrained-payload and segmentation/reassembly policy
- transport-rust/tests/fixtures/transport/wdp_constrained_payload_mapped/reassembly_fixture.json

Acceptance:

- The nine adopted WAP-200 and RFC 791/768 obligations directly evidence deterministic payload limits, rejection without WDP unit-data truncation, no WDP segmentation header on CDPD/IPv4, and destination-IP reassembly below WDP.
- Whole, fragmented, out-of-order, duplicate, malformed, overlapping, oversize, and incomplete-expiry inputs produce bounded deterministic outcomes for the selected 576-octet baseline profile.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml`
- `cargo test --manifest-path transport-rust/Cargo.toml --test wdp_constrained_replay`
- `node scripts/check-wap-selected-normative-clauses.mjs`
- `node scripts/check-wap-transport-conformance-ledgers.mjs`
- `node scripts/wap-context-pack.mjs TRN-702`
- `node scripts/check-wap-knowledge-graph.mjs`

### TRN-703: WCMP generation/handling and error mapping

- Status: `done`
- Owner layers: `transport-rust`, `qa`
- Source families: `wcmp`, `wdp-wcmp-adaptation`
- Existing tickets: `T0-17`
- Direct SCR rows: 0
- Direct normative clauses: 0

Outputs:

- WCMP generation/handling and error mapping
- spec-processing/source-manifests/wap-1.2.1-wcmp-scr.json

Acceptance:

- The five general-WCMP dependency rows are implemented and tested as an explicit non-IP capability; all 62 source rows retain exact capability disposition using the WAP 1.2.1 byte identity.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml`
- `node scripts/check-wap-transport-conformance-ledgers.mjs`
- `node scripts/wap-context-pack.mjs TRN-703`
- `node scripts/check-wap-knowledge-graph.mjs`

### TRN-704: Effective WTP PDU and transaction state machines

- Status: `todo`
- Owner layers: `transport-rust`, `qa`
- Source families: `wtp`
- Existing tickets: `T0-08`, `T0-18`
- Direct SCR rows: 0
- Direct normative clauses: 0

Outputs:

- Effective WTP PDU and transaction state machines

Acceptance:

- When connection-oriented WSP is claimed, classes, invoke/result/ack/abort, TID, duplicate handling, retransmission, and terminal states map to effective WTP SCR entries.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml`

### TRN-705: WTP timing, NACK, hold-off, and retry closure

- Status: `todo`
- Owner layers: `transport-rust`, `qa`
- Source families: `wtp`
- Existing tickets: `T0-18`
- Direct SCR rows: 0
- Direct normative clauses: 0

Outputs:

- WTP timing, NACK, hold-off, and retry closure

Acceptance:

- When connection-oriented WSP is claimed, all WTP timers and retry limits use deterministic simulated time and incorporate SIN corrections in order.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml`

### TRN-706: WDP/WTP packet and replay golden corpus

- Status: `in-progress`
- Owner layers: `transport-rust`, `qa`
- Source families: `wdp`, `wtp`
- Existing tickets: `T0-22`, `T0-24`
- Direct SCR rows: 0
- Direct normative clauses: 11

Outputs:

- WDP/WTP packet and replay golden corpus
- schema-v2 exact WDP delivery evidence in transport-rust/tests/network/interop/wdp_cdpd_ipv4_seed.json

Acceptance:

- The selected WDP-only tranche replays positive codec round trips, the 576-octet boundary, malformed IPv4/UDP rejection, idempotent duplicate fragments, and simulated incomplete-assembly expiry against directly mapped WAP-200, RFC 768, and RFC 791 clauses; schema-v2 accepted and reassembled delivery events assert exact addresses, ports, and service-data-unit bytes.
- WTP duplicate, retransmission, timeout, and abort families remain conditional on a future connection-oriented WSP/WTP claim and do not close TRN-706 in the strict connectionless profile.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml --test interop_replay`
- `node scripts/check-wap-selected-normative-clauses.mjs`
- `node scripts/wap-context-pack.mjs TRN-706`
- `node scripts/check-wap-knowledge-graph.mjs`

### TRN-707: WAP 1.2.1-to-WAP 2.0 WDP/WTP/WCMP delta register

- Status: `in-progress`
- Owner layers: `documentation`, `transport-rust`, `qa`
- Source families: `wdp`, `wtp`, `wcmp`
- Existing tickets: None
- Direct SCR rows: 0
- Direct normative clauses: 9

Outputs:

- WAP 1.2.1-to-WAP 2.0 WDP/WTP/WCMP delta register
- TRN-707 transport-specific audit in spec-processing/source-manifests/wap-1.2.1-successor-delta.json

Acceptance:

- Current successor-spec implementation assumptions are either proven compatible or ticketed as strict-mode corrections.
- The selected WDP CDPD/UDP/IPv4 service, primitive, port, and bearer assumptions are compared clause-by-clause against effective WAP-200 and WAP-259 without treating the successor as normative.
- The selected ICMP-backed WCMP implementation remains governed by WAP-202; WAP-259 delegates WCMP behavior to that specification rather than redefining it.
- WAP-202 section 5.3 assigns CDPD/IP to ICMP; TRN-708 closes the strict-profile correction and capability-gates the completed TRN-703 general-WCMP branch.
- WTP and connection-oriented WSP remain inactive, and the missing WTP clause mapping remains explicit until a future capability claim activates the effective WAP-201/SIN closure.

Evidence commands:

- `node scripts/check-wap-delta-register.mjs`
- `node scripts/check-wap-selected-normative-clauses.mjs`
- `node scripts/check-wap-transport-conformance-ledgers.mjs`
- `node scripts/wap-context-pack.mjs TRN-707`
- `node scripts/check-wap-knowledge-graph.mjs`
- `cargo test --manifest-path transport-rust/Cargo.toml --lib network::wdp`
- `cargo test --manifest-path transport-rust/Cargo.toml --lib network::wcmp`

### TRN-708: Strict CDPD/IPv4 ICMP profile correction with the existing general-WCMP branch capability-gated for non-IP use

- Status: `done`
- Owner layers: `documentation`, `transport-rust`, `qa`
- Source families: `wdp`, `wcmp`
- Existing tickets: None
- Direct SCR rows: 0
- Direct normative clauses: 13

Outputs:

- Strict CDPD/IPv4 ICMP profile correction with the existing general-WCMP branch capability-gated for non-IP use
- transport-rust/tests/fixtures/transport/wcmp_cdpd_icmp_profile/icmp_fixture.json

Acceptance:

- The strict CDPD/IPv4 profile selects the WAP-202 section 5.3 ICMPv4 path rather than emitting or consuming the section 5.4 general-WCMP wire format.
- Direct fixtures prove ICMPv4 destination-unreachable code 3 (port unreachable), code 4 (fragmentation needed with DF set), and echo request/reply handling at the WDP error boundary for the selected IPv4 bearer.
- The existing WAP-202 section 5.4/5.5 general-WCMP codec and TRN-703 fixtures remain available only behind an explicit non-IP bearer capability and do not satisfy the CDPD/IPv4 strict claim.
- No WTP or connection-oriented WSP capability is activated.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml --test wcmp_cdpd_icmp_profile`
- `node scripts/check-wap-transport-conformance-ledgers.mjs`
- `node scripts/check-wap-selected-normative-clauses.mjs`
- `node scripts/check-requirement-status-drift.mjs`
- `node scripts/wap-context-pack.mjs TRN-708`
- `node scripts/check-wap-knowledge-graph.mjs`

## Direct SCR evidence

- No direct SCR matrix rows are mapped for this selection.
## Direct normative obligations

### TRN-701

- **WDP-CL-ADAPTATION-LAYER-BOUNDARY** — Terminate bearer-specific adaptation at the WDP boundary without changing the service presented to WSP or other upper layers.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.2 (5.2 General Description of the WDP Protocol)
  - Parents: `WDP-C-001`, `WDP-CT-C-002`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-002`
  - Fixture: `WDP-FX-ADAPTATION-LAYER-BOUNDARY` (`transport-boundary`, `implemented`)
- **WDP-CL-APPLICATION-PORT-ADDRESSING** — Provide source and destination port addressing for the higher-layer protocol or application above WDP.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.1 (5.1 Reference Model)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-APPLICATION-PORT-ADDRESSING` (`transport-boundary`, `implemented`)
- **WDP-CL-BEARER-TRANSPARENCY** — Keep bearer-specific mechanics below the transport service access point so upper layers can operate transparently.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.1 (5.1 Reference Model)
  - Parents: `WDP-C-001`, `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-BEARER-TRANSPARENCY` (`transport-boundary`, `implemented`)
- **WDP-CL-CDPD-UDP-IP-PROFILE** — Declare the selected CDPD bearer as an IP-capable profile whose WDP datagram service is UDP over IPv4.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.4.3 (5.4.3 WDP over CDPD)
  - Parents: `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-CDPD-UDP-IP-PROFILE` (`transport-boundary`, `implemented`)
- **WDP-CL-CONSISTENT-TRANSPORT-SERVICE** — Expose the same WDP transport service and primitive contract to upper WAP layers across supported bearer adaptations.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.1 (5.1 Reference Model)
  - Parents: `WDP-C-001`, `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-CONSISTENT-TRANSPORT-SERVICE` (`transport-boundary`, `implemented`)
- **WDP-CL-DESTINATION-ADDRESS-SEMANTICS** — Treat the destination address as the network identity of the receiving device for the submitted user data.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-PF-C-001`, `WDP-PF-C-002`, `WDP-NA-C-000`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-DESTINATION-ADDRESS-SEMANTICS` (`transport-boundary`, `implemented`)
- **WDP-CL-DESTINATION-PORT-SEMANTICS** — Bind the destination port to the destination application or upper-layer protocol for that communication instance.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-PF-C-001`, `WDP-PF-C-002`, `WDP-NA-C-006`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-DESTINATION-PORT-SEMANTICS` (`transport-boundary`, `implemented`)
- **WDP-CL-IP-BEARER-REQUIRES-UDP** — Use UDP as the WDP protocol whenever the selected bearer provides IP.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.3 (5.3 WDP Static Conformance Clause)
  - Parents: `WDP-C-001`, `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IP-BEARER-REQUIRES-UDP` (`transport-boundary`, `implemented`)
- **WDP-CL-IP-MAPPING-FRAGMENTATION** — Rely on IPv4 fragmentation and reassembly below UDP rather than adding a second WDP segmentation header on the CDPD/IP path.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §7.2 (7.2 Mapping of WDP for IP)
  - Parents: `WDP-C-001`, `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IP-MAPPING-FRAGMENTATION` (`transport-boundary`, `implemented`)
- **WDP-CL-IP-MAPPING-IS-UDP** — Map WDP directly to UDP for every selected bearer on which IP routing is available.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §7.2 (7.2 Mapping of WDP for IP)
  - Parents: `WDP-C-001`, `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IP-MAPPING-IS-UDP` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-BASELINE-RECEIVE-SIZE** — Accept IPv4 datagrams up to 576 octets whether received whole or reassembled from fragments.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-BASELINE-RECEIVE-SIZE` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-DONT-FRAGMENT** — Do not fragment a datagram whose DF bit is set; discard it when the route cannot carry it intact.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-DONT-FRAGMENT` (`error-policy`, `implemented`)
- **WDP-CL-IPV4-FIXED-ADDRESS-SIZE** — Represent each selected IPv4 source or destination address as four octets.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §2.3 (2.3.  Function Description)
  - Parents: `WDP-NA-C-000`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-FIXED-ADDRESS-SIZE` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY** — Group IPv4 fragments by identification, source, destination, and protocol, then place data using fragment offsets and the final-fragment marker.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-FRAGMENT-REASSEMBLY-KEY` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-FRAGMENTATION-LOCATION** — Allow IPv4 fragmentation at gateways and reassemble fragments at the destination IP module below WDP.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-FRAGMENTATION-LOCATION` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-HEADER-CHECKSUM** — Verify the ones-complement IPv4 header checksum and discard a datagram immediately when verification fails.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-HEADER-CHECKSUM` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-HEADER-LAYOUT** — Decode the complete IPv4 header field order and widths before passing its UDP payload to WDP.
  - Family: `wdp`; force: `grammar`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-HEADER-LAYOUT` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-INDEPENDENT-DATAGRAMS** — Treat each IPv4 datagram independently without a transport connection or logical circuit.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §1.4 (1.4.  Operation)
  - Parents: `WDP-C-001`, `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-INDEPENDENT-DATAGRAMS` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-LARGE-SEND-GUARD** — Send an IPv4 datagram larger than 576 octets only with assurance that the destination can accept it.
  - Family: `wdp`; force: `explicit-should`; level: `recommended`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-LARGE-SEND-GUARD` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-NO-RELIABILITY** — Do not imply acknowledgments, retransmission, data error control, or flow control at the IPv4 layer.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §1.4 (1.4.  Operation)
  - Parents: `WDP-C-001`, `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-IPV4-NO-RELIABILITY` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-ROBUST-INTEROPERATION** — Send well-formed IPv4 datagrams and accept every received datagram whose meaning can be interpreted safely.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-ROBUST-INTEROPERATION` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS** — Preserve the 32-bit IPv4 source and destination header fields across the WDP request and indication boundary.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-PF-C-001`, `WDP-PF-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-SOURCE-DESTINATION-FIELDS` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-TOTAL-LENGTH** — Interpret IPv4 total length as header plus payload octets with a maximum representable value of 65,535.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-TOTAL-LENGTH` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-TTL-ZERO** — Destroy an IPv4 datagram when its time-to-live value reaches zero.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-TTL-ZERO` (`error-policy`, `implemented`)
- **WDP-CL-IPV4-VERSION-AND-IHL** — Require IPv4 version value 4 and use IHL in 32-bit words with a minimum valid value of five.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-VERSION-AND-IHL` (`binary-decoder`, `implemented`)
- **WDP-CL-PROTOCOL-REQUIRED-PORT-FIELDS** — Carry both destination and source port fields in the selected WDP protocol mapping.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §7.1 (7.1 Introduction)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-PROTOCOL-REQUIRED-PORT-FIELDS` (`binary-decoder`, `implemented`)
- **WDP-CL-SELECTED-BEARER-ASSIGNMENT** — Represent the AMPS/CDPD/IPv4 network-bearer-address combination with assigned bearer value 0x0D when that registry is carried.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `WAP-200-WDP` §appendix-c (Appendix C: Bearer Type Assignments)
  - Parents: `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-SELECTED-BEARER-ASSIGNMENT` (`transport-boundary`, `implemented`)
- **WDP-CL-SELECTED-WSP-PORT** — Use registered UDP/WDP port 9200 for the selected non-secure connectionless WSP session service.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `WAP-200-WDP` §appendix-b (Appendix B: Port Number Definitions)
  - Parents: `WDP-C-001`, `WDP-NA-C-006`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-SELECTED-WSP-PORT` (`transport-boundary`, `implemented`)
- **WDP-CL-SIMULTANEOUS-INSTANCES** — Use port numbers to multiplex multiple simultaneous higher-layer communication instances over one WDP bearer service.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.2 (5.2 General Description of the WDP Protocol)
  - Parents: `WDP-C-001`, `WDP-CORE-C-001`, `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-SIMULTANEOUS-INSTANCES` (`transport-boundary`, `implemented`)
- **WDP-CL-SOURCE-ADDRESS-SEMANTICS** — Treat the source address as the unique network identity of the device issuing the transport request.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-PF-C-001`, `WDP-PF-C-002`, `WDP-NA-C-000`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-SOURCE-ADDRESS-SEMANTICS` (`transport-boundary`, `implemented`)
- **WDP-CL-SOURCE-PORT-SEMANTICS** — Bind the source port to the requesting application or upper-layer protocol for that communication instance.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-PF-C-001`, `WDP-PF-C-002`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-SOURCE-PORT-SEMANTICS` (`transport-boundary`, `implemented`)
- **WDP-CL-UDP-CHECKSUM-COVERAGE** — Compute the UDP checksum over the IPv4 pseudo-header, UDP header, and data using 16-bit ones-complement arithmetic.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-CHECKSUM-COVERAGE` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-CHECKSUM-OMISSION** — Accept an all-zero UDP checksum field as the IPv4 sender choosing not to generate a UDP checksum.
  - Family: `wdp`; force: `explicit-may`; level: `permitted`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UDP-CHECKSUM-OMISSION` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-CHECKSUM-PADDING** — Zero-pad an odd checksum input to a two-octet boundary without transmitting the padding octet.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UDP-CHECKSUM-PADDING` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-CHECKSUM-ZERO-ENCODING** — Transmit an arithmetically computed zero UDP checksum as all one bits.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UDP-CHECKSUM-ZERO-ENCODING` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-DESTINATION-PORT-CONTEXT** — Interpret a UDP destination port within the context of its destination IPv4 address.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-NA-C-006`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-DESTINATION-PORT-CONTEXT` (`transport-boundary`, `implemented`)
- **WDP-CL-UDP-HEADER-LAYOUT** — Encode and decode the UDP header as 16-bit source port, destination port, length, and checksum fields followed by data.
  - Family: `wdp`; force: `grammar`; level: `required`
  - Source: `rfc-768` §format (Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-HEADER-LAYOUT` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-IP-INTERFACE-METADATA** — Make source address, destination address, and IP protocol metadata available at the UDP/IP boundary.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-768` §ip-interface (IP Interface)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-IP-INTERFACE-METADATA` (`transport-boundary`, `implemented`)
- **WDP-CL-UDP-IP-PROTOCOL-NUMBER** — Identify UDP with IPv4 protocol number 17.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `rfc-768` §protocol-number (Protocol Number)
  - Parents: `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-IP-PROTOCOL-NUMBER` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-LENGTH-BOUNDS** — Interpret UDP length as header plus data octets and reject values smaller than the eight-octet header.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UDP-LENGTH-BOUNDS` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-RECEIVE-INTERFACE** — Provide receive-port creation and return received data with its source IPv4 address and source port.
  - Family: `wdp`; force: `explicit-should`; level: `recommended`
  - Source: `rfc-768` §interface (User Interface)
  - Parents: `WDP-PF-C-002`, `WDP-NA-C-003`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-RECEIVE-INTERFACE` (`transport-boundary`, `implemented`)
- **WDP-CL-UDP-SEND-INTERFACE** — Provide datagram send using explicit data, source and destination ports, and source and destination IPv4 addresses.
  - Family: `wdp`; force: `explicit-should`; level: `recommended`
  - Source: `rfc-768` §interface (User Interface)
  - Parents: `WDP-PF-C-001`, `WDP-NA-C-003`, `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-SEND-INTERFACE` (`transport-boundary`, `implemented`)
- **WDP-CL-UDP-SOURCE-PORT-ZERO** — Use source port zero when the sender does not supply a meaningful reply port, and otherwise preserve the selected source port.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-NA-C-007`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-SOURCE-PORT-ZERO` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-UNRELIABLE-DATAGRAMS** — Expose UDP as a connectionless datagram service that does not guarantee delivery, ordering, or duplicate suppression.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-768` §introduction (Introduction)
  - Parents: `WDP-C-001`, `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UDP-UNRELIABLE-DATAGRAMS` (`transport-boundary`, `implemented`)
- **WDP-CL-UNITDATA-CONTENT-TRANSPARENCY** — Transmit and deliver the complete service data unit without manipulating its content.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-CORE-C-001`, `WDP-PF-C-001`, `WDP-PF-C-002`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UNITDATA-CONTENT-TRANSPARENCY` (`transport-boundary`, `implemented`)
- **WDP-CL-UNITDATA-INDICATION-PARAMETERS** — Deliver source address, source port, and user data on T-DUnitdata indication, with destination address and port when available.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-CORE-C-001`, `WDP-PF-C-002`, `WDP-NA-C-000`, `WDP-NA-C-003`, `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UNITDATA-INDICATION-PARAMETERS` (`transport-boundary`, `implemented`)
- **WDP-CL-UNITDATA-REQUEST-ANYTIME** — Allow T-DUnitdata.request without establishing a prior transport connection.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-PF-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UNITDATA-REQUEST-ANYTIME` (`transport-boundary`, `implemented`)
- **WDP-CL-UNITDATA-REQUEST-PARAMETERS** — Require source address, source port, destination address, destination port, and user data on every T-DUnitdata request.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-CORE-C-001`, `WDP-PF-C-001`, `WDP-NA-C-000`, `WDP-NA-C-003`, `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UNITDATA-REQUEST-PARAMETERS` (`transport-boundary`, `implemented`)
- **WDP-CL-WAP-PORT-REGISTRY** — Recognize the complete WAP port assignment table, including connectionless, session, secure, push, vCard, and vCalendar services.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `WAP-200-WDP` §appendix-b (Appendix B: Port Number Definitions)
  - Parents: `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-WAP-PORT-REGISTRY` (`transport-boundary`, `implemented`)

### TRN-702

- **WDP-CL-IP-MAPPING-FRAGMENTATION** — Rely on IPv4 fragmentation and reassembly below UDP rather than adding a second WDP segmentation header on the CDPD/IP path.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §7.2 (7.2 Mapping of WDP for IP)
  - Parents: `WDP-C-001`, `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IP-MAPPING-FRAGMENTATION` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-BASELINE-RECEIVE-SIZE** — Accept IPv4 datagrams up to 576 octets whether received whole or reassembled from fragments.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-BASELINE-RECEIVE-SIZE` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-DONT-FRAGMENT** — Do not fragment a datagram whose DF bit is set; discard it when the route cannot carry it intact.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-DONT-FRAGMENT` (`error-policy`, `implemented`)
- **WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY** — Group IPv4 fragments by identification, source, destination, and protocol, then place data using fragment offsets and the final-fragment marker.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-FRAGMENT-REASSEMBLY-KEY` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-FRAGMENTATION-LOCATION** — Allow IPv4 fragmentation at gateways and reassemble fragments at the destination IP module below WDP.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-FRAGMENTATION-LOCATION` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-LARGE-SEND-GUARD** — Send an IPv4 datagram larger than 576 octets only with assurance that the destination can accept it.
  - Family: `wdp`; force: `explicit-should`; level: `recommended`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-LARGE-SEND-GUARD` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-TOTAL-LENGTH** — Interpret IPv4 total length as header plus payload octets with a maximum representable value of 65,535.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-TOTAL-LENGTH` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-LENGTH-BOUNDS** — Interpret UDP length as header plus data octets and reject values smaller than the eight-octet header.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UDP-LENGTH-BOUNDS` (`binary-decoder`, `implemented`)
- **WDP-CL-UNITDATA-CONTENT-TRANSPARENCY** — Transmit and deliver the complete service data unit without manipulating its content.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-CORE-C-001`, `WDP-PF-C-001`, `WDP-PF-C-002`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UNITDATA-CONTENT-TRANSPARENCY` (`transport-boundary`, `implemented`)

### TRN-706

- **WDP-CL-CDPD-UDP-IP-PROFILE** — Declare the selected CDPD bearer as an IP-capable profile whose WDP datagram service is UDP over IPv4.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.4.3 (5.4.3 WDP over CDPD)
  - Parents: `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-CDPD-UDP-IP-PROFILE` (`transport-boundary`, `implemented`)
- **WDP-CL-IP-MAPPING-FRAGMENTATION** — Rely on IPv4 fragmentation and reassembly below UDP rather than adding a second WDP segmentation header on the CDPD/IP path.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §7.2 (7.2 Mapping of WDP for IP)
  - Parents: `WDP-C-001`, `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IP-MAPPING-FRAGMENTATION` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-BASELINE-RECEIVE-SIZE** — Accept IPv4 datagrams up to 576 octets whether received whole or reassembled from fragments.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-BASELINE-RECEIVE-SIZE` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY** — Group IPv4 fragments by identification, source, destination, and protocol, then place data using fragment offsets and the final-fragment marker.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-FRAGMENT-REASSEMBLY-KEY` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-FRAGMENTATION-LOCATION** — Allow IPv4 fragmentation at gateways and reassemble fragments at the destination IP module below WDP.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-FRAGMENTATION-LOCATION` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-HEADER-CHECKSUM** — Verify the ones-complement IPv4 header checksum and discard a datagram immediately when verification fails.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-HEADER-CHECKSUM` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-HEADER-LAYOUT** — Decode the complete IPv4 header field order and widths before passing its UDP payload to WDP.
  - Family: `wdp`; force: `grammar`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-NA-C-003`
  - Requirements: `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-HEADER-LAYOUT` (`binary-decoder`, `implemented`)
- **WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS** — Preserve the 32-bit IPv4 source and destination header fields across the WDP request and indication boundary.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `rfc-791` §3.1 (3.1.  Internet Header Format)
  - Parents: `WDP-PF-C-001`, `WDP-PF-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-SOURCE-DESTINATION-FIELDS` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-HEADER-LAYOUT** — Encode and decode the UDP header as 16-bit source port, destination port, length, and checksum fields followed by data.
  - Family: `wdp`; force: `grammar`; level: `required`
  - Source: `rfc-768` §format (Format)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-006`, `WDP-NA-C-007`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-UDP-HEADER-LAYOUT` (`binary-decoder`, `implemented`)
- **WDP-CL-UDP-LENGTH-BOUNDS** — Interpret UDP length as header plus data octets and reject values smaller than the eight-octet header.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `rfc-768` §fields (Fields)
  - Parents: `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UDP-LENGTH-BOUNDS` (`binary-decoder`, `implemented`)
- **WDP-CL-UNITDATA-CONTENT-TRANSPARENCY** — Transmit and deliver the complete service data unit without manipulating its content.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-CORE-C-001`, `WDP-PF-C-001`, `WDP-PF-C-002`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UNITDATA-CONTENT-TRANSPARENCY` (`transport-boundary`, `implemented`)

### TRN-707

- **WCMP-CL-CDPD-USES-ICMP** — Select the ICMP control-message path for CDPD instead of the general WCMP wire format defined for non-IP networks.
  - Family: `wcmp`; force: `table`; level: `required`
  - Source: `WAP-202-WCMP` §5.3 (5.3. WCMP in IP Networks)
  - Parents: `WCMP-C-001`, `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-CDPD-USES-ICMP` (`transport-boundary`, `implemented`)
- **WCMP-CL-IP-NETWORKS-USE-ICMP** — Use ICMP to provide WCMP error-reporting and diagnostic functions whenever the selected bearer network is IP based.
  - Family: `wcmp`; force: `explicit-must`; level: `required`
  - Source: `WAP-202-WCMP` §5.3 (5.3. WCMP in IP Networks)
  - Parents: `WCMP-C-001`, `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-IP-NETWORKS-USE-ICMP` (`transport-boundary`, `implemented`)
- **WDP-CL-CDPD-UDP-IP-PROFILE** — Declare the selected CDPD bearer as an IP-capable profile whose WDP datagram service is UDP over IPv4.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.4.3 (5.4.3 WDP over CDPD)
  - Parents: `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-CDPD-UDP-IP-PROFILE` (`transport-boundary`, `implemented`)
- **WDP-CL-CONSISTENT-TRANSPORT-SERVICE** — Expose the same WDP transport service and primitive contract to upper WAP layers across supported bearer adaptations.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.1 (5.1 Reference Model)
  - Parents: `WDP-C-001`, `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-CONSISTENT-TRANSPORT-SERVICE` (`transport-boundary`, `implemented`)
- **WDP-CL-IP-BEARER-REQUIRES-UDP** — Use UDP as the WDP protocol whenever the selected bearer provides IP.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.3 (5.3 WDP Static Conformance Clause)
  - Parents: `WDP-C-001`, `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IP-BEARER-REQUIRES-UDP` (`transport-boundary`, `implemented`)
- **WDP-CL-SELECTED-BEARER-ASSIGNMENT** — Represent the AMPS/CDPD/IPv4 network-bearer-address combination with assigned bearer value 0x0D when that registry is carried.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `WAP-200-WDP` §appendix-c (Appendix C: Bearer Type Assignments)
  - Parents: `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-SELECTED-BEARER-ASSIGNMENT` (`transport-boundary`, `implemented`)
- **WDP-CL-SELECTED-WSP-PORT** — Use registered UDP/WDP port 9200 for the selected non-secure connectionless WSP session service.
  - Family: `wdp`; force: `table`; level: `required`
  - Source: `WAP-200-WDP` §appendix-b (Appendix B: Port Number Definitions)
  - Parents: `WDP-C-001`, `WDP-NA-C-006`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-SELECTED-WSP-PORT` (`transport-boundary`, `implemented`)
- **WDP-CL-UNITDATA-CONTENT-TRANSPARENCY** — Transmit and deliver the complete service data unit without manipulating its content.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-CORE-C-001`, `WDP-PF-C-001`, `WDP-PF-C-002`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UNITDATA-CONTENT-TRANSPARENCY` (`transport-boundary`, `implemented`)
- **WDP-CL-UNITDATA-REQUEST-ANYTIME** — Allow T-DUnitdata.request without establishing a prior transport connection.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §6.3.1.1 (6.3.1.1 T-DUnitdata)
  - Parents: `WDP-PF-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-UNITDATA-REQUEST-ANYTIME` (`transport-boundary`, `implemented`)

### TRN-708

- **WCMP-CL-CDPD-USES-ICMP** — Select the ICMP control-message path for CDPD instead of the general WCMP wire format defined for non-IP networks.
  - Family: `wcmp`; force: `table`; level: `required`
  - Source: `WAP-202-WCMP` §5.3 (5.3. WCMP in IP Networks)
  - Parents: `WCMP-C-001`, `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-CDPD-USES-ICMP` (`transport-boundary`, `implemented`)
- **WCMP-CL-ICMPV4-CHECKSUM** — Encode and verify the ICMPv4 ones-complement checksum across the complete control message with the checksum field zeroed for calculation.
  - Family: `wcmp`; force: `grammar`; level: `required`
  - Source: `rfc-792` §message-formats (Message Formats)
  - Parents: `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-ICMPV4-CHECKSUM` (`binary-decoder`, `implemented`)
- **WCMP-CL-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT** — Decode ICMPv4 Destination Unreachable as Type 3, Code, Checksum, four-octet type-specific data, and the quoted original IPv4 header plus data.
  - Family: `wcmp`; force: `grammar`; level: `required`
  - Source: `rfc-792` §destination-unreachable (Destination Unreachable Message)
  - Parents: `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT` (`binary-decoder`, `implemented`)
- **WCMP-CL-ICMPV4-ECHO-ROUNDTRIP** — Handle ICMPv4 Echo Request type 8 and Echo Reply type 0 with Code 0 while preserving the identifier, sequence number, and returned data.
  - Family: `wcmp`; force: `explicit-must`; level: `required`
  - Source: `rfc-792` §echo (Echo or Echo Reply Message)
  - Parents: `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-ICMPV4-ECHO-ROUNDTRIP` (`transport-boundary`, `implemented`)
- **WCMP-CL-ICMPV4-ERROR-QUOTE** — Preserve the quoted original IPv4 header and first 64 data bits so the ICMPv4 error can be correlated with the affected WDP UDP datagram.
  - Family: `wcmp`; force: `grammar`; level: `required`
  - Source: `rfc-792` §destination-unreachable (Destination Unreachable Message)
  - Parents: `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-ICMPV4-ERROR-QUOTE` (`binary-decoder`, `implemented`)
- **WCMP-CL-ICMPV4-FRAGMENTATION-NEEDED** — Interpret ICMPv4 Destination Unreachable type 3 code 4 as fragmentation needed while the original IPv4 datagram had the DF flag set, preserving the RFC 1191 Next-Hop MTU when present.
  - Family: `wcmp`; force: `table`; level: `required`
  - Source: `rfc-792` §destination-unreachable (Destination Unreachable Message)
  - Parents: `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-ICMPV4-FRAGMENTATION-NEEDED` (`error-policy`, `implemented`)
- **WCMP-CL-ICMPV4-PORT-UNREACHABLE** — Interpret ICMPv4 Destination Unreachable type 3 code 3 as an inactive destination process port and map the quoted UDP destination port at the WDP boundary.
  - Family: `wcmp`; force: `table`; level: `required`
  - Source: `rfc-792` §destination-unreachable (Destination Unreachable Message)
  - Parents: `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-ICMPV4-PORT-UNREACHABLE` (`error-policy`, `implemented`)
- **WCMP-CL-ICMPV4-PROTOCOL** — Carry ICMPv4 as IPv4 protocol number 1 and dispatch each control message from its leading Type field.
  - Family: `wcmp`; force: `table`; level: `required`
  - Source: `rfc-792` §message-formats (Message Formats)
  - Parents: `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-ICMPV4-PROTOCOL` (`binary-decoder`, `implemented`)
- **WCMP-CL-IP-NETWORKS-USE-ICMP** — Use ICMP to provide WCMP error-reporting and diagnostic functions whenever the selected bearer network is IP based.
  - Family: `wcmp`; force: `explicit-must`; level: `required`
  - Source: `WAP-202-WCMP` §5.3 (5.3. WCMP in IP Networks)
  - Parents: `WCMP-C-001`, `WCMP-SP-C-001`
  - Requirements: `RQ-TRX-006`, `RQ-TRX-007`, `RQ-TRX-008`
  - Fixture: `WCMP-FX-IP-NETWORKS-USE-ICMP` (`transport-boundary`, `implemented`)
- **WDP-CL-CDPD-UDP-IP-PROFILE** — Declare the selected CDPD bearer as an IP-capable profile whose WDP datagram service is UDP over IPv4.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.4.3 (5.4.3 WDP over CDPD)
  - Parents: `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-CDPD-UDP-IP-PROFILE` (`transport-boundary`, `implemented`)
- **WDP-CL-CONSISTENT-TRANSPORT-SERVICE** — Expose the same WDP transport service and primitive contract to upper WAP layers across supported bearer adaptations.
  - Family: `wdp`; force: `implicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.1 (5.1 Reference Model)
  - Parents: `WDP-C-001`, `WDP-CORE-C-001`
  - Requirements: `RQ-TRN-001`
  - Fixture: `WDP-FX-CONSISTENT-TRANSPORT-SERVICE` (`transport-boundary`, `implemented`)
- **WDP-CL-IP-BEARER-REQUIRES-UDP** — Use UDP as the WDP protocol whenever the selected bearer provides IP.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `WAP-200-WDP` §5.3 (5.3 WDP Static Conformance Clause)
  - Parents: `WDP-C-001`, `WDP-CT-C-002`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IP-BEARER-REQUIRES-UDP` (`transport-boundary`, `implemented`)
- **WDP-CL-IPV4-DONT-FRAGMENT** — Do not fragment a datagram whose DF bit is set; discard it when the route cannot carry it intact.
  - Family: `wdp`; force: `explicit-must`; level: `required`
  - Source: `rfc-791` §3.2 (3.2.  Discussion)
  - Parents: `WDP-CORE-C-001`, `WDP-NA-C-003`
  - Requirements: `RQ-TRN-001`, `RQ-TRN-003`
  - Fixture: `WDP-FX-IPV4-DONT-FRAGMENT` (`error-policy`, `implemented`)

## Explicit mapping gaps

- `TRN-703` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.
- `TRN-704` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.
- `TRN-705` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.

Declared-family gaps:

- `TRN-703` declares `wcmp` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.
- `TRN-706` declares `wtp` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.
- `TRN-707` declares `wtp` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.

## Source documents

- `OMA-WAP-201_003-WTP-SIN`: Wireless Transaction Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/OMA-WAP-201_003-WTP-SIN-20020904-a.PDF
- `rfc-768`: rfc-768
- `rfc-791`: rfc-791
- `rfc-792`: rfc-792
- `WAP-159-WDPWCMPAdapt`: WDP/WCMP Wireless Data Gateway Adaptation — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-159-WDPWCMPAdapt-20010713-a.pdf
- `WAP-200_001-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_001-WDP-20001212-a.pdf
- `WAP-200_002-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_002-WDP-20001213-a.pdf
- `WAP-200_003-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_003-WDP-20010328-a.pdf
- `WAP-200_004-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_004-WDP-20010517-a.pdf
- `WAP-200_005-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_005-WDP-20010718-a.pdf
- `WAP-200-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200-WDP-20000219-a.pdf
- `WAP-201_001-WTP`: Wireless Transaction Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-201_001-WTP-20001212-a.pdf
- `WAP-201_002-WTP`: Wireless Transaction Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-201_002-WTP-20001213-a.pdf
- `WAP-201-WTP`: Wireless Transaction Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-201-WTP-20000219-a.pdf
- `WAP-202-WCMP`: Wireless Control Message Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-202-WCMP-20010624-a.pdf
- `WAP-215-ClassConform-20001213-a`: Class Conformance Requirements — https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf
- `WAP-259-WDP-20010614-a`: Wireless Datagram Protocol
