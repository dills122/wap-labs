# WAP 1.2.1 Source Recovery and Permission Runbook

Version: v0.4
Status: active; WAP-215 and private research ingestion complete, public
promotion pending

## Purpose

This runbook separates four questions that must not be collapsed:

1. Is the source identity authoritative?
2. Has an exact research copy been recovered and hash-verified?
3. Is the recovered copy sufficient for the selected conformance profile?
4. May the source binary or a parsed derivative be republished in this
   repository?

It is an operational source-recovery record, not legal advice or a
certification claim.

## Current result

| Source set | Authority lock | Private research acquisition | Public repository state |
|---|---:|---:|---|
| WAP 1.2.1 technical release | 97/97 members | 97/97 exact PDFs and 97/97 text extractions | 21 exact members already canonical; 76 recovered/different members held |
| Associated release DTDs | 6/6 | 6/6 hash-verified | Metadata-only |
| General conformance sources | WAP-215, WAP-221, and WAP-273 | 3/3 hash-verified | Metadata-only |
| WAP-215 class requirements | Official live WAP Forum object | 47,936-byte approved PDF and text extraction verified | Exact six-profile ledger recorded; source/derivative held |
| Locked external dependencies | 43/43 acquisition records | 36 full, 2 partial, 5 licensed-payload metadata-only | Metadata-only |
| Remaining external citation labels | 60 labels in three groups | Selected Class C non-blocking; affected profiles remain gated | Explicit owned queue |

Machine-readable evidence:

- `spec-processing/source-manifests/wap-1.2.1-ingestion-status.json`
- `spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json`
- `spec-processing/source-manifests/wap-1.2.1-release.json`
- `spec-processing/source-manifests/wap-1.2.1-class-conformance.json`
- `spec-processing/source-manifests/wap-1.2.1-external-dependencies.json`

The WAP release ingestion covers 2,270 PDF pages, 9,988,119 PDF bytes, and
5,703,023 extracted-text bytes. The external acquisition ledger covers 48
artifacts totaling 14,588,705 bytes.

## Why some WAP documents look locked

This was not a document purchase paywall.

The archived WAP 1.2.1 release page contains a maintainer note saying
specification links had to route through:

```text
http://www1.wapforum.org/tech/terms.asp?doc=<document>
```

It also says documents were stored in the technical folder and mirrored on a
WDS web site. The recovered 2000 gate page calls itself the WAP Copyright
Licence and offered a royalty-free license after accepting its terms.

The present access gap is therefore a combination of:

- obsolete click-through/authentication infrastructure;
- URL and host decay;
- incomplete WAP Forum-to-OMA migration;
- archive crawlers recording the gate instead of the protected payload.

This differs from separately governed IEEE and ISO payloads, which may require
licensed standards access.

## Redistribution boundary

