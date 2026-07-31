import { describe, expect, it } from 'vitest';

import {
  ENGINE_DEBUG_CONTRACT_BASELINE,
  type EngineDebugConnector,
  type EngineHostClient,
  type EngineDebugValue
} from '../../../contracts/engine';
import { createTauriHostClient } from '../../../contracts/generated/tauri-host-client';
import { createGuardedTauriInvoke } from './tauri-invoke-guard';

describe('D0 debug connector contract and host bridge', () => {
  it('projects the default-disabled bounded security baseline', () => {
    expect(ENGINE_DEBUG_CONTRACT_BASELINE).toEqual({
      protocolVersion: 1,
      enabledByDefault: false,
      sessionLimit: 1,
      eventBufferCapacity: 2048,
      defaultMaxEventsPerPoll: 100,
      maxEventsPerPoll: 256,
      maxSnapshotVariables: 256,
      maxSnapshotTimers: 64,
      maxTextBytes: 4096,
      maskingPolicy: 'required',
      timestampKind: 'monotonic',
      supportsSensitiveUnmasking: false
    });
  });

  it('keeps all four host-owned lifecycle methods additive', () => {
    const methodNames = [
      'openDebugSession',
      'pollDebugEvents',
      'getDebugSnapshot',
      'closeDebugSession'
    ] satisfies Array<keyof EngineDebugConnector>;

    expect(methodNames).toHaveLength(4);

    const hostMethodNames = methodNames satisfies Array<keyof EngineHostClient>;
    expect(hostMethodNames).toEqual(methodNames);
  });

  it('projects all four lifecycle methods onto the bounded Tauri command bridge', async () => {
    const calls: Array<{ command: string; args?: Record<string, unknown> }> = [];
    const invoke = async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
      calls.push({ command, args });
      return {} as T;
    };
    const client = createTauriHostClient(invoke);

    await client.engineDebugOpenSession({ protocolVersion: 1 });
    await client.engineDebugPollEvents({ sessionId: 'session', cursor: '0', maxEvents: 100 });
    await client.engineDebugGetSnapshot({ sessionId: 'session' });
    await client.engineDebugCloseSession({ sessionId: 'session' });

    expect(calls).toEqual([
      {
        command: 'engine_debug_open_session',
        args: { request: { protocolVersion: 1 } }
      },
      {
        command: 'engine_debug_poll_events',
        args: { request: { sessionId: 'session', cursor: '0', maxEvents: 100 } }
      },
      {
        command: 'engine_debug_get_snapshot',
        args: { request: { sessionId: 'session' } }
      },
      {
        command: 'engine_debug_close_session',
        args: { request: { sessionId: 'session' } }
      }
    ]);
  });

  it('accepts the typed default-disabled outcome at the guarded IPC boundary', async () => {
    const outcome = {
      status: 'failure',
      error: {
        code: 'DEBUG_DISABLED',
        message: 'engine debug connector is disabled by host policy',
        retryable: false
      }
    };
    const guarded = createGuardedTauriInvoke(async <T>() => outcome as T);

    await expect(
      guarded('engine_debug_open_session', { request: { protocolVersion: 1 } })
    ).resolves.toBe(outcome);
  });

  it('does not permit masked values to carry a raw value field', () => {
    const masked: EngineDebugValue = {
      state: 'masked',
      reason: 'password-input'
    };

    expect(masked).not.toHaveProperty('value');

    const unsafeMasked: EngineDebugValue = {
      state: 'masked',
      reason: 'password-input',
      // @ts-expect-error Masked variants intentionally cannot carry raw content.
      value: '1234'
    };
    expect(unsafeMasked).toHaveProperty('value');
  });
});
