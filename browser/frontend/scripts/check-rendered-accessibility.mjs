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

const captureDefaultVisual = async (page, name, dimensions) => {
  const layout = await page.evaluate(() => ({
    cssViewport: { width: innerWidth, height: innerHeight },
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth
  }));
  assert.equal(layout.horizontalOverflow, false, `${name}: 100% visual has no horizontal overflow`);
  const screenshot = `${name}-window-100-percent.png`;
  await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: false });
  return {
    physicalWindow: dimensions.physical,
    cssViewportAt100Percent: layout.cssViewport,
    scrollWidth: layout.scrollWidth,
    screenshot
  };
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
    const focusedWmlItem = document.querySelector('.wml-segment-link.is-focused');
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
        focusedWmlBackground: focusedWmlItem
          ? getComputedStyle(focusedWmlItem).backgroundColor
          : null,
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
  assert.equal(
    layout.presentation.focusedWmlBackground,
    'rgb(28, 43, 28)',
    `${name}: inverse-video WML focus remains visible`
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
    assert.match(
      focused.boxShadow,
      /rgb\(255, 255, 255\)/,
      `${name}: #${focused.id} focus ring has light separation`
    );
    assert.match(
      focused.boxShadow,
      /rgb\(11, 87, 208\)/,
      `${name}: #${focused.id} focus ring has a high-contrast outer edge`
    );
    focusEvidence.push(focused);
  }
  assert.ok(focusEvidence.length > 10, `${name}: keyboard focus evidence covers host controls`);

  await page.locator('#btn-reload').focus();
  await page.evaluate(() => window.scrollTo(0, 0));
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
      rollupOptions: { input: path.join(FRONTEND_DIR, 'browser-story.html') }
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
  const visualEvidenceAt100Percent = {};
  for (const [name, dimensions] of Object.entries(windows)) {
    const context = await browser.newContext({
      viewport: dimensions.physical,
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    try {
      await page.goto(new URL('browser-story.html', baseUrl).href, {
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
      await page.goto(new URL('browser-story.html', baseUrl).href, {
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
