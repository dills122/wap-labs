import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { startVitePreview } from './vite-preview-harness.mjs';
import {
  WAVES_BASELINE_DEFAULT_RUNS,
  WAVES_BASELINE_MAX_RUNS,
  WAVES_BASELINE_MIN_RUNS
} from './waves-baseline-run-policy.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const HOST_SAMPLE_DIR = path.resolve(SCRIPT_DIR, '..');
const REPO_ROOT = path.resolve(HOST_SAMPLE_DIR, '..', '..');
const BROWSER_FRONTEND_DIR = path.join(REPO_ROOT, 'browser', 'frontend');
const TAURI_CONFIG_PATH = path.join(REPO_ROOT, 'browser', 'src-tauri', 'tauri.conf.json');
const DEFAULT_OUTPUT_DIR = path.join(HOST_SAMPLE_DIR, 'test-results', 'waves-baseline');
const RUNS = Number.parseInt(
  process.env.WAVES_BASELINE_RUNS ?? String(WAVES_BASELINE_DEFAULT_RUNS),
  10
);

if (!Number.isInteger(RUNS) || RUNS < WAVES_BASELINE_MIN_RUNS || RUNS > WAVES_BASELINE_MAX_RUNS) {
  throw new Error(
    `WAVES_BASELINE_RUNS must be an integer from ${WAVES_BASELINE_MIN_RUNS} through ${WAVES_BASELINE_MAX_RUNS}`
  );
}

const requestedOutputDir = process.env.WAVES_BASELINE_OUTPUT_DIR;
const outputDir = requestedOutputDir
  ? path.isAbsolute(requestedOutputDir)
    ? requestedOutputDir
    : path.resolve(REPO_ROOT, requestedOutputDir)
  : DEFAULT_OUTPUT_DIR;
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-baseline-build-'));
const tauriConfig = JSON.parse(await readFile(TAURI_CONFIG_PATH, 'utf8'));
const windowConfig = tauriConfig.app.windows[0];
const viewports = {
  default: { width: windowConfig.width, height: windowConfig.height },
  minimum: { width: windowConfig.minWidth, height: windowConfig.minHeight }
};

const round = (value) => Math.round(value * 100) / 100;

const summarize = (samples) => {
  const sorted = [...samples].sort((left, right) => left - right);
  const percentile = (fraction) => sorted[Math.ceil(sorted.length * fraction) - 1];
  return {
    unit: 'ms',
    runs: sorted.length,
    min: round(sorted[0]),
    p50: round(percentile(0.5)),
    p95: round(percentile(0.95)),
    max: round(sorted.at(-1)),
    samples: samples.map(round)
  };
};

const waitForReady = async (page) => {
  await page.waitForFunction(
    () => {
      const evidence = window.__WAVENAV_STORY_EVIDENCE__?.collect();
      return (
        document.body.dataset.bootPhase === 'deck-ready' &&
        Boolean(evidence?.activeExampleKey) &&
        evidence.session?.navigationStatus === 'loaded'
      );
    },
    null,
    { timeout: 10_000 }
  );
};

const loadExample = async (page, exampleKey) => {
  await page.locator('#local-example').selectOption(exampleKey);
  await page.waitForFunction((key) => {
    const evidence = window.__WAVENAV_STORY_EVIDENCE__?.collect();
    return (
      evidence?.activeExampleKey === key &&
      evidence.snapshot?.baseUrl === `http://local.test/examples/${key}.wml` &&
      evidence.session?.navigationStatus === 'loaded'
    );
  }, exampleKey);
};

const auditLayout = async (page, expectedRailOpen) => {
  const audit = await page.evaluate(() => {
    const selectors = [
      '.browser-shell',
      '.nav-toolbar',
      '.handset-stage',
      '.utility-rail',
      '.developer-drawer-section',
      '#viewport',
      '.softkey-row'
    ];
    const landmarks = Object.fromEntries(
      selectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) {
          return [selector, null];
        }
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return [
          selector,
          {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            display: style.display,
            visibility: style.visibility
          }
        ];
      })
    );
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth
      },
      railOpen: document.querySelector('#utility-rail-panel')?.hasAttribute('open') ?? false,
      landmarks
    };
  });

  assert.equal(audit.document.horizontalOverflow, false, 'shell must not overflow horizontally');
  assert.equal(audit.railOpen, expectedRailOpen, 'utility rail initial disclosure state');
  for (const [selector, landmark] of Object.entries(audit.landmarks)) {
    assert.ok(landmark, `${selector} must exist`);
    assert.ok(landmark.width > 0 && landmark.height > 0, `${selector} must have a usable box`);
    assert.ok(landmark.left >= 0, `${selector} must not clip the left edge`);
    assert.ok(landmark.right <= audit.viewport.width, `${selector} must not clip the right edge`);
    assert.notEqual(landmark.display, 'none', `${selector} must be displayed`);
    assert.notEqual(landmark.visibility, 'hidden', `${selector} must be visible`);
  }
  assert.ok(
    audit.landmarks['.softkey-row'].bottom <= audit.viewport.height,
    'existing handset input controls must fit in the initial window viewport'
  );
  return audit;
};

