import type {
  EngineDebugCapabilities,
  EngineDebugCollectionSummary,
  EngineDebugEvent,
  EngineDebugEventKind,
  EngineDebugEventPayload,
  EngineDebugRedactionReason,
  EngineDebugSnapshot,
  EngineDebugValue
} from '../../../contracts/engine';

export const ENGINE_DEBUG_CAPTURE_SCHEMA_VERSION = 1 as const;
export const ENGINE_DEBUG_CAPTURE_KIND = 'waves-engine-debug-capture' as const;

export const ENGINE_DEBUG_CONSUMER_LIMITS = {
  retainedEvents: 512,
  renderedRows: 200,
  filterQueryLength: 80,
  snapshotVariables: 128,
  snapshotTimers: 32,
  postfieldsPerEvent: 64,
  storedTextLength: 4_096,
  exportTextLength: 512,
  exportEvents: 256,
  exportBytes: 256 * 1_024
} as const;

export interface EngineDebugCaptureAccounting {
  producerDroppedEvents: number;
  frontendDroppedEvents: number;
  retainedEvents: number;
  oldestSeq?: string;
  latestSeq?: string;
}

export interface EngineDebugCaptureInput {
  capabilities?: EngineDebugCapabilities;
  events: readonly EngineDebugEvent[];
  snapshot?: EngineDebugSnapshot;
  accounting: EngineDebugCaptureAccounting;
}

export interface EngineDebugCaptureDocument {
  schemaVersion: typeof ENGINE_DEBUG_CAPTURE_SCHEMA_VERSION;
  kind: typeof ENGINE_DEBUG_CAPTURE_KIND;
  protocolVersion: number;
  limits: {
    retainedEvents: number;
    renderedRows: number;
    snapshotVariables: number;
    snapshotTimers: number;
    exportBytes: number;
  };
  capabilities?: EngineDebugCapabilities;
  accounting: EngineDebugCaptureAccounting & {
    exportedEvents: number;
    exportTruncated: boolean;
  };
  snapshot?: EngineDebugSnapshot;
  events: EngineDebugEvent[];
}

export interface SerializedEngineDebugCapture {
  document: EngineDebugCaptureDocument;
  json: string;
  byteLength: number;
}

const REDACTION_REASONS = new Set<EngineDebugRedactionReason>([
  'password-input',
  'sensitive-name',
  'credential-bearing-url',
  'transport-secret',
  'policy',
  'bounded-output'
] satisfies EngineDebugRedactionReason[]);

const boundedText = (
  value: unknown,
  limit: number = ENGINE_DEBUG_CONSUMER_LIMITS.storedTextLength
): string => String(value ?? '').slice(0, limit);

const boundedCount = (value: unknown): number => {
  const count = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0;
  return Math.max(0, count);
};

const boundedDecimal = (value: unknown): string => {
  const candidate = String(value ?? '');
  return /^\d{1,40}$/.test(candidate) ? candidate : '0';
};

const projectRedactionReason = (value: EngineDebugRedactionReason): EngineDebugRedactionReason =>
  REDACTION_REASONS.has(value) ? value : 'policy';

export const projectEngineDebugValue = (
  value: EngineDebugValue,
  textLimit: number = ENGINE_DEBUG_CONSUMER_LIMITS.storedTextLength
): EngineDebugValue => {
  if (value.state === 'visible') {
    return { state: 'visible', value: boundedText(value.value, textLimit) };
  }
  if (value.state === 'masked') {
    return { state: 'masked', reason: projectRedactionReason(value.reason) };
  }
  return { state: 'omitted', reason: projectRedactionReason(value.reason) };
};

const projectCollectionSummary = (
  summary: EngineDebugCollectionSummary,
  returnedCount: number
): EngineDebugCollectionSummary => ({
  totalCount: boundedCount(summary.totalCount),
  returnedCount,
  truncated: Boolean(summary.truncated) || boundedCount(summary.totalCount) > returnedCount
});

