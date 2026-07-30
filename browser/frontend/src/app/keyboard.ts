export type KeyboardIntent =
  | { type: 'toggle-dev-tools' }
  | { type: 'engine-key'; key: 'up' | 'down' | 'enter' }
  | { type: 'navigate-back' }
  | { type: 'none' };

export const resolveKeyboardIntent = (
  key: string,
  _ctrlKey: boolean,
  _shiftKey: boolean,
  isHostControlTarget: boolean
): KeyboardIntent => {
  if (isHostControlTarget) {
    return { type: 'none' };
  }
  if (key === 'ArrowUp') {
    return { type: 'engine-key', key: 'up' };
  }
  if (key === 'ArrowDown') {
    return { type: 'engine-key', key: 'down' };
  }
  if (key === 'Enter') {
    return { type: 'engine-key', key: 'enter' };
  }
  if (key === 'Backspace') {
    return { type: 'navigate-back' };
  }
  return { type: 'none' };
};
