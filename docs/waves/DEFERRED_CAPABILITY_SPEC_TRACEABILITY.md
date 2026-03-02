# Waves Deferred Capability Spec Traceability

Version: v0.1  
Status: S0-10 complete (initial extraction + docling rerun validation pass)

## Purpose

Record deferred-but-reviewed capability specs so scope decisions remain explicit and reversible.

## Source set reviewed (S0-10)

- `spec-processing/source-material/WAP-161-WMLScriptCrypto-20010620-a.pdf`
- `spec-processing/source-material/WAP-161_101-WMLScriptCrypto-20010730-a.pdf`
- `spec-processing/source-material/WAP-248-UAProf-20011020-a.pdf`

## Requirements and defer decisions

### RQ-DEF-001 WMLScript crypto signing/dialog semantics

- Requirement:
  - Crypto-library signing flows include strict user-display/consent and key-selection requirements when implemented.
  - Signature option flags have mandatory inclusion semantics for content/hash/certificate in selected modes.
- Spec:
  - `WAP-161` crypto library description sections
  - `WAP-161_101` SCR-format correction
- AC:
  - [ ] Current status marked `deferred` for Waves MVP.
  - [ ] Future implementation ticket must include user-consent and key-usage behavior from this spec.

### RQ-DEF-002 WMLScript crypto time/signature formatting constraints

- Requirement:
  - Signature and time encoding constraints (UTCTime handling etc.) follow profile rules when emitted.
- Spec:
  - `WAP-161` formatting/profile sections
- AC:
  - [ ] If signature features are added, test fixtures include date/time and ASN.1 encoding checks.

### RQ-DEF-003 UAProf RDF/profile processing model

- Requirement:
  - UAProf schema/profile processing requires RDF namespace, component, and attribute resolution rules.
  - Defaults/fragment merge semantics are deterministic.
- Spec:
  - `WAP-248` schema/profile sections (RDF/CCPP model clauses)
- AC:
  - [ ] Current status marked `deferred` for Waves MVP.
  - [ ] Any future UAProf support must declare parser/merge behavior before implementation starts.

## Notes

- These specs are now reviewed and tracked; deferral is intentional, not unknown.
- Defer status should be revisited only when:
  - script crypto becomes a product requirement, or
  - UA/device capability negotiation is promoted into scope.