const projectPayload = (
  payload: EngineDebugEventPayload,
  textLimit: number = ENGINE_DEBUG_CONSUMER_LIMITS.storedTextLength
): { kind: EngineDebugEventKind; payload: EngineDebugEventPayload } => {
  switch (payload.type) {
    case 'deck-load':
      return {
        kind: 'deck.load',
        payload: {
          type: 'deck-load',
          baseUrl: projectEngineDebugValue(payload.baseUrl, textLimit),
          contentType: boundedText(payload.contentType, textLimit),
          cardCount: boundedCount(payload.cardCount)
        }
      };
    case 'card-enter':
      return { kind: 'card.enter', payload: { type: 'card-enter' } };
    case 'card-exit':
      return { kind: 'card.exit', payload: { type: 'card-exit' } };
    case 'focus-change':
      return {
        kind: 'focus.change',
        payload: {
          type: 'focus-change',
          ...(payload.previousIndex === undefined
            ? {}
            : { previousIndex: boundedCount(payload.previousIndex) }),
          ...(payload.currentIndex === undefined
            ? {}
            : { currentIndex: boundedCount(payload.currentIndex) })
        }
      };
    case 'input-edit-start':
      return {
        kind: 'input.edit.start',
        payload: { type: 'input-edit-start', name: boundedText(payload.name, textLimit) }
      };
    case 'input-edit-draft':
      return {
        kind: 'input.edit.draft',
        payload: {
          type: 'input-edit-draft',
          name: boundedText(payload.name, textLimit),
          value: projectEngineDebugValue(payload.value, textLimit)
        }
      };
    case 'input-edit-commit':
      return {
        kind: 'input.edit.commit',
        payload: {
          type: 'input-edit-commit',
          name: boundedText(payload.name, textLimit),
          value: projectEngineDebugValue(payload.value, textLimit)
        }
      };
    case 'input-edit-cancel':
      return {
        kind: 'input.edit.cancel',
        payload: { type: 'input-edit-cancel', name: boundedText(payload.name, textLimit) }
      };
    case 'action-accept':
      return {
        kind: 'action.accept',
        payload: {
          type: 'action-accept',
          actionType: boundedText(payload.actionType, textLimit),
          ...(payload.name === undefined ? {} : { name: boundedText(payload.name, textLimit) })
        }
      };
    case 'action-external':
      return {
        kind: 'action.external',
        payload: {
          type: 'action-external',
          target: projectEngineDebugValue(payload.target, textLimit)
        }
      };
    case 'navigation-intent':
      return {
        kind: 'nav.intent',
        payload: {
          type: 'navigation-intent',
          target: projectEngineDebugValue(payload.target, textLimit)
        }
      };
    case 'postfield-resolve':
      return {
        kind: 'postfield.resolve',
        payload: {
          type: 'postfield-resolve',
          fields: payload.fields
            .slice(0, ENGINE_DEBUG_CONSUMER_LIMITS.postfieldsPerEvent)
            .map((field) => ({
              name: boundedText(field.name, textLimit),
              value: projectEngineDebugValue(field.value, textLimit),
              source: field.source
            }))
        }
      };
    case 'script-invoke':
      return {
        kind: 'script.invoke',
        payload: {
          type: 'script-invoke',
          source: projectEngineDebugValue(payload.source, textLimit),
          functionName: boundedText(payload.functionName, textLimit)
        }
      };
    case 'script-trap':
      return {
        kind: 'script.trap',
        payload: {
          type: 'script-trap',
          source: projectEngineDebugValue(payload.source, textLimit),
          functionName: boundedText(payload.functionName, textLimit),
          detail: projectEngineDebugValue(payload.detail, textLimit)
        }
      };
    case 'timer-schedule':
      return {
        kind: 'timer.schedule',
        payload: {
          type: 'timer-schedule',
          delayMs: boundedCount(payload.delayMs),
          token: projectEngineDebugValue(payload.token, textLimit)
        }
      };
    case 'timer-fire':
      return {
        kind: 'timer.fire',
        payload: {
          type: 'timer-fire',
          token: projectEngineDebugValue(payload.token, textLimit)
        }
      };
    case 'timer-cancel':
      return {
        kind: 'timer.cancel',
        payload: {
          type: 'timer-cancel',
          token: projectEngineDebugValue(payload.token, textLimit)
        }
      };
  }
};

