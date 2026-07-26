# OMA Historical WAP Redistribution Request Package

Status: **UNSENT — EXPLICIT MAINTAINER APPROVAL REQUIRED**

Prepared: 2026-07-26

Recipient: `helpdesk@omaorg.org`

Authority route: [OMA general inquiries](https://www.openmobilealliance.org/about/contact/)
and [OMA IPR questions](https://www.openmobilealliance.org/about/ipr/)

This package is preparation only. It does not authorize sending email,
submitting a web form, publishing recovered material, or accepting terms on a
maintainer's behalf.

## Approval checklist

Before sending, the maintainer must explicitly approve the correspondence and
complete these fields:

- [ ] Contact name and reply address
- [ ] Project owner/legal entity: **not yet supplied**
- [x] Repository: `https://github.com/dills122/wap-labs`
- [ ] Confirm repository visibility at send time
- [ ] Commercial-use posture: **not yet supplied**
- [ ] Confirm whether the request covers all 97 release members, all six DTDs,
      and WAP-215/WAP-221/WAP-273, or a narrower subset
- [ ] Approve the exact requested scopes and message below
- [ ] Approve sending to OMA

## Inventory attachment

Attach [OMA_REDISTRIBUTION_REQUEST_INVENTORY.csv](OMA_REDISTRIBUTION_REQUEST_INVENTORY.csv).
It contains only metadata: identifiers, filenames, official URLs, byte sizes,
and SHA-256 values. It contains no source payload or derivative.

Inventory snapshot:

| Scope                                           |   Items |
| ----------------------------------------------- | ------: |
| WAP 1.2.1 technical-release members             |      97 |
| Associated DTDs                                 |       6 |
| Governing documents (WAP-215, WAP-221, WAP-273) |       3 |
| **Total**                                       | **106** |

- Canonical source manifest:
  `spec-processing/source-manifests/wap-1.2.1-release.json`
- Canonical manifest SHA-256:
  `654284270a068b427ab05166247cb8e0644a99cf6af511f9b9c477d18ea36faa`
- Inventory attachment SHA-256:
  `435092177828c1b50aae8bc28397de1c56aa5d919b8ddba3d29847e167925de4`

## Requested permission scopes

Ask OMA to answer each scope independently because a grant for one must not be
inferred to cover another:

1. **Unaltered binaries:** public Git hosting of the byte-exact PDFs and DTDs,
   preserving original filenames, contents, notices, and hashes.
2. **Derivatives:** public Git hosting of machine-generated plain-text and
   Markdown extractions used for search and traceability, clearly marked as
   non-authoritative derivatives and linked to the original identity/hash.
3. **Excerpts:** publication of bounded clause, table, grammar, and definition
   excerpts in requirements, documentation, issue/PR discussion, and test
   explanations.
4. **Fixtures:** publication of small source-derived valid/invalid examples,
   binary vectors, expected outcomes, and transformed fragments needed for
   automated compatibility tests.
5. **Fallback:** if public mirroring is denied, permission for a metadata-only
   index and user-invoked downloader that retrieves unmodified files from
   official OMA/WAP Forum URLs without bypassing access controls.

## Attribution and handling questions

Request an explicit answer to:

- What copyright, trademark, provenance, and license notice must accompany
  each binary, derivative, excerpt, and fixture?
- Must attribution appear in every file, in a repository-level notice, or
  both?
- May generated derivatives normalize whitespace, repair extraction artifacts,
  or add stable anchors while retaining a link/hash to the unaltered source?
- Are there excerpt length, context, or commercial-use limits?
- May source-derived fixtures be distributed under the repository license, or
  must they retain a separate OMA/WAP Forum notice?
- Does permission cover historical WAP Forum documents now hosted by OMA and
  the live `wapforum.org` document directory?
- May hashes, filenames, URLs, byte sizes, and document metadata remain public
  if every payload/derivative request is denied?
- Is the proposed user-invoked downloader acceptable, and must it present the
  OMA use agreement before retrieval?
- Is written permission from OMA sufficient for WAP Forum material, or must
  any additional rightsholder approve particular documents?
- Should granted permission name this repository only or permit forks and
  downstream redistribution under the same conditions?

## Draft correspondence

Subject: Permission request for historical WAP specification preservation and
open-source compatibility evidence

```text
Hello OMA Helpdesk,

I maintain the open-source wap-labs project:
https://github.com/dills122/wap-labs

The project implements compatibility with the historical WAP 1.2.1 stack and
WML 1.3. We use WAP Forum material preserved through OMA and the live WAP
Forum document directory as the normative source. This is a preservation,
research, implementation, and automated-testing use.

We have recovered and hash-verified the 97-member WAP 1.2.1 technical release,
six associated DTDs, and the governing WAP-215, WAP-221, and WAP-273 documents.
The attached metadata-only CSV gives each identifier, filename, official URL,
byte size, and SHA-256. The recovered payloads and parsed derivatives remain
outside our public Git repository pending written guidance.

Could OMA grant or clarify permission for each of these scopes independently?

1. Publicly host the unaltered, byte-exact binaries, preserving every original
   notice, filename, and hash.
2. Publicly host machine-generated plain-text or Markdown derivatives used for
   search and requirement traceability, clearly labeled non-authoritative and
   linked to the original identity and hash.
3. Publish bounded excerpts of clauses, tables, grammars, and definitions in
   project documentation, issues, pull requests, and test explanations.
4. Publish small source-derived valid/invalid fixtures, binary vectors,
   expected outcomes, and transformed fragments needed for automated
   compatibility tests.

For every permitted scope, please identify the required copyright, trademark,
provenance, and license attribution; whether notice is required per file or at
repository level; whether commercial use or excerpt-size limits apply; and
whether forks/downstream redistribution may rely on the same permission.

For derivatives, may we normalize whitespace, repair extraction artifacts, or
add stable anchors while retaining a link and SHA-256 for the unaltered source?
For fixtures, may they use the repository license, or must they retain a
separate OMA/WAP Forum notice?

Does OMA's permission cover both historical WAP Forum documents hosted by OMA
and documents still served from wapforum.org? If another rightsholder must
approve any item, please identify the affected scope.

If public mirroring is not permitted, may we keep a public metadata-only index
and provide a user-invoked downloader that retrieves the unmodified files only
from official OMA/WAP Forum URLs, without bypassing access controls? If so,
must that workflow present the OMA use agreement before retrieval?

We also recovered WAP-215 from the live official WAP Forum directory. The
WAP 1.2.1 release page visibly omits one zero in its filename text, while the
underlying historical route, technical FAQ, live payload, and document identity
use WAP-215-ClassConform-20001213-a.pdf. Could OMA confirm the intended archival
URL and consider correcting or cataloging that link?

Project owner/legal entity: [COMPLETE BEFORE SEND]
Commercial-use posture: [COMPLETE BEFORE SEND]
Contact name and reply address: [COMPLETE BEFORE SEND]

Thank you.
```

## Reply recording

If approved and sent, record the sent date, exact attachment hash, sender,
recipient, and approved text. Store any reply verbatim in a non-secret decision
record with sender/date, granted and denied scopes, attribution, restrictions,
commercial-use terms, derivative/fixture treatment, downstream/fork treatment,
and any expiration or revocation condition. Do not promote a payload until the
recorded permission clearly covers its exact use.
