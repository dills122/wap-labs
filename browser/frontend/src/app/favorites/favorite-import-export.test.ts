import { describe, expect, it } from 'vitest';
import fiftyRecordFixture from './fixtures/favorites-v1-50.json?raw';
import {
  FAVORITES_SCHEMA_VERSION,
  exportFavoritesJson,
  importFavoritesJson
} from './favorite-import-export';
import {
  createFavorite,
  parseLocalExampleFavoriteTarget,
  parseNetworkFavoriteTarget,
  type Favorite
} from './favorite-model';

const generatedFavorite = (index: number): Favorite => {
  const schemes = ['wap', 'waps', 'http', 'https'] as const;
  const scheme = schemes[index % schemes.length];
  const target =
    index % 3 !== 0
      ? parseNetworkFavoriteTarget(
          `${scheme}://host-${index % 7}.example.test/deck-${index}.wml#card-${index}`
        )
      : parseLocalExampleFavoriteTarget(`example-${index}`, `#card-${index}`);
  expect(target.ok).toBe(true);
  if (!target.ok) throw new Error(target.issue.message);

  const favorite = createFavorite({
    id: `generated-${index}`,
    title: `Generated favorite ${index}`,
    target: target.value,
    createdAt: `2026-07-30T12:${String(index % 60).padStart(2, '0')}:00.000Z`,
    updatedAt: `2026-07-30T12:${String(index % 60).padStart(2, '0')}:30.000Z`,
    ...(index % 3 === 0 ? { profileId: 'class-c-reference' } : {})
  });
  expect(favorite.ok).toBe(true);
  if (!favorite.ok) throw new Error(favorite.issues.map((entry) => entry.message).join(', '));
  return favorite.favorite;
};

describe('favorites JSON import and export', () => {
  it('round-trips generated valid favorites without fragment or variant loss', () => {
    const favorites = Array.from({ length: 64 }, (_, index) => generatedFavorite(index));
    const imported = importFavoritesJson(exportFavoritesJson(favorites));

    expect(imported.status).toBe('imported');
    if (imported.status !== 'imported') return;
    expect(imported.quarantined).toEqual([]);
    expect(imported.duplicates).toEqual([]);
    expect(imported.favorites).toEqual(favorites);
    expect(
      imported.favorites.every((entry) => {
        const expectedFragment = `#card-${entry.id.split('-').at(-1)}`;
        return entry.target.kind === 'network'
          ? entry.target.url.endsWith(expectedFragment)
          : entry.target.fragment === expectedFragment;
      })
    ).toBe(true);
  });

  it('imports the 50-record v1 fixture without loss', () => {
    const imported = importFavoritesJson(fiftyRecordFixture);
    expect(imported.status).toBe('imported');
    if (imported.status !== 'imported') return;
    expect(imported.favorites).toHaveLength(50);
    expect(imported.quarantined).toEqual([]);
    expect(imported.duplicates).toEqual([]);
    expect(imported.favorites[49]?.target).toEqual(
      expect.objectContaining({ url: expect.stringContaining('#card-50') })
    );
  });

  it('quarantines invalid records and reports canonical duplicates without dropping them', () => {
    const serialized = JSON.stringify({
      schemaVersion: FAVORITES_SCHEMA_VERSION,
      favorites: [
        {
          id: 'one',
          title: 'Original',
          target: { kind: 'network', url: 'http://EXAMPLE.test:80/deck.wml#card' },
          createdAt: '2026-07-30T12:00:00.000Z',
          updatedAt: '2026-07-30T12:00:00.000Z'
        },
        {
          id: 'two',
          title: 'Duplicate',
          target: { kind: 'network', url: 'http://example.test/deck.wml#card' },
          createdAt: '2026-07-30T12:01:00.000Z',
          updatedAt: '2026-07-30T12:01:00.000Z'
        },
        {
          id: 'unsafe',
          title: 'Unsafe',
          target: { kind: 'network', url: 'https://user:secret@example.test/deck.wml' },
          createdAt: '2026-07-30T12:02:00.000Z',
          updatedAt: '2026-07-30T12:02:00.000Z'
        },
        {
          id: 'generic-shape',
          title: 'No folders in v1',
          target: { kind: 'network', url: 'wap://example.test/deck.wml' },
          createdAt: '2026-07-30T12:03:00.000Z',
          updatedAt: '2026-07-30T12:03:00.000Z',
          tags: ['imported']
        }
      ]
    });

    const imported = importFavoritesJson(serialized);
    expect(imported.status).toBe('imported');
    if (imported.status !== 'imported') return;
    expect(imported.favorites.map((entry) => entry.id)).toEqual(['one', 'two']);
    expect(imported.duplicates).toEqual([
      { recordIndex: 1, incomingFavoriteId: 'two', matchingFavoriteIds: ['one'] }
    ]);
    expect(imported.quarantined).toHaveLength(2);
    expect(imported.quarantined[0]?.candidate.target).toBe('[credential-bearing URL removed]');
    expect(JSON.stringify(imported.quarantined)).not.toContain('secret');
    expect(imported.quarantined[1]?.validation.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'unexpected-field' })])
    );
  });

  it('quarantines duplicate IDs instead of overwriting either record silently', () => {
    const original = generatedFavorite(1);
    const duplicateIdDocument = JSON.parse(exportFavoritesJson([original])) as {
      schemaVersion: number;
      favorites: Array<Record<string, unknown>>;
    };
    duplicateIdDocument.favorites.push({
      ...duplicateIdDocument.favorites[0],
      title: 'Conflicting identity',
      target: { kind: 'network', url: 'wap://different.example.test/deck.wml' }
    });

    const imported = importFavoritesJson(JSON.stringify(duplicateIdDocument));
    expect(imported.status).toBe('imported');
    if (imported.status !== 'imported') return;
    expect(imported.favorites).toEqual([original]);
    expect(imported.quarantined).toEqual([
      expect.objectContaining({
        recordIndex: 1,
        validation: expect.objectContaining({
          issues: [expect.objectContaining({ code: 'duplicate-id' })]
        })
      })
    ]);
  });

  it.each([
    ['{', 'malformed-json'],
    [JSON.stringify([]), 'malformed-document'],
    [JSON.stringify({ schemaVersion: 2, favorites: [] }), 'future-schema-version'],
    [JSON.stringify({ schemaVersion: 0, favorites: [] }), 'unsupported-schema-version'],
    [JSON.stringify({ roots: { bookmark_bar: { children: [] } } }), 'unsupported-schema-version']
  ])('rejects malformed, future, and generic-browser documents safely', (serialized, code) => {
    const result = importFavoritesJson(serialized);
    expect(result).toEqual(
      expect.objectContaining({
        status: 'rejected',
        code,
        favorites: [],
        quarantined: [],
        duplicates: []
      })
    );
  });
});
