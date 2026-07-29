import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { generateExamples } from './generate-example-manifest.mjs';
import {
  NoExecutableCoverageError,
  assertStoryExpectation,
  isExpectedHostFailureStatus,
  selectExecutableStories,
  storyListLines
} from './story-runner-lib.mjs';
import { startVitePreview } from './vite-preview-harness.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const HOST_SAMPLE_DIR = path.resolve(SCRIPT_DIR, '..');
const ENGINE_WASM_DIR = path.resolve(HOST_SAMPLE_DIR, '..');
const REPO_ROOT = path.resolve(ENGINE_WASM_DIR, '..');
const BROWSER_FRONTEND_DIR = path.join(REPO_ROOT, 'browser', 'frontend');
const DEFAULT_OUTPUT_ROOT = path.join(HOST_SAMPLE_DIR, 'test-results', 'story');
const FAILURE_STATUS_PATTERN = /^(Boot|Load|Key|Tick|Auto tick) error:/i;
const STORY_TARGETS = {
  'host-sample': {
    root: HOST_SAMPLE_DIR,
    configFile: path.join(HOST_SAMPLE_DIR, 'vite.config.ts'),
    entry: 'index.html'
  },
  'waves-browser': {
    root: BROWSER_FRONTEND_DIR,
    configFile: path.join(BROWSER_FRONTEND_DIR, 'vite.config.ts'),
    entry: 'browser-story.html'
  }
};

