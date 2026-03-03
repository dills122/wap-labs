# Tauri App Professional Polish Exploration

## Objective

Identify high-leverage polish opportunities for a Tauri-based desktop product (Rust engine + web UI) that:

- increase perceived quality
- improve native OS integration
- enhance smoothness and usability
- keep engineering effort and architectural overhead low
- remain compatible with multi-target delivery (native desktop + browser/WASM builds)

This document intentionally prioritizes subtle, production-grade polish over redesign-heavy visual work.

## Evaluation Matrix

### 1) Native Desktop Integration

| Opportunity | Effort | Perceived Impact | Architectural Notes | Multi-Target Notes |
| --- | --- | --- | --- | --- |
| Persist window bounds/state (size, position, maximized, monitor) | Low | High | Small host-side persistence hook; restore before first paint | Native only; browser adapter no-op |
| Native menu bar with OS role mappings (`File/Edit/View/Help`) | Moderate | High | Central command routing required; improves long-term command architecture | Browser fallback can reuse same command IDs via in-app menu/palette |
| Standard OS keyboard shortcuts (quit/close/find/preferences) | Low | High | Shared command registry + per-platform keymap | Keep command IDs shared across native and browser |
| Native open/save file dialogs | Low | Medium-High | Isolate in host capability API, keep domain logic outside dialog code | Browser fallback via file input/download APIs |
| About window/panel (version, engine build, diagnostics entrypoint) | Low | Medium-High | Requires build metadata plumbing from host/engine into UI | Browser can show subset of fields |
| Overlay/custom titlebar (especially macOS) | Moderate | Medium | Adds drag-region and window control handling complexity | Keep optional; avoid as baseline requirement |
| Auto-update infrastructure (internal channel acceptable) | Moderate | High | Introduces release/signing/update pipeline obligations | Native only; hide in browser builds |

### 2) Micro-Interaction Quality

| Opportunity | Effort | Perceived Impact | Architectural Notes | Multi-Target Notes |
| --- | --- | --- | --- | --- |
| Motion timing tokens (`120ms`, `180ms`, `240ms`) | Low | Medium-High | Centralize durations/easing to remove inconsistency | Shared |
| Layout shift avoidance (reserved dimensions, stable containers) | Low | High | Mostly CSS/layout discipline | Shared |
| Skeleton/placeholder states for deck and engine loads | Low-Moderate | High | Requires explicit loading-state model | Shared |
| Toast notification system (severity, dedupe, action) | Moderate | Medium-High | Lightweight notification bus | Shared |
| Keyboard and focus-visible polish | Low | High | Accessibility and deterministic input model alignment | Shared |
| Command palette + shortcut overlay | Moderate | Medium-High | Central command registry becomes reusable core | Strong cross-target unifier |

### 3) Visual Refinement

| Opportunity | Effort | Perceived Impact | Architectural Notes | Multi-Target Notes |
| --- | --- | --- | --- | --- |
| True-dark palette with elevation and subtle borders | Low | High | Token-driven color system, no framework dependency | Shared |
| Unified state styling (hover/focus/active/disabled) | Low | High | Component-level consistency pass | Shared |
| Iconography normalization (single stroke family/grid) | Moderate | Medium-High | One icon set and usage guidelines | Shared |
| Typography scale/weights normalization | Low | Medium-High | Design token cleanup | Shared |
| Subtle depth (light gradients/noise overlays) | Low | Medium | Keep restrained to avoid theme debt | Shared |

### 4) Error Handling and Diagnostics

| Opportunity | Effort | Perceived Impact | Architectural Notes | Multi-Target Notes |
| --- | --- | --- | --- | --- |
| Structured engine->UI error envelope (`code`, `message`, `context`, `traceId`) | Moderate | High | Contract-first change; strongly maintainable | Shared contract across adapters |
| Friendly failure states with retry/recover affordances | Low-Moderate | High | UI state pattern addition | Shared |
| Diagnostic copy/export actions | Moderate | High | Collect runtime/app/env/version metadata in one view | Native save dialog + browser download fallback |
| Graceful panic/crash handling path | Moderate | High | Host panic hook + top-level UI boundary | Native richer; browser still supports UI boundary |
| Non-intrusive diagnostics panel (support/debug mode) | Moderate | Medium-High | Optional support surface | Shared |

### 5) First-Launch and Perceived Performance

| Opportunity | Effort | Perceived Impact | Architectural Notes | Multi-Target Notes |
| --- | --- | --- | --- | --- |
| Explicit startup sequencing (`shell-ready`, `engine-ready`, `deck-ready`) | Moderate | High | Introduces predictable boot state machine | Shared; excellent parity driver |
| No-blank launch surface (prepainted background + immediate shell frame) | Low-Moderate | High | Host window config plus shell-first render | Native config + shared CSS |
| Defer non-critical startup work | Low | Medium-High | Startup task prioritization only | Shared |
| Session restoration (last deck/card/focus context) | Moderate | High | Needs clear persisted-state boundaries | Shared; preserve deterministic runtime behavior |
| Subtle initial fade-in after stable first paint | Low | Medium | Cosmetic only; do not mask slow loads | Shared |

## Recommended Prioritized Options (Next Cycle)

These options maximize perceived professionalism while keeping architecture simple and maintainable.

### Option A: Native Baseline Professionalism

- Persist window state
- Add native menu roles
- Add standard OS shortcuts via shared command IDs
- Add About surface with app + engine version info

Effort: Low-Moderate  
Impact: High  
Risk: Low, if shortcut/menu actions route through a single command registry

### Option B: Launch and Runtime Smoothness

- Implement startup sequencing states
- Remove blank/white startup flashes
- Add deterministic skeleton states for first deck load
- Eliminate major layout shifts during deck transitions

Effort: Low-Moderate  
Impact: High  
Risk: Low, mainly UI-state and boot-order coordination

### Option C: Robustness Visibility

- Introduce structured engine->UI error envelope
- Standardize user-facing failure surfaces with retry actions
- Add diagnostics copy/export entrypoint

Effort: Moderate  
Impact: High  
Risk: Moderate, because it touches host-engine contract boundaries

## Suggested Execution Order

1. Option B (fastest perceived-quality gain in first 1-2 seconds and navigation continuity)
2. Option A (native credibility and desktop expectations)
3. Option C (professional supportability and reliability signaling)

## Guardrails to Keep Architecture Clean

- Keep native-only behavior behind a thin host capability interface.
- Keep one shared command registry and one shared error envelope shape across targets.
- Add polish through tokens/contracts and small adapters, not heavyweight UI framework changes.
- Preserve layer boundaries:
  - host wiring in `browser/`
  - runtime/render logic in `engine-wasm/`
  - transport behavior in `transport-rust/`

## Out-of-Scope for This Polish Track

- large-scale visual redesign
- animation-heavy UX work
- architecture-spanning refactors
- nonessential dependency/framework additions
