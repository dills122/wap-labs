import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import axe from 'axe-core';
import { build, preview } from 'vite';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, '..');
const REPO_ROOT = path.resolve(FRONTEND_DIR, '..', '..');
const TAURI_CONFIG_PATH = path.join(REPO_ROOT, 'browser', 'src-tauri', 'tauri.conf.json');
const DEFAULT_OUTPUT_DIR = path.join(FRONTEND_DIR, 'test-results', 'wbp-05a');
const requestedOutputDir = process.env.WAVES_ACCESSIBILITY_OUTPUT_DIR;
const outputDir = requestedOutputDir
  ? path.isAbsolute(requestedOutputDir)
    ? requestedOutputDir
    : path.resolve(REPO_ROOT, requestedOutputDir)
  : DEFAULT_OUTPUT_DIR;
const requestedBaseRevision = process.env.WAVES_ACCESSIBILITY_BASE_REVISION?.trim();
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-accessibility-build-'));
const tauriConfig = JSON.parse(await readFile(TAURI_CONFIG_PATH, 'utf8'));
const windowConfig = tauriConfig.app.windows[0];

// Browser zoom halves the CSS-pixel viewport available to layout. A device
// scale factor of two preserves screenshots at the configured physical window
// dimensions while Chromium lays the shell out at the 200% effective viewport.
const windows = {
  default: {
    physical: { width: windowConfig.width, height: windowConfig.height },
    cssViewport: { width: windowConfig.width / 2, height: windowConfig.height / 2 }
  },
  minimum: {
    physical: { width: windowConfig.minWidth, height: windowConfig.minHeight },
    cssViewport: { width: windowConfig.minWidth / 2, height: windowConfig.minHeight / 2 }
  }
};
const hallmarkResponsiveWidths = [320, 375, 414, 768];

const browserStoryUrl = (baseUrl) => {
  const url = new URL('browser-story.html', baseUrl);
  url.searchParams.set('welcome', '1');
  return url.href;
};

const waitForReady = async (page) => {
  await page.waitForFunction(
    () => {
      const evidence = window.__WAVENAV_STORY_EVIDENCE__?.collect();
      return (
        document.body.dataset.bootPhase === 'deck-ready' &&
        evidence?.session?.navigationStatus === 'loaded'
      );
    },
    null,
    { timeout: 10_000 }
  );
};

const openAllDisclosures = async (page) => {
  await page.evaluate(() => {
    for (const details of document.querySelectorAll('details')) {
      details.open = true;
    }
  });
};

const activateDeveloperToolsTab = async (page, tabId) => {
  await page.locator(`#devtools-tab-${tabId}`).evaluate((tab) => tab.click());
};

