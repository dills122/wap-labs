# WAP 1.2.1 / WML 1.3 Source Baseline

Version: v0.2
Status: active target baseline; exact Class C client profile applied

## Compatibility target

Waves targets WAP 1.2.1 with WML 1.3 as its primary historical compatibility
floor.

Strict mode must reproduce observable behavior required by that release.
Modern internals, performance improvements, diagnostics, user experience, and
explicit Waves extensions are allowed when they preserve strict outcomes or
are kept behind a clearly separate capability/mode.

This document defines the source baseline. It does not claim implementation or
certification conformance.

## Authority and source lock

Primary authority:

- WAP Forum material preserved by the Open Mobile Alliance (OMA)
- [OMA WAP Forum release catalog](https://www.openmobilealliance.org/specifications/affiliates/wap-forum/)
- [Official WAP affiliate archive directory](https://www.openmobilealliance.org/tech/affiliates/wap/)
- [OMA use agreement](https://www.openmobilealliance.org/about/policies/use-agreement/)

Machine-readable release inventory:

- `spec-processing/source-manifests/wap-1.2.1-release.json`
- `spec-processing/source-manifests/wap-1.2.1-effective-spec.json`
- `spec-processing/source-manifests/wap-1.2.1-class-conformance.json`
- `spec-processing/source-manifests/wap-1.2.1-ingestion-status.json`
- `spec-processing/source-manifests/wap-1.2.1-external-dependencies.json`
- `spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json`
- `spec-processing/source-manifests/wap-1.2.1-wml-scr.json`

Recovery and permission runbook:

- `docs/waves/WAP_SOURCE_RECOVERY_AND_PERMISSION.md`

Compliance execution program:

- `docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md`
- `docs/waves/wap-1.2.1-compliance-program.json`

Validation:

```sh
node spec-processing/scripts/check-wap-release-manifest.mjs
node spec-processing/scripts/check-wap-class-conformance.mjs
node spec-processing/scripts/check-wap-effective-spec.mjs
node spec-processing/scripts/check-wap-ingestion-status.mjs
node scripts/check-wap-external-dependencies.mjs
node spec-processing/scripts/check-wap-external-ingestion-status.mjs
node scripts/check-wap-compliance-program.mjs
node scripts/check-wap-conformance-ledger.mjs
```

The manifest, not the incidental local PDF list, defines membership in the
target release.

## Release snapshot

Official archive:

- Label: WAP 1.2.1 (June 2000)
- Archive snapshot: `Technical_June2000-20021106[1].zip`
- Size: 7,817,993 bytes
- SHA-256: `382b7991701f99bc88e61c33aca740440044381788ba4b87591242a3a5e11cae`
- Integrity: all 97 members pass ZIP validation

Preliminary planning classification:

| Source class | Members | Meaning |
|---|---:|---|
| `core-mandatory` | 29 | Initial corpus-priority bucket; exact selected-profile status comes from WAP-215 and the effective SCR ledgers |
| `core-optional` | 7 | Initial corpus-priority bucket for conditional/optional review, not a conformance verdict |
| `dependency` | 6 | Architecture, overview, formats, caching, or adaptation material needed to interpret core behavior |
| `profile-optional` | 53 | Push, telephony, identity, bearer, and other optional profiles |
| `historical` | 2 | Proposed documents retained for release history, not approved normative behavior |

These classes are project planning labels. The completed WAP-215 selection and
effective SCR graph supersede them for conformance: WCMP is mandatory in the
selected Class C client path, while WTP is conditional on claiming
connection-oriented WSP.

## Local preservation status

The repository currently has 98 canonical root-level PDFs, primarily from the
later WAP 2.0 technical bundle. Against the WAP 1.2.1 source lock:

| State | Members |
|---|---:|
| Byte-exact local copy | 21 |
| Same filename, different bytes | 4 |
| Missing from canonical corpus | 72 |

The four same-name variants are:

- `WAP-120-WAPCachingMod-20010413-a.pdf`
- `WAP-161-WMLScriptCrypto-20010620-a.pdf`
- `WAP-188-WAPGenFormats-20010710-a.pdf`
- `WAP-202-WCMP-20010624-a.pdf`

The strict-core/dependency/conditional subset has 42 release members:

| Family | Release members | Exact | Different | Missing |
|---|---:|---:|---:|---:|
| Architecture | 1 | 0 | 0 | 1 |
| WAE specification and overview | 7 | 0 | 0 | 7 |
| WML 1.3 | 4 | 4 | 0 | 0 |
| WBXML | 2 | 2 | 0 | 0 |
| WMLScript and standard libraries | 4 | 4 | 0 | 0 |
| WDP | 6 | 0 | 0 | 6 |
| WTP | 4 | 0 | 0 | 4 |
| WSP | 4 | 0 | 0 | 4 |
| WTLS | 6 | 1 | 0 | 5 |
| Caching, formats, WDP/WCMP adaptation, and WCMP | 4 | 1 | 3 | 0 |
| **Total** | **42** | **12** | **3** | **27** |

Therefore source recovery has 30 high-value release corrections: 27 missing
members and 3 same-name but non-release-exact dependencies. The fourth
same-name difference is the optional WMLScript Crypto profile.

The complete official archive has now also been processed in the private
research cache:

| Research-ingestion state | Members |
|---|---:|
| Release PDF hash/size verified | 97 |
| Non-empty text extraction hash/size recorded | 97 |
| PDF pages represented | 2,270 |
| Already byte-exact in the canonical Git corpus | 21 |
| Recovered or divergent member awaiting promotion review | 76 |

This closes the research-access gap for the 97 technical members. It does not
close the public-repository promotion or formal requirement-extraction gaps.

## Effective core families

Base specifications and their release-carried SIN overlays must be interpreted
together, in publication order:

- Architecture: `WAP-100`
- WAE: `WAP-190` + SINs `101`, `102`, `103`, `104`; overview `WAP-195` + SIN `101`
- WML 1.3: `WAP-191` + SINs `102`, `104`, `105`
- WBXML: `WAP-192` + SIN `105`
- WMLScript: `WAP-193` + SIN `101`
- WMLScript libraries: `WAP-194` + SIN `103`
- WDP: `WAP-200` + SINs `001` through `005`
- WTP: `WAP-201` + SINs `001`, `002`, `003`
- WSP: `WAP-203` + SINs `001`, `003`, `005`
- WTLS: `WAP-199` + SINs `102` through `106`

All nine selected Class C family SCR ledgers are now complete at feature
level:

- WML: 76 active rows; `WML:MCF` selects 39 mandatory user-agent rows.
- WAE: 86 active rows plus 22 SIN-removed history rows; `WAESpec:MCF`
  selects 11 mandatory client rows.
- WBXML: 15 active rows; `WBXML:MCF` selects all three mandatory client rows
  and leaves 12 server/document/encoder rows outside the client profile.
- WMLScript: 112 active rows; `WMLScript:MCF` selects 41 mandatory
  interpreter rows.
- WMLScript Libraries: 95 effective rows; `WMLScriptLibs:MCF` selects 80
  mandatory interpreter rows and keeps two optional interpreter rows
  separately declared.
- Caching: 11 active rows; `WAPCachingMod:MCF` selects five mandatory
  user-agent rows and keeps optional time synchronization plus all gateway
  rows outside the selected client profile.
- WDP: 146 active rows; the selected nine-row path resolves `WDP:MCF` through
  CDPD-shaped UDP/IPv4.
- WCMP: 62 active rows; the selected five-row path resolves `WCMP:MCF`
  through the general WCMP message structure.
- WSP: 109 active rows; the selected eight-row path resolves `WSP:MCF`
  through connectionless WSP.

Nested normative-clause extraction is complete for WML, WAE, WBXML, caching,
WCMP, the selected connectionless WSP path, and the selected CDPD/UDP/IPv4 WDP
path. WMLScript and WMLScript libraries remain. WTP is additionally required
only if connection-oriented WSP is claimed. The selected CDPD `TIAEIA-732` family
citation is normalized as an informative, licensed-payload metadata-only
dependency.

The WAP 2.0-era WAE (`WAP-236`), WDP (`WAP-259`), WTP (`WAP-224`), WSP
(`WAP-230`), WTLS (`WAP-261`), and architecture (`WAP-210`) documents are
successor/delta evidence. They must not silently replace the WAP 1.2.1
effective specification in strict-mode requirements.

## Associated and governing sources

The official WAP Forum June 2000 release page lists these supporting assets:

| Asset | Bytes | SHA-256 | Repository state |
|---|---:|---|---|
| `channel12.dtd` | 892 | `00baa80d3be6a4558b3115ebb1d6b3a58eea9cfb6bba0fd1f4ad73b993cfc31d` | metadata-only |
| `wml13.dtd` | 9,015 | `764fe546974f15b40c1e49a0f3e954219e78f518c53a6d7d3956cab62be72dfb` | metadata-only |
| `pap_1.0.dtd` | 8,080 | `bfcec60e17f07ed87b772004dfe784cda2bd88aaf8f211c4eafc68b1cb7a319a` | metadata-only |
| `si.dtd` | 1,676 | `f71e1c657b501a49ba98dde685d29fe2c88107031f01e7d14781a36a669cf50b` | metadata-only |
| `sl.dtd` | 1,025 | `8393b66f4f9c30163613b553b765504d3f92dadd1eaca9775265b33d15c4f972` | metadata-only |
| `wta-wml12.dtd` | 539 | `dccd67a26526098adfae881a7826a21be34d69bd66cccd005a265e71a292a84c` | metadata-only |

The release catalog and OMA catalog identify these conformance sources:

| Document | Role | Verified payload | Repository state |
|---|---|---|---|
| `WAP-215-ClassConform-20001213-a` | WAP 1.2.1 class-level CCR | 47,936 bytes; `af578cd5...8e44f9d` | metadata-only |
| `WAP-221-CREQ-20010425-a` | SCR/CCR grammar | 38,934 bytes; `d8713c91...b8ac905` | metadata-only |
| `WAP-273-CertPolicy-20010831-a` | certification policy | 110,965 bytes; `61b22088...342e92` | metadata-only |

WAP-215 was recovered from the live official WAP Forum document directory and
independently byte-, page-, and text-verified. The release page's visible
filename omits one zero (`2001213`); the underlying object and document
identity correctly use `20001213`. All six Class A/B/C client/server
dependency graphs are recorded in
`spec-processing/source-manifests/wap-1.2.1-class-conformance.json`.

The selected initial target is the exact WAP-215 data-client profile
`CCR-CLASSC-C-001`. It requires the mandatory client feature groups for WAE,
WML, WBXML, WMLScript, WMLScript libraries, caching, WSP, WDP, and WCMP. WTP
is mandatory only when the client supports connection-mode WSP. WTLS, WIM,
Push, WTA/WTAI, UAProf, and WMLScript Crypto remain separately declared
capabilities rather than requirements of this Class C profile.

The effective WML 1.3 ledger contains 76 source rows (47 mandatory, 29
optional) in
`spec-processing/source-manifests/wap-1.2.1-wml-scr.json` and documented in
`docs/waves/WAP_1_2_1_WML_SCR_LEDGER.md`. Applying `WML:MCF` to the client
actor selects 39 required user-agent rows; 27 client rows are optional and 10
encoder/server rows are not applicable to this client profile.

The external-dependency lock now contains 40 historical authority records and
preserves 63 citation labels in four explicit open review groups. Its
acquisition ledger contains 46 private artifacts: 34 dependencies have full
primary artifacts, two have partial historical evidence, and four historical
IEEE/ISO payloads remain metadata-only. See
`docs/waves/WAP_1_2_1_EXTERNAL_DEPENDENCIES.md`. Being cited or acquired is not
the same as being applicable to the selected profile or mapped to a product
obligation or test.

## Redistribution and ingestion

OMA's current use agreement explicitly prohibits posting documents to a
networked computer or publishing them without valid permission or license.
The archived WAP Forum click-through was a royalty-free terms gate, not a
purchase paywall, but does not override the current repository-distribution
boundary.

Until explicit redistribution approval is recorded:

- keep recovered binaries and generated derivatives outside Git;
- commit authoritative URLs, hashes, byte sizes, classification, and
  reproducible retrieval instructions;
- use temporary verified copies for research and requirement extraction;
- do not promote them through `spec-processing/new-source-material/`.

After approval, use the existing staged parser, cleanup review, verified
promotion, and append-only provenance workflow. Never place historical
predecessors into a competing mirror tree.

The exact OMA contact route, ready-to-send redistribution/preservation draft,
WAP-215 recovery record, and Wayback procedure are in
`docs/waves/WAP_SOURCE_RECOVERY_AND_PERMISSION.md`.

## Acceptance gates

A WAP 1.2.1 domain can be called source-complete only when:

1. every applicable base specification and SIN is locked;
2. document status and supersession order are explicit;
3. all normative external dependencies are inventoried;
4. SCR/CCR applicability is mapped to the product profile;
5. requirements have exact source anchors and strict/enhanced disposition;
6. each mandatory obligation has executable evidence or an open work item.
