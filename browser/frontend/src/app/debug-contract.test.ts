import { describe, expect, it } from 'vitest';

import {
  ENGINE_DEBUG_CONTRACT_BASELINE,
  type EngineDebugConnector,
  type EngineDebugValue
} from '../../../contracts/engine';

describe('D0-01 debug connector contract', () => {
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
