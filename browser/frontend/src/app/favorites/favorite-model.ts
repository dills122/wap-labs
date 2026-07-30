export type FavoriteId = string & { readonly __favoriteId: unique symbol };
export type FavoriteTitle = string & { readonly __favoriteTitle: unique symbol };
export type FavoriteTimestamp = string & { readonly __favoriteTimestamp: unique symbol };
export type ProfileId = string & { readonly __profileId: unique symbol };
export type LocalExampleId = string & { readonly __localExampleId: unique symbol };
export type NetworkTargetUrl = string & { readonly __networkTargetUrl: unique symbol };
export type LocalExampleFragment = string & { readonly __localExampleFragment: unique symbol };

export type FavoriteFieldIssueCode =
  | 'blank-id'
  | 'blank-title'
  | 'blank-target'
  | 'invalid-local-example-id'
  | 'invalid-fragment'
  | 'invalid-timestamp'
  | 'invalid-profile-id'
  | 'unsupported-scheme'
  | 'credential-bearing-url'
  | 'malformed-url'
  | 'malformed-record'
  | 'unexpected-field'
  | 'duplicate-id';

export interface FavoriteFieldIssue {
  code: FavoriteFieldIssueCode;
  message: string;
}

export type FavoriteValueResult<T> =
  { ok: true; value: T } | { ok: false; issue: FavoriteFieldIssue };

export interface NetworkFavoriteTarget {
  kind: 'network';
  url: NetworkTargetUrl;
  canonicalUrl: string;
}

export interface LocalExampleFavoriteTarget {
  kind: 'local-example';
  exampleId: LocalExampleId;
  fragment?: LocalExampleFragment;
}

export type FavoriteTarget = NetworkFavoriteTarget | LocalExampleFavoriteTarget;

export interface ValidFavoriteState {
  status: 'valid';
}

export interface QuarantinedFavoriteState {
  status: 'quarantined';
  issues: readonly FavoriteFieldIssue[];
}

export type FavoriteValidationState = ValidFavoriteState | QuarantinedFavoriteState;

export interface Favorite {
  id: FavoriteId;
  title: FavoriteTitle;
  target: FavoriteTarget;
  createdAt: FavoriteTimestamp;
  updatedAt: FavoriteTimestamp;
  /** Reserved for later evidence-backed compatibility profiles. */
  profileId?: ProfileId;
  validation: ValidFavoriteState;
}

export interface FavoriteInput {
  id: string;
  title: string;
  target: FavoriteTarget;
  createdAt: string;
  updatedAt: string;
  profileId?: string;
}

export type CreateFavoriteResult =
  { ok: true; favorite: Favorite } | { ok: false; issues: readonly FavoriteFieldIssue[] };

export type DuplicateDecision =
  { outcome: 'replace'; favoriteId: FavoriteId } | { outcome: 'keep-both' } | { outcome: 'cancel' };

export type ApplyFavoriteResult =
  | {
      status: 'added';
      favorites: readonly Favorite[];
      duplicateIds: readonly FavoriteId[];
    }
  | {
      status: 'needs-resolution';
      favorites: readonly Favorite[];
      duplicateIds: readonly FavoriteId[];
    }
  | {
      status: 'replaced';
      favorites: readonly Favorite[];
      duplicateIds: readonly FavoriteId[];
      replacedFavoriteId: FavoriteId;
    }
  | {
      status: 'kept-both';
      favorites: readonly Favorite[];
      duplicateIds: readonly FavoriteId[];
    }
  | {
      status: 'cancelled';
      favorites: readonly Favorite[];
      duplicateIds: readonly FavoriteId[];
    }
  | {
      status: 'id-conflict' | 'invalid-replacement';
      favorites: readonly Favorite[];
      duplicateIds: readonly FavoriteId[];
    };

const SUPPORTED_NETWORK_SCHEMES = new Set(['wap:', 'waps:', 'http:', 'https:']);
const LOCAL_EXAMPLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const issue = (code: FavoriteFieldIssueCode, message: string): FavoriteFieldIssue => ({
  code,
  message
});

