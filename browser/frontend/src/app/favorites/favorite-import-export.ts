import {
  createFavorite,
  findFavoriteDuplicates,
  parseLocalExampleFavoriteTarget,
  parseNetworkFavoriteTarget,
  type Favorite,
  type FavoriteFieldIssue,
  type FavoriteId,
  type FavoriteTarget,
  type QuarantinedFavoriteState
} from './favorite-model';

export const FAVORITES_SCHEMA_VERSION = 1 as const;

export interface NetworkFavoriteTargetDto {
  kind: 'network';
  url: string;
}

export interface LocalExampleFavoriteTargetDto {
  kind: 'local-example';
  exampleId: string;
  fragment?: string;
}

export type FavoriteTargetDto = NetworkFavoriteTargetDto | LocalExampleFavoriteTargetDto;

export interface FavoriteDto {
  id: string;
  title: string;
  target: FavoriteTargetDto;
  createdAt: string;
  updatedAt: string;
  profileId?: string;
}

export interface FavoritesDocumentV1 {
  schemaVersion: typeof FAVORITES_SCHEMA_VERSION;
  favorites: FavoriteDto[];
}

export interface QuarantinedFavoriteRecord {
  recordIndex: number;
  candidate: {
    id?: string;
    title?: string;
    target?: string;
  };
  validation: QuarantinedFavoriteState;
}

export interface FavoriteDuplicateConflict {
  recordIndex: number;
  incomingFavoriteId: FavoriteId;
  matchingFavoriteIds: readonly FavoriteId[];
}

export type FavoritesImportRejectionCode =
  'malformed-json' | 'malformed-document' | 'unsupported-schema-version' | 'future-schema-version';

export type ImportFavoritesResult =
  | {
      status: 'imported';
      favorites: readonly Favorite[];
      quarantined: readonly QuarantinedFavoriteRecord[];
      duplicates: readonly FavoriteDuplicateConflict[];
    }
  | {
      status: 'rejected';
      code: FavoritesImportRejectionCode;
      message: string;
      favorites: readonly [];
      quarantined: readonly [];
      duplicates: readonly [];
    };

