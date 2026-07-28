import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { Builder, By, Capabilities, until } from 'selenium-webdriver';

const timeoutMs = Number.parseInt(process.env.NATIVE_E2E_TIMEOUT_MS ?? '20000', 10);
const driverUrl = new URL(process.env.TAURI_DRIVER_URL ?? 'http://127.0.0.1:4444/');
const appBinary = path.resolve(
  process.env.NATIVE_E2E_APP_BINARY ?? '../src-tauri/target/debug/wavenav_host'
);
const artifactDir = path.resolve(
  process.env.NATIVE_E2E_ARTIFACT_DIR ?? 'test-results/native-tauri-kannel'
);
const tauriDriverBin = process.env.TAURI_DRIVER_BIN ?? 'tauri-driver';

let driver;
let tauriDriver;
let driverStdout;
let driverStderr;

const evidence = {
  schemaVersion: 1,
  boundary:
    'Selenium -> tauri-driver -> Tauri WebView -> generated invoke client -> Rust host -> transport-rust -> Kannel',
  transportProfile: process.env.WAVES_FETCH_TRANSPORT_PROFILE ?? 'unset',
  destinationPolicy: process.env.WAVES_FETCH_DESTINATION_POLICY ?? 'unset',
  assertions: []
};

const recordAssertion = (name, details) => {
  evidence.assertions.push({ name, result: 'pass', details });
};

const waitForPort = async () => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ready = await new Promise((resolve) => {
      const socket = net.createConnection(
        { host: driverUrl.hostname, port: Number(driverUrl.port || 80) },
        () => {
          socket.end();
          resolve(true);
        }
      );
      socket.setTimeout(500);
      socket.on('error', () => resolve(false));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (ready) {
      return;
    }
    await delay(250);
  }
  throw new Error(`timed out waiting for tauri-driver at ${driverUrl.origin}`);
};

const waitForText = async (selector, expected) => {
  const element = await driver.wait(until.elementLocated(By.css(selector)), timeoutMs);
  await driver.wait(async () => (await element.getText()).includes(expected), timeoutMs);
  return element;
};

const replaceInput = async (selector, value) => {
  const input = await driver.findElement(By.css(selector));
  await input.click();
  await input.clear();
  await input.sendKeys(value);
};

const capture = async (name) => {
  const png = await driver.takeScreenshot();
  await writeFile(path.join(artifactDir, `${name}.png`), png, 'base64');
};

const terminateProcessGroup = async () => {
  if (!tauriDriver || !tauriDriver.pid) {
    return 'not-started';
  }

  const target = process.platform === 'win32' ? tauriDriver.pid : -tauriDriver.pid;
  const processGroupExists = () => {
    try {
      process.kill(target, 0);
      return true;
    } catch {
      return false;
    }
  };
  try {
    process.kill(target, 'SIGTERM');
  } catch {
    return 'already-exited';
  }

  const deadline = Date.now() + 5000;
  while (processGroupExists() && Date.now() < deadline) {
    await delay(100);
  }
  if (processGroupExists()) {
    try {
      process.kill(target, 'SIGKILL');
    } catch {
      // The process group exited between the status check and the signal.
    }
    const killDeadline = Date.now() + 2000;
    while (processGroupExists() && Date.now() < killDeadline) {
      await delay(100);
    }
  }
  if (processGroupExists()) {
    return 'cleanup-failed';
  }
  return 'terminated';
};

