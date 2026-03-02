import { describe, expect, it } from 'vitest';
import { resolveKeyboardIntent } from './keyboard';

describe('app/keyboard', () => {
  it('maps ctrl+shift+d to dev tools toggle', () => {
    expect(resolveKeyboardIntent('d', true, true, false)).toEqual({
      type: 'toggle-dev-tools'
    });
    expect(resolveKeyboardIntent('D', true, true, false)).toEqual({
      type: 'toggle-dev-tools'
    });
  });

  it('suppresses engine keys when target is text-entry', () => {
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