const collectTabOrder = async (page) => {
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  const order = [];
  for (let index = 0; index < 40; index += 1) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => document.activeElement?.id ?? '');
    if (!id || (order.length > 0 && id === order[0])) {
      break;
    }
    order.push(id);
  }
  return order;
};

const ensureDisclosureOpenWithKeyboard = async (page, summarySelector, detailsSelector) => {
  const details = page.locator(detailsSelector);
  await page.locator(summarySelector).focus();
  if ((await details.getAttribute('open')) !== null) {
    await page.keyboard.press('Enter');
    assert.equal(
      await details.getAttribute('open'),
      null,
      `${detailsSelector} must close from Enter`
    );
  }
  await page.keyboard.press('Enter');
  assert.notEqual(
    await details.getAttribute('open'),
    null,
    `${detailsSelector} must open from Enter`
  );
};

const EXPECTED_LOCAL_TAB_ORDER = [
  'btn-reload',
  'run-mode',
  'local-example',
  'btn-load-local',
  'viewport',
  'btn-up',
  'btn-enter',
  'btn-down',
  'utility-rail-toggle',
  'welcome-help-toggle',
  'btn-start-tour',
  'btn-try-local-examples',
  'btn-connect-network',
  'viewport-cols',
  'handset-scale-select',
  'local-example-notes-toggle',
  'dev-drawer-toggle',
  'btn-health',
  'btn-render',
  'btn-snapshot',
  'btn-clear-intent',
  'btn-export-timeline',
  'btn-clear-timeline',
  'debug-raw-mode-toggle',
  'base-url',
  'wml-input',
  'btn-load-context',
  'timeline'
];

const auditKeyboard = async (page) => {
  await loadExample(page, 'basic');
  await ensureDisclosureOpenWithKeyboard(page, '#utility-rail-toggle', '#utility-rail-panel');
  await ensureDisclosureOpenWithKeyboard(page, '#welcome-help-toggle', '#welcome-help-panel');
  await ensureDisclosureOpenWithKeyboard(
    page,
    '#local-example-notes-toggle',
    '#local-example-notes'
  );
  await ensureDisclosureOpenWithKeyboard(page, '#dev-drawer-toggle', '#dev-drawer');
  await ensureDisclosureOpenWithKeyboard(page, '#debug-raw-mode-toggle', '#debug-raw-mode');

  const initialOrder = await collectTabOrder(page);
  assert.deepEqual(
    initialOrder,
    EXPECTED_LOCAL_TAB_ORDER,
    'local-mode shell tab order must be stable'
  );

  await page.locator('#viewport').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => window.__WAVENAV_STORY_EVIDENCE__?.collect().snapshot?.activeCardId === 'next'
  );
  assert.equal(
    await page.locator('#btn-back').isEnabled(),
    true,
    'Back enables after card navigation'
  );
  const backEnabledOrder = await collectTabOrder(page);
  assert.deepEqual(
    backEnabledOrder,
    ['btn-back', ...EXPECTED_LOCAL_TAB_ORDER],
    'enabled Back must enter the first toolbar tab stop'
  );

  await page.locator('#btn-back').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => window.__WAVENAV_STORY_EVIDENCE__?.collect().snapshot?.activeCardId === 'home'
  );

  await page.locator('#btn-reload').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => window.__WAVENAV_STORY_EVIDENCE__?.collect().session?.navigationStatus === 'loaded'
  );

  await page.locator('#btn-health').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() =>
    window.__WAVENAV_STORY_EVIDENCE__
      ?.collect()
      .status.includes('Health: waves-browser-test-host:ok')
  );

  return {
    initialOrder,
    backEnabledOrder,
    activated: [
      'utility rail',
      'welcome/help',
      'example notes',
      'developer drawer',
      'raw WML drawer',
      'Back',
      'Reload',
      'Health'
    ]
  };
};

const measureStartup = async (browser, baseUrl) => {
  const samples = [];
  for (let index = 0; index < RUNS; index += 1) {
    const context = await browser.newContext({ viewport: viewports.default });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForReady(page);
    samples.push(await page.evaluate(() => performance.now()));
    await context.close();
  }
  return summarize(samples);
};

