import assert from 'node:assert/strict';
import test from 'node:test';

import { createWavesDriver } from './waves-driver.mjs';

function element(overrides = {}) {
  return {
    async click() {},
    async clear() {},
    async sendKeys() {},
    async getAttribute() {
      return '';
    },
    async isDisplayed() {
      return true;
    },
    ...overrides
  };
}

function fixture() {
  const calls = [];
  const elements = new Map([
    ['body', element({ getAttribute: async (name) => (name === 'data-boot-phase' ? 'engine-ready' : '') })],
    ['#run-mode', element({ getAttribute: async () => 'network' })],
    ['#welcome-help-panel', element({ isDisplayed: async () => false })],
    ['#btn-connect-network', element({ click: async () => calls.push(['click', 'connect']) })],
    ['#fetch-url', element({
      click: async () => calls.push(['click', 'address']),
      clear: async () => calls.push(['clear', 'address']),
      sendKeys: async (value) => calls.push(['sendKeys', 'address', value]),
      getAttribute: async () => 'wap://localhost/path?token=secret#card'
    })],
    ['#btn-fetch-url', element({ click: async () => calls.push(['click', 'go']) })],
    ['#viewport', element({
      click: async () => calls.push(['click', 'viewport']),
      sendKeys: async (value) => calls.push(['sendKeys', 'viewport', value])
    })],
    ['#btn-up', element({ click: async () => calls.push(['click', 'up']) })],
    ['#btn-enter', element({ click: async () => calls.push(['click', 'select']) })],
    ['#btn-down', element({ click: async () => calls.push(['click', 'down']) })],
    ['#status', element()]
  ]);
  const driver = {
    async findElement(selector) {
      calls.push(['find', selector]);
      const found = elements.get(selector);
      if (!found) throw new Error(`missing ${selector}`);
      return found;
    },
    async executeScript(script, ...arguments_) {
      calls.push(['script', script, ...arguments_]);
      if (script.includes('textContent')) return 'Rendered deck text';
      return '';
    }
  };
  const page = createWavesDriver({
    driver,
    selector: (value) => value,
    waitUntil: async (condition) => {
      const observed = await condition();
      if (!observed) throw new Error('condition did not pass');
      return observed;
    }
  });
  return { calls, page };
}

test('Waves interaction API drives address, viewport, keyboard, and softkeys by intent', async () => {
  const { calls, page } = fixture();

  await page.launchWaves();
  await page.dismissWelcome();
  await page.openWapUrl('wap://localhost/login');
  await page.focusViewport();
  await page.pressSoftkey('select');
  await page.pressKeyboardKey('Enter');
  await page.typeText('user1');
  assert.equal(await page.readSanitizedAddress(), 'wap://localhost/path');

  assert.deepEqual(
    calls.filter(([kind]) => kind === 'click' || kind === 'sendKeys' || kind === 'clear'),
    [
      ['click', 'address'],
      ['clear', 'address'],
      ['sendKeys', 'address', 'wap://localhost/login'],
      ['click', 'go'],
      ['click', 'viewport'],
      ['click', 'select'],
      ['sendKeys', 'viewport', 'Enter'],
      ['sendKeys', 'viewport', 'user1']
    ]
  );
});

for (const submitWith of ['enter', 'select']) {
  test(`same-task input burst dispatches final key before ${submitWith}`, async () => {
    const { calls, page } = fixture();
    await page.typeFinalCharacterAndSubmitInOneTask('4', submitWith);

    const [, script, finalCharacter, submission] = calls.find(([kind]) => kind === 'script');
    assert.equal(finalCharacter, '4');
    assert.equal(submission, submitWith);
    assert.ok(script.indexOf('dispatchEvent(characterEvent)') < script.indexOf("submission === 'enter'"));
    assert.match(script, /window\.dispatchEvent\(submitEvent\)/);
    assert.match(script, /selectButton\.click\(\)/);
    assert.doesNotMatch(script, /await|setTimeout|Promise/);
  });
}

test('Waves interaction API validates intent values before WebDriver interaction', async () => {
  const { page } = fixture();
  await assert.rejects(page.pressSoftkey('middle'), /unknown Waves softkey/);
  await assert.rejects(
    page.typeFinalCharacterAndSubmitInOneTask('12', 'enter'),
    /one final character/
  );
  await assert.rejects(
    page.typeFinalCharacterAndSubmitInOneTask('4', 'click'),
    /submission must be enter or select/
  );
});

test('deck waits report the expected text through the semantic viewport text', async () => {
  const { page } = fixture();
  const text = await page.waitForDeckText('Rendered deck');
  assert.equal(text, 'Rendered deck text');
});
