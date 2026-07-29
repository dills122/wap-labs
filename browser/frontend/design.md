# Waves Current design system

## Design intent

Waves Current is a quiet desktop instrument for loading, navigating, and inspecting WML. It is
developer-first, with enough period character to feel sympathetic to WAP without imitating an old
operating system. The real Class C LCD is the visual hero; host chrome recedes into a precise,
native-feeling control surface.

The shell uses Hallmark's **Map / Diagram** macrostructure: one compact command bar maps an address
or fixture into a centered simulator stage, an optional docked Developer Tools toolbox exposes
supporting detail, and a persistent status strip reports the current route and display configuration.
This rotates away from the previous Workbench/Almanac sidebar-and-card fingerprint while preserving
the product's existing information architecture and controller seams.

## Locked visual system

- Theme: custom light "Waves Current".
- Axes: light / system-native / chromatic teal near 191°.
- Host typography: native system UI for display and body; system monospace for technical readouts.
- Guest typography: deterministic Courier-compatible LCD face.
- Geometry: 4px spacing rhythm, 6px controls, 8px panels and reference device; no pills.
- Depth: one restrained chrome gradient, soft borders, and elevation reserved for the simulator.
- Motion: 120–180ms transforms and opacity only; focus is instant; reduced motion is honored.

### Palette

All production color declarations live as named OKLCH tokens in `src/tokens.css`.

| Role | Starting reference | Token |
| --- | --- | --- |
| Canvas | `#E3E7E8` | `--color-canvas` |
| Chrome top | `#F7F8F7` | `--color-chrome-top` |
| Chrome bottom | `#E4E7E6` | `--color-chrome-bottom` |
| Surface | `#F7F7F4` | `--color-surface` |
| Raised surface | warm near-white | `--color-surface-raised` |
| Text | `#1C2828` | `--color-ink` |
| Muted text | `#637170` | `--color-muted` |
| Divider | `#B7C0BE` | `--color-divider` |
| Waves accent | `#0B7773` | `--color-accent` |
| Accent hover | `#08635F` | `--color-accent-hover` |
| Accent soft | `#D7EAE8` | `--color-accent-soft` |
| Focus support | `#43A69F` | `--color-focus-soft` |
| Warning | `#B6791C` | `--color-warning` |
| Danger | `#B24D47` | `--color-danger` |
| Device | `#293A38` | `--color-device` |
| LCD | `#D9E5B6` | `--color-lcd` |
| LCD ink | `#29362D` | `--color-lcd-ink` |

## Shell components

- **Command bar:** Waves identity, grouped history controls, dominant mode-aware omnibox, a compact
  Local/Network segment, and Inspector toggle. It is real browser functionality, not fake chrome.
- **Simulator stage:** open fog canvas with a small reference-view label. It opens on the
  welcome/help view by default, keeps that view available from a quiet stage-level toggle, and
  reveals the authentic LCD reference view when the welcome view is dismissed. A saved preference
  can skip Welcome on later launches without removing the toggle.
- **Reference view:** minimal graphite support around the real viewport and softkeys. No speaker,
  LED, vendor frame, or decorative hardware.
- **Developer Tools:** closed by default and opened from the command bar as a bounded, tabbed
  toolbox. Overview, Transport, Runtime, Timeline, and Source are task panels with one scroll owner
  each, a shared action bar, and compact session telemetry. “Open in Window” creates a real native
  Tauri webview window synchronized with the current session; it is not imitation IDE chrome.
- **Status strip:** persistent two-tier technical readout. Connection state and display controls
  occupy the first tier; route, profile, and an ellipsized address occupy the second. Constrained
  widths progressively hide nonessential metadata rather than allowing values to collide.

## Interaction and copy

Waves teal is the sole ordinary host interaction accent for primary actions, links, selection,
progress, success, and active states. Amber and red are reserved for warning and error status.
Controls expose hover, active, disabled, busy/success/error where relevant, and an immediate high-
contrast focus ring. Action copy is compact and literal: “Go”, “Load”, “Inspector”, “Render”.

## Responsive allowances

The information architecture is shared at every width. At 768px and above the command bar becomes
one row and the open toolbox occupies a fluid 384–576px right column. Below the 880px native window
minimum, the toolbox becomes an in-shell sheet. At narrow handset widths, nonessential
status metadata and the brand wordmark hide while controller-bound actions remain reachable. Coarse
pointer targets expand to at least 44px. Horizontal overflow is not permitted.

## Export formats

### Theme axis

`custom-light / system-native / chromatic-teal-191`

### Macrostructure and key knobs

`Map / Diagram · command-bar → simulator-stage → status-strip · dockable tabbed toolbox · guest LCD as proof object`

### Core design tokens

`4px rhythm · radii 6/8px · system UI + technical mono + Courier LCD · OKLCH Waves Current palette · 120/180ms motion`

### Interaction signature

`mode-aware omnibox · segmented Local/Network control · recallable Welcome · docked/detached Developer Tools · persistent route/status telemetry · instant focus`
