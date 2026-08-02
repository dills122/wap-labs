import {
  SCRIPT_ERROR_CATEGORY_LABELS,
  type EngineRuntimeSnapshot
} from '../../../contracts/engine';
import { APPLICATION_STATE_SENSITIVE_QUERY_KEYS } from '../../../contracts/application-state';
import type {
  FetchRequestPolicy,
  FetchResponse,
  HostHistoryEntry,
  HostNavigationSource,
  HostSessionState,
  RunMode
} from '../../../contracts/transport';

export const DIAGNOSTIC_REDACTION_POLICY = 'allowlist-v1' as const;

export const DIAGNOSTIC_PROJECTION_LIMITS = {
  urlLength: 2_048,
  requestIdLength: 128
} as const;

const REDACTED_QUERY_VALUE = '[redacted]';
const INVALID_URL = '[invalid-url]';

const SENSITIVE_QUERY_NAMES = new Set<string>(APPLICATION_STATE_SENSITIVE_QUERY_KEYS);

const RUN_MODES = new Set<RunMode>(['local', 'network']);
const NAVIGATION_STATUSES = new Set<HostSessionState['navigationStatus']>([
  'idle',
  'loading',
  'loaded',
  'error'
]);
const NAVIGATION_SOURCES = new Set<HostNavigationSource>([
  'user',
  'external-intent',
  'history-back',
  'reload',
  'engine-back',
  'keyboard'
]);
const SAFE_HOST_STATUS_MESSAGES = new Set([
  'Rendered current card.',
  'Snapshot refreshed.',
  'Cleared external navigation intent.',
  'Exported timeline JSON.',
  'Cleared event timeline.'
]);

export const projectHostStatus = (
  message: string,
  navigationStatus: HostSessionState['navigationStatus']
): string => {
  if (message.startsWith('Health:')) {
    return 'Health: completed.';
  }
  if (SAFE_HOST_STATUS_MESSAGES.has(message)) {
    return message;
  }
  return `Navigation: ${NAVIGATION_STATUSES.has(navigationStatus) ? navigationStatus : 'error'}`;
};

export interface DiagnosticHeaderMetadata {
  count: number;
  contentType?: string;
}

export interface DiagnosticPostMetadata {
  contentType?: string;
  payloadLength?: number;
  postFieldCount?: number;
  postFieldValueLength?: number;
}

export interface DiagnosticRequestPolicy {
  destinationPolicy?: FetchRequestPolicy['destinationPolicy'];
  cacheControl?: FetchRequestPolicy['cacheControl'];
  refererUrl?: string;
  uaCapabilityProfile?: FetchRequestPolicy['uaCapabilityProfile'];
  method?: string;
  enctype?: string;
  sendReferer?: boolean;
  hasAcceptCharset?: boolean;
  sameDeck?: boolean;
  post?: DiagnosticPostMetadata;
}

export interface DiagnosticHistoryEntry {
  url: string;
  requestedUrl?: string;
  method?: string;
  headers?: DiagnosticHeaderMetadata;
  requestPolicy?: DiagnosticRequestPolicy;
  source?: HostNavigationSource;
  hasActiveCard: boolean;
}

export interface DiagnosticSessionState {
  runMode: RunMode;
  navigationStatus: HostSessionState['navigationStatus'];
  requestedUrl: string;
  finalUrl?: string;
  contentType?: string;
  hasActiveCard: boolean;
  focusedLinkIndex?: number;
  externalNavigationIntent?: string;
  hasError: boolean;
  navigationSource?: HostNavigationSource;
  historyIndex?: number;
  historyLength: number;
  currentHistoryEntry?: DiagnosticHistoryEntry;
}

export interface DiagnosticTransportResponse {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType?: string;
  timingMs: {
    encode: number;
    udpRtt: number;
    decode: number;
  };
  error?: {
    code: NonNullable<FetchResponse['error']>['code'];
  };
  body?: {
    decodedWmlLength?: number;
    rawBase64Length?: number;
  };
}

export interface DiagnosticRuntimeSnapshot {
  hasActiveCard: boolean;
  focusedLinkIndex: number;
  nextTimerWakeupMs?: number;
  editingInput: boolean;
  editingSelect: boolean;
  baseUrl: string;
  contentType?: string;
  browserContextEpoch?: number;
  historyPushSequence?: number;
  lastBackNavigationHandled: boolean;
  externalNavigationIntent?: string;
  externalNavigationRequestPolicy?: DiagnosticRequestPolicy;
  lastScriptExecutionOk?: boolean;
  lastScriptExecutionErrorCategory?: string;
  lastScriptRequiresRefresh?: boolean;
  scriptDialogRequestCount: number;
  scriptTimerRequestCount: number;
}

