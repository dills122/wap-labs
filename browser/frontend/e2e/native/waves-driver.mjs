const SELECTORS = Object.freeze({
  body: 'body',
  runMode: '#run-mode',
  welcome: '#welcome-help-panel',
  connectNetwork: '#btn-connect-network',
  address: '#fetch-url',
  go: '#btn-fetch-url',
  back: '#btn-back',
  reload: '#btn-reload',
  viewport: '#viewport',
  status: '#status',
  softkeys: Object.freeze({ up: '#btn-up', select: '#btn-enter', down: '#btn-down' })
});

const SAME_TASK_SUBMIT_SCRIPT = `
const finalCharacter = arguments[0];
const submission = arguments[1];
const viewport = document.querySelector('#viewport');
if (!(viewport instanceof HTMLElement)) {
  throw new Error('Waves viewport is unavailable');
}
viewport.focus();
const characterEvent = new KeyboardEvent('keydown', {
  key: finalCharacter,
  bubbles: true,
  cancelable: true,
  composed: true
});
viewport.dispatchEvent(characterEvent);
if (submission === 'enter') {
  const submitEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
    composed: true
  });
  viewport.dispatchEvent(submitEvent);
} else {
  const selectButton = document.querySelector('#btn-enter');
  if (!(selectButton instanceof HTMLButtonElement)) {
    throw new Error('Waves Select button is unavailable');
  }
  selectButton.click();
}
`;

function stripSensitiveAddress(rawAddress) {
  const address = new URL(rawAddress);
  address.search = '';
  address.hash = '';
  return address.href;
}

