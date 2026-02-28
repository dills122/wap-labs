export interface FetchRequest {
  url: string;
  method?: 'GET';
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: 0 | 1 | 2;
}

export interface FetchResponse {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType: string;
  wml?: string;
  raw?: {
    bytesBase64: string;
    contentType: string;
  };
  error?: {
    code:
      | 'INVALID_REQUEST'
      | 'GATEWAY_TIMEOUT'
      | 'RETRIES_EXHAUSTED'
      | 'UNSUPPORTED_CONTENT_TYPE'
      | 'WBXML_DECODE_FAILED'
      | 'PROTOCOL_ERROR'
      | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
  timingMs: {
    encode: number;
    udpRtt: number;
    decode: number;
  };
}