const assertDeveloperToolsPanelContainment = async (
  page,
  name,
  { requireVerticalScroll = false } = {}
) => {
  const originalTimeline = requireVerticalScroll
    ? await page.locator('#timeline').evaluate((timeline) => {
        const original = timeline.textContent ?? '';
        timeline.textContent = `${original}\n${Array.from(
          { length: 48 },
          (_, index) => `scroll-verification-${index + 1}`
        ).join('\n')}`;
        return original;
      })
    : null;
  const evidence = [];
  for (const tabId of ['overview', 'transport', 'runtime', 'inspector', 'timeline', 'source']) {
    await activateDeveloperToolsTab(page, tabId);
    const metrics = await page.locator(`#devtools-panel-${tabId}`).evaluate((panel) => {
      const panelRect = panel.getBoundingClientRect();
      const workspaceRect = document
        .querySelector('.developer-tools-workspace')
        .getBoundingClientRect();
      const actions = [...panel.querySelectorAll('.developer-tools-action')].map((action) => {
        const rect = action.getBoundingClientRect();
        return { id: action.id, left: rect.left, right: rect.right };
      });
      const preformatted = [...panel.querySelectorAll('pre')].map((element) => ({
        id: element.id,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth
      }));
      const wideDescendants = [...panel.querySelectorAll('*')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            selector: element.id ? `#${element.id}` : `${element.tagName}.${element.className}`,
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            left: rect.left,
            right: rect.right,
            overflowX: style.overflowX,
            whiteSpace: style.whiteSpace
          };
        })
        .filter(
          (element) =>
            element.scrollWidth > element.clientWidth + 1 ||
            element.left < panelRect.left - 0.5 ||
            element.right > panelRect.right + 0.5
        );
      const initialScrollTop = panel.scrollTop;
      panel.scrollTop = panel.scrollHeight;
      const maximumScrollTop = panel.scrollTop;
      panel.scrollTop = initialScrollTop;
      return {
        id: panel.id,
        clientWidth: panel.clientWidth,
        scrollWidth: panel.scrollWidth,
        clientHeight: panel.clientHeight,
        scrollHeight: panel.scrollHeight,
        maximumScrollTop,
        actions,
        preformatted,
        wideDescendants,
        workspace: { left: workspaceRect.left, right: workspaceRect.right }
      };
    });

    assert.ok(
      metrics.scrollWidth <= metrics.clientWidth + 1,
      `${name}: ${metrics.id} contains horizontal overflow (${metrics.scrollWidth}px scroll / ${metrics.clientWidth}px client): ${JSON.stringify(metrics.wideDescendants)}`
    );
    assert.ok(
      metrics.clientHeight >= 96,
      `${name}: ${metrics.id} keeps a usable viewport height (${metrics.clientHeight}px)`
    );
    for (const action of metrics.actions) {
      assert.ok(
        action.left >= metrics.workspace.left - 0.5 &&
          action.right <= metrics.workspace.right + 0.5,
        `${name}: #${action.id} stays inside the Developer Tools workspace`
      );
    }
    for (const element of metrics.preformatted) {
      assert.ok(
        element.scrollWidth <= element.clientWidth + 1,
        `${name}: #${element.id} wraps diagnostic content without horizontal scrolling`
      );
    }
    if (metrics.scrollHeight > metrics.clientHeight + 1) {
      assert.ok(metrics.maximumScrollTop > 0, `${name}: ${metrics.id} scrolls vertically`);
    }
    evidence.push(metrics);
  }
  if (requireVerticalScroll) {
    assert.ok(
      evidence.some((panel) => panel.maximumScrollTop > 0),
      `${name}: at least one populated Developer Tools panel exercises vertical scrolling: ${JSON.stringify(
        evidence.map((panel) => ({
          id: panel.id,
          clientHeight: panel.clientHeight,
          scrollHeight: panel.scrollHeight,
          maximumScrollTop: panel.maximumScrollTop
        }))
      )}`
    );
    await page.locator('#timeline').evaluate((timeline, original) => {
      timeline.textContent = original;
    }, originalTimeline);
  }
  return evidence;
};

const assertDeveloperToolsCommandFeedback = async (page, name) => {
  const activity = page.locator('#developer-tools-host-status');

  await page.locator('#btn-health').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#developer-tools-host-status')?.textContent?.startsWith('Health:'),
    null,
    { timeout: 5_000 }
  );
  const health = (await activity.textContent())?.trim() ?? '';
  assert.match(health, /^Health: .+/, `${name}: Health reports its host result inside DevTools`);

  await page.locator('#btn-render').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#developer-tools-host-status')?.textContent ===
      'Rendered current card.',
    null,
    { timeout: 5_000 }
  );
  const render = (await activity.textContent())?.trim() ?? '';
  assert.equal(
    render,
    'Rendered current card.',
    `${name}: Render confirms completion inside DevTools`
  );
  assert.notEqual(
    (await page.locator('#snapshot').textContent())?.trim(),
    '',
    `${name}: Render refreshes the runtime snapshot`
  );

  return { health, render };
};

