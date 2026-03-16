import type {
  EngineDeckInputPayload,
  FetchRequestPolicy,
  FetchDeckResponse,
  FetchErrorInfo,
  FetchTiming
} from './generated/transport-host';

export type FetchResponse = FetchDeckResponse & { raw?: RawPayload };
export type TransportErrorInfo = FetchErrorInfo;
export type EngineDeckInput = EngineDeckInputPayload;
export type TimingMs = FetchTiming;
export type RunMode = 'local' | 'network';

export interface RawPayload {
  bytesBase64: string;
  contentType: string;
}

export type HostNavigationSource =
  | 'user'
  | 'external-intent'
  | 'history-back'
  | 'reload'
  | 'engine-back'
  | 'keyboard';

export interface HostHistoryRequestIdentity {
  requestedUrl?: string;
  method?: string;
  headers?: Record<string, string>;
  requestPolicy?: FetchRequestPolicy;
}

export interface HostHistoryEntry {
  url: string;
  requestedUrl?: HostHistoryRequestIdentity['requestedUrl'];
  method?: HostHistoryRequestIdentity['method'];
  headers?: HostHistoryRequestIdentity['headers'];
  requestPolicy?: HostHistoryRequestIdentity['requestPolicy'];
  activeCardId?: string;
  source?: HostNavigationSource;
}

export interface HostSessionState {
  runMode: RunMode;
  navigationStatus: 'idle' | 'loading' | 'loaded' | 'error';
  requestedUrl: string;
  finalUrl?: string;
  contentType?: string;
  activeCardId?: string;
  focusedLinkIndex?: number;
  externalNavigationIntent?: string;
  lastError?: string;
  navigationSource?: HostNavigationSource;
  historyIndex?: number;
  history?: HostHistoryEntry[];
}
