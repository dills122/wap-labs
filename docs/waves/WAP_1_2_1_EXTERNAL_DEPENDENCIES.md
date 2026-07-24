# WAP 1.2.1 External Dependency Baseline

Version: v0.2
Status: active; reference classification in progress

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

This is an authority and version lock in progress. It is not yet a complete
external-source or implementation-conformance claim.

## Current lock

The reviewed lock contains 40 authority-pinned dependencies:

| Group | Locked examples | Primary role |
|---|---|---|
| IETF | RFC 768/791/792, MIME, HTTP 1.1, HTTP authentication, URI, UTF-8, ABNF, TLS 1.0 | WDP/WCMP, WAE/WML/WSP, WMLScript, WBXML, optional WTLS |
| W3C | XML 1.0 Recommendation dated 10 February 1998 | WML/WBXML grammar and application formats |
| Ecma | ECMA-262 first edition, June 1997 | WMLScript language lineage |
| IEEE | IEEE 754-1985 | WMLScript numeric behavior |
| ISO | ISO/IEC 10646-1:1993 and ISO/TR 8509:1987 | characters and transport service conventions |
| IANA | historical WBXML MIBenum character-set dependency | WBXML character-set identifiers |
| Unicode | Unicode 2.0.0 | character repertoire and string behavior |

Six formerly open labels are now exact historical records:

- RFC 1630, 1738, 1808, and 1864;
- W3C HTML 4.0, Recommendation 18 December 1997;
- ISO 8879:1986.

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

It records 46 private research artifacts totaling 14,440,993 bytes:

| State | Dependencies | Meaning |
|---|---:|---|
| Full primary artifact | 34 | 31 RFC texts, dated W3C XML/HTML sources, and ECMA-262 first edition |
| Partial primary artifact | 2 | Current IANA character-set registry and Unicode 2.0 component/UCD set; historical/full cited form remains open |
| Licensed-payload metadata only | 4 | IEEE 754-1985 and three historical ISO sources |

The artifacts remain outside Git. The ledger stores logical cache references,
hashes, sizes, source URLs, and acquisition limits.

## Open review groups

There are 63 unique citation labels in four explicit groups:

1. legacy URI/HTTP context whose normative versus informative status still
   needs effective-SIN review (now reduced to the XML media-type draft);
2. legacy content/language material such as vCard 2.1, vCalendar 1.0, HTML 4,
   and CC/PP context;
3. WDP/WTP/WCMP bearer and radio standards whose applicability depends on the
   selected bearer and CCR/SCR expressions;
4. optional WTLS cryptographic standards whose base/SIN revisions require
   algorithm-level reconciliation.

An open label is not discarded or treated as out of scope. It remains a
machine-visible source task until it is converted into an authority-pinned
dependency or explicitly classified as informative, superseded, or
non-applicable to a declared profile.

## Extraction corrections

PDF text extraction merges struck and inserted SIN text in several places.
The manifest preserves these known hazards:

- `RFC2068616` is not an RFC; it is joined RFC 2068/RFC 2616 text.
- `RFC2616068` is the inverse joined form of the same WAE change.
- `IS07498` is a citation-label typo for ISO 7498.

Validators reject these artifacts as dependency identities. Final resolution
must use the PDF visual, SIN change instruction, and resulting effective text,
not OCR shape alone.

## Completion gate

`SRC-005` can become complete only when:

1. every open label has a primary authority/version record or reviewed
   non-normative disposition;
2. every dependency is classified as definition-only,
   implementation-relevant, test-relevant, bearer-conditional,
   profile-conditional, or superseded;
3. live registries have an appropriate historical snapshot or explicit
   compatibility policy;
4. each selected-profile implementation/test dependency is linked into the
   `CONF-1` obligation ledger.

Acquisition status alone does not close `SRC-005`; it provides reproducible
evidence for the reviewed identities while keeping unresolved labels and
historical-version gaps visible.