const assertStatusRegionsDoNotOverlap = async (page, name) => {
  const statusLayout = await page.evaluate(() => {
    const readRegion = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        selector: element.id ? `#${element.id}` : `.${element.classList[0]}`,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0,
        overflowX: style.overflowX
      };
    };
    return {
      bar: readRegion(document.querySelector('.status-bar')),
      top: [...document.querySelectorAll('.status-primary, .status-controls')].map(readRegion),
      context: [...document.querySelectorAll('.status-context > .status-readout')].map(readRegion)
    };
  });
  assert.ok(statusLayout.bar.top >= 0, `${name}: status bar starts inside the viewport`);
  assert.ok(
    statusLayout.bar.bottom <= (await page.evaluate(() => innerHeight)) + 0.5,
    `${name}: complete status bar remains inside the viewport`
  );
  const overlaps = [];
  for (const regions of [statusLayout.top, statusLayout.context]) {
    const visibleRegions = regions.filter((region) => region.visible);
    for (let index = 0; index < visibleRegions.length; index += 1) {
      for (
        let candidateIndex = index + 1;
        candidateIndex < visibleRegions.length;
        candidateIndex += 1
      ) {
        const first = visibleRegions[index];
        const second = visibleRegions[candidateIndex];
        const horizontalOverlap =
          first.left < second.right - 0.5 && second.left < first.right - 0.5;
        const verticalOverlap = first.top < second.bottom - 0.5 && second.top < first.bottom - 0.5;
        if (horizontalOverlap && verticalOverlap) {
          overlaps.push(`${first.selector}/${second.selector}`);
        }
      }
    }
  }
  assert.deepEqual(overlaps, [], `${name}: status regions do not overlap`);
  for (const region of statusLayout.context.filter((entry) => entry.visible)) {
    assert.equal(region.overflowX, 'hidden', `${name}: ${region.selector} contains long values`);
  }
};

const captureDefaultVisual = async (page, name, dimensions) => {
  const layout = await page.evaluate(() => ({
    cssViewport: { width: innerWidth, height: innerHeight },
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth
  }));
  assert.equal(layout.horizontalOverflow, false, `${name}: 100% visual has no horizontal overflow`);
  await assertStatusRegionsDoNotOverlap(page, `${name}: 100% visual`);
  const screenshot = `${name}-window-100-percent.png`;
  await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: false });
  await page.locator('#btn-welcome-toggle').click();
  await assertStatusRegionsDoNotOverlap(page, `${name}: handset visual`);
  const handsetScreenshot = `${name}-handset-window-100-percent.png`;
  await page.screenshot({ path: path.join(outputDir, handsetScreenshot), fullPage: false });
  await page.locator('#btn-inspector').click();
  await openAllDisclosures(page);
  const developerToolsCommandFeedback =
    name === 'default'
      ? await assertDeveloperToolsCommandFeedback(page, `${name}: developer tools commands`)
      : null;
  const developerToolsPanels = await assertDeveloperToolsPanelContainment(
    page,
    `${name}: developer tools visual`,
    { requireVerticalScroll: name === 'minimum' }
  );
  await activateDeveloperToolsTab(page, 'overview');
  await page.evaluate(() => {
    document.querySelector('.developer-tools-panel:not([hidden])')?.scrollTo(0, 0);
  });
  await assertStatusRegionsDoNotOverlap(page, `${name}: developer tools visual`);
  const developerToolsScreenshot = `${name}-developer-tools-window-100-percent.png`;
  await page.screenshot({ path: path.join(outputDir, developerToolsScreenshot), fullPage: false });
  return {
    physicalWindow: dimensions.physical,
    cssViewportAt100Percent: layout.cssViewport,
    scrollWidth: layout.scrollWidth,
    screenshot,
    handsetScreenshot,
    developerToolsScreenshot,
    developerToolsCommandFeedback,
    developerToolsPanels
  };
};

const captureResponsiveVisual = async (page, width) => {
  const layout = await page.evaluate(() => {
    const clickableText = [...document.querySelectorAll('button, summary, .btn')]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0;
      })
      .map((element) => {
        const style = getComputedStyle(element);
        return {
          id: element.id,
          text: element.textContent?.trim() ?? '',
          whiteSpace: style.whiteSpace,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth
        };
      });
    const handsetControls = [...document.querySelectorAll('.softkey-row .btn')].map((element) => {
      const rect = element.getBoundingClientRect();
      return { id: element.id, left: rect.left, right: rect.right };
    });
    return {
      cssViewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      clickableText,
      handsetControls
    };
  });
  assert.equal(layout.horizontalOverflow, false, `${width}px: no horizontal overflow`);
  await assertStatusRegionsDoNotOverlap(page, `${width}px`);
  for (const action of layout.clickableText) {
    assert.equal(
      action.whiteSpace,
      'nowrap',
      `${width}px: ${action.id || action.text} stays on one line`
    );
    assert.ok(
      action.scrollWidth <= action.clientWidth,
      `${width}px: ${action.id || action.text} label is not clipped`
    );
  }
  for (const control of layout.handsetControls) {
    assert.ok(control.left >= 0, `${width}px: #${control.id} is not clipped left`);
    assert.ok(control.right <= width, `${width}px: #${control.id} is not clipped right`);
  }
  const screenshot = `responsive-${width}px.png`;
  await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: false });
  return { ...layout, screenshot };
};

