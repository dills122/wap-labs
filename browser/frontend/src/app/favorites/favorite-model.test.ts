import { describe, expect, it } from 'vitest';
import {
  applyFavorite,
  canonicalFavoriteTarget,
  createFavorite,
  favoriteDuplicateKey,
  parseLocalExampleFavoriteTarget,
  parseNetworkFavoriteTarget,
  parseProfileId,
  type Favorite,
  type FavoriteInput,
  type FavoriteTarget
} from './favorite-model';

const networkTarget = (url: string): FavoriteTarget => {
  const parsed = parseNetworkFavoriteTarget(url);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.issue.message);
  return parsed.value;
};

const favorite = (overrides: Partial<FavoriteInput> = {}): Favorite => {
  const created = createFavorite({
    id: 'favorite-1',
    title: 'Start card',
    target: networkTarget('wap://example.test/start.wml#card-one'),
    createdAt: '2026-07-30T12:00:00.000Z',
    updatedAt: '2026-07-30T12:00:00.000Z',
    ...overrides
  });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error(created.issues.map((entry) => entry.message).join(', '));
  return created.favorite;
};

describe('favorite target model', () => {
  it('normalizes supported network targets idempotently while retaining meaningful fragments', () => {
    const schemes = ['wap', 'waps', 'http', 'https'];
    const hosts = ['EXAMPLE.test', 'gateway.example.test:9201'];
    const paths = ['/index.wml', '/directory/../deck.wml', '/deck.wml?mode=compact'];
    const fragments = ['#card-one', '#Card%20Two', '#section/value'];

    for (const scheme of schemes) {
      for (const host of hosts) {
        for (const path of paths) {
          for (const fragment of fragments) {
            const first = parseNetworkFavoriteTarget(`${scheme}://${host}${path}${fragment}`);
            expect(first.ok).toBe(true);
            if (!first.ok) continue;

            const second = parseNetworkFavoriteTarget(first.value.url);
            expect(second).toEqual(first);
            expect(first.value.url.endsWith(fragment)).toBe(true);
            expect(canonicalFavoriteTarget(first.value).endsWith(fragment)).toBe(true);
          }
        }
      }
    }
  });

  it.each([
    ['', 'blank-target'],
    ['   ', 'blank-target'],
    ['javascript:alert(1)', 'unsupported-scheme'],
    ['data:text/plain,secret', 'unsupported-scheme'],
    ['file:///tmp/deck.wml', 'unsupported-scheme'],
    ['https://user:secret@example.test/deck.wml', 'credential-bearing-url'],
    ['wap://user@example.test/deck.wml', 'credential-bearing-url'],
    ['https://@example.test/deck.wml', 'credential-bearing-url'],
    ['wap:example.test/deck.wml', 'malformed-url']
  ])('rejects unsafe network target %j', (value, code) => {
    const parsed = parseNetworkFavoriteTarget(value);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.issue.code).toBe(code);
  });

  it('keeps local examples distinct from network targets and retains their fragments', () => {
    const local = parseLocalExampleFavoriteTarget('basic', '#card-two');
    expect(local).toEqual({
      ok: true,
      value: { kind: 'local-example', exampleId: 'basic', fragment: '#card-two' }
    });
    if (!local.ok) return;

    expect(favoriteDuplicateKey(local.value)).not.toBe(
      favoriteDuplicateKey(networkTarget('http://local.test/examples/basic.wml#card-two'))
    );
  });
});

describe('favorite duplicate decisions', () => {
  it('requires an explicit Replace, Keep Both, or Cancel decision for canonical duplicates', () => {
    const existing = favorite();
    const incoming = favorite({
      id: 'favorite-2',
      title: 'Renamed card',
      target: networkTarget('WAP://EXAMPLE.TEST/start.wml#card-one'),
      updatedAt: '2026-07-30T12:01:00.000Z'
    });

    const pending = applyFavorite([existing], incoming);
    expect(pending.status).toBe('needs-resolution');
    expect(pending.favorites).toEqual([existing]);
    expect(pending.duplicateIds).toEqual([existing.id]);

    const kept = applyFavorite([existing], incoming, { outcome: 'keep-both' });
    expect(kept.status).toBe('kept-both');
    expect(kept.favorites).toEqual([existing, incoming]);

    const cancelled = applyFavorite([existing], incoming, { outcome: 'cancel' });
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.favorites).toEqual([existing]);

    const replaced = applyFavorite([existing], incoming, {
      outcome: 'replace',
      favoriteId: existing.id
    });
    expect(replaced.status).toBe('replaced');
    expect(replaced.favorites).toEqual([incoming]);
  });

  it('includes the reserved profile identity in duplicate detection', () => {
    const profileA = parseProfileId('profile-a');
    const profileB = parseProfileId('profile-b');
    expect(profileA.ok && profileB.ok).toBe(true);
    if (!profileA.ok || !profileB.ok) return;

    const existing = favorite({ profileId: profileA.value });
    const otherProfile = favorite({ id: 'favorite-2', profileId: profileB.value });
    expect(applyFavorite([existing], otherProfile).status).toBe('added');
  });

  it('treats different card fragments as different favorite identities', () => {
    const firstCard = favorite();
    const secondCard = favorite({
      id: 'favorite-2',
      target: networkTarget('wap://example.test/start.wml#card-two')
    });
    expect(applyFavorite([firstCard], secondCard).status).toBe('added');
  });

  it('does not overwrite a favorite when the replacement ID is not a duplicate', () => {
    const existing = favorite();
    const unrelated = favorite({
      id: 'unrelated',
      target: networkTarget('https://other.test/deck.wml')
    });
    const incoming = favorite({ id: 'incoming' });
    const result = applyFavorite([existing, unrelated], incoming, {
      outcome: 'replace',
      favoriteId: unrelated.id
    });
    expect(result.status).toBe('invalid-replacement');
    expect(result.favorites).toEqual([existing, unrelated]);
  });
});