const bounded = (value: string, limit: number): string =>
  value.length <= limit ? value : `${value.slice(0, Math.max(0, limit - 1))}…`;

const isSensitiveQueryToken = (value: string): boolean => {
  if (SENSITIVE_QUERY_NAMES.has(value)) {
    return true;
  }
  for (const sensitiveName of SENSITIVE_QUERY_NAMES) {
    if (value.endsWith(`_${sensitiveName}`) || value.endsWith(`-${sensitiveName}`)) {
      return true;
    }
  }
  return false;
};

const isSensitiveQueryName = (name: string): boolean => {
  const normalized = name.trim().toLowerCase();
  if (isSensitiveQueryToken(normalized)) return true;
  const bracketSegments = Array.from(normalized.matchAll(/\[([^\]]+)\]/g), (match) => match[1]);
  if (bracketSegments.length > 0) {
    return isSensitiveQueryToken(bracketSegments.at(-1) ?? '');
  }
  const dotSegments = normalized.split('.');
  return dotSegments.length > 1 && isSensitiveQueryToken(dotSegments.at(-1) ?? '');
};

export const projectDiagnosticUrl = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  try {
    const absolute = /^[A-Za-z][A-Za-z\d+.-]*:/.test(trimmed);
    const url = new URL(trimmed, 'http://waves.invalid');
    url.username = '';
    url.password = '';
    const redactedQuery = new URLSearchParams();
    for (const [name, queryValue] of url.searchParams) {
      redactedQuery.append(name, isSensitiveQueryName(name) ? REDACTED_QUERY_VALUE : queryValue);
    }
    url.search = redactedQuery.toString();
    const projected = absolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
    return bounded(projected, DIAGNOSTIC_PROJECTION_LIMITS.urlLength);
  } catch {
    return INVALID_URL;
  }
};

const projectContentType = (value: unknown): string | undefined => {
  const mediaType =
    typeof value === 'string' ? value.split(';', 1)[0]?.trim().toLowerCase() : undefined;
  return mediaType && /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mediaType)
    ? mediaType
    : undefined;
};

const projectMethod = (value: string | undefined): string | undefined => {
  const method = value?.trim().toUpperCase();
  return method && /^[A-Z]{1,16}$/.test(method) ? method : undefined;
};

const projectHeaders = (
  headers: Record<string, unknown> | undefined
): DiagnosticHeaderMetadata | undefined => {
  if (!headers) {
    return undefined;
  }
  const contentType = Object.entries(headers).find(
    ([name]) => name.trim().toLowerCase() === 'content-type'
  )?.[1];
  return {
    count: Object.keys(headers).length,
    ...(projectContentType(contentType) ? { contentType: projectContentType(contentType) } : {})
  };
};

export const projectRequestPolicy = (
  policy: FetchRequestPolicy | undefined
): DiagnosticRequestPolicy | undefined => {
  if (!policy) {
    return undefined;
  }
  const postContext = policy.postContext;
  const requestIntent = policy.requestIntent;
  const post: DiagnosticPostMetadata = {
    ...(projectContentType(postContext?.contentType ?? requestIntent?.sourceContentType)
      ? {
          contentType: projectContentType(
            postContext?.contentType ?? requestIntent?.sourceContentType
          )
        }
      : {}),
    ...(postContext?.payload !== undefined ? { payloadLength: postContext.payload.length } : {}),
    ...(requestIntent
      ? {
          postFieldCount: requestIntent.postFields.length,
          postFieldValueLength: requestIntent.postFields.reduce(
            (total, field) => total + field.value.length,
            0
          )
        }
      : {})
  };
  return {
    ...(policy.destinationPolicy ? { destinationPolicy: policy.destinationPolicy } : {}),
    ...(policy.cacheControl ? { cacheControl: policy.cacheControl } : {}),
    ...(policy.refererUrl ? { refererUrl: projectDiagnosticUrl(policy.refererUrl) } : {}),
    ...(policy.uaCapabilityProfile ? { uaCapabilityProfile: policy.uaCapabilityProfile } : {}),
    ...(requestIntent?.method ? { method: projectMethod(requestIntent.method) } : {}),
    ...(projectContentType(requestIntent?.enctype)
      ? { enctype: projectContentType(requestIntent?.enctype) }
      : {}),
    ...(requestIntent ? { sendReferer: requestIntent.sendReferer } : {}),
    ...(requestIntent ? { hasAcceptCharset: Boolean(requestIntent.acceptCharset) } : {}),
    ...(requestIntent?.sameDeck !== undefined
      ? { sameDeck: requestIntent.sameDeck }
      : postContext?.sameDeck !== undefined
        ? { sameDeck: postContext.sameDeck }
        : {}),
    ...(Object.keys(post).length > 0 ? { post } : {})
  };
};