const FAVORITES_DOCUMENT_KEYS = new Set(['schemaVersion', 'favorites']);
const FAVORITE_RECORD_KEYS = new Set([
  'id',
  'title',
  'target',
  'createdAt',
  'updatedAt',
  'profileId'
]);
const NETWORK_TARGET_KEYS = new Set(['kind', 'url']);
const LOCAL_EXAMPLE_TARGET_KEYS = new Set(['kind', 'exampleId', 'fragment']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unexpectedKeys = (record: Record<string, unknown>, allowed: ReadonlySet<string>): string[] =>
  Object.keys(record).filter((key) => !allowed.has(key));

const importIssue = (code: FavoriteFieldIssue['code'], message: string): FavoriteFieldIssue => ({
  code,
  message
});

const toTargetDto = (target: FavoriteTarget): FavoriteTargetDto =>
  target.kind === 'network'
    ? { kind: 'network', url: target.url }
    : {
        kind: 'local-example',
        exampleId: target.exampleId,
        ...(target.fragment === undefined ? {} : { fragment: target.fragment })
      };

const toFavoriteDto = (favorite: Favorite): FavoriteDto => ({
  id: favorite.id,
  title: favorite.title,
  target: toTargetDto(favorite.target),
  createdAt: favorite.createdAt,
  updatedAt: favorite.updatedAt,
  ...(favorite.profileId === undefined ? {} : { profileId: favorite.profileId })
});

export const exportFavoritesJson = (favorites: readonly Favorite[]): string =>
  JSON.stringify(
    {
      schemaVersion: FAVORITES_SCHEMA_VERSION,
      favorites: favorites.map(toFavoriteDto)
    } satisfies FavoritesDocumentV1,
    null,
    2
  );

const safeStringPreview = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.slice(0, 160) : undefined;

const safeTargetPreview = (value: unknown): string | undefined => {
  if (!isRecord(value)) return undefined;
  if (value.kind === 'local-example') {
    const exampleId = safeStringPreview(value.exampleId);
    const fragment = safeStringPreview(value.fragment);
    return exampleId ? `local-example:${exampleId}${fragment ?? ''}` : 'local-example:[invalid]';
  }
  if (value.kind !== 'network' || typeof value.url !== 'string') return undefined;
  const parsed = parseNetworkFavoriteTarget(value.url);
  if (parsed.ok) return parsed.value.url;
  if (parsed.issue.code === 'credential-bearing-url') return '[credential-bearing URL removed]';
  return '[unsafe or invalid network target omitted]';
};

const quarantine = (
  record: unknown,
  recordIndex: number,
  issues: readonly FavoriteFieldIssue[]
): QuarantinedFavoriteRecord => ({
  recordIndex,
  candidate: isRecord(record)
    ? {
        ...(safeStringPreview(record.id) === undefined ? {} : { id: safeStringPreview(record.id) }),
        ...(safeStringPreview(record.title) === undefined
          ? {}
          : { title: safeStringPreview(record.title) }),
        ...(safeTargetPreview(record.target) === undefined
          ? {}
          : { target: safeTargetPreview(record.target) })
      }
    : {},
  validation: { status: 'quarantined', issues }
});

const parseTarget = (
  value: unknown
): { ok: true; target: FavoriteTarget } | { ok: false; issues: FavoriteFieldIssue[] } => {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    return {
      ok: false,
      issues: [importIssue('malformed-record', 'Favorite target must be a typed object.')]
    };
  }

  if (value.kind === 'network') {
    const issues: FavoriteFieldIssue[] = unexpectedKeys(value, NETWORK_TARGET_KEYS).map((key) =>
      importIssue('unexpected-field', `Network favorite target contains unsupported field ${key}.`)
    );
    if (typeof value.url !== 'string') {
      issues.push(importIssue('malformed-record', 'Network favorite target URL must be a string.'));
      return { ok: false, issues };
    }
    const parsed = parseNetworkFavoriteTarget(value.url);
    if (!parsed.ok) {
      issues.push(parsed.issue);
      return { ok: false, issues };
    }
    return issues.length > 0 ? { ok: false, issues } : { ok: true, target: parsed.value };
  }

  if (value.kind === 'local-example') {
    const issues: FavoriteFieldIssue[] = unexpectedKeys(value, LOCAL_EXAMPLE_TARGET_KEYS).map(
      (key) =>
        importIssue(
          'unexpected-field',
          `Local example favorite target contains unsupported field ${key}.`
        )
    );
    if (typeof value.exampleId !== 'string') {
      issues.push(importIssue('malformed-record', 'Local example ID must be a string.'));
      return { ok: false, issues };
    }
    if (value.fragment !== undefined && typeof value.fragment !== 'string') {
      issues.push(importIssue('malformed-record', 'Local example fragment must be a string.'));
      return { ok: false, issues };
    }
    const parsed = parseLocalExampleFavoriteTarget(value.exampleId, value.fragment);
    if (!parsed.ok) {
      issues.push(parsed.issue);
      return { ok: false, issues };
    }
    return issues.length > 0 ? { ok: false, issues } : { ok: true, target: parsed.value };
  }

  return {
    ok: false,
    issues: [
      importIssue('malformed-record', 'Favorite target kind must be network or local-example.')
    ]
  };
};

