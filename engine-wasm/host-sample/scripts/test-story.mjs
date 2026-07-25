import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer as createNetServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { build as buildVite, preview as previewVite } from 'vite';
import { generateExamples } from './generate-example-manifest.mjs';
import {
  NoExecutableCoverageError,
  assertStoryExpectation,
  selectExecutableStories,
  storyListLines
} from './story-runner-lib.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const HOST_SAMPLE_DIR = path.resolve(SCRIPT_DIR, '..');
const ENGINE_WASM_DIR = path.resolve(HOST_SAMPLE_DIR, '..');
const REPO_ROOT = path.resolve(ENGINE_WASM_DIR, '..');
const DEFAULT_OUTPUT_ROOT = path.join(HOST_SAMPLE_DIR, 'test-results', 'story');
const STORY_DIST_DIR = path.join(HOST_SAMPLE_DIR, '.generated', 'story-dist');
const FAILURE_STATUS_PATTERN = /^(Boot|Load|Key|Tick|Auto tick) error:/i;

function usage() {
  console.log(`Usage:
  pnpm test:story list
  pnpm test:story all
  pnpm test:story <work-item-or-spec-id>

Exit codes: 0 pass/list, 1 flow failure, 2 usage/configuration error, 3 no executable coverage.`);
}

function slug(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'all'
  );
}

function assertSafeOutputRoot(outputRoot) {
  const forbidden = new Set([
    path.parse(outputRoot).root,
    os.homedir(),
    os.tmpdir(),
    REPO_ROOT,
    ENGINE_WASM_DIR,
    HOST_SAMPLE_DIR,
    path.join(HOST_SAMPLE_DIR, 'test-results')
  ]);
  if (forbidden.has(outputRoot)) {
    throw new Error(`Refusing to clear unsafe story output directory: ${outputRoot}`);
  }
}

function deterministicEvidence(evidence) {
  return {
    activeExampleKey: evidence.activeExampleKey,
    snapshot: evidence.snapshot,
    traceEntries: evidence.traceEntries,
    status: evidence.status
  };
}

async function collectEvidence(page) {
  return page.evaluate(() => {
    if (!window.__WAVENAV_STORY_EVIDENCE__) {
      throw new Error('WaveNav story evidence bridge is unavailable');
    }
    return window.__WAVENAV_STORY_EVIDENCE__.collect();
  });
}

async function applyAction(page, action) {
  if (action.type === 'key') {
    await page.locator(`#press-${action.key}`).click();
    return;
  }
  if (action.type === 'back') {
    await page.locator('#press-back').click();
    return;
  }
  if (action.type === 'tick') {
    if (action.ms === 100) {
      await page.locator('#tick-100ms').click();
      return;
    }
    if (action.ms === 1000) {
      await page.locator('#tick-1s').click();
      return;
    }
    throw new Error(`Host controls do not expose a deterministic ${action.ms}ms tick`);
  }
  await page.locator('#clear-intent').click();
}

async function runStory(browser, baseUrl, story, artifactRoot) {
  const storyName = `${story.example.key}--${story.flow.id}`;
  const storyDir = path.join(artifactRoot, storyName);
  const browserSignals = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      browserSignals.push({ type: `console:${message.type()}`, text: message.text() });
    }
  });
  page.on('pageerror', (error) => {
    browserSignals.push({ type: 'pageerror', text: error.message });
  });
  page.on('requestfailed', (request) => {
    browserSignals.push({
      type: 'requestfailed',
      text: `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`.trim()
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      browserSignals.push({
        type: 'response',
        text: `${response.status()} ${response.request().method()} ${response.url()}`
      });
    }
  });

  const result = {
    example: story.example.key,
    flow: story.flow.id,
    title: story.flow.title,
    workItems: story.flow.workItems,
    specItems: story.flow.specItems,
    status: 'passed',
    steps: []
  };

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__WAVENAV_STORY_EVIDENCE__ !== undefined, null, {
      timeout: 10_000
    });
    await page.locator('#example-select').selectOption(story.example.key);

    let evidence = await collectEvidence(page);
    assertStoryExpectation(evidence, story.flow.initial, `${storyName} initial`);
    result.steps.push({ index: 0, phase: 'initial', evidence: deterministicEvidence(evidence) });

    for (const [index, step] of story.flow.steps.entries()) {
      await applyAction(page, step.action);
      evidence = await collectEvidence(page);
      if (FAILURE_STATUS_PATTERN.test(evidence.status)) {
        throw new Error(`${storyName} step ${index + 1}: host reported "${evidence.status}"`);
      }
      assertStoryExpectation(evidence, step.expect, `${storyName} step ${index + 1}`);
      result.steps.push({
        index: index + 1,
        action: step.action,
        evidence: deterministicEvidence(evidence)
      });
    }

    if (browserSignals.length > 0) {
      throw new Error(
        `${storyName}: browser emitted unexpected diagnostics: ${browserSignals
          .map((signal) => `[${signal.type}] ${signal.text}`)
          .join('; ')}`
      );
    }

    await context.tracing.stop();
    console.log(`PASS ${storyName}`);
    return result;
  } catch (error) {
    result.status = 'failed';
    result.error = error.message ?? String(error);
    result.browserSignals = browserSignals;
    await mkdir(storyDir, { recursive: true });
    try {
      result.failureEvidence = await collectEvidence(page);
    } catch (evidenceError) {
      result.evidenceError = evidenceError.message ?? String(evidenceError);
    }
    await page.screenshot({ path: path.join(storyDir, 'failure.png'), fullPage: true });
    await writeFile(path.join(storyDir, 'evidence.json'), `${JSON.stringify(result, null, 2)}\n`);
    await context.tracing.stop({ path: path.join(storyDir, 'trace.zip') });
    console.error(`FAIL ${storyName}: ${result.error}`);
    console.error(`  artifacts: ${storyDir}`);
    return result;
  } finally {
    await context.close();
  }
}

