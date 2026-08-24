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

function fixture({ initialNavigationAction = 'go' } = {}) {
  const calls = [];
  const waits = [];
  let navigationAction = initialNavigationAction;
  let statusText = 'Ready. WAP gateway responded at wap://localhost/';
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
    ['#btn-fetch-url', element({
      click: async () => {
        calls.push(['click', navigationAction]);
        if (navigationAction === 'stop') {
          navigationAction = 'go';
          statusText = 'Navigation stopped.';
        }
      },
      getAttribute: async (name) => (name === 'data-navigation-action' ? navigationAction : '')
    })],
    ['#btn-back', element({ click: async () => calls.push(['click', 'back']) })],
    ['#btn-reload', element({ click: async () => calls.push(['click', 'reload']) })],
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
      if (script.includes('shadowRoot')) return statusText;
      if (script.includes('textContent')) return 'Rendered deck text';
      return '';
    }
  };
  const page = createWavesDriver({
    driver,
    selector: (value) => value,
    waitUntil: async (condition, options) => {
      waits.push(options?.description);
      const observed = await condition();
      if (!observed) throw new Error('condition did not pass');
      return observed;
    }
  });
  return { calls, page, waits };
}

function wrappedDeckFixture(value) {
  const driver = {
    async findElement() {
      return element();
    },
    async executeScript(script) {
      return script.includes('textContent') ? value : '';
    }
  };
  return createWavesDriver({
    driver,
    selector: (selector) => selector,
    waitUntil: async (condition) => {
      const observed = await condition();
      if (!observed) throw new Error('condition did not pass');
      return observed;
    }
  });
}

test('native launch waits for the startup gateway probe before scenarios may navigate', async () => {
  const { page, waits } = fixture();

  await page.launchWaves();

  assert.deepEqual(waits, [
    'Waves engine-ready or deck-ready boot phase',
    'status text "Ready. WAP gateway responded at "'
  ]);
});

test('Waves interaction API drives address, viewport, keyboard, and softkeys by intent', async () => {
  const { calls, page } = fixture();

  await page.launchWaves();
  await page.dismissWelcome();
  await page.openWapUrl('wap://localhost/login');
  await page.submitAddress('not a url');
  await page.focusViewport();
  await page.pressSoftkey('select');
  await page.pressKeyboardKey('Enter');
  await page.typeText('user1');
  await page.goBack();
  await page.reload();
  assert.equal(await page.readSanitizedAddress(), 'wap://localhost/path');

  assert.deepEqual(
    calls.filter(([kind]) => kind === 'click' || kind === 'sendKeys' || kind === 'clear'),
    [
      ['click', 'address'],
      ['clear', 'address'],
      ['sendKeys', 'address', 'wap://localhost/login'],
      ['click', 'go'],
      ['click', 'address'],
      ['clear', 'address'],
      ['sendKeys', 'address', 'not a url'],
      ['click', 'go'],
      ['click', 'viewport'],
      ['click', 'select'],
      ['sendKeys', 'viewport', 'Enter'],
      ['sendKeys', 'viewport', 'user1'],
      ['click', 'back'],
      ['click', 'reload']
    ]
  );
});

test('Stop waits for an active navigation, cancels it, and waits for the idle state', async () => {
  const { calls, page, waits } = fixture({ initialNavigationAction: 'stop' });

  assert.equal(await page.stopNavigation(), 'Navigation stopped.');
  assert.deepEqual(
    calls.filter(([kind]) => kind === 'click'),
    [['click', 'stop']]
  );
  assert.deepEqual(waits, [
    'navigation action "stop"',
    'navigation action "go"',
    'status text "Navigation stopped."'
  ]);
});

for (const submitWith of ['enter', 'select']) {
  test(`same-task input burst dispatches final key before ${submitWith}`, async () => {
    const { calls, page } = fixture();
    await page.typeFinalCharacterAndSubmitInOneTask('4', submitWith);

    const [, script, finalCharacter, submission] = calls.find(([kind]) => kind === 'script');
    assert.equal(finalCharacter, '4');
    assert.equal(submission, submitWith);
    assert.ok(script.indexOf('dispatchEvent(characterEvent)') < script.indexOf("submission === 'enter'"));
    assert.match(script, /viewport\.dispatchEvent\(submitEvent\)/);
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

test('deck waits normalize visual row boundaries without joining words', async () => {
  const page = wrappedDeckFixture('Local WAP training\nenvironment.');
  assert.equal(
    await page.waitForDeckText('Local WAP training environment.'),
    'Local WAP training\nenvironment.'
  );
});

test('deck waits recognize identifiers hard-wrapped across visual rows', async () => {
  const page = wrappedDeckFixture('User: e2e_auth_native_\n001a_nonce');
  assert.equal(
    await page.waitForDeckText('e2e_auth_native_001a_nonce'),
    'User: e2e_auth_native_\n001a_nonce'
  );
});

test('waitForAddress compares only sanitized origin and path', async () => {
  const { page } = fixture();
  assert.equal(await page.waitForAddress('wap://localhost/path'), 'wap://localhost/path');
});

test('raw query-bearing addresses are scoped to an ephemeral callback', async () => {
  const { page } = fixture();
  const observed = await page.withEphemeralAddress(async (address) => address.includes('?token='));
  assert.equal(observed, true);
  await assert.rejects(page.withEphemeralAddress(null), /requires a callback/);
});
