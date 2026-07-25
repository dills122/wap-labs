# Historical WAP Browser Quirks Reference

Status: reference data, **not implementation-ready**. Nothing in this file or in
`historical-quirks.json` currently affects `engine-wasm/engine` runtime behavior, and none of it
should until explicitly promoted through the process below.

## Purpose

WaveNav currently implements WML against the formal WAP 1.2.1 / WML 1.3 specification, tracked by
the spec-fidelity compliance program (`docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md`). Real historical
WAP microbrowsers -- chiefly Openwave/Phone.com's UP.Browser and Nokia's browser implementations --
are known to have diverged from that spec in practice, the way real HTML of the era was written for
specific browser quirks rather than strict spec compliance. This is the project's stated
differentiator (see `docs/waves/WAVES_ARCHITECTURE_REVIEW_2026-07-25.md` §6, "Historical
compatibility profiles"), but building it on guesses would undermine the same evidence discipline
the WML compliance program already enforces.

`historical-quirks.json` is a structured, source-cited catalogue of documented divergences, gathered
across two research passes -- see the file's own `researchPasses` field for exact scope/dates of
each. It exists so a future compatibility-profile feature has real evidence to build against
instead of starting from memory or plausible-sounding assumption. `COMPATIBILITY_PROFILE_DESIGN_
NOTES.md` captures the proposed architecture (profile struct shape, build order, test corpus) that
pass 2's research sketched out -- also reference-only, not implemented, subject to the same
promotion rule as this file.

## What's actually in the data

84 entries as of 2026-07-25 (33 from pass 1, 51 added in pass 2).

Pass 1's bulk (24 entries) came from the WAP Forum's own official "Generic Content Authoring Guide
for WML 1.1" (WAP-218-GCAG, 8-Feb-2001) -- a genuinely strong, citable, primary-tier source, but one
that deliberately anonymizes every divergence as "some browsers..." for consortium-neutrality
reasons rather than naming a vendor. Its remaining entries carried vendor attribution (Openwave/
Phone.com, Nokia, WinWAP) but came from tutorial sites and similar secondary sources -- real
testimony, not independently reproduced against a primary vendor document. That pass explicitly
flagged Wayback Machine access as unavailable, which it identified as the main reason
vendor-specific attribution was thin.

Pass 2 (an external deep-research task, results supplied by the user) closed a meaningful part of
that gap: it recovered **primary vendor developer documentation** for four distinct devices --
Nokia's own 7110 service developer guide, Motorola's A008 WAP developer style guide, Ericsson's R320
manuals, plus several **normative OMA specs** fetched directly (WML 1.1, WBXML, WMLScript, WMLScript
libraries, WAP caching, WAEMT, UAProf) rather than relying on secondary summaries of them. Those
entries carry `sourceType: "primary-vendor-doc"` or `"normative-spec"` and mostly `confidence:
"high"`. Not every pass-2 URL was independently re-fetched during this integration pass -- see each
entry's own citation and the file's `researchPasses` note for exactly what was and wasn't
re-verified before being added.

Every entry's `sourceType`, `confidence`, and `attributionConfidence` fields say explicitly which
kind of evidence it is; read those before citing or acting on any single entry.

## Schema

Each entry in `historical-quirks.json`'s `entries` array has:

| Field | Meaning |
|---|---|
| `id` | Stable, unique kebab-case slug |
| `vendor` | Attributed vendor name, or `null` for an unattributed/pattern-tier entry (most GCAG entries) |
| `product` | Specific browser/product/version, or `null` if not that specific |
| `wmlConstruct` | The WML tag, attribute, or event the divergence concerns |
| `claimedBehavior` | The divergence itself, in the source's own terms where possible |
| `sourceType` | One of `sourceTypeTaxonomy`: `normative-spec`, `official-informative-document`, `primary-vendor-doc`, `contemporary-trade-press`, `tutorial-site`, `modern-retrospective`, `unverified-search-synthesis` |
| `sourceUrl` | Where the claim comes from |
| `confidence` | One of `confidenceTaxonomy` (`high`/`medium`/`low`): how trustworthy the claim itself is |
| `attributionConfidence` | One of `attributionConfidenceTaxonomy` (`none`/`low`/`medium`/`high`): how confident the *vendor attribution specifically* is, independent of whether the underlying divergence is real |
| `implementationReady` | Always `false` today -- see Promotion rule below |
| `notes` | Optional caveats, chronology mismatches, or corroboration gaps worth knowing before citing the entry elsewhere |

`normative-spec` is distinct from `official-informative-document`: the latter is reserved for the
WAP Forum's GCAG specifically (explicitly informative, not normative, and deliberately
vendor-anonymized); the former is for actual normative OMA specs (WML, WBXML, WMLScript, UAProf,
caching, WAEMT) fetched directly. Primary Openwave developer documentation (developer.openwave.com)
is still not recovered as of pass 2 -- Wayback Machine access remains the likely path to closing that
specific gap, per pass 1's Open Questions.

## Promotion rule (read before writing a `CompatibilityProfile`)

This file is data, not agent instructions or runtime behavior, per the same trust-boundary
convention this project already applies to generated compliance context packs
(`docs/agents/COMPLIANCE_CONTEXT_RETRIEVAL.md`, "Trust boundary" section). If and when a
runtime-level compatibility profile type is built:

1. It must be explicitly selected, never default (e.g. `CompatibilityProfile::StrictWml13` as the
   default, with something like `CompatibilityProfile::HistoricalObserved(...)` requiring explicit
   opt-in) -- matching `AGENTS.md`'s multi-target/contract-first guidance and the "don't build this
   speculatively" caution in the 2026-07-25 architecture review.
2. Any quirk it applies must trace back to a specific `id` in `historical-quirks.json` -- never an
   unattributed `if` branch inlined into parser/runtime/layout code.
3. An entry with `attributionConfidence: "none"` or `"low"` should not be implemented as
   vendor-specific behavior. Unattributed GCAG-sourced entries (`attributionConfidence: "none"`) are
   real, well-evidenced *categories* of divergence, but implementing one as if it were, say,
   "Openwave does X" would misrepresent the evidence -- if a generic/pattern-tier quirk is
   implemented at all, it should be presented and profiled as such, not vendor-attributed.
4. Do not flip `implementationReady` to `true` for an entry without independent corroboration beyond
   what's currently cited -- a second source, ideally primary or contemporary trade press, agreeing
   with the existing one. Tutorial-site or search-synthesis sourced entries stay `false` until that
   bar is met.

This keeps the existing, spot-checked WAP 1.2.1/WML 1.3 compliance-evidence program uncontaminated
by speculative or low-confidence historical claims, and keeps this file honest about what it
actually is: a research lead list, not a spec.