const parseFavoriteRecord = (
  value: unknown
): { ok: true; favorite: Favorite } | { ok: false; issues: FavoriteFieldIssue[] } => {
  if (!isRecord(value)) {
    return {
      ok: false,
      issues: [importIssue('malformed-record', 'Favorite record must be an object.')]
    };
  }

  const issues = unexpectedKeys(value, FAVORITE_RECORD_KEYS).map((key) =>
    importIssue('unexpected-field', `Favorite record contains unsupported field ${key}.`)
  );
  const stringFields = ['id', 'title', 'createdAt', 'updatedAt'] as const;
  for (const field of stringFields) {
    if (typeof value[field] !== 'string') {
      issues.push(importIssue('malformed-record', `Favorite ${field} must be a string.`));
    }
  }
  if (value.profileId !== undefined && typeof value.profileId !== 'string') {
    issues.push(
      importIssue('malformed-record', 'Favorite profileId must be a string when present.')
    );
  }
  const parsedTarget = parseTarget(value.target);
  if (!parsedTarget.ok) issues.push(...parsedTarget.issues);
  if (
    issues.length > 0 ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    !parsedTarget.ok
  ) {
    return { ok: false, issues };
  }

  const created = createFavorite({
    id: value.id,
    title: value.title,
    target: parsedTarget.target,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    ...(typeof value.profileId === 'string' ? { profileId: value.profileId } : {})
  });
  return created.ok
    ? { ok: true, favorite: created.favorite }
    : { ok: false, issues: [...created.issues] };
};

const rejected = (code: FavoritesImportRejectionCode, message: string): ImportFavoritesResult => ({
  status: 'rejected',
  code,
  message,
  favorites: [],
  quarantined: [],
  duplicates: []
});

export const importFavoritesJson = (
  serialized: string,
  existingFavorites: readonly Favorite[] = []
): ImportFavoritesResult => {
  let document: unknown;
  try {
    document = JSON.parse(serialized) as unknown;
  } catch {
    return rejected('malformed-json', 'Favorites import is not valid JSON.');
  }
  if (!isRecord(document)) {
    return rejected('malformed-document', 'Favorites import root must be an object.');
  }
  if (
    typeof document.schemaVersion === 'number' &&
    document.schemaVersion > FAVORITES_SCHEMA_VERSION
  ) {
    return rejected(
      'future-schema-version',
      `Favorites schema version ${document.schemaVersion} is newer than this application supports.`
    );
  }
  if (document.schemaVersion !== FAVORITES_SCHEMA_VERSION) {
    return rejected(
      'unsupported-schema-version',
      `Favorites import must use schema version ${FAVORITES_SCHEMA_VERSION}.`
    );
  }
  if (
    !Array.isArray(document.favorites) ||
    unexpectedKeys(document, FAVORITES_DOCUMENT_KEYS).length > 0
  ) {
    return rejected(
      'malformed-document',
      'Favorites import must contain only schemaVersion and a favorites array.'
    );
  }

  const favorites: Favorite[] = [];
  const quarantined: QuarantinedFavoriteRecord[] = [];
  const duplicates: FavoriteDuplicateConflict[] = [];
  const knownIds = new Set(existingFavorites.map((favorite) => favorite.id));

  document.favorites.forEach((record, recordIndex) => {
    const parsed = parseFavoriteRecord(record);
    if (!parsed.ok) {
      quarantined.push(quarantine(record, recordIndex, parsed.issues));
      return;
    }
    if (knownIds.has(parsed.favorite.id)) {
      quarantined.push(
        quarantine(record, recordIndex, [
          importIssue(
            'duplicate-id',
            'Favorite ID is already present in this import or collection.'
          )
        ])
      );
      return;
    }

    const matchingFavorites = findFavoriteDuplicates(
      [...existingFavorites, ...favorites],
      parsed.favorite
    );
    if (matchingFavorites.length > 0) {
      duplicates.push({
        recordIndex,
        incomingFavoriteId: parsed.favorite.id,
        matchingFavoriteIds: matchingFavorites.map((favorite) => favorite.id)
      });
    }
    knownIds.add(parsed.favorite.id);
    favorites.push(parsed.favorite);
  });

  return { status: 'imported', favorites, quarantined, duplicates };
};
