import { describe, expect, it, vi } from 'vitest';
import {
  initializeBrowserApplication,
  isWmlCommandEditingContext,
  type BrowserApplication
} from './browser-application';

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('browser application command lifecycle', () => {
  it('protects active WML input and select editing without disabling ordinary viewport shortcuts', () => {
    expect(isWmlCommandEditingContext(null)).toBe(false);
    expect(isWmlCommandEditingContext({ focusedInputEditName: 'pin' })).toBe(true);
    expect(isWmlCommandEditingContext({ focusedSelectEditName: 'region' })).toBe(true);
  });

  it('binds commands while asynchronous controller initialization is in progress', async () => {
    const initialization = deferred();
    const controller = {
      init: vi.fn(() => initialization.promise)
    };
    const commandBridge = {
      bind: vi.fn(async () => undefined),
      dispose: vi.fn()
    };
    const application = { controller, commandBridge } as unknown as BrowserApplication;

    const result = initializeBrowserApplication(application);
    await Promise.resolve();

    expect(controller.init).toHaveBeenCalledTimes(1);
    expect(commandBridge.bind).toHaveBeenCalledTimes(1);
    initialization.resolve();
    await result;
  });

  it('disposes the command bridge when initialization fails', async () => {
    const failure = new Error('initialization failed');
    const controller = {
      init: vi.fn(async () => {
        throw failure;
      })
    };
    const commandBridge = {
      bind: vi.fn(async () => undefined),
      dispose: vi.fn()
    };
    const application = { controller, commandBridge } as unknown as BrowserApplication;

    await expect(initializeBrowserApplication(application)).rejects.toThrow(failure);
    expect(commandBridge.dispose).toHaveBeenCalledTimes(1);
  });
});
