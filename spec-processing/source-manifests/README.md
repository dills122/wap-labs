# Specification Release Manifests

This directory stores machine-readable locks for authoritative specification
releases. A release manifest defines the target inventory independently of
whatever PDFs happen to be present in `spec-processing/source-material/`.

## WAP 1.2.1

`wap-1.2.1-release.json` records:

- all 97 members of the official OMA-hosted WAP 1.2.1 archive;
- archive and per-member SHA-256 hashes and byte sizes;
- publication status, family, base/SIN role, and preliminary project scope;
- byte-exact comparison with the canonical root-level PDF corpus;
- associated WML/PAP DTDs and governing WAP conformance documents;
- the current metadata-only redistribution policy.

`wap-1.2.1-effective-spec.json` derives the family-level approved base/SIN
precedence graph.

`wap-1.2.1-class-conformance.json` records the six exact WAP-215 Class A/B/C
client/server dependency graphs and selects `CCR-CLASSC-C-001` as the initial
strict browser profile. The recovered source remains metadata-only.

`wap-1.2.1-ingestion-status.json` proves that all 97 release PDFs and all 97
private text extractions were hash/size inspected without recording local
machine paths or promoting recovered artifacts into Git.

`wap-1.2.1-external-dependencies.json` is the in-progress historical lock for
normatively cited RFC, W3C, Ecma, IEEE, ISO, IANA, and Unicode material. Its
open citation groups are intentional blockers against falsely declaring the
external source set complete.

`wap-1.2.1-external-ingestion-status.json` records acquisition evidence for
every authority-locked external dependency. It distinguishes complete primary
artifacts, partial historical evidence, and licensed-payload metadata-only
records.

`wap-1.2.1-wml-scr.json` records the effective 76-row WML 1.3 static
conformance statement after applying `WAP-191_105`. It preserves the WML
user-agent, encoder, server-document, and client-document actors, source
anchors, mandatory/optional status, dependency expressions, selected Class C
profile dispositions, implementation assessments, exact code/test
evidence,
and open work-item mappings.

For the selected Class C client, that ledger distinguishes 39 required WML
user-agent rows, 27 optional client rows, and 10 server/encoder rows that are
not applicable to the client profile.

`wap-1.2.1-wae-scr.json` records the effective WAP-190 WAE SCR after applying
the approved SIN chain and normalizing the tracked-change table in
`WAP-190_104`. It preserves 86 active client/server rows, 22 SIN-removed
historical rows, dependency expressions, exact `WAESpec:MCF` dispositions,
implementation evidence, and the selected-concept WAP-236 successor delta.

For the selected Class C client, the WAE ledger distinguishes 11 required
client rows, 40 optional client rows, and 35 server rows outside the client
profile.

`wap-1.2.1-wbxml-scr.json` records the effective 15-row WBXML 1.3 SCR after
applying `WAP-192_105`. It preserves the corrected client/server identifiers,
tracked-change wording, exact section anchors, `WBXML:MCF` selection, and
conservative implementation evidence.

For the selected Class C client, the WBXML ledger selects three mandatory
client rows. The other 12 document/encoder rows remain source-wide obligations
outside the client profile.

`wap-1.2.1-wmlscript-scr.json` records the consolidated 112-row WMLScript SCR
from `WAP-193_101`. It preserves encoder/interpreter actors, exact status and
source sections, `WMLScript:MCF` selection, and conservative mappings to the
current custom VM skeleton.

For the selected Class C client, the WMLScript ledger selects 41 mandatory
interpreter rows. Three optional interpreter rows and all 68 encoder rows
remain outside the selected feature group.

`wap-1.2.1-wmlscript-libraries-scr.json` records the 94-row WAP-194 base SCR
plus optional `WMLSSL-C-095` from `WAP-194_103`. It preserves the canonical
PDF's `WMLSSL048` identifier typo with an explicit `WMLSSL-048` normalized
alias, the separate encoder/interpreter actors, and exact
`WMLScriptLibs:MCF` selection.

For the selected Class C client, the libraries ledger selects 80 mandatory
interpreter rows. Two optional interpreter rows and all 13 encoder rows remain
outside the selected feature group.

`wap-1.2.1-caching-scr.json` records all 11 WAP-120 Appendix A caching rows,
the RFC 2616/RFC 1305 dependency locks, exact `WAPCachingMod:MCF` selection,
and the explicit zero-byte-cache interpretation.

For the selected Class C client, the caching ledger selects five mandatory
user-agent rows. Optional user-agent TOD synchronization and all five gateway
rows remain outside the selected feature group.

`wap-1.2.1-wdp-scr.json`, `wap-1.2.1-wcmp-scr.json`, and
`wap-1.2.1-wsp-scr.json` preserve all 317 effective transport SCR rows plus
the exact connectionless Class C dependency path. The selected path uses
CDPD-shaped WDP over UDP/IPv4, general WCMP rather than host ICMP, and
connectionless WSP; connection-oriented WSP and WTP remain conditional.

The three transport ledgers select 22 dependency-closed rows: 9 WDP, 5 WCMP,
and 8 WSP. Their conservative audit is 17 partial and 5 missing with zero
direct source-derived normative tests. RFC 768/RFC 791 are artifact-locked;
the selected CDPD `TIAEIA-732` citation remains an explicit external-source
normalization gap.

