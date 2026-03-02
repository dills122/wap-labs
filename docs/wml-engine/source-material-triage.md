# Source Material Triage (spec-processing/source-material)

This triage reviews all `93` files in `spec-processing/source-material` and scopes only what matters for the WASM WML rendering/runtime engine.

Note: this is a full-corpus triage document. For the currently reviewed canonical extraction conclusions, use `source-material-review.md`.

## Decision Rule

Include documents only if they directly affect one of:

- WML deck/card syntax and semantics
- WML runtime behavior (tasks, events, variables, history/context)
- WML media-type/format handling needed by the engine boundary
- WML-adjacent presentation/runtime features we plan to add (styles, script, transforms)

## In-Scope for Engine Work

### Tier 0 (Must-use now)

1. `WAP-191-WML-20000219-a.pdf`
2. `WAP-191_102-WML-20001213-a.pdf`
3. `WAP-191_104-WML-20010718-a.pdf`
4. `WAP-191_105-WML-20020212-a.pdf`
5. `WAP-236-WAESpec-20020207-a.pdf`

Why:

- `WAP-191*` is the core markup language definition and SIN lineage.
- `WAP-236` defines browser/runtime environment semantics that affect task execution, navigation/history, and context behavior.

### Tier 1 (Needed soon)

1. `WAP-192-WBXML-20010725-a.pdf`
2. `WAP-192_105-WBXML-20011015-a.pdf`
3. `WAP-237-WAEMT-20010515-a.pdf`
4. `WAP-210-WAPArch-20010712-a.pdf`

Why:

- `WAP-192*` informs tokenized document handling assumptions (even if decode is currently transport-side).
- `WAP-237` covers MIME/media typing and content handling implications.
- `WAP-210` provides architecture context for boundary decisions and conformance reasoning.

### Tier 2 (Planned features)

1. `WAP-193-WMLScript-20001025-a.pdf`
2. `WAP-193_101-WMLScript-20010928-a.pdf`
3. `WAP-194-WMLScriptLibraries-20000925-a.pdf`
4. `WAP-194_103-WMLScriptLibraries-20020318-a.pdf`
5. `WAP-239-WCSS-20011026-a.pdf`
6. `WAP-239-101-WCSS-20020430-a.pdf`
7. `WAP-244-WMLTR-20011106-a.pdf`
8. `WAP-188-WAPGenFormats-20010710-a.pdf`

Why:

- Needed only when enabling script, styling, and transform/extended formatting behavior.

## Out-of-Scope for WASM Engine (Current)

These were reviewed by title/spec code and intentionally excluded from engine implementation scope now.

### Security/PKI/Identity

- `WAP-211*`, `OMA-WAP-211*` (WAPCert)
- `WAP-217*`, `OMA-WAP-217*` (WPKI)
- `WAP-219*` (TLS)
- `WAP-260*`, `OMA-WAP-260*` (WIM)
- `WAP-261*` (WTLS)
- `WAP-187*` (TransportE2ESec)
- `WAP-196` (ClientID)

### Transport/Protocol Stack (network layer, not engine semantics)

- `WAP-224*` (WTP)
- `WAP-230` (WSP)
- `WAP-259` (WDP)
- `WAP-202` (WCMP)
- `WAP-225` (TCP)
- `WAP-229*` (HTTP)
- `WAP-223*` (HTTPSM)
- `WAP-159` (WDP/WCMP adapt)
- `WAP-204*` (WAP over GSM USSD)

### Push/Provisioning/OTA

- `WAP-235*` (Push OTA)
- `WAP-247*` (PAP)
- `WAP-249*` (PPG Service)
- `WAP-250` (Push Arch Overview)
- `WAP-251` (Push Message)
- `WAP-182`, `WAP-183*`, `WAP-184*`, `WAP-185`, `WAP-186` (Provisioning)

### Messaging/Sync/Service Indication

- `WAP-205`, `WAP-206`, `WAP-209` (MMS)
- `WAP-234` (SYNC)
- `WAP-167*` (ServiceInd)
- `WAP-168*` (ServiceLoad)
- `WAP-175*` (CacheOp)
- `WAP-120` (Caching Mod)

### Telephony/WTA Families

- `WAP-266`, `WAP-268`, `WAP-228`, `WAP-255`, `WAP-269`, `WAP-270`

### Other Non-target Markup Families

- `WAP-277-XHTMLMP-20011029-a.pdf` (WAP 2.0 profile family; not in 1.x engine target)

## Practical Read Order for Engine Team

1. `WAP-191_105` (latest WML + corrections)
2. `WAP-191_104`, `WAP-191_102`, `WAP-191` (back-reference for change lineage)
3. `WAP-236` (runtime/browser semantics)
4. `WAP-237` (media types)
5. `WAP-192_105` + `WAP-192` (tokenized format context)

## Mapping to Active Engine Tickets

- Phase A in `ticket-plan.md` depends primarily on `WAP-191*` + `WAP-236`.
- Phase B task/event/variable work depends heavily on `WAP-236` + `WAP-191*`.
- Phase C form/payload work depends on WML form and action semantics in `WAP-191*`.
- Deferred Phase D work aligns to `WAP-193*`, `WAP-194*`, `WAP-239*`, and `WAP-244`.

## Recommended Next Step

Before implementing Phase 2+, extract normative clauses from `WAP-191_105` and `WAP-236` into a dedicated requirements matrix (`requirement -> engine module -> test case`).
