# WAP 1.2.1 Selected-Profile Successor Delta Register

Version: v0.1
Status: `CONF-007` complete for the selected Class C profile

## Purpose

Keep successor-era specifications useful without allowing them to redefine the
WAP 1.2.1 / WML 1.3 compatibility floor. The register classifies all
198/198 selected rows and distinguishes actual successor-derived implementation
foundations from target-era, version-neutral, missing, and successor-only
behavior.

Machine-readable authority:

- `spec-processing/source-manifests/wap-1.2.1-successor-delta.json`

Validation:

```sh
node scripts/check-wap-delta-register.mjs
node scripts/check-requirement-status-drift.mjs
```

Regeneration uses the selected family and clause ledgers plus the four local,
hash-locked successor authorities:

```sh
node spec-processing/scripts/generate-wap-delta-register.mjs \
  --recorded-on YYYY-MM-DD
```

## Result

The register identifies 17 successor-derived implementation foundations:

| Disposition | Selected rows | Meaning |
|---|---:|---|
| Compatible | 2 | Successor mapping preserves the target behavior, subject to direct target-fixture proof |
| Strict correction required | 15 | Current successor-oriented behavior cannot close the target row without target-era correction and fixtures |
| Not successor-derived | 181 | Missing, target-era, or version-neutral behavior; no successor substitution is claimed |
| **Total** | **198** | **Every selected Class C row** |

Of the 17 successor-derived foundations, 15 require strict correction and two
are compatible planning classifications.

This is a planning classification, not conformance evidence. Current clause
implementation status comes from the target-family ledgers; a correction-required
classification remains as historical delta context after direct target-era fixtures
and code/test review establish the strict outcome.

## Family posture

- WAE: 8 implemented/partial foundations are cross-checked against the
  existing WAP-236 delta. Two preserved/subsumed mappings are compatible; six
  expanded, split, relaxed, or decomposed mappings require strict correction.
- WML: `WML-C-17` now has direct WML 1.3 proof for canonical and alternate
  external DTD handling, while strict prologue-presence, internal-subset, and
  full-validation gaps keep its WML2 compatibility behavior contextual. The
  other selected rows have no identified successor-derived implementation
  basis.
- WSP: all eight selected foundations were classified as successor-oriented
  tables or synthetic cases requiring correction against effective WAP-203/SIN
  clauses. WSP-801 and WSP-802 now provide the target-era corrections and direct
  fixtures; the classification remains historical delta context.
- WDP and WCMP: WAP-259 remains family delta context. Existing WDP UDP/IP
  foundations are target-version-neutral; the selected WAP-202 section 5.3
  ICMP path is direct-fixture-backed, while general-WCMP and optional/server
  breadth remain capability-gated.
- WBXML, WMLScript, WMLScript Libraries, and caching: no selected-row
  successor-derived implementation basis is currently identified.

## TRN-707 transport audit

TRN-707 extends the completed `CONF-007` register with transport-specific
evidence; it does not rewrite the 198-row selected-profile classification. The
selected WDP and WCMP implementation foundations remain
`target-era-or-version-neutral`, and WAP-259 remains delta evidence only.

The audit is deliberately narrower than a whole-document equivalence claim.
WAP-259 predates the final effective WAP-200_005 overlay, so compatibility is
proven only for nine directly mapped clauses and their existing target-era
fixtures:

| Classification | Target clauses | WAP-259 comparison | Result |
|---|---|---|---|
| WDP service and primitive | `WDP-CL-CONSISTENT-TRANSPORT-SERVICE`, `WDP-CL-UNITDATA-REQUEST-ANYTIME`, `WDP-CL-UNITDATA-CONTENT-TRANSPARENCY` | 4.1, 4.2, 5.3.2 | Compatible: the bearer-independent service, connectionless T-DUnitdata availability, and unchanged SDU delivery are preserved |
| WDP CDPD/IP and registries | `WDP-CL-IP-BEARER-REQUIRES-UDP`, `WDP-CL-CDPD-UDP-IP-PROFILE`, `WDP-CL-SELECTED-WSP-PORT`, `WDP-CL-SELECTED-BEARER-ASSIGNMENT` | 4.3, 4.4.3, 6.2, Appendices B/C | Compatible: UDP/IP, port 9200, and bearer assignment `0x0D` are unchanged |
| WCMP target delegation | `WCMP-CL-CDPD-USES-ICMP`, `WCMP-CL-IP-NETWORKS-USE-ICMP` | 4.2.2 | Compatible after TRN-708: WAP-259 delegates to WAP-202, whose 5.3 assigns CDPD/IP to ICMP; strict CDPD/IPv4 selects ICMP and the general-WCMP branch is non-IP only |

Direct WDP evidence remains the WAP-200/RFC fixture
`transport-rust/tests/fixtures/transport/wdp_cdpd_ipv4_mapped/wdp_fixture.json`
and is compatible. The focused WAP-202/RFC 792 fixture
`transport-rust/tests/fixtures/transport/wcmp_cdpd_icmp_profile/icmp_fixture.json`
proves the selected ICMPv4 path. TRN-708 is complete; the general-WCMP fixture
remains preserved behind the explicit non-IP capability.

WTP remains conditional and unmapped. TRN-707 does not activate WTP or
connection-oriented WSP; a future capability claim must first map the
effective WAP-201/SIN closure and separately audit the pending WAP-224
successor context. The work item therefore remains `in-progress` even though
its bounded successor audit is complete.

## Successor-only boundary

The register separately records five successor-only capability examples. They
cannot satisfy strict rows and require an explicit successor or extension
capability. This includes WAP-236-only WAE capabilities, WSP assigned numbers
or defaults absent from WAP-203, and WML2-only markup/processing behavior.

## Authority and enhancement policy

WAP-236, WAP-238, WAP-259, and WAP-230 are cryptographically locked as
delta-evidence-only sources. Target-era specifications and SIN precedence
remain normative.

Modern internals, richer behavior, and successor capabilities are welcome
when they preserve strict observable behavior or are isolated behind an
explicit capability. They may not replace a strict requirement merely because
the later design is safer, broader, or more convenient.
