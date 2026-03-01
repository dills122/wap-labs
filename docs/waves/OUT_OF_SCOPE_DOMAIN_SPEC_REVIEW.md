# Waves Out-of-Scope Domain Spec Review

Version: v0.1  
Status: S0-12 complete (initial extraction)

## Purpose

Document reviewed requirements for currently out-of-scope domains so deferrals are explicit, traceable, and reversible.

## Source set reviewed (S0-12)

### Push family

- `docs/source-material/WAP-235-PushOTA-20010425-a.pdf`
- `docs/source-material/WAP-235_100-PushOTA-20011008-a.pdf`
- `docs/source-material/WAP-235_101-PushOTA-20020612-a.pdf`
- `docs/source-material/WAP-247-PAP-20010429-a.pdf`
- `docs/source-material/WAP-247_100-PAP-20011010-a.pdf`
- `docs/source-material/WAP-249-PPGService-20010713-a.pdf`
- `docs/source-material/WAP-249_102-PPGService-20011009-a.pdf`
- `docs/source-material/WAP-250-PushArchOverview-20010703-a.pdf`
- `docs/source-material/WAP-251-PushMessage-20010322-a.pdf`

### Provisioning family

- `docs/source-material/WAP-182-PROVARCH-20010314-a.pdf`
- `docs/source-material/WAP-183-PROVCONT-20010724-a.pdf`
- `docs/source-material/WAP-183_003-PROVCONT-20010912-a.pdf`
- `docs/source-material/WAP-183_004-PROVCONT-20011025-a.pdf`
- `docs/source-material/WAP-183_005_PROVCONT-20020411-a.pdf`
- `docs/source-material/WAP-184-PROVBOOT-20010314-a.pdf`
- `docs/source-material/WAP-184_001-PROVBOOT-20011010-a.pdf`
- `docs/source-material/WAP-185-PROVUAB-20010314-a.pdf`
- `docs/source-material/WAP-186-PROVSC-20010710-a.pdf`

### Messaging/sync family

- `docs/source-material/WAP-167-ServiceInd-20010731-a.pdf`
- `docs/source-material/WAP-167_103-ServiceInd-20010926-a.pdf`
- `docs/source-material/WAP-168-ServiceLoad-20010731-a.pdf`
- `docs/source-material/WAP-168_103-ServiceLoad-20010816-a.pdf`
- `docs/source-material/WAP-175-CacheOp-20010731-a.pdf`
- `docs/source-material/WAP-175_102-CacheOp-20010816-a.pdf`
- `docs/source-material/WAP-205-MMSArchOverview-20010425-a.pdf`
- `docs/source-material/WAP-206-MMSCTR-20020115-a.pdf`
- `docs/source-material/WAP-209-MMSEncapsulation-20020105-a.pdf`
- `docs/source-material/WAP-234-SYNC-20010530-a.pdf`

### WTAI/telephony family

- `docs/source-material/WAP-266-WTA-20010908-a.pdf`
- `docs/source-material/WAP-268-WTAI-20010908-a.pdf`
- `docs/source-material/WAP-228-WTAIIS95-20010908-a.pdf`
- `docs/source-material/WAP-255-WTAIGSM-20010908-a.pdf`
- `docs/source-material/WAP-269-WTAIIS136-20010908-a.pdf`
- `docs/source-material/WAP-270-WTAIPDC-20010908-a.pdf`

### Presentation/xhtmlmp family

- `docs/source-material/WAP-239-WCSS-20011026-a.pdf`
- `docs/source-material/WAP-239-101-WCSS-20020430-a.pdf`
- `docs/source-material/WAP-244-WMLTR-20011106-a.pdf`
- `docs/source-material/WAP-277-XHTMLMP-20011029-a.pdf`

### Misc family

