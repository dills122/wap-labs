import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';
import storyTestContract from '../../../../engine-wasm/host-sample/scripts/waves-story-test-contract.json';

export type BrowserTestDelayableCommand = keyof TauriHostClient;

export interface BrowserTestHostOptions {
  commandDelaysMs: Partial<Record<BrowserTestDelayableCommand, number>>;
}

const delayableCommands = new Set<string>(storyTestContract.delayableCommands);

if (storyTestContract.version !== 1) {
  throw new Error(`Unsupported Waves story test contract version: ${storyTestContract.version}`);
}

export const parseBrowserTestHostOptions = (params: URLSearchParams): BrowserTestHostOptions => {
  const commandDelaysMs: BrowserTestHostOptions['commandDelaysMs'] = {};

  for (const encodedDelay of params.getAll('host-delay')) {
    const separator = encodedDelay.lastIndexOf(':');
    const command = encodedDelay.slice(0, separator);
    const rawDelayMs = encodedDelay.slice(separator + 1);
    const delayMs = Number(rawDelayMs);

    if (
      separator <= 0 ||
      !delayableCommands.has(command) ||
      !/^\d+$/.test(rawDelayMs) ||
      !Number.isInteger(delayMs) ||
      delayMs < 1 ||
      delayMs > storyTestContract.maxCommandDelayMs
    ) {
      throw new Error(`Invalid host-delay test option: ${encodedDelay}`);
    }
    const typedCommand = command as BrowserTestDelayableCommand;
    if (commandDelaysMs[typedCommand] !== undefined) {
      throw new Error(`Invalid duplicate host-delay test option: ${command}`);
    }
    commandDelaysMs[typedCommand] = delayMs;
  }

  return { commandDelaysMs };
};
