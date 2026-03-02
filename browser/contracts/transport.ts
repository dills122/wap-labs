export interface FetchRequest {
  url: string;
  method?: 'GET';
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  // Desktop host transport extension used for correlation plumbing.
  requestId?: string;
}

export interface RawPayload {
  bytesBase64: string;
  contentType: string;
}

export interface TimingMs {
  encode: number;
  udpRtt: number;
  decode: number;
}

export interface TransportErrorInfo {
  code:
    | 'INVALID_REQUEST'
    | 'GATEWAY_TIMEOUT'
    | 'UNSUPPORTED_CONTENT_TYPE'
    | 'WBXML_DECODE_FAILED'
    | 'PROTOCOL_ERROR'
    | 'TRANSPORT_UNAVAILABLE';
  message: string;
  details?: Record<string, unknown>;
}

export interface EngineDeckInput {
  wmlXml: string;
  baseUrl: string;
  contentType: string;
  rawBytesBase64?: string;
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
  activeCardId?: string;
  source?: HostNavigationSource;
}

export interface FetchResponse {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType: string;
  wml?: string;
  raw?: RawPayload;
  error?: TransportErrorInfo;
  timingMs: TimingMs;
  engineDeckInput?: EngineDeckInput;
}

// Contract for the desktop host's transport boundary.
export interface TransportClient {
  fetchDeck(request: FetchRequest): Promise<FetchResponse>;
}

export interface HostSessionState {
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
