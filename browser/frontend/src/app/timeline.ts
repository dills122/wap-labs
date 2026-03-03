import type { HostSessionState } from '../../../contracts/transport';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';

export interface TimelineEntry {
  seq: number;
  action: string;
  phase: 'start' | 'ok' | 'error' | 'state';
  session: HostSessionState;
  details?: Record<string, unknown>;
}

export interface TimelineState {
  entries: TimelineEntry[];
  nextSeq: number;
}

export interface TimelineExportPayload {
  schemaVersion: number;
  timelineLength: number;
  latestSessionState: HostSessionState;
  timeline: Array<{
    seq: number;
    action: string;
    phase: TimelineEntry['phase'];
    session: HostSessionState;
    details?: Record<string, unknown>;
  }>;
}

export const createTimelineState = (): TimelineState => ({
  entries: [],
  nextSeq: 1
});

export const appendTimelineEntry = (
  state: TimelineState,
  maxEntries: number,
  action: string,
  phase: TimelineEntry['phase'],
  session: HostSessionState,
  details?: Record<string, unknown>
): TimelineState => {
  const entry: TimelineEntry = {
    seq: state.nextSeq,
    action,
    phase,
    session,
    ...(details ? { details } : {})
  };
  const entries = [...state.entries, entry];
  const trimmed =
    entries.length > maxEntries ? entries.slice(entries.length - maxEntries) : entries;
  return {
    entries: trimmed,
    nextSeq: state.nextSeq + 1
  };
};

export const clearTimelineState = (): TimelineState => createTimelineState();

export const buildTimelineExport = (
  entries: TimelineEntry[],
  latestSessionState: HostSessionState
): TimelineExportPayload => ({
  schemaVersion: WAVES_CONFIG.timelineSchemaVersion,
  timelineLength: entries.length,
  latestSessionState,
  timeline: entries.map((entry) => ({
    seq: entry.seq,
    action: entry.action,
    phase: entry.phase,
    session: entry.session,
    ...(entry.details ? { details: entry.details } : {})
  }))
});

export const validateTimelineExport = (payload: { timeline?: unknown }): void => {
  const timeline = payload.timeline;
  if (!Array.isArray(timeline) || timeline.length === 0) {
    throw new Error(WAVES_COPY.errors.timelineRequiresEvent);
  }
  const hasState = timeline.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'phase' in entry &&
      (entry as { phase: string }).phase === 'state'
  );
  const hasAction = timeline.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'phase' in entry &&
      (entry as { phase: string }).phase !== 'state'
  );
  if (!hasState || !hasAction) {
    throw new Error(WAVES_COPY.errors.timelineRequiresChronology);
  }
};