export function createWavesDriver({ driver, selector, waitUntil, keys = { Enter: 'Enter' } }) {
  if (!driver || typeof driver.findElement !== 'function') {
    throw new Error('Waves driver requires a WebDriver session');
  }
  if (typeof selector !== 'function' || typeof waitUntil !== 'function') {
    throw new Error('Waves driver requires selector and wait dependencies');
  }

  const find = (name) => driver.findElement(selector(name));
  const readText = async (element) =>
    driver.executeScript('return arguments[0].textContent ?? "";', element);
  const compactVisibleText = (value) => value.replace(/\s+/g, '');
  const readStatusText = async (element) =>
    driver.executeScript(
      'return arguments[0].shadowRoot?.querySelector("#status-root")?.textContent ?? "";',
      element
    );
  const waitForStatusText = async (expected) => {
    const status = await find(SELECTORS.status);
    const navigationButton = await find(SELECTORS.go);
    return waitUntil(async () => {
      const text = await readStatusText(status);
      if (!text.includes(expected)) return false;
      const action = await navigationButton.getAttribute('data-navigation-action');
      return action === 'go' ? text : false;
    }, { description: `status text ${JSON.stringify(expected)}` });
  };
  const waitForNavigationAction = async (expected) => {
    if (expected !== 'go' && expected !== 'stop') {
      throw new Error('navigation action must be go or stop');
    }
    const button = await find(SELECTORS.go);
    return waitUntil(async () => {
      const action = await button.getAttribute('data-navigation-action');
      return action === expected ? action : false;
    }, { description: `navigation action ${JSON.stringify(expected)}` });
  };
  const submitAddress = async (address) => {
    if (typeof address !== 'string' || address.length === 0 || address.length > 2_048) {
      throw new Error('Waves address must be a bounded non-empty string');
    }
    const input = await find(SELECTORS.address);
    await input.click();
    await input.clear();
    await input.sendKeys(address);
    await (await find(SELECTORS.go)).click();
  };
  const requireWapAddress = (address) => {
    const parsed = new URL(address);
    if (parsed.protocol !== 'wap:' && parsed.protocol !== 'waps:') {
      throw new Error('Waves E2E accepts only wap:// or waps:// addresses');
    }
  };
  const startWapUrl = async (address) => {
    requireWapAddress(address);
    await waitForNavigationAction('go');
    await submitAddress(address);
    await waitForNavigationAction('stop');
  };
  const openWapUrl = async (address) => {
    requireWapAddress(address);
    await waitForNavigationAction('go');
    await submitAddress(address);
  };
  const readSanitizedAddress = async () => {
    const rawAddress = await (await find(SELECTORS.address)).getAttribute('value');
    return stripSensitiveAddress(rawAddress);
  };

  return Object.freeze({
    async launchWaves() {
      const body = await find(SELECTORS.body);
      await waitUntil(async () => {
        const phase = await body.getAttribute('data-boot-phase');
        return phase === 'engine-ready' || phase === 'deck-ready' ? phase : false;
      }, { description: 'Waves engine-ready or deck-ready boot phase' });
      const mode = await (await find(SELECTORS.runMode)).getAttribute('value');
      if (mode !== 'network') {
        throw new Error(`Waves launched in unexpected run mode: ${mode}`);
      }
      await waitForStatusText('Ready. WAP gateway responded at ');
    },

    async dismissWelcome() {
      const welcome = await find(SELECTORS.welcome);
      if (await welcome.isDisplayed()) {
        await (await find(SELECTORS.connectNetwork)).click();
        await waitUntil(async () => !(await welcome.isDisplayed()), {
          description: 'network welcome panel to close'
        });
      }
    },

    async openWapUrl(address) {
      await openWapUrl(address);
    },

    async startWapUrl(address) {
      await startWapUrl(address);
    },

    async submitAddress(address) {
      await submitAddress(address);
    },

    async focusViewport() {
      await (await find(SELECTORS.viewport)).click();
    },

    async pressSoftkey(softkey) {
      const target = SELECTORS.softkeys[softkey];
      if (!target) {
        throw new Error(`unknown Waves softkey: ${softkey}`);
      }
      await (await find(target)).click();
    },

    async pressKeyboardKey(key) {
      const value = keys[key] ?? key;
      await (await find(SELECTORS.viewport)).sendKeys(value);
    },

    async goBack() {
      await (await find(SELECTORS.back)).click();
    },

    async reload() {
      await (await find(SELECTORS.reload)).click();
    },

    async stopNavigation() {
      await waitForNavigationAction('stop');
      await (await find(SELECTORS.go)).click();
      await waitForNavigationAction('go');
      return waitForStatusText('Navigation stopped.');
    },

    async typeText(value) {
      if (typeof value !== 'string') {
        throw new Error('Waves text input must be a string');
      }
      await (await find(SELECTORS.viewport)).sendKeys(value);
    },

    async typeFinalCharacterAndSubmitInOneTask(finalCharacter, submission) {
      if (typeof finalCharacter !== 'string' || [...finalCharacter].length !== 1) {
        throw new Error('same-task submission requires one final character');
      }
      if (submission !== 'enter' && submission !== 'select') {
        throw new Error('same-task submission must be enter or select');
      }
      await driver.executeScript(SAME_TASK_SUBMIT_SCRIPT, finalCharacter, submission);
    },

    async waitForDeckText(expected) {
      const viewport = await find(SELECTORS.viewport);
      const navigationButton = await find(SELECTORS.go);
      return waitUntil(async () => {
        const text = await readText(viewport);
        if (!compactVisibleText(text).includes(compactVisibleText(expected))) return false;
        const action = await navigationButton.getAttribute('data-navigation-action');
        return action === 'go' ? text : false;
      }, { description: `deck text ${JSON.stringify(expected)}` });
    },

    async waitForStatus(expected) {
      const status = await find(SELECTORS.status);
      const text = await waitForStatusText(expected);
      return {
        text,
        tone: await status.getAttribute('tone'),
        displayed: await status.isDisplayed()
      };
    },

    async readSanitizedAddress() {
      return readSanitizedAddress();
    },

    async withEphemeralAddress(callback) {
      if (typeof callback !== 'function') {
        throw new Error('ephemeral address access requires a callback');
      }
      const rawAddress = await (await find(SELECTORS.address)).getAttribute('value');
      return callback(rawAddress);
    },

    async waitForAddress(expected) {
      const sanitizedExpected = stripSensitiveAddress(expected);
      return waitUntil(async () => {
        const observed = await readSanitizedAddress();
        return observed === sanitizedExpected ? observed : false;
      }, { description: `address ${JSON.stringify(sanitizedExpected)}` });
    }
  });
}
