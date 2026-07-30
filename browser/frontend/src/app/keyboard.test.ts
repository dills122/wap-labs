import { describe, expect, it } from 'vitest';
import { resolveKeyboardIntent } from './keyboard';

describe('app/keyboard', () => {
  it('leaves application shortcuts to the shared command registry', () => {
    expect(resolveKeyboardIntent('d', true, true, false)).toEqual({ type: 'none' });
    expect(resolveKeyboardIntent('D', true, true, false)).toEqual({ type: 'none' });
  });

  it('suppresses engine keys when a browser-owned control is targeted', () => {
    expect(resolveKeyboardIntent('ArrowUp', false, false, true)).toEqual({
      type: 'none'
    });
    expect(resolveKeyboardIntent('Enter', false, false, true)).toEqual({
      type: 'none'
    });
  });

  it('maps engine keys and back navigation', () => {
    expect(resolveKeyboardIntent('ArrowUp', false, false, false)).toEqual({
      type: 'engine-key',
      key: 'up'
    });
    expect(resolveKeyboardIntent('ArrowDown', false, false, false)).toEqual({
      type: 'engine-key',
      key: 'down'
    });
    expect(resolveKeyboardIntent('Enter', false, false, false)).toEqual({
      type: 'engine-key',
      key: 'enter'
    });
    expect(resolveKeyboardIntent('Backspace', false, false, false)).toEqual({
      type: 'navigate-back'
    });
  });

  it('returns none for unrelated keys', () => {
    expect(resolveKeyboardIntent('Escape', false, false, false)).toEqual({
      type: 'none'
    });
  });
});