const projectHistoryEntry = (entry: HostHistoryEntry): DiagnosticHistoryEntry => ({
  url: projectDiagnosticUrl(entry.url) ?? '',
  ...(entry.requestedUrl ? { requestedUrl: projectDiagnosticUrl(entry.requestedUrl) } : {}),
  ...(projectMethod(entry.method) ? { method: projectMethod(entry.method) } : {}),
  ...(projectHeaders(entry.headers) ? { headers: projectHeaders(entry.headers) } : {}),
  ...(projectRequestPolicy(entry.requestPolicy)
    ? { requestPolicy: projectRequestPolicy(entry.requestPolicy) }
    : {}),
  ...(entry.source && NAVIGATION_SOURCES.has(entry.source) ? { source: entry.source } : {}),
  hasActiveCard: Boolean(entry.activeCardId)
});

export const projectSessionState = (session: HostSessionState): DiagnosticSessionState => {
  const historyLength = session.history?.length ?? 0;
  const currentHistoryEntry =
    session.history && session.historyIndex !== undefined && session.historyIndex >= 0
      ? session.history[session.historyIndex]
      : undefined;
  return {
    runMode: RUN_MODES.has(session.runMode) ? session.runMode : 'local',
    navigationStatus: NAVIGATION_STATUSES.has(session.navigationStatus)
      ? session.navigationStatus
      : 'error',
    requestedUrl: projectDiagnosticUrl(session.requestedUrl) ?? '',
    ...(session.finalUrl ? { finalUrl: projectDiagnosticUrl(session.finalUrl) } : {}),
    ...(projectContentType(session.contentType)
      ? { contentType: projectContentType(session.contentType) }
      : {}),
    hasActiveCard: Boolean(session.activeCardId),
    ...(Number.isSafeInteger(session.focusedLinkIndex)
      ? { focusedLinkIndex: session.focusedLinkIndex }
      : {}),
    ...(session.externalNavigationIntent
      ? { externalNavigationIntent: projectDiagnosticUrl(session.externalNavigationIntent) }
      : {}),
    hasError: Boolean(session.lastError),
    ...(session.navigationSource && NAVIGATION_SOURCES.has(session.navigationSource)
      ? { navigationSource: session.navigationSource }
      : {}),
    ...(Number.isSafeInteger(session.historyIndex) ? { historyIndex: session.historyIndex } : {}),
    historyLength,
    ...(currentHistoryEntry
      ? { currentHistoryEntry: projectHistoryEntry(currentHistoryEntry) }
      : {})
  };
};

export const projectTransportResponse = (
  response: FetchResponse | null
): DiagnosticTransportResponse | null => {
  if (!response) {
    return null;
  }
  const decodedWmlLength = response.wml?.length ?? response.engineDeckInput?.wmlXml.length;
  const rawBase64Length =
    response.raw?.bytesBase64.length ?? response.engineDeckInput?.rawBytesBase64?.length;
  return {
    ok: response.ok,
    status: response.status,
    finalUrl: projectDiagnosticUrl(response.finalUrl) ?? '',
    ...(projectContentType(response.contentType)
      ? { contentType: projectContentType(response.contentType) }
      : {}),
    timingMs: { ...response.timingMs },
    ...(response.error ? { error: { code: response.error.code } } : {}),
    ...(decodedWmlLength !== undefined || rawBase64Length !== undefined
      ? {
          body: {
            ...(decodedWmlLength !== undefined ? { decodedWmlLength } : {}),
            ...(rawBase64Length !== undefined ? { rawBase64Length } : {})
          }
        }
      : {})
  };
};