async function startHostServer() {
  const port = await new Promise((resolve, reject) => {
    const reservation = createNetServer();
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', () => {
      const address = reservation.address();
      if (!address || typeof address === 'string') {
        reservation.close();
        reject(new Error('Could not reserve an ephemeral localhost port'));
        return;
      }
      reservation.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(address.port);
      });
    });
  });
  await buildVite({
    root: HOST_SAMPLE_DIR,
    configFile: path.join(HOST_SAMPLE_DIR, 'vite.config.ts'),
    logLevel: 'error',
    build: {
      outDir: STORY_DIST_DIR,
      emptyOutDir: true
    }
  });
  const server = await previewVite({
    root: HOST_SAMPLE_DIR,
    configFile: path.join(HOST_SAMPLE_DIR, 'vite.config.ts'),
    logLevel: 'error',
    build: {
      outDir: STORY_DIST_DIR
    },
    preview: {
      host: '127.0.0.1',
      port,
      strictPort: true
    }
  });
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') {
    await server.close();
    throw new Error('Vite preview did not expose a local TCP address');
  }
  return { server, baseUrl: `http://127.0.0.1:${address.port}/` };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0] === '--help' || args[0] === '-h') {
    usage();
    process.exitCode = args.includes('--help') || args.includes('-h') ? 0 : 2;
    return;
  }

  const selector = args[0];
  const records = await generateExamples();
  if (selector === 'list' || selector === '--list') {
    for (const line of storyListLines(records)) {
      console.log(line);
    }
    return;
  }

  let stories;
  try {
    stories = selectExecutableStories(records, selector);
  } catch (error) {
    if (error instanceof NoExecutableCoverageError) {
      console.error(error.message);
      console.error('Run "pnpm test:story list" to see executable mappings.');
      process.exitCode = 3;
      return;
    }
    throw error;
  }
  if (stories.length === 0) {
    throw new Error('No executable story flows are defined.');
  }

  const outputRoot = path.resolve(
    process.env.WAVES_STORY_OUTPUT_DIR ?? path.join(DEFAULT_OUTPUT_ROOT, slug(selector))
  );
  assertSafeOutputRoot(outputRoot);
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const { server, baseUrl } = await startHostServer();
  let browser;
  const results = [];
  try {
    browser = await chromium.launch({ headless: true });
    for (const story of stories) {
      results.push(await runStory(browser, baseUrl, story, outputRoot));
    }
  } finally {
    await browser?.close();
    await server.close();
  }

  const failed = results.filter((result) => result.status === 'failed');
  const summary = {
    selector,
    baseUrl: 'ephemeral localhost Vite server',
    passed: results.length - failed.length,
    failed: failed.length,
    results
  };
  const summaryPath = path.join(outputRoot, 'summary.json');
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`RESULT ${summary.passed} passed, ${summary.failed} failed`);
  console.log(`ARTIFACTS ${summaryPath}`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Story runner configuration error: ${error.message ?? error}`);
  process.exitCode = 2;
});
