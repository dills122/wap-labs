# Networking Vector Adoption Sweep

Status: active  
Updated: 2026-03-06  
Ticket: `T0-25`

## Purpose

Rank publicly available WAP interoperability and conformance-vector candidates that Waves can safely reuse or defer, without breaking source-precedence rules.

Machine-readable register:

- [docs/waves/networking-vector-adoption.json](/Users/dsteele/repos/wap-labs/docs/waves/networking-vector-adoption.json)

Validation command:

```bash
node scripts/check-networking-vector-adoption.mjs
```

## Ranked recommendations

| Rank | Item | Decision | Effort | Benefit | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | Wireshark WAP dissector source tree | `adopt-now` | `medium` | `high` | Strongest packet-shape and decode-behavior reference across `WDP`/`WTP`/`WSP`/`WTLS`; best immediate replay and fixture oracle. |
| 2 | Kannel stable source release and `wapbox` implementation | `adopt-now` | `medium` | `high` | Most relevant gateway-side interop reference for Waves because the local smoke environment already depends on Kannel behavior. |
| 3 | Wireshark wiki WAP sample captures | `defer` | `low` | `medium` | Likely useful PCAP seed inputs, but provenance/reuse terms need explicit intake before adoption. |
| 4 | Wireshark protocol wiki pages for `WDP`/`WTP`/`WSP`/`WTLS` | `adopt-now` | `low` | `medium` | Good triage support and protocol-port sanity checks, but only as heuristic context. |

## Decision detail

### Adopt now

1. Wireshark dissector source tree
- Source: official Wireshark project and docs index for `packet-wap`, `packet-wsp`, `packet-wtp`, and `packet-wtls`
- Use for:
  - replay-fixture interpretation
  - decode expectation comparison
  - packet-field naming sanity checks
- Guardrail:
  - GPL-2.0 means this is a behavior-reference input, not copy-paste implementation source

2. Kannel stable source release
- Source: official Kannel download/status/FAQ pages
- Use for:
  - real gateway interop comparison
  - `wapbox` behavior study
  - local Kannel smoke expectations and future replay realism
- Guardrail:
  - treat it as `interop-reference`, not normative transport truth

3. Wireshark protocol wiki pages
- Source: official Wireshark wiki protocol pages
- Use for:
  - port assumptions
  - dissector limitation notes
  - quick cross-checks during fixture design
- Guardrail:
  - treat as `heuristic` only

### Defer

1. Wireshark sample captures
- Reason for defer:
  - likely high value for `T0-24` follow-on realism
  - direct sample-capture provenance and reuse posture are not explicit enough in the referenced pages
- Re-entry condition:
  - ingest through the `T0-23` intake path with explicit provenance and reuse notes

## Scope alignment

These recommendations do not create new `RQ-*` requirements.

They only map external vectors back onto existing ticket and requirement lanes:

1. `T0-20`, `T0-21`, `T0-22`, `T0-24`, `T0-26`
2. `RQ-TRN-001..014`
3. `RQ-SEC-004..005`

## Practical conclusion

1. Best immediate adoption value is Wireshark dissector source plus Kannel source/release artifacts.
2. Best deferred value is sample-capture material once provenance is explicit.
3. This keeps Waves aligned with `T0-23` source-governance rules while still moving replay and gateway realism forward.
