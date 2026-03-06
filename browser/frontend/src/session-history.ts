import type {
  FetchRequestPolicy,
  HostHistoryEntry,
  HostNavigationSource
} from '../../contracts/transport';

export interface HostHistoryState {
  entries: HostHistoryEntry[];
  index: number;
}

export interface HostHistoryRequestIdentity {
  requestedUrl?: string;
  method?: string;
  requestPolicy?: FetchRequestPolicy;
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
    postPayloadFromPolicy(current.requestPolicy) ===
      postPayloadFromPolicy(requestIdentity.requestPolicy)
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
  if (requestIdentity.requestPolicy) {
    entry.requestPolicy = cloneRequestPolicy(requestIdentity.requestPolicy);
  }
};

const normalizeMethod = (method?: string): string | undefined =>
  method?.trim().toUpperCase() || undefined;

const postPayloadFromPolicy = (policy?: FetchRequestPolicy): string | undefined =>
  policy?.postContext?.payload ?? undefined;

const cloneRequestPolicy = (policy?: FetchRequestPolicy): FetchRequestPolicy | undefined => {
  if (!policy) {
    return undefined;
  }
  return {
    ...policy,
    postContext: policy.postContext ? { ...policy.postContext } : undefined
  };
};
