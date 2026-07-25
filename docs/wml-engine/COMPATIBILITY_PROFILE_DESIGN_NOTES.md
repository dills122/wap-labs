# Historical Compatibility Profile -- Design Notes (Not Implemented)

Status: **design reference only**. Nothing in this file is implemented, and per the promotion
rule in `HISTORICAL_QUIRKS.md`, it should not be until a compatibility-profile feature is
explicitly started -- this document exists so that work doesn't begin from a blank page or from
guessing, given the underlying evidence in `historical-quirks.json` is now substantial (84
entries as of 2026-07-25, including primary vendor developer guides for four distinct devices).

Source: proposal from the external deep-research task (user-run, results supplied 2026-07-25,
pass 2 of the historical-quirks research -- see `historical-quirks.json`'s `researchPasses`
field). Lightly edited for this doc's format; the architectural reasoning is the research task's,
not independently re-derived here.

## The core finding: one "legacy WAP mode" is the wrong shape

The strongest conclusion from both research passes is that historical WML compatibility should
not be represented as a single toggle. WML deliberately left the physical representation of `do`
actions and form fields to the user agent (`WAP-191-WML`), and the evidence collected shows
independent variation along (at least) six axes:

1. WML/WAP specification version
2. Browser engine family (Nokia's own engine, Ericsson's own engine, Openwave/UP.Browser, ...)
3. Handset/OEM integration (the same UP.Browser version rendered `<big>` differently on a Siemens
   S35 vs. a Motorola V.2288 -- see `openwave-oem-big-tag-divergence` in the data file)
4. Firmware revision (Nokia 7110 firmware 4.94 materially changed browser behavior -- see
   `nokia-7110-firmware-494-changes`)
5. Gateway/operator behavior (UAProf caching and override, MIME strictness, WBXML compilation
   failure modes)
6. Bearer and network conditions (GSM CSD timing)

A single `LegacyMode::On` boolean cannot represent independent variation on all six axes.

## Proposed structure: base specification plus overlays

Rather than a full configuration duplicated per phone, compose a profile from a base spec target
plus overlays:

```rust
pub struct CompatibilityProfile {
    pub wap_version: WapVersion,
    pub wml_version: WmlVersion,

    pub engine: BrowserEngineProfile,
    pub handset: HandsetProfile,
    pub firmware: Option<FirmwareProfile>,
    pub gateway: GatewayProfile,
    pub network: NetworkProfile,

    pub layout: LayoutPolicy,
    pub interaction: InteractionPolicy,
    pub navigation: NavigationPolicy,
    pub state: StatePolicy,
    pub resources: ResourcePolicy,
    pub scripting: WmlScriptCapabilities,
    pub extensions: VendorExtensionSet,
    pub failures: HistoricalFailurePolicy,
}

pub struct LayoutPolicy {
    pub auto_break_after_anchor: bool,
    pub auto_break_after_input: bool,
    pub ignore_first_br_after_anchor: bool,
    pub table_mode: TableMode,
    pub image_overflow: ImageOverflow,
    pub linked_image_mode: LinkedImageMode,
    pub style_support: StyleSupport,
    pub pixel_aspect_ratio: f32,
}

pub struct InteractionPolicy {
    pub do_mapping: DoMapping,
    pub input_presentation: InputPresentation,
    pub select_presentation: SelectPresentation,
    pub input_blocks_following_content: bool,
    pub focused_link_claims_accept_key: bool,
    pub native_actions: NativeActionSet,
}

pub struct StatePolicy {
    pub variable_scope: VariableScope,
    pub history_limit: usize,
    pub history_replays_post: bool,
    pub newcontext_clears_history: bool,
    pub low_memory_eviction: EvictionPolicy,
}

pub struct ResourcePolicy {
    pub max_compiled_deck_bytes: Option<usize>,
    pub max_displayed_text_chars: Option<usize>,
    pub max_cache_bytes: Option<usize>,
    pub max_cache_entry_bytes: Option<usize>,
    pub cache_url_length_limit: Option<usize>,
    pub oversize_deck_action: OversizeDeckAction,
}

pub struct WmlScriptCapabilities {
    pub bytecode_version: Version,
    pub compiler_available: bool,
    pub interpreter_available: bool,
    pub standard_libraries: LibrarySet,
    pub immediate_refresh: bool,
    pub wtai_functions: FunctionSet,
    pub max_stack_depth: usize,
    pub max_compilation_unit_bytes: usize,
}
```

