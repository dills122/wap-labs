# Waves Browser WBP-05A Accessibility Evidence

Status: accepted corrective/evidence follow-up
Captured: 2026-07-26
Owner lane: `browser`, `qa`

## Scope

`WBP-05A` closes the additive accessibility gap found after `WBP-05`; it does not reopen or rewrite
the completed baseline. The change remains browser-local and does not add a browser-authored WML
semantic tree. Engine-derived card/action semantic adaptation remains `WBP-09` scope.

The shell now owns one visually hidden `role="status"`, `aria-live="polite"`, `aria-atomic="true"`
announcement channel outside collapsible content. Navigation loading and failure status changes
write that channel once. The visible status panel and recovery toast retain their messages and tone
without acting as parallel live regions. Toast-only host events, including deterministic script
dialogs and failures, reuse the same channel.

## Automated Evidence

`browser/frontend/src/app/navigation-announcement.test.ts` observes the live-region mutation
boundary directly and proves one write for each deterministic loading and failure state change. It
also proves that the visible status and toast remain populated and that the mounted shell exposes
exactly one live-announcement channel.

`pnpm --dir browser/frontend test:accessibility:rendered` builds `browser-story.html` for production,
loads the real WaveNav WASM engine with deterministic local fixtures, and runs headless Chromium at
both configured Tauri window sizes. Effective 200 percent browser zoom is modeled as a half-sized
CSS viewport with `deviceScaleFactor: 2`, retaining screenshots at the physical window dimensions:

| Window  | Physical pixels | CSS viewport at 200% | Horizontal overflow | Rendered axe violations |
| ------- | --------------: | -------------------: | ------------------- | ----------------------: |
| Default |     1024 by 768 |           512 by 384 | none                |                       0 |
| Minimum |      880 by 640 |           440 by 320 | none                |                       0 |

The rendered check opens every host disclosure, runs the full axe ruleset (including 50 passing
color-contrast nodes at each size), and independently verifies every visible enabled host target is
at least 24 by 24 CSS pixels and is not horizontally clipped. Keyboard traversal asserts each of 28
host tab stops matches `:focus-visible` and has a 2-pixel black outline, 2-pixel offset, and white
outer separation ring. Reduced motion is enabled during capture.

Machine-readable measurements, exact target boxes, focus styles, environment, and the zero-
violation results are in
[`evidence/wbp-05a/rendered-accessibility.json`](evidence/wbp-05a/rendered-accessibility.json).

[Default window at 200 percent with Reload focus visible](evidence/wbp-05a/default-window-200-percent.png)

[Minimum window at 200 percent with Reload focus visible](evidence/wbp-05a/minimum-window-200-percent.png)

## Reproduce

From the repository root with Node.js 22.22.1, pnpm 10.23.0, wasm-pack, and Playwright Chromium
available:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
cd ../..
pnpm --dir browser/frontend test:accessibility:rendered
```

The default output is ignored under `browser/frontend/test-results/wbp-05a`. Set
`WAVES_ACCESSIBILITY_OUTPUT_DIR` to retain a named run; relative paths resolve from the repository
root.

## Manual-only Packaged macOS Smoke

Browser automation cannot verify how WKWebView announcements cross macOS `NSAccessibility`, how
VoiceOver schedules repeated polite announcements, or how platform-drawn window/menu chrome affects
focus presentation. Those checks remain manual and are not claimed by the Chromium evidence.

When packaged macOS application output is enabled, run this smoke with VoiceOver:

1. Launch the packaged Waves application at the default and minimum supported window sizes.
2. Set host zoom to 200 percent and traverse browser-owned actions with Tab and Shift+Tab; confirm
   the focused action remains visible and controls remain operable through vertical scrolling.
3. Start a network navigation that reaches loading and then a deterministic failure. Confirm
   VoiceOver announces the loading change once and the failure change once while the visible status
   and recovery toast remain available.
4. Repeat a successful navigation and a toast-only script/dialog event to confirm the unified live
   channel does not suppress later distinct messages.

The repository currently has packaging disabled in `browser/src-tauri/tauri.conf.json`, so no
packaged-app/VoiceOver result is recorded for this slice. Native-control keyboard behavior remains
covered by the existing browser story and Tauri tests.
