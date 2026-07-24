# WAP 1.2.1 External Dependency Baseline

Version: v0.3
Status: active; selected Class C dependency classification complete, residual profile research in progress

## Purpose

WAP 1.2.1 does not define its browser and protocol behavior in isolation. Its
effective specifications cite historical IETF, W3C, Ecma, IEEE, ISO, IANA,
Unicode, bearer, and cryptographic sources.

The machine-readable lock is:

- `spec-processing/source-manifests/wap-1.2.1-external-dependencies.json`

Validate it with:

```sh
node scripts/check-wap-external-dependencies.mjs
node spec-processing/scripts/check-wap-external-ingestion-status.mjs
```

The selected `CCR-CLASSC-C-001` dependency classification is complete. The
remaining source queue belongs to optional, bearer-conditional, successor, or
informative context. This is not an implementation-conformance claim, and the
residual queue must close before any affected profile is claimed.

## Current lock

The reviewed lock contains 43 authority-pinned dependencies:

| Group | Locked examples | Primary role |
|---|---|---|
| IETF | RFC 768/791/792, MIME, HTTP 1.1, HTTP authentication, URI, UTF-8, ABNF, TLS 1.0 | WDP/WCMP, WAE/WML/WSP, WMLScript, WBXML, optional WTLS |
| W3C | XML 1.0 Recommendation dated 10 February 1998 | WML/WBXML grammar and application formats |
| Ecma | ECMA-262 first edition, June 1997 | WMLScript language lineage |
| IEEE | IEEE 754-1985 | WMLScript numeric behavior |
| ISO | ISO/IEC 10646-1:1993 and ISO/TR 8509:1987 | characters and transport service conventions |
| IANA | historical WBXML MIBenum character-set dependency | WBXML character-set identifiers |
| Unicode | Unicode 2.0.0 | character repertoire and string behavior |
| TIA | TIA/EIA/IS-732 multi-part CDPD system specification, December 1997 | Selected WDP CDPD bearer capability |

Nine formerly open labels are now exact historical records:

- RFC 1630, 1738, 1808, and 1864;
- W3C HTML 4.0, Recommendation 18 December 1997;
- ISO 8879:1986;
- the generic `TIAEIA-732` CDPD family citation, normalized to the historical
  December 1997 multi-part set with its licensed-payload boundary intact;
- `MEDIATYPE`, pinned to archived IETF Internet-Draft
  `draft-murata-xml-02` rather than its later RFC successor;
- `CCPPEx`, pinned to the W3C Note dated 27 July 1999. WAP-230's label and
  warning-code usage remain semantically ambiguous, but its actual citation
  identity and informative status are now explicit.

Later replacements are not substituted for the cited historical versions.
For example, WML/WAE SINs move some HTTP references from RFC 2068 to RFC 2616,
while the effective WMLScript publication still cites RFC 2068. Both identities
must remain visible until feature-level applicability is resolved.

WAP-190_103 changes WAE Basic authentication to RFC 2616. RFC 2616 section 11
normatively delegates the Basic scheme to RFC 2617, so RFC 2617 is retained as
an effective transitive dependency for the selected WAE client row rather than
being hidden behind the top-level citation.

Primary version evidence includes the dated
[W3C XML 1.0 Recommendation](https://www.w3.org/TR/1998/REC-xml-19980210),
[ECMA-262 first edition](https://ecma-international.org/wp-content/uploads/ECMA-262_1st_edition_june_1997.pdf),
[Unicode 2.0 components](https://www.unicode.org/versions/components-2.0.0.html),
and the [RFC Editor archive](https://www.rfc-editor.org/).

## Acquisition status

The machine-readable acquisition ledger is:

- `spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json`

It records 48 private research artifacts totaling 14,588,705 bytes:

| State | Dependencies | Meaning |
|---|---:|---|
| Full primary artifact | 36 | 31 RFC texts, dated W3C XML/HTML sources, ECMA-262 first edition, and the archived XML-media draft |
| Partial primary artifact | 2 | Current IANA character-set registry and Unicode 2.0 component/UCD set; historical/full cited form remains open |
| Licensed-payload metadata only | 5 | IEEE 754-1985, three historical ISO sources, and the historical TIA/EIA/IS-732 CDPD set |

The artifacts remain outside Git. The ledger stores logical cache references,
hashes, sizes, source URLs, and acquisition limits.

## Residual review groups

There are 60 unique citation labels in three explicitly dispositioned groups:

| Labels | Selected-profile disposition | Activation/owner |
|---:|---|---|
| 3 | vCard/vCalendar are optional content formats; the JavaScript book is informative language lineage | Activate with the affected optional media/history claim; `OPT-1106` |
| 45 | Bearer-conditional standards outside the selected CDPD/IPv4 path | Activate per newly claimed bearer; `TRN-701`, `OPT-1106` |
| 12 | Cryptographic authorities for the deferred optional WTLS profile | Activate with WTLS; `OPT-1101` |

The selected profile therefore has zero blocking open labels. A residual label
is not discarded: it remains machine-visible with an activation trigger,
future owner, and next action until an authority record replaces it. Claiming
the affected optional/bearer profile reactivates that source gate.

## Extraction corrections

PDF text extraction merges struck and inserted SIN text in several places.
The manifest preserves these known hazards:

- `RFC2068616` is not an RFC; it is joined RFC 2068/RFC 2616 text.
- `RFC2616068` is the inverse joined form of the same WAE change.
- `IS07498` is a citation-label typo for ISO 7498.

Validators reject these artifacts as dependency identities. Final resolution
must use the PDF visual, SIN change instruction, and resulting effective text,
not OCR shape alone.

## Selected-profile closure and residual gate

`SRC-005` is complete for the selected Class C profile because:

1. every selected-profile normative external reference has an authority and
   version record;
2. every selected-profile dependency is classified as definition-only,
   implementation-relevant, test-relevant, bearer-conditional,
   profile-conditional, or superseded;
3. each selected-profile implementation/test dependency is linked into the
   `CONF-1` obligation ledger.

The broader historical archive is still incomplete. Live registries need
historical snapshots or explicit compatibility policies, licensed standards
remain metadata-only, and all residual labels must be pinned before their
profiles are activated. Acquisition status supplies reproducible evidence; it
does not create an implementation or release claim.