const parseNonBlank = <T>(
  value: string,
  code: FavoriteFieldIssueCode,
  message: string
): FavoriteValueResult<T> => {
  const normalized = value.trim();
  return normalized
    ? { ok: true, value: normalized as T }
    : { ok: false, issue: issue(code, message) };
};

export const parseFavoriteId = (value: string): FavoriteValueResult<FavoriteId> =>
  parseNonBlank(value, 'blank-id', 'Favorite ID must not be blank.');

export const parseFavoriteTitle = (value: string): FavoriteValueResult<FavoriteTitle> =>
  parseNonBlank(value, 'blank-title', 'Favorite title must not be blank.');

export const parseProfileId = (value: string): FavoriteValueResult<ProfileId> =>
  parseNonBlank(value, 'invalid-profile-id', 'Profile ID must not be blank.');

export const parseFavoriteTimestamp = (value: string): FavoriteValueResult<FavoriteTimestamp> => {
  const normalized = value.trim();
  const isIsoTimestamp =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(normalized);
  const milliseconds = Date.parse(normalized);
  if (!isIsoTimestamp || !Number.isFinite(milliseconds)) {
    return {
      ok: false,
      issue: issue('invalid-timestamp', 'Favorite timestamp must be a valid ISO-8601 value.')
    };
  }
  return { ok: true, value: new Date(milliseconds).toISOString() as FavoriteTimestamp };
};