const auditDetachedDeveloperTools = async (page, width) => {
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () =>
    (await window.axe.run(document)).violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target.join(' '))
    }))
  );
  assert.deepEqual(violations, [], `${width}px detached developer tools: rendered axe audit`);

  const panels = await assertDeveloperToolsPanelContainment(
    page,
    `${width}px detached developer tools`
  );
  await activateDeveloperToolsTab(page, 'overview');

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth
  }));
  assert.equal(
    layout.horizontalOverflow,
    false,
    `${width}px detached developer tools: no horizontal overflow`
  );
  const screenshot = `developer-tools-${width}px.png`;
  await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: false });
  return { width, ...layout, panels, screenshot };
};

const resolveBaseRevision = async () => {
  if (requestedBaseRevision) {
    assert.match(
      requestedBaseRevision,
      /^[0-9a-f]{40}$/,
      'WAVES_ACCESSIBILITY_BASE_REVISION must be a full Git commit SHA'
    );
    return requestedBaseRevision;
  }
  const { stdout } = await execFileAsync('git', ['merge-base', 'HEAD', 'origin/main'], {
    cwd: REPO_ROOT
  });
  return stdout.trim();
};

const auditRenderedPage = async (page, name, windowEvidence) => {
  await page.addScriptTag({ content: axe.source });
  const axeResults = await page.evaluate(async () => window.axe.run(document));
  const violations = axeResults.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target.join(' '))
  }));
  assert.deepEqual(violations, [], `${name}: rendered axe audit`);

  const layout = await page.evaluate(() => {
    const actionableSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
    const actions = [...document.querySelectorAll(actionableSelector)]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          element.getAttribute('aria-hidden') !== 'true' &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          id: element.id,
          tag: element.tagName.toLowerCase(),
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100
        };
      });
    const liveChannels = [
      ...document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
    ].map((element) => ({
      id: element.id,
      role: element.getAttribute('role'),
      ariaLive: element.getAttribute('aria-live')
    }));
    const shell = document.querySelector('.browser-shell');
    const viewport = document.querySelector('#viewport');
    const rootStyle = getComputedStyle(document.documentElement);
    const resolveColor = (propertyName) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${propertyName})`;
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    return {
      cssViewport: { width: innerWidth, height: innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth
      },
      actions,
      liveChannels,
      presentation: {
        nativeHost: shell?.getAttribute('data-host-presentation') ?? null,
        legacyHostClassCount: document.querySelectorAll(
          '.wv-shell-window, .card-header, .wv95-btn, .form-95'
        ).length,
        hostFontFamily: getComputedStyle(document.body).fontFamily,
        lcdFontFamily: viewport ? getComputedStyle(viewport).fontFamily : null,
        lcdBackground: viewport ? getComputedStyle(viewport).backgroundColor : null,
        lcdForeground: viewport ? getComputedStyle(viewport).color : null,
        focusedWmlBackground: resolveColor('--lcd-focus-bg'),
        focusedWmlForeground: resolveColor('--lcd-focus-fg'),
        canvasSurfaceCount: document.querySelectorAll('#viewport > canvas.viewport-canvas').length,
        legacyWmlDomCount: document.querySelectorAll('#viewport .line, #viewport .wml-segment')
          .length,
        focusRingColor: rootStyle.getPropertyValue('--focus-ring-color').trim(),
        focusRingOuterColor: rootStyle.getPropertyValue('--focus-ring-outer-color').trim(),
        runningAnimationCount: document.getAnimations().length
      }
    };
  });

  assert.equal(layout.document.horizontalOverflow, false, `${name}: no horizontal overflow`);
  assert.deepEqual(
    layout.liveChannels,
    [{ id: 'live-announcer', role: 'status', ariaLive: 'polite' }],
    `${name}: one accessible live-announcement channel`
  );
  assert.equal(layout.presentation.nativeHost, 'native', `${name}: native host presentation`);
  assert.equal(
    layout.presentation.legacyHostClassCount,
    0,
    `${name}: no legacy faux-window or Win95 control classes`
  );
  assert.match(
    layout.presentation.hostFontFamily,
    /-apple-system|BlinkMacSystemFont|Segoe UI|Helvetica|Arial/,
    `${name}: system host font stack`
  );
  assert.match(
    layout.presentation.lcdFontFamily ?? '',
    /Courier New/,
    `${name}: period LCD font remains scoped to the viewport`
  );
  assert.equal(layout.presentation.canvasSurfaceCount, 1, `${name}: one Canvas2D WML surface`);
  assert.equal(
    layout.presentation.legacyWmlDomCount,
    0,
    `${name}: no legacy WML line injection remains`
  );
  assert.equal(
    layout.presentation.focusedWmlBackground,
    layout.presentation.lcdForeground,
    `${name}: focused WML background inverts the LCD foreground`
  );
  assert.equal(
    layout.presentation.focusedWmlForeground,
    layout.presentation.lcdBackground,
    `${name}: focused WML foreground inverts the LCD background`
  );
  assert.equal(
    layout.presentation.runningAnimationCount,
    0,
    `${name}: default shell has no runtime animation`
  );
  assert.ok(layout.actions.length > 10, `${name}: rendered host controls discovered`);
  for (const action of layout.actions) {
    assert.ok(action.width >= 24, `${name}: ${action.tag}#${action.id} target width >= 24px`);
    assert.ok(action.height >= 24, `${name}: ${action.tag}#${action.id} target height >= 24px`);
    assert.ok(action.left >= 0, `${name}: ${action.tag}#${action.id} not clipped left`);
    assert.ok(
      action.right <= layout.cssViewport.width,
      `${name}: ${action.tag}#${action.id} not clipped right`
    );
  }

  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  const focusEvidence = [];
  for (let index = 0; index < 50; index += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || !element.id) {
        return null;
      }
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
      const style = getComputedStyle(element);
      return {
        id: element.id,
        focusVisible: element.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        outlineColor: style.outlineColor,
        outlineOffset: Number.parseFloat(style.outlineOffset),
        boxShadow: style.boxShadow
      };
    });
    if (!focused || focusEvidence.some((entry) => entry.id === focused.id)) {
      break;
    }
    assert.equal(focused.focusVisible, true, `${name}: #${focused.id} matches :focus-visible`);
    assert.notEqual(focused.outlineStyle, 'none', `${name}: #${focused.id} has an outline`);
    assert.ok(focused.outlineWidth >= 2, `${name}: #${focused.id} outline is at least 2px`);
    focusEvidence.push(focused);
  }
  assert.ok(focusEvidence.length > 10, `${name}: keyboard focus evidence covers host controls`);

  await page.locator('#btn-reload').focus();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector('.utility-rail-body')?.scrollTo(0, 0);
    document.querySelector('.developer-tools-panel:not([hidden])')?.scrollTo(0, 0);
  });
  const screenshot = `${name}-window-200-percent.png`;
  await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: false });

  return {
    physicalWindow: windowEvidence.physical,
    cssViewportAt200Percent: windowEvidence.cssViewport,
    layout,
    focusEvidence,
    axe: {
      violations: [],
      colorContrastPassNodes:
        axeResults.passes.find((result) => result.id === 'color-contrast')?.nodes.length ?? 0,
      targetSizePassNodes:
        axeResults.passes.find((result) => result.id === 'target-size')?.nodes.length ?? 0
    },
    screenshot
  };
};

