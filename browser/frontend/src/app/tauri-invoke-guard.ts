import type { HostCommandError, HostCommandErrorCode } from '../../../contracts/host';
import {
  isHostCommandError,
  type TauriInvoke,
  validateTauriCommandResponse
} from '../../../contracts/generated/tauri-host-client';

export class HostCommandFailure extends Error {
  readonly code: HostCommandErrorCode;
  readonly recoverable: boolean;

  constructor(error: HostCommandError) {
    super(error.message);
    this.name = 'HostCommandFailure';
    this.code = error.code;
    this.recoverable = error.recoverable;
  }
}

const unknownHostFailure = (): HostCommandError => ({
  code: 'HOST_FAILURE',
  message: 'Host command failed.',
  recoverable: true
});

const malformedHostResponse = (command: string): HostCommandError => ({
  code: 'MALFORMED_RESPONSE',
  message: `Host command "${command}" returned malformed data.`,
  recoverable: true
});

/**
 * Enforces the Rust-generated host error and response contracts at the IPC
 * trust boundary. Runtime response schemas are generated from the same ts-rs
 * declarations as the compile-time client, so the guard does not maintain a
 * second hand-authored contract.
 */
export const createGuardedTauriInvoke =
  (invokeFn: TauriInvoke): TauriInvoke =>
  async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
    let result: unknown;
    try {
      result = await invokeFn<unknown>(command, args);
    } catch (error) {
      if (error instanceof HostCommandFailure) {
        throw error;
      }
      throw new HostCommandFailure(isHostCommandError(error) ? error : unknownHostFailure());
    }
    if (!validateTauriCommandResponse(command, result)) {
      throw new HostCommandFailure(malformedHostResponse(command));
    }
    return result as T;
  };