export const projectEngineDebugEvent = (
  event: EngineDebugEvent,
  textLimit: number = ENGINE_DEBUG_CONSUMER_LIMITS.storedTextLength
): EngineDebugEvent => {
  const projected = projectPayload(event.payload, textLimit);
  return {
    seq: boundedDecimal(event.seq),
    kind: projected.kind,
    monotonicTimeMs: boundedCount(event.monotonicTimeMs),
    ...(event.cardId === undefined ? {} : { cardId: boundedText(event.cardId, textLimit) }),
    payload: projected.payload
  };
};

export const projectEngineDebugSnapshot = (
  snapshot: EngineDebugSnapshot,
  options: {
    textLimit?: number;
    variableLimit?: number;
    timerLimit?: number;
  } = {}
): EngineDebugSnapshot => {
  const textLimit = options.textLimit ?? ENGINE_DEBUG_CONSUMER_LIMITS.storedTextLength;
  const variableLimit = options.variableLimit ?? ENGINE_DEBUG_CONSUMER_LIMITS.snapshotVariables;
  const timerLimit = options.timerLimit ?? ENGINE_DEBUG_CONSUMER_LIMITS.snapshotTimers;
  const runtimeVars = snapshot.runtimeVars.slice(0, variableLimit).map((entry) => ({
    name: boundedText(entry.name, textLimit),
    value: projectEngineDebugValue(entry.value, textLimit)
  }));
  const timers = snapshot.timers.slice(0, timerLimit).map((timer) => ({
    remainingMs: boundedCount(timer.remainingMs),
    token: projectEngineDebugValue(timer.token, textLimit)
  }));
  return {
    protocolVersion: boundedCount(snapshot.protocolVersion),
    capturedSeq: boundedDecimal(snapshot.capturedSeq),
    ...(snapshot.activeCardId === undefined
      ? {}
      : { activeCardId: boundedText(snapshot.activeCardId, textLimit) }),
    focusedLinkIndex: boundedCount(snapshot.focusedLinkIndex),
    ...(snapshot.focusedInputEdit === undefined
      ? {}
      : {
          focusedInputEdit: {
            name: boundedText(snapshot.focusedInputEdit.name, textLimit),
            value: projectEngineDebugValue(snapshot.focusedInputEdit.value, textLimit)
          }
        }),
    runtimeVars,
    runtimeVarsSummary: projectCollectionSummary(snapshot.runtimeVarsSummary, runtimeVars.length),
    ...(snapshot.pendingExternalNavigation === undefined
      ? {}
      : {
          pendingExternalNavigation: {
            target: projectEngineDebugValue(snapshot.pendingExternalNavigation.target, textLimit),
            ...(snapshot.pendingExternalNavigation.method === undefined
              ? {}
              : { method: boundedText(snapshot.pendingExternalNavigation.method, textLimit) }),
            ...(snapshot.pendingExternalNavigation.refererUrl === undefined
              ? {}
              : {
                  refererUrl: projectEngineDebugValue(
                    snapshot.pendingExternalNavigation.refererUrl,
                    textLimit
                  )
                }),
            ...(snapshot.pendingExternalNavigation.postBody === undefined
              ? {}
              : {
                  postBody: projectEngineDebugValue(
                    snapshot.pendingExternalNavigation.postBody,
                    textLimit
                  )
                })
          }
        }),
    timers,
    timersSummary: projectCollectionSummary(snapshot.timersSummary, timers.length),
    buffer: {
      ...(snapshot.buffer.oldestSeq === undefined
        ? {}
        : { oldestSeq: boundedDecimal(snapshot.buffer.oldestSeq) }),
      ...(snapshot.buffer.latestSeq === undefined
        ? {}
        : { latestSeq: boundedDecimal(snapshot.buffer.latestSeq) }),
      droppedCount: boundedCount(snapshot.buffer.droppedCount),
      capacity: boundedCount(snapshot.buffer.capacity)
    },
    viewportCols: boundedCount(snapshot.viewportCols),
    baseUrl: projectEngineDebugValue(snapshot.baseUrl, textLimit),
    contentType: boundedText(snapshot.contentType, textLimit)
  };
};

