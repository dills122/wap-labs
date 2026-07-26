# SRC-006 Historical Authority Readiness Research

Status: bounded research complete; no protected payload promoted; OMA request
unsent and approval-required

Reviewed: 2026-07-26

## Scope and decision rule

This lane rechecked the historical character, numeric, markup, service-model,
and CDPD authorities that can affect `WML-307`, `WMLS-5`, generic WBXML, or
the selected CDPD path. It used only public authority records and the existing
private-acquisition metadata. It did not bypass access controls, purchase
standards, contact a third party, or place a protected source or derivative in
Git.

The canonical WAP specifications and manifests remain the source of
requirements. An external artifact is implementation/test evidence only for
the behavior it actually defines; metadata or lineage alone cannot close a
normative behavior claim.

## Authority and acquisition result

| Authority             | Current primary evidence                                                                                                                                                                                                                                                                                                                                                                                               | Acquisition result                                                                                                                                                     | Readiness disposition                                                                                                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IANA MIBenum registry | The live [Character Sets registry](https://www.iana.org/assignments/character-sets/character-sets.xhtml) defines the MIBenum namespace and current assignments. IANA's [5 September 2000 registry update](https://data.iana.org/archive/ietf-charsets/msg00849.html) confirms pre-WBXML-1.3 changes including UTF-16 registration, UTF-7 reassignment, ISO-8859-15/13/14, SCSU, and removal of duplicate MIBenum 1004. | `verified-private-partial-artifact`; current XML is hash-locked, but no complete registry image at or immediately before WAP-192's 25 July 2001 approval date is held. | Partial historical evidence, not a snapshot. Do not reconstruct the complete 2001 table from the current registry or mailing-list deltas.                                                                                                                                     |
| Unicode 2.0           | The official [Unicode 2.0.0 component catalog](https://www.unicode.org/versions/components-2.0.0.html) identifies the July 1996 paper standard and its versioned UCD files. It also says `Unihan-1.txt` was inadvertently truncated and that the corrected `Unihan-2.txt` was formally released with Unicode 2.1.2.                                                                                                    | `verified-private-partial-artifact`; the component page and versioned 2.0 files are hash-locked, while the paper core remains unavailable online.                      | Fixture-grade for the code points and properties present in the archived files. Not a substitute for unrepresented core-spec definitions, algorithms, or prose. Keep the truncated 2.0 Unihan artifact explicit; do not silently replace it with 2.1.2 data in a 2.0 fixture. |
| IEEE 754-1985         | The [IEEE authority record](https://standards.ieee.org/ieee/754/993/) confirms the superseded 1985 binary floating-point standard, its scope, and purchase/subscription access.                                                                                                                                                                                                                                        | `metadata-only-licensed-payload`; no standards payload acquired.                                                                                                       | Behavior-relevant only when floating-point capability is claimed. The WAP-193/WAP-194 rules remain the direct test source for the Class C interpreter boundary.                                                                                                               |
| ISO/IEC 10646-1:1993  | The [ISO authority record](https://www.iso.org/standard/18741.html) confirms the 1993 first edition, 754 pages, withdrawal, and replacement by the 2000 edition.                                                                                                                                                                                                                                                       | `metadata-only-licensed-payload`; no standards payload acquired.                                                                                                       | Normative character-set lineage. WAP-191 and WAP-193 operationalize the target-era behavior and explicitly pair the cited UCS with Unicode 2.0; the official Unicode component set can support bounded repertoire/property fixtures, not replace the ISO text.                |
| ISO 8879:1986         | The [ISO authority record](https://www.iso.org/standard/16387.html) confirms the SGML first edition and its current published status.                                                                                                                                                                                                                                                                                  | `metadata-only-licensed-payload`; no standards payload acquired.                                                                                                       | Definition-only historical markup context for this lane. XML and WML define the implemented grammar and character-processing rules directly.                                                                                                                                  |
| ISO/TR 8509:1987      | The [ISO authority record](https://www.iso.org/standard/15732.html) confirms the nine-page service-conventions report, its withdrawal in 1994, and replacement by ISO/IEC 10731:1994.                                                                                                                                                                                                                                  | `metadata-only-licensed-payload`; no standards payload acquired.                                                                                                       | Definition-only for the selected connectionless Class C path. It informs WTP service terminology, while WTP is not activated by that path.                                                                                                                                    |
| TIA/EIA/IS-732        | The authorized-distributor record already locked in the external-dependency manifest identifies the December 1997 `TIA/EIA/IS-732-100` lineage. [Public TIA committee minutes](https://standards.tiaonline.org/standards/committees/files/tr-45/tr45-aug00-28900123652.pdf) corroborate that IS-732 is CDPD, but WAP-200 cites the series generically and does not select a part.                                      | `metadata-only-licensed-payload`; no standards payload acquired.                                                                                                       | Capability/lineage evidence for the selected CDPD bearer. WAP-200 plus RFC 768/791/792 defines the emulator's UDP/IPv4/WDP/WCMP boundary; IS-732 becomes implementation-blocking only if the project claims CDPD lower-layer or radio behavior.                               |

The acquisition states above remain correctly represented in
`wap-1.2.1-external-ingestion-status.json`: two partial public source sets and
five licensed-payload metadata-only records. No manifest state can be promoted
from this review.

## Behavior decisions

### WML-307 and generic WBXML

Implementation and fixtures may rely directly on WAP-191 section 6 and
WAP-192 sections 5.2 and 5.6 for:

- document character-set and encoding resolution;
- WBXML `charset` as an IANA MIBenum, with `0` meaning unknown;
- external-protocol metadata precedence being owned by the higher-level
  protocol;
- charset-dependent string termination and deterministic failure when names
  cannot be represented; and
- the source-demonstrated values US-ASCII `3`, ISO-8859-1 `4`, Shift_JIS `17`,
  and UTF-8 `106`.

The historical IANA evidence is sufficient to test those source-pinned values
and unknown-value handling. It is not sufficient to claim a complete
WBXML-era MIBenum table. A generic decoder should therefore distinguish:
recognized supported values, recognized-but-unsupported values, `0`, and
unrecognized values without treating the current registry as the historical
allow-list.

The Unicode 2.0 component files are sufficient to derive bounded fixtures for
numeric character references, names, categories, and properties actually
present in those files. They do not justify rejecting later-assigned Unicode
characters: WAP-191 says WML adopts future XML/ISO 10646 changes. They also do
not replace the WML/XML rules for entity expansion, encoding detection, or
error handling.

### WMLS-5

IEEE 754-1985 is directly relevant to WAP-193's 32-bit single-precision
constant encoding and, when enabled, finite range, precision, overflow,
underflow, zero, conversion, and operation behavior. However, floating-point
interpreter support is optional for the selected Class C profile. The selected
WAP-194 library rows still require the Float surface and the deterministic
`invalid` fallback when floating point is unsupported.

Therefore `WMLS-5` must make one explicit capability decision before its
numeric fixtures are closed:

1. integer-only strict profile: test rejection/`invalid` behavior and do not
   claim IEEE arithmetic support; or
2. floating-point profile: acquire licensed IEEE evidence or formally accept
   WAP-193/WAP-194's embedded operational rules as the bounded test authority,
   then test binary32 representation and every WAP-specific normalization.

Unicode 2.0/ISO 10646 and the IANA registry are also behavior-relevant to
WMLScript source characters, the interpreter's single native character set,
constant-pool MIBenum values, UTF-8 fixed names, string indexing/comparison,
and `Lang.characterSet()`. The UCD can seed repertoire/property cases, while
WAP-193/WAP-194 remains the direct source for string-operation semantics.

### Selected CDPD path

TIA/EIA/IS-732 identifies the bearer but does not need to define the current
emulator boundary. The selected path is adequately specified at that boundary
by WAP-200's CDPD mapping and the selected IPv4/UDP/ICMP authorities. The
licensed TIA payload remains an exact-source gap, but it does not block Class C
WDP/WCMP fixtures unless scope expands below the IP bearer abstraction.

ISO/TR 8509 does not affect the selected connectionless path because its WTP
service-convention context is not activated. ISO 8879 likewise supplies
terminology rather than an independent parser or runtime rule.

## Class C impact

- `SRC-006` remains the sole source-program blocker and remains limited to
  public redistribution/promotion.
- The IANA snapshot gap prevents a complete historical MIBenum-table claim,
  not source-pinned WBXML fixtures for known values and unknown handling.
- Unicode 2.0 UCD components improve test readiness for bounded character
  data; the missing paper standard remains an access gap and does not prevent
  use of the operational WAP/XML clauses.
- IEEE 754-1985 is not a Class C blocker for an integer-only interpreter. It
  becomes a capability gate if floating-point support is claimed.
- ISO 8879 and ISO/TR 8509 are definition-only for the selected path.
- TIA/EIA/IS-732 is a selected-bearer provenance gap, not a blocker at the
  declared UDP/IPv4/WDP/WCMP boundary.

## Exact remaining access gaps

1. A complete IANA Character Sets registry snapshot from the WBXML 1.3 era,
   preferably at or immediately before 25 July 2001.
2. The Unicode Standard, Version 2.0 paper core; the official component/UCD
   subset remains available and hash-locked.
3. ANSI/IEEE Std 754-1985 full licensed text.
4. ISO/IEC 10646-1:1993 full licensed text and any exact amendment set needed
   to independently reproduce the WAP statement that it matched Unicode 2.0.
5. ISO 8879:1986 full licensed text.
6. ISO/TR 8509:1987 full licensed text.
7. The exact TIA/EIA/IS-732 part set applicable to WAP-200's generic citation,
   plus licensed payload access if lower-layer CDPD behavior is ever claimed.
8. Written OMA permission for public redistribution of the recovered WAP
   binaries, DTDs, parsed derivatives, excerpts, and fixtures.

## Additive follow-ups

1. Obtain maintainer approval and identity/commercial-use details, then send
   the prepared OMA request package. No message has been sent.
2. When `WML-307` begins, add its minimum knowledge-graph support first and
   build source-pinned charset/entity fixtures without inventing a complete
   2001 registry.
3. Before advancing the numeric portion of `WMLS-5`, record the integer-only
   versus floating-point capability decision and its evidence gate.
4. Keep the CDPD claim boundary at UDP/IPv4/WDP/WCMP. Open a separately
   sourced profile only if lower-layer IS-732 behavior enters scope.
5. Do not retry the same historical-registry searches without a new authority
   path, filename, or archive-timestamp hypothesis.
