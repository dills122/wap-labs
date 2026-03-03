import { describe, expect, it } from 'vitest';
import { defaultLocalDeckExample, LOCAL_DECK_EXAMPLES } from './local-examples';

describe('local-examples', () => {
  it('provides a default example present in the local manifest', () => {
    const fallback = defaultLocalDeckExample();
    expect(LOCAL_DECK_EXAMPLES.some((example) => example.key === fallback.key)).toBe(true);
  });

  it('uses unique keys for local examples', () => {
    const keys = LOCAL_DECK_EXAMPLES.map((example) => example.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});
