import type {
  EngineDebugErrorCode,
  EngineDebugEvent,
  EngineDebugEventKind,
  EngineDebugEventPayload,
  EngineDebugValue
} from '../../../contracts/engine';
import { ENGINE_DEBUG_CONSUMER_LIMITS, projectEngineDebugSnapshot } from './engine-debug-capture';
import type {
  EngineDebugEventGroup,
  EngineDebugInspectorPhase,
  EngineDebugStoreState
} from './engine-debug-store';

export interface EngineDebugEventRow {
  seq: string;
  kind: EngineDebugEventKind;
  monotonicTime: string;
  cardId?: string;
  summary: string;
}

export interface EngineDebugInspectorViewModel {
  phase: EngineDebugInspectorPhase;
  statusLabel: string;
  statusDetail: string;
  policyLabel: string;
  canStart: boolean;
  canStop: boolean;
  canSnapshot: boolean;
  canExport: boolean;
  busy: boolean;
  filter: {
    group: EngineDebugEventGroup;
    query: string;
  };
  retainedEventCount: number;
  matchingEventCount: number;
  renderedEventCount: number;
  producerDroppedEvents: number;
  frontendDroppedEvents: number;
  rows: EngineDebugEventRow[];
  snapshotText: string;
  snapshotSummary: string;
  capacitySummary: string;
}

export const ENGINE_DEBUG_EVENT_GROUPS: ReadonlyArray<{
  value: EngineDebugEventGroup;
  label: string;
}> = [
  { value: 'all', label: 'All events' },
  { value: 'deck', label: 'Deck and card' },
  { value: 'navigation', label: 'Navigation and focus' },
  { value: 'input', label: 'Input editing' },
  { value: 'action', label: 'Actions and fields' },
  { value: 'script', label: 'Scripts' },
  { value: 'timer', label: 'Timers' }
];

const ERROR_MESSAGES: Record<EngineDebugErrorCode, string> = {
  DEBUG_DISABLED:
    'The local host policy is disabled. Set WAVES_ENGINE_DEBUG_POLICY=enabled before launch.',
  UNSUPPORTED_PROTOCOL_VERSION: 'The host does not support Inspector protocol version 1.',
  SESSION_LIMIT_REACHED: 'Another local Inspector session is already open. Close it and try again.',
  SESSION_NOT_FOUND: 'The Inspector session expired. Start a new local session.',
  INVALID_CURSOR: 'The event cursor was rejected. Start a new local session.',
  INVALID_REQUEST: 'The bounded Inspector request was rejected.',
  DEBUG_SOURCE_UNAVAILABLE: 'The engine diagnostic source is temporarily unavailable.',
  INTERNAL_ERROR: 'The Inspector stopped after a sanitized host error.'
};

const phaseStatus = (
  phase: EngineDebugInspectorPhase,
  errorCode: EngineDebugErrorCode | undefined
): { label: string; detail: string } => {
  switch (phase) {
    case 'idle':
      return {
        label: 'Off',
        detail:
          'Read-only and disabled by default. Starting requires the local host policy at launch.'
      };
    case 'opening':
      return { label: 'Starting', detail: 'Opening one bounded local debug session.' };
    case 'active':
      return {
        label: 'Capturing',
        detail: 'Read-only polling is active while an Inspector surface is visible.'
      };
    case 'closing':
      return { label: 'Stopping', detail: 'Polling is stopped and the local session is closing.' };
    case 'unavailable':
    case 'error':
      return {
        label: phase === 'unavailable' ? 'Policy disabled' : 'Stopped after error',
        detail: errorCode ? ERROR_MESSAGES[errorCode] : ERROR_MESSAGES.INTERNAL_ERROR
      };
  }
};

const displayValue = (value: EngineDebugValue): string => {
  if (value.state === 'visible') {
    return value.value.slice(0, 160);
  }
  return `[${value.state}: ${value.reason}]`;
};

