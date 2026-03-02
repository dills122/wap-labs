import type { HostHistoryEntry, HostNavigationSource } from '../../contracts/transport';

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
  source?: HostNavigationSource
): void => {
  const normalized = url.trim();
  if (!normalized) {
    return;
  }
  if (state.index >= 0 && state.entries[state.index]?.url === normalized) {
    if (activeCardId) {
      state.entries[state.index].activeCardId = activeCardId;
    }
    if (source) {
      state.entries[state.index].source = source;
    }
    return;
  }
  if (state.index < state.entries.length - 1) {
    state.entries.splice(state.index + 1);
  }
  state.entries.push({ url: normalized, activeCardId, source });
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
