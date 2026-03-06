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

export interface HostHistoryEntry {
  url: string;
  requestedUrl?: string;
  method?: string;
  requestPolicy?: FetchRequestPolicy;
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
