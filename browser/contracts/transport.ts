import type { components } from './transport.openapi.generated';

type OpenApiFetchRequest = components['schemas']['FetchRequest'];

export type FetchRequest = Pick<OpenApiFetchRequest, 'url'> &
  Partial<Pick<OpenApiFetchRequest, 'method' | 'headers' | 'timeoutMs' | 'retries'>> & {
    // Desktop host transport extension used for correlation plumbing.
    requestId?: string;
  };

export type FetchResponse = components['schemas']['FetchResponse'];

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
}