const run = async () => {
  await mkdir(artifactDir, { recursive: true });
  driverStdout = createWriteStream(path.join(artifactDir, 'tauri-driver.stdout.log'));
  driverStderr = createWriteStream(path.join(artifactDir, 'tauri-driver.stderr.log'));
  tauriDriver = spawn(tauriDriverBin, [], {
    detached: process.platform !== 'win32',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  tauriDriver.stdout.pipe(driverStdout);
  tauriDriver.stderr.pipe(driverStderr);
  tauriDriver.once('error', (error) => {
    driverStderr.write(`tauri-driver spawn error: ${error.message}\n`);
  });

  await waitForPort();

  const capabilities = new Capabilities();
  capabilities.set('tauri:options', { application: appBinary });
  capabilities.setBrowserName('wry');
  driver = await new Builder().withCapabilities(capabilities).usingServer(driverUrl.href).build();

  const body = await driver.wait(until.elementLocated(By.css('body')), timeoutMs);
  await driver.wait(async () => {
    const phase = await body.getAttribute('data-boot-phase');
    return phase === 'engine-ready' || phase === 'deck-ready';
  }, timeoutMs);
  const mode = await driver.findElement(By.css('#run-mode')).getAttribute('value');
  assert.equal(mode, 'network');
  recordAssertion('native startup', 'production frontend reached engine-ready in Network mode');
  await capture('01-startup');

  await driver.findElement(By.css('#btn-fetch-url')).click();
  const homeViewport = await waitForText('#viewport', 'Local WAP training');
  assert.match(await homeViewport.getText(), /environment\./);
  assert.match(await homeViewport.getText(), /Open Menu/);
  assert.equal(await body.getAttribute('data-boot-phase'), 'deck-ready');
  recordAssertion('gateway deck render', 'wap://localhost/ rendered the Kannel-served home deck');
  await capture('02-gateway-home');

  await driver.findElement(By.css('#btn-enter')).click();
  const menuViewport = await waitForText('#viewport', '1. Login');
  assert.match(await menuViewport.getText(), /2\. Register/);
  recordAssertion(
    'visible card navigation',
    'Select navigated the native engine from home to menu'
  );
  await capture('03-menu-navigation');

  for (let index = 0; index < 3; index += 1) {
    await driver.findElement(By.css('#btn-down')).click();
  }
  await driver.findElement(By.css('#btn-enter')).click();
  const staticExampleViewport = await waitForText('#viewport', 'Open Navigation');
  assert.match(
    (await staticExampleViewport.getText()).replace(/\s+/g, ' '),
    /This is a static WML sample deck\./
  );
  assert.match(
    await driver.findElement(By.css('#fetch-url')).getAttribute('value'),
    /\/examples\/index\.wml$/
  );
  recordAssertion(
    'static example navigation',
    'menu option 4 loaded and rendered the gateway-compiled WML 1.3 static deck'
  );
  await capture('04-static-example');

  await replaceInput('#fetch-url', 'not a url');
  await driver.findElement(By.css('#btn-fetch-url')).click();
  const toast = await waitForText('#toast', 'Fetch failed:');
  assert.match(await toast.getText(), /INVALID_REQUEST|invalid|URL/i);
  recordAssertion('deterministic failure', 'invalid URL surfaced a visible Fetch failed message');
  await capture('05-invalid-url-failure');

  await replaceInput('#fetch-url', 'wap://localhost/');
  await driver.findElement(By.css('#btn-fetch-url')).click();
  const recoveredViewport = await waitForText('#viewport', 'Local WAP training');
  assert.match(await recoveredViewport.getText(), /environment\./);
  assert.match(await recoveredViewport.getText(), /Open Menu/);
  recordAssertion('failure recovery', 'a subsequent native Kannel load restored the home deck');
  await capture('06-recovered-home');

  await writeFile(path.join(artifactDir, 'page-source.html'), await driver.getPageSource());
  await writeFile(
    path.join(artifactDir, 'evidence.json'),
    `${JSON.stringify({ ...evidence, result: 'pass' }, null, 2)}\n`
  );
  process.stdout.write(`native-tauri-kannel-e2e: PASS (artifacts: ${artifactDir})\n`);
};

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`native-tauri-kannel-e2e: FAIL\n${message}\n`);
  if (driver) {
    await capture('failure').catch(() => undefined);
    await writeFile(path.join(artifactDir, 'page-source.html'), await driver.getPageSource()).catch(
      () => undefined
    );
  }
  await writeFile(
    path.join(artifactDir, 'evidence.json'),
    `${JSON.stringify({ ...evidence, result: 'fail', error: message }, null, 2)}\n`
  ).catch(() => undefined);
  process.exitCode = 1;
} finally {
  let webdriverSession = 'not-started';
  if (driver) {
    webdriverSession = await driver.quit().then(
      () => 'closed',
      () => 'close-failed'
    );
  }
  const processGroup = await terminateProcessGroup();
  await writeFile(
    path.join(artifactDir, 'gui-cleanup.json'),
    `${JSON.stringify({ webdriverSession, processGroup }, null, 2)}\n`
  ).catch(() => undefined);
  if (webdriverSession === 'close-failed' || processGroup === 'cleanup-failed') {
    process.exitCode = 1;
  }
  driverStdout?.end();
  driverStderr?.end();
}