await mkdir(outputDir, { recursive: true });
const failureArtifacts = {};
let previewServer;
let browser;
try {
  await build({
    root: FRONTEND_DIR,
    configFile: path.join(FRONTEND_DIR, 'vite.config.ts'),
    build: {
      outDir: tempRoot,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          story: path.join(FRONTEND_DIR, 'browser-story.html'),
          devtools: path.join(FRONTEND_DIR, 'devtools.html')
        }
      }
    }
  });
  previewServer = await preview({
    root: FRONTEND_DIR,
    configFile: path.join(FRONTEND_DIR, 'vite.config.ts'),
    build: { outDir: tempRoot },
    preview: { host: '127.0.0.1', port: 0, strictPort: false }
  });
  const baseUrl = previewServer.resolvedUrls?.local[0];
  if (!baseUrl) {
    throw new Error('Vite preview did not expose a local URL');
  }

  browser = await chromium.launch({ headless: true });
  const responsiveEvidence = {};
  for (const width of hallmarkResponsiveWidths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    try {
      await page.goto(browserStoryUrl(baseUrl), {
        waitUntil: 'domcontentloaded'
      });
      await waitForReady(page);
      responsiveEvidence[width] = await captureResponsiveVisual(page, width);
    } finally {
      await context.close();
    }
  }

  const developerToolsEvidence = {};
  for (const width of [320, 720, 960]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 320 ? 720 : 640 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    try {
      await page.goto(new URL('devtools.html', baseUrl).href, { waitUntil: 'domcontentloaded' });
      await page.locator('#developer-tools-workspace').waitFor();
      developerToolsEvidence[width] = await auditDetachedDeveloperTools(page, width);
    } finally {
      await context.close();
    }
  }

  const visualEvidenceAt100Percent = {};
  for (const [name, dimensions] of Object.entries(windows)) {
    const context = await browser.newContext({
      viewport: dimensions.physical,
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    try {
      await page.goto(browserStoryUrl(baseUrl), {
        waitUntil: 'domcontentloaded'
      });
      await waitForReady(page);
      visualEvidenceAt100Percent[name] = await captureDefaultVisual(page, name, dimensions);
    } finally {
      await context.close();
    }
  }

  const windowEvidence = {};
  for (const [name, dimensions] of Object.entries(windows)) {
    const context = await browser.newContext({
      viewport: dimensions.cssViewport,
      deviceScaleFactor: 2,
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    let tracing = false;
    try {
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
      tracing = true;
      await page.goto(browserStoryUrl(baseUrl), {
        waitUntil: 'domcontentloaded'
      });
      await waitForReady(page);
      await openAllDisclosures(page);
      windowEvidence[name] = await auditRenderedPage(page, name, dimensions);
      await context.tracing.stop();
      tracing = false;
    } catch (error) {
      const screenshot = `${name}-failure.png`;
      const trace = `${name}-trace.zip`;
      const screenshotSaved = await page
        .screenshot({ path: path.join(outputDir, screenshot), fullPage: true })
        .then(() => true)
        .catch(() => false);
      const traceSaved = tracing
        ? await context.tracing
            .stop({ path: path.join(outputDir, trace) })
            .then(() => true)
            .catch(() => false)
        : false;
      tracing = false;
      failureArtifacts[name] = {
        screenshot: screenshotSaved ? screenshot : null,
        trace: traceSaved ? trace : null
      };
      throw error;
    } finally {
      if (tracing) {
        await context.tracing.stop().catch(() => undefined);
      }
      await context.close();
    }
  }

  const [baseRevision, browserVersion] = await Promise.all([
    resolveBaseRevision(),
    browser.version()
  ]);
  const result = {
    schemaVersion: 1,
    workItem: 'WBP-05A',
    capturedAt: new Date().toISOString(),
    baseRevision,
    sourceState: 'feature working tree including WBP-05A changes',
    path: 'production-built Waves browser-story entry with real WaveNav WASM and deterministic local fixture fetch',
    zoomModel:
      '200% browser zoom modeled as half-sized CSS viewport with deviceScaleFactor 2 at each configured physical window size',
    environment: {
      platform: os.platform(),
      release: os.release(),
      architecture: os.arch(),
      node: process.version,
      chromium: browserVersion,
      headless: true,
      reducedMotion: true
    },
    responsiveEvidence,
    developerToolsEvidence,
    visualEvidenceAt100Percent,
    windowEvidence
  };
  const resultPath = path.join(outputDir, 'rendered-accessibility.json');
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log('PASS WBP-05A rendered accessibility at default and minimum windows');
  console.log(`RESULT ${resultPath}`);
} catch (error) {
  const failurePath = path.join(outputDir, 'rendered-accessibility-failure.json');
  const failure = {
    schemaVersion: 1,
    workItem: 'WBP-05A',
    capturedAt: new Date().toISOString(),
    error: {
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error)
    },
    artifacts: failureArtifacts
  };
  await writeFile(failurePath, `${JSON.stringify(failure, null, 2)}\n`);
  console.error(`FAILURE EVIDENCE ${failurePath}`);
  throw error;
} finally {
  await browser?.close();
  await previewServer?.close();
  await rm(tempRoot, { recursive: true, force: true });
}