function usage() {
  console.log(`Usage:
  pnpm test:story list
  pnpm test:story all
  pnpm test:story host-sample
  pnpm test:story waves
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
    status: evidence.status,
    session: evidence.session,
    render: evidence.render,
    frame: evidence.frame
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

async function applyAction(page, action, target) {
  if (action.type === 'activate-action') {
    if (target !== 'host-sample') {
      throw new Error('activate-action is currently supported by the host-sample story target');
    }
    await page.evaluate((actionId) => {
      const bridge = window.__WAVENAV_STORY_EVIDENCE__;
      if (!bridge?.activateAction) {
        throw new Error('WaveNav story action bridge is unavailable');
      }
      bridge.activateAction(actionId);
    }, action.actionId);
    return;
  }
  if (action.type === 'key') {
    const selector =
      target === 'waves-browser'
        ? `#btn-${action.key === 'enter' ? 'enter' : action.key}`
        : `#press-${action.key}`;
    await page.locator(selector).click();
    return;
  }
  if (action.type === 'keyboard') {
    await page.locator(target === 'waves-browser' ? '#viewport' : 'body').focus();
    await page.keyboard.press(action.key);
    return;
  }
  if (action.type === 'type-text') {
    await page.locator(target === 'waves-browser' ? '#viewport' : 'body').focus();
    await page.keyboard.type(action.text);
    return;
  }
  if (action.type === 'back') {
    if (target === 'waves-browser') {
      await page.locator('#viewport').focus();
      await page.keyboard.press('Backspace');
    } else {
      await page.locator('#press-back').click();
    }
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
  await page.locator(target === 'waves-browser' ? '#btn-clear-intent' : '#clear-intent').click();
}

async function assertExpectationEventually(page, expectation, label) {
  const deadline = Date.now() + 5_000;
  let lastError;
  let evidence;
  while (Date.now() < deadline) {
    evidence = await collectEvidence(page);
    try {
      assertStoryExpectation(evidence, expectation, label);
      return evidence;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
    }
  }
  throw lastError ?? new Error(`${label}: expectation did not settle`);
}

async function prepareStory(page, story) {
  const target = story.flow.target ?? 'host-sample';
  if (target === 'host-sample') {
    await page.locator('#example-select').selectOption(story.example.key);
    await page.waitForFunction(
      (key) => window.__WAVENAV_STORY_EVIDENCE__?.collect().activeExampleKey === key,
      story.example.key,
      { timeout: 10_000 }
    );
    return;
  }

  await page.locator('#local-example').selectOption(story.example.key);
  const localBaseUrl = `http://local.test/examples/${story.example.key}.wml`;
  await waitForWavesDeck(page, story.example.key, localBaseUrl);

  if (story.flow.setup?.runMode === 'network') {
    await page.locator('#run-mode').selectOption('network');
    const fixtureUrl = `http://fixtures.test/examples/${encodeURIComponent(story.example.key)}.wml`;
    await page.locator('#fetch-url').fill(fixtureUrl);
    await page.locator('#btn-fetch-url').click();
    await waitForWavesDeck(page, story.example.key, fixtureUrl);
  }

  await page.locator('#viewport').focus();
}

async function waitForWavesDeck(page, exampleKey, expectedBaseUrl) {
  await page.waitForFunction(
    ({ key, baseUrl }) => {
      const bridge = window.__WAVENAV_STORY_EVIDENCE__;
      if (!bridge) {
        return false;
      }
      const evidence = bridge.collect();
      return (
        evidence.activeExampleKey === key &&
        evidence.snapshot?.baseUrl === baseUrl &&
        evidence.session?.navigationStatus === 'loaded'
      );
    },
    { key: exampleKey, baseUrl: expectedBaseUrl },
    { timeout: 10_000 }
  );
}

async function runStory(browser, baseUrl, story, artifactRoot) {
  const storyName = `${story.example.key}--${story.flow.id}`;
  const target = story.flow.target ?? 'host-sample';
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
    target,
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
    await prepareStory(page, story);

    let evidence = await assertExpectationEventually(
      page,
      story.flow.initial,
      `${storyName} initial`
    );
    result.steps.push({ index: 0, phase: 'initial', evidence: deterministicEvidence(evidence) });

    for (const [index, step] of story.flow.steps.entries()) {
      await applyAction(page, step.action, target);
      evidence = await assertExpectationEventually(
        page,
        step.expect,
        `${storyName} step ${index + 1}`
      );
      if (
        target === 'host-sample' &&
        FAILURE_STATUS_PATTERN.test(evidence.status) &&
        !isExpectedHostFailureStatus(evidence.status, step.expect)
      ) {
        throw new Error(`${storyName} step ${index + 1}: host reported "${evidence.status}"`);
      }
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

async function startTargetServer(target, tempRoot) {
  const config = STORY_TARGETS[target];
  if (!config) {
    throw new Error(`Unknown story target: ${target}`);
  }
  const outDir = path.join(tempRoot, target);
  return startVitePreview({
    root: config.root,
    configFile: config.configFile,
    entry: target === 'waves-browser' ? path.join(config.root, config.entry) : undefined,
    outDir
  });
}

async function startTargetServers(stories) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'waves-story-build-'));
  const targets = [...new Set(stories.map((story) => story.flow.target ?? 'host-sample'))];
  const servers = new Map();
  try {
    for (const target of targets) {
      servers.set(target, await startTargetServer(target, tempRoot));
    }
  } catch (error) {
    for (const { server } of servers.values()) {
      await server.close();
    }
    await rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
  return { servers, tempRoot };
}

async function closeTargetServers(servers, tempRoot) {
  for (const { server } of servers.values()) {
    await server.close();
  }
  await rm(tempRoot, { recursive: true, force: true });
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

  const { servers, tempRoot } = await startTargetServers(stories);
  let browser;
  const results = [];
  try {
    browser = await chromium.launch({ headless: true });
    for (const story of stories) {
      const target = story.flow.target ?? 'host-sample';
      const targetServer = servers.get(target);
      if (!targetServer) {
        throw new Error(`No running story server for ${target}`);
      }
      results.push(await runStory(browser, targetServer.baseUrl, story, outputRoot));
    }
  } finally {
    await browser?.close();
    await closeTargetServers(servers, tempRoot);
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