The current
[OMA use agreement](https://www.openmobilealliance.org/about/policies/use-agreement/)
allows document download and use subject to its terms, but prohibits network
posting or publication without valid permission or license. It also prohibits
modification.

Until OMA confirms the intended repository use:

- recovered PDFs, DTDs, and parsed text stay outside Git;
- hashes, sizes, official URLs, retrieval dates, and logical cache references
  may be committed;
- temporary copies may be used to extract requirements and tests;
- a Wayback capture proves provenance, not redistribution permission;
- no live authentication control should be bypassed.

After permission is recorded, use the existing staged
`spec-processing/new-source-material/` workflow and preserve every original
notice.

## WAP-215 recovery record

Target identity:

```text
WAP-215-ClassConform-20001213-a.pdf
WAP June 2000 Class Conformance Requirements
```

Verified official routes:

- release page:
  `https://www.wapforum.org/what/technical_1_2_1.htm`
- live official payload:
  `https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf`
- historical click-through:
  `http://www1.wapforum.org/tech/terms.asp?doc=WAP-215-ClassConform-20001213-a.pdf`

The release page's visible link text omits one zero (`2001213`), but its
original query parameter and the WAP technical FAQ use the correct
`20001213` identity.

Successful recovery recorded on 2026-07-24:

| Evidence | Verified value |
|---|---|
| HTTP result | `200 OK`, `application/pdf` |
| PDF size | 47,936 bytes |
| PDF SHA-256 | `af578cd57a7e043b693e0b0dd5ef59b27f8e778e481831ec8737337ee8e44f9d` |
| PDF structure | PDF 1.2, 16 pages, unencrypted |
| Document identity | `WAP-215-ClassConform-20001213-a`, approved 13 December 2000 |
| Extracted text | 35,121 bytes; `d0b4cb2e7e1cb1340320845655176233f53b817bf29f93b102db6f49c030d00f` |
| Extracted profiles | Client A/B/C: 50/15/9 expressions; server A/B/C: 54/18/10 |

The metadata-only extraction and selected target are in
`spec-processing/source-manifests/wap-1.2.1-class-conformance.json`. The
selected target is client Class C (`CCR-CLASSC-C-001`) with nine mandatory
client feature groups. The PDF and full text remain outside Git pending
redistribution review.

Earlier searches of guessed OMA paths and Wayback payload variants returned
404, 401, or no capture. Those are retained as historical search evidence, but
they no longer describe the source's availability.

Useful lineage recovered into the private cache:

- `PROTO-ClassConform-19990701.pdf`
- WAP 1.1 prototype; not WAP 1.2.1 authority
- 31,825 bytes
- SHA-256:
  `8404b0686177616233755ce55cc4859efa8ae66cd6cd414ea2d809794eb478ad`

The prototype remains historical lineage only. The recovered approved WAP-215
tables, rather than the FAQ summary or prototype, now govern profile
selection.

## Wayback recovery procedure

For any remaining WAP source:

1. Start with the official WAP/OMA catalog and record the exact document
   identity.
2. Recover an early release-page snapshot and inspect the original link,
   including the case-sensitive `doc=` parameter.
3. Search Wayback CDX for:
   - the click-through URL;
   - `/tech/documents/<filename>`;
   - `/what/technical/<filename>`;
   - case and date variants;
   - the filename across the complete WAP Forum domain.
4. Search Archive.org items and primary-organization mirrors.
5. Download only a payload whose media type and file signature agree.
6. Record byte size, SHA-256, retrieval date, source URL, archive timestamp,
   status, and relationship to the target release.
7. Treat prototypes, proposals, later successors, and third-party copies as
   lineage until byte identity and publication status are proven.
8. Keep the payload outside Git until its redistribution status is resolved.

Repeated empty queries should be logged and not retried without a new path or
filename hypothesis.

## OMA recovery and permission route

OMA's current [contact page](https://www.openmobilealliance.org/about/contact/)
directs general and protocol questions to `helpdesk@omaorg.org`. Its
[IPR page](https://www.openmobilealliance.org/about/ipr/) directs IPR-policy
questions to the same helpdesk.

No request has been sent. Sending external correspondence requires explicit
maintainer approval.

### Draft request

Subject: Historical WAP specification preservation and redistribution guidance

```text
Hello OMA Helpdesk,

We are building an open-source compatibility implementation of the historical
WAP 1.2.1 stack with WML 1.3. We use the WAP Forum material preserved in OMA's
affiliate catalog as the normative source.

We recovered the approved WAP-215 Class Conformance Requirements from the live
official WAP Forum document directory and recorded its URL and SHA-256. The
WAP 1.2.1 release page still displays a one-zero filename typo even though the
underlying document identity is correct. Could OMA confirm that this public
directory is the intended long-term archival location, and consider adding it
to the affiliate catalog or correcting the visible link?

We also request repository guidance.

May this project publish the following historical WAP Forum materials in a
public source repository, with the original files unmodified and all
copyright/notices retained?

- WAP 1.2.1 technical-release PDFs;
- the DTDs associated with that release;
- WAP-215, WAP-221, and WAP-273;
- text or Markdown derivatives used for requirement traceability.

If the permissions differ for original binaries, parsed derivatives, excerpts,
or automated test fixtures, please clarify the permitted scope and required
attribution. If public mirroring is not allowed, is a metadata-only index plus
a user-invoked downloader from OMA's official URLs acceptable?

We would be happy to provide the exact document inventory, hashes, repository
location, intended notices, and non-commercial archival/research description.

Thank you.
```

Before sending, add:

- the repository URL and visibility;
- project owner/legal entity;
- the exact 97-member and six-DTD inventory;
- whether commercial use is anticipated;
- a contact name and reply address.

Record any reply verbatim in a non-secret project decision record, including
the sender, date, scope, restrictions, and whether it covers derivatives.

## Remaining acquisition gaps

1. Resolve the remaining 60 external labels before claiming their affected
   profiles:
   - vCard/vCalendar and JavaScript-book context (three labels);
   - 45 bearer/radio labels;
   - 12 optional WTLS cryptographic labels.
2. Acquire or formally waive the historical IEEE 754-1985, ISO/IEC
   10646-1:1993, ISO 8879:1986, ISO/TR 8509:1987, and selected TIA/EIA/IS-732
   payloads.
3. Recover a WBXML-era IANA character-set registry snapshot.
4. Decide whether the official Unicode 2.0 UCD component set is sufficient
   implementation evidence where the cited paper standard is unavailable.