Composition example (not literal syntax -- illustrates the overlay idea):

```text
wap_1_1
 + nokia_browser_engine
 + nokia_7110_hardware
 + firmware_pre_4_94
 + generic_wap_gateway

wap_1_1
 + openwave_up_4_1
 + motorola_a008_hardware
 + motorola_10_36_32
 + uplink_4_1_gateway

wap_1_1
 + ericsson_browser_engine
 + ericsson_r320_hardware
 + ericsson_wap_gateway
```

This composes odd real-world combinations (a given engine on an unexpected OEM handset) without
an inheritance hierarchy per device.

## Every entry traces to a specific data-file source

Per `HISTORICAL_QUIRKS.md`'s promotion rule: any of the above fields, when actually implemented,
should set its value from a specific `id` in `historical-quirks.json`, never an inlined,
unattributed `if` branch. For example `LayoutPolicy::auto_break_after_anchor` for the
`nokia_7110_pre_4_94` profile traces to `ericsson-r320-vs-nokia-implicit-break-policy` (medium
confidence, contemporary trade press) and `nokia-7110-do-menu-integration`-adjacent primary
evidence; `InteractionPolicy::input_blocks_following_content` for a Motorola A008 profile traces
directly to `motorola-a008-input-blocks-following-content` (high confidence, primary vendor doc).

## Recommended build order (if/when this feature starts)

Not a commitment -- a suggested sequencing based on which profiles have the strongest evidence
and which exercise the most distinct axes:

