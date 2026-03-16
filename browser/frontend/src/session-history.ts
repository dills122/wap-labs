import type {
  FetchRequestPolicy,
  HostHistoryEntry,
  HostHistoryRequestIdentity,
  HostNavigationSource
} from '../../contracts/transport';

export interface HostHistoryState {
  entries: HostHistoryEntry[];
  index: number;
}

export const createHostHistoryState = (): HostHistoryState => ({
  entries: [],
  index: -1
});

export const pushHostHistoryEntry = (
  state: HostHistoryState,
  url: string,
  activeCardId?: string,
  source?: HostNavigationSource,
  requestIdentity?: HostHistoryRequestIdentity
): void => {
  const normalized = url.trim();
  if (!normalized) {
    return;
  }
  const normalizedIdentity = normalizeRequestIdentity(requestIdentity);
  if (
    state.index >= 0 &&
    isSameHistoryIdentity(state.entries[state.index], normalized, normalizedIdentity)
  ) {
    if (activeCardId) {
      state.entries[state.index].activeCardId = activeCardId;
    }
    if (source) {
      state.entries[state.index].source = source;
    }
    mergeRequestIdentity(state.entries[state.index], normalizedIdentity);
    return;
  }
  if (state.index < state.entries.length - 1) {
    state.entries.splice(state.index + 1);
  }
  state.entries.push({
    url: normalized,
    requestedUrl: normalizedIdentity.requestedUrl,
    method: normalizedIdentity.method,
    headers: cloneHeaders(normalizedIdentity.headers),
    requestPolicy: cloneRequestPolicy(normalizedIdentity.requestPolicy),
    activeCardId,
    source
  });
  state.index = state.entries.length - 1;
};

export const updateCurrentHistoryCard = (state: HostHistoryState, activeCardId?: string): void => {
  if (!activeCardId || state.index < 0) {
    return;
  }
  state.entries[state.index].activeCardId = activeCardId;
};

export const canHistoryBack = (state: HostHistoryState): boolean => state.index > 0;

export const peekHistoryBack = (state: HostHistoryState): HostHistoryEntry | null => {
  if (!canHistoryBack(state)) {
    return null;
  }
  return state.entries[state.index - 1] ?? null;
};

export const commitHistoryBack = (state: HostHistoryState): HostHistoryEntry | null => {
  if (!canHistoryBack(state)) {
    return null;
  }
  state.index -= 1;
  return state.entries[state.index] ?? null;
};

const normalizeRequestIdentity = (
  requestIdentity?: HostHistoryRequestIdentity
): HostHistoryRequestIdentity => {
  if (!requestIdentity) {
    return {};
  }
  const requestedUrl = requestIdentity.requestedUrl?.trim();
  const method = requestIdentity.method?.trim().toUpperCase();
  return {
    requestedUrl: requestedUrl || undefined,
    method: method || undefined,
    headers: normalizeHeaders(requestIdentity.headers),
    requestPolicy: cloneRequestPolicy(requestIdentity.requestPolicy)
  };
};

const isSameHistoryIdentity = (
  current: HostHistoryEntry | undefined,
  url: string,
  requestIdentity: HostHistoryRequestIdentity
): boolean => {
  if (!current || current.url !== url) {
    return false;
  }
  return (
    (current.requestedUrl ?? undefined) === requestIdentity.requestedUrl &&
    (normalizeMethod(current.method) ?? undefined) === requestIdentity.method &&
    headerSignature(current.headers) === headerSignature(requestIdentity.headers) &&
    requestPolicySignature(current.requestPolicy) ===
      requestPolicySignature(requestIdentity.requestPolicy)
  );
};

const mergeRequestIdentity = (
  entry: HostHistoryEntry,
  requestIdentity: HostHistoryRequestIdentity
): void => {
  if (requestIdentity.requestedUrl) {
    entry.requestedUrl = requestIdentity.requestedUrl;
  }
  if (requestIdentity.method) {
    entry.method = requestIdentity.method;
  }
  if (requestIdentity.headers) {
    entry.headers = cloneHeaders(requestIdentity.headers);
  }
  if (requestIdentity.requestPolicy) {
    entry.requestPolicy = cloneRequestPolicy(requestIdentity.requestPolicy);
  }
};

const normalizeMethod = (method?: string): string | undefined =>
  method?.trim().toUpperCase() || undefined;

const normalizeHeaders = (headers?: Record<string, string>): Record<string, string> | undefined => {
  if (!headers) {
    return undefined;
  }
  const entries = Object.entries(headers)
    .map(([name, value]) => [name.trim().toLowerCase(), value.trim()] as const)
    .filter(([name, value]) => name.length > 0 && value.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
};

const headerSignature = (headers?: Record<string, string>): string =>
  headers
    ? Object.entries(headers)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => `${name}:${value}`)
        .join('\n')
    : '';

const requestPolicySignature = (policy?: FetchRequestPolicy): string => {
  if (!policy) {
    return '';
  }
  const identity = {
    refererUrl: policy.refererUrl,
    postContext: policy.postContext
      ? {
          sameDeck: policy.postContext.sameDeck,
          contentType: policy.postContext.contentType,
          payload: policy.postContext.payload
        }
      : undefined
  };
  if (!identity.refererUrl && !identity.postContext) {
    return '';
  }
  return JSON.stringify(identity);
};

const cloneHeaders = (headers?: Record<string, string>): Record<string, string> | undefined =>
  headers ? { ...headers } : undefined;

const cloneRequestPolicy = (policy?: FetchRequestPolicy): FetchRequestPolicy | undefined => {
  if (!policy) {
    return undefined;
  }
  return {
    ...policy,
    postContext: policy.postContext ? { ...policy.postContext } : undefined
  };
};