export const projectEngineDebugCapabilities = (
  capabilities: EngineDebugCapabilities
): EngineDebugCapabilities => ({
  protocolVersion: boundedCount(capabilities.protocolVersion),
  supportsPolling: Boolean(capabilities.supportsPolling),
  supportsSnapshots: Boolean(capabilities.supportsSnapshots),
  supportsSensitiveUnmasking: false,
  maskingPolicy: 'required',
  timestampKind: 'monotonic',
  sessionLimit: boundedCount(capabilities.sessionLimit),
  eventBufferCapacity: boundedCount(capabilities.eventBufferCapacity),
  defaultMaxEventsPerPoll: boundedCount(capabilities.defaultMaxEventsPerPoll),
  maxEventsPerPoll: boundedCount(capabilities.maxEventsPerPoll),
  maxSnapshotVariables: boundedCount(capabilities.maxSnapshotVariables),
  maxSnapshotTimers: boundedCount(capabilities.maxSnapshotTimers),
  maxTextBytes: boundedCount(capabilities.maxTextBytes)
});

const projectAccounting = (
  accounting: EngineDebugCaptureAccounting,
  retainedEvents: number
): EngineDebugCaptureAccounting => ({
  producerDroppedEvents: boundedCount(accounting.producerDroppedEvents),
  frontendDroppedEvents: boundedCount(accounting.frontendDroppedEvents),
  retainedEvents,
  ...(accounting.oldestSeq === undefined
    ? {}
    : { oldestSeq: boundedDecimal(accounting.oldestSeq) }),
  ...(accounting.latestSeq === undefined ? {} : { latestSeq: boundedDecimal(accounting.latestSeq) })
});

const encodeCapture = (
  input: EngineDebugCaptureInput,
  events: EngineDebugEvent[]
): EngineDebugCaptureDocument => {
  const snapshot = input.snapshot
    ? projectEngineDebugSnapshot(input.snapshot, {
        textLimit: ENGINE_DEBUG_CONSUMER_LIMITS.exportTextLength,
        variableLimit: 64,
        timerLimit: ENGINE_DEBUG_CONSUMER_LIMITS.snapshotTimers
      })
    : undefined;
  const accounting = projectAccounting(input.accounting, input.events.length);
  return {
    schemaVersion: ENGINE_DEBUG_CAPTURE_SCHEMA_VERSION,
    kind: ENGINE_DEBUG_CAPTURE_KIND,
    protocolVersion: input.capabilities?.protocolVersion ?? snapshot?.protocolVersion ?? 1,
    limits: {
      retainedEvents: ENGINE_DEBUG_CONSUMER_LIMITS.retainedEvents,
      renderedRows: ENGINE_DEBUG_CONSUMER_LIMITS.renderedRows,
      snapshotVariables: ENGINE_DEBUG_CONSUMER_LIMITS.snapshotVariables,
      snapshotTimers: ENGINE_DEBUG_CONSUMER_LIMITS.snapshotTimers,
      exportBytes: ENGINE_DEBUG_CONSUMER_LIMITS.exportBytes
    },
    ...(input.capabilities
      ? { capabilities: projectEngineDebugCapabilities(input.capabilities) }
      : {}),
    accounting: {
      ...accounting,
      exportedEvents: events.length,
      exportTruncated: events.length < input.events.length
    },
    ...(snapshot ? { snapshot } : {}),
    events
  };
};

export const serializeEngineDebugCapture = (
  input: EngineDebugCaptureInput
): SerializedEngineDebugCapture => {
  const encoder = new TextEncoder();
  const candidates = input.events
    .slice(-ENGINE_DEBUG_CONSUMER_LIMITS.exportEvents)
    .map((event) => projectEngineDebugEvent(event, ENGINE_DEBUG_CONSUMER_LIMITS.exportTextLength));
  let events = candidates;
  let document = encodeCapture(input, events);
  let json = JSON.stringify(document, null, 2);

  while (encoder.encode(json).byteLength > ENGINE_DEBUG_CONSUMER_LIMITS.exportBytes) {
    if (events.length === 0) {
      throw new RangeError('Engine debug capture metadata exceeds the export byte limit.');
    }
    events = events.slice(1);
    document = encodeCapture(input, events);
    json = JSON.stringify(document, null, 2);
  }

  return { document, json, byteLength: encoder.encode(json).byteLength };
};
