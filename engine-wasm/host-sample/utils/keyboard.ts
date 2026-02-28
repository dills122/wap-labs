export type EngineKey = 'up' | 'down' | 'enter';

export function mapKeyboardKey(key: string): EngineKey | null {
  if (key === 'ArrowUp') return 'up';
  if (key === 'ArrowDown') return 'down';
  if (key === 'Enter') return 'enter';
  return null;
}