- `docs/source-material/WAP-120-WAPCachingMod-20010413-a.pdf`
- `docs/source-material/WAP-204-WAPOverGSMUSSD-20010730-a.pdf`
- `docs/source-material/WAP-204_103-WAPOverGSMUSSD-20010813-a.pdf`
- `docs/source-material/WAP-213-WAPInterPic-20010406-a.pdf`
- `docs/source-material/WAP-213_101-WAPInterPic-20011123-a.pdf`
- `docs/source-material/WAP-213_102-WAPInterPic-20011128-a.pdf`
- `docs/source-material/WAP-227-PSTOR-20011220-a.pdf`
- `docs/source-material/WAP-231-EFI-20011217-a.pdf`

## Domain requirement extracts and current scope posture

### RQ-OOS-001 Push stack

- Requirements observed:
  - OTA push transport modes, confirmed/unconfirmed delivery semantics, and security requirements (WTLS on secure paths) are normative.
  - PAP/PPG include strict request/notification/status handling and entity ordering rules.
- Spec:
  - `WAP-235*`, `WAP-247*`, `WAP-249*`, `WAP-250`, `WAP-251`
- Current posture:
  - `deferred/out-of-scope` for Waves MVP.
- AC for future enablement:
  - [ ] Push session model and delivery-state machine defined before implementation.
  - [ ] PAP and PPG contracts documented with error/result notification behavior.

### RQ-OOS-002 Provisioning and bootstrap

- Requirements observed:
  - Provisioning content/security model, bootstrap trust mechanisms, and smart-card provisioning file rules are normative and substantial.
- Spec:
  - `WAP-182..186` and SIN overlays
- Current posture:
  - `deferred/out-of-scope` for Waves MVP.
- AC for future enablement:
  - [ ] Security method + MAC/PIN flow model specified end-to-end.
  - [ ] SIM/WIM provisioning read/update policy explicitly documented.

### RQ-OOS-003 Messaging/sync services

- Requirements observed:
  - SI/SL/CO behavior, MMS transaction and encapsulation flows, and sync protocol requirements impose separate application frameworks.
- Spec:
  - `WAP-167*`, `WAP-168*`, `WAP-175*`, `WAP-205`, `WAP-206`, `WAP-209`, `WAP-234`
- Current posture:
  - `deferred/out-of-scope` for Waves MVP.
- AC for future enablement:
  - [ ] Message lifecycle, queueing, and replacement semantics formalized in dedicated contracts.
  - [ ] Push/MMS/Sync dependency layering defined before feature development.

### RQ-OOS-004 WTAI/telephony integration

- Requirements observed:
  - WTA session security, permission model, and telephony event/function bindings are strict and carrier/network dependent.
- Spec:
  - `WAP-266`, `WAP-268`, `WAP-228`, `WAP-255`, `WAP-269`, `WAP-270`
- Current posture:
  - `deferred/out-of-scope` for Waves MVP.
- AC for future enablement:
  - [ ] Permission model and trusted-gateway constraints captured in host security policy.
  - [ ] Network-specific telephony adapters defined per target profile.

### RQ-OOS-005 Presentation and XHTML MP

- Requirements observed:
  - WAP CSS and XHTML MP user-agent conformance are extensive and represent a separate rendering track.
- Spec:
  - `WAP-239*`, `WAP-244`, `WAP-277`
- Current posture:
  - `deferred/out-of-scope` for current WAP 1.x runtime-first milestone.
- AC for future enablement:
  - [ ] Rendering-mode decision (WML-centric vs XHTMLMP dual mode) made explicitly.
  - [ ] WCSS parser/cascade support matrix defined before coding.

### RQ-OOS-006 Miscellaneous adjunct capabilities

- Requirements observed:
  - Caching model updates, USSD transport profile, pictogram semantics, persistent storage API, and EFI model each add significant independent scope.
- Spec:
  - `WAP-120`, `WAP-204*`, `WAP-213*`, `WAP-227`, `WAP-231`
- Current posture:
  - `deferred/out-of-scope` unless specific capability is promoted.
- AC for future enablement:
  - [ ] Each capability activated only via explicit ticket with contract updates and test scope.

## Notes

- This review closes source-material ambiguity for out-of-scope domains; deferral is explicit and documented.
- No implementation commitments are created by this document.