const describePayload = (payload: EngineDebugEventPayload): string => {
  switch (payload.type) {
    case 'deck-load':
      return `${payload.cardCount} cards · ${payload.contentType} · ${displayValue(payload.baseUrl)}`;
    case 'card-enter':
      return 'Entered card';
    case 'card-exit':
      return 'Exited card';
    case 'focus-change':
      return `${payload.previousIndex ?? 'none'} → ${payload.currentIndex ?? 'none'}`;
    case 'input-edit-start':
      return `Started ${payload.name}`;
    case 'input-edit-draft':
      return `${payload.name} = ${displayValue(payload.value)}`;
    case 'input-edit-commit':
      return `${payload.name} committed as ${displayValue(payload.value)}`;
    case 'input-edit-cancel':
      return `Cancelled ${payload.name}`;
    case 'action-accept':
      return `${payload.actionType}${payload.name ? ` · ${payload.name}` : ''}`;
    case 'action-external':
      return `External target ${displayValue(payload.target)}`;
    case 'navigation-intent':
      return `Target ${displayValue(payload.target)}`;
    case 'postfield-resolve':
      return `${payload.fields.length} bounded field${payload.fields.length === 1 ? '' : 's'}`;
    case 'script-invoke':
      return `${displayValue(payload.source)} · ${payload.functionName}`;
    case 'script-trap':
      return `${payload.functionName} · ${displayValue(payload.detail)}`;
    case 'timer-schedule':
      return `${payload.delayMs} ms · ${displayValue(payload.token)}`;
    case 'timer-fire':
    case 'timer-cancel':
      return displayValue(payload.token);
  }
};

const groupForKind = (kind: EngineDebugEventKind): EngineDebugEventGroup => {
  if (kind.startsWith('deck.') || kind.startsWith('card.')) return 'deck';
  if (kind.startsWith('nav.') || kind.startsWith('focus.')) return 'navigation';
  if (kind.startsWith('input.')) return 'input';
  if (kind.startsWith('action.') || kind.startsWith('postfield.')) return 'action';
  if (kind.startsWith('script.')) return 'script';
  return 'timer';
};

const rowFromEvent = (event: EngineDebugEvent): EngineDebugEventRow => ({
  seq: event.seq,
  kind: event.kind,
  monotonicTime: `${event.monotonicTimeMs} ms`,
  ...(event.cardId === undefined ? {} : { cardId: event.cardId }),
  summary: describePayload(event.payload)
});

const matchesFilter = (
  event: EngineDebugEvent,
  group: EngineDebugEventGroup,
  query: string
): boolean => {
  if (group !== 'all' && groupForKind(event.kind) !== group) return false;
  if (!query) return true;
  const row = rowFromEvent(event);
  return `${row.seq} ${row.kind} ${row.cardId ?? ''} ${row.summary}`
    .toLowerCase()
    .includes(query.toLowerCase());
};

export const buildEngineDebugInspectorViewModel = (
  state: EngineDebugStoreState
): EngineDebugInspectorViewModel => {
  const matchingEvents = state.events.filter((event) =>
    matchesFilter(event, state.filter.group, state.filter.query)
  );
  const renderedEvents = matchingEvents.slice(-ENGINE_DEBUG_CONSUMER_LIMITS.renderedRows);
  const status = phaseStatus(state.phase, state.errorCode);
  const snapshotForView = state.snapshot
    ? projectEngineDebugSnapshot(state.snapshot, {
        textLimit: 256,
        variableLimit: 32,
        timerLimit: 16
      })
    : undefined;
  return {
    phase: state.phase,
    statusLabel: status.label,
    statusDetail: status.detail,
    policyLabel:
      state.policy === 'enabled'
        ? 'Local policy enabled'
        : state.policy === 'disabled'
          ? 'Local policy disabled'
          : state.policy === 'unknown'
            ? 'Local policy unknown'
            : 'Disabled by default',
    canStart: ['idle', 'unavailable', 'error'].includes(state.phase),
    canStop: state.phase === 'active',
    canSnapshot: state.phase === 'active' && Boolean(state.capabilities?.supportsSnapshots),
    canExport: state.events.length > 0 || state.snapshot !== undefined,
    busy: state.phase === 'opening' || state.phase === 'closing',
    filter: state.filter,
    retainedEventCount: state.events.length,
    matchingEventCount: matchingEvents.length,
    renderedEventCount: renderedEvents.length,
    producerDroppedEvents: state.producerDroppedEvents,
    frontendDroppedEvents: state.frontendDroppedEvents,
    rows: renderedEvents.map(rowFromEvent),
    snapshotText: snapshotForView ? JSON.stringify(snapshotForView, null, 2) : '',
    snapshotSummary: snapshotForView
      ? `Sequence ${snapshotForView.capturedSeq} · ${snapshotForView.runtimeVars.length}/${snapshotForView.runtimeVarsSummary.totalCount} variables · ${snapshotForView.timers.length}/${snapshotForView.timersSummary.totalCount} timers`
      : 'No snapshot captured',
    capacitySummary: `${state.events.length}/${ENGINE_DEBUG_CONSUMER_LIMITS.retainedEvents} retained · ${renderedEvents.length}/${ENGINE_DEBUG_CONSUMER_LIMITS.renderedRows} rendered`
  };
};