1. `strict_wap_1_1` -- normative state, history, navigation, input masks, timers, XML/WBXML, and
   gateway errors. (This is closest to what WaveNav already implements; formalizing it as a named
   profile mostly means making today's implicit defaults explicit.)
2. `nokia_7110_pre_4_94` -- menu-hosted actions, roller navigation, modal editors, line-per-link
   layout, table flattening, linked-image fallback, Use Number, tiny cache/deck limits. Strongest
   evidence base of any device profile (primary Nokia service developer guide).
3. `nokia_7110_4_94_plus` -- firmware-dependent improvements and browser settings.
4. `openwave_up_4_1_generic` -- accept/options softkey arbitration, generated menus, Phone.com
   headers and MIME types.
5. `motorola_a008_up_4_1_23d` -- four softbuttons, input-gated content, large touchscreen layout,
   persistent cache, character table, 175 `localsrc` icons. Second-strongest evidence base
   (primary Motorola WAP developer style guide).
6. `ericsson_r320` -- explicit line breaks, unusual pixel geometry, display/input charset
   asymmetry, stricter URI handling.
7. `nokia_series40_7210` -- real tables, picture viewer, GIF support, active-link menu behavior,
   the ignored-first-`<br>` quirk.
8. `siemens_s35i_up_4_1_16` -- OEM variation, partial style support, deck truncation, optional CSD
   timing simulation. Weakest evidence base (contemporary field testing only, no primary vendor
   doc recovered) -- lowest priority of the eight.

Together these exercise softkeys, generated menus, modal forms, line breaking, tables, image
behavior, state leakage, request history, compiled resource limits, WMLScript capability
differences, device headers, gateway caching, and firmware evolution -- without needing dozens of
cosmetic device skins.

## Compatibility test corpus (if/when this feature starts)

Proposed shape: each fixture should assert more than pixels -- parsed/tokenized deck, render
tree, physical line map, focus order, softkey labels, generated menu order, active editor/list
state, browser variables, history entries, cache mutations, emitted WSP/HTTP headers, gateway
diagnostics, and resulting failure/reset state.

Proposed initial fixture names (illustrative, not yet created):

```text
nokia7110_do_menu_order.wml
nokia7110_back_empty_history.wml
nokia7110_use_number_detection.wml
nokia7110_table_linearization.wml
nokia7110_linked_image_alt_fallback.wml
nokia7110_fieldset_silent_split.wml
nokia7110_cache_url_129_bytes.wml
nokia7110_firmware_494_image_link.wml

ericsson_r320_explicit_break_after_link.wml
ericsson_r320_displayable_but_not_inputtable_char.wml
ericsson_r320_space_in_wmlscript_uri.wml

openwave_accept_softkey_priority.wml
openwave_multiple_options_generated_menu.wml
openwave_phonecom_option_image.wml

motorola_a008_four_softkeys.wml
motorola_a008_input_gates_following_content.wml
motorola_a008_soft_hyphen.wml
motorola_a008_text_display_limit.wml
motorola_a008_localsrc_001.wml
motorola_a008_localsrc_175.wml

series40_br_after_anchor.wml
series40_two_br_blank_line.wml
series40_selectable_table.wml
series40_animated_gif_14_frames.wml
series40_active_link_open_menu.wml

browser_context_cross_service_collision.wml
newcontext_wipes_variables_and_history.wml
duplicate_navigation_pushes_history.wml
prev_reissues_post.wml
onenterbackward_card_overrides_template.wml
history_lru_eviction.wml

invalid_dtd_gateway_rejection.wml
wrong_mime_gateway_behavior.wml
wbmp_mime_typefield_conflict.wbmp
wbxml_external_charset_override.wmlc
uaprof_gateway_override.session
```

For visual regressions: store both a logical screenshot and a physical-display screenshot, with
the physical version applying pixel aspect ratio (notably the Ericsson R320's non-square pixels),
LCD scaling, clipping, and font metrics.

## What should not be reproduced literally

- **Do not intentionally freeze or crash.** Reported device freezes (e.g. the Nokia 7110's
  possible oversized-deck freeze), simulator lockups, and full-phone restarts should become
  deterministic outcomes (`HistoricalFailure::DeviceWouldLikelyFreeze`,
  `HistoricalFailure::BrowserContextReset`, `HistoricalFailure::DeckTruncated`), not an actual
  hang -- the user should be able to see what would have happened without Waves itself becoming
  unstable.
- **Do not make historical privacy leaks the default.** Global, persistent, non-origin-scoped WML
  variables (`wml-browser-context-not-origin-scoped`) are worth implementing for compatibility
  testing, but only behind an unmistakable legacy option, never the default `VariableScope`.
- **Do not recreate the WAP security gap as real insecurity.** Classic WAP terminated WTLS at the
  gateway and established a separate TLS connection to the origin, leaving a plaintext boundary
  inside the gateway -- represent that architecture in protocol traces and documentation, but keep
  the actual local implementation safely encrypted or in-process. This is the same principle
  already adopted for WTLS specifically in ADR 0002 and
  `docs/waves/RESEARCH_WTLS_WTP_HISTORICAL_QUIRKS_2026-07-25.md` Part 1 -- this generalizes that
  principle to the whole compatibility-profile feature, not just WTLS.
- **Keep simulator bugs separate from handset behavior.** Period Nokia/Openwave SDKs were
  themselves reported as buggy independent of real device behavior. A device profile should not
  inherit a toolkit-specific freeze or rendering error without separate evidence the real handset
  did the same thing. Suggested namespacing: `device/nokia_7110_pre494` vs.
  `simulator/nokia_toolkit_1_3_beta`, kept as genuinely separate profile categories.

## Cross-cutting entries worth checking against current behavior independent of this feature

A few entries in `historical-quirks.json` are normative WML/WAP spec requirements (not vendor
quirks) that may be worth checking against WaveNav's *current* strict-conformance implementation
regardless of whether a compatibility-profile feature is ever built, since a gap here would be a
spec-fidelity issue in today's default mode, not a historical-quirk question:

- `wml-onenterbackward-card-overrides-deck` -- card-level `onenterbackward` handler precedence
  over the deck/template-level handler.
- `wml-timer-resolution-implementation-dependent` -- relevant to WaveNav's existing deterministic
  timer design goal.
- `wbxml-charset-provenance` -- charset precedence handling in `transport-rust`'s
  `wbxml_decoder.rs`, partially covered already per the 2026-07-25 architecture review's Pass 4.
- `wmlscript-capability-based-support` -- specifically the claim that immediate
  `WMLBrowser.refresh` support is optional in the spec; worth a quick check against
  `engine-wasm/engine`'s current `wavescript` stdlib.

These are flagged for awareness, not filed as issues here -- verifying and acting on them is
separate, smaller-scoped work from the compatibility-profile feature this document is otherwise
about.
