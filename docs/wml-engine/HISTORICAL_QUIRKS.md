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
during focused external research (`docs/waves/RESEARCH_WTLS_WTP_HISTORICAL_QUIRKS_2026-07-25.md`,
Part 3). It exists so a future compatibility-profile feature has real evidence to build against
instead of starting from memory or plausible-sounding assumption.

## What's actually in the data

33 entries as of 2026-07-25. The bulk (24 entries) come from the WAP Forum's own official "Generic
Content Authoring Guide for WML 1.1" (WAP-218-GCAG, 8-Feb-2001) -- a genuinely strong, citable,
primary-tier source, but one that deliberately anonymizes every divergence as "some browsers..." for
consortium-neutrality reasons rather than naming a vendor. The remaining entries carry actual vendor
attribution (Openwave/Phone.com, Nokia, WinWAP) but come from tutorial sites, a single W3C workshop
paper, and similar secondary sources -- real testimony, but not independently reproduced or verified
against a primary vendor document. Every entry's `sourceType`, `confidence`, and
`attributionConfidence` fields say explicitly which kind of evidence it is; read those before citing
or acting on any single entry. See the research memo for the full honest assessment of source
scarcity (Wayback Machine access was unavailable during that research pass, which is likely the
single biggest reason vendor-specific attribution is thin -- see that memo's Open Questions for
concrete next research steps, including a deep vendor-specific pass someone may run separately).

## Schema

Each entry in `historical-quirks.json`'s `entries` array has:

| Field | Meaning |
|---|---|
| `id` | Stable, unique kebab-case slug |
| `vendor` | Attributed vendor name, or `null` for an unattributed/pattern-tier entry (most GCAG entries) |
| `product` | Specific browser/product/version, or `null` if not that specific |
| `wmlConstruct` | The WML tag, attribute, or event the divergence concerns |
| `claimedBehavior` | The divergence itself, in the source's own terms where possible |
| `sourceType` | One of `sourceTypeTaxonomy`: `official-informative-document`, `primary-vendor-doc`, `contemporary-trade-press`, `tutorial-site`, `modern-retrospective`, `unverified-search-synthesis` |
| `sourceUrl` | Where the claim comes from |
| `confidence` | One of `confidenceTaxonomy` (`high`/`medium`/`low`): how trustworthy the claim itself is |
| `attributionConfidence` | One of `attributionConfidenceTaxonomy` (`none`/`low`/`medium`/`high`): how confident the *vendor attribution specifically* is, independent of whether the underlying divergence is real |
| `implementationReady` | Always `false` today -- see Promotion rule below |
| `notes` | Optional caveats, chronology mismatches, or corroboration gaps worth knowing before citing the entry elsewhere |

`primary-vendor-doc` currently has zero entries -- no primary Openwave or Nokia developer
documentation was recoverable in the research pass that produced this file (Wayback Machine access
was blocked). Filling that gap is the highest-value next step for anyone continuing this research.

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
