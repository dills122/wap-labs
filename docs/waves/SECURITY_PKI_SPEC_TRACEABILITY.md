# Waves Security PKI/WIM Spec Traceability

Version: v0.1  
Status: S0-08 complete (initial extraction + docling rerun validation pass)

## Purpose

Capture certificate, trust-distribution, and WIM storage requirements that define the security-profile boundary for Waves.

## Source Authority Policy

- See `docs/waves/SOURCE_AUTHORITY_POLICY.md` for normative vs supplemental source precedence and citation rules.

## Source set reviewed (S0-08)

- `spec-processing/source-material/WAP-211-WAPCert-20010522-a.pdf`
- `spec-processing/source-material/WAP-211_104-WAPCert-20010928-a.pdf`
- `spec-processing/source-material/OMA-WAP-211_105-WAPCert-SIN-20020520-a.pdf`
- `spec-processing/source-material/WAP-217-WPKI-20010424-a.pdf`
- `spec-processing/source-material/WAP-217_103-WPKI-20011102-a.pdf`
- `spec-processing/source-material/OMA-WAP-217_105-WPKI-SIN-20020816-a.pdf`
- `spec-processing/source-material/WAP-260-WIM-20010712-a.pdf`
- `spec-processing/source-material/OMA-WAP-260_100-WIM-SIN-20010725-a.pdf`
- `spec-processing/source-material/OMA-WAP-260_101-WIM-SIN-20020107-a.pdf`

## Normative precedence

1. `WAP-211`, `WAP-217`, `WAP-260` provide baseline requirements.
2. `WAP-211_104`, `WAP-217_103` apply SIN/SCR corrections.
3. `OMA-WAP-211_105`, `OMA-WAP-217_105`, `OMA-WAP-260_100`, `OMA-WAP-260_101` provide later correction overlays and precedence for conflicting wording.

## Requirements matrix

### RQ-SPKI-001 Certificate processing capacity baseline

- Requirement:
  - Certificate-processing entities support baseline certificate sizes and chain depth constraints.
  - Mandatory algorithm support and key-size processing constraints are met for supported certificate types.
- Spec:
  - `WAP-211` section 6/9
  - `OMA-WAP-211_105` section 3/4 changes
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Security profile states supported certificate sizes, chain depth, and algorithm set.
  - [ ] Unsupported algorithms or oversized chains fail deterministically.

### RQ-SPKI-002 Distinguished-name and extension recognition

- Requirement:
  - Required DN attributes and extension handling follow the certificate profile requirements for interoperable validation.
- Spec:
  - `WAP-211` certificate field and extension conformance clauses
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Validation path documents required-vs-optional attribute/extension handling.
  - [ ] Unknown extension behavior is non-fatal unless explicitly required.

### RQ-SPKI-003 Trusted CA information distribution and acceptance controls

- Requirement:
  - CA info acquisition and acceptance flow uses trusted channels or explicit user confirmation semantics.
  - Client processing of CA info structures and hashes follows profile rules.
- Spec:
  - `WAP-217` section 7 and data-structure clauses
  - `WAP-217_103` and `OMA-WAP-217_105` SCR/SIN corrections
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Trust-anchor update policy is explicit (trusted channel, user-confirmed fallback, rejection path).
  - [ ] CA info parsing/validation rules are listed with deterministic reject behavior.

### RQ-SPKI-004 WIM storage model and PKCS#15 object constraints

- Requirement:
  - WIM object directories and mandatory records follow PKCS#15-oriented structure requirements.
  - Access-condition enforcement and object mutability constraints are explicit for CA materials.
- Spec:
  - `WAP-260` section 9 and related object-directory clauses
  - `OMA-WAP-260_101` change set on CDF/access-condition clarifications
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Data model notes required WIM object sets and mandatory fields.
  - [ ] Access-control and mutability rules for trusted CA artifacts are documented.

### RQ-SPKI-005 Cryptographic primitive and interface baseline in WIM profile

- Requirement:
  - Required algorithm families and card/interface capability requirements are explicit where WIM is implemented.
  - ECC-related obligations follow SIN-updated wording where applicable.
- Spec:
  - `WAP-260` core capability clauses
  - `OMA-WAP-260_100` SCR/algorithm support clarifications
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] If WIM is in scope, supported algorithm/profile matrix is frozen in one place.
  - [ ] If WIM is out of scope, this is marked as explicitly deferred with no silent partial behavior.

## Boundary notes for Waves

- Waves currently uses a simulated WTLS/security boundary and does not yet implement full WIM/PKI client stacks.
- These requirements are primarily for:
  - trust-model policy definition,
  - future secure-session parity work,
  - and avoiding accidental non-compliant partial PKI behavior.
