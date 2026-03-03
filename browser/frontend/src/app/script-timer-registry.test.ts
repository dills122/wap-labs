import { describe, expect, it } from 'vitest';
import { ScriptTimerRegistry } from './script-timer-registry';

describe('script-timer-registry', () => {
  it('schedules token timer and expires exactly once', () => {
    const registry = new ScriptTimerRegistry();
    const applied = registry.applyRequests([{ type: 'schedule', delayMs: 300, token: 'otp' }]);
    expect(applied.scheduled).toHaveLength(1);
    expect(applied.scheduled[0]?.id).toBe('token:otp');

    expect(registry.advance(200)).toHaveLength(0);
    const expired = registry.advance(100);
    expect(expired).toHaveLength(1);
    expect(expired[0]?.token).toBe('otp');
    expect(registry.advance(500)).toHaveLength(0);
  });

  it('reschedules same token with last write winning', () => {
    const registry = new ScriptTimerRegistry();
    registry.applyRequests([{ type: 'schedule', delayMs: 100, token: 'otp' }]);
    registry.applyRequests([{ type: 'schedule', delayMs: 500, token: 'otp' }]);

    expect(registry.advance(100)).toHaveLength(0);
    expect(registry.advance(400)).toHaveLength(1);
    expect(registry.hasActiveTimers()).toBe(false);
  });

  it('cancels scheduled token timer', () => {
    const registry = new ScriptTimerRegistry();
    registry.applyRequests([{ type: 'schedule', delayMs: 150, token: 'otp' }]);
    const applied = registry.applyRequests([{ type: 'cancel', token: 'otp' }]);
    expect(applied.cancelled).toEqual(['otp']);

    expect(registry.advance(1_000)).toHaveLength(0);
    expect(registry.hasActiveTimers()).toBe(false);
  });

  it('fires multiple token timers in due-time order', () => {
    const registry = new ScriptTimerRegistry();
    registry.applyRequests([
      { type: 'schedule', delayMs: 400, token: 'b' },
      { type: 'schedule', delayMs: 200, token: 'a' }
    ]);

    expect(registry.advance(200).map((item) => item.token)).toEqual(['a']);
    expect(registry.advance(200).map((item) => item.token)).toEqual(['b']);
  });

  it('fires anonymous timers in deterministic due/order sequence', () => {
    const registry = new ScriptTimerRegistry();
    const applied = registry.applyRequests([
      { type: 'schedule', delayMs: 300 },
      { type: 'schedule', delayMs: 100 },
      { type: 'schedule', delayMs: 100 }
    ]);
    expect(applied.scheduled.map((item) => item.id)).toEqual([
      'anon:000000',
      'anon:000001',
      'anon:000002'
    ]);

    const first = registry.advance(100);
    expect(first.map((item) => item.id)).toEqual(['anon:000001', 'anon:000002']);
    const second = registry.advance(200);
    expect(second.map((item) => item.id)).toEqual(['anon:000000']);
  });
});
