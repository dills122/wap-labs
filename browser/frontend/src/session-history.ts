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

// A 32-entry host window preserves the current deck plus 31 deterministic WML
// Back steps. That is useful constrained-device history without allowing exact
// POST replay credentials to accumulate for the lifetime of the application.
export const HOST_HISTORY_ENTRY_CAPACITY = 32;
export const RETAINED_WML_BACK_DEPTH = HOST_HISTORY_ENTRY_CAPACITY - 1;

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
  const overflow = state.entries.length - HOST_HISTORY_ENTRY_CAPACITY;
  if (overflow > 0) {
    state.entries.splice(0, overflow);
  }
  state.index = state.entries.length - 1;
};

export const resetHostHistoryState = (state: HostHistoryState): void => {
  state.entries.splice(0);
  state.index = -1;
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

const cloneHeaders = (headers?: Record<string, string>): Record<string, string> | undefined =>
  headers ? { ...headers } : undefined;

const cloneRequestPolicy = (policy?: FetchRequestPolicy): FetchRequestPolicy | undefined => {
  if (!policy) {
    return undefined;
  }
  return {
    ...policy,
    postContext: policy.postContext ? { ...policy.postContext } : undefined,
    requestIntent: policy.requestIntent
      ? {
          ...policy.requestIntent,
          postFields: policy.requestIntent.postFields.map((field) => ({ ...field }))
        }
      : undefined
  };
};