const hasExplicitUserInfo = (value: string): boolean => {
  const schemeSeparator = value.indexOf(':');
  const afterScheme = value.slice(schemeSeparator + 1);
  if (!afterScheme.startsWith('//')) return false;
  const authority = afterScheme.slice(2).split(/[/?#]/, 1)[0] ?? '';
  return authority.includes('@');
};

const canonicalizeWapUrl = (url: URL): string => {
  const hostname = url.hostname.toLowerCase();
  const host = url.port ? `${hostname}:${url.port}` : hostname;
  return `${url.protocol.toLowerCase()}//${host}${url.pathname}${url.search}${url.hash}`;
};

export const parseNetworkFavoriteTarget = (
  value: string
): FavoriteValueResult<NetworkFavoriteTarget> => {
  const normalized = value.trim();
  if (!normalized) {
    return {
      ok: false,
      issue: issue('blank-target', 'Favorite target must not be blank.')
    };
  }

  const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(normalized)?.[1]?.toLowerCase();
  if (!scheme || !SUPPORTED_NETWORK_SCHEMES.has(`${scheme}:`)) {
    return {
      ok: false,
      issue: issue(
        'unsupported-scheme',
        'Favorite network targets must use wap, waps, http, or https.'
      )
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return {
      ok: false,
      issue: issue('malformed-url', 'Favorite network target is not a valid absolute URL.')
    };
  }

  if (parsed.protocol.toLowerCase() !== `${scheme}:` || !parsed.hostname) {
    return {
      ok: false,
      issue: issue('malformed-url', 'Favorite network target is not a valid absolute URL.')
    };
  }
  if (parsed.username || parsed.password || hasExplicitUserInfo(normalized)) {
    return {
      ok: false,
      issue: issue(
        'credential-bearing-url',
        'Favorite network targets must not contain URL credentials.'
      )
    };
  }

  const canonicalUrl =
    scheme === 'wap' || scheme === 'waps' ? canonicalizeWapUrl(parsed) : parsed.href;
  return {
    ok: true,
    value: {
      kind: 'network',
      url: canonicalUrl as NetworkTargetUrl,
      canonicalUrl
    }
  };
};

const parseLocalExampleFragment = (
  value: string | undefined
): FavoriteValueResult<LocalExampleFragment | undefined> => {
  if (value === undefined || value === '') return { ok: true, value: undefined };
  if (!value.startsWith('#') || /[\u0000-\u001f\u007f]/.test(value)) {
    return {
      ok: false,
      issue: issue('invalid-fragment', 'Local example fragments must begin with # and be valid.')
    };
  }
  const normalized = new URL(value, 'http://local.invalid/').hash;
  return {
    ok: true,
    value: normalized === '#' ? undefined : (normalized as LocalExampleFragment)
  };
};

export const parseLocalExampleFavoriteTarget = (
  exampleId: string,
  fragment?: string
): FavoriteValueResult<LocalExampleFavoriteTarget> => {
  const normalizedId = exampleId.trim();
  if (!LOCAL_EXAMPLE_ID_PATTERN.test(normalizedId)) {
    return {
      ok: false,
      issue: issue(
        'invalid-local-example-id',
        'Local example ID must use letters, numbers, dot, underscore, or hyphen.'
      )
    };
  }
  const parsedFragment = parseLocalExampleFragment(fragment);
  if (!parsedFragment.ok) return parsedFragment;
  return {
    ok: true,
    value: {
      kind: 'local-example',
      exampleId: normalizedId as LocalExampleId,
      ...(parsedFragment.value === undefined ? {} : { fragment: parsedFragment.value })
    }
  };
};

export const createFavorite = (input: FavoriteInput): CreateFavoriteResult => {
  const id = parseFavoriteId(input.id);
  const title = parseFavoriteTitle(input.title);
  const createdAt = parseFavoriteTimestamp(input.createdAt);
  const updatedAt = parseFavoriteTimestamp(input.updatedAt);
  const profileId = input.profileId === undefined ? undefined : parseProfileId(input.profileId);
  const issues = [id, title, createdAt, updatedAt, profileId]
    .filter((result): result is { ok: false; issue: FavoriteFieldIssue } => result?.ok === false)
    .map((result) => result.issue);

  if (createdAt.ok && updatedAt.ok && updatedAt.value < createdAt.value) {
    issues.push(issue('invalid-timestamp', 'Favorite update time must not precede creation time.'));
  }
  if (issues.length > 0 || !id.ok || !title.ok || !createdAt.ok || !updatedAt.ok) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    favorite: {
      id: id.value,
      title: title.value,
      target: input.target,
      createdAt: createdAt.value,
      updatedAt: updatedAt.value,
      ...(profileId?.ok ? { profileId: profileId.value } : {}),
      validation: { status: 'valid' }
    }
  };
};

export const canonicalFavoriteTarget = (target: FavoriteTarget): string =>
  target.kind === 'network'
    ? target.canonicalUrl
    : `local-example:${target.exampleId}${target.fragment ?? ''}`;

export const favoriteDuplicateKey = (target: FavoriteTarget, profileId?: ProfileId): string =>
  JSON.stringify([target.kind, canonicalFavoriteTarget(target), profileId ?? null]);

export const findFavoriteDuplicates = (
  favorites: readonly Favorite[],
  candidate: Pick<Favorite, 'target' | 'profileId'>
): readonly Favorite[] => {
  const candidateKey = favoriteDuplicateKey(candidate.target, candidate.profileId);
  return favorites.filter(
    (favorite) => favoriteDuplicateKey(favorite.target, favorite.profileId) === candidateKey
  );
};

export const applyFavorite = (
  favorites: readonly Favorite[],
  incoming: Favorite,
  decision?: DuplicateDecision
): ApplyFavoriteResult => {
  if (favorites.some((favorite) => favorite.id === incoming.id)) {
    return { status: 'id-conflict', favorites, duplicateIds: [] };
  }

  const duplicates = findFavoriteDuplicates(favorites, incoming);
  const duplicateIds = duplicates.map((favorite) => favorite.id);
  if (duplicates.length === 0) {
    return { status: 'added', favorites: [...favorites, incoming], duplicateIds };
  }
  if (!decision) return { status: 'needs-resolution', favorites, duplicateIds };
  if (decision.outcome === 'cancel') {
    return { status: 'cancelled', favorites, duplicateIds };
  }
  if (decision.outcome === 'keep-both') {
    return { status: 'kept-both', favorites: [...favorites, incoming], duplicateIds };
  }
  if (!duplicateIds.includes(decision.favoriteId)) {
    return { status: 'invalid-replacement', favorites, duplicateIds };
  }
  return {
    status: 'replaced',
    favorites: favorites.map((favorite) =>
      favorite.id === decision.favoriteId ? incoming : favorite
    ),
    duplicateIds,
    replacedFavoriteId: decision.favoriteId
  };
};