export const projectRuntimeSnapshot = (
  snapshot: EngineRuntimeSnapshot | null
): DiagnosticRuntimeSnapshot | null => {
  if (!snapshot) {
    return null;
  }
  return {
    hasActiveCard: Boolean(snapshot.activeCardId),
    focusedLinkIndex: snapshot.focusedLinkIndex,
    ...(snapshot.nextTimerWakeupMs !== undefined
      ? { nextTimerWakeupMs: snapshot.nextTimerWakeupMs }
      : {}),
    editingInput: Boolean(snapshot.focusedInputEditName),
    editingSelect: Boolean(snapshot.focusedSelectEditName),
    baseUrl: projectDiagnosticUrl(snapshot.baseUrl) ?? '',
    ...(projectContentType(snapshot.contentType)
      ? { contentType: projectContentType(snapshot.contentType) }
      : {}),
    ...(snapshot.browserContextEpoch !== undefined
      ? { browserContextEpoch: snapshot.browserContextEpoch }
      : {}),
    ...(snapshot.historyPushSequence !== undefined
      ? { historyPushSequence: snapshot.historyPushSequence }
      : {}),
    lastBackNavigationHandled: snapshot.lastBackNavigationHandled,
    ...(snapshot.externalNavigationIntent
      ? { externalNavigationIntent: projectDiagnosticUrl(snapshot.externalNavigationIntent) }
      : {}),
    ...(snapshot.externalNavigationRequestPolicy
      ? {
          externalNavigationRequestPolicy: projectRequestPolicy(
            snapshot.externalNavigationRequestPolicy
          )
        }
      : {}),
    ...(snapshot.lastScriptExecutionOk !== undefined
      ? { lastScriptExecutionOk: snapshot.lastScriptExecutionOk }
      : {}),
    ...(snapshot.lastScriptExecutionErrorCategory &&
    snapshot.lastScriptExecutionErrorCategory in SCRIPT_ERROR_CATEGORY_LABELS
      ? {
          lastScriptExecutionErrorCategory: snapshot.lastScriptExecutionErrorCategory
        }
      : {}),
    ...(snapshot.lastScriptRequiresRefresh !== undefined
      ? { lastScriptRequiresRefresh: snapshot.lastScriptRequiresRefresh }
      : {}),
    scriptDialogRequestCount: snapshot.lastScriptDialogRequests.length,
    scriptTimerRequestCount: snapshot.lastScriptTimerRequests.length
  };
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const safeNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isSafeInteger(value) ? value : undefined;

const safeBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const addNumber = (target: Record<string, unknown>, key: string, value: unknown): void => {
  const projected = safeNumber(value);
  if (projected !== undefined) target[key] = projected;
};

const addBoolean = (target: Record<string, unknown>, key: string, value: unknown): void => {
  const projected = safeBoolean(value);
  if (projected !== undefined) target[key] = projected;
};

const addUrl = (target: Record<string, unknown>, key: string, value: unknown): void => {
  if (typeof value === 'string') target[key] = projectDiagnosticUrl(value);
};

const projectSessionPatch = (patch: Record<string, unknown>): Record<string, unknown> => {
  const projected: Record<string, unknown> = {};
  if (typeof patch.runMode === 'string' && RUN_MODES.has(patch.runMode as RunMode)) {
    projected.runMode = patch.runMode;
  }
  if (
    typeof patch.navigationStatus === 'string' &&
    NAVIGATION_STATUSES.has(patch.navigationStatus as HostSessionState['navigationStatus'])
  ) {
    projected.navigationStatus = patch.navigationStatus;
  }
  addUrl(projected, 'requestedUrl', patch.requestedUrl);
  addUrl(projected, 'finalUrl', patch.finalUrl);
  if (typeof patch.contentType === 'string') {
    const contentType = projectContentType(patch.contentType);
    if (contentType) projected.contentType = contentType;
  }
  if ('activeCardId' in patch) projected.hasActiveCard = Boolean(patch.activeCardId);
  addNumber(projected, 'focusedLinkIndex', patch.focusedLinkIndex);
  addUrl(projected, 'externalNavigationIntent', patch.externalNavigationIntent);
  if ('lastError' in patch) projected.hasError = Boolean(patch.lastError);
  if (
    typeof patch.navigationSource === 'string' &&
    NAVIGATION_SOURCES.has(patch.navigationSource as HostNavigationSource)
  ) {
    projected.navigationSource = patch.navigationSource;
  }
  addNumber(projected, 'historyIndex', patch.historyIndex);
  if (Array.isArray(patch.history)) projected.historyLength = patch.history.length;
  return projected;
};

export const projectTimelineDetails = (
  action: string,
  details: Record<string, unknown> | undefined
): Record<string, unknown> | undefined => {
  if (!details) return undefined;
  const projected: Record<string, unknown> = {};

  switch (action) {
    case 'session-state': {
      const patch = asRecord(details.patch);
      if (patch) projected.patch = projectSessionPatch(patch);
      break;
    }
    case 'startup-network-probe':
      addNumber(projected, 'attempt', details.attempt);
      addUrl(projected, 'targetUrl', details.targetUrl);
      break;
    case 'external-intent-quarantined':
      addNumber(projected, 'generation', details.generation);
      addUrl(projected, 'requestedUrl', details.requestedUrl);
      projected.method = projectMethod(
        typeof details.method === 'string' ? details.method : undefined
      );
      break;
    case 'load-transport-url': {
      if (
        typeof details.source === 'string' &&
        NAVIGATION_SOURCES.has(details.source as HostNavigationSource)
      ) {
        projected.source = details.source;
      }
      addUrl(projected, 'requestedUrl', details.requestedUrl);
      projected.method = projectMethod(
        typeof details.method === 'string' ? details.method : undefined
      );
      addBoolean(projected, 'followExternalIntent', details.followExternalIntent);
      addBoolean(projected, 'pushHistory', details.pushHistory);
      const headers = asRecord(details.headers);
      if (headers) projected.headers = projectHeaders(headers);
      const policy = asRecord(details.requestPolicy) as FetchRequestPolicy | undefined;
      if (policy) projected.requestPolicy = projectRequestPolicy(policy);
      break;
    }
    case 'fetch-deck-response':
      addBoolean(projected, 'ok', details.ok);
      addNumber(projected, 'status', details.status);
      addUrl(projected, 'finalUrl', details.finalUrl);
      if (typeof details.contentType === 'string') {
        const contentType = projectContentType(details.contentType);
        if (contentType) projected.contentType = contentType;
      }
      break;
    case 'browser-context-reset':
      addNumber(projected, 'browserContextEpoch', details.browserContextEpoch);
      break;
    case 'engine-load-deck-context':
      projected.hasActiveCard = Boolean(details.activeCardId);
      addNumber(projected, 'focusedLinkIndex', details.focusedLinkIndex);
      addUrl(projected, 'externalNavigationIntent', details.externalNavigationIntent);
      break;
    case 'navigation-coalesced':
      addUrl(projected, 'requestedUrl', details.requestedUrl);
      if (typeof details.requestId === 'string') {
        projected.requestId = bounded(
          details.requestId,
          DIAGNOSTIC_PROJECTION_LIMITS.requestIdLength
        );
      }
      break;
    case 'host-history-back':
      addNumber(projected, 'historyIndex', details.historyIndex);
      addUrl(projected, 'url', details.url);
      projected.hasRestoredCard = Boolean(details.restoredCardId);
      break;
    case 'boot-phase':
      if (
        ['booting', 'shell-ready', 'engine-ready', 'deck-ready'].includes(String(details.phase))
      ) {
        projected.phase = details.phase;
      }
      break;
    case 'keyboard-input-edit-state':
    case 'keyboard-select-edit-state':
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Backspace'].includes(String(details.key))) {
        projected.key = details.key;
      }
      addBoolean(projected, 'handled', details.handled);
      projected.hasFocusedControl = Boolean(
        details.focusedInputEditName ?? details.focusedSelectEditName
      );
      break;
    case 'script-timer-schedule':
      addNumber(projected, 'delayMs', details.delayMs);
      addNumber(projected, 'dueMs', details.dueMs);
      break;
    case 'script-timer-cancel':
      addNumber(projected, 'nowMs', details.nowMs);
      break;
    case 'script-timer-expire':
      addNumber(projected, 'dueMs', details.dueMs);
      break;
    case 'engine-timer-transition':
      projected.cardChanged = Boolean(details.from !== details.to);
      break;
    case 'cancel-fetch-failed':
    case 'engine-timer-tick':
      projected.error = true;
      break;
    default:
      break;
  }

  for (const key of Object.keys(projected)) {
    if (projected[key] === undefined) delete projected[key];
  }
  return Object.keys(projected).length > 0 ? projected : undefined;
};