const measureNavigationAndInput = async (browser, baseUrl) => {
  const context = await browser.newContext({ viewport: viewports.default });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForReady(page);

  const navigationSamples = [];
  for (let index = 0; index < RUNS; index += 1) {
    const exampleKey = index % 2 === 0 ? 'historyBackStack' : 'basic';
    navigationSamples.push(
      await page.evaluate(async (key) => {
        const select = document.querySelector('#local-example');
        if (!(select instanceof HTMLSelectElement)) {
          throw new Error('local example control is unavailable');
        }
        if (![...select.options].some((option) => option.value === key)) {
          throw new Error(`missing baseline example: ${key}`);
        }
        select.value = key;
        const startedAt = performance.now();
        select.dispatchEvent(new Event('change', { bubbles: true }));
        const expectedBaseUrl = `http://local.test/examples/${key}.wml`;
        return new Promise((resolve, reject) => {
          const timeout = window.setTimeout(
            () => reject(new Error(`navigation timeout: ${key}`)),
            5000
          );
          const check = () => {
            const evidence = window.__WAVENAV_STORY_EVIDENCE__?.collect();
            if (
              evidence?.activeExampleKey === key &&
              evidence.snapshot?.baseUrl === expectedBaseUrl &&
              evidence.session?.navigationStatus === 'loaded'
            ) {
              window.clearTimeout(timeout);
              resolve(performance.now() - startedAt);
              return;
            }
            requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        });
      }, exampleKey)
    );
  }

  await loadExample(page, 'basic');

  const inputRenderSamples = [];
  for (let index = 0; index < RUNS; index += 1) {
    const key = index % 2 === 0 ? 'ArrowDown' : 'ArrowUp';
    const expectedFocus = index % 2 === 0 ? 1 : 0;
    inputRenderSamples.push(
      await page.evaluate(
        async ({ keyboardKey, focusIndex }) => {
          const startedAt = performance.now();
          window.dispatchEvent(
            new KeyboardEvent('keydown', { key: keyboardKey, bubbles: true, cancelable: true })
          );
          return new Promise((resolve, reject) => {
            const timeout = window.setTimeout(
              () => reject(new Error(`input/render timeout: ${keyboardKey}`)),
              5000
            );
            const check = () => {
              const evidence = window.__WAVENAV_STORY_EVIDENCE__?.collect();
              const focusedSegment = document.querySelector('.wml-segment-link.is-focused');
              if (evidence?.snapshot?.focusedLinkIndex === focusIndex && focusedSegment) {
                window.clearTimeout(timeout);
                resolve(performance.now() - startedAt);
                return;
              }
              requestAnimationFrame(check);
            };
            requestAnimationFrame(check);
          });
        },
        { keyboardKey: key, focusIndex: expectedFocus }
      )
    );
  }

  await context.close();
  return {
    navigation: summarize(navigationSamples),
    inputRender: summarize(inputRenderSamples)
  };
};

const captureWindowEvidence = async (browser, baseUrl, name, viewport, expectedRailOpen) => {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForReady(page);
  const layout = await auditLayout(page, expectedRailOpen);
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: false });
  const keyboard = await auditKeyboard(page);
  await context.close();
  return { layout, keyboard, screenshot: `${name}.png` };
};

await mkdir(outputDir, { recursive: true });
const preview = await startVitePreview({
  root: BROWSER_FRONTEND_DIR,
  configFile: path.join(BROWSER_FRONTEND_DIR, 'vite.config.ts'),
  entry: path.join(BROWSER_FRONTEND_DIR, 'browser-story.html'),
  outDir: path.join(tempRoot, 'waves-browser')
});

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const startup = await measureStartup(browser, preview.baseUrl);
  const actionMeasurements = await measureNavigationAndInput(browser, preview.baseUrl);
  const windowEvidence = {
    default: await captureWindowEvidence(
      browser,
      preview.baseUrl,
      'default-window-1024x768',
      viewports.default,
      true
    ),
    minimum: await captureWindowEvidence(
      browser,
      preview.baseUrl,
      'minimum-window-880x640',
      viewports.minimum,
      false
    )
  };
  const [{ stdout: revision }, browserVersion] = await Promise.all([
    execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT }),
    browser.version()
  ]);
  const cpus = os.cpus();
  const result = {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    baseRevision: revision.trim(),
    sourceState: 'working tree including the WBP-00/WBP-01 branch changes',
    path: 'production-built Waves browser-story entry with real WaveNav WASM and deterministic local fixture fetch',
    environment: {
      platform: os.platform(),
      release: os.release(),
      architecture: os.arch(),
      cpu: cpus[0]?.model ?? 'unknown',
      logicalCpus: cpus.length,
      memoryBytes: os.totalmem(),
      node: process.version,
      chromium: browserVersion,
      headless: true
    },
    configuredWindows: viewports,
    referenceViewport: { logicalColumns: 20 },
    measurements: {
      startupToDeckReady: startup,
      localNavigationToRenderedDeck: actionMeasurements.navigation,
      keyboardInputToFocusedRender: actionMeasurements.inputRender
    },
    windowEvidence
  };
  const resultPath = path.join(outputDir, 'baseline.json');
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`PASS Waves baseline (${RUNS} runs per latency metric)`);
  console.log(`RESULT ${resultPath}`);
  console.log(
    `p50/p95 ms: startup ${startup.p50}/${startup.p95}, navigation ${actionMeasurements.navigation.p50}/${actionMeasurements.navigation.p95}, input/render ${actionMeasurements.inputRender.p50}/${actionMeasurements.inputRender.p95}`
  );
} finally {
  await browser?.close();
  await preview.server.close();
  await rm(tempRoot, { recursive: true, force: true });
}