Generate the lock from a separately retrieved official archive:

```sh
node spec-processing/scripts/generate-wap-release-manifest.mjs \
  --archive /absolute/path/to/Technical_June2000-20021106[1].zip \
  --retrieved-on YYYY-MM-DD
```

Validate the committed lock against the repository corpus:

```sh
node spec-processing/scripts/check-wap-release-manifest.mjs
```

Generate the metadata-only class ledger from the separately retrieved official
WAP-215 PDF and a private text extraction:

```sh
node spec-processing/scripts/generate-wap-class-conformance.mjs \
  --wap-215-pdf /absolute/path/WAP-215-ClassConform-20001213-a.pdf \
  --wap-215-text /absolute/path/WAP-215-ClassConform-20001213-a.txt \
  --recorded-on YYYY-MM-DD
node spec-processing/scripts/check-wap-class-conformance.mjs
```

Generate and validate the family-level base/SIN precedence graph:

```sh
node spec-processing/scripts/generate-wap-effective-spec.mjs
node spec-processing/scripts/check-wap-effective-spec.mjs
node scripts/check-wap-external-dependencies.mjs
node scripts/check-wap-conformance-ledger.mjs
node scripts/check-wap-wae-conformance-ledger.mjs
node scripts/check-wap-wbxml-conformance-ledger.mjs
node scripts/check-wap-wmlscript-conformance-ledger.mjs
node scripts/check-wap-caching-conformance-ledger.mjs
node scripts/check-wap-transport-conformance-ledgers.mjs
```

Generate the WML SCR ledger from private text extractions:

```sh
node spec-processing/scripts/generate-wap-wml-scr-ledger.mjs \
  --wml-text /absolute/path/WAP-191_104-WML-20010718-a.txt \
  --sin-105-text /absolute/path/WAP-191_105-WML-20020212-a.txt \
  --recorded-on YYYY-MM-DD
```

Generate the WAE SCR and selected-concept successor-delta ledger:

```sh
node spec-processing/scripts/generate-wap-wae-scr-ledger.mjs \
  --wae-sin-text /absolute/path/WAP-190_104-WAE-Spec-20010731-a.txt \
  --creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt \
  --successor-text /absolute/path/WAP-236-WAESpec-20020207-a.txt \
  --recorded-on YYYY-MM-DD
```

Generate the WBXML SCR ledger from the effective SIN and WAP-221 extractions:

```sh
node spec-processing/scripts/generate-wap-wbxml-scr-ledger.mjs \
  --wbxml-sin-text /absolute/path/WAP-192_105-WBXML-20011015-a.txt \
  --creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt \
  --recorded-on YYYY-MM-DD
```

Generate the WMLScript SCR ledger from the consolidated effective text:

```sh
node spec-processing/scripts/generate-wap-wmlscript-scr-ledger.mjs \
  --wmlscript-effective-text /absolute/path/WAP-193_101-WMLScript-20010928-a.txt \
  --creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt \
  --recorded-on YYYY-MM-DD
```

Generate the WMLScript Libraries ledger from the base and immediate-refresh
SIN:

```sh
node spec-processing/scripts/generate-wap-wmlscript-libraries-scr-ledger.mjs \
  --libraries-base-text /absolute/path/WAP-194-WMLScriptLibraries-20000925-a.txt \
  --libraries-sin-text /absolute/path/WAP-194_103-WMLScriptLibraries-20020318-a.txt \
  --creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt \
  --recorded-on YYYY-MM-DD
```

Generate the WAP-120 caching SCR ledger:

```sh
node spec-processing/scripts/generate-wap-caching-scr-ledger.mjs \
  --caching-text /absolute/path/WAP-120-WAPCachingMod-20010413-a.txt \
  --creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt \
  --recorded-on YYYY-MM-DD
```

Generate the effective WDP, WCMP, and WSP ledgers from the verified private
release-text directory:

```sh
node spec-processing/scripts/generate-wap-transport-scr-ledgers.mjs \
  --source-root /absolute/path/to/wap-1.2.1-text \
  --creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt \
  --recorded-on YYYY-MM-DD
node scripts/check-wap-transport-conformance-ledgers.mjs
```

Generate the private research-ingestion ledgers:

```sh
node spec-processing/scripts/generate-wap-ingestion-status.mjs \
  --pdf-dir /absolute/path/to/release-pdfs \
  --text-dir /absolute/path/to/extracted-text \
  --processed-on YYYY-MM-DD \
  --recorded-on YYYY-MM-DD

node spec-processing/scripts/generate-wap-external-ingestion-status.mjs \
  --cache-dir /absolute/path/to/external-cache \
  --retrieved-on YYYY-MM-DD
```

Validate committed metadata, optionally rehashing a private cache:

```sh
node spec-processing/scripts/check-wap-ingestion-status.mjs
node spec-processing/scripts/check-wap-ingestion-status.mjs \
  --pdf-dir /absolute/path/to/release-pdfs \
  --text-dir /absolute/path/to/extracted-text

node spec-processing/scripts/check-wap-external-ingestion-status.mjs
node spec-processing/scripts/check-wap-external-ingestion-status.mjs \
  --cache-dir /absolute/path/to/external-cache
```

The generator requires `unzip` and does not copy source documents into the
repository. Do not change the metadata-only policy or commit recovered source
binaries/derivatives without explicit redistribution approval.
